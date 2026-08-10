// src/pages/TournamentBoardPage.tsx
import { useParams } from 'react-router-dom';
import { useTournament, type Match, type Team } from '../hooks/useTournament';
import { useCountdown, formatTime } from '../hooks/useCountdown';

export default function TournamentBoardPage() {
  const { tournamentId } = useParams();
  const { tournament, groups, teams, matches, standings, loading, error } =
    useTournament(tournamentId);
  const remaining = useCountdown(tournament?.round_ends_at ?? null);

  const nameOf = (id: string | null) =>
    id ? teams.find((t) => t.id === id)?.name ?? '—' : '—';

  if (loading) return <Centered>Lädt…</Centered>;
  if (error) return <Centered>Fehler: {error}</Centered>;
  if (!tournament) return <Centered>Noch kein Turnier angelegt.</Centered>;

  const live = matches.filter((m) => m.status === 'live');
  const koMatches = matches.filter((m) => m.phase === 'ko');
  const koRounds = [...new Set(koMatches.map((m) => m.round))].sort((a, b) => a - b);

  // nächste startbereite Gruppenrunde als "Vorschau"
  const pendingGroup = matches.filter((m) => m.phase === 'group' && m.status === 'pending');
  const nextGroupRound = pendingGroup.length
    ? Math.min(...pendingGroup.map((m) => m.round))
    : null;
  const upcoming = nextGroupRound
    ? pendingGroup.filter((m) => m.round === nextGroupRound)
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold">{tournament.name}</h1>
          <StatusBadge status={tournament.status} />
        </header>

        {/* Timer */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center">
          <div className="text-sm uppercase tracking-widest text-slate-400">
            {tournament.round_label ?? 'Bereit / Pause'}
          </div>
          <div
            className={`mt-1 font-mono text-6xl font-bold tabular-nums ${
              tournament.round_ends_at
                ? remaining <= 30
                  ? 'text-red-400'
                  : 'text-emerald-400'
                : 'text-slate-600'
            }`}
          >
            {tournament.round_ends_at ? formatTime(remaining) : '–:––'}
          </div>
          {tournament.round_ends_at && remaining === 0 && (
            <div className="mt-1 text-red-400 font-semibold">Zeit abgelaufen</div>
          )}
        </div>

        {/* Laufende Spiele */}
        {live.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">Aktuelle Spiele</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {live.map((m) => (
                <MatchCard key={m.id} m={m} nameOf={nameOf} highlight />
              ))}
            </div>
          </section>
        )}

        {/* Gruppen-Tabellen */}
        {groups.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">Gruppen</h2>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((g) => {
                const rows = standings
                  .filter((s) => s.group_id === g.id)
                  .sort((a, b) => a.group_rank - b.group_rank);
                return (
                  <div key={g.id} className="rounded-xl bg-slate-900 border border-slate-800 p-3">
                    <div className="mb-2 font-semibold">Gruppe {g.name}</div>
                    <table className="w-full text-sm">
                      <thead className="text-slate-400">
                        <tr className="text-left">
                          <th className="py-1">#</th>
                          <th>Team</th>
                          <th className="text-center">Sp</th>
                          <th className="text-center">Pkt</th>
                          <th className="text-center">Diff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((s) => (
                          <tr
                            key={s.team_id}
                            className={
                              s.group_rank <= (tournament.advance_per_group ?? 2)
                                ? 'text-emerald-300'
                                : ''
                            }
                          >
                            <td className="py-1">{s.group_rank}</td>
                            <td className="truncate">{s.team_name}</td>
                            <td className="text-center">{s.played}</td>
                            <td className="text-center font-semibold">{s.points}</td>
                            <td className="text-center">
                              {s.cup_diff > 0 ? `+${s.cup_diff}` : s.cup_diff}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Nächste Gruppenspiele */}
        {upcoming.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">Als Nächstes (Runde {nextGroupRound})</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((m) => (
                <MatchCard key={m.id} m={m} nameOf={nameOf} />
              ))}
            </div>
          </section>
        )}

        {/* KO-Bracket */}
        {koRounds.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">KO-Runde</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {koRounds.map((r) => {
                const col = koMatches
                  .filter((m) => m.round === r)
                  .sort((a, b) => a.position - b.position);
                return (
                  <div key={r} className="min-w-[220px] space-y-3">
                    <div className="text-sm font-semibold text-slate-400">
                      {col[0]?.label ?? `Runde ${r}`}
                    </div>
                    {col.map((m) => (
                      <MatchCard key={m.id} m={m} nameOf={nameOf} highlight={m.status === 'live'} />
                    ))}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tournament.status === 'done' && (
          <div className="rounded-2xl bg-emerald-900/30 border border-emerald-700 p-6 text-center text-xl font-bold text-emerald-300">
            🏆 Turnier beendet
          </div>
        )}
      </div>
    </div>
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
      className={`rounded-xl border p-3 ${
        highlight ? 'border-emerald-500 bg-emerald-950/30' : 'border-slate-800 bg-slate-900'
      }`}
    >
      <Row name={nameOf(m.team_a)} score={m.score_a} win={aWins} />
      <div className="my-1 h-px bg-slate-800" />
      <Row name={nameOf(m.team_b)} score={m.score_b} win={bWins} />
      {highlight && <div className="mt-2 text-xs text-emerald-400">● läuft</div>}
    </div>
  );
}

function Row({ name, score, win }: { name: string; score: number | null; win: boolean }) {
  return (
    <div className={`flex items-center justify-between ${win ? 'font-bold text-emerald-300' : ''}`}>
      <span className="truncate">{name}</span>
      <span className="ml-2 font-mono tabular-nums">{score ?? '–'}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    setup: 'bg-slate-700 text-slate-200',
    group_stage: 'bg-blue-700 text-blue-100',
    ko_stage: 'bg-purple-700 text-purple-100',
    done: 'bg-emerald-700 text-emerald-100',
  };
  const label: Record<string, string> = {
    setup: 'Setup', group_stage: 'Gruppenphase', ko_stage: 'KO-Runde', done: 'Beendet',
  };
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-medium ${map[status] ?? ''}`}>
      {label[status] ?? status}
    </span>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
      {children}
    </div>
  );
}