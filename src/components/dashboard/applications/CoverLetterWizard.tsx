import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Sparkles, Wand2 } from 'lucide-react';
import type { TrackedApplication } from '../../../types/applications';
import type { CoverLetterBrief } from '../../../types/coverLetter';
import {
  COVER_LETTER_PRICE, CULTURE_OPTIONS, EMPTY_BRIEF, LENGTH_OPTIONS, LEVEL_OPTIONS, MOTIVATION_OPTIONS,
  SPECIAL_OPTIONS, START_OPTIONS, TONE_OPTIONS, formatEuro,
} from '../../../types/coverLetter';
import { supabase } from '../../../lib/supabase';

interface CoverLetterWizardProps {
  app: TrackedApplication;
  onSubmit: (brief: CoverLetterBrief, jobText: string) => void;
  onCancel?: () => void;
  submitLabel?: string;
  /** zeigt den Preis-Hinweis unter dem Button (nicht bei "Neu erstellen") */
  showPriceHint?: boolean;
}

type StepId = 'job' | 'level' | 'culture' | 'motivation' | 'strengths' | 'special' | 'style';

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

// ─── UI-Bausteine ────────────────────────────────────────────────────
function Chip({
  active, onClick, children, sub, emoji,
}: { active: boolean; onClick: () => void; children: React.ReactNode; sub?: string; emoji?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all active:scale-[0.98] ${
        active
          ? 'border-[#66c0b6] bg-[#66c0b6]/10 shadow-[0_0_0_3px_rgba(102,192,182,0.15)]'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
      }`}
    >
      {emoji && <span className="text-[17px] leading-none">{emoji}</span>}
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-gray-900">{children}</span>
        {sub && <span className="block text-[11px] text-gray-500">{sub}</span>}
      </span>
      <span
        className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
          active ? 'border-[#3a9e94] bg-[#3a9e94]' : 'border-gray-300'
        }`}
      >
        {active && <Check className="h-3 w-3 text-white" />}
      </span>
    </button>
  );
}

