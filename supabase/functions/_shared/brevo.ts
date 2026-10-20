// supabase/functions/_shared/brevo.ts
//
// Schlanker Client für Brevo (ehem. Sendinblue, EU-Anbieter, AVV verfügbar):
// Transaktions-Mails (Double-Opt-in, Willkommensmail) und Kontaktpflege der
// Newsletter-Liste. Ohne BREVO_API_KEY wird nichts versendet (Log-Hinweis).
//
// Secrets: BREVO_API_KEY, BREVO_LIST_ID,
//          NEWSLETTER_SENDER_EMAIL (verifizierte Absenderadresse),
//          NEWSLETTER_SENDER_NAME  (Standard: "Quentin von DYD")

const API = "https://api.brevo.com/v3";

function key(): string | null {
  return Deno.env.get("BREVO_API_KEY") ?? null;
}

async function call(path: string, init: RequestInit): Promise<Response | null> {
  const k = key();
  if (!k) {
    console.warn("[brevo] BREVO_API_KEY fehlt – Aufruf übersprungen:", path);
    return null;
  }
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { "api-key": k, "Content-Type": "application/json", Accept: "application/json", ...(init.headers ?? {}) },
  });
  if (!res.ok && res.status !== 404) {
    console.error("[brevo]", path, res.status, (await res.clone().text()).slice(0, 300));
  }
  return res;
}

export async function sendMail(opts: {
  to: { email: string; name?: string | null };
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl?: string;
  tags?: string[];
}): Promise<boolean> {
  const senderEmail = Deno.env.get("NEWSLETTER_SENDER_EMAIL");
  if (!senderEmail) {
    console.warn("[brevo] NEWSLETTER_SENDER_EMAIL fehlt – Mail nicht versendet");
    return false;
  }
  const headers: Record<string, string> = {};
  if (opts.unsubscribeUrl) {
    // RFC 8058: Abmeldung mit einem Klick (Pflicht bei Gmail/Yahoo für Massenversender)
    headers["List-Unsubscribe"] = `<${opts.unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  const res = await call("/smtp/email", {
    method: "POST",
    body: JSON.stringify({
      sender: { email: senderEmail, name: Deno.env.get("NEWSLETTER_SENDER_NAME") ?? "Quentin von DYD" },
      to: [{ email: opts.to.email, ...(opts.to.name ? { name: opts.to.name } : {}) }],
      subject: opts.subject,
      htmlContent: opts.html,
      textContent: opts.text,
      headers,
      tags: opts.tags ?? [],
    }),
  });
  return !!res?.ok;
}

function listId(): number | null {
  const n = Number(Deno.env.get("BREVO_LIST_ID"));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Bestätigten Kontakt in die Newsletter-Liste aufnehmen (oder aktualisieren) */
export async function upsertContact(email: string, attributes: Record<string, string | number | boolean | null>): Promise<void> {
  const id = listId();
  await call("/contacts", {
    method: "POST",
    body: JSON.stringify({ email, attributes, ...(id ? { listIds: [id] } : {}), updateEnabled: true, emailBlacklisted: false }),
  });
}

/** Nur Attribute aktualisieren (z. B. Rabatt eingelöst) */
export async function updateContactAttributes(email: string, attributes: Record<string, string | number | boolean | null>): Promise<void> {
  await call(`/contacts/${encodeURIComponent(email)}`, { method: "PUT", body: JSON.stringify({ attributes }) });
}

/** Abmeldung: aus der Liste nehmen (Kontakt bleibt für Sperrvermerk erhalten) */
export async function unsubscribeContact(email: string): Promise<void> {
  const id = listId();
  if (id) {
    await call(`/contacts/lists/${id}/contacts/remove`, { method: "POST", body: JSON.stringify({ emails: [email] }) });
  }
}

/** Konto gelöscht: Kontakt vollständig entfernen (Art. 17 DSGVO) */
export async function deleteContact(email: string): Promise<void> {
  await call(`/contacts/${encodeURIComponent(email)}`, { method: "DELETE" });
}
