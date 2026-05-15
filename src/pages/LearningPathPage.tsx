import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, Sparkles, Brain, Building2,
  ArrowRight, Check, Award, PlayCircle,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LearningPathPaywall } from '../components/career/LearningPathPaywall';
import { careerService } from '../services/careerService';
import { certificateService } from '../services/certificateService';
import { LearningPath } from '../types/learningPath';
import { supabase } from '../lib/supabase';

// ── Constants ──────────────────────────────────────────────────────────────────

// Hardcoded as ultimate fallback — env var must match this URL
const LEARNINGPATH_WEBHOOK_URL =
  import.meta.env.VITE_MAKE_WEBHOOK_LEARNINGPATH
  || 'https://hook.eu2.make.com/1pvur1oth8sibonqc3twq57itg2ti1d0';

const COMPLETE_STATUSES = new Set(['curriculum_ready', 'completed']);
// Statuses where generation is in-flight — only skip re-trigger if learning_results also has content
const IN_FLIGHT_STATUSES = new Set(['in_progress', 'curriculum_ready', 'completed']);
const POLL_INTERVAL_MS = 4_000;
const POLL_MAX = 75;

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

// ── Types ──────────────────────────────────────────────────────────────────────

interface RawSkill {
  skill_name?: string;
  name?: string;
  pitch?: string;
  gap_severity?: number;
  market_value_bonus?: string;
  category?: string;
  priority?: string;
}

function skillDisplayName(s: RawSkill) {
  return s.skill_name || s.name || '(unbenannt)';
}

