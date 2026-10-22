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
  ArrowLeft, ArrowRight, CalendarCheck, Check, ChevronDown, CheckCircle2, Loader2, Send, Sparkles, Sun, Sunrise, X,
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
      <img src={AVATAR_SRC} alt="KI-Berater von DYD" className="w-9 h-9 rounded-2xl object-cover ring-1 ring-[#DEFF9A]/50" />
      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-[#DEFF9A] ring-2 ring-[#0A192F]" aria-hidden="true" />
    </span>
  );
}

function BotBubble({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.25, ease: 'easeOut' }} className="flex items-start gap-2.5">
      <AdvisorAvatar />
      <div className="rounded-3xl rounded-tl-md px-4 py-3 bg-white/[0.08] border border-white/10 font-arimo text-[15px] text-white leading-relaxed antialiased">{children}</div>
    </motion.div>
  );
}

function UserBubble({ children, name }: { children: ReactNode; name: string }) {
  const reduce = useReducedMotion() ?? false;
  const initials = name.trim().split(/\s+/).map((w) => w[0]?.toUpperCase() ?? '').join('').slice(0, 2) || 'SIE';
  return (
    <motion.div initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.2, ease: 'easeOut' }} className="flex items-start gap-2.5 justify-end">
      <div className="rounded-3xl rounded-tr-md px-4 py-3 font-arimo text-[15px] font-medium bg-gradient-to-br from-[#38BDF8]/30 to-[#38BDF8]/15 border border-[#38BDF8]/40 text-white leading-relaxed antialiased max-w-[75%]">{children}</div>
      <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#38BDF8]/15 border border-[#38BDF8]/35 font-poppins font-black text-[11px] text-[#38BDF8]" aria-hidden="true">{initials}</span>
    </motion.div>
  );
}

/** Wissens-Karte: vertieft die Antwort mit Einordnung aus der Praxis */
function InsightBubble({ children }: { children: ReactNode }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.3, ease: 'easeOut' }}
      className="ml-8 rounded-3xl rounded-tl-md px-4 py-3 bg-[#DEFF9A]/[0.08] border border-[#DEFF9A]/20">
      <p className="font-arimo text-[11px] font-bold uppercase tracking-wide text-[#DEFF9A] mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" aria-hidden="true" />Einordnung aus der Praxis</p>
      <p className="font-arimo text-[15px] text-white/90 leading-relaxed antialiased">{children}</p>
    </motion.div>
  );
}

