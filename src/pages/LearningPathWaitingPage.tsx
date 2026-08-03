import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// ── Constants ──────────────────────────────────────────────────────────────────

const POLL_INTERVAL_MS = 2_500;
const POLL_MAX = 150; // ~6 min
const TOTAL_DURATION_MS = 3 * 60 * 1000;

// ── Content-Erkennung ───────────────────────────────────────────────────────────
// content kommt von Make als JSON-STRING (content_typ = string), nicht als SQL-NULL.
// Diese Prüfung akzeptiert alles, was echten Inhalt trägt, und lehnt die leeren
// Formen ab, die wie Inhalt aussehen ('', '[]', 'null', '{}').
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

// ── Progress stages ─────────────────────────────────────────────────────────────
// Bleiben inhaltlich wie gehabt — sie sind die Stationen der Route.

const STAGES = [
  { id: 'gap',       label: 'Skill-Gaps analysieren',   sublabel: 'Wir finden deine wichtigsten Lernbereiche',   durationShare: 0.18 },
  { id: 'modules',   label: 'Module strukturieren',     sublabel: 'Lerneinheiten werden nach Priorität geordnet', durationShare: 0.20 },
  { id: 'resources', label: 'Ressourcen kuratieren',    sublabel: 'Passende Kurse & Materialien werden gewählt',  durationShare: 0.22 },
  { id: 'timeline',  label: 'Zeitplan erstellen',       sublabel: 'Ein realistischer Plan für dein Tempo',        durationShare: 0.20 },
  { id: 'cert',      label: 'Zertifikat vorbereiten',   sublabel: 'Deine Leistung wird dokumentiert',             durationShare: 0.20 },
];

const QUOTES = [
  { text: 'Der Unterschied zwischen Gewinnern und Verlierern ist nicht Talent — es ist System.', author: 'James Clear' },
  { text: 'Investiere in dich selbst. Es ist die beste Rendite, die du je erzielen wirst.', author: 'Warren Buffett' },
  { text: 'Fähigkeiten sind das neue Kapital. Wer lernt, wächst.', author: 'Decide your Dream' },
  { text: 'Jeder Experte war mal Anfänger. Der einzige Unterschied: er hat nicht aufgehört.', author: 'Robin Sharma' },
  { text: 'Dein nächster Job wartet nicht auf dich — er wartet auf die Version von dir, die du gerade baust.', author: 'Decide your Dream' },
];

// Ein Akzent, konsequent durchgezogen (CLT: keine fünf konkurrierenden Farben).
const ACCENT = '#30E3CA';
const DONE = '#22c55e';

// ── Signatur: die Route ─────────────────────────────────────────────────────────
//
// Eine Station der sich zeichnenden Strecke. Der Konnektor NACH einem erledigten
// Knoten ist durchgezogen (die Route ist bis hierher „gebaut"), sonst gedämpft.
// Genau EIN Element trägt Fortschritt + Schritte + Blickfang — das ist die
// CLT-Reduktion gegenüber Spinner + Balken + fünf Animationszeilen.

