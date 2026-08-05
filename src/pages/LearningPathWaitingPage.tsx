import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ── Constants ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2_500;
const POLL_MAX = 150; // ~6 min
const TOTAL_DURATION_MS = 3 * 60 * 1000;

// ── Content-Erkennung ───────────────────────────────────────────────────────────
// content kommt von Make als JSON-STRING (content_typ = string), nicht als SQL-NULL.
function hasRealContent(value: unknown): boolean {
  if (value == null) return false;
  if (typeof value === 'string') {
    const s = value.trim();
    return s !== '' && s !== '[]' && s !== 'null' && s !== '{}' && s !== '""';
  }
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value as object).length > 0;
  return true;
}

// ── Stufen = Stationen des Aufstiegs ────────────────────────────────────────────

const STAGES = [
  { id: 'gap',       label: 'Skill-Gaps analysieren', live: 'Vergleiche dein Profil mit 2.400+ Stellenanzeigen…', durationShare: 0.18 },
  { id: 'modules',   label: 'Module strukturieren',   live: 'Ordne Lerneinheiten nach Wirkung auf dein Ziel…',    durationShare: 0.20 },
  { id: 'resources', label: 'Ressourcen kuratieren',  live: 'Wähle die besten Kurse, Videos & Artikel aus…',      durationShare: 0.22 },
  { id: 'timeline',  label: 'Zeitplan erstellen',     live: 'Baue einen realistischen Plan für dein Tempo…',      durationShare: 0.20 },
  { id: 'cert',      label: 'Zertifikat vorbereiten', live: 'Lege deine Abschlussprüfung & Urkunde an…',          durationShare: 0.20 },
];

const QUOTES = [
  { text: 'Der Unterschied zwischen Gewinnern und Verlierern ist nicht Talent — es ist System.', author: 'James Clear' },
  { text: 'Investiere in dich selbst. Es ist die beste Rendite, die du je erzielen wirst.', author: 'Warren Buffett' },
  { text: 'Fähigkeiten sind das neue Kapital. Wer lernt, wächst.', author: 'Decide your Dream' },
  { text: 'Jeder Experte war mal Anfänger. Der einzige Unterschied: er hat nicht aufgehört.', author: 'Robin Sharma' },
  { text: 'Dein nächster Job wartet nicht auf dich — er wartet auf die Version von dir, die du gerade baust.', author: 'Decide your Dream' },
];

const ACCENT = '#30E3CA';
const ACCENT2 = '#66c0b6';
const DONE = '#22c55e';

// Die Route: ein Aufstieg von unten (jetzt) nach oben (dein Ziel = Gipfel).
// Knoten liegen exakt auf dem Pfad, damit der Komet sie streift.
const ASCENT_PATH =
  'M 150 476 C 150 456 150 452 150 432 C 150 402 108 362 108 332 C 108 298 192 272 192 238 C 192 202 112 184 112 148 C 112 114 150 94 150 60 L 150 26';
const NODE_POS = [
  { x: 150, y: 432 },
  { x: 108, y: 332 },
  { x: 192, y: 238 },
  { x: 112, y: 148 },
  { x: 150, y: 60 },
];

// Ein dezenter Sternenstaub für Atmosphäre (ARCS: perzeptuelle Aktivierung).
const STARS = [
  { x: 12, y: 18, d: 0 }, { x: 82, y: 9, d: 1.2 }, { x: 46, y: 30, d: 0.6 },
  { x: 90, y: 44, d: 2.1 }, { x: 7, y: 52, d: 1.6 }, { x: 70, y: 66, d: 0.3 },
  { x: 26, y: 74, d: 2.4 }, { x: 94, y: 80, d: 1.0 }, { x: 55, y: 88, d: 1.8 },
  { x: 18, y: 92, d: 0.9 }, { x: 88, y: 24, d: 1.4 }, { x: 38, y: 58, d: 2.0 },
];

// ── Main page ──────────────────────────────────────────────────────────────────

