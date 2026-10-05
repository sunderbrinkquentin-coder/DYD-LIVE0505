// src/features/advisor/AdvisorWidget.tsx
//
// KI-Produktberater: dezenter Einstieg am rechten Bildschirmrand (verdeckt
// keine Buttons unten), öffnet sich nur auf Klick. Mobil als Vollbild-Blatt.
// Antworten werden als reiner Text dargestellt (kein Modell-HTML).

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Loader2, MessageCircle, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { advisorHiddenOn, getAdvisorVariant, pageContext } from './advisorConfig';
import { trackAdvisor } from './advisorAnalytics';
import { AdvisorProductCard } from './AdvisorProductCard';
import { useAdvisorChat, type ChatEntry } from './useAdvisorChat';

const STARTERS: Record<string, string[]> = {
  home: ['Welches Angebot passt zu mir?', 'Was kostet der CV-Check?', 'Ich frage für ein Unternehmen'],
  courses: ['Welcher Kurs passt zu mir?', 'Kurs oder persönlicher Lernpfad?', 'Was bringt das Zertifikat?'],
  career: ['Wie läuft die Skill-Analyse ab?', 'Was kostet ein Lernpfad?', 'Lohnt sich das Komplettpaket?'],
  cv: ['CV-Check oder Optimierung?', 'Ich bewerbe mich auf mehrere Stellen', 'Brauche ich ein Konto?'],
  business: ['Welches ORBIT-Paket passt?', 'ORBIT oder NEXUS?', 'Kann ich ORBIT testen?'],
  dashboard: ['Was ist mein nächster sinnvoller Schritt?', 'Welche Kurse gibt es?', 'Wie bekomme ich das Kompetenzprofil?'],
  faq: ['Gibt es ein Abo?', 'Was kostet der CV-Check?', 'Welches Angebot passt zu mir?'],
  other: ['Welches Angebot passt zu mir?', 'Was kostet der CV-Check?', 'Ich frage für ein Unternehmen'],
};

export function AdvisorWidget() {
  const location = useLocation();
  const variant = useMemo(() => getAdvisorVariant(), []);
  const hidden = advisorHiddenOn(location.pathname);

  useEffect(() => {
    if (variant !== 'off') trackAdvisor('advisor_assignment');
  }, [variant]);

  if (variant !== 'advisor' || hidden) return null;
  return <AdvisorShell pathname={location.pathname} />;
}

