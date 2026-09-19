import {
  LayoutDashboard, Grid2x2, Target, GraduationCap, ArrowUpRight,
} from 'lucide-react';

/* Live-Demo: DYD ORBIT, eingebettet per iframe (Bolt-Preview) */
const ORBIT_LIVE_DEMO_URL = 'https://quentin907-dyd-nexus-29l3.bolt.host/';

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

/* ─── ORBIT: echte Live-Demo, eingebettet ─── */
/* Enthält Dashboard (Bildungsträger) und Journey (Endnutzer) bereits als eigenen Umschalter
   INNERHALB der App – hier also bewusst kein eigener Tab-Bau nötig, nur sauber einbetten. */
export function OrbitMockup() {
  return (
    <LiveFrame url="app.decide-your-dream.de/orbit">
      <iframe
        src={ORBIT_LIVE_DEMO_URL}
        title="DYD ORBIT – interaktive Live-Demo: Bildungsträger-Dashboard und Nutzer-Journey zum Durchklicken"
        className="w-full block h-[560px] sm:h-[720px]"
        style={{ border: 0 }}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </LiveFrame>
  );
}