// Edge Function: send-b2b-briefing
// Versendet das B2B-Briefing per Resend an:
//  1. Den Kunden (Bestätigungs-Mail, TO: contact.email)
//  2. quentin@decideyourdream.de (CC auf der Kunden-Mail + eigene Detail-Mail)
// v4 – quentin@decideyourdream.de immer im CC aller Mails
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OWNER_EMAIL = "quentin@decideyourdream.de";
const FROM_EMAIL = "DYD Automatisierung <briefing@decideyourdream.de>";

interface BriefingPayload {
  contact: {
    name: string;
    company: string;
    email: string;
    phone: string | null;
  };
  segment: string;
  need: string;
  answers: Record<string, string>;
  source?: string;
  submitted_at?: string;
}

const LABELS: Record<string, string> = {
  ziel: "Ziel des Projekts",
  nutzer: "Nutzer & Einsatzbereich",
  tools: "Heutige Tools & Prozesse",
  daten: "Daten & Quellen",
  schnittstellen: "Schnittstellen",
  budget: "Budgetrahmen",
  appointment: "Gewünschter Termin",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function answerRows(answers: Record<string, string>): string {
  const entries = Object.entries(answers).filter(([, v]) => v && v.trim().length > 0);
  if (entries.length === 0) return "<li>Noch keine Angaben</li>";
  return entries
    .map(([key, value]) => `<li><strong>${escapeHtml(LABELS[key] ?? key)}:</strong> ${escapeHtml(value)}</li>`)
    .join("");
}

function socialRow(): string {
  const icon = (label: string, url: string, text: string) =>
    `<a href="${escapeHtml(url)}" style="display:inline-block;margin:4px 6px;padding:8px 16px;border-radius:20px;background:#0A192F;color:#ffffff;font-size:12px;font-weight:bold;text-decoration:none;">${escapeHtml(label)} ${escapeHtml(text)}</a>`;
  return [
    icon("Instagram", "https://www.instagram.com/dyd_1408", "@dyd_1408"),
    icon("TikTok", "https://www.tiktok.com/@user7381390238054", "DYD"),
    icon("LinkedIn", "https://www.linkedin.com/company/decideyourdream", "Decide your Dream"),
    icon("LinkedIn", "https://www.linkedin.com/in/quentin-sunderbrink", "Quentin Sunderbrink"),
  ].join("");
}

function baseLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<body style="margin:0;padding:0;background:#eef1f5;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#0A192F,#12325c);border-radius:12px 12px 0 0;padding:30px 32px;text-align:center;">
      <div style="color:#DEFF9A;font-size:12px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;">DYD · Decide Your Dream</div>
      <div style="color:#ffffff;font-size:24px;font-weight:bold;margin-top:8px;line-height:1.3;">${title}</div>
    </div>
    <div style="background:#ffffff;padding:36px;color:#1a2332;line-height:1.65;font-size:15px;">${bodyHtml}</div>
    <div style="background:#0A192F;border-radius:0 0 12px 12px;padding:26px 32px;text-align:center;">
      <div style="color:#ffffff;font-size:14px;font-weight:bold;margin-bottom:4px;">Quentin Sunderbrink</div>
      <div style="color:#9fb0c8;font-size:13px;margin-bottom:2px;">Gründer · DYD Automation</div>
      <div style="margin-bottom:14px;">
        <a href="mailto:quentin@decideyourdream.de" style="color:#DEFF9A;font-size:13px;text-decoration:none;">quentin@decideyourdream.de</a>
      </div>
      <div>${socialRow()}</div>
      <div style="color:#5f7189;font-size:11px;margin-top:18px;padding-top:14px;border-top:1px solid rgba(255,255,255,0.12);">
        DYD Automation · <a href="https://decideyourdream.de" style="color:#8fa3bd;text-decoration:none;">decideyourdream.de</a>
      </div>
    </div>
  </div>
</body>
</html>`;
}

async function sendEmail(to: string[], cc: string[], subject: string, html: string, apiKey: string): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, cc, subject, html }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 300)}` };
  }
  return { ok: true };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const apiKey = Deno.env.get("RESEND_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload: BriefingPayload = await req.json();
    const email = payload?.contact?.email?.trim() ?? "";
    const name = payload?.contact?.name?.trim() || "unbekannt";
    if (!email || !email.includes("@")) {
      return new Response(JSON.stringify({ error: "contact.email fehlt oder ist ungültig" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const firstName = name.split(" ")[0] || "Hallo";
    const needHtml = escapeHtml(payload.need || "–").replace(/\n/g, "<br>");
    const submitted = payload.submitted_at
      ? new Date(payload.submitted_at).toLocaleString("de-DE", { dateStyle: "long", timeStyle: "short" })
      : new Date().toLocaleString("de-DE", { dateStyle: "long", timeStyle: "short" });

    const appointment = payload.answers?.appointment ?? "";
    const customerBody = `
      <p style="margin-top:0;">Hallo ${escapeHtml(firstName)},</p>
      <p>vielen Dank für Ihre Anfrage im Bereich <strong>Automatisierung</strong>. Ihre Angaben sind bei uns gelandet – wir melden uns zu Ihrem gewünschten Termin, in der Regel deutlich schneller.</p>
      ${appointment ? `<div style="background:#f2fddf;border:1px solid #c8e88a;border-radius:10px;padding:16px 18px;margin:22px 0;"><div style="color:#5a7a1e;font-size:12px;font-weight:bold;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Ihr Wunschtermin</div><div style="font-size:17px;font-weight:bold;color:#0A192F;">${escapeHtml(appointment)}</div></div>` : ""}
      <p style="font-size:14px;font-weight:bold;color:#5a6578;text-transform:uppercase;letter-spacing:1px;margin:26px 0 10px;">Ihre Angaben im Überblick</p>
      <ul style="padding-left:20px;margin:0 0 20px;">${answerRows(payload.answers ?? {})}</ul>
      ${payload.need ? `<p style="background:#f7f8fa;border-left:4px solid #38BDF8;padding:14px 16px;border-radius:6px;"><strong>Ihre Notiz:</strong><br>${needHtml}</p>` : ""}
      <p>Bis dahin: Wir schauen uns Ihr Anliegen schon einmal im Detail an, damit das Erstgespräch direkt konkret wird.</p>
      <p style="margin-top:26px;background:#f7f8fa;border-radius:10px;padding:16px 18px;font-size:14px;">Sie haben noch eine Frage vor dem Termin? Antworten Sie einfach auf diese E-Mail oder schreiben Sie mir direkt an <a href="mailto:quentin@decideyourdream.de" style="color:#0A192F;font-weight:bold;">quentin@decideyourdream.de</a>.</p>
      <p style="margin-top:26px;margin-bottom:0;">Beste Grüße<br><strong>Quentin Sunderbrink</strong><br><span style="color:#8a94a6;font-size:13px;">Gründer · DYD Automation</span></p>
    `;

    // Mail 1: Bestätigung an den Kunden, quentin@decideyourdream.de in CC
    const customerHtml = baseLayout(
      "Ihre Anfrage ist bei uns gelandet",
      customerBody
    );

    const customerResult = await sendEmail(
      [email],
      [OWNER_EMAIL],
      "Ihre DYD-Anfrage: Termin + Bedarfsanalyse eingegangen",
      customerHtml,
      apiKey
    );

    // Mail 2: vollständiges Briefing an den Betreiber
    const ownerHtml = baseLayout(
      "Neue B2B-Anfrage: Automatisierung",
      `
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#5a6578;width:140px;">Name</td><td><strong>${escapeHtml(name)}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#5a6578;">Unternehmen</td><td>${escapeHtml(payload.contact.company || "–")}</td></tr>
        <tr><td style="padding:6px 0;color:#5a6578;">E-Mail</td><td>${escapeHtml(email)}</td></tr>
        <tr><td style="padding:6px 0;color:#5a6578;">Telefon</td><td>${escapeHtml(payload.contact.phone || "–")}</td></tr>
        <tr><td style="padding:6px 0;color:#5a6578;">Quelle</td><td>${escapeHtml(payload.source ?? "prozess-check")}</td></tr>
        <tr><td style="padding:6px 0;color:#5a6578;">Eingegangen</td><td>${escapeHtml(submitted)}</td></tr>
      </table>
      <p style="margin-top:20px;"><strong>Bedarfsanalyse:</strong></p>
      <ul style="padding-left:20px;">${answerRows(payload.answers ?? {})}</ul>
      <p><strong>Notiz / Bedarf:</strong><br>${needHtml}</p>
      `
    );

    const ownerResult = await sendEmail(
      [OWNER_EMAIL],
      [OWNER_EMAIL],
      `Neue Anfrage (Automatisierung): ${name} · ${payload.contact.company || email}`,
      ownerHtml,
      apiKey
    );

    const failed = [customerResult, ownerResult].filter((r) => !r.ok);
    if (failed.length > 0) {
      return new Response(JSON.stringify({ error: "Resend-Versand teilweise fehlgeschlagen", details: failed }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, sentTo: [email, OWNER_EMAIL] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
