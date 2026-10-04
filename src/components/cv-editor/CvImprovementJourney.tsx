// src/components/cv-editor/CvImprovementJourney.tsx
//
// Geführte Verbesserungs-Journey im Live-Editor ("CV-Feinschliff").
// Pro Schritt, von oben nach unten:
//   1. Textblock – so steht der Abschnitt aktuell im CV (nach dem Vorschlag:
//      Vorher/Nachher umschaltbar, geänderte Punkte markiert)
//   2. Kurze Erklärung – ein Satz, warum hier Potenzial liegt
//   3. Optionen zum Antippen – Antwort auf die Frage (z. B. Kennzahl-Spanne)
//      und gewünschte Richtung ("Ergebnisse statt Aufgaben", "Kürzer" …).
//      Freitext nur optional über "Eigene Angabe".
//   4. Ein Klick → Vorschlag (Edge Function cv-improve-section) → Übernehmen
// Der Abschnitt wird parallel im CV groß hervorgehoben (onFocusStep).
// Der Kurz-Score ersetzt bewusst NICHT den kostenpflichtigen CV-Check.

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, Sparkles, X, Lightbulb, Trophy, PenLine, ChevronDown } from 'lucide-react';
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
  /** Antwortmöglichkeiten zum Antippen (von der Optimierung geliefert) */
  options?: string[];
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

// ── Richtungen zum Antippen ────────────────────────────────────────────────
interface Direction {
  label: string;
  /** Wird vorausgewählt, wenn ein Hinweis dazu passt */
  match?: RegExp;
}

const DIRECTIONS: Record<'station' | 'summary' | 'headline', Direction[]> = {
  station: [
    { label: 'Ergebnisse statt Aufgaben', match: /kennzahl|zahl|ergebnis|wirkung|erfolg|aufgabe/i },
    { label: 'Kürzer & prägnanter', match: /lang|kürz|knapp|zeichen/i },
    { label: 'Begriffe der Stelle einbauen', match: /keyword|begriff|stelle|anzeige/i },
    { label: 'Verantwortung zeigen', match: /verantwort|führ|leit|team/i },
    { label: 'Abwechslungsreiche Verben', match: /verb|wiederhol|gleich/i },
  ],
  summary: [
    { label: 'Zielrolle klarer', match: /ziel|rolle|position/i },
    { label: 'Stärken für die Stelle', match: /stärk|argument|stelle|passung/i },
    { label: 'Kürzer & prägnanter', match: /lang|kürz|satz|zeichen/i },
    { label: 'Sachlicher Ton', match: /floskel|ton|sachlich/i },
  ],
  headline: [
    { label: 'Näher am Stellentitel', match: /stelle|titel|position/i },
    { label: 'Spezialisierung zeigen', match: /spezial|schwerpunkt/i },
    { label: 'Kürzer', match: /lang|kürz/i },
  ],
};

const UNKNOWN = 'Weiß ich nicht genau';

function directionsFor(step: JourneyStep | null): Direction[] {
  if (!step) return [];
  if (step.target.type === 'station') return DIRECTIONS.station;
  if (step.target.type === 'summary') return DIRECTIONS.summary;
  if (step.target.type === 'headline') return DIRECTIONS.headline;
  return [];
}

