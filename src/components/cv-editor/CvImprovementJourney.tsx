// src/components/cv-editor/CvImprovementJourney.tsx
//
// Geführte Verbesserungs-Journey im Live-Editor.
// Geht Schritt für Schritt durch alle Stellen mit Verbesserungspotenzial
// (aus `_optimization.journey` der Edge Function trigger-cv-generator):
//   - der aktuelle Abschnitt wird im CV groß hervorgehoben (onFocusStep)
//   - Tipp + ggf. eine konkrete Frage an den Nutzer (z. B. echte Kennzahl)
//   - "Mit einem Klick optimieren" → Edge Function cv-improve-section
//   - Vorher/Nachher → erst "Übernehmen" schreibt in den CV
// Dazu ein kleiner Kurz-Score (vorher → jetzt). Er ersetzt bewusst NICHT den
// kostenpflichtigen CV-Check, sondern verweist darauf.

import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, Sparkles, X, Lightbulb, Trophy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { scoreEditorCv, scoreLabel } from '../../utils/cvShortScore';

export type JourneyTarget =
  | { type: 'station'; sid: string }
  | { type: 'summary' }
  | { type: 'headline' }
  | { type: 'section'; section: string };

export interface JourneyStep {
  id: string;
  target: JourneyTarget;
  title: string;
  issues: string[];
  question: string;
  actionable: boolean;
}

export interface JourneyProgress {
  done: string[];
  skipped: string[];
}

export interface JourneyCurrentContent {
  title?: string;
  company?: string;
  bullet_points?: string[];
  text?: string;
}

interface Props {
  cvId: string;
  steps: JourneyStep[];
  editorData: any;
  scoreBefore: number | null;
  progress: JourneyProgress;
  onProgressChange: (progress: JourneyProgress) => void;
  onFocusStep: (step: JourneyStep | null) => void;
  getCurrentContent: (step: JourneyStep) => JourneyCurrentContent | null;
  onApplyStation: (sid: string, bullets: string[]) => void;
  onApplyText: (type: 'summary' | 'headline', text: string) => void;
  onOpenCvCheck: () => void;
  onClose: () => void;
  /** Von außen gewünschter Schritt (Klick auf eine Markierung im CV); nonce erzwingt den Sprung. */
  requestedStep?: { id: string; nonce: number } | null;
  /** Begriffe aus der Stellenanzeige, die im CV fehlen (Schritt "keywords"). */
  missingKeywords?: string[];
  onAddSkill?: (name: string) => void;
}

type Status = 'idle' | 'loading' | 'proposal' | 'error';

interface Proposal {
  bullet_points?: string[];
  text?: string;
}

