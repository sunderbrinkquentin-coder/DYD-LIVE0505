import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const TOKEN_MAPPING: Record<string, number> = {
  price_1SZbVG3Sd9dZl64SLJPFwfk3: 1,
  price_1SZbVs3Sd9dZl64SpcjlM7vG: 5,
  price_1SZbWQ3Sd9dZl64SFdf1QsGm: 10,
  price_1SZc133Sd9dZl64SYr82cZcX: 1,
};

const CV_CHECK_PRICE_IDS = new Set([
  "price_1TAQtK3Sd9dZl64Sd9OGfObU",
]);

const FESTIVAL_TICKET_MAPPING: Record<string, { type: string; label: string }> = {
  price_1T9NSV3Sd9dZl64S39A2Rpl1: { type: "early_bird", label: "EARLY Bird Bundle" },
  price_1T9NPZ3Sd9dZl64SjF0ilg4Z: { type: "dj", label: "DJ Sets House / Techno" },
  price_1T9NPE3Sd9dZl64S5l8dCMJg: { type: "concert", label: "Live Konzert Zirkel.WTF" },
  price_1T9NLf3Sd9dZl64Sdp05jz2i: { type: "bierpong", label: "Bierpong-Turnier" },
  price_1T9NKn3Sd9dZl64SsyJls5J3: { type: "standup", label: "Stand-Up Comedy" },
};