function parseSkills(raw: unknown): RawSkill[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as RawSkill[];
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    try { const p = JSON.parse(s); if (Array.isArray(p)) return p; } catch { /* */ }
  }
  return [];
}

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
  { id: 'skills',    label: 'Skill-Gaps werden strukturiert',    detail: 'Priorisiere kritische Lernbereiche…' },
  { id: 'modules',   label: 'Lernmodule werden erstellt',        detail: 'Maßgeschneiderte Inhalte für dein Ziel…' },
  { id: 'resources', label: 'Ressourcen werden kuratiert',       detail: 'Hochwertige Kurse, Artikel & Videos…' },
  { id: 'milestones',label: 'Meilensteine werden gesetzt',       detail: 'Messbare Fortschrittsziele…' },
  { id: 'timeline',  label: 'Zeitplan wird optimiert',          detail: 'Realistischer Lernplan für dich…' },
  { id: 'cert',      label: 'Zertifikat wird vorbereitet',      detail: 'Deine Leistung wird dokumentiert…' },
  { id: 'review',    label: 'Qualitätsprüfung',                 detail: 'Finale Abstimmung auf dein Profil…' },
  { id: 'done',      label: 'Lernpfad wird fertiggestellt',     detail: 'Fast fertig…' },
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
        {/* Header */}
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

        {/* Radar + Steps */}
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
              {[{cx:36,cy:35,d:0},{cx:76,cy:42,d:0.5},{cx:48,cy:76,d:1},{cx:80,cy:68,d:1.5}].map(({cx,cy,d},i) => (
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
                      ? <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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

        {/* Ticker */}
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
                <circle cx="10" cy="10" r="9" fill="#22c55e22" stroke="#22c55e" strokeWidth="1.5"/>
                <polyline points="6,10 9,13 14,7" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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
  result, learningPath, onPaywallClose, onGoToDashboard,
}: { result: AnalysisResult; learningPath: LearningPath; onPaywallClose: () => void; onGoToDashboard?: () => void }) {
  const [showPaywall, setShowPaywall] = useState(false);
  const isPaid = !!(learningPath.is_paid || learningPath.curriculum);
  const [showAllCurrent, setShowAllCurrent] = useState(false);
  const { missingSkills, currentSkills, strategicOutlook, matchScore, targetJob, targetCompany, industry } = result;

  const visibleSkills = missingSkills
    .filter((s) => skillDisplayName(s) !== '(unbenannt)')
    .sort((a, b) => (b?.gap_severity ?? 0) - (a?.gap_severity ?? 0));
  const visibleCurrent = currentSkills.filter((s) => skillDisplayName(s) !== '(unbenannt)');
  const topSkill = visibleSkills[0];
  const scoreColor = matchScore >= 70 ? '#22c55e' : matchScore >= 40 ? '#f59e0b' : '#30E3CA';

  // CLT: Group by tier for schema-based processing
  const criticalSkills  = visibleSkills.filter(s => (s?.gap_severity ?? 0) >= 4);
  const buildSkills     = visibleSkills.filter(s => (s?.gap_severity ?? 0) >= 2 && (s?.gap_severity ?? 0) < 4);

  return (
    <div className="space-y-5 max-w-2xl mx-auto" style={{ animation: 'lp_fadeUp 0.5s ease' }}>
      <style>{GLOBAL_STYLES}</style>

      {/* ── 1. ORIENTIERUNG: Ziel + Match-Score ──────────────────────── */}
      {/* CLT: Two key facts only — where are you going, how close are you */}
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

        {/* Strategic context — collapsed visual weight, secondary info */}
        {strategicOutlook && (
          <div className="mt-4 flex gap-2.5 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <Brain size={14} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/55 leading-relaxed">{strategicOutlook}</p>
          </div>
        )}
      </div>

      {/* ── 2. LÜCKEN-ANALYSE: Priorisiert in zwei Gruppen ───────────── */}
      {/* CLT: Max 2 chunks — critical first (3 items), build second (compact) */}
      {visibleSkills.length > 0 && (
        <div className="space-y-4">
          <p className="text-[11px] font-black uppercase tracking-widest text-white/30 px-1">Deine Wachstums-Chancen</p>

          {/* Critical skills: full cards, highest cognitive priority */}
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
                    {/* Severity bar: simple visual encoding */}
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

          {/* Build skills: compact list, lower visual weight */}
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

      {/* ── 3. BASIS-SKILLS: Minimal, fördert Schema-Aktivierung ─────── */}
      {/* CLT: Secondary info — small chips, not competing with gaps */}
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

      {/* ── 4. EINE KLARE AKTION ─────────────────────────────────────── */}
      {/* CLT: Single decision point — no competing options */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(48,227,202,0.05)', border: '1px solid rgba(48,227,202,0.2)' }}
      >
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(48,227,202,0.4),transparent)' }} />
        <div className="p-5 space-y-4">
          {topSkill && (
            <div className="space-y-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA]/60">Nächster Schritt</p>
              <h3 className="text-lg font-black text-white leading-tight">
                Starte mit <span style={{ color: '#30E3CA' }}>{skillDisplayName(topSkill)}</span>
              </h3>
              <p className="text-xs text-white/50 leading-relaxed pt-0.5">
                {topSkill?.pitch ?? `Dieser Skill hat den größten Einfluss auf deinen Weg zum ${targetJob}.`}
              </p>
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
                onClick={() => setShowPaywall(true)}
                className="group relative w-full py-4 rounded-xl font-black text-[15px] text-black flex items-center justify-center gap-3 overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', animation: 'lp_ctaPulse 2.5s ease-in-out infinite', boxShadow: '0 4px 20px rgba(48,227,202,0.3)' }}
              >
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', backgroundSize: '200% 100%', animation: 'lp_shimmer 2s ease-in-out infinite' }} />
                <Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">Meinen Lernpfad jetzt starten</span>
                <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
              <p className="text-center text-[11px] text-white/25">Zertifikat inklusive · Einmalig 9,99 € · Lebenslanger Zugriff</p>
            </>
          )}
        </div>
      </div>

      {showPaywall && (
        <LearningPathPaywall
          isOpen
          onClose={() => { setShowPaywall(false); onPaywallClose(); }}
          learningPathId={learningPath.id}
          targetJob={targetJob}
          targetCompany={targetCompany}
          skillCount={visibleSkills.length}
        />
      )}
    </div>
  );
}

// ── Learning Content (quiz + certificate — uses actual Make data) ──────────────

interface QuizQuestion {
  question_id: number;
  question: string;
  options: { A: string; B: string; C: string; D: string };
  correct_key: string;
  rationale: string;
  clt_rating?: string;
}

interface LearningResult {
  final_exam: string | null;
  certificate_metadata: {
    official_title?: string;
    competency_profile?: string[];
    dqr_reference?: string;
    verification_footer?: string;
  } | null;
}

// ── ARCS/DSR/CLT Learning Journey phases ──────────────────────────────────────
// Phase 1 (ARCS – Attention):    Intro card — hook, relevance, why this matters now
// Phase 2 (DSR – Discipline):    Pre-learning — understand competency list, learning goals
// Phase 3 (CLT – guided learn):  Guided practice — quiz questions one-by-one with instant
//                                 rationale; schema building, progressive complexity
// Phase 4 (DSR – Skill):         Consolidation — review what was learned, confidence check
// Phase 5 (ARCS – Satisfaction): Final exam — full timed quiz without hints
// Phase 6:                       Certificate — reward, achievement, next steps

type LearningPhase = 'intro' | 'goals' | 'practice' | 'consolidation' | 'exam' | 'certificate';

interface PracticeState {
  currentIdx: number;
  selected: string | null;
  revealed: boolean;
  correct: number;
}

function LearningContent({
  learningPath,
  onCertificateRequest,
  isGeneratingCertificate,
  unitIndex,
  unitVariant,
  userId,
  completedUnits,
  onUnitCompleted,
}: {
  learningPath: LearningPath;
  onCertificateRequest: () => void;
  isGeneratingCertificate: boolean;
  unitIndex: number;
  unitVariant: 'A' | 'B';
  userId: string | null;
  completedUnits: Set<number>;
  onUnitCompleted: (unitIdx: number) => void;
}) {
  const TOTAL_UNITS = 5;
  const allUnitsComplete = completedUnits.size >= TOTAL_UNITS;
  const thisUnitComplete = completedUnits.has(unitIndex);

  const [result, setResult] = useState<LearningResult | null>(null);
  const [loadingResult, setLoadingResult] = useState(true);
  const [stillGenerating, setStillGenerating] = useState(false);
  const [learningPhase, setLearningPhase] = useState<LearningPhase>('intro');
  const [savingCompletion, setSavingCompletion] = useState(false);

  // Guided practice state
  const [practice, setPractice] = useState<PracticeState>({ currentIdx: 0, selected: null, revealed: false, correct: 0 });

  // Final exam state
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examRevealed, setExamRevealed] = useState<Record<number, boolean>>({});

  const realtimeRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Save unit completion to DB (idempotent via unique index)
  const saveUnitCompletion = async (score: number, resultId?: string) => {
    if (!userId || thisUnitComplete) return;
    setSavingCompletion(true);
    try {
      await supabase.from('unit_completions').upsert({
        learning_path_id: learningPath.id,
        user_id: userId,
        learning_result_id: resultId ?? null,
        unit_index: unitIndex,
        variant: unitVariant,
        exam_score: score,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'learning_path_id,unit_index', ignoreDuplicates: true });
      onUnitCompleted(unitIndex);
    } catch { /* non-fatal */ } finally {
      setSavingCompletion(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Try canonical row first (id = learning_path_id)
      const { data: canonical } = await supabase
        .from('learning_results')
        .select('final_exam, certificate_metadata')
        .eq('id', learningPath.id)
        .maybeSingle();

      if (cancelled) return;

      if (canonical?.final_exam) {
        setResult(canonical as LearningResult);
        setLoadingResult(false);
        return;
      }

      // Fall back to partial row with final_exam content
      const { data: partial } = await supabase
        .from('learning_results')
        .select('final_exam, certificate_metadata')
        .eq('learning_path_id', learningPath.id)
        .not('final_exam', 'is', null)
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (partial?.final_exam) {
        setResult(partial as LearningResult);
        setStillGenerating(true);
        setLoadingResult(false);
        const ch = supabase
          .channel(`lc_canonical_${learningPath.id}_${Date.now()}`)
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'learning_results', filter: `id=eq.${learningPath.id}` },
            (payload) => { const row = payload.new as any; if (row?.final_exam) { setResult(row as LearningResult); setStillGenerating(false); } })
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'learning_results', filter: `id=eq.${learningPath.id}` },
            (payload) => { const row = payload.new as any; if (row?.final_exam) { setResult(row as LearningResult); setStillGenerating(false); } })
          .subscribe();
        realtimeRef.current = ch;
        return;
      }

      // Nothing yet — wait via realtime
      setLoadingResult(false);
      setStillGenerating(true);
      const ch = supabase
        .channel(`lc_wait_${learningPath.id}_${Date.now()}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'learning_results', filter: `id=eq.${learningPath.id}` },
          (payload) => { const row = payload.new as any; if (row?.final_exam) { setResult(row as LearningResult); setStillGenerating(false); } })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${learningPath.id}` },
          (payload) => { const row = payload.new as any; if (row?.final_exam) { setResult(row as LearningResult); setStillGenerating(false); } })
        .subscribe();
      realtimeRef.current = ch;
    };

    load();
    return () => {
      cancelled = true;
      if (realtimeRef.current) { supabase.removeChannel(realtimeRef.current); realtimeRef.current = null; }
    };
  }, [learningPath.id]);

  // Parse questions — handle double-encoded JSON from Make
  const questions: QuizQuestion[] = (() => {
    if (!result?.final_exam) return [];
    const raw = result.final_exam as unknown;
    try {
      if (Array.isArray(raw)) return raw as QuizQuestion[];
      if (typeof raw === 'string') {
        let s = raw.trim();
        // Handle double-encoded: starts/ends with quote means it's a JSON string of a JSON string
        if (s.startsWith('"')) s = JSON.parse(s) as string;
        // Now it should be the actual array — but Make sometimes sends comma-separated objects
        // Try wrapping in array brackets if it doesn't start with [
        if (!s.startsWith('[')) s = `[${s}]`;
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed as QuizQuestion[];
      }
    } catch { /* */ }
    return [];
  })();

  // Parse certificate_metadata — also handle double-encoded
  const certMeta = (() => {
    const raw = result?.certificate_metadata;
    if (!raw) return null;
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw as LearningResult['certificate_metadata'];
    if (typeof raw === 'string') {
      try {
        let s = (raw as string).trim();
        if (s.startsWith('"')) s = JSON.parse(s) as string;
        return JSON.parse(s) as LearningResult['certificate_metadata'];
      } catch { /* */ }
    }
    return null;
  })();

  const competencies: string[] = certMeta?.competency_profile ?? [];
  const officialTitle = certMeta?.official_title || learningPath.target_job || '';
  const dqrRef = certMeta?.dqr_reference || '';
  const verificationFooter = certMeta?.verification_footer || '';

  // Split questions: first half for guided practice, all for final exam
  const practiceQuestions = questions.slice(0, Math.ceil(questions.length / 2));
  const examScoreRaw = examSubmitted
    ? questions.filter(q => examAnswers[q.question_id] === q.correct_key).length
    : 0;
  const examScorePct = questions.length > 0 ? Math.round((examScoreRaw / questions.length) * 100) : 0;
  const examPassed = examSubmitted && examScoreRaw >= Math.ceil(questions.length * 0.6);
  const allExamAnswered = questions.length > 0 && questions.every(q => examAnswers[q.question_id]);

  // Phase step indicator
  const PHASE_STEPS: { key: LearningPhase; label: string }[] = [
    { key: 'intro', label: 'Einstieg' },
    { key: 'goals', label: 'Lernziele' },
    { key: 'practice', label: 'Üben' },
    { key: 'consolidation', label: 'Festigung' },
    { key: 'exam', label: 'Abschlusstest' },
    { key: 'certificate', label: 'Zertifikat' },
  ];
  const phaseIdx = PHASE_STEPS.findIndex(s => s.key === learningPhase);

  // ── Loading states ────────────────────────────────────────────────────────────

  if (loadingResult) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Loader2 className="w-10 h-10 text-[#66c0b6] animate-spin" />
        <p className="text-white/60">Lerneinheit wird geladen…</p>
      </div>
    );
  }

  if (!result && stillGenerating) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 max-w-sm mx-auto text-center">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(48,227,202,0.1)', border: '1px solid rgba(48,227,202,0.25)' }}>
          <Loader2 className="w-7 h-7 text-[#30E3CA] animate-spin" />
        </div>
        <div>
          <p className="text-white font-black text-lg">Lernpfad wird fertiggestellt…</p>
          <p className="text-white/45 text-sm mt-1.5 leading-relaxed">
            Inhalte werden im Hintergrund generiert. Diese Seite aktualisiert sich automatisch.
          </p>
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#30E3CA]"
              style={{ animation: `lpw2_pulse 1.4s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-2xl mx-auto" style={{ animation: 'lp_fadeUp 0.45s ease' }}>
      <style>{GLOBAL_STYLES}</style>

      {/* Progress stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {PHASE_STEPS.map((step, i) => {
          const isDone = i < phaseIdx;
          const isActive = i === phaseIdx;
          const isLocked = step.key === 'certificate' && !examPassed;
          return (
            <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  if (isDone && step.key !== 'certificate') setLearningPhase(step.key);
                  if (isActive) return;
                  if (step.key === 'certificate' && examPassed) setLearningPhase('certificate');
                }}
                disabled={!isDone && !isActive}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                style={{
                  background: isActive ? 'rgba(48,227,202,0.15)' : isDone ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? 'rgba(48,227,202,0.35)' : isDone ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  color: isActive ? '#30E3CA' : isDone ? '#4ade80' : isLocked ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.3)',
                  cursor: isDone && step.key !== 'certificate' ? 'pointer' : isActive ? 'default' : 'not-allowed',
                }}
              >
                {isDone && <svg width="9" height="9" viewBox="0 0 9 9"><polyline points="1.5,4.5 3.5,6.5 7.5,2.5" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                {step.label}
              </button>
              {i < PHASE_STEPS.length - 1 && (
                <div className="w-3 h-px flex-shrink-0" style={{ background: i < phaseIdx ? 'rgba(34,197,94,0.3)' : 'rgba(255,255,255,0.08)' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Phase 1: ARCS Attention — Intro ───────────────────────────────────── */}
      {learningPhase === 'intro' && (
        <div className="space-y-5" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg,rgba(48,227,202,0.1) 0%,rgba(6,7,15,0.98) 65%)', border: '1px solid rgba(48,227,202,0.25)' }}>
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(48,227,202,0.6),transparent)' }} />
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(48,227,202,0.12)', border: '1px solid rgba(48,227,202,0.3)' }}>
                  <Sparkles size={15} className="text-[#30E3CA]" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/60">Deine Lerneinheit</span>
              </div>
              <h2 className="text-2xl font-black text-white leading-tight">{officialTitle}</h2>
              {dqrRef && <p className="text-xs text-white/35">{dqrRef}</p>}
              <p className="text-sm text-white/60 leading-relaxed">
                Diese Lerneinheit wurde speziell für dein Karriereziel <span className="text-white font-bold">{learningPath.target_job}</span> zusammengestellt.
                Du wirst Schritt für Schritt durch die wichtigsten Kompetenzen geführt — mit geführter Übungsphase, Vertiefung und einem IHK-konformen Abschlusstest.
              </p>
            </div>
          </div>

          {/* How it works — DSR structure preview */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: '🎯', title: 'Lernziele', desc: 'Was du am Ende kannst', phase: 'goals' as LearningPhase },
              { icon: '🧠', title: 'Geführtes Üben', desc: 'Schritt für Schritt mit Feedback', phase: 'practice' as LearningPhase },
              { icon: '🏆', title: 'Abschlusstest', desc: 'IHK-konformes Zertifikat', phase: 'exam' as LearningPhase },
            ].map((item) => (
              <div key={item.title} className="px-3 py-3.5 rounded-xl text-center"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div className="text-xl mb-2">{item.icon}</div>
                <p className="text-xs font-black text-white">{item.title}</p>
                <p className="text-[10px] text-white/35 mt-0.5 leading-snug">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: 'rgba(248,197,100,0.06)', border: '1px solid rgba(248,197,100,0.18)' }}>
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
            <p className="text-xs text-amber-300/70 leading-relaxed">
              <span className="font-bold text-amber-300/90">Tipp:</span> Gehe die Übungsphase gewissenhaft durch — sie bereitet dich direkt auf den Abschlusstest vor.
            </p>
          </div>

          <button
            onClick={() => setLearningPhase('goals')}
            className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', boxShadow: '0 4px 24px rgba(48,227,202,0.3)' }}>
            Lerneinheit starten
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* ── Phase 2: DSR Discipline — Learning Goals ──────────────────────────── */}
      {learningPhase === 'goals' && (
        <div className="space-y-5" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 mb-3">Nach dieser Einheit kannst du…</p>
            {competencies.length > 0 ? (
              <div className="space-y-2">
                {competencies.map((comp, i) => (
                  <div key={i} className="flex items-start gap-3 px-4 py-3.5 rounded-xl"
                    style={{ background: 'rgba(102,192,182,0.06)', border: '1px solid rgba(102,192,182,0.14)' }}>
                    <div className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black mt-0.5"
                      style={{ background: 'rgba(48,227,202,0.12)', color: '#30E3CA', border: '1px solid rgba(48,227,202,0.22)' }}>
                      {i + 1}
                    </div>
                    <p className="text-sm text-white/80 leading-relaxed">{comp}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-6 rounded-xl text-center text-white/35"
                style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
                Lernziele werden geladen…
              </div>
            )}
          </div>

          <div className="rounded-xl px-4 py-3.5 space-y-1"
            style={{ background: 'rgba(48,227,202,0.04)', border: '1px solid rgba(48,227,202,0.14)' }}>
            <p className="text-xs font-black text-[#30E3CA]/70">Übungsphase</p>
            <p className="text-xs text-white/45 leading-relaxed">
              Du wirst jetzt {practiceQuestions.length} Übungsfragen durchgehen — mit sofortigem Feedback und Erklärung nach jeder Antwort. So baust du gezielt Verständnis auf, bevor du den finalen Test angehst.
            </p>
          </div>

          <button
            onClick={() => setLearningPhase('practice')}
            className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', boxShadow: '0 4px 20px rgba(48,227,202,0.25)' }}>
            Mit Übungsphase starten
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* ── Phase 3: CLT Guided Practice ──────────────────────────────────────── */}
      {learningPhase === 'practice' && (() => {
        const q = practiceQuestions[practice.currentIdx];
        if (!q) return (
          <div className="text-center py-12 text-white/40">Keine Übungsfragen vorhanden.</div>
        );
        const progressPct = Math.round(((practice.currentIdx) / practiceQuestions.length) * 100);
        const isLast = practice.currentIdx === practiceQuestions.length - 1;

        return (
          <div className="space-y-5" style={{ animation: 'lp_fadeUp 0.35s ease' }}>
            {/* Progress */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/35 font-bold">Übungsfrage {practice.currentIdx + 1} / {practiceQuestions.length}</span>
                <span className="text-[#30E3CA] font-black">{progressPct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, background: 'linear-gradient(90deg,#66c0b6,#30E3CA)' }} />
              </div>
            </div>

            {/* CLT: practice score badge */}
            {practice.currentIdx > 0 && (
              <div className="flex items-center gap-2 text-xs text-white/35">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400/60" />
                <span>{practice.correct} von {practice.currentIdx} richtig bisher</span>
              </div>
            )}

            {/* Question card */}
            <div className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${practice.revealed ? (practice.selected === q.correct_key ? 'rgba(74,222,128,0.35)' : 'rgba(248,113,113,0.35)') : 'rgba(255,255,255,0.1)'}` }}>
              <div className="px-5 py-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <p className="text-base font-bold text-white leading-snug">{q.question}</p>
                {q.clt_rating && (
                  <p className="text-[10px] text-white/20 mt-1.5">{q.clt_rating}</p>
                )}
              </div>
              <div className="p-4 space-y-2">
                {(Object.entries(q.options) as [string, string][]).map(([key, text]) => {
                  const isSelected = practice.selected === key;
                  const isCorrectOpt = key === q.correct_key;
                  let bg = 'rgba(255,255,255,0.03)';
                  let border = 'rgba(255,255,255,0.09)';
                  let color = 'rgba(255,255,255,0.75)';
                  if (practice.revealed) {
                    if (isCorrectOpt) { bg = 'rgba(74,222,128,0.1)'; border = 'rgba(74,222,128,0.4)'; color = '#4ade80'; }
                    else if (isSelected) { bg = 'rgba(248,113,113,0.08)'; border = 'rgba(248,113,113,0.3)'; color = '#f87171'; }
                    else { color = 'rgba(255,255,255,0.25)'; }
                  } else if (isSelected) {
                    bg = 'rgba(48,227,202,0.1)'; border = 'rgba(48,227,202,0.35)'; color = '#30E3CA';
                  }
                  return (
                    <button key={key}
                      disabled={practice.revealed}
                      onClick={() => {
                        if (practice.revealed) return;
                        const correct = key === q.correct_key;
                        setPractice(p => ({ ...p, selected: key, revealed: true, correct: p.correct + (correct ? 1 : 0) }));
                      }}
                      className="w-full text-left flex items-start gap-3 px-4 py-3 rounded-xl transition-all hover:scale-[1.005] active:scale-[0.995]"
                      style={{ background: bg, border: `1px solid ${border}`, color }}>
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                        style={{ background: `rgba(255,255,255,0.06)`, border: `1px solid ${border}` }}>{key}</span>
                      <span className="text-sm leading-relaxed">{text}</span>
                    </button>
                  );
                })}
              </div>

              {/* CLT: immediate rationale after answer */}
              {practice.revealed && (
                <div className="px-5 pb-5 space-y-3">
                  <div className="flex gap-2.5 items-start p-3.5 rounded-xl"
                    style={{ background: practice.selected === q.correct_key ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${practice.selected === q.correct_key ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)'}` }}>
                    <div className="flex-shrink-0 mt-0.5">
                      {practice.selected === q.correct_key
                        ? <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="rgba(74,222,128,0.15)" stroke="#4ade80" strokeWidth="1.5"/><polyline points="4,7 6,9 10,5" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        : <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="rgba(248,113,113,0.15)" stroke="#f87171" strokeWidth="1.5"/><line x1="4.5" y1="4.5" x2="9.5" y2="9.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/><line x1="9.5" y1="4.5" x2="4.5" y2="9.5" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      }
                    </div>
                    <div>
                      <p className="text-xs font-black" style={{ color: practice.selected === q.correct_key ? '#4ade80' : '#f87171' }}>
                        {practice.selected === q.correct_key ? 'Richtig!' : `Falsch — richtig wäre: ${q.correct_key}`}
                      </p>
                      {q.rationale && <p className="text-xs text-white/55 mt-1 leading-relaxed">{q.rationale}</p>}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (isLast) {
                        setLearningPhase('consolidation');
                      } else {
                        setPractice(p => ({ ...p, currentIdx: p.currentIdx + 1, selected: null, revealed: false }));
                      }
                    }}
                    className="w-full py-3.5 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
                    style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}>
                    {isLast ? 'Zur Vertiefung' : 'Nächste Frage'}
                    <ArrowRight size={15} />
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Phase 4: DSR Skill — Consolidation ────────────────────────────────── */}
      {learningPhase === 'consolidation' && (
        <div className="space-y-5" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
          {/* Score summary */}
          <div className="rounded-2xl p-5 text-center space-y-2"
            style={{
              background: practice.correct >= Math.ceil(practiceQuestions.length * 0.6) ? 'rgba(74,222,128,0.06)' : 'rgba(248,197,100,0.06)',
              border: `1px solid ${practice.correct >= Math.ceil(practiceQuestions.length * 0.6) ? 'rgba(74,222,128,0.25)' : 'rgba(248,197,100,0.2)'}`,
            }}>
            <div className="text-4xl font-black" style={{ color: practice.correct >= Math.ceil(practiceQuestions.length * 0.6) ? '#4ade80' : '#fbbf24' }}>
              {practice.correct}/{practiceQuestions.length}
            </div>
            <p className="text-white font-black">Übungsphase abgeschlossen</p>
            <p className="text-xs text-white/45 leading-relaxed">
              {practice.correct >= Math.ceil(practiceQuestions.length * 0.6)
                ? 'Gute Leistung! Du bist bereit für den Abschlusstest.'
                : 'Gehe die Erklärungen nochmal durch — beim Abschlusstest stehen die gleichen Themen an.'}
            </p>
          </div>

          {/* What was learned — ARCS Relevance */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 px-1 mb-3">Was du gelernt hast</p>
            <div className="space-y-2">
              {competencies.slice(0, 3).map((comp, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(48,227,202,0.04)', border: '1px solid rgba(48,227,202,0.1)' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="5.5" fill="rgba(48,227,202,0.1)" stroke="#30E3CA" strokeWidth="1.2"/><polyline points="3.5,6.5 5.5,8.5 9.5,4.5" fill="none" stroke="#30E3CA" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <p className="text-xs text-white/65 leading-relaxed">{comp}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Next step info */}
          <div className="rounded-xl px-4 py-3.5"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-xs font-black text-white/70 mb-1">Jetzt: IHK-Abschlusstest</p>
            <p className="text-xs text-white/40 leading-relaxed">
              Der Abschlusstest enthält {questions.length} Fragen zu allen Themen dieser Einheit. Diesmal ohne Feedback nach jeder Antwort — erst am Ende siehst du dein Ergebnis. Mindestens 60% zum Bestehen.
            </p>
          </div>

          <button
            onClick={() => setLearningPhase('exam')}
            className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', boxShadow: '0 4px 20px rgba(48,227,202,0.3)' }}>
            Abschlusstest starten
            <ArrowRight size={18} />
          </button>
        </div>
      )}

      {/* ── Phase 5: ARCS Satisfaction — Final Exam ───────────────────────────── */}
      {learningPhase === 'exam' && (
        <div className="space-y-4" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
          {!examSubmitted && (
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-white/30">IHK-Abschlusstest · {questions.length} Fragen</p>
              <span className="text-xs text-white/40">{Object.keys(examAnswers).length}/{questions.length} beantwortet</span>
            </div>
          )}

          {!examSubmitted ? (
            <>
              {questions.map((q, idx) => {
                const selected = examAnswers[q.question_id];
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
                            onClick={() => setExamAnswers(prev => ({ ...prev, [q.question_id]: key }))}
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
                disabled={!allExamAnswered}
                onClick={async () => {
                  const correct = questions.filter(q => examAnswers[q.question_id] === q.correct_key).length;
                  const pct = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 0;
                  const passed = correct >= Math.ceil(questions.length * 0.6);
                  setExamSubmitted(true);
                  setExamRevealed(Object.fromEntries(questions.map(q => [q.question_id, true])));
                  if (passed) {
                    await saveUnitCompletion(pct, (result as any)?.id);
                  }
                }}
                className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', boxShadow: allExamAnswered ? '0 4px 20px rgba(48,227,202,0.25)' : 'none' }}>
                Test abschicken
                <Check size={18} />
              </button>
            </>
          ) : (
            <div className="space-y-4">
              {/* Score */}
              <div className="rounded-2xl p-6 text-center space-y-3"
                style={{ background: examPassed ? 'rgba(74,222,128,0.06)' : 'rgba(248,113,113,0.06)', border: `1px solid ${examPassed ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
                <div className="text-5xl font-black" style={{ color: examPassed ? '#4ade80' : '#f87171' }}>
                  {examScore}/{questions.length}
                </div>
                <p className="text-lg font-bold text-white">{examPassed ? 'Bestanden!' : 'Nicht bestanden'}</p>
                <p className="text-sm text-white/55">
                  {examPassed
                    ? `${examScoreRaw} von ${questions.length} Fragen richtig. Herzlichen Glückwunsch!`
                    : `${examScoreRaw} von ${questions.length} richtig — mindestens ${Math.ceil(questions.length * 0.6)} benötigt.`}
                </p>
              </div>

              {/* Review answers */}
              <p className="text-[10px] font-black uppercase tracking-widest text-white/25 px-1">Antworten im Überblick</p>
              {questions.map((q, idx) => {
                const selected = examAnswers[q.question_id];
                const isCorrect = selected === q.correct_key;
                return (
                  <div key={q.question_id} className="rounded-xl overflow-hidden"
                    style={{ border: `1px solid ${isCorrect ? 'rgba(74,222,128,0.25)' : 'rgba(248,113,113,0.25)'}` }}>
                    <div className="px-4 py-3 flex items-start gap-2" style={{ background: 'rgba(255,255,255,0.02)' }}>
                      <span className="flex-shrink-0 text-xs font-black text-white/25 mt-0.5">{idx + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-white/80 leading-snug">{q.question}</p>
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {isCorrect
                            ? <span className="text-[10px] font-black text-green-400/70">Richtig · {q.correct_key}</span>
                            : <span className="text-[10px] font-black text-red-400/70">Falsch · Deine Antwort: {selected} · Richtig: {q.correct_key}</span>}
                        </div>
                        {q.rationale && <p className="text-[10px] text-white/35 mt-1 leading-relaxed">{q.rationale}</p>}
                      </div>
                    </div>
                  </div>
                );
              })}

              {examPassed ? (
                <div className="space-y-3">
                  {savingCompletion && (
                    <div className="flex items-center justify-center gap-2 text-[#30E3CA]/70 text-xs">
                      <Loader2 size={13} className="animate-spin" />
                      <span>Fortschritt wird gespeichert…</span>
                    </div>
                  )}
                  {/* Unit progress indicator */}
                  <div className="rounded-xl px-4 py-3 flex items-center gap-3"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex gap-1">
                      {Array.from({ length: TOTAL_UNITS }, (_, i) => {
                        const done = completedUnits.has(i + 1);
                        return (
                          <div key={i} className="w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black"
                            style={{
                              background: done ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                              border: done ? '1px solid rgba(34,197,94,0.35)' : '1px solid rgba(255,255,255,0.1)',
                              color: done ? '#4ade80' : 'rgba(255,255,255,0.25)',
                            }}>
                            {done ? '✓' : i + 1}
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-[11px] text-white/45 flex-1">
                      {completedUnits.size} / {TOTAL_UNITS} Lerneinheiten abgeschlossen
                    </p>
                  </div>
                  <button
                    disabled={!allUnitsComplete}
                    onClick={() => allUnitsComplete && setLearningPhase('certificate')}
                    className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      background: allUnitsComplete ? 'linear-gradient(135deg,#22c55e,#4ade80)' : 'rgba(255,255,255,0.08)',
                      boxShadow: allUnitsComplete ? '0 4px 24px rgba(34,197,94,0.3)' : 'none',
                      color: allUnitsComplete ? 'black' : 'rgba(255,255,255,0.4)',
                    }}>
                    <Award size={18} />
                    {allUnitsComplete
                      ? 'Zum Zertifikat'
                      : `Noch ${TOTAL_UNITS - completedUnits.size} Lerneinheit${TOTAL_UNITS - completedUnits.size === 1 ? '' : 'en'} ausstehend`}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setExamSubmitted(false); setExamAnswers({}); setExamRevealed({}); }}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white/70 transition-all hover:bg-white/5"
                  style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                  Test wiederholen
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Phase 6: Certificate ───────────────────────────────────────────────── */}
      {learningPhase === 'certificate' && (
        <div className="space-y-5" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'linear-gradient(135deg,rgba(34,197,94,0.08) 0%,rgba(6,7,15,0.98) 65%)', border: '1px solid rgba(34,197,94,0.3)' }}>
            <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(34,197,94,0.6),transparent)' }} />
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                  <Award size={22} className="text-green-400" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-green-400/60">Zertifikat bereit</p>
                  <h3 className="text-lg font-black text-white leading-tight">{officialTitle}</h3>
                </div>
              </div>
              {dqrRef && <p className="text-xs text-white/30">{dqrRef}</p>}
              {verificationFooter && <p className="text-xs text-white/40 leading-relaxed">{verificationFooter}</p>}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/25 px-1 mb-3">Nachgewiesene Kompetenzen</p>
            <div className="space-y-2">
              {competencies.map((comp, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)' }}>
                  <svg width="13" height="13" viewBox="0 0 13 13"><circle cx="6.5" cy="6.5" r="5.5" fill="rgba(34,197,94,0.1)" stroke="#22c55e" strokeWidth="1.2"/><polyline points="3.5,6.5 5.5,8.5 9.5,4.5" fill="none" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <p className="text-xs text-white/65 leading-relaxed">{comp}</p>
                </div>
              ))}
            </div>
          </div>

          <button
            disabled={isGeneratingCertificate}
            onClick={onCertificateRequest}
            className="w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-2 transition-all disabled:opacity-60 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#22c55e,#4ade80)', boxShadow: '0 4px 24px rgba(34,197,94,0.3)' }}>
            {isGeneratingCertificate
              ? <><Loader2 size={18} className="animate-spin" /><span>Wird erstellt…</span></>
              : <><Award size={18} /><span>Zertifikat als PDF herunterladen</span></>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

type PagePhase = 'loading' | 'result' | 'generating' | 'revealing' | 'done' | 'error' | 'redirect_waiting';

export default function LearningPathPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [learningPath, setLearningPath]   = useState<LearningPath | null>(null);
  const [phase, setPhase]                 = useState<PagePhase>('loading');
  const [error, setError]                 = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isGeneratingCertificate, setIsGeneratingCertificate] = useState(false);
  const [generatorSuccess, setGeneratorSuccess] = useState(false);
  // When true, show the full dashboard instead of the result/analysis view
  const [showDashboard, setShowDashboard] = useState(false);
  // Unit tracking: which of the 5 units are done, and which unit is currently open
  const [completedUnits, setCompletedUnits] = useState<Set<number>>(new Set());
  const [activeUnitIndex, setActiveUnitIndex] = useState(1); // 1–5
  const TOTAL_UNITS = 5;

  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollTimerRef       = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef       = useRef(0);
  const completedRef       = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const stopPolling = () => {
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
  };

  const cleanupListeners = useCallback(() => {
    if (realtimeChannelRef.current) {
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    stopPolling();
  }, []);

  const resultFromPath = (path: LearningPath): AnalysisResult => ({
    missingSkills:    parseSkills(path.missing_skills),
    currentSkills:    parseSkills(path.current_skills),
    strategicOutlook: (path as any).strategic_outlook_2026 ?? '',
    matchScore:       Number(path.match_score ?? 0),
    targetJob:        path.target_job ?? '',
    targetCompany:    path.target_company ?? '',
    industry:         path.industry ?? '',
  });

  // ── Phase resolver ────────────────────────────────────────────────────────────

  const parseCurriculumModules = useCallback((curriculum: unknown): unknown[] => {
    if (!curriculum) return [];
    // Already an object with modules
    if (typeof curriculum === 'object' && (curriculum as any).modules?.length > 0) {
      return (curriculum as any).modules;
    }
    // Stored as JSON string
    if (typeof curriculum === 'string') {
      try {
        const parsed = JSON.parse(curriculum);
        if (parsed?.modules?.length > 0) return parsed.modules;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch { /* */ }
    }
    return [];
  }, []);

  const resolvePhase = useCallback((path: LearningPath, hasLearningResults: boolean) => {
    const modules = parseCurriculumModules(path.curriculum);
    // learning_results exists + completed → show dashboard content
    if (hasLearningResults) {
      return 'result' as PagePhase;
    }
    // Has curriculum modules → show result/analysis view
    if (modules.length > 0 || path.status === 'curriculum_ready' || path.status === 'completed') {
      return 'result' as PagePhase;
    }
    // Paid but no content yet → redirect to waiting page (handles trigger + polling)
    if (path.is_paid) {
      return 'redirect_waiting' as PagePhase;
    }
    // Not paid → show result/analysis view with paywall CTA
    return 'result' as PagePhase;
  }, [parseCurriculumModules]);

  // ── Normalize path (parse curriculum if stored as JSON string) ───────────────

  const normalizePath = useCallback((path: LearningPath): LearningPath => {
    if (path.curriculum && typeof path.curriculum === 'string') {
      try {
        const parsed = JSON.parse(path.curriculum as unknown as string);
        return { ...path, curriculum: parsed };
      } catch { /* leave as-is */ }
    }
    return path;
  }, []);

  // ── Curriculum ready handler (after generation) ───────────────────────────────

  const handleCurriculumReady = useCallback(async (path: LearningPath) => {
    if (completedRef.current) return;
    completedRef.current = true;
    cleanupListeners();
    setGeneratorSuccess(true);
    await new Promise((r) => setTimeout(r, 1_800));
    const normalized = normalizePath(path);
    setLearningPath(normalized);
    setAnalysisResult(resultFromPath(normalized));
    // After generation completes, go straight to dashboard
    setShowDashboard(true);
    setPhase('done');
  }, [cleanupListeners, normalizePath]);

  // ── Polling for curriculum ────────────────────────────────────────────────────

  const startCurriculumPolling = useCallback((id: string) => {
    pollCountRef.current = 0;
    const tick = async () => {
      if (completedRef.current) return;
      if (pollCountRef.current >= POLL_MAX) return;
      pollCountRef.current += 1;
      try {
        // Primary: check learning_results — ready when final_exam exists
        const { data: result } = await supabase
          .from('learning_results')
          .select('final_exam')
          .eq('id', id)
          .maybeSingle();
        if (result?.final_exam) {
          const { data: lp } = await supabase.from('learning_paths').select('*').eq('id', id).maybeSingle();
          if (lp) { handleCurriculumReady(lp as unknown as LearningPath); return; }
        }
        // Fallback: check learning_paths status
        const { data } = await supabase
          .from('learning_paths')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (data && COMPLETE_STATUSES.has(data.status)) {
          handleCurriculumReady(data as unknown as LearningPath);
          return;
        }
      } catch { /* */ }
      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    };
    pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
  }, [handleCurriculumReady]);

  // ── Trigger curriculum generation ─────────────────────────────────────────────

  const triggerCurriculumGeneration = useCallback(async (path: LearningPath) => {
    completedRef.current = false;
    pollCountRef.current = 0;
    setGeneratorSuccess(false);
    setPhase('generating');

    // Start realtime + polling immediately — listen to both tables
    const channel = supabase
      .channel(`lp_curriculum_${path.id}_${Date.now()}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'learning_results', filter: `id=eq.${path.id}` },
        async (payload) => {
          if ((payload.new as any)?.status === 'completed') {
            const { data: lp } = await supabase.from('learning_paths').select('*').eq('id', path.id).maybeSingle();
            if (lp) handleCurriculumReady(lp as unknown as LearningPath);
          }
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_results', filter: `id=eq.${path.id}` },
        async (payload) => {
          if ((payload.new as any)?.status === 'completed') {
            const { data: lp } = await supabase.from('learning_paths').select('*').eq('id', path.id).maybeSingle();
            if (lp) handleCurriculumReady(lp as unknown as LearningPath);
          }
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_paths', filter: `id=eq.${path.id}` },
        (payload) => {
          const row = payload.new as any;
          if (COMPLETE_STATUSES.has(row?.status)) {
            handleCurriculumReady(row as unknown as LearningPath);
          }
        })
      .subscribe();
    realtimeChannelRef.current = channel;
    startCurriculumPolling(path.id);

    // Fire learning path webhook
    try {
      const allMissingSkills = parseSkills(path.missing_skills);
      const currentSkills = parseSkills(path.current_skills);
      const selectedSkill = (path as any).selected_skill || null;
      console.log('[LearningPath] Triggering webhook:', LEARNINGPATH_WEBHOOK_URL);
      const res = await fetch(LEARNINGPATH_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learning_path_id: path.id,
          selected_skill: selectedSkill,
          missing_skills: selectedSkill ? [selectedSkill] : allMissingSkills,
          current_skills: currentSkills,
          target_job: path.target_job,
          target_company: path.target_company,
          industry: path.industry,
          user_id: path.user_id,
          timeframe: '12_months',
          learning_style: 'balanced',
          timestamp: new Date().toISOString(),
        }),
      });
      if (!res.ok) {
        console.warn('[LearningPath] Webhook response:', res.status);
      } else {
        console.log('[LearningPath] Webhook triggered successfully');
        const now = new Date().toISOString();
        await supabase.from('learning_paths')
          .update({ status: 'in_progress', updated_at: now, triggered_at: now })
          .eq('id', path.id);
      }
    } catch (e: any) {
      console.warn('[LearningPath] Curriculum webhook error (non-fatal):', e.message);
    }
  }, [handleCurriculumReady, startCurriculumPolling]);

  // ── Load learning path ────────────────────────────────────────────────────────

  const loadCompletedUnits = useCallback(async () => {
    if (!pathId) return;
    const { data } = await supabase
      .from('unit_completions')
      .select('unit_index')
      .eq('learning_path_id', pathId);
    if (data) {
      setCompletedUnits(new Set(data.map((r: any) => r.unit_index as number)));
    }
  }, [pathId]);

  const loadLearningPath = useCallback(async (showLoader = false) => {
    if (!pathId) return;
    if (showLoader) setPhase('loading');
    setError(null);
    try {
      const raw = await careerService.getLearningPath(pathId);
      if (!raw) { setError('Lernpfad nicht gefunden'); setPhase('error'); return; }
      const path = normalizePath(raw);

      // Check learning_results — only count as "ready" when final_exam data actually exists
      const { data: resultRow } = await supabase
        .from('learning_results')
        .select('status, final_exam')
        .eq('id', pathId)
        .maybeSingle();
      // Also check partial rows written via learning_path_id (Make multi-run support)
      const { data: partialRow } = await supabase
        .from('learning_results')
        .select('id, final_exam')
        .eq('learning_path_id', pathId)
        .not('final_exam', 'is', null)
        .limit(1)
        .maybeSingle();
      const hasResults = !!resultRow?.final_exam || !!partialRow?.final_exam;

      setLearningPath(path);
      setAnalysisResult(resultFromPath(path));

      // If any results exist and path is paid, go straight to learning content
      if (hasResults && path.is_paid) {
        setShowDashboard(true);
        setPhase('done');
        loadCompletedUnits();
        return;
      }

      const resolvedPhase = resolvePhase(path, hasResults);

      if (resolvedPhase === 'redirect_waiting') {
        navigate(`/learning-path-waiting/${pathId}`, { replace: true });
        return;
      }

      setPhase(resolvedPhase);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden');
      setPhase('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId, resolvePhase, normalizePath, navigate]);

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (pathId) { loadLearningPath(true); loadCompletedUnits(); }
  }, [pathId, loadLearningPath, loadCompletedUnits]);

  // When phase becomes 'generating' (resume after browser close or direct navigation)
  // start polling/realtime. Also check if we need to re-trigger Make.
  useEffect(() => {
    if (phase !== 'generating' || !learningPath) return;
    if (completedRef.current) return;
    completedRef.current = false;

    const id = learningPath.id;

    (async () => {
      // Check if learning_results already has final_exam content — if so, go straight to done
      const { data: result } = await supabase
        .from('learning_results').select('final_exam').eq('id', id).maybeSingle();
      if (result?.final_exam) {
        handleCurriculumReady(learningPath);
        return;
      }

      // If status is not in-flight (e.g. gap_analysis_complete), re-trigger Make
      const needsRetrigger = !IN_FLIGHT_STATUSES.has(learningPath.status as string);
      if (needsRetrigger) {
        console.log('[LearningPath] Re-triggering Make for path:', id);
        triggerCurriculumGeneration(learningPath);
        return;
      }

      // Already in-flight — just listen
      const channel = supabase
        .channel(`lp_resume_${id}_${Date.now()}`)
        .on('postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'learning_results', filter: `id=eq.${id}` },
          async (payload) => {
            if ((payload.new as any)?.status === 'completed') {
              const { data: lp } = await supabase.from('learning_paths').select('*').eq('id', id).maybeSingle();
              if (lp) handleCurriculumReady(lp as unknown as LearningPath);
            }
          })
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'learning_results', filter: `id=eq.${id}` },
          async (payload) => {
            if ((payload.new as any)?.status === 'completed') {
              const { data: lp } = await supabase.from('learning_paths').select('*').eq('id', id).maybeSingle();
              if (lp) handleCurriculumReady(lp as unknown as LearningPath);
            }
          })
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'learning_paths', filter: `id=eq.${id}` },
          (payload) => {
            const row = payload.new as any;
            if (COMPLETE_STATUSES.has(row?.status) || (row?.curriculum as any)?.modules?.length > 0) {
              handleCurriculumReady(row as unknown as LearningPath);
            }
          })
        .subscribe();
      realtimeChannelRef.current = channel;
      startCurriculumPolling(id);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, learningPath?.id]);

  // Handle Stripe payment return (?payment=success)
  // Note: Stripe success_url normally goes to /learning-path-waiting/:id — this handles edge cases
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success' && pathId) {
      setSearchParams({}, { replace: true });
      // Redirect to waiting page which handles trigger + polling cleanly
      navigate(`/learning-path-waiting/${pathId}`, { replace: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => cleanupListeners(), [cleanupListeners]);

  // ── Certificate ───────────────────────────────────────────────────────────────

  const handleCertificateRequest = async () => {
    if (!learningPath) return;
    const recipientName = user?.email?.split('@')[0] || learningPath.user_id?.substring(0, 8) || 'Teilnehmer';
    setIsGeneratingCertificate(true);
    try {
      await certificateService.issueCertificate(learningPath, recipientName);
      await loadLearningPath(false);
    } catch (err: any) {
      alert('Fehler beim Erstellen des Zertifikats: ' + err.message);
    } finally {
      setIsGeneratingCertificate(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-[#66c0b6] animate-spin" />
          <p className="text-white/70 font-medium">Lade Lernpfad...</p>
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

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      <div className="max-w-6xl mx-auto px-4 py-12 space-y-8">

        {/* Nav bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => showDashboard ? setShowDashboard(false) : navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <ArrowLeft size={20} />
            <span>Zurück</span>
          </button>
          {phase === 'done' && learningPath.status === 'completed' && (
            <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#66c0b6]/20 to-[#30E3CA]/20 border border-[#66c0b6]/30">
              <span className="text-[#66c0b6] font-semibold">✓ Abgeschlossen</span>
            </div>
          )}
        </div>

        {/* Phase: result — analysis view (all skills); also shown for paid paths before entering dashboard */}
        {(phase === 'result' || (phase === 'done' && !showDashboard)) && analysisResult && (
          <ResultView
            result={analysisResult}
            learningPath={learningPath}
            onPaywallClose={() => loadLearningPath(false)}
            onGoToDashboard={() => setShowDashboard(true)}
          />
        )}

        {/* Phase: generating — curriculum being built */}
        {(phase === 'generating' || phase === 'revealing') && (
          <div className="max-w-2xl mx-auto">
            <CurriculumLoader success={generatorSuccess} targetJob={learningPath.target_job ?? ''} />
          </div>
        )}

        {/* Learning content — shown after user clicks "Zum Lernpfad" or after generation/payment */}
        {showDashboard && (
          <div className="space-y-6">
            {/* Unit selector: 5 units, each with A/B variant determined by unit index parity */}
            <div className="max-w-2xl mx-auto">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/25 mb-3">
                Lerneinheiten ({completedUnits.size}/{TOTAL_UNITS} abgeschlossen)
              </p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {Array.from({ length: TOTAL_UNITS }, (_, i) => {
                  const idx = i + 1;
                  const done = completedUnits.has(idx);
                  const active = activeUnitIndex === idx;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveUnitIndex(idx)}
                      className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all hover:scale-[1.03]"
                      style={{
                        background: active
                          ? 'rgba(48,227,202,0.12)'
                          : done
                          ? 'rgba(34,197,94,0.08)'
                          : 'rgba(255,255,255,0.04)',
                        border: active
                          ? '1px solid rgba(48,227,202,0.35)'
                          : done
                          ? '1px solid rgba(34,197,94,0.3)'
                          : '1px solid rgba(255,255,255,0.09)',
                        color: active ? '#30E3CA' : done ? '#4ade80' : 'rgba(255,255,255,0.45)',
                      }}>
                      {done && (
                        <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2.5" fill="none" stroke="#4ade80" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      )}
                      Einheit {idx}
                      <span className="text-[9px] opacity-60">{idx % 2 === 0 ? 'B' : 'A'}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <LearningContent
              key={activeUnitIndex}
              learningPath={learningPath}
              onCertificateRequest={handleCertificateRequest}
              isGeneratingCertificate={isGeneratingCertificate}
              unitIndex={activeUnitIndex}
              unitVariant={activeUnitIndex % 2 === 0 ? 'B' : 'A'}
              userId={user?.id ?? null}
              completedUnits={completedUnits}
              onUnitCompleted={(idx) => setCompletedUnits(prev => new Set([...prev, idx]))}
            />
          </div>
        )}

        {/* Certificate overlay */}
        {isGeneratingCertificate && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#020617] border border-white/10 rounded-2xl p-8 max-w-md text-center space-y-4">
              <Loader2 className="w-16 h-16 text-[#66c0b6] animate-spin mx-auto" />
              <h3 className="text-xl font-bold text-white">Erstelle Zertifikat...</h3>
              <p className="text-white/70">Dein Zertifikat wird generiert und automatisch heruntergeladen.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
