import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertCircle, ArrowLeft, ArrowRight, Check, FileText, PenLine, RotateCcw, ShieldCheck, Sparkles, Wand2, X,
} from 'lucide-react';
import type { TrackedApplication } from '../../../types/applications';
import type { CoverLetterBrief } from '../../../types/coverLetter';
import {
  COVER_LETTER_PRICE, CULTURE_OPTIONS, EMPTY_BRIEF, LENGTH_OPTIONS, LEVEL_OPTIONS, MOTIVATION_OPTIONS,
  SPECIAL_OPTIONS, START_OPTIONS, TONE_OPTIONS, formatEuro,
} from '../../../types/coverLetter';
import { supabase } from '../../../lib/supabase';

/**
 * Anschreiben-Studio: Vollbild-Fokusmodus mit Fragebogen und Schreib-Animation.
 * Läuft über dem Drawer (Portal), damit Nutzer:innen nicht abgelenkt werden.
 */
interface CoverLetterStudioProps {
  app: TrackedApplication;
  mode: 'new' | 'regenerate';
  onClose: () => void;
  /** Erstellt das Anschreiben. Wirft bei Fehlern (Meldung wird im Studio angezeigt). */
  onGenerate: (brief: CoverLetterBrief, jobText: string) => Promise<void>;
}

type StepId = 'job' | 'level' | 'culture' | 'motivation' | 'strengths' | 'special' | 'style';
type Phase = 'questions' | 'writing' | 'done' | 'error';

interface Highlight { id: string; label: string; sub?: string }

// ─── CV auslesen (tolerant gegenüber den verschiedenen cv_data-Formaten) ──
type Obj = Record<string, unknown>;
const asObj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});
const asArr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);
const txt = (...vals: unknown[]) => (vals.find((v) => typeof v === 'string' && v.trim()) as string | undefined) ?? '';
const yearOf = (v: unknown) => (typeof v === 'string' ? v.match(/(19|20)\d{2}/)?.[0] ?? '' : '');

function extractHighlights(cvRaw: unknown): Highlight[] {
  const cv = asObj(cvRaw);
  const out: Highlight[] = [];
  const push = (label: string, sub?: string) => {
    const l = label.trim();
    if (l && !out.some((h) => h.label === l)) out.push({ id: `h${out.length}`, label: l, sub });
  };

  for (const raw of asArr(cv.workExperiences ?? cv.experience ?? cv.experiences ?? cv.berufserfahrung)) {
    const j = asObj(raw);
    const title = txt(j.jobTitle, j.position, j.title, j.role);
    const company = txt(j.company, j.employer, j.unternehmen);
    const from = yearOf(j.startDate ?? j.start ?? j.from);
    const to = j.current ? 'heute' : yearOf(j.endDate ?? j.end ?? j.to);
    if (title) push(company ? `${title} · ${company}` : title, [from, to].filter(Boolean).join('–'));
  }
  for (const raw of asArr(cv.professionalEducation ?? cv.education).slice(0, 2)) {
    const e = asObj(raw);
    const degree = txt(e.degree, e.title);
    const inst = txt(e.institution, e.school);
    const thesis = txt(e.thesisTitle);
    if (degree) push(inst ? `${degree} · ${inst}` : degree, thesis ? `Abschlussarbeit: ${thesis}` : undefined);
  }
  for (const raw of asArr(cv.projects).slice(0, 2)) {
    const name = txt(asObj(raw).title, asObj(raw).name);
    if (name) push(`Projekt: ${name}`);
  }
  return out.slice(0, 8);
}

function guessLevel(cvRaw: unknown): CoverLetterBrief['level'] {
  const cv = asObj(cvRaw);
  if (cv.experienceLevel === 'beginner') return 'einstieg';
  if (cv.experienceLevel === 'some-experience') return 'young_professional';
  if (cv.targetRole === 'teamlead') return 'fuehrung';
  if (cv.targetRole === 'senior') return 'senior';
  if (cv.experienceLevel === 'experienced') return 'professional';
  return undefined;
}


