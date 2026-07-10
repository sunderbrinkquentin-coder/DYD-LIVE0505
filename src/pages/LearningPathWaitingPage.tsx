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

const STAGES = [
  { id: 'gap',       icon: '🔍', label: 'Skill-Gaps analysieren',   sublabel: 'Kritische Lernbereiche werden identifiziert', color: '#38bdf8', durationShare: 0.18 },
  { id: 'modules',   icon: '📚', label: 'Module strukturieren',     sublabel: 'Lerneinheiten nach Priorität ordnen',         color: '#30E3CA', durationShare: 0.20 },
  { id: 'resources', icon: '🎯', label: 'Ressourcen kuratieren',    sublabel: 'Hochwertige Kurse & Materialien auswählen',   color: '#22d3ee', durationShare: 0.22 },
  { id: 'timeline',  icon: '📅', label: 'Zeitplan erstellen',       sublabel: 'Realistischer Plan für dein Tempo',           color: '#66c0b6', durationShare: 0.20 },
  { id: 'cert',      icon: '🏆', label: 'Zertifikat vorbereiten',   sublabel: 'Deine Leistung wird dokumentiert',            color: '#4ade80', durationShare: 0.20 },
];

const QUOTES = [
  { text: 'Der Unterschied zwischen Gewinnern und Verlierern ist nicht Talent — es ist System.', author: 'James Clear' },
  { text: 'Investiere in dich selbst. Es ist die beste Rendite, die du je erzielen wirst.', author: 'Warren Buffett' },
  { text: 'Fähigkeiten sind das neue Kapital. Wer lernt, wächst.', author: 'Decide your Dream' },
  { text: 'Jeder Experte war mal Anfänger. Der einzige Unterschied: er hat nicht aufgehört.', author: 'Robin Sharma' },
  { text: 'Dein nächster Job wartet nicht auf dich — er wartet auf die Version von dir, die du gerade baust.', author: 'Decide your Dream' },
];

// ── UI-Helfer ────────────────────────────────────────────────────────────────────

function SmoothBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div className="h-full rounded-full transition-all duration-700 ease-out"
        style={{ width: `${progress}%`, background: `linear-gradient(90deg,${color}90,${color})`, boxShadow: `0 0 8px ${color}60` }} />
    </div>
  );
}

