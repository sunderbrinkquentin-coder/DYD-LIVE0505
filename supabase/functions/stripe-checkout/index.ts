import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FESTIVAL_PRICE_IDS = new Set([
  "price_1T9NSV3Sd9dZl64S39A2Rpl1",
  "price_1T9NPZ3Sd9dZl64SjF0ilg4Z",
  "price_1T9NPE3Sd9dZl64S5l8dCMJg",
  "price_1T9NLf3Sd9dZl64Sdp05jz2i",
  "price_1T9NKn3Sd9dZl64SsyJls5J3",
  "price_1TGwcF3Sd9dZl64Sk7sd5nNM",
]);

const NO_PROMO_PRICE_IDS = new Set([
  "price_1TGwcF3Sd9dZl64Sk7sd5nNM",
]);

interface CheckoutRequest {
  price_id: string;
  success_url: string;
  cancel_url: string;
  mode?: "payment" | "subscription";
  metadata?: Record<string, string>;
  bierpong_team_name?: string;
  bierpong_partner_name?: string;
  buyer_name?: string;
  user_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-12-18.acacia",
    });

    const body: CheckoutRequest = await req.json();
    const { price_id, success_url, cancel_url, mode = "payment", metadata = {}, bierpong_team_name, bierpong_partner_name, buyer_name, user_id: bodyUserId } = body;

    if (!price_id || !success_url || !cancel_url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: price_id, success_url, cancel_url" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isFestivalTicket = FESTIVAL_PRICE_IDS.has(price_id);

    let userId: string | undefined;
    let userEmail: string | undefined;

    if (!isFestivalTicket) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: "Missing Authorization header" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error("Supabase configuration missing");
      }

      const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - Invalid token" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      userId = user.id;
      userEmail = user.email;
    }

    console.log("[Stripe Checkout] Creating session | Price:", price_id, "| Festival:", isFestivalTicket);

    const festivalMeta: Record<string, string> = {};
    if (isFestivalTicket) {
      if (bierpong_team_name) festivalMeta.bierpong_team_name = bierpong_team_name;
      if (bierpong_partner_name) festivalMeta.bierpong_partner_name = bierpong_partner_name;
      if (buyer_name) festivalMeta.buyer_name = buyer_name;
      if (bodyUserId) festivalMeta.user_id = bodyUserId;
    }

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode,
      line_items: [{ price: price_id, quantity: 1 }],
      success_url,
      cancel_url,
      metadata: {
        ...metadata,
        ...(userId ? { user_id: userId, user_email: userEmail || "" } : {}),
        ...festivalMeta,
      },
    };

    if (!isFestivalTicket && userId) {
      sessionParams.customer_email = userEmail;
      sessionParams.client_reference_id = userId;
    }

    if (!NO_PROMO_PRICE_IDS.has(price_id)) {
      sessionParams.allow_promotion_codes = true;
    }

    if (isFestivalTicket) {
      sessionParams.billing_address_collection = "auto";
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log("[Stripe Checkout] Session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[Stripe Checkout] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
