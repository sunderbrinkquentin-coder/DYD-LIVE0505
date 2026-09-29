/**
 * "7-Tage-Trial": legt sofort einen Account + Tenant an, OHNE Zahlungsdaten
 * abzufragen - passend zum Werbeversprechen "7 Tage kostenlos testen, ganz
 * ohne Zahlungsdaten" (siehe SelfServiceFeatures.tsx / content.ts).
 *
 * WICHTIG (bitte von dir bestaetigen/anpassen): dieser Client-Code ruft
 * POST /api/v1/billing/trial-signup auf - das ist eine ANNAHME, die den
 * Namenskonventionen von orbitDirectCheckout.ts folgt. Es muss auf deiner
 * Backend-Seite (Supabase Edge Function o.ae.) einen passenden Endpunkt
 * geben, der:
 *   1. Account + Tenant sofort anlegt (kein Stripe-Checkout, keine Karte),
 *   2. den 7-Tage-Countdown serverseitig startet,
 *   3. idealerweise eine login_url zurueckgibt, zu der wir direkt
 *      weiterleiten koennen - falls das (noch) nicht existiert, zeigen wir
 *      stattdessen eine Erfolgs-Meldung im Formular ("bitte E-Mails pruefen")
 *      an, siehe TrialSignupForm.tsx.
 * Falls der tatsaechliche Pfad/die Antwortstruktur anders aussieht, bitte
 * hier + in TrialSignupForm.tsx entsprechend anpassen.
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

export async function createTrialSignup(apiBase: string, input: TrialSignupInput): Promise<TrialSignupResult> {
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/v1/billing/trial-signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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