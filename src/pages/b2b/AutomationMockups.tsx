// src/pages/b2b/AutomationMockups.tsx
//
// Nachgebaute Produktansichten der drei Automatisierungs-Referenzen.
// WICHTIG: ausschließlich ERFUNDENE Beispieldaten – keine Screenshots, keine
// echten Kunden-, Konto- oder Firmendaten. Rein dekorativ (aria-hidden),
// die Inhalte stehen zusätzlich als Text in der Fallstudie daneben.

import {
  Mic, CalendarDays, CheckCircle2, Sparkles, LayoutGrid, Users, Sun, Phone, Mail,
  ShieldCheck, LineChart, ScrollText, Settings2, Clock, ArrowUpRight, Bell,
  Ticket, CreditCard, FileDown, Trophy, Timer, Plus,
} from 'lucide-react';

function Frame({ url, label, dark = false, children }: { url: string; label: string; dark?: boolean; children: React.ReactNode }) {
  return (
    <div
      role="img"
      aria-label={label}
      className={`rounded-2xl overflow-hidden border ${dark ? 'border-white/10 bg-[#0b1726]' : 'border-[#E3EBF5] bg-white'}`}
      style={{ boxShadow: '0 30px 60px -30px rgba(10,25,47,0.45)' }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0A192F]" aria-hidden="true">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex-1 max-w-xs px-3 py-1 rounded-md bg-white/10 text-[10px] text-white/50 font-arimo truncate">{url}</div>
      </div>
      <div aria-hidden="true" className="select-none">{children}</div>
    </div>
  );
}

