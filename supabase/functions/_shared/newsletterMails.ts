// supabase/functions/_shared/newsletterMails.ts
//
// E-Mail-Vorlagen, die direkt aus der Edge Function `newsletter` versendet
// werden: Double-Opt-in-Bestätigung und Willkommensmail mit Rabatt.
// Tabellen-Layout (funktioniert in Outlook, Gmail, Apple Mail), max. 600 px,
// Vorschauzeile, Textversion, Impressum und Abmeldelink in jeder Mail.

const NAVY = "#0A192F";
const TEAL = "#30E3CA";
const LIGHT = "#F4F7FB";

export const IMPRINT =
  "DYD – Decide your Dream UG (haftungsbeschränkt) · Brehmstraße 2 · 40239 Düsseldorf · Geschäftsführer: Quentin Sunderbrink · HRB 110079, Amtsgericht Düsseldorf";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function layout(opts: { preheader: string; body: string; footerNote: string; unsubscribeUrl?: string; siteUrl: string }): string {
  return `<!doctype html>
<html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>DYD</title></head>
<body style="margin:0;padding:0;background:${LIGHT};-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${LIGHT};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1d2939;">
<tr><td style="background:${NAVY};padding:22px 32px;">
  <a href="${opts.siteUrl}" style="text-decoration:none;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:.5px;">DYD <span style="color:${TEAL};font-weight:600;font-size:13px;letter-spacing:2px;">DECIDE YOUR DREAM</span></a>
</td></tr>
<tr><td style="padding:32px 32px 8px 32px;font-size:16px;line-height:1.6;">${opts.body}</td></tr>
<tr><td style="padding:8px 32px 28px 32px;font-size:13px;line-height:1.5;color:#667085;">${opts.footerNote}</td></tr>
<tr><td style="background:#F8FAFC;padding:18px 32px;font-size:11px;line-height:1.5;color:#98A2B3;">
  ${esc(IMPRINT)}<br>
  <a href="${opts.siteUrl}/datenschutz" style="color:#98A2B3;">Datenschutz</a> · <a href="${opts.siteUrl}/impressum" style="color:#98A2B3;">Impressum</a>${opts.unsubscribeUrl ? ` · <a href="${opts.unsubscribeUrl}" style="color:#98A2B3;">Newsletter abbestellen</a>` : ""}
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

function button(href: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:12px;background:${TEAL};">
<a href="${href}" style="display:inline-block;padding:15px 28px;font-size:16px;font-weight:800;color:${NAVY};text-decoration:none;border-radius:12px;">${esc(label)}</a>
</td></tr></table>`;
}

const hello = (firstName?: string | null) => (firstName ? `Hi ${esc(firstName)},` : "Hi,");

// ── 1) Double-Opt-in ───────────────────────────────────────────────────
export function confirmMail(p: { firstName?: string | null; confirmUrl: string; siteUrl: string; expiresDays: number }) {
  const subject = "Bitte bestätigen: Dein 50-%-Rabatt wartet";
  const body = `
<p style="margin:0 0 16px 0;">${hello(p.firstName)}</p>
<p style="margin:0 0 16px 0;">schön, dass du beim DYD-Newsletter dabei sein willst. Bitte bestätige noch kurz deine E-Mail-Adresse – <strong>danach schalten wir sofort deinen Rabatt von 50 % auf deine erste Buchung frei.</strong></p>
${button(p.confirmUrl, "E-Mail bestätigen & 50 % sichern")}
<p style="margin:0 0 8px 0;font-size:14px;color:#475467;">Der Link ist ${p.expiresDays} Tage gültig. Funktioniert der Button nicht? Kopiere diesen Link in deinen Browser:<br><a href="${p.confirmUrl}" style="color:#0E7490;word-break:break-all;">${p.confirmUrl}</a></p>`;
  const footerNote = "Du bekommst diese E-Mail, weil sich jemand mit dieser Adresse bei DYD für den Newsletter angemeldet hat. Warst du das nicht? Dann ignoriere diese Mail einfach – ohne Bestätigung bekommst du keine weiteren E-Mails.";
  const text = `${p.firstName ? `Hi ${p.firstName},` : "Hi,"}

bitte bestätige deine E-Mail-Adresse für den DYD-Newsletter. Danach schalten wir sofort deinen Rabatt von 50 % auf deine erste Buchung frei:

${p.confirmUrl}

Der Link ist ${p.expiresDays} Tage gültig. Warst du das nicht? Dann ignoriere diese Mail – ohne Bestätigung bekommst du keine weiteren E-Mails.

${IMPRINT}`;
  return { subject, html: layout({ preheader: "Ein Klick – dann ist dein Rabatt aktiv.", body, footerNote, siteUrl: p.siteUrl }), text };
}