function StageRow({ stage, state }: { stage: typeof STAGES[number]; state: 'done' | 'active' | 'pending' }) {
  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-2xl transition-all duration-500"
      style={{
        background: state === 'active' ? `linear-gradient(135deg,${stage.color}0f,rgba(0,0,0,0))` : state === 'done' ? 'rgba(255,255,255,0.02)' : 'transparent',
        border: state === 'active' ? `1px solid ${stage.color}30` : '1px solid transparent',
        opacity: state === 'pending' ? 0.3 : 1,
      }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg transition-all duration-500"
        style={{
          background: state === 'done' ? 'rgba(34,197,94,0.12)' : state === 'active' ? `${stage.color}18` : 'rgba(255,255,255,0.04)',
          border: state === 'done' ? '1px solid rgba(34,197,94,0.3)' : state === 'active' ? `1px solid ${stage.color}40` : '1px solid rgba(255,255,255,0.07)',
        }}>
        {state === 'done'
          ? <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><polyline points="3,8 6.5,11.5 13,5" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
          : <span style={{ filter: state === 'pending' ? 'grayscale(1)' : 'none' }}>{stage.icon}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-black leading-snug"
          style={{ color: state === 'done' ? 'rgba(255,255,255,0.35)' : state === 'active' ? '#fff' : 'rgba(255,255,255,0.3)', textDecoration: state === 'done' ? 'line-through' : 'none' }}>
          {stage.label}
        </p>
        {state === 'active' && <p className="text-[11px] mt-0.5" style={{ color: `${stage.color}90` }}>{stage.sublabel}</p>}
      </div>
      {state === 'active' && (
        <div className="flex-shrink-0 flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: stage.color, animation: 'lpw2_pulse 1.2s ease-in-out infinite' }} />
          <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: stage.color }}>Aktiv</span>
        </div>
      )}
      {state === 'done' && <span className="flex-shrink-0 text-[9px] font-black uppercase tracking-widest text-green-400/50">Fertig</span>}
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
  const activeStage = STAGES[activeStageIdx] ?? STAGES[STAGES.length - 1];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen text-white" style={{ background: 'linear-gradient(155deg,#05080f 0%,#080d18 55%,#060910 100%)' }}>
      <style>{`
        @keyframes lpw2_up    { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes lpw2_in    { from { opacity:0; } to { opacity:1; } }
        @keyframes lpw2_pulse { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
        @keyframes lpw2_pop   { 0%{transform:scale(0.7);opacity:0;} 70%{transform:scale(1.08);} 100%{transform:scale(1);opacity:1;} }
      `}</style>

      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute rounded-full opacity-[0.04]" style={{ width: 600, height: 600, background: 'radial-gradient(circle,#30E3CA,transparent)', top: -200, right: -100 }} />
        <div className="absolute rounded-full opacity-[0.03]" style={{ width: 400, height: 400, background: 'radial-gradient(circle,#38bdf8,transparent)', bottom: -100, left: -80 }} />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 py-10 sm:py-14 space-y-5">

        {phase === 'loading' && (
          <div className="space-y-4" style={{ animation: 'lpw2_in 0.3s ease' }}>
            {[80, 48, 240, 160].map((h, i) => (
              <div key={i} className="rounded-2xl animate-pulse" style={{ height: h, background: 'rgba(255,255,255,0.04)' }} />
            ))}
          </div>
        )}

        {phase === 'error' && (
          <div style={{ animation: 'lpw2_up 0.4s ease' }} className="space-y-5">
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25">Decide your Dream</p>
            </div>
            <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.05)' }}>
              <div className="h-1" style={{ background: 'linear-gradient(90deg,#ef4444,#f97316)' }} />
              <div className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-white">Fehler beim Erstellen</h2>
                    <p className="text-sm text-white/55 mt-1 leading-relaxed">{errorMsg}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button onClick={handleRetry} disabled={retrying}
                    className="flex-1 py-3 rounded-xl font-black text-sm text-black flex items-center justify-center gap-2 transition-all hover:scale-[1.02] disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}>
                    {retrying ? <><div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />Wird wiederholt…</> : 'Erneut versuchen'}
                  </button>
                  <button onClick={() => navigate('/dashboard')}
                    className="py-3 px-5 rounded-xl font-bold text-sm text-white/50 hover:text-white transition-colors"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    Dashboard
                  </button>
                </div>
                <p className="text-center text-[11px] text-white/25">
                  Deine Zahlung war erfolgreich — der Lernpfad ist freigeschaltet.<br />
                  <a href="mailto:support@decideyourdream.de" className="underline text-[#66c0b6]/50 hover:text-[#66c0b6]">support@decideyourdream.de</a>
                </p>
              </div>
            </div>
          </div>
        )}

        {(phase === 'waiting' || phase === 'done') && (
          <>
            <div className="text-center" style={{ animation: 'lpw2_up 0.4s ease' }}>
              <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25">Decide your Dream</p>
            </div>

            <div className="rounded-3xl overflow-hidden"
              style={{
                background: isDone ? 'linear-gradient(135deg,rgba(34,197,94,0.09),rgba(8,13,24,0.98))' : 'linear-gradient(135deg,rgba(48,227,202,0.07),rgba(8,13,24,0.98))',
                border: isDone ? '1px solid rgba(34,197,94,0.25)' : `1px solid ${activeStage.color}30`,
                animation: 'lpw2_up 0.5s ease', transition: 'border-color 0.6s ease, background 0.6s ease',
              }}>
              <div className="h-[3px] transition-all duration-700"
                style={{ background: isDone ? 'linear-gradient(90deg,#22c55e,#4ade80)' : `linear-gradient(90deg,${activeStage.color},${activeStage.color}40,transparent)` }} />
              <div className="p-6 space-y-5">
                <div>
                  {isDone ? (
                    <div style={{ animation: 'lpw2_pop 0.5s ease' }}>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><polyline points="2,6 5,9 10,3" stroke="#22c55e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest text-green-400/70">Abgeschlossen</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">Dein Lernpfad ist bereit!</h1>
                      <p className="text-sm text-white/45 mt-1.5">Lernpfad für <span className="font-black text-white/80">{targetJob}</span> wurde erstellt.</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: activeStage.color, animation: 'lpw2_pulse 1.4s ease-in-out infinite' }} />
                        <span className="text-xs font-black uppercase tracking-widest" style={{ color: `${activeStage.color}80` }}>Wird erstellt</span>
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">Lernpfad für <span style={{ color: activeStage.color }}>{targetJob}</span></h1>
                      <p className="text-sm text-white/40 mt-1.5">Die KI analysiert deinen Skill-Gap und baut deinen persönlichen Plan.</p>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white/35">{isDone ? 'Fertiggestellt' : activeStage.label}</span>
                    <span className="font-black tabular-nums" style={{ color: isDone ? '#22c55e' : activeStage.color }}>{displayProgress}%</span>
                  </div>
                  <SmoothBar progress={displayProgress} color={isDone ? '#22c55e' : activeStage.color} />
                  {!isDone && <p className="text-[11px] text-white/25">Dauert ca. 3 Minuten — diese Seite aktualisiert sich automatisch.</p>}
                </div>

                {isDone && (
                  <button onClick={() => navigate(`/learning-path/${pathId}`)}
                    className="w-full py-4 rounded-2xl font-black text-base text-black flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    style={{ background: 'linear-gradient(135deg,#22c55e,#4ade80)', boxShadow: '0 0 32px rgba(34,197,94,0.28)', animation: 'lpw2_pop 0.5s ease' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5,3 19,12 5,21 5,3" /></svg>
                    Lernpfad starten — {targetJob}
                  </button>
                )}
              </div>
            </div>

            {!isDone && (
              <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', animation: 'lpw2_up 0.65s ease' }}>
                <div className="px-4 py-3 border-b border-white/[0.06]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/30">Fortschritt</p>
                </div>
                <div className="p-2">
                  {STAGES.map((stage, i) => (
                    <StageRow key={stage.id} stage={stage} state={isDone || i < activeStageIdx ? 'done' : i === activeStageIdx ? 'active' : 'pending'} />
                  ))}
                </div>
              </div>
            )}

            {!isDone && (
              <div className="rounded-2xl p-5"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', animation: 'lpw2_up 0.75s ease', opacity: quoteVisible ? 1 : 0, transform: quoteVisible ? 'translateY(0)' : 'translateY(4px)', transition: 'opacity 0.4s ease, transform 0.4s ease' }}>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-3">Während du wartest</p>
                <p className="text-sm text-white/70 leading-relaxed italic">&ldquo;{quote.text}&rdquo;</p>
                <p className="text-[11px] text-white/30 mt-2 font-bold">— {quote.author}</p>
                <div className="flex gap-1 mt-3">
                  {QUOTES.map((_, i) => (
                    <div key={i} className="rounded-full transition-all duration-300" style={{ width: i === quoteIdx ? 16 : 5, height: 4, background: i === quoteIdx ? '#30E3CA' : 'rgba(255,255,255,0.1)' }} />
                  ))}
                </div>
              </div>
            )}

            {!isDone && (
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.06)', animation: 'lpw2_up 0.85s ease' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                <p className="text-[11px] text-white/30 flex-1 leading-relaxed">
                  Du kannst diese Seite verlassen — sobald dein Lernpfad fertig ist, kannst du ihn über das{' '}
                  <button onClick={() => navigate('/dashboard')} className="underline text-[#66c0b6]/60 hover:text-[#66c0b6] transition-colors">Dashboard</button> starten.
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {showCompletionPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', animation: 'lpw2_up 0.35s ease' }}
          onClick={() => { setShowCompletionPopup(false); navigate(`/learning-path/${pathId}`); }}>
          <div className="relative max-w-sm w-full rounded-3xl overflow-hidden text-center"
            style={{ background: 'linear-gradient(145deg,#080f1a,#0a1520)', border: '1px solid rgba(34,197,94,0.3)', boxShadow: '0 0 60px rgba(34,197,94,0.2), 0 20px 60px rgba(0,0,0,0.6)', animation: 'lpw2_pop 0.45s cubic-bezier(0.175,0.885,0.32,1.275)' }}
            onClick={(e) => e.stopPropagation()}>
            <div className="absolute inset-x-0 top-0 h-px" style={{ background: 'linear-gradient(90deg,transparent,rgba(34,197,94,0.7),transparent)' }} />
            <div className="relative z-10 p-8 space-y-5">
              <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" /><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" /></svg>
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-white">Dein Lernpfad ist bereit!</h2>
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
                style={{ background: 'linear-gradient(135deg,#22c55e,#4ade80)', boxShadow: '0 4px 24px rgba(34,197,94,0.35)' }}>
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