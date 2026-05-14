import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FileText, Target, Briefcase, ArrowRight, Check, ChevronRight, TrendingUp, Map } from 'lucide-react';

const ACCENT = '#66c0b6';
const ACCENT2 = '#30E3CA';

const tabs = [
  { id: 'wizard',     label: 'Der CV-Wizard',       icon: FileText   },
  { id: 'check',      label: 'Der CV-Check',         icon: Target     },
  { id: 'skillgap',   label: 'Skill-Gap-Analyse',    icon: TrendingUp },
  { id: 'lernpfade',  label: 'Lernpfade',            icon: Map        },
  { id: 'management', label: 'Bewerbungsmanagement', icon: Briefcase  },
] as const;

type TabId = (typeof tabs)[number]['id'];

/* ── Visualisations ─────────────────────────────────────── */

function WizardVisual() {
  return (
    <div className="relative h-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xs bg-[#0d1117] border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
      >
        <div className="h-2 w-full" style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})` }} />
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
          <div className="w-10 h-10 rounded-full flex-shrink-0" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }} />
          <div className="space-y-1.5 flex-1">
            {[{ width: '80%' }, { width: '60%' }].map((f, i) => (
              <motion.div key={i} initial={{ width: 0 }} animate={{ width: f.width }} transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }} className="h-2 rounded-full bg-white/20" />
            ))}
          </div>
        </div>
        {['Berufserfahrung', 'Ausbildung', 'Skills'].map((section, si) => (
          <div key={si} className="px-5 py-3 border-b border-white/5">
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>{section}</p>
            <div className="space-y-1.5">
              {[65, 45, 55].slice(0, 2 - (si % 2)).map((w, li) => (
                <motion.div key={li} initial={{ width: 0 }} animate={{ width: `${w + si * 8}%` }} transition={{ delay: 0.6 + si * 0.2 + li * 0.1, duration: 0.5 }} className="h-1.5 rounded-full bg-white/15" />
              ))}
            </div>
          </div>
        ))}
        <div className="px-5 py-3 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: ACCENT }} />
          <span className="text-[11px] text-white/50">Template: Professional</span>
          <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ duration: 2, repeat: Infinity }} className="ml-auto text-[10px] font-medium" style={{ color: ACCENT }}>Live-Vorschau</motion.span>
        </div>
      </motion.div>
    </div>
  );
}

function CheckVisual() {
  const [score, setScore] = useState(38);
  const target = 94;
  useState(() => { const t = setTimeout(() => setScore(target), 600); return () => clearTimeout(t); });
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? ACCENT : score >= 50 ? '#f59e0b' : '#ef4444';
  const criteria = [
    { label: 'ATS-Kompatibilität', score: 96 },
    { label: 'Keywords & Sprache', score: 91 },
    { label: 'Format & Struktur', score: 88 },
    { label: 'Quantifizierung', score: 79 },
  ];
  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 p-4">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="8" />
          <motion.circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} initial={{ strokeDashoffset: circumference }} animate={{ strokeDashoffset: offset }} transition={{ duration: 1.4, delay: 0.5, ease: 'easeOut' }} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span className="text-3xl font-bold text-white" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>{target}</motion.span>
          <span className="text-[11px] text-white/50 -mt-0.5">ATS-Score</span>
        </div>
      </div>
      <div className="w-full max-w-xs space-y-2.5">
        {criteria.map((c, i) => (
          <div key={i} className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span className="text-white/60">{c.label}</span>
              <span style={{ color: ACCENT }} className="font-semibold">{c.score}</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10">
              <motion.div className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})` }} initial={{ width: 0 }} animate={{ width: `${c.score}%` }} transition={{ delay: 0.6 + i * 0.12, duration: 0.7 }} />
            </div>
          </div>
        ))}
      </div>
      <motion.div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden" style={{ zIndex: 0 }}>
        <motion.div className="absolute left-0 right-0 h-0.5 opacity-20" style={{ background: `linear-gradient(90deg, transparent, ${ACCENT}, transparent)` }} animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
      </motion.div>
    </div>
  );
}

