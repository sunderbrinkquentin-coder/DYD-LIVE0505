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

const FINAL_EXAM_WEBHOOK_URL =
  import.meta.env.VITE_MAKE_WEBHOOK_FINAL_EXAM
  || 'https://hook.eu2.make.com/jp9n42qofc5zvtab8x58o3i2j53ebpt2';

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
  const scoreColor = matchScore >= 70 ? '#22c55e' : matchScore >= 40 ? '#f59e0b' : '#30E3CA';

  // CLT: Group by tier for schema-based processing
  const criticalSkills  = visibleSkills.filter(s => (s?.gap_severity ?? 0) >= 4);
  const buildSkills     = visibleSkills.filter(s => (s?.gap_severity ?? 0) >= 2 && (s?.gap_severity ?? 0) < 4);

  // Skill selection — persisted to DB column `skill` immediately so Make always gets the chosen skill
  const initialSkill = (() => {
    const stored = (learningPath as any).skill;
    if (stored && typeof stored === 'string') return stored;
    if (stored && typeof stored === 'object') return stored.skill_name || stored.name || null;
    return visibleSkills[0] ? skillDisplayName(visibleSkills[0]) : null;
  })();
  const [selectedSkillName, setSelectedSkillName] = useState<string | null>(initialSkill);
  const [isSavingSkill, setIsSavingSkill] = useState(false);

  const selectSkill = async (name: string) => {
    if (name === selectedSkillName) return;
    setSelectedSkillName(name);
    setIsSavingSkill(true);
    try {
      await supabase.from('learning_paths')
        .update({ skill: name, updated_at: new Date().toISOString() })
        .eq('id', learningPath.id);
    } finally {
      setIsSavingSkill(false);
    }
  };

  const allSelectableSkills = visibleSkills.slice(0, 8);

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

      {/* ── 4. SKILL AUSWAHL + AKTION ────────────────────────────────── */}
      {/* ARCS:Relevance — user picks their focus skill, feels ownership */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: 'rgba(48,227,202,0.05)', border: '1px solid rgba(48,227,202,0.2)' }}
      >
        <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(48,227,202,0.4),transparent)' }} />
        <div className="p-5 space-y-4">

          {/* Skill picker — CLT: one decision at a time */}
          {!isPaid && allSelectableSkills.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA]/60">
                  Mit welchem Skill startest du?
                </p>
                {isSavingSkill && (
                  <div className="w-3 h-3 rounded-full border border-[#30E3CA]/40 border-t-[#30E3CA] animate-spin" />
                )}
              </div>
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
                          <polyline points="2,5 4.5,7.5 8,3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                      {name}
                    </button>
                  );
                })}
              </div>
              {selectedSkillName && (() => {
                const match = visibleSkills.find(s => skillDisplayName(s) === selectedSkillName);
                return match?.pitch ? (
                  <p className="text-[11px] text-white/45 leading-relaxed px-1 pt-1">
                    {match.pitch}
                  </p>
                ) : null;
              })()}
            </div>
          )}

          {/* Selected skill summary when paid */}
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
                onClick={() => setShowPaywall(true)}
                disabled={!selectedSkillName}
                className="group relative w-full py-4 rounded-xl font-black text-[15px] text-black flex items-center justify-center gap-3 overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', animation: selectedSkillName ? 'lp_ctaPulse 2.5s ease-in-out infinite' : 'none', boxShadow: '0 4px 20px rgba(48,227,202,0.3)' }}
              >
                <div className="absolute inset-0 pointer-events-none"
                  style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', backgroundSize: '200% 100%', animation: 'lp_shimmer 2s ease-in-out infinite' }} />
                <Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                <span className="relative z-10">
                  {selectedSkillName ? `Lernpfad für "${selectedSkillName}" starten` : 'Skill auswählen…'}
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
          learningPathId={learningPath.id}
          targetJob={targetJob}
          targetCompany={targetCompany}
          skillCount={visibleSkills.length}
          selectedSkill={selectedSkillName ?? undefined}
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

interface LearningResultRow {
  id: string;
  content: unknown; // Array of 5 units: [{unit_id, mobile_title, variant_a, variant_b, competencies, quiz}]
  status: string | null;
  final_exam: unknown;
  certificate_metadata: {
    official_title?: string;
    competency_profile?: string[];
    dqr_reference?: string;
    verification_footer?: string;
  } | null;
}

// Parse content field to extract a specific unit by index
function parseContentUnit(content: unknown, unitIndex: number): Record<string, any> | null {
  if (!content) return null;
  try {
    let units: any[];
    if (Array.isArray(content)) {
      units = content;
    } else if (typeof content === 'string') {
      let s = (content as string).trim();
      if (s.startsWith('"')) s = JSON.parse(s) as string;
      if (!s.startsWith('[')) s = `[${s}]`;
      units = JSON.parse(s);
    } else if (typeof content === 'object') {
      // Single unit object
      units = [content];
    } else {
      return null;
    }
    return units.find((u: any) => u.unit_id === unitIndex) ?? units[unitIndex - 1] ?? units[0] ?? null;
  } catch { return null; }
}

// Parse final exam questions — handles array, object, string, or comma-separated objects
function parseFinalExamQuestions(raw: unknown): QuizQuestion[] {
  if (!raw) return [];
  try {
    let data: any;
    if (Array.isArray(raw)) {
      data = raw;
    } else if (typeof raw === 'object' && !Array.isArray(raw)) {
      // Could be {final_exam: [...]} or a single question object
      const obj = raw as any;
      data = obj.final_exam || [obj];
    } else if (typeof raw === 'string') {
      let s = (raw as string).trim();
      // Remove outer quotes if double-encoded
      if (s.startsWith('"')) s = JSON.parse(s) as string;
      // Wrap comma-separated objects in array if needed
      if (!s.startsWith('[') && !s.startsWith('{')) return [];
      if (!s.startsWith('[')) s = `[${s}]`;
      const parsed = JSON.parse(s);
      data = Array.isArray(parsed) ? parsed : parsed?.final_exam ? parsed.final_exam : [parsed];
    } else {
      return [];
    }
    if (!Array.isArray(data)) return [];
    return data.map((q: any, i: number) => ({
      question_id: q.question_id ?? i,
      question: q.question || '',
      options: typeof q.options === 'object' && !Array.isArray(q.options)
        ? q.options
        : { A: '', B: '', C: '', D: '' },
      correct_key: q.correct_key || 'A',
      rationale: q.rationale || q.explanation_if_wrong || '',
      clt_rating: q.clt_rating || '',
    }));
  } catch { return []; }
}

