import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
// Note: useSearchParams removed — waiting page no longer reads search params

// ── Constants ──────────────────────────────────────────────────────────────────

// Hardcoded as ultimate fallback
const WEBHOOK_URL =
  import.meta.env.VITE_MAKE_WEBHOOK_LEARNINGPATH
  || 'https://hook.eu2.make.com/1pvur1oth8sibonqc3twq57itg2ti1d0';

const POLL_INTERVAL_MS = 4_000;
const POLL_MAX = 75; // ~5 minutes

// Status where Make has definitively delivered results
const DONE_STATUSES = new Set(['completed']);

// ── Animations ────────────────────────────────────────────────────────────────

const STYLES = `
  @keyframes lpw_up    { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  @keyframes lpw_in    { from { opacity:0; } to { opacity:1; } }
  @keyframes lpw_orb1  { 0%,100%{transform:translate(0,0)scale(1);}45%{transform:translate(20px,-16px)scale(1.07);}75%{transform:translate(-12px,18px)scale(0.95);} }
  @keyframes lpw_orb2  { 0%,100%{transform:translate(0,0)scale(1);}40%{transform:translate(-18px,14px)scale(0.93);}70%{transform:translate(15px,-20px)scale(1.06);} }
  @keyframes lpw_spin  { from{transform:rotate(0deg);}to{transform:rotate(360deg);} }
  @keyframes lpw_pulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }
  @keyframes lpw_grad  { 0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;} }
  @keyframes lpw_pop   { 0%{transform:scale(0)rotate(-20deg);opacity:0;}60%{transform:scale(1.18)rotate(4deg);opacity:1;}100%{transform:scale(1)rotate(0);opacity:1;} }
  @keyframes lpw_tick  { 0%{opacity:0;transform:translateY(8px);}15%,85%{opacity:1;transform:translateY(0);}100%{opacity:0;transform:translateY(-8px);} }
  @keyframes lpw_bar   { from{width:0%;}to{width:var(--w);} }
`;

// ── Process steps — CLT: chunked schema, manageable working memory ─────────────

const STEPS = [
  { id: 'pay',       label: 'Zahlung bestätigt',             detail: 'Dein Zugang wird aktiviert…' },
  { id: 'gaps',      label: 'Skill-Gaps werden analysiert',  detail: 'Priorisiert kritische Lernbereiche…' },
  { id: 'modules',   label: 'Module werden strukturiert',    detail: 'Maßgeschneiderte Lerneinheiten…' },
  { id: 'resources', label: 'Ressourcen werden kuratiert',   detail: 'Geprüfte Kurse, Bücher & Projekte…' },
  { id: 'timeline',  label: 'Zeitplan wird erstellt',        detail: 'Realistischer Plan für dein Tempo…' },
  { id: 'cert',      label: 'Zertifikat wird vorbereitet',   detail: 'Deine Leistung wird dokumentiert…' },
];

// ── ARCS Relevance: facts directly tied to user's career context ───────────────

const FACTS = [
  {
    tag: 'Über DYD',
    heading: 'KI trifft Karriere',
    body: 'Design Your Dream verbindet KI-gestützte Analyse mit echten Marktdaten — für einen Lernpfad, der zu dir und deinem Ziel passt.',
    accent: '#30E3CA',
  },
  {
    tag: 'ESCO-validiert',
    heading: 'EU-anerkannte Kompetenzrahmen',
    body: 'Alle Lernmodule werden gegen die ESCO-Datenbank der Europäischen Union validiert — marktrelevant und von Arbeitgebern in ganz Europa anerkannt.',
    accent: '#22c55e',
  },
  {
    tag: 'Harmony Festival',
    heading: 'Wo Lernen feiert',
    body: 'Das Harmony Festival ist unser jährliches Community-Event — Karriere-Workshops, Live-Acts und Menschen, die ihren nächsten Schritt feiern.',
    accent: '#f97316',
  },
  {
    tag: 'Qualität',
    heading: 'Nur geprüfte Inhalte',
    body: 'Keine generischen YouTube-Playlists — nur Ressourcen mit nachgewiesenem Lernerfolg: geprüfte Kurse, Fachbücher und Praxisprojekte.',
    accent: '#38bdf8',
  },
  {
    tag: 'Dein Zertifikat',
    heading: 'Offiziell & downloadbar',
    body: 'Nach Abschluss aller Module erhältst du ein personalisiertes PDF-Zertifikat mit DQR-Referenz — direkt in dein Dashboard.',
    accent: '#f59e0b',
  },
];