function SkillGapVisual() {
  const skills = [
    { name: 'Datenkompetenz',      have: 25, need: 90, severity: 5, color: '#f97316' },
    { name: 'KI-Tools',            have: 40, need: 85, severity: 4, color: ACCENT2  },
    { name: 'Projektmanagement',   have: 70, need: 90, severity: 3, color: ACCENT   },
    { name: 'SQL / Python',        have: 10, need: 75, severity: 5, color: '#f97316' },
    { name: 'Kommunikation',       have: 80, need: 88, severity: 2, color: '#4ade80' },
  ];
  const tierLabels: Record<number, string> = { 5: '🚀 Top-Hebel', 4: '⚡ Hoher Impact', 3: '📈 Aufbau', 2: '✅ Quick Win' };

  return (
    <div className="h-full flex flex-col justify-center gap-3 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/35">Deine Skill-Gaps</span>
        <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: 'rgba(48,227,202,0.1)', color: ACCENT2, border: '1px solid rgba(48,227,202,0.2)' }}>30% Match</span>
      </div>

      {skills.map((skill, i) => {
        const gap = skill.need - skill.have;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.1 }}
            className="space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] leading-none">{tierLabels[skill.severity]?.split(' ')[0]}</span>
                <span className="text-[11px] font-bold text-white/80">{skill.name}</span>
              </div>
              <span className="text-[10px] font-black tabular-nums" style={{ color: skill.color }}>–{gap}%</span>
            </div>
            <div className="relative h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
              {/* current level */}
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{ background: 'rgba(255,255,255,0.15)' }}
                initial={{ width: 0 }}
                animate={{ width: `${skill.have}%` }}
                transition={{ delay: 0.3 + i * 0.1, duration: 0.6 }}
              />
              {/* target level */}
              <motion.div
                className="absolute left-0 top-0 h-full rounded-full opacity-30"
                style={{ background: `linear-gradient(90deg, ${skill.color}55, ${skill.color})` }}
                initial={{ width: 0 }}
                animate={{ width: `${skill.need}%` }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.7 }}
              />
              {/* gap fill (animated stripe) */}
              <motion.div
                className="absolute top-0 h-full rounded-r-full"
                style={{
                  left: `${skill.have}%`,
                  background: `linear-gradient(90deg, ${skill.color}33, ${skill.color}88)`,
                  backgroundSize: '200% 100%',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${gap}%` }}
                transition={{ delay: 0.6 + i * 0.1, duration: 0.5 }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-white/25 px-0.5">
              <span>Jetzt: {skill.have}%</span>
              <span>Ziel: {skill.need}%</span>
            </div>
          </motion.div>
        );
      })}

      {/* Legend */}
      <div className="flex items-center gap-3 mt-1 pt-2 border-t border-white/[0.07]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full bg-white/20" />
          <span className="text-[9px] text-white/30">Vorhanden</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-1.5 rounded-full" style={{ background: `${ACCENT2}88` }} />
          <span className="text-[9px] text-white/30">Lücke</span>
        </div>
      </div>
    </div>
  );
}

function LernpfadeVisual() {
  const modules = [
    { week: 'Woche 1–2',  title: 'Python Grundlagen',         done: true,    hours: 8  },
    { week: 'Woche 3–4',  title: 'Datenanalyse mit Pandas',   done: true,    hours: 10 },
    { week: 'Woche 5–7',  title: 'KI-Tools im Arbeitsalltag', done: false,   hours: 14, active: true },
    { week: 'Woche 8–10', title: 'SQL & Datenbankabfragen',   done: false,   hours: 12 },
    { week: 'Woche 11–12',title: 'Projekt & Zertifikat',       done: false,   hours: 8  },
  ];
  const totalHours = modules.reduce((s, m) => s + m.hours, 0);
  const doneHours  = modules.filter(m => m.done).reduce((s, m) => s + m.hours, 0);
  const pct = Math.round((doneHours / totalHours) * 100);

  return (
    <div className="h-full flex flex-col justify-center gap-3 p-5">
      {/* Overall progress */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-3 mb-1"
        style={{ background: 'rgba(48,227,202,0.06)', border: '1px solid rgba(48,227,202,0.15)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: ACCENT2 }}>Senior Consultant</span>
          <span className="text-[11px] font-black tabular-nums" style={{ color: ACCENT2 }}>{pct}% fertig</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.4, duration: 0.8 }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[9px] text-white/30">
          <span>{doneHours}h abgeschlossen</span>
          <span>{totalHours}h gesamt</span>
        </div>
      </motion.div>

      {/* Module list */}
      <div className="space-y-1.5">
        {modules.map((mod, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.09 }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all"
            style={{
              background: mod.active
                ? 'rgba(48,227,202,0.08)'
                : mod.done
                  ? 'rgba(255,255,255,0.03)'
                  : 'rgba(255,255,255,0.02)',
              border: mod.active
                ? '1px solid rgba(48,227,202,0.25)'
                : mod.done
                  ? '1px solid rgba(255,255,255,0.07)'
                  : '1px solid rgba(255,255,255,0.04)',
            }}
          >
            {/* Status dot */}
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: mod.done
                  ? 'rgba(34,197,94,0.15)'
                  : mod.active
                    ? 'rgba(48,227,202,0.15)'
                    : 'rgba(255,255,255,0.05)',
                border: `1px solid ${mod.done ? '#22c55e' : mod.active ? ACCENT2 : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {mod.done ? (
                <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : mod.active ? (
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT2 }} />
              ) : (
                <div className="w-1 h-1 rounded-full bg-white/20" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className={`text-[11px] font-bold leading-tight truncate ${mod.done ? 'text-white/35 line-through' : mod.active ? 'text-white' : 'text-white/50'}`}>
                {mod.title}
              </p>
              <p className="text-[9px] text-white/25">{mod.week} · {mod.hours}h</p>
            </div>

            {mod.active && (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(48,227,202,0.15)', color: ACCENT2, border: '1px solid rgba(48,227,202,0.3)' }}
              >
                Aktiv
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Certificate badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.15)' }}
      >
        <span className="text-sm">🏆</span>
        <span className="text-[10px] text-amber-300/70 font-bold">Zertifikat nach Abschluss aller Module</span>
      </motion.div>
    </div>
  );
}

function ManagementVisual() {
  const columns = [
    {
      title: 'Offen', color: 'text-white/50', dot: 'bg-white/30',
      cards: [
        { company: 'Siemens AG', role: 'Product Manager', date: 'Heute' },
        { company: 'BMW Group', role: 'Strategy Analyst', date: 'Gestern' },
      ],
    },
    {
      title: 'Eingeladen', color: 'text-amber-400', dot: 'bg-amber-400',
      cards: [{ company: 'SAP SE', role: 'UX Designer', date: 'Mo, 28.04.' }],
    },
    {
      title: 'Zusage', color: 'text-emerald-400', dot: 'bg-emerald-400',
      cards: [{ company: 'Zalando', role: 'Growth Lead', date: 'Fr, 25.04.' }],
    },
  ];
  return (
    <div className="h-full flex items-center justify-center p-3">
      <div className="w-full max-w-sm grid grid-cols-3 gap-2">
        {columns.map((col, ci) => (
          <motion.div key={ci} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.15 }} className="bg-white/5 border border-white/10 rounded-xl p-2.5 space-y-2">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${col.dot}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wide ${col.color}`}>{col.title}</span>
            </div>
            {col.cards.map((card, ki) => (
              <motion.div key={ki} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + ci * 0.15 + ki * 0.1 }} className="bg-white/8 border border-white/10 rounded-lg p-2 space-y-0.5">
                <p className="text-[11px] font-semibold text-white leading-tight">{card.company}</p>
                <p className="text-[10px] text-white/50 leading-tight">{card.role}</p>
                <p className="text-[9px] text-white/30">{card.date}</p>
              </motion.div>
            ))}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

/* ── Tab content data ───────────────────────────────────── */

const tabContent = {
  wizard: {
    icon: FileText,
    heading: 'Der CV-Wizard',
    sub: 'Vom leeren Blatt zum Top-Lebenslauf',
    bullets: [
      'Ich führe dich Schritt für Schritt: Persönliche Daten, Erfahrung, Skills.',
      'Kein Design-Stress: Du wählst ein Profi-Template, ich kümmere mich um das Layout.',
      'Echtzeit-Vorschau im Live-Editor – sieh sofort, wie dein CV aussieht.',
      'Am Ende lädst du eine professionelle PDF herunter.',
    ],
    cta: 'CV jetzt erstellen',
    ctaHref: '/cv-wizard',
    solid: true,
    Visual: WizardVisual,
  },
  check: {
    icon: Target,
    heading: 'Der CV-Check',
    sub: 'Dein Lebenslauf gegen den Algorithmus',
    bullets: [
      'Ich analysiere deinen bestehenden Lebenslauf mit KI auf über 50 Kriterien.',
      'Du erhältst einen glasklaren ATS-Score von 0–100 Punkten.',
      'Konkrete Verbesserungsvorschläge, um die Algorithmen der Recruiter zu schlagen.',
      'Optional: Direkt im Live-Editor optimieren und als PDF speichern.',
    ],
    cta: 'CV jetzt checken',
    ctaHref: '/cv-check',
    solid: false,
    Visual: CheckVisual,
  },
  skillgap: {
    icon: TrendingUp,
    heading: 'Skill-Gap-Analyse',
    sub: 'Erkenne exakt, was dir noch fehlt',
    bullets: [
      'KI vergleicht dein Profil mit echten Stellenanforderungen deines Traumjobs.',
      'Jede Lücke wird priorisiert: Top-Hebel zuerst – für maximale Wirkung.',
      'Du siehst sofort, welche Skills den größten Unterschied machen.',
      'ESCO-validiert nach europäischem Berufsstandard – keine Schätzungen, nur Fakten.',
    ],
    cta: 'Meine Skills analysieren',
    ctaHref: '/career-vision',
    solid: true,
    Visual: SkillGapVisual,
  },
  lernpfade: {
    icon: Map,
    heading: 'Personalisierte Lernpfade',
    sub: 'Dein Weg zum Traumjob – Schritt für Schritt',
    bullets: [
      'KI erstellt einen maßgeschneiderten 12-Wochen-Plan basierend auf deinen Lücken.',
      'Jeder Skill-Gap wird in konkrete Lernmodule mit Zeitplan übersetzt.',
      'Wöchentliche Fortschrittsverfolgung – du weißt immer, wo du stehst.',
      'Am Ende erhältst du ein Zertifikat als Beweis für deinen Fortschritt.',
    ],
    cta: 'Lernpfad starten',
    ctaHref: '/career-vision',
    solid: false,
    Visual: LernpfadeVisual,
  },
  management: {
    icon: Briefcase,
    heading: 'Bewerbungsmanagement',
    sub: 'Überblick statt Chaos',
    bullets: [
      'Behalte den Überblick: Alle Bewerbungen, Status und Deadlines an einem Ort.',
      'Nie wieder Chaos: Alle Dokumente im Dashboard sicher gespeichert.',
      'Strategisches Vorgehen statt blindes Abschicken.',
      'Vom ersten Klick bis zur Zusage – ich tracke jeden Schritt für dich.',
    ],
    cta: 'Zum Dashboard',
    ctaHref: '/dashboard',
    solid: false,
    Visual: ManagementVisual,
  },
} as const;

/* ── Main component ─────────────────────────────────────── */

export function ProcessTimeline() {
  const [active, setActive] = useState<TabId>('wizard');
  const navigate = useNavigate();
  const content = tabContent[active];
  const Icon = content.icon;
  const Visual = content.Visual;

  return (
    <section id="prozess" className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold mb-3">
            So funktioniert&apos;s
          </h2>
          <p className="text-lg sm:text-xl text-white/60">
            Fünf Wege – ein Ziel: dein Traumjob
          </p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-12">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const isActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 border ${
                  isActive
                    ? 'text-black border-transparent shadow-lg shadow-[#66c0b6]/25'
                    : 'text-white/60 border-white/10 hover:border-[#66c0b6]/30 hover:text-white bg-white/5'
                }`}
                style={isActive ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` } : {}}
              >
                <TabIcon className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
                {isActive && (
                  <motion.span layoutId="tab-dot" className="ml-auto sm:hidden">
                    <ChevronRight className="w-4 h-4" />
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="grid lg:grid-cols-2 gap-6 sm:gap-10 items-stretch"
          >
            {/* Left – text */}
            <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col">
              <div className="flex items-start gap-4 mb-6">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}
                >
                  <Icon className="w-7 h-7 text-black" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">{content.heading}</h3>
                  <p className="text-sm text-white/50 mt-0.5">{content.sub}</p>
                </div>
              </div>

              <ul className="space-y-4 flex-1">
                {content.bullets.map((bullet, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-start gap-3"
                  >
                    <div
                      className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: `${ACCENT}22`, border: `1px solid ${ACCENT}55` }}
                    >
                      <Check className="w-3 h-3" style={{ color: ACCENT }} />
                    </div>
                    <p className="text-sm sm:text-base text-white/80 leading-relaxed">{bullet}</p>
                  </motion.li>
                ))}
              </ul>

              <motion.button
                onClick={() => navigate(content.ctaHref)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`mt-8 w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all ${
                  content.solid
                    ? 'text-black shadow-lg shadow-[#66c0b6]/25'
                    : 'text-white border-2 border-[#66c0b6]/50 hover:bg-[#66c0b6]/10'
                }`}
                style={content.solid ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` } : {}}
              >
                {content.cta}
                <ArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Right – visual */}
            <div className="relative bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden min-h-[360px]">
              <div
                className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-20 blur-3xl pointer-events-none"
                style={{ background: ACCENT }}
              />
              <Visual />
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-white/40 text-sm mt-10"
        >
          Alle Wege führen zu einem ATS-optimierten, professionellen Lebenslauf.
        </motion.p>
      </div>
    </section>
  );
}