// Map Make quiz format to QuizQuestion format
function mapQuizQuestions(quiz: any[]): QuizQuestion[] {
  if (!Array.isArray(quiz)) return [];
  const KEYS = ['A', 'B', 'C', 'D'] as const;
  return quiz.map((q: any, i: number) => {
    const opts: string[] = Array.isArray(q.options) ? q.options.slice(0, 4) : [];
    const correctIdx = opts.indexOf(q.correct_answer);
    const optObj: Record<string, string> = {};
    opts.forEach((opt: string, idx: number) => { optObj[KEYS[idx]] = opt; });
    return {
      question_id: i,
      question: q.question || '',
      options: optObj as { A: string; B: string; C: string; D: string },
      correct_key: correctIdx >= 0 ? KEYS[correctIdx] : 'A',
      rationale: q.explanation_if_wrong || '',
    };
  });
}


// ── FinalExamWaiting — ARCS/DSR animated loading for final exam generation ────

const EXAM_STAGES = [
  { id: 'analyse', icon: '🎯', label: 'Lernziele analysieren', sub: 'IHK-Anforderungen werden geprüft', dur: 0.20 },
  { id: 'profile', icon: '🧠', label: 'Wissensprofil erstellen', sub: 'Deine Stärken werden bewertet', dur: 0.25 },
  { id: 'generate', icon: '📝', label: 'Fragen generieren', sub: '10 Prüfungsfragen werden erstellt', dur: 0.30 },
  { id: 'quality', icon: '✅', label: 'Qualitätsprüfung', sub: 'Prüfungsstandards werden geprüft', dur: 0.25 },
];

function FinalExamWaiting({ targetJob, skill }: { targetJob: string; skill: string }) {
  const [progress, setProgress] = useState(0);
  const [stageIdx, setStageIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(Date.now());
  const TOTAL_MS = 90_000; // 90s animation

  const QUOTES = [
    { text: 'Prüfungen sind keine Hindernisse — sie sind Meilensteine.', author: 'Decide your Dream' },
    { text: 'Das Zertifikat beweist nicht nur dein Wissen — es beweist deine Disziplin.', author: 'IHK-Philosophie' },
    { text: 'Vorbereitung ist der Schlüssel zum Erfolg.', author: 'Benjamin Franklin' },
    { text: 'Du hast die Module gemeistert. Der Rest ist Formsache.', author: 'Decide your Dream' },
  ];

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
    const qi = setInterval(() => setQuoteIdx(i => (i + 1) % QUOTES.length), 8000);
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
        @keyframes fex_spin { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
        @keyframes fex_glow { 0%,100%{opacity:0.4;} 50%{opacity:1;} }
        @keyframes fex_up { from{opacity:0;transform:translateY(10px);} to{opacity:1;transform:translateY(0);} }
      `}</style>

      {/* Hero card */}
      <div className="rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,rgba(245,158,11,0.08),rgba(6,7,15,0.99))', border: '1px solid rgba(245,158,11,0.25)' }}>
        <div className="h-[3px]" style={{ background: `linear-gradient(90deg,${color},${color}40,transparent)` }} />
        <div className="p-6 space-y-5">
          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ background: color, animation: 'fex_pulse 1.3s ease infinite' }} />
            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${color}80` }}>
              Abschlussprüfung wird generiert
            </span>
          </div>

          {/* Title */}
          <div>
            <h2 className="text-2xl font-black text-white leading-tight">
              Deine IHK-Prüfung für{' '}
              <span style={{ color }}>{skill || targetJob}</span>
            </h2>
            <p className="text-sm text-white/40 mt-1.5">
              10 Fragen basierend auf deinen 5 Lerneinheiten. Besteh die Prüfung und erhalte dein Zertifikat.
            </p>
          </div>

          {/* Progress */}
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

      {/* Stage checklist */}
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
                  background: isActive ? `rgba(245,158,11,0.07)` : 'transparent',
                  border: isActive ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
                  opacity: !isDone && !isActive ? 0.3 : 1,
                }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
                  style={{
                    background: isDone ? 'rgba(34,197,94,0.1)' : isActive ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.04)',
                    border: isDone ? '1px solid rgba(34,197,94,0.3)' : isActive ? `1px solid ${color}35` : '1px solid rgba(255,255,255,0.07)',
                  }}>
                  {isDone
                    ? <svg width="14" height="14" viewBox="0 0 14 14"><polyline points="2,7 5.5,10.5 12,4" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
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

      {/* Motivational quote */}
      <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Motivation</p>
        <p className="text-sm text-white/65 leading-relaxed italic">&ldquo;{QUOTES[quoteIdx].text}&rdquo;</p>
        <p className="text-[11px] text-white/30 mt-2 font-bold">— {QUOTES[quoteIdx].author}</p>
      </div>
    </div>
  );
}

// ── ARCS/DSR/CLT Learning Journey phases ──────────────────────────────────────
// Phase 1 (ARCS – Attention):    Intro card — hook, relevance, why this matters now
// Phase 2 (DSR – Discipline):    Pre-learning — understand competency list, learning goals
// Phase 3 (CLT – guided learn):  Guided practice — quiz questions one-by-one with instant
//                                 rationale; schema building, progressive complexity
// Phase 4 (DSR – Skill):         Consolidation — review what was learned, confidence check
// Phase 5 (ARCS – Satisfaction): Final exam — full timed quiz without hints
// Phase 6:                       Certificate — reward, achievement, next steps

