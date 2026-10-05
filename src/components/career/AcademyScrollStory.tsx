// src/components/career/AcademyScrollStory.tsx
//
// Scroll-Story für die Landingpage – vier Kapitel, jedes mit eigener Bühne,
// eigener Farbwelt und eigener Bewegung (statt eines gleichbleibenden Layouts):
//
//   00 Intro      "Wie soll dein Name auf dem Zertifikat stehen?" – der Name
//                 begleitet den Besucher durch die ganze Story
//   01 Lernen     3D-Karussell der 5 Lerneinheiten, Schritte füllen sich,
//                 "+XP" steigt auf                                  (Teal)
//   02 Prüfen     Ring-Anzeige mit 10 Fragen, Score zählt hoch, beim Bestehen
//                 Lichtblitz + Konfetti                             (Amber → Grün)
//   03 Zertifikat Zertifikat richtet sich in 3D auf, Hologramm-Glanz läuft
//                 darüber, der Name tippt sich ein, Stempel knallt drauf (Hell)
//   04 Zeigen     Smartphone mit LinkedIn-Profil, das Zertifikat landet darin,
//                 Vorteile schweben herum, dann der Call-to-Action (Blau)
//
// Der Bereich ist ~6 Bildschirmhöhen hoch; der Inhalt klebt (sticky) und wird
// über den Scroll-Fortschritt gesteuert. Bei "Bewegung reduzieren" erscheint
// die ruhige Variante (AcademyValueStrip).

import { useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { ArrowRight, Check, FileStack, Linkedin, QrCode, ShieldCheck, Sparkles, Trophy, Zap } from 'lucide-react';
import { AcademyValueStrip, CertificatePreview } from './AcademyPreviews';
import { CATALOG_PRICE_LABEL, isCatalogEnabled } from '../../services/academyCatalogService';

const TEAL = '#30E3CA';
const LOGO = '/DYD Logo RGB.svg';

const SKILL = 'Projektmanagement';
const UNITS = [
  { title: 'Projektziele SMART definieren', color: '#30E3CA' },
  { title: 'Projektstrukturplan aufbauen', color: '#60A5FA' },
  { title: 'Termine & Kosten planen', color: '#A78BFA' },
  { title: 'Risiken steuern', color: '#F472B6' },
  { title: 'Projekt sauber abschließen', color: '#FBBF24' },
];

/* Kapitel im Scroll-Fortschritt (0–1) */
const CH = {
  intro: [0, 0.08],
  learn: [0.08, 0.46],
  exam: [0.46, 0.6],
  cert: [0.6, 0.8],
  show: [0.8, 1],
} as const;
type Chapter = keyof typeof CH;

/* Farbwelt je Kapitel (Hintergrund-Glow) */
const MOOD: Record<Chapter, { a: string; b: string }> = {
  intro: { a: '#30E3CA', b: '#0EA5E9' },
  learn: { a: '#30E3CA', b: '#8B5CF6' },
  exam: { a: '#F59E0B', b: '#22C55E' },
  cert: { a: '#E2E8F0', b: '#30E3CA' },
  show: { a: '#0A66C2', b: '#30E3CA' },
};

const NAV: { key: Chapter; label: string }[] = [
  { key: 'learn', label: 'Lernen' },
  { key: 'exam', label: 'Prüfen' },
  { key: 'cert', label: 'Zertifikat' },
  { key: 'show', label: 'Zeigen' },
];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const seg = (p: number, [a, b]: readonly number[]) => clamp01((p - a) / (b - a));
const ease = (t: number) => 1 - Math.pow(1 - t, 3);

export function AcademyScrollStory({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  if (reduce) return <AcademyValueStrip className={className} />;
  return <Story className={className} />;
}

function Story({ className }: { className: string }) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const [p, setP] = useState(0);
  const [name, setName] = useState('');
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const r = Math.round(v * 500) / 500;
    setP((prev) => (prev === r ? prev : r));
  });

  const chapter: Chapter = p < CH.intro[1] ? 'intro' : p < CH.learn[1] ? 'learn' : p < CH.exam[1] ? 'exam' : p < CH.cert[1] ? 'cert' : 'show';
  const mood = MOOD[chapter];
  // Stehen die Kurse direkt darunter (Landingpage), dorthin scrollen – sonst zur Kursseite
  const cta = () => {
    const below = document.getElementById('kurse');
    if (below) below.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else navigate(isCatalogEnabled() ? '/kurse' : '/career-vision');
  };

  return (
    <section ref={ref} className={`relative ${className}`} style={{ height: '620vh' }} aria-label="So läuft ein Kurs der DYD Career Academy">
      <div className="sticky top-0 h-screen overflow-hidden">
        {/* Farbwelt des Kapitels */}
        <div className="absolute inset-0 pointer-events-none transition-[background] duration-700" aria-hidden
          style={{ background: `radial-gradient(60% 55% at 25% 30%, ${mood.a}22, transparent 70%), radial-gradient(50% 50% at 80% 75%, ${mood.b}1f, transparent 70%)` }} />
        {/* Raster für Tiefe */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.06]" aria-hidden
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.6) 1px, transparent 1px)', backgroundSize: '56px 56px', maskImage: 'radial-gradient(circle at 50% 50%, black, transparent 75%)' }} />

        {/* Kapitel-Navigation */}
        <div className="absolute top-5 left-0 right-0 z-20 flex justify-center px-4">
          <div className="flex items-center gap-1 p-1 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md">
            {NAV.map((n, i) => {
              const done = seg(p, CH[n.key]) >= 1;
              const active = chapter === n.key;
              return (
                <span key={n.key} className="relative px-3 sm:px-4 py-1.5 rounded-full text-[11px] sm:text-xs font-black transition-colors"
                  style={{ color: active ? '#000' : done ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                  {active && <motion.span layoutId="story-nav" className="absolute inset-0 rounded-full" style={{ background: `linear-gradient(135deg, ${mood.a}, ${mood.b})` }} />}
                  <span className="relative">{String(i + 1).padStart(2, '0')} {n.label}</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Riesige Kapitelnummer im Hintergrund */}
        <AnimatePresence mode="wait">
          {chapter !== 'intro' && (
            <motion.div key={chapter} aria-hidden
              className="absolute -right-6 sm:right-6 bottom-0 font-black leading-none pointer-events-none select-none"
              style={{ fontSize: 'min(42vw, 420px)', color: 'transparent', WebkitTextStroke: `2px ${mood.a}22` }}
              initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -60 }} transition={{ duration: 0.5 }}>
              {String(NAV.findIndex((n) => n.key === chapter) + 1).padStart(2, '0')}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bühne */}
        <div className="relative z-10 h-full max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-6">
          <AnimatePresence mode="wait">
            {chapter === 'intro' && <IntroScene key="intro" name={name} setName={setName} t={seg(p, CH.intro)} />}
            {chapter === 'learn' && <LearnScene key="learn" t={seg(p, CH.learn)} />}
            {chapter === 'exam' && <ExamScene key="exam" t={seg(p, CH.exam)} />}
            {chapter === 'cert' && <CertScene key="cert" t={seg(p, CH.cert)} name={name} />}
            {chapter === 'show' && <ShowScene key="show" t={seg(p, CH.show)} name={name} onCta={cta} />}
          </AnimatePresence>
        </div>

        {/* Fortschritt */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/5 z-20">
          <div className="h-full transition-[background] duration-500" style={{ width: `${p * 100}%`, background: `linear-gradient(90deg, ${mood.a}, ${mood.b})` }} />
        </div>
      </div>
    </section>
  );
}

const sceneMotion = {
  initial: { opacity: 0, y: 40, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -40, filter: 'blur(8px)' },
  transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const },
};

// ─────────────────────────────────────────────────────────────────────────────
// 00 Intro – kinetische Typografie + Name
// ─────────────────────────────────────────────────────────────────────────────
function IntroScene({ name, setName, t }: { name: string; setName: (v: string) => void; t: number }) {
  const words = ['Lernen.', 'Bestehen.', 'Zeigen.'];
  return (
    <motion.div {...sceneMotion} className="h-full flex flex-col items-center justify-center text-center gap-8">
      <p className="text-[11px] font-black uppercase tracking-widest text-white/45 -mb-4">Career Academy · So läuft dein Kurs</p>
      <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6">
        {words.map((w, i) => (
          <motion.span key={w}
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight"
            style={{ background: `linear-gradient(135deg, #fff, ${['#30E3CA', '#FBBF24', '#60A5FA'][i]})`, WebkitBackgroundClip: 'text', color: 'transparent' }}
            initial={{ opacity: 0, y: 30, rotateX: 60 }} animate={{ opacity: 1, y: 0, rotateX: 0 }} transition={{ delay: 0.12 * i, duration: 0.6 }}>
            {w}
          </motion.span>
        ))}
      </div>
      <p className="text-white/60 max-w-xl text-base sm:text-lg">
        Erlebe in 30 Sekunden Scrollen, wie aus einem Kurs ein Zertifikat in deinem LinkedIn-Profil wird.
      </p>
      <div className="w-full max-w-md">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA] mb-2">Wie soll dein Name auf dem Zertifikat stehen?</p>
        <div className="relative">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={40}
            placeholder="Dein Vor- und Nachname"
            aria-label="Dein Name für das Zertifikat"
            className="w-full px-5 py-4 rounded-2xl bg-white/[0.06] border border-white/15 text-white text-lg text-center placeholder-white/30 focus:outline-none focus:border-[#30E3CA] focus:bg-white/[0.09] transition-colors"
          />
          <motion.span className="absolute -inset-px rounded-2xl pointer-events-none" aria-hidden
            animate={{ opacity: [0.2, 0.6, 0.2] }} transition={{ duration: 2.4, repeat: Infinity }}
            style={{ boxShadow: `0 0 40px ${TEAL}55` }} />
        </div>
      </div>
      <motion.div className="flex flex-col items-center gap-1 text-white/40 text-xs" animate={{ y: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} style={{ opacity: 1 - t }}>
        Scrollen
        <span className="w-5 h-8 rounded-full border border-white/30 flex justify-center pt-1.5"><span className="w-1 h-1.5 rounded-full bg-white/60" /></span>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 01 Lernen – 3D-Karussell
// ─────────────────────────────────────────────────────────────────────────────
const STEP_LABELS = ['Verstehen', 'Quiz', 'Wahr/Falsch', 'Verstehen', 'Lückentext', 'Reihenfolge', 'Verstehen', 'Zuordnen', 'Wahr/Falsch', 'Praxisfall'];

function LearnScene({ t }: { t: number }) {
  const pos = t * UNITS.length; // 0–5
  const active = Math.min(UNITS.length - 1, Math.floor(pos));
  const within = pos - active;
  const steps = t >= 1 ? 10 : Math.floor(within * 11);
  const xp = Math.round(pos * 135);

  // XP-Funken bei jedem neuen Schritt
  const sparkKey = `${active}-${steps}`;

  return (
    <motion.div {...sceneMotion} className="h-full grid grid-rows-[auto,1fr,auto] gap-3">
      <div className="text-center">
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: UNITS[active].color }}>Kapitel 1 · Lernen</p>
        <h3 className="text-2xl sm:text-4xl font-black text-white mt-1">5 Einheiten. 10 Schritte. Echte Praxis.</h3>
      </div>

      {/* Karussell */}
      <div className="relative flex items-center justify-center" style={{ perspective: 1400 }}>
        {UNITS.map((u, i) => {
          const d = i - pos + 0.5; // Abstand zur Mitte
          const abs = Math.abs(d);
          const isActive = i === active;
          return (
            <div key={u.title}
              className="absolute w-[78vw] max-w-[340px] rounded-[28px] p-5"
              style={{
                transform: `translateX(${d * 78}%) translateZ(${-abs * 260}px) rotateY(${-d * 32}deg) scale(${isActive ? 1 : 0.88})`,
                opacity: abs > 1.9 ? 0 : isActive ? 1 : Math.max(0, 0.55 - abs * 0.2),
                filter: isActive ? 'none' : 'blur(1.5px) saturate(.7)',
                zIndex: 10 - Math.round(abs * 2),
                background: `linear-gradient(160deg, ${u.color}26, #070d18 55%)`,
                border: `1px solid ${u.color}${isActive ? 'aa' : '33'}`,
                boxShadow: isActive ? `0 30px 80px ${u.color}33` : '0 20px 50px rgba(0,0,0,0.5)',
                transition: 'border-color .3s, box-shadow .3s',
              }}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: u.color }}>Einheit {i + 1}</span>
                {i < active || (isActive && steps >= 10)
                  ? <span className="w-6 h-6 rounded-full flex items-center justify-center text-black" style={{ background: u.color }}><Check size={14} /></span>
                  : <span className="text-[10px] text-white/40">{isActive ? `${steps}/10` : '0/10'}</span>}
              </div>
              <p className="text-lg sm:text-xl font-black text-white mt-3 leading-snug min-h-[3.2em]">{u.title}</p>
              <div className="grid grid-cols-10 gap-1 mt-4">
                {Array.from({ length: 10 }).map((_, k) => {
                  const filled = i < active || (isActive && k < steps);
                  return <div key={k} className="h-1.5 rounded-full transition-colors duration-200" style={{ background: filled ? u.color : 'rgba(255,255,255,0.08)' }} />;
                })}
              </div>
              {isActive && (
                <div className="mt-4 rounded-2xl p-3.5 bg-white/[0.05] border border-white/10">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/45">{STEP_LABELS[Math.min(9, steps)]}</p>
                  <div className="mt-2 space-y-1.5">
                    <div className="h-2 rounded bg-white/15 w-11/12" />
                    <div className="h-2 rounded bg-white/10 w-7/12" />
                  </div>
                  <div className="flex gap-1.5 mt-3">
                    {[0, 1, 2].map((k) => (
                      <div key={k} className="h-7 flex-1 rounded-lg transition-colors"
                        style={{ background: k === steps % 3 ? `${u.color}33` : 'rgba(255,255,255,0.05)', border: `1px solid ${k === steps % 3 ? u.color : 'transparent'}` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* +XP steigt auf */}
        <AnimatePresence>
          {steps > 0 && (
            <motion.span key={sparkKey}
              className="absolute top-[8%] right-[14%] sm:right-[30%] z-30 text-sm font-black px-2.5 py-1 rounded-full"
              style={{ color: '#000', background: '#FBBF24' }}
              initial={{ opacity: 0, y: 20, scale: 0.6 }} animate={{ opacity: 1, y: -10, scale: 1 }} exit={{ opacity: 0, y: -40 }}
              transition={{ duration: 0.5 }}>
              +{steps === 10 ? 20 : 10} XP
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-6 sm:gap-10">
        <Stat label="XP gesammelt" value={String(xp)} color="#FBBF24" icon={<Zap size={16} />} />
        <Stat label="Einheiten" value={`${Math.min(5, Math.floor(pos + 0.0001))}/5`} color={UNITS[active].color} icon={<Check size={16} />} />
      </div>
    </motion.div>
  );
}

function Stat({ label, value, color, icon }: { label: string; value: string; color: string; icon: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}22`, color }}>{icon}</span>
      <div>
        <p className="text-xl sm:text-2xl font-black text-white tabular-nums leading-none">{value}</p>
        <p className="text-[10px] uppercase tracking-widest text-white/40 mt-1">{label}</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 02 Prüfen – Ring, Score, Konfetti
// ─────────────────────────────────────────────────────────────────────────────
function ExamScene({ t }: { t: number }) {
  const answered = Math.min(10, Math.floor(ease(clamp01(t / 0.8)) * 10.999));
  const correct = answered > 6 ? answered - 1 : answered; // Frage 7 falsch → 9/10
  const score = correct * 10;
  const passed = answered >= 10;
  const R = 120;
  const C = 2 * Math.PI * R;
  const ring = passed ? '#22C55E' : '#F59E0B';

  const confetti = useMemo(() => Array.from({ length: 36 }).map((_, i) => ({
    a: (i / 36) * Math.PI * 2 + Math.random() * 0.3,
    d: 140 + Math.random() * 160,
    c: ['#30E3CA', '#FBBF24', '#22C55E', '#60A5FA', '#F472B6'][i % 5],
    r: Math.random() * 360,
  })), []);

  return (
    <motion.div {...sceneMotion} className="h-full flex flex-col items-center justify-center gap-8 sm:gap-10">
      <div className="text-center">
        <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: ring }}>Kapitel 2 · Prüfen</p>
        <h3 className="text-2xl sm:text-4xl font-black text-white mt-1">{passed ? 'Bestanden.' : '10 Praxisfragen. Ab 80 % bestanden.'}</h3>
      </div>

      <div className="relative w-[280px] h-[280px] sm:w-[320px] sm:h-[320px]">
        {/* Lichtblitz */}
        <motion.div className="absolute inset-0 rounded-full" aria-hidden
          animate={{ scale: passed ? [0.6, 1.8] : 0.6, opacity: passed ? [0.6, 0] : 0 }}
          transition={{ duration: 0.9 }} style={{ background: 'radial-gradient(circle, #22C55E88, transparent 60%)' }} />

        <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full -rotate-90">
          <circle cx="150" cy="150" r={R} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="14" />
          <circle cx="150" cy="150" r={R} fill="none" stroke={ring} strokeWidth="14" strokeLinecap="round"
            strokeDasharray={C} strokeDashoffset={C * (1 - score / 100)} style={{ transition: 'stroke-dashoffset .35s, stroke .4s', filter: `drop-shadow(0 0 10px ${ring}88)` }} />
        </svg>

        {/* 10 Fragen rund um den Ring */}
        {Array.from({ length: 10 }).map((_, i) => {
          const ang = (i / 10) * Math.PI * 2 - Math.PI / 2;
          const x = 50 + Math.cos(ang) * 50;
          const y = 50 + Math.sin(ang) * 50;
          const state = i >= answered ? 'open' : i === 6 ? 'wrong' : 'right';
          return (
            <motion.span key={i}
              className="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full flex items-center justify-center text-[11px] font-black"
              style={{
                left: `${x}%`, top: `${y}%`,
                background: state === 'open' ? '#0b1220' : state === 'right' ? '#22C55E' : '#EF4444',
                border: `1px solid ${state === 'open' ? 'rgba(255,255,255,0.15)' : 'transparent'}`,
                color: state === 'open' ? 'rgba(255,255,255,0.4)' : '#000',
              }}
              animate={{ scale: state === 'open' ? 1 : [1.6, 1] }} transition={{ duration: 0.3 }}>
              {state === 'right' ? '✓' : state === 'wrong' ? '✕' : i + 1}
            </motion.span>
          );
        })}

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Trophy size={26} className={passed ? 'text-[#22C55E]' : 'text-amber-300'} />
          <p className="text-6xl sm:text-7xl font-black text-white tabular-nums mt-1">{score}<span className="text-3xl text-white/50">%</span></p>
          <p className="text-xs text-white/45">{answered}/10 beantwortet</p>
        </div>

        {/* Konfetti */}
        {passed && confetti.map((c, i) => (
          <motion.span key={i} className="absolute left-1/2 top-1/2 w-2.5 h-1.5 rounded-sm" aria-hidden
            style={{ background: c.c }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
            animate={{ x: Math.cos(c.a) * c.d, y: Math.sin(c.a) * c.d + 60, opacity: 0, rotate: c.r }}
            transition={{ duration: 1.4, ease: 'easeOut' }} />
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 03 Zertifikat – richtet sich in 3D auf, Hologramm, Name, Stempel
// ─────────────────────────────────────────────────────────────────────────────
function CertScene({ t, name }: { t: number; name: string }) {
  const rise = ease(clamp01(t / 0.35));                       // aufrichten
  const full = name.trim() || 'Dein Name';
  const typed = full.slice(0, Math.round(full.length * clamp01((t - 0.3) / 0.35)));
  const stamped = t > 0.72;
  const shine = clamp01((t - 0.15) / 0.6);                    // Glanz läuft einmal drüber

  return (
    <motion.div {...sceneMotion} className="h-full flex flex-col items-center justify-center gap-5">
      <div className="text-center">
        <p className="text-[11px] font-black uppercase tracking-widest text-white/70">Kapitel 3 · Zertifikat</p>
        <h3 className="text-2xl sm:text-4xl font-black text-white mt-1">
          {name.trim() ? <>Ausgestellt auf <span className="text-[#30E3CA]">{name.trim()}</span></> : 'Mit deinem Namen. Prüfbar per QR-Code.'}
        </h3>
      </div>

      <div className="relative w-full max-w-3xl" style={{ perspective: 1600 }}>
        <motion.div
          className="relative"
          style={{
            transform: `rotateX(${(1 - rise) * 62}deg) translateY(${(1 - rise) * 18}%) scale(${0.82 + rise * 0.18})`,
            transformOrigin: 'center bottom',
            opacity: 0.3 + rise * 0.7,
          }}
          animate={stamped ? { x: [0, -6, 5, -3, 0] } : { x: 0 }}
          transition={{ duration: 0.35 }}
        >
          <CertificatePreview
            name={typed.length < full.length ? `${typed}|` : typed}
            skill={SKILL}
            units={UNITS.map((u) => u.title)}
            showRibbon={false}
          />

          {/* Hologramm-Glanz */}
          <div className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden" aria-hidden>
            <div className="absolute inset-y-0 w-1/3"
              style={{
                left: `${-40 + shine * 150}%`,
                background: 'linear-gradient(100deg, transparent, rgba(48,227,202,0.25), rgba(167,139,250,0.25), rgba(251,191,36,0.2), transparent)',
                mixBlendMode: 'screen',
                transform: 'skewX(-18deg)',
              }} />
          </div>

          {/* Stempel */}
          <motion.div
            className="absolute right-[5%] top-[28%] px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl border-[3px] text-xs sm:text-xl font-black tracking-[0.2em]"
            style={{ color: TEAL, borderColor: TEAL, background: 'rgba(2,6,23,0.8)' }}
            initial={false}
            animate={stamped ? { opacity: 1, scale: 1, rotate: -12 } : { opacity: 0, scale: 3, rotate: -12 }}
            transition={{ type: 'spring', stiffness: 420, damping: 16 }}>
            ✓ VERIFIZIERT
          </motion.div>
        </motion.div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {[{ i: <QrCode size={13} />, t: 'QR-Code & Prüfseite' }, { i: <ShieldCheck size={13} />, t: 'Eindeutige Nummer' }, { i: <Trophy size={13} />, t: 'Mit Prüfungsergebnis' }].map((c, k) => (
          <motion.span key={c.t} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-white/80 bg-white/[0.06] border border-white/10"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: t > 0.5 ? 1 : 0, y: t > 0.5 ? 0 : 10 }} transition={{ delay: k * 0.08 }}>
            <span className="text-[#30E3CA]">{c.i}</span> {c.t}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 04 Zeigen – Smartphone mit LinkedIn-Profil
// ─────────────────────────────────────────────────────────────────────────────
function ShowScene({ t, name, onCta }: { t: number; name: string; onCta: () => void }) {
  const land = ease(clamp01(t / 0.4));
  const showCta = t > 0.55;
  const chips = [
    { icon: <Linkedin size={14} />, text: 'Mit 1 Klick auf LinkedIn', side: 'l', y: '10%' },
    { icon: <Check size={14} />, text: 'Direkt in deinen Lebenslauf', side: 'r', y: '30%' },
    { icon: <FileStack size={14} />, text: 'Kompetenzprofil ab 2 Zertifikaten', side: 'l', y: '64%' },
  ];
  return (
    <motion.div {...sceneMotion} className="h-full grid grid-cols-1 lg:grid-cols-2 items-center content-center gap-4 sm:gap-6">
      <div className="text-center lg:text-left space-y-4 order-2 lg:order-1">
        <p className="text-[11px] font-black uppercase tracking-widest text-[#60A5FA]">Kapitel 4 · Zeigen</p>
        <h3 className="text-2xl sm:text-5xl font-black text-white leading-tight">Sichtbar,<br />wo Recruiter suchen.</h3>
        <p className="hidden sm:block text-white/60 max-w-md mx-auto lg:mx-0">Dein Zertifikat landet mit einem Klick in deinem LinkedIn-Profil und in deinem Lebenslauf – mit Prüf-Link für Arbeitgeber.</p>
        <motion.div initial={false} animate={showCta ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }} className="pt-2">
          <button onClick={onCta} disabled={!showCta}
            className="group inline-flex items-center gap-2 px-7 py-4 rounded-2xl font-black text-black transition-transform hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg,#30E3CA,#60A5FA)', boxShadow: '0 15px 45px rgba(48,227,202,0.35)' }}>
            <Sparkles size={18} />
            {isCatalogEnabled() ? `Deinen Kurs starten – ab ${CATALOG_PRICE_LABEL}` : 'Kostenlose Skill-Analyse starten'}
            <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
          </button>
          <p className="text-[11px] text-white/35 mt-2">Einmalzahlung · kein Abo · Zertifikat inklusive</p>
        </motion.div>
      </div>

      {/* Smartphone */}
      <div className="relative order-1 lg:order-2 flex justify-center">
        <div className="relative w-[170px] sm:w-[260px] aspect-[9/18] rounded-[30px] sm:rounded-[38px] p-2.5 bg-[#0b0f17] border border-white/15 shadow-2xl"
          style={{ transform: `rotate(${(1 - land) * 8}deg) translateY(${(1 - land) * 30}px)`, boxShadow: '0 40px 90px rgba(10,102,194,0.35)' }}>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-black z-10" />
          <div className="w-full h-full rounded-[30px] bg-[#f3f2ef] overflow-hidden text-[#1d2226]">
            <div className="h-20 bg-gradient-to-br from-[#0A66C2] to-[#30E3CA]" />
            <div className="px-3 -mt-8">
              <div className="w-16 h-16 rounded-full border-4 border-white bg-[#0A192F] flex items-center justify-center text-white text-xl font-black">
                {(name.trim() || 'Du').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <p className="text-[13px] font-bold mt-1.5">{name.trim() || 'Dein Name'}</p>
              <p className="text-[10px] text-[#1d2226]/60">Projektmanager:in · offen für neue Rollen</p>
            </div>
            <div className="mx-2 mt-3 rounded-xl bg-white p-2.5">
              <p className="text-[11px] font-bold">Lizenzen und Zertifizierungen</p>
              <motion.div className="flex gap-2 mt-2 rounded-lg p-1.5 -mx-1.5"
                style={{ transform: `translateY(${(1 - land) * -140}px) scale(${0.7 + land * 0.3})`, opacity: land, background: land > 0.95 ? 'rgba(48,227,202,0.12)' : 'transparent', transition: 'background .4s' }}>
                <div className="w-8 h-8 rounded flex-shrink-0 bg-[#0A192F] flex items-center justify-center"><img src={LOGO} alt="" className="w-5 h-5" /></div>
                <div className="min-w-0">
                  <p className="text-[10.5px] font-bold leading-tight break-words">Fachkompetenz {SKILL}</p>
                  <p className="text-[9.5px] text-[#1d2226]/60">DYD Career Academy</p>
                  <p className="text-[9px] font-semibold text-[#0A66C2] mt-0.5">Nachweis anzeigen ↗</p>
                </div>
              </motion.div>
              <div className="mt-2 space-y-1.5 opacity-50">
                <div className="h-1.5 rounded bg-black/10 w-10/12" />
                <div className="h-1.5 rounded bg-black/10 w-7/12" />
              </div>
            </div>
            <div className="mx-2 mt-2 rounded-xl bg-white p-2.5 space-y-1.5 opacity-60">
              <div className="h-1.5 rounded bg-black/10 w-9/12" />
              <div className="h-1.5 rounded bg-black/10 w-6/12" />
            </div>
          </div>
          {land > 0.95 && (
            <motion.span className="absolute -top-3 -right-3 px-2.5 py-1 rounded-full text-[10px] font-black text-black"
              style={{ background: TEAL }} initial={{ scale: 0 }} animate={{ scale: 1 }}>Neu hinzugefügt</motion.span>
          )}

          {/* schwebende Vorteile (nur breite Screens) */}
          {chips.map((c, i) => (
            <motion.span key={c.text}
              className="hidden sm:flex absolute items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-white/[0.08] border border-white/15 backdrop-blur-md whitespace-nowrap"
              style={c.side === 'l' ? { right: '100%', marginRight: 18, top: c.y } : { left: '100%', marginLeft: 18, top: c.y }}
              initial={{ opacity: 0 }}
              animate={{ opacity: t > 0.25 + i * 0.1 ? 1 : 0, y: [0, -6, 0] }}
              transition={{ opacity: { duration: 0.4 }, y: { duration: 3 + i, repeat: Infinity } }}>
              <span className="text-[#30E3CA]">{c.icon}</span>{c.text}
            </motion.span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default AcademyScrollStory;