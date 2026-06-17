import { useState, type ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Target, Briefcase, ArrowRight, Check, ChevronRight,
  TrendingUp, Map, Award, GraduationCap, Sparkles,
} from 'lucide-react';

const ACCENT = '#66c0b6';
const ACCENT2 = '#30E3CA';
const GOLD = '#fbbf24';

const tabs = [
  { id: 'wizard',     label: 'CV erstellen',          icon: FileText,      isNew: false },
  { id: 'check',      label: 'CV-Check',               icon: Target,        isNew: false },
  { id: 'academy',    label: 'Career Academy',         icon: GraduationCap, isNew: true  },
  { id: 'management', label: 'Bewerbungsmanagement',   icon: Briefcase,     isNew: false },
] as const;

type TabId = (typeof tabs)[number]['id'];

const academySubTabs = [
  { id: 'skillgap',    label: 'Skill-Gaps',   icon: TrendingUp, color: '#f97316' },
  { id: 'lernpfade',   label: 'Lernpfade',    icon: Map,        color: ACCENT2  },
  { id: 'zertifikate', label: 'Zertifikate',  icon: Award,      color: GOLD     },
] as const;

type AcademySubId = (typeof academySubTabs)[number]['id'];

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
    { name: 'Talent Sourcing',     sev: 5, color: '#f97316', bg: 'rgba(249,115,22,0.1)',  border: 'rgba(249,115,22,0.25)',  tier: '🚀 Top-Hebel',    hard: true  },
    { name: 'People Analytics',    sev: 4, color: ACCENT2,   bg: 'rgba(48,227,202,0.08)', border: 'rgba(48,227,202,0.22)',  tier: '⚡ Hoher Impact', hard: true  },
    { name: 'KI im Recruiting',    sev: 4, color: ACCENT2,   bg: 'rgba(48,227,202,0.08)', border: 'rgba(48,227,202,0.22)',  tier: '⚡ Hoher Impact', hard: true  },
    { name: 'ATS-Systeme',         sev: 3, color: '#f97316', bg: 'rgba(249,115,22,0.07)', border: 'rgba(249,115,22,0.18)',  tier: '🚀 Top-Hebel',    hard: false },
  ];

  return (
    <div className="h-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-xs rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg,rgba(10,14,30,0.98),rgba(15,20,40,0.99))', border: `1px solid ${ACCENT2}25` }}
      >
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg,#f97316,${ACCENT2},${ACCENT})` }} />

        <div className="p-4 space-y-4">
          <div className="flex items-start gap-3">
            <div className="relative w-12 h-12 flex-shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                <circle cx="24" cy="24" r="20" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="4" />
                <motion.circle
                  cx="24" cy="24" r="20" fill="none" stroke={ACCENT2} strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 20}
                  initial={{ strokeDashoffset: 2 * Math.PI * 20 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 20 * (1 - 0.30) }}
                  transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-[11px] font-black leading-none" style={{ color: ACCENT2 }}>30%</span>
              </div>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${ACCENT2}99` }}>Deine Vision</p>
              <h3 className="text-sm font-black text-white leading-tight">Senior Consultant</h3>
              <span className="text-[10px] text-white/40">YER · Deutschland</span>
            </div>
          </div>

          <div className="flex gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <span className="text-[10px] leading-relaxed text-white/50">KI-gestützte Prozesse werden 2026 zum Standard im Recruiting. Frühzeitiger Aufbau dieser Skills sichert Wettbewerbsvorteile.</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30">5 Lernpfade verfügbar</span>
              <span className="text-[8px] text-white/20 ml-auto">+1 weitere</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {skills.map((skill, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.09 }}
                  className="rounded-xl p-2.5 space-y-2"
                  style={{ background: skill.bg, border: `1px solid ${skill.border}` }}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[8px] font-black uppercase tracking-wider leading-tight" style={{ color: skill.color }}>
                      {skill.tier}
                    </span>
                    <span className="text-[8px] text-white/30">{skill.hard ? '🔧 Hard' : '🧠 Soft'}</span>
                  </div>
                  <p className="text-[10px] font-black text-white leading-tight">{skill.name}</p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <div key={j} className="flex-1 h-1.5 rounded-sm" style={{ background: j < skill.sev ? skill.color : 'rgba(255,255,255,0.06)' }} />
                    ))}
                  </div>
                  <div className="flex items-center gap-1 px-2 py-1 rounded-lg" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <svg width="8" height="8" viewBox="0 0 8 8"><rect x="1" y="1" width="6" height="6" rx="1" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1"/><line x1="1" y1="3" x2="7" y2="3" stroke="rgba(255,255,255,0.3)" strokeWidth="0.8"/></svg>
                    <span className="text-[8px] text-white/35">Lernpfad freischalten</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {[
              { val: '5', label: 'Lernpfade', color: ACCENT2 },
              { val: '3', label: 'Top-Hebel',  color: '#f97316' },
              { val: '0', label: 'Basis',       color: ACCENT   },
            ].map(({ val, label, color }) => (
              <div key={label} className="flex flex-col items-center py-2 rounded-xl" style={{ background: `${color}09`, border: `1px solid ${color}18` }}>
                <span className="text-base font-black leading-none" style={{ color }}>{val}</span>
                <span className="text-[8px] text-white/30 mt-0.5 font-bold">{label}</span>
              </div>
            ))}
          </div>

          <div className="w-full py-2.5 rounded-xl font-black text-[11px] text-black flex items-center justify-center gap-1.5"
            style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT2})` }}>
            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" rx="1.5" fill="none" stroke="black" strokeWidth="1.2"/><line x1="1" y1="3.5" x2="9" y2="3.5" stroke="black" strokeWidth="1"/></svg>
            Lernpfade freischalten
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function LernpfadeVisual() {
  const modules = [
    { label: 'Modul 1', title: 'Talent Sourcing Grundlagen',   done: true,   active: false, tier: '🚀', color: '#f97316' },
    { label: 'Modul 2', title: 'Boolean Search & Active Sourcing', done: true, active: false, tier: '🚀', color: '#f97316' },
    { label: 'Modul 3', title: 'KI-Tools im Recruiting-Alltag', done: false,  active: true,  tier: '⚡', color: ACCENT2  },
    { label: 'Modul 4', title: 'People Analytics & Kennzahlen', done: false,  active: false, tier: '⚡', color: ACCENT2  },
    { label: 'Modul 5', title: 'Abschlussprojekt & Zertifikat', done: false,  active: false, tier: '🏆', color: GOLD     },
  ];
  const doneCount = modules.filter(m => m.done).length;
  const pct = Math.round((doneCount / modules.length) * 100);

  return (
    <div className="h-full flex flex-col justify-center gap-3 p-5">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-3"
        style={{ background: 'rgba(48,227,202,0.06)', border: '1px solid rgba(48,227,202,0.18)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[9px] font-black uppercase tracking-widest text-[#30E3CA]/60">Dein Lernpfad</p>
            <p className="text-[12px] font-black text-white leading-tight">Talent Sourcing Techniken</p>
          </div>
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[14px] font-black tabular-nums" style={{ color: ACCENT2 }}>{pct}%</span>
            <span className="text-[9px] text-white/30">{doneCount}/{modules.length} Module</span>
          </div>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT2})` }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ delay: 0.4, duration: 0.9, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      <div className="space-y-1.5">
        {modules.map((mod, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + i * 0.09 }}
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl"
            style={{
              background: mod.active ? 'rgba(48,227,202,0.07)' : mod.done ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.02)',
              border: mod.active ? '1px solid rgba(48,227,202,0.22)' : mod.done ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(255,255,255,0.04)',
            }}
          >
            <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
              style={{
                background: mod.done ? 'rgba(34,197,94,0.15)' : mod.active ? `rgba(48,227,202,0.15)` : 'rgba(255,255,255,0.05)',
                border: `1px solid ${mod.done ? '#22c55e' : mod.active ? ACCENT2 : 'rgba(255,255,255,0.1)'}`,
              }}>
              {mod.done ? (
                <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              ) : mod.active ? (
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: ACCENT2 }} />
              ) : (
                <div className="w-1 h-1 rounded-full bg-white/20" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1">
                <span className="text-[10px] leading-none">{mod.tier}</span>
                <p className={`text-[11px] font-bold leading-tight truncate ${mod.done ? 'text-white/30 line-through decoration-white/20' : mod.active ? 'text-white' : 'text-white/45'}`}>
                  {mod.title}
                </p>
              </div>
              <p className="text-[9px] text-white/25 mt-0.5">{mod.label}</p>
            </div>

            {mod.active && (
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.8, repeat: Infinity }}
                className="text-[9px] font-black px-1.5 py-0.5 rounded-full flex-shrink-0"
                style={{ background: 'rgba(48,227,202,0.12)', color: ACCENT2, border: '1px solid rgba(48,227,202,0.28)' }}
              >
                Aktiv
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ZertifikateVisual() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-5 p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xs rounded-2xl overflow-hidden"
        style={{ background: 'linear-gradient(160deg,rgba(251,191,36,0.1),rgba(10,14,20,0.98))', border: '1px solid rgba(251,191,36,0.3)' }}
      >
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#fbbf24,#f59e0b,transparent)' }} />
        <div className="p-6 flex flex-col items-center text-center gap-3">
          <motion.div
            animate={{ boxShadow: ['0 0 0px rgba(251,191,36,0)', '0 0 24px rgba(251,191,36,0.35)', '0 0 0px rgba(251,191,36,0)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(251,191,36,0.15)', border: '1px solid rgba(251,191,36,0.4)' }}
          >
            <Award className="w-8 h-8" style={{ color: GOLD }} />
          </motion.div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'rgba(251,191,36,0.7)' }}>Offizielles Zertifikat</p>
            <p className="text-base font-black text-white mt-1">Talent Sourcing Techniken</p>
          </div>
          <div className="w-full h-px" style={{ background: 'rgba(251,191,36,0.2)' }} />
          <p className="text-[11px] text-white/45 leading-relaxed">IHK-nahes Prüfungsformat · bestanden mit 92%</p>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)' }}>
            <Check className="w-3 h-3" style={{ color: GOLD }} />
            <span className="text-[10px] font-bold" style={{ color: GOLD }}>PDF zum Download bereit</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Tab content data ───────────────────────────────────── */

const tabContent = {
  wizard: {
    icon: FileText,
    heading: 'CV erstellen',
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
    heading: 'CV-Check',
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
    Visual: () => <ManagementVisual />,
  },
} as const;

const academyContent: Record<AcademySubId, {
  heading: string;
  sub: string;
  bullets: string[];
  stat: { value: string; label: string };
  cta: string;
  Visual: () => ReactElement;
}> = {
  skillgap: {
    heading: 'Skill-Gap-Analyse',
    sub: 'Erkenne exakt, was dich vom Traumjob trennt',
    bullets: [
      'KI vergleicht dein CV mit echten Stellenanforderungen – kein Rätselraten mehr.',
      'Jede Lücke wird nach Impact priorisiert: Top-Hebel zuerst, Quick Wins danach.',
      'ESCO-validiert nach europäischem Qualifikationsrahmen – präzise, nicht pauschal.',
    ],
    stat: { value: '50+', label: 'geprüfte Skill-Kategorien' },
    cta: 'Meine Skills analysieren',
    Visual: SkillGapVisual,
  },
  lernpfade: {
    heading: 'Personalisierte Lernpfade',
    sub: 'Von der Lücke zum gefragten Experten',
    bullets: [
      'Für jeden identifizierten Skill-Gap erstellt die KI einen konkreten Lernpfad.',
      '5 strukturierte Module mit klarem Ziel – kein zielloses Durchklicken mehr.',
      'Du verfolgst deinen Fortschritt live und weißt immer, was als Nächstes kommt.',
    ],
    stat: { value: '5', label: 'Module pro Lernpfad' },
    cta: 'Lernpfad starten',
    Visual: LernpfadeVisual,
  },
  zertifikate: {
    heading: 'Zertifikate',
    sub: 'Dein Abschluss, einsetzbar in jeder Bewerbung',
    bullets: [
      'Nach Abschluss aller Module wartet eine IHK-nahe Abschlussprüfung.',
      'Bestanden ab 80% – dein offizielles, personalisiertes PDF-Zertifikat folgt sofort.',
      'Direkt im Lebenslauf, auf LinkedIn oder gegenüber Recruitern einsetzbar.',
    ],
    stat: { value: '80%', label: 'Bestehensgrenze' },
    cta: 'Zur Career Academy',
    Visual: ZertifikateVisual,
  },
};

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

/* ── Main component ─────────────────────────────────────── */

export function ProcessTimeline() {
  const [active, setActive] = useState<TabId>('wizard');
  const [academySub, setAcademySub] = useState<AcademySubId>('skillgap');
  const navigate = useNavigate();

  const isAcademy = active === 'academy';
  const content = isAcademy ? academyContent[academySub] : tabContent[active as Exclude<TabId, 'academy'>];
  const Icon = isAcademy ? academySubTabs.find(s => s.id === academySub)!.icon : (content as typeof tabContent[keyof typeof tabContent]).icon;
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
            Vier Bereiche – ein Ziel: dein Traumjob
          </p>
        </motion.div>

        {/* Tab bar */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            const tabIsActive = active === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActive(tab.id)}
                className={`relative flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 border ${
                  tabIsActive
                    ? 'text-black border-transparent shadow-lg shadow-[#66c0b6]/25'
                    : tab.isNew
                      ? 'text-white border-[#30E3CA]/35 hover:border-[#30E3CA]/60 bg-[#30E3CA]/8'
                      : 'text-white/60 border-white/10 hover:border-[#66c0b6]/30 hover:text-white bg-white/5'
                }`}
                style={tabIsActive ? { background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` } : {}}
              >
                <TabIcon className="w-4 h-4 flex-shrink-0" />
                <span className="whitespace-nowrap">{tab.label}</span>
                {tab.isNew && !tabIsActive && (
                  <motion.span
                    className="flex items-center gap-1 ml-1 px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(239,68,68,0.15)' }}
                    animate={{ opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.6, repeat: Infinity }}
                  >
                    <span className="w-1 h-1 rounded-full bg-red-500" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-red-400">Live</span>
                  </motion.span>
                )}
                {tabIsActive && (
                  <motion.span layoutId="tab-dot" className="ml-auto sm:hidden">
                    <ChevronRight className="w-4 h-4" />
                  </motion.span>
                )}
              </button>
            );
          })}
        </div>

        {/* Academy sub-tabs — only visible when Career Academy is active */}
        <AnimatePresence>
          {isAcademy && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="flex flex-wrap items-center justify-center gap-2 mb-8 sm:mb-10 pb-1">
                <div className="flex items-center gap-1.5 mr-2 text-[11px] font-bold uppercase tracking-widest text-white/30">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Campus:
                </div>
                {academySubTabs.map((sub) => {
                  const SubIcon = sub.icon;
                  const subIsActive = academySub === sub.id;
                  return (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setAcademySub(sub.id)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-semibold border transition-all"
                      style={{
                        background: subIsActive ? `${sub.color}18` : 'rgba(255,255,255,0.03)',
                        borderColor: subIsActive ? `${sub.color}55` : 'rgba(255,255,255,0.1)',
                        color: subIsActive ? sub.color : 'rgba(255,255,255,0.55)',
                      }}
                    >
                      <SubIcon className="w-3.5 h-3.5" />
                      {sub.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content panel */}
        <AnimatePresence mode="wait">
          <motion.div
            key={isAcademy ? `academy-${academySub}` : active}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.35 }}
            className="grid lg:grid-cols-2 gap-6 sm:gap-10 items-stretch"
          >
            {/* Left – text */}
            <div
              className="rounded-3xl p-6 sm:p-8 flex flex-col"
              style={{
                background: isAcademy
                  ? 'linear-gradient(160deg,rgba(48,227,202,0.10),rgba(255,255,255,0.04))'
                  : 'linear-gradient(160deg,rgba(255,255,255,0.10),rgba(255,255,255,0.05))',
                border: isAcademy ? '1px solid rgba(48,227,202,0.25)' : '1px solid rgba(255,255,255,0.1)',
              }}
            >
              <div className="flex items-start gap-4 mb-5">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}
                >
                  <Icon className="w-7 h-7 text-black" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-bold text-white">{content.heading}</h3>
                    {isAcademy && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(239,68,68,0.14)', border: '1px solid rgba(239,68,68,0.35)' }}>
                        <motion.span className="w-1.5 h-1.5 rounded-full bg-red-500" animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 1.4, repeat: Infinity }} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Jetzt live</span>
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/50 mt-0.5">{content.sub}</p>
                </div>
              </div>

              {isAcademy && (
                <div className="flex items-center gap-2 mb-5 px-3.5 py-2.5 rounded-xl" style={{ background: 'rgba(48,227,202,0.06)', border: '1px solid rgba(48,227,202,0.16)' }}>
                  <Sparkles className="w-3.5 h-3.5 text-[#30E3CA] flex-shrink-0" />
                  <p className="text-[12px] text-[#30E3CA]/85 leading-snug">
                    Neu: der Career Academy Campus ist live – Skill-Gaps, Lernpfade und Zertifikate an einem Ort.
                  </p>
                </div>
              )}

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

              {isAcademy && 'stat' in content && (
                <div className="flex items-center gap-3 mt-6 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                  <span className="text-2xl font-black" style={{ color: ACCENT2 }}>{content.stat.value}</span>
                  <span className="text-xs text-white/50 leading-tight">{content.stat.label}</span>
                </div>
              )}

              <motion.button
                onClick={() => navigate(isAcademy ? '/career-vision' : (content as typeof tabContent[keyof typeof tabContent]).ctaHref)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="mt-8 w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all text-black shadow-lg shadow-[#66c0b6]/25"
                style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT2})` }}
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
          Alle Wege führen zu einem ATS-optimierten Lebenslauf und einem klaren Plan für deinen Traumjob.
        </motion.p>
      </div>
    </section>
  );
}