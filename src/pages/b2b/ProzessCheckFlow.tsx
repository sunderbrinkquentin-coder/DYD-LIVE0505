// src/pages/b2b/ProzessCheckFlow.tsx
//
// Conversion-Flow "3 Klicks zum Erstgespräch":
//   1. Termin fixieren – konkretes Datum + Uhrzeit (Pflicht), optional
//      Direktbuchung im Cal.com-Kalender.
//   2. Kontaktdaten – werden SOFORT gespeichert (Lead ist da, bevor die
//      Analyse startet). Der Datensatz füllt sich danach live weiter.
//   3. Optional: KI-Berater-Chat – individuelle Bedarfsanalyse mit
//      Reaktionszeilen, dynamischen Nachfragen (abhängig von den Antworten)
//      und einem Live-Profil, das sich mit jeder Antwort füllt. Jede Antwort
//      wird sofort in b2b_contact_requests nachgetragen; am Ende geht das
//      Briefing an den Make.com-Webhook.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, CalendarCheck, Check, CheckCircle2, Loader2, Send, Sparkles, User, X,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { triggerB2bBriefing } from '../../lib/b2bBriefing';
import { CalBookingButton } from './CalBookingButton';

const LIME = '#DEFF9A';
const SKY = '#38BDF8';

const TIMES = ['08:30', '10:00', '11:30', '14:00', '15:30', '17:00'];

function nextBusinessDays(count = 10): Date[] {
  const out: Date[] = [];
  const d = new Date();
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) out.push(new Date(d));
  }
  return out;
}

const fmtFull = (d: Date, time: string) =>
  `${d.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })} · ${time} Uhr`;

/* ─── Avatar & Chat-Bausteine ──────────────────────────────────────────── */
const AVATAR_SRC = '/profile-picture.png';

function AdvisorAvatar() {
  return (
    <span className="relative flex-shrink-0">
      <img src={AVATAR_SRC} alt="KI-Berater von DYD" className="w-8 h-8 rounded-xl object-cover ring-1 ring-[#DEFF9A]/50" />
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#DEFF9A] ring-2 ring-[#0A192F]" aria-hidden="true" />
    </span>
  );
}

function BotBubble({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <AdvisorAvatar />
      <div className="rounded-2xl rounded-tl-sm px-3.5 py-2.5 bg-white/[0.06] border border-white/10 font-arimo text-sm text-white/85 leading-relaxed">{children}</div>
    </div>
  );
}

const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface ChatQuestion {
  id: string;
  short: string;
  label: string;
  chips?: string[];
  placeholder?: string;
}

const BASE_QUESTIONS: ChatQuestion[] = [
  { id: 'ziel', short: 'Ziel', label: 'Was soll die Lösung am Ende für Ihr Geschäft tun?', chips: ['Zeit sparen', 'Fehler reduzieren', 'Mehr Umsatz', 'Kunden besser bedienen'], placeholder: 'z. B. Angebote in 5 Minuten statt 2 Tagen' },
  { id: 'nutzer', short: 'Nutzer', label: 'Wer arbeitet damit – und wie viele?', chips: ['Nur ich', '2–5 Personen', '6–20 Personen', 'Kunden selbst'], placeholder: 'z. B. Vertrieb (3) + Backoffice (2)' },
  { id: 'tools', short: 'Tools heute', label: 'Mit welchen Tools arbeiten Sie heute?', chips: ['Excel / Tabellen', 'E-Mail & Outlook', 'CRM / Warenwirtschaft', 'Papier & Telefon'], placeholder: 'z. B. Excel, Lexware, Gmail' },
  { id: 'daten', short: 'Datenlage', label: 'Wo liegen Ihre Daten heute?', chips: ['Excel', 'Datenbank', 'Papier / Scans', 'In mehreren Köpfen'], placeholder: 'z. B. Kundenliste in Excel, Rechnungen auf Papier' },
  { id: 'schnittstellen', short: 'Schnittstellen', label: 'Soll etwas angebunden werden?', chips: ['Website', 'Buchhaltung', 'Shop / Bestellungen', 'Kalender / E-Mail', 'Noch offen'], placeholder: 'z. B. Google Kalender + SEPA-Lastschrift' },
  { id: 'budget', short: 'Budget', label: 'Welcher Rahmen passt ungefähr?', chips: ['bis 3.000 €', '3.000–8.000 €', '8.000–20.000 €', 'Noch offen'], placeholder: 'gerne auch „weiß nicht" – ich ordne das ein' },
];