function generateTicketNumber(type: string): string {
  const prefix = "HRM";
  const year = "2026";
  const rand = Math.floor(Math.random() * 90000) + 10000;
  const typeCode = type.slice(0, 2).toUpperCase();
  return `${prefix}-${year}-${typeCode}-${rand}`;
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
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }

    const stripe = new Stripe(stripeKey, {
      apiVersion: "2024-12-18.acacia",
    });

    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(
        JSON.stringify({ error: "Missing stripe-signature header" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = await req.text();
    let event: Stripe.Event;

    if (webhookSecret) {
      try {
        event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      } catch (err: any) {
        console.error("[Stripe Webhook] Signature verification failed:", err.message);
        return new Response(
          JSON.stringify({ error: `Webhook signature verification failed: ${err.message}` }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    } else {
      console.warn("[Stripe Webhook] STRIPE_WEBHOOK_SECRET not configured - skipping signature verification");
      event = JSON.parse(body);
    }

    console.log("[Stripe Webhook] Received event:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log("[Stripe Webhook] Checkout session completed:", session.id, "| payment_status:", session.payment_status);

      const isFullyCovered = session.payment_status === "paid" || session.payment_status === "no_payment_required";
      if (!isFullyCovered) {
        console.log("[Stripe Webhook] Payment not yet complete, skipping processing");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const lineItems = await stripe.checkout.sessions.listLineItems(session.id);
      const priceId = lineItems.data[0]?.price?.id;

      if (!priceId) {
        console.error("[Stripe Webhook] No price_id found in line items");
        return new Response(
          JSON.stringify({ error: "No price_id found" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const festivalTicket = FESTIVAL_TICKET_MAPPING[priceId];
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

      if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error("Supabase configuration missing");
      }

      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      if (festivalTicket) {
        console.log("[Stripe Webhook] Festival ticket purchase:", festivalTicket.label);

        const metaUserId = session.metadata?.user_id || null;
        const bierpongTeamName = session.metadata?.bierpong_team_name || null;
        const bierpongPartnerName = session.metadata?.bierpong_partner_name || null;
        const buyerName = session.customer_details?.name || session.metadata?.buyer_name || null;
        const ticketNumber = generateTicketNumber(festivalTicket.type);

        const { data: existingTicket } = await supabase
          .from("festival_ticket_sales")
          .select("id")
          .eq("stripe_session_id", session.id)
          .maybeSingle();

        if (existingTicket) {
          console.log("[Stripe Webhook] Festival ticket already exists, skipping insert");
        } else {
          const { error: festivalError } = await supabase
            .from("festival_ticket_sales")
            .insert({
              stripe_session_id: session.id,
              stripe_payment_intent_id: session.payment_intent as string || null,
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
            });

          if (festivalError) {
            console.error("[Stripe Webhook] Error saving festival ticket:", festivalError);
          } else {
            console.log("[Stripe Webhook] Festival ticket saved:", ticketNumber);
          }
        }

        return new Response(
          JSON.stringify({ received: true }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const userId = session.client_reference_id || session.metadata?.user_id;
      const tokensToAdd = TOKEN_MAPPING[priceId] || 0;
      const cvId = session.metadata?.cvId || session.metadata?.cv_id;
      const learningPathId = session.metadata?.learning_path_id;
      const isCvCheckPrice = CV_CHECK_PRICE_IDS.has(priceId);

      console.log("[Stripe Webhook] Price:", priceId, "| isCvCheck:", isCvCheckPrice, "| Tokens:", tokensToAdd, "| cvId:", cvId, "| userId:", userId);

      if (cvId) {
        console.log("[Stripe Webhook] Payment for CV upload:", cvId, "| type:", isCvCheckPrice ? "cv_check" : "cv_optimizer");

        const { data: cvCheck } = await supabase
          .from("stored_cvs")
          .select("ats_json, status")
          .eq("id", cvId)
          .maybeSingle();

        const hasAnalysis = !!cvCheck?.ats_json;
        const newStatus = hasAnalysis ? "completed" : (isCvCheckPrice ? "processing" : "draft");

        const { error: updateCvError } = await supabase
          .from("stored_cvs")
          .update({
            is_paid: true,
            download_unlocked: true,
            payment_date: new Date().toISOString(),
            status: newStatus,
          })
          .eq("id", cvId);

        if (updateCvError) {
          console.error("[Stripe Webhook] Error updating CV payment status:", updateCvError);
        } else {
          console.log("[Stripe Webhook] CV payment status updated");

          const { data: cvData, error: cvFetchError } = await supabase
            .from("stored_cvs")
            .select("ats_json, user_id")
            .eq("id", cvId)
            .maybeSingle();

          if (cvFetchError || !cvData) {
            console.error("[Stripe Webhook] Error fetching CV data:", cvFetchError);
          } else if (cvData.ats_json) {
            const atsJson = cvData.ats_json;
            const score = Math.max(0, Math.min(100, atsJson.ats_score ?? 0));

            const categories = [
              { key: 'relevanz_fokus', data: atsJson.relevanz_fokus },
              { key: 'erfolge_kpis', data: atsJson.erfolge_kpis },
              { key: 'klarheit_sprache', data: atsJson.klarheit_sprache },
              { key: 'formales', data: atsJson.formales },
              { key: 'usp_skills', data: atsJson.usp_skills },
            ];

            const categoryScores: Record<string, number> = {};
            const feedback: Record<string, string> = {};
            const recommendations: Record<string, string> = {};

            categories.forEach((cat) => {
              if (cat.data) {
                categoryScores[cat.key] = cat.data.score ?? 0;
                if (cat.data.feedback) feedback[cat.key] = cat.data.feedback;
                if (cat.data.verbesserung) recommendations[cat.key] = cat.data.verbesserung;
              }
            });

            const analysisUserId = cvData.user_id || userId || null;

            const { error: insertError } = await supabase
              .from('ats_analyses')
              .insert({
                user_id: analysisUserId,
                upload_id: cvId,
                ats_score: score,
                category_scores: categoryScores,
                feedback,
                recommendations,
                analysis_data: atsJson,
                extracted_cv_data: {},
              });

            if (insertError) {
              console.error("[Stripe Webhook] Error saving analysis:", insertError);
            } else {
              console.log("[Stripe Webhook] Analysis saved to dashboard (user_id:", analysisUserId || "null - will be linked later", ")");
            }
          }
        }
      }

      // Handle learning path payment
      if (learningPathId) {
        console.log("[Stripe Webhook] Payment for learning path:", learningPathId);
        const selectedSkill = session.metadata?.selected_skill || null;
        const unlockAll = session.metadata?.unlock_all === 'true';
        const lpUpdate: Record<string, unknown> = { is_paid: true, updated_at: new Date().toISOString() };
        if (selectedSkill) lpUpdate.selected_skill = selectedSkill;

        if (unlockAll && userId) {
          // Unlock ALL learning paths for this user
          console.log("[Stripe Webhook] Unlocking ALL learning paths for user:", userId);
          const { error: allLpError } = await supabase
            .from("learning_paths")
            .update({ is_paid: true, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
          if (allLpError) {
            console.error("[Stripe Webhook] Error unlocking all learning paths:", allLpError);
          } else {
            console.log("[Stripe Webhook] All learning paths unlocked for user:", userId);
          }
        } else {
          // Unlock only the specific learning path
          const { error: lpError } = await supabase
            .from("learning_paths")
            .update(lpUpdate)
            .eq("id", learningPathId);
          if (lpError) {
            console.error("[Stripe Webhook] Error unlocking learning path:", lpError);
          } else {
            console.log("[Stripe Webhook] Learning path unlocked:", learningPathId);
          }
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!userId) {
        console.warn("[Stripe Webhook] No user_id found - skipping token crediting");
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (tokensToAdd > 0) {
        const { data: existingTokens, error: fetchError } = await supabase
          .from("user_tokens")
          .select("credits")
          .eq("user_id", userId)
          .maybeSingle();

        if (fetchError) {
          console.error("[Stripe Webhook] Error fetching user_tokens:", fetchError);
          throw fetchError;
        }

        const currentCredits = existingTokens?.credits || 0;
        const newCredits = currentCredits + tokensToAdd;

        const { error: upsertError } = await supabase
          .from("user_tokens")
          .upsert(
            { user_id: userId, credits: newCredits, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );

        if (upsertError) {
          console.error("[Stripe Webhook] Error upserting user_tokens:", upsertError);
          throw upsertError;
        }

        console.log("[Stripe Webhook] user_tokens updated:", {
          userId,
          previous: currentCredits,
          added: tokensToAdd,
          new: newCredits,
        });

        const { error: logError } = await supabase
          .from("token_purchases")
          .insert({
            user_id: userId,
            stripe_session_id: session.id,
            price_id: priceId,
            tokens_purchased: tokensToAdd,
            amount_paid: session.amount_total,
            currency: session.currency,
          });

        if (logError) {
          console.warn("[Stripe Webhook] Could not log purchase:", logError);
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[Stripe Webhook] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