function AdvisorShell({ pathname }: { pathname: string }) {
  const ctx = useMemo(() => pageContext(pathname), [pathname]);
  const chat = useAdvisorChat(ctx);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const launcherRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const titleId = useId();

  const openPanel = () => { setOpen(true); trackAdvisor('advisor_open'); };
  const closePanel = () => {
    setOpen(false);
    trackAdvisor('advisor_close');
    requestAnimationFrame(() => launcherRef.current?.focus());
  };

  useEffect(() => { if (open) requestAnimationFrame(() => inputRef.current?.focus()); }, [open]);
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [chat.entries, chat.loading, chat.error]);

  // Escape schließt; mobil: Hintergrund nicht scrollen, solange offen
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closePanel(); };
    window.addEventListener('keydown', onKey);
    const mobile = window.matchMedia('(max-width: 639px)').matches;
    const prev = document.body.style.overflow;
    if (mobile) document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = (text: string) => {
    if (!text.trim() || chat.loading) return;
    chat.send(text);
    setDraft('');
  };

  const lastAssistant = [...chat.entries].reverse().find((e) => e.role === 'assistant');
  const starters = STARTERS[ctx.page] ?? STARTERS.other;

  return (
    <>
      {/* Einstieg: schmaler Reiter am rechten Rand – kollidiert nicht mit Buttons unten */}
      {!open && (
        <button
          ref={launcherRef}
          type="button"
          onClick={openPanel}
          aria-expanded={open}
          aria-controls={panelId}
          className="fixed right-0 top-[58%] sm:top-1/2 -translate-y-1/2 z-[60] flex items-center gap-2 pl-3 pr-2.5 py-3 rounded-l-2xl text-black font-black text-sm shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)', boxShadow: '0 10px 30px rgba(48,227,202,0.3)' }}
        >
          <MessageCircle size={18} aria-hidden />
          <span className="hidden sm:inline [writing-mode:vertical-rl] rotate-180 tracking-wide">KI-Berater</span>
          <span className="sr-only sm:hidden">KI-Berater öffnen</span>
        </button>
      )}

      {open && (
        <section
          id={panelId}
          role="dialog"
          aria-modal="false"
          aria-labelledby={titleId}
          className="fixed z-[70] inset-0 sm:inset-auto sm:right-4 sm:bottom-4 sm:w-[390px] sm:h-[min(640px,calc(100vh-2rem))] flex flex-col sm:rounded-3xl overflow-hidden"
          style={{ background: 'linear-gradient(170deg,#0a1220,#050a12)', border: '1px solid rgba(48,227,202,0.25)', boxShadow: '0 30px 80px rgba(0,0,0,0.6)' }}
        >
          {/* Kopf */}
          <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[#30E3CA]/15 text-[#30E3CA]"><Sparkles size={17} aria-hidden /></span>
              <div className="min-w-0">
                <h2 id={titleId} className="text-sm font-black text-white leading-tight">DYD-Berater</h2>
                <p className="text-[10px] text-white/45">KI-Assistent · Antworten können Fehler enthalten</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {chat.entries.length > 0 && (
                <button type="button" onClick={chat.reset} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]" aria-label="Gespräch neu starten" title="Neu starten">
                  <RotateCcw size={16} aria-hidden />
                </button>
              )}
              <button type="button" onClick={closePanel} className="p-2 rounded-lg text-white/50 hover:text-white hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]" aria-label="Berater schließen">
                <X size={18} aria-hidden />
              </button>
            </div>
          </header>

          {/* Verlauf */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4" aria-live="polite" aria-busy={chat.loading}>
            <div className="text-sm text-white/80 leading-relaxed">
              <p>Hallo! Ich bin der KI-Berater von DYD. Ich erkläre dir unsere Angebote, Preise und Abläufe und helfe dir, das Passende zu finden.</p>
              {chat.entries.length === 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {starters.map((s) => (
                    <button key={s} type="button" onClick={() => submit(s)}
                      className="px-3 py-2 rounded-xl text-xs font-bold text-white bg-white/[0.06] border border-white/12 hover:border-[#30E3CA]/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {chat.entries.map((e) => (
              <Entry key={e.id} entry={e} onDecline={chat.decline} onNavigate={() => { if (window.matchMedia('(max-width: 639px)').matches) closePanel(); }} />
            ))}

            {chat.loading && (
              <div className="flex items-center gap-2 text-xs text-white/50" role="status">
                <Loader2 size={14} className="animate-spin" aria-hidden /> Berater schreibt …
              </div>
            )}

            {chat.error && (
              <div className="rounded-xl p-3 text-xs text-red-200 bg-red-500/10 border border-red-500/25" role="alert">
                <p>{chat.error.message}</p>
                <div className="flex gap-2 mt-2">
                  {chat.error.retryable && (
                    <button type="button" onClick={chat.retry} className="px-3 py-1.5 rounded-lg font-bold text-white bg-white/10 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]">Erneut versuchen</button>
                  )}
                  <a href="#/faq" className="px-3 py-1.5 rounded-lg font-bold text-white/70 hover:text-white">Zu den FAQ</a>
                </div>
              </div>
            )}

            {!chat.loading && lastAssistant?.quickReplies && lastAssistant.quickReplies.length > 0 && lastAssistant === chat.entries[chat.entries.length - 1] && (
              <div className="flex flex-wrap gap-2">
                {lastAssistant.quickReplies.map((q) => (
                  <button key={q} type="button" onClick={() => submit(q)}
                    className="px-3 py-1.5 rounded-xl text-xs font-bold text-[#30E3CA] bg-[#30E3CA]/10 border border-[#30E3CA]/30 hover:bg-[#30E3CA]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#30E3CA]">
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Eingabe */}
          <form
            className="border-t border-white/10 p-3"
            onSubmit={(e) => { e.preventDefault(); submit(draft); }}
          >
            <div className="flex items-end gap-2">
              <label htmlFor={`${panelId}-input`} className="sr-only">Deine Frage an den Berater</label>
              <textarea
                id={`${panelId}-input`}
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value.slice(0, 600))}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(draft); } }}
                rows={1}
                maxLength={600}
                placeholder="Frag mich etwas …"
                className="flex-1 resize-none max-h-28 px-3.5 py-2.5 rounded-xl bg-white/[0.06] border border-white/12 text-base sm:text-sm text-white placeholder-white/35 focus:outline-none focus:border-[#30E3CA]"
              />
              <button
                type="submit"
                disabled={!draft.trim() || chat.loading}
                className="p-3 rounded-xl text-black disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}
                aria-label="Senden"
              >
                <Send size={16} aria-hidden />
              </button>
            </div>
            <p className="text-[10px] text-white/30 mt-2">
              KI-gestützt (OpenAI). Gesprächsinhalte werden nicht gespeichert. Bitte keine sensiblen Daten eingeben.{' '}
              <a href="#/datenschutz" className="underline hover:text-white/60">Datenschutz</a>
            </p>
          </form>
        </section>
      )}
    </>
  );
}

/** Antworttext sicher darstellen: nur Text, "- " am Zeilenanfang wird zur Liste */
function Entry({ entry, onDecline, onNavigate }: { entry: ChatEntry; onDecline: (id: string) => void; onNavigate: () => void }) {
  if (entry.role === 'user') {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-br-md text-sm text-black bg-[#30E3CA] whitespace-pre-wrap break-words">{entry.text}</p>
      </div>
    );
  }
  const blocks: { list: boolean; lines: string[] }[] = [];
  for (const line of entry.text.split('\n')) {
    const isItem = /^\s*[-•]\s+/.test(line);
    const text = line.replace(/^\s*[-•]\s+/, '').replace(/\*\*(.+?)\*\*/g, '$1');
    const last = blocks[blocks.length - 1];
    if (last && last.list === isItem) last.lines.push(text);
    else blocks.push({ list: isItem, lines: [text] });
  }
  return (
    <div className="space-y-3">
      <div className="text-sm text-white/85 leading-relaxed space-y-2 break-words">
        {blocks.map((b, i) => b.list ? (
          <ul key={i} className="list-disc pl-5 space-y-1">{b.lines.map((l, j) => <li key={j}>{l}</li>)}</ul>
        ) : (
          b.lines.filter((l) => l.trim()).map((l, j) => <p key={`${i}-${j}`}>{l}</p>)
        ))}
      </div>
      {entry.cards?.map((c) => (
        <AdvisorProductCard key={`${c.product_id}-${c.course?.id ?? ''}`} card={c} onDecline={onDecline} onNavigate={onNavigate} />
      ))}
    </div>
  );
}