const QUESTION_ORDER = BASE_QUESTIONS.map((q) => q.id);
const QUESTION_MAP: Record<string, ChatQuestion> = Object.fromEntries(BASE_QUESTIONS.map((q) => [q.id, q]));

/** Dynamische Nachfrage, je nachdem was die Antwort enthält */
function followUpFor(id: string, answer: string): ChatQuestion | null {
  const a = answer.toLowerCase();
  if (id === 'tools' && a.includes('excel') && a.includes('papier')) {
    return { id: 'daten_quelle', short: 'Daten quelle', label: 'Excel UND Papier – wo ist die wichtigere Quelle, mit der wir starten?', chips: ['Excel zuerst', 'Papier zuerst', 'Beides zusammenführen'], placeholder: 'z. B. Excel ist Master, Papier wird gescannt' };
  }
  if (id === 'tools' && a.includes('excel')) {
    return { id: 'excel_umfang', short: 'Excel-Umfang', label: 'Wie groß ist Ihre größte Excel-Datei ungefähr?', chips: ['Unter 100 Zeilen', '100–1.000 Zeilen', 'Über 1.000 Zeilen', 'Mehrere Dateien'], placeholder: 'gerne auch Dateinamen nennen' };
  }
  if (id === 'schnittstellen' && (a.includes('shop') || a.includes('website'))) {
    return { id: 'shop_plattform', short: 'Plattform', label: 'Auf welcher Plattform läuft Ihr Shop bzw. Ihre Website?', chips: ['WordPress / WooCommerce', 'Shopify', 'JTL / Gambio', 'Individuell'], placeholder: 'z. B. Shopify Plus' };
  }
  if (id === 'budget' && a.includes('noch offen')) {
    return { id: 'prioritaet', short: 'Priorität', label: 'Verstanden – was ist Ihnen dann am wichtigsten?', chips: ['Schnell & schlank starten', 'Von Anfang an skalierbar', 'Bestes Preis-Leistungs-Verhältnis', 'Erstmal Prototyp testen'], placeholder: 'eigenes Stichwort' };
  }
  if (id === 'ziel' && (a.includes('umsatz') || a.includes('verkauf'))) {
    return { id: 'umsatz_hebel', short: 'Umsatz-Hebel', label: 'Wo gehen heute die meisten Anfragen oder Aufträge verloren?', chips: ['Anfragen bleiben liegen', 'Nachfassen passiert nicht', 'Angebot zu langsam', 'Kein Follow-up'], placeholder: 'eigene Beobachtung' };
  }
  return null;
}

/** Persönliche Reaktionszeile des Beraters auf eine Antwort */
function reactTo(id: string, answer: string, name: string): string {
  const a = answer.toLowerCase();
  switch (id) {
    case 'ziel':
      if (a.includes('umsatz')) return 'Sehr gut – Umsatzthemen haben meist den schnellsten Hebel. Ich schaue gleich, wo wir ansetzen.';
      if (a.includes('fehler')) return 'Fehlerquellen zu eliminieren ist oft der größte Gewinn. Notiert.';
      return 'Das ist ein klares Ziel – genau richtig, so arbeitet es sich zielgerichtet.';
    case 'nutzer':
      if (a.includes('nur ich')) return 'Dann bauen wir schlank und für Sie optimiert – kein Ballast.';
      return 'Perfekt, mehrere Nutzer bedeuten: Rollen und Freigaben plane ich von Anfang an mit.';
    case 'tools':
      if (a.includes('excel')) return 'Excel-Chaos kenne ich – genau da liegt meist der größte Zeitfresser. Bleiben wir kurz dran …';
      if (a.includes('papier')) return 'Papier lässt sich gut digitalisieren – das holen wir mit.';
      return 'Gut zu wissen, darauf baue ich auf.';
    case 'daten':
      return 'Notiert. Ihre Datenlage ist wichtig für den ersten Prototyp.';
    case 'schnittstellen':
      if (a.includes('noch offen')) return 'Kein Problem – das klären wir gemeinsam im Erstgespräch.';
      return 'Anbindungen baue ich so, dass sie erweiterbar bleiben.';
    case 'budget':
      if (a.includes('noch offen')) return 'Völlig okay – wir finden den passenden Rahmen im Gespräch.';
      return name ? `Danke ${name}, das hilft bei der ersten Größenordnung.` : 'Danke, das hilft bei der ersten Größenordnung.';
    default:
      return name ? `Danke, ${name} – sehr hilfreich!` : 'Sehr hilfreich, danke!';
  }
}

