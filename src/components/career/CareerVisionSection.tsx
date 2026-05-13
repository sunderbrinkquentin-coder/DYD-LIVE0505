import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, X, RefreshCw, Upload,
  FileText, ChevronDown, AlertCircle, Eye,
  ArrowRight, Brain, Building2, Check, Zap,
  BarChart3, ChevronRight, CheckCircle2, Star,
  TrendingUp, ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { uploadCvAndCreateRecord } from '../../services/cvUploadService';
import { LearningPathPaywall } from './LearningPathPaywall';

// ── Constants ──────────────────────────────────────────────────────────────────

const VISION_WEBHOOK_URL = 'https://hook.eu2.make.com/2gw464yqj339tqv3eh6yiv6qnw2q76q1';
const POLL_INTERVAL_MS = 3_000;
const POLL_MAX = 40;
const FALLBACK_TIMEOUT_MS = 60_000;
// Max wait for cv_data to appear after CV upload (30 × 3s = 90s)
const CV_DATA_POLL_MAX = 30;

const COMPLETE_STATUSES = new Set(['gap_analysis_complete', 'curriculum_ready', 'completed']);

const INDUSTRIES = [
  'Technologie & Software',
  'Finanzen & Banking',
  'Gesundheit & Medizin',
  'Marketing & Medien',
  'Industrie & Fertigung',
  'Handel & E-Commerce',
  'Beratung & Dienstleistungen',
  'Bildung & Forschung',
  'Energie & Nachhaltigkeit',
  'Öffentlicher Sektor',
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface RawSkill {
  skill_name?: string;
  name?: string;
  pitch?: string;
  gap_severity?: number;
  market_value_bonus?: string;
  category?: string;
  esco_code?: string;
  priority?: string;
  estimatedTime?: string;
}

interface AnalysisResult {
  pathId: string;
  missingSkills: RawSkill[];
  currentSkills: RawSkill[];
  strategicOutlook: string;
  matchScore: number;
  industry: string;
  targetJob: string;
  targetCompany: string;
}

type Phase =
  | 'idle'
  | 'cv_uploading'   // CV being uploaded + cv_data waiting
  | 'waiting'        // vision webhook sent, listening for DB update
  | 'revealing'      // completed received, brief success state
  | 'done'           // results fully visible
  | 'error'
  | 'fallback';

// ── Skill parser ───────────────────────────────────────────────────────────────

function parseSkills(raw: unknown): RawSkill[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as RawSkill[];
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return [];
    try {
      const p = JSON.parse(s);
      if (Array.isArray(p)) return p;
      if (typeof p === 'object' && p !== null) return [p as RawSkill];
    } catch { /* continue */ }
    try {
      const p = JSON.parse(`[${s}]`);
      if (Array.isArray(p)) return p;
    } catch { /* continue */ }
  }
  return [];
}

function skillDisplayName(s: RawSkill) {
  return s.skill_name || s.name || '(unbenannt)';
}

function normalizeCurrentSkills(raw: unknown): RawSkill[] {
  return parseSkills(raw).map((s) => ({
    ...s,
    skill_name: s.skill_name || (s as any).skill || s.name || '',
  }));
}

// ── Keyframes ─────────────────────────────────────────────────────────────────

const GLOBAL_STYLES = `
  @keyframes fadeUp    { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes fadeIn    { from { opacity:0; } to { opacity:1; } }
  @keyframes radarSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes blipPop   { 0%,100% { opacity:0; r:2; } 50% { opacity:1; r:3.5; } }
  @keyframes gradShift { 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
  @keyframes ctaPulse  { 0%,100% { box-shadow:0 0 0 0 rgba(48,227,202,0.4); } 60% { box-shadow:0 0 0 14px rgba(48,227,202,0); } }
  @keyframes ticker    { 0% { opacity:0; transform:translateY(6px); } 15%,85% { opacity:1; transform:translateY(0); } 100% { opacity:0; transform:translateY(-6px); } }
  @keyframes shimmer   { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes orb1      { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(20px,-15px) scale(1.1); } 66% { transform:translate(-10px,20px) scale(0.95); } }
  @keyframes orb2      { 0%,100% { transform:translate(0,0) scale(1); } 33% { transform:translate(-25px,10px) scale(0.9); } 66% { transform:translate(15px,-20px) scale(1.05); } }
`;

// ── Smart progress bar ─────────────────────────────────────────────────────────

