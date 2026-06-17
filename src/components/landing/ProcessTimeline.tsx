import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Target, Briefcase, ArrowRight, Check, ChevronDown,
  TrendingUp, Map, Award, GraduationCap, Radio, Sparkles,
} from 'lucide-react';

const ACCENT = '#66c0b6';
const ACCENT2 = '#30E3CA';
const GOLD = '#fbbf24';

/* ───────────────────────── Top-level stations ───────────────────────── */

type StationId = 'wizard' | 'check' | 'academy' | 'management';

const stations: {
  id: StationId;
  icon: typeof FileText;
  eyebrow: string;
  title: string;
  sub: string;
  ctaHref: string;
  isAcademy?: boolean;
}[] = [
  {
    id: 'wizard',
    icon: FileText,
    eyebrow: 'Station 1',
    title: 'Lebenslauf erstellen',
    sub: 'Vom leeren Blatt zum fertigen CV',
    ctaHref: '/cv-wizard',
  },
  {
    id: 'check',
    icon: Target,
    eyebrow: 'Station 2',
    title: 'CV-Check',
    sub: 'ATS-Score in unter einer Minute',
    ctaHref: '/cv-check',
  },
  {
    id: 'academy',
    icon: GraduationCap,
    eyebrow: 'Station 3',
    title: 'Career Academy',
    sub: 'Skill-Gaps schließen, Zertifikat sichern',
    ctaHref: '/career-vision',
    isAcademy: true,
  },
  {
    id: 'management',
    icon: Briefcase,
    eyebrow: 'Station 4',
    title: 'Bewerbungsmanagement',
    sub: 'Jede Bewerbung im Blick',
    ctaHref: '/dashboard',
  },
];

/* ───────────────────────── Campus sub-modules ───────────────────────── */

type CampusId = 'skillgap' | 'lernpfade' | 'zertifikate';

const campusModules: {
  id: CampusId;
  icon: typeof TrendingUp;
  code: string;
  title: string;
  sub: string;
  bullets: string[];
  color: string;
}[] = [
  {
    id: 'skillgap',
    icon: TrendingUp,
    code: 'Diagnostik',
    title: 'Skill-Gap-Analyse',
    sub: 'Erkenne exakt, was dich vom Zieljob trennt',
    bullets: [
      'KI vergleicht dein Profil mit echten Stellenanforderungen.',
      'Lücken werden nach Wirkung sortiert – Top-Hebel zuerst.',
      'ESCO-validiert nach europäischem Qualifikationsrahmen.',
    ],
    color: '#f97316',
  },
  {
    id: 'lernpfade',
    icon: Map,
    code: 'Studio',
    title: 'Lernpfade',
    sub: 'Strukturierte Module statt zielloses Suchen',
    bullets: [
      'Für jede Lücke ein konkreter, personalisierter Lernpfad.',
      'Fortschritt live verfolgbar – immer klar, was als Nächstes kommt.',
      'Aufgebaut wie ein echter Online-Campus, in deinem Tempo.',
    ],
    color: ACCENT2,
  },
  {
    id: 'zertifikate',
    icon: Award,
    code: 'Prüfungszentrum',
    title: 'Zertifikate',
    sub: 'Dein Abschluss, einsetzbar in jeder Bewerbung',
    bullets: [
      'Abschlussprüfung nach jedem Lernpfad.',
      'Offizielles, personalisiertes PDF-Zertifikat.',
      'Direkt im Lebenslauf und auf LinkedIn nutzbar.',
    ],
    color: GOLD,
  },
];

/* ───────────────────────── Small visuals ───────────────────────── */

function MiniRing({ pct, color }: { pct: number; color: string }) {
  const r = 19;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative w-12 h-12 flex-shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
        <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
        <motion.circle
          cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: c * (1 - pct / 100) }}
          viewport={{ once: true }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-[10px] font-black" style={{ color }}>{pct}%</span>
      </div>
    </div>
  );
}

