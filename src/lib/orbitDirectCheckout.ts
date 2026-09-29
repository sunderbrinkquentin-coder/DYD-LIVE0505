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

    const showDetail = res.status === 400 || res.status === 409;
    throw new DirectCheckoutError(
      res.status,
      showDetail && detail ? detail : "Der Kauf konnte nicht gestartet werden. Bitte später erneut versuchen.",
      code
    );
  }

  return res.json() as Promise<DirectCheckoutResult>;
}