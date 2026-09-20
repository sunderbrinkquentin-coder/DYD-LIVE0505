import { useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, Grid2x2, Target, GraduationCap, ArrowUpRight, Maximize2, X,
} from 'lucide-react';

/* Live-Demo: DYD ORBIT, eingebettet per iframe (Bolt-Preview) */
const ORBIT_LIVE_DEMO_URL = 'https://quentin907-dyd-nexus-29l3.bolt.host/';

/* Die echte ORBIT-App braucht Desktop-Breite, damit sie ihre eigene linke
   Navigationsleiste zeigt (bei zu schmaler Einbettung schaltet sie offenbar
   selbst in eine Kompaktansicht ohne Sidebar). Deshalb bekommt das iframe
   IMMER diese feste "Design-Größe" (voller Desktop-Viewport aus Sicht der
   App) und wird per CSS-Transform auf die tatsächlich verfügbare Breite
   unseres Containers herunterskaliert – so bleibt die Desktop-Ansicht der
   App erhalten, egal wie schmal die Spalte auf unserer Seite ist. */
const ORBIT_DESIGN_WIDTH = 1120;
const ORBIT_DESIGN_HEIGHT = 760;

/* Gemeinsame Browser-Chrome-Hülle */
function Frame({ url, label, children }: { url: string; label: string; children: React.ReactNode }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="rounded-2xl overflow-hidden border border-[#E3EBF5] bg-white shadow-2xl"
      style={{ boxShadow: '0 30px 60px -30px rgba(10,25,47,0.45)' }}
    >
      {/* Chrome */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0A192F]" aria-hidden="true">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex-1 max-w-xs px-3 py-1 rounded-md bg-white/10 text-[10px] text-white/50 font-arimo truncate">
          {url}
        </div>
      </div>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

function Sidebar({ brand, items }: { brand: string; items: { Icon: typeof Target; label: string; active?: boolean }[] }) {
  return (
    <aside className="hidden sm:flex flex-col gap-1 w-40 p-3 bg-[#F6F9FD] border-r border-[#E3EBF5]">
      <div className="px-2 py-1 mb-2 font-poppins font-black text-sm text-[#0A192F]">{brand}</div>
      {items.map((it) => (
        <div
          key={it.label}
          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-arimo font-semibold ${
            it.active ? 'bg-white text-[#0F1E34] shadow-sm border border-[#E3EBF5]' : 'text-[#55637A]'
          }`}
        >
          <it.Icon className="w-3.5 h-3.5 text-[#38BDF8]" />
          {it.label}
        </div>
      ))}
    </aside>
  );
}

function KpiTile({ label, value, trend }: { label: string; value: string; trend?: string }) {
  return (
    <div className="rounded-xl border border-[#E3EBF5] bg-white p-3">
      <p className="font-arimo text-[10px] text-[#55637A] mb-1">{label}</p>
      <div className="flex items-end justify-between">
        <span className="font-poppins font-black text-lg text-[#0F1E34]">{value}</span>
        {trend && (
          <span className="inline-flex items-center gap-0.5 text-[10px] font-arimo font-bold text-[#12b981]">
            <ArrowUpRight className="w-3 h-3" />{trend}
          </span>
        )}
      </div>
    </div>
  );
}

function GapBar({ label, pct }: { label: string; pct: number }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="font-arimo text-[11px] text-[#0F1E34]">{label}</span>
        <span className="font-arimo text-[10px] font-bold text-[#55637A]">{pct}%</span>
      </div>
      <div className="h-2 rounded-full bg-[#EEF3F9] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #38BDF8, #DEFF9A)' }} />
      </div>
    </div>
  );
}

/* Browser-Chrome-Hülle für ECHTEN, interaktiven Inhalt (kein role="img"/aria-hidden wie Frame() –
   der Inhalt ist ein echtes, bedienbares iframe und muss für Screenreader/Tastatur erreichbar bleiben). */
function LiveFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-[#E3EBF5] bg-white shadow-2xl"
      style={{ boxShadow: '0 30px 60px -30px rgba(10,25,47,0.45)' }}
    >
      <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0A192F]" aria-hidden="true">
        <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
        <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
        <div className="ml-3 flex-1 max-w-xs px-3 py-1 rounded-md bg-white/10 text-[10px] text-white/50 font-arimo truncate">
          {url}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ─── NEXUS: Workforce-Dashboard ─── */
export function NexusMockup() {
  return (
    <Frame url="app.decide-your-dream.de/nexus" label="Illustrative Produktvorschau: DYD NEXUS – Workforce-Dashboard mit Skill-Matrix, Gap-Analyse und Zielrollen-Match.">
      <div className="flex">
        <Sidebar
          brand="DYD NEXUS"
          items={[
            { Icon: LayoutDashboard, label: 'Übersicht', active: true },
            { Icon: Grid2x2, label: 'Skill-Matrix' },
            { Icon: Target, label: 'Zielrollen' },
            { Icon: GraduationCap, label: 'Lernpfade' },
          ]}
        />
        <div className="flex-1 p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-poppins font-black text-sm sm:text-base text-[#0F1E34]">Workforce Skill Intelligence</h4>
              <p className="font-arimo text-[10px] text-[#55637A]">Abteilung · Data &amp; Analytics</p>
            </div>
            <span className="text-[10px] font-arimo font-bold px-2 py-1 rounded-md text-[#0A192F]" style={{ background: 'linear-gradient(135deg,#DEFF9A,#38BDF8)' }}>ESCO ✓</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <KpiTile label="Skills erfasst" value="1.284" trend="+8%" />
            <KpiTile label="Offene Gaps" value="37" />
            <KpiTile label="Interne Matches" value="12" trend="+3" />
          </div>

          <div className="grid sm:grid-cols-5 gap-4">
            <div className="sm:col-span-3 rounded-xl border border-[#E3EBF5] bg-white p-4">
              <p className="font-poppins font-bold text-xs text-[#0F1E34] mb-3">Größte Skill-Gaps</p>
              <div className="space-y-3">
                <GapBar label="Data Analysis" pct={72} />
                <GapBar label="Cloud / DevOps" pct={58} />
                <GapBar label="Leadership" pct={44} />
                <GapBar label="Power BI" pct={31} />
              </div>
            </div>
            <div className="sm:col-span-2 rounded-xl border border-[#E3EBF5] bg-white p-4 flex flex-col items-center justify-center text-center">
              <p className="font-poppins font-bold text-xs text-[#0F1E34] mb-3">Zielrollen-Match</p>
              <div className="relative w-20 h-20 rounded-full" style={{ background: 'conic-gradient(#38BDF8 0% 78%, #EEF3F9 78% 100%)' }}>
                <div className="absolute inset-[6px] rounded-full bg-white flex items-center justify-center">
                  <span className="font-poppins font-black text-lg text-[#0F1E34]">78%</span>
                </div>
              </div>
              <p className="font-arimo text-[10px] text-[#55637A] mt-2">Data Engineer</p>
            </div>
          </div>
        </div>
      </div>
    </Frame>
  );
}

/* Misst die verfügbare Breite des Wrapper-Divs und berechnet daraus den
   Skalierungsfaktor, mit dem das (fest breite) iframe hineinskaliert wird.
   ResizeObserver statt fixer Breakpoints, damit es bei jeder Container-
   breite (Tablet, Sidebar-Layouts etc.) exakt passt. */
function ScaledOrbitFrame() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return undefined;
    const update = () => {
      const width = el.clientWidth;
      if (width > 0) setScale(Math.min(1, width / ORBIT_DESIGN_WIDTH));
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: '100%', overflow: 'hidden', height: ORBIT_DESIGN_HEIGHT * scale }}>
      <div style={{ width: ORBIT_DESIGN_WIDTH, height: ORBIT_DESIGN_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
        <iframe
          src={ORBIT_LIVE_DEMO_URL}
          title="DYD ORBIT – interaktive Live-Demo: Bildungsträger-Dashboard und Nutzer-Journey zum Durchklicken"
          width={ORBIT_DESIGN_WIDTH}
          height={ORBIT_DESIGN_HEIGHT}
          style={{ border: 0, display: 'block' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
    </div>
  );
}

/* ─── ORBIT: echte Live-Demo, eingebettet ─── */
/* Enthält Dashboard (Bildungsträger) und Journey (Endnutzer) bereits als eigenen Umschalter
   INNERHALB der App – hier also bewusst kein eigener Tab-Bau nötig, nur sauber einbetten.
   Zusätzlich zur reinen Einbettung: eine Einladungs-Zeile, ein "LIVE"-Badge, ein Button zum
   vergrößerten Öffnen (Modal, darin zusätzlich echtes Browser-Vollbild) sowie ein
   Erklär-/Feedback-Banner, damit die Demo auf der Seite deutlich präsenter wirkt als eine
   reine Illustration. */
export function OrbitMockup({ onDemo }: { onDemo?: () => void } = {}) {
  const [expanded, setExpanded] = useState(false);
  const fullscreenTargetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setExpanded(false);
    };
    document.addEventListener('keydown', onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [expanded]);

  const goFullscreen = () => {
    fullscreenTargetRef.current?.requestFullscreen?.();
  };

  return (
    <div>
      {/* Einladung oberhalb der Demo */}
      <div className="text-center mb-6">
        <p className="font-poppins font-black text-lg sm:text-2xl text-[#0F1E34] mb-1.5">
          Wie wäre es mit einem kleinen Rundgang?
        </p>
        <p className="font-arimo text-sm sm:text-base text-[#55637A]">
          Sie haben bereits einen Demo-Zugang? Dann können Sie sich hier anmelden.
        </p>
      </div>

      <div className="relative">
        {/* Live-Badge – überlappt bewusst die obere Kante der Frame für mehr visuelles Gewicht */}
        <div className="absolute -top-3 left-6 z-10 inline-flex items-center gap-1.5 pl-2 pr-3 py-1 rounded-full bg-[#0A192F] shadow-lg">
          <span className="relative flex h-2 w-2" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#28c840] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#28c840]" />
          </span>
          <span className="font-arimo text-[10px] font-bold text-white tracking-wide uppercase">Live-Demo</span>
        </div>

        {/* Öffnet die vergrößerte Ansicht (Modal) */}
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="absolute -top-3 right-6 z-10 inline-flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full bg-white border border-[#E3EBF5] shadow-lg font-arimo text-[10px] font-bold text-[#0F1E34] hover:border-[#38BDF8]/50 hover:text-[#38BDF8] transition"
        >
          <Maximize2 className="w-3 h-3" aria-hidden="true" />
          Vollbild
        </button>

        <div className="rounded-2xl ring-4 ring-[#38BDF8]/15">
          <LiveFrame url="app.decide-your-dream.de/orbit">
            <ScaledOrbitFrame />
          </LiveFrame>
        </div>
      </div>

      {/* Einordnung + Feedback-Einladung für Besucher:innen. Direkt hier – am Punkt des
          höchsten Engagements, gleich nach dem Durchklicken der Demo – sitzt bewusst schon
          ein CTA, statt Besucher:innen erst bis zum Tab-Ende scrollen zu lassen. */}
      <div className="mt-4 rounded-xl border border-[#38BDF8]/25 bg-[#F6F9FD] px-4 py-3.5 sm:px-5 sm:py-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="font-poppins font-bold text-xs sm:text-sm text-[#0F1E34] mb-1">So könnte es aussehen.</p>
            <p className="font-arimo text-xs sm:text-[13px] text-[#55637A] leading-relaxed">
              Ihre individuelle Version wird vollständig an Ihr Corporate Design und Ihre Corporate Identity angepasst.
              Fehlt Ihnen etwas? Wir freuen uns über Ihr Feedback!
            </p>
          </div>
          {onDemo && (
            <button
              type="button"
              onClick={onDemo}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-arimo text-xs sm:text-sm font-bold text-[#0A192F] transition hover:shadow-lg hover:shadow-[#38BDF8]/25 hover:-translate-y-0.5 whitespace-nowrap"
              style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}
            >
              Jetzt Pilotpartner werden
            </button>
          )}
        </div>
      </div>

      {/* Vergrößerte Ansicht: großes Modal, darin zusätzlich echtes Browser-Vollbild möglich.
          Läuft bewusst NICHT über ScaledOrbitFrame – im Modal ist ohnehin genug Breite da,
          das iframe bekommt hier ganz normal 100% Breite/Höhe. */}
      {expanded && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="DYD ORBIT – Live-Demo vergrößert"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A192F]/80 backdrop-blur-sm p-0 sm:p-6"
          onClick={() => setExpanded(false)}
        >
          <div
            ref={fullscreenTargetRef}
            className="relative w-full h-full sm:w-[95vw] sm:h-[92vh] bg-white sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#0A192F]">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" aria-hidden="true" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" aria-hidden="true" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" aria-hidden="true" />
                <span className="ml-2 font-arimo text-[11px] text-white/60 truncate">app.decide-your-dream.de/orbit</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={goFullscreen}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 font-arimo text-xs font-bold text-white transition"
                >
                  <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />
                  Echtes Vollbild
                </button>
                <button
                  type="button"
                  onClick={() => setExpanded(false)}
                  aria-label="Schließen"
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
            <iframe
              src={ORBIT_LIVE_DEMO_URL}
              title="DYD ORBIT – interaktive Live-Demo im Vollbild"
              className="w-full flex-1"
              style={{ border: 0 }}
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </div>
  );
}