const textCls =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-[13px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20';

// ─── Wizard ──────────────────────────────────────────────────────────
export function CoverLetterWizard({ app, onSubmit, onCancel, submitLabel, showPriceHint = true }: CoverLetterWizardProps) {
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
  const advanceTimer = useRef<number>();

  const steps: StepId[] = useMemo(
    () => [...(app.job_description ? [] : (['job'] as StepId[])), 'level', 'culture', 'motivation', 'strengths', 'special', 'style'],
    [app.job_description]
  );
  const step = steps[stepIdx];
  const isLast = stepIdx === steps.length - 1;

  // Entwurf merken, falls der Drawer geschlossen wird
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

  const set = <K extends keyof CoverLetterBrief>(k: K, v: CoverLetterBrief[K]) => setBrief((b) => ({ ...b, [k]: v }));
  const next = () => {
    if (isLast) {
      try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
      onSubmit(brief, jobText.trim());
    } else setStepIdx((i) => i + 1);
  };
  const back = () => (stepIdx === 0 ? onCancel?.() : setStepIdx((i) => i - 1));
  /** Einfachauswahl: kurz zeigen, dann automatisch weiter */
  const pickAndAdvance = (fn: () => void) => {
    fn();
    window.clearTimeout(advanceTimer.current);
    advanceTimer.current = window.setTimeout(() => setStepIdx((i) => Math.min(i + 1, steps.length - 1)), 220);
  };
  const toggle = (k: 'motivations' | 'highlights', id: string, max: number) =>
    setBrief((b) => {
      const list = b[k];
      if (list.includes(id)) return { ...b, [k]: list.filter((x) => x !== id) };
      return { ...b, [k]: list.length >= max ? [...list.slice(1), id] : [...list, id] };
    });

  const canNext =
    step === 'level' ? !!brief.level
    : step === 'culture' ? !!brief.culture
    : step === 'motivation' ? brief.motivations.length > 0 || brief.motivation_own_words.trim().length > 10
    : true;

  const company = app.company || 'das Unternehmen';

  return (
    <div className="flex min-h-[420px] flex-col">
      {/* Fortschritt */}
      <div className="mb-4">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-gray-500">
          <span>Schritt {stepIdx + 1} von {steps.length}</span>
          <span>ca. 1 Minute · macht dein Anschreiben persönlich</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] transition-all duration-300"
            style={{ width: `${((stepIdx + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex-1">
        {step === 'job' && (
          <>
            <h3 className="text-[17px] font-bold text-gray-900">Füge die Stellenanzeige ein</h3>
            <p className="mb-3 mt-1 text-[12.5px] text-gray-500">
              Der wichtigste Baustein: Nur so greifen wir die echten Anforderungen und Schlüsselwörter auf.
            </p>
            <textarea
              rows={9}
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              placeholder="Anzeigentext komplett hineinkopieren (Aufgaben, Profil, Benefits) …"
              className={textCls}
              autoFocus
            />
            {!jobText.trim() && (
              <p className="mt-2 text-[11px] text-amber-700">
                Ohne Anzeige wird das Anschreiben deutlich allgemeiner. Du kannst den Schritt trotzdem überspringen.
              </p>
            )}
          </>
        )}

        {step === 'level' && (
          <>
            <h3 className="text-[17px] font-bold text-gray-900">Wo stehst du gerade?</h3>
            <p className="mb-3 mt-1 text-[12.5px] text-gray-500">
              Danach richten wir aus, was wir betonen – Potenzial, Wirkung oder Führung.
              {levelSuggested && brief.level && <span className="ml-1 text-[#3a9e94]">Vorschlag aus deinem CV ist markiert.</span>}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {LEVEL_OPTIONS.map((o) => (
                <Chip key={o.id} active={brief.level === o.id} emoji={o.emoji} sub={o.hint} onClick={() => pickAndAdvance(() => set('level', o.id))}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </>
        )}

        {step === 'culture' && (
          <>
            <h3 className="text-[17px] font-bold text-gray-900">Was für ein Arbeitgeber ist {company}?</h3>
            <p className="mb-3 mt-1 text-[12.5px] text-gray-500">
              Ein Amt liest anders als ein Startup – Ton, Länge und Aufbau passen wir daran an.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CULTURE_OPTIONS.map((o) => (
                <Chip key={o.id} active={brief.culture === o.id} emoji={o.emoji} onClick={() => pickAndAdvance(() => set('culture', o.id))}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </>
        )}

        {step === 'motivation' && (
          <>
            <h3 className="text-[17px] font-bold text-gray-900">Warum willst du genau diesen Job?</h3>
            <p className="mb-3 mt-1 text-[12.5px] text-gray-500">Wähle bis zu 2 Gründe – das wird dein Einstieg.</p>
            <div className="grid gap-2 sm:grid-cols-2">
              {MOTIVATION_OPTIONS.map((o) => (
                <Chip key={o.id} active={brief.motivations.includes(o.id)} emoji={o.emoji} onClick={() => toggle('motivations', o.id, 2)}>
                  {o.label}
                </Chip>
              ))}
            </div>
            <label className="mb-1 mt-4 block text-[12px] font-semibold text-gray-700">
              Sag es in deinen Worten <span className="font-normal text-gray-400">(empfohlen)</span>
            </label>
            <textarea
              rows={3}
              value={brief.motivation_own_words}
              onChange={(e) => set('motivation_own_words', e.target.value)}
              placeholder={`So, wie du es einer Freundin erzählen würdest – z. B. „Ich nutze ${app.company ? `${app.company}s Produkt` : 'das Produkt'} selbst und …“`}
              className={textCls}
            />
            <p className="mt-1 flex items-center gap-1 text-[11px] text-[#3a9e94]">
              <Sparkles className="h-3 w-3" /> Wir übernehmen deine Formulierungen – genau das macht es unverwechselbar.
            </p>
          </>
        )}

        {step === 'strengths' && (
          <>
            <h3 className="text-[17px] font-bold text-gray-900">Was soll im Mittelpunkt stehen?</h3>
            <p className="mb-3 mt-1 text-[12.5px] text-gray-500">
              {highlights.length > 0
                ? 'Wähle bis zu 2 Stationen aus deinem CV, die am besten zur Stelle passen.'
                : 'Beschreib kurz die Erfahrung, die am besten zur Stelle passt.'}
            </p>
            {highlights.length > 0 && (
              <div className="grid gap-2">
                {highlights.map((h) => (
                  <Chip key={h.id} active={brief.highlights.includes(h.label)} sub={h.sub} onClick={() => toggle('highlights', h.label, 2)}>
                    {h.label}
                  </Chip>
                ))}
              </div>
            )}
            <label className="mb-1 mt-4 block text-[12px] font-semibold text-gray-700">
              Worauf bist du beruflich richtig stolz? <span className="font-normal text-gray-400">(optional, aber Gold wert)</span>
            </label>
            <textarea
              rows={3}
              value={brief.proudest}
              onChange={(e) => set('proudest', e.target.value)}
              placeholder="Ein konkretes Ergebnis, gern mit Zahl – z. B. „Onboarding neu aufgesetzt, Einarbeitung von 8 auf 4 Wochen verkürzt“"
              className={textCls}
            />
          </>
        )}

        {step === 'special' && (
          <>
            <h3 className="text-[17px] font-bold text-gray-900">Gibt es etwas, das wir souverän erklären sollten?</h3>
            <p className="mb-3 mt-1 text-[12.5px] text-gray-500">
              Recruiter stolpern sonst darüber. Wir sprechen es kurz und selbstbewusst an – ohne Rechtfertigung.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {SPECIAL_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  active={brief.special === o.id}
                  emoji={o.emoji}
                  onClick={() => (o.id === 'none' ? pickAndAdvance(() => set('special', o.id)) : set('special', o.id))}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
            {brief.special !== 'none' && (
              <>
                <label className="mb-1 mt-4 block text-[12px] font-semibold text-gray-700">Ein Satz Kontext</label>
                <input
                  value={brief.special_note}
                  onChange={(e) => set('special_note', e.target.value)}
                  placeholder="z. B. „1 Jahr Elternzeit, in der ich eine Weiterbildung in Arbeitsrecht gemacht habe“"
                  className={textCls}
                />
              </>
            )}
          </>
        )}

        {step === 'style' && (
          <>
            <h3 className="text-[17px] font-bold text-gray-900">Letzte Details</h3>

            <p className="mb-1.5 mt-3 text-[12px] font-semibold text-gray-700">Eintrittstermin</p>
            <div className="flex flex-wrap gap-1.5">
              {START_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => set('start', o.id)}
                  className={`rounded-full border px-3 py-1 text-[12px] ${
                    brief.start === o.id ? 'border-[#66c0b6] bg-[#66c0b6]/10 font-semibold text-gray-900' : 'border-gray-200 text-gray-600'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {(brief.start === 'kuendigungsfrist' || brief.start === 'datum') && (
              <input
                value={brief.start_detail}
                onChange={(e) => set('start_detail', e.target.value)}
                placeholder={brief.start === 'datum' ? 'z. B. 01.02.2027' : 'z. B. 3 Monate zum Monatsende'}
                className={`${textCls} mt-2`}
              />
            )}

            <p className="mb-1.5 mt-4 text-[12px] font-semibold text-gray-700">
              Gehaltsvorstellung <span className="font-normal text-gray-400">(nur wenn die Anzeige danach fragt)</span>
            </p>
            <input value={brief.salary} onChange={(e) => set('salary', e.target.value)} placeholder="z. B. 62.000 € brutto/Jahr" className={textCls} />

            <p className="mb-1.5 mt-4 text-[12px] font-semibold text-gray-700">Wie soll es klingen?</p>
            <div className="grid grid-cols-2 gap-1.5">
              {TONE_OPTIONS.map((t) => (
                <Chip key={t.id} active={brief.tone === t.id} sub={t.hint} onClick={() => set('tone', t.id)}>
                  {t.label}
                </Chip>
              ))}
            </div>

            <p className="mb-1.5 mt-4 text-[12px] font-semibold text-gray-700">Länge</p>
            <div className="grid grid-cols-2 gap-1.5">
              {LENGTH_OPTIONS.map((o) => (
                <Chip key={o.id} active={brief.length === o.id} sub={o.hint} onClick={() => set('length', o.id)}>
                  {o.label}
                </Chip>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="sticky bottom-0 -mx-1 mt-5 bg-white px-1 pt-3">
        <div className="flex items-center gap-2">
          {(stepIdx > 0 || onCancel) && (
            <button
              type="button"
              onClick={back}
              className="flex items-center gap-1 rounded-xl px-3 py-2.5 text-[13px] text-gray-500 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" /> Zurück
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!canNext}
            className={`ml-auto flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-[14px] font-bold transition-all disabled:opacity-40 ${
              isLast
                ? 'flex-1 bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black shadow-sm hover:opacity-90'
                : 'bg-[#0d1514] text-white hover:bg-black'
            }`}
          >
            {isLast ? (
              <><Wand2 className="h-4 w-4" /> {submitLabel ?? 'Mein Anschreiben schreiben'}</>
            ) : step === 'job' && !jobText.trim() ? (
              <>Überspringen <ArrowRight className="h-4 w-4" /></>
            ) : (
              <>Weiter <ArrowRight className="h-4 w-4" /></>
            )}
          </button>
        </div>
        {isLast && showPriceHint && (
          <p className="mt-2 text-center text-[11px] text-gray-400">
            Vorschau kostenlos · danach ab {formatEuro(COVER_LETTER_PRICE.addon)} · kein Abo
          </p>
        )}
      </div>
    </div>
  );
}
