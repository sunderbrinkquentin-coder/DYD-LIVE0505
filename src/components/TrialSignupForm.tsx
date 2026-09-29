import { useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import {
  createTrialSignup,
  validateTrialSignupInput,
  TrialSignupError,
} from "../lib/orbitTrialSignup";
import type { BillingPlan } from "../lib/orbitDirectCheckout";

const API_BASE: string = import.meta.env.VITE_ORBIT_API_BASE ?? "";

interface TrialSignupFormProps {
  plan: BillingPlan;
  onClose?: () => void;
}

const PLAN_LABELS: Record<BillingPlan, string> = {
  starter: "ORBIT Starter",
  growth: "ORBIT Growth",
  professional: "ORBIT Professional",
};

/**
 * "7 Tage kostenlos testen" - bewusst ein EIGENES, kuerzeres Formular statt
 * DirectPurchaseForm mit Trial-Modus zu ueberladen: kein Monatlich/Jaehrlich-
 * Umschalter (kein Abrechnungsrhythmus im Trial) und explizit KEINE
 * Zahlungsdaten-Abfrage, passend zum Werbeversprechen in
 * SelfServiceFeatures.tsx ("7 Tage kostenlos testen, ganz ohne
 * Zahlungsdaten").
 *
 * Pflichtfelder (siehe validateTrialSignupInput): E-Mail, Passwort,
 * Firmen-/Bildungsträgername - dieselben wie beim Direktkauf, weil der
 * Account danach identisch nutzbar sein muss. Telefonnummer ist bewusst
 * OPTIONAL (nur fuer Sales-Nachfass vor Trial-Ende). Zusaetzlich eine
 * Pflicht-Checkbox fuer AGB/Datenschutz, die im Kauf-Formular fehlt - hier
 * ergaenzt, weil das hier der erste Ort ist, an dem wir personenbezogene
 * Daten OHNE unmittelbar folgenden Stripe-Checkout (der eigene AGB-Hinweise
 * hat) entgegennehmen.
 */
export function TrialSignupForm({ plan, onClose }: TrialSignupFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ loginUrl?: string } | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMessage(null);

    const validationError = validateTrialSignupInput({ email, password, companyName, plan, phone });
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    if (!consent) {
      setErrorMessage("Bitte AGB und Datenschutzerklärung akzeptieren, um fortzufahren.");
      return;
    }
    if (!API_BASE) {
      setErrorMessage("Der Trial ist aktuell nicht verfügbar (VITE_ORBIT_API_BASE fehlt).");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createTrialSignup(API_BASE, { email, password, companyName, plan, phone });
      setSubmitting(false);
      setSuccess({ loginUrl: result.login_url });
    } catch (err) {
      setSubmitting(false);
      if (err instanceof TrialSignupError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage("Der Trial konnte nicht gestartet werden. Bitte später erneut versuchen.");
      }
    }
  }

  if (success) {
    return (
      <div className="w-full flex flex-col gap-3 font-arimo text-center">
        <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(56,189,248,0.12)" }}>
          <Check className="w-6 h-6 text-[#38BDF8]" aria-hidden="true" />
        </div>
        <h2 className="font-poppins font-black text-xl text-[#0F1E34]">Trial gestartet</h2>
        <p className="text-[13.5px] leading-relaxed text-[#55637A]">
          Dein 7-Tage-Zugang zu {PLAN_LABELS[plan]} ist eingerichtet. Wir haben eine Bestätigung an{" "}
          <span className="font-bold text-[#0F1E34]">{email}</span> geschickt.
        </p>
        {success.loginUrl ? (
          <a
            href={success.loginUrl}
            className="mt-1 rounded-lg px-4 py-3 text-sm font-bold text-[#0A192F] text-center"
            style={{ background: "linear-gradient(90deg, #8fecb4, #2f8fd6)" }}
          >
            Jetzt einloggen
          </a>
        ) : (
          <p className="text-[12.5px] text-[#94a3b8]">Bitte prüfe dein Postfach für den Login-Link.</p>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="text-[13px] text-[#55637A] underline bg-transparent border-0 cursor-pointer"
          >
            Schließen
          </button>
        )}
      </div>
    );
  }

  return (
    <form className="w-full flex flex-col gap-3 font-arimo" onSubmit={handleSubmit}>
      <h2 className="font-poppins font-black text-xl text-[#0F1E34]">{PLAN_LABELS[plan]} – 7 Tage kostenlos testen</h2>
      <p className="text-[13.5px] leading-relaxed text-[#55637A] mb-1">
        Voller Funktionsumfang, keine Zahlungsdaten nötig. Der Zugang wird sofort eingerichtet.
      </p>

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

      <label className="flex flex-col gap-1.5 text-sm font-bold text-[#0F1E34]">
        Telefonnummer <span className="font-normal text-[#94a3b8]">(optional)</span>
        <input
          className="rounded-lg border border-[#E3EBF5] px-3 py-2.5 text-sm font-normal font-arimo focus:outline-none focus:border-[#38BDF8]"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="für Rückfragen vor Trial-Ende"
          autoComplete="tel"
        />
      </label>

      <label className="flex items-start gap-2 text-[12.5px] text-[#55637A] mt-1">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="mt-0.5"
          required
        />
        <span>
          Ich akzeptiere die{" "}
          <a href="/#/agb" target="_blank" rel="noopener noreferrer" className="underline">AGB</a> und die{" "}
          <a href="/#/datenschutz" target="_blank" rel="noopener noreferrer" className="underline">Datenschutzerklärung</a>.
        </span>
      </label>

      {errorMessage && <p className="text-[13px] text-[#c23b3b] m-0">{errorMessage}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-1 rounded-lg px-4 py-3 text-sm font-bold text-[#0A192F] disabled:opacity-60 disabled:cursor-default"
        style={{ background: "linear-gradient(90deg, #8fecb4, #2f8fd6)" }}
      >
        {submitting ? "Wird eingerichtet…" : "Kostenlosen Trial starten"}
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