// ── 2) Willkommensmail mit Rabatt ──────────────────────────────────────
export function welcomeMail(p: { firstName?: string | null; siteUrl: string; untilLabel: string; unsubscribeUrl: string; percent: number }) {
  const subject = `Dein ${p.percent}-%-Rabatt ist aktiv – so holst du am meisten raus`;
  const utm = (path: string, c: string) => `${p.siteUrl}${path}?utm_source=newsletter&utm_medium=email&utm_campaign=welcome&utm_content=${c}`;
  const row = (title: string, text: string, href: string, label: string) => `
<tr><td style="padding:14px 0;border-top:1px solid #EAECF0;">
  <p style="margin:0 0 4px 0;font-weight:800;font-size:16px;">${esc(title)}</p>
  <p style="margin:0 0 6px 0;font-size:14px;color:#475467;">${esc(text)}</p>
  <a href="${href}" style="font-size:14px;font-weight:700;color:#0E7490;">${esc(label)} →</a>
</td></tr>`;
  const body = `
<p style="margin:0 0 16px 0;">${hello(p.firstName)}</p>
<p style="margin:0 0 16px 0;">danke für deine Bestätigung – du bist dabei. <strong>Dein Rabatt von ${p.percent} % ist ab sofort in deinem Konto hinterlegt</strong> und wird beim Bezahlen automatisch abgezogen. Kein Code nötig.</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY};border-radius:14px;margin:8px 0 20px 0;"><tr><td style="padding:20px 22px;color:#ffffff;">
  <p style="margin:0;font-size:13px;letter-spacing:2px;color:${TEAL};font-weight:700;">DEIN WILLKOMMENSRABATT</p>
  <p style="margin:6px 0 2px 0;font-size:30px;font-weight:900;">−${p.percent} % auf deine erste Buchung</p>
  <p style="margin:0;font-size:14px;color:rgba(255,255,255,.75);">gültig bis ${esc(p.untilLabel)} · automatisch im Checkout</p>
</td></tr></table>
<p style="margin:0 0 4px 0;font-weight:800;">Wofür lohnt er sich am meisten?</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
${row("CV-Optimierung im 10er-Paket", "Dein Lebenslauf passgenau für jede Bewerbung – mit Rabatt nur 1,50 € pro Stelle.", utm("/dashboard", "paket10"), "Paket wählen")}
${row("CV-Check Detailanalyse", "Zeile für Zeile sehen, woran dein CV im ATS scheitert – inklusive fertiger Formulierungen.", utm("/cv-check", "cvcheck"), "Lebenslauf prüfen")}
${row("Kurs mit Zertifikat", "Gefragten Skill lernen, Prüfung ablegen, Zertifikat mit QR-Code direkt in LinkedIn.", utm("/kurse", "kurse"), "Kurse ansehen")}
</table>
${button(utm("/dashboard", "cta"), "Jetzt Rabatt einlösen")}
<p style="margin:0 0 16px 0;">In den nächsten Tagen bekommst du von mir noch die drei Fehler, an denen die meisten Lebensläufe im ATS scheitern – und wie du sie in 10 Minuten behebst.</p>
<p style="margin:0;">Viel Erfolg bei deinen Bewerbungen!<br><strong>Quentin</strong><br><span style="font-size:14px;color:#667085;">Gründer von DYD</span></p>`;
  const footerNote = "Du erhältst diese E-Mail, weil du den DYD-Newsletter bestätigt hast. Du kannst ihn jederzeit mit einem Klick abbestellen – dein Rabatt bleibt dir trotzdem erhalten.";
  const text = `${p.firstName ? `Hi ${p.firstName},` : "Hi,"}

danke für deine Bestätigung. Dein Rabatt von ${p.percent} % auf deine erste Buchung ist aktiv (gültig bis ${p.untilLabel}) und wird beim Bezahlen automatisch abgezogen.

Am meisten lohnt er sich für:
- CV-Optimierung im 10er-Paket: ${utm("/dashboard", "paket10")}
- CV-Check Detailanalyse: ${utm("/cv-check", "cvcheck")}
- Kurs mit Zertifikat: ${utm("/kurse", "kurse")}

Viel Erfolg!
Quentin, Gründer von DYD

Newsletter abbestellen: ${p.unsubscribeUrl}
${IMPRINT}`;
  return { subject, html: layout({ preheader: `−${p.percent} % auf deine erste Buchung, automatisch im Checkout.`, body, footerNote, unsubscribeUrl: p.unsubscribeUrl, siteUrl: p.siteUrl }), text };
}
