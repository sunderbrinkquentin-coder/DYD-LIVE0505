import { motion } from 'framer-motion';
import {
  Layers,
  Brain,
  Shield,
  Flag,
  GraduationCap,
  CheckCircle2,
  Award,
  Lock,
  Sparkles,
  Mail,
  Phone,
  Linkedin,
} from 'lucide-react';
import { b2bContent } from './content';

const iconMap: Record<string, typeof Layers> = {
  layers: Layers,
  brain: Brain,
  shield: Shield,
  flag: Flag,
};

/* ─── Plattform-Überblick ─── */

export function PlatformOverviewSection() {
  const { platformOverview } = b2bContent;

  return (
    <section className="relative bg-[#0A192F] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4 border border-[#38BDF8]/30 bg-[#38BDF8]/5">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="font-arimo text-xs font-bold text-[#38BDF8] uppercase tracking-wide">
              Plattform-Überblick
            </span>
          </div>
          <h2 className="font-poppins font-black text-3xl sm:text-4xl text-white mb-4" style={{ letterSpacing: '-0.03em' }}>
            {platformOverview.title}
          </h2>
          <p className="font-arimo text-white/55 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            {platformOverview.subtitle}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {platformOverview.features.map((feat, i) => {
            const Icon = iconMap[feat.icon] ?? Layers;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="rounded-2xl p-6 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] transition-colors"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.12), rgba(222,255,154,0.08))' }}
                >
                  <Icon className="w-6 h-6 text-[#38BDF8]" />
                </div>
                <h3 className="font-poppins font-bold text-base text-white mb-2">{feat.title}</h3>
                <p className="font-arimo text-sm text-white/50 leading-relaxed">{feat.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── Vertrauen & Glaubwürdigkeit ─── */

export function TrustSection({ onContactClick }: { onContactClick: () => void }) {
  const { trust } = b2bContent;
  const badgeIcons: Record<string, typeof Lock> = {
    DSGVO: Lock,
    ESCO: Layers,
    'Made in Germany': Flag,
  };

  return (
    <section className="relative bg-[#F6F9FD] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="font-poppins font-black text-3xl sm:text-4xl text-[#0F1E34] mb-4" style={{ letterSpacing: '-0.03em' }}>
            {trust.title}
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Partner */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-8 bg-white border border-[#E3EBF5] hover:shadow-lg transition-shadow"
          >
            <div className="flex items-center gap-2 mb-4">
              <GraduationCap className="w-5 h-5 text-[#38BDF8]" />
              <span className="font-arimo text-xs font-bold uppercase tracking-wide text-[#55637A]">
                {trust.partner.label}
              </span>
            </div>
            <h3 className="font-poppins font-black text-2xl text-[#0F1E34] mb-3">
              {trust.partner.name}
            </h3>
            <p className="font-arimo text-[#55637A] leading-relaxed">{trust.partner.desc}</p>
          </motion.div>

          {/* Founder */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-8 bg-white border border-[#E3EBF5] hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start gap-5">
              {/* Real photo */}
              <img
                src={trust.founder.photoSrc}
                alt={trust.founder.photoAlt}
                className="flex-shrink-0 w-20 h-20 rounded-2xl object-cover"
                style={{ border: '2px solid #38BDF8' }}
              />
              <div className="flex-1">
                <span className="font-arimo text-xs font-bold uppercase tracking-wide text-[#55637A]">
                  {trust.founder.label}
                </span>
                <h3 className="font-poppins font-black text-xl text-[#0F1E34] mb-2">
                  {trust.founder.name}
                </h3>
                <ul className="space-y-1 mb-3">
                  {trust.founder.roles.map((role, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#38BDF8] flex-shrink-0" />
                      <span className="font-arimo text-sm text-[#55637A]">{role}</span>
                    </li>
                  ))}
                </ul>
                {/* Contact details */}
                <div className="flex flex-wrap gap-3 pt-2 border-t border-[#E3EBF5]">
                  <a
                    href={`mailto:${trust.founder.email}`}
                    className="inline-flex items-center gap-1.5 font-arimo text-xs text-[#55637A] hover:text-[#38BDF8] transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    {trust.founder.email}
                  </a>
                  <a
                    href={`tel:${trust.founder.phone.replace(/\s/g, '')}`}
                    className="inline-flex items-center gap-1.5 font-arimo text-xs text-[#55637A] hover:text-[#38BDF8] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    {trust.founder.phone}
                  </a>
                  <a
                    href={trust.founder.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 font-arimo text-xs text-[#55637A] hover:text-[#38BDF8] transition-colors"
                  >
                    <Linkedin className="w-3.5 h-3.5" />
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Badges */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-10"
        >
          {trust.badges.map((badge, i) => {
            const Icon = badgeIcons[badge] ?? Award;
            return (
              <div
                key={i}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border-2"
                style={{ borderColor: 'rgba(56,189,248,0.25)', background: 'rgba(56,189,248,0.04)' }}
              >
                <Icon className="w-4 h-4 text-[#38BDF8]" />
                <span className="font-poppins font-bold text-sm text-[#0F1E34]">{badge}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-10"
        >
          <button
            onClick={onContactClick}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition-all hover:shadow-xl hover:shadow-[#DEFF9A]/25 hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)', borderRadius: '16px' }}
          >
            <Mail className="w-4 h-4" />
            Kontakt aufnehmen
          </button>
        </motion.div>
      </div>
    </section>
  );
}
