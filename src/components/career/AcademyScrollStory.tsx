// src/components/career/AcademyScrollStory.tsx
//
// Scroll-Story für die Landingpage: Beim Scrollen erlebt der Besucher seinen
// eigenen Weg durch einen Kurs –
//   1. Lernweg zeichnet sich, 5 Einheiten füllen sich (Schritte + XP)
//   2. Abschlussprüfung: 10 Fragen, Score zählt hoch, "bestanden"
//   3. Zertifikat "druckt" sich, der eigene Name tippt sich ein, Stempel + QR
//   4. Zertifikat fliegt ins LinkedIn-Profil, dann der Call-to-Action
//
// Der Bereich ist ~5 Bildschirmhöhen hoch, der Inhalt klebt (sticky) und wird
// über den Scroll-Fortschritt gesteuert. Bei "Bewegung reduzieren" wird die
// statische Variante (AcademyValueStrip) gezeigt.

import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'framer-motion';
import { ArrowRight, Award, BookOpen, Check, Linkedin, Sparkles, Trophy, Zap } from 'lucide-react';
import { AcademyValueStrip, CertificatePreview } from './AcademyPreviews';
import { CATALOG_PRICE_LABEL, isCatalogEnabled } from '../../services/academyCatalogService';

const TEAL = '#30E3CA';
const LOGO = '/DYD Logo RGB.svg';

const SKILL = 'Projektmanagement';
const UNITS = [
  'Projektziele SMART definieren',
  'Projektstrukturplan aufbauen',
  'Termine & Kosten planen',
  'Risiken steuern',
  'Projekt sauber abschließen',
];

