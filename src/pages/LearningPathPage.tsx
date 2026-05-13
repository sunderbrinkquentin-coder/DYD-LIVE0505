import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, Sparkles, Brain, Building2,
  ArrowRight, Check, Award,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { LearningPathDashboard } from '../components/career/LearningPathDashboard';
import { LearningPathPaywall } from '../components/career/LearningPathPaywall';
import { careerService } from '../services/careerService';
import { certificateService } from '../services/certificateService';
import { LearningPath } from '../types/learningPath';
import { supabase } from '../lib/supabase';

// ── Constants ──────────────────────────────────────────────────────────────────

const CURRICULUM_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_CURRICULUM
  || import.meta.env.VITE_MAKE_WEBHOOK_LEARNINGPATH
  || '';
const COMPLETE_STATUSES = new Set(['curriculum_ready', 'completed']);
const POLL_INTERVAL_MS = 3_000;
const POLL_MAX = 60;

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
  result, learningPath, onPaywallClose,
}: { result: AnalysisResult; learningPath: LearningPath; onPaywallClose: () => void }) {
  const [showPaywall, setShowPaywall] = useState(false);
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

// ── Main page ──────────────────────────────────────────────────────────────────

type PagePhase = 'loading' | 'result' | 'generating' | 'revealing' | 'done' | 'error';

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

  const resolvePhase = useCallback((path: LearningPath) => {
    // Has curriculum with modules → done
    if (path.curriculum && (path.curriculum as any).modules?.length > 0) {
      return 'done' as PagePhase;
    }
    // Curriculum ready status without modules (shouldn't happen, but safe fallback)
    if (path.status === 'curriculum_ready' || path.status === 'completed') {
      return 'done' as PagePhase;
    }
    // Paid + curriculum being generated (in_progress) → show generating loader so user can wait
    if (path.is_paid && path.status === 'in_progress') {
      return 'generating' as PagePhase;
    }
    // Analysis done, paid but curriculum not yet started → show generating (resume waiting)
    if (path.is_paid && path.status === 'gap_analysis_complete') {
      return 'generating' as PagePhase;
    }
    // Not paid or still analyzing → show result view
    return 'result' as PagePhase;
  }, []);

  // ── Curriculum ready handler (after generation) ───────────────────────────────

  const handleCurriculumReady = useCallback(async (path: LearningPath) => {
    if (completedRef.current) return;
    completedRef.current = true;
    cleanupListeners();
    setGeneratorSuccess(true);
    await new Promise((r) => setTimeout(r, 1_800));
    setLearningPath(path);
    setPhase('done');
  }, [cleanupListeners]);

  // ── Polling for curriculum ────────────────────────────────────────────────────

  const startCurriculumPolling = useCallback((id: string) => {
    pollCountRef.current = 0;
    const tick = async () => {
      if (completedRef.current) return;
      if (pollCountRef.current >= POLL_MAX) return;
      pollCountRef.current += 1;
      try {
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

    // Start realtime + polling immediately
    const channel = supabase
      .channel(`lp_curriculum_${path.id}_${Date.now()}`)
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

    // Fire curriculum webhook
    try {
      const allMissingSkills = parseSkills(path.missing_skills);
      const currentSkills = parseSkills(path.current_skills);
      const selectedSkill = (path as any).selected_skill || null;
      await fetch(CURRICULUM_WEBHOOK_URL, {
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
    } catch (e: any) {
      console.warn('[LearningPath] Curriculum webhook error (non-fatal):', e.message);
    }
  }, [handleCurriculumReady, startCurriculumPolling]);

  // ── Load learning path ────────────────────────────────────────────────────────

  const loadLearningPath = useCallback(async (showLoader = false) => {
    if (!pathId) return;
    if (showLoader) setPhase('loading');
    setError(null);
    try {
      const path = await careerService.getLearningPath(pathId);
      if (!path) { setError('Lernpfad nicht gefunden'); setPhase('error'); return; }
      setLearningPath(path);
      setAnalysisResult(resultFromPath(path));
      setPhase(resolvePhase(path));
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden');
      setPhase('error');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId, resolvePhase]);

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (pathId) loadLearningPath(true);
  }, [pathId, loadLearningPath]);

  // When phase becomes 'generating' from loadLearningPath (resume after browser close),
  // start polling/realtime WITHOUT re-triggering the webhook
  useEffect(() => {
    if (phase !== 'generating' || !learningPath) return;
    if (completedRef.current) return;
    completedRef.current = false;
    const channel = supabase
      .channel(`lp_resume_${learningPath.id}_${Date.now()}`)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'learning_paths', filter: `id=eq.${learningPath.id}` },
        (payload) => {
          const row = payload.new as any;
          if (COMPLETE_STATUSES.has(row?.status) || (row?.curriculum as any)?.modules?.length > 0) {
            handleCurriculumReady(row as unknown as LearningPath);
          }
        })
      .subscribe();
    realtimeChannelRef.current = channel;
    startCurriculumPolling(learningPath.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, learningPath?.id]);

  // Handle Stripe payment return
  useEffect(() => {
    const payment = searchParams.get('payment');
    if (payment === 'success' && pathId) {
      setSearchParams({}, { replace: true });
      (async () => {
        try {
          await careerService.unlockLearningPath(pathId);
          // Reload path then decide: if curriculum already exists, go done; else generate
          const path = await careerService.getLearningPath(pathId);
          if (!path) return;
          setLearningPath(path);
          setAnalysisResult(resultFromPath(path));
          if (path.curriculum && (path.curriculum as any).modules?.length > 0) {
            setPhase('done');
          } else {
            triggerCurriculumGeneration(path);
          }
        } catch (e: any) {
          console.error('[LearningPath] Post-payment error:', e.message);
        }
      })();
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
          <button onClick={() => navigate('/career-vision')}
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

        {/* Phase: result — analysis done, not yet paid */}
        {phase === 'result' && analysisResult && (
          <ResultView
            result={analysisResult}
            learningPath={learningPath}
            onPaywallClose={() => loadLearningPath(false)}
          />
        )}

        {/* Phase: generating — curriculum being built */}
        {(phase === 'generating' || phase === 'revealing') && (
          <div className="max-w-2xl mx-auto">
            <CurriculumLoader success={generatorSuccess} targetJob={learningPath.target_job ?? ''} />
          </div>
        )}

        {/* Phase: done — show full dashboard */}
        {phase === 'done' && (
          <div style={{ animation: 'lp_fadeUp 0.6s ease' }}>
            <style>{GLOBAL_STYLES}</style>
            <LearningPathDashboard
              learningPath={learningPath}
              onCertificateRequest={handleCertificateRequest}
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
