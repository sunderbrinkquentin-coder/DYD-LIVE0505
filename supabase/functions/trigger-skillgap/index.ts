import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAKE_TIMEOUT_MS = 28_000;
const MAKE_RETRY_DELAY_MS = 4_000;

const WEBHOOK_ENV_KEYS = [
  "MAKE_WEBHOOK_SKILLGAP",
  "VITE_MAKE_WEBHOOK_SKILLGAP",
];

function resolveMakeWebhookUrl(): string | null {
  for (const key of WEBHOOK_ENV_KEYS) {
    const val = Deno.env.get(key);
    if (val && val.trim() !== "" && !val.includes("placeholder")) {
      console.log(`[trigger-skillgap] Webhook URL from env key: ${key}`);
      return val;
    }
  }
  console.error("[trigger-skillgap] No valid webhook URL found. Tried keys:", WEBHOOK_ENV_KEYS);
  return null;
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function sendToMake(
  makeWebhookUrl: string,
  body: Record<string, unknown>,
  attempt: number
): Promise<{ ok: boolean; status: number; body: unknown }> {
  try {
    console.log(`[trigger-skillgap] Make attempt ${attempt} starting`);
    const response = await fetchWithTimeout(
      makeWebhookUrl,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) },
      MAKE_TIMEOUT_MS
    );
    const status = response.status;
    let responseBody: unknown = null;
    try {
      const text = await response.text();
      if (text.trim()) { try { responseBody = JSON.parse(text); } catch { responseBody = text; } }
    } catch { /* ignore */ }
    console.log(`[trigger-skillgap] Make attempt ${attempt}: status=${status}`);
    return { ok: response.ok, status, body: responseBody };
  } catch (err: unknown) {
    const e = err as Error;
    const isTimeout = e?.name === "AbortError";
    console.warn(`[trigger-skillgap] Make attempt ${attempt} failed:`, isTimeout ? "TIMEOUT" : e?.message ?? String(err));
    return { ok: false, status: isTimeout ? 408 : 0, body: isTimeout ? "timeout" : String(err) };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { path_id } = await req.json() as { path_id: string };
    if (!path_id) {
      return new Response(JSON.stringify({ error: "Missing path_id" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[trigger-skillgap] path_id:", path_id);

    const { data: lp, error: lpErr } = await supabase
      .from("learning_paths")
      .select("id, user_id, session_id, target_job, target_company, vision_description, industry, cv_id, skillgap_paid, triggered_at")
      .eq("id", path_id)
      .single();

    if (lpErr || !lp) {
      console.error("[trigger-skillgap] LP fetch error:", lpErr?.message);
      return new Response(JSON.stringify({ error: "Learning path not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!lp.skillgap_paid) {
      return new Response(JSON.stringify({ error: "Skillgap analysis not paid" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch CV text if a cv_id is attached
    let cvData: string | null = null;
    if (lp.cv_id) {
      const { data: cv } = await supabase
        .from("stored_cvs")
        .select("cv_data, extracted_text")
        .eq("id", lp.cv_id)
        .maybeSingle();
      if (cv) {
        cvData = (cv.extracted_text as string | null) ?? (cv.cv_data as string | null) ?? null;
      }
    }

    const makeWebhookUrl = resolveMakeWebhookUrl();
    if (!makeWebhookUrl) {
      await supabase.from("learning_paths").update({ status: "failed" }).eq("id", path_id);
      return new Response(JSON.stringify({ error: "Server misconfiguration: no webhook URL" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callbackUrl = `${supabaseUrl}/functions/v1/make-skillgap-callback`;

    const webhookBody: Record<string, unknown> = {
      learning_path_id: lp.id,
      user_id: lp.user_id ?? null,
      session_id: lp.session_id ?? null,
      target_job: lp.target_job ?? null,
      target_company: lp.target_company ?? null,
      vision_description: lp.vision_description ?? null,
      industry: lp.industry ?? null,
      cv_data: cvData,
      callback_url: callbackUrl,
      timestamp: new Date().toISOString(),
    };

    let result = await sendToMake(makeWebhookUrl, webhookBody, 1);

    if (!result.ok) {
      console.warn(`[trigger-skillgap] Attempt 1 failed, retrying in ${MAKE_RETRY_DELAY_MS}ms...`);
      await new Promise((r) => setTimeout(r, MAKE_RETRY_DELAY_MS));
      result = await sendToMake(makeWebhookUrl, webhookBody, 2);
    }

    if (!result.ok) {
      const errMsg = `Make webhook failed after 2 attempts. Status: ${result.status}`;
      console.error(`[trigger-skillgap] ${errMsg}`);
      await supabase.from("learning_paths").update({ status: "failed" }).eq("id", path_id);
      return new Response(JSON.stringify({ success: false, error: errMsg }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase
      .from("learning_paths")
      .update({ triggered_at: new Date().toISOString(), status: "analyzing" })
      .eq("id", path_id);

    console.log("[trigger-skillgap] Success for path_id:", path_id);
    return new Response(JSON.stringify({ success: true, path_id }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const e = error as Error;
    console.error("[trigger-skillgap] Unhandled exception:", e?.message ?? String(error));
    return new Response(JSON.stringify({ error: e?.message ?? "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
