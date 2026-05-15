import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Payload sent by Make after generating the final exam questions
interface FinalExamCallbackPayload {
  learning_path_id: string;
  final_exam_questions: unknown; // array of question objects
  status?: string; // optional: "ready"
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload: FinalExamCallbackPayload = await req.json();
    console.log("[make-learning-path-callback] Received payload:", {
      learning_path_id: payload.learning_path_id,
      has_questions: !!payload.final_exam_questions,
      status: payload.status,
    });

    if (!payload.learning_path_id) {
      return new Response(
        JSON.stringify({ error: "Missing learning_path_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Parse questions — handle double-encoded JSON from Make
    let questions = payload.final_exam_questions;
    if (typeof questions === "string") {
      try {
        let s = (questions as string).trim();
        if (s.startsWith('"')) s = JSON.parse(s) as string;
        if (!s.startsWith("[")) s = `[${s}]`;
        questions = JSON.parse(s);
      } catch (e) {
        console.error("[make-learning-path-callback] Failed to parse questions:", e);
      }
    }

    const { error } = await supabase
      .from("learning_paths")
      .update({
        final_exam_questions: questions,
        final_exam_status: "ready",
        updated_at: new Date().toISOString(),
      })
      .eq("id", payload.learning_path_id);

    if (error) {
      console.error("[make-learning-path-callback] DB update error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[make-learning-path-callback] Updated learning_path:", payload.learning_path_id);
    return new Response(
      JSON.stringify({ success: true, learning_path_id: payload.learning_path_id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[make-learning-path-callback] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
