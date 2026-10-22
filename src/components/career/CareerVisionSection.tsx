import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, X, RefreshCw, Upload,
  FileText, ChevronDown, AlertCircle, Eye,
  ArrowRight,
  CheckCircle2, ShieldCheck, Clock,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { SkillGapResultView, type AnalysisResult } from './SkillGapResultView';
import { supabase } from '../../lib/supabase';
import { uploadCvAndCreateRecord, triggerCvExtraction } from '../../services/cvUploadService';
import { SkillGapPaywall } from './SkillGapPaywall';
import { FollowRewardPopup, shouldShowFollowPopup } from '../landing/FollowRewardPopup';
import { parseSkills, RawSkill } from '../../utils/skills';
import RegisterModal from '../RegisterModal';
import { useDsgvoConsent } from '../../hooks/useDsgvoConsent';
import { DsgvoConsentDialog } from '../DsgvoConsentDialog';

// ── Constants ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 3_000;
/** Ab hier langsamer pollen – spart Requests, ohne das Ergebnis zu verpassen. */
const POLL_SLOW_AFTER = 40;          // 40 × 3 s = 2 Minuten
const POLL_SLOW_INTERVAL_MS = 6_000;
/** Gesamtdauer der Beobachtung: 2 Min. schnell + ~13 Min. langsam ≈ 15 Minuten. */
const POLL_MAX = 170;
/**
 * Nach dieser Zeit zeigt der Loader nur einen HINWEIS ("dauert länger").
 * Er wird NICHT mehr durch den Fallback-Kasten ersetzt – die Analyse läuft
 * zweistufig und braucht regulär 2–4 Minuten.
 */
const SLOW_HINT_MS = 150_000;
/**
 * Spiegel von RUNNING_LOCK_MS der Edge Function (6 Min.) + Puffer. Steht ein
 * Lauf länger auf "analyzing", gilt er als hängend und wird EINMAL automatisch
 * neu angestoßen (kostenlos, die Zahlung ist bereits verbucht).
 */
const STUCK_AFTER_MS = 6.5 * 60_000;
/** Stripe-Webhook kann verzögert ankommen → Start bei HTTP 402 wiederholen. */
const START_RETRY_MAX = 8;
const START_RETRY_DELAY_MS = 5_000;
const CV_DATA_POLL_MAX = 30;

const COMPLETE_STATUSES = new Set(['gap_analysis_complete', 'curriculum_ready', 'in_progress', 'completed']);

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


type Phase =
  | 'idle'
  | 'cv_uploading'   // CV extraction running (after payment)
  | 'paywall'        // waiting for skillgap payment
  | 'waiting'        // vision webhook sent, listening for DB update
  | 'revealing'      // completed received, brief success state
  | 'done'           // results fully visible
  | 'error'
  | 'failed'         // Analyse abgebrochen (Server meldet status = failed)
  | 'fallback';

/**
 * Grobe Plausibilitätsprüfung der Zielposition – VOR der Zahlung.
 * Fängt Tastaturfolgen und Zufallszeichen ab ("asdf", "asdfasdf", "xxxx").
 * Die eigentliche Prüfung macht die Edge Function.
 */
function looksLikeJobTitle(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  const letters = v.replace(/[^a-zäöüß]/g, '');
  if (letters.length < 2) return false;
  if (/^(.{1,4})\1+$/.test(letters)) return false;                     // asdfasdf, xxxx, abab
  if (/(.)\1{3,}/.test(letters)) return false;                          // aaaa
  if (/^(test|tests|testing|keine|nix|nichts|egal|bla|blabla|xyz|abc|job|beruf)$/.test(letters)) return false;
  const keyboardRuns = ['qwert', 'wertz', 'asdf', 'sdfg', 'dfgh', 'fghj', 'ghjk', 'hjkl', 'yxcv', 'xcvb', 'cvbn', 'uiop', 'zuio', 'jklö'];
  if (keyboardRuns.some((k) => letters.includes(k))) return false;
  // Jedes längere Wort braucht einen Vokal ("Kfz", "IT", "HR" bleiben erlaubt)
  const words = v.split(/[^a-zäöüß]+/).filter((w) => w.length >= 5);
  if (words.some((w) => !/[aeiouyäöü]/.test(w))) return false;
  return true;
}

