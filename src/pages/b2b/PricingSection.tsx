import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { Check, Sparkles, ShieldCheck, Zap, Rocket, TrendingUp, Crown } from "lucide-react";
import { DirectPurchaseForm } from "../../components/DirectPurchaseForm";
import ProcessRail from "./ProcessRail";
import type { BillingPlan, BillingInterval } from "../../lib/orbitDirectCheckout";

const NAVY_SKY = "linear-gradient(135deg, #0A192F, #38BDF8)";
const SKY_LIME = "linear-gradient(135deg, #38BDF8, #DEFF9A)";
const VIEWPORT = { once: true, margin: "-60px" } as const;

interface PlanDef {
  plan: BillingPlan;
  name: string;
  /** Kurzer Ein-Zeiler unter dem Namen - hilft schnell einzuordnen, fuer wen
   *  der Plan gedacht ist, bevor man die Feature-Liste liest. */
  blurb: string;
  icon: "rocket" | "growth" | "crown";
  /** Monatspreis bei monatlicher Abrechnung. */
  monthlyPrice: number;
  /** Gesamtpreis bei JÄHRLICHER Abrechnung (nicht der Monatsanteil - der wird
   *  daraus berechnet). Entspricht bei allen drei Plänen exakt dem 10-fachen
   *  Monatspreis ("2 Monate gratis"). */
  yearlyTotal: number;
  courseLimit: string;
  features: readonly string[];
  highlighted?: boolean;
}

const PLAN_ICONS = { rocket: Rocket, growth: TrendingUp, crown: Crown } as const;

const PLANS: readonly PlanDef[] = [
  {
    plan: "starter",
    name: "Starter",
    blurb: "Für den Einstieg in skill-basierte Leads",
    icon: "rocket",
    monthlyPrice: 199,
    yearlyTotal: 1990,
    courseLimit: "bis 200 Kurse",
    features: ["Skill-Gap-Matching", "Basis-Dashboard", "E-Mail-Support"],
  },
  {
    plan: "growth",
    name: "Growth",
    blurb: "Für wachsende Bildungsträger",
    icon: "growth",
    monthlyPrice: 399,
    yearlyTotal: 3990,
    courseLimit: "bis 500 Kurse",
    features: ["Alles aus Starter", "Erweiterte Auswertungen", "Priorisierter Support"],
    highlighted: true,
  },
  {
    plan: "professional",
    name: "Professional",
    blurb: "Für große Träger & Netzwerke",
    icon: "crown",
    monthlyPrice: 699,
    yearlyTotal: 6990,
    courseLimit: "bis 2.500 Kurse",
    features: ["Alles aus Growth", "White-Label-Option", "Persönlicher Ansprechpartner"],
  },
];

function formatPrice(value: number): string {
  return `€${value.toLocaleString("de-DE")}`;
}

const AFTER_PURCHASE_STEPS: { title: string; desc: string; icon: string }[] = [
  { title: "Plan wählen & bezahlen", desc: "Sicher per Stripe Checkout – Kreditkarte oder SEPA.", icon: "target" },
  { title: "Zugang wird automatisch erstellt", desc: "Tenant + API-Key entstehen direkt nach bestätigter Zahlung.", icon: "rocket" },
  { title: "Sofort einloggen & starten", desc: "Mit der gerade vergebenen E-Mail-Adresse und dem Passwort direkt bei ORBIT anmelden.", icon: "grad" },
];

function useAnims() {
  const reduce = useReducedMotion() ?? false;
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } };
  const fadeUp: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 20 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } } };
  return { container, fadeUp };
}

/**
 * Gemeinsamer Monatlich/Jaehrlich-Umschalter fuer alle drei Karten, als
 * animierter Pill-Switch (gleitender Hintergrund statt zwei separater
 * Buttons) - fuehlt sich hochwertiger/dynamischer an als ein einfacher
 * Button-Wechsel.
 */
function BillingToggle({ value, onChange }: { value: BillingInterval; onChange: (v: BillingInterval) => void }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <div className="relative inline-grid grid-cols-2 p-1 rounded-full bg-white border border-[#E3EBF5] shadow-sm w-[280px] sm:w-[300px]">
      <motion.div
        className="absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full"
        style={{ background: NAVY_SKY }}
        animate={{ x: value === "monthly" ? 0 : "100%" }}
        transition={{ type: reduce ? "tween" : "spring", stiffness: 420, damping: 34, duration: reduce ? 0 : undefined }}
      />
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={`relative z-10 px-4 py-2.5 rounded-full text-sm font-arimo font-bold transition-colors ${
          value === "monthly" ? "text-white" : "text-[#55637A] hover:text-[#0F1E34]"
        }`}
      >
        Monatlich
      </button>
      <button
        type="button"
        onClick={() => onChange("yearly")}
        className={`relative z-10 px-4 py-2.5 rounded-full text-sm font-arimo font-bold transition-colors inline-flex items-center justify-center gap-1.5 ${
          value === "yearly" ? "text-white" : "text-[#55637A] hover:text-[#0F1E34]"
        }`}
      >
        Jährlich
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap"
          style={{
            background: value === "yearly" ? "rgba(255,255,255,0.22)" : "rgba(56,189,248,0.12)",
            color: value === "yearly" ? "#fff" : "#38BDF8",
          }}
        >
          2 Monate gratis
        </span>
      </button>
    </div>
  );
}