/** Abschluss-Karte: das persönliche Fazit der Journey */
function FazitCard({ items, name, appointment }: { items: string[]; name: string; appointment: string }) {
  const reduce = useReducedMotion() ?? false;
  return (
    <motion.div initial={{ opacity: 0, y: reduce ? 0 : 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduce ? 0 : 0.3, ease: 'easeOut' }}
      className="rounded-2xl px-4 py-3.5 bg-[#DEFF9A]/[0.07] border border-[#DEFF9A]/30">
      <p className="font-arimo text-[10px] font-bold uppercase tracking-wide text-[#DEFF9A] mb-1.5 flex items-center gap-1"><Sparkles className="w-3 h-3" aria-hidden="true" />Ihr persönliches Fazit</p>
      <p className="font-arimo text-[15px] text-white leading-relaxed mb-2">
        {name ? `${name}, hier ist, was ich für Ihr Gespräch am ${appointment} mitnehme:` : `Was ich für Ihr Gespräch am ${appointment} mitnehme:`}
      </p>
      <ul className="space-y-1.5">
        {items.map((t) => (
          <li key={t} className="flex gap-2 font-arimo text-[15px] text-white/85 leading-relaxed">
            <Check className="w-4 h-4 text-[#DEFF9A] flex-shrink-0 mt-0.5" aria-hidden="true" />{t}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

const toLocalISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface ChatQuestion {
  id: string;
  short: string;
  label: string;
  why?: string;
  chips?: string[];
  placeholder?: string;
}

const BASE_QUESTIONS: ChatQuestion[] = [
  { id: 'firma', short: 'Firma', label: 'Bevor wir in die Details gehen: Erzählen Sie mir kurz etwas zu Ihrer Firma – was macht Ihr Unternehmen und wie groß ist das Team?', why: 'Ihre Branche und Größe bestimmen, welche Prozesse sich zuerst lohnen – die Muster unterscheiden sich stark.', chips: ['Handwerk', 'Handel / E-Commerce', 'Dienstleistung', 'Agentur / Kreativ'], placeholder: 'z. B. Dachdeckerbetrieb, 12 Mitarbeitende' },
  { id: 'ziel', short: 'Ziel', label: 'Stark. Und was soll die Lösung am Ende konkret für Ihr Geschäft tun?', why: 'Ein konkretes Ziel entscheidet, welchen Prozess wir zuerst angehen – und woran wir den Erfolg messen.', chips: ['Zeit sparen', 'Fehler reduzieren', 'Mehr Umsatz', 'Kunden besser bedienen'], placeholder: 'z. B. Angebote in 5 Minuten statt 2 Tagen' },
  { id: 'problem', short: 'Kernproblem', label: 'Und jetzt zum Herzen der Sache: Welcher Prozess kostet Ihnen aktuell am meisten Zeit oder Nerven?', why: 'Wir starten dort, wo der Schmerz am größten ist – so zeigt die Lösung schon nach 2 Wochen Wirkung.', chips: ['Angebote schreiben', 'Auftragsabwicklung', 'Rechnungen & Buchhaltung', 'Kundenkommunikation'], placeholder: 'z. B. Angebote schreibe ich jeden Abend von Hand' },
  { id: 'nutzer', short: 'Nutzer', label: 'Verstanden. Wer wird damit arbeiten – nur Sie, oder gleich ein ganzes Team?', why: 'Die Nutzerzahl bestimmt Rollen, Freigaben und Schulungsaufwand.', chips: ['Nur ich', '2–5 Personen', '6–20 Personen', 'Kunden selbst'], placeholder: 'z. B. Vertrieb (3) + Backoffice (2)' },
  { id: 'tools', short: 'Tools heute', label: 'Verstanden. Mit welchen Tools arbeitet Ihr Team denn heute so?', why: 'Ihre Tools zeigen mir, wo der größte Zeitfresser liegt und was wir anbinden müssen.', chips: ['Excel / Tabellen', 'E-Mail & Outlook', 'CRM / Warenwirtschaft', 'Papier & Telefon'], placeholder: 'z. B. Excel, Lexware, Gmail' },
  { id: 'daten', short: 'Datenlage', label: 'Alles klar. Und wo liegen aktuell Ihre Daten – in Excel, in einem System, auf Papier?', why: 'Die Datenlage entscheidet, wie schnell ein erster Prototyp stehen kann.', chips: ['Excel', 'Datenbank', 'Papier / Scans', 'In mehreren Köpfen'], placeholder: 'z. B. Kundenliste in Excel, Rechnungen auf Papier' },
  { id: 'schnittstellen', short: 'Schnittstellen', label: 'Fast durch! Soll noch etwas angebunden werden – Website, Buchhaltung, Shop, Kalender?', why: 'Anbindungen früh zu kennen verhindert teure Nachrüstungen.', chips: ['Website', 'Buchhaltung', 'Shop / Bestellungen', 'Kalender / E-Mail', 'Noch offen'], placeholder: 'z. B. Google Kalender + SEPA-Lastschrift' },
  { id: 'budget', short: 'Budget', label: 'Und zum Schluss: In welchem Rahmen bewegt sich Ihr Budget grob?', why: 'Der Rahmen hilft mir, Ihnen vorab schon eine realistische Größenordnung zu nennen.', chips: ['bis 3.000 €', '3.000–8.000 €', '8.000–20.000 €', 'Noch offen'], placeholder: 'gerne auch „weiß nicht“ – ich ordne das ein' },
];

const QUESTION_ORDER = BASE_QUESTIONS.map((q) => q.id);
const QUESTION_MAP: Record<string, ChatQuestion> = Object.fromEntries(BASE_QUESTIONS.map((q) => [q.id, q]));

/** Dynamische Nachfrage, je nachdem was die Antwort enthält */
function followUpFor(id: string, answer: string): ChatQuestion | null {
  const a = answer.toLowerCase();
  if (id === 'problem') {
    return { id: 'problem_detail', short: 'Ablauf heute', label: 'Spannend. Beschreiben Sie mir diesen Ablauf einmal von Anfang bis Ende – wie läuft er heute Schritt für Schritt?', why: 'Erst wenn ich den Ist-Zustand kenne, kann ich im Gespräch sagen, was sich automatisieren lässt – und was besser von Hand bleibt.', placeholder: 'z. B. Kunde ruft an → Notiz auf Zettel → Angebot in Word → PDF per Mail' };
  }
  if (id === 'tools' && a.includes('excel') && a.includes('papier')) {
    return { id: 'daten_quelle', short: 'Daten quelle', label: 'Excel UND Papier – wo ist die wichtigere Quelle, mit der wir starten?', why: 'Eine klare Hauptquelle verhindert zwei „Wahrheiten“ im System.', chips: ['Excel zuerst', 'Papier zuerst', 'Beides zusammenführen'], placeholder: 'z. B. Excel ist Master, Papier wird gescannt' };
  }
  if (id === 'tools' && a.includes('excel')) {
    return { id: 'excel_umfang', short: 'Excel-Umfang', label: 'Wie groß ist Ihre größte Excel-Datei ungefähr?', why: 'Der Umfang entscheidet über Migration oder Neuaufbau.', chips: ['Unter 100 Zeilen', '100–1.000 Zeilen', 'Über 1.000 Zeilen', 'Mehrere Dateien'], placeholder: 'gerne auch Dateinamen nennen' };
  }
  if (id === 'schnittstellen' && (a.includes('shop') || a.includes('website'))) {
    return { id: 'shop_plattform', short: 'Plattform', label: 'Auf welcher Plattform läuft Ihr Shop bzw. Ihre Website?', why: 'Für etablierte Plattformen gibt es fertige Schnittstellen – das spart Budget.', chips: ['WordPress / WooCommerce', 'Shopify', 'JTL / Gambio', 'Individuell'], placeholder: 'z. B. Shopify Plus' };
  }
  if (id === 'budget' && a.includes('noch offen')) {
    return { id: 'prioritaet', short: 'Priorität', label: 'Verstanden – was ist Ihnen dann am wichtigsten?', why: 'Ihre Priorität bestimmt den Fahrplan und die erste Ausbaustufe.', chips: ['Schnell & schlank starten', 'Von Anfang an skalierbar', 'Bestes Preis-Leistungs-Verhältnis', 'Erstmal Prototyp testen'], placeholder: 'eigenes Stichwort' };
  }
  if (id === 'ziel' && (a.includes('umsatz') || a.includes('verkauf'))) {
    return { id: 'umsatz_hebel', short: 'Umsatz-Hebel', label: 'Wo gehen heute die meisten Anfragen oder Aufträge verloren?', why: 'Genau hier liegt meist der schnellste Hebel für mehr Umsatz.', chips: ['Anfragen bleiben liegen', 'Nachfassen passiert nicht', 'Angebot zu langsam', 'Kein Follow-up'], placeholder: 'eigene Beobachtung' };
  }
  return null;
}

/** Reaktion des Beraters – geht inhaltlich auf die Antwort ein, wie im echten Gespräch */
function reactTo(id: string, answer: string, name: string): string {
  const a = answer.toLowerCase();
  const vorname = name.split(/\s+/)[0];
  const du = vorname ? `, ${vorname}` : '';
  switch (id) {
    case 'firma':
      if (a.includes('handwerk')) return `Handwerk${du} – da kenne ich die klassischen Baustellen: Angebote, Einsatzplanung, Nachträge. Genau da schauen wir hin.`;
      if (a.includes('handel') || a.includes('shop')) return 'Handel lebt von Geschwindigkeit – Bestellungen, Lagerstand und Kundenfragen müssen synchron laufen. Gute Ausgangslage für Automatik.';
      if (a.includes('dienstleistung')) return 'Dienstleistung steht und fällt mit der Pflege der Kundenbeziehung – genau da holen Automatiken am meisten heraus.';
      return 'Danke – jede Branche hat ihre typischen Engpässe, ich kenne die Muster und vergleiche Sie direkt damit.';
    case 'problem':
      if (a.includes('angebot')) return 'Angebote von Hand sind der Klassiker – und meist der Prozess mit der schnellsten Rendite, wenn er automatisiert ist.';
      if (a.includes('rechnung') || a.includes('buchhaltung')) return 'Rechnungs- und Buchhaltungswege lassen sich fast vollständig automatisieren – vom Erfassen bis zum Abgleich.';
      if (a.includes('auftrag')) return 'Die Auftragsabwicklung ist das Rückgrat – hier zahlt sich Struktur am stärksten aus.';
      if (a.includes('kommunikation') || a.includes('kunden')) return 'Kundenkommunikation ist Dankbarkeit pur für Automatik: Erinnerungen, Statusupdates, Nachfassen – zuverlässig, ohne Mehraufwand.';
      return 'Genau dort setzen wir an – der Prozess mit dem größten Schmerz bringt meist die schnellste Wirkung.';
    case 'ziel':
      if (a.includes('umsatz') || a.includes('verkauf')) return `Sehr gut${du} – Umsatz ist der Hebel mit der kürzesten Wirkung. Genau da schaue ich im Gespräch zuerst hin.`;
      if (a.includes('fehler')) return 'Fehlerquellen zu eliminieren bringt oft mehr als jede neue Funktion – guter Ansatz.';
      if (a.includes('zeit')) return 'Zeit ist das, was am Ende jeder zurückgewinnen will – mal sehen, wo bei Ihnen die Minuten liegen.';
      return 'Klingt nach einem klaren Ziel – genau so lässt sich ein Projekt sauber aufsetzen.';
    case 'nutzer':
      if (a.includes('nur ich')) return 'Dann halten wir es schlank: kein Ballast, nur genau das, was Ihnen den Tag erleichtert.';
      if (a.includes('kunden')) return 'Noch interessanter – dann denken wir Bedienung und Optik von Anfang an mit.';
      return 'Gut zu wissen. Bei mehreren Nutzern plane ich Rollen und Freigaben direkt mit – das später einzubauen ist teuer.';
    case 'tools':
      if (a.includes('excel')) return 'Excel-Chaos kenne ich zur Genüge – genau da versteckt sich meist der größte Zeitfresser.';
      if (a.includes('papier')) return 'Papier lässt sich erstaunlich gut digitalisieren – das holen wir direkt mit.';
      if (a.includes('crm') || a.includes('warenwirtschaft')) return 'Gut, ein bestehendes System können wir anbinden, statt alles neu zu bauen.';
      return 'Perfekt, damit habe ich ein gutes Bild von Ihren heutigen Werkzeugen.';
    case 'daten':
      if (a.includes('köpf') || a.includes('kopf')) return 'In mehreren Köpfen – klassisch! Genau dafür machen wir im Erstgespräch eine kleine Struktur.';
      return 'Notiert. Die Datenlage entscheidet, wie schnell wir einen ersten Prototyp bauen können.';
    case 'schnittstellen':
      if (a.includes('noch offen')) return 'Kein Problem – wenn es sich anbietet, klären wir das gemeinsam im Termin.';
      return 'Alles klar. Anbindungen baue ich so, dass sie später erweiterbar bleiben.';
    case 'budget':
      if (a.includes('noch offen')) return `Völlig okay${du} – wir finden den Rahmen, der zu Ihrem Projekt passt.`;
      return 'Danke, das hilft mir sehr bei der ersten Größenordnung.';
    default:
      if (id === 'problem_detail') return 'Danke – dieser Ist-Zustand ist Gold wert: Im Gespräch gehen wir ihn Schritt für Schritt durch und markieren jeden Punkt, der ohne menschliches Zutun laufen kann.';
      if (id === 'daten_quelle') return 'Gut – eine klare Hauptquelle macht den Start deutlich einfacher.';
      if (id === 'excel_umfang') return 'Danke – daran sehe ich, ob Migration oder Neuaufbau sinnvoller ist.';
      if (id === 'shop_plattform') return 'Perfekt, die Plattform kenne ich – da gibt es bewährte Wege.';
      if (id === 'prioritaet') return 'Sehr gut, das ist genau die richtige Priorität.';
      if (id === 'umsatz_hebel') return 'Ein klassischer Leck-Standort – da holen wir meist am schnellsten etwas zurück.';
      return vorname ? `Danke, ${vorname} – sehr hilfreich!` : 'Sehr hilfreich, danke!';
  }
}

const STATIONS: Record<string, string> = {
  firma: 'Ihre Firma', ziel: 'Ihr Ziel', problem: 'Ihr Kernproblem', problem_detail: 'Ihr Ablauf heute',
  nutzer: 'Ihr Team', tools: 'Ihre Tools', daten: 'Ihre Daten', schnittstellen: 'Anbindungen', budget: 'Ihr Rahmen',
};

/** Tiefere Einordnung aus der Praxis – der Berater gibt Wissen weiter, statt nur abzuhaken */
function insightFor(id: string, answer: string): string {
  const a = answer.toLowerCase();
  switch (id) {
    case 'firma':
      if (a.includes('handwerk')) return 'Typisch im Handwerk: Angebote und Nachträge entstehen abends auf dem Sofa, Auftragsdaten liegen verteilt. Projekte dort starten meist mit digitalem Angebot + Einsatzplan – erste Entlastung oft schon nach 2–3 Wochen.';
      if (a.includes('handel') || a.includes('shop')) return 'Im Handel entscheidet Durchlaufgeschwindigkeit: Bestellung → Lager → Versand → Rechnung. Automatisiert verkürzt das die Durchlaufzeit oft um Tage – und reduziert Fehllieferungen spürbar.';
      if (a.includes('dienstleistung')) return 'Dienstleister verlieren am meisten Zeit mit Statusfragen und Nachfassen. Standardisierte Updates und automatisches Nachfassen entlasten das Team meist zuerst – bevor irgendetwas anderes optimiert wird.';
      return 'Branchenmuster helfen enorm: Ich vergleiche Ihre Ausgangslage mit vergleichbaren Projekten – so wissen wir vorab schon, welche Hebel typischerweise am schnellsten greifen.';
    case 'problem':
      if (a.includes('angebot')) return 'Aus Projekten: Ein Angebotsautomat mit Vorlagen und Positionsbausteinen senkt den Aufwand pro Angebot typischerweise von 30–60 Minuten auf unter 5 – bei besserer Optik, weil jede Vorlage einmal sauber gebaut wird.';
      if (a.includes('rechnung') || a.includes('buchhaltung')) return 'Rechnungsläufe sind dankbar: Aus Auftragsdaten automatisch erzeugen, versenden, Mahnwesen halbautomatisch. Das sind oft 5–10 Stunden im Monat, die zurückkommen.';
      if (a.includes('auftrag')) return 'Die Auftragsabwicklung gewinnt doppelt: weniger Fehler bei Übergaben – und jeder im Team sieht den Stand. Wir prüfen im Gespräch, welche Schritte sich künftig von selbst erledigen.';
      if (a.includes('kommunikation') || a.includes('kunden')) return 'Der Großteil der Kundenkommunikation ist wiederkehrend: Terminerinnerungen, Statusupdates, Nachfassen. Genau diese Wiederholungen automatisieren wir zuerst – persönlich bleiben die echten Gespräche.';
      return 'Der Prozess mit dem größten Schmerz ist immer der richtige Startpunkt: schnelle Wirkung überzeugt das Team – und alle weiteren Schritte wachsen darauf auf.';
    case 'ziel':
      if (a.includes('umsatz') || a.includes('verkauf')) return 'Aus der Praxis: Die meisten Umsatzverluste entstehen nicht im Erstkontakt, sondern im Nachfassen – Anfragen, die nach 48 Stunden nicht bearbeitet sind, konvertieren etwa halb so gut. Eine einfache Erinnerungs- und Angebotsautomatik greift hier oft schneller als jede neue Kampagne.';
      if (a.includes('fehler')) return 'Erfahrungswert: Rund 70 % der wiederkehrenden Fehler passieren an Übergaben – wenn Daten von Hand aus E-Mails abgetippt oder zwischen Systemen hin- und herkopiert werden. Genau diese Übergaben kartographieren wir im Erstgespräch.';
      if (a.includes('zeit')) return 'Kleine Faustregel aus Projekten: Wer täglich 30 Minuten mit Suchen, Doppeleingaben oder Formatieren verbringt, verliert im Jahr über 100 Arbeitsstunden. Wir suchen im Gespräch die drei größten Zeitfresser und starten mit dem größten.';
      return 'Wichtig ist, das Ziel messbar zu machen: nicht „mehr Effizienz“, sondern z. B. „Angebot in 2 Stunden statt 2 Tagen“. Im Erstgespräch legen wir genau so eine Kennzahl fest – daran erkennen wir nach 4 Wochen, ob es wirkt.';
    case 'nutzer':
      if (a.includes('nur ich')) return 'Für Ein-Personen-Lösungen gilt: so wenige Klicks wie möglich. Statt Rollenkonzept bauen wir Vorlagen, Schnellzugriffe und Automatiken, die Ihnen täglich Minuten sparen – erweiterbar bleibt es trotzdem.';
      if (a.includes('kunden')) return 'Wenn Kundinnen und Kunden selbst arbeiten, entscheiden zwei Dinge über Annahme oder Ablehnung: Verständlichkeit in 10 Sekunden und Vertrauen (DSGVO, Impressum, sauberes Design). Beides planen wir von Anfang an ein – Nachrüsten ist teurer.';
      return 'Faustregel: Ab ca. 3 Nutzern lohnt sich ein Rollenkonzept (wer darf sehen, wer darf ändern) plus eine kurze Einweisung. Ich plane beides von Anfang an mit – später einzubauen kostet meist das Doppelte.';
    case 'tools':
      if (a.includes('excel')) return 'Excel ist der meist unterschätzte Zeitfresser: Versions-Chaos per E-Mail, Formeln, die nur eine Person versteht, und keine Historie. Typischer Weg: Die Struktur der Tabelle wandert in eine kleine Datenbank – Ihre gewohnte Ansicht bleibt, aber mehrere Personen können gleichzeitig sicher arbeiten.';
      if (a.includes('papier')) return 'Papier lässt sich mit moderner Erfassung (Scan, Foto, Formular) fast vollständig ersetzen. Wichtig ist die Reihenfolge: erst Struktur, dann Digitalisierung, dann Automatik – sonst archiviert man nur Chaos.';
      if (a.includes('crm') || a.includes('warenwirtschaft')) return 'Bestehende Systeme sind ein Vorteil, kein Hindernis: Über Schnittstellen (APIs) holen wir Daten dort ab, wo sie entstehen. So vermeiden wir Doppeleingaben, ohne Ihr etabliertes System zu ersetzen.';
      return 'Gut zu wissen – die Tool-Landschaft bestimmt, wie viel wir anbinden und wie viel wir neu bauen. Je weniger Werkzeugwechsel im Alltag, desto höher die Akzeptanz im Team.';
    case 'daten':
      if (a.includes('köpf') || a.includes('kopf')) return 'Wissen, das nur in Köpfen liegt, ist das größte Risiko im Unternehmen – bei Urlaub, Krankheit oder Wechsel steht der Prozess still. Im Erstgespräch machen wir daraus in 20 Minuten eine einfache Struktur: Welche Information braucht welcher Schritt?';
      if (a.includes('papier')) return 'Gute Nachricht: Papierbestände lassen sich schrittweise digitalisieren – wir starten mit dem, was täglich neu anfällt, und arbeiten den Altbestand bei Bedarf nach.';
      return 'Die Datenlage bestimmt das Tempo: Saubere, strukturierte Daten bedeuten oft in 2–3 Wochen einen ersten Prototyp. Bei verteilten oder unstrukturierten Daten planen wir vorher eine kleine Bereinigungsphase ein.';
    case 'schnittstellen':
      if (a.includes('noch offen')) return 'Vorsicht aus Erfahrung: Was heute „keine Schnittstelle“ ist, ist in 6 Monaten oft der Engpass. Deshalb baue ich alles API-first – jede spätere Erweiterung wird dann zur Kleinigkeit statt zum Umbau.';
      return 'Anbindungen setze ich API-first um: direkte, dokumentierte Verbindungen statt verketteter Klick-Dienste. Das kostet im Aufbau kaum mehr, ist aber langfristig stabiler und günstiger.';
    case 'budget':
      if (a.includes('noch offen')) return 'Zur Einordnung: Einfache Einzelautomatisierungen (ein Prozess, 1–2 Anbindungen) bewegen sich meist im niedrigen vierstelligen Bereich, komplexere Lösungen mit Datenmigration entsprechend darüber. Im Erstgespräch nenne ich Ihnen eine konkrete Spanne für Ihren Fall – verbindlich als Festpreis.';
      return 'Hilfreich zur Einordnung: Der Preis wird vor allem von drei Faktoren bestimmt – Anzahl der Prozesse, Anzahl der Anbindungen und Aufwand der Datenmigration. Ihren Festpreis lege ich nach dem Erstgespräch genau auf dieser Basis fest.';
    default:
      if (id === 'problem_detail') return 'So ein Ist-Ablauf ist Gold wert: Im Gespräch gehen wir ihn Schritt für Schritt durch und markieren jeden Punkt, der künftig ohne menschliches Zutun laufen kann. Genau daraus entsteht Ihr Festpreis-Angebot.';
      if (id === 'daten_quelle') return 'Ein „Master“ als Hauptquelle ist der wichtigste Schritt zu einer sauberen Datenbasis: Alles andere wird Import oder Ergänzung, nie eine zweite Wahrheit. Genau so vermeiden wir widersprüchliche Einträge.';
      if (id === 'excel_umfang') return 'Zur Einordnung: Bis ca. 1.000 Zeilen ist eine Migration fast immer Nebensache. Darüber lohnt sich ein Blick auf Struktur und Redundanzen – oft schrumpft die Tabelle im neuen System auf das Wesentliche.';
      if (id === 'shop_plattform') return 'Für etablierte Plattformen wie Shopify oder WooCommerce gibt es fertige, gepflegte Schnittstellen – das verkürzt die Umsetzung deutlich und senkt den Preis. Bei Individual-Lösungen plane ich eine eigene Anbindung ein.';
      if (id === 'prioritaet') return 'Ihre Priorität bestimmt den Fahrplan: „Schnell starten“ heißt meist ein Prozess zuerst – dafür in 2–3 Wochen live. Alles Weitere wächst dann mit, ohne Umbau, nur mit Erweiterung.';
      if (id === 'umsatz_hebel') return 'Aus vielen Projekten: Nachfassen und schnelle Angebote sind die zwei Hebel mit dem kürzesten Weg zu mehr Umsatz – beide lassen sich zuverlässig automatisieren, ohne dass das Team sein Verhalten ändert.';
      return 'Notiert – diese Einordnung fließt direkt in die Vorbereitung Ihres Erstgesprächs ein.';
  }
}

/** Persönliches Fazit: konkrete Ableitungen aus den Antworten, keine Floskeln */
function buildFazit(a: Record<string, string>): string[] {
  const out: string[] = [];
  if (a.firma) out.push(`Ihre Ausgangslage („${a.firma}“) – ich vergleiche sie vorab mit Projekten aus Ihrer Branche.`);
  if (a.ziel) out.push(`Ihr Ziel im Fokus: „${a.ziel}“ – daran messen wir den Erfolg.`);
  if (a.problem) out.push(`Kernproblem: „${a.problem}“ – genau mit diesem Prozess starten wir im Gespräch.`);
  if (a.problem_detail) out.push('Ihr heutiger Ablauf liegt dem Berater vor – wir prüfen Schritt für Schritt, was künftig von selbst läuft.');
  if (a.nutzer) out.push(/nur ich/i.test(a.nutzer)
    ? 'Rollout: schlank und persönlich – Vorlagen und Schnellzugriffe statt Rollenverwaltung.'
    : `Rollout: Rollen und Freigaben für ${a.nutzer} sind von Anfang an eingeplant.`);
  if (a.tools) out.push(/excel/i.test(a.tools)
    ? 'Startpunkt: Ihre Excel-Struktur wird in eine saubere Datenbank überführt – gewohnte Ansicht, sicheres Arbeiten mit mehreren Personen.'
    : /papier/i.test(a.tools)
      ? 'Startpunkt: Wir digitalisieren zuerst die Papierprozesse, die täglich neu anfallen.'
      : 'Startpunkt: Wir bauen auf Ihren bestehenden Systemen auf und binden sie an, statt alles neu zu erfinden.');
  if (a.daten) out.push(`Datenlage („${a.daten}“) bestimmt das Tempo des ersten Prototyps – die nötige Bereinigung plane ich passend ein.`);
  if (a.schnittstellen && !/noch offen/i.test(a.schnittstellen)) out.push(`Anbindungen (${a.schnittstellen}) kommen API-first – erweiterbar, ohne späteren Umbau.`);
  if (a.budget) out.push(/noch offen/i.test(a.budget)
    ? 'Budget: Wir finden den Rahmen im Gespräch – Sie erhalten einen verbindlichen Festpreis, keine offene Abrechnung.'
    : `Rahmen „${a.budget}“: Ich bereite Ihnen vor dem Termin eine konkrete Größenordnung vor.`);
  return out;
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
  const [reactions, setReactions] = useState<string[]>([]); // Bot-Reaktionszeilen je Frage (Index = Position in askedQs)
  const [insights, setInsights] = useState<string[]>([]); // Wissens-Karten je Antwort (gleiche Reihenfolge)
  const [stage, setStage] = useState<'question' | 'reacting' | 'asking'>('question'); // Gesprächs-Phase
  const busyRef = useRef(false);
  const [chatDraft, setChatDraft] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const [briefingSent, setBriefingSent] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const appointmentFull = day && time ? fmtFull(day, time) : '';
  const nextBase = QUESTION_ORDER.find((id) => !answers[id]);
  const lastQ = askedQs[askedQs.length - 1];
  const pendingQ: ChatQuestion | null = followUpFor(lastQ?.id ?? '', answers[lastQ?.id ?? ''] ?? '')
    ?? (nextBase ? QUESTION_MAP[nextBase] : null);
  const input = 'w-full px-4 py-3 rounded-xl bg-white/[0.05] border border-white/12 text-white placeholder-white/35 font-arimo text-sm focus:outline-none focus:border-[#DEFF9A]';

  useEffect(() => {
    if (step === 2 && chatStarted) {
      chatEndRef.current?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
      if (stage === 'question') chatInputRef.current?.focus();
    }
  }, [askedQs, stage, chatStarted, step, reduce]);

  // Übersicht automatisch einblenden, sobald die Analyse abgeschlossen ist
  useEffect(() => {
    if (step === 2 && chatStarted && stage === 'question' && !pendingQ) setShowProfile(true);
  }, [step, chatStarted, stage, pendingQ]);

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

  const wait = (ms: number) => new Promise<void>((res) => window.setTimeout(res, ms));

  /** Ein echter Gesprächszug: Antwort → Reaktion des Beraters → kurze Pause → nächste Frage */
  const answerCurrent = async (value: string) => {
    if (!pendingQ || !value.trim() || busyRef.current) return;
    const q = pendingQ;
    const v = value.trim();
    busyRef.current = true;
    recordAnswer(q.id, v);
    setChatDraft('');
    setAskedQs((prev) => (prev[prev.length - 1]?.id === q.id ? prev : [...prev, q]));
    const follow = followUpFor(q.id, v);
    const nb = QUESTION_ORDER.find((id) => !answers[id] && id !== q.id);
    setStage('reacting');
    if (!reduce) await wait(700 + Math.random() * 450);
    setReactions((r) => [...r, reactTo(q.id, v, form.name.trim())]);
    if (!reduce) await wait(500 + Math.random() * 350);
    setInsights((r) => [...r, insightFor(q.id, v)]);
    if (follow || nb) {
      if (!reduce) await wait(450 + Math.random() * 350);
      setStage('asking');
      if (!reduce) await wait(600 + Math.random() * 400);
    }
    setStage('question');
    busyRef.current = false;
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
  const fazit = buildFazit(answers);

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
            : `Ihre Terminbestätigung geht in Kürze an ${form.email.trim()} – innerhalb von 24 Stunden hören Sie von uns, mit einem kurzen Fragebogen (2 Minuten vor dem Termin ausfüllen genügt).`}
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Fortschritt */}
      <div className="flex items-center gap-2 mb-6" aria-hidden="true">
        {['Termin', 'Kontakt', 'Analyse'].map((label, k) => {
          const active = (k === 2 && chatStarted) || k === step;
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <span className="h-1.5 flex-1 rounded-full transition-all duration-500" style={{ background: active ? `linear-gradient(90deg, ${SKY}, ${LIME})` : 'rgba(255,255,255,0.1)' }} />
              <span className={`hidden sm:block font-arimo text-[10px] font-bold uppercase tracking-wide whitespace-nowrap ${active ? 'text-[#DEFF9A]' : 'text-white/35'}`}>{label}</span>
            </div>
          );
        })}
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
              <p className="font-arimo text-[15px] text-white/75 leading-relaxed">Wählen Sie Datum und Uhrzeit – Ihr Wunschtermin für das kostenlose Erstgespräch (30 Min., online). Wir bestätigen Ihnen den Termin innerhalb von 24 Stunden per E-Mail.</p>
              <div>
                <p className="font-arimo text-[11px] font-bold uppercase tracking-wide text-white/60 mb-2 flex items-center gap-1.5"><CalendarCheck className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />Datum</p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {days.map((d, i) => {
                    const sel = day?.toDateString() === d.toDateString();
                    const tag = i === 0 ? 'Morgen' : d.toLocaleDateString('de-DE', { weekday: 'short' });
                    return (
                      <button key={d.toISOString()} type="button" aria-pressed={sel}
                        onClick={() => { setDay(sel ? null : d); setCustomDate(false); }}
                        className={`group rounded-xl border px-2 py-2.5 text-center transition b2b-focus-ring hover:-translate-y-0.5 ${sel ? 'border-[#DEFF9A] bg-[#DEFF9A]/15 shadow-lg shadow-[#DEFF9A]/15' : 'border-white/25 bg-white/[0.08] hover:border-white/50'}`}>
                        <span className={`block font-arimo text-[10px] font-bold uppercase tracking-wide ${sel ? 'text-[#DEFF9A]' : i === 0 ? 'text-[#38BDF8]' : 'text-white/60'}`}>{tag}</span>
                        <span className={`block font-poppins font-black text-lg leading-tight ${sel ? 'text-[#DEFF9A]' : 'text-white group-hover:text-white'}`}>{d.getDate()}.</span>
                        <span className={`block font-arimo text-[10px] font-bold ${sel ? 'text-[#DEFF9A]/90' : 'text-white/60'}`}>{d.toLocaleDateString('de-DE', { month: 'short' })}</span>
                      </button>
                    );
                  })}
                </div>
                <button type="button" aria-pressed={customDate}
                  onClick={() => { setCustomDate(!customDate); if (!customDate) setDay(null); }}
                  className={`mt-1 inline-flex items-center gap-1.5 font-arimo text-xs font-bold transition b2b-focus-ring rounded underline underline-offset-4 decoration-white/20 hover:decoration-[#DEFF9A]/60 ${customDate ? 'text-[#DEFF9A]' : 'text-white/50 hover:text-[#DEFF9A]'}`}>
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
                <div className="grid gap-2">
                  {[
                    { label: 'Vormittag', icon: Sunrise, slots: TIMES.filter((t) => Number(t.slice(0, 2)) < 12) },
                    { label: 'Nachmittag', icon: Sun, slots: TIMES.filter((t) => Number(t.slice(0, 2)) >= 12) },
                  ].map(({ label, icon: Icon, slots }) => (
                    <div key={label}>
                      <p className="font-arimo text-[10px] font-bold uppercase tracking-wide text-white/70 mb-1.5 flex items-center gap-1.5"><Icon className="w-3.5 h-3.5 text-[#DEFF9A]" aria-hidden="true" />{label}</p>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                        {slots.map((t) => {
                          const sel = time === t;
                          return (
                            <button key={t} type="button" aria-pressed={sel}
                              onClick={() => { setTime(sel ? '' : t); setCustomTime(false); }}
                              className={`rounded-xl border px-2 py-2.5 text-center transition b2b-focus-ring hover:-translate-y-0.5 ${sel ? 'border-[#DEFF9A] bg-[#DEFF9A]/15 shadow-lg shadow-[#DEFF9A]/15' : 'border-white/25 bg-white/[0.08] hover:border-white/50'}`}
                              style={!sel ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)' } : undefined}>
                              <span className={`block font-poppins font-black text-sm leading-tight ${sel ? 'text-[#DEFF9A]' : 'text-white'}`}>{t}</span>
                              <span className={`block font-arimo text-[10px] font-bold ${sel ? 'text-[#DEFF9A]/90' : 'text-white/60'}`}>Uhr</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                <button type="button" aria-pressed={customTime}
                  onClick={() => { setCustomTime(!customTime); if (!customTime) setTime(''); }}
                  className={`mt-2 inline-flex items-center gap-1.5 font-arimo text-xs font-bold transition b2b-focus-ring rounded underline underline-offset-4 decoration-white/20 hover:decoration-[#DEFF9A]/60 ${customTime ? 'text-[#DEFF9A]' : 'text-white/50 hover:text-[#DEFF9A]'}`}>
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
                  <p className="mt-1 font-arimo text-[11px] text-white/50">30 Minuten, kostenlos & online – Bestätigung innerhalb von 24 Stunden per E-Mail.</p>
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
              <p className="font-arimo text-[11px] text-white/40 text-center">Ihre Kontaktdaten werden sofort übermittelt – auch wenn Sie den Chat abbrechen. <a href="/datenschutz" className="underline hover:text-white/70">Datenschutz</a></p>
            </form>
          )}

          {/* ── Schritt 3: KI-Berater-Chat ── */}
          {step === 2 && chatStarted && (
            <>
            <div className="rounded-3xl bg-white/[0.04] border border-white/10 overflow-hidden shadow-2xl shadow-black/40">
              {/* Live-Profil (einklappbar) */}
              {showProfile && (
              <div className="px-4 sm:px-5 pt-4 bg-white/[0.02] border-b border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-arimo text-[11px] font-bold uppercase tracking-wide text-[#DEFF9A] flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" aria-hidden="true" />Ihr Profil</p>
                  <span className="font-poppins font-black text-xs px-2 py-0.5 rounded-full bg-[#DEFF9A]/10 text-[#DEFF9A] border border-[#DEFF9A]/30">{answeredCount}/{QUESTION_ORDER.length}</span>
                </div>
                {/* Fortschrittsbalken */}
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden mb-4" role="progressbar" aria-valuemin={0} aria-valuemax={QUESTION_ORDER.length} aria-valuenow={answeredCount}>
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(answeredCount / QUESTION_ORDER.length) * 100}%`, background: `linear-gradient(90deg, ${SKY}, ${LIME})` }} />
                </div>
                <dl className="grid sm:grid-cols-2 gap-x-5 gap-y-2.5">
                  {QUESTION_ORDER.map((id) => {
                    const q = QUESTION_MAP[id];
                    const v = answers[id];
                    return (
                      <div key={id} className={v ? '' : 'opacity-60'}>
                        <dt className="font-arimo text-[11px] font-bold uppercase tracking-wide text-white/55 flex items-center gap-1.5">
                          {v && <Check className="w-3 h-3 text-[#DEFF9A] flex-shrink-0" aria-hidden="true" />}{q.short}
                        </dt>
                        <dd className={`font-arimo text-sm leading-snug ${v ? 'text-white' : 'text-white/25 italic'}`}>{v ?? 'offen …'}</dd>
                      </div>
                    );
                  })}
                </dl>
                <div className="mt-3 mb-4 rounded-xl px-3 py-2.5 bg-[#DEFF9A]/[0.07] border border-[#DEFF9A]/25">
                  <p className="font-arimo text-[11px] text-[#DEFF9A] font-bold flex items-center gap-1.5"><Check className="w-3.5 h-3.5" aria-hidden="true" />Termin fix</p>
                  <p className="font-arimo text-[11px] text-white/70 leading-snug">{appointmentFull}</p>
                </div>
                {answeredCount > 0 && (
                  <p className="mb-4 font-arimo text-[10px] text-white/35 leading-snug">Jede Antwort wird direkt übertragen – auch bei Abbruch haben wir Ihre Angaben.</p>
                )}
              </div>
              )}

              {/* Chat-Kopfzeile */}
              <div className="flex items-center gap-3 px-4 sm:px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
                <AdvisorAvatar />
                <div className="flex-1 min-w-0">
                  <p className="font-poppins font-bold text-sm text-white leading-tight">DYD KI-Berater</p>
                  <p className="font-arimo text-[11px] text-white/65 truncate">{pendingQ ? `Station ${Math.min(QUESTION_ORDER.filter((id) => answers[id]).length + 1, QUESTION_ORDER.length)} von ${QUESTION_ORDER.length} · ${STATIONS[pendingQ.id] ?? 'Analyse'}` : 'Analyse abgeschlossen · Ihr Fazit'}</p>
                </div>
                <button type="button" onClick={() => setShowProfile((s) => !s)} aria-expanded={showProfile}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-arimo text-[11px] font-bold border transition b2b-focus-ring ${showProfile ? 'border-[#DEFF9A]/40 bg-[#DEFF9A]/10 text-[#DEFF9A]' : 'border-white/12 text-white/60 hover:text-white hover:border-white/30'}`}>
                  Übersicht <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showProfile ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
              </div>
              <div className="p-4 sm:p-5 max-h-[46vh] min-h-[300px] overflow-y-auto space-y-3.5 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.07),transparent_60%)]">
                    {/* Begrüßung, personalisiert */}
                    <BotBubble>
                      {form.name.trim() ? `Hi ${form.name.trim()}` : 'Herzlich willkommen'}{form.company.trim() ? ` von ${form.company.trim()}` : ''}! Ihr Termin am <span className="font-bold">{appointmentFull}</span> ist fix. Ich bereite Ihr Gespräch vor – dauert nur ~2 Minuten.
                      <p className="mt-2 font-bold text-[#DEFF9A]">Ich führe Sie in kurzen Stationen durch Ihr Profil – von Ihrer Firma bis zum Budget – und gebe Ihnen unterwegs Einordnungen aus der Praxis mit. Los geht's:</p>
                    </BotBubble>

                    {askedQs.map((q, k) => (
                      <div key={q.id} className="space-y-2">
                        <BotBubble>{q.label}</BotBubble>
                        <UserBubble name={form.name}>{answers[q.id]}</UserBubble>
                        {reactions[k] && <BotBubble>{reactions[k]}</BotBubble>}
                        {insights[k] && <InsightBubble>{insights[k]}</InsightBubble>}
                      </div>
                    ))}

                    {/* Aktuelle Frage als echte Chat-Nachricht */}
                    {stage === 'question' && pendingQ && (
                      <BotBubble>
                        {pendingQ.label}
                        {pendingQ.why && <span className="block mt-1.5 font-arimo text-[13px] italic text-white/60 leading-relaxed">Warum ich das frage: {pendingQ.why}</span>}
                      </BotBubble>
                    )}

                    {stage !== 'question' && (
                      <BotBubble>
                        <span className="flex gap-1" aria-label="Berater schreibt">
                          {[0, 1, 2].map((d) => <span key={d} className="w-1.5 h-1.5 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: `${d * 150}ms` }} />)}
                        </span>
                      </BotBubble>
                    )}

                    {/* Abschluss mit persönlichem Fazit */}
                    {stage === 'question' && !pendingQ && (fazit.length > 0 ? (
                      <>
                        <BotBubble>
                          Das war's schon – <span className="font-bold">{answeredCount} Punkte erfasst</span>! Bevor wir abschließen, fasse ich zusammen, was ich aus Ihrer Analyse mitnehme:
                        </BotBubble>
                        <FazitCard items={fazit} name={form.name.trim()} appointment={appointmentFull} />
                      </>
                    ) : (
                      <BotBubble>
                        Kein Problem – auch ohne viele Antworten ist Ihr Termin am <span className="font-bold">{appointmentFull}</span> gesichert. Wir starten im Gespräch einfach direkt mit dem Wichtigsten.
                      </BotBubble>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Eingabeleiste unten, wie im Messenger */}
                  <div className="border-t border-white/10 bg-[#0A192F]/70 backdrop-blur px-4 sm:px-5 py-3.5 space-y-2.5">
                    {stage === 'question' && pendingQ ? (
                      <>
                        <p className="font-arimo text-[11px] font-bold uppercase tracking-wide text-[#DEFF9A]/90">{STATIONS[pendingQ.id] ?? 'Analyse'} – Ihre Antwort</p>
                        {pendingQ.chips && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {pendingQ.chips.map((chip) => (
                              <button key={chip} type="button" onClick={() => answerCurrent(chip)}
                                className="px-3.5 py-2.5 rounded-full font-arimo text-sm font-bold border border-white/30 bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] hover:text-[#0A192F] hover:bg-[#DEFF9A] hover:border-[#DEFF9A] transition b2b-focus-ring">
                                {chip}
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="flex items-center gap-2 rounded-2xl bg-white/[0.06] border border-white/12 focus-within:border-[#DEFF9A]/60 transition pl-4 pr-1.5 py-1.5">
                          <input ref={chatInputRef} className="flex-1 min-w-0 bg-transparent border-0 outline-none py-2 text-white placeholder-white/60 font-arimo text-[15px]" placeholder={pendingQ.placeholder ?? 'Ihre Antwort …'} value={chatDraft} onChange={(e) => setChatDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); answerCurrent(chatDraft); } }}
                            aria-label={pendingQ.label} />
                          <button type="button" onClick={() => answerCurrent(chatDraft)}
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 b2b-focus-ring transition hover:scale-105" style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }} aria-label="Antwort senden">
                            <Send className="w-4 h-4 text-[#0A192F]" aria-hidden="true" />
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="font-arimo text-sm text-white/60 text-center py-2 flex items-center justify-center gap-2">
                        {stage === 'question' && !pendingQ ? (
                          <><CheckCircle2 className="w-4 h-4 text-[#DEFF9A]" aria-hidden="true" />Analyse abgeschlossen – Sie können jetzt absenden.</>
                        ) : (
                          <><Loader2 className="w-4 h-4 animate-spin text-[#DEFF9A]" aria-hidden="true" />Der Berater liest Ihre Antwort …</>
                        )}
                      </p>
                    )}
                  </div>
            </div>

            {error && <p className="font-arimo text-sm text-red-400">{error}</p>}
            <button type="button" onClick={finishChat} disabled={status === 'saving'}
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#DEFF9A]/20 disabled:opacity-60"
              style={{ background: `linear-gradient(135deg, ${LIME}, ${SKY})` }}>
              {status === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="w-4 h-4" aria-hidden="true" />}
              {pendingQ || stage !== 'question' ? 'Fertigstellen – was ich habe, reicht' : 'Absenden & Termin sichern'}
            </button>
            <p className="font-arimo text-[11px] text-white/40 text-center">Sie können jederzeit abbrechen – Ihre bisherigen Antworten sind bereits gesichert.</p>
            </>
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
          <p className="font-arimo text-[13px] text-white/60 mb-5">1 Termin fixieren · 2 Kontakt (wird sofort gesichert) · 3 KI-Berater-Analyse – kostenlos, unverbindlich.</p>

          <ProzessCheckFlow presetArea={presetArea} presetDetails={presetDetails} />
        </div>
      </motion.div>
    </motion.div>
  );
}