function SmartProgressBar({ done, paused }: { done: boolean; paused: boolean }) {
  const [pct, setPct] = useState(0);
  const pctRef   = useRef(0);
  const rafRef   = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (done) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      pctRef.current = 100;
      setPct(100);
      return;
    }
    if (paused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const e = now - startRef.current;
      const target = e < 10_000
        ? (e / 10_000) * 60
        : e < 60_000
          ? 60 + ((e - 10_000) / 50_000) * 25
          : 85;
      pctRef.current += (target - pctRef.current) * 0.04;
      setPct(Math.min(pctRef.current, 85));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [done, paused]);

  const display = done ? 100 : Math.round(Math.min(pct, 85));

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="text-white/45 font-medium">{done ? 'Analyse abgeschlossen' : 'Tiefenanalyse läuft…'}</span>
        <span className="font-bold tabular-nums" style={{ color: done ? '#22c55e' : '#30E3CA' }}>{display}%</span>
      </div>
      <div className="h-2 rounded-full bg-white/8 overflow-hidden relative">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out relative overflow-hidden"
          style={{
            width: `${display}%`,
            background: done
              ? 'linear-gradient(90deg,#22c55e,#4ade80)'
              : 'linear-gradient(90deg,#66c0b6,#30E3CA,#7dd3fc)',
            backgroundSize: '200% 100%',
            animation: done ? 'none' : 'gradShift 2s ease infinite',
          }}
        >
          {!done && (
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.35) 50%,transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.4s ease-in-out infinite',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ── CV Upload loader ───────────────────────────────────────────────────────────

function CvUploadLoader({ fileName }: { fileName: string }) {
  const STEPS = [
    { label: 'Lebenslauf wird hochgeladen',   detail: 'Datei wird sicher übertragen…' },
    { label: 'KI liest deinen Lebenslauf',    detail: 'Skills, Erfahrungen & Ausbildung werden erkannt…' },
    { label: 'Skills werden strukturiert',    detail: 'Deine Stärken werden für die Analyse aufbereitet…' },
    { label: 'Skill-Gap Analyse startet',     detail: 'Gleich geht es los…' },
  ];
  const [stepIdx, setStepIdx] = useState(0);
  const [uploadPct, setUploadPct] = useState(0);
  const pctRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setStepIdx((i) => Math.min(i + 1, STEPS.length - 1));
    }, 6_000);
    return () => clearInterval(id);
  }, []);

  // Animate upload progress bar — fills to ~80% quickly, then slows
  useEffect(() => {
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const e = now - startRef.current;
      const target = e < 8_000 ? (e / 8_000) * 70 : e < 60_000 ? 70 + ((e - 8_000) / 52_000) * 15 : 85;
      pctRef.current += (target - pctRef.current) * 0.05;
      setUploadPct(Math.min(pctRef.current, 85));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, []);

  const display = Math.round(uploadPct);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#050d14]"
      style={{ border: '1px solid rgba(48,227,202,0.2)' }}>
      <style>{GLOBAL_STYLES}</style>
      {/* Phase label bar */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-white/[0.07]"
        style={{ background: 'rgba(48,227,202,0.06)' }}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#30E3CA] animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[#30E3CA]/70">
          Schritt 1 von 2 · Lebenslauf wird gelesen
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* File info row */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(48,227,202,0.1)', border: '1px solid rgba(48,227,202,0.25)' }}>
            <FileText size={16} className="text-[#30E3CA]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-white truncate">{fileName || 'Lebenslauf'}</p>
            <p className="text-[11px] text-white/40 mt-0.5">KI extrahiert deine Skills & Erfahrungen…</p>
          </div>
          <div className="w-4 h-4 rounded-full border-2 border-[#30E3CA] border-t-transparent animate-spin flex-shrink-0" />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {STEPS.map((step, i) => {
            const done2 = i < stepIdx;
            const active = i === stepIdx;
            return (
              <div key={step.label} className="flex items-center gap-2.5"
                style={{ opacity: done2 || active ? 1 : 0.28, transition: 'opacity 0.4s' }}>
                <div className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                  style={{
                    background: done2 ? '#22c55e22' : active ? 'rgba(48,227,202,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${done2 ? '#22c55e' : active ? '#30E3CA' : 'rgba(255,255,255,0.09)'}`,
                  }}>
                  {done2
                    ? <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    : active
                      ? <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#30E3CA]" />
                      : <div className="w-1 h-1 rounded-full bg-white/18" />
                  }
                </div>
                <span className={`text-xs ${done2 ? 'text-white/35 line-through' : active ? 'text-white/90 font-semibold' : 'text-white/22'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Upload progress bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[11px]">
            <span className="text-white/40">Lebenslauf wird verarbeitet</span>
            <span className="font-black text-[#30E3CA] tabular-nums">{display}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full relative overflow-hidden"
              style={{
                width: `${display}%`,
                background: 'linear-gradient(90deg,#66c0b6,#30E3CA)',
                backgroundSize: '200% 100%',
                animation: 'gradShift 2s ease infinite',
                transition: 'width 0.4s ease',
              }}
            >
              <div className="absolute inset-0 rounded-full"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s ease-in-out infinite' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Analysis loader ────────────────────────────────────────────────────────────

const LOADER_STEPS = [
  { id: 'cv',      label: 'Lebenslauf wird analysiert',         detail: 'Extrahiere Erfahrungen & Skills…'          },
  { id: 'market',  label: 'Branchendaten werden abgerufen',     detail: 'Vergleiche mit 2026-Marktstandards…'       },
  { id: 'company', label: 'Unternehmensanforderungen scannen',  detail: 'Lese Stellenprofile & Kulturfit…'          },
  { id: 'gaps',    label: 'Skill-Gaps werden berechnet',        detail: 'Priorisiere kritische Lücken…'             },
  { id: 'esco',    label: 'ESCO-Datenbank wird abgeglichen',    detail: 'Validiere Skills nach EU-Standard…'        },
  { id: 'path',    label: 'Lernpfad wird modelliert',           detail: 'Erstelle deine persönliche Roadmap…'      },
  { id: 'outlook', label: 'Strategischer Ausblick 2026',        detail: 'Analysiere KI-Trends & Gehaltspotenziale…' },
  { id: 'done',    label: 'Ergebnisse werden aufbereitet',      detail: 'Fast fertig…'                             },
];

function AnalysisLoader({ messages, success }: { messages: string[]; success: boolean }) {
  const [stepIdx, setStepIdx] = useState(0);
  const [tickVisible, setTickVisible] = useState(true);
  const accent = success ? '#22c55e' : '#30E3CA';

  useEffect(() => {
    if (success) return;
    const id = setInterval(() => {
      setTickVisible(false);
      setTimeout(() => {
        setStepIdx((i) => (i + 1) % LOADER_STEPS.length);
        setTickVisible(true);
      }, 350);
    }, 4_000);
    return () => clearInterval(id);
  }, [success]);

  const currentStep = LOADER_STEPS[stepIdx];
  const displayMsg = messages[stepIdx % messages.length] || currentStep.label;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-[#050d14]"
      style={{ border: `1px solid ${success ? 'rgba(34,197,94,0.25)' : 'rgba(102,192,182,0.22)'}` }}>
      <style>{GLOBAL_STYLES}</style>
      {/* Phase label bar */}
      <div className="flex items-center gap-2.5 px-5 py-3 border-b border-white/[0.07]"
        style={{ background: success ? 'rgba(34,197,94,0.06)' : 'rgba(102,192,182,0.05)' }}>
        {success ? (
          <svg width="12" height="12" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5" fill="#22c55e22" stroke="#22c55e" strokeWidth="1.2"/><polyline points="3.5,6 5,7.5 8.5,4.5" fill="none" stroke="#22c55e" strokeWidth="1.2" strokeLinecap="round"/></svg>
        ) : (
          <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
        )}
        <span className="text-[10px] font-black uppercase tracking-[0.18em]"
          style={{ color: success ? 'rgba(34,197,94,0.7)' : 'rgba(102,192,182,0.65)' }}>
          {success ? 'Analyse abgeschlossen' : 'Schritt 2 von 2 · KI-Tiefenanalyse läuft'}
        </span>
      </div>
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-64 h-64 rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', top: '-60px', right: '-60px', animation: 'orb1 8s ease-in-out infinite' }} />
        <div className="absolute w-48 h-48 rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle,#66c0b6,transparent)', bottom: '-40px', left: '-40px', animation: 'orb2 11s ease-in-out infinite' }} />
      </div>
      <div className="relative z-10 p-6 space-y-6">
        <div className="flex gap-6 items-start">
          <div className="flex-shrink-0 relative w-[110px] h-[110px] select-none">
            <svg viewBox="0 0 110 110" className="w-full h-full">
              <defs>
                <radialGradient id="rg2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={accent} stopOpacity={success ? '0.25' : '0.12'} />
                  <stop offset="100%" stopColor={accent} stopOpacity="0" />
                </radialGradient>
                <linearGradient id="sw2" x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor={accent} stopOpacity="0" />
                  <stop offset="100%" stopColor={accent} stopOpacity="0.9" />
                </linearGradient>
              </defs>
              <circle cx="55" cy="55" r="50" fill="url(#rg2)" />
              {[44, 32, 20, 9].map((r) => (
                <circle key={r} cx="55" cy="55" r={r} fill="none" stroke={accent} strokeOpacity="0.2" strokeWidth="0.8" />
              ))}
              <line x1="55" y1="5" x2="55" y2="105" stroke={accent} strokeOpacity="0.12" strokeWidth="0.8" />
              <line x1="5" y1="55" x2="105" y2="55" stroke={accent} strokeOpacity="0.12" strokeWidth="0.8" />
              {!success ? (
                <g style={{ transformOrigin: '55px 55px', animation: 'radarSpin 2s linear infinite' }}>
                  <path d="M55,55 L55,11" stroke="url(#sw2)" strokeWidth="2" strokeLinecap="round" />
                  <path d="M55,55 L55,11 A44,44 0 0,1 95,77 Z" fill={accent} fillOpacity="0.07" />
                </g>
              ) : (
                <g>
                  <circle cx="55" cy="55" r="16" fill="#22c55e" fillOpacity="0.15" stroke="#22c55e" strokeWidth="1.5" />
                  <polyline points="47,55 53,61 65,48" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </g>
              )}
              {[{cx:36,cy:35,d:0},{cx:76,cy:42,d:0.5},{cx:48,cy:76,d:1},{cx:80,cy:68,d:1.5}].map(({cx,cy,d},i) => (
                <circle key={i} cx={cx} cy={cy} r="2" fill={accent}
                  style={{ animation: `blipPop 2.2s ease-in-out infinite`, animationDelay: `${d}s` }} />
              ))}
            </svg>
          </div>
          <div className="flex-1 space-y-1.5 min-w-0">
            {LOADER_STEPS.slice(0, 5).map((step, i) => {
              const done2 = i < stepIdx;
              const active = i === stepIdx && !success;
              return (
                <div key={step.id} className="flex items-center gap-2.5 min-w-0"
                  style={{ opacity: done2 || active ? 1 : 0.3, transition: 'opacity 0.4s' }}>
                  <div className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      background: done2 ? '#22c55e22' : active ? `${accent}22` : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${done2 ? '#22c55e' : active ? accent : 'rgba(255,255,255,0.1)'}`,
                    }}>
                    {done2
                      ? <svg width="8" height="8" viewBox="0 0 8 8"><polyline points="1,4 3,6 7,2" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      : active
                        ? <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
                        : <div className="w-1 h-1 rounded-full bg-white/20" />
                    }
                  </div>
                  <span className={`text-xs truncate ${done2 ? 'text-white/40 line-through' : active ? 'text-white/90 font-semibold' : 'text-white/25'}`}>
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
            <p
              className="text-sm font-semibold text-white leading-snug"
              style={{ animation: tickVisible ? 'ticker 4s ease forwards' : 'none', opacity: tickVisible ? undefined : 0 }}
            >
              {success ? 'Ergebnisse bereit!' : displayMsg}
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
        <SmartProgressBar done={success} paused={false} />
      </div>
    </div>
  );
}

// ── Category config ────────────────────────────────────────────────────────────

const CAT_CONFIG: Record<string, { icon: string; color: string; border: string; text: string }> = {
  'Core-Tech':   { icon: '⚡', color: 'bg-blue-500/15',   border: 'border-blue-500/25',   text: 'text-blue-300'   },
  'Leadership':  { icon: '🎯', color: 'bg-amber-500/15',  border: 'border-amber-500/25',  text: 'text-amber-300'  },
  'Domain':      { icon: '🔬', color: 'bg-[#66c0b6]/15',  border: 'border-[#66c0b6]/25',  text: 'text-[#66c0b6]'  },
  'Soft Skills': { icon: '🤝', color: 'bg-green-500/15',  border: 'border-green-500/25',  text: 'text-green-300'  },
};
const CAT_DEFAULT = { icon: '📌', color: 'bg-white/8', border: 'border-white/15', text: 'text-white/55' };

function catConfig(cat?: string) {
  return CAT_CONFIG[cat ?? ''] ?? CAT_DEFAULT;
}

// ── Impact tier config ─────────────────────────────────────────────────────────

const IMPACT_TIERS = [
  { min: 5, color: '#f97316', bg: 'rgba(249,115,22,0.08)',  border: 'rgba(249,115,22,0.2)',  label: 'Top-Hebel',      emoji: '🚀' },
  { min: 4, color: '#30E3CA', bg: 'rgba(48,227,202,0.08)',  border: 'rgba(48,227,202,0.2)',  label: 'Hoher Impact',   emoji: '⚡' },
  { min: 3, color: '#66c0b6', bg: 'rgba(102,192,182,0.07)', border: 'rgba(102,192,182,0.2)', label: 'Starker Aufbau', emoji: '📈' },
  { min: 0, color: '#4ade80', bg: 'rgba(74,222,128,0.07)',  border: 'rgba(74,222,128,0.2)',  label: 'Quick Win',      emoji: '✅' },
];

function tierFor(severity: number) {
  return IMPACT_TIERS.find((t) => severity >= t.min) ?? IMPACT_TIERS[3];
}

// ── Skill detail panel (shown when skill tab is active) ───────────────────────

function SkillDetailPanel({
  skill, targetCompany, targetJob, onStartLearning,
}: { skill: RawSkill; targetCompany: string; targetJob: string; onStartLearning?: () => void }) {
  const name     = skillDisplayName(skill);
  const severity = skill?.gap_severity ?? 3;
  const tier     = tierFor(severity);
  const cat      = catConfig(skill?.category);

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: `linear-gradient(150deg,${tier.bg},rgba(10,14,30,0.95))`,
        border: `1px solid ${tier.color}40`,
        animation: 'fadeUp 0.3s ease',
      }}
    >
      <style>{GLOBAL_STYLES}</style>
      <div className="h-[3px]" style={{ background: `linear-gradient(90deg,${tier.color},${tier.color}22)` }} />

      <div className="p-5 space-y-4">
        {/* Header row */}
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${cat.color} border ${cat.border}`}>
            {cat.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-black uppercase tracking-widest" style={{ color: tier.color }}>
                {tier.emoji} {tier.label}
              </span>
              {skill?.category && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cat.color} border ${cat.border} ${cat.text}`}>
                  {skill.category}
                </span>
              )}
            </div>
            <h4 className="font-black text-white text-[17px] leading-snug mt-1">{name}</h4>
          </div>
        </div>

        {/* Impact bar */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1 flex-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 h-2.5 rounded-sm transition-all"
                style={{
                  backgroundColor: i < severity ? tier.color : 'rgba(255,255,255,0.07)',
                  transform: i < severity ? 'scaleY(1)' : 'scaleY(0.6)',
                }} />
            ))}
          </div>
          <span className="text-sm font-black tabular-nums" style={{ color: tier.color }}>
            Impact {severity}/5
          </span>
        </div>

        {/* Why it matters */}
        {skill?.pitch && (
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[11px] font-black uppercase tracking-wider text-white/35 mb-2">Warum das wichtig ist</p>
            <p className="text-sm text-white/80 leading-relaxed">{skill.pitch}</p>
          </div>
        )}

        {targetCompany && (
          <div className="rounded-xl p-4" style={{ background: tier.bg, border: `1px solid ${tier.border}` }}>
            <p className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: tier.color }}>
              Warum bei {targetCompany} entscheidend
            </p>
            <p className="text-xs text-white/60 leading-relaxed">
              {skill?.pitch
                ? `Für eine Position als ${targetJob} bei ${targetCompany} ist ${name} ein kritischer Faktor. ${skill.pitch}`
                : `${name} ist ein Schlüssel-Skill für ${targetJob}-Rollen bei ${targetCompany}.`
              }
            </p>
          </div>
        )}

        {skill?.market_value_bonus && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl"
            style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)' }}>
            <Zap size={14} className="text-amber-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-amber-400/60 font-bold uppercase tracking-wider">Marktwert-Bonus</p>
              <p className="text-sm font-black text-amber-300">{skill.market_value_bonus}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] text-white/35 font-bold uppercase tracking-wider mb-1">Ziel-Level</p>
            <p className="text-xs font-black text-white/80">
              {severity >= 5 ? 'Experte (EQF 7+)' : severity >= 4 ? 'Fortgeschritten (EQF 6)' : severity >= 3 ? 'Anwender (EQF 5)' : 'Grundlagen (EQF 4)'}
            </p>
          </div>
          {skill?.estimatedTime && (
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p className="text-[10px] text-white/35 font-bold uppercase tracking-wider mb-1">Lernzeit ca.</p>
              <p className="text-xs font-black text-white/80">{skill.estimatedTime}</p>
            </div>
          )}
        </div>

        {skill?.esco_code && (
          <a
            href={skill.esco_code}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] transition-colors hover:opacity-100"
            style={{ color: `${tier.color}80` }}
          >
            <BarChart3 size={11} /> ESCO-Referenz ansehen <ArrowRight size={10} />
          </a>
        )}

        {/* Per-skill CTA */}
        {onStartLearning && (
          <button
            onClick={onStartLearning}
            className="group relative w-full py-3.5 rounded-xl font-black text-[14px] text-black flex items-center justify-center gap-2.5 overflow-hidden transition-all duration-200 hover:scale-[1.015] active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg,${tier.color},#30E3CA)` }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', backgroundSize: '200% 100%', animation: 'shimmer 2s ease-in-out infinite' }} />
            <Sparkles size={15} className="relative z-10 group-hover:rotate-12 transition-transform" />
            <span className="relative z-10">Lernpfad für {name} starten</span>
            <ArrowRight size={14} className="relative z-10 group-hover:translate-x-0.5 transition-transform" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── Skill switcher (pill grid + detail panel) ────────────────────────────────

function SkillSwitcher({
  skills, targetCompany, targetJob, onStartLearning,
}: { skills: RawSkill[]; targetCompany: string; targetJob: string; onStartLearning?: (skillName: string) => void }) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (skills.length === 0) return null;

  const activeSkill = skills[activeIdx];

  return (
    <div className="space-y-3">
      {/* Pill grid — wraps naturally, no horizontal scroll, all skills visible */}
      <div className="flex flex-wrap gap-2">
        {skills.map((skill, i) => {
          const name     = skillDisplayName(skill);
          const severity = skill?.gap_severity ?? 3;
          const tier     = tierFor(severity);
          const isActive = i === activeIdx;

          return (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-left transition-all duration-200 hover:scale-[1.03]"
              style={{
                background: isActive ? tier.bg : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? tier.color + '55' : 'rgba(255,255,255,0.09)'}`,
                boxShadow: isActive ? `0 0 12px -3px ${tier.color}25` : 'none',
              }}
            >
              <span className="text-sm leading-none">{tier.emoji}</span>
              <span
                className="text-[12px] font-black whitespace-nowrap"
                style={{ color: isActive ? tier.color : 'rgba(255,255,255,0.7)' }}
              >
                {name}
              </span>
              {isActive && (
                <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: tier.color }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Detail panel for active skill */}
      <SkillDetailPanel
        key={activeIdx}
        skill={activeSkill}
        targetCompany={targetCompany}
        targetJob={targetJob}
        onStartLearning={onStartLearning ? () => onStartLearning(skillDisplayName(activeSkill)) : undefined}
      />
    </div>
  );
}

// ── Where-to-start card ───────────────────────────────────────────────────────

function WhereToStartCard({ skill, targetJob, onNavigate }: { skill: RawSkill; targetJob: string; onNavigate: () => void }) {
  const name = skillDisplayName(skill);
  const tier = tierFor(skill?.gap_severity ?? 3);
  return (
    <div className="relative overflow-hidden rounded-2xl"
      style={{ background: `linear-gradient(135deg,${tier.bg} 0%,rgba(10,14,30,0.97) 100%)`, border: `1px solid ${tier.color}40` }}>
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg,transparent,${tier.color},transparent)` }} />
      <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-[0.06]"
        style={{ background: `radial-gradient(circle,${tier.color},transparent)`, transform: 'translate(30%,-30%)' }} />
      <div className="relative p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: `${tier.color}15`, border: `1px solid ${tier.color}30` }}>
            🎯
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: tier.color }}>
              Womit fangen wir an?
            </p>
            <h3 className="text-lg font-black text-white leading-tight mt-0.5">
              Starte mit <span style={{ color: tier.color }}>{name}</span>
            </h3>
          </div>
        </div>
        <p className="text-sm text-white/65 leading-relaxed">
          {skill?.pitch ?? `Dieser Skill hat den größten direkten Einfluss auf deinen Weg zum ${targetJob}.`}
        </p>
        <button
          onClick={onNavigate}
          className="group relative w-full py-4 rounded-xl font-black text-[15px] text-black flex items-center justify-center gap-3 overflow-hidden transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: `linear-gradient(135deg,${tier.color},#30E3CA)`, animation: 'ctaPulse 2.5s ease-in-out infinite' }}
        >
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', backgroundSize: '200% 100%', animation: 'shimmer 2s ease-in-out infinite' }} />
          <Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
          <span className="relative z-10">Meinen Lernpfad jetzt starten</span>
          <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
        </button>
        <p className="text-center text-[11px] text-white/25">
          ESCO-validiert · Branchenspezifisch · Kostenlos starten
        </p>
      </div>
    </div>
  );
}

// ── Result view ────────────────────────────────────────────────────────────────

function ResultView({ result, onNavigate }: { result: AnalysisResult; onNavigate: (selectedSkill?: string) => void }) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingSkill, setPendingSkill] = useState<string | undefined>(undefined);

  const { missingSkills, currentSkills, strategicOutlook, matchScore, industry, targetJob, targetCompany } = result;

  const visibleSkills = missingSkills
    .filter((s) => skillDisplayName(s) !== '(unbenannt)')
    .sort((a, b) => (b?.gap_severity ?? 0) - (a?.gap_severity ?? 0));

  const visibleCurrent = currentSkills.filter((s) => skillDisplayName(s) !== '(unbenannt)');
  const topSkill = visibleSkills[0];
  const scoreColor = matchScore >= 70 ? '#22c55e' : matchScore >= 40 ? '#f59e0b' : '#30E3CA';

  const openPaywall = (skillName?: string) => {
    setPendingSkill(skillName);
    setShowPaywall(true);
  };

  return (
    <div className="space-y-5" style={{ animation: 'fadeUp 0.5s ease' }}>
      <style>{GLOBAL_STYLES}</style>

      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl p-5"
        style={{ background: 'linear-gradient(135deg,rgba(48,227,202,0.1) 0%,rgba(10,14,30,0.85) 60%,rgba(102,192,182,0.06) 100%)', border: '1px solid rgba(48,227,202,0.18)' }}>
        <div className="absolute top-0 right-0 w-40 h-40 pointer-events-none opacity-[0.08]"
          style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', transform: 'translate(25%,-25%)' }} />
        <div className="relative flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#30E3CA] animate-pulse" />
              <span className="text-[10px] font-black text-[#30E3CA]/75 uppercase tracking-widest">Karriere-Report · {new Date().getFullYear()}</span>
            </div>
            <h3 className="text-xl font-black text-white leading-tight">{targetJob}</h3>
            <div className="flex flex-wrap items-center gap-2">
              {targetCompany && (
                <span className="flex items-center gap-1 text-xs text-white/55"><Building2 size={11} /> {targetCompany}</span>
              )}
              {industry && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#66c0b6]/12 text-[#66c0b6] border border-[#66c0b6]/20">{industry}</span>
              )}
            </div>
          </div>
          {matchScore > 0 && (
            <div className="flex-shrink-0 flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 min-w-[70px] text-center">
              <span className="text-[22px] font-black leading-none" style={{ color: scoreColor }}>{matchScore}%</span>
              <span className="text-[10px] text-white/40 mt-0.5">Match</span>
            </div>
          )}
        </div>
        {strategicOutlook && (
          <div className="relative mt-4 flex gap-2.5 p-3 rounded-xl bg-white/[0.04] border border-white/8">
            <Brain size={15} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />
            <p className="text-xs text-white/65 leading-relaxed">{strategicOutlook}</p>
          </div>
        )}
      </div>

      {/* Skill switcher */}
      {visibleSkills.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-[#30E3CA]" />
              <h4 className="text-sm font-black text-white">Deine {visibleSkills.length} Wachstums-Chancen</h4>
            </div>
            <span className="text-[10px] text-white/30 italic">Skill antippen für Details</span>
          </div>
          <SkillSwitcher
            skills={visibleSkills}
            targetCompany={targetCompany}
            targetJob={targetJob}
            onStartLearning={(skillName) => openPaywall(skillName)}
          />
        </div>
      )}

      {/* Current skills */}
      {visibleCurrent.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Check size={13} className="text-[#66c0b6]" />
            <span className="text-xs font-bold text-white/50">Deine Basis</span>
            <span className="text-[10px] text-[#66c0b6]/60 font-bold">· {visibleCurrent.length} Skills</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {visibleCurrent.map((skill, i) => (
              <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] text-white/50 bg-white/[0.03] border border-white/8">
                {skillDisplayName(skill)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* CTA */}
      {topSkill ? (
        <WhereToStartCard skill={topSkill} targetJob={targetJob} onNavigate={() => openPaywall()} />
      ) : (
        <button
          onClick={() => openPaywall()}
          className="group w-full py-4 rounded-xl font-black text-base text-black flex items-center justify-center gap-3 transition-all hover:scale-[1.02]"
          style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', animation: 'ctaPulse 2.5s ease-in-out infinite' }}
        >
          <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          Meinen Lernpfad starten
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      )}

      {showPaywall && (
        <LearningPathPaywall
          isOpen
          onClose={() => { setShowPaywall(false); setPendingSkill(undefined); }}
          learningPathId={result.pathId}
          targetJob={targetJob}
          targetCompany={targetCompany}
          skillCount={visibleSkills.length}
          selectedSkill={pendingSkill}
        />
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface CareerVisionSectionProps {
  cvId?: string;
  onAnalysisComplete?: (pathId: string) => void;
}

export function CareerVisionSection({ cvId: initialCvId, onAnalysisComplete }: CareerVisionSectionProps) {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [targetJob, setTargetJob] = useState('');
  const [targetCompany, setTargetCompany] = useState('');
  const [industry, setIndustry] = useState('');
  const [visionDescription, setVisionDescription] = useState('');

  // CV state
  const [activeCvId, setActiveCvId] = useState<string | undefined>(initialCvId);
  const [cvFileName, setCvFileName] = useState<string | null>(null);
  const [useNewCv, setUseNewCv] = useState(false);
  const [newCvFile, setNewCvFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phase & result
  const [phase, setPhase] = useState<Phase>('idle');
  const [formError, setFormError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [cvUploadFileName, setCvUploadFileName] = useState<string>('');

  // Refs
  const channelRef     = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fallbackTimRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef   = useRef(0);
  const completedRef   = useRef(false);
  const pathIdRef      = useRef<string | null>(null);

  // ── Load latest CV ──────────────────────────────────────────────────────────

  useEffect(() => {
    async function load() {
      if (!user?.id) return;
      const query = initialCvId
        ? supabase.from('stored_cvs').select('id,file_name').eq('id', initialCvId).maybeSingle()
        : supabase.from('stored_cvs').select('id,file_name').eq('user_id', user.id)
            .eq('status', 'completed').order('updated_at', { ascending: false }).limit(1).maybeSingle();
      const { data } = await query;
      if (data) {
        setActiveCvId(data.id);
        setCvFileName(data.file_name ?? null);
      }
    }
    load();
  }, [user?.id, initialCvId]);

  // ── Dynamic messages ────────────────────────────────────────────────────────

  const dynamicMessages = [
    industry ? `Suche Branchentrends für ${industry}…` : 'Analysiere Branchentrends 2026…',
    targetCompany ? `Analysiere Anforderungen bei ${targetCompany}…` : 'Scanne Unternehmensanforderungen…',
    targetJob ? `Vergleiche Profile für ${targetJob}…` : 'Vergleiche Stellenprofile…',
    'Gleiche vorhandene Skills ab…',
    'Berechne Skill-Gaps und Prioritäten…',
    'Identifiziere strategische Hebel…',
    'Erstelle personalisierten Entwicklungsplan…',
    'Finale Optimierung läuft…',
  ];

  // ── Cleanup ─────────────────────────────────────────────────────────────────

  const cleanupListeners = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
    if (fallbackTimRef.current) { clearTimeout(fallbackTimRef.current); fallbackTimRef.current = null; }
  }, []);

  useEffect(() => () => cleanupListeners(), [cleanupListeners]);

  // ── Success handler ─────────────────────────────────────────────────────────

  const handleCompletion = useCallback(
    async (pathId: string, rowData?: Record<string, unknown>) => {
      if (completedRef.current) return;
      completedRef.current = true;
      cleanupListeners();

      let row: Record<string, unknown> | null = rowData ?? null;
      if (!row || !row.missing_skills) {
        const { data } = await supabase
          .from('learning_paths')
          .select('status,missing_skills,current_skills,strategic_outlook_2026,match_score,industry,target_job,target_company')
          .eq('id', pathId)
          .maybeSingle();
        if (data) row = data as Record<string, unknown>;
      }
      if (!row) return;

      setResult({
        pathId,
        missingSkills:   parseSkills(row.missing_skills),
        currentSkills:   normalizeCurrentSkills(row.current_skills),
        strategicOutlook: (row.strategic_outlook_2026 as string) ?? '',
        matchScore:       Number(row.match_score ?? 0),
        industry:         (row.industry as string) ?? industry,
        targetJob:        (row.target_job as string) ?? targetJob,
        targetCompany:    (row.target_company as string) ?? targetCompany,
      });

      setPhase('revealing');
      await new Promise((r) => setTimeout(r, 1_500));
      setPhase('done');
    },
    [cleanupListeners, industry, targetJob, targetCompany],
  );

  // ── Polling learning_paths ──────────────────────────────────────────────────

  const startPolling = useCallback(
    (pathId: string) => {
      pollCountRef.current = 0;
      const tick = async () => {
        if (completedRef.current) return;
        pollCountRef.current += 1;
        try {
          const { data } = await supabase
            .from('learning_paths')
            .select('status,missing_skills,current_skills,strategic_outlook_2026,match_score,industry,target_job,target_company')
            .eq('id', pathId)
            .maybeSingle();
          if (data && COMPLETE_STATUSES.has(data.status as string)) {
            handleCompletion(pathId, data as Record<string, unknown>);
            return;
          }
        } catch (e: any) {
          console.warn('[CVSection] Poll exception:', e.message);
        }
        if (pollCountRef.current < POLL_MAX && !completedRef.current) {
          pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        }
      };
      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    },
    [handleCompletion],
  );

  // ── Realtime ────────────────────────────────────────────────────────────────

  const startRealtime = useCallback(
    (pathId: string) => {
      const ch = supabase
        .channel(`cv_section_${pathId}_${Date.now()}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'learning_paths', filter: `id=eq.${pathId}` },
          (payload) => {
            const row = payload.new as Record<string, unknown>;
            if (COMPLETE_STATUSES.has(row?.status as string)) {
              handleCompletion(pathId, row);
            }
          })
        .subscribe();
      channelRef.current = ch;
    },
    [handleCompletion],
  );

  // ── CV upload + cv_data polling ─────────────────────────────────────────────

  const uploadCvAndWaitForData = useCallback(async (file: File): Promise<{ uploadId: string; cvData: string }> => {
    // 1. Upload file to Supabase storage + create stored_cvs record
    const up = await uploadCvAndCreateRecord(file, { source: 'skill', userId: user?.id ?? null });
    if (!up.success || !up.uploadId) {
      throw new Error('CV-Upload fehlgeschlagen');
    }

    const uploadId = up.uploadId;

    // 2. Trigger the CV-Check Make webhook directly (same as CVCheckPage)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const callbackUrl = `${supabaseUrl}/functions/v1/make-cv-callback`;

    try {
      // Get public file URL for Make
      const { data: cvRow } = await supabase
        .from('stored_cvs')
        .select('file_url,file_path,file_name')
        .eq('id', uploadId)
        .maybeSingle();

      const makePayload = {
        upload_id: uploadId,
        url: cvRow?.file_url ?? '',
        file_url: cvRow?.file_url ?? '',
        file_url_fallback: null,
        file_name: cvRow?.file_name ?? file.name,
        file_path: cvRow?.file_path ?? null,
        source: 'skill',
        user_id: user?.id ?? null,
        temp_id: null,
        callback_url: callbackUrl,
        timestamp: new Date().toISOString(),
      };

      await supabase.functions.invoke('trigger-cv-check', { body: makePayload });
    } catch (e: any) {
      console.warn('[CVSection] CV-Check trigger error (continuing):', e.message);
    }

    // 3. Poll stored_cvs for cv_data to appear (Make writes it back)
    for (let i = 0; i < CV_DATA_POLL_MAX; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const { data } = await supabase
        .from('stored_cvs')
        .select('cv_data,status')
        .eq('id', uploadId)
        .maybeSingle();

      if (data?.status === 'failed') {
        throw new Error('CV-Analyse fehlgeschlagen. Bitte versuche es erneut.');
      }

      if (data?.cv_data != null) {
        const cvData = typeof data.cv_data === 'string'
          ? data.cv_data
          : JSON.stringify(data.cv_data);

        // Update local state so the CV is shown as selected
        setActiveCvId(uploadId);
        setCvFileName(file.name);
        return { uploadId, cvData };
      }
    }

    // cv_data never appeared — continue with uploadId, no cv_data
    setActiveCvId(uploadId);
    setCvFileName(file.name);
    return { uploadId, cvData: 'NO_CV_PROVIDED' };
  }, [user?.id]);

  // ── Run analysis ────────────────────────────────────────────────────────────

  const runAnalysis = useCallback(async () => {
    if (!targetJob.trim()) { setFormError('Bitte gib eine Zielposition ein.'); return; }
    if (!user?.id)          { setFormError('Bitte melde dich zuerst an.'); return; }

    setFormError(null);
    setApiError(null);
    setResult(null);
    completedRef.current = false;

    try {
      let resolvedCvId = activeCvId;
      let cvDataPayload = 'NO_CV_PROVIDED';

      // ── Case A: new CV file selected → upload via CV-Check and wait for cv_data ──
      if (useNewCv && newCvFile) {
        setCvUploadFileName(newCvFile.name);
        setPhase('cv_uploading');

        const { uploadId, cvData } = await uploadCvAndWaitForData(newCvFile);
        resolvedCvId = uploadId;
        cvDataPayload = cvData;
      } else if (resolvedCvId) {
        // ── Case B: existing CV → fetch cv_data from DB ──
        const { data: cvRow } = await supabase
          .from('stored_cvs').select('cv_data').eq('id', resolvedCvId).maybeSingle();
        if (cvRow?.cv_data != null) {
          cvDataPayload = typeof cvRow.cv_data === 'string'
            ? cvRow.cv_data
            : JSON.stringify(cvRow.cv_data);
        }
      }
      // ── Case C: no CV → cvDataPayload stays 'NO_CV_PROVIDED' ──

      // Insert learning_paths row
      const { data: lp, error: insertErr } = await supabase
        .from('learning_paths')
        .insert({
          user_id: user.id,
          target_job: targetJob.trim(),
          target_company: targetCompany.trim() || null,
          industry: industry.trim() || null,
          vision_description: visionDescription.trim() || null,
          cv_id: resolvedCvId || null,
          status: 'analyzing',
          missing_skills: [],
          current_skills: [],
          is_paid: false,
          progress: {},
        })
        .select('id')
        .single();

      if (insertErr || !lp?.id) {
        throw new Error('Analyse konnte nicht gestartet werden: ' + (insertErr?.message ?? 'Unbekannter Fehler'));
      }

      const pathId = lp.id;
      pathIdRef.current = pathId;
      setPhase('waiting');

      // Fire vision webhook
      try {
        await fetch(VISION_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: pathId,
            user_id: user.id,
            target_job: targetJob.trim(),
            target_company: targetCompany.trim() || null,
            industry: industry.trim() || null,
            vision_description: visionDescription.trim() || null,
            current_skills: cvDataPayload,
          }),
        });
      } catch (e: any) {
        console.warn('[CVSection] Vision webhook error (continuing):', e.message);
      }

      startRealtime(pathId);
      startPolling(pathId);

      fallbackTimRef.current = setTimeout(() => {
        if (!completedRef.current) setPhase('fallback');
      }, FALLBACK_TIMEOUT_MS);

    } catch (e: any) {
      console.error('[CVSection] runAnalysis error:', e);
      setApiError(e.message || 'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.');
      setPhase('idle');
    }
  }, [
    targetJob, targetCompany, industry, visionDescription,
    activeCvId, useNewCv, newCvFile, user,
    startRealtime, startPolling, uploadCvAndWaitForData,
  ]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRetry = () => {
    cleanupListeners();
    completedRef.current = false;
    pathIdRef.current = null;
    setPhase('idle');
    setApiError(null);
    setResult(null);
  };

  const handleManualCheck = async () => {
    const pathId = pathIdRef.current;
    if (!pathId) return;
    const { data } = await supabase
      .from('learning_paths')
      .select('status,missing_skills,current_skills,strategic_outlook_2026,match_score,industry,target_job,target_company')
      .eq('id', pathId)
      .maybeSingle();
    if (data && COMPLETE_STATUSES.has(data.status as string)) {
      handleCompletion(pathId, data as Record<string, unknown>);
    } else {
      setPhase('waiting');
      completedRef.current = false;
      startRealtime(pathId);
      startPolling(pathId);
      fallbackTimRef.current = setTimeout(() => {
        if (!completedRef.current) setPhase('fallback');
      }, FALLBACK_TIMEOUT_MS);
    }
  };

  const handleNavigate = (_selectedSkill?: string) => {
    if (!result) return;
    if (onAnalysisComplete) onAnalysisComplete(result.pathId);
    else navigate(`/learning-path/${result.pathId}`);
  };

  // ── Derived ─────────────────────────────────────────────────────────────────

  const isCvUploading = phase === 'cv_uploading';
  const isAnalyzing   = phase === 'waiting' || phase === 'revealing';
  const showLoader    = isCvUploading || isAnalyzing;
  const showResult    = phase === 'done' && result !== null;
  const showForm      = !showLoader && phase !== 'done' && phase !== 'fallback';
  const canSubmit     = !!targetJob.trim() && !showLoader;

  // Drag-drop handlers for the CV upload area
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUseNewCv(true);
      setNewCvFile(file);
    }
  };

  // When user selects/drops a CV file while targetJob is already filled → auto-start
  useEffect(() => {
    if (newCvFile && targetJob.trim() && phase === 'idle') {
      runAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newCvFile]);

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* CV uploading loader */}
      {isCvUploading && <CvUploadLoader fileName={cvUploadFileName} />}

      {/* Vision analysis loader */}
      {isAnalyzing && <AnalysisLoader messages={dynamicMessages} success={phase === 'revealing'} />}

      {/* Fallback */}
      {phase === 'fallback' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">Analyse dauert länger als erwartet</p>
              <p className="text-sm text-white/55">Die Verbindung könnte unterbrochen sein. Prüfe den Status manuell oder versuche es erneut.</p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleManualCheck}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30 transition-all font-medium text-sm">
              <Eye size={16} /> Status manuell prüfen
            </button>
            <button onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 transition-all font-medium text-sm">
              <RefreshCw size={16} /> Erneut starten
            </button>
          </div>
        </div>
      )}

      {/* Results */}
      {showResult && result && <ResultView result={result} onNavigate={handleNavigate} />}

      {/* Input form */}
      {showForm && (
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 space-y-6">

          {/* Target job */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              Zielposition <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={targetJob}
              onChange={(e) => { setTargetJob(e.target.value); setFormError(null); }}
              placeholder="z.B. Senior Product Manager, VP Engineering, Tech Lead…"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/35 focus:border-[#66c0b6] focus:outline-none transition-all"
            />
            {formError && (
              <p className="text-sm text-red-400 flex items-center gap-1.5"><X size={14} /> {formError}</p>
            )}
          </div>

          {/* Company + Industry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                Zielunternehmen <span className="text-white/30 text-xs font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="z.B. Google, SAP, FinTech-Startup…"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/35 focus:border-[#66c0b6] focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/80">
                Branche <span className="text-white/30 text-xs font-normal">(optional)</span>
              </label>
              <div className="relative">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-white/5 border border-white/10 text-white focus:border-[#66c0b6] focus:outline-none transition-all appearance-none"
                >
                  <option value="" className="bg-[#0a0a1a]">Branche wählen…</option>
                  {INDUSTRIES.map((s) => (
                    <option key={s} value={s} className="bg-[#0a0a1a] text-white">{s}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Vision description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-white/80">
              Deine Vision <span className="text-white/30 text-xs font-normal">(optional)</span>
            </label>
            <textarea
              value={visionDescription}
              onChange={(e) => setVisionDescription(e.target.value)}
              placeholder="z.B. Ich möchte in 2 Jahren das KI-Team leiten und datengetriebene Prozesse automatisieren…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/35 focus:border-[#66c0b6] focus:outline-none transition-all resize-none"
            />
          </div>

          {/* CV section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-white/80">
                Lebenslauf
              </label>
              {!activeCvId && !useNewCv && (
                <span className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Optional — aber empfohlen</span>
              )}
            </div>

            {/* Existing CV — already linked */}
            {activeCvId && !useNewCv && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(102,192,182,0.08)', border: '1px solid rgba(102,192,182,0.22)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(102,192,182,0.15)', border: '1px solid rgba(102,192,182,0.3)' }}>
                  <FileText size={16} className="text-[#66c0b6]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#66c0b6] font-semibold truncate">
                    {cvFileName ?? 'Vorhandener Lebenslauf'}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ShieldCheck size={10} className="text-[#66c0b6]/60" />
                    <p className="text-[10px] text-[#66c0b6]/60">Deine Skills fließen personalisiert in die Analyse ein</p>
                  </div>
                </div>
                <button type="button"
                  onClick={() => { setUseNewCv(true); setNewCvFile(null); }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white/45 hover:text-white border border-white/10 hover:border-white/25 transition-all">
                  <Upload size={11} /> Anderen
                </button>
              </div>
            )}

            {/* Upload area — shown when useNewCv OR no CV exists */}
            {(useNewCv || (!activeCvId && !useNewCv)) && (
              <div className="space-y-3">
                {/* Two-option layout when no CV exists and not in upload mode */}
                {!activeCvId && !useNewCv && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Option A: Upload CV */}
                    <button
                      type="button"
                      onClick={() => setUseNewCv(true)}
                      className="group flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ background: 'rgba(48,227,202,0.07)', border: '1px solid rgba(48,227,202,0.22)' }}
                    >
                      <div className="flex items-center gap-2.5 w-full">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(48,227,202,0.12)', border: '1px solid rgba(48,227,202,0.28)' }}>
                          <Upload size={14} className="text-[#30E3CA]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-white">Mit Lebenslauf</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'rgba(48,227,202,0.6)' }}>Empfohlen</p>
                        </div>
                        <ArrowRight size={14} className="text-[#30E3CA]/50 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                      </div>
                      <p className="text-[11px] text-white/45 leading-relaxed">
                        Die KI erkennt deine vorhandenen Skills — nur echte Lücken werden angezeigt.
                      </p>
                    </button>

                    {/* Option B: Generalist mode — start without CV */}
                    <button
                      type="button"
                      onClick={runAnalysis}
                      disabled={!targetJob.trim()}
                      className="group flex flex-col items-start gap-2.5 p-4 rounded-2xl text-left transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.12)' }}
                    >
                      <div className="flex items-center gap-2.5 w-full">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}>
                          <Sparkles size={14} className="text-white/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-white">Ohne Lebenslauf</p>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-white/35">Generalistenmodus</p>
                        </div>
                        <ArrowRight size={14} className="text-white/25 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                      </div>
                      <p className="text-[11px] text-white/40 leading-relaxed">
                        Sofort starten — Analyse basiert auf allgemeinen Marktdaten für {targetJob.trim() || 'deine Zielposition'}.
                      </p>
                    </button>
                  </div>
                )}

                {/* Drag-drop upload area — shown when useNewCv is true */}
                {useNewCv && (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !newCvFile && fileInputRef.current?.click()}
                    onKeyDown={(e) => e.key === 'Enter' && !newCvFile && fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className="relative overflow-hidden rounded-2xl transition-all duration-200"
                    style={{
                      border: `2px dashed ${isDragging ? 'rgba(48,227,202,0.6)' : newCvFile ? 'rgba(34,197,94,0.5)' : 'rgba(255,255,255,0.15)'}`,
                      background: isDragging ? 'rgba(48,227,202,0.06)' : newCvFile ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.02)',
                      cursor: newCvFile ? 'default' : 'pointer',
                    }}
                  >
                    <div className="p-6 flex flex-col items-center gap-3 text-center">
                      {newCvFile ? (
                        <>
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                            <FileText size={22} className="text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-white">{newCvFile.name}</p>
                            <p className="text-[11px] text-green-400/80 mt-0.5 flex items-center justify-center gap-1">
                              <CheckCircle2 size={10} />
                              Bereit — Analyse startet automatisch nach Klick auf "Vision analysieren"
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setNewCvFile(null); fileInputRef.current && (fileInputRef.current.value = ''); }}
                            className="text-[10px] text-white/30 hover:text-white/60 transition-colors flex items-center gap-1"
                          >
                            <X size={10} /> Andere Datei wählen
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                            style={{ background: isDragging ? 'rgba(48,227,202,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${isDragging ? 'rgba(48,227,202,0.3)' : 'rgba(255,255,255,0.1)'}` }}>
                            <Upload size={22} className={isDragging ? 'text-[#30E3CA]' : 'text-white/30'} />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-white/70">
                              {isDragging ? 'Datei loslassen' : 'PDF hier ablegen oder klicken'}
                            </p>
                            <p className="text-[11px] text-white/35 mt-0.5">Nur PDF-Dateien · Max. 10 MB</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                <input ref={fileInputRef} type="file" accept=".pdf" className="hidden"
                  onChange={(e) => setNewCvFile(e.target.files?.[0] ?? null)} />

                {useNewCv && activeCvId && (
                  <button type="button"
                    onClick={() => { setUseNewCv(false); setNewCvFile(null); }}
                    className="text-xs text-white/35 hover:text-white/60 transition-colors flex items-center gap-1">
                    <X size={11} /> Abbrechen — vorhandenen CV verwenden
                  </button>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* API error */}
      {apiError && (
        <div className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300">{apiError}</span>
          <button onClick={handleRetry}
            className="ml-auto flex items-center gap-1.5 text-xs text-white/60 hover:text-white border border-white/15 hover:border-white/35 px-3 py-1.5 rounded-lg transition-all">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Submit button */}
      {showForm && (
        <div className="space-y-2">
          <button
            onClick={runAnalysis}
            disabled={!canSubmit}
            className="group relative w-full py-4 rounded-xl font-black text-lg text-black flex items-center justify-center gap-3 overflow-hidden transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', animation: canSubmit ? 'ctaPulse 2.5s ease-in-out infinite' : 'none' }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', backgroundSize: '200% 100%', animation: canSubmit ? 'shimmer 2s ease-in-out infinite' : 'none' }} />
            <Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10">
              {newCvFile ? 'CV hochladen & Vision analysieren' : (useNewCv ? 'Ohne CV analysieren' : 'Vision analysieren')}
            </span>
            <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
          </button>
          {!activeCvId && !useNewCv && targetJob.trim() && (
            <p className="text-center text-[11px] text-white/30">
              Analyse startet ohne CV — du kannst ihn später noch hinzufügen
            </p>
          )}
        </div>
      )}
    </div>
  );
}
