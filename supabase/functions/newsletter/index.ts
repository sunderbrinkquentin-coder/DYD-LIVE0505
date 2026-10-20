// supabase/functions/newsletter/index.ts
//
// Newsletter mit Double-Opt-in und 50-%-Willkommensrabatt.
//
// Aktionen (POST, JSON-Body { action, ... }):
//   subscribe   (Login nötig)  Einwilligung speichern + Bestätigungsmail senden
//   resend      (Login nötig)  Bestätigungsmail erneut senden (max. 1×/2 Min.)
//   decline     (Login nötig)  Angebot abgelehnt → nicht erneut fragen, keine Mails
//   confirm     (ohne Login)   Token aus der Bestätigungsmail → bestätigt,
//                              Rabatt freischalten, Brevo-Liste, Willkommensmail
//   unsubscribe (ohne Login)   Abmelde-Token aus jeder Mail → abgemeldet
// Zusätzlich:
//   POST ?action=unsubscribe&t=<token>      One-Click-Abmeldung (RFC 8058)
//   POST ?action=brevo-webhook&secret=<…>   Abmeldungen/Bounces/Spam aus Brevo
//
// Deploy (Bestätigungs- und Abmeldelinks kommen ohne Login):
//   supabase functions deploy newsletter --no-verify-jwt
// Secrets:
//   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (automatisch)
//   BREVO_API_KEY, BREVO_LIST_ID, NEWSLETTER_SENDER_EMAIL, NEWSLETTER_SENDER_NAME
//   NEWSLETTER_WEBHOOK_SECRET, SITE_URL (Standard https://decide-your-dream.de)
//   NEWSLETTER_DISCOUNT_DAYS (Standard 30), NEWSLETTER_DISCOUNT_PERCENT (Standard 50)

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2.57.4";
import { NEWSLETTER_CONSENT } from "../_shared/newsletterConsent.ts";
import { confirmMail, welcomeMail } from "../_shared/newsletterMails.ts";
import { sendMail, unsubscribeContact, upsertContact } from "../_shared/brevo.ts";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const SITE = (Deno.env.get("SITE_URL") ?? "https://decide-your-dream.de").replace(/\/$/, "");
const DISCOUNT_DAYS = Number(Deno.env.get("NEWSLETTER_DISCOUNT_DAYS") ?? 30) || 30;
const DISCOUNT_PERCENT = Number(Deno.env.get("NEWSLETTER_DISCOUNT_PERCENT") ?? 50) || 50;
const CONFIRM_DAYS = 7;
const FN_URL = `${(Deno.env.get("SUPABASE_URL") ?? "").replace(/\/$/, "")}/functions/v1/newsletter`;

// ── Hilfsfunktionen ────────────────────────────────────────────────────
function admin(): SupabaseClient {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
}

async function currentUser(req: Request) {
  const auth = req.headers.get("Authorization");
  if (!auth) return null;
  const client = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: auth } }, auth: { persistSession: false },
  });
  const { data } = await client.auth.getUser();
  return data.user ?? null;
}