// ─── UI-Bausteine (dunkles DYD-Design) ───────────────────────────────
function OptionCard({
  active, onClick, title, sub, emoji, hotkey,
}: { active: boolean; onClick: () => void; title: string; sub?: string; emoji?: string; hotkey?: number }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition-all duration-150 active:scale-[0.985] ${
        active
          ? 'border-[#30E3CA] bg-[#30E3CA]/[0.12] shadow-[0_0_0_4px_rgba(48,227,202,0.12)]'
          : 'border-white/10 bg-white/[0.04] hover:border-white/25 hover:bg-white/[0.07]'
      }`}
    >
      {emoji && (
        <span
          className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-[19px] transition-colors ${
            active ? 'bg-[#30E3CA]/20' : 'bg-white/[0.06] group-hover:bg-white/10'
          }`}
        >
          {emoji}
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold leading-snug text-white">{title}</span>
        {sub && <span className="mt-0.5 block text-[12px] leading-snug text-white/50">{sub}</span>}
      </span>
      {active ? (
        <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-[#30E3CA]">
          <Check className="h-3.5 w-3.5 text-black" strokeWidth={3} />
        </span>
      ) : hotkey ? (
        <kbd className="hidden h-5 min-w-[20px] flex-shrink-0 items-center justify-center rounded-md border border-white/15 px-1 text-[10px] font-semibold text-white/40 sm:flex">
          {hotkey}
        </kbd>
      ) : null}
    </button>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] transition-all ${
        active ? 'border-[#30E3CA] bg-[#30E3CA]/15 font-semibold text-white' : 'border-white/15 text-white/65 hover:border-white/30 hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

const fieldCls =
  'w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] leading-relaxed text-white outline-none transition-colors placeholder:text-white/30 focus:border-[#30E3CA]/70 focus:bg-white/[0.06]';

const Label = ({ children, hint }: { children: React.ReactNode; hint?: string }) => (
  <p className="mb-2 mt-6 text-[13px] font-semibold text-white">
    {children} {hint && <span className="font-normal text-white/40">{hint}</span>}
  </p>
);

// ─── Schreib-Animation ───────────────────────────────────────────────
const WRITING_STEPS = [
  { at: 0, label: 'Stellenanzeige analysieren' },
  { at: 0.14, label: 'Deine Antworten einarbeiten' },
  { at: 0.32, label: 'Belege aus deinem Lebenslauf auswählen' },
  { at: 0.55, label: 'Anschreiben in deinem Ton formulieren' },
  { at: 0.8, label: 'Floskel-Check & Feinschliff' },
];

const WRITING_TIPS = [
  'Wir starten mit deinem stärksten Argument – Recruiter entscheiden oft schon nach den ersten Zeilen.',
  'Jede Aussage wird mit deinem Lebenslauf belegt. Erfunden wird nichts.',
  'Typische KI-Floskeln wie „mit großem Interesse“ fliegen automatisch raus.',
  'Zu jedem Absatz bekommst du eine Erklärung, warum er so formuliert ist.',
  'Danach kannst du jeden Absatz selbst ändern oder per Klick umformulieren lassen.',
];

function WritingView({ app, brief, progress }: { app: TrackedApplication; brief: CoverLetterBrief; progress: number }) {
  const [tip, setTip] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTip((i) => (i + 1) % WRITING_TIPS.length), 5200);
    return () => window.clearInterval(t);
  }, []);

  const ownWords = brief.motivation_own_words || brief.proudest;
  // 5 Absätze à 3–4 Zeilen, die nacheinander "geschrieben" werden
  const lines = [[92, 100, 64], [100, 96, 100, 48], [100, 88, 100, 72], [96, 100, 58], [70, 40]];
  const total = lines.flat().length;
  const written = Math.floor(progress * total);
  let n = 0;

  return (
    <div className="m-auto grid w-full max-w-5xl items-center gap-8 px-4 py-8 lg:grid-cols-[1fr_360px] lg:gap-12">
      {/* Papier (mobil unter dem Status und kleiner) */}
      <div className="relative order-2 mx-auto w-full max-w-[280px] sm:max-w-[420px] lg:order-1 lg:max-w-[520px]">
        <div className="absolute -inset-8 rounded-[40px] bg-[#30E3CA]/10 blur-3xl" />
        <div className="relative aspect-[1/1.2] rounded-2xl bg-white p-5 shadow-2xl sm:p-9">
          <div className="mb-6 h-2.5 w-24 rounded-full bg-gray-200" />
          <div className="mb-5 h-3 w-3/5 rounded-full bg-gray-800/80" />
          <div className="mb-5 h-2.5 w-2/5 rounded-full bg-gray-300" />
          <div className="space-y-5">
            {lines.map((para, pi) => (
              <div key={pi} className="space-y-2">
                {para.map((w, li) => {
                  const idx = n++;
                  const done = idx < written;
                  const current = idx === written;
                  return (
                    <div key={li} className="h-2.5">
                      <div
                        className="relative h-full rounded-full bg-gray-700/70 transition-[width] duration-700 ease-out"
                        style={{ width: done ? `${w}%` : current ? `${w * 0.45}%` : '0%' }}
                      >
                        {current && <span className="absolute -right-1.5 top-[-5px] h-5 w-0.5 animate-pulse bg-[#3a9e94]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="absolute bottom-6 right-7 flex items-center gap-1.5 rounded-full bg-[#30E3CA]/15 px-2.5 py-1 text-[11px] font-semibold text-[#2f857c]">
            <PenLine className="h-3 w-3" /> schreibt …
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="order-1 lg:order-2">
        <p className="text-[12px] font-semibold uppercase tracking-widest text-[#30E3CA]">Dein Anschreiben entsteht</p>
        <h2 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
          {app.job_title}
          {app.company && <span className="text-white/50"> bei {app.company}</span>}
        </h2>

        <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] transition-[width] duration-700 ease-out"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>

        <ul className="mt-5 space-y-2.5">
          {WRITING_STEPS.map((s, i) => {
            const next = WRITING_STEPS[i + 1]?.at ?? 1.01;
            const done = progress >= next;
            const active = progress >= s.at && !done;
            return (
              <li key={s.label} className={`flex items-center gap-3 text-[14px] transition-colors ${done ? 'text-white/55' : active ? 'text-white' : 'text-white/25'}`}>
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${
                    done ? 'bg-[#30E3CA]' : active ? 'border-2 border-[#30E3CA]' : 'border border-white/20'
                  }`}
                >
                  {done ? <Check className="h-3 w-3 text-black" strokeWidth={3} /> : active ? <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#30E3CA]" /> : null}
                </span>
                {s.label}
              </li>
            );
          })}
        </ul>

        {ownWords && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">Wird eingebaut – in deinen Worten</p>
            <p className="mt-1.5 text-[14px] italic leading-relaxed text-white/85">„{ownWords.length > 140 ? `${ownWords.slice(0, 140)}…` : ownWords}“</p>
          </div>
        )}

        <p key={tip} className="mt-5 min-h-[40px] animate-[fade-in_0.5s_ease] text-[13px] leading-relaxed text-white/55">
          {WRITING_TIPS[tip]}
        </p>
        <p className="mt-2 text-[11px] text-white/30">Dauert ca. 30–40 Sekunden · Fenster bitte offen lassen</p>
      </div>
    </div>
  );
}

// ─── Studio ──────────────────────────────────────────────────────────
export function CoverLetterStudio({ app, mode, onClose, onGenerate }: CoverLetterStudioProps) {
  const draftKey = `dyd_cl_brief_${app.id}`;
  const [brief, setBrief] = useState<CoverLetterBrief>(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) return { ...EMPTY_BRIEF, ...JSON.parse(raw) };
    } catch { /* ignore */ }
    return { ...EMPTY_BRIEF, ...(app.cover_letter_brief ?? {}) };
  });
  const [jobText, setJobText] = useState('');
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [levelSuggested, setLevelSuggested] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>('questions');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const advanceTimer = useRef<number>();

  const steps: StepId[] = useMemo(
    () => [...(app.job_description ? [] : (['job'] as StepId[])), 'level', 'culture', 'motivation', 'strengths', 'special', 'style'],
    [app.job_description]
  );
  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  // Seite dahinter nicht scrollen
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(draftKey, JSON.stringify(brief)); } catch { /* ignore */ }
  }, [brief, draftKey]);

  // CV laden → Stationen als Auswahl + Level-Vorschlag
  useEffect(() => {
    let alive = true;
    (async () => {
      let cvData: unknown = null;
      if (app.cv_id) {
        const { data } = await supabase.from('stored_cvs').select('cv_data').eq('id', app.cv_id).maybeSingle();
        cvData = data?.cv_data;
      }
      if (!cvData || Object.keys(asObj(cvData)).length === 0) {
        const { data } = await supabase
          .from('stored_cvs')
          .select('cv_data')
          .neq('source', 'check')
          .order('updated_at', { ascending: false })
          .limit(3);
        cvData = (data ?? []).find((r) => r.cv_data && Object.keys(r.cv_data).length > 0)?.cv_data ?? null;
      }
      if (!alive) return;
      setHighlights(extractHighlights(cvData));
      const guess = guessLevel(cvData);
      if (guess) {
        setBrief((b) => (b.level ? b : { ...b, level: guess }));
        setLevelSuggested(true);
      }
    })().catch(() => {});
    return () => { alive = false; };
  }, [app.cv_id]);

  useEffect(() => () => window.clearTimeout(advanceTimer.current), []);

  // Fortschritt während des Schreibens: schnell starten, dann asymptotisch (nie "hängend" bei 100 %)
  useEffect(() => {
    if (phase !== 'writing') return;
    const start = Date.now();
    const t = window.setInterval(() => {
      const s = (Date.now() - start) / 1000;
      setProgress(Math.min(0.94, 1 - Math.exp(-s / 15)));
    }, 250);
    return () => window.clearInterval(t);
  }, [phase]);

  const set = <K extends keyof CoverLetterBrief>(k: K, v: CoverLetterBrief[K]) => setBrief((b) => ({ ...b, [k]: v }));

  const submit = useCallback(async () => {
    setError('');
    setProgress(0);
    setPhase('writing');
    try {
      await onGenerate(brief, jobText.trim());
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      setProgress(1);
      setPhase('done');
      window.setTimeout(onClose, 700);
    } catch (e) {
      setError((e as Error).message || 'Etwas ist schiefgelaufen.');
      setPhase('error');
    }
  }, [brief, jobText, onGenerate, onClose, draftKey]);

  const canNext =
    step === 'level' ? !!brief.level
    : step === 'culture' ? !!brief.culture
    : step === 'motivation' ? brief.motivations.length > 0 || brief.motivation_own_words.trim().length > 10
    : true;

  const next = () => {
    if (!canNext) return;
    if (isLast) submit();
    else setStepIdx((i) => i + 1);
  };
  const back = () => (stepIdx === 0 ? onClose() : setStepIdx((i) => i - 1));
  const pickAndAdvance = (fn: () => void) => {
    fn();
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => setStepIdx((i) => Math.min(i + 1, steps.length - 1)), 240);
  };
  const toggle = (k: 'motivations' | 'highlights', id: string, max: number) =>
    setBrief((b) => {
      const list = b[k];
      if (list.includes(id)) return { ...b, [k]: list.filter((x) => x !== id) };
      return { ...b, [k]: list.length >= max ? [...list.slice(1), id] : [...list, id] };
    });

  // Tastatur: Zahlen wählen, Enter weiter, Esc schließen
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'writing') return;
      const typing = (e.target as HTMLElement)?.tagName === 'TEXTAREA' || (e.target as HTMLElement)?.tagName === 'INPUT';
      if (e.key === 'Escape') { onClose(); return; }
      if (typing || phase !== 'questions') return;
      if (e.key === 'Enter') { e.preventDefault(); next(); return; }
      const n = Number(e.key);
      if (!n) return;
      if (step === 'level' && LEVEL_OPTIONS[n - 1]) pickAndAdvance(() => set('level', LEVEL_OPTIONS[n - 1].id));
      if (step === 'culture' && CULTURE_OPTIONS[n - 1]) pickAndAdvance(() => set('culture', CULTURE_OPTIONS[n - 1].id));
      if (step === 'motivation' && MOTIVATION_OPTIONS[n - 1]) toggle('motivations', MOTIVATION_OPTIONS[n - 1].id, 2);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const company = app.company || 'das Unternehmen';

  // Live-Zusammenfassung (rechte Spalte) – macht den Fortschritt persönlich spürbar
  const summary: { label: string; value: string | null }[] = [
    { label: 'Stufe', value: LEVEL_OPTIONS.find((o) => o.id === brief.level)?.label ?? null },
    { label: 'Arbeitgeber', value: CULTURE_OPTIONS.find((o) => o.id === brief.culture)?.label ?? null },
    {
      label: 'Motivation',
      value: brief.motivation_own_words
        ? `„${brief.motivation_own_words.slice(0, 60)}${brief.motivation_own_words.length > 60 ? '…' : ''}“`
        : brief.motivations.map((m) => MOTIVATION_OPTIONS.find((o) => o.id === m)?.label).filter(Boolean).join(', ') || null,
    },
    { label: 'Im Fokus', value: brief.highlights.length ? brief.highlights.map((h) => h.split(' · ')[0]).join(', ') : brief.proudest ? 'Dein Erfolg' : null },
    { label: 'Besonderheit', value: brief.special === 'none' ? (stepIdx > steps.indexOf('special') ? 'keine' : null) : SPECIAL_OPTIONS.find((o) => o.id === brief.special)?.label ?? null },
    { label: 'Stil', value: stepIdx >= steps.indexOf('style') ? `${TONE_OPTIONS.find((t) => t.id === brief.tone)?.label} · ${LENGTH_OPTIONS.find((o) => o.id === brief.length)?.label}` : null },
  ];

  const content = (
    <div className="fixed inset-0 z-[80] flex flex-col overflow-hidden bg-[#070809] text-white" role="dialog" aria-modal="true">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(48,227,202,0.14),transparent_60%)]" />

      {/* Kopfzeile */}
      <header className="relative flex items-center gap-3 border-b border-white/[0.07] px-4 py-3 sm:px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#66c0b6] to-[#30E3CA]">
          <FileText className="h-4 w-4 text-black" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Anschreiben-Studio</p>
          <p className="truncate text-[14px] font-semibold">
            {app.job_title}
            {app.company && <span className="font-normal text-white/50"> · {app.company}</span>}
          </p>
        </div>
        {phase !== 'writing' && (
          <button onClick={onClose} className="rounded-xl p-2 text-white/50 hover:bg-white/10 hover:text-white" aria-label="Schließen">
            <X className="h-5 w-5" />
          </button>
        )}
      </header>

      {(phase === 'writing' || phase === 'done') && (
        <div className="relative flex flex-1 overflow-y-auto">
          <WritingView app={app} brief={brief} progress={progress} />
        </div>
      )}

      {phase === 'error' && (
        <div className="relative flex flex-1 items-center justify-center px-4">
          <div className="max-w-md text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/15">
              <AlertCircle className="h-6 w-6 text-red-300" />
            </span>
            <h2 className="mt-4 text-xl font-bold">Das hat gerade nicht geklappt</h2>
            <p className="mt-2 text-[14px] text-white/60">{error}</p>
            <p className="mt-1 text-[12px] text-white/40">Deine Antworten sind gespeichert.</p>
            <div className="mt-6 flex justify-center gap-2">
              <button onClick={() => setPhase('questions')} className="rounded-xl border border-white/15 px-4 py-2.5 text-[14px] text-white/80 hover:bg-white/10">
                Antworten ansehen
              </button>
              <button onClick={submit} className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[14px] font-bold text-black hover:bg-white/90">
                <RotateCcw className="h-4 w-4" /> Nochmal versuchen
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'questions' && (
        <>
          <div className="relative flex-1 overflow-y-auto">
            <div className="mx-auto grid max-w-5xl gap-10 px-4 pb-10 pt-6 sm:px-6 lg:grid-cols-[1fr_300px] lg:pt-10">
              <main className="min-w-0">
                {/* Fortschritt in Segmenten (beantwortete Schritte anklickbar) */}
                <div className="mb-7 flex gap-1.5">
                  {steps.map((s, i) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => i < stepIdx && setStepIdx(i)}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < stepIdx ? 'cursor-pointer bg-[#30E3CA]/70 hover:bg-[#30E3CA]' : i === stepIdx ? 'bg-[#30E3CA]' : 'bg-white/10'
                      }`}
                      aria-label={`Schritt ${i + 1}`}
                    />
                  ))}
                </div>
                <p className="text-[12px] font-semibold uppercase tracking-widest text-[#30E3CA]">
                  Frage {stepIdx + 1} von {steps.length}
                </p>

                <div key={step} className="animate-[fade-in_0.25s_ease]">
                  {step === 'job' && (
                    <>
                      <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Füge die Stellenanzeige ein</h2>
                      <p className="mt-2 text-[14px] text-white/55">Der wichtigste Baustein: So greifen wir die echten Anforderungen und Schlüsselwörter auf.</p>
                      <textarea
                        rows={10}
                        value={jobText}
                        onChange={(e) => setJobText(e.target.value)}
                        placeholder="Anzeigentext komplett hineinkopieren – Aufgaben, Profil, Benefits …"
                        className={`${fieldCls} mt-5`}
                        autoFocus
                      />
                      {!jobText.trim() && (
                        <p className="mt-2 text-[12px] text-amber-300/80">Ohne Anzeige wird das Anschreiben deutlich allgemeiner.</p>
                      )}
                    </>
                  )}

                  {step === 'level' && (
                    <>
                      <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Wo stehst du gerade?</h2>
                      <p className="mt-2 text-[14px] text-white/55">
                        Danach richten wir aus, was wir betonen: Potenzial, Wirkung oder Führung.
                        {levelSuggested && brief.level && <span className="text-[#30E3CA]"> Vorschlag aus deinem CV ist markiert.</span>}
                      </p>
                      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                        {LEVEL_OPTIONS.map((o, i) => (
                          <OptionCard key={o.id} hotkey={i + 1} active={brief.level === o.id} emoji={o.emoji} title={o.label} sub={o.hint}
                            onClick={() => pickAndAdvance(() => set('level', o.id))} />
                        ))}
                      </div>
                    </>
                  )}

                  {step === 'culture' && (
                    <>
                      <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Was für ein Arbeitgeber ist {company}?</h2>
                      <p className="mt-2 text-[14px] text-white/55">Ein Amt liest anders als ein Startup. Ton, Länge und Aufbau passen wir daran an.</p>
                      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                        {CULTURE_OPTIONS.map((o, i) => (
                          <OptionCard key={o.id} hotkey={i + 1} active={brief.culture === o.id} emoji={o.emoji} title={o.label}
                            onClick={() => pickAndAdvance(() => set('culture', o.id))} />
                        ))}
                      </div>
                    </>
                  )}

                  {step === 'motivation' && (
                    <>
                      <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Warum willst du genau diesen Job?</h2>
                      <p className="mt-2 text-[14px] text-white/55">Wähle bis zu 2 Gründe – daraus wird dein Einstieg.</p>
                      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                        {MOTIVATION_OPTIONS.map((o, i) => (
                          <OptionCard key={o.id} hotkey={i + 1} active={brief.motivations.includes(o.id)} emoji={o.emoji} title={o.label}
                            onClick={() => toggle('motivations', o.id, 2)} />
                        ))}
                      </div>
                      <Label hint="(empfohlen)">Und jetzt in deinen Worten</Label>
                      <textarea
                        rows={3}
                        value={brief.motivation_own_words}
                        onChange={(e) => set('motivation_own_words', e.target.value)}
                        placeholder="So, wie du es einer Freundin erzählen würdest …"
                        className={fieldCls}
                      />
                      <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#30E3CA]">
                        <Sparkles className="h-3.5 w-3.5" /> Wir übernehmen deine Formulierungen – genau das macht es unverwechselbar.
                      </p>
                    </>
                  )}

                  {step === 'strengths' && (
                    <>
                      <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Was soll im Mittelpunkt stehen?</h2>
                      <p className="mt-2 text-[14px] text-white/55">
                        {highlights.length > 0 ? 'Wähle bis zu 2 Stationen aus deinem CV, die am besten zur Stelle passen.' : 'Beschreib kurz die Erfahrung, die am besten passt.'}
                      </p>
                      {highlights.length > 0 && (
                        <div className="mt-5 grid gap-2.5">
                          {highlights.map((h) => (
                            <OptionCard key={h.id} active={brief.highlights.includes(h.label)} title={h.label} sub={h.sub}
                              onClick={() => toggle('highlights', h.label, 2)} />
                          ))}
                        </div>
                      )}
                      <Label hint="(optional, aber Gold wert)">Worauf bist du beruflich richtig stolz?</Label>
                      <textarea
                        rows={3}
                        value={brief.proudest}
                        onChange={(e) => set('proudest', e.target.value)}
                        placeholder="Ein konkretes Ergebnis, gern mit Zahl – z. B. „Einarbeitung von 8 auf 4 Wochen verkürzt“"
                        className={fieldCls}
                      />
                    </>
                  )}

                  {step === 'special' && (
                    <>
                      <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Sollen wir etwas souverän erklären?</h2>
                      <p className="mt-2 text-[14px] text-white/55">Recruiter stolpern sonst darüber. Wir sprechen es kurz und selbstbewusst an, ohne Rechtfertigung.</p>
                      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
                        {SPECIAL_OPTIONS.map((o) => (
                          <OptionCard key={o.id} active={brief.special === o.id} emoji={o.emoji} title={o.label}
                            onClick={() => (o.id === 'none' ? pickAndAdvance(() => set('special', o.id)) : set('special', o.id))} />
                        ))}
                      </div>
                      {brief.special !== 'none' && (
                        <>
                          <Label>Ein Satz Kontext</Label>
                          <input
                            value={brief.special_note}
                            onChange={(e) => set('special_note', e.target.value)}
                            placeholder="z. B. „1 Jahr Elternzeit, in der ich eine Weiterbildung gemacht habe“"
                            className={fieldCls}
                            autoFocus
                          />
                        </>
                      )}
                    </>
                  )}

                  {step === 'style' && (
                    <>
                      <h2 className="mt-2 text-2xl font-black leading-tight sm:text-3xl">Letzte Details</h2>
                      <Label>Eintrittstermin</Label>
                      <div className="flex flex-wrap gap-2">
                        {START_OPTIONS.map((o) => (
                          <Pill key={o.id} active={brief.start === o.id} onClick={() => set('start', o.id)}>{o.label}</Pill>
                        ))}
                      </div>
                      {(brief.start === 'kuendigungsfrist' || brief.start === 'datum') && (
                        <input
                          value={brief.start_detail}
                          onChange={(e) => set('start_detail', e.target.value)}
                          placeholder={brief.start === 'datum' ? 'z. B. 01.02.2027' : 'z. B. 3 Monate zum Monatsende'}
                          className={`${fieldCls} mt-3`}
                        />
                      )}
                      <Label hint="(nur wenn die Anzeige danach fragt)">Gehaltsvorstellung</Label>
                      <input value={brief.salary} onChange={(e) => set('salary', e.target.value)} placeholder="z. B. 62.000 € brutto/Jahr" className={fieldCls} />
                      <Label>Wie soll es klingen?</Label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {TONE_OPTIONS.map((t) => (
                          <OptionCard key={t.id} active={brief.tone === t.id} title={t.label} sub={t.hint} onClick={() => set('tone', t.id)} />
                        ))}
                      </div>
                      <Label>Länge</Label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {LENGTH_OPTIONS.map((o) => (
                          <OptionCard key={o.id} active={brief.length === o.id} title={o.label} sub={o.hint} onClick={() => set('length', o.id)} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </main>

              {/* Live-Zusammenfassung */}
              <aside className="hidden lg:block">
                <div className="sticky top-6 rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">Dein Anschreiben wird …</p>
                  <ul className="mt-4 space-y-3.5">
                    {summary.map((s) => (
                      <li key={s.label} className="flex gap-3">
                        <span className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full ${s.value ? 'bg-[#30E3CA]' : 'border border-white/20'}`}>
                          {s.value && <Check className="h-2.5 w-2.5 text-black" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[11px] text-white/40">{s.label}</span>
                          <span className={`block text-[13px] leading-snug ${s.value ? 'text-white' : 'text-white/25'}`}>{s.value ?? '–'}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-5 space-y-1.5 border-t border-white/10 pt-4 text-[12px] text-white/55">
                    <p className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-[#30E3CA]" /> Floskel-Check inklusive</p>
                    <p className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-[#30E3CA]" /> Jeder Absatz erklärt</p>
                    <p className="flex items-center gap-2"><PenLine className="h-3.5 w-3.5 text-[#30E3CA]" /> Danach frei bearbeitbar</p>
                  </div>
                </div>
              </aside>
            </div>
          </div>

          {/* Fußzeile */}
          <footer className="relative border-t border-white/[0.07] bg-[#070809]/90 px-4 py-3 backdrop-blur sm:px-6">
            <div className="mx-auto flex max-w-5xl items-center gap-3">
              <button type="button" onClick={back} className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 text-[14px] text-white/60 hover:bg-white/10 hover:text-white">
                <ArrowLeft className="h-4 w-4" /> {stepIdx === 0 ? 'Abbrechen' : 'Zurück'}
              </button>
              <span className="hidden text-[12px] text-white/30 sm:block">
                {isLast ? '' : 'Enter ↵ für weiter'}
              </span>
              <div className="ml-auto flex flex-col items-end">
                <button
                  type="button"
                  onClick={next}
                  disabled={!canNext}
                  className={`flex items-center gap-2 rounded-xl px-6 py-3 text-[15px] font-bold transition-all disabled:cursor-not-allowed disabled:opacity-30 ${
                    isLast
                      ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black shadow-[0_8px_30px_rgba(48,227,202,0.35)] hover:brightness-110'
                      : 'bg-white text-black hover:bg-white/90'
                  }`}
                >
                  {isLast ? (
                    <><Wand2 className="h-4 w-4" /> {mode === 'regenerate' ? 'Neu schreiben' : 'Mein Anschreiben schreiben'}</>
                  ) : step === 'job' && !jobText.trim() ? (
                    <>Überspringen <ArrowRight className="h-4 w-4" /></>
                  ) : (
                    <>Weiter <ArrowRight className="h-4 w-4" /></>
                  )}
                </button>
                {isLast && mode === 'new' && (
                  <span className="mt-1 text-[11px] text-white/40">Vorschau kostenlos · danach ab {formatEuro(COVER_LETTER_PRICE.addon)}</span>
                )}
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );

  return createPortal(content, document.body);
}
