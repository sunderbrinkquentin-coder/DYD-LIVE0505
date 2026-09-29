import { useState, type FormEvent, type ReactNode } from "react";
import {
  createDirectCheckoutSession,
  validateDirectCheckoutInput,
  DirectCheckoutError,
  type BillingInterval,
  type BillingPlan,
} from "../lib/orbitDirectCheckout";

const API_BASE: string = import.meta.env.VITE_ORBIT_API_BASE ?? "";

interface DirectPurchaseFormProps {
  plan: BillingPlan;
  onClose?: () => void;
}

const PLAN_LABELS: Record<BillingPlan, string> = {
  starter: "ORBIT Starter",
  growth: "ORBIT Growth",
  professional: "ORBIT Professional",
};

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
      setErrorMessage("Der Kauf ist aktuell nicht verfügbar (VITE_ORBIT_API_BASE fehlt).");
      return;
    }

    setSubmitting(true);
    try {
      const hashPath = window.location.hash.replace(/^#/, "").split("?")[0] || "/";
      const base = `${window.location.origin}/#${hashPath}`;
      const { checkout_url } = await createDirectCheckoutSession(
        API_BASE,
        { email, password, companyName, plan, interval },
        `${base}?purchase=success`,
        `${base}?purchase=cancelled`
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
    <form className="w-full flex flex-col gap-3 font-arimo" onSubmit={handleSubmit}>
      <h2 className="font-poppins font-black text-xl text-[#0F1E34]">{PLAN_LABELS[plan]} kaufen</h2>
      <p className="text-[13.5px] leading-relaxed text-[#55637A] mb-1">
        Nach der Zahlung kannst du dich mit dieser E-Mail-Adresse und diesem Passwort direkt bei ORBIT
        einloggen.
      </p>

      <div className="flex gap-2 mb-1">
        <IntervalButton active={interval === "monthly"} onClick={() => setIntervalValue("monthly")}>
          Monatlich
        </IntervalButton>
        <IntervalButton active={interval === "yearly"} onClick={() => setIntervalValue("yearly")}>
          Jährlich <span className="ml-1.5 text-[11px] font-bold text-[#38BDF8]">2 Monate gratis</span>
        </IntervalButton>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-bold text-[#0F1E34]">
        Firmen-/Bildungsträger-Name
        <input
          className="rounded-lg border border-[#E3EBF5] px-3 py-2.5 text-sm font-normal font-arimo focus:outline-none focus:border-[#38BDF8]"
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="z.B. Musterakademie GmbH"
          autoComplete="organization"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-bold text-[#0F1E34]">
        E-Mail-Adresse
        <input
          className="rounded-lg border border-[#E3EBF5] px-3 py-2.5 text-sm font-normal font-arimo focus:outline-none focus:border-[#38BDF8]"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="du@firma.de"
          autoComplete="email"
          required
        />
      </label>

      <label className="flex flex-col gap-1.5 text-sm font-bold text-[#0F1E34]">
        Passwort
        <input
          className="rounded-lg border border-[#E3EBF5] px-3 py-2.5 text-sm font-normal font-arimo focus:outline-none focus:border-[#38BDF8]"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="mind. 8 Zeichen"
          autoComplete="new-password"
          minLength={8}
          required
        />
      </label>

      {errorMessage && <p className="text-[13px] text-[#c23b3b] m-0">{errorMessage}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg px-4 py-3 text-sm font-bold text-[#0A192F] disabled:opacity-60 disabled:cursor-default"
        style={{ background: "linear-gradient(90deg, #8fecb4, #2f8fd6)" }}
      >
        {submitting ? "Wird weitergeleitet…" : "Weiter zur Zahlung"}
      </button>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-[13px] text-[#55637A] underline bg-transparent border-0 cursor-pointer"
        >
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
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-[13px] font-bold border transition ${
        active ? "text-white border-transparent" : "text-[#55637A] border-[#E3EBF5] bg-white"
      }`}
      style={active ? { background: "#0A192F" } : undefined}
    >
      {children}
    </button>
  );
}