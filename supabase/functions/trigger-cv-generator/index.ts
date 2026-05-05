import "jsr:@supabase/functions-js/edge-runtime.d.ts";

interface CVGeneratorPayload {
  cv_id: string;
  session_id: string | null;
  user_id: string | null;
  callback_url: string;
  cv_draft: Record<string, any>;
  job_data: Record<string, any>;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, Authorization, Content-Type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    let payload: CVGeneratorPayload;

    try {
      payload = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!payload.cv_id || !payload.cv_draft) {
      return new Response(
        JSON.stringify({
          error: "Bad Request: cv_id and cv_draft are required",
          received_keys: Object.keys(payload || {}),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const makeWebhookUrl = Deno.env.get("MAKE_WEBHOOK_CVGENERATOR");
    if (!makeWebhookUrl) {
      console.error("[trigger-cv-generator] MAKE_WEBHOOK_CVGENERATOR not set in env");
      return new Response(
        JSON.stringify({
          error: "Server misconfiguration: webhook URL not set",
          cv_id: payload.cv_id,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`[trigger-cv-generator] Forwarding to Make for cv_id: ${payload.cv_id}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    let forwardResponse: Response;
    try {
      forwardResponse = await fetch(makeWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr?.name === "AbortError";
      console.error(`[trigger-cv-generator] Make fetch ${isTimeout ? "timed out" : "failed"}:`, fetchErr?.message);

      return new Response(
        JSON.stringify({
          success: false,
          cv_id: payload.cv_id,
          error: isTimeout
            ? "Make.com webhook timed out – processing continues in background"
            : `Make.com webhook unreachable: ${fetchErr?.message}`,
          make_status: isTimeout ? 202 : 503,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    clearTimeout(timeoutId);

    const forwardStatus = forwardResponse.status;
    let forwardBody: any = null;

    try {
      forwardBody = await forwardResponse.json();
    } catch {
      try {
        forwardBody = await forwardResponse.text();
      } catch {
        forwardBody = null;
      }
    }

    if (!forwardResponse.ok) {
      console.error(
        `[trigger-cv-generator] Make webhook error: ${forwardStatus}`,
        forwardBody
      );
    } else {
      console.log(
        `[trigger-cv-generator] Make webhook success for cv_id: ${payload.cv_id}`
      );
    }

    return new Response(
      JSON.stringify({
        success: forwardResponse.ok,
        cv_id: payload.cv_id,
        make_status: forwardStatus,
        make_response: forwardBody,
      }),
      {
        status: forwardResponse.ok ? 200 : forwardStatus,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[trigger-cv-generator] Unexpected error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