// ── Progress bar — non-linear easing, CLT: reduces uncertainty ────────────────

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
      const target = e < 10_000 ? (e / 10_000) * 52
        : e < 70_000 ? 52 + ((e - 10_000) / 60_000) * 28
        : 80;
      pctRef.current += (target - pctRef.current) * 0.04;
      setPct(Math.min(pctRef.current, 80));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [done]);

  const display = done ? 100 : Math.round(Math.min(pct, 80));

  return (
    <div className="w-full space-y-1.5">
      <div className="flex justify-between items-center text-[11px]">
        <span className="font-semibold text-white/40">{done ? 'Fertig!' : 'KI arbeitet…'}</span>
        <span className="font-black tabular-nums" style={{ color: done ? '#22c55e' : '#30E3CA' }}>{display}%</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${display}%`,
            background: done
              ? 'linear-gradient(90deg,#22c55e,#4ade80)'
              : 'linear-gradient(90deg,#66c0b6,#30E3CA,#7dd3fc)',
            backgroundSize: '300% 100%',
            animation: done ? 'none' : 'lpw_grad 2.5s ease infinite',
            transition: 'width 0.6s ease',
          }}
        />
      </div>
    </div>
  );
}

// ── Radar — DSR: visual schema for active AI scan ─────────────────────────────

function RadarViz({ done }: { done: boolean }) {
  const c = done ? '#22c55e' : '#30E3CA';
  return (
    <div className="relative w-[110px] h-[110px] flex-shrink-0 select-none">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        <defs>
          <radialGradient id="rg" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={c} stopOpacity={done ? '0.18' : '0.08'} />
            <stop offset="100%" stopColor={c} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sw" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor={c} stopOpacity="0" />
            <stop offset="100%" stopColor={c} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r="55" fill="url(#rg)" />
        {[46, 33, 20, 9].map(r => (
          <circle key={r} cx="60" cy="60" r={r} fill="none" stroke={c} strokeOpacity="0.15" strokeWidth="0.8" />
        ))}
        <line x1="60" y1="7" x2="60" y2="113" stroke={c} strokeOpacity="0.1" strokeWidth="0.8" />
        <line x1="7" y1="60" x2="113" y2="60" stroke={c} strokeOpacity="0.1" strokeWidth="0.8" />
        {!done ? (
          <g style={{ transformOrigin: '60px 60px', animation: 'lpw_spin 2.2s linear infinite' }}>
            <path d="M60,60 L60,14" stroke="url(#sw)" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M60,60 L60,14 A46,46 0 0,1 99,83 Z" fill={c} fillOpacity="0.07" />
          </g>
        ) : (
          <g>
            <circle cx="60" cy="60" r="19" fill="#22c55e" fillOpacity="0.1" stroke="#22c55e" strokeWidth="1.5" />
            <polyline points="51,60 57,67 71,52" fill="none" stroke="#22c55e" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round"
              style={{ animation: 'lpw_pop 0.5s ease forwards' }} />
          </g>
        )}
        {[{cx:40,cy:37,d:0},{cx:83,cy:46,d:0.5},{cx:51,cy:81,d:1},{cx:85,cy:71,d:1.6}].map(({cx,cy,d},i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill={c}
            style={{ animation: 'lpw_pulse 2s ease-in-out infinite', animationDelay: `${d}s` }} />
        ))}
      </svg>
    </div>
  );
}

// ── Process steps list — CLT: externalize schema, free working memory ─────────

function StepsList({ activeIdx, done }: { activeIdx: number; done: boolean }) {
  return (
    <div className="space-y-1.5 flex-1 min-w-0">
      {STEPS.map((step, i) => {
        const isCompleted = done || i < activeIdx;
        const isActive    = !done && i === activeIdx;
        return (
          <div key={step.id} className="flex items-center gap-2.5"
            style={{ opacity: isCompleted || isActive ? 1 : 0.25, transition: 'opacity 0.4s' }}>
            <div className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center"
              style={{
                background: isCompleted ? '#22c55e18' : isActive ? 'rgba(48,227,202,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isCompleted ? '#22c55e' : isActive ? '#30E3CA' : 'rgba(255,255,255,0.1)'}`,
              }}>
              {isCompleted ? (
                <svg width="8" height="8" viewBox="0 0 8 8">
                  <polyline points="1.5,4 3,6 6.5,2.5" fill="none" stroke="#22c55e" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : isActive ? (
                <div className="w-1.5 h-1.5 rounded-full bg-[#30E3CA]" style={{ animation: 'lpw_pulse 1s ease-in-out infinite' }} />
              ) : (
                <div className="w-1 h-1 rounded-full bg-white/20" />
              )}
            </div>
            <span className={`text-xs truncate ${isCompleted ? 'text-white/30 line-through' : isActive ? 'text-white/90 font-bold' : 'text-white/20'}`}>
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── Rotating fact card — ARCS Relevance, keeps page alive ─────────────────────

function FactCard({ done }: { done: boolean }) {
  const [idx, setIdx]     = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (done) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % FACTS.length);
        setVisible(true);
      }, 350);
    }, 7_000);
    return () => clearInterval(id);
  }, [done]);

  const f = FACTS[idx];

  return (
    <div
      className="rounded-2xl p-5 space-y-2"
      style={{
        background: `linear-gradient(135deg,${f.accent}08,rgba(5,7,13,0.98))`,
        border: `1px solid ${f.accent}22`,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(5px)',
        transition: 'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest"
        style={{ background: `${f.accent}14`, color: f.accent, border: `1px solid ${f.accent}22` }}>
        {f.tag}
      </span>
      <h4 className="text-sm font-black text-white leading-snug">{f.heading}</h4>
      <p className="text-[11px] text-white/50 leading-relaxed">{f.body}</p>
      {/* Dot nav — DSR: orientation cue */}
      <div className="flex gap-1 pt-1">
        {FACTS.map((_, i) => (
          <div key={i} className="rounded-full transition-all duration-300"
            style={{ width: i === idx ? '14px' : '5px', height: '4px', background: i === idx ? f.accent : 'rgba(255,255,255,0.12)' }} />
        ))}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function LearningPathWaitingPage() {
  const { pathId }  = useParams<{ pathId: string }>();
  const navigate    = useNavigate();

  // Core state
  const [phase, setPhase]         = useState<'loading' | 'waiting' | 'done' | 'error'>('loading');
  const [errorMsg, setErrorMsg]   = useState<string | null>(null);
  const [targetJob, setTargetJob] = useState('deinem Ziel');
  const [retrying, setRetrying]   = useState(false);

  // ARCS Attention: animated step ticker
  const [stepIdx, setStepIdx]             = useState(0);
  const [tickerMsg, setTickerMsg]         = useState(STEPS[0].label);
  const [tickerVisible, setTickerVisible] = useState(true);

  // Refs — stable across renders, no stale closures
  const doneRef       = useRef(false);
  const pollTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollCountRef  = useRef(0);
  const channelRef    = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const pathDataRef   = useRef<Record<string, unknown> | null>(null);

  // ── Cleanup ──────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (channelRef.current) { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
  }, []);

  // ── Terminal states ───────────────────────────────────────────────────────────

  const markDone = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    cleanup();
    setPhase('done');
  }, [cleanup]);

  const markError = useCallback((msg: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    cleanup();
    setErrorMsg(msg);
    setPhase('error');
  }, [cleanup]);

  // ── Step ticker — ARCS Attention ─────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'waiting') return;
    const id = setInterval(() => {
      setTickerVisible(false);
      setTimeout(() => {
        setStepIdx(i => {
          const next = (i + 1) % STEPS.length;
          setTickerMsg(STEPS[next].label);
          return next;
        });
        setTickerVisible(true);
      }, 320);
    }, 4_500);
    return () => clearInterval(id);
  }, [phase]);

  // ── Polling + Realtime — waits for learning_results.status = 'completed' ─────

  const startListening = useCallback(() => {
    if (!pathId) return;
    doneRef.current = false;
    pollCountRef.current = 0;

    // Realtime: subscribe to learning_results (Make writes here) + learning_paths
    const ch = supabase
      .channel(`lpw_${pathId}_${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'learning_results', filter: `id=eq.${pathId}` },
        (payload) => { if ((payload.new as any)?.status === 'completed') markDone(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'learning_results', filter: `id=eq.${pathId}` },
        (payload) => { if ((payload.new as any)?.status === 'completed') markDone(); })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'learning_paths', filter: `id=eq.${pathId}` },
        (payload) => {
          const s = (payload.new as any)?.status as string;
          if (DONE_STATUSES.has(s)) markDone();
          if (s === 'failed') markError('Die KI-Analyse ist fehlgeschlagen. Bitte versuche es erneut.');
        })
      .subscribe();
    channelRef.current = ch;

    // Polling fallback — learning_results is the primary source of truth
    const tick = async () => {
      if (doneRef.current) return;
      if (pollCountRef.current >= POLL_MAX) {
        markError('Der Lernpfad konnte nicht in der erwarteten Zeit erstellt werden. Bitte versuche es erneut.');
        return;
      }
      pollCountRef.current += 1;

      // Primary: check learning_results
      const { data: result } = await supabase
        .from('learning_results').select('status').eq('id', pathId).maybeSingle();
      if (result?.status === 'completed') { markDone(); return; }

      // Fallback: check learning_paths status
      const { data: lp } = await supabase
        .from('learning_paths').select('status').eq('id', pathId).maybeSingle();
      if (lp) {
        if (DONE_STATUSES.has(lp.status)) { markDone(); return; }
        if (lp.status === 'failed') { markError('Die KI-Analyse ist fehlgeschlagen.'); return; }
      }

      if (!doneRef.current) pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
    };
    pollTimerRef.current = setTimeout(tick, POLL_INTERVAL_MS);
  }, [pathId, markDone, markError]);

  // ── Trigger Make webhook ──────────────────────────────────────────────────────

  const triggerMake = useCallback(async (path: Record<string, unknown>): Promise<boolean> => {
    if (!WEBHOOK_URL) {
      console.error('[LPW] No webhook URL configured — cannot trigger Make');
      return false;
    }
    console.log('[LPW] Firing Make webhook:', WEBHOOK_URL);

    const parseSkills = (raw: unknown): unknown[] => {
      if (!raw) return [];
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [p]; } catch { /**/ }
        try { return JSON.parse(`[${raw}]`); } catch { /**/ }
      }
      return [];
    };

    const selectedSkill = (path.selected_skill as string) || null;

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          learning_path_id: pathId,
          selected_skill: selectedSkill,
          // Single path: send only this skill; all-paths: send all gaps
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
      if (!res.ok) {
        console.error('[LPW] Webhook HTTP error:', res.status, await res.text().catch(() => ''));
        return false;
      }
      console.log('[LPW] Make webhook triggered successfully');
      // Mark in_progress so a page refresh doesn't double-trigger
      await supabase.from('learning_paths').update({ status: 'in_progress', updated_at: new Date().toISOString() }).eq('id', pathId);
      return true;
    } catch (e) {
      console.error('[LPW] Webhook fetch failed:', e);
      return false;
    }
  }, [pathId]);

  // ── Boot sequence ─────────────────────────────────────────────────────────────
  //
  // Rule: trigger Make ALWAYS if learning_results has no completed content.
  // learning_paths.status is NEVER used to skip the trigger — it may be stale
  // (e.g. 'completed' from a previous unpaid test run, or 'in_progress' from a
  // failed prior attempt). The ONLY source of truth for "Make is done" is
  // learning_results.status = 'completed'.
  //
  useEffect(() => {
    if (!pathId) { navigate('/', { replace: true }); return; }

    (async () => {
      // Always show waiting UI immediately — no blank screen ever
      setPhase('waiting');

      // 1. Fetch learning path data for the webhook payload
      const { data: lp } = await supabase
        .from('learning_paths').select('*').eq('id', pathId).maybeSingle();
      if (!lp) { navigate('/dashboard', { replace: true }); return; }

      if (lp.target_job) setTargetJob(lp.target_job);
      pathDataRef.current = lp as Record<string, unknown>;

      // 2. Check learning_results — this is the single source of truth
      const { data: result } = await supabase
        .from('learning_results')
        .select('status, final_exam')
        .eq('id', pathId)
        .maybeSingle();

      // Make already delivered → show done immediately
      if (result?.status === 'completed' || result?.final_exam) {
        console.log('[WaitingPage] learning_results already completed — skipping trigger');
        markDone();
        return;
      }

      // 3. learning_results has NO content → always trigger Make
      //    This handles: first purchase, re-purchase, "all paths" plan, any status on learning_paths
      console.log('[WaitingPage] No learning_results content — triggering Make webhook | lp.status:', lp.status);
      const ok = await triggerMake(lp as Record<string, unknown>);
      if (!ok) {
        markError('Der Lernpfad konnte nicht gestartet werden. Bitte versuche es erneut.');
        return;
      }

      // 4. Start listening — wait for learning_results.status = 'completed'
      startListening();
    })();

    return () => cleanup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId]);

  // ── Retry ─────────────────────────────────────────────────────────────────────

  const handleRetry = useCallback(async () => {
    if (!pathId) return;
    setRetrying(true);
    setErrorMsg(null);
    doneRef.current = false;
    pollCountRef.current = 0;

    try {
      // Reset status so trigger condition is met
      await supabase.from('learning_paths')
        .update({ status: 'gap_analysis_complete', updated_at: new Date().toISOString() })
        .eq('id', pathId);
      const { data: fresh } = await supabase.from('learning_paths').select('*').eq('id', pathId).maybeSingle();
      if (!fresh) { setErrorMsg('Pfad nicht gefunden.'); return; }
      pathDataRef.current = fresh as Record<string, unknown>;
      setPhase('waiting');
      console.log('[WaitingPage] Retry — triggering Make webhook');
      const ok = await triggerMake(fresh as Record<string, unknown>);
      if (!ok) { markError('Webhook-Fehler. Bitte lade die Seite neu.'); return; }
      startListening();
    } catch {
      setErrorMsg('Fehler. Bitte lade die Seite neu.');
    } finally {
      setRetrying(false);
    }
  }, [pathId, triggerMake, startListening, markError]);

  const currentStep = STEPS[stepIdx];
  const isDone      = phase === 'done';

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white overflow-x-hidden"
      style={{ background: 'linear-gradient(160deg,#03040c 0%,#05060e 50%,#030407 100%)' }}>
      <style>{STYLES}</style>

      {/* Ambient orbs — DSR: depth without cognitive cost */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[640px] h-[640px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', top: '-180px', right: '-120px', animation: 'lpw_orb1 13s ease-in-out infinite' }} />
        <div className="absolute w-[480px] h-[480px] rounded-full opacity-[0.035]"
          style={{ background: 'radial-gradient(circle,#66c0b6,transparent)', bottom: '-80px', left: '-130px', animation: 'lpw_orb2 16s ease-in-out infinite' }} />
        <div className="absolute w-[260px] h-[260px] rounded-full opacity-[0.025]"
          style={{ background: 'radial-gradient(circle,#f97316,transparent)', top: '45%', left: '38%' }} />
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 py-12 sm:py-16 space-y-5">

        {/* ── LOADING skeleton — prevents blank screen flash ── */}
        {phase === 'loading' && (
          <div className="space-y-5" style={{ animation: 'lpw_in 0.3s ease' }}>
            <div className="text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl mx-auto animate-pulse" style={{ background: 'rgba(48,227,202,0.1)' }} />
              <div className="h-5 w-32 rounded-full mx-auto animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-8 w-64 rounded-full mx-auto animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-4 w-48 rounded-full mx-auto animate-pulse" style={{ background: 'rgba(255,255,255,0.04)' }} />
            </div>
            <div className="h-48 rounded-3xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
          </div>
        )}

        {/* ── ERROR state ── */}
        {phase === 'error' && (
          <div style={{ animation: 'lpw_up 0.5s ease' }}>
            <div className="text-center mb-8">
              <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center mb-3"
                style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/30">Design Your Dream</p>
            </div>

            <div className="rounded-2xl overflow-hidden"
              style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.22)' }}>
              <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#ef4444,#f97316)' }} />
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-black text-white mb-1">Lernpfad konnte nicht erstellt werden</h2>
                    <p className="text-sm text-white/60 leading-relaxed">{errorMsg}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleRetry} disabled={retrying}
                    className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-black text-sm text-black transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}>
                    {retrying ? (
                      <><div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />Wird wiederholt…</>
                    ) : (
                      <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>Erneut versuchen</>
                    )}
                  </button>
                  <button onClick={() => navigate('/dashboard')}
                    className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm text-white/55 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Zum Dashboard
                  </button>
                </div>

                <p className="text-center text-[11px] text-white/22">
                  Deine Zahlung war erfolgreich — der Lernpfad ist bereits freigeschaltet.<br />
                  Kontakt:{' '}
                  <a href="mailto:support@designyourdream.de"
                    className="text-[#66c0b6]/60 hover:text-[#66c0b6] transition-colors underline">
                    support@designyourdream.de
                  </a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── WAITING + DONE states ── */}
        {(phase === 'waiting' || phase === 'done') && (
          <>
            {/* ── HEADER — ARCS: Attention + Relevance ── */}
            <div className="text-center space-y-2.5" style={{ animation: 'lpw_up 0.6s ease' }}>
              <div className="flex items-center justify-center mb-1">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                  style={{
                    background: isDone
                      ? 'rgba(34,197,94,0.12)'
                      : 'linear-gradient(135deg,rgba(48,227,202,0.14),rgba(102,192,182,0.07))',
                    border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : 'rgba(48,227,202,0.22)'}`,
                    transition: 'all 0.5s ease',
                  }}>
                  {isDone ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ animation: 'lpw_pop 0.5s ease forwards' }}>
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#30E3CA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                      <path d="M2 17l10 5 10-5"/>
                      <path d="M2 12l10 5 10-5"/>
                    </svg>
                  )}
                </div>
              </div>

              <p className="text-[11px] font-black uppercase tracking-[0.2em] text-white/28">Design Your Dream</p>

              {isDone ? (
                <div style={{ animation: 'lpw_pop 0.5s ease forwards' }}>
                  <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                    Dein Lernpfad ist bereit!
                  </h1>
                  <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Lernpfad für{' '}
                    <span className="font-black" style={{ background: 'linear-gradient(90deg,#30E3CA,#66c0b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {targetJob}
                    </span>
                    {' '}wurde erstellt.
                  </p>
                </div>
              ) : (
                <>
                  {/* ARCS Relevance: user sees their own goal */}
                  <h1 className="text-3xl sm:text-4xl font-black text-white leading-tight">
                    Lernpfad für
                    <br />
                    <span style={{ background: 'linear-gradient(90deg,#30E3CA,#66c0b6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                      {targetJob}
                    </span>
                    <br />
                    <span className="text-white/80">wird erstellt</span>
                  </h1>
                  <p className="text-white/45 text-sm leading-relaxed max-w-xs mx-auto">
                    Unsere KI analysiert deine Skill-Gaps und erstellt einen maßgeschneiderten Plan — auf Basis aktueller Marktdaten.
                  </p>
                </>
              )}
            </div>

            {/* ── MAIN TRACKER — CLT: radar + steps in one contained card ── */}
            <div className="rounded-3xl overflow-hidden" style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.07)',
              animation: 'lpw_up 0.7s ease',
            }}>
              <div className="p-5 sm:p-6 space-y-4">

                {/* Radar + steps row */}
                <div className="flex gap-5 items-start">
                  <RadarViz done={isDone} />
                  <StepsList activeIdx={stepIdx} done={isDone} />
                </div>

                {/* Active ticker bar — ARCS Attention */}
                <div className="rounded-xl px-4 py-3 flex items-center gap-3 min-h-[52px]"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      background: isDone ? 'rgba(34,197,94,0.15)' : 'rgba(48,227,202,0.12)',
                      border: `1px solid ${isDone ? 'rgba(34,197,94,0.4)' : 'rgba(48,227,202,0.3)'}`,
                    }}>
                    {isDone ? (
                      <svg width="10" height="10" viewBox="0 0 10 10">
                        <polyline points="2,5 4,7 8,3" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <div className="w-1.5 h-1.5 rounded-full bg-[#30E3CA]"
                        style={{ animation: 'lpw_pulse 1s ease-in-out infinite' }} />
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold text-white leading-snug"
                      style={{
                        animation: isDone ? 'none' : (tickerVisible ? 'lpw_tick 4.5s ease forwards' : 'none'),
                        opacity: tickerVisible || isDone ? 1 : 0,
                      }}>
                      {isDone ? 'Lernpfad fertiggestellt!' : tickerMsg}
                    </p>
                    {!isDone && (
                      <p className="text-[10px] text-white/35 mt-0.5">{currentStep.detail}</p>
                    )}
                  </div>
                  {isDone && (
                    <svg width="18" height="18" viewBox="0 0 18 18" className="flex-shrink-0">
                      <circle cx="9" cy="9" r="8" fill="#22c55e18" stroke="#22c55e" strokeWidth="1.5" />
                      <polyline points="5.5,9 7.5,11.5 12.5,6.5" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </div>

                {/* Progress bar */}
                <ProgressBar done={isDone} />

                {/* ARCS Satisfaction: launch CTA — only when actually done */}
                {isDone && (
                  <div style={{ animation: 'lpw_up 0.5s ease' }}>
                    <button
                      onClick={() => navigate(`/learning-path/${pathId}`)}
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-black text-base text-black transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg,#22c55e,#4ade80)',
                        boxShadow: '0 0 36px rgba(34,197,94,0.3)',
                      }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5,3 19,12 5,21 5,3"/>
                      </svg>
                      Lernpfad starten — {targetJob}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── FACT CARD — ARCS Relevance, shown only while waiting ── */}
            {!isDone && (
              <div style={{ animation: 'lpw_up 0.9s ease' }}>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/22 mb-3 px-1">
                  Während du wartest
                </p>
                <FactCard done={isDone} />
              </div>
            )}

            {/* ── HARMONY FESTIVAL teaser — ARCS Satisfaction, DSR: card pattern ── */}
            {!isDone && (
              <div className="rounded-2xl overflow-hidden"
                style={{ background: 'linear-gradient(135deg,rgba(249,115,22,0.06),rgba(5,7,13,0.98))', border: '1px solid rgba(249,115,22,0.16)', animation: 'lpw_up 1.0s ease' }}>
                <div className="h-px w-full" style={{ background: 'linear-gradient(90deg,transparent,rgba(249,115,22,0.45),transparent)' }} />
                <div className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.22)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white">Harmony Festival 2026</p>
                    <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">
                      Feiere deinen Fortschritt — Community, Live-Acts & Karriere-Workshops.
                    </p>
                  </div>
                  <button onClick={() => navigate('/festival')}
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:scale-105 active:scale-95"
                    style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316', border: '1px solid rgba(249,115,22,0.22)' }}>
                    Mehr
                  </button>
                </div>
              </div>
            )}

            {/* Reassurance — ARCS Confidence */}
            {!isDone && (
              <p className="text-center text-[10px] text-white/18 pb-4">
                Diese Seite aktualisiert sich automatisch — du kannst das Fenster geöffnet lassen.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
