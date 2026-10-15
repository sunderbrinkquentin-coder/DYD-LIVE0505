// src/components/cv-editor/CvImprovementJourney.tsx
//
// Optionales Anpassen-Panel im Live-Editor ("Gefällt dir etwas nicht?").
// Bewusst KEINE Pflicht-Checkliste: kein Fortschrittsbalken, kein "1/7",
// kein "Überspringen". Pro Abschnitt, von oben nach unten:
//   1. Inhalt direkt hier bearbeiten (Titel, Zeitraum, Stichpunkte bzw. Text)
//      → wird live in den CV übernommen
//   2. Optional: Tipp aus der Optimierung
//   3. Optional: "Mit KI umformulieren" – Chips antippen (was soll sich ändern?)
//      → Vorschlag (Edge Function cv-improve-section) → Übernehmen
// Der Abschnitt wird parallel im CV hervorgehoben (onFocusStep).

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, Sparkles, X, Lightbulb, PenLine, ChevronDown, Plus, Trash2 } from 'lucide-react';
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
  date_from?: string;
  date_to?: string;
  bullet_points?: string[];
  text?: string;
  /** Woher die Stichpunkte stammen – dorthin wird beim Bearbeiten zurückgeschrieben */
  bulletSource?: 'bullets' | 'description';
  isEducation?: boolean;
}

/** Änderung an einer Station aus dem Panel heraus */
export interface JourneyStationPatch {
  title?: string;
  company?: string;
  date_from?: string;
  date_to?: string;
  bullets?: string[];
  bulletSource?: 'bullets' | 'description';
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
  /** Direkte Bearbeitung einer Station im Panel (live in den CV) */
  onUpdateStation?: (sid: string, patch: JourneyStationPatch) => void;
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
}