function RouteStep({
  stage, state, isLast, allDone,
}: {
  stage: typeof STAGES[number];
  state: 'done' | 'active' | 'pending';
  isLast: boolean;
  allDone: boolean;
}) {
  const nodeColor = state === 'pending' ? 'rgba(255,255,255,0.14)' : (allDone ? DONE : (state === 'done' ? DONE : ACCENT));
  const connectorFilled = state === 'done' || allDone;

  return (
    <div className="flex gap-4">
      {/* Route-Spalte: Knoten + Konnektor */}
      <div className="flex flex-col items-center flex-shrink-0" style={{ width: 24 }}>
        <div
          className="relative flex items-center justify-center rounded-full transition-all duration-500"
          style={{
            width: 24, height: 24,
            background: state === 'pending' ? 'transparent' : `${nodeColor}1f`,
            border: `1.5px solid ${nodeColor}`,
            boxShadow: state === 'active' ? `0 0 0 4px ${ACCENT}14` : 'none',
          }}
        >
          {(state === 'done' || allDone) ? (
            <svg width="11" height="11" viewBox="0 0 12 12" aria-hidden>
              <polyline points="2,6.5 5,9.5 10,3.5" fill="none" stroke={DONE} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : state === 'active' ? (
            <span className="lpw-pulse rounded-full" style={{ width: 8, height: 8, background: ACCENT }} />
          ) : (
            <span className="rounded-full" style={{ width: 5, height: 5, background: 'rgba(255,255,255,0.25)' }} />
          )}
        </div>

        {!isLast && (
          <div className="flex-1 w-px my-1 rounded-full transition-all duration-700" style={{ minHeight: 26, background: connectorFilled ? DONE : 'rgba(255,255,255,0.10)' }} />
        )}
      </div>

      {/* Label */}
      <div className={`pb-6 min-w-0 transition-opacity duration-500 ${state === 'pending' ? 'opacity-40' : 'opacity-100'}`}>
        <p
          className="text-[15px] font-bold leading-snug transition-colors duration-500"
          style={{ color: state === 'active' ? '#ffffff' : (state === 'done' || allDone) ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.6)' }}
        >
          {stage.label}
        </p>
        {/* Sublabel nur beim aktiven Schritt — CLT: nicht fünf Erklärzeilen gleichzeitig */}
        {state === 'active' && !allDone && (
          <p className="text-[12.5px] mt-1 leading-relaxed" style={{ color: `${ACCENT}cc` }}>{stage.sublabel}</p>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function LearningPathWaitingPage() {
  const { pathId } = useParams<{ pathId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const skillFromUrl = searchParams.get('skill') || null;

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

  // Refs — genau EIN Poller, EIN Kanal, EIN Trigger. Das verhindert die
  // Doppel-Trigger (= Unit-Duplikate) und die sich gegenseitig abräumenden
  // Subscriptions aus der alten Version.
  const doneRef       = useRef(false);
  const bootedRef     = useRef(false); // schützt gegen StrictMode-Doppellauf
  const triggeredRef  = useRef(false);
  const pollTimerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef    = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const rafRef        = useRef<number | null>(null);
  const startTimeRef  = useRef<number | null>(null);

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
  // Kein .not('content','is',null) mehr (content ist ein String, nicht NULL).
  // Fehler werden NICHT verschluckt — sie werden geloggt und, wenn hartnäckig,
  // als Fehlerzustand angezeigt. Das war die Ursache des "ewigen Ladens":
  // der alte Poller warf jeden Fehler weg und drehte blind weiter.
  const checkForContent = useCallback(async (): Promise<'done' | 'pending' | 'failed'> => {
    if (!pathId) return 'pending';

    const { data, error } = await supabase
      .from('learning_results')
      .select('id, content, learning_path_id')
      .eq('learning_path_id', pathId)
      .limit(10);

    if (error) {
      console.error('[LPW] Lesefehler learning_results:', error.message, error);
      // Fehler beim Lesen = wir wissen es nicht, also weiter pollen —
      // aber sichtbar, nicht stumm.
      return 'pending';
    }

    console.log('[LPW] check | rows:', data?.length ?? 0,
      '| content erkannt:', (data ?? []).some(r => hasRealContent(r.content)));

    if ((data ?? []).some(r => hasRealContent(r.content))) return 'done';

    // Kein Content — ist der Pfad evtl. hart gescheitert?
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
        body: { learning_path_id: pathId },
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
    if (bootedRef.current) return;   // StrictMode-Schutz: nur einmal booten
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

      // Anforderung: bezahlt ⇒ Content muss existieren. Wenn NICHT bezahlt,
      // gehört der User nicht auf die Warteseite — zurück zur Analyse.
      if (!lp.is_paid) {
        console.log('[LPW] Pfad nicht bezahlt — zurück zur Lernpfad-Seite');
        navigate(`/learning-path/${pathId}`, { replace: true });
        return;
      }

      // Skill aus URL nachtragen, falls der Webhook ihn noch nicht geschrieben hat.
      if (!(lp as any).skill && skillFromUrl) {
        await supabase.from('learning_paths')
          .update({ skill: skillFromUrl, updated_at: new Date().toISOString() })
          .eq('id', pathId);
      }

      // Schon fertig? Dann direkt weiter — kein Trigger, kein Warten.
      const first = await checkForContent();
      if (first === 'done')   { markDone(); return; }
      if (first === 'failed') { markError('Die KI konnte deinen Lernpfad nicht erstellen.'); return; }

      // Realtime + Polling starten (beide finden dieselbe Zeile; wer zuerst
      // kommt, ruft markDone, der andere no-op via doneRef).
      startRealtime();
      startPolling();

      // Trigger nur, wenn noch nicht in Arbeit. Genau einmal (triggeredRef).
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

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white" style={{ background: 'radial-gradient(120% 80% at 50% -10%, #0a1420 0%, #070d16 45%, #05080f 100%)' }}>
      <style>{`
        @keyframes lpw_up   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lpw_in   { from { opacity:0; } to { opacity:1; } }
        @keyframes lpw_pulse{ 0%,100% { transform:scale(1); opacity:1; } 50% { transform:scale(0.55); opacity:0.55; } }
        @keyframes lpw_pop  { 0% { transform:scale(0.72); opacity:0; } 70% { transform:scale(1.06); } 100% { transform:scale(1); opacity:1; } }
        .lpw-pulse { animation: lpw_pulse 1.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .lpw-pulse { animation: none; }
          [data-lpw-animate] { animation: none !important; }
        }
      `}</style>

      {/* Ein einziger, sehr dezenter Ambient-Schimmer statt konkurrierender Orbs (CLT). */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full" style={{ width: 520, height: 520, top: -180, left: '50%', transform: 'translateX(-50%)', background: `radial-gradient(circle, ${ACCENT}0f, transparent 70%)` }} />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 py-12 sm:py-16">

        {/* ── loading (kurzer Übergang) ── */}
        {phase === 'loading' && (
          <div className="space-y-5" style={{ animation: 'lpw_in 0.3s ease' }}>
            {[64, 220, 40].map((h, i) => (
              <div key={i} data-lpw-animate className="rounded-2xl animate-pulse" style={{ height: h, background: 'rgba(255,255,255,0.04)' }} />
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
                    style={{ background: `linear-gradient(135deg,#66c0b6,${ACCENT})` }}>
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
          <div className="space-y-9">

            {/* Kopf — ARCS Relevance: es geht um DEIN Ziel */}
            <div className="text-center space-y-2.5" style={{ animation: 'lpw_up 0.4s ease' }}>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full"
                style={{ background: isDone ? 'rgba(34,197,94,0.1)' : `${ACCENT}0f`, border: `1px solid ${isDone ? 'rgba(34,197,94,0.25)' : `${ACCENT}22`}` }}>
                <span className="rounded-full lpw-pulse" style={{ width: 6, height: 6, background: isDone ? DONE : ACCENT }} />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: isDone ? DONE : ACCENT }}>
                  {isDone ? 'Fertig' : 'Wird erstellt'}
                </span>
              </div>
              <h1 className="text-[26px] sm:text-[30px] font-black leading-[1.12] tracking-tight">
                {isDone ? 'Dein Lernpfad ist bereit' : 'Dein Lernpfad entsteht'}
              </h1>
              <p className="text-sm text-white/45 leading-relaxed">
                {isDone
                  ? <>Alle Module, der Abschlusstest und dein Zertifikat für <span className="text-white/75 font-bold">{targetJob}</span> warten auf dich.</>
                  : <>Wir bauen deinen persönlichen Plan für <span className="text-white/75 font-bold">{targetJob}</span> — Schritt für Schritt.</>}
              </p>
            </div>

            {/* Die Route — Signatur & einziger Fokus */}
            <div className="rounded-2xl px-6 pt-7 pb-1" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', animation: 'lpw_up 0.55s ease' }}>
              {STAGES.map((stage, i) => {
                const state: 'done' | 'active' | 'pending' =
                  isDone || i < activeStageIdx ? 'done' : i === activeStageIdx ? 'active' : 'pending';
                return (
                  <RouteStep
                    key={stage.id}
                    stage={stage}
                    state={state}
                    isLast={i === STAGES.length - 1}
                    allDone={isDone}
                  />
                );
              })}
            </div>

            {/* Fortschritt — ARCS Confidence: eine ruhige, ehrliche Zeile, kein zweiter großer Balken */}
            {!isDone && (
              <div className="space-y-2" style={{ animation: 'lpw_up 0.65s ease' }}>
                <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${displayProgress}%`, background: `linear-gradient(90deg,${ACCENT}88,${ACCENT})` }} />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white/30">Dauert etwa 3 Minuten</span>
                  <span className="font-black tabular-nums" style={{ color: `${ACCENT}cc` }}>{displayProgress}%</span>
                </div>
              </div>
            )}

            {/* Abschluss-CTA — ARCS Satisfaction */}
            {isDone && (
              <button onClick={() => navigate(`/learning-path/${pathId}`)}
                data-lpw-animate
                className="w-full py-4 rounded-2xl font-black text-base text-black flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{ background: `linear-gradient(135deg,${DONE},#4ade80)`, boxShadow: '0 0 32px rgba(34,197,94,0.28)', animation: 'lpw_pop 0.5s ease' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5,3 19,12 5,21 5,3" /></svg>
                Lernpfad starten
              </button>
            )}

            {/* Motivation — bewusst untergeordnet (CLT: Nebenrolle, nicht zweiter Fokus) */}
            {!isDone && (
              <div className="text-center px-2" style={{ animation: 'lpw_up 0.75s ease', opacity: quoteVisible ? 1 : 0, transition: 'opacity 0.4s ease' }}>
                <p className="text-[13px] text-white/45 leading-relaxed italic">&ldquo;{quote.text}&rdquo;</p>
                <p className="text-[11px] text-white/25 mt-1.5 font-bold">— {quote.author}</p>
              </div>
            )}

            {/* Zusicherung — ARCS Confidence + DSR: löst das eigentliche Problem (Abbruch) */}
            {!isDone && (
              <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.05)', animation: 'lpw_up 0.85s ease' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={`${ACCENT}99`} strokeWidth="2" strokeLinecap="round" className="flex-shrink-0 mt-0.5"><path d="M20 6 9 17l-5-5" /></svg>
                <p className="text-[11.5px] text-white/40 leading-relaxed">
                  Du kannst diese Seite jederzeit verlassen. Dein Lernpfad wird im Hintergrund fertiggestellt und wartet danach in deinem{' '}
                  <button onClick={() => navigate('/dashboard')} className="underline text-[#66c0b6]/70 hover:text-[#66c0b6] transition-colors">Dashboard</button>.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Abschluss-Popup */}
      {showCompletionPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', animation: 'lpw_up 0.35s ease' }}
          onClick={() => { setShowCompletionPopup(false); navigate(`/learning-path/${pathId}`); }}>
          <div className="relative max-w-sm w-full rounded-3xl overflow-hidden text-center"
            style={{ background: 'linear-gradient(145deg,#080f1a,#0a1520)', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 0 60px rgba(34,197,94,0.2), 0 20px 60px rgba(0,0,0,0.6)', animation: 'lpw_pop 0.45s cubic-bezier(0.175,0.885,0.32,1.275)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(34,197,94,0.7),transparent)' }} />
            <div className="relative z-10 p-8 space-y-5">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={DONE} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white">Dein Lernpfad ist bereit</h2>
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