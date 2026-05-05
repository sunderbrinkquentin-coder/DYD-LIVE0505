import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FESTIVAL_TICKET_MAPPING: Record<string, { type: string; label: string }> = {
  price_1T9NSV3Sd9dZl64S39A2Rpl1: { type: "early_bird", label: "EARLY Bird Bundle" },
  price_1T9NPZ3Sd9dZl64SjF0ilg4Z: { type: "dj", label: "DJ Sets House / Techno" },
  price_1T9NPE3Sd9dZl64S5l8dCMJg: { type: "concert", label: "Live Konzert Zirkel.WTF" },
  price_1T9NLf3Sd9dZl64Sdp05jz2i: { type: "bierpong", label: "Bierpong-Turnier" },
  price_1T9NKn3Sd9dZl64SsyJls5J3: { type: "standup", label: "Stand-Up Comedy" },
};

function generateTicketNumber(type: string): string {
  const rand = Math.floor(Math.random() * 90000) + 10000;
  const typeCode = type.slice(0, 2).toUpperCase();
  return `HRM-2026-${typeCode}-${rand}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment configuration");
    }

    const { session_id, user_id } = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: "session_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: existing } = await supabase
      .from("festival_ticket_sales")
      .select("id, ticket_number, ticket_type, ticket_label, buyer_name, buyer_email, amount_paid, currency, bierpong_team_name, bierpong_partner_name, payment_status, user_id, created_at")
      .eq("stripe_session_id", session_id)
      .maybeSingle();

    if (existing) {
      if (user_id && !existing.user_id) {
        await supabase
          .from("festival_ticket_sales")
          .update({ user_id })
          .eq("stripe_session_id", session_id);
        existing.user_id = user_id;
      }
      return new Response(
        JSON.stringify({ ticket: existing }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

    const session = await stripe.checkout.sessions.retrieve(session_id);

    const isFullyCovered = session.payment_status === "paid" || session.payment_status === "no_payment_required";
    if (!isFullyCovered) {
      return new Response(
        JSON.stringify({ error: "Payment not completed" }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const lineItems = await stripe.checkout.sessions.listLineItems(session_id);
    const priceId = lineItems.data[0]?.price?.id;

    if (!priceId) {
      return new Response(
        JSON.stringify({ error: "No price found for session" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const festivalTicket = FESTIVAL_TICKET_MAPPING[priceId];
    if (!festivalTicket) {
      return new Response(
        JSON.stringify({ error: "Not a festival ticket" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const metaUserId = user_id || session.metadata?.user_id || null;
    const bierpongTeamName = session.metadata?.bierpong_team_name || null;
    const bierpongPartnerName = session.metadata?.bierpong_partner_name || null;
    const buyerName = session.customer_details?.name || session.metadata?.buyer_name || null;
    const ticketNumber = generateTicketNumber(festivalTicket.type);

    const newTicket = {
      stripe_session_id: session.id,
      stripe_payment_intent_id: (session.payment_intent as string) || null,
      ticket_type: festivalTicket.type,
      ticket_label: festivalTicket.label,
      amount_paid: session.amount_total,
      currency: session.currency,
      buyer_email: session.customer_details?.email || session.customer_email || null,
      buyer_name: buyerName,
      payment_status: session.payment_status,
      user_id: metaUserId,
      ticket_number: ticketNumber,
      bierpong_team_name: bierpongTeamName,
      bierpong_partner_name: bierpongPartnerName,
    };

    const { data: inserted, error: insertError } = await supabase
      .from("festival_ticket_sales")
      .insert(newTicket)
      .select()
      .maybeSingle();

    if (insertError) {
      console.error("[confirm-festival-ticket] Insert error:", insertError);
      throw new Error(insertError.message);
    }

    return new Response(
      JSON.stringify({ ticket: inserted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[confirm-festival-ticket] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
