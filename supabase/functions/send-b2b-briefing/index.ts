// Edge Function: send-b2b-briefing
// Versendet das B2B-Briefing per Resend an:
//  1. Den Kunden (Bestätigungs-Mail, TO: contact.email)
//  2. quentin@decideyourdream.de (CC auf der Kunden-Mail + eigene Detail-Mail)
// v2 – Übertragung nach RESEND_API_KEY-Verknüpfung
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

function baseLayout(title: string, bodyHtml: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:640px;margin:0 auto;padding:24px;">
    <div style="background:#0A192F;border-radius:12px 12px 0 0;padding:28px 32px;">
      <div style="color:#DEFF9A;font-size:13px;letter-spacing:2px;text-transform:uppercase;font-weight:bold;">DYD · Decide Your Dream</div>
      <div style="color:#ffffff;font-size:22px;font-weight:bold;margin-top:6px;">${title}</div>
    </div>
    <div style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px;color:#1a2332;line-height:1.6;font-size:15px;">
      ${bodyHtml}
    </div>
    <div style="text-align:center;color:#8a94a6;font-size:12px;padding:16px;">
      DYD Automation · decideyourdream.de
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

    // Mail 1: Bestätigung an den Kunden, quentin@decideyourdream.de in CC
    const customerHtml = baseLayout(
      "Ihre Anfrage ist bei uns gelandet",
      `
      <p>Hallo ${escapeHtml(firstName)},</p>
      <p>vielen Dank für Ihre Anfrage im Bereich <strong>Automatisierung</strong>. Wir haben alles erhalten und melden uns zu Ihrem gewünschten Termin – in der Regel deutlich schneller.</p>
      <p style="background:#f2fddf;border-left:4px solid #DEFF9A;padding:14px 16px;border-radius:6px;"><strong>Ihre Angaben im Überblick:</strong></p>
      <ul style="padding-left:20px;">${answerRows(payload.answers ?? {})}</ul>
      <p><strong>Notiz / Bedarf:</strong><br>${needHtml}</p>
      <p>Bis dahin: Wir schauen uns Ihr Anliegen schon einmal im Detail an, damit das Erstgespräch direkt konkret wird.</p>
      <p style="margin-top:28px;">Beste Grüße<br><strong>Ihr DYD-Team</strong><br><span style="color:#8a94a6;">decideyourdream.de</span></p>
      `
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
      [],
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