/**
 * "Direktkauf"-Preiskarten fuer ORBIT - bewusst direkt unter der Produkt-Demo
 * platziert (siehe TabBContent in B2BTabs.tsx): wer sich gerade das Mockup
 * angesehen hat, soll die Kaufoption sehen, SOLANGE das Interesse hoch ist,
 * statt sich erst durch Segmente/Prozess/FAQ scrollen zu muessen. Ergaenzt
 * (ersetzt NICHT) den "Erstgespräch"-Weg weiter unten - fuer alle, die
 * groessere/individuelle Konditionen wollen.
 *
 * Visuelles Update: pro Plan ein eigenes Icon (Rocket/TrendingUp/Crown) +
 * Kurzbeschreibung, groessere/klarere Preis-Typo, farbige Check-Kreise statt
 * einfacher Haekchen, die "Beliebteste Wahl"-Karte leicht hervorgehoben
 * (Skalierung + Verlauf + staerkerer Schatten) und ein animierter
 * Pill-Umschalter (BillingToggle) statt zwei separater Buttons - insgesamt
 * naeher an gaengigen SaaS-Preisseiten (Stripe/Linear-Stil).
 *
 * Monatlich/Jaehrlich bleibt EIN gemeinsamer Umschalter fuer alle drei
 * Karten, animiert beim Wechsel (AnimatePresence), und der gewaehlte
 * Rhythmus wird ans Formular durchgereicht (initialInterval-Prop an
 * DirectPurchaseForm), damit niemand im Modal nochmal von vorn waehlen muss.
 *
 * Preise (Stand: von Quentin bestaetigt): Starter 199 €/Monat (1.990 €/Jahr),
 * Growth 399 €/Monat (3.990 €/Jahr), Professional 699 €/Monat (6.990 €/Jahr).
 * Bei allen drei Plaenen entspricht der Jahrespreis exakt dem 10-fachen
 * Monatspreis - passt exakt zur "2 Monate gratis"-Aussage im Umschalter.
 * ANNAHME: Preise sind Netto-Preise (zzgl. MwSt.), wie im B2B-SaaS-Bereich
 * ueblich - bitte kurz bestaetigen, falls das nicht stimmt (dann muss der
 * "zzgl. MwSt."-Hinweis entfernt/angepasst werden). Dieselben Zahlen sind
 * jetzt auch als "offers" im ORBIT-JSON-LD in index.html hinterlegt.
 */
