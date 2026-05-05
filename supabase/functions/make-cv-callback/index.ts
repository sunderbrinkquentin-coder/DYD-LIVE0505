import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface MakeCallbackPayload {
  upload_id?: string;
  cv_id?: string;
  id?: string;
  status: string;
  source?: string;
  ats_json?: any;
  cv_data?: any;
  vision_text?: string;
  error_message?: string;
  file_url?: string;
  original_file_url?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    console.log("[make-cv-callback] Request received:", {
      method: req.method,
      url: req.url,
    });

    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const webhookSecret = Deno.env.get("MAKE_WEBHOOK_SECRET");
    let payload: MakeCallbackPayload;

    if (webhookSecret) {
      const signature = req.headers.get("x-webhook-signature");

      if (!signature) {
        console.error("[make-cv-callback] Missing webhook signature");
        return new Response(
          JSON.stringify({ error: "Unauthorized - Missing signature" }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      const body = await req.text();

      const encoder = new TextEncoder();
      const data = encoder.encode(body + webhookSecret);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const expectedSignature = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      if (signature !== expectedSignature) {
        console.error("[make-cv-callback] Invalid webhook signature");
        return new Response(
          JSON.stringify({ error: "Unauthorized - Invalid signature" }),
          {
            status: 401,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          }
        );
      }

      console.log("[make-cv-callback] Webhook signature verified");
      payload = JSON.parse(body);
    } else {
      console.warn("[make-cv-callback] MAKE_WEBHOOK_SECRET not configured - skipping signature verification");
      payload = await req.json();
    }

    const recordId = payload.upload_id || payload.cv_id || payload.id;

    console.log("[make-cv-callback] Payload received:", {
      recordId,
      upload_id: payload.upload_id,
      cv_id: payload.cv_id,
      id: payload.id,
      status: payload.status,
      source: payload.source,
      has_ats_json: !!payload.ats_json,
      has_cv_data: !!payload.cv_data,
      has_vision_text: !!payload.vision_text,
      ats_json_type: payload.ats_json ? typeof payload.ats_json : 'undefined',
      cv_data_type: payload.cv_data ? typeof payload.cv_data : 'undefined',
    });

    if (!recordId) {
      return new Response(
        JSON.stringify({ error: "Missing record ID (upload_id, cv_id, or id)" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Initialize Supabase client with SERVICE_ROLE_KEY (bypasses RLS)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[make-cv-callback] Missing environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    console.log("[make-cv-callback] Updating stored_cvs record for id:", recordId);

    // Build update payload - only set fields that Make sends back
    const updateData: any = {
      status: payload.status,
      updated_at: new Date().toISOString(),
    };

    // Preserve source from payload if provided (don't overwrite wizard->check)
    if (payload.source !== undefined) {
      updateData.source = payload.source;
    }

    // cv_data: the optimized CV result from Make
    if (payload.cv_data !== undefined) {
      updateData.cv_data = payload.cv_data;
    }

    // ats_json: ATS analysis result (used by CV-Check flow)
    if (payload.ats_json !== undefined) {
      updateData.ats_json = payload.ats_json;
    }

    if (payload.vision_text !== undefined) {
      updateData.vision_text = payload.vision_text;
    }

    if (payload.error_message !== undefined) {
      updateData.error_message = payload.error_message;
    }

    if (payload.file_url !== undefined) {
      updateData.file_url = payload.file_url;
      updateData.original_file_url = payload.file_url;
    }

    if (payload.original_file_url !== undefined) {
      updateData.original_file_url = payload.original_file_url;
    }

    if (payload.status === "completed") {
      updateData.processed_at = new Date().toISOString();
      console.log("[make-cv-callback] Setting processed_at timestamp:", updateData.processed_at);
    }

    // Update existing record by id (record was created by JobTargeting before Make was called)
    const { data, error } = await supabase
      .from("stored_cvs")
      .update(updateData)
      .eq("id", recordId)
      .select();

    if (error) {
      console.error("[make-cv-callback] Database update error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to update CV record",
          details: error.message,
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    console.log("[make-cv-callback] Successfully updated record:", {
      recordId,
      status: payload.status,
      rowsAffected: data?.length || 0,
      wrote_cv_data: !!updateData.cv_data,
      wrote_ats_json: !!updateData.ats_json,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "CV record updated successfully",
        upload_id: recordId,
        status: payload.status,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("[make-cv-callback] Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