/* ─── Der Flow ─────────────────────────────────────────────────────────── */
export function ProzessCheckFlow({ presetArea, presetDetails }: { presetArea?: string | null; presetDetails?: string | null }) {
  const reduce = useReducedMotion() ?? false;
  const [step, setStep] = useState(0); // 0 Termin · 1 Kontakt · 2 Chat
  const days = useMemo(() => nextBusinessDays(), []);
  const [day, setDay] = useState<Date | null>(null);
  const [time, setTime] = useState('');
  const [customDate, setCustomDate] = useState(false);
  const [customTime, setCustomTime] = useState(false);
  const [form, setForm] = useState({ name: '', company: '', email: '', phone: '', note: '' });
  const [decider, setDecider] = useState(false);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  // Chat-Zustand
  const [chatStarted, setChatStarted] = useState(false);
  const [askedQs, setAskedQs] = useState<ChatQuestion[]>([]); // gestellte Fragen (inkl. Nachfragen)
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [reactions, setReactions] = useState<string[]>([]); // Bot-Reaktionszeilen je Frage (Index = asked.length)
  const [typing, setTyping] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [briefingSent, setBriefingSent] = useState(false);

  const appointmentFull = day && time ? fmtFull(day, time) : '';
  const nextBase = QUESTION_ORDER.find((id) => !answers[id]);
  const lastQ = askedQs[askedQs.length - 1];
  const pendingQ: ChatQuestion | null = followUpFor(lastQ?.id ?? '', answers[lastQ?.id ?? ''] ?? '')
    ?? (nextBase ? QUESTION_MAP[nextBase] : null);
  const input = 'w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/12 text-white placeholder-white/35 font-arimo text-sm focus:outline-none focus:border-[#DEFF9A]';

  useEffect(() => {
    if (step === 2 && chatStarted) {
      chatEndRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      if (!typing) chatInputRef.current?.focus();
    }
  }, [askedQs, typing, chatStarted, step, reduce]);

  /** Nachricht zusammenbauen – wird bei jeder Antwort aktualisiert */
  const buildMessage = (a: Record<string, string>, analysisNote: string) => [
    'Prozess-Check (Automatisierung)',
    presetArea ? `Bereich: ${presetArea}` : '',
    presetDetails ? `Auswahl: ${presetDetails}` : '',
    day && time ? `Festes Erstgespräch: ${appointmentFull}` : '',
    `Entscheider:in: ${decider ? 'ja' : 'nein'}`,
    form.note.trim() ? `Anliegen: ${form.note.trim()}` : '',
    `Bedarfsanalyse: ${analysisNote}`,
    ...Object.entries(a).map(([id, val]) => `${QUESTION_MAP[id]?.short ?? id}: ${val}`),
  ].filter(Boolean).join('\n');

  /** Antwort speichern: Zustand + sofort in die Datenbank (Lead füllt sich) */
  const recordAnswer = async (id: string, value: string) => {
    const next = { ...answers, [id]: value };
    setAnswers(next);
    if (leadId) {
      try {
        const attemptUpdate = () => supabase.from('b2b_contact_requests').update({ message: buildMessage(next, 'läuft im Chat') }).eq('id', leadId);
        let upd = await attemptUpdate();
        if (upd.error && (upd.error.status === 401 || /JWT|token|invalid/i.test(upd.error.message))) {
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
          upd = await attemptUpdate();
        }
        if (upd.error) throw upd.error;
      } catch { /*Lead bleibt mindestens mit Kontaktdaten erhalten*/ }
    }
  };

  const answerCurrent = (value: string) => {
    if (!pendingQ || !value.trim()) return;
    recordAnswer(pendingQ.id, value.trim());
    setChatDraft('');
    setTyping(true);
    window.setTimeout(() => {
      setReactions((r) => [...r, reactTo(pendingQ.id, value, form.name.trim())]);
      setTyping(false);
      setAskedQs((prev) => (prev[prev.length - 1]?.id === pendingQ.id ? prev : [...prev, pendingQ]));
    }, reduce ? 0 : 750);
  };

  const sendBriefing = async (a: Record<string, string>, note: string) => {
    if (briefingSent) return;
    setBriefingSent(true);
    if (leadId) {
      try {
        const attemptUpdate = () => supabase.from('b2b_contact_requests').update({ message: buildMessage(a, note) }).eq('id', leadId);
        let upd = await attemptUpdate();
        if (upd.error && (upd.error.status === 401 || /JWT|token|invalid/i.test(upd.error.message))) {
          try { await supabase.auth.signOut(); } catch { /* ignore */ }
          upd = await attemptUpdate();
        }
        if (upd.error) throw upd.error;
      } catch { /* already saved progressively */ }
    }
    triggerB2bBriefing({
      source: 'prozess-check',
      contact: { name: form.name.trim(), company: form.company.trim(), email: form.email.trim(), phone: form.phone.trim() || null },
      segment: 'automatisierung',
      need: buildMessage(a, note),
      answers: {
        bereich: presetArea || '–',
        rechner_auswahl: presetDetails || '–',
        termin_fix: appointmentFull,
        entscheidet: decider ? 'ja' : 'nein',
        anliegen: form.note.trim(),
        bedarfsanalyse: Object.entries(a).map(([id, v]) => `${QUESTION_MAP[id]?.short ?? id}: ${v}`).join(' | ') || note,
      },
    });
  };

  /* ── Schritt 2 speichern: Lead IST DA, bevor der Chat startet ── */
  const saveContact = async (startChat: boolean) => {
    if (!day || !time) { setError('Bitte wählen Sie zuerst Datum und Uhrzeit.'); setStep(0); return; }
    if (!form.name.trim() || !form.email.trim()) { setError('Bitte geben Sie Name und E-Mail an.'); return; }
    setStatus('saving');
    setError('');
    try {
      const payload = {
        company_name: form.company.trim() || '–',
        contact_name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        segment: 'automatisierung',
        message: buildMessage({}, startChat ? 'Kontakt gespeichert – Analyse folgt' : 'keine Analyse gewünscht – Nachfrage per E-Mail'),
      };
      const attemptInsert = () => supabase.from('b2b_contact_requests').insert(payload).select('id').single();
      let { data, error: err } = await attemptInsert();
      if (err && (err.status === 401 || err.code === '401' || /JWT|token|invalid/i.test(err.message))) {
        // Abgelaufene/ungültige Browser-Anmeldung verwerfen und ohne sie erneut versuchen
        try { await supabase.auth.signOut(); } catch { /* ignore */ }
        ({ data, error: err } = await attemptInsert());
      }
      if (err) throw err;
      setLeadId(data?.id ?? null);
      setStatus('idle');
      if (!startChat) {
        sendBriefing({}, 'keine Analyse gewünscht – Nachfrage per E-Mail');
        setStatus('done');
      } else {
        setChatStarted(true);
        setStep(2);
      }
    } catch (e) {
      setStatus('error');
      setError(e instanceof Error ? e.message : 'Speichern fehlgeschlagen – bitte erneut versuchen.');
    }
  };

  const finishChat = async () => {
    setStatus('saving');
    await sendBriefing(answers, Object.keys(answers).length >= 4 ? 'im Chat abgeschlossen' : 'im Chat abgebrochen – Teilantworten');
    setStatus('done');
  };

  const titles = ['Ihr Termin – Datum & Uhrzeit', 'Wohin dürfen wir bestätigen?', 'Ihre persönliche Bedarfsanalyse'];
  const answeredCount = Object.keys(answers).length;

  if (status === 'done') {
    return (
      <div className="text-center py-10">
        <div className="inline-flex mb-4"><AdvisorAvatar /></div>
        <p className="font-poppins font-black text-2xl text-white mb-2">Termin gesichert!</p>
        <p className="font-arimo text-white/70 max-w-md mx-auto mb-3">
          Ihr Erstgespräch: <span className="font-bold text-white">{appointmentFull}</span>.
        </p>
        <p className="font-arimo text-white/60 max-w-md mx-auto">
          {answeredCount >= 4
            ? `Ihr KI-Berater hat ${answeredCount} Punkte von Ihnen erfasst – Ihr vorbereiteter Berater schaut sich das vor dem Termin an.`
            : `Die Bestätigung mit einem kurzen Fragebogen geht in wenigen Minuten an ${form.email.trim()} – 2 Minuten vor dem Termin ausfüllen genügt.`}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Fortschritt */}
      <div className="flex items-center gap-2 mb-5" aria-hidden="true">
        {['Termin', 'Kontakt', 'Analyse'].map((label, k) => (
          <div key={label} className="flex-1">
            <span className="h-1.5 block rounded-full transition-colors" style={{ background: (k === 2 && chatStarted) || k <= step ? LIME : 'rgba(255,255,255,0.12)' }} />
            <span className={`mt-1 block font-arimo text-[10px] font-bold uppercase tracking-wide ${(k === 2 && chatStarted) || k === step ? 'text-[#DEFF9A]' : 'text-white/35'}`}>
              {k + 1}. {label}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mb-4">
        <p className="font-poppins font-bold text-lg text-white">{titles[step]}</p>
        {step > 0 && (
          <button type="button" onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1 font-arimo text-xs font-bold text-white/50 hover:text-white b2b-focus-ring rounded">
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" /> Zurück
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: reduce ? 0 : 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: reduce ? 0 : -16 }} transition={{ duration: reduce ? 0 : 0.2 }}>
          {/* ── Schritt 1: Termin ── */}
          {step === 0 && (
            <div className="grid gap-4">
              <p className="font-arimo text-sm text-white/65">Wählen Sie Datum und Uhrzeit – das ist Ihr verbindlicher Terminwunsch für das kostenlose Erstgespräch (30 Min., online). Wir bestätigen sofort per E-Mail.</p>
              <div>
                <p className="font-arimo text-[11px] font-bold uppercase tracking-wide text-white/60 mb-2 flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />Datum</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {days.map((d) => {
                    const sel = day?.toDateString() === d.toDateString();
                    return (
                      <button key={d.toISOString()} type="button" aria-pressed={sel}
                        onClick={() => { setDay(sel ? null : d); setCustomDate(false); }}
                        className={`group rounded-xl border px-2 py-2.5 text-center transition b2b-focus-ring ${sel ? 'border-[#DEFF9A] bg-[#DEFF9A]/10' : 'border-white/12 bg-white/[0.03] hover:border-white/35'}`}>
                        <span className={`block font-arimo text-[10px] font-bold uppercase tracking-wide ${sel ? 'text-[#DEFF9A]' : 'text-white/45'}`}>{d.toLocaleDateString('de-DE', { weekday: 'short' })}</span>
                        <span className={`block font-poppins font-black text-lg leading-tight ${sel ? 'text-[#DEFF9A]' : 'text-white/85 group-hover:text-white'}`}>{d.getDate()}.</span>
                        <span className={`block font-arimo text-[10px] ${sel ? 'text-[#DEFF9A]/80' : 'text-white/40'}`}>{d.toLocaleDateString('de-DE', { month: 'short' })}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" aria-pressed={customDate}
                  onClick={() => { setCustomDate(!customDate); if (!customDate) setDay(null); }}
                  className={`mt-1 px-3.5 py-2 rounded-xl font-arimo text-xs font-bold border transition b2b-focus-ring ${customDate ? 'border-[#DEFF9A] bg-[#DEFF9A]/10 text-[#DEFF9A]' : 'border-white/15 text-white/70 hover:border-white/35 hover:text-white'}`}>
                  Anderes Datum
                </button>
                {customDate && (
                  <input type="date" min={toLocalISO(new Date())} value={day ? toLocalISO(day) : ''}
                    onChange={(e) => { if (e.target.value) { const [y, m, dd] = e.target.value.split('-').map(Number); setDay(new Date(y, m - 1, dd)); } }}
                    className="mt-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/12 text-white font-arimo text-sm focus:outline-none focus:border-[#DEFF9A] [color-scheme:dark]"
                    aria-label="Freies Datum wählen" />
                )}
              </div>
              <div>
                <p className="font-arimo text-[11px] font-bold uppercase tracking-wide text-white/60 mb-2 flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />Uhrzeit</p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {TIMES.map((t) => {
                    const sel = time === t;
                    return (
                      <button key={t} type="button" aria-pressed={sel}
                        onClick={() => { setTime(sel ? '' : t); setCustomTime(false); }}
                        className={`rounded-xl border px-2 py-2.5 text-center transition b2b-focus-ring ${sel ? 'border-[#DEFF9A] bg-[#DEFF9A]/10' : 'border-white/12 bg-white/[0.03] hover:border-white/35'}`}>
                        <span className={`block font-poppins font-black text-sm leading-tight ${sel ? 'text-[#DEFF9A]' : 'text-white/85'}`}>{t}</span>
                        <span className={`block font-arimo text-[10px] ${sel ? 'text-[#DEFF9A]/80' : 'text-white/40'}`}>Uhr</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" aria-pressed={customTime}
                  onClick={() => { setCustomTime(!customTime); if (!customTime) setTime(''); }}
                  className={`mt-2 px-3.5 py-2 rounded-xl font-arimo text-xs font-bold border transition b2b-focus-ring ${customTime ? 'border-[#DEFF9A] bg-[#DEFF9A]/10 text-[#DEFF9A]' : 'border-white/15 text-white/70 hover:border-white/35 hover:text-white'}`}>
                  Andere Uhrzeit
                </button>
                {customTime && (
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
                    className="mt-2 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/12 text-white font-arimo text-sm focus:outline-none focus:border-[#DEFF9A] [color-scheme:dark]"
                    aria-label="Freie Uhrzeit wählen" />
                )}
              </div>
                {day && time && (
                <div className="mt-1.5 rounded-xl px-4 py-3 bg-[#DEFF9A]/[0.07] border border-[#DEFF9A]/25">
                  <div className="flex items-center gap-2 font-arimo text-sm text-white">
                    <Check className="w-4 h-4 text-[#DEFF9A] flex-shrink-0" aria-hidden="true" />Ihr Termin:
                    <span className="font-bold">{appointmentFull}</span>
                  </div>
                  <p className="mt-1 font-arimo text-[11px] text-white/50">30 Minuten, kostenlos & online – Bestätigung folgt sofort per E-Mail.</p>
                </div>
              )}
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <button type="button" onClick={() => { setError(''); setStep(1); }} disabled={!day || !time}
                  className="group inline-flex items-center justify-center gap-2 flex-1 px-6 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                  style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
                  Weiter – Kontakt <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </button>
                <CalBookingButton label="Direkt im Kalender buchen" variant="secondary" className="!px-5 !py-3.5 text-sm" />
              </div>
              <p className="font-arimo text-[11px] text-white/40">Sie sehen keinen passenden Slot? Buchen Sie direkt im Kalender oder schicken Sie uns eine Mail – wir finden eine Zeit.</p>
            </div>
          )}

          {/* ── Schritt 2: Kontakt (wird sofort gespeichert) ── */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); saveContact(true); }} className="grid gap-3">
              <div className="flex flex-wrap gap-1.5">
                {[presetArea, presetDetails, appointmentFull].filter(Boolean).map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 font-arimo text-[11px] font-bold text-[#DEFF9A]"><Check className="w-3 h-3" aria-hidden="true" />{t}</span>
                ))}
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input className={input} required placeholder="Ihr Name *" autoComplete="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} aria-label="Ihr Name" />
                <input className={input} placeholder="Unternehmen" autoComplete="organization" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} aria-label="Unternehmen" />
                <input className={input} required type="email" placeholder="E-Mail *" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} aria-label="E-Mail" />
                <input className={input} type="tel" placeholder="Telefon (optional)" autoComplete="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} aria-label="Telefon" />
              </div>
              <textarea className={`${input} resize-none`} rows={2} placeholder="Erkläre direkt dein Anliegen, damit wir keine Zeit verlieren." value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} aria-label="Anliegen beschreiben" />
              <label className="flex items-start gap-2.5 rounded-xl px-3.5 py-3 bg-white/[0.04] border border-white/10 cursor-pointer select-none">
                <input type="checkbox" checked={decider} onChange={(e) => setDecider(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#DEFF9A]" />
                <span className="font-arimo text-xs text-white/75 leading-relaxed">Ich bin Entscheider:in und kann über das Projekt entscheiden.</span>
              </label>
              {error && <p className="font-arimo text-sm text-red-400">{error}</p>}
              <div className="grid sm:grid-cols-2 gap-2.5">
                <button type="submit" disabled={status === 'saving'}
                  className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#DEFF9A]/20 disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
                  {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <><Sparkles className="w-4 h-4" aria-hidden="true" /> Bedarfsanalyse jetzt starten</>}
                </button>
                <button type="button" onClick={() => saveContact(false)} disabled={status === 'saving'}
                  className="inline-flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-arimo font-bold text-sm text-white border border-white/20 hover:bg-white/5 b2b-focus-ring disabled:opacity-60">
                  Nur Termin sichern – Analyse per E-Mail
                </button>
              </div>
              <p className="font-arimo text-[11px] text-white/40 text-center">Ihre Kontaktdaten werden sofort übermittelt – auch wenn Sie den Chat abbrechen. <a href="/#/datenschutz" className="underline hover:text-white/70">Datenschutz</a></p>
            </form>
          )}

          {/* ── Schritt 3: KI-Berater-Chat ── */}
          {step === 2 && chatStarted && (
            <div className="grid lg:grid-cols-5 gap-3">
              {/* Live-Profil (füllt sich mit jeder Antwort) */}
              <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] border border-white/10 p-4 order-2 lg:order-1">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-arimo text-[11px] font-bold uppercase tracking-wide text-[#DEFF9A] flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" aria-hidden="true" />Ihr Profil</p>
                  <span className="font-poppins font-black text-xs px-2 py-0.5 rounded-full bg-[#DEFF9A]/10 text-[#DEFF9A] border border-[#DEFF9A]/30">{answeredCount}/{QUESTION_ORDER.length}</span>
                </div>
                {/* Fortschrittsbalken */}
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-4" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTION_ORDER.length} aria-valuenow={answeredCount}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(answeredCount / QUESTION_ORDER.length) * 100}%`, background: `linear-gradient(90deg, ${SKY}, ${LIME})` }} />
                </div>
                <dl className="space-y-2.5">
                  {QUESTION_ORDER.map((id) => {
                    const q = QUESTION_MAP[id];
                    const v = answers[id];
                    return (
                      <div key={id} className={v ? '' : 'opacity-60'}>
                        <dt className="font-arimo text-[10px] font-bold uppercase tracking-wide text-white/40 flex items-center gap-1.5">
                          {v && <Check className="w-3 h-3 text-[#DEFF9A] flex-shrink-0" aria-hidden="true" />}{q.short}
                        </dt>
                        <dd className={`font-arimo text-sm leading-snug ${v ? 'text-white' : 'text-white/25 italic'}`}>{v ?? 'offen …'}</dd>
                      </div>
                    );
                  })}
                </dl>
                <div className="mt-4 rounded-xl px-3 py-2.5 bg-[#DEFF9A]/[0.07] border border-[#DEFF9A]/25">
                  <p className="font-arimo text-[11px] text-[#DEFF9A] font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" aria-hidden="true" />Termin fix</p>
                  <p className="font-arimo text-[11px] text-white/70 leading-snug">{appointmentFull}</p>
                </div>
                {answeredCount > 0 && (
                  <p className="mt-3 font-arimo text-[10px] text-white/35 leading-snug">Jede Antwort wird direkt übertragen – auch bei Abbruch haben wir Ihre Angaben.</p>
                )}
              </div>

              {/* Chat */}
              <div className="lg:col-span-3 order-1 lg:order-2 grid gap-3 content-start">
                {/* Chat-Kopfzeile mit Avatar */}
                <div className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/10 px-4 py-3">
                  <AdvisorAvatar />
                  <div className="flex-1 min-w-0">
                    <p className="font-poppins font-bold text-sm text-white leading-tight">DYD KI-Berater</p>
                    <p className="font-arimo text-[11px] text-white/50">Bereitet Ihr Gespräch vor · online</p>
                  </div>
                  <span className="flex items-center gap-1.5 font-arimo text-[11px] font-bold text-[#DEFF9A]">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#DEFF9A] opacity-60" aria-hidden="true" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#DEFF9A]" aria-hidden="true" />
                    </span>
                    live
                  </span>
                </div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4 max-h-[360px] overflow-y-auto space-y-3">
                  {/* Begrüßung, personalisiert */}
                  <BotBubble>
                    {form.name.trim() ? `Hi ${form.name.trim()}` : 'Herzlich willkommen'}{form.company.trim() ? ` von ${form.company.trim()}` : ''}! Ihr Termin am <span className="font-bold">{appointmentFull}</span> ist fix. Ich bereite Ihr Gespräch vor – dauert nur ~2 Minuten.
                    <p className="mt-2 font-bold text-[#DEFF9A]">Los geht's mit der ersten Frage:</p>
                  </BotBubble>

                  {askedQs.map((q, k) => (
                    <div key={q.id} className="space-y-2">
                      <BotBubble>{q.label}</BotBubble>
                      <div className="flex items-start gap-2.5 justify-end">
                        <div className="rounded-2xl rounded-tr-sm px-3.5 py-2.5 font-arimo text-sm bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-white leading-relaxed">{answers[q.id]}</div>
                        <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-white/10"><User className="w-4 h-4 text-white/70" aria-hidden="true" /></span>
                      </div>
                      {reactions[k] && <BotBubble>{reactions[k]}</BotBubble>}
                    </div>
                  ))}

                  {typing && (
                    <BotBubble>
                      <span className="flex gap-1" aria-label="Berater schreibt">
                        {[0, 1, 2].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />)}
                      </span>
                    </BotBubble>
                  )}

                  {/* Aktuelle Frage */}
                  {!typing && pendingQ && (
                    <BotBubble>
                      <p className="mb-2">{pendingQ.label}</p>
                      {pendingQ.chips && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {pendingQ.chips.map((chip) => (
                            <button key={chip} type="button" onClick={() => answerCurrent(chip)}
                              className="px-2.5 py-1 rounded-full font-arimo text-[11px] font-bold border border-white/15 text-white/70 hover:text-white hover:border-[#DEFF9A]/50 transition b2b-focus-ring">
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2">
                        <input ref={chatInputRef} className={input} placeholder={pendingQ.placeholder ?? 'Ihre Antwort …'} value={chatDraft} onChange={(e) => setChatDraft(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); answerCurrent(chatDraft); } }}
                          aria-label={pendingQ.label} />
                        <button type="button" onClick={() => answerCurrent(chatDraft)}
                          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 b2b-focus-ring" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }} aria-label="Antwort senden">
                          <Send className="w-4 h-4 text-[#0A192F]" aria-hidden="true" />
                        </button>
                      </div>
                    </BotBubble>
                  )}

                  {/* Abschluss */}
                  {!typing && !pendingQ && (
                    <BotBubble>
                      Perfekt – <span className="font-bold">{answeredCount} Punkte erfasst</span>! Ihr Profil ist vollständig. Ihr Gespräch am <span className="font-bold">{appointmentFull}</span> kann direkt konkret starten.
                    </BotBubble>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {error && <p className="font-arimo text-sm text-red-400">{error}</p>}
                <button type="button" onClick={finishChat} disabled={status === 'saving'}
                  className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#DEFF9A]/20 disabled:opacity-60"
                  style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
                  {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
                  {pendingQ ? 'Fertigstellen – was ich habe, reicht' : 'Absenden & Termin sichern'}
                </button>
                <p className="font-arimo text-[11px] text-white/40 text-center">Sie können jederzeit abbrechen – Ihre bisherigen Antworten sind bereits gesichert.</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─── Popup: Prozess mit Stunden/Preis + Flow ──────────────────────────── */
export function ProzessCheckModal({ open, onClose, presetArea, presetDetails }: {
  open: boolean; onClose: () => void; presetArea?: string | null; presetDetails?: string | null;
}) {
  const reduce = useReducedMotion() ?? false;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[130] bg-black/80 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog" aria-modal="true" aria-label="Prozess-Check – Anfrage stellen">
      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 24, scale: reduce ? 1 : 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: reduce ? 0 : 16 }}
        transition={{ duration: reduce ? 0 : 0.25 }}
        className="relative w-full max-w-3xl my-6 rounded-[1.75rem] p-[1px] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.9),0_0_80px_-30px_rgba(56,189,248,0.35)]"
        style={{ background: `linear-gradient(160deg, rgba(222,255,154,0.4), rgba(56,189,248,0.25), rgba(255,255,255,0.08))` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="rounded-[calc(1.75rem-1px)] bg-[#0A192F] p-5 sm:p-7">
          <button type="button" onClick={onClose} className="absolute top-3 right-3 p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/10 b2b-focus-ring" aria-label="Schließen">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          {presetDetails && (
            <div className="mb-5 rounded-2xl px-4 py-3 bg-[#DEFF9A]/[0.07] border border-[#DEFF9A]/25">
              <p className="flex items-center gap-1.5 font-arimo text-[11px] font-bold uppercase tracking-wide text-[#DEFF9A] mb-1">
                <Check className="w-3.5 h-3.5" aria-hidden="true" />Ihre Auswahl wird übernommen
              </p>
              <p className="font-arimo text-sm text-white/85 leading-relaxed">{presetDetails}</p>
              <p className="font-arimo text-[11px] text-white/45 mt-1">Verbindlicher Festpreis nach dem Prozess-Check – keine offene Stundenabrechnung.</p>
            </div>
          )}

          <div className="flex items-center gap-2 mb-1">
            <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}><CalendarCheck className="w-4 h-4 text-[#0A192F]" aria-hidden="true" /></span>
            <h2 className="font-poppins font-black text-xl sm:text-2xl" style={{ letterSpacing: '-0.02em' }}>3 Klicks zum Erstgespräch</h2>
          </div>
          <p className="font-arimo text-xs text-white/50 mb-5">1 Termin fixieren · 2 Kontakt (wird sofort gesichert) · 3 KI-Berater-Analyse – kostenlos, unverbindlich.</p>

          <ProzessCheckFlow presetArea={presetArea} presetDetails={presetDetails} />
        </div>
      </motion.div>
    </motion.div>
  );
}