export default function LearningPathWaitingPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const skillFromUrl = searchParams.get('skill') || null;
   const useTestWebhook = searchParams.get('variant') === 'test';

  const [phase, setPhase] = useState<'loading' | 'waiting' | 'done' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [targetJob, setTargetJob] = useState('deinem Ziel');
  const [retrying, setRetrying] = useState(false);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);
  const [countdown, setCountdown] = useState(5);

  const [progress, setProgress] = useState(0);
  const [activeStageIdx, setActiveStageIdx] = useState(0);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [quoteVisible, setQuoteVisible] = useState(true);

  // Refs — genau EIN Poller, EIN Kanal, EIN Trigger.
  const doneRef       = useRef(false);
  const bootedRef     = useRef(false);
  const triggeredRef  = useRef(false);
  const pollTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef    = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const rafRef        = useRef<number | null>(null);
  const startTimeRef  = useRef<number | null>(null);
  const pathRef       = useRef<SVGPathElement | null>(null); // nur Präsentation: Komet-Position

  // ── Cleanup ────────────────────────────────────────────────────────────────

  const cleanup = useCallback(() => {
    if (channelRef.current)   { supabase.removeChannel(channelRef.current); channelRef.current = null; }
    if (pollTimerRef.current) { clearTimeout(pollTimerRef.current); pollTimerRef.current = null; }
    if (rafRef.current)       { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
  }, []);

  const markDone = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    cleanup();
    setProgress(100);
    setActiveStageIdx(STAGES.length);
    setPhase('done');
    setShowCompletionPopup(true);

    let remaining = 5;
    setCountdown(remaining);
    const interval = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);
    setTimeout(() => clearInterval(interval), 5500);
  }, [cleanup]);

  const markError = useCallback((msg: string) => {
    if (doneRef.current) return;
    doneRef.current = true;
    cleanup();
    setErrorMsg(msg);
    setPhase('error');
  }, [cleanup]);

  // ── Fortschritts-Animation ───────────────────────────────────────────────────

  const startProgressAnimation = useCallback(() => {
    startTimeRef.current = Date.now();
    const tick = () => {
      if (doneRef.current) return;
      const elapsed = Date.now() - (startTimeRef.current ?? Date.now());
      const fraction = Math.min(elapsed / TOTAL_DURATION_MS, 1);
      const eased = 1 - Math.pow(1 - fraction, 2.2);
      const pct = Math.min(eased * 95, 95);
      setProgress(pct);
      let accumulated = 0, stageIdx = 0;
      for (let i = 0; i < STAGES.length; i++) {
        accumulated += STAGES[i].durationShare * 100;
        if (pct < accumulated) { stageIdx = i; break; }
        if (i === STAGES.length - 1) stageIdx = STAGES.length - 1;
      }
      setActiveStageIdx(stageIdx);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Zitat-Rotation ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'waiting') return;
    const id = setInterval(() => {
      setQuoteVisible(false);
      setTimeout(() => { setQuoteIdx(i => (i + 1) % QUOTES.length); setQuoteVisible(true); }, 400);
    }, 9_000);
    return () => clearInterval(id);
  }, [phase]);

  // ── Der EINE Content-Check ───────────────────────────────────────────────────
  const checkForContent = useCallback(async (): Promise<'done' | 'pending' | 'failed'> => {
    if (!pathId) return 'pending';

    const { data, error } = await supabase
      .from('learning_results')
      .select('id, content, learning_path_id')
      .eq('learning_path_id', pathId)
      .limit(10);

    if (error) {
      console.error('[LPW] Lesefehler learning_results:', error.message, error);
      return 'pending';
    }

    console.log('[LPW] check | rows:', data?.length ?? 0,
      '| content erkannt:', (data ?? []).some(r => hasRealContent(r.content)));

    if ((data ?? []).some(r => hasRealContent(r.content))) return 'done';

    const { data: lp } = await supabase
      .from('learning_paths').select('status').eq('id', pathId).maybeSingle();
    if (lp?.status === 'failed') return 'failed';

    return 'pending';
  }, [pathId]);

  // ── Trigger (genau einmal) ────────────────────────────────────────────────────

  const triggerLearningpath = useCallback(async (): Promise<boolean> => {
    if (triggeredRef.current) { console.log('[LPW] Trigger übersprungen (bereits ausgelöst)'); return true; }
    triggeredRef.current = true;
    console.log('[LPW] Trigger learningpath für:', pathId);
    try {
      const { error } = await supabase.functions.invoke('trigger-learningpath', {
        body: { learning_path_id: pathId, use_test_webhook: useTestWebhook },
      });
      if (error) { console.error('[LPW] Trigger-Fehler:', error.message); triggeredRef.current = false; return false; }
      return true;
    } catch (e) {
      console.error('[LPW] Trigger warf:', e);
      triggeredRef.current = false;
      return false;
    }
  }, [pathId]);

  // ── Poll-Schleife (genau eine) ────────────────────────────────────────────────

  const startPolling = useCallback(() => {
    let attempt = 0;
    const loop = async () => {
      if (doneRef.current) return;
      if (attempt >= POLL_MAX) {
        markError('Keine Antwort erhalten. Bitte versuche es erneut.');
        return;
      }
      attempt++;
      const result = await checkForContent();
      if (doneRef.current) return;
      if (result === 'done')   { markDone(); return; }
      if (result === 'failed') { markError('Die KI konnte deinen Lernpfad nicht erstellen.'); return; }
      pollTimerRef.current = setTimeout(loop, POLL_INTERVAL_MS);
    };
    pollTimerRef.current = setTimeout(loop, 1_500);
  }, [checkForContent, markDone, markError]);

  // ── Realtime (ein Kanal) ──────────────────────────────────────────────────────

  const startRealtime = useCallback(() => {
    if (!pathId || channelRef.current) return;
    const ch = supabase
      .channel(`lpw_${pathId}_${Date.now()}`)
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'learning_results', filter: `learning_path_id=eq.${pathId}` },
        async () => {
          const result = await checkForContent();
          if (result === 'done') markDone();
        })
      .subscribe();
    channelRef.current = ch;
  }, [pathId, checkForContent, markDone]);

  // ── Boot ──────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!pathId) { navigate('/', { replace: true }); return; }
    if (bootedRef.current) return;
    bootedRef.current = true;

    doneRef.current = false;
    setPhase('waiting');
    startProgressAnimation();

    (async () => {
      const { data: lp, error: lpErr } = await supabase
        .from('learning_paths').select('*').eq('id', pathId).maybeSingle();

      if (lpErr) { markError('Lernpfad konnte nicht geladen werden.'); return; }
      if (!lp)   { navigate('/dashboard', { replace: true }); return; }

      if (lp.target_job) setTargetJob(lp.target_job);

      if (!lp.is_paid) {
        console.log('[LPW] Pfad nicht bezahlt — zurück zur Lernpfad-Seite');
        navigate(`/learning-path/${pathId}`, { replace: true });
        return;
      }

      if (!(lp as any).skill && skillFromUrl) {
        await supabase.from('learning_paths')
          .update({ skill: skillFromUrl, updated_at: new Date().toISOString() })
          .eq('id', pathId);
      }

      const first = await checkForContent();
      if (first === 'done')   { markDone(); return; }
      if (first === 'failed') { markError('Die KI konnte deinen Lernpfad nicht erstellen.'); return; }

      startRealtime();
      startPolling();

      if (lp.status === 'in_progress') {
        console.log('[LPW] Bereits in_progress — nur warten, kein neuer Trigger');
      } else {
        const ok = await triggerLearningpath();
        if (!ok) { markError('Der Lernpfad konnte nicht gestartet werden. Bitte versuche es erneut.'); return; }
      }
    })();

    return () => { cleanup(); bootedRef.current = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathId]);

  // ── Retry ───────────────────────────────────────────────────────────────────

  const handleRetry = useCallback(async () => {
    if (!pathId) return;
    setRetrying(true);
    setErrorMsg(null);
    doneRef.current = false;
    triggeredRef.current = false;
    setProgress(0);
    setActiveStageIdx(0);
    try {
      await supabase.from('learning_paths')
        .update({ status: 'gap_analysis_complete', updated_at: new Date().toISOString() })
        .eq('id', pathId);
      setPhase('waiting');
      startProgressAnimation();
      const ok = await triggerLearningpath();
      if (!ok) { markError('Webhook-Fehler. Bitte lade die Seite neu.'); return; }
      startRealtime();
      startPolling();
    } catch {
      setErrorMsg('Fehler. Bitte lade die Seite neu.');
    } finally {
      setRetrying(false);
    }
  }, [pathId, triggerLearningpath, startRealtime, startPolling, markError, startProgressAnimation]);

  useEffect(() => {
    if (showCompletionPopup && countdown <= 0) {
      setShowCompletionPopup(false);
      navigate(`/learning-path/${pathId}`);
    }
  }, [countdown, showCompletionPopup, pathId, navigate]);

  const quote = QUOTES[quoteIdx];
  const isDone = phase === 'done';
  const displayProgress = isDone ? 100 : Math.round(Math.min(progress, 95));
  const activeStage = STAGES[Math.min(activeStageIdx, STAGES.length - 1)];

  // Komet-Position live entlang des Pfades (SVG-Koordinaten → skaliert mit viewBox).
  let cometX = NODE_POS[0].x, cometY = 476;
  if (pathRef.current) {
    try {
      const total = pathRef.current.getTotalLength();
      const pt = pathRef.current.getPointAtLength(total * (displayProgress / 100));
      cometX = pt.x; cometY = pt.y;
    } catch { /* erster Frame: ref noch nicht gesetzt */ }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white relative overflow-hidden"
      style={{ background: 'radial-gradient(130% 90% at 50% 0%, #0c1826 0%, #081120 40%, #05080f 100%)' }}>

      <style>{`
        @keyframes lpw_up     { from { opacity:0; transform:translateY(18px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lpw_in     { from { opacity:0; } to { opacity:1; } }
        @keyframes lpw_pop    { 0% { transform:scale(0.7); opacity:0; } 65% { transform:scale(1.08); } 100% { transform:scale(1); opacity:1; } }
        @keyframes lpw_aurora1{ 0%,100% { transform:translate(-8%,-4%) scale(1); } 50% { transform:translate(10%,6%) scale(1.18); } }
        @keyframes lpw_aurora2{ 0%,100% { transform:translate(6%,4%) scale(1.1); } 50% { transform:translate(-10%,-6%) scale(0.92); } }
        @keyframes lpw_aurora3{ 0%,100% { transform:translate(0,0) scale(1); } 50% { transform:translate(-6%,8%) scale(1.14); } }
        @keyframes lpw_twinkle{ 0%,100% { opacity:0.15; } 50% { opacity:0.85; } }
        @keyframes lpw_ping   { 0% { transform:scale(0.6); opacity:0.7; } 100% { transform:scale(2.4); opacity:0; } }
        @keyframes lpw_float  { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-7px); } }
        @keyframes lpw_dots   { 0%,80%,100% { opacity:0.2; } 40% { opacity:1; } }
        @keyframes lpw_shine  { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        .lpw-comet   { filter: drop-shadow(0 0 6px ${ACCENT}) drop-shadow(0 0 14px ${ACCENT}); }
        .lpw-jobgrad {
          background: linear-gradient(100deg, #ffffff 0%, ${ACCENT} 45%, ${ACCENT2} 70%, #ffffff 100%);
          background-size: 220% 100%;
          -webkit-background-clip: text; background-clip: text; color: transparent;
          animation: lpw_shine 5s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          [data-lpw-anim], .lpw-jobgrad { animation: none !important; }
        }
      `}</style>

      {/* Aurora + Sternenstaub — Atmosphäre (ARCS Attention) */}
      <div className="fixed inset-0 pointer-events-none">
        <div data-lpw-anim className="absolute rounded-full" style={{ width: 620, height: 620, top: '-14%', left: '-10%', background: `radial-gradient(circle, ${ACCENT}22, transparent 68%)`, filter: 'blur(30px)', animation: 'lpw_aurora1 14s ease-in-out infinite' }} />
        <div data-lpw-anim className="absolute rounded-full" style={{ width: 560, height: 560, bottom: '-16%', right: '-12%', background: `radial-gradient(circle, ${DONE}1c, transparent 66%)`, filter: 'blur(34px)', animation: 'lpw_aurora2 17s ease-in-out infinite' }} />
        <div data-lpw-anim className="absolute rounded-full" style={{ width: 440, height: 440, top: '30%', right: '8%', background: `radial-gradient(circle, ${ACCENT2}18, transparent 70%)`, filter: 'blur(30px)', animation: 'lpw_aurora3 12s ease-in-out infinite' }} />
        <div className="absolute inset-0">
          {STARS.map((s, i) => (
            <span key={i} data-lpw-anim className="absolute rounded-full bg-white"
              style={{ width: 2, height: 2, left: `${s.x}%`, top: `${s.y}%`, animation: `lpw_twinkle ${3 + (i % 4)}s ease-in-out ${s.d}s infinite` }} />
          ))}
        </div>
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-5 py-10 sm:py-14 min-h-screen flex flex-col justify-center">

        {/* ── loading ── */}
        {phase === 'loading' && (
          <div className="space-y-5" style={{ animation: 'lpw_in 0.3s ease' }}>
            {[54, 300, 44].map((h, i) => (
              <div key={i} data-lpw-anim className="rounded-2xl animate-pulse" style={{ height: h, background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        )}

        {/* ── error ── */}
        {phase === 'error' && (
          <div style={{ animation: 'lpw_up 0.4s ease' }} className="space-y-6">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/25 text-center">Decide your Dream</p>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.22)', background: 'rgba(239,68,68,0.04)' }}>
              <div className="h-1" style={{ background: 'linear-gradient(90deg,#ef4444,#f97316)' }} />
              <div className="p-6 space-y-5">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">Der Lernpfad konnte nicht erstellt werden</h2>
                    <p className="text-sm text-white/55 mt-1 leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleRetry} disabled={retrying}
                    className="flex-1 py-3 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg,${ACCENT2},${ACCENT})` }}>
                    {retrying ? <><div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />Wird wiederholt…</> : 'Erneut versuchen'}
                  </button>
                  <button onClick={() => navigate('/dashboard')}
                    className="py-3 px-5 rounded-xl font-bold text-sm text-white/50 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Dashboard
                  </button>
                </div>
                <p className="text-center text-[11px] text-white/25">
                  Deine Zahlung war erfolgreich — der Lernpfad bleibt freigeschaltet.<br />
                  <a href="mailto:support@decideyourdream.de" className="underline text-[#66c0b6]/50 hover:text-[#66c0b6]">support@decideyourdream.de</a>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── waiting / done ── */}
        {(phase === 'waiting' || phase === 'done') && (
          <div className="space-y-6">

            {/* Kopf — ARCS Relevance: DEIN Gipfel, groß */}
            <div className="text-center space-y-3" style={{ animation: 'lpw_up 0.4s ease' }}>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full"
                style={{ background: isDone ? 'rgba(34,197,94,0.12)' : `${ACCENT}12`, border: `1px solid ${isDone ? 'rgba(34,197,94,0.3)' : `${ACCENT}2e`}` }}>
                <span className="relative flex" style={{ width: 7, height: 7 }}>
                  <span data-lpw-anim className="absolute inline-flex rounded-full" style={{ width: 7, height: 7, background: isDone ? DONE : ACCENT, animation: 'lpw_ping 1.6s ease-out infinite' }} />
                  <span className="relative inline-flex rounded-full" style={{ width: 7, height: 7, background: isDone ? DONE : ACCENT }} />
                </span>
                <span className="text-[10px] font-black uppercase tracking-[0.22em]" style={{ color: isDone ? DONE : ACCENT }}>
                  {isDone ? 'Dein Weg steht' : 'Dein Aufstieg beginnt'}
                </span>
              </div>

              <h1 className="text-[13px] font-black uppercase tracking-[0.2em] text-white/40">
                {isDone ? 'Bereit für' : 'Dein Weg zum'}
              </h1>
              <p className="lpw-jobgrad text-[30px] sm:text-[38px] font-black leading-[1.06] tracking-tight px-2 break-words">
                {targetJob}
              </p>
            </div>

            {/* SIGNATUR — der Aufstieg */}
            <div className="relative mx-auto" style={{ width: '100%', maxWidth: 340, animation: 'lpw_up 0.55s ease' }}>
              <svg viewBox="0 0 300 500" className="w-full h-auto" style={{ display: 'block' }}>
                <defs>
                  <linearGradient id="lpwPath" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%"  stopColor={ACCENT2} />
                    <stop offset="60%" stopColor={ACCENT} />
                    <stop offset="100%" stopColor={DONE} />
                  </linearGradient>
                  <radialGradient id="lpwNodeGlow">
                    <stop offset="0%" stopColor={ACCENT} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={ACCENT} stopOpacity="0" />
                  </radialGradient>
                  <filter id="lpwBlur" x="-60%" y="-60%" width="220%" height="220%">
                    <feGaussianBlur stdDeviation="4" />
                  </filter>
                </defs>

                {/* Basisroute (gedämpft) */}
                <path d={ASCENT_PATH} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="3" strokeLinecap="round" />

                {/* gelaufener, leuchtender Teil — zeichnet sich mit dem Fortschritt */}
                <path
                  ref={pathRef}
                  d={ASCENT_PATH}
                  fill="none"
                  stroke="url(#lpwPath)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  pathLength={100}
                  strokeDasharray={100}
                  strokeDashoffset={100 - displayProgress}
                  style={{ transition: 'stroke-dashoffset 0.5s ease', filter: 'drop-shadow(0 0 4px rgba(48,227,202,0.5))' }}
                />

                {/* Stationen */}
                {NODE_POS.map((n, i) => {
                  const lit = isDone || i < activeStageIdx;
                  const active = !isDone && i === activeStageIdx;
                  const color = (lit ? DONE : active ? ACCENT : 'rgba(255,255,255,0.25)');
                  return (
                    <g key={i}>
                      {(lit || active) && <circle cx={n.x} cy={n.y} r="16" fill="url(#lpwNodeGlow)" opacity={active ? 0.9 : 0.5} />}
                      <circle cx={n.x} cy={n.y} r="8"
                        fill={lit ? `${DONE}22` : active ? `${ACCENT}22` : 'rgba(10,16,26,0.9)'}
                        stroke={color} strokeWidth="2"
                        style={{ transition: 'all 0.4s ease' }} />
                      {lit && (
                        <polyline points={`${n.x - 3.5},${n.y} ${n.x - 1},${n.y + 2.5} ${n.x + 4},${n.y - 3}`}
                          fill="none" stroke={DONE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      )}
                      {active && (
                        <circle cx={n.x} cy={n.y} r="3" fill={ACCENT}>
                          <animate attributeName="opacity" values="1;0.4;1" dur="1.3s" repeatCount="indefinite" />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* Gipfel = dein Ziel */}
                <g style={{ transformOrigin: '150px 26px' }}>
                  {isDone && <circle cx="150" cy="26" r="26" fill="url(#lpwNodeGlow)" opacity="0.9" />}
                  <g data-lpw-anim style={{ animation: isDone ? 'lpw_pop 0.6s ease' : 'lpw_float 3.5s ease-in-out infinite' }}>
                    <path
                      d="M150 8 l5.3 10.7 11.8 1.7 -8.5 8.3 2 11.7 -10.6 -5.6 -10.6 5.6 2 -11.7 -8.5 -8.3 11.8 -1.7 z"
                      fill={isDone ? DONE : 'rgba(255,255,255,0.12)'}
                      stroke={isDone ? DONE : ACCENT}
                      strokeWidth="1.5"
                      strokeLinejoin="round"
                      style={{ transition: 'fill 0.5s ease, stroke 0.5s ease', filter: isDone ? `drop-shadow(0 0 10px ${DONE})` : 'none' }}
                    />
                  </g>
                </g>

                {/* Der Komet — klettert live */}
                {!isDone && (
                  <g className="lpw-comet" style={{ transition: 'transform 0.4s linear' }} transform={`translate(${cometX},${cometY})`}>
                    <circle r="9" fill={ACCENT} opacity="0.25" filter="url(#lpwBlur)" />
                    <circle r="4.5" fill="#eafffb" />
                    <circle r="2.5" fill={ACCENT} />
                  </g>
                )}
              </svg>
            </div>

            {/* Aktueller Schritt + Live-Status (ARCS Attention: Variabilität) */}
            {!isDone && (
              <div className="text-center space-y-1.5" style={{ animation: 'lpw_up 0.65s ease' }}>
                <div className="flex items-center justify-center gap-2">
                  <p className="text-[17px] font-black text-white">{activeStage.label}</p>
                  <span className="inline-flex gap-0.5">
                    {[0, 1, 2].map(d => (
                      <span key={d} data-lpw-anim className="rounded-full" style={{ width: 4, height: 4, background: ACCENT, animation: `lpw_dots 1.4s ease-in-out ${d * 0.2}s infinite` }} />
                    ))}
                  </span>
                </div>
                <p className="text-[13px] leading-relaxed" style={{ color: `${ACCENT}cc` }}>{activeStage.live}</p>
              </div>
            )}

            {/* Großer Fortschritt (ARCS Confidence) */}
            {!isDone && (
              <div className="space-y-2.5" style={{ animation: 'lpw_up 0.75s ease' }}>
                <div className="flex items-end justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/30">Fortschritt</span>
                  <span className="text-4xl font-black tabular-nums leading-none" style={{ color: ACCENT }}>{displayProgress}<span className="text-xl text-white/40">%</span></span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  <div className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${displayProgress}%`, background: `linear-gradient(90deg,${ACCENT2},${ACCENT})`, boxShadow: `0 0 12px ${ACCENT}66` }} />
                </div>
                <p className="text-[11px] text-white/30 text-center">Dauert in der Regel etwa 3 Minuten</p>
              </div>
            )}

            {/* Abschluss (ARCS Satisfaction) */}
            {isDone && (
              <div className="space-y-4 text-center" style={{ animation: 'lpw_up 0.5s ease' }}>
                <p className="text-sm text-white/55 leading-relaxed">
                  Alle Module, der Abschlusstest und dein Zertifikat sind fertig. Zeit, den ersten Schritt zu gehen.
                </p>
                <button onClick={() => navigate(`/learning-path/${pathId}`)}
                  data-lpw-anim
                  className="w-full py-4 rounded-2xl font-black text-base text-black flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg,${DONE},#4ade80)`, boxShadow: '0 0 36px rgba(34,197,94,0.32)', animation: 'lpw_pop 0.5s ease' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5,3 19,12 5,21 5,3" /></svg>
                  Lernpfad starten
                </button>
              </div>
            )}

            {/* Zusicherung — Confidence + DSR (Abbruch verhindern) */}
            {!isDone && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', animation: 'lpw_up 0.85s ease' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={`${ACCENT}aa`} strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><path d="M20 6 9 17l-5-5" /></svg>
                <p className="text-[11.5px] text-white/45 leading-relaxed">
                  Du kannst diese Seite jederzeit verlassen — dein Lernpfad wird im Hintergrund fertig und wartet danach in deinem{' '}
                  <button onClick={() => navigate('/dashboard')} className="underline text-[#66c0b6]/80 hover:text-[#66c0b6] transition-colors">Dashboard</button>.
                </p>
              </div>
            )}

            {/* Motivation — leise Nebenrolle */}
            {!isDone && (
              <div className="text-center px-2 pt-1" style={{ opacity: quoteVisible ? 1 : 0, transition: 'opacity 0.4s ease' }}>
                <p className="text-[12.5px] text-white/40 leading-relaxed italic">&ldquo;{quote.text}&rdquo;</p>
                <p className="text-[10.5px] text-white/22 mt-1 font-bold">— {quote.author}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Abschluss-Popup */}
      {showCompletionPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(8px)', animation: 'lpw_up 0.35s ease' }}
          onClick={() => { setShowCompletionPopup(false); navigate(`/learning-path/${pathId}`); }}>
          <div className="relative max-w-sm w-full rounded-3xl overflow-hidden text-center"
            style={{ background: 'linear-gradient(145deg,#081320,#0a1826)', border: '1px solid rgba(34,197,94,0.32)', boxShadow: '0 0 60px rgba(34,197,94,0.22), 0 20px 60px rgba(0,0,0,0.6)', animation: 'lpw_pop 0.45s cubic-bezier(0.175,0.885,0.32,1.275)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(34,197,94,0.7),transparent)' }} />
            <div className="relative z-10 p-8 space-y-5">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={DONE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white">Dein Weg zum Ziel steht</h2>
                <p className="text-sm text-white/55 leading-relaxed">
                  <span className="text-[#22c55e] font-bold">{targetJob}</span> — alle Module, der Abschlusstest und dein Zertifikat warten auf dich.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-white/30">
                <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span>Weiterleitung in {countdown}s…</span>
              </div>
              <button onClick={() => { setShowCompletionPopup(false); navigate(`/learning-path/${pathId}`); }}
                className="w-full py-4 rounded-2xl font-black text-base text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg,${DONE},#4ade80)`, boxShadow: '0 4px 24px rgba(34,197,94,0.35)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5,3 19,12 5,21 5,3" /></svg>
                Jetzt starten
              </button>
              <button onClick={() => setShowCompletionPopup(false)} className="text-xs text-white/25 hover:text-white/45 transition-colors">Schließen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}