/**
 * "7-Tage-Trial": legt sofort einen Account + Tenant an, OHNE Zahlungsdaten
 * abzufragen - passend zum Werbeversprechen "7 Tage kostenlos testen, ganz
 * ohne Zahlungsdaten" (siehe SelfServiceFeatures.tsx / content.ts).
 *
 * Ruft POST /api/v1/billing/trial-signup auf. Das Backend verlangt dafuer
 * zusaetzlich zum JSON-Body einen "X-API-Key"-Header (Fehler ohne diesen:
 * HTTP 401 "Fehlender Header 'X-API-Key'.").
 *
 * WICHTIG - Sicherheitshinweis zu diesem Key: alles, was hier als
 * VITE_ORBIT_TRIAL_API_KEY eingetragen wird, landet 1:1 im oeffentlichen
 * JS-Bundle der Website und ist damit fuer JEDEN Website-Besucher im
 * Browser-Devtools sichtbar (Network-Tab oder einfach im ausgelieferten
 * JS). Das ist NUR vertretbar, wenn dieser Key ein bewusst oeffentlicher
 * "Signup-Key" ist, der lediglich diesen einen Endpunkt (Trial-Anlage)
 * freischaltet und selbst im schlimmsten Fall (jeder kann ihn lesen und
 * beliebig oft Trials anlegen) keinen Schaden anrichtet - vergleichbar mit
 * einem Stripe "publishable key".
 *
 * Falls es sich stattdessen um einen ECHTEN Secret-Key handelt (z.B.
 * derselbe Key, mit dem auch interne/administrative Endpunkte
 * abgesichert sind), darf er NIEMALS hier landen. In dem Fall muesste
 * stattdessen eine serverseitige Proxy-Funktion (z.B. eine eigene
 * Supabase Edge Function ohne Secret im Client) den eigentlichen aufruf
 * mit dem Key im Backend machen, und die Website wuerde nur DIESE Proxy-
 * Funktion (ohne Key) aufrufen.
 *
 * -> Bitte bestaetigen, um welche Art Key es sich handelt, bevor
 * VITE_ORBIT_TRIAL_API_KEY mit einem echten Wert in Bolt/Netlify gesetzt
 * wird.
 */

import type { BillingPlan } from "./orbitDirectCheckout";

export interface TrialSignupInput {
  email: string;
  password: string;
  companyName: string;
  plan: BillingPlan;
  /** Optional - keine Pflichtangabe, hilft aber beim Nachfassen vor
   *  Trial-Ende. */
  phone?: string;
}

export interface TrialSignupResult {
  /** Optional: falls das Backend direkt eine Login-/Weiterleitungs-URL
   *  liefert. Wenn nicht vorhanden, zeigt das Formular stattdessen eine
   *  Erfolgs-Meldung an. */
  login_url?: string;
}

export class TrialSignupError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "TrialSignupError";
    this.status = status;
    this.code = code;
  }
}

function safeJsonParse(text: string): { detail?: unknown; code?: unknown } | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Dieselben Kernregeln wie beim Direktkauf (validateDirectCheckoutInput) -
 *  bewusst OHNE interval, da der Trial keinen Abrechnungsrhythmus hat. */
export function validateTrialSignupInput(input: TrialSignupInput): string | null {
  const email = input.email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Bitte eine gültige E-Mail-Adresse angeben.";
  }
  if (input.password.length < 8) {
    return "Das Passwort muss mindestens 8 Zeichen lang sein.";
  }
  if (!input.companyName.trim()) {
    return "Bitte einen Bildungsträger-/Firmennamen angeben.";
  }
  return null;
}

export async function createTrialSignup(
  apiBase: string,
  apiKey: string,
  input: TrialSignupInput
): Promise<TrialSignupResult> {
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/v1/billing/trial-signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    },
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      company_name: input.companyName.trim(),
      plan: input.plan,
      phone: input.phone?.trim() || undefined,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Trial-Signup fehlgeschlagen (HTTP ${res.status})`, body);
    const parsed = body ? safeJsonParse(body) : null;
    const detail = parsed && typeof parsed.detail === "string" ? parsed.detail : undefined;
    const code = parsed && typeof parsed.code === "string" ? parsed.code : undefined;

    const showDetail = res.status === 400 || res.status === 409;
    throw new TrialSignupError(
      res.status,
      showDetail && detail ? detail : "Der Trial konnte nicht gestartet werden. Bitte später erneut versuchen.",
      code
    );
  }

  return res.json() as Promise<TrialSignupResult>;
}