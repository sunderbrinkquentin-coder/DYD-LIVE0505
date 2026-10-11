import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check, ChevronDown, Copy, CreditCard, FileDown, HelpCircle, Lightbulb, Loader2, Lock, Pencil,
  Quote, RefreshCw, ShieldCheck, Sparkles, UserRound, Wand2,
} from 'lucide-react';
import type { ApplicationUpdate, TrackedApplication } from '../../../types/applications';
import type { CoverLetter, CoverLetterBrief, CoverLetterContent, CoverLetterParagraph } from '../../../types/coverLetter';
import { COVER_LETTER_PRICE, REWRITE_PRESETS, ROLE_LABEL, formatEuro } from '../../../types/coverLetter';
import { CoverLetterStudio } from './CoverLetterStudio';
import {
  CoverLetterError, coverLetterService, downloadLetterDocx, letterToPlainText,
} from '../../../services/coverLetterService';
import { supabase } from '../../../lib/supabase';
import { tokenService } from '../../../services/tokenService';

interface CoverLetterPanelProps {
  app: TrackedApplication;
  onPatch: (id: string, patch: ApplicationUpdate) => Promise<void>;
  /** nach Stripe-Rückkehr: auf Freischaltung warten */
  awaitingPayment?: boolean;
  onLetterChange?: (letter: CoverLetter) => void;
}

const FILLER =
  'Mit meiner Erfahrung in vergleichbaren Projekten bringe ich genau die Kompetenzen mit, die Sie in Ihrer Ausschreibung beschreiben. ';

function AutoTextarea({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [value]);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="w-full resize-none rounded-lg border border-transparent bg-transparent p-1.5 text-[13.5px] leading-relaxed text-gray-800 outline-none transition-colors hover:border-gray-200 focus:border-[#66c0b6] focus:bg-white focus:ring-2 focus:ring-[#66c0b6]/15"
    />
  );
}

