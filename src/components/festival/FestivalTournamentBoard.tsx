// src/components/festival/FestivalTournamentBoard.tsx
import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTournament, type Match } from '../../hooks/useTournament';
import { useCountdown, formatTime } from '../../hooks/useCountdown';
import { useAuth } from '../../contexts/AuthContext';
import { TOURNAMENT_ADMIN_ID } from '../../lib/tournamentApi';

const REVEAL_AT = new Date('2026-08-22T17:00:00').getTime();
const C = { cyan: '#00d4d4', lime: '#c8e840', orange: '#f07820', sky: '#4dc8e8' };

// 🛠️ MOCK-DATEN FÜR DEMO / VORSCHAU (falls kein DB-Turnier existiert)
const MOCK_DATA = {
  tournament: {
    id: 'demo-1',
    name: 'Harmony Bierpong Cup 2026',
    status: 'group_stage',
    table_count: 4,
    advance_per_group: 2,
    round_ends_at: new Date(Date.now() + 12 * 60 * 1000).toISOString(), // 12 Min Restzeit
    round_label: 'Vorrunde · Runde 2 · Welle 1',
  },
  groups: [
    { id: 'g1', name: 'A' },
    { id: 'g2', name: 'B' },
    { id: 'g3', name: 'C' },
    { id: 'g4', name: 'D' },
  ],
  teams: [
    // Gruppe A
    { id: 't1',  name: 'Bieritaten',        group_id: 'g1' },
    { id: 't2',  name: 'Pong Pong Girls',   group_id: 'g1' },
    { id: 't3',  name: 'Becher-Giganten',   group_id: 'g1' },
    { id: 't4',  name: 'Saufstark 04',      group_id: 'g1' },
    // Gruppe B
    { id: 't5',  name: 'Trefferversuch',    group_id: 'g2' },
    { id: 't6',  name: 'Ex und Hopp',       group_id: 'g2' },
    { id: 't7',  name: 'Die Wurfmaschinen', group_id: 'g2' },
    { id: 't8',  name: 'Prost Mahlzeit',    group_id: 'g2' },
    // Gruppe C
    { id: 't9',  name: 'Zielwasser',        group_id: 'g3' },
    { id: 't10', name: 'Schaumschläger',    group_id: 'g3' },
    { id: 't11', name: 'Team Absturz',      group_id: 'g3' },
    { id: 't12', name: 'Hopfen & Malz',     group_id: 'g3' },
    // Gruppe D
    { id: 't13', name: 'Die Restalkoholiker', group_id: 'g4' },
    { id: 't14', name: 'Wurf & Weg',          group_id: 'g4' },
    { id: 't15', name: 'Cup Crusher',         group_id: 'g4' },
    { id: 't16', name: 'Pils Peaks',          group_id: 'g4' },
  ],
  matches: [
    // ── Runde 1: fertig gespielt (füllt die Tabellen) ──
    { id: 'r1a1', phase: 'group', round: 1, position: 1, status: 'done', table_no: null, team_a: 't1',  team_b: 't2',  score_a: 7,  score_b: 4 },
    { id: 'r1a2', phase: 'group', round: 1, position: 2, status: 'done', table_no: null, team_a: 't3',  team_b: 't4',  score_a: 6,  score_b: 4 },
    { id: 'r1b1', phase: 'group', round: 1, position: 3, status: 'done', table_no: null, team_a: 't5',  team_b: 't6',  score_a: 8,  score_b: 6 },
    { id: 'r1b2', phase: 'group', round: 1, position: 4, status: 'done', table_no: null, team_a: 't7',  team_b: 't8',  score_a: 7,  score_b: 6 },
    { id: 'r1c1', phase: 'group', round: 1, position: 5, status: 'done', table_no: null, team_a: 't9',  team_b: 't10', score_a: 9,  score_b: 5 },
    { id: 'r1c2', phase: 'group', round: 1, position: 6, status: 'done', table_no: null, team_a: 't11', team_b: 't12', score_a: 8,  score_b: 5 },
    { id: 'r1d1', phase: 'group', round: 1, position: 7, status: 'done', table_no: null, team_a: 't13', team_b: 't14', score_a: 6,  score_b: 5 },
    { id: 'r1d2', phase: 'group', round: 1, position: 8, status: 'done', table_no: null, team_a: 't15', team_b: 't16', score_a: 10, score_b: 5 },

    // ── Runde 2 · Welle 1: LÄUFT JETZT (4 Tische) ──
    { id: 'r2a1', phase: 'group', round: 2, position: 1, status: 'live', table_no: 1, team_a: 't1',  team_b: 't3',  score_a: 5, score_b: 3 },
    { id: 'r2b1', phase: 'group', round: 2, position: 2, status: 'live', table_no: 2, team_a: 't5',  team_b: 't7',  score_a: 4, score_b: 6 },
    { id: 'r2c1', phase: 'group', round: 2, position: 3, status: 'live', table_no: 3, team_a: 't9',  team_b: 't11', score_a: 7, score_b: 7 },
    { id: 'r2d1', phase: 'group', round: 2, position: 4, status: 'live', table_no: 4, team_a: 't13', team_b: 't15', score_a: 2, score_b: 5 },

    // ── Runde 2 · Welle 2: ALS NÄCHSTES (Vorschau Tisch 1–4) ──
    { id: 'r2a2', phase: 'group', round: 2, position: 5, status: 'pending', table_no: null, team_a: 't2',  team_b: 't4',  score_a: null, score_b: null },
    { id: 'r2b2', phase: 'group', round: 2, position: 6, status: 'pending', table_no: null, team_a: 't6',  team_b: 't8',  score_a: null, score_b: null },
    { id: 'r2c2', phase: 'group', round: 2, position: 7, status: 'pending', table_no: null, team_a: 't10', team_b: 't12', score_a: null, score_b: null },
    { id: 'r2d2', phase: 'group', round: 2, position: 8, status: 'pending', table_no: null, team_a: 't14', team_b: 't16', score_a: null, score_b: null },

    // ── Runde 3: DANACH (landet in der "Danach"-Leiste) ──
    { id: 'r3a1', phase: 'group', round: 3, position: 1, status: 'pending', table_no: null, team_a: 't1',  team_b: 't4',  score_a: null, score_b: null },
    { id: 'r3a2', phase: 'group', round: 3, position: 2, status: 'pending', table_no: null, team_a: 't2',  team_b: 't3',  score_a: null, score_b: null },
    { id: 'r3b1', phase: 'group', round: 3, position: 3, status: 'pending', table_no: null, team_a: 't5',  team_b: 't8',  score_a: null, score_b: null },
    { id: 'r3b2', phase: 'group', round: 3, position: 4, status: 'pending', table_no: null, team_a: 't6',  team_b: 't7',  score_a: null, score_b: null },
    { id: 'r3c1', phase: 'group', round: 3, position: 5, status: 'pending', table_no: null, team_a: 't9',  team_b: 't12', score_a: null, score_b: null },
    { id: 'r3c2', phase: 'group', round: 3, position: 6, status: 'pending', table_no: null, team_a: 't10', team_b: 't11', score_a: null, score_b: null },
    { id: 'r3d1', phase: 'group', round: 3, position: 7, status: 'pending', table_no: null, team_a: 't13', team_b: 't16', score_a: null, score_b: null },
    { id: 'r3d2', phase: 'group', round: 3, position: 8, status: 'pending', table_no: null, team_a: 't14', team_b: 't15', score_a: null, score_b: null },
  ],
  standings: [
    // Gruppe A  (nach Runde 1: t1 & t3 vorn)
    { team_id: 't1',  group_id: 'g1', group_rank: 1, played: 1, points: 3, cup_diff:  3 },
    { team_id: 't3',  group_id: 'g1', group_rank: 2, played: 1, points: 3, cup_diff:  2 },
    { team_id: 't4',  group_id: 'g1', group_rank: 3, played: 1, points: 0, cup_diff: -2 },
    { team_id: 't2',  group_id: 'g1', group_rank: 4, played: 1, points: 0, cup_diff: -3 },
    // Gruppe B
    { team_id: 't5',  group_id: 'g2', group_rank: 1, played: 1, points: 3, cup_diff:  2 },
    { team_id: 't7',  group_id: 'g2', group_rank: 2, played: 1, points: 3, cup_diff:  1 },
    { team_id: 't8',  group_id: 'g2', group_rank: 3, played: 1, points: 0, cup_diff: -1 },
    { team_id: 't6',  group_id: 'g2', group_rank: 4, played: 1, points: 0, cup_diff: -2 },
    // Gruppe C
    { team_id: 't9',  group_id: 'g3', group_rank: 1, played: 1, points: 3, cup_diff:  4 },
    { team_id: 't11', group_id: 'g3', group_rank: 2, played: 1, points: 3, cup_diff:  3 },
    { team_id: 't12', group_id: 'g3', group_rank: 3, played: 1, points: 0, cup_diff: -3 },
    { team_id: 't10', group_id: 'g3', group_rank: 4, played: 1, points: 0, cup_diff: -4 },
    // Gruppe D  (t15 vorn dank hoher Becher-Differenz)
    { team_id: 't15', group_id: 'g4', group_rank: 1, played: 1, points: 3, cup_diff:  5 },
    { team_id: 't13', group_id: 'g4', group_rank: 2, played: 1, points: 3, cup_diff:  1 },
    { team_id: 't14', group_id: 'g4', group_rank: 3, played: 1, points: 0, cup_diff: -1 },
    { team_id: 't16', group_id: 'g4', group_rank: 4, played: 1, points: 0, cup_diff: -5 },
  ],
};