export function CvImprovementJourney({
  cvId,
  steps,
  editorData,
  scoreBefore,
  progress,
  onProgressChange,
  onFocusStep,
  getCurrentContent,
  onApplyStation,
  onApplyText,
  onOpenCvCheck,
  onClose,
  requestedStep,
  missingKeywords = [],
  onAddSkill,
}: Props) {
  const isOpen = (id: string) => !progress.done.includes(id) && !progress.skipped.includes(id);
  const firstOpen = Math.max(0, steps.findIndex((s) => isOpen(s.id)));

  const [index, setIndex] = useState(firstOpen);
  const [answer, setAnswer] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [error, setError] = useState<string | null>(null);

  const allHandled = steps.length > 0 && steps.every((s) => !isOpen(s.id));
  const step = allHandled ? null : steps[Math.min(index, steps.length - 1)] ?? null;
  const current = step ? getCurrentContent(step) : null;

  const liveScore = useMemo(() => scoreEditorCv(editorData).total, [editorData]);
  const doneCount = progress.done.length;

  // Abschnitt im CV groß hervorheben, sobald sich der Schritt ändert
  useEffect(() => {
    onFocusStep(step);
    setAnswer('');
    setStatus('idle');
    setProposal(null);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  // Klick auf eine Markierung im CV → genau diesen Schritt zeigen
  useEffect(() => {
    if (!requestedStep) return;
    const i = steps.findIndex((s) => s.id === requestedStep.id);
    if (i < 0) return;
    // Bereits erledigte/übersprungene Schritte wieder öffnen, damit man sie erneut bearbeiten kann
    if (!isOpen(requestedStep.id)) {
      onProgressChange({
        done: progress.done.filter((id) => id !== requestedStep.id),
        skipped: progress.skipped.filter((id) => id !== requestedStep.id),
      });
    }
    setIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedStep?.nonce]);

  // Fähigkeiten, die schon im CV stehen (für die Keyword-Chips)
  const existingSkills = useMemo(() => {
    const sec = (editorData?.sections ?? []).find((x: any) => x?.type === 'skills');
    const items: any[] = Array.isArray(sec?.items) ? sec.items : [];
    return new Set(items.map((it) => String(it?.name ?? it ?? '').trim().toLowerCase()));
  }, [editorData]);

  // Beim Schließen die Hervorhebung entfernen
  useEffect(() => () => onFocusStep(null), []); // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(steps.length - 1, i)));

  const nextOpenAfter = (i: number, prog: JourneyProgress) => {
    for (let k = i + 1; k < steps.length; k++) {
      if (!prog.done.includes(steps[k].id) && !prog.skipped.includes(steps[k].id)) return k;
    }
    for (let k = 0; k <= i; k++) {
      if (!prog.done.includes(steps[k].id) && !prog.skipped.includes(steps[k].id)) return k;
    }
    return i;
  };

  const markAndAdvance = (kind: 'done' | 'skipped') => {
    if (!step) return;
    const next: JourneyProgress = {
      done: kind === 'done' ? [...new Set([...progress.done, step.id])] : progress.done.filter((id) => id !== step.id),
      skipped: kind === 'skipped' ? [...new Set([...progress.skipped, step.id])] : progress.skipped.filter((id) => id !== step.id),
    };
    onProgressChange(next);
    setIndex(nextOpenAfter(index, next));
  };

  const optimize = async (withAnswer: boolean) => {
    if (!step || step.target.type === 'section') return;
    setStatus('loading');
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('cv-improve-section', {
        body: {
          cv_id: cvId,
          target: step.target,
          issues: step.issues,
          answer: withAnswer ? answer.trim() : '',
          current: current ?? {},
        },
      });
      if (invokeError || !data?.success) {
        let message = data?.error as string | undefined;
        if (!message && invokeError && 'context' in invokeError) {
          try {
            message = (await (invokeError as any).context.json())?.error;
          } catch { /* ignore */ }
        }
        throw new Error(message || 'Die Optimierung ist fehlgeschlagen. Bitte versuche es erneut.');
      }
      setProposal({ bullet_points: data.bullet_points, text: data.text });
      setStatus('proposal');
    } catch (e: any) {
      setError(e?.message ?? 'Die Optimierung ist fehlgeschlagen.');
      setStatus('error');
    }
  };

  const applyProposal = () => {
    if (!step || !proposal) return;
    if (step.target.type === 'station' && proposal.bullet_points?.length) {
      onApplyStation(step.target.sid, proposal.bullet_points);
    } else if ((step.target.type === 'summary' || step.target.type === 'headline') && proposal.text) {
      onApplyText(step.target.type, proposal.text);
    }
    markAndAdvance('done');
  };

  // ── Darstellung ──────────────────────────────────────────────────────────
  const scoreDelta = scoreBefore != null ? liveScore - scoreBefore : null;

  return (
    <div
      data-journey-panel
      className="fixed z-[60] bg-[#121216] border border-[#66c0b6]/30 shadow-2xl flex flex-col
                 inset-x-2 bottom-2 max-h-[62vh] rounded-2xl
                 sm:inset-x-auto sm:right-4 sm:top-28 sm:bottom-4 sm:w-[390px] sm:max-h-none"
    >
      {/* Kopf: Titel, Kurz-Score, Fortschritt */}
      <div className="px-5 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#66c0b6]" />
            <h3 className="text-white font-semibold">Dein CV-Feinschliff</h3>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Schließen">
            <X size={18} />
          </button>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-baseline gap-1.5">
            {scoreBefore != null && (
              <>
                <span className="text-white/40 text-sm line-through decoration-white/30">{scoreBefore}</span>
                <ArrowRight size={12} className="text-white/40 self-center" />
              </>
            )}
            <span className="text-2xl font-bold text-white">{liveScore}</span>
            <span className="text-xs text-white/40">/100</span>
          </div>
          <div className="flex-1">
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] transition-all duration-700" style={{ width: `${liveScore}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-white/50">
              Kurz-Score Sprache & Struktur · {scoreLabel(liveScore)}
              {scoreDelta != null && scoreDelta > 0 && <span className="text-[#66c0b6]"> · +{scoreDelta}</span>}
            </p>
          </div>
        </div>

        {steps.length > 0 && !allHandled && (
          <div className="mt-3 flex items-center gap-1">
            {steps.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                title={s.title}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  progress.done.includes(s.id) ? 'bg-[#66c0b6]'
                    : i === index ? 'bg-white'
                    : progress.skipped.includes(s.id) ? 'bg-white/25'
                    : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inhalt */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {allHandled || !step ? (
          <div className="text-center py-6 space-y-3">
            <Trophy size={36} className="mx-auto text-[#66c0b6]" />
            <p className="text-white font-semibold text-lg">Feinschliff abgeschlossen</p>
            <p className="text-white/60 text-sm">
              {doneCount} von {steps.length} Punkten verbessert.
              {scoreDelta != null && scoreDelta > 0 && <> Dein Kurz-Score ist um {scoreDelta} Punkte gestiegen.</>}
            </p>
            <button onClick={onClose} className="mt-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold">
              Zum CV
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-white/40">
                Schritt {index + 1} von {steps.length}
              </p>
              <p className="text-white font-semibold mt-0.5">{step.title}</p>
            </div>

            <div className="rounded-xl bg-amber-400/10 border border-amber-400/25 p-3 space-y-1.5">
              {step.issues.map((issue, i) => (
                <p key={i} className="flex items-start gap-2 text-sm text-white/85">
                  <Lightbulb size={14} className="text-amber-300 flex-shrink-0 mt-0.5" />
                  <span>{issue}</span>
                </p>
              ))}
            </div>

            {/* Fehlende Begriffe aus der Stellenanzeige: per Klick als Fähigkeit ergänzen */}
            {step.id === 'keywords' && missingKeywords.length > 0 && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {missingKeywords.map((kw) => {
                    const added = existingSkills.has(kw.trim().toLowerCase());
                    return (
                      <button
                        key={kw}
                        type="button"
                        disabled={added || !onAddSkill}
                        onClick={() => onAddSkill?.(kw)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                          added
                            ? 'bg-[#66c0b6]/20 border-[#66c0b6]/50 text-[#66c0b6]'
                            : 'bg-white/5 border-white/15 text-white/85 hover:border-[#66c0b6] hover:text-white'
                        }`}
                      >
                        {added ? <><Check size={11} className="inline -mt-0.5 mr-1" />{kw}</> : <>+ {kw}</>}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-white/45">
                  Ein Klick fügt den Begriff unter „Fähigkeiten“ hinzu. Erfahrung mit dem Thema kannst du zusätzlich in einer passenden Station beschreiben.
                </p>
              </div>
            )}

            {/* Reiner Hinweis (z. B. LinkedIn ergänzen) */}
            {!step.actionable && step.id !== 'keywords' && (
              <p className="text-xs text-white/50">
                Das kannst du direkt im CV ergänzen – klicke dafür einfach auf das jeweilige Feld.
              </p>
            )}

            {/* Optimierbarer Schritt */}
            {step.actionable && status !== 'proposal' && (
              <div className="space-y-3">
                {step.question && (
                  <div className="space-y-1.5">
                    <label className="text-sm text-white/80">{step.question}</label>
                    <textarea
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      rows={2}
                      placeholder="Deine Antwort (optional)"
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-white/5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#66c0b6]"
                    />
                  </div>
                )}

                <button
                  onClick={() => optimize(true)}
                  disabled={status === 'loading'}
                  className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {status === 'loading'
                    ? <><Loader2 size={18} className="animate-spin" /> Wird optimiert …</>
                    : <><Sparkles size={18} /> {step.question && answer.trim() ? 'Mit meiner Antwort optimieren' : 'Mit einem Klick optimieren'}</>}
                </button>

                {status === 'error' && error && <p className="text-sm text-red-400">{error}</p>}
              </div>
            )}

            {/* Vorher / Nachher */}
            {status === 'proposal' && proposal && (
              <div className="space-y-3">
                <div className="rounded-xl border border-white/10 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-white/40 mb-1.5">Vorher</p>
                  <ContentView bullets={current?.bullet_points} text={current?.text} muted />
                </div>
                <div className="rounded-xl border border-[#66c0b6]/50 bg-[#66c0b6]/10 p-3">
                  <p className="text-[11px] uppercase tracking-wider text-[#66c0b6] mb-1.5">Nachher</p>
                  <ContentView bullets={proposal.bullet_points} text={proposal.text} />
                </div>
                <div className="flex gap-2">
                  <button onClick={applyProposal} className="flex-1 px-4 py-2.5 rounded-xl bg-[#66c0b6] text-black font-semibold flex items-center justify-center gap-1.5">
                    <Check size={16} /> Übernehmen
                  </button>
                  <button onClick={() => optimize(true)} className="px-3 py-2.5 rounded-xl border border-white/15 text-white/80 flex items-center gap-1.5" title="Neuen Vorschlag erzeugen">
                    <RotateCcw size={15} /> Nochmal
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Fuß: Navigation + Verweis auf den vollständigen CV-Check */}
      <div className="px-5 py-3 border-t border-white/10 flex-shrink-0 space-y-2">
        {!allHandled && step && (
          <div className="flex items-center justify-between text-sm">
            <button onClick={() => goTo(index - 1)} disabled={index === 0} className="text-white/50 hover:text-white disabled:opacity-30 flex items-center gap-1">
              <ArrowLeft size={14} /> Zurück
            </button>
            {step.actionable ? (
              <button onClick={() => markAndAdvance('skipped')} className="text-white/50 hover:text-white">
                Überspringen
              </button>
            ) : (
              <button onClick={() => markAndAdvance('done')} className="text-[#66c0b6] hover:text-white font-medium flex items-center gap-1">
                <Check size={14} /> Erledigt
              </button>
            )}
            <button onClick={() => goTo(index + 1)} disabled={index >= steps.length - 1} className="text-white/50 hover:text-white disabled:opacity-30 flex items-center gap-1">
              Weiter <ArrowRight size={14} />
            </button>
          </div>
        )}
        <button onClick={onOpenCvCheck} className="w-full text-left text-[11px] text-white/40 hover:text-white/70">
          Der Kurz-Score bewertet nur Sprache & Struktur. Inhalt, ATS-Lesbarkeit und Stellen-Passung prüft der ausführliche CV-Check →
        </button>
      </div>
    </div>
  );
}

function ContentView({ bullets, text, muted }: { bullets?: string[]; text?: string; muted?: boolean }) {
  const cls = muted ? 'text-white/50' : 'text-white/90';
  if (bullets && bullets.length) {
    return (
      <ul className={`text-sm space-y-1 ${cls}`}>
        {bullets.map((b, i) => <li key={i} className="flex gap-1.5"><span>•</span><span>{b}</span></li>)}
      </ul>
    );
  }
  return <p className={`text-sm ${cls}`}>{text || '–'}</p>;
}

export default CvImprovementJourney;
