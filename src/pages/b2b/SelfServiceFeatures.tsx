import { motion, useReducedMotion, type Variants } from "framer-motion";
import { Zap, KeyRound, Settings, Gift } from "lucide-react";
import { b2bContent } from "./content";

const VIEWPORT = { once: true, margin: "-60px" } as const;

const iconMap: Record<string, typeof Zap> = {
  bolt: Zap,
  key: KeyRound,
  settings: Settings,
  gift: Gift,
};

function useAnims() {
  const reduce = useReducedMotion() ?? false;
  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } };
  const fadeUp: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 20 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } } };
  return { container, fadeUp };
}

/**
 * NEU: kurze Uebersicht der Selbstbedienungs-Faehigkeiten, die es bisher
 * nirgends auf der Seite zu lesen gab (Direktkauf, automatische
 * API-Bereitstellung, Kundenportal, Trial) - Inhalt kommt aus
 * b2bContent.tabs.tabB.selfService (content.ts), damit dieselbe
 * Formulierung auch in den strukturierten Daten (index.html) und in
 * llms.txt wiederverwendet werden kann.
 */
export function SelfServiceFeatures() {
  const { selfService } = b2bContent.tabs.tabB;
  const { container, fadeUp } = useAnims();

  return (
    <div>
      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-8">
        <h3 className="font-poppins font-bold text-xl sm:text-2xl text-[#0F1E34] mb-2">{selfService.title}</h3>
        <p className="font-arimo text-[#55637A] max-w-2xl mx-auto leading-relaxed">{selfService.subtitle}</p>
      </motion.div>

      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {selfService.items.map((item) => {
          const Icon = iconMap[item.icon] ?? Zap;
          return (
            <motion.div key={item.title} variants={fadeUp} className="rounded-2xl p-5 bg-white border border-[#E3EBF5] hover:shadow-lg hover:border-[#38BDF8]/40 transition-all">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: "linear-gradient(135deg, rgba(56,189,248,0.10), rgba(222,255,154,0.10))" }}>
                <Icon className="w-5 h-5 text-[#38BDF8]" aria-hidden="true" />
              </div>
              <h4 className="font-poppins font-bold text-sm text-[#0F1E34] mb-1.5">{item.title}</h4>
              <p className="font-arimo text-xs text-[#55637A] leading-relaxed">{item.desc}</p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}