// Optional columns must not make the entire result query fail on older schemas.
const ANALYSIS_SELECT = '*';

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
  { id: 'gaps',    label: 'Skill-Gaps werden berechnet',        detail: 'Deine nächsten Lernchancen werden priorisiert…'             },
  { id: 'esco',    label: 'ESCO-Datenbank wird abgeglichen',    detail: 'Validiere Skills nach EU-Standard…'        },
  { id: 'path',    label: 'Lernpfad wird modelliert',           detail: 'Erstelle deine persönliche Roadmap…'      },
  { id: 'outlook', label: 'Strategischer Ausblick 2026',        detail: 'Analysiere KI-Trends & Gehaltspotenziale…' },
  { id: 'done',    label: 'Ergebnisse werden aufbereitet',      detail: 'Fast fertig…'                             },
];

function AnalysisLoader({ messages, success, slow = false, checking = false, onCheckNow }: {
  messages: string[]; success: boolean; slow?: boolean; checking?: boolean; onCheckNow?: () => void;
}) {
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
        {slow && !success && (
          <div className="flex flex-wrap items-center gap-3 rounded-xl px-4 py-3"
            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)' }}>
            <Clock size={15} className="text-amber-300 flex-shrink-0" />
            <p className="flex-1 min-w-[200px] text-xs text-amber-100/80 leading-relaxed">
              Die Recherche dauert gerade etwas länger als üblich. Lass die Seite einfach offen –
              dein Ergebnis erscheint automatisch, sobald es fertig ist.
            </p>
            {onCheckNow && (
              <button onClick={onCheckNow} disabled={checking}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-100 border border-amber-400/30 hover:bg-amber-400/10 transition-all disabled:opacity-50">
                <RefreshCw size={12} className={checking ? 'animate-spin' : ''} /> Jetzt prüfen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface CareerVisionSectionProps {
  cvId?: string;
  /** @deprecated Weiterleitung erfolgt jetzt über die Paywall im Ergebnis */
  onAnalysisComplete?: (pathId: string) => void;
  resumePathId?: string;
}

export function CareerVisionSection({ cvId: initialCvId, resumePathId }: CareerVisionSectionProps) {
  const { user, loading: authLoading } = useAuth();

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
  const [failCode, setFailCode] = useState<string | null>(null);
  /** Technischer Fehlertext aus skillgap_analysis.error (für Support/Diagnose) */
  const [failDetail, setFailDetail] = useState<string>('');
  const [failedRole, setFailedRole] = useState('');
  const [roleFix, setRoleFix] = useState('');
  const [roleFixError, setRoleFixError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [cvUploadFileName, setCvUploadFileName] = useState<string>('');
  const [preparing, setPreparing] = useState(false);
  /** Analyse dauert länger als üblich → Hinweis im Loader (kein Abbruch) */
  const [slowHint, setSlowHint] = useState(false);
  const [checkingNow, setCheckingNow] = useState(false);

  // Follow-reward popup: shown once the analysis is actually finished — not on
  // mount. Firing it at mount meant the "thank you" arrived before the user had
  // done anything, and burned the once-per-session flag on an empty form.
  const [followPopupOpen, setFollowPopupOpen] = useState(false);

  // Login modal — shown when unauthenticated user tries to start analysis
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingAnalysis, setPendingAnalysis] = useState(false);
  const { pendingType, requestConsent, handleAccept, handleDecline } = useDsgvoConsent();

  useEffect(() => {
    if (phase === 'done' && shouldShowFollowPopup()) {
      setFollowPopupOpen(true);
    }
  }, [phase]);

  // Refs
  const channelRef        = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pollTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const slowTimerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef      = useRef(0);
  const pollErrorsRef     = useRef(0);
  const runRef            = useRef(0);
  const revealTimerRef    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const completedRef      = useRef(false);
  const pathIdRef         = useRef<string | null>(null);
  /** Hängender Lauf wird pro Beobachtung höchstens EINMAL automatisch neu gestartet. */
  const restartedRef      = useRef(false);
  /**
   * Erst wenn die Edge Function den (Neu-)Start bestätigt hat, gilt ein
   * "failed" aus der DB als Ergebnis DIESES Laufs. Sonst würde ein Retry
   * sofort wieder am alten Fehlerstatus hängen bleiben.
   */
  const startConfirmedRef = useRef(true);
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
    if (slowTimerRef.current) { clearTimeout(slowTimerRef.current); slowTimerRef.current = null; }
  }, []);

  useEffect(() => () => {
    runRef.current += 1;
    cleanupListeners();
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
  }, [cleanupListeners]);

  // Auto-continue analysis after login
  useEffect(() => {
    if (user?.id && pendingAnalysis) {
      setShowLoginModal(false);
      setPendingAnalysis(false);
      runAnalysis();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, pendingAnalysis]);

  // ── Success handler ─────────────────────────────────────────────────────────

  const handleCompletion = useCallback(
    async (pathId: string, rowData?: Record<string, unknown>) => {
      if (completedRef.current) return;
      const run = runRef.current;
      let row: Record<string, unknown> | null = rowData ?? null;
      if (!row || !Array.isArray(row.missing_skills)) {
        const { data } = await supabase
          .from('learning_paths')
          .select(ANALYSIS_SELECT)
          .eq('id', pathId)
          .maybeSingle();
        if (data) row = data as Record<string, unknown>;
      }
      if (!row || run !== runRef.current || completedRef.current) return;
      completedRef.current = true;
      cleanupListeners();
      setApiError(null);
      setSlowHint(false);

      const analysis = (row.skillgap_analysis ?? null) as
        | { research?: { sources?: unknown }; score?: { method?: unknown; covered?: unknown; partial?: unknown; total?: unknown; total_weight?: unknown } }
        | null;
      const sc = analysis?.score;
      const rawSources = analysis?.research?.sources;

      setResult({
        pathId,
        missingSkills:    parseSkills(row.missing_skills),
        currentSkills:    normalizeCurrentSkills(row.current_skills),
        strategicOutlook: (row.strategic_outlook_2026 as string) ?? '',
        matchScore:       row.match_score == null ? null : Number(row.match_score),
        sources:          Array.isArray(rawSources) ? rawSources.filter((u): u is string => typeof u === 'string') : [],
        scoreMethod:      typeof sc?.method === 'string' ? sc.method : '',
        coverage:         sc && Number(sc.total_weight) > 0
          ? { covered: Number(sc.covered) || 0, partial: Number(sc.partial) || 0, total: Number(sc.total) || 0, totalWeight: Number(sc.total_weight) }
          : null,
        industry:         (row.industry as string) ?? industry,
        targetJob:        (row.target_job as string) ?? targetJob,
        targetCompany:    (row.target_company as string) ?? targetCompany,
      });

      setPhase('revealing');
      revealTimerRef.current = setTimeout(() => {
        if (run === runRef.current) setPhase('done');
      }, 1_500);
    },
    [cleanupListeners, industry, targetJob, targetCompany],
  );

  // ── Abgebrochene Analyse anzeigen ───────────────────────────────────────────

  const showFailed = useCallback((row: Record<string, unknown>) => {
    const role = (row.target_job as string) ?? '';
    completedRef.current = true;
    cleanupListeners();
    const analysis = row.skillgap_analysis as { error_code?: string; error?: string } | null;
    setFailCode((row.error_code as string) || analysis?.error_code || 'INTERNAL');
    setFailDetail(typeof analysis?.error === 'string' ? analysis.error : '');
    setFailedRole(role);
    setRoleFix('');
    setRoleFixError(null);
    setApiError(null);
    setSlowHint(false);
    setPhase('failed');
  }, [cleanupListeners]);

  // ── Edge Function starten (mit Wiederholung, falls Stripe noch nicht bestätigt hat) ──

  type StartResponse = { status?: string; error_code?: string } | null;

  const requestAnalysisStart = useCallback(
    async (pathId: string, run: number, correctedTargetJob?: string): Promise<StartResponse> => {
      for (let attempt = 0; attempt <= START_RETRY_MAX; attempt++) {
        const { data, error } = await supabase.functions.invoke('skillgap-analyze', {
          body: { learning_path_id: pathId, ...(correctedTargetJob ? { target_job: correctedTargetJob } : {}) },
        });
        if (run !== runRef.current) return null;
        if (!error) return (data ?? null) as StartResponse;

        const response = (error as { context?: Response }).context;
        const status = response instanceof Response ? response.status : undefined;

        // 402 = Webhook hat die Zahlung noch nicht verbucht → kurz warten, erneut versuchen
        if (status === 402 && attempt < START_RETRY_MAX) {
          await new Promise((r) => setTimeout(r, START_RETRY_DELAY_MS));
          if (run !== runRef.current) return null;
          continue;
        }

        let serverMessage = '';
        if (response instanceof Response) {
          try { serverMessage = (await response.clone().json())?.error ?? ''; } catch { /* keine JSON-Antwort */ }
        }
        const err = new Error(
          status === 402
            ? 'Deine Zahlung ist noch nicht bei uns angekommen. Das dauert manchmal einen Moment – klicke gleich auf „Ergebnis laden“.'
            : serverMessage || 'Die Analyse konnte nicht gestartet werden.',
        ) as Error & { status?: number };
        err.status = status;
        throw err;
      }
      return null;
    },
    [],
  );

  // ── Polling learning_paths ──────────────────────────────────────────────────

  const startPolling = useCallback(
    (pathId: string) => {
      const run = runRef.current;
      pollCountRef.current = 0;
      pollErrorsRef.current = 0;
      const tick = async () => {
        if (run !== runRef.current || completedRef.current) return;
        pollCountRef.current += 1;
        try {
          const { data, error } = await supabase
            .from('learning_paths')
            .select(ANALYSIS_SELECT)
            .eq('id', pathId)
            .maybeSingle();
          if (run !== runRef.current || completedRef.current) return;
          if (error) throw error;
          pollErrorsRef.current = 0;
          setApiError(null);
          const row = data as Record<string, unknown> | null;
          if (row && COMPLETE_STATUSES.has(row.status as string)) {
            void handleCompletion(pathId, row);
            return;
          }
          if (row?.status === 'failed' && startConfirmedRef.current) {
            showFailed(row);
            return;
          }
          // Hängender Lauf (Worker beendet, Stufe 2 nie angekommen …) → einmal neu anstoßen.
          // Die Edge Function lässt einen Neustart erst nach 6 Min. Sperrzeit zu.
          const triggeredAt = typeof row?.triggered_at === 'string' ? Date.parse(row.triggered_at) : NaN;
          if (
            row?.status === 'analyzing' && row.skillgap_paid === true && !restartedRef.current &&
            Number.isFinite(triggeredAt) && Date.now() - triggeredAt > STUCK_AFTER_MS
          ) {
            restartedRef.current = true;
            console.warn('[CVSection] Analyse hängt – starte automatisch neu');
            requestAnalysisStart(pathId, run).catch((e) => console.warn('[CVSection] Auto-Neustart:', e?.message));
          }
        } catch (e: any) {
          if (run !== runRef.current || completedRef.current) return;
          pollErrorsRef.current += 1;
          console.warn('[CVSection] Poll exception:', e?.message);
          // Einzelne Netzwerkaussetzer nicht anzeigen – erst ab 3 Fehlern in Folge
          if (pollErrorsRef.current >= 3) {
            setApiError('Verbindung zum Server unterbrochen. Wir versuchen es automatisch weiter.');
          }
        }
        if (run !== runRef.current || completedRef.current) return;
        if (pollCountRef.current < POLL_MAX) {
          pollTimerRef.current = setTimeout(
            tick,
            pollCountRef.current < POLL_SLOW_AFTER ? POLL_INTERVAL_MS : POLL_SLOW_INTERVAL_MS,
          );
        } else {
          cleanupListeners();
          setSlowHint(false);
          setPhase('fallback');
        }
      };
      pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    },
    [handleCompletion, showFailed, requestAnalysisStart, cleanupListeners],
  );

  // ── Realtime ────────────────────────────────────────────────────────────────

  const startRealtime = useCallback(
    (pathId: string) => {
      const run = runRef.current;
      const ch = supabase
        .channel(`cv_section_${pathId}_${Date.now()}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'learning_paths', filter: `id=eq.${pathId}` },
          (payload) => {
            if (run !== runRef.current || completedRef.current) return;
            const row = payload.new as Record<string, unknown>;
            if (COMPLETE_STATUSES.has(row?.status as string)) {
              // Realtime liefert große JSON-Spalten u. U. gekürzt → handleCompletion lädt bei Bedarf nach
              void handleCompletion(pathId, row);
            } else if (row?.status === 'failed' && startConfirmedRef.current) {
              showFailed(row);
            }
          })
        .subscribe();
      channelRef.current = ch;
    },
    [handleCompletion, showFailed],
  );

  /** Loader zeigen + Realtime/Polling starten. runRef muss bereits gesetzt sein. */
  const beginObserving = useCallback((pathId: string) => {
    const run = runRef.current;
    setPhase('waiting');
    setSlowHint(false);
    startRealtime(pathId);
    startPolling(pathId);
    slowTimerRef.current = setTimeout(() => {
      if (run === runRef.current && !completedRef.current) setSlowHint(true);
    }, SLOW_HINT_MS);
  }, [startRealtime, startPolling]);

  // ── CV-Extraktion — läuft erst NACH der Zahlung ──────────────────────────────

  /** Triggert die Extraktion für eine abgelegte CV-Zeile und wartet auf cv_data. */
  const waitForCvData = useCallback(async (cvId: string, ownerId: string | null): Promise<string> => {
    const { data: existing } = await supabase
      .from('stored_cvs').select('cv_data').eq('id', cvId).maybeSingle();
    if (existing?.cv_data != null) return existing.cv_data as string;

    await triggerCvExtraction(cvId, 'skill', ownerId);

    for (let i = 0; i < CV_DATA_POLL_MAX; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const { data } = await supabase
        .from('stored_cvs').select('cv_data,status').eq('id', cvId).maybeSingle();
      if (data?.status === 'failed') throw new Error('Dein Lebenslauf konnte nicht gelesen werden.');
      if (data?.cv_data != null) return data.cv_data as string;
    }
    throw new Error('Dein Lebenslauf konnte nicht gelesen werden. Bitte kontaktiere den Support.');
  }, []);

  // ── Run analysis ────────────────────────────────────────────────────────────

  const runAnalysis = useCallback(async () => {
    if (authLoading || preparing) return;
    if (!targetJob.trim()) { setFormError('Bitte gib eine Zielposition ein.'); return; }
    if (!looksLikeJobTitle(targetJob)) {
      setFormError('Bitte gib eine echte Berufsbezeichnung ein, z. B. „Projektmanager“ oder „Data Analyst“.');
      return;
    }
    const consentAccepted = await requestConsent('skill-gap');
    if (!consentAccepted) return;
    if (!user?.id) {
      setFormError(null);
      setPendingAnalysis(true);
      setShowLoginModal(true);
      return;
    }
    setFormError(null);
    setApiError(null);
    setResult(null);
    completedRef.current = false;
    setPreparing(true);
    try {
      // Session unmittelbar vor dem Insert frisch abfragen: RLS prüft gegen
      // auth.uid() zum Zeitpunkt des Requests, ein veralteter Context-State
      // würde sonst zu einem stillen RLS-Fehler führen.
      const { data: { user: freshUser }, error: authErr } = await supabase.auth.getUser();
      if (authErr || !freshUser?.id) {
        throw new Error('Deine Sitzung ist abgelaufen. Bitte lade die Seite neu und melde dich erneut an.');
      }

      let resolvedCvId = activeCvId;
      // Datei nur ablegen, NICHT triggern. Vor der Zahlung entstehen so keine
      // KI-Kosten — und die Datei überlebt den Stripe-Redirect.
      if (useNewCv && newCvFile) {
        const up = await uploadCvAndCreateRecord(newCvFile, {
          source: 'skill',
          userId: freshUser.id,
          tempId: null,
          triggerNow: false,
          status: 'draft',
        });
        if (!up.success) throw new Error(up.error);
        if (!up.uploadId) throw new Error('CV-Upload fehlgeschlagen');
        resolvedCvId = up.uploadId;
        setActiveCvId(up.uploadId);
        setCvFileName(newCvFile.name);
        setCvUploadFileName(newCvFile.name);
      }

      const { data: lp, error: insertErr } = await supabase
        .from('learning_paths')
        .insert({
          user_id: freshUser.id,
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
        console.error('[CVSection] Insert-Fehler:', insertErr);
        throw new Error('Analyse konnte nicht gestartet werden: ' + (insertErr?.message ?? 'Unbekannter Fehler'));
      }

      pathIdRef.current = lp.id;
      // Paywall — die Analyse startet erst nach der Zahlung (Resume nach Stripe-Redirect)
      setPhase('paywall');
    } catch (e: any) {
      console.error('[CVSection] runAnalysis error:', e);
      setApiError(e.message || 'Ein unbekannter Fehler ist aufgetreten. Bitte versuche es erneut.');
      setPhase('idle');
    } finally {
      setPreparing(false);
    }
  }, [
    targetJob, targetCompany, industry, visionDescription,
    activeCvId, useNewCv, newCvFile, user, authLoading, preparing, requestConsent,
  ]);

  // ── Analyse (neu) starten und beobachten ────────────────────────────────────

  const triggerSkillgapWebhook = useCallback(async (pathId: string, correctedTargetJob?: string) => {
    cleanupListeners();
    if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    const run = ++runRef.current;
    const active = () => run === runRef.current && !completedRef.current;
    completedRef.current = false;
    restartedRef.current = false;
    startConfirmedRef.current = false;
    pathIdRef.current = pathId;
    setApiError(null);

    // Beobachten VOR dem Aufruf: eine langsame HTTP-Antwort darf ein bereits
    // gespeichertes Ergebnis nicht verdecken.
    beginObserving(pathId);

    try {
      const started = await requestAnalysisStart(pathId, run, correctedTargetJob);
      startConfirmedRef.current = true;
      if (!active()) return;
      if (started?.status === 'failed') {
        showFailed({ target_job: correctedTargetJob || failedRole, error_code: started.error_code });
        return;
      }
      // Auch synchrone Abschlüsse ("done") sofort anzeigen
      const { data: row, error: readError } = await supabase.from('learning_paths')
        .select(ANALYSIS_SELECT).eq('id', pathId).maybeSingle();
      if (!active()) return;
      if (readError) throw readError;
      if (row && COMPLETE_STATUSES.has(row.status)) void handleCompletion(pathId, row);
      else if (row?.status === 'failed') showFailed(row);
    } catch (e: any) {
      startConfirmedRef.current = true;
      if (!active()) return;
      console.warn('[CVSection] Analyse-Aufruf:', e?.message);
      if (e?.status === 402 || e?.status === 401 || e?.status === 404) {
        cleanupListeners();
        setApiError(e.message);
        setPhase('fallback');
        return;
      }
      // Polling läuft weiter: der Server kann trotz HTTP-Fehler fertig werden.
      setApiError('Der Start konnte nicht bestätigt werden. Wir prüfen im Hintergrund weiter, ob dein Ergebnis vorliegt.');
    }
  }, [cleanupListeners, beginObserving, requestAnalysisStart, handleCompletion, showFailed, failedRole]);

  // ── Resume after Stripe redirect or opening an existing analysis ─────────────

  useEffect(() => {
    if (!resumePathId || authLoading || !user?.id) return;
    cleanupListeners();
    let cancelled = false;
    const run = ++runRef.current;
    const active = () => !cancelled && run === runRef.current && !completedRef.current;
    completedRef.current = false;
    restartedRef.current = false;
    startConfirmedRef.current = false;
    pathIdRef.current = resumePathId;
    setResult(null);
    setApiError(null);
    setPhase('waiting');

    void (async () => {
      try {
        const { data, error } = await supabase.from('learning_paths')
          .select(ANALYSIS_SELECT).eq('id', resumePathId).maybeSingle();
        if (!active()) return;
        if (error) throw error;
        if (!data) {
          throw Object.assign(new Error('Analyse nicht gefunden oder für dieses Konto nicht verfügbar.'), { status: 404 });
        }

        setTargetJob(data.target_job ?? '');
        setTargetCompany(data.target_company ?? '');
        setIndustry(data.industry ?? '');

        if (COMPLETE_STATUSES.has(data.status)) {
          await handleCompletion(resumePathId, data);
          return;
        }
        if (data.status === 'failed') {
          startConfirmedRef.current = true;
          showFailed(data);
          return;
        }

        // Nicht bezahlt und nicht frisch von Stripe zurück → Paywall statt Endlos-Warten
        const returningFromStripe = /[?&#]session_id=/.test(window.location.href);
        if (data.skillgap_paid === false && !returningFromStripe) {
          setPhase('paywall');
          return;
        }

        if (data.cv_id) {
          setPhase('cv_uploading');
          try {
            await waitForCvData(data.cv_id, user.id);
          } catch (cvErr) {
            // Die Edge Function meldet einen unlesbaren CV gezielt (CV_UNREADABLE)
            console.warn('[CVSection] CV wait warning:', cvErr);
          }
          if (!active()) return;
        }

        beginObserving(resumePathId);
        const started = await requestAnalysisStart(resumePathId, run);
        startConfirmedRef.current = true;
        if (!active()) return;
        if (started?.status === 'failed') {
          showFailed({ target_job: data.target_job, error_code: started.error_code });
        }
      } catch (e: any) {
        startConfirmedRef.current = true;
        if (!active()) return;
        console.warn('[CVSection] Resume-Fehler:', e);
        setApiError(e?.message || 'Die Analyse konnte nicht gestartet werden.');
        // Bei endgültigen Fehlern Beobachtung stoppen; sonst läuft das Polling weiter
        if (e?.status === 402 || e?.status === 401 || e?.status === 404 || !pollTimerRef.current) {
          cleanupListeners();
          setPhase('fallback');
        }
      }
    })();

    return () => {
      cancelled = true;
      runRef.current += 1;
      cleanupListeners();
      if (revealTimerRef.current) clearTimeout(revealTimerRef.current);
    };
    // Formular-Änderungen dürfen eine bezahlte Analyse nicht neu starten.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumePathId, authLoading, user?.id]);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleRetry = () => {
    if (pathIdRef.current) {
      void triggerSkillgapWebhook(pathIdRef.current);
      return;
    }
    runRef.current += 1;
    cleanupListeners();
    completedRef.current = false;
    pathIdRef.current = null;
    setPhase('idle');
    setApiError(null);
    setResult(null);
  };

  const handleRoleFix = async () => {
    const pathId = pathIdRef.current;
    const value = roleFix.trim();
    if (!pathId) return;
    if (!looksLikeJobTitle(value)) {
      setRoleFixError('Bitte gib eine echte Berufsbezeichnung ein, z. B. „Projektmanager“ oder „Data Analyst“.');
      return;
    }
    setRoleFixError(null);
    setTargetJob(value);
    await triggerSkillgapWebhook(pathId, value);
  };

  /** Lebenslauf unlesbar → Analyse ohne CV fortsetzen (kostenlos, gleiche Zahlung) */
  const handleContinueWithoutCv = async () => {
    const pathId = pathIdRef.current;
    if (!pathId) return;
    const { error } = await supabase.from('learning_paths')
      .update({ cv_id: null, updated_at: new Date().toISOString() })
      .eq('id', pathId);
    if (error) {
      setApiError('Der Lebenslauf konnte nicht entfernt werden. Bitte kontaktiere den Support.');
      return;
    }
    setActiveCvId(undefined);
    setCvFileName(null);
    await triggerSkillgapWebhook(pathId);
  };

  const handleManualCheck = async () => {
    const pathId = pathIdRef.current;
    if (!pathId) return;
    const run = runRef.current;
    setCheckingNow(true);
    try {
      const { data, error } = await supabase.from('learning_paths')
        .select(ANALYSIS_SELECT).eq('id', pathId).maybeSingle();
      if (run !== runRef.current) return;
      if (error) throw error;
      if (!data) throw new Error('Analyse nicht gefunden oder für dieses Konto nicht verfügbar.');
      if (COMPLETE_STATUSES.has(data.status)) {
        completedRef.current = false;
        await handleCompletion(pathId, data);
        return;
      }
      if (data.status === 'failed') {
        startConfirmedRef.current = true;
        showFailed(data);
        return;
      }
      // Läuft noch und ist nicht hängend → nur weiter beobachten, NICHT doppelt starten
      const triggeredAt = typeof data.triggered_at === 'string' ? Date.parse(data.triggered_at) : NaN;
      const running = data.status === 'analyzing' && Number.isFinite(triggeredAt) && Date.now() - triggeredAt < STUCK_AFTER_MS;
      if (running && phase === 'waiting') {
        setApiError(null);
        return;
      }
      await triggerSkillgapWebhook(pathId);
    } catch (e: any) {
      if (run === runRef.current) setApiError(e.message || 'Das Ergebnis konnte nicht geladen werden.');
    } finally {
      setCheckingNow(false);
    }
  };


  // ── Derived ─────────────────────────────────────────────────────────────────

  const isCvUploading = phase === 'cv_uploading';
  const isAnalyzing   = phase === 'waiting' || phase === 'revealing';
  const showLoader    = isCvUploading || isAnalyzing;
  const showResult    = phase === 'done' && result !== null;
  const showForm      = !showLoader && phase !== 'done' && phase !== 'fallback' && phase !== 'paywall' && phase !== 'failed';
  const canSubmit     = !!targetJob.trim() && !showLoader && !authLoading;

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

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <FollowRewardPopup
        open={followPopupOpen}
        onClose={() => setFollowPopupOpen(false)}
        onContinue={() => setFollowPopupOpen(false)}
      />

      {/* CV extraction loader (nach der Zahlung) */}
      {isCvUploading && <CvUploadLoader fileName={cvUploadFileName} />}

      {/* Vision analysis loader */}
      {isAnalyzing && (
        <AnalysisLoader
          messages={dynamicMessages}
          success={phase === 'revealing'}
          slow={slowHint}
          checking={checkingNow}
          onCheckNow={handleManualCheck}
        />
      )}

      {/* Fallback */}
      {phase === 'fallback' && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-amber-300">Dein Ergebnis liegt noch nicht vor</p>
              <p className="text-sm text-white/55">
                Deine Analyse ist gespeichert und bezahlt – es entstehen keine weiteren Kosten.
                Klicke auf „Ergebnis laden“. Läuft sie nicht mehr, wird sie automatisch neu gestartet.
              </p>
            </div>
          </div>
          <div className="flex gap-3 flex-wrap">
            <button onClick={handleManualCheck} disabled={checkingNow}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-200 hover:bg-amber-500/30 transition-all font-medium text-sm disabled:opacity-50">
              <Eye size={16} /> {checkingNow ? 'Prüfe …' : 'Ergebnis laden'}
            </button>
            <button onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 transition-all font-medium text-sm">
              <RefreshCw size={16} /> Erneut starten
            </button>
          </div>
        </div>
      )}

      {/* Analyse abgebrochen */}
      {phase === 'failed' && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <AlertCircle size={22} className="text-red-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              {failCode === 'UNKNOWN_ROLE' ? (
                <>
                  <p className="font-semibold text-red-300">Zielposition nicht erkannt</p>
                  <p className="text-sm text-white/60">
                    „{failedRole}“ konnten wir keiner Berufsbezeichnung zuordnen. Gib deine Zielposition noch einmal ein –
                    die Analyse startet dann neu, ohne zusätzliche Kosten.
                  </p>
                </>
              ) : failCode === 'CV_UNREADABLE' ? (
                <>
                  <p className="font-semibold text-red-300">Dein Lebenslauf konnte nicht gelesen werden</p>
                  <p className="text-sm text-white/60">
                    Aus der Datei ließ sich kaum Text auslesen (z. B. ein eingescanntes PDF). Du kannst die Analyse
                    ohne Lebenslauf fortsetzen – ohne zusätzliche Kosten.
                  </p>
                </>
              ) : (
                <>
                  <p className="font-semibold text-red-300">Die Analyse wurde unterbrochen</p>
                  <p className="text-sm text-white/60">
                    Das lag an uns, nicht an dir. Starte sie einfach neu – ohne zusätzliche Kosten.
                  </p>
                  <details className="text-[11px] text-white/40 pt-1">
                    <summary className="cursor-pointer hover:text-white/60">Technische Details</summary>
                    <p className="mt-1 font-mono break-all">
                      {failCode}{failDetail ? ` · ${failDetail}` : ''}
                    </p>
                  </details>
                </>
              )}
            </div>
          </div>

          {failCode === 'UNKNOWN_ROLE' ? (
            <div className="space-y-2">
              <div className="flex gap-3 flex-wrap">
                <input
                  value={roleFix}
                  onChange={(e) => { setRoleFix(e.target.value); setRoleFixError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleRoleFix(); }}
                  placeholder="z. B. Projektmanager, Data Analyst, Pflegefachkraft"
                  maxLength={120}
                  className="flex-1 min-w-[220px] px-4 py-2.5 rounded-xl bg-white/5 border border-white/15 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#30E3CA]/60"
                />
                <button onClick={handleRoleFix} disabled={!roleFix.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}>
                  <RefreshCw size={16} /> Analyse starten
                </button>
              </div>
              {roleFixError && <p className="text-xs text-red-300">{roleFixError}</p>}
            </div>
          ) : failCode === 'CV_UNREADABLE' ? (
            <div className="flex gap-3 flex-wrap">
              <button onClick={handleContinueWithoutCv}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-black"
                style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}>
                <Sparkles size={16} /> Ohne Lebenslauf fortsetzen
              </button>
              <button onClick={handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white/70 hover:bg-white/20 transition-all font-medium text-sm">
                <RefreshCw size={16} /> Erneut versuchen
              </button>
            </div>
          ) : (
            <button onClick={handleRetry}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-200 hover:bg-red-500/30 transition-all font-medium text-sm">
              <RefreshCw size={16} /> Kostenlos neu starten
            </button>
          )}
        </div>
      )}

      {/* Results */}
      {showResult && result && <SkillGapResultView result={result} />}

      {/* SkillGap paywall */}
      {phase === 'paywall' && pathIdRef.current && (
        <SkillGapPaywall
          isOpen
          onClose={() => { pathIdRef.current = null; setPhase('idle'); }}
          learningPathId={pathIdRef.current}
          targetJob={targetJob}
          targetCompany={targetCompany || undefined}
        />
      )}

      {/* Login modal */}
      <RegisterModal
        isOpen={showLoginModal}
        onClose={() => { setShowLoginModal(false); setPendingAnalysis(false); }}
        onSuccess={() => { setShowLoginModal(false); }}
        initialMode="signup"
      />

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
              <div className="space-y-2">
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
                <button
                  type="button"
                  onClick={() => { setActiveCvId(undefined); setCvFileName(null); }}
                  className="text-xs text-white/30 hover:text-white/60 transition-colors flex items-center gap-1.5 px-1"
                >
                  <X size={11} /> Ohne Lebenslauf starten
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
                      disabled={!canSubmit || preparing}
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
                              Bereit — klicke auf "CV hochladen & Vision analysieren"
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
            disabled={!canSubmit || preparing}
            className="group relative w-full py-4 rounded-xl font-black text-lg text-black flex items-center justify-center gap-3 overflow-hidden transition-all duration-200 hover:scale-[1.015] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)', animation: canSubmit && !preparing ? 'ctaPulse 2.5s ease-in-out infinite' : 'none' }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.18),transparent)', backgroundSize: '200% 100%', animation: canSubmit && !preparing ? 'shimmer 2s ease-in-out infinite' : 'none' }} />
            <Sparkles className="w-5 h-5 relative z-10 group-hover:rotate-12 transition-transform duration-300" />
            <span className="relative z-10">
              {preparing
                ? 'Lebenslauf wird vorbereitet…'
                : newCvFile ? 'CV hochladen & Vision analysieren' : (useNewCv ? 'Ohne CV analysieren' : 'Vision analysieren')}
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

      <DsgvoConsentDialog
        isOpen={pendingType === 'skill-gap'}
        type="skill-gap"
        onAccept={handleAccept}
        onDecline={handleDecline}
      />
    </div>
  );
}