function WhyBox({ p, defaultOpen }: { p: CoverLetterParagraph; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className="mt-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[11px] font-semibold text-[#3a9e94] hover:underline"
      >
        <HelpCircle className="h-3 w-3" /> Warum steht das hier?
        <ChevronDown className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="mt-1.5 rounded-lg border border-[#66c0b6]/25 bg-[#66c0b6]/[0.07] p-2.5 text-[12px] text-gray-700">
          <p>{p.why}</p>
          {p.edited && (
            <p className="mt-1 text-[11px] italic text-gray-500">
              Du hast diesen Absatz angepasst – die Erklärung bezieht sich auf die ursprüngliche Version.
            </p>
          )}
          {p.sources.length > 0 && (
            <ul className="mt-2 space-y-1">
              {p.sources.map((s, i) => (
                <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                  <span
                    className={`mt-0.5 flex-shrink-0 rounded px-1 text-[9px] font-bold uppercase ${
                      s.type === 'job' ? 'bg-blue-100 text-blue-700' : 'bg-teal-100 text-teal-700'
                    }`}
                  >
                    {s.type === 'job' ? 'Anzeige' : 'Dein CV'}
                  </span>
                  <Quote className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 text-gray-400" />
                  <span className="italic">{s.quote}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export function CoverLetterPanel({ app, onPatch, awaitingPayment, onLetterChange }: CoverLetterPanelProps) {
  const [letter, setLetter] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Generator
  const [studioMode, setStudioMode] = useState<'new' | 'regenerate' | null>(null);
  const autoOpened = useRef(false);

  // Paywall
  const [credits, setCredits] = useState(0);
  const [addonEligible, setAddonEligible] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [waitingForWebhook, setWaitingForWebhook] = useState(!!awaitingPayment);

  // Editor
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [rewriteFor, setRewriteFor] = useState<string | null>(null);
  const [rewriteText, setRewriteText] = useState('');
  const [rewriting, setRewriting] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const saveTimer = useRef<number>();

  const setAndNotify = useCallback((l: CoverLetter) => {
    setLetter(l);
    onLetterChange?.(l);
  }, [onLetterChange]);

  // ── Laden ──────────────────────────────────────────────────────────
  useEffect(() => {
    let alive = true;
    setLoading(true);
    coverLetterService
      .getLatestForApplication(app.id)
      .then((l) => alive && l && setAndNotify(l))
      .catch((e) => alive && setError(e.message))
      .finally(() => alive && setLoading(false));
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) tokenService.getUserTokens(user.id).then((t) => alive && setCredits(t?.credits ?? 0)).catch(() => {});
    });
    return () => {
      alive = false;
    };
  }, [app.id, setAndNotify]);

  useEffect(() => {
    if (letter && !letter.is_unlocked) coverLetterService.addonEligible(letter.id).then(setAddonEligible);
  }, [letter?.id, letter?.is_unlocked]); // eslint-disable-line react-hooks/exhaustive-deps

  // Nach Stripe-Rückkehr: kurz pollen, bis der Webhook freigeschaltet hat
  useEffect(() => {
    if (!waitingForWebhook || !letter) return;
    if (letter.is_unlocked) {
      setWaitingForWebhook(false);
      return;
    }
    let tries = 0;
    const t = window.setInterval(async () => {
      tries++;
      const fresh = await coverLetterService.get(letter.id).catch(() => null);
      if (fresh?.is_unlocked || tries > 15) {
        window.clearInterval(t);
        setWaitingForWebhook(false);
        if (fresh) setAndNotify(fresh);
      }
    }, 2000);
    return () => window.clearInterval(t);
  }, [waitingForWebhook, letter, setAndNotify]);

  // ── Aktionen ───────────────────────────────────────────────────────
  /** Wird vom Studio aufgerufen – Fehler werden dort angezeigt */
  const generate = async (brief: CoverLetterBrief, jobText: string) => {
    setError('');
    await onPatch(app.id, {
      cover_letter_brief: brief,
      ...(jobText && !app.job_description ? { job_description: jobText } : {}),
    });
    setAndNotify(await coverLetterService.generate(app.id, brief));
  };

  const unlockWithCredit = async () => {
    if (!letter) return;
    setBusy('credit');
    setError('');
    try {
      const ok = await coverLetterService.unlockWithCredit(letter.id);
      if (!ok) throw new CoverLetterError('Keine Credits mehr verfügbar.');
      setCredits((c) => Math.max(0, c - 1));
      const fresh = await coverLetterService.get(letter.id);
      if (fresh) setAndNotify(fresh);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const buy = async (variant: 'single' | 'addon') => {
    if (!letter) return;
    setBusy(variant);
    setError('');
    try {
      await coverLetterService.checkout(letter, variant);
    } catch (e) {
      setError((e as Error).message);
      setBusy(null);
    }
  };

  const updateContent = (next: CoverLetterContent) => {
    if (!letter) return;
    const updated = { ...letter, letter: next };
    setLetter(updated);
    setSaveState('saving');
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(async () => {
      try {
        await coverLetterService.save(updated.id, next);
        setSaveState('saved');
        onLetterChange?.(updated);
      } catch (e) {
        setError((e as Error).message);
        setSaveState('idle');
      }
    }, 900);
  };

  const flushSave = async () => {
    if (!letter || saveState !== 'saving') return;
    window.clearTimeout(saveTimer.current);
    await coverLetterService.save(letter.id, letter.letter);
    setSaveState('saved');
  };

  const editParagraph = (id: string, text: string) => {
    if (!letter) return;
    updateContent({
      ...letter.letter,
      paragraphs: letter.letter.paragraphs.map((p) => (p.id === id ? { ...p, text, edited: true } : p)),
    });
  };

  const rewrite = async (paragraphId: string, instruction: string) => {
    if (!letter || !instruction.trim()) return;
    setRewriting(paragraphId);
    setError('');
    try {
      await flushSave();
      setAndNotify(await coverLetterService.rewriteParagraph(letter.id, paragraphId, instruction));
      setRewriteFor(null);
      setRewriteText('');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setRewriting(null);
    }
  };

  const regenerate = async (brief: CoverLetterBrief) => {
    if (!letter) return;
    setError('');
    await onPatch(app.id, { cover_letter_brief: brief });
    setAndNotify(await coverLetterService.regenerate(letter.id, brief));
  };

  const openRegenerate = () => {
    if (window.confirm('Antworten anpassen und komplett neu schreiben? Deine Änderungen am Text gehen dabei verloren.')) {
      setStudioMode('regenerate');
    }
  };

  // Wer den Anschreiben-Tab ohne Anschreiben öffnet, will eins erstellen → Studio direkt öffnen
  useEffect(() => {
    if (!loading && !letter && !autoOpened.current) {
      autoOpened.current = true;
      setStudioMode('new');
    }
  }, [loading, letter]);

  const copy = async () => {
    if (!letter) return;
    await flushSave();
    await navigator.clipboard.writeText(letterToPlainText(letter.letter));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  // ── Render ─────────────────────────────────────────────────────────
  if (loading) {
    return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-[#66c0b6]" /></div>;
  }

  const studio = studioMode && (
    <CoverLetterStudio
      app={app}
      mode={studioMode}
      onClose={() => setStudioMode(null)}
      onGenerate={(brief, jobText) => (studioMode === 'regenerate' ? regenerate(brief) : generate(brief, jobText))}
    />
  );

  // ── Noch kein Anschreiben: Einstieg ins Studio ─────────────────────
  if (!letter) {
    return (
      <div>
        {studio}
        <div className="overflow-hidden rounded-2xl bg-[#0b0d0e] text-white">
          <div className="relative p-5">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#30E3CA]/20 blur-3xl" />
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[#30E3CA]">Anschreiben-Studio</p>
            <h3 className="mt-1.5 text-[19px] font-black leading-snug">
              Dein Anschreiben für {app.company || 'diese Stelle'} – in deinem Ton
            </h3>
            <ul className="mt-4 space-y-2 text-[13px] text-white/75">
              {[
                '6 kurze Fragen statt Vorlage – ca. 1 Minute',
                'Passend zu deinem Level und zur Branche',
                'Floskel-Check: klingt nach dir, nicht nach KI',
                'Jeder Absatz erklärt und frei bearbeitbar',
              ].map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#30E3CA]" /> {t}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setStudioMode('new')}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] py-3 text-[15px] font-bold text-black shadow-[0_8px_30px_rgba(48,227,202,0.3)] hover:brightness-110"
            >
              <Wand2 className="h-4 w-4" /> Los geht's
            </button>
            <p className="mt-2 text-center text-[11px] text-white/40">
              Vorschau kostenlos · danach ab {formatEuro(COVER_LETTER_PRICE.addon)} · kein Abo
            </p>
          </div>
        </div>
        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>}
      </div>
    );
  }

  const l = letter.letter;
  const locked = !letter.is_unlocked;

  return (
    <div>
      {studio}
      {/* Toolbar */}
      {!locked && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <button onClick={copy} className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[12px] hover:bg-gray-200">
            {copied ? <Check className="h-3.5 w-3.5 text-[#3a9e94]" /> : <Copy className="h-3.5 w-3.5" />} {copied ? 'Kopiert' : 'Kopieren'}
          </button>
          <button
            onClick={async () => { await flushSave(); await downloadLetterDocx(l, `${app.company || ''}-${app.job_title}`); }}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[12px] hover:bg-gray-200"
          >
            <FileDown className="h-3.5 w-3.5" /> Word
          </button>
          <button
            onClick={openRegenerate}
            disabled={letter.regenerate_count >= 2}
            className="flex items-center gap-1 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[12px] hover:bg-gray-200 disabled:opacity-40"
            title="Antworten anpassen und komplett neu schreiben (max. 2×)"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Antworten anpassen ({2 - letter.regenerate_count})
          </button>
          <span className="ml-auto text-[11px] text-gray-400">
            {saveState === 'saving' ? 'Speichere…' : saveState === 'saved' ? 'Gespeichert' : `${l.meta.word_count} Wörter`}
          </span>
        </div>
      )}

      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-700">{error}</p>}

      {/* Qualitäts-Signale: Floskel-Check + was aus den Antworten eingeflossen ist */}
      {(l.meta.cliches_fixed !== undefined || (l.meta.personal_details?.length ?? 0) > 0) && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="flex items-center gap-1 rounded-full bg-[#66c0b6]/15 px-2 py-0.5 font-semibold text-[#2f857c]">
            <ShieldCheck className="h-3 w-3" /> Floskel-Check bestanden
          </span>
          {l.meta.personal_details?.map((d) => (
            <span key={d} className="flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
              <UserRound className="h-3 w-3" /> {d}
            </span>
          ))}
        </div>
      )}

      {/* Brief */}
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <p className="mb-3 text-[13.5px] font-bold text-gray-900">{l.subject}</p>
        <p className="mb-3 text-[13.5px] text-gray-800">{l.salutation}</p>

        <div className="space-y-4">
          {l.paragraphs.map((p, i) => (
            <div key={p.id} className="group">
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{ROLE_LABEL[p.role]}</span>
                {p.edited && <span className="flex items-center gap-0.5 text-[10px] text-gray-400"><Pencil className="h-2.5 w-2.5" /> bearbeitet</span>}
              </div>

              {p.text === null ? (
                <p aria-hidden className="pointer-events-none select-none text-[13.5px] leading-relaxed text-gray-800 blur-[5px]">
                  {FILLER.repeat(Math.ceil((p.text_length ?? 300) / FILLER.length)).slice(0, p.text_length ?? 300)}
                </p>
              ) : locked ? (
                <p className="text-[13.5px] leading-relaxed text-gray-800">{p.text}</p>
              ) : (
                <AutoTextarea value={p.text} onChange={(v) => editParagraph(p.id, v)} />
              )}

              <WhyBox p={p} defaultOpen={locked && i === 0} />

              {!locked && (
                <div className="mt-1">
                  {rewriteFor === p.id ? (
                    <div className="rounded-lg border border-gray-200 bg-gray-50 p-2">
                      <div className="flex flex-wrap gap-1">
                        {REWRITE_PRESETS.map((preset) => (
                          <button
                            key={preset}
                            disabled={!!rewriting}
                            onClick={() => rewrite(p.id, preset)}
                            className="rounded-md border border-gray-200 bg-white px-2 py-0.5 text-[11px] hover:border-[#66c0b6] disabled:opacity-50"
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                      <div className="mt-1.5 flex gap-1.5">
                        <input
                          value={rewriteText}
                          onChange={(e) => setRewriteText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && rewrite(p.id, rewriteText)}
                          placeholder="Eigener Wunsch, z. B. „Erwähne mein Projekt bei X“"
                          className="flex-1 rounded-md border border-gray-200 px-2 py-1 text-[12px] outline-none focus:border-[#66c0b6]"
                        />
                        <button
                          onClick={() => rewrite(p.id, rewriteText)}
                          disabled={!!rewriting || !rewriteText.trim()}
                          className="rounded-md bg-gray-900 px-2.5 text-[12px] font-medium text-white disabled:opacity-40"
                        >
                          {rewriting === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Los'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setRewriteFor(p.id); setRewriteText(''); }}
                      className="flex items-center gap-1 text-[11px] text-gray-400 opacity-100 transition-opacity hover:text-gray-700 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Wand2 className="h-3 w-3" /> Mit KI umformulieren
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <p className="mt-4 text-[13.5px] text-gray-800">{l.closing}</p>
        {l.sender_name && <p className="text-[13.5px] text-gray-800">{l.sender_name}</p>}
      </div>

      {/* Tipps */}
      {l.tips.length > 0 && (
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold text-amber-900">
            <Lightbulb className="h-3.5 w-3.5" /> Bevor du es abschickst
          </p>
          <ul className="list-disc space-y-0.5 pl-5 text-[12px] text-amber-900">
            {l.tips.map((t, i) => <li key={i}>{t}</li>)}
          </ul>
        </div>
      )}

      {/* Paywall */}
      {locked && (
        <div className="sticky bottom-0 mt-4 rounded-2xl border border-[#66c0b6]/40 bg-white p-4 shadow-[0_-8px_24px_rgba(0,0,0,0.08)]">
          {waitingForWebhook ? (
            <p className="flex items-center justify-center gap-2 text-[13px] text-gray-700">
              <Loader2 className="h-4 w-4 animate-spin text-[#66c0b6]" /> Zahlung erhalten – wird freigeschaltet…
            </p>
          ) : (
            <>
              <p className="flex items-center gap-1.5 text-[14px] font-bold text-gray-900">
                <Lock className="h-4 w-4 text-[#3a9e94]" /> Komplettes Anschreiben freischalten
              </p>
              <ul className="mt-2 space-y-1 text-[12px] text-gray-600">
                {[
                  `Alle ${l.paragraphs.length} Absätze inkl. Belegen aus Anzeige & CV`,
                  'Frei bearbeiten + 20× Absätze mit KI umformulieren',
                  'Export als Word & Text · 2× komplett neu erstellen',
                ].map((b) => (
                  <li key={b} className="flex items-start gap-1.5"><Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[#3a9e94]" /> {b}</li>
                ))}
              </ul>

              <div className="mt-3 space-y-2">
                {credits > 0 && (
                  <button
                    onClick={unlockWithCredit}
                    disabled={!!busy}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] py-2.5 text-[14px] font-bold text-black disabled:opacity-60"
                  >
                    {busy === 'credit' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Mit 1 Credit freischalten <span className="font-normal">({credits} verfügbar)</span>
                  </button>
                )}
                {addonEligible && credits === 0 && (
                  <button
                    onClick={() => buy('addon')}
                    disabled={!!busy}
                    className="relative flex w-full items-center justify-between rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] px-4 py-2.5 text-black disabled:opacity-60"
                  >
                    <span className="text-left">
                      <span className="block text-[14px] font-bold">Kombi-Preis zu deinem CV</span>
                      <span className="block text-[11px]">statt {formatEuro(COVER_LETTER_PRICE.single)}</span>
                    </span>
                    <span className="text-[18px] font-black">{busy === 'addon' ? <Loader2 className="h-5 w-5 animate-spin" /> : formatEuro(COVER_LETTER_PRICE.addon)}</span>
                  </button>
                )}
                {!(addonEligible && credits === 0) && (
                  <button
                    onClick={() => buy('single')}
                    disabled={!!busy}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[14px] font-bold disabled:opacity-60 ${
                      credits > 0 ? 'border border-gray-200 text-gray-800 hover:bg-gray-50' : 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black'
                    }`}
                  >
                    {busy === 'single' ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
                    Für {formatEuro(COVER_LETTER_PRICE.single)} freischalten
                  </button>
                )}
              </div>
              <p className="mt-2 text-center text-[11px] text-gray-400">Einmalzahlung · kein Abo · sichere Zahlung über Stripe</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
