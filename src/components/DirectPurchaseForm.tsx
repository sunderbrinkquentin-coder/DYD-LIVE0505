"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import {
  createDirectCheckoutSession,
  validateDirectCheckoutInput,
  DirectCheckoutError,
  type BillingInterval,
  type BillingPlan,
} from "../lib/orbitDirectCheckout";

const API_BASE = process.env.NEXT_PUBLIC_ORBIT_API_BASE ?? "";

interface DirectPurchaseFormProps {
  /** Welcher Plan gekauft wird - von der jeweiligen Preis-Karte vorgegeben,
   *  z.B. <DirectPurchaseForm plan="growth" /> auf der Growth-Karte. */
  plan: BillingPlan;
  onClose?: () => void;
}

const PLAN_LABELS: Record<BillingPlan, string> = {
  starter: "ORBIT Starter",
  growth: "ORBIT Growth",
  professional: "ORBIT Professional",
};

/**
 * NEU ("Direktkauf"): Formular fuer den sofortigen Kauf eines Plans direkt
 * auf der Website - OHNE vorherigen 7-Tage-Trial (siehe TrialSignupForm.tsx
 * fuer den Trial-Weg). Legt beim Absenden den Login-Account an und leitet
 * direkt zu Stripe Checkout weiter; Tenant + API-Key entstehen automatisch
 * NACH bestaetigter Zahlung (Backend-Webhook), nicht schon hier.
 *
 * Intervall-Auswahl (monatlich/jaehrlich) ist bewusst Teil dieses
 * Formulars, nicht der Preis-Karte selbst, damit eine Karte nur EINEN
 * "Kaufen"-Einstieg braucht.
 */
export function DirectPurchaseForm({ plan, onClose }: DirectPurchaseFormProps) {
  const [interval, setIntervalValue] = useState<BillingInterval>("monthly");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validateDirectCheckoutInput({ email, password, companyName, plan, interval });
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!API_BASE) {
      setErrorMessage(
        "Der Kauf ist aktuell nicht verfügbar (NEXT_PUBLIC_ORBIT_API_BASE fehlt)."
      );
      return;
    }

    setSubmitting(true);
    try {
      const redirectBase = window.location.origin + window.location.pathname;
      const { checkout_url } = await createDirectCheckoutSession(
        API_BASE,
        { email, password, companyName, plan, interval },
        `${redirectBase}?purchase=success`,
        `${redirectBase}?purchase=cancelled`
      );
      window.location.href = checkout_url;
    } catch (err) {
      setSubmitting(false);
      if (err instanceof DirectCheckoutError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Der Kauf konnte nicht gestartet werden. Bitte später erneut versuchen.");
      }
    }
  }

  return (
    <form style={styles.wrap} onSubmit={handleSubmit}>
      <h2 style={styles.heading}>{PLAN_LABELS[plan]} kaufen</h2>
      <p style={styles.text}>
        Nach der Zahlung kannst du dich mit dieser E-Mail-Adresse und diesem Passwort direkt bei
        ORBIT einloggen.
      </p>

      <div style={styles.toggleRow}>
        <IntervalButton active={interval === "monthly"} onClick={() => setIntervalValue("monthly")}>
          Monatlich
        </IntervalButton>
        <IntervalButton active={interval === "yearly"} onClick={() => setIntervalValue("yearly")}>
          Jährlich <span style={styles.badge}>2 Monate gratis</span>
        </IntervalButton>
      </div>

      <label style={styles.label}>
        Firmen-/Bildungsträger-Name
        <input
          style={styles.input}
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="z.B. Musterakademie GmbH"
          autoComplete="organization"
          required
        />
      </label>

      <label style={styles.label}>
        E-Mail-Adresse
        <input
          style={styles.input}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="du@firma.de"
          autoComplete="email"
          required
        />
      </label>

      <label style={styles.label}>
        Passwort
        <input
          style={styles.input}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="mind. 8 Zeichen"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {errorMessage && <p style={styles.errorText}>{errorMessage}</p>}

      <button type="submit" style={{ ...styles.cta, ...(submitting ? styles.ctaDisabled : {}) }} disabled={submitting}>
        {submitting ? "Wird weitergeleitet…" : "Weiter zur Zahlung"}
      </button>

      {onClose && (
        <button type="button" style={styles.closeButton} onClick={onClose}>
          Abbrechen
        </button>
      )}
    </form>
  );
}

function IntervalButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ ...styles.toggleButton, ...(active ? styles.toggleButtonActive : {}) }}
    >
      {children}
    </button>
  );
}

const styles: Record<string, CSSProperties> = {
  wrap: {
    width: "100%",
    maxWidth: 420,
    display: "flex",
    flexDirection: "column",
    gap: 12,
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  heading: {
    margin: "0 0 4px",
    fontSize: 20,
    color: "#0c1c34",
  },
  text: {
    margin: "0 0 8px",
    fontSize: 13.5,
    lineHeight: 1.5,
    color: "#5b6779",
  },
  toggleRow: {
    display: "flex",
    gap: 8,
    marginBottom: 4,
  },
  toggleButton: {
    border: "1px solid #e6eaf2",
    background: "#fff",
    color: "#5b6779",
    borderRadius: 999,
    padding: "8px 16px",
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "inherit",
    cursor: "pointer",
  },
  toggleButtonActive: {
    background: "#0c1c34",
    borderColor: "#0c1c34",
    color: "#fff",
  },
  badge: {
    marginLeft: 6,
    fontSize: 11,
    fontWeight: 700,
    color: "#2f8fd6",
  },
  label: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    fontSize: 13,
    fontWeight: 600,
    color: "#0c1c34",
  },
  input: {
    border: "1px solid #e6eaf2",
    borderRadius: 8,
    padding: "10px 12px",
    fontSize: 14,
    fontFamily: "inherit",
    fontWeight: 400,
  },
  errorText: {
    color: "#c23b3b",
    fontSize: 13,
    margin: 0,
  },
  cta: {
    display: "inline-block",
    textAlign: "center",
    textDecoration: "none",
    border: "none",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 14,
    fontWeight: 700,
    fontFamily: "inherit",
    cursor: "pointer",
    background: "linear-gradient(90deg, #8fecb4, #2f8fd6)",
    color: "#0c1c34",
    marginTop: 4,
  },
  ctaDisabled: {
    opacity: 0.6,
    cursor: "default",
  },
  closeButton: {
    background: "none",
    border: "none",
    color: "#5b6779",
    fontSize: 13,
    cursor: "pointer",
    fontFamily: "inherit",
    textDecoration: "underline",
  },
};