import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { careerService } from '../services/careerService';

// ── Constants ──────────────────────────────────────────────────────────────────

const CURRICULUM_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_CURRICULUM || '';
const COMPLETE_STATUSES = new Set(['curriculum_ready', 'completed']);
// Statuses that mean the curriculum is already being generated or done — don't re-trigger
const ALREADY_TRIGGERED_STATUSES = new Set(['curriculum_ready', 'completed', 'in_progress']);
const POLL_INTERVAL_MS = 3_000;
const POLL_MAX = 80;

// ── Keyframes ─────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes lpw_fadeUp   { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
  @keyframes lpw_fadeIn   { from { opacity:0; } to { opacity:1; } }
  @keyframes lpw_orbDrift { 0%,100% { transform:translate(0,0) scale(1); } 40% { transform:translate(18px,-14px) scale(1.08); } 70% { transform:translate(-10px,18px) scale(0.94); } }
  @keyframes lpw_orbDrift2{ 0%,100% { transform:translate(0,0) scale(1); } 35% { transform:translate(-20px,12px) scale(0.92); } 65% { transform:translate(14px,-18px) scale(1.06); } }
  @keyframes lpw_spin     { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
  @keyframes lpw_ping     { 0%   { transform:scale(1);   opacity:0.5; } 100% { transform:scale(1.8); opacity:0; } }
  @keyframes lpw_shimmer  { 0%   { background-position:-300% 0; } 100% { background-position:300% 0; } }
  @keyframes lpw_gradShift{ 0%,100% { background-position:0% 50%; } 50% { background-position:100% 50%; } }
  @keyframes lpw_pulse    { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
  @keyframes lpw_progressBar { from { width:0%; } to { width:var(--target-width); } }
  @keyframes lpw_checkPop { 0%   { transform:scale(0) rotate(-20deg); opacity:0; }
                            60%  { transform:scale(1.2) rotate(4deg); opacity:1; }
                            100% { transform:scale(1) rotate(0deg); opacity:1; } }
  @keyframes lpw_ticker   { 0%   { opacity:0; transform:translateY(8px); }
                            15%,85% { opacity:1; transform:translateY(0); }
                            100% { opacity:0; transform:translateY(-8px); } }
`;

// ── DYD / Harmony content ─────────────────────────────────────────────────────
// ARCS: Relevance — content directly related to user's career journey context

const DYD_FACTS = [
  {
    tag: 'Über DYD',
    heading: 'KI trifft Karriere',
    body: 'Design Your Dream entstand aus dem Glauben, dass jeder Mensch seinen perfekten Karriereweg deserves — ausgestattet mit den richtigen Skills, zur richtigen Zeit.',
    accent: '#30E3CA',
  },
  {
    tag: 'Harmony Festival',
    heading: 'Wo Lernen feiert',
    body: 'Das Harmony Festival ist unser jährliches Event, bei dem Community, Musik und Karriere-Workshops zusammenkommen. Lernende feiern ihren Fortschritt gemeinsam.',
    accent: '#f97316',
  },
  {
    tag: 'Unser Ansatz',
    heading: 'ESCO-validierte Lernpfade',
    body: 'Alle Skills und Lernmodule sind gegen die ESCO-Datenbank der EU validiert — garantiert marktrelevant und anerkannt von Arbeitgebern in ganz Europa.',
    accent: '#22c55e',
  },
  {
    tag: 'Community',
    heading: '10.000+ Karriere-Moves',
    body: 'Mehr als zehntausend Menschen haben mit DYD ihre nächste Karrierestufe erreicht. Dein personalisierter Lernpfad basiert auf echten Erfolgsmustern.',
    accent: '#f59e0b',
  },
  {
    tag: 'Qualität',
    heading: 'Kein Bulking — nur Fokus',
    body: 'Wir kuratieren nur Ressourcen mit nachgewiesenem Lernerfolg. Keine generischen YouTube-Listen — sondern geprüfte Kurse, Bücher und Praxisprojekte.',
    accent: '#38bdf8',
  },
];

// ARCS: Attention — processing steps keep attention alive
const PROCESS_STEPS = [
  { id: 'unlock',    label: 'Zahlung bestätigt',           detail: 'Dein Lernpfad wird aktiviert…' },
  { id: 'skills',   label: 'Skill-Gaps werden strukturiert', detail: 'Priorisiere kritische Lernbereiche…' },
  { id: 'modules',  label: 'Module werden erstellt',       detail: 'Maßgeschneiderte Inhalte für dein Ziel…' },
  { id: 'resources',label: 'Ressourcen werden kuratiert',  detail: 'Hochwertige Kurse, Artikel & Videos…' },
  { id: 'milestones',label: 'Meilensteine gesetzt',        detail: 'Messbare Fortschrittsziele…' },
  { id: 'timeline', label: 'Zeitplan optimiert',           detail: 'Realistischer Lernplan für dich…' },
  { id: 'cert',     label: 'Zertifikat vorbereitet',       detail: 'Deine Leistung wird dokumentiert…' },
  { id: 'done',     label: 'Lernpfad wird finalisiert',    detail: 'Letzte Abstimmung auf dein Profil…' },
];

// ── Smart progress bar (non-linear, CLT: reduces uncertainty anxiety) ──────────

function ProgressBar({ done }: { done: boolean }) {
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
    const tick = (now: number) => {
      if (!startRef.current) startRef.current = now;
      const e = now - startRef.current;
      // Fast early progress (attention), slow middle (patience), near-complete signals arrival
      const target = e < 12_000 ? (e / 12_000) * 55
        : e < 80_000 ? 55 + ((e - 12_000) / 68_000) * 28
        : 83;
      pctRef.current += (target - pctRef.current) * 0.035;
      setPct(Math.min(pctRef.current, 83));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [done]);

  const display = done ? 100 : Math.round(Math.min(pct, 83));

  return (
    <div className="w-full space-y-2">
      <div className="flex justify-between items-center text-xs">
        <span className="font-semibold text-white/45">{done ? 'Lernpfad bereit!' : 'Wird erstellt…'}</span>
        <span className="font-black tabular-nums" style={{ color: done ? '#22c55e' : '#30E3CA' }}>{display}%</span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full"
          style={{
            width: `${display}%`,
            background: done
              ? 'linear-gradient(90deg,#22c55e,#4ade80)'
              : 'linear-gradient(90deg,#66c0b6,#30E3CA,#7dd3fc)',
            backgroundSize: '300% 100%',
            animation: done ? 'none' : 'lpw_gradShift 2.5s ease infinite, lpw_shimmer 1.8s ease-in-out infinite',
            transition: 'width 0.5s ease',
          }}
        />
      </div>
    </div>
  );
}

// ── Radar visualization (DSR: visual metaphor for active scan) ─────────────────

function RadarViz({ done }: { done: boolean }) {
  const accent = done ? '#22c55e' : '#30E3CA';
  return (
    <div className="relative w-[120px] h-[120px] flex-shrink-0 select-none">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <defs>
          <radialGradient id="lpwRg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={accent} stopOpacity={done ? '0.2' : '0.1'} />
            <stop offset="100%" stopColor={accent} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="lpwSw" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={accent} stopOpacity="0" />
            <stop offset="100%" stopColor={accent} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="55" fill="url(#lpwRg)" />
        {[48, 35, 22, 10].map((r) => (
          <circle key={r} cx="60" cy="60" r={r} fill="none" stroke={accent} strokeOpacity="0.18" strokeWidth="0.8" />
        ))}
        <line x1="60" y1="5" x2="60" y2="115" stroke={accent} strokeOpacity="0.1" strokeWidth="0.8" />
        <line x1="5" y1="60" x2="115" y2="60" stroke={accent} strokeOpacity="0.1" strokeWidth="0.8" />
        {!done ? (
          <g style={{ transformOrigin: '60px 60px', animation: 'lpw_spin 2s linear infinite' }}>
            <path d="M60,60 L60,12" stroke="url(#lpwSw)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M60,60 L60,12 A48,48 0 0,1 101,84 Z" fill={accent} fillOpacity="0.08" />
          </g>
        ) : (
          <g>
            <circle cx="60" cy="60" r="20" fill="#22c55e" fillOpacity="0.12" stroke="#22c55e" strokeWidth="1.5" />
            <polyline points="50,60 57,68 72,52" fill="none" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: 'lpw_checkPop 0.5s ease forwards' }} />
          </g>
        )}
        {[{cx:40,cy:38,d:0},{cx:82,cy:45,d:0.6},{cx:52,cy:82,d:1.1},{cx:86,cy:72,d:1.7}].map(({cx,cy,d},i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill={accent}
            style={{ animation: 'lpw_pulse 2s ease-in-out infinite', animationDelay: `${d}s` }} />
        ))}
      </svg>
    </div>
  );
}

// ── Fact card rotator (ARCS: Relevance + Satisfaction) ────────────────────────

function FactCard({ done }: { done: boolean }) {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % DYD_FACTS.length);
        setVisible(true);
      }, 400);
    }, 6_000);
    return () => clearInterval(id);
  }, [done]);

  const fact = DYD_FACTS[idx];

  return (
    <div
      className="rounded-2xl p-5 space-y-2.5 transition-all duration-400"
      style={{
        background: `linear-gradient(135deg,${fact.accent}09,rgba(6,7,15,0.97))`,
        border: `1px solid ${fact.accent}25`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
      }}
    >
      <div className="flex items-center gap-2">
        <span
          className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
          style={{ background: `${fact.accent}15`, color: fact.accent, border: `1px solid ${fact.accent}25` }}
        >
          {fact.tag}
        </span>
      </div>
      <h4 className="text-base font-black text-white leading-snug">{fact.heading}</h4>
      <p className="text-xs text-white/55 leading-relaxed">{fact.body}</p>
      {/* Dot indicator — DSR: navigation cue */}
      <div className="flex gap-1 pt-1">
        {DYD_FACTS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === idx ? '16px' : '6px',
              height: '4px',
              background: i === idx ? fact.accent : 'rgba(255,255,255,0.15)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Process steps (CLT: chunked task schema) ───────────────────────────────────

function ProcessSteps({ stepIdx, done }: { stepIdx: number; done: boolean }) {
  const accent = done ? '#22c55e' : '#30E3CA';
  return (
    <div className="space-y-1.5">
      {PROCESS_STEPS.slice(0, 6).map((step, i) => {
        const completed = done || i < stepIdx;
        const active    = !done && i === stepIdx;
        return (
          <div
            key={step.id}
            className="flex items-center gap-2.5"
            style={{ opacity: completed || active ? 1 : 0.28, transition: 'opacity 0.5s' }}
          >
            <div
              className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
              style={{
                background: completed ? '#22c55e22' : active ? `${accent}20` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${completed ? '#22c55e' : active ? accent : 'rgba(255,255,255,0.1)'}`,
              }}
            >
              {completed ? (
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <polyline points="1,4 3,6 7,2" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : active ? (
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent, animation: 'lpw_pulse 1s ease-in-out infinite' }} />
              ) : (
                <div className="w-1 h-1 rounded-full bg-white/20" />
              )}
            </div>
            <span
              className={`text-xs truncate ${completed ? 'text-white/35 line-through' : active ? 'text-white/90 font-bold' : 'text-white/22'}`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function LearningPathWaitingPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [stepIdx, setStepIdx]         = useState(0);
  const [done, setDone]               = useState(false);
  const [targetJob, setTargetJob]     = useState('deinem Ziel');
  const [tickerMsg, setTickerMsg]     = useState(PROCESS_STEPS[0].label);
  const [tickerVisible, setTickerVisible] = useState(true);

  const completedRef  = useRef(false);
  const pollTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef  = useRef(0);
  const channelRef    = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const cleanupListeners = useCallback(() => {
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
  }, []);

  const handleReady = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    cleanupListeners();
    setDone(true);
    // CLT: short celebration pause before navigating (Satisfaction)
    await new Promise(r => setTimeout(r, 1_800));
    navigate(`/learning-path/${pathId}`, { replace: true });
  }, [cleanupListeners, navigate, pathId]);

  // Advance step ticker every 4s (ARCS: Attention — visible progress)
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setStepIdx(i => {
          const next = (i + 1) % PROCESS_STEPS.length;
          setTickerMsg(PROCESS_STEPS[next].label);
          return next;
        });
        setTickerVisible(true);
      }, 350);
    }, 4_200);
    return () => clearInterval(id);
  }, [done]);

  useEffect(() => {
    if (!pathId) { navigate('/', { replace: true }); return; }

    const parseSkills = (raw: unknown): unknown[] => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [p]; } catch { /* */ }
        try { return JSON.parse(`[${raw}]`); } catch { /* */ }
      }
      return [];
    };

    supabase.from('learning_paths').select('*').eq('id', pathId).maybeSingle()
      .then(async ({ data }) => {
        if (!data) { navigate('/', { replace: true }); return; }
        if (data.target_job) setTargetJob(data.target_job);

        // 1. Always ensure is_paid = true (idempotent — safe to call multiple times)
        if (!data.is_paid) {
          try { await careerService.unlockLearningPath(pathId); } catch { /* non-fatal */ }
        }

        // 2. Re-fetch fresh state after potential unlock
        const { data: fresh } = await supabase.from('learning_paths').select('*').eq('id', pathId).maybeSingle();
        const path = fresh ?? data;

        // 3. If curriculum already complete → navigate immediately (handles page revisit)
        if (COMPLETE_STATUSES.has(path.status) || (path.curriculum && (path.curriculum as any)?.modules?.length > 0)) {
          handleReady();
          return;
        }

        // 4. Only trigger curriculum webhook if not already triggered
        //    (gap_analysis_complete = analysis done but curriculum not yet started)
        const alreadyTriggered = ALREADY_TRIGGERED_STATUSES.has(path.status);
        if (!alreadyTriggered && CURRICULUM_WEBHOOK_URL) {
          try {
            await fetch(CURRICULUM_WEBHOOK_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                learning_path_id: pathId,
                missing_skills: parseSkills(path.missing_skills),
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
            // Mark as in_progress so revisiting doesn't re-trigger
            await supabase.from('learning_paths').update({ status: 'in_progress' }).eq('id', pathId);
          } catch (e: any) { console.warn('[WaitingPage] curriculum webhook error:', e.message); }
        }

        // 5. Realtime subscription — listen for completion
        const ch = supabase.channel(`lpw_${pathId}_${Date.now()}`)
          .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'learning_paths', filter: `id=eq.${pathId}` },
            (payload) => {
              if (COMPLETE_STATUSES.has((payload.new as any)?.status)) handleReady();
            })
          .subscribe();
        channelRef.current = ch;

        // 6. Polling fallback
        const tick = async () => {
          if (completedRef.current) return;
          if (pollCountRef.current >= POLL_MAX) return;
          pollCountRef.current += 1;
          const { data: row } = await supabase.from('learning_paths').select('status,curriculum').eq('id', pathId).maybeSingle();
          if (row && (COMPLETE_STATUSES.has(row.status) || (row.curriculum as any)?.modules?.length > 0)) {
            handleReady();
            return;
          }
          if (!completedRef.current) pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        };
        pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
      });

    return () => cleanupListeners();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId]);

  const currentStep = PROCESS_STEPS[stepIdx];

  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: 'linear-gradient(160deg,#04050d 0%,#06070f 50%,#040508 100%)' }}>
      <style>{STYLES}</style>

      {/* Ambient background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] rounded-full opacity-[0.055]"
          style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', top: '-200px', right: '-150px', animation: 'lpw_orbDrift 12s ease-in-out infinite' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-[0.04]"
          style={{ background: 'radial-gradient(circle,#66c0b6,transparent)', bottom: '-100px', left: '-150px', animation: 'lpw_orbDrift2 15s ease-in-out infinite' }} />
        <div className="absolute w-[300px] h-[300px] rounded-full opacity-[0.03]"
          style={{ background: 'radial-gradient(circle,#f97316,transparent)', top: '40%', left: '35%' }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12 sm:py-16 space-y-6">

        {/* ── HEADER: ARCS Attention — strong brand + personal relevance ── */}
        <div className="text-center space-y-3" style={{ animation: 'lpw_fadeUp 0.6s ease' }}>
          {/* DYD logo area */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,rgba(48,227,202,0.15),rgba(102,192,182,0.08))', border: '1px solid rgba(48,227,202,0.25)' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#30E3CA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                <path d="M2 17l10 5 10-5"/>
                <path d="M2 12l10 5 10-5"/>
              </svg>
            </div>
          </div>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">Design Your Dream</p>

          {done ? (
            <div style={{ animation: 'lpw_checkPop 0.5s ease forwards' }}>
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Dein Lernpfad ist bereit!
              </h1>
              <p className="text-white/55 text-base mt-2">Du wirst gleich weitergeleitet…</p>
            </div>
          ) : (
            <>
              {/* ARCS: Relevance — shows the user's own goal */}
              <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                Dein Lernpfad für
                <br />
                <span style={{ background: 'linear-gradient(90deg,#30E3CA,#66c0b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {targetJob}
                </span>
              </h1>
              <p className="text-white/50 text-sm mt-1 leading-relaxed max-w-sm mx-auto">
                Unsere KI erstellt gerade deinen personalisierten Lernpfad — auf Basis deiner Skill-Gaps und Marktdaten 2026.
              </p>
            </>
          )}
        </div>

        {/* ── MAIN TRACKER: CLT — radar + steps side-by-side, one focal point ── */}
        <div
          className="rounded-3xl overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', animation: 'lpw_fadeUp 0.7s ease' }}
        >
          <div className="p-5 sm:p-6 space-y-5">

            {/* Radar + steps */}
            <div className="flex gap-5 items-start">
              <RadarViz done={done} />
              <div className="flex-1 min-w-0">
                <ProcessSteps stepIdx={stepIdx} done={done} />
              </div>
            </div>

            {/* Active ticker: ARCS Attention — animated current step */}
            <div
              className="rounded-xl px-4 py-3 flex items-center gap-3 min-h-[54px]"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <div
                className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: done ? 'rgba(34,197,94,0.15)' : 'rgba(48,227,202,0.12)', border: `1px solid ${done ? '#22c55e40' : 'rgba(48,227,202,0.3)'}` }}
              >
                {done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10">
                    <polyline points="2,5 4,7 8,3" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-[#30E3CA]" style={{ animation: 'lpw_pulse 1s ease-in-out infinite' }} />
                )}
              </div>
              <div className="flex-1 overflow-hidden">
                <p
                  className="text-sm font-bold text-white leading-snug"
                  style={{ animation: tickerVisible ? 'lpw_ticker 4.2s ease forwards' : 'none', opacity: tickerVisible ? undefined : 0 }}
                >
                  {done ? 'Lernpfad fertiggestellt!' : tickerMsg}
                </p>
                {!done && (
                  <p className="text-[10px] text-white/35 mt-0.5">{currentStep.detail}</p>
                )}
              </div>
              {done && (
                <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0">
                  <circle cx="9" cy="9" r="8" fill="#22c55e18" stroke="#22c55e" strokeWidth="1.5" />
                  <polyline points="5.5,9 7.5,11.5 12.5,6.5" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              )}
            </div>

            {/* Progress bar */}
            <ProgressBar done={done} />
          </div>
        </div>

        {/* ── FACT CARDS: ARCS Relevance + Satisfaction — DYD/Harmony info ── */}
        {/* CLT: Secondary info in own chunk — does not compete with progress */}
        <div style={{ animation: 'lpw_fadeUp 0.9s ease' }}>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25 mb-3 px-1">Während du wartest</p>
          <FactCard done={done} />
        </div>

        {/* ── SOCIAL PROOF: ARCS Confidence — reduces doubt during wait ── */}
        <div
          className="rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'rgba(48,227,202,0.04)', border: '1px solid rgba(48,227,202,0.12)', animation: 'lpw_fadeUp 1.0s ease' }}
        >
          {/* Avatar stack */}
          <div className="flex -space-x-2 flex-shrink-0">
            {['#f97316','#30E3CA','#22c55e','#38bdf8'].map((c, i) => (
              <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 border-[#06070f]"
                style={{ background: `${c}22`, color: c, borderColor: '#06070f' }}>
                {['M','J','L','S'][i]}
              </div>
            ))}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">10.000+ Karriere-Moves</p>
            <p className="text-[11px] text-white/40 mt-0.5">Menschen haben mit DYD ihre nächste Stufe erreicht.</p>
          </div>
        </div>

        {/* ── HARMONY FESTIVAL teaser ── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.07),rgba(6,7,15,0.97))', border: '1px solid rgba(249,115,22,0.18)', animation: 'lpw_fadeUp 1.1s ease' }}
        >
          <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(249,115,22,0.5),transparent)' }} />
          <div className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(249,115,22,0.12)', border: '1px solid rgba(249,115,22,0.25)' }}>
              <span className="text-lg">🎪</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-white">Harmony Festival 2026</p>
              <p className="text-[11px] text-white/45 mt-0.5 leading-relaxed">
                Feiere deinen Karriere-Fortschritt — Community, Live-Acts & Workshops an einem Ort.
              </p>
            </div>
            <button
              onClick={() => navigate('/festival')}
              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105"
              style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316', border: '1px solid rgba(249,115,22,0.25)' }}
            >
              Mehr erfahren
            </button>
          </div>
        </div>

        {/* Small reassurance note */}
        <p className="text-center text-[10px] text-white/20 pb-4">
          Diese Seite aktualisiert sich automatisch — du kannst das Fenster geöffnet lassen.
        </p>
      </div>
    </div>
  );
}
