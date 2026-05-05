import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const STALE_THRESHOLD_MINUTES = 10;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MINUTES * 60 * 1000).toISOString();

    console.log(`[stale-cv-cleanup] Running cleanup. Cutoff: ${cutoff}`);

    const { data: staleRows, error: selectError } = await supabase
      .from("stored_cvs")
      .select("id, file_name, created_at, updated_at, status")
      .eq("status", "processing")
      .lt("updated_at", cutoff);

    if (selectError) {
      console.error("[stale-cv-cleanup] Error fetching stale rows:", selectError.message);
      return new Response(
        JSON.stringify({ error: selectError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const count = staleRows?.length ?? 0;
    console.log(`[stale-cv-cleanup] Found ${count} stale processing entries`);

    if (count === 0) {
      return new Response(
        JSON.stringify({ cleaned: 0, message: "No stale entries found" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const staleIds = (staleRows ?? []).map((r) => r.id);

    for (const row of staleRows ?? []) {
      console.log(
        `[stale-cv-cleanup] Marking as failed: id=${row.id}, file=${row.file_name}, updated_at=${row.updated_at}`
      );
    }

    const { error: updateError } = await supabase
      .from("stored_cvs")
      .update({
        status: "failed",
        error_message: `Automatisch auf 'failed' gesetzt: Analyse nach ${STALE_THRESHOLD_MINUTES} Minuten nicht abgeschlossen.`,
        updated_at: new Date().toISOString(),
      })
      .in("id", staleIds);

    if (updateError) {
      console.error("[stale-cv-cleanup] Error updating stale rows:", updateError.message);
      return new Response(
        JSON.stringify({ error: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[stale-cv-cleanup] Successfully marked ${count} entries as failed`);

    return new Response(
      JSON.stringify({
        cleaned: count,
        ids: staleIds,
        message: `${count} stale processing entries marked as failed`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const e = error as Error;
    console.error("[stale-cv-cleanup] Unhandled error:", e?.message ?? String(error));
    return new Response(
      JSON.stringify({ error: e?.message ?? "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