function CampusCard({
  module, index,
}: { module: typeof campusModules[number]; index: number }) {
  const Icon = module.icon;
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.45 }}
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))', border: '1px solid rgba(255,255,255,0.09)' }}
    >
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg,${module.color},transparent)` }} />
      <div className="p-5 sm:p-6 flex flex-col flex-1 gap-4">
        <div className="flex items-center justify-between">
          <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: `${module.color}18`, border: `1px solid ${module.color}35` }}>
            <Icon className="w-5 h-5" style={{ color: module.color }} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full" style={{ color: module.color, background: `${module.color}14`, border: `1px solid ${module.color}30` }}>
            {module.code}
          </span>
        </div>

        <div>
          <h4 className="text-lg font-bold text-white leading-tight">{module.title}</h4>
          <p className="text-sm text-white/50 mt-1">{module.sub}</p>
        </div>

        <ul className="space-y-2.5 flex-1">
          {module.bullets.map((b, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <div className="mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: `${module.color}1c`, border: `1px solid ${module.color}40` }}>
                <Check className="w-2.5 h-2.5" style={{ color: module.color }} />
              </div>
              <p className="text-[13px] text-white/70 leading-relaxed">{b}</p>
            </li>
          ))}
        </ul>

        {module.id === 'skillgap' && (
          <div className="flex items-center gap-3 pt-1">
            <MiniRing pct={30} color={module.color} />
            <div className="flex-1">
              <p className="text-[11px] text-white/40">Job-Readiness Beispiel</p>
              <div className="flex gap-1 mt-1.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} className="flex-1 h-1.5 rounded-full" style={{ background: j < 2 ? module.color : 'rgba(255,255,255,0.08)' }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {module.id === 'lernpfade' && (
          <div className="space-y-1.5 pt-1">
            {[{ t: 'Modul 1', done: true }, { t: 'Modul 2', done: true }, { t: 'Modul 3', done: false }].map((m, i) => (
              <div key={i} className="flex items-center gap-2 text-[11px]">
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: m.done ? 'rgba(34,197,94,0.18)' : 'rgba(255,255,255,0.06)', border: `1px solid ${m.done ? '#22c55e' : 'rgba(255,255,255,0.15)'}` }}>
                  {m.done && <Check className="w-2 h-2 text-emerald-400" />}
                </div>
                <span className={m.done ? 'text-white/35 line-through' : 'text-white/60'}>{m.t}</span>
              </div>
            ))}
          </div>
        )}

        {module.id === 'zertifikate' && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl pt-1" style={{ background: `${module.color}10`, border: `1px solid ${module.color}28` }}>
            <Award className="w-4 h-4 flex-shrink-0" style={{ color: module.color }} />
            <span className="text-[11px] font-semibold" style={{ color: `${module.color}cc` }}>IHK-nahes Prüfungsformat</span>
          </div>
        )}

        <button
          onClick={() => navigate('/career-vision')}
          className="mt-1 inline-flex items-center gap-1.5 text-[13px] font-semibold transition-colors group"
          style={{ color: module.color }}
        >
          Mehr erfahren
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
}

/* ───────────────────────── Station card ───────────────────────── */

function StationCard({
  station, isOpen, onToggle, index,
}: {
  station: typeof stations[number];
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  const navigate = useNavigate();
  const Icon = station.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.5 }}
      className={`relative rounded-3xl overflow-hidden ${station.isAcademy ? 'sm:col-span-2 lg:col-span-1' : ''}`}
      style={{
        background: station.isAcademy
          ? 'linear-gradient(150deg,rgba(48,227,202,0.10) 0%,rgba(10,16,22,0.97) 60%)'
          : 'linear-gradient(150deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))',
        border: station.isAcademy ? '1px solid rgba(48,227,202,0.35)' : '1px solid rgba(255,255,255,0.09)',
        boxShadow: station.isAcademy ? '0 0 0 1px rgba(48,227,202,0.08), 0 20px 60px -20px rgba(48,227,202,0.25)' : undefined,
      }}
    >
      {station.isAcademy && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl"
            style={{ background: ACCENT2 }}
            animate={{ opacity: [0.12, 0.22, 0.12] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
      )}

      <div className="relative z-10 p-6 sm:p-7">
        <div className="flex items-start justify-between gap-3 mb-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: station.isAcademy ? `linear-gradient(135deg,${ACCENT},${ACCENT2})` : 'rgba(255,255,255,0.07)', border: station.isAcademy ? 'none' : '1px solid rgba(255,255,255,0.12)' }}
          >
            <Icon className={`w-6 h-6 ${station.isAcademy ? 'text-black' : 'text-white/70'}`} />
          </div>

          {station.isAcademy ? (
            <motion.div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.35)' }}
              animate={{ boxShadow: ['0 0 0px rgba(239,68,68,0.0)', '0 0 14px rgba(239,68,68,0.35)', '0 0 0px rgba(239,68,68,0.0)'] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <motion.span
                className="w-1.5 h-1.5 rounded-full bg-red-500"
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              />
              <span className="text-[10px] font-black uppercase tracking-widest text-red-400">Jetzt live</span>
            </motion.div>
          ) : (
            <span className="text-[10px] font-black uppercase tracking-widest text-white/30 pt-1.5">{station.eyebrow}</span>
          )}
        </div>

        <h3 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-1.5">{station.title}</h3>
        <p className="text-sm text-white/50 mb-6">{station.sub}</p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(station.ctaHref)}
            className={`flex-1 inline-flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all ${
              station.isAcademy ? 'text-black' : 'text-white/85 border border-white/15 hover:bg-white/8'
            }`}
            style={station.isAcademy ? { background: `linear-gradient(135deg,${ACCENT},${ACCENT2})` } : {}}
          >
            {station.isAcademy ? 'Campus betreten' : 'Loslegen'}
            <ArrowRight className="w-4 h-4" />
          </button>

          {station.isAcademy && (
            <button
              onClick={onToggle}
              aria-expanded={isOpen}
              aria-label="Career Academy Bereiche anzeigen"
              className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)' }}
            >
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }}>
                <ChevronDown className="w-4 h-4 text-white/60" />
              </motion.div>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ───────────────────────── Main section ───────────────────────── */

export function ProcessTimeline() {
  const [campusOpen, setCampusOpen] = useState(true);

  return (
    <section id="prozess" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-72 h-72 rounded-full blur-3xl opacity-[0.05]" style={{ background: ACCENT2 }} />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-4" style={{ background: 'rgba(48,227,202,0.08)', border: '1px solid rgba(48,227,202,0.22)' }}>
            <Radio className="w-3.5 h-3.5 text-[#30E3CA]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#30E3CA]/80">Eine Plattform · vier Stationen</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3">
            So funktioniert&apos;s
          </h2>
          <p className="text-lg sm:text-xl text-white/60 max-w-2xl mx-auto">
            Vom ersten CV bis zum nächsten Karrieresprung – alles an einem Ort.
          </p>
        </motion.div>

        {/* Station grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stations.map((station, i) => (
            <StationCard
              key={station.id}
              station={station}
              index={i}
              isOpen={campusOpen}
              onToggle={() => setCampusOpen((v) => !v)}
            />
          ))}
        </div>

        {/* Career Academy campus expansion */}
        <AnimatePresence>
          {campusOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div
                className="mt-6 rounded-3xl p-6 sm:p-9 relative overflow-hidden"
                style={{ background: 'linear-gradient(160deg,rgba(48,227,202,0.06) 0%,rgba(8,12,18,0.96) 55%)', border: '1px solid rgba(48,227,202,0.18)' }}
              >
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-[0.08] pointer-events-none" style={{ background: ACCENT2 }} />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-8">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <GraduationCap className="w-4 h-4 text-[#30E3CA]" />
                      <span className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA]/70">Der Career Academy Campus</span>
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
                      Drei Fakultäten, ein Ziel: dein nächster Karriereschritt
                    </h3>
                  </div>
                  <div className="flex items-center gap-1.5 text-[12px] text-white/40 flex-shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-[#30E3CA]/70" />
                    Neu seit diesem Monat
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                  {campusModules.map((mod, i) => (
                    <CampusCard key={mod.id} module={mod} index={i} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/40 text-sm mt-12"
        >
          Alle Stationen führen zu einem ATS-optimierten Lebenslauf und einem klaren Plan für deinen Traumjob.
        </motion.p>
      </div>
    </section>
  );
}