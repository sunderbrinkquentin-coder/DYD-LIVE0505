import { useState } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { DirectPurchaseForm } from "../../components/DirectPurchaseForm";
import type { BillingPlan } from "../../lib/orbitDirectCheckout";

const NAVY_SKY = "linear-gradient(135deg, #0A192F, #38BDF8)";
const SKY_LIME = "linear-gradient(135deg, #38BDF8, #DEFF9A)";
const VIEWPORT = { once: true, margin: "-60px" } as const;

interface PlanDef {
  plan: BillingPlan;
  name: string;
  /** TODO (Quentin): Platzhalter - echten Preis aus Stripe eintragen. */
  priceMonthly: string;
  priceYearlyPerMonth: string;
  courseLimit: string;
  features: readonly string[];
  highlighted?: boolean;
}

const PLANS: readonly PlanDef[] = [
  {
    plan: "starter",
    name: "Starter",
    priceMonthly: "€ –",
    priceYearlyPerMonth: "€ –",
    courseLimit: "bis 200 Kurse",
    features: ["Skill-Gap-Matching", "Basis-Dashboard", "E-Mail-Support"],
  },
  {
    plan: "growth",
    name: "Growth",
    priceMonthly: "€ –",
    priceYearlyPerMonth: "€ –",
    courseLimit: "bis 500 Kurse",
    features: ["Alles aus Starter", "Erweiterte Auswertungen", "Priorisierter Support"],
    highlighted: true,
  },
  {
    plan: "professional",
    name: "Professional",
    priceMonthly: "€ –",
    priceYearlyPerMonth: "€ –",
    courseLimit: "bis 2.500 Kurse",
    features: ["Alles aus Growth", "White-Label-Option", "Persönlicher Ansprechpartner"],
  },
];

function useAnims() {
  const reduce = useReducedMotion() ?? false;
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } };
  const fadeUp: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 20 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } } };
  return { container, fadeUp };
}

/**
 * "Direktkauf"-Preiskarten fuer ORBIT: drei Plaene, je ein Modal mit
 * DirectPurchaseForm. Ergaenzt (ersetzt NICHT) den bestehenden
 * "Erstgespräch"-Weg ueber die FAQ/CTA-Buttons in B2BTabs.tsx - fuer
 * Interessent:innen, die direkt kaufen statt erst telefonieren wollen.
 *
 * ACHTUNG: Preise/Feature-Bullets unten sind Platzhalter (siehe PLANS
 * oben) - bitte durch die echten Werte ersetzen, bevor das live geht.
 */
export function PricingSection() {
  const [openPlan, setOpenPlan] = useState<BillingPlan | null>(null);
  const { container, fadeUp } = useAnims();

  return (
    <div id="orbit-pricing">
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-[#38BDF8]/30 bg-[#38BDF8]/5">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
          <span className="font-arimo text-xs font-bold text-[#38BDF8] uppercase tracking-wide">Direkt starten</span>
        </div>
        <h3 className="font-poppins font-bold text-xl sm:text-2xl text-[#0F1E34] mb-2">ORBIT direkt buchen</h3>
        <p className="font-arimo text-[#55637A] max-w-2xl mx-auto leading-relaxed">
          Sie wissen bereits, dass ORBIT zu Ihnen passt? Wählen Sie direkt einen Plan – Zugang inklusive
          API-Key erhalten Sie sofort nach der Zahlung.
        </p>
      </motion.div>

      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid md:grid-cols-3 gap-6">
        {PLANS.map((p) => (
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
            <div className="mb-5">
              <span className="font-poppins font-black text-3xl text-[#0F1E34]">{p.priceMonthly}</span>
              <span className="font-arimo text-sm text-[#55637A]"> / Monat</span>
              <p className="font-arimo text-xs text-[#94a3b8] mt-1">oder {p.priceYearlyPerMonth} / Monat jährlich</p>
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
        ))}
      </motion.div>

      {openPlan && (
        <div
          onClick={() => setOpenPlan(null)}
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          style={{ background: "rgba(10,25,47,0.6)" }}
        >
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-md rounded-2xl bg-white p-6 sm:p-8">
            <DirectPurchaseForm plan={openPlan} onClose={() => setOpenPlan(null)} />
          </div>
        </div>
      )}
    </div>
  );
}