/* ─── 1 · Podcast-Produktionsstudio ─────────────────────────────────────── */
export function PodcastStudioMockup() {
  const columns = [
    { title: 'Idee', tone: '#94a3b8', cards: [{ t: 'Quereinstieg mit 40+', tag: 'Gast offen' }, { t: 'Gehalt richtig verhandeln', tag: 'Recherche' }] },
    { title: 'Vorbereitung', tone: '#38BDF8', cards: [{ t: 'Folge 18 · Erste 100 Tage', tag: 'KI-Leitfaden', ai: true }] },
    { title: 'Prüfung', tone: '#f59e0b', cards: [{ t: 'Folge 17 · Bewerbung 2026', tag: '3/4 Checks' }] },
    { title: 'Geplant', tone: '#22c55e', cards: [{ t: 'Folge 16 · Netzwerken', tag: 'Di, 09:00' }] },
  ];
  return (
    <Frame url="studio.beispiel-podcast.de/episoden" label="Nachgebaute Ansicht: Podcast-Produktionsstudio mit Episoden-Board">
      <div className="flex h-[300px] sm:h-[340px] text-left">
        <aside className="hidden sm:flex flex-col gap-1 w-36 p-3 bg-[#06384f] text-white/70">
          <div className="flex items-center gap-1.5 px-1.5 mb-3 font-poppins font-black text-[13px] text-white"><Mic className="w-3.5 h-3.5 text-[#7dd3c0]" /> Studio</div>
          {[{ I: LayoutGrid, l: 'Episoden', a: true }, { I: Sparkles, l: 'Vorbereitung' }, { I: CheckCircle2, l: 'Prüfung' }, { I: CalendarDays, l: 'Kalender' }].map(({ I, l, a }) => (
            <div key={l} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-arimo font-semibold ${a ? 'bg-white/15 text-white' : ''}`}><I className="w-3.5 h-3.5" />{l}</div>
          ))}
        </aside>
        <div className="flex-1 p-3 sm:p-4 bg-[#F4F8FA] overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <p className="font-poppins font-bold text-[13px] text-[#0F1E34]">Episoden-Board</p>
            <span className="px-2 py-0.5 rounded-full bg-[#06384f] text-white text-[9px] font-arimo font-bold">+ Neue Episode</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {columns.map((c) => (
              <div key={c.title} className="rounded-xl bg-white/70 border border-[#E3EBF5] p-2 min-h-[110px]">
                <div className="flex items-center gap-1.5 mb-2"><span className="w-1.5 h-1.5 rounded-full" style={{ background: c.tone }} /><span className="font-arimo font-bold text-[10px] text-[#55637A] uppercase tracking-wide">{c.title}</span></div>
                <div className="space-y-1.5">
                  {c.cards.map((card) => (
                    <div key={card.t} className="rounded-lg bg-white border border-[#E3EBF5] p-2 shadow-sm">
                      <p className="font-arimo font-bold text-[10px] text-[#0F1E34] leading-snug">{card.t}</p>
                      <span className={`mt-1 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[8.5px] font-arimo font-semibold ${'ai' in card && card.ai ? 'bg-[#38BDF8]/15 text-[#0369a1]' : 'bg-[#F1F5F9] text-[#55637A]'}`}>
                        {'ai' in card && card.ai && <Sparkles className="w-2.5 h-2.5" />}{card.tag}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 hidden sm:flex items-start gap-2 rounded-xl border border-[#38BDF8]/30 bg-white p-2.5">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-arimo font-bold text-[10px] text-[#0F1E34]">KI-Entwurf: Gesprächsleitfaden Folge 18</p>
              <div className="mt-1.5 space-y-1"><div className="h-1.5 w-full rounded-full bg-[#E3EBF5]" /><div className="h-1.5 w-4/5 rounded-full bg-[#E3EBF5]" /></div>
            </div>
            <span className="px-2 py-0.5 rounded-md bg-[#22c55e]/15 text-[#15803d] text-[9px] font-arimo font-bold">Freigeben</span>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* ─── 2 · Vertriebs-CRM mit "Heute"-Ansicht ─────────────────────────────── */
export function CrmTodayMockup() {
  const tasks = [
    { I: Phone, who: 'Muster Akademie', what: 'Angebot nachfassen', due: '09:30', tag: 'Plattform', tone: '#38BDF8' },
    { I: Mail, who: 'Beispiel Handwerk', what: 'Website-Entwurf senden', due: '11:00', tag: 'Website', tone: '#DEFF9A' },
    { I: Bell, who: 'Demo Logistik', what: 'Erinnerung: Workshop-Termin', due: '14:00', tag: 'Automatisierung', tone: '#a78bfa' },
  ];
  const pipeline = [
    { l: 'Neu', n: 6 }, { l: 'Gespräch', n: 4 }, { l: 'Angebot', n: 3 }, { l: 'Gewonnen', n: 2 },
  ];
  return (
    <div className="relative">
      <Frame url="crm.beispiel.de/#/heute" label="Nachgebaute Ansicht: Vertriebs-CRM mit Tagesansicht" dark>
        <div className="flex h-[300px] sm:h-[340px] text-left">
          <aside className="hidden sm:flex flex-col gap-1 w-36 p-3 bg-[#0A1929] text-white/60 border-r border-white/5">
            <div className="px-1.5 mb-3 font-poppins font-black text-[13px] text-white">CRM</div>
            {[{ I: Sun, l: 'Heute', a: true }, { I: LayoutGrid, l: 'Pipeline' }, { I: Users, l: 'Kontakte' }, { I: CalendarDays, l: 'Termine' }].map(({ I, l, a }) => (
              <div key={l} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-arimo font-semibold ${a ? 'bg-[#38BDF8]/15 text-[#7dd3fc]' : ''}`}><I className="w-3.5 h-3.5" />{l}</div>
            ))}
          </aside>
          <div className="flex-1 p-3 sm:p-4 overflow-hidden">
            <p className="font-arimo text-[10px] text-white/40">Donnerstag</p>
            <p className="font-poppins font-black text-[15px] text-white mb-3">Heute · 3 Aufgaben fällig</p>
            <div className="space-y-1.5">
              {tasks.map((t) => (
                <div key={t.who} className="flex items-center gap-2.5 rounded-xl bg-white/[0.04] border border-white/10 px-2.5 py-2">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center bg-white/10"><t.I className="w-3 h-3 text-white/80" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="font-arimo font-bold text-[10.5px] text-white truncate">{t.what}</p>
                    <p className="font-arimo text-[9.5px] text-white/45 truncate">{t.who}</p>
                  </div>
                  <span className="hidden sm:inline px-1.5 py-0.5 rounded text-[8.5px] font-arimo font-bold text-[#0A192F]" style={{ background: t.tone }}>{t.tag}</span>
                  <span className="flex items-center gap-0.5 font-arimo text-[9.5px] text-white/50"><Clock className="w-2.5 h-2.5" />{t.due}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 mb-1.5 font-arimo font-bold text-[9.5px] uppercase tracking-wide text-white/40">Pipeline</p>
            <div className="grid grid-cols-4 gap-1.5">
              {pipeline.map((p, i) => (
                <div key={p.l} className="rounded-lg border border-white/10 px-2 py-1.5" style={{ background: `rgba(56,189,248,${0.05 + i * 0.05})` }}>
                  <p className="font-poppins font-black text-[14px] text-white leading-none">{p.n}</p>
                  <p className="font-arimo text-[9px] text-white/50 mt-0.5">{p.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Frame>
      {/* Handy-Ansicht: zeigt, dass das CRM auch als App unterwegs läuft */}
      <div aria-hidden="true" className="hidden md:block absolute -bottom-6 -right-4 w-[120px] rounded-[22px] border-[5px] border-[#0A192F] bg-[#0A1929] p-2 shadow-2xl">
        <div className="mx-auto mb-2 h-1 w-8 rounded-full bg-white/20" />
        <p className="font-poppins font-black text-[10px] text-white mb-1.5">Heute</p>
        {tasks.slice(0, 3).map((t) => (
          <div key={t.who} className="mb-1 rounded-md bg-white/[0.06] px-1.5 py-1">
            <p className="font-arimo font-bold text-[7.5px] text-white truncate">{t.what}</p>
            <p className="font-arimo text-[7px] text-white/40">{t.due}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── 3 · Regelbasierte Trading-Automatisierung ─────────────────────────── */
export function TradingMockup() {
  // Erfundene, geglättete Beispielkurve (keine echten Kurse)
  const pts = [62, 58, 60, 54, 56, 49, 51, 45, 47, 41, 43, 36, 38, 33, 35, 28];
  const w = 300, h = 90;
  const path = pts.map((y, i) => `${i === 0 ? 'M' : 'L'}${(i / (pts.length - 1)) * w},${y}`).join(' ');
  const rules = [
    { l: 'Wöchentlicher Sparplan', s: 'aktiv' },
    { l: 'Risiko-Grenze je Position', s: 'aktiv' },
    { l: 'Gewinne teilweise sichern', s: 'pausiert' },
  ];
  const log = [
    { t: 'Mo 09:00', e: 'Sparplan ausgeführt · ETF Welt' },
    { t: 'Mi 15:42', e: 'Risiko-Grenze geprüft · keine Aktion' },
  ];
  return (
    <Frame url="app.beispiel-trading.de/dashboard" label="Nachgebaute Ansicht: Dashboard einer regelbasierten Trading-Automatisierung" dark>
      <div className="flex h-[300px] sm:h-[340px] text-left">
        <aside className="hidden sm:flex flex-col gap-1 w-36 p-3 bg-[#0a1929] text-white/60 border-r border-white/5">
          <div className="px-1.5 mb-3 font-poppins font-black text-[13px] text-white">Auto-Invest</div>
          {[{ I: LineChart, l: 'Übersicht', a: true }, { I: Settings2, l: 'Regeln' }, { I: ShieldCheck, l: 'Freigaben' }, { I: ScrollText, l: 'Protokoll' }].map(({ I, l, a }) => (
            <div key={l} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-[11px] font-arimo font-semibold ${a ? 'bg-[#22c55e]/15 text-[#86efac]' : ''}`}><I className="w-3.5 h-3.5" />{l}</div>
          ))}
        </aside>
        <div className="flex-1 p-3 sm:p-4 overflow-hidden grid grid-cols-1 sm:grid-cols-5 gap-2.5 content-start">
          <div className="sm:col-span-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center justify-between">
              <p className="font-arimo font-bold text-[10px] text-white/70">Beispieldepot</p>
              <span className="flex items-center gap-0.5 font-arimo font-bold text-[10px] text-[#86efac]"><ArrowUpRight className="w-3 h-3" />Entwicklung</span>
            </div>
            <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-[78px] mt-1" preserveAspectRatio="none">
              <defs>
                <linearGradient id="tradeFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" /><stop offset="100%" stopColor="#22c55e" stopOpacity="0" /></linearGradient>
              </defs>
              <path d={`${path} L${w},${h} L0,${h} Z`} fill="url(#tradeFill)" />
              <path d={path} fill="none" stroke="#22c55e" strokeWidth="2" vectorEffect="non-scaling-stroke" />
            </svg>
          </div>
          <div className="sm:col-span-2 rounded-xl border border-[#f59e0b]/30 bg-[#f59e0b]/[0.06] p-2.5">
            <p className="flex items-center gap-1 font-arimo font-bold text-[10px] text-[#fcd34d]"><ShieldCheck className="w-3 h-3" />Freigabe nötig</p>
            <p className="font-arimo text-[10px] text-white/80 mt-1.5 leading-snug">Vorschlag: Position „ETF Welt“ gemäß Sparplan aufstocken</p>
            <div className="flex gap-1.5 mt-2">
              <span className="px-2 py-0.5 rounded-md bg-[#22c55e] text-[#052e16] text-[9px] font-arimo font-bold">Bestätigen</span>
              <span className="px-2 py-0.5 rounded-md bg-white/10 text-white/70 text-[9px] font-arimo font-bold">Ablehnen</span>
            </div>
          </div>
          <div className="sm:col-span-3 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <p className="font-arimo font-bold text-[10px] text-white/70 mb-1.5">Aktive Regeln</p>
            {rules.map((r) => (
              <div key={r.l} className="flex items-center justify-between py-0.5">
                <span className="font-arimo text-[10px] text-white/80">{r.l}</span>
                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-arimo font-bold ${r.s === 'aktiv' ? 'bg-[#22c55e]/15 text-[#86efac]' : 'bg-white/10 text-white/50'}`}>{r.s}</span>
              </div>
            ))}
          </div>
          <div className="hidden sm:block sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <p className="font-arimo font-bold text-[10px] text-white/70 mb-1.5">Protokoll</p>
            {log.map((l) => (
              <div key={l.t} className="mb-1">
                <p className="font-arimo text-[8.5px] text-white/40">{l.t}</p>
                <p className="font-arimo text-[9.5px] text-white/80 leading-snug">{l.e}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* Echtes Event-Motiv (öffentliches Plakat/Flyer) neben der nachgebauten Oberfläche */
function PosterWithApp({ src, alt, children }: { src: string; alt: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-5 gap-3 items-end">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="col-span-2 w-full rounded-2xl object-cover border border-[#E3EBF5] shadow-xl"
        style={{ aspectRatio: '4 / 5' }}
      />
      <div className="col-span-3">{children}</div>
    </div>
  );
}

/* ─── 4 · Ticketsystem für ein Festival ─────────────────────────────────── */
export function TicketSystemMockup() {
  const items = [
    { l: 'Bundle (alles inklusive)', p: '37,99 €', on: true },
    { l: 'Stand-Up Comedy', p: '17,50 €', on: false },
    { l: 'Bierpong-Startplatz', p: '10,00 €', on: true },
  ];
  return (
    <PosterWithApp src="/b2b/festival-plakat.webp" alt="Veranstaltungsplakat des Festivals">
      <Frame url="festival.beispiel.de/tickets" label="Nachgebaute Ansicht: Ticketauswahl mit Checkout und PDF-Ticket" dark>
        <div className="p-3 text-left">
          <p className="flex items-center gap-1.5 font-poppins font-black text-[12px] text-white mb-2"><Ticket className="w-3.5 h-3.5 text-[#DEFF9A]" />Tickets wählen</p>
          <div className="space-y-1.5">
            {items.map((it) => (
              <div key={it.l} className={`flex items-center justify-between rounded-lg px-2 py-1.5 border ${it.on ? 'border-[#DEFF9A]/50 bg-[#DEFF9A]/[0.07]' : 'border-white/10 bg-white/[0.03]'}`}>
                <span className="flex items-center gap-1.5 font-arimo text-[9.5px] text-white/85">
                  <span className={`w-3 h-3 rounded flex items-center justify-center ${it.on ? 'bg-[#DEFF9A]' : 'border border-white/30'}`}>{it.on && <CheckCircle2 className="w-2.5 h-2.5 text-[#0A192F]" />}</span>
                  {it.l}
                </span>
                <span className="font-arimo font-bold text-[9.5px] text-white">{it.p}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center justify-between rounded-lg bg-[#DEFF9A] px-2 py-1.5">
            <span className="flex items-center gap-1 font-arimo font-bold text-[9.5px] text-[#0A192F]"><CreditCard className="w-3 h-3" />Sicher bezahlen</span>
            <span className="font-poppins font-black text-[10px] text-[#0A192F]">47,99 €</span>
          </div>
          <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1.5">
            <FileDown className="w-3.5 h-3.5 text-[#7dd3fc]" />
            <div className="flex-1">
              <p className="font-arimo font-bold text-[9px] text-white">Ticket_Max_M.pdf</p>
              <p className="font-arimo text-[8px] text-white/45">Automatisch per Mail & im Konto</p>
            </div>
          </div>
        </div>
      </Frame>
    </PosterWithApp>
  );
}

/* ─── 5 · Live-Turnierverwaltung (Bierpong) ─────────────────────────────── */
export function TournamentMockup() {
  const table = [
    { t: 'Becherbande', w: 3, p: 9 },
    { t: 'Team Treffsicher', w: 2, p: 6 },
    { t: 'Die Ping-Pongs', w: 1, p: 3 },
    { t: 'Last Cup Heroes', w: 0, p: 0 },
  ];
  return (
    <PosterWithApp src="/b2b/bierpong-flyer.webp" alt="Flyer des Bierpong-Turniers">
      <Frame url="festival.beispiel.de/turnier" label="Nachgebaute Ansicht: Live-Turnierboard mit Gruppen, Tischen und Rundentimer" dark>
        <div className="p-3 text-left">
          <div className="flex items-center justify-between mb-2">
            <p className="flex items-center gap-1.5 font-poppins font-black text-[12px] text-white"><Trophy className="w-3.5 h-3.5 text-[#fcd34d]" />Gruppe A · Live</p>
            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#ef4444]/20 font-arimo font-bold text-[9px] text-[#fca5a5]"><Timer className="w-2.5 h-2.5" />07:42</span>
          </div>
          <div className="rounded-lg border border-white/10 overflow-hidden">
            {table.map((r, i) => (
              <div key={r.t} className={`flex items-center px-2 py-1 font-arimo text-[9.5px] ${i % 2 ? 'bg-white/[0.02]' : 'bg-white/[0.05]'} ${i < 2 ? 'text-white' : 'text-white/55'}`}>
                <span className="w-3 text-white/40">{i + 1}</span>
                <span className="flex-1 truncate font-semibold">{r.t}</span>
                <span className="w-6 text-right">{r.w}S</span>
                <span className="w-7 text-right font-bold">{r.p}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 mb-1 font-arimo font-bold text-[8.5px] uppercase tracking-wide text-white/40">Jetzt an den Tischen</p>
          <div className="grid grid-cols-3 gap-1">
            {['Tisch 1', 'Tisch 2', 'Tisch 3'].map((t, i) => (
              <div key={t} className="rounded-md border border-white/10 bg-white/[0.04] px-1.5 py-1">
                <p className="font-arimo text-[8px] text-white/40">{t}</p>
                <p className="font-arimo font-bold text-[8.5px] text-white">{i === 2 ? 'frei' : '4 : 2'}</p>
              </div>
            ))}
          </div>
          <div className="mt-2 flex items-center gap-1 font-arimo text-[8.5px] text-[#86efac]"><Plus className="w-2.5 h-2.5" />K.-o.-Runde wird automatisch erzeugt</div>
        </div>
      </Frame>
    </PosterWithApp>
  );
}
