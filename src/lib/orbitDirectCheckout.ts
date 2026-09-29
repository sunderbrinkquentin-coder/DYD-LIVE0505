/**
 * NEU ("Direktkauf"): ruft den oeffentlichen Endpunkt POST
 * /api/v1/billing/direct-checkout-session deiner ORBIT-API auf (siehe
 * handleCreateDirectCheckoutSession() in orbit-api.ts). Anders als
 * orbitSignup.ts (fetchBillingPlans/TrialSignupForm - IMMER 7 Tage
 * kostenloser Trial ohne Zahlung): hier bezahlt die Person SOFORT einen
 * echten Plan direkt hier auf der Website, ohne vorherigen Trial - Tenant +
 * API-Key entstehen automatisch, sobald die Zahlung bestaetigt ist (Webhook
 * in orbit-api.ts), NICHT schon bei diesem Aufruf hier.
 *
 * Ablauf: dieser Aufruf legt nur den Login-Account an und gibt eine
 * Stripe-Checkout-URL zurueck, zu der du den Browser weiterleitest
 * (window.location.href = checkout_url). Nach erfolgreicher Zahlung
 * schickt Stripe die Person zu deiner success_url zurueck - von dort aus
 * kann sie sich mit der gerade vergebenen E-Mail+Passwort direkt bei ORBIT
 * einloggen (Tenant + API-Key sind dann bereits angelegt).
 */

export type BillingPlan = "starter" | "growth" | "professional";
export type BillingInterval = "monthly" | "yearly";

export interface DirectCheckoutInput {
  email: string;
  password: string;
  companyName: string;
  plan: BillingPlan;
  interval: BillingInterval;
}

export interface DirectCheckoutResult {
  checkout_url: string;
}

export class DirectCheckoutError extends Error {
  status: number;
  code?: string;

  constructor(status: number, message: string, code?: string) {
    super(message);
    this.name = "DirectCheckoutError";
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

/** Dieselben Regeln wie serverseitig (isValidEmail/password.length in
 *  orbit-api.ts) - nur fuer sofortiges Client-Feedback, siehe orbitSignup.ts. */
export function validateDirectCheckoutInput(input: DirectCheckoutInput): string | null {
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

/** Ruft POST /api/v1/billing/direct-checkout-session auf. apiBase =
 *  NEXT_PUBLIC_ORBIT_API_BASE. successUrl/cancelUrl muessen https:// sein
 *  (Backend lehnt sonst ab, siehe isHttpsUrl() dort). */
export async function createDirectCheckoutSession(
  apiBase: string,
  input: DirectCheckoutInput,
  successUrl: string,
  cancelUrl: string
): Promise<DirectCheckoutResult> {
  const res = await fetch(`${apiBase.replace(/\/$/, "")}/api/v1/billing/direct-checkout-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email.trim(),
      password: input.password,
      company_name: input.companyName.trim(),
      plan: input.plan,
      interval: input.interval,
      success_url: successUrl,
      cancel_url: cancelUrl,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`Direktkauf-Checkout fehlgeschlagen (HTTP ${res.status})`, body);
    const parsed = body ? safeJsonParse(body) : null;
    const detail = parsed && typeof parsed.detail === "string" ? parsed.detail : undefined;
    const code = parsed && typeof parsed.code === "string" ? parsed.code : undefined;

    // Wie bei /signup (orbitSignup.ts): 400/409-Meldungen sind bewusst
    // endnutzerfreundlich formuliert und duerfen direkt angezeigt werden.
    const showDetail = res.status === 400 || res.status === 409;
    throw new DirectCheckoutError(
      res.status,
      showDetail && detail ? detail : "Der Kauf konnte nicht gestartet werden. Bitte später erneut versuchen.",
      code
    );
  }

  return res.json() as Promise<DirectCheckoutResult>;
}