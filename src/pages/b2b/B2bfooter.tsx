import { motion, useReducedMotion } from 'framer-motion';
import { Mail, Linkedin, ArrowRight } from 'lucide-react';
import { b2bContent } from './content';
import DydLogo from './DydLogo';

const LIME_SKY = 'linear-gradient(135deg, #DEFF9A, #38BDF8)';

type B2BFooterProps = {
  /** Öffnet das Kontakt-Modal (für das CTA-Band). */
  onContact?: () => void;
};

export default function B2BFooter({ onContact }: B2BFooterProps) {
  const reduce = useReducedMotion() ?? false;
  const { footer, finalCta } = b2bContent;
  const imp = footer.impressum;
  const year = new Date().getFullYear();

  return (
    <footer className="relative bg-[#0A192F] text-white">
      {/* CTA-Band */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: reduce ? 0 : 0.5 }}
          className="relative overflow-hidden rounded-3xl p-8 sm:p-12 text-center"
          style={{ background: 'radial-gradient(600px 240px at 50% 0%, rgba(86,212,255,0.25), transparent 70%), linear-gradient(135deg, #0e2748, #123059)' }}
        >
          <h2 className="font-poppins font-black text-2xl sm:text-3xl mb-3" style={{ letterSpacing: '-0.02em' }}>{finalCta.title}</h2>
          <p className="font-arimo text-white/70 max-w-xl mx-auto mb-7 leading-relaxed">{finalCta.subtitle}</p>
          <button
            type="button"
            onClick={onContact}
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:shadow-xl hover:shadow-[#38BDF8]/30 hover:-translate-y-0.5"
            style={{ background: LIME_SKY }}
          >
            {finalCta.cta}<ArrowRight className="w-4 h-4" aria-hidden="true" />
          </button>
        </motion.div>
      </div>

      {/* Footer-Inhalt */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Marke */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <DydLogo variant="white" className="h-9 w-9" />
              <span className="flex flex-col leading-none">
                <span className="font-poppins font-black text-lg tracking-tight" style={{ letterSpacing: '-0.04em' }}>DYD</span>
                <span className="text-[9px] font-arimo font-semibold text-[#66c0b6]">Decide Your Dream</span>
              </span>
            </div>
            <p className="font-arimo text-sm text-white/55 max-w-sm leading-relaxed mb-5">{footer.blurb}</p>
            <div className="flex gap-2.5">
              <a href={`mailto:${footer.email}`} className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-arimo font-bold text-white/80 border border-white/15 hover:border-[#38BDF8]/50 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" /> E-Mail
              </a>
              <a href={footer.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-arimo font-bold text-white/80 border border-white/15 hover:border-[#38BDF8]/50 hover:text-white transition-colors">
                <Linkedin className="w-4 h-4 text-[#38BDF8]" aria-hidden="true" /> LinkedIn
              </a>
            </div>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-poppins font-bold text-sm mb-4">Navigation</h3>
            <ul className="space-y-2.5 font-arimo text-sm text-white/55">
              <li><a href={footer.applicantUrl} className="hover:text-white transition-colors">Für Bewerber</a></li>
              <li><a href="#/business" className="hover:text-white transition-colors">Für Business</a></li>
              <li><a href="#b2b-tabs" className="hover:text-white transition-colors">Lösungen</a></li>
              <li><button type="button" onClick={onContact} className="hover:text-white transition-colors">Kontakt</button></li>
            </ul>
          </div>

          {/* Impressum */}
          <div>
            <h3 className="font-poppins font-bold text-sm mb-4">{imp.heading}</h3>
            <div className="font-arimo text-sm text-white/55 space-y-0.5 leading-relaxed">
              <p className="text-white/75 font-semibold">{imp.provider}</p>
              <p>{imp.owner}</p>
              {imp.addressLines.map((line) => (<p key={line}>{line}</p>))}
              <p className="pt-1"><a href={`mailto:${imp.email}`} className="hover:text-white transition-colors">{imp.email}</a></p>
              <p className="pt-2 text-xs text-white/40">{imp.responsible}</p>
            </div>
          </div>
        </div>

        {/* Legal-Bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-arimo text-xs text-white/40">© {year} DYD – Decide Your Dream. Standardisiert nach EU-ESCO · Made in Germany.</p>
          <div className="flex gap-5 font-arimo text-xs text-white/50">
            {footer.legalLinks.map((l) => (
              <a key={l.href} href={l.href} className="hover:text-white transition-colors">{l.label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}