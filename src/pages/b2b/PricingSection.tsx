import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion, type Variants } from "framer-motion";
import { Check, Sparkles, ShieldCheck, Zap } from "lucide-react";
import { DirectPurchaseForm } from "../../components/DirectPurchaseForm";
import ProcessRail from "./ProcessRail";
import type { BillingPlan, BillingInterval } from "../../lib/orbitDirectCheckout";

const NAVY_SKY = "linear-gradient(135deg, #0A192F, #38BDF8)";
const SKY_LIME = "linear-gradient(135deg, #38BDF8, #DEFF9A)";
const VIEWPORT = { once: true, margin: "-60px" } as const;

interface PlanDef {
  plan: BillingPlan;
  name: string;
  /** TODO (Quentin): Platzhalter - echte Beträge aus Stripe eintragen. */
  monthlyPrice: number | null;
  yearlyPricePerMonth: number | null;
  courseLimit: string;
  features: readonly string[];
  highlighted?: boolean;
}

const PLANS: readonly PlanDef[] = [
  {
    plan: "starter",
    name: "Starter",
    monthlyPrice: null,
    yearlyPricePerMonth: null,
    courseLimit: "bis 200 Kurse",
    features: ["Skill-Gap-Matching", "Basis-Dashboard", "E-Mail-Support"],
  },
  {
    plan: "growth",
    name: "Growth",
    monthlyPrice: null,
    yearlyPricePerMonth: null,
    courseLimit: "bis 500 Kurse",
    features: ["Alles aus Starter", "Erweiterte Auswertungen", "Priorisierter Support"],
    highlighted: true,
  },
  {
    plan: "professional",
    name: "Professional",
    monthlyPrice: null,
    yearlyPricePerMonth: null,
    courseLimit: "bis 2.500 Kurse",
    features: ["Alles aus Growth", "White-Label-Option", "Persönlicher Ansprechpartner"],
  },
];

function formatPrice(value: number | null): string {
  if (value === null) return "€ –";
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
 * "Direktkauf"-Preiskarten fuer ORBIT - bewusst direkt unter der Produkt-Demo
 * platziert (siehe TabBContent in B2BTabs.tsx): wer sich gerade das Mockup
 * angesehen hat, soll die Kaufoption sehen, SOLANGE das Interesse hoch ist,
 * statt sich erst durch Segmente/Prozess/FAQ scrollen zu muessen. Ergaenzt
 * (ersetzt NICHT) den "Erstgespräch"-Weg weiter unten - fuer alle, die
 * groessere/individuelle Konditionen wollen.
 *
 * Monatlich/Jaehrlich ist EIN gemeinsamer Umschalter fuer alle drei Karten
 * (nicht mehr pro Karte/Modal einzeln) - fuehlt sich dadurch dynamischer an,
 * animiert beim Wechsel (AnimatePresence), und der gewaehlte Rhythmus wird
 * ans Formular durchgereicht (initialInterval-Prop an DirectPurchaseForm),
 * damit niemand im Modal nochmal von vorn waehlen muss.
 *
 * ACHTUNG: monthlyPrice/yearlyPricePerMonth sind Platzhalter (null -> "€ –"),
 * siehe PLANS oben - bitte durch die echten Beträge ersetzen, bevor das
 * live geht (bewusst KEINE erfundenen Zahlen in die JSON-LD-Preisangaben
 * in index.html uebernommen, aus demselben Grund).
 */
export function PricingSection() {
  const [billingInterval, setBillingInterval] = useState<BillingInterval>("monthly");
  const [openPlan, setOpenPlan] = useState<BillingPlan | null>(null);
  const { container, fadeUp } = useAnims();

  return (
    <div id="orbit-pricing">
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-[#DEFF9A]/40 bg-[#DEFF9A]/5">
          <Sparkles className="w-3.5 h-3.5 text-[#0F1E34]" aria-hidden="true" />
          <span className="font-arimo text-xs font-bold text-[#0F1E34] uppercase tracking-wide">Early-Access-Konditionen</span>
        </div>
        <h3 className="font-poppins font-bold text-xl sm:text-2xl text-[#0F1E34] mb-2">ORBIT direkt sichern</h3>
        <p className="font-arimo text-[#55637A] max-w-2xl mx-auto leading-relaxed mb-6">
          Sie wissen bereits, dass ORBIT zu Ihnen passt? Wählen Sie direkt einen Plan – Zugang inklusive
          API-Key erhalten Sie sofort nach der Zahlung, ganz ohne Erstgespräch.
        </p>

        {/* Gemeinsamer Umschalter fuer alle drei Karten */}
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white border border-[#E3EBF5] shadow-sm">
          <button
            type="button"
            onClick={() => setBillingInterval("monthly")}
            className={`px-4 py-2 rounded-full text-sm font-arimo font-bold transition ${
              billingInterval === "monthly" ? "text-white" : "text-[#55637A]"
            }`}
            style={billingInterval === "monthly" ? { background: NAVY_SKY } : undefined}
          >
            Monatlich
          </button>
          <button
            type="button"
            onClick={() => setBillingInterval("yearly")}
            className={`px-4 py-2 rounded-full text-sm font-arimo font-bold transition inline-flex items-center gap-1.5 ${
              billingInterval === "yearly" ? "text-white" : "text-[#55637A]"
            }`}
            style={billingInterval === "yearly" ? { background: NAVY_SKY } : undefined}
          >
            Jährlich
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: billingInterval === "yearly" ? "rgba(255,255,255,0.2)" : "rgba(56,189,248,0.12)",
                color: billingInterval === "yearly" ? "#fff" : "#38BDF8",
              }}
            >
              2 Monate gratis
            </span>
          </button>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid md:grid-cols-3 gap-6">
        {PLANS.map((p) => {
          const price = billingInterval === "monthly" ? p.monthlyPrice : p.yearlyPricePerMonth;
          return (
            <motion.div
              key={p.plan}
              variants={fadeUp}
              className={`relative rounded-2xl p-6 sm:p-8 border-2 flex flex-col ${p.highlighted ? "" : "bg-white border-[#E3EBF5]"}`}
              style={p.highlighted ? { borderColor: "#38BDF8", background: "rgba(56,189,248,0.04)" } : undefined}
            >
              {p.highlighted && (
                <span
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-arimo font-bold text-[#0A192F]"
                  style={{ background: SKY_LIME }}
                >
                  Beliebteste Wahl
                </span>
              )}
              <h4 className="font-poppins font-black text-xl text-[#0F1E34] mb-1">{p.name}</h4>
              <p className="font-arimo text-xs text-[#55637A] mb-4">{p.courseLimit}</p>

              <div className="mb-5 h-[52px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={billingInterval}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                  >
                    <span className="font-poppins font-black text-3xl text-[#0F1E34]">{formatPrice(price)}</span>
                    <span className="font-arimo text-sm text-[#55637A]"> / Monat</span>
                    {billingInterval === "yearly" && (
                      <p className="font-arimo text-xs text-[#94a3b8] mt-1">jährliche Abrechnung</p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <ul className="space-y-2.5 mb-6 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#38BDF8] flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="font-arimo text-sm text-[#0F1E34]">{f}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => setOpenPlan(p.plan)}
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-arimo font-bold text-sm b2b-focus-ring transition hover:-translate-y-0.5"
                style={p.highlighted ? { background: NAVY_SKY, color: "#fff" } : { border: "1px solid #E3EBF5", color: "#0F1E34" }}
              >
                Jetzt kaufen
              </button>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-8">
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