function formatReveal(ms: number): string {
  if (ms <= 0) return '00:00:00';
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  const ss = String(sec).padStart(2, '0');
  if (d > 0) return `${d} ${d === 1 ? 'Tag' : 'Tage'} · ${hh}:${mm}:${ss}`;
  return `${hh}:${mm}:${ss}`;
}

export default function FestivalTournamentBoard() {
  const { tournament: realTournament, groups: realGroups, teams: realTeams, matches: realMatches, standings: realStandings, loading } = useTournament();
  const { user } = useAuth();

  // Falls in DB vorhanden -> nutze echte Daten; sonst -> MOCK-Daten
  const isMock = !realTournament && !loading;
  const tournament = realTournament ?? (isMock ? MOCK_DATA.tournament : null);
  const groups = realGroups.length > 0 ? realGroups : (isMock ? MOCK_DATA.groups : []);
  const teams = realTeams.length > 0 ? realTeams : (isMock ? MOCK_DATA.teams : []);
  const matches = realMatches.length > 0 ? realMatches : (isMock ? (MOCK_DATA.matches as Match[]) : []);
  const standings = realStandings.length > 0 ? realStandings : (isMock ? MOCK_DATA.standings : []);

  const remaining = useCountdown(tournament?.round_ends_at ?? null);

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const iv = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(iv);
  }, []);

  const isAdmin = !!user && user.id === TOURNAMENT_ADMIN_ID;
  const revealed = isAdmin || now >= REVEAL_AT;
  const revealIn = REVEAL_AT - now;

  const maskMap = useMemo(() => {
    const map = new Map<string, string>();
    [...teams].sort((a, b) => a.id.localeCompare(b.id))
      .forEach((t, i) => map.set(t.id, `Team ${String(i + 1).padStart(2, '0')}`));
    return map;
  }, [teams]);

  const nameOf = (id: string | null) =>
    id ? teams.find((t) => t.id === id)?.name ?? '—' : '—';
  const shownName = (id: string | null) => {
    if (!id) return '—';
    if (revealed) return nameOf(id);
    return maskMap.get(id) ?? 'Team ??';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8 text-cyan-400">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14 }}>Lade Spielplan...</span>
      </div>
    );
  }

  if (!tournament) return null;

  const tableCount = tournament.table_count ?? 3;
  const advance = tournament.advance_per_group ?? 2;
  const hasBracket = groups.length > 0 || matches.length > 0;

  const live = matches
    .filter((m) => m.status === 'live')
    .sort((a, b) => (a.table_no ?? 99) - (b.table_no ?? 99));

  const playablePending = matches
    .filter((m) => m.status === 'pending' && m.team_a && m.team_b)
    .sort((a, b) => a.round - b.round || a.position - b.position);
  const nextUp = playablePending.slice(0, tableCount);
  const laterQueue = playablePending.slice(tableCount, tableCount * 2);

  const koMatches = matches.filter((m) => m.phase === 'ko');
  const koRounds = [...new Set(koMatches.map((m) => m.round))].sort((a, b) => a - b);

  return (
    <section id="turnier" className="relative z-10" style={{ borderTop: '1px solid rgba(200,232,64,0.12)', borderBottom: '1px solid rgba(200,232,64,0.12)' }}>
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-16">

        {/* Demo-Hinweis */}
        {isMock && (
          <div className="mb-6 px-4 py-2 rounded-lg text-center text-xs tracking-wider uppercase font-semibold" style={{ background: 'rgba(0,212,212,0.1)', border: '1px solid rgba(0,212,212,0.3)', color: C.cyan }}>
            💡 Vorschau-Modus (Beispielsdaten)
          </div>
        )}

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

        {/* Reveal-Banner */}
        {!revealed && (
          <div className="rounded-2xl px-6 py-5 mb-6 flex flex-wrap items-center justify-between gap-4"
            style={{ background: 'rgba(200,232,64,0.06)', border: '1px solid rgba(200,232,64,0.28)' }}>
            <div className="flex items-center gap-3">
              <span style={{ fontSize: 22 }}>🔒</span>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: 15, letterSpacing: '0.06em', color: '#fff' }}>
                  Die Teams werden enthüllt am 22.08. um 17:00 Uhr
                </div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: 'rgba(180,210,180,0.6)' }}>
                  Tische, Zeiten &amp; Bracket siehst du schon jetzt — die Namen kommen live.
                </div>
              </div>
            </div>
            <div className="text-right">
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, letterSpacing: '0.04em', color: C.lime, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                {formatReveal(revealIn)}
              </div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(200,232,64,0.55)' }}>
                bis Reveal
              </div>
            </div>
          </div>
        )}

        {/* Rundenzeit */}
        <div className="glass rounded-2xl p-6 text-center mb-6" style={{ border: `1px solid rgba(200,232,64,0.18)` }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '11px', letterSpacing: '0.34em', textTransform: 'uppercase', color: 'rgba(200,232,64,0.7)' }}>
            {tournament.round_ends_at ? (tournament.round_label ?? 'Aktuelle Runde') : 'Pause / Bereit'}
          </div>
          <div className="price-num" style={{
            fontSize: 'clamp(56px, 12vw, 96px)', lineHeight: 1, marginTop: '6px',
            color: tournament.round_ends_at ? (remaining <= 30 ? C.orange : C.lime) : 'rgba(255,255,255,0.25)',
            textShadow: tournament.round_ends_at && remaining > 30 ? `0 0 40px ${C.lime}44` : 'none',
            fontVariantNumeric: 'tabular-nums',
          }}>
            {tournament.round_ends_at ? formatTime(remaining) : '–:––'}
          </div>
        </div>

        {/* JETZT AM TISCH */}
        {live.length > 0 && (
          <div className="mb-8">
            <SubHead>Jetzt am Tisch</SubHead>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {live.map((m) => (
                <MatchCard key={m.id} m={m} nameOf={shownName} highlight
                  tableLabel={m.table_no != null ? `Tisch ${m.table_no}` : undefined} />
              ))}
            </div>
          </div>
        )}

        {/* ALS NÄCHSTES */}
        {nextUp.length > 0 && (
          <div className="mb-8">
            <SubHead>Als Nächstes{live.length === 0 ? '' : ' · nach dieser Runde'}</SubHead>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {nextUp.map((m, i) => (
                <MatchCard key={m.id} m={m} nameOf={shownName}
                  tableLabel={`Tisch ${i + 1}`} upcoming />
              ))}
            </div>
          </div>
        )}

        {/* Gruppen-Tabellen */}
        {groups.length > 0 && (
          <div className="mb-8">
            <SubHead>Gruppen</SubHead>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((g) => {
                const rows = standings.filter((s) => s.group_id === g.id).sort((a, b) => a.group_rank - b.group_rank);
                return (
                  <div key={g.id} className="glass rounded-2xl p-4" style={{ border: '1px solid rgba(0,212,212,0.12)' }}>
                    <div className="graffiti mb-3" style={{ fontSize: '20px', color: '#fff' }}>Gruppe {g.name}</div>
                    <table className="w-full" style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
                      <thead>
                        <tr style={{ color: 'rgba(160,230,230,0.4)', textAlign: 'left' }}>
                          <th className="py-1 font-medium">#</th><th className="font-medium">Team</th>
                          <th className="text-center font-medium">Sp</th><th className="text-center font-medium">Pkt</th><th className="text-center font-medium">Diff</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((s) => {
                          const up = s.group_rank <= advance;
                          return (
                            <tr key={s.team_id} style={{ color: up ? C.lime : 'rgba(255,255,255,0.8)' }}>
                              <td className="py-1.5">{s.group_rank}</td>
                              <td className="truncate" style={{ maxWidth: '120px', fontWeight: up ? 700 : 400 }}>{shownName(s.team_id)}</td>
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

      </div>
    </section>
  );
}

function SubHead({ children }: { children: React.ReactNode }) {
  return <h3 className="graffiti mb-3" style={{ fontSize: '22px', color: '#fff' }}>{children}</h3>;
}

function MatchCard({
  m, nameOf, highlight = false, upcoming = false, tableLabel,
}: { m: Match; nameOf: (id: string | null) => string; highlight?: boolean; upcoming?: boolean; tableLabel?: string }) {
  const done = m.status === 'done';
  const aWins = done && (m.score_a ?? 0) > (m.score_b ?? 0);
  const bWins = done && (m.score_b ?? 0) > (m.score_a ?? 0);
  return (
    <div className="rounded-xl p-3.5" style={{
      background: highlight ? 'rgba(200,232,64,0.06)' : upcoming ? 'rgba(0,212,212,0.04)' : 'rgba(8,12,16,0.6)',
      border: `1px solid ${highlight ? 'rgba(200,232,64,0.4)' : upcoming ? 'rgba(0,212,212,0.22)' : 'rgba(255,255,255,0.07)'}`,
    }}>
      {tableLabel && (
        <div className="mb-2 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5"
          style={{
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 13, letterSpacing: '0.1em',
            color: highlight ? '#08120a' : (upcoming ? C.cyan : '#08120a'),
            background: highlight ? C.lime : (upcoming ? 'rgba(0,212,212,0.12)' : C.lime),
            border: upcoming ? '1px solid rgba(0,212,212,0.3)' : 'none',
          }}>
          🏓 {tableLabel}
        </div>
      )}
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
    setup: { bg: 'rgba(255,255,255,0.06)', col: 'rgba(255,255,255,0.6)', label: 'In Vorbereitung' },
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