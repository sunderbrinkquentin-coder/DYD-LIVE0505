import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, Sparkles, Brain, Building2,
  ArrowRight, Check, Award, PlayCircle, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LearningPathPaywall } from '../components/career/LearningPathPaywall';
import { careerService } from '../services/careerService';
import { certificateService } from '../services/certificateService';
import { LearningPath } from '../types/learningPath';
import { supabase } from '../lib/supabase';
import { parseSkills, skillDisplayName, skillFromPath, RawSkill } from '../utils/skills';

// ── Constants ──────────────────────────────────────────────────────────────────

const LEARNINGPATH_WEBHOOK_URL =
  import.meta.env.VITE_MAKE_WEBHOOK_LEARNINGPATH
  || 'https://hook.eu2.make.com/1pvur1oth8sibonqc3twq57itg2ti1d0';

const FINAL_EXAM_WEBHOOK_URL =
  import.meta.env.VITE_MAKE_WEBHOOK_FINAL_EXAM
  || 'https://hook.eu2.make.com/jp9n42qofc5zvtab8x58o3i2j53ebpt2';

// Statuses where curriculum generation is already in flight — do not re-trigger Make.
const IN_FLIGHT_STATUSES = new Set(['in_progress', 'curriculum_ready', 'completed']);

const POLL_INTERVAL_MS = 4_000;
const POLL_MAX = 75;

const TOTAL_UNITS = 5;

// Single source of truth for the pass threshold. Used by unit tests, the final
// exam, and every string that mentions a percentage.
export const MIN_PASS_SCORE = 80;

// Final exam generation gives up after this many polls (75 × 4s ≈ 5 min).
const FINAL_EXAM_POLL_MAX = 75;
const FINAL_EXAM_POLL_INTERVAL_MS = 4_000;

// ── Keyframes shared with CareerVisionSection ──────────────────────────────────

const GLOBAL_STYLES = `
  @keyframes lp_fadeUp    { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes lp_radarSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes lp_blipPop   { 0%,100% { opacity:0; r:2; } 50% { opacity:1; r:3.5; } }
  @keyframes lp_gradShift { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
  @keyframes lp_ctaPulse  { 0%,100% { box-shadow:0 0 0 0 rgba(48,227,202,0.4); } 60% { box-shadow:0 0 0 14px rgba(48,227,202,0); } }
  @keyframes lp_ticker    { 0% { opacity:0; transform:translateY(6px); } 15%,85% { opacity:1; transform:translateY(0); } 100% { opacity:0; transform:translateY(-6px); } }
  @keyframes lp_shimmer   { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes lp_orb1      { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(20px,-15px) scale(1.1); } 66% { transform:translate(-10px,20px) scale(0.95); } }
  @keyframes lp_orb2      { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(-25px,10px) scale(0.9); } 66% { transform:translate(15px,-20px) scale(1.05); } }
`;

// ── Smart progress bar ─────────────────────────────────────────────────────────