/* Abschnitte des Scroll-Fortschritts (0–1) */
const P_UNITS = [0.06, 0.52];
const P_EXAM = [0.52, 0.64];
const P_CERT = [0.64, 0.82];
const P_LINKEDIN = [0.84, 0.94];

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const seg = (p: number, [a, b]: number[]) => clamp01((p - a) / (b - a));

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
  // Nur in feinen Stufen neu rendern
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const r = Math.round(v * 400) / 400;
    setP((prev) => (prev === r ? prev : r));
  });

  const unitsProgress = seg(p, P_UNITS) * UNITS.length; // 0–5
  const unitIdx = Math.min(UNITS.length - 1, Math.floor(unitsProgress));
  const unitSteps = p >= P_UNITS[1] ? 10 : Math.floor((unitsProgress - unitIdx) * 11);
  const unitsDone = Math.min(UNITS.length, Math.floor(unitsProgress + 0.0001));
  const xp = Math.round(unitsProgress * 135);
  const exam = seg(p, P_EXAM);
  const answered = Math.round(exam * 10);
  const cert = seg(p, P_CERT);
  const li = seg(p, P_LINKEDIN);

  const stage = p < P_UNITS[0] ? 'intro' : p < P_EXAM[0] ? 'units' : p < P_CERT[0] ? 'exam' : p < P_LINKEDIN[0] ? 'cert' : 'linkedin';

  const fullName = name.trim() || 'Dein Name';
  const typed = fullName.slice(0, Math.round(fullName.length * clamp01((cert - 0.35) / 0.35)));

  const caption = useMemo(() => {
    switch (stage) {
      case 'intro': return { eyebrow: 'Dein Weg zum Zertifikat', title: 'Scroll und erleb deinen Kurs', text: 'So läuft ein Kurs der DYD Career Academy – von der ersten Einheit bis zum Eintrag in deinem LinkedIn-Profil.' };
      case 'units': return { eyebrow: `Einheit ${unitIdx + 1} von 5`, title: UNITS[unitIdx], text: '10 kurze Schritte pro Einheit: verstehen, üben, anwenden – mit Sofort-Feedback und XP.' };
      case 'exam': return { eyebrow: 'Abschlussprüfung', title: '10 Praxisfragen', text: 'Szenarien aus dem Berufsalltag. Ab 80 % hast du bestanden – mehrere Versuche möglich.' };
      case 'cert': return { eyebrow: 'Dein Zertifikat', title: 'Mit deinem Namen', text: 'Mit Prüfungsergebnis, eindeutiger Nummer und QR-Code – Arbeitgeber können es online prüfen.' };
      default: return { eyebrow: 'Ab in dein Profil', title: 'Sichtbar für Recruiter', text: 'Mit einem Klick auf LinkedIn und direkt in deinen Lebenslauf. Ab 2 Zertifikaten gibt es dein Kompetenzprofil.' };
    }
  }, [stage, unitIdx]);

  return (
    <section ref={ref} className={`relative ${className}`} style={{ height: '520vh' }} aria-label="So läuft ein Kurs der DYD Career Academy">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        {/* Hintergrund-Glow folgt dem Fortschritt */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          <div className="absolute w-[60vw] h-[60vw] rounded-full blur-3xl opacity-20"
            style={{ background: `radial-gradient(circle, ${TEAL}, transparent 60%)`, left: `${10 + p * 50}%`, top: `${20 - p * 10}%`, transition: 'left .3s, top .3s' }} />
        </div>

        <div className="relative max-w-6xl mx-auto w-full px-4 sm:px-6 grid grid-cols-1 md:grid-cols-5 gap-5 md:gap-10 items-center">
          {/* ── Links: Text, Name, Lernweg ── */}
          <div className="md:col-span-2 space-y-4 md:space-y-6">
            <AnimatePresence mode="wait">
              <motion.div key={caption.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.25 }}>
                <p className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA]">{caption.eyebrow}</p>
                <h3 className="text-2xl sm:text-4xl font-black text-white leading-tight mt-1">{caption.title}</h3>
                <p className="text-sm sm:text-base text-white/60 mt-2 max-w-md">{caption.text}</p>
              </motion.div>
            </AnimatePresence>

            <label className="block max-w-xs">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Dein Name fürs Zertifikat</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={40}
                placeholder="z. B. Lena Schmidt"
                className="mt-1 w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-base sm:text-sm focus:outline-none focus:border-[#30E3CA]"
              />
            </label>

            {/* Lernweg: Desktop vertikal, Mobil als Punkte */}
            <Journey unitsProgress={unitsProgress} examDone={exam >= 1} certDone={cert > 0.6} />
          </div>

          {/* ── Rechts: Bühne ── */}
          <div className="md:col-span-3 relative h-[48vh] sm:h-[56vh] md:h-[62vh]">
            <AnimatePresence mode="wait">
              {(stage === 'intro' || stage === 'units') && (
                <motion.div key="units" className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}>
                  <UnitCard idx={unitIdx} steps={stage === 'intro' ? 0 : unitSteps} xp={xp} done={unitsDone} />
                </motion.div>
              )}
              {stage === 'exam' && (
                <motion.div key="exam" className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}>
                  <ExamCard answered={answered} />
                </motion.div>
              )}
              {(stage === 'cert' || stage === 'linkedin') && (
                <motion.div key="cert" className="absolute inset-0 flex items-center justify-center"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {/* Zertifikat: druckt sich (Reveal von oben), fliegt dann ins Profil */}
                  <div
                    className="relative w-full"
                    style={{
                      transform: `translate(${li * 22}%, ${-li * 28}%) scale(${1 - li * 0.62}) rotate(${-li * 4}deg)`,
                      opacity: 1 - Math.max(0, li - 0.8) * 5,
                      transformOrigin: 'center',
                    }}
                  >
                    <div style={{ clipPath: `inset(0 0 ${100 - clamp01(cert / 0.35) * 100}% 0)`, transform: `translateY(${(1 - clamp01(cert / 0.35)) * 8}%)` }}>
                      <CertificatePreview name={typed} skill={SKILL} units={UNITS} showRibbon={false} />
                    </div>
                    {/* Stempel */}
                    <motion.div
                      className="absolute right-[6%] top-[30%] px-4 py-2 rounded-xl border-[3px] text-sm sm:text-lg font-black tracking-widest"
                      style={{ color: TEAL, borderColor: TEAL, background: 'rgba(2,6,23,0.75)' }}
                      initial={false}
                      animate={cert > 0.78 ? { opacity: 1, scale: 1, rotate: -10 } : { opacity: 0, scale: 2.2, rotate: -10 }}
                      transition={{ type: 'spring', stiffness: 380, damping: 18 }}
                    >
                      ✓ VERIFIZIERT
                    </motion.div>
                  </div>

                  {/* LinkedIn-Profil */}
                  <div className="absolute inset-x-0 top-[8%] md:top-1/2 md:-translate-y-1/2 pointer-events-none">
                    <motion.div
                      className="mx-auto max-w-md"
                      initial={false}
                      animate={stage === 'linkedin' ? { opacity: 1, y: 0, scale: li > 0.7 ? 1.04 : 1 } : { opacity: 0, y: 40, scale: 1 }}
                      transition={{ duration: 0.35 }}
                    >
                      <LinkedInCard highlight={li > 0.7} name={name.trim()} />
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* CTA am Ende */}
        <motion.div
          className="absolute bottom-6 left-0 right-0 flex justify-center px-4"
          initial={false}
          animate={p > 0.95 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20, pointerEvents: 'none' as any }}
        >
          <button
            onClick={() => navigate(isCatalogEnabled() ? '/kurse' : '/career-vision')}
            className="px-7 py-4 rounded-2xl font-black text-black flex items-center gap-2 shadow-2xl transition-transform hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)', boxShadow: '0 15px 40px rgba(48,227,202,0.35)' }}
          >
            <Sparkles size={18} /> {isCatalogEnabled() ? `Deinen Kurs starten – ab ${CATALOG_PRICE_LABEL}` : 'Kostenlose Skill-Analyse starten'} <ArrowRight size={18} />
          </button>
        </motion.div>

        {/* Fortschrittsleiste */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
          <div className="h-full" style={{ width: `${p * 100}%`, background: 'linear-gradient(90deg,#30E3CA,#66c0b6)' }} />
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
function Journey({ unitsProgress, examDone, certDone }: { unitsProgress: number; examDone: boolean; certDone: boolean }) {
  const nodes = [
    ...UNITS.map((t, i) => ({ label: `Einheit ${i + 1}`, title: t, fill: clamp01(unitsProgress - i), icon: BookOpen })),
    { label: 'Prüfung', title: '10 Praxisfragen', fill: examDone ? 1 : 0, icon: Trophy },
    { label: 'Zertifikat', title: 'mit QR-Prüfung', fill: certDone ? 1 : 0, icon: Award },
  ];
  return (
    <>
      {/* Mobil: Punkte */}
      <div className="flex md:hidden items-center gap-1.5">
        {nodes.map((n, i) => (
          <div key={i} className="h-1.5 flex-1 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${n.fill * 100}%`, background: TEAL }} />
          </div>
        ))}
      </div>
      {/* Desktop: Liste */}
      <ol className="hidden md:block space-y-2.5">
        {nodes.map((n, i) => {
          const done = n.fill >= 1;
          const active = n.fill > 0 && n.fill < 1;
          return (
            <li key={i} className="flex items-center gap-3">
              <span className="relative w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300"
                style={{
                  background: done ? 'linear-gradient(135deg,#30E3CA,#66c0b6)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${done || active ? TEAL : 'rgba(255,255,255,0.12)'}`,
                  color: done ? '#000' : active ? TEAL : 'rgba(255,255,255,0.35)',
                  boxShadow: active ? `0 0 18px ${TEAL}66` : 'none',
                  transform: active ? 'scale(1.1)' : 'scale(1)',
                }}>
                {done ? <Check size={15} /> : <n.icon size={14} />}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-bold truncate transition-colors ${done ? 'text-white' : active ? 'text-[#30E3CA]' : 'text-white/35'}`}>{n.title}</p>
                {active && (
                  <div className="h-1 mt-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${n.fill * 100}%`, background: TEAL }} />
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
const STEP_TYPES = ['Verstehen', 'Quiz', 'Wahr/Falsch', 'Verstehen', 'Lücke', 'Reihenfolge', 'Verstehen', 'Zuordnen', 'Wahr/Falsch', 'Praxisfall'];

function UnitCard({ idx, steps, xp, done }: { idx: number; steps: number; xp: number; done: number }) {
  return (
    <div className="w-full max-w-sm rounded-[28px] p-5 sm:p-6 relative"
      style={{ background: 'linear-gradient(160deg,#0b1726,#060c16)', border: '1px solid rgba(48,227,202,0.25)', boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-white/40">{SKILL}</span>
        <span className="flex items-center gap-1 text-xs font-black text-amber-300"><Zap size={13} /> {xp} XP</span>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={idx} initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.3 }}>
          <p className="text-xs text-[#30E3CA] font-bold mt-4">Einheit {idx + 1} von 5</p>
          <p className="text-xl font-black text-white mt-1 leading-snug">{UNITS[idx]}</p>
        </motion.div>
      </AnimatePresence>

      <div className="grid grid-cols-10 gap-1 mt-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-2 rounded-full transition-all duration-200"
            style={{ background: i < steps ? 'linear-gradient(90deg,#30E3CA,#66c0b6)' : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
      <div className="mt-4 rounded-2xl p-4 min-h-[92px]" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Schritt {Math.min(10, steps + 1)} · {STEP_TYPES[Math.min(9, steps)]}</p>
        <div className="mt-2 space-y-1.5">
          <div className="h-2.5 rounded bg-white/15 w-11/12" />
          <div className="h-2.5 rounded bg-white/10 w-8/12" />
          {steps % 3 !== 0 && (
            <div className="flex gap-1.5 pt-1">
              {[0, 1, 2].map((k) => (
                <div key={k} className="h-6 flex-1 rounded-lg" style={{ background: k === 1 ? 'rgba(74,222,128,0.2)' : 'rgba(255,255,255,0.06)', border: k === 1 ? '1px solid rgba(74,222,128,0.5)' : '1px solid transparent' }} />
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between mt-4 text-[11px] text-white/45">
        <span>{done} von 5 Einheiten geschafft</span>
        {steps >= 10 && <span className="text-[#4ade80] font-bold flex items-center gap-1"><Check size={12} /> Einheit bestanden</span>}
      </div>
    </div>
  );
}

function ExamCard({ answered }: { answered: number }) {
  const correct = Math.min(answered, 9); // 9 von 10 richtig → 90 %
  const score = answered === 0 ? 0 : Math.round((correct / 10) * 100);
  const passed = answered >= 10;
  return (
    <div className="w-full max-w-sm rounded-[28px] p-6 text-center"
      style={{ background: 'linear-gradient(160deg,#0b1726,#060c16)', border: `1px solid ${passed ? 'rgba(74,222,128,0.5)' : 'rgba(48,227,202,0.25)'}`, boxShadow: '0 30px 80px rgba(0,0,0,0.5)' }}>
      <Trophy size={28} className="mx-auto text-amber-300" />
      <p className="text-[11px] font-black uppercase tracking-widest text-white/40 mt-3">Abschlussprüfung · {SKILL}</p>
      <p className="text-6xl font-black mt-3 tabular-nums" style={{ color: passed ? '#4ade80' : '#fff' }}>{score}%</p>
      <div className="flex justify-center gap-1.5 mt-5">
        {Array.from({ length: 10 }).map((_, i) => {
          const state = i >= answered ? 'open' : i === 6 ? 'wrong' : 'right';
          return (
            <motion.span key={i} className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
              animate={{ scale: state === 'open' ? 1 : [1.4, 1] }}
              style={{
                background: state === 'open' ? 'rgba(255,255,255,0.08)' : state === 'right' ? '#4ade80' : '#f87171',
                color: '#000',
              }}>
              {state === 'right' ? '✓' : state === 'wrong' ? '×' : ''}
            </motion.span>
          );
        })}
      </div>
      <AnimatePresence>
        {passed && (
          <motion.p initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black text-black bg-[#4ade80]">
            <Check size={15} /> Bestanden
          </motion.p>
        )}
      </AnimatePresence>
      {!passed && <p className="text-xs text-white/40 mt-5">Bestehensgrenze 80 %</p>}
    </div>
  );
}

function LinkedInCard({ highlight, name }: { highlight: boolean; name: string }) {
  return (
    <div className="rounded-2xl bg-white text-[#1d2226] p-4 shadow-2xl transition-shadow"
      style={{ boxShadow: highlight ? `0 0 0 3px ${TEAL}, 0 25px 60px rgba(0,0,0,0.5)` : '0 25px 60px rgba(0,0,0,0.5)' }}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] font-semibold text-[#0a66c2]"><Linkedin size={15} /> {name || 'Dein Profil'}</span>
        {highlight && <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-black" style={{ background: TEAL }}>Neu hinzugefügt</span>}
      </div>
      <p className="text-[15px] font-semibold mt-2">Lizenzen und Zertifizierungen</p>
      <div className="flex gap-3 mt-2.5">
        <div className="w-11 h-11 rounded flex items-center justify-center flex-shrink-0 bg-[#0A192F]">
          <img src={LOGO} alt="" className="w-7 h-7" />
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold leading-snug">Fachkompetenz {SKILL}</p>
          <p className="text-[12px] text-[#1d2226]/75">DYD Career Academy · {new Date().toLocaleDateString('de-DE', { month: 'short', year: 'numeric' })}</p>
          <span className="inline-block mt-1.5 px-3 py-0.5 rounded-full border border-[#1d2226]/60 text-[12px] font-semibold">Nachweis anzeigen ↗</span>
        </div>
      </div>
    </div>
  );
}

export default AcademyScrollStory;
