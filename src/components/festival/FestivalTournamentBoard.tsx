// src/components/festival/FestivalTournamentBoard.tsx
// Read-only Live-Tableau, eingebettet in die HarmonyFestivalPage.
// Zeigt sich nur, wenn ein Turnier existiert und nicht mehr im 'setup' ist.
// Ergebnis-Eintragen bleibt auf /admin/turnier.
import { useTournament, type Match } from '../../hooks/useTournament';
import { useCountdown, formatTime } from '../../hooks/useCountdown';

const C = {
  cyan: '#00d4d4',
  lime: '#c8e840',
  orange: '#f07820',
  sky: '#4dc8e8',
};

export default function FestivalTournamentBoard() {
  const { tournament, groups, teams, matches, standings, loading } = useTournament();
  const remaining = useCountdown(tournament?.round_ends_at ?? null);

  // Nur anzeigen, wenn ein Turnier live/fertig ist — sonst Seite unverändert lassen.
  if (loading || !tournament || tournament.status === 'setup') return null;

  const nameOf = (id: string | null) =>
    id ? teams.find((t) => t.id === id)?.name ?? '—' : '—';

  const live = matches.filter((m) => m.status === 'live');
  const koMatches = matches.filter((m) => m.phase === 'ko');
  const koRounds = [...new Set(koMatches.map((m) => m.round))].sort((a, b) => a - b);

  const pendingGroup = matches.filter((m) => m.phase === 'group' && m.status === 'pending');
  const nextGroupRound = pendingGroup.length
    ? Math.min(...pendingGroup.map((m) => m.round))
    : null;
  const upcoming = nextGroupRound
    ? pendingGroup.filter((m) => m.round === nextGroupRound)
    : [];

  const advance = tournament.advance_per_group ?? 2;

  return (
    <section id="turnier" className="relative z-10" style={{ borderTop: '1px solid rgba(200,232,64,0.12)', borderBottom: '1px solid rgba(200,232,64,0.12)' }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-16">

        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="tag-label mb-3" style={{ color: C.lime, opacity: 0.75 }}>Live · Bierpong-Turnier</div>
            <h2 className="graffiti" style={{ fontSize: 'clamp(36px, 6vw, 64px)', color: '#fff', lineHeight: 0.9 }}>
              Das <span style={{ color: C.lime, textShadow: `0 0 40px ${C.lime}55` }}>Tableau</span>
            </h2>
          </div>
          <StatusBadge status={tournament.status} />
        </div>

        {/* Timer */}
        <div className="glass rounded-2xl p-6 text-center mb-6" style={{ border: `1px solid rgba(200,232,64,0.18)` }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.34em', textTransform: 'uppercase', color: 'rgba(200,232,64,0.7)' }}>
            {tournament.round_label ?? 'Pause / Bereit'}
          </div>
          <div
            className="price-num"
            style={{
              fontSize: 'clamp(56px, 12vw, 96px)',
              lineHeight: 1,
              marginTop: '6px',
              color: tournament.round_ends_at
                ? remaining <= 30 ? C.orange : C.lime
                : 'rgba(255,255,255,0.25)',
              textShadow: tournament.round_ends_at && remaining > 30 ? `0 0 40px ${C.lime}44` : 'none',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {tournament.round_ends_at ? formatTime(remaining) : '–:––'}
          </div>
          {tournament.round_ends_at && remaining === 0 && (
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '14px', color: C.orange, marginTop: '4px' }}>
              Zeit abgelaufen
            </div>
          )}
        </div>

        {/* Laufende Spiele */}
        {live.length > 0 && (
          <div className="mb-8">
            <SubHead>Aktuelle Spiele</SubHead>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {live.map((m) => <MatchCard key={m.id} m={m} nameOf={nameOf} highlight />)}
            </div>
          </div>
        )}

        {/* Gruppen-Tabellen */}
        {groups.length > 0 && (
          <div className="mb-8">
            <SubHead>Gruppen</SubHead>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((g) => {
                const rows = standings
                  .filter((s) => s.group_id === g.id)
                  .sort((a, b) => a.group_rank - b.group_rank);
                return (
                  <div key={g.id} className="glass rounded-2xl p-4" style={{ border: '1px solid rgba(0,212,212,0.12)' }}>
                    <div className="graffiti mb-3" style={{ fontSize: '20px', color: '#fff' }}>Gruppe {g.name}</div>
                    <table className="w-full" style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
                      <thead>
                        <tr style={{ color: 'rgba(160,230,230,0.4)', textAlign: 'left' }}>
                          <th className="py-1 font-medium">#</th>
                          <th className="font-medium">Team</th>
                          <th className="text-center font-medium">Sp</th>
                          <th className="text-center font-medium">Pkt</th>
                          <th className="text-center font-medium">Diff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((s) => {
                          const up = s.group_rank <= advance;
                          return (
                            <tr key={s.team_id} style={{ color: up ? C.lime : 'rgba(255,255,255,0.8)' }}>
                              <td className="py-1.5">{s.group_rank}</td>
                              <td className="truncate" style={{ maxWidth: '120px', fontWeight: up ? 700 : 400 }}>{s.team_name}</td>
                              <td className="text-center">{s.played}</td>
                              <td className="text-center font-bold">{s.points}</td>
                              <td className="text-center">{s.cup_diff > 0 ? `+${s.cup_diff}` : s.cup_diff}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Nächste Gruppenspiele */}
        {upcoming.length > 0 && (
          <div className="mb-8">
            <SubHead>Als Nächstes · Runde {nextGroupRound}</SubHead>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((m) => <MatchCard key={m.id} m={m} nameOf={nameOf} />)}
            </div>
          </div>
        )}

        {/* KO-Bracket */}
        {koRounds.length > 0 && (
          <div className="mb-2">
            <SubHead>KO-Runde</SubHead>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {koRounds.map((r) => {
                const col = koMatches.filter((m) => m.round === r).sort((a, b) => a.position - b.position);
                return (
                  <div key={r} className="min-w-[220px] space-y-3">
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.5)' }}>
                      {col[0]?.label ?? `Runde ${r}`}
                    </div>
                    {col.map((m) => <MatchCard key={m.id} m={m} nameOf={nameOf} highlight={m.status === 'live'} />)}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tournament.status === 'done' && (
          <div className="glass rounded-2xl p-6 text-center mt-6" style={{ border: `1px solid ${C.lime}44` }}>
            <span className="graffiti" style={{ fontSize: '28px', color: C.lime }}>🏆 Turnier beendet</span>
          </div>
        )}
      </div>
    </section>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="graffiti mb-3" style={{ fontSize: '22px', color: '#fff' }}>{children}</h3>
  );
}

function MatchCard({
  m, nameOf, highlight = false,
}: { m: Match; nameOf: (id: string | null) => string; highlight?: boolean }) {
  const done = m.status === 'done';
  const aWins = done && (m.score_a ?? 0) > (m.score_b ?? 0);
  const bWins = done && (m.score_b ?? 0) > (m.score_a ?? 0);
  return (
    <div
      className="rounded-xl p-3.5"
      style={{
        background: highlight ? 'rgba(200,232,64,0.06)' : 'rgba(8,12,16,0.6)',
        border: `1px solid ${highlight ? 'rgba(200,232,64,0.4)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <Row name={nameOf(m.team_a)} score={m.score_a} win={aWins} />
      <div className="my-1.5 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <Row name={nameOf(m.team_b)} score={m.score_b} win={bWins} />
      {highlight && (
        <div className="mt-2 flex items-center gap-1.5" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: C.lime }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: C.lime, boxShadow: `0 0 8px ${C.lime}` }} /> läuft
        </div>
      )}
    </div>
  );
}

function Row({ name, score, win }: { name: string; score: number | null; win: boolean }) {
  return (
    <div className="flex items-center justify-between" style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: win ? C.lime : 'rgba(255,255,255,0.85)', fontWeight: win ? 700 : 500 }}>
      <span className="truncate" style={{ maxWidth: '160px' }}>{name}</span>
      <span className="ml-2" style={{ fontVariantNumeric: 'tabular-nums', fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px' }}>{score ?? '–'}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { bg: string; col: string; label: string }> = {
    group_stage: { bg: 'rgba(0,212,212,0.12)', col: C.cyan, label: 'Gruppenphase' },
    ko_stage: { bg: 'rgba(200,232,64,0.12)', col: C.lime, label: 'KO-Runde' },
    done: { bg: 'rgba(200,232,64,0.12)', col: C.lime, label: 'Beendet' },
  };
  const s = map[status] ?? { bg: 'rgba(255,255,255,0.06)', col: 'rgba(255,255,255,0.6)', label: status };
  return (
    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '12px', letterSpacing: '0.18em', textTransform: 'uppercase', color: s.col, background: s.bg, border: `1px solid ${s.col}33`, borderRadius: 999, padding: '6px 14px' }}>
      {s.label}
    </span>
  );
}