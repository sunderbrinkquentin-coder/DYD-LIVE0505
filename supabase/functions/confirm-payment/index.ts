import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing required environment variables");
    }

    const { session_id, cv_id } = await req.json();

    if (!session_id || !cv_id) {
      return new Response(
        JSON.stringify({ error: "Missing session_id or cv_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
    const session = await stripe.checkout.sessions.retrieve(session_id);

    console.log("[ConfirmPayment] Session:", session_id, "| status:", session.payment_status, "| cv_id:", cv_id);

    const isFullyCovered =
      session.payment_status === "paid" ||
      session.payment_status === "no_payment_required";

    if (!isFullyCovered) {
      return new Response(
        JSON.stringify({ confirmed: false, payment_status: session.payment_status }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const metadataCvId = session.metadata?.cvId || session.metadata?.cv_id;
    if (metadataCvId !== cv_id) {
      console.warn("[ConfirmPayment] cv_id mismatch - metadata:", metadataCvId, "requested:", cv_id);
      return new Response(
        JSON.stringify({ error: "cv_id mismatch - payment not for this CV" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existing } = await supabase
      .from("stored_cvs")
      .select("is_paid, ats_json, status")
      .eq("id", cv_id)
      .maybeSingle();

    if (existing?.is_paid) {
      return new Response(
        JSON.stringify({ confirmed: true, already_paid: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const hasAnalysis = !!existing?.ats_json;
    const newStatus = hasAnalysis ? "completed" : "draft";

    const { error: updateError } = await supabase
      .from("stored_cvs")
      .update({
        is_paid: true,
        download_unlocked: true,
        payment_date: new Date().toISOString(),
        status: newStatus,
      })
      .eq("id", cv_id);

    if (updateError) {
      console.error("[ConfirmPayment] DB update error:", updateError);
      throw updateError;
    }

    console.log("[ConfirmPayment] CV payment confirmed and unlocked:", cv_id);

    return new Response(
      JSON.stringify({ confirmed: true, already_paid: false }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[ConfirmPayment] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