export function PricingSection() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [openPlan, setOpenPlan] = useState<BillingPlan | null>(null);
  const { container, fadeUp } = useAnims();

  return (
    <div id="orbit-pricing">
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-[#DEFF9A]/40 bg-[#DEFF9A]/5">
          <Sparkles className="w-3.5 h-3.5 text-[#0F1E34]" aria-hidden="true" />
          <span className="font-arimo text-xs font-bold text-[#0F1E34] uppercase tracking-wide">Early-Access-Konditionen</span>
        </div>
        <h3 className="font-poppins font-bold text-xl sm:text-2xl text-[#0F1E34] mb-2">ORBIT direkt sichern</h3>
        <p className="font-arimo text-[#55637A] max-w-2xl mx-auto leading-relaxed mb-7">
          Sie wissen bereits, dass ORBIT zu Ihnen passt? Wählen Sie direkt einen Plan – Zugang inklusive
          API-Key erhalten Sie sofort nach der Zahlung, ganz ohne Erstgespräch.
        </p>

        <div className="flex justify-center">
          <BillingToggle value={billingInterval} onChange={setBillingInterval} />
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid md:grid-cols-3 gap-6 md:items-start">
        {PLANS.map((p) => {
          const yearlyPerMonth = Math.round(p.yearlyTotal / 12);
          const price = billingInterval === "monthly" ? p.monthlyPrice : yearlyPerMonth;
          const Icon = PLAN_ICONS[p.icon];
          return (
            <motion.div
              key={p.plan}
              variants={fadeUp}
              className={`group relative rounded-3xl p-7 sm:p-8 flex flex-col transition-shadow duration-300 ${
                p.highlighted
                  ? "border-2 shadow-xl shadow-[#38BDF8]/15 md:scale-[1.04] z-10"
                  : "border border-[#E3EBF5] bg-white hover:shadow-lg hover:border-[#38BDF8]/30"
              }`}
              style={
                p.highlighted
                  ? { borderColor: "#38BDF8", background: "linear-gradient(180deg, rgba(56,189,248,0.07), #ffffff 45%)" }
                  : undefined
              }
            >
              {p.highlighted && (
                <span
                  className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-[11px] font-arimo font-bold text-[#0A192F] shadow-md"
                  style={{ background: SKY_LIME }}
                >
                  <Sparkles className="w-3 h-3" aria-hidden="true" />
                  Beliebteste Wahl
                </span>
              )}

              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                style={
                  p.highlighted
                    ? { background: SKY_LIME }
                    : { background: "linear-gradient(135deg, rgba(10,25,47,0.06), rgba(56,189,248,0.10))" }
                }
              >
                <Icon className={`w-6 h-6 ${p.highlighted ? "text-[#0A192F]" : "text-[#38BDF8]"}`} aria-hidden="true" />
              </div>

              <h4 className="font-poppins font-black text-2xl text-[#0F1E34] mb-1">{p.name}</h4>
              <p className="font-arimo text-sm text-[#55637A] mb-0.5">{p.blurb}</p>
              <p className="font-arimo text-xs text-[#94a3b8] mb-5">{p.courseLimit}</p>

              <div className="mb-6 min-h-[64px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={billingInterval}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-poppins font-black text-4xl text-[#0F1E34] tracking-tight">{formatPrice(price)}</span>
                      <span className="font-arimo text-sm text-[#55637A]">/ Monat</span>
                    </div>
                    {billingInterval === "yearly" ? (
                      <p className="font-arimo text-[11px] text-[#55637A] mt-1">
                        {formatPrice(p.yearlyTotal)} pro Jahr{" "}
                        <span className="text-[#94a3b8] line-through">{formatPrice(p.monthlyPrice * 12)}</span>{" "}
                        <span className="font-bold text-[#38BDF8]">2 Monate gratis</span> · zzgl. MwSt.
                      </p>
                    ) : (
                      <p className="font-arimo text-[11px] text-[#94a3b8] mt-1">monatlich kündbar · zzgl. MwSt.</p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <ul className="space-y-3 mb-7 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <span
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: p.highlighted ? "rgba(56,189,248,0.16)" : "rgba(15,30,52,0.05)" }}
                    >
                      <Check className="w-3 h-3 text-[#38BDF8]" aria-hidden="true" />
                    </span>
                    <span className="font-arimo text-sm text-[#0F1E34] leading-snug">{f}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => setOpenPlan(p.plan)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl font-arimo font-bold text-sm b2b-focus-ring transition-all hover:-translate-y-0.5"
                style={
                  p.highlighted
                    ? { background: NAVY_SKY, color: "#fff", boxShadow: "0 10px 24px -8px rgba(56,189,248,0.5)" }
                    : { border: "1px solid #E3EBF5", color: "#0F1E34" }
                }
              >
                Jetzt kaufen
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-9">
        <span className="inline-flex items-center gap-1.5 font-arimo text-xs text-[#55637A]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />DSGVO-konform, Server in der EU
        </span>
        <span className="inline-flex items-center gap-1.5 font-arimo text-xs text-[#55637A]">
          <Zap className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />Zugang in Minuten, nicht Tagen
        </span>
        <span className="inline-flex items-center gap-1.5 font-arimo text-xs text-[#55637A]">
          <Check className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />Monatlich kündbar
        </span>
      </motion.div>

      {/* Kurzer Prozess "Nach dem Kauf" - baut Vertrauen auf, BEVOR bezahlt wird */}
      <div className="mt-14">
        <motion.h4 variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="font-poppins font-bold text-lg text-[#0F1E34] mb-1 text-center">
          So geht&apos;s nach dem Kauf
        </motion.h4>
        <motion.p variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="font-arimo text-sm text-[#55637A] text-center mb-2 max-w-xl mx-auto">
          Kein Warten auf ein Onboarding-Gespräch – der Zugang steht sofort.
        </motion.p>
        <ProcessRail steps={AFTER_PURCHASE_STEPS} />
      </div>

      {openPlan && (
        <div
          onClick={() => setOpenPlan(null)}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{ background: "rgba(10,25,47,0.6)" }}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8">
            <DirectPurchaseForm plan={openPlan} initialInterval={billingInterval} onClose={() => setOpenPlan(null)} />
          </div>
        </div>
      )}
    </div>
  );
}