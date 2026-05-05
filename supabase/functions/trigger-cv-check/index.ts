import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

interface CVCheckPayload {
  upload_id: string;
  url?: string;
  file_url: string;
  file_url_fallback: string | null;
  file_name: string;
  file_path?: string | null;
  source: string;
  user_id: string | null;
  temp_id: string | null;
  callback_url: string;
  timestamp: string;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const MAKE_TIMEOUT_MS = 28_000;
const MAKE_RETRY_DELAY_MS = 4_000;

const WEBHOOK_ENV_KEYS = [
  "MAKE_WEBHOOK_CVCHECK",
  "MAKE_CV_CHECK_WEBHOOK_URL",
  "MAKE_CV_GENERATOR_WEBHOOK_URL",
  "VITE_MAKE_WEBHOOK_CVCHECK",
  "VITE_MAKE_WEBHOOK_URL",
];

function resolveMakeWebhookUrl(): string | null {
  for (const key of WEBHOOK_ENV_KEYS) {
    const val = Deno.env.get(key);
    if (val && val.trim() !== "" && !val.includes("placeholder")) {
      console.log(`[trigger-cv-check] Webhook URL resolved from env key: ${key} -> ${val.substring(0, 40)}...`);
      return val;
    }
  }
  console.error("[trigger-cv-check] No valid webhook URL found. Tried keys:", WEBHOOK_ENV_KEYS);
  return null;
}

async function markFailed(
  supabase: ReturnType<typeof createClient>,
  uploadId: string,
  message: string
) {
  try {
    const { error } = await supabase
      .from("stored_cvs")
      .update({
        status: "failed",
        error_message: message.substring(0, 1000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", uploadId);
    if (error) {
      console.error("[trigger-cv-check] Could not mark as failed:", error.message);
    } else {
      console.log(`[trigger-cv-check] Marked upload ${uploadId} as failed`);
    }
  } catch (e) {
    console.error("[trigger-cv-check] markFailed threw:", e);
  }
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
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
  const attemptLabel = `attempt ${attempt}`;
  try {
    console.log(`[trigger-cv-check] Make ${attemptLabel} starting, url: ${body.url}`);
    const response = await fetchWithTimeout(
      makeWebhookUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      MAKE_TIMEOUT_MS
    );
    const status = response.status;
    let responseBody: unknown = null;
    try {
      const text = await response.text();
      if (text.trim()) {
        try {
          responseBody = JSON.parse(text);
        } catch {
          responseBody = text;
        }
      }
    } catch {
      responseBody = null;
    }
    console.log(`[trigger-cv-check] Make ${attemptLabel}: status=${status}, ok=${response.ok}`);
    if (!response.ok) {
      console.warn(`[trigger-cv-check] Make ${attemptLabel} non-OK body:`, JSON.stringify(responseBody).substring(0, 300));
    }
    return { ok: response.ok, status, body: responseBody };
  } catch (err: unknown) {
    const e = err as Error;
    const isTimeout = e?.name === "AbortError" || String(err).includes("AbortError");
    const isNetworkError = String(err).includes("NetworkError") || String(err).includes("Failed to fetch");
    console.warn(
      `[trigger-cv-check] Make ${attemptLabel} failed:`,
      isTimeout ? "TIMEOUT" : isNetworkError ? "NETWORK_ERROR" : "ERROR",
      e?.message ?? String(err)
    );
    return {
      ok: false,
      status: isTimeout ? 408 : 0,
      body: isTimeout ? "timeout" : isNetworkError ? "network_error" : String(err),
    };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let uploadId = "";

  try {
    const payload: CVCheckPayload = await req.json();
    uploadId = payload.upload_id || "";

    console.log("[trigger-cv-check] ===== START =====");
    console.log("[trigger-cv-check] upload_id:", uploadId);
    console.log("[trigger-cv-check] file_name:", payload.file_name);
    console.log("[trigger-cv-check] source:", payload.source);
    console.log("[trigger-cv-check] user_id:", payload.user_id ?? "anon");
    console.log("[trigger-cv-check] temp_id:", payload.temp_id ?? "none");

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const makeWebhookUrl = resolveMakeWebhookUrl();

    if (!makeWebhookUrl) {
      const errMsg = "Server misconfiguration: no Make.com webhook URL found in environment";
      if (uploadId) await markFailed(supabase, uploadId, errMsg);
      return new Response(
        JSON.stringify({ error: errMsg, upload_id: uploadId }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use the client-provided URL first (public URL), then fallbacks
    let publicUrl = payload.url || payload.file_url_fallback || payload.file_url || "";

    // If no client URL, generate from file_path as last resort
    if (!publicUrl && payload.file_path) {
      const rawFilePath = payload.file_path.replace(/^\//, "");
      const { data: publicUrlData } = supabase.storage
        .from("cv-uploads")
        .getPublicUrl(rawFilePath);
      if (publicUrlData?.publicUrl) {
        publicUrl = publicUrlData.publicUrl;
        console.log("[trigger-cv-check] Generated public URL from file_path:", publicUrl.substring(0, 80) + "...");
      }
    } else if (publicUrl) {
      console.log("[trigger-cv-check] Using client-provided URL:", publicUrl.substring(0, 80) + "...");
    }

    if (!publicUrl) {
      const errMsg = "Cannot determine public URL for CV file";
      console.error("[trigger-cv-check]", errMsg);
      await markFailed(supabase, uploadId, errMsg);
      return new Response(
        JSON.stringify({ error: errMsg, upload_id: uploadId }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('Sende URL an Webhook:', publicUrl);

    const webhookBody: Record<string, unknown> = {
      url: publicUrl,
      file_url: publicUrl,
      userId: payload.user_id || null,
      upload_id: uploadId,
      file_name: payload.file_name,
      source: payload.source,
      temp_id: payload.temp_id || null,
      callback_url: payload.callback_url,
      timestamp: payload.timestamp,
    };

    console.log(`[trigger-cv-check] Forwarding to Make (attempt 1) for upload_id: ${uploadId}`);
    let result = await sendToMake(makeWebhookUrl, webhookBody, 1);

    if (!result.ok) {
      console.warn(
        `[trigger-cv-check] Attempt 1 failed (status=${result.status}), retrying in ${MAKE_RETRY_DELAY_MS}ms...`
      );
      await new Promise((resolve) => setTimeout(resolve, MAKE_RETRY_DELAY_MS));

      console.log(`[trigger-cv-check] Forwarding to Make (attempt 2) for upload_id: ${uploadId}`);
      result = await sendToMake(makeWebhookUrl, webhookBody, 2);
    }

    if (!result.ok) {
      const errMsg = `Make.com webhook failed after 2 attempts. Status: ${result.status}. Response: ${JSON.stringify(result.body).substring(0, 500)}`;
      console.error(`[trigger-cv-check] ${errMsg}`);
      await markFailed(supabase, uploadId, errMsg);
      return new Response(
        JSON.stringify({
          success: false,
          upload_id: uploadId,
          make_status: result.status,
          make_response: result.body,
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(
      `[trigger-cv-check] Make webhook success for upload_id: ${uploadId}, status: ${result.status}`
    );

    await supabase
      .from("stored_cvs")
      .update({ make_sent_at: new Date().toISOString() })
      .eq("id", uploadId);

    console.log("[trigger-cv-check] ===== SUCCESS =====");

    return new Response(
      JSON.stringify({ success: true, upload_id: uploadId, make_status: result.status }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const e = error as Error;
    console.error("[trigger-cv-check] Unhandled exception:", e?.message ?? String(error));

    if (uploadId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
      const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
      try {
        const supabase = createClient(supabaseUrl, serviceRoleKey);
        await markFailed(
          supabase,
          uploadId,
          `Unhandled exception: ${e?.message ?? String(error)}`
        );
      } catch (_) {}
    }

    return new Response(
      JSON.stringify({ error: e?.message ?? "Unknown error", upload_id: uploadId }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