function preselect(step: JourneyStep | null): string[] {
  const dirs = directionsFor(step);
  if (!step || !dirs.length) return [];
  const text = step.issues.join(' ');
  const hits = dirs.filter((d) => d.match?.test(text)).map((d) => d.label);
  return (hits.length ? hits : [dirs[0].label]).slice(0, 2);
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
  const [choice, setChoice] = useState<string | null>(null); // Antwort-Chip
  const [custom, setCustom] = useState(''); // eigene Angabe
  const [showCustom, setShowCustom] = useState(false);
  const [focus, setFocus] = useState<string[]>([]); // gewählte Richtungen
  const [status, setStatus] = useState<Status>('idle');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [view, setView] = useState<'before' | 'after'>('after');
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const customRef = useRef<HTMLInputElement | null>(null);

  const allHandled = steps.length > 0 && steps.every((s) => !isOpen(s.id));
  const step = allHandled ? null : steps[Math.min(index, steps.length - 1)] ?? null;
  const current = step ? getCurrentContent(step) : null;
  const directions = directionsFor(step);
  const answerOptions = step?.question ? (step.options?.length ? step.options : []) : [];

  const liveScore = useMemo(() => scoreEditorCv(editorData).total, [editorData]);
  const doneCount = progress.done.length;

  // Neuer Schritt: im CV hervorheben, Auswahl zurücksetzen
  useEffect(() => {
    onFocusStep(step);
    setChoice(null);
    setCustom('');
    setShowCustom(false);
    setFocus(preselect(step));
    setStatus('idle');
    setProposal(null);
    setView('after');
    setShowAllIssues(false);
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  // Beim Schließen die Hervorhebung entfernen
  useEffect(() => () => onFocusStep(null), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Klick auf eine Markierung im CV → genau diesen Schritt zeigen
  useEffect(() => {
    if (!requestedStep) return;
    const i = steps.findIndex((s) => s.id === requestedStep.id);
    if (i < 0) return;
    if (!isOpen(requestedStep.id)) {
      onProgressChange({
        done: progress.done.filter((id) => id !== requestedStep.id),
        skipped: progress.skipped.filter((id) => id !== requestedStep.id),
      });
    }
    setIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedStep?.nonce]);

  useEffect(() => {
    if (showCustom) customRef.current?.focus();
  }, [showCustom]);

  // Fähigkeiten, die schon im CV stehen (für die Keyword-Chips)
  const existingSkills = useMemo(() => {
    const sec = (editorData?.sections ?? []).find((x: any) => x?.type === 'skills');
    const items: any[] = Array.isArray(sec?.items) ? sec.items : [];
    return new Set(items.map((it) => String(it?.name ?? it ?? '').trim().toLowerCase()));
  }, [editorData]);

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

  /** Antwort für die KI: gewählter Chip oder eigene Angabe, als ganzer Satz mit Frage. */
  const composedAnswer = () => {
    if (!step?.question) return custom.trim();
    const value = showCustom && custom.trim() ? custom.trim() : choice && choice !== UNKNOWN ? choice : '';
    return value ? `${step.question} → ${value}` : '';
  };

  const optimize = async () => {
    if (!step || step.target.type === 'section') return;
    setStatus('loading');
    setError(null);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke('cv-improve-section', {
        body: {
          cv_id: cvId,
          target: step.target,
          issues: step.issues,
          answer: composedAnswer(),
          focus,
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
      setView('after');
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

  // Tastatur: Enter = Vorschlag / Übernehmen (nicht beim Tippen im CV)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.shiftKey || !step?.actionable) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || t.tagName === 'TEXTAREA')) return;
      if (t && t.tagName === 'INPUT' && t !== customRef.current) return;
      e.preventDefault();
      if (status === 'proposal') applyProposal();
      else if (status !== 'loading') optimize();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const toggleFocus = (label: string) =>
    setFocus((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label].slice(-3)));

  // ── Darstellung ──────────────────────────────────────────────────────────
  const scoreDelta = scoreBefore != null ? liveScore - scoreBefore : null;
  const isAfter = status === 'proposal' && !!proposal && view === 'after';
  const shownContent: JourneyCurrentContent | null = isAfter ? proposal : current;
  const beforeSet = new Set((current?.bullet_points ?? []).map((b) => b.trim()));

  return (
    <div
      data-journey-panel
      className="fixed z-[60] bg-[#121216] border border-[#66c0b6]/30 shadow-2xl flex flex-col
                 inset-x-2 bottom-2 max-h-[70vh] rounded-2xl
                 sm:inset-x-auto sm:right-4 sm:top-28 sm:bottom-4 sm:w-[390px] sm:max-h-none"
    >
      <style>{`@keyframes journeyIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>

      {/* Kopf: Titel, Kurz-Score, Fortschritt */}
      <div className="px-5 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#66c0b6]" />
            <h3 className="text-white font-semibold">CV-Feinschliff</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1" title={`Kurz-Score Sprache & Struktur · ${scoreLabel(liveScore)}`}>
              {scoreBefore != null && scoreBefore !== liveScore && (
                <span className="text-white/35 text-xs line-through">{scoreBefore}</span>
              )}
              <span className="text-lg font-bold text-white tabular-nums">{liveScore}</span>
              <span className="text-[10px] text-white/40">/100</span>
              {scoreDelta != null && scoreDelta > 0 && <span className="text-[11px] text-[#66c0b6] font-semibold">+{scoreDelta}</span>}
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Schließen">
              <X size={18} />
            </button>
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
      <div className="flex-1 overflow-y-auto px-5 py-4">
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
          <div key={step.id} className="space-y-4" style={{ animation: 'journeyIn .25s ease-out' }}>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-white font-semibold leading-snug">{step.title}</p>
              <span className="text-[11px] text-white/40 whitespace-nowrap tabular-nums">{index + 1} / {steps.length}</span>
            </div>

            {/* 1 · Textblock */}
            {shownContent && (shownContent.bullet_points?.length || shownContent.text) ? (
              <div
                className={`rounded-xl border p-3 transition-colors ${
                  isAfter ? 'border-[#66c0b6]/60 bg-[#66c0b6]/[0.08]' : 'border-white/10 bg-white/[0.03]'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] uppercase tracking-wider ${isAfter ? 'text-[#66c0b6]' : 'text-white/40'}`}>
                    {isAfter ? 'Vorschlag' : 'Aktuell im CV'}
                  </span>
                  {status === 'proposal' && (
                    <div className="flex rounded-lg bg-white/5 p-0.5 text-[11px]">
                      {(['before', 'after'] as const).map((v) => (
                        <button
                          key={v}
                          onClick={() => setView(v)}
                          className={`px-2.5 py-1 rounded-md transition-colors ${view === v ? 'bg-white/15 text-white' : 'text-white/50 hover:text-white/80'}`}
                        >
                          {v === 'before' ? 'Vorher' : 'Nachher'}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {shownContent.bullet_points?.length ? (
                  <ul className="space-y-1.5">
                    {shownContent.bullet_points.map((b, i) => {
                      const isNew = isAfter && !beforeSet.has(b.trim());
                      return (
                        <li key={i} className={`flex gap-2 text-[13px] leading-snug ${status === 'proposal' && !isAfter ? 'text-white/50' : 'text-white/90'}`}>
                          <span className={`mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${isNew ? 'bg-[#30E3CA]' : 'bg-white/30'}`} />
                          <span>{b}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className={`text-[13px] leading-snug ${status === 'proposal' && !isAfter ? 'text-white/50' : 'text-white/90'}`}>{shownContent.text}</p>
                )}
              </div>
            ) : null}

            {/* 2 · Kurze Erklärung */}
            <div className="flex items-start gap-2">
              <Lightbulb size={15} className="text-amber-300 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-white/80 leading-snug">
                <p>{step.issues[0]}</p>
                {step.issues.length > 1 && (
                  <>
                    {showAllIssues && step.issues.slice(1).map((issue, i) => <p key={i} className="mt-1 text-white/65">{issue}</p>)}
                    <button onClick={() => setShowAllIssues((v) => !v)} className="mt-1 text-[11px] text-white/45 hover:text-white/75 flex items-center gap-0.5">
                      {showAllIssues ? 'Weniger' : `+${step.issues.length - 1} weitere Hinweise`}
                      <ChevronDown size={12} className={showAllIssues ? 'rotate-180' : ''} />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Begriffe aus der Stellenanzeige */}
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
                  Ein Klick fügt den Begriff unter „Fähigkeiten“ hinzu. Ergänze nur, was du wirklich kannst.
                </p>
              </div>
            )}

            {/* Reiner Hinweis (z. B. Sprachniveau ergänzen) */}
            {!step.actionable && step.id !== 'keywords' && (
              <p className="text-xs text-white/50 flex items-center gap-1.5">
                <PenLine size={13} /> Klicke im CV auf den markierten Bereich, um ihn direkt zu bearbeiten.
              </p>
            )}

            {/* 3 · Optionen */}
            {step.actionable && status !== 'proposal' && (
              <div className="space-y-4">
                {step.question && (
                  <div className="space-y-2">
                    <p className="text-[13px] text-white font-medium">{step.question}</p>
                    <div className="flex flex-wrap gap-2">
                      {[...answerOptions, UNKNOWN].map((opt) => {
                        const active = !showCustom && choice === opt;
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => { setChoice(active ? null : opt); setShowCustom(false); }}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                              active
                                ? 'bg-[#66c0b6] border-[#66c0b6] text-black'
                                : opt === UNKNOWN
                                  ? 'border-white/10 text-white/50 hover:text-white/80'
                                  : 'bg-white/5 border-white/15 text-white/85 hover:border-[#66c0b6]/70'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={() => { setShowCustom((v) => !v); setChoice(null); }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                          showCustom ? 'bg-white/15 border-white/30 text-white' : 'border-dashed border-white/20 text-white/60 hover:text-white'
                        }`}
                      >
                        <PenLine size={11} /> Eigene Angabe
                      </button>
                    </div>
                    {showCustom && (
                      <input
                        ref={customRef}
                        value={custom}
                        onChange={(e) => setCustom(e.target.value)}
                        maxLength={160}
                        placeholder="z. B. 18 Kunden, 3 Standorte …"
                        className="w-full px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-white text-sm placeholder-white/30 focus:outline-none focus:border-[#66c0b6]"
                      />
                    )}
                  </div>
                )}

                {directions.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[13px] text-white font-medium">Was soll besser werden?</p>
                    <div className="flex flex-wrap gap-2">
                      {directions.map((d) => {
                        const active = focus.includes(d.label);
                        return (
                          <button
                            key={d.label}
                            type="button"
                            onClick={() => toggleFocus(d.label)}
                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all flex items-center gap-1 ${
                              active ? 'bg-[#66c0b6]/20 border-[#66c0b6] text-white' : 'bg-white/5 border-white/15 text-white/70 hover:border-[#66c0b6]/70'
                            }`}
                          >
                            {active && <Check size={11} strokeWidth={3} className="text-[#66c0b6]" />}
                            {d.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {status === 'error' && error && <p className="text-sm text-red-400">{error}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Aktionen + Navigation */}
      <div className="px-5 py-3 border-t border-white/10 flex-shrink-0 space-y-2.5">
        {!allHandled && step && step.actionable && (
          status === 'proposal' ? (
            <div className="flex gap-2">
              <button onClick={applyProposal} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold flex items-center justify-center gap-1.5">
                <Check size={17} /> Übernehmen
              </button>
              <button onClick={optimize} className="px-3 py-3 rounded-xl border border-white/15 text-white/80 hover:text-white flex items-center" title="Anderen Vorschlag erzeugen" aria-label="Anderen Vorschlag erzeugen">
                <RotateCcw size={15} />
              </button>
              <button onClick={() => { setStatus('idle'); setProposal(null); }} className="px-3 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm" title="Auswahl ändern">
                Ändern
              </button>
            </div>
          ) : (
            <button
              onClick={optimize}
              disabled={status === 'loading'}
              className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {status === 'loading'
                ? <><Loader2 size={18} className="animate-spin" /> Vorschlag wird erstellt …</>
                : <><Sparkles size={18} /> Vorschlag erstellen</>}
            </button>
          )
        )}

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

export default CvImprovementJourney;