function SmartProgressBar({ done }: { done: boolean }) {
  const [pct, setPct] = useState(0);
  const pctRef   = useRef(0);
  const rafRef   = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (done) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pctRef.current = 100; setPct(100); return;
    }
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const e = now - startRef.current;
      const target = e < 12_000 ? (e / 12_000) * 60 : e < 70_000 ? 60 + ((e - 12_000) / 58_000) * 25 : 85;
      pctRef.current += (target - pctRef.current) * 0.04;
      setPct(Math.min(pctRef.current, 85));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [done]);

  const display = done ? 100 : Math.round(Math.min(pct, 85));
  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="text-white/45 font-medium">{done ? 'Lernpfad bereit!' : 'Lernpfad wird erstellt…'}</span>
        <span className="font-bold tabular-nums" style={{ color: done ? '#22c55e' : '#30E3CA' }}>{display}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
          style={{
            width: `${display}%`,
            background: done ? 'linear-gradient(90deg,#22c55e,#4ade80)' : 'linear-gradient(90deg,#66c0b6,#30E3CA,#7dd3fc)',
            backgroundSize: '200% 100%',
            animation: done ? 'none' : 'lp_gradShift 2s ease infinite',
          }}
        >
          {!done && (
            <div className="absolute inset-0 rounded-full"
              style={{ background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.35) 50%,transparent 100%)', backgroundSize: '200% 100%', animation: 'lp_shimmer 1.4s ease-in-out infinite' }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Curriculum generation loader ───────────────────────────────────────────────

const CURRICULUM_STEPS = [
  { id: 'skills',     label: 'Skill-Gaps werden strukturiert', detail: 'Priorisiere kritische Lernbereiche…' },
  { id: 'modules',    label: 'Lernmodule werden erstellt',     detail: 'Maßgeschneiderte Inhalte für dein Ziel…' },
  { id: 'resources',  label: 'Ressourcen werden kuratiert',    detail: 'Hochwertige Kurse, Artikel & Videos…' },
  { id: 'milestones', label: 'Meilensteine werden gesetzt',    detail: 'Messbare Fortschrittsziele…' },
  { id: 'timeline',   label: 'Zeitplan wird optimiert',        detail: 'Realistischer Lernplan für dich…' },
  { id: 'cert',       label: 'Zertifikat wird vorbereitet',    detail: 'Deine Leistung wird dokumentiert…' },
  { id: 'review',     label: 'Qualitätsprüfung',               detail: 'Finale Abstimmung auf dein Profil…' },
  { id: 'done',       label: 'Lernpfad wird fertiggestellt',   detail: 'Fast fertig…' },
];

function CurriculumLoader({ success, targetJob }: { success: boolean; targetJob: string }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [tickVisible, setTickVisible] = useState(true);
  const accent = success ? '#22c55e' : '#30E3CA';

  useEffect(() => {
    if (success) return;
    const id = setInterval(() => {
      setTickVisible(false);
      setTimeout(() => {
        setStepIdx((i) => (i + 1) % CURRICULUM_STEPS.length);
        setTickVisible(true);
      }, 350);
    }, 4_200);
    return () => clearInterval(id);
  }, [success]);

  const currentStep = CURRICULUM_STEPS[stepIdx];

  const messages = [
    `Erstelle persönlichen Lernpfad für ${targetJob}…`,
    'Kuratiere die besten Lernressourcen…',
    'Strukturiere Module nach Priorität…',
    'Setze erreichbare Meilensteine…',
    'Optimiere Lernreihenfolge für maximalen Impact…',
    'Bereite dein Abschlusszertifikat vor…',
    'Finaler Review deines Lernpfads…',
    'Lernpfad wird abgeschlossen…',
  ];
  const displayMsg = messages[stepIdx % messages.length];

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#050d14]">
      <style>{GLOBAL_STYLES}</style>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-64 h-64 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', top: '-60px', right: '-60px', animation: 'lp_orb1 8s ease-in-out infinite' }} />
        <div className="absolute w-48 h-48 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle,#66c0b6,transparent)', bottom: '-40px', left: '-40px', animation: 'lp_orb2 11s ease-in-out infinite' }} />
      </div>

      <div className="relative z-10 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `${accent}15`, border: `1px solid ${accent}35` }}>
            <Award size={18} style={{ color: accent }} />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${accent}99` }}>
              {success ? 'Lernpfad bereit' : 'Lernpfad wird erstellt'}
            </p>
            <p className="text-sm font-black text-white leading-tight">{targetJob}</p>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          <div className="flex-shrink-0 relative w-[110px] h-[110px] select-none">
            <svg viewBox="0 0 110 110" className="w-full h-full">
              <defs>
                <radialGradient id="lpRg" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={accent} stopOpacity={success ? '0.25' : '0.12'} />
                  <stop offset="100%" stopColor={accent} stopOpacity="0" />
                </radialGradient>
                <linearGradient id="lpSw" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={accent} stopOpacity="0" />
                  <stop offset="100%" stopColor={accent} stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <circle cx="55" cy="55" r="50" fill="url(#lpRg)" />
              {[44, 32, 20, 9].map((r) => (
                <circle key={r} cx="55" cy="55" r={r} fill="none" stroke={accent} strokeOpacity="0.2" strokeWidth="0.8" />
              ))}
              <line x1="55" y1="5" x2="55" y2="105" stroke={accent} strokeOpacity="0.12" strokeWidth="0.8" />
              <line x1="5" y1="55" x2="105" y2="55" stroke={accent} strokeOpacity="0.12" strokeWidth="0.8" />
              {!success ? (
                <g style={{ transformOrigin: '55px 55px', animation: 'lp_radarSpin 2s linear infinite' }}>
                  <path d="M55,55 L55,11" stroke="url(#lpSw)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M55,55 L55,11 A44,44 0 0,1 95,77 Z" fill={accent} fillOpacity="0.07" />
                </g>
              ) : (
                <g>
                  <circle cx="55" cy="55" r="18" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="1.5" />
                  <polyline points="46,55 53,62 66,47" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
              {[{ cx: 36, cy: 35, d: 0 }, { cx: 76, cy: 42, d: 0.5 }, { cx: 48, cy: 76, d: 1 }, { cx: 80, cy: 68, d: 1.5 }].map(({ cx, cy, d }, i) => (
                <circle key={i} cx={cx} cy={cy} r="2" fill={accent}
                  style={{ animation: 'lp_blipPop 2.2s ease-in-out infinite', animationDelay: `${d}s` }} />
              ))}
            </svg>
          </div>

          <div className="flex-1 space-y-1.5 min-w-0">
            {CURRICULUM_STEPS.slice(0, 5).map((step, i) => {
              const done = success || i < stepIdx;
              const active = !success && i === stepIdx;
              return (
                <div key={step.id} className="flex items-center gap-2.5 min-w-0"
                  style={{ opacity: done || active ? 1 : 0.3, transition: 'opacity 0.4s' }}>
                  <div className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: done ? '#22c55e22' : active ? `${accent}22` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${done ? '#22c55e' : active ? accent : 'rgba(255,255,255,0.1)'}`,
                    }}>
                    {done
                      ? <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      : active
                        ? <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
                        : <div className="w-1 h-1 rounded-full bg-white/20" />
                    }
                  </div>
                  <span className={`text-xs truncate ${done ? 'text-white/40 line-through' : active ? 'text-white/90 font-semibold' : 'text-white/25'}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl bg-white/[0.04] border border-white/8 px-4 py-3 flex items-center gap-3 min-h-[52px] overflow-hidden">
          <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
            style={{ background: `${accent}22`, border: `1px solid ${accent}40` }}>
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold text-white leading-snug"
              style={{ animation: tickVisible ? 'lp_ticker 4.2s ease forwards' : 'none', opacity: tickVisible ? undefined : 0 }}>
              {success ? 'Dein Lernpfad ist bereit!' : displayMsg}
            </p>
            {!success && <p className="text-xs text-white/35 mt-0.5">{currentStep.detail}</p>}
          </div>
          {success && (
            <div className="flex-shrink-0">
              <svg width="20" height="20" viewBox="0 0 20 20">
                <circle cx="10" cy="10" r="9" fill="#22c55e22" stroke="#22c55e" strokeWidth="1.5" />
                <polyline points="6,10 9,13 14,7" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
        </div>

        <SmartProgressBar done={success} />
      </div>
    </div>
  );
}

// ── Skill helpers for ResultView ───────────────────────────────────────────────

const IMPACT_TIERS = [
  { min: 5, color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)', label: 'Kritisch' },
  { min: 4, color: '#30E3CA', bg: 'rgba(48,227,202,0.08)', border: 'rgba(48,227,202,0.2)', label: 'Hoher Impact' },
  { min: 3, color: '#66c0b6', bg: 'rgba(102,192,182,0.07)', border: 'rgba(102,192,182,0.2)', label: 'Aufbau' },
  { min: 0, color: '#4ade80', bg: 'rgba(74,222,128,0.07)', border: 'rgba(74,222,128,0.2)', label: 'Quick Win' },
];
function tierFor(severity: number) { return IMPACT_TIERS.find((t) => severity >= t.min) ?? IMPACT_TIERS[3]; }

// ── Result view ────────────────────────────────────────────────────────────────

interface AnalysisResult {
  missingSkills: RawSkill[];
  currentSkills: RawSkill[];
  strategicOutlook: string;
  matchScore: number;
  targetJob: string;
  targetCompany: string;
  industry: string;
}

function ResultView({
  result, learningPath, onPaywallClose, onGoToDashboard, preselectSkill,
}: {
  result: AnalysisResult;
  learningPath: LearningPath;
  onPaywallClose: () => void;
  onGoToDashboard?: () => void;
  preselectSkill?: string;
}) {
  const [showPaywall, setShowPaywall] = useState(false);

  // Access is granted by exactly one thing: is_paid, written only by the Stripe
  // webhook with the service role.
  const isPaid = !!learningPath.is_paid;

  const [showAllCurrent, setShowAllCurrent] = useState(false);
  const { missingSkills, currentSkills, strategicOutlook, matchScore, targetJob, targetCompany, industry } = result;

  const visibleSkills = missingSkills
    .filter((s) => skillDisplayName(s) !== '(unbenannt)')
    .sort((a, b) => (b?.gap_severity ?? 0) - (a?.gap_severity ?? 0));
  const visibleCurrent = currentSkills.filter((s) => skillDisplayName(s) !== '(unbenannt)');
  const scoreColor = matchScore >= 70 ? '#22c55e' : matchScore >= 40 ? '#f59e0b' : '#30E3CA';

  const criticalSkills = visibleSkills.filter(s => (s?.gap_severity ?? 0) >= 4);
  const buildSkills    = visibleSkills.filter(s => (s?.gap_severity ?? 0) >= 2 && (s?.gap_severity ?? 0) < 4);

  // Vorauswahl: ?unlock_skill= vom Dashboard, sonst der Skill der Zeile, sonst der erste.
  const initialSkill =
    preselectSkill
    ?? skillFromPath(learningPath)
    ?? (visibleSkills[0] ? skillDisplayName(visibleSkills[0]) : null);

  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(initialSkill);

  // Für die Paywall: id der Skill-EIGENEN Zeile (lazy angelegt beim Klick).
  const [paywallPathId, setPaywallPathId] = useState<string | null>(null);
  const [resolvingUnlock, setResolvingUnlock] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);

  // Auswahl ist jetzt rein lokal — KEIN DB-Write mehr, damit die Analyse-Zeile
  // nie überschrieben wird. Die eigene Zeile entsteht erst beim Freischalten.
  const selectSkill = (name: string) => {
    if (isPaid) return;
    setSelectedSkillName(name);
    setUnlockError(null);
  };

  // Freischalten: erst die eigene Skill-Zeile besorgen, dann Paywall mit DEREN id.
  // startUnlock: kein DB-Call mehr
const startUnlock = () => {
  if (!selectedSkillName) return;
  setUnlockError(null);
  setShowPaywall(true);
};

  const allSelectableSkills = visibleSkills.slice(0, 8);

  return (
    <div className="space-y-5 max-w-2xl mx-auto" style={{ animation: 'lp_fadeUp 0.5s ease' }}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── 1. Orientierung: Ziel + Match-Score ──────────────────────── */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg,rgba(48,227,202,0.08) 0%,rgba(6,7,15,0.95) 70%)', border: '1px solid rgba(48,227,202,0.15)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <p className="text-[10px] font-black text-[#30E3CA]/60 uppercase tracking-widest">Dein Karriere-Ziel</p>
            <h3 className="text-xl font-black text-white leading-tight">{targetJob}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {targetCompany && (
                <span className="flex items-center gap-1 text-xs text-white/50">
                  <Building2 size={11} /> {targetCompany}
                </span>
              )}
              {industry && (
                <span
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                  style={{ background: 'rgba(102,192,182,0.1)', color: '#66c0b6', border: '1px solid rgba(102,192,182,0.2)' }}
                >
                  {industry}
                </span>
              )}
            </div>
          </div>
          {matchScore > 0 && (
            <div
              className="flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-xl min-w-[68px] text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span className="text-[22px] font-black leading-none" style={{ color: scoreColor }}>{matchScore}%</span>
              <span className="text-[10px] text-white/35 mt-0.5">Basis</span>
            </div>
          )}
        </div>

        {strategicOutlook && (
          <div className="mt-4 flex gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Brain size={14} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/55 leading-relaxed">{strategicOutlook}</p>
          </div>
        )}
      </div>

      {/* ── 2. Lücken-Analyse ────────────────────────────────────────── */}
      {visibleSkills.length > 0 && (
        <div className="space-y-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-white/30 px-1">Deine Wachstums-Chancen</p>

          {criticalSkills.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                <span className="text-xs font-bold text-[#f97316]/75">Zuerst lernen · Höchste Wirkung</span>
              </div>
              {criticalSkills.slice(0, 3).map((skill, i) => {
                const tier = tierFor(skill?.gap_severity ?? 4);
                return (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
                    style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
                    <span
                      className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-xs font-black mt-0.5"
                      style={{ background: `${tier.color}18`, color: tier.color }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white leading-tight">{skillDisplayName(skill)}</p>
                      {skill.pitch && <p className="text-xs text-white/45 mt-0.5 leading-relaxed">{skill.pitch}</p>}
                    </div>
                    <div className="flex gap-0.5 flex-shrink-0 mt-1">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <div key={j} className="w-1 h-3 rounded-sm"
                          style={{ background: j < (skill?.gap_severity ?? 4) ? tier.color : 'rgba(255,255,255,0.07)' }} />
                      ))}
                    </div>
                  </div>
                );
              })}
              {criticalSkills.length > 3 && (
                <p className="text-xs text-white/30 px-1">+{criticalSkills.length - 3} weitere kritische Skills im Lernpfad</p>
              )}
            </div>
          )}

          {buildSkills.length > 0 && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-[#66c0b6]" />
                <span className="text-xs font-bold text-[#66c0b6]/65">Danach aufbauen</span>
              </div>
              {buildSkills.slice(0, 4).map((skill, i) => (
                <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(102,192,182,0.05)', border: '1px solid rgba(102,192,182,0.12)' }}>
                  <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: '#66c0b6' }} />
                  <span className="text-sm text-white/65 truncate">{skillDisplayName(skill)}</span>
                </div>
              ))}
              {buildSkills.length > 4 && (
                <p className="text-xs text-white/30 px-1">+{buildSkills.length - 4} weitere</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 3. Basis-Skills ──────────────────────────────────────────── */}
      {visibleCurrent.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <Check size={12} className="text-[#66c0b6]" />
            <span className="text-xs font-bold text-white/40">Bereits vorhanden · {visibleCurrent.length} Skills</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(showAllCurrent ? visibleCurrent : visibleCurrent.slice(0, 6)).map((skill, i) => (
              <span key={i}
                className="px-2.5 py-1 rounded-lg text-[11px] text-white/45"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}
              >
                {skillDisplayName(skill)}
              </span>
            ))}
          </div>
          {visibleCurrent.length > 6 && (
            <button
              onClick={() => setShowAllCurrent(!showAllCurrent)}
              className="text-xs text-white/30 hover:text-white/55 transition-colors px-1"
            >
              {showAllCurrent ? 'Weniger anzeigen' : `+${visibleCurrent.length - 6} weitere`}
            </button>
          )}
        </div>
      )}

      {/* ── 4. Skill-Auswahl + Aktion ────────────────────────────────── */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(48,227,202,0.05)', border: '1px solid rgba(48,227,202,0.2)' }}
      >
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(48,227,202,0.4),transparent)' }} />
        <div className="p-5 space-y-4">

          {!isPaid && allSelectableSkills.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA]/60">
                Welchen Skill möchtest du freischalten?
              </p>
              <div className="flex flex-wrap gap-2">
                {allSelectableSkills.map((skill, i) => {
                  const name = skillDisplayName(skill);
                  const isSelected = selectedSkillName === name;
                  const tier = tierFor(skill?.gap_severity ?? 3);
                  return (
                    <button
                      key={i}
                      onClick={() => selectSkill(name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-[1.04] active:scale-95"
                      style={{
                        background: isSelected ? `${tier.color}18` : 'rgba(255,255,255,0.04)',
                        border: isSelected ? `1px solid ${tier.color}50` : '1px solid rgba(255,255,255,0.1)',
                        color: isSelected ? tier.color : 'rgba(255,255,255,0.5)',
                      }}
                    >
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 10 10">
                          <polyline points="2,5 4.5,7.5 8,3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                      {name}
                    </button>
                  );
                })}
              </div>

              {unlockError && (
                <p className="text-[11px] text-red-400/80 px-1 pt-1">{unlockError}</p>
              )}

              {selectedSkillName && (() => {
                const match = visibleSkills.find(s => skillDisplayName(s) === selectedSkillName);
                return match?.pitch ? (
                  <p className="text-[11px] text-white/45 leading-relaxed px-1 pt-1">{match.pitch}</p>
                ) : null;
              })()}
            </div>
          )}

          {isPaid && selectedSkillName && (
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA]/60">Dein Fokus-Skill</p>
              <h3 className="text-lg font-black text-white leading-tight">
                <span style={{ color: '#30E3CA' }}>{selectedSkillName}</span>
              </h3>
            </div>
          )}

          {isPaid ? (
            <button
              onClick={onGoToDashboard}
              className="group relative w-full py-4 rounded-xl font-black text-[15px] text-black flex items-center justify-center gap-3 overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', boxShadow: '0 4px 20px rgba(48,227,202,0.3)' }}
            >
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', backgroundSize: '200% 100%', animation: 'lp_shimmer 2s ease-in-out infinite' }} />
              <PlayCircle className="w-5 h-5 relative z-10" />
              <span className="relative z-10">Zum Lernpfad</span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <>
              <button
                onClick={startUnlock}
                disabled={!selectedSkillName || resolvingUnlock}
                className="group relative w-full py-4 rounded-xl font-black text-[15px] text-black flex items-center justify-center gap-3 overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', animation: selectedSkillName && !resolvingUnlock ? 'lp_ctaPulse 2.5s ease-in-out infinite' : 'none', boxShadow: '0 4px 20px rgba(48,227,202,0.3)' }}
              >
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', backgroundSize: '200% 100%', animation: 'lp_shimmer 2s ease-in-out infinite' }} />
                <Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">
                  {resolvingUnlock
                    ? 'Wird vorbereitet…'
                    : selectedSkillName ? `Lernpfad für "${selectedSkillName}" starten` : 'Skill auswählen…'}
                </span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-center text-[11px] text-white/25">Zertifikat inklusive · Einmalig ab 5 € · Lebenslanger Zugriff</p>
            </>
          )}
        </div>
      </div>


{showPaywall && (
  <LearningPathPaywall
    isOpen
    onClose={() => { setShowPaywall(false); onPaywallClose(); }}
    analysisPathId={learningPath.id}
    missingSkills={visibleSkills}
    targetJob={targetJob}
    targetCompany={targetCompany}
    skillCount={visibleSkills.length}
    selectedSkill={selectedSkillName ?? undefined}
  />
)}
    </div>
  );
}
// ── Quiz parsing ───────────────────────────────────────────────────────────────

interface QuizQuestion {
  question_id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_key: string;
  rationale: string;
  clt_rating?: string;
}

interface LearningResultRow {
  id: string;
  content: unknown;              // Array of 5 units
  status: string | null;
  final_exam: unknown;
  certificate_metadata: unknown;
}

const OPTION_KEYS = ['A', 'B', 'C', 'D'] as const;
const EMPTY_OPTIONS = { A: '', B: '', C: '', D: '' };

/**
 * Make emits `options` either as an object keyed A–D, or as a plain array with
 * a separate `correct_answer` string. Both shapes must produce the same result,
 * otherwise the exam renders four empty buttons and becomes unpassable.
 */
function normalizeOptions(
  rawOptions: unknown,
  rawCorrect: unknown,
): { options: { A: string; B: string; C: string; D: string }; correctKey: string } {
  if (Array.isArray(rawOptions)) {
    const opts = rawOptions.slice(0, 4).map(String);
    const options = { ...EMPTY_OPTIONS };
    opts.forEach((opt, i) => { options[OPTION_KEYS[i]] = opt; });

    const correctStr = typeof rawCorrect === 'string' ? rawCorrect : '';
    // correct_answer may be the option text, or already a key like "B".
    let idx = opts.indexOf(correctStr);
    if (idx < 0 && OPTION_KEYS.includes(correctStr as any)) {
      idx = OPTION_KEYS.indexOf(correctStr as any);
    }
    return { options, correctKey: idx >= 0 ? OPTION_KEYS[idx] : 'A' };
  }

  if (rawOptions && typeof rawOptions === 'object') {
    const src = rawOptions as Record<string, unknown>;
    const options = { ...EMPTY_OPTIONS };
    OPTION_KEYS.forEach((k) => { options[k] = String(src[k] ?? ''); });

    const correctStr = typeof rawCorrect === 'string' ? rawCorrect : 'A';
    if (OPTION_KEYS.includes(correctStr as any)) {
      return { options, correctKey: correctStr };
    }
    // correct_answer given as option text — resolve back to its key.
    const hit = OPTION_KEYS.find((k) => options[k] === correctStr);
    return { options, correctKey: hit ?? 'A' };
  }

  return { options: { ...EMPTY_OPTIONS }, correctKey: 'A' };
}

function toQuizQuestion(q: any, i: number): QuizQuestion {
  const { options, correctKey } = normalizeOptions(q.options, q.correct_key ?? q.correct_answer);
  return {
    question_id: q.question_id ?? i,
    question: q.question || '',
    options,
    correct_key: correctKey,
    rationale: q.rationale || q.explanation_if_wrong || '',
    clt_rating: q.clt_rating || '',
  };
}

/**
 * Pulls unit objects out of one `content` value, whatever shape Make used:
 * a JS array, a JSON string, a double-encoded JSON string, or a single object.
 */
function extractUnits(content: unknown): any[] {
  if (!content) return [];
  try {
    if (Array.isArray(content)) return content;
    if (typeof content === 'string') {
      let s = content.trim();
      if (s.startsWith('"')) s = JSON.parse(s) as string;
      if (!s.startsWith('[')) s = `[${s}]`;
      const p = JSON.parse(s);
      return Array.isArray(p) ? p : [p];
    }
    if (typeof content === 'object') return [content];
  } catch { /* */ }
  return [];
}

/**
 * Merges every learning_results row for a path into ONE synthetic row whose
 * `content` is a flat, de-duplicated, unit_id-sorted array of units.
 *
 * This is deliberately shape-agnostic: whether Make writes one row with an
 * array of 5 units, or 5 rows each holding one unit, the result is identical.
 * Downstream code (parseContentUnit / countContentUnits) then works unchanged.
 */
function mergeUnitRows(rows: (LearningResultRow & { unit_id?: unknown })[] | null): LearningResultRow | null {
  if (!rows || rows.length === 0) return null;

  const unitsById = new Map<number, any>();
  let positional = 0;

  for (const row of rows) {
    // Primäre ID: die DB-Spalte unit_id (garantiert 1..5, siehe Screenshot).
    // Fallback 1: unit_id-Feld im geparsten content. Fallback 2: laufende Position.
    const colId = Number((row as any).unit_id);
    const colIdValid = Number.isFinite(colId) && colId > 0;

    const units = extractUnits(row.content);
    for (const unit of units) {
      const fieldIdRaw = unit?.unit_id;
      const fieldId = Number(fieldIdRaw);
      const fieldIdValid = Number.isFinite(fieldId) && fieldId > 0;

      // Reihenfolge der Wahrheit: DB-Spalte > content-Feld > Position.
      const id = colIdValid ? colId : fieldIdValid ? fieldId : ++positional;

      const existing = unitsById.get(id);
      // Bei Konflikt gewinnt die zuerst geladene Row; spätere füllen nur Lücken.
      unitsById.set(id, existing ? { ...unit, ...existing } : unit);
    }
  }

  const units = [...unitsById.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([, u]) => u);

  const examRow = rows.find(r => r.final_exam != null);
  const certRow = rows.find(r => r.certificate_metadata != null);

  return {
    id: rows[0].id,
    content: units,
    status: rows[0].status ?? null,
    final_exam: examRow?.final_exam ?? null,
    certificate_metadata: certRow?.certificate_metadata ?? null,
  };
}

/** Extracts one unit (1-based) from the `content` column. */
function parseContentUnit(content: unknown, unitIndex: number): Record<string, any> | null {
  if (!content) return null;
  try {
    let units: any[];
    if (Array.isArray(content)) {
      units = content;
    } else if (typeof content === 'string') {
      let s = content.trim();
      if (s.startsWith('"')) s = JSON.parse(s) as string;
      if (!s.startsWith('[')) s = `[${s}]`;
      units = JSON.parse(s);
    } else if (typeof content === 'object') {
      units = [content];
    } else {
      return null;
    }
    return units.find((u: any) => u.unit_id === unitIndex) ?? units[unitIndex - 1] ?? null;
  } catch { return null; }
}

/** How many units the content column actually contains. */
function countContentUnits(content: unknown): number {
  if (!content) return 0;
  try {
    if (Array.isArray(content)) return content.length;
    if (typeof content === 'string') {
      let s = content.trim();
      if (s.startsWith('"')) s = JSON.parse(s) as string;
      if (!s.startsWith('[')) s = `[${s}]`;
      const parsed = JSON.parse(s);
      return Array.isArray(parsed) ? parsed.length : 1;
    }
    if (typeof content === 'object') return 1;
  } catch { /* */ }
  return 0;
}

function parseFinalExamQuestions(raw: unknown): QuizQuestion[] {
  if (!raw) return [];
  try {
    let data: any;
    if (Array.isArray(raw)) {
      data = raw;
    } else if (typeof raw === 'object') {
      const obj = raw as any;
      data = obj.final_exam || [obj];
    } else if (typeof raw === 'string') {
      let s = raw.trim();
      if (s.startsWith('"')) s = JSON.parse(s) as string;
      if (!s.startsWith('[') && !s.startsWith('{')) return [];
      if (!s.startsWith('[')) s = `[${s}]`;
      const parsed = JSON.parse(s);
      data = Array.isArray(parsed) ? parsed : parsed?.final_exam ?? [parsed];
    } else {
      return [];
    }
    if (!Array.isArray(data)) return [];
    return data.map(toQuizQuestion).filter((q) => q.question.trim() !== '');
  } catch { return []; }
}

function mapQuizQuestions(quiz: unknown): QuizQuestion[] {
  if (!Array.isArray(quiz)) return [];
  return quiz.map(toQuizQuestion).filter((q) => q.question.trim() !== '');
}

// ── FinalExamWaiting ──────────────────────────────────────────────────────────

const EXAM_STAGES = [
  { id: 'analyse',  icon: '🎯', label: 'Lernziele analysieren',   sub: 'IHK-Anforderungen werden geprüft',   dur: 0.20 },
  { id: 'profile',  icon: '🧠', label: 'Wissensprofil erstellen', sub: 'Deine Stärken werden bewertet',      dur: 0.25 },
  { id: 'generate', icon: '📝', label: 'Fragen generieren',       sub: '10 Prüfungsfragen werden erstellt',  dur: 0.30 },
  { id: 'quality',  icon: '✅', label: 'Qualitätsprüfung',        sub: 'Prüfungsstandards werden geprüft',   dur: 0.25 },
];

const EXAM_QUOTES = [
  { text: 'Prüfungen sind keine Hindernisse — sie sind Meilensteine.', author: 'Decide your Dream' },
  { text: 'Das Zertifikat beweist nicht nur dein Wissen — es beweist deine Disziplin.', author: 'IHK-Philosophie' },
  { text: 'Vorbereitung ist der Schlüssel zum Erfolg.', author: 'Benjamin Franklin' },
  { text: 'Du hast die Module gemeistert. Der Rest ist Formsache.', author: 'Decide your Dream' },
];

function FinalExamWaiting({ targetJob, skill }: { targetJob: string; skill: string }) {
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(Date.now());
  const TOTAL_MS = 90_000;

  useEffect(() => {
    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const frac = Math.min(elapsed / TOTAL_MS, 1);
      const eased = 1 - Math.pow(1 - frac, 2);
      const pct = Math.min(eased * 92, 92);
      setProgress(pct);
      let acc = 0;
      for (let i = 0; i < EXAM_STAGES.length; i++) {
        acc += EXAM_STAGES[i].dur * 100;
        if (pct < acc) { setStageIdx(i); break; }
        if (i === EXAM_STAGES.length - 1) setStageIdx(EXAM_STAGES.length - 1);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    const qi = setInterval(() => setQuoteIdx(i => (i + 1) % EXAM_QUOTES.length), 8_000);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      clearInterval(qi);
    };
  }, []);

  const stage = EXAM_STAGES[stageIdx];
  const color = '#f59e0b';

  return (
    <div className="max-w-2xl mx-auto space-y-4" style={{ animation: 'lp_fadeUp 0.5s ease' }}>
      <style>{`
        @keyframes fex_pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
      `}</style>

      <div className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(6,7,15,0.99))', border: '1px solid rgba(245,158,11,0.25)' }}>
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg,${color},${color}40,transparent)` }} />
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: color, animation: 'fex_pulse 1.3s ease infinite' }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${color}80` }}>
              Abschlussprüfung wird generiert
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-black text-white leading-tight">
              Deine IHK-Prüfung für <span style={{ color }}>{skill || targetJob}</span>
            </h2>
            <p className="text-sm text-white/40 mt-1.5">
              10 Fragen basierend auf deinen {TOTAL_UNITS} Lerneinheiten. Besteh die Prüfung und erhalte dein Zertifikat.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-white/35 font-bold">{stage?.label}</span>
              <span className="font-black tabular-nums" style={{ color }}>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
              <div className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progress}%`, background: `linear-gradient(90deg,${color}90,${color})`, boxShadow: `0 0 8px ${color}60` }} />
            </div>
            <p className="text-[11px] text-white/25">Dauert ca. 1–2 Minuten — diese Seite aktualisiert sich automatisch.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div className="px-4 py-3 border-b border-white/[0.06]">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Prüfungserstellung</p>
        </div>
        <div className="p-2 space-y-0.5">
          {EXAM_STAGES.map((s, i) => {
            const isDone = i < stageIdx;
            const isActive = i === stageIdx;
            return (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-500"
                style={{
                  background: isActive ? 'rgba(245,158,11,0.07)' : 'transparent',
                  border: isActive ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                  opacity: !isDone && !isActive ? 0.3 : 1,
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                  style={{
                    background: isDone ? 'rgba(34,197,94,0.1)' : isActive ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                    border: isDone ? '1px solid rgba(34,197,94,0.3)' : isActive ? `1px solid ${color}35` : '1px solid rgba(255,255,255,0.07)',
                  }}>
                  {isDone
                    ? <svg width="14" height="14" viewBox="0 0 14 14"><polyline points="2,7 5.5,10.5 12,4" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <span style={{ filter: !isActive ? 'grayscale(1)' : 'none' }}>{s.icon}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black leading-snug"
                    style={{ color: isDone ? 'rgba(255,255,255,0.3)' : isActive ? '#fff' : 'rgba(255,255,255,0.3)', textDecoration: isDone ? 'line-through' : 'none' }}>
                    {s.label}
                  </p>
                  {isActive && <p className="text-[11px] mt-0.5" style={{ color: `${color}80` }}>{s.sub}</p>}
                </div>
                {isActive && (
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: color, animation: 'fex_pulse 1.2s ease infinite' }} />
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color }}>Aktiv</span>
                  </div>
                )}
                {isDone && <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-green-400/50">Fertig</span>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Motivation</p>
        <p className="text-sm text-white/65 leading-relaxed italic">&ldquo;{EXAM_QUOTES[quoteIdx].text}&rdquo;</p>
        <p className="text-[11px] text-white/30 mt-2 font-bold">— {EXAM_QUOTES[quoteIdx].author}</p>
      </div>
    </div>
  );
}

// ── FinalExamError ────────────────────────────────────────────────────────────
// The old code returned silently after 75 polls, leaving the loader spinning
// forever. Generation failures now surface and offer a retry.

function FinalExamError({ onRetry, onBack }: { onRetry: () => void; onBack: () => void }) {
  return (
    <div className="max-w-lg mx-auto space-y-4 py-8" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
      <div className="rounded-2xl p-6 space-y-4 text-center"
        style={{ background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.25)' }}>
        <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center"
          style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)' }}>
          <AlertCircle size={22} className="text-red-400" />
        </div>
        <div className="space-y-1.5">
          <p className="text-lg font-black text-white">Die Prüfung konnte nicht erstellt werden</p>
          <p className="text-sm text-white/50 leading-relaxed">
            Die Generierung hat länger als fünf Minuten gedauert. Dein Lernfortschritt ist gespeichert — starte die Prüfung erneut.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <button
            onClick={onBack}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white/70 transition-all hover:bg-white/5"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            Zur Übersicht
          </button>
          <button
            onClick={onRetry}
            className="flex-1 py-3 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}>
            <RefreshCw size={15} />
            Erneut versuchen
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Learning content ──────────────────────────────────────────────────────────

// ── Learning content (Duolingo-style) ──────────────────────────────────────────

type UnitPhase = 'intro' | 'steps' | 'passed' | 'failed';

const INTERACTIVE_TYPES = new Set(['choice', 'true_false', 'fill_blank', 'order', 'match', 'scenario']);
const isInteractive = (s: any): boolean => INTERACTIVE_TYPES.has(s?.type);
const stepXp = (s: any): number => (typeof s?.xp === 'number' && s.xp > 0 ? s.xp : 10);

const HEARTS_START = 3;
const PAIR_COLORS = ['#30E3CA', '#38bdf8', '#a78bfa', '#f472b6', '#fbbf24'];

const ICON_EMOJI: Record<string, string> = {
  lightbulb: '💡', bulb: '💡', idea: '💡',
  cpu: '🧠', brain: '🧠', ai: '🧠',
  settings: '⚙️', gear: '⚙️', config: '⚙️',
  target: '🎯', goal: '🎯',
  zap: '⚡', energy: '⚡', bolt: '⚡',
  book: '📖', learn: '📖', education: '📖',
  rocket: '🚀', launch: '🚀',
  trophy: '🏆', award: '🏆', win: '🏆',
  star: '⭐', check: '✅', puzzle: '🧩',
  chart: '📊', graph: '📈', money: '💰',
  users: '👥', team: '👥', handshake: '🤝',
  globe: '🌐', network: '🌐', building: '🏢',
  shield: '🛡️', lock: '🔒', key: '🔑',
  clock: '⏰', calendar: '📅', flag: '🚩',
};
const iconEmoji = (name?: string): string => ICON_EMOJI[String(name || '').toLowerCase().replace(/^lucide-/, '')] || '📘';

function shuffleArr<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
function shuffleDistinct(arr: number[]): number[] {
  if (arr.length < 2) return [...arr];
  let s = shuffleArr(arr);
  let guard = 0;
  while (s.every((v, i) => v === arr[i]) && guard++ < 12) s = shuffleArr(arr);
  return s;
}

interface AnsState {
  single: number | null;          // fill_blank, scenario
  bool: boolean | null;           // true_false
  multi: number[];                // choice
  order: number[];                // order — sequence of ORIGINAL item indices
  match: Record<number, number>;  // match — leftIndex -> rightDisplayIndex
  activeLeft: number | null;      // match — currently selected left
}
const EMPTY_ANS: AnsState = { single: null, bool: null, multi: [], order: [], match: {}, activeLeft: null };

function LearningContent({
  learningPath,
  unitIndex,
  unitVariant,
  learningResult,
  userId,
  completedUnits,
  onUnitCompleted,
}: {
  learningPath: LearningPath;
  unitIndex: number;
  unitVariant: 'A' | 'B';
  learningResult: LearningResultRow;
  userId: string | null;
  completedUnits: Set<number>;
  onUnitCompleted: (unitIdx: number, score: number) => void;
}) {
  const thisUnitComplete = completedUnits.has(unitIndex);
  const contentUnit = parseContentUnit(learningResult?.content, unitIndex);

  const steps: any[] = Array.isArray(contentUnit?.steps) ? contentUnit!.steps : [];
  const learningObjectives: string[] = Array.isArray(contentUnit?.learning_objectives) ? contentUnit!.learning_objectives : [];
  const keyFacts: string[] = Array.isArray(contentUnit?.key_facts) ? contentUnit!.key_facts : [];
  const unitTitle: string = contentUnit?.title || learningPath.target_job || 'Lerneinheit';
  const unitEmoji = iconEmoji(contentUnit?.icon);

  const interactiveSteps = steps.filter(isInteractive);
  const maxXp = interactiveSteps.reduce((s, st) => s + stepXp(st), 0) || 1;
  const hasInteractive = interactiveSteps.length > 0;

  const [phase, setPhase] = useState<UnitPhase>('intro');
  const [stepIdx, setStepIdx] = useState(0);
  const [hearts, setHearts] = useState(HEARTS_START);
  const [earnedXp, setEarnedXp] = useState(0);

  const [ans, setAns] = useState<AnsState>(EMPTY_ANS);
  const [revealed, setRevealed] = useState(false);
  const [wasWrong, setWasWrong] = useState(false);   // any wrong attempt on THIS step → no XP
  const [lastCorrect, setLastCorrect] = useState(false);

  const [orderDisplay, setOrderDisplay] = useState<number[]>([]);        // shuffled original indices
  const [matchRights, setMatchRights] = useState<{ text: string; correctLeft: number }[]>([]);

  const [savingCompletion, setSavingCompletion] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const step = steps[stepIdx];

  // Per-step setup: reset answer state and (re)build shuffles. Depends only on
  // stepIdx + steps.length so it fires once per step and once when content
  // arrives — never on every render (parseContentUnit returns a fresh object).
  useEffect(() => {
    setAns(EMPTY_ANS);
    setRevealed(false);
    setWasWrong(false);
    setLastCorrect(false);
    const st = steps[stepIdx];
    if (st?.type === 'order' && Array.isArray(st.items)) {
      setOrderDisplay(shuffleDistinct(st.items.map((_: any, i: number) => i)));
    }
    if (st?.type === 'match' && Array.isArray(st.pairs)) {
      setMatchRights(shuffleArr(st.pairs.map((p: any, i: number) => ({ text: p.right, correctLeft: i }))));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepIdx, steps.length]);

  const persistCompletion = async (score: number) => {
    if (!userId) return;
    setSavingCompletion(true);
    setSaveError(null);
    try {
      const { error } = await supabase.from('unit_completions').upsert({
        learning_path_id: learningPath.id,
        user_id: userId,
        learning_result_id: learningResult.id,
        unit_index: unitIndex,
        variant: unitVariant,
        exam_score: score,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'learning_path_id,unit_index', ignoreDuplicates: true });
      if (error) throw error;
      setSaved(true);
    } catch {
      setSaveError('Fortschritt konnte nicht gespeichert werden. Du kannst es erneut versuchen.');
    } finally {
      setSavingCompletion(false);
    }
  };

  // ── Answer evaluation ─────────────────────────────────────────────────────

  const canCheck = (() => {
    if (!step) return false;
    switch (step.type) {
      case 'choice':     return ans.multi.length > 0;
      case 'true_false': return ans.bool !== null;
      case 'fill_blank': return ans.single !== null;
      case 'scenario':   return ans.single !== null;
      case 'order':      return ans.order.length === (step.items?.length ?? 0);
      case 'match':      return Object.keys(ans.match).length === (step.pairs?.length ?? 0);
      default:           return false;
    }
  })();

  const evaluate = (): boolean => {
    if (!step) return false;
    switch (step.type) {
      case 'choice': {
        const correct = new Set<number>(Array.isArray(step.correct) ? step.correct : []);
        const sel = new Set<number>(ans.multi);
        return correct.size === sel.size && [...correct].every((i) => sel.has(i));
      }
      case 'true_false': return ans.bool === step.answer;
      case 'fill_blank': return ans.single === step.correct;
      case 'scenario':   return ans.single === step.correct;
      case 'order':      return ans.order.length === step.items.length && ans.order.every((v, i) => v === i);
      case 'match':      return step.pairs.every((_: any, i: number) => matchRights[ans.match[i]]?.correctLeft === i);
      default:           return true;
    }
  };

  const onCheck = () => {
    const correct = evaluate();
    setRevealed(true);
    setLastCorrect(correct);
    if (correct) {
      if (!wasWrong) setEarnedXp((x) => x + stepXp(step));
    } else {
      setHearts((h) => Math.max(0, h - 1));
      setWasWrong(true);
    }
  };

  const onRetry = () => {
    setAns(EMPTY_ANS);
    setRevealed(false);
    setLastCorrect(false);
    // wasWrong stays true → no XP even once solved
  };

  const finishUnit = () => {
    const pct = hasInteractive ? Math.round((earnedXp / maxXp) * 100) : 100;
    if (pct >= MIN_PASS_SCORE) {
      setPhase('passed');
      persistCompletion(pct);
    } else {
      setPhase('failed');
    }
  };

  const onContinue = () => {
    if (stepIdx < steps.length - 1) setStepIdx(stepIdx + 1);
    else finishUnit();
  };

  const restart = () => {
    setPhase('intro');
    setStepIdx(0);
    setHearts(HEARTS_START);
    setEarnedXp(0);
    setAns(EMPTY_ANS);
    setRevealed(false);
    setWasWrong(false);
    setLastCorrect(false);
    setSaved(false);
    setSaveError(null);
  };

  const finalPct = hasInteractive ? Math.round((earnedXp / maxXp) * 100) : 100;
  const heartsGone = hearts <= 0;

  // ── Content not arrived yet ────────────────────────────────────────────────

  if (!contentUnit) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 max-w-sm mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(48,227,202,0.1)', border: '1px solid rgba(48,227,202,0.25)' }}>
          <Loader2 className="w-7 h-7 text-[#30E3CA] animate-spin" />
        </div>
        <div>
          <p className="text-white font-black text-lg">Lerneinheit wird geladen…</p>
          <p className="text-white/45 text-sm mt-1.5 leading-relaxed">
            Inhalte werden im Hintergrund generiert. Diese Seite aktualisiert sich automatisch.
          </p>
        </div>
      </div>
    );
  }

  // ── INTRO ──────────────────────────────────────────────────────────────────

  if (phase === 'intro') {
    return (
      <div className="space-y-6 max-w-2xl mx-auto" style={{ animation: 'lp_fadeUp 0.45s ease' }}>
        <style>{GLOBAL_STYLES}</style>

        {thisUnitComplete && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
            <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="1.5" /><polyline points="3.5,7 6,9.5 10.5,4.5" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <p className="text-xs font-black text-green-400/80">Einheit {unitIndex} bereits abgeschlossen — du kannst sie wiederholen.</p>
          </div>
        )}

        <div className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(48,227,202,0.1) 0%,rgba(6,7,15,0.98) 65%)', border: '1px solid rgba(48,227,202,0.25)' }}>
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(48,227,202,0.6),transparent)' }} />
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
                style={{ background: 'rgba(48,227,202,0.12)', border: '1px solid rgba(48,227,202,0.3)' }}>
                {unitEmoji}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/60">Einheit {unitIndex}</span>
                <h2 className="text-2xl font-black text-white leading-tight">{unitTitle}</h2>
              </div>
            </div>
          </div>
        </div>

        {learningObjectives.length > 0 && (
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 mb-3">Nach dieser Einheit kannst du…</p>
            <div className="space-y-2">
              {learningObjectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
                  style={{ background: 'rgba(102,192,182,0.06)', border: '1px solid rgba(102,192,182,0.14)' }}>
                  <div className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black mt-0.5"
                    style={{ background: 'rgba(48,227,202,0.12)', color: '#30E3CA', border: '1px solid rgba(48,227,202,0.22)' }}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-white/80 leading-relaxed">{obj}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {keyFacts.length > 0 && (
          <div className="rounded-xl px-4 py-4 space-y-2"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Kernfakten</p>
            {keyFacts.map((f, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#30E3CA] flex-shrink-0 mt-1.5" />
                <p className="text-xs text-white/60 leading-relaxed">{f}</p>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-2">
          <div className="px-3 py-3.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xl mb-1">{'❤️❤️❤️'}</div>
            <p className="text-[10px] text-white/40 leading-snug">3 Leben — bei Fehlern zählt jedes</p>
          </div>
          <div className="px-3 py-3.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xl mb-1">⚡</div>
            <p className="text-[10px] text-white/40 leading-snug">{maxXp} XP zu holen</p>
          </div>
          <div className="px-3 py-3.5 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-xl mb-1">🏆</div>
            <p className="text-[10px] text-white/40 leading-snug">{MIN_PASS_SCORE}% XP zum Bestehen</p>
          </div>
        </div>

        <button
          onClick={() => { setStepIdx(0); setHearts(HEARTS_START); setEarnedXp(0); setPhase('steps'); }}
          disabled={steps.length === 0}
          className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', boxShadow: '0 4px 24px rgba(48,227,202,0.3)' }}>
          Lerneinheit starten
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // ── PASSED ─────────────────────────────────────────────────────────────────

  if (phase === 'passed') {
    return (
      <div className="max-w-2xl mx-auto space-y-4" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
        <style>{GLOBAL_STYLES}</style>
        <div className="rounded-2xl p-6 text-center space-y-3"
          style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <div className="text-5xl">🎉</div>
          <div className="text-4xl font-black" style={{ color: '#4ade80' }}>{finalPct}%</div>
          <p className="text-lg font-black text-white">Einheit {unitIndex} bestanden!</p>
          <p className="text-sm text-white/55">
            {earnedXp} von {maxXp} XP · {hearts} von {HEARTS_START} Leben übrig
          </p>
        </div>

        {savingCompletion && (
          <div className="flex items-center justify-center gap-2 text-[#30E3CA]/70 text-xs">
            <Loader2 size={13} className="animate-spin" />
            <span>Fortschritt wird gespeichert…</span>
          </div>
        )}
        {saveError && (
          <div className="rounded-xl px-4 py-3.5 space-y-3" style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)' }}>
            <p className="text-xs text-red-400/85 leading-relaxed">{saveError}</p>
            <button onClick={() => persistCompletion(finalPct)} disabled={savingCompletion}
              className="w-full py-2.5 rounded-lg font-bold text-xs text-white/80 transition-all hover:bg-white/5 disabled:opacity-40"
              style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
              Erneut speichern
            </button>
          </div>
        )}

        <button
          onClick={() => onUnitCompleted(unitIndex, finalPct)}
          className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#22c55e,#4ade80)', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>
          Weiter zur Übersicht
          <ArrowRight size={18} />
        </button>
      </div>
    );
  }

  // ── FAILED ─────────────────────────────────────────────────────────────────

  if (phase === 'failed') {
    return (
      <div className="max-w-2xl mx-auto space-y-4" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
        <style>{GLOBAL_STYLES}</style>
        <div className="rounded-2xl p-6 text-center space-y-3"
          style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)' }}>
          <div className="text-5xl">{heartsGone ? '💔' : '📉'}</div>
          <p className="text-lg font-black text-white">
            {heartsGone ? 'Keine Leben mehr' : 'XP-Schwelle nicht erreicht'}
          </p>
          <p className="text-sm text-white/55 leading-relaxed">
            {heartsGone
              ? 'Du hast alle drei Leben verbraucht. Kein Problem — starte die Einheit neu und versuche es erneut.'
              : `Du hast ${finalPct}% der XP erreicht — für das Bestehen sind mindestens ${MIN_PASS_SCORE}% nötig. Wiederhole die Einheit.`}
          </p>
        </div>
        <button
          onClick={restart}
          className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', boxShadow: '0 4px 20px rgba(48,227,202,0.25)' }}>
          <RefreshCw size={16} />
          Einheit wiederholen
        </button>
      </div>
    );
  }

  // ── STEPS ──────────────────────────────────────────────────────────────────

  const progressPct = steps.length > 0 ? Math.round((stepIdx / steps.length) * 100) : 0;
  const isTeach = step?.type === 'teach';

  return (
    <div className="space-y-5 max-w-2xl mx-auto" style={{ animation: 'lp_fadeUp 0.35s ease' }}>
      <style>{GLOBAL_STYLES}</style>

      {/* Top bar — progress + hearts + xp */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
          <div className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#66c0b6,#30E3CA)' }} />
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          {Array.from({ length: HEARTS_START }, (_, i) => (
            <span key={i} className="text-base leading-none" style={{ opacity: i < hearts ? 1 : 0.4, filter: i < hearts ? 'none' : 'grayscale(1)' }}>
              {i < hearts ? '❤️' : '🤍'}
            </span>
          ))}
        </div>
        <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-black"
          style={{ background: 'rgba(48,227,202,0.1)', border: '1px solid rgba(48,227,202,0.2)', color: '#30E3CA' }}>
          ⚡ {earnedXp}
        </div>
      </div>

      <p className="text-[10px] font-black uppercase tracking-widest text-white/25 px-1">
        Schritt {stepIdx + 1} / {steps.length}
      </p>

      {/* ── teach ── */}
      {isTeach && (
        <div className="space-y-5" style={{ animation: 'lp_fadeUp 0.3s ease' }}>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg,rgba(48,227,202,0.08) 0%,rgba(6,7,15,0.98) 60%)', border: '1px solid rgba(48,227,202,0.2)' }}>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
                  style={{ background: 'rgba(48,227,202,0.12)', border: '1px solid rgba(48,227,202,0.28)' }}>
                  {iconEmoji(step.icon)}
                </div>
                <h3 className="text-lg font-black text-white leading-tight">{step.title}</h3>
              </div>
              {step.body && <p className="text-sm text-white/75 leading-relaxed whitespace-pre-line">{step.body}</p>}
              {step.example && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#66c0b6]/70 mb-1">Beispiel</p>
                  <p className="text-sm text-white/60 leading-relaxed">{step.example}</p>
                </div>
              )}
            </div>
          </div>
          <button onClick={onContinue}
            className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', boxShadow: '0 4px 20px rgba(48,227,202,0.25)' }}>
            Verstanden
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* ── interactive ── */}
      {!isTeach && step && (
        <div className="space-y-4" style={{ animation: 'lp_fadeUp 0.3s ease' }}>

          {/* Prompt / question */}
          <div className="rounded-2xl px-5 py-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)' }}>
            {step.type === 'scenario' && step.situation && (
              <div className="mb-3 rounded-xl px-3.5 py-3" style={{ background: 'rgba(129,140,248,0.08)', border: '1px solid rgba(129,140,248,0.2)' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-[#818cf8]/80 mb-1">Situation</p>
                <p className="text-sm text-white/75 leading-relaxed">{step.situation}</p>
              </div>
            )}
            <p className="text-base font-bold text-white leading-snug">
              {step.type === 'true_false' ? step.statement
                : step.type === 'scenario' ? step.question
                : step.type === 'fill_blank'
                  ? <span>{step.text_before} <span className="px-2 text-[#30E3CA]">____</span> {step.text_after}</span>
                  : step.prompt}
            </p>
            {step.type === 'choice' && Array.isArray(step.correct) && step.correct.length > 1 && (
              <p className="text-[11px] text-white/35 mt-1.5">Mehrfachauswahl möglich</p>
            )}
          </div>

          {/* choice */}
          {step.type === 'choice' && (
            <div className="space-y-2">
              {(step.options as string[]).map((opt, i) => {
                const selected = ans.multi.includes(i);
                const isMulti = Array.isArray(step.correct) && step.correct.length > 1;
                let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.09)', color = 'rgba(255,255,255,0.8)';
                if (revealed) {
                  const isCorrect = (step.correct as number[]).includes(i);
                  if (isCorrect) { bg = 'rgba(74,222,128,0.1)'; border = 'rgba(74,222,128,0.4)'; color = '#4ade80'; }
                  else if (selected) { bg = 'rgba(248,113,113,0.08)'; border = 'rgba(248,113,113,0.3)'; color = '#f87171'; }
                  else color = 'rgba(255,255,255,0.25)';
                } else if (selected) { bg = 'rgba(48,227,202,0.1)'; border = 'rgba(48,227,202,0.35)'; color = '#30E3CA'; }
                return (
                  <button key={i} disabled={revealed}
                    onClick={() => setAns((a) => isMulti
                      ? { ...a, multi: a.multi.includes(i) ? a.multi.filter((x) => x !== i) : [...a.multi, i] }
                      : { ...a, multi: [i] })}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{ background: bg, border: `1px solid ${border}`, color }}>
                    <span className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center"
                      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}` }}>
                      {selected && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2,5 4,7 8,3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </span>
                    <span className="text-sm leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* true_false */}
          {step.type === 'true_false' && (
            <div className="grid grid-cols-2 gap-2">
              {[{ v: true, label: 'Wahr' }, { v: false, label: 'Falsch' }].map(({ v, label }) => {
                const selected = ans.bool === v;
                let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.09)', color = 'rgba(255,255,255,0.8)';
                if (revealed) {
                  if (v === step.answer) { bg = 'rgba(74,222,128,0.1)'; border = 'rgba(74,222,128,0.4)'; color = '#4ade80'; }
                  else if (selected) { bg = 'rgba(248,113,113,0.08)'; border = 'rgba(248,113,113,0.3)'; color = '#f87171'; }
                } else if (selected) { bg = 'rgba(48,227,202,0.1)'; border = 'rgba(48,227,202,0.35)'; color = '#30E3CA'; }
                return (
                  <button key={label} disabled={revealed} onClick={() => setAns((a) => ({ ...a, bool: v }))}
                    className="py-4 rounded-xl font-black text-sm transition-all"
                    style={{ background: bg, border: `1px solid ${border}`, color }}>
                    {label}
                  </button>
                );
              })}
            </div>
          )}

          {/* fill_blank & scenario — single choice from options */}
          {(step.type === 'fill_blank' || step.type === 'scenario') && (
            <div className="space-y-2">
              {(step.options as string[]).map((opt, i) => {
                const selected = ans.single === i;
                let bg = 'rgba(255,255,255,0.03)', border = 'rgba(255,255,255,0.09)', color = 'rgba(255,255,255,0.8)';
                if (revealed) {
                  if (i === step.correct) { bg = 'rgba(74,222,128,0.1)'; border = 'rgba(74,222,128,0.4)'; color = '#4ade80'; }
                  else if (selected) { bg = 'rgba(248,113,113,0.08)'; border = 'rgba(248,113,113,0.3)'; color = '#f87171'; }
                  else color = 'rgba(255,255,255,0.25)';
                } else if (selected) { bg = 'rgba(48,227,202,0.1)'; border = 'rgba(48,227,202,0.35)'; color = '#30E3CA'; }
                return (
                  <button key={i} disabled={revealed} onClick={() => setAns((a) => ({ ...a, single: i }))}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{ background: bg, border: `1px solid ${border}`, color }}>
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                      style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${border}` }}>{String.fromCharCode(65 + i)}</span>
                    <span className="text-sm leading-relaxed">{opt}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* order — tap items into sequence */}
          {step.type === 'order' && (
            <div className="space-y-2">
              {orderDisplay.map((origIdx) => {
                const pos = ans.order.indexOf(origIdx);
                const placed = pos >= 0;
                return (
                  <button key={origIdx} disabled={revealed || placed}
                    onClick={() => setAns((a) => ({ ...a, order: [...a.order, origIdx] }))}
                    className="w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl transition-all"
                    style={{
                      background: placed ? 'rgba(48,227,202,0.1)' : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${placed ? 'rgba(48,227,202,0.35)' : 'rgba(255,255,255,0.09)'}`,
                      color: placed ? '#30E3CA' : 'rgba(255,255,255,0.8)', opacity: placed ? 0.7 : 1,
                    }}>
                    <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                      style={{ background: placed ? 'rgba(48,227,202,0.2)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      {placed ? pos + 1 : '·'}
                    </span>
                    <span className="text-sm leading-relaxed">{step.items[origIdx]}</span>
                  </button>
                );
              })}
              {ans.order.length > 0 && !revealed && (
                <button onClick={() => setAns((a) => ({ ...a, order: [] }))}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors px-1">Zurücksetzen</button>
              )}
            </div>
          )}

          {/* match — tap left then right */}
          {step.type === 'match' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  {(step.pairs as any[]).map((p, li) => {
                    const matchedRight = ans.match[li];
                    const isMatched = matchedRight !== undefined;
                    const isActive = ans.activeLeft === li;
                    const col = PAIR_COLORS[li % PAIR_COLORS.length];
                    return (
                      <button key={li} disabled={revealed}
                        onClick={() => setAns((a) => {
                          if (a.match[li] !== undefined) { const m = { ...a.match }; delete m[li]; return { ...a, match: m, activeLeft: null }; }
                          return { ...a, activeLeft: li };
                        })}
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                        style={{
                          background: isMatched ? `${col}18` : isActive ? 'rgba(48,227,202,0.12)' : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isMatched ? `${col}55` : isActive ? 'rgba(48,227,202,0.4)' : 'rgba(255,255,255,0.09)'}`,
                          color: isMatched ? col : 'rgba(255,255,255,0.8)',
                        }}>
                        {isMatched && <span className="flex-shrink-0 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center" style={{ background: col, color: '#04121a' }}>{li + 1}</span>}
                        <span className="leading-snug">{p.left}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="space-y-2">
                  {matchRights.map((r, ri) => {
                    const usedByLeft = Object.keys(ans.match).find((k) => ans.match[Number(k)] === ri);
                    const isUsed = usedByLeft !== undefined;
                    const col = isUsed ? PAIR_COLORS[Number(usedByLeft) % PAIR_COLORS.length] : '';
                    return (
                      <button key={ri} disabled={revealed || isUsed || ans.activeLeft === null}
                        onClick={() => setAns((a) => a.activeLeft === null ? a : ({ ...a, match: { ...a.match, [a.activeLeft]: ri }, activeLeft: null }))}
                        className="w-full text-left flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all"
                        style={{
                          background: isUsed ? `${col}18` : 'rgba(255,255,255,0.03)',
                          border: `1px solid ${isUsed ? `${col}55` : 'rgba(255,255,255,0.09)'}`,
                          color: isUsed ? col : 'rgba(255,255,255,0.8)', opacity: isUsed ? 0.85 : 1,
                        }}>
                        {isUsed && <span className="flex-shrink-0 w-4 h-4 rounded-full text-[9px] font-black flex items-center justify-center" style={{ background: col, color: '#04121a' }}>{Number(usedByLeft) + 1}</span>}
                        <span className="leading-snug">{r.text}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {Object.keys(ans.match).length > 0 && !revealed && (
                <button onClick={() => setAns((a) => ({ ...a, match: {}, activeLeft: null }))}
                  className="text-xs text-white/40 hover:text-white/70 transition-colors px-1">Zurücksetzen</button>
              )}
            </div>
          )}

          {/* Footer — check / feedback / continue */}
          {!revealed ? (
            <button disabled={!canCheck} onClick={onCheck}
              className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', boxShadow: canCheck ? '0 4px 20px rgba(48,227,202,0.25)' : 'none' }}>
              Prüfen
              <Check size={18} />
            </button>
          ) : (
            <div className="space-y-3">
              <div className="flex gap-2.5 items-start p-3.5 rounded-xl"
                style={{ background: lastCorrect ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${lastCorrect ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                <div className="flex-shrink-0 mt-0.5">
                  {lastCorrect
                    ? <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="rgba(74,222,128,0.15)" stroke="#4ade80" strokeWidth="1.5" /><polyline points="4.5,8 7,10.5 11.5,5" fill="none" stroke="#4ade80" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    : <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="1.5" /><line x1="5.5" y1="5.5" x2="10.5" y2="10.5" stroke="#f87171" strokeWidth="1.6" strokeLinecap="round" /><line x1="10.5" y1="5.5" x2="5.5" y2="10.5" stroke="#f87171" strokeWidth="1.6" strokeLinecap="round" /></svg>}
                </div>
                <div>
                  <p className="text-sm font-black" style={{ color: lastCorrect ? '#4ade80' : '#f87171' }}>
                    {lastCorrect ? (wasWrong ? 'Richtig!' : `Richtig! +${stepXp(step)} XP`) : 'Nicht ganz'}
                  </p>
                  {step.explanation && <p className="text-xs text-white/55 mt-1 leading-relaxed">{step.explanation}</p>}
                  {!lastCorrect && <p className="text-[11px] text-white/35 mt-1.5">Ein Leben verloren · {hearts} übrig</p>}
                </div>
              </div>

              {lastCorrect ? (
                <button onClick={onContinue}
                  className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#4ade80)', boxShadow: '0 4px 20px rgba(34,197,94,0.25)' }}>
                  {stepIdx < steps.length - 1 ? 'Weiter' : 'Einheit abschließen'}
                  <ArrowRight size={18} />
                </button>
              ) : heartsGone ? (
                <button onClick={() => setPhase('failed')}
                  className="w-full py-4 rounded-2xl font-black text-[15px] text-white flex items-center justify-center gap-2 transition-all"
                  style={{ background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.3)' }}>
                  Zum Ergebnis
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button onClick={onRetry}
                  className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}>
                  <RefreshCw size={16} />
                  Nochmal versuchen
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
// ── Module overview ───────────────────────────────────────────────────────────

const ARCS_PHASES = [
  { label: 'Attention',    sub: 'Einstieg & Motivation', icon: 'A' },
  { label: 'Relevance',    sub: 'Lernziele & Bedeutung', icon: 'R' },
  { label: 'Confidence',   sub: 'Geführte Übung',        icon: 'C' },
  { label: 'Satisfaction', sub: 'Festigung & Reflexion', icon: 'S' },
  { label: 'Prüfung',      sub: 'Einheitentest',         icon: 'P' },
];

const UNIT_COLORS = ['#30E3CA', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6'];
const UNIT_ICONS  = ['🎯', '🧩', '⚡', '🔬', '🏆'];

interface ModuleOverviewProps {
  learningPath: LearningPath;
  learningResult: LearningResultRow | null;
  completedUnits: Set<number>;
  unitScores: Map<number, number>;
  allUnitsPassed: boolean;
  onOpenUnit: (idx: number) => void;
  onStartFinalExam: () => void;
}

function ModuleOverview({
  learningPath, learningResult, completedUnits, unitScores,
  allUnitsPassed, onOpenUnit, onStartFinalExam,
}: ModuleOverviewProps) {
  const doneCount = completedUnits.size;
  const availableUnits = countContentUnits(learningResult?.content);
  const isGenerating = availableUnits === 0;
  const progressPct = Math.round((doneCount / TOTAL_UNITS) * 100);

  const skillLabel = skillFromPath(learningPath);

  return (
    <div className="max-w-2xl mx-auto space-y-4" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
      <style>{`
        @keyframes mo_shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes mo_pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes mo_glow { 0%,100%{box-shadow:0 0 0 0 rgba(251,191,36,0)} 50%{box-shadow:0 0 20px 4px rgba(251,191,36,0.15)} }
      `}</style>

      {/* Hero */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#040c14 0%,#061018 50%,#030810 100%)', border: '1px solid rgba(48,227,202,0.18)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(48,227,202,0.1) 0%,transparent 70%)', transform: 'translate(20%,-20%)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(56,189,248,0.07) 0%,transparent 70%)', transform: 'translate(-20%,20%)' }} />

        <div className="relative p-6 space-y-4">
          {skillLabel && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(48,227,202,0.1)', border: '1px solid rgba(48,227,202,0.25)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#30E3CA]" style={{ animation: 'mo_pulse 2s ease infinite' }} />
              <span className="text-xs font-black text-[#30E3CA] tracking-wide">{skillLabel}</span>
            </div>
          )}

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Lernpfad</p>
            <h2 className="text-2xl font-black text-white leading-tight">{learningPath.target_job}</h2>
          </div>

          <div className="flex items-center gap-4 pt-1">
            <div className="relative flex-shrink-0 w-14 h-14">
              <svg width="56" height="56" viewBox="0 0 56 56" className="-rotate-90">
                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle cx="28" cy="28" r="22" fill="none" stroke="#30E3CA" strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - progressPct / 100)}`}
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[13px] font-black text-white">{progressPct}%</span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5">
              <div className="flex gap-1">
                {Array.from({ length: TOTAL_UNITS }, (_, i) => (
                  <div key={i} className="flex-1 h-2 rounded-full transition-all duration-500"
                    style={{
                      background: completedUnits.has(i + 1)
                        ? `linear-gradient(90deg,${UNIT_COLORS[i]},${UNIT_COLORS[Math.min(i + 1, TOTAL_UNITS - 1)]})`
                        : 'rgba(255,255,255,0.08)',
                    }} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">
                  {doneCount === 0 ? 'Noch nicht gestartet' : doneCount === TOTAL_UNITS ? 'Alle Einheiten bestanden!' : `${doneCount} von ${TOTAL_UNITS} Einheiten`}
                </span>
                {doneCount > 0 && doneCount < TOTAL_UNITS && (
                  <span className="text-[10px] font-black text-[#30E3CA]/70">Weiter mit Einheit {doneCount + 1}</span>
                )}
              </div>
            </div>
          </div>

          {doneCount === 0 && (
            <p className="text-xs text-white/40 leading-relaxed">
              Dein strukturierter Weg zum Ziel — {TOTAL_UNITS} Einheiten, aufeinander aufbauend. Starte mit Einheit 1.
            </p>
          )}
          {doneCount > 0 && doneCount < TOTAL_UNITS && (
            <p className="text-xs text-white/40 leading-relaxed">
              Stark! Du bist bereits {progressPct}% durch. Jede abgeschlossene Einheit bringt dich messbar näher an dein Ziel.
            </p>
          )}
          {doneCount === TOTAL_UNITS && (
            <p className="text-xs text-green-400/70 leading-relaxed font-semibold">
              Alle Einheiten bestanden — du bist bereit für die Abschlussprüfung und dein Zertifikat.
            </p>
          )}
        </div>
      </div>

      {isGenerating && (
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: 'rgba(48,227,202,0.04)', border: '1px solid rgba(48,227,202,0.15)' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(48,227,202,0.08)', border: '1px solid rgba(48,227,202,0.2)' }}>
            <Loader2 size={18} className="animate-spin text-[#30E3CA]" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Lernmodule werden generiert…</p>
            <p className="text-xs text-white/40 mt-0.5">Personalisierte Einheiten werden vorbereitet — dauert 1–2 Minuten.</p>
          </div>
        </div>
      )}

      {!isGenerating && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">
            Deine {TOTAL_UNITS} Lerneinheiten
          </p>
          {Array.from({ length: TOTAL_UNITS }, (_, i) => {
            const idx = i + 1;
            const done = completedUnits.has(idx);
            const score = unitScores.get(idx);
            const phase = ARCS_PHASES[i];
            const color = UNIT_COLORS[i];
            const icon = UNIT_ICONS[i];

            // A unit is reachable when the previous one is passed AND its content exists.
            const contentReady = idx <= availableUnits;
            const isNext = !done && (i === 0 || completedUnits.has(i)) && contentReady;
            const locked = !done && !isNext;

            return (
              <button
                key={idx}
                onClick={() => !locked && onOpenUnit(idx)}
                disabled={locked}
                className="group w-full text-left rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.012] active:scale-[0.99] disabled:cursor-not-allowed"
                style={{
                  background: done
                    ? 'linear-gradient(135deg,rgba(34,197,94,0.06) 0%,rgba(4,8,16,0.97) 55%)'
                    : isNext
                      ? `linear-gradient(135deg,${color}0e 0%,rgba(4,8,16,0.97) 55%)`
                      : 'rgba(255,255,255,0.02)',
                  border: done
                    ? '1px solid rgba(34,197,94,0.2)'
                    : isNext
                      ? `1px solid ${color}35`
                      : '1px solid rgba(255,255,255,0.06)',
                  opacity: locked ? 0.38 : 1,
                }}
              >
                <div className="p-4 flex items-center gap-3.5">
                  <div className="relative flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{
                      background: done ? 'rgba(34,197,94,0.1)' : isNext ? `${color}12` : 'rgba(255,255,255,0.04)',
                      border: done ? '1px solid rgba(34,197,94,0.28)' : isNext ? `1px solid ${color}30` : '1px solid rgba(255,255,255,0.07)',
                    }}>
                    {done ? (
                      <svg width="16" height="16" viewBox="0 0 16 16">
                        <polyline points="3,8 6.5,11.5 13,5" fill="none" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : locked ? (
                      <svg width="13" height="13" viewBox="0 0 13 13">
                        <rect x="2.5" y="5.5" width="8" height="5.5" rx="1.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
                        <path d="M4.5,5.5 V4.2 a2.2,2.2 0 0,1 4,0 V5.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2" />
                      </svg>
                    ) : (
                      <span className="text-base leading-none">{icon}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: done ? 'rgba(74,222,128,0.55)' : isNext ? `${color}90` : 'rgba(255,255,255,0.2)' }}>
                        Einheit {idx}
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md"
                        style={{
                          background: done ? 'rgba(34,197,94,0.08)' : isNext ? `${color}12` : 'rgba(255,255,255,0.04)',
                          color: done ? '#4ade80' : isNext ? color : 'rgba(255,255,255,0.2)',
                          border: done ? '1px solid rgba(34,197,94,0.15)' : isNext ? `1px solid ${color}20` : '1px solid transparent',
                        }}>
                        {phase.label}
                      </span>
                      {done && score !== undefined && (
                        <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#4ade80' }}>
                          {score}%
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-bold mt-0.5 leading-tight"
                      style={{ color: done ? 'rgba(255,255,255,0.6)' : isNext ? '#fff' : 'rgba(255,255,255,0.35)' }}>
                      {phase.sub}
                    </p>
                    <p className="text-[10px] mt-1"
                      style={{ color: done ? 'rgba(74,222,128,0.5)' : isNext ? `${color}70` : 'rgba(255,255,255,0.2)' }}>
                      {done
                        ? 'Abgeschlossen'
                        : isNext
                          ? '→ Jetzt starten'
                          : !contentReady
                            ? 'Inhalt wird noch generiert'
                            : 'Vorherige Einheit zuerst abschließen'}
                    </p>
                  </div>

                  {isNext && (
                    <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all group-hover:scale-105"
                      style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor"><polygon points="1,1 9,5 1,9" /></svg>
                      Start
                    </div>
                  )}
                  {done && <ArrowRight size={14} style={{ color: '#4ade80', flexShrink: 0, opacity: 0.6 }} />}
                </div>

                {isNext && (
                  <div className="h-px w-full" style={{ background: `linear-gradient(90deg,transparent,${color}40,transparent)` }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Certificate exam card — single style prop (the original had two, which
          silently dropped pointerEvents). */}
      <div
        className={`relative rounded-3xl overflow-hidden transition-all duration-500 ${allUnitsPassed ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
        onClick={allUnitsPassed ? onStartFinalExam : undefined}
        style={{
          pointerEvents: allUnitsPassed ? 'auto' : 'none',
          background: allUnitsPassed
            ? 'linear-gradient(135deg,rgba(251,191,36,0.1) 0%,rgba(234,179,8,0.04) 40%,rgba(4,8,16,0.98) 100%)'
            : 'rgba(255,255,255,0.025)',
          border: allUnitsPassed ? '1px solid rgba(251,191,36,0.28)' : '1px solid rgba(255,255,255,0.07)',
          opacity: allUnitsPassed ? 1 : 0.45,
        }}
      >
        {allUnitsPassed && (
          <>
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(251,191,36,0.5),transparent)' }} />
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
              <div className="absolute inset-0"
                style={{
                  background: 'linear-gradient(105deg,transparent 40%,rgba(251,191,36,0.06) 50%,transparent 60%)',
                  backgroundSize: '200% 100%',
                  animation: 'mo_shimmer 3s ease-in-out infinite',
                }} />
            </div>
          </>
        )}

        <div className="relative p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{
              background: allUnitsPassed ? 'rgba(251,191,36,0.13)' : 'rgba(255,255,255,0.04)',
              border: allUnitsPassed ? '1px solid rgba(251,191,36,0.3)' : '1px solid rgba(255,255,255,0.08)',
              animation: allUnitsPassed ? 'mo_glow 3s ease-in-out infinite' : 'none',
            }}>
            <Award size={22} style={{ color: allUnitsPassed ? '#fbbf24' : 'rgba(255,255,255,0.18)' }} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <p className="text-[10px] font-black uppercase tracking-widest"
                style={{ color: allUnitsPassed ? 'rgba(251,191,36,0.8)' : 'rgba(255,255,255,0.2)' }}>
                Zertifikatsprüfung
              </p>
              {allUnitsPassed && (
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', color: '#fbbf24' }}>
                  Freigeschaltet!
                </span>
              )}
            </div>
            <p className="text-base font-black leading-tight"
              style={{ color: allUnitsPassed ? '#fff' : 'rgba(255,255,255,0.3)' }}>
              Offizielles Abschlusszertifikat
            </p>
            <p className="text-[11px] mt-1 leading-relaxed"
              style={{ color: allUnitsPassed ? 'rgba(251,191,36,0.65)' : 'rgba(255,255,255,0.2)' }}>
              {allUnitsPassed
                ? `Mindestens ${MIN_PASS_SCORE}% erforderlich · personalisierbares PDF-Zertifikat`
                : `Noch ${TOTAL_UNITS - doneCount} Einheit${TOTAL_UNITS - doneCount !== 1 ? 'en' : ''} zum Freischalten`}
            </p>
          </div>

          {allUnitsPassed && (
            <div className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-black transition-all hover:scale-105 active:scale-95"
              style={{ background: 'rgba(251,191,36,0.13)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}>
              <Sparkles size={12} />
              Prüfung starten
            </div>
          )}
        </div>

        {!allUnitsPassed && !isGenerating && (
          <div className="px-5 pb-4">
            <div className="flex gap-1">
              {Array.from({ length: TOTAL_UNITS }, (_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full"
                  style={{ background: completedUnits.has(i + 1) ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
            <p className="text-[9px] text-white/20 mt-1.5">{doneCount}/{TOTAL_UNITS} Einheiten für Prüfungszugang</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type PagePhase = 'loading' | 'result' | 'generating' | 'done' | 'error';
type FinalExamPhase = 'idle' | 'triggering' | 'waiting' | 'ready' | 'submitted' | 'error';

export default function LearningPathPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [generatorSuccess, setGeneratorSuccess] = useState(false);

  const [showDashboard, setShowDashboard] = useState(false);
  const [completedUnits, setCompletedUnits] = useState<Set<number>>(new Set());
  const [unitScores, setUnitScores] = useState<Map<number, number>>(new Map());
  const [activeUnitIndex, setActiveUnitIndex] = useState(0); // 0 = overview

  // Exactly one learning_results row per path (enforced by a unique index).
  const [learningResult, setLearningResult] = useState<LearningResultRow | null>(null);

  const [finalExamPhase, setFinalExamPhase] = useState<FinalExamPhase>('idle');
  const [finalExamQuestions, setFinalExamQuestions] = useState<QuizQuestion[]>([]);
  const [finalExamAnswers, setFinalExamAnswers] = useState<Record<number, string>>({});
  const [finalExamScore, setFinalExamScore] = useState(0);
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  const [certificateError, setCertificateError] = useState<string | null>(null);

  const allUnitsPassed = completedUnits.size >= TOTAL_UNITS;

  const realtimeChannelRef  = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const finalExamChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollTimerRef        = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalExamTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef        = useRef(0);
  const completedRef        = useRef(false);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const stopPolling = () => {
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
  };

  const cleanupFinalExamListeners = useCallback(() => {
    if (finalExamChannelRef.current) {
      supabase.removeChannel(finalExamChannelRef.current);
      finalExamChannelRef.current = null;
    }
    if (finalExamTimerRef.current) { clearTimeout(finalExamTimerRef.current); finalExamTimerRef.current = null; }
  }, []);

  const cleanupListeners = useCallback(() => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    stopPolling();
    cleanupFinalExamListeners();
  }, [cleanupFinalExamListeners]);

  const resultFromPath = (path: LearningPath): AnalysisResult => ({
    missingSkills:    parseSkills(path.missing_skills),
    currentSkills:    parseSkills(path.current_skills),
    strategicOutlook: (path as any).strategic_outlook_2026 ?? '',
    matchScore:       Number(path.match_score ?? 0),
    targetJob:        path.target_job ?? '',
    targetCompany:    path.target_company ?? '',
    industry:         path.industry ?? '',
  });

  const normalizePath = useCallback((path: LearningPath): LearningPath => {
    if (path.curriculum && typeof path.curriculum === 'string') {
      try {
        const parsed = JSON.parse(path.curriculum as unknown as string);
        return { ...path, curriculum: parsed };
      } catch { /* leave as-is */ }
    }
    return path;
  }, []);

  // ── Data loading ────────────────────────────────────────────────────────────

  const loadCompletedUnits = useCallback(async () => {
    if (!pathId) return;
    const { data } = await supabase
      .from('unit_completions')
      .select('unit_index, exam_score')
      .eq('learning_path_id', pathId);
    if (data) {
      setCompletedUnits(new Set(data.map((r: any) => r.unit_index as number)));
      setUnitScores(new Map(data.map((r: any) => [r.unit_index as number, r.exam_score as number])));
    }
  }, [pathId]);

  const loadLearningResult = useCallback(async (id: string): Promise<LearningResultRow | null> => {
    // Load ALL rows for the path — Make may write several — and merge them.
    // No .maybeSingle() here: it throws when more than one row matches, which
    // was a direct cause of the endless-loading state.
    const { data } = await supabase
      .from('learning_results')
      .select('id, content, status, final_exam, certificate_metadata, created_at, unit_id')
      .eq('learning_path_id', id)
      .order('created_at', { ascending: true });
    const merged = mergeUnitRows((data as LearningResultRow[] | null) ?? null);
    setLearningResult(merged);
    return merged;
  }, []);

  // ── Curriculum generation ───────────────────────────────────────────────────

  const handleCurriculumReady = useCallback(async (path: LearningPath) => {
    if (completedRef.current) return;
    completedRef.current = true;
    cleanupListeners();
    setGeneratorSuccess(true);
    await new Promise((r) => setTimeout(r, 1_800));

    const normalized = normalizePath(path);
    setLearningPath(normalized);
    setAnalysisResult(resultFromPath(normalized));

 if (normalized.status !== 'completed') {
      await supabase.from('learning_paths')
        .update({ status: 'curriculum_ready', updated_at: new Date().toISOString() })
        .eq('id', normalized.id);
    }

    setShowDashboard(true);
    setPhase('done');
    loadCompletedUnits();
    loadLearningResult(normalized.id);
  }, [cleanupListeners, normalizePath, loadCompletedUnits, loadLearningResult]);

  const startCurriculumPolling = useCallback((id: string) => {
    pollCountRef.current = 0;
    const tick = async () => {
      if (completedRef.current || pollCountRef.current >= POLL_MAX) return;
      pollCountRef.current += 1;
      try {
        const { data: rows } = await supabase
          .from('learning_results').select('id').eq('learning_path_id', id).limit(1);
        if (rows && rows.length > 0) {
          const { data: lp } = await supabase.from('learning_paths').select('*').eq('id', id).maybeSingle();
          if (lp) { handleCurriculumReady(lp as unknown as LearningPath); return; }
        }
      } catch { /* */ }
      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    };
    pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
  }, [handleCurriculumReady]);

  const subscribeToCurriculum = useCallback((id: string) => {
    const channel = supabase
      .channel(`lp_curriculum_${id}_${Date.now()}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${id}` },
        async () => {
          const { data: lp } = await supabase.from('learning_paths').select('*').eq('id', id).maybeSingle();
          if (lp) handleCurriculumReady(lp as unknown as LearningPath);
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${id}` },
        async () => {
          const { data: lp } = await supabase.from('learning_paths').select('*').eq('id', id).maybeSingle();
          if (lp) handleCurriculumReady(lp as unknown as LearningPath);
        })
      .subscribe();
    realtimeChannelRef.current = channel;
    startCurriculumPolling(id);
  }, [handleCurriculumReady, startCurriculumPolling]);

  const triggerCurriculumGeneration = useCallback(async (path: LearningPath) => {
    completedRef.current = false;
    pollCountRef.current = 0;
    setGeneratorSuccess(false);
    setPhase('generating');

    subscribeToCurriculum(path.id);

    try {
      const selectedSkill = skillFromPath(path);
      const res = await fetch(LEARNINGPATH_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learning_path_id: path.id,   // Make MUST write this back — the column is NOT NULL
          skill: selectedSkill,
          selected_skill: selectedSkill,
          missing_skills: selectedSkill ? [selectedSkill] : parseSkills(path.missing_skills),
          current_skills: parseSkills(path.current_skills),
          target_job: path.target_job,
          target_company: path.target_company,
          industry: path.industry,
          user_id: path.user_id,
          timeframe: '12_months',
          learning_style: 'balanced',
          timestamp: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        const now = new Date().toISOString();
        await supabase.from('learning_paths')
          .update({ status: 'in_progress', updated_at: now, triggered_at: now })
          .eq('id', path.id);
      } else {
        console.warn('[LearningPath] Webhook response:', res.status);
      }
    } catch (e: any) {
      console.warn('[LearningPath] Curriculum webhook error (non-fatal):', e?.message);
    }
  }, [subscribeToCurriculum]);

  // ── Load learning path ──────────────────────────────────────────────────────

  const loadLearningPath = useCallback(async (showLoader = false) => {
    if (!pathId) return;
    if (showLoader) setPhase('loading');
    setError(null);
    try {
      const raw = await careerService.getLearningPath(pathId);
      if (!raw) { setError('Lernpfad nicht gefunden'); setPhase('error'); return; }
      const path = normalizePath(raw);

      setLearningPath(path);
      setAnalysisResult(resultFromPath(path));

      // Access is decided by is_paid alone. It is written only by the Stripe
      // webhook (service role) and is immutable from the client. The existence
      // of learning_results rows is NOT evidence of payment.
      if (!path.is_paid) {
        setPhase('result');
        return;
      }

      const row = await loadLearningResult(path.id);
      const hasContent = Array.isArray(row?.content) && row!.content.length > 0;

      if (hasContent) {
        setShowDashboard(true);
        setPhase('done');
        loadCompletedUnits();

        // Restore the final exam. A stored certificate URL is the only proof the
        // exam was passed AND the certificate was issued — restore from that,
        // not from final_exam_status, which can be 'done' with no certificate.
        const storedCertUrl = (path as any).certificate_url as string | null;
        if (storedCertUrl) {
          setCertificateUrl(storedCertUrl);
          setFinalExamScore(Number((path as any).final_exam_score ?? MIN_PASS_SCORE));
          setFinalExamPhase('submitted');
        } else if (row.final_exam) {
          const qs = parseFinalExamQuestions(row.final_exam);
          if (qs.length > 0) {
            setFinalExamQuestions(qs);
            setFinalExamPhase('ready');
          }
        }
        return;
      }

      // Paid, but no content yet.
     const skill = skillFromPath(path);
navigate(
  `/learning-path-waiting/${pathId}${skill ? `?skill=${encodeURIComponent(skill)}` : ''}`,
  { replace: true },
);
    } catch (err: any) {
      setError(err?.message || 'Fehler beim Laden');
      setPhase('error');
    }
  }, [pathId, normalizePath, navigate, loadLearningResult, loadCompletedUnits]);

  // ── Effects ─────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (pathId) { loadLearningPath(true); loadCompletedUnits(); }
  }, [pathId, loadLearningPath, loadCompletedUnits]);

  // Keep learningResult fresh while Make writes the remaining units.
  useEffect(() => {
    if (!showDashboard || !learningPath) return;
    const id = learningPath.id;
    const ch = supabase
      .channel(`unit_rows_live_${id}_${Date.now()}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${id}` },
        () => { loadLearningResult(id); })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${id}` },
        () => { loadLearningResult(id); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [showDashboard, learningPath, loadLearningResult]);

  // Resume generation after a reload or direct navigation.
  useEffect(() => {
    if (phase !== 'generating' || !learningPath || completedRef.current) return;
    const id = learningPath.id;

    (async () => {
      const { data: existingRows } = await supabase
        .from('learning_results').select('id').eq('learning_path_id', id).limit(1);
      if (existingRows && existingRows.length > 0) {
        handleCurriculumReady(learningPath);
        return;
      }
      if (!IN_FLIGHT_STATUSES.has(learningPath.status as string)) {
        triggerCurriculumGeneration(learningPath);
        return;
      }
      subscribeToCurriculum(id);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, learningPath?.id]);

  // Stripe returns to /learning-path-waiting/:id; this covers stray redirects.
  useEffect(() => {
    if (searchParams.get('payment') === 'success' && pathId) {
      setSearchParams({}, { replace: true });
      navigate(`/learning-path-waiting/${pathId}`, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cleanupListeners(), [cleanupListeners]);

  // ── Final exam ──────────────────────────────────────────────────────────────

  const pollForFinalExam = useCallback((lpId: string) => {
    let polls = 0;

    const poll = async () => {
      polls += 1;
      if (polls > FINAL_EXAM_POLL_MAX) {
        // Surface the failure instead of leaving the loader spinning forever.
        cleanupFinalExamListeners();
        setFinalExamPhase('error');
        return;
      }

      // Only ever look at rows that belong to this path. The old fallback that
      // adopted orphan rows is what leaked content between paths. No maybeSingle
      // here either — take the first row that carries an exam.
      const { data } = await supabase
        .from('learning_results')
        .select('final_exam')
        .eq('learning_path_id', lpId)
        .not('final_exam', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      const examRaw = data?.[0]?.final_exam;
      if (examRaw) {
        const qs = parseFinalExamQuestions(examRaw);
        if (qs.length > 0) {
          cleanupFinalExamListeners();
          setFinalExamQuestions(qs);
          setFinalExamPhase('ready');
          return;
        }
      }

      finalExamTimerRef.current = setTimeout(poll, FINAL_EXAM_POLL_INTERVAL_MS);
    };

    finalExamTimerRef.current = setTimeout(poll, 3_000);
  }, [cleanupFinalExamListeners]);

  const triggerFinalExam = useCallback(async () => {
    if (!learningPath) return;
    if (finalExamPhase !== 'idle' && finalExamPhase !== 'error') return;

    setFinalExamPhase('triggering');
    setFinalExamAnswers({});
    setCertificateError(null);

    const lpId = learningPath.id;
    const selectedSkill = skillFromPath(learningPath);

    try {
      await fetch(FINAL_EXAM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learning_path_id: lpId,   // Make MUST write this back — the column is NOT NULL
          skill: selectedSkill,
          selected_skill: selectedSkill,
          target_job: learningPath.target_job,
          target_company: (learningPath as any).target_company || null,
          user_id: learningPath.user_id,
          timestamp: new Date().toISOString(),
        }),
      });
      const now = new Date().toISOString();
      await supabase.from('learning_paths')
        .update({ final_exam_status: 'triggered', final_exam_triggered_at: now, updated_at: now })
        .eq('id', lpId);
    } catch { /* non-fatal — the poll below still runs */ }

    setFinalExamPhase('waiting');

    const channel = supabase
      .channel(`final_exam_${lpId}_${Date.now()}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${lpId}` },
        (payload) => {
          const row = payload.new as any;
          if (row?.final_exam != null) {
            const qs = parseFinalExamQuestions(row.final_exam);
            if (qs.length > 0) {
              cleanupFinalExamListeners();
              setFinalExamQuestions(qs);
              setFinalExamPhase('ready');
            }
          }
        })
      .subscribe();
    finalExamChannelRef.current = channel;

    pollForFinalExam(lpId);
  }, [learningPath, finalExamPhase, pollForFinalExam, cleanupFinalExamListeners]);

  const recipientName = useCallback((): string => {
    // TODO: read the real name from cv_profiles — an IHK-oriented certificate
    // should not carry "q.mueller" derived from an email local part.
    const meta = (user as any)?.user_metadata;
    return meta?.full_name || meta?.name || user?.email?.split('@')[0] || 'Teilnehmer';
  }, [user]);

const issueCertificate = useCallback(async (path: LearningPath) => {
  setIssuingCertificate(true);
  setCertificateError(null);
  try {
    // Score steht zu diesem Zeitpunkt bereits in der DB (siehe handleFinalExamSubmit).
    // certificateService schreibt certificate_url, certificate_id und
    // certificate_issued_at selbst — hier nur noch den Prüfungsstatus abschließen.
const url = await careerService.generateCertificate(path.id);
if (!url) throw new Error('generateCertificate lieferte keine URL');
setCertificateUrl(url);

await supabase.from('learning_paths')
  .update({ final_exam_status: 'done', updated_at: new Date().toISOString() })
  .eq('id', path.id);

    setCertificateUrl(url);
  } catch (err: any) {
    setCertificateError(err?.message || 'Das Zertifikat konnte nicht erstellt werden.');
  } finally {
    setIssuingCertificate(false);
  }
}, []);

const handleFinalExamSubmit = async () => {
  if (!learningPath) return;

  const correct = finalExamQuestions.filter(
    q => finalExamAnswers[q.question_id] === q.correct_key
  ).length;
  const pct = finalExamQuestions.length > 0
    ? Math.round((correct / finalExamQuestions.length) * 100)
    : 0;

  setFinalExamScore(pct);
  setFinalExamPhase('submitted');
  setCertificateError(null);

  if (pct < MIN_PASS_SCORE) return;

  try {
    await careerService.completeLearningPath(learningPath.id, pct);
  } catch (err: any) {
    console.error('[FinalExam] completeLearningPath:', err);
    setCertificateError(
      `Dein Ergebnis konnte nicht gespeichert werden: ${err?.message ?? err}`
    );
    return;
  }

  await issueCertificate(learningPath);
};
  const retakeFinalExam = () => {
    setFinalExamAnswers({});
    setFinalExamScore(0);
    setCertificateError(null);
    setFinalExamPhase('ready');
  };

  const backToOverview = () => {
    cleanupFinalExamListeners();
    setFinalExamPhase('idle');
    setActiveUnitIndex(0);
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#66c0b6] animate-spin" />
          <p className="text-white/70 font-medium">Lade Lernpfad…</p>
        </div>
      </div>
    );
  }

  if (phase === 'error' || !learningPath) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="max-w-md text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
          <p className="text-red-400">{error || 'Lernpfad nicht gefunden'}</p>
          <button onClick={() => navigate('/career-vision')}
            className="px-6 py-3 bg-[#66c0b6] text-black rounded-xl hover:opacity-90">
            Zurück zur Career Vision
          </button>
        </div>
      </div>
    );
  }

  const finalExamPassed = finalExamScore >= MIN_PASS_SCORE;
  const finalExamCorrect = Math.round((finalExamScore / 100) * finalExamQuestions.length);

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">

        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <ArrowLeft size={20} />
            <span>Dashboard</span>
          </button>
          {certificateUrl && (
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#66c0b6]/20 to-[#30E3CA]/20 border border-[#66c0b6]/30">
              <span className="text-[#66c0b6] font-semibold">✓ Zertifiziert</span>
            </div>
          )}
        </div>

        {/* Analysis view: unpaid paths, and paid paths before entering the dashboard */}
        {(phase === 'result' || (phase === 'done' && !showDashboard)) && analysisResult && (
          <ResultView
            result={analysisResult}
            learningPath={learningPath}
            onPaywallClose={() => loadLearningPath(false)}
            onGoToDashboard={() => setShowDashboard(true)}
            preselectSkill={searchParams.get('unlock_skill') ?? undefined}
          />
        )}

        {phase === 'generating' && (
          <div className="max-w-2xl mx-auto">
            <CurriculumLoader success={generatorSuccess} targetJob={learningPath.target_job ?? ''} />
          </div>
        )}

        {showDashboard && (
          <div className="space-y-6">
            {finalExamPhase === 'idle' && activeUnitIndex === 0 && (
              <ModuleOverview
                learningPath={learningPath}
                learningResult={learningResult}
                completedUnits={completedUnits}
                unitScores={unitScores}
                allUnitsPassed={allUnitsPassed}
                onOpenUnit={setActiveUnitIndex}
                onStartFinalExam={triggerFinalExam}
              />
            )}

            {finalExamPhase === 'idle' && activeUnitIndex > 0 && (
              <>
                <div className="max-w-2xl mx-auto">
                  <button
                    onClick={() => setActiveUnitIndex(0)}
                    className="flex items-center gap-2 text-xs font-bold text-white/45 hover:text-white/70 transition-colors mb-1"
                  >
                    <ArrowLeft size={13} />
                    Zurück zur Übersicht
                  </button>
                </div>

                {learningResult ? (
                  <LearningContent
                    key={activeUnitIndex}
                    learningPath={learningPath}
                    unitIndex={activeUnitIndex}
                    unitVariant={activeUnitIndex % 2 === 0 ? 'B' : 'A'}
                    learningResult={learningResult}
                    userId={user?.id ?? null}
                    completedUnits={completedUnits}
                    onUnitCompleted={(idx, score) => {
                      setCompletedUnits(prev => new Set([...prev, idx]));
                      setUnitScores(prev => new Map([...prev, [idx, score]]));
                      setActiveUnitIndex(0);
                    }}
                  />
                ) : (
                  <div className="max-w-2xl mx-auto flex items-center justify-center gap-3 py-16 text-white/35">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-sm">Lerneinheiten werden geladen…</span>
                  </div>
                )}
              </>
            )}

            {(finalExamPhase === 'triggering' || finalExamPhase === 'waiting') && (
              <FinalExamWaiting
                targetJob={learningPath.target_job || ''}
                skill={skillFromPath(learningPath) || ''}
              />
            )}

            {finalExamPhase === 'error' && (
              <FinalExamError
                onRetry={() => { setFinalExamPhase('idle'); triggerFinalExam(); }}
                onBack={backToOverview}
              />
            )}

            {/* Final exam — questions */}
            {finalExamPhase === 'ready' && (
              <div className="max-w-2xl mx-auto space-y-4" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,rgba(48,227,202,0.08) 0%,rgba(6,7,15,0.98) 60%)', border: '1px solid rgba(48,227,202,0.25)' }}>
                  <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(48,227,202,0.5),transparent)' }} />
                  <div className="px-6 py-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/60 mb-1">Abschlussprüfung</p>
                    <p className="text-lg font-black text-white">{learningPath.target_job}</p>
                    <p className="text-xs text-white/40 mt-1">
                      {finalExamQuestions.length} Fragen · mindestens {MIN_PASS_SCORE}% für das Zertifikat
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <p className="text-[11px] font-black uppercase tracking-widest text-white/30">Prüfungsfragen</p>
                  <span className="text-xs text-white/40">{Object.keys(finalExamAnswers).length}/{finalExamQuestions.length} beantwortet</span>
                </div>

                {finalExamQuestions.map((q, idx) => {
                  const selected = finalExamAnswers[q.question_id];
                  return (
                    <div key={q.question_id} className="rounded-xl overflow-hidden"
                      style={{ border: selected ? '1px solid rgba(48,227,202,0.2)' : '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="px-4 py-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="flex items-start gap-2">
                          <span className="flex-shrink-0 text-xs font-black text-white/25 mt-0.5">{idx + 1}.</span>
                          <p className="text-sm font-semibold text-white leading-snug">{q.question}</p>
                        </div>
                      </div>
                      <div className="p-3 space-y-2">
                        {(Object.entries(q.options) as [string, string][]).map(([key, text]) => {
                          const isSelected = selected === key;
                          return (
                            <button key={key}
                              onClick={() => setFinalExamAnswers(prev => ({ ...prev, [q.question_id]: key }))}
                              className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-lg transition-all hover:scale-[1.003]"
                              style={{
                                background: isSelected ? 'rgba(48,227,202,0.1)' : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${isSelected ? 'rgba(48,227,202,0.35)' : 'rgba(255,255,255,0.08)'}`,
                                color: isSelected ? '#30E3CA' : 'rgba(255,255,255,0.7)',
                              }}>
                              <span className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-xs font-black"
                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>{key}</span>
                              <span className="text-xs leading-relaxed">{text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <button
                  disabled={Object.keys(finalExamAnswers).length < finalExamQuestions.length}
                  onClick={handleFinalExamSubmit}
                  className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg,#22c55e,#4ade80)' }}>
                  Prüfung abgeben
                  <Check size={18} />
                </button>
              </div>
            )}

            {/* Final exam — result */}
            {finalExamPhase === 'submitted' && (
              <div className="max-w-2xl mx-auto space-y-4" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
                <div className="rounded-2xl p-6 text-center space-y-3"
                  style={{
                    background: finalExamPassed ? 'rgba(34,197,94,0.07)' : 'rgba(248,113,113,0.06)',
                    border: `1px solid ${finalExamPassed ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.25)'}`,
                  }}>
                  <div className="text-5xl font-black" style={{ color: finalExamPassed ? '#4ade80' : '#f87171' }}>
                    {finalExamScore}%
                  </div>
                  <p className="text-lg font-bold text-white">
                    {finalExamPassed ? 'Bestanden!' : 'Nicht bestanden'}
                  </p>
                  <p className="text-sm text-white/55">
                    {finalExamPassed
                      ? 'Du hast die Abschlussprüfung bestanden.'
                      : `${finalExamCorrect} von ${finalExamQuestions.length} richtig — für das Zertifikat sind mindestens ${MIN_PASS_SCORE}% erforderlich.`}
                  </p>
                </div>

                {finalExamPassed && (
                  <div className="space-y-3">
                    {issuingCertificate && (
                      <div className="flex items-center justify-center gap-2 text-[#30E3CA]/70 text-xs py-2">
                        <Loader2 size={13} className="animate-spin" />
                        <span>Zertifikat wird erstellt…</span>
                      </div>
                    )}

                    {certificateError && (
                      <div className="rounded-xl px-4 py-3.5 space-y-3"
                        style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.25)' }}>
                        <p className="text-xs text-red-400/85 leading-relaxed">{certificateError}</p>
                        <button
                          onClick={() => issueCertificate(learningPath)}
                          disabled={issuingCertificate}
                          className="w-full py-2.5 rounded-lg font-bold text-xs text-white/80 transition-all hover:bg-white/5 disabled:opacity-40"
                          style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                          Zertifikat erneut erstellen
                        </button>
                      </div>
                    )}

                    {certificateUrl && (
                      <button
                        onClick={() => certificateService.downloadCertificate(certificateUrl)}
                        className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                        style={{ background: 'linear-gradient(135deg,#22c55e,#4ade80)', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>
                        <Award size={18} />
                        Zertifikat herunterladen
                      </button>
                    )}

                    <button
                      onClick={backToOverview}
                      className="w-full py-3 rounded-xl font-bold text-sm text-white/60 transition-all hover:bg-white/5"
                      style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                      Zur Übersicht
                    </button>
                  </div>
                )}

                {!finalExamPassed && (
                  <button
                    onClick={retakeFinalExam}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white/70 transition-all hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    Prüfung wiederholen
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}