type LearningPhase = 'intro' | 'goals' | 'practice' | 'consolidation' | 'exam';

interface PracticeState {
  currentIdx: number;
  selected: string | null;
  revealed: boolean;
  correct: number;
}

const MIN_PASS_SCORE = 80; // percent required to pass a unit

function LearningContent({
  learningPath,
  unitIndex,
  unitVariant,
  learningResultRow,
  userId,
  completedUnits,
  onUnitCompleted,
}: {
  learningPath: LearningPath;
  unitIndex: number;
  unitVariant: 'A' | 'B';
  learningResultRow: LearningResultRow;
  userId: string | null;
  completedUnits: Set<number>;
  onUnitCompleted: (unitIdx: number, score: number) => void;
}) {
  const TOTAL_UNITS = 5;
  const thisUnitComplete = completedUnits.has(unitIndex);

  const result: LearningResultRow = learningResultRow;
  const [learningPhase, setLearningPhase] = useState<LearningPhase>('intro');
  const [savingCompletion, setSavingCompletion] = useState(false);

  // Guided practice state
  const [practice, setPractice] = useState<PracticeState>({ currentIdx: 0, selected: null, revealed: false, correct: 0 });

  // Unit quiz state
  const [examAnswers, setExamAnswers] = useState<Record<number, string>>({});
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [examRevealed, setExamRevealed] = useState<Record<number, boolean>>({});

  // Save unit completion to DB — idempotent via unique index on (learning_path_id, unit_index)
  const saveUnitCompletion = async (score: number) => {
    if (!userId || thisUnitComplete) return;
    setSavingCompletion(true);
    try {
      await supabase.from('unit_completions').upsert({
        learning_path_id: learningPath.id,
        user_id: userId,
        learning_result_id: result.id,
        unit_index: unitIndex,
        variant: unitVariant,
        exam_score: score,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'learning_path_id,unit_index', ignoreDuplicates: true });
      onUnitCompleted(unitIndex, score);
    } catch { /* non-fatal */ } finally {
      setSavingCompletion(false);
    }
  };

  // Parse content field to get this unit's data
  const contentUnit = parseContentUnit(result?.content, unitIndex);
  const unitVariantText: string = unitVariant === 'A'
    ? (contentUnit?.variant_a || '')
    : (contentUnit?.variant_b || contentUnit?.variant_a || '');
  const competencies: string[] = contentUnit?.competencies || [];
  const officialTitle = contentUnit?.mobile_title || learningPath.target_job || '';
  const dqrRef = '';

  // Map quiz questions from content
  const questions: QuizQuestion[] = mapQuizQuestions(contentUnit?.quiz || []);

  // Parse certificate_metadata for final exam (kept for backwards compatibility)
  const certMeta = (() => {
    const raw = result?.certificate_metadata;
    if (!raw) return null;
    if (typeof raw === 'object' && !Array.isArray(raw)) return raw as LearningResultRow['certificate_metadata'];
    if (typeof raw === 'string') {
      try {
        let s = (raw as string).trim();
        if (s.startsWith('"')) s = JSON.parse(s) as string;
        return JSON.parse(s) as LearningResultRow['certificate_metadata'];
      } catch { /* */ }
    }
    return null;
  })();

  // Split: first half for guided practice, all for the unit test
  const practiceQuestions = questions.slice(0, Math.ceil(questions.length / 2));
  const examScoreRaw = examSubmitted
    ? questions.filter(q => examAnswers[q.question_id] === q.correct_key).length
    : 0;
  const examScorePct = questions.length > 0 ? Math.round((examScoreRaw / questions.length) * 100) : 0;
  // Unit must be passed at ≥ MIN_PASS_SCORE (80%)
  const examPassed = examSubmitted && examScorePct >= MIN_PASS_SCORE;
  const allExamAnswered = questions.length > 0 && questions.every(q => examAnswers[q.question_id]);

  // Phase steps — no certificate phase here; certificate is handled after final exam
  const PHASE_STEPS: { key: LearningPhase; label: string }[] = [
    { key: 'intro', label: 'Einstieg' },
    { key: 'goals', label: 'Lernziele' },
    { key: 'practice', label: 'Üben' },
    { key: 'consolidation', label: 'Festigung' },
    { key: 'exam', label: 'Einheitentest' },
  ];
  const phaseIdx = PHASE_STEPS.findIndex(s => s.key === learningPhase);

  // ── If no questions in this row, show a placeholder ──────────────────────────

  if (!result?.final_exam && false) {
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

      {/* Unit progress indicator: already done banner */}
      {thisUnitComplete && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
          <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="1.5"/><polyline points="3.5,7 6,9.5 10.5,4.5" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          <p className="text-xs font-black text-green-400/80">Einheit {unitIndex} abgeschlossen</p>
        </div>
      )}

      {/* Progress stepper */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {PHASE_STEPS.map((step, i) => {
          const isDone = i < phaseIdx;
          const isActive = i === phaseIdx;
          return (
            <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => { if (isDone) setLearningPhase(step.key); }}
                disabled={!isDone && !isActive}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all"
                style={{
                  background: isActive ? 'rgba(48,227,202,0.15)' : isDone ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isActive ? 'rgba(48,227,202,0.35)' : isDone ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.07)'}`,
                  color: isActive ? '#30E3CA' : isDone ? '#4ade80' : 'rgba(255,255,255,0.3)',
                  cursor: isDone ? 'pointer' : isActive ? 'default' : 'not-allowed',
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
              {unitVariantText ? (
                <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{unitVariantText}</p>
              ) : (
                <p className="text-sm text-white/60 leading-relaxed">
                  Diese Lerneinheit wurde speziell für dein Karriereziel <span className="text-white font-bold">{learningPath.target_job}</span> zusammengestellt.
                </p>
              )}
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
            <p className="text-xs font-black text-white/70 mb-1">Jetzt: Einheitentest</p>
            <p className="text-xs text-white/40 leading-relaxed">
              Der Einheitentest enthält {questions.length} Fragen zu allen Themen dieser Einheit. Diesmal ohne Feedback nach jeder Antwort — erst am Ende siehst du dein Ergebnis. Mindestens {MIN_PASS_SCORE}% zum Bestehen.
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
                  setExamSubmitted(true);
                  setExamRevealed(Object.fromEntries(questions.map(q => [q.question_id, true])));
                  if (pct >= MIN_PASS_SCORE) {
                    await saveUnitCompletion(pct);
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
                  {examScoreRaw}/{questions.length}
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
                  <div className="rounded-xl px-4 py-3.5 flex items-center gap-3"
                    style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <svg width="16" height="16" viewBox="0 0 16 16"><circle cx="8" cy="8" r="7" fill="rgba(34,197,94,0.15)" stroke="#22c55e" strokeWidth="1.5"/><polyline points="4,8 6.5,10.5 12,5" fill="none" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    <div>
                      <p className="text-xs font-black text-green-400/90">Einheit {unitIndex} bestanden!</p>
                      <p className="text-[10px] text-white/40 mt-0.5">Score: {examScorePct}% — weiter zur nächsten Einheit oder zurück zur Übersicht.</p>
                    </div>
                  </div>
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

    </div>
  );
}

// ── ARCS/DSR phase labels per unit ────────────────────────────────────────────

const ARCS_PHASES = [
  { label: 'Attention',     sub: 'Einstieg & Motivation',   icon: 'A' },
  { label: 'Relevance',     sub: 'Lernziele & Bedeutung',   icon: 'R' },
  { label: 'Confidence',    sub: 'Geführte Übung',          icon: 'C' },
  { label: 'Satisfaction',  sub: 'Festigung & Reflexion',   icon: 'S' },
  { label: 'Prüfung',       sub: 'Einheitentest',           icon: 'P' },
];

interface ModuleOverviewProps {
  learningPath: LearningPath;
  unitRows: LearningResultRow[];
  completedUnits: Set<number>;
  unitScores: Map<number, number>;
  allUnitsPassed: boolean;
  onOpenUnit: (idx: number) => void;
  onStartFinalExam: () => void;
}

function ModuleOverview({
  learningPath, unitRows, completedUnits, unitScores,
  allUnitsPassed, onOpenUnit, onStartFinalExam,
}: ModuleOverviewProps) {
  const TOTAL = 5;
  const doneCount = completedUnits.size;
  const isGenerating = unitRows.length === 0;
  const progressPct = Math.round((doneCount / TOTAL) * 100);

  const skillLabel = (() => {
    const sel = (learningPath as any).skill;
    if (sel && typeof sel === 'string') return sel;
    if (sel && typeof sel === 'object') return sel.skill_name || sel.name || null;
    const missing = (learningPath as any).missing_skills;
    if (Array.isArray(missing) && missing.length > 0) return missing[0]?.skill_name || missing[0]?.name || null;
    if (typeof missing === 'string') {
      try { const p = JSON.parse(missing); if (Array.isArray(p) && p.length > 0) return p[0]?.skill_name || p[0]?.name || null; } catch { /**/ }
    }
    return null;
  })();

  const UNIT_COLORS = ['#30E3CA', '#38bdf8', '#818cf8', '#a78bfa', '#f472b6'];
  const UNIT_ICONS = ['🎯', '🧩', '⚡', '🔬', '🏆'];

  return (
    <div className="max-w-2xl mx-auto space-y-4" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
      <style>{`
        @keyframes mo_shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes mo_pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes mo_glow { 0%,100%{box-shadow:0 0 0 0 rgba(48,227,202,0)} 50%{box-shadow:0 0 20px 4px rgba(48,227,202,0.15)} }
      `}</style>

      {/* ── Hero header: skill + progress ─────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#040c14 0%,#061018 50%,#030810 100%)', border: '1px solid rgba(48,227,202,0.18)' }}>
        {/* Ambient glow blobs */}
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(48,227,202,0.1) 0%,transparent 70%)', transform: 'translate(20%,-20%)' }} />
        <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle,rgba(56,189,248,0.07) 0%,transparent 70%)', transform: 'translate(-20%,20%)' }} />

        <div className="relative p-6 space-y-4">
          {/* Skill badge — ARCS: Attention, clear focus */}
          {skillLabel && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
              style={{ background: 'rgba(48,227,202,0.1)', border: '1px solid rgba(48,227,202,0.25)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#30E3CA]" style={{ animation: 'mo_pulse 2s ease infinite' }} />
              <span className="text-xs font-black text-[#30E3CA] tracking-wide">{skillLabel}</span>
            </div>
          )}

          {/* Job title */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Lernpfad</p>
            <h2 className="text-2xl font-black text-white leading-tight">{learningPath.target_job}</h2>
          </div>

          {/* Progress ring + stats row — CLT: reduce cognitive load with visual encoding */}
          <div className="flex items-center gap-4 pt-1">
            {/* Ring progress */}
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
              {/* Segment bar */}
              <div className="flex gap-1">
                {Array.from({ length: TOTAL }, (_, i) => (
                  <div key={i} className="flex-1 h-2 rounded-full transition-all duration-500"
                    style={{
                      background: completedUnits.has(i + 1)
                        ? `linear-gradient(90deg,${UNIT_COLORS[i]},${UNIT_COLORS[Math.min(i + 1, 4)]})`
                        : 'rgba(255,255,255,0.08)',
                    }} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-white/50">
                  {doneCount === 0 ? 'Noch nicht gestartet' : doneCount === TOTAL ? 'Alle Einheiten bestanden!' : `${doneCount} von ${TOTAL} Einheiten`}
                </span>
                {doneCount > 0 && doneCount < TOTAL && (
                  <span className="text-[10px] font-black text-[#30E3CA]/70">
                    Weiter mit Einheit {doneCount + 1}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Motivational ARCS:Relevance micro-copy */}
          {doneCount === 0 && (
            <p className="text-xs text-white/40 leading-relaxed">
              Dein strukturierter Weg zum Ziel — 5 Einheiten, aufeinander aufbauend. Starte mit Einheit 1.
            </p>
          )}
          {doneCount > 0 && doneCount < TOTAL && (
            <p className="text-xs text-white/40 leading-relaxed">
              Stark! Du bist bereits {progressPct}% durch. Jede abgeschlossene Einheit bringt dich messbar näher an dein Ziel.
            </p>
          )}
          {doneCount === TOTAL && (
            <p className="text-xs text-green-400/70 leading-relaxed font-semibold">
              Alle Einheiten bestanden — du bist bereit für die Abschlussprüfung und dein Zertifikat.
            </p>
          )}
        </div>
      </div>

      {/* ── Generating skeleton ───────────────────────────────────────────────── */}
      {isGenerating && (
        <div className="rounded-2xl p-5 flex items-center gap-4"
          style={{ background: 'rgba(48,227,202,0.04)', border: '1px solid rgba(48,227,202,0.15)' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 flex-none"
            style={{ background: 'rgba(48,227,202,0.08)', border: '1px solid rgba(48,227,202,0.2)' }}>
            <Loader2 size={18} className="animate-spin text-[#30E3CA]" />
          </div>
          <div>
            <p className="text-sm font-black text-white">Lernmodule werden generiert…</p>
            <p className="text-xs text-white/40 mt-0.5">Personalisierte Einheiten werden vorbereitet — dauert 1–2 Minuten.</p>
          </div>
        </div>
      )}

      {/* ── Unit cards ────────────────────────────────────────────────────────── */}
      {!isGenerating && (
        <div className="space-y-2.5">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/20 px-1">
            Deine 5 Lerneinheiten
          </p>
          {Array.from({ length: TOTAL }, (_, i) => {
            const idx = i + 1;
            const done = completedUnits.has(idx);
            const score = unitScores.get(idx);
            const phase = ARCS_PHASES[i];
            const color = UNIT_COLORS[i];
            const icon = UNIT_ICONS[i];
            const isNext = !done && (i === 0 || completedUnits.has(i));
            const locked = !done && !isNext;

            return (
              <button
                key={idx}
                onClick={() => !locked && onOpenUnit(idx)}
                disabled={locked}
                className="group w-full text-left rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.012] active:scale-[0.99] disabled:cursor-not-allowed"
                style={{
                  background: done
                    ? `linear-gradient(135deg,rgba(34,197,94,0.06) 0%,rgba(4,8,16,0.97) 55%)`
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
                  {/* Number / state icon */}
                  <div className="relative flex-shrink-0 w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{
                      background: done ? 'rgba(34,197,94,0.1)' : isNext ? `${color}12` : 'rgba(255,255,255,0.04)',
                      border: done ? '1px solid rgba(34,197,94,0.28)' : isNext ? `1px solid ${color}30` : '1px solid rgba(255,255,255,0.07)',
                    }}>
                    {done ? (
                      <svg width="16" height="16" viewBox="0 0 16 16">
                        <polyline points="3,8 6.5,11.5 13,5" fill="none" stroke="#4ade80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : locked ? (
                      <svg width="13" height="13" viewBox="0 0 13 13">
                        <rect x="2.5" y="5.5" width="8" height="5.5" rx="1.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/>
                        <path d="M4.5,5.5 V4.2 a2.2,2.2 0 0,1 4,0 V5.5" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1.2"/>
                      </svg>
                    ) : (
                      <span className="text-base leading-none">{icon}</span>
                    )}
                  </div>

                  {/* Content */}
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
                      {done ? 'Abgeschlossen' : isNext ? '→ Jetzt starten' : 'Vorherige Einheit zuerst abschließen'}
                    </p>
                  </div>

                  {/* CTA area */}
                  {isNext && !done && (
                    <div className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-black transition-all group-hover:scale-105"
                      style={{ background: `${color}15`, border: `1px solid ${color}30`, color }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                        <polygon points="1,1 9,5 1,9"/>
                      </svg>
                      Start
                    </div>
                  )}
                  {done && (
                    <ArrowRight size={14} style={{ color: '#4ade80', flexShrink: 0, opacity: 0.6 }} />
                  )}
                </div>

                {/* Active glow strip */}
                {isNext && !done && (
                  <div className="h-px w-full" style={{ background: `linear-gradient(90deg,transparent,${color}40,transparent)` }} />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ── Certificate exam card — DSR: culminating achievement ─────────────── */}
      <div
        className={`relative rounded-3xl overflow-hidden transition-all duration-500 ${allUnitsPassed ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
        onClick={allUnitsPassed ? onStartFinalExam : undefined}
        style={{ pointerEvents: allUnitsPassed ? 'auto' : 'none' }}
        style={{
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
            {/* Gold shimmer */}
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
                ? '100% erforderlich · personalisierbares PDF-Zertifikat'
                : `Noch ${TOTAL - doneCount} Einheit${TOTAL - doneCount !== 1 ? 'en' : ''} zum Freischalten`}
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

        {/* Locked: teaser progress */}
        {!allUnitsPassed && !isGenerating && (
          <div className="px-5 pb-4">
            <div className="flex gap-1">
              {Array.from({ length: TOTAL }, (_, i) => (
                <div key={i} className="flex-1 h-1 rounded-full"
                  style={{ background: completedUnits.has(i + 1) ? 'rgba(251,191,36,0.4)' : 'rgba(255,255,255,0.06)' }} />
              ))}
            </div>
            <p className="text-[9px] text-white/20 mt-1.5">{doneCount}/{TOTAL} Einheiten für Prüfungszugang</p>
          </div>
        )}
      </div>
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
  const [unitScores, setUnitScores] = useState<Map<number, number>>(new Map());
  const [activeUnitIndex, setActiveUnitIndex] = useState(0); // 0 = overview, 1–5 = unit
  const TOTAL_UNITS = 5;
  // Rows loaded from learning_results — 10 rows total (5 units × 2 variants)
  const [unitRows, setUnitRows] = useState<LearningResultRow[]>([]);
  // Final exam state
  type FinalExamPhase = 'idle' | 'triggering' | 'waiting' | 'ready' | 'taking' | 'done';
  const [finalExamPhase, setFinalExamPhase] = useState<FinalExamPhase>('idle');
  const [finalExamQuestions, setFinalExamQuestions] = useState<QuizQuestion[]>([]);
  const [finalExamAnswers, setFinalExamAnswers] = useState<Record<number, string>>({});
  const [finalExamSubmitted, setFinalExamSubmitted] = useState(false);
  const [finalExamScore, setFinalExamScore] = useState(0); // percent
  const [certificateUrl, setCertificateUrl] = useState<string | null>(null);
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  const finalExamChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const allUnitsPassed = completedUnits.size >= TOTAL_UNITS;

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
    loadUnitRows(normalized.id);
  }, [cleanupListeners, normalizePath]);

  // ── Polling for curriculum ────────────────────────────────────────────────────

  const startCurriculumPolling = useCallback((id: string) => {
    pollCountRef.current = 0;
    const tick = async () => {
      if (completedRef.current) return;
      if (pollCountRef.current >= POLL_MAX) return;
      pollCountRef.current += 1;
      try {
        // Ready as soon as first learning_results row exists
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
        { event: 'INSERT', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${path.id}` },
        async () => {
          const { data: lp } = await supabase.from('learning_paths').select('*').eq('id', path.id).maybeSingle();
          if (lp) handleCurriculumReady(lp as unknown as LearningPath);
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${path.id}` },
        async () => {
          const { data: lp } = await supabase.from('learning_paths').select('*').eq('id', path.id).maybeSingle();
          if (lp) handleCurriculumReady(lp as unknown as LearningPath);
        })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_paths', filter: `id=eq.${path.id}` },
        (payload) => {
          const row = payload.new as any;
          if (row?.status === 'completed') {
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
      const selectedSkill = (path as any).skill || null;
      console.log('[LearningPath] Triggering webhook:', LEARNINGPATH_WEBHOOK_URL);
      const res = await fetch(LEARNINGPATH_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learning_path_id: path.id,
          skill: selectedSkill,
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
      .select('unit_index, exam_score')
      .eq('learning_path_id', pathId);
    if (data) {
      setCompletedUnits(new Set(data.map((r: any) => r.unit_index as number)));
      setUnitScores(new Map(data.map((r: any) => [r.unit_index as number, r.exam_score as number])));
    }
  }, [pathId]);

  const loadUnitRows = useCallback(async (pathId_: string) => {
    if (!pathId_) return;
    const { data } = await supabase
      .from('learning_results')
      .select('id, content, status, final_exam, certificate_metadata')
      .eq('learning_path_id', pathId_)
      .not('content', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1);
    if (data && data.length > 0) {
      setUnitRows(data as LearningResultRow[]);
    }
  }, []);

  const loadLearningPath = useCallback(async (showLoader = false) => {
    if (!pathId) return;
    if (showLoader) setPhase('loading');
    setError(null);
    try {
      const raw = await careerService.getLearningPath(pathId);
      if (!raw) { setError('Lernpfad nicht gefunden'); setPhase('error'); return; }
      let path = normalizePath(raw);

      // Ready as soon as at least 1 learning_results row exists (remaining rows load in background)
      const { data: rowCheck } = await supabase
        .from('learning_results').select('id, content, status').eq('learning_path_id', pathId).limit(1);
      // Has results = row with content filled (same rule as WaitingPage polling)
      const hasResults = (rowCheck?.some((r: any) => r.content != null) ?? false);

      // If rows exist but is_paid is missing (Stripe webhook race), fix it in DB and treat as paid
      if (hasResults && !path.is_paid) {
        await supabase.from('learning_paths')
          .update({ is_paid: true, updated_at: new Date().toISOString() })
          .eq('id', pathId);
        path = { ...path, is_paid: true };
      }

      setLearningPath(path);
      setAnalysisResult(resultFromPath(path));

      // If rows exist, go straight to dashboard — presence of rows proves payment
      if (hasResults) {
        setShowDashboard(true);
        setPhase('done');
        loadCompletedUnits();
        loadUnitRows(path.id);
        // Restore final exam state if already started
        if ((path as any).final_exam_status === 'ready' || (path as any).final_exam_status === 'done') {
          setFinalExamPhase((path as any).final_exam_score === 100 ? 'done' : 'ready');
          if ((path as any).final_exam_questions) {
            const qs = parseFinalExamQuestions((path as any).final_exam_questions);
            if (qs.length > 0) setFinalExamQuestions(qs);
          }
          if ((path as any).certificate_url) setCertificateUrl((path as any).certificate_url);
        }
        return;
      }

      // No content yet — check if paid
      if (path.is_paid) {
        // Only redirect to waiting if no other path of this user is already in_progress
        const { data: inProgressPaths } = await supabase
          .from('learning_paths')
          .select('id')
          .eq('user_id', path.user_id)
          .eq('status', 'in_progress')
          .neq('id', pathId)
          .limit(1);

        if (inProgressPaths && inProgressPaths.length > 0) {
          // Another path is already being generated — don't trigger a second Make run
          console.log('[LPP] Another path already in_progress, skipping redirect');
          setPhase('result');
          return;
        }

        navigate(`/learning-path-waiting/${pathId}`, { replace: true });
        return;
      }

      // Not paid → show result/analysis with paywall CTA
      setPhase('result');
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden');
      setPhase('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId, normalizePath, navigate]);

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (pathId) { loadLearningPath(true); loadCompletedUnits(); }
  }, [pathId, loadLearningPath, loadCompletedUnits]);

  // Live-update unitRows as Make writes the remaining rows in the background
  useEffect(() => {
    if (!showDashboard || !learningPath) return;
    const id = learningPath.id;
    const ch = supabase
      .channel(`unit_rows_live_${id}_${Date.now()}`)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${id}` },
        () => { loadUnitRows(id); })
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${id}` },
        () => { loadUnitRows(id); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [showDashboard, learningPath?.id, loadUnitRows]);

  // When phase becomes 'generating' (resume after browser close or direct navigation)
  // start polling/realtime. Also check if we need to re-trigger Make.
  useEffect(() => {
    if (phase !== 'generating' || !learningPath) return;
    if (completedRef.current) return;
    completedRef.current = false;

    const id = learningPath.id;

    (async () => {
      // Check if already completed
      // Already has rows? → immediately show dashboard
      const { data: existingRows } = await supabase
        .from('learning_results').select('id').eq('learning_path_id', id).limit(1);
      if (existingRows && existingRows.length > 0) {
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
        .on('postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'learning_paths', filter: `id=eq.${id}` },
          (payload) => {
            const row = payload.new as any;
            if (row?.status === 'completed') {
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

  // ── Final exam ────────────────────────────────────────────────────────────────

  const triggerFinalExam = async () => {
    if (!learningPath) return;
    if (finalExamPhase !== 'idle') return; // Guard: prevent multiple triggers
    setFinalExamPhase('triggering');
    try {
      // Get skill from learning_path row, or fall back to learning_results content
      let selectedSkill = (learningPath as any).skill || null;
      if (!selectedSkill) {
        const { data: lr } = await supabase
          .from('learning_results')
          .select('content, selected_skill')
          .eq('learning_path_id', learningPath.id)
          .not('content', 'is', null)
          .limit(1)
          .maybeSingle();
        if (lr) {
          selectedSkill = (lr as any).selected_skill || null;
        }
      }
      await fetch(FINAL_EXAM_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learning_path_id: learningPath.id,
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
        .eq('id', learningPath.id);
    } catch { /* non-fatal, still start waiting */ }

    setFinalExamPhase('waiting');

    // Subscribe to Realtime — listen for final_exam on learning_results row
    const channel = supabase
      .channel(`final_exam_${learningPath.id}_${Date.now()}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${learningPath.id}` },
        (payload) => {
          const row = payload.new as any;
          if (row?.final_exam != null) {
            const qs = parseFinalExamQuestions(row.final_exam);
            if (qs.length > 0) {
              setFinalExamQuestions(qs);
              setFinalExamPhase('ready');
              supabase.removeChannel(channel);
            }
          }
        })
      .subscribe();
    finalExamChannelRef.current = channel;

    // Polling — check every 4s for final_exam data
    let polls = 0;
    const lpId = learningPath.id;
    const userId = learningPath.user_id;
    const selectedSkill = (learningPath as any).skill || null;
    const startedAt = Date.now();

    const poll = async () => {
      polls++;
      if (polls > 75) return; // max 5 minutes

      // Check 1: by learning_path_id (correct Make config)
      const { data: byPath } = await supabase
        .from('learning_results')
        .select('id, final_exam')
        .eq('learning_path_id', lpId)
        .not('final_exam', 'is', null)
        .limit(1)
        .maybeSingle();

      if (byPath?.final_exam) {
        const qs = parseFinalExamQuestions(byPath.final_exam);
        if (qs.length > 0) {
          setFinalExamQuestions(qs);
          setFinalExamPhase('ready');
          if (finalExamChannelRef.current) supabase.removeChannel(finalExamChannelRef.current);
          return;
        }
      }

      // Check 2: fallback — row written by Make without learning_path_id
      // Find most recent row with final_exam data for this skill (created after trigger)
      const sinceIso = new Date(startedAt - 10000).toISOString(); // 10s before trigger
      const { data: rows } = await supabase
        .from('learning_results')
        .select('id, final_exam, learning_path_id')
        .not('final_exam', 'is', null)
        .gte('created_at', sinceIso)
        .order('created_at', { ascending: false })
        .limit(5);

      if (rows && rows.length > 0) {
        const row = rows.find((r: any) =>
          r.learning_path_id === lpId ||
          r.learning_path_id === null ||
          r.learning_path_id === undefined
        ) as any;

        if (row?.final_exam) {
          // Fix the row if learning_path_id is wrong
          if (!row.learning_path_id) {
            await supabase.from('learning_results')
              .update({ learning_path_id: lpId, user_id: userId })
              .eq('id', row.id);
          }
          const qs = parseFinalExamQuestions(row.final_exam);
          if (qs.length > 0) {
            setFinalExamQuestions(qs);
            setFinalExamPhase('ready');
            if (finalExamChannelRef.current) supabase.removeChannel(finalExamChannelRef.current);
            return;
          }
        }
      }

      setTimeout(poll, 4000);
    };
    setTimeout(poll, 3000);
  };

  const handleFinalExamSubmit = async () => {
    if (!learningPath) return;
    const correct = finalExamQuestions.filter(q => finalExamAnswers[q.question_id] === q.correct_key).length;
    const pct = finalExamQuestions.length > 0 ? Math.round((correct / finalExamQuestions.length) * 100) : 0;
    setFinalExamScore(pct);
    setFinalExamSubmitted(true);
    // Save score to DB
    await supabase.from('learning_paths')
      .update({ final_exam_score: pct, final_exam_status: 'done', updated_at: new Date().toISOString() })
      .eq('id', learningPath.id);
    if (pct >= 80) {
      setFinalExamPhase('done');
      // Issue certificate
      setIssuingCertificate(true);
      try {
        const recipientName = user?.email?.split('@')[0] || learningPath.user_id?.substring(0, 8) || 'Teilnehmer';
        const url = await certificateService.issueCertificate(learningPath, recipientName);
        setCertificateUrl(url);
      } catch (err: any) {
        alert('Zertifikat-Fehler: ' + err.message);
      } finally {
        setIssuingCertificate(false);
      }
    } else {
      setFinalExamPhase('taking'); // stay on exam (show results), allow retry
    }
  };

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
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
            <ArrowLeft size={20} />
            <span>Dashboard</span>
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
            {/* Module overview — only shown when no unit is open and exam is idle */}
            {finalExamPhase === 'idle' && activeUnitIndex === 0 && (
              <ModuleOverview
                learningPath={learningPath}
                unitRows={unitRows}
                completedUnits={completedUnits}
                unitScores={unitScores}
                allUnitsPassed={allUnitsPassed}
                onOpenUnit={(idx) => setActiveUnitIndex(idx)}
                onStartFinalExam={triggerFinalExam}
              />
            )}

            {/* Active unit learning content */}
            {finalExamPhase === 'idle' && activeUnitIndex > 0 && (
              <>
                {/* Back to overview */}
                <div className="max-w-2xl mx-auto">
                  <button
                    onClick={() => setActiveUnitIndex(0)}
                    className="flex items-center gap-2 text-xs font-bold text-white/45 hover:text-white/70 transition-colors mb-1"
                  >
                    <ArrowLeft size={13} />
                    Zurück zur Übersicht
                  </button>
                </div>

                {unitRows.length > 0 ? (
                  <LearningContent
                    key={activeUnitIndex}
                    learningPath={learningPath}
                    unitIndex={activeUnitIndex}
                    unitVariant={activeUnitIndex % 2 === 0 ? 'B' : 'A'}
                    learningResultRow={unitRows[activeUnitIndex - 1] ?? unitRows[0]}
                    userId={user?.id ?? null}
                    completedUnits={completedUnits}
                    onUnitCompleted={(idx, score) => {
                      setCompletedUnits(prev => new Set([...prev, idx]));
                      setUnitScores(prev => new Map([...prev, [idx, score]]));
                      setActiveUnitIndex(0); // return to overview after completing
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

            {/* Final exam: triggering / waiting */}
            {(finalExamPhase === 'triggering' || finalExamPhase === 'waiting') && (
              <FinalExamWaiting targetJob={learningPath?.target_job || ''} skill={(learningPath as any)?.skill || ''} />
            )}

            {/* Final exam: ready to take */}
            {finalExamPhase === 'ready' && !finalExamSubmitted && (
              <div className="max-w-2xl mx-auto space-y-4" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
                <div className="rounded-2xl overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,rgba(48,227,202,0.08) 0%,rgba(6,7,15,0.98) 60%)', border: '1px solid rgba(48,227,202,0.25)' }}>
                  <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(48,227,202,0.5),transparent)' }} />
                  <div className="px-6 py-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/60 mb-1">Abschlussprüfung</p>
                    <p className="text-lg font-black text-white">{learningPath.target_job}</p>
                    <p className="text-xs text-white/40 mt-1">{finalExamQuestions.length} Fragen · mindestens 80% erforderlich für Zertifikat</p>
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
                  style={{ background: 'linear-gradient(135deg,#22c55e,#4ade80)', boxShadow: Object.keys(finalExamAnswers).length >= finalExamQuestions.length ? '0 4px 20px rgba(34,197,94,0.25)' : 'none' }}>
                  Prüfung abgeben
                  <Check size={18} />
                </button>
              </div>
            )}

            {/* Final exam: submitted — show results */}
            {finalExamSubmitted && (finalExamPhase === 'taking' || finalExamPhase === 'done') && (
              <div className="max-w-2xl mx-auto space-y-4" style={{ animation: 'lp_fadeUp 0.4s ease' }}>
                <div className="rounded-2xl p-6 text-center space-y-3"
                  style={{
                    background: finalExamScore >= 80 ? 'rgba(34,197,94,0.07)' : 'rgba(248,113,113,0.06)',
                    border: `1px solid ${finalExamScore >= 80 ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.25)'}`,
                  }}>
                  <div className="text-5xl font-black" style={{ color: finalExamScore >= 80 ? '#4ade80' : '#f87171' }}>
                    {finalExamScore}%
                  </div>
                  <p className="text-lg font-bold text-white">
                    {finalExamScore >= 80 ? 'Bestanden! Zertifikat erworben!' : 'Nicht bestanden'}
                  </p>
                  <p className="text-sm text-white/55">
                    {finalExamScore >= 80
                      ? 'Du hast die Prüfung bestanden. Dein Zertifikat wird jetzt erstellt.'
                      : `${Math.round((finalExamScore / 100) * finalExamQuestions.length)} von ${finalExamQuestions.length} richtig — für das Zertifikat sind mindestens 80% erforderlich.`}
                  </p>
                </div>

                {finalExamScore >= 80 && (
                  <div className="space-y-3">
                    {issuingCertificate && (
                      <div className="flex items-center justify-center gap-2 text-[#30E3CA]/70 text-xs">
                        <Loader2 size={13} className="animate-spin" />
                        <span>Zertifikat wird erstellt…</span>
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
                  </div>
                )}

                {finalExamScore < 80 && (
                  <button
                    onClick={() => {
                      setFinalExamAnswers({});
                      setFinalExamSubmitted(false);
                      setFinalExamPhase('ready');
                    }}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white/70 transition-all hover:bg-white/5"
                    style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                    Prüfung wiederholen
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Certificate overlay */}
        {issuingCertificate && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-[#020617] border border-white/10 rounded-2xl p-8 max-w-md text-center space-y-4">
              <Loader2 className="w-16 h-16 text-[#66c0b6] animate-spin mx-auto" />
              <h3 className="text-xl font-bold text-white">Zertifikat wird erstellt…</h3>
              <p className="text-white/70">Dein Zertifikat wird generiert und automatisch heruntergeladen.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}