const DIRECTIONS: Record<'station' | 'summary' | 'headline', Direction[]> = {
  station: [
    { label: 'Mehr Ergebnisse statt Aufgaben' },
    { label: 'Kürzer & prägnanter' },
    { label: 'Begriffe der Stelle einbauen' },
    { label: 'Mehr Verantwortung zeigen' },
    { label: 'Klingt nicht nach mir' },
  ],
  summary: [
    { label: 'Zielrolle klarer' },
    { label: 'Stärken für die Stelle' },
    { label: 'Kürzer & prägnanter' },
    { label: 'Klingt nicht nach mir' },
  ],
  headline: [
    { label: 'Näher am Stellentitel' },
    { label: 'Spezialisierung zeigen' },
    { label: 'Kürzer' },
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

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-white/15 bg-white/5 text-white text-[13px] placeholder-white/30 focus:outline-none focus:border-[#66c0b6]';
const labelCls = 'block text-[10px] uppercase tracking-wider text-white/40 mb-1';

/** Textarea, die mit dem Inhalt mitwächst (kein inneres Scrollen nötig). */
function AutoTextarea({ value, onChange, placeholder, minRows = 2 }: { value: string; onChange: (v: string) => void; placeholder?: string; minRows?: number }) {
  const ref = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      rows={minRows}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      className={`${inputCls} resize-none leading-snug overflow-hidden`}
    />
  );
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
  onUpdateStation,
  onOpenCvCheck,
  onClose,
  requestedStep,
  missingKeywords = [],
  onAddSkill,
}: Props) {
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<string | null>(null); // Antwort-Chip
  const [custom, setCustom] = useState(''); // eigene Angabe
  const [showCustom, setShowCustom] = useState(false);
  const [focus, setFocus] = useState<string[]>([]); // gewählte Richtungen
  const [wish, setWish] = useState(''); // freier Änderungswunsch
  const [showAi, setShowAi] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [view, setView] = useState<'before' | 'after'>('after');
  const [showAllIssues, setShowAllIssues] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justApplied, setJustApplied] = useState(false);
  const [draft, setDraft] = useState<JourneyCurrentContent | null>(null);
  const customRef = useRef<HTMLInputElement | null>(null);
  const draftDirtyRef = useRef(false);

  const step = steps[Math.min(index, steps.length - 1)] ?? null;
  const current = step ? getCurrentContent(step) : null;
  const directions = directionsFor(step);
  const answerOptions = step?.question ? (step.options?.length ? step.options : []) : [];
  const isStation = step?.target.type === 'station';
  const isText = step?.target.type === 'summary' || step?.target.type === 'headline';

  const liveScore = useMemo(() => scoreEditorCv(editorData).total, [editorData]);

  // Neuer Abschnitt: im CV hervorheben, Auswahl + Entwurf zurücksetzen
  useEffect(() => {
    onFocusStep(step);
    setChoice(null);
    setCustom('');
    setShowCustom(false);
    setFocus([]);
    setWish('');
    setShowAi(false);
    setStatus('idle');
    setProposal(null);
    setView('after');
    setShowAllIssues(false);
    setError(null);
    setJustApplied(false);
    draftDirtyRef.current = false;
    setDraft(step ? getCurrentContent(step) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step?.id]);

  // Beim Schließen die Hervorhebung entfernen
  useEffect(() => () => onFocusStep(null), []); // eslint-disable-line react-hooks/exhaustive-deps

  // Klick auf eine Markierung im CV → genau diesen Abschnitt zeigen
  useEffect(() => {
    if (!requestedStep) return;
    const i = steps.findIndex((s) => s.id === requestedStep.id);
    if (i >= 0) setIndex(i);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedStep?.nonce]);

  useEffect(() => {
    if (showCustom) customRef.current?.focus();
  }, [showCustom]);

  // ── Entwurf → CV (leicht verzögert, damit der CV nicht bei jedem Tastendruck neu umbricht)
  useEffect(() => {
    if (!step || !draft || !draftDirtyRef.current) return;
    const t = window.setTimeout(() => {
      if (step.target.type === 'station') {
        onUpdateStation?.(step.target.sid, {
          title: draft.title ?? '',
          company: draft.company ?? '',
          date_from: draft.date_from ?? '',
          date_to: draft.date_to ?? '',
          bullets: (draft.bullet_points ?? []).map((b) => b.trim()).filter(Boolean),
          bulletSource: draft.bulletSource,
        });
      } else if (step.target.type === 'summary' || step.target.type === 'headline') {
        onApplyText(step.target.type, draft.text ?? '');
      }
    }, 350);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const editDraft = (patch: Partial<JourneyCurrentContent>) => {
    draftDirtyRef.current = true;
    setJustApplied(false);
    setDraft((d) => ({ ...(d ?? {}), ...patch }));
  };
  const editBullet = (i: number, v: string) => {
    const list = [...(draft?.bullet_points ?? [])];
    list[i] = v;
    editDraft({ bullet_points: list });
  };
  const removeBullet = (i: number) => editDraft({ bullet_points: (draft?.bullet_points ?? []).filter((_, k) => k !== i) });
  const addBullet = () => editDraft({ bullet_points: [...(draft?.bullet_points ?? []), ''] });

  // Fähigkeiten, die schon im CV stehen (für die Keyword-Chips)
  const existingSkills = useMemo(() => {
    const sec = (editorData?.sections ?? []).find((x: any) => x?.type === 'skills');
    const items: any[] = Array.isArray(sec?.items) ? sec.items : [];
    return new Set(items.map((it) => String(it?.name ?? it ?? '').trim().toLowerCase()));
  }, [editorData]);

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(steps.length - 1, i)));

  /** Antwort für die KI: gewählter Chip / eigene Angabe + freier Wunsch. */
  const composedAnswer = () => {
    const parts: string[] = [];
    if (step?.question) {
      const value = showCustom && custom.trim() ? custom.trim() : choice && choice !== UNKNOWN ? choice : '';
      if (value) parts.push(`${step.question} → ${value}`);
    }
    if (wish.trim()) parts.push(`Wunsch der Person: ${wish.trim()}`);
    return parts.join('\n');
  };

  // Für die KI immer den AKTUELLEN Entwurf schicken (inkl. eigener Änderungen)
  const contentForAi = (): JourneyCurrentContent => {
    const d = draft ?? current ?? {};
    return { title: d.title, company: d.company, bullet_points: (d.bullet_points ?? []).filter((b) => b.trim()), text: d.text };
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
          current: contentForAi(),
        },
      });
      if (invokeError || !data?.success) {
        let message = data?.error as string | undefined;
        if (!message && invokeError && 'context' in invokeError) {
          try {
            message = (await (invokeError as any).context.json())?.error;
          } catch { /* ignore */ }
        }
        throw new Error(message || 'Der Vorschlag konnte nicht erstellt werden. Bitte versuche es erneut.');
      }
      setProposal({ bullet_points: data.bullet_points, text: data.text });
      setView('after');
      setStatus('proposal');
    } catch (e: any) {
      setError(e?.message ?? 'Der Vorschlag konnte nicht erstellt werden.');
      setStatus('error');
    }
  };

  const applyProposal = () => {
    if (!step || !proposal) return;
    if (step.target.type === 'station' && proposal.bullet_points?.length) {
      // Über den Entwurf übernehmen → landet in Feldern UND im CV, bleibt weiter bearbeitbar
      editDraft({ bullet_points: proposal.bullet_points, bulletSource: draft?.bulletSource === 'description' && !draft?.isEducation ? 'bullets' : draft?.bulletSource });
      if (!onUpdateStation) onApplyStation(step.target.sid, proposal.bullet_points);
    } else if ((step.target.type === 'summary' || step.target.type === 'headline') && proposal.text) {
      editDraft({ text: proposal.text });
    }
    onProgressChange({
      done: [...new Set([...progress.done, step.id])],
      skipped: progress.skipped.filter((id) => id !== step.id),
    });
    setStatus('idle');
    setProposal(null);
    setShowAi(false);
    setJustApplied(true);
  };

  const toggleFocus = (label: string) =>
    setFocus((prev) => (prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label].slice(-3)));

  // ── Darstellung ──────────────────────────────────────────────────────────
  const scoreDelta = scoreBefore != null ? liveScore - scoreBefore : null;
  const beforeSet = new Set((draft?.bullet_points ?? []).map((b) => b.trim()));
  const proposalShown: JourneyCurrentContent | null =
    status === 'proposal' && proposal ? (view === 'after' ? proposal : contentForAi()) : null;
  const canEdit = !!step && (isText || (isStation && !!onUpdateStation));

  return (
    <div
      data-journey-panel
      className="fixed z-[60] bg-[#121216] border border-[#66c0b6]/30 shadow-2xl flex flex-col
                 inset-x-2 bottom-2 max-h-[75vh] rounded-2xl
                 sm:inset-x-auto sm:right-4 sm:top-28 sm:bottom-4 sm:w-[400px] sm:max-h-none"
    >
      <style>{`@keyframes journeyIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>

      {/* Kopf */}
      <div className="px-5 pt-4 pb-3 border-b border-white/10 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-[#66c0b6]" />
            <h3 className="text-white font-semibold">CV anpassen</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-baseline gap-1" title={`Kurz-Score Sprache & Struktur · ${scoreLabel(liveScore)}`}>
              <span className="text-sm font-semibold text-white/80 tabular-nums">{liveScore}</span>
              <span className="text-[10px] text-white/40">/100</span>
              {scoreDelta != null && scoreDelta > 0 && <span className="text-[11px] text-[#66c0b6] font-semibold">+{scoreDelta}</span>}
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white" aria-label="Schließen">
              <X size={18} />
            </button>
          </div>
        </div>
        <p className="mt-1 text-xs text-white/45">
          Dein CV ist fertig. Gefällt dir etwas nicht? Ändere es hier – oder lass es dir umformulieren.
        </p>

        {/* Abschnitts-Auswahl statt Fortschrittsbalken */}
        {steps.length > 1 && (
          <div className="mt-3 relative">
            <select
              value={step?.id ?? ''}
              onChange={(e) => goTo(steps.findIndex((s) => s.id === e.target.value))}
              className="w-full appearance-none pl-3 pr-8 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-[#66c0b6]"
            >
              {steps.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#121216]">
                  {progress.done.includes(s.id) ? '✓ ' : ''}{s.title}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
          </div>
        )}
      </div>

      {/* Inhalt */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">
        {!step ? null : (
          <div key={step.id} className="space-y-4" style={{ animation: 'journeyIn .25s ease-out' }}>
            {steps.length <= 1 && <p className="text-white font-semibold leading-snug">{step.title}</p>}

            {/* 1 · Inhalt bearbeiten */}
            {canEdit && draft && status !== 'proposal' && (
              <div className="space-y-3">
                {isStation && (
                  <>
                    <div>
                      <label className={labelCls}>{draft.isEducation ? 'Abschluss' : 'Position'}</label>
                      <input value={draft.title ?? ''} onChange={(e) => editDraft({ title: e.target.value })} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>{draft.isEducation ? 'Schule / Hochschule' : 'Unternehmen'}</label>
                      <input value={draft.company ?? ''} onChange={(e) => editDraft({ company: e.target.value })} className={inputCls} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>Von</label>
                        <input value={draft.date_from ?? ''} onChange={(e) => editDraft({ date_from: e.target.value })} placeholder="MM/JJJJ" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Bis</label>
                        <input value={draft.date_to ?? ''} onChange={(e) => editDraft({ date_to: e.target.value })} placeholder="MM/JJJJ oder Heute" className={inputCls} />
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>{draft.isEducation && draft.bulletSource === 'description' ? 'Schwerpunkte / Inhalte' : 'Stichpunkte'}</label>
                      <div className="space-y-2">
                        {(draft.bullet_points ?? []).map((b, i) => (
                          <div key={i} className="flex gap-1.5 items-start">
                            <div className="flex-1">
                              <AutoTextarea value={b} onChange={(v) => editBullet(i, v)} minRows={1} />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeBullet(i)}
                              className="mt-2 text-white/30 hover:text-red-400"
                              aria-label="Stichpunkt löschen"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        <button type="button" onClick={addBullet} className="text-xs text-[#66c0b6] hover:text-white flex items-center gap-1">
                          <Plus size={13} /> Stichpunkt hinzufügen
                        </button>
                      </div>
                    </div>
                  </>
                )}
                {isText && (
                  <div>
                    <label className={labelCls}>{step.target.type === 'headline' ? 'Überschrift unter deinem Namen' : 'Profil / Kurzvorstellung'}</label>
                    <AutoTextarea value={draft.text ?? ''} onChange={(v) => editDraft({ text: v })} minRows={step.target.type === 'headline' ? 1 : 4} />
                  </div>
                )}
                {justApplied && (
                  <p className="text-xs text-[#66c0b6] flex items-center gap-1"><Check size={13} /> Übernommen – du kannst den Text oben weiter anpassen.</p>
                )}
              </div>
            )}

            {/* Vorschlag (Vorher/Nachher) */}
            {proposalShown && (
              <div className={`rounded-xl border p-3 ${view === 'after' ? 'border-[#66c0b6]/60 bg-[#66c0b6]/[0.08]' : 'border-white/10 bg-white/[0.03]'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] uppercase tracking-wider ${view === 'after' ? 'text-[#66c0b6]' : 'text-white/40'}`}>
                    {view === 'after' ? 'Vorschlag' : 'Deine Version'}
                  </span>
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
                </div>
                {proposalShown.bullet_points?.length ? (
                  <ul className="space-y-1.5">
                    {proposalShown.bullet_points.map((b, i) => {
                      const isNew = view === 'after' && !beforeSet.has(b.trim());
                      return (
                        <li key={i} className="flex gap-2 text-[13px] leading-snug text-white/90">
                          <span className={`mt-[7px] h-1.5 w-1.5 flex-shrink-0 rounded-full ${isNew ? 'bg-[#30E3CA]' : 'bg-white/30'}`} />
                          <span>{b}</span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-[13px] leading-snug text-white/90">{proposalShown.text}</p>
                )}
              </div>
            )}

            {/* Nicht editierbarer Abschnitt (z. B. Sprachen) → Hinweis */}
            {!canEdit && step.id !== 'keywords' && (
              <p className="text-xs text-white/50 flex items-center gap-1.5">
                <PenLine size={13} /> Diesen Bereich bearbeitest du direkt im CV – einfach auf den markierten Bereich klicken.
              </p>
            )}

            {/* 2 · Tipp (dezent, aufklappbar) */}
            {step.issues.length > 0 && step.issues[0] && (
              <div className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                <Lightbulb size={14} className="text-amber-300/80 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-white/60 leading-snug">
                  <p><span className="text-white/75">Tipp:</span> {step.issues[0]}</p>
                  {step.issues.length > 1 && (
                    <>
                      {showAllIssues && step.issues.slice(1).map((issue, i) => <p key={i} className="mt-1">{issue}</p>)}
                      <button onClick={() => setShowAllIssues((v) => !v)} className="mt-1 text-[11px] text-white/40 hover:text-white/70 flex items-center gap-0.5">
                        {showAllIssues ? 'Weniger' : `+${step.issues.length - 1} weitere`}
                        <ChevronDown size={12} className={showAllIssues ? 'rotate-180' : ''} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

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

            {/* 3 · Optional: mit KI umformulieren */}
            {step.actionable && status !== 'proposal' && (
              <div className="rounded-xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAi((v) => !v)}
                  className="w-full px-3 py-2.5 flex items-center justify-between text-sm text-white/85 hover:text-white"
                >
                  <span className="flex items-center gap-2"><Sparkles size={14} className="text-[#66c0b6]" /> Gefällt dir nicht? Umformulieren lassen</span>
                  <ChevronDown size={14} className={`text-white/40 transition-transform ${showAi ? 'rotate-180' : ''}`} />
                </button>

                {showAi && (
                  <div className="px-3 pb-3 space-y-4">
                    {directions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-[13px] text-white font-medium">Was soll sich ändern?</p>
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
                        <input
                          value={wish}
                          onChange={(e) => setWish(e.target.value)}
                          maxLength={200}
                          placeholder="Oder in eigenen Worten, z. B. „weniger förmlich“"
                          className={inputCls}
                        />
                      </div>
                    )}

                    {step.question && (
                      <div className="space-y-2">
                        <p className="text-[13px] text-white/80">{step.question} <span className="text-white/40">(optional)</span></p>
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
                            className={inputCls}
                          />
                        )}
                      </div>
                    )}

                    {status === 'error' && error && <p className="text-sm text-red-400">{error}</p>}

                    <button
                      onClick={optimize}
                      disabled={status === 'loading'}
                      className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                    >
                      {status === 'loading'
                        ? <><Loader2 size={17} className="animate-spin" /> Vorschlag wird erstellt …</>
                        : <><Sparkles size={17} /> Vorschlag erstellen</>}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Aktionen + Navigation */}
      <div className="px-5 py-3 border-t border-white/10 flex-shrink-0 space-y-2.5">
        {step && status === 'proposal' && (
          <div className="flex gap-2">
            <button onClick={applyProposal} className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold flex items-center justify-center gap-1.5">
              <Check size={17} /> Übernehmen
            </button>
            <button onClick={optimize} className="px-3 py-3 rounded-xl border border-white/15 text-white/80 hover:text-white flex items-center" title="Anderen Vorschlag erzeugen" aria-label="Anderen Vorschlag erzeugen">
              <RotateCcw size={15} />
            </button>
            <button onClick={() => { setStatus('idle'); setProposal(null); }} className="px-3 py-3 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm" title="Vorschlag verwerfen">
              Verwerfen
            </button>
          </div>
        )}

        {step && (
          <div className="flex items-center justify-between text-sm">
            <button onClick={() => goTo(index - 1)} disabled={index === 0} className="text-white/50 hover:text-white disabled:opacity-30 flex items-center gap-1">
              <ArrowLeft size={14} /> Zurück
            </button>
            <button onClick={onClose} className="text-[#66c0b6] hover:text-white font-medium flex items-center gap-1">
              <Check size={14} /> Fertig
            </button>
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