function clientIp(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("cf-connecting-ip") || null;
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

const unsubscribeUrl = (token: string) => `${SITE}/newsletter/abmelden?t=${encodeURIComponent(token)}`;
const oneClickUrl = (token: string) => `${FN_URL}?action=unsubscribe&t=${encodeURIComponent(token)}`;
const dateLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Berlin" });

function firstNameFrom(user: { user_metadata?: Record<string, unknown> }, fallback?: unknown): string | null {
  const raw = (typeof fallback === "string" && fallback.trim()) || (user.user_metadata?.full_name as string) || (user.user_metadata?.name as string) || "";
  const first = raw.trim().split(/\s+/)[0] ?? "";
  return first ? first.slice(0, 40) : null;
}

async function sendConfirmation(db: SupabaseClient, row: { id: string; email: string; first_name: string | null; confirm_send_count: number }) {
  const token = randomToken();
  const expires = new Date(Date.now() + CONFIRM_DAYS * 86_400_000).toISOString();
  await db.from("newsletter_subscribers").update({
    confirm_token_hash: await sha256(token),
    confirm_expires_at: expires,
    confirm_sent_at: new Date().toISOString(),
    confirm_send_count: (row.confirm_send_count ?? 0) + 1,
  }).eq("id", row.id);
  const mail = confirmMail({ firstName: row.first_name, confirmUrl: `${SITE}/newsletter/bestaetigen?token=${encodeURIComponent(token)}`, siteUrl: SITE, expiresDays: CONFIRM_DAYS });
  return sendMail({ to: { email: row.email, name: row.first_name }, ...mail, tags: ["newsletter-doi"] });
}

// ── Aktionen ───────────────────────────────────────────────────────────
async function subscribe(req: Request, body: Record<string, unknown>) {
  const user = await currentUser(req);
  if (!user?.email) return json({ error: "unauthorized", message: "Bitte melde dich an." }, 401);

  const version = String(body.consent_version ?? "");
  const consentText = NEWSLETTER_CONSENT[version];
  if (!consentText) return json({ error: "invalid_consent", message: "Unbekannte Einwilligungsversion." }, 400);

  const db = admin();
  const { data: existing } = await db.from("newsletter_subscribers").select("*").eq("user_id", user.id).maybeSingle();
  if (existing?.status === "confirmed") return json({ status: "confirmed" });

  const now = new Date().toISOString();
  const record = {
    user_id: user.id,
    email: user.email.toLowerCase(),
    first_name: firstNameFrom(user, body.first_name),
    status: "pending",
    consent_version: version,
    consent_text: consentText,
    source: String(body.source ?? "app").slice(0, 60),
    opt_in_at: now,
    opt_in_ip: clientIp(req),
    opt_in_user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300),
    declined_at: null,
    unsubscribed_at: null,
  };
  const { data: row, error } = await db.from("newsletter_subscribers")
    .upsert(record, { onConflict: "user_id" })
    .select("id, email, first_name, confirm_send_count")
    .single();
  if (error || !row) {
    console.error("[newsletter] subscribe", error);
    return json({ error: "db", message: "Das hat nicht geklappt. Bitte versuche es erneut." }, 500);
  }
  const sent = await sendConfirmation(db, row);
  return json({ status: "pending", email: row.email, mail_sent: sent });
}

async function resend(req: Request) {
  const user = await currentUser(req);
  if (!user) return json({ error: "unauthorized" }, 401);
  const db = admin();
  const { data: row } = await db.from("newsletter_subscribers").select("id, email, first_name, status, confirm_sent_at, confirm_send_count").eq("user_id", user.id).maybeSingle();
  if (!row || row.status !== "pending") return json({ status: row?.status ?? "none" });
  if (row.confirm_sent_at && Date.now() - new Date(row.confirm_sent_at).getTime() < 120_000) {
    return json({ error: "too_soon", message: "Bitte warte kurz, bevor du die E-Mail erneut anforderst." }, 429);
  }
  if ((row.confirm_send_count ?? 0) >= 5) return json({ error: "limit", message: "Bitte prüfe deinen Spam-Ordner oder melde dich bei uns." }, 429);
  const sent = await sendConfirmation(db, row);
  return json({ status: "pending", mail_sent: sent });
}

async function decline(req: Request) {
  const user = await currentUser(req);
  if (!user?.email) return json({ error: "unauthorized" }, 401);
  const db = admin();
  const { data: row } = await db.from("newsletter_subscribers").select("status").eq("user_id", user.id).maybeSingle();
  if (row?.status === "confirmed") return json({ status: "confirmed" });
  // Nur Vermerk "nicht erneut fragen" – keine Einwilligungsdaten, keine Mails
  await db.from("newsletter_subscribers").upsert({
    user_id: user.id, email: user.email.toLowerCase(), status: "declined", declined_at: new Date().toISOString(),
    confirm_token_hash: null, confirm_expires_at: null,
  }, { onConflict: "user_id" });
  return json({ status: "declined" });
}

async function confirm(req: Request, body: Record<string, unknown>) {
  const token = String(body.token ?? "");
  if (token.length < 20) return json({ error: "invalid", message: "Der Bestätigungslink ist ungültig." }, 400);
  const db = admin();
  const { data: row } = await db.from("newsletter_subscribers").select("*").eq("confirm_token_hash", await sha256(token)).maybeSingle();
  if (!row) return json({ error: "invalid", message: "Dieser Link ist ungültig oder wurde bereits verwendet." }, 404);
  if (row.status === "confirmed") return json({ status: "confirmed", discount_expires_at: row.discount_expires_at, percent: row.discount_percent });
  if (row.confirm_expires_at && new Date(row.confirm_expires_at).getTime() < Date.now()) {
    return json({ error: "expired", message: "Der Link ist abgelaufen. Melde dich an und fordere einfach einen neuen an." }, 410);
  }

  const now = new Date();
  // Rabatt nur einmal pro Konto – bei erneuter Anmeldung nach Abmeldung nicht nochmal
  const grantDiscount = !row.discount_granted_at;
  const expires = grantDiscount ? new Date(now.getTime() + DISCOUNT_DAYS * 86_400_000).toISOString() : row.discount_expires_at;
  const { data: updated, error } = await db.from("newsletter_subscribers").update({
    status: "confirmed",
    confirmed_at: now.toISOString(),
    confirm_ip: clientIp(req),
    confirm_user_agent: (req.headers.get("user-agent") ?? "").slice(0, 300),
    confirm_token_hash: null,
    confirm_expires_at: null,
    ...(grantDiscount ? { discount_percent: DISCOUNT_PERCENT, discount_granted_at: now.toISOString(), discount_expires_at: expires } : {}),
  }).eq("id", row.id).select("*").single();
  if (error || !updated) {
    console.error("[newsletter] confirm", error);
    return json({ error: "db", message: "Das hat nicht geklappt. Bitte versuche es erneut." }, 500);
  }

  const discountOpen = !!updated.discount_granted_at && !updated.discount_redeemed_at && !!updated.discount_expires_at && new Date(updated.discount_expires_at) > now;
  await upsertContact(updated.email, {
    FIRSTNAME: updated.first_name ?? "",
    SIGNUP_SOURCE: updated.source ?? "app",
    OPT_IN_DATE: updated.confirmed_at.slice(0, 10),
    DISCOUNT_PERCENT: updated.discount_percent,
    DISCOUNT_UNTIL: updated.discount_expires_at ? updated.discount_expires_at.slice(0, 10) : "",
    DISCOUNT_REDEEMED: !!updated.discount_redeemed_at,
    UNSUBSCRIBE_URL: unsubscribeUrl(updated.unsubscribe_token),
  });
  if (discountOpen) {
    const mail = welcomeMail({ firstName: updated.first_name, siteUrl: SITE, untilLabel: dateLabel(updated.discount_expires_at), unsubscribeUrl: unsubscribeUrl(updated.unsubscribe_token), percent: updated.discount_percent });
    await sendMail({ to: { email: updated.email, name: updated.first_name }, ...mail, unsubscribeUrl: oneClickUrl(updated.unsubscribe_token), tags: ["newsletter-welcome"] });
  }
  return json({ status: "confirmed", discount_active: discountOpen, discount_expires_at: updated.discount_expires_at, percent: updated.discount_percent });
}

async function unsubscribe(token: string, reason = "link") {
  if (!/^[0-9a-f-]{36}$/i.test(token)) return json({ error: "invalid", message: "Der Abmeldelink ist ungültig." }, 400);
  const db = admin();
  const { data: row } = await db.from("newsletter_subscribers").select("id, email, status").eq("unsubscribe_token", token).maybeSingle();
  if (!row) return json({ error: "invalid", message: "Der Abmeldelink ist ungültig." }, 404);
  if (row.status !== "unsubscribed") {
    await db.from("newsletter_subscribers").update({
      status: "unsubscribed", unsubscribed_at: new Date().toISOString(), unsubscribe_reason: reason,
      confirm_token_hash: null, confirm_expires_at: null,
    }).eq("id", row.id);
    await unsubscribeContact(row.email);
  }
  return json({ status: "unsubscribed" });
}

async function brevoWebhook(req: Request, url: URL) {
  const secret = Deno.env.get("NEWSLETTER_WEBHOOK_SECRET");
  if (!secret || url.searchParams.get("secret") !== secret) return json({ error: "forbidden" }, 403);
  const payload = await req.json().catch(() => null) as { event?: string; email?: string } | null;
  const event = payload?.event ?? "";
  const email = payload?.email?.toLowerCase();
  if (!email) return json({ ok: true });
  if (["unsubscribed", "unsubscribe", "spam", "hard_bounce", "hardBounce", "blocked"].includes(event)) {
    await admin().from("newsletter_subscribers").update({
      status: "unsubscribed", unsubscribed_at: new Date().toISOString(), unsubscribe_reason: `brevo:${event}`,
    }).eq("email", email).neq("status", "unsubscribed");
  }
  return json({ ok: true });
}

// ── Router ─────────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  const url = new URL(req.url);
  try {
    const qAction = url.searchParams.get("action");
    if (qAction === "unsubscribe") return await unsubscribe(url.searchParams.get("t") ?? "", "one-click");
    if (qAction === "brevo-webhook") return await brevoWebhook(req, url);

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    switch (body.action) {
      case "subscribe": return await subscribe(req, body);
      case "resend": return await resend(req);
      case "decline": return await decline(req);
      case "confirm": return await confirm(req, body);
      case "unsubscribe": return await unsubscribe(String(body.token ?? ""), "link");
      default: return json({ error: "unknown_action" }, 400);
    }
  } catch (e) {
    console.error("[newsletter]", e);
    return json({ error: "server", message: "Da ist etwas schiefgelaufen. Bitte versuche es erneut." }, 500);
  }
});
