// src/components/festival/FestivalTournamentBoard.tsx
// Read-only Live-Tableau. Zeigt Rundenzeit, laufende Spiele mit Tisch-Nr.
// und die nächsten Teams mit (vorhergesagter) Tisch-Nr.
// Teamnamen maskiert bis REVEAL_AT — außer für den eingeloggten Admin.
import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useTournament, type Match } from '../../hooks/useTournament';
import { useCountdown, formatTime } from '../../hooks/useCountdown';
import { useAuth } from '../../contexts/AuthContext';
import { TOURNAMENT_ADMIN_ID } from '../../lib/tournamentApi';

const REVEAL_AT = new Date('2026-08-22T17:00:00').getTime();

const C = { cyan: '#00d4d4', lime: '#c8e840', orange: '#f07820', sky: '#4dc8e8' };

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
  const { tournament, groups, teams, matches, standings, loading } = useTournament();
  const remaining = useCountdown(tournament?.round_ends_at ?? null);
  const { user } = useAuth();

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

  if (loading || !tournament) return null;

  const tableCount = tournament.table_count ?? 3;
  const advance = tournament.advance_per_group ?? 2;
  const hasBracket = groups.length > 0 || matches.length > 0;

  // Laufende Spiele: nach echter Tisch-Nr. sortiert
  const live = matches
    .filter((m) => m.status === 'live')
    .sort((a, b) => (a.table_no ?? 99) - (b.table_no ?? 99));

  // Globale Warteschlange spielbereiter Spiele (aktuelle Phase), Reihenfolge = Startreihenfolge
  const playablePending = matches
    .filter((m) => m.status === 'pending' && m.team_a && m.team_b)
    .sort((a, b) => a.round - b.round || a.position - b.position);
  const nextUp = playablePending.slice(0, tableCount);      // Tisch 1..N (Vorschau)
  const laterQueue = playablePending.slice(tableCount, tableCount * 2);

  const koMatches = matches.filter((m) => m.phase === 'ko');
  const koRounds = [...new Set(koMatches.map((m) => m.round))].sort((a, b) => a - b);

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

        {/* Reveal-Banner (Nicht-Admins vor 17:00) */}
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

        {isAdmin && now < REVEAL_AT && (
          <div className="rounded-xl px-4 py-3 mb-6 flex items-center gap-2"
            style={{ background: 'rgba(0,212,212,0.06)', border: '1px solid rgba(0,212,212,0.22)' }}>
            <span style={{ fontSize: 15 }}>👁</span>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12.5, color: 'rgba(160,230,230,0.75)' }}>
              Admin-Ansicht — du siehst alle Namen. Öffentlich verborgen bis 22.08. 17:00.
            </span>
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
          {tournament.round_ends_at && remaining === 0 && (
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '14px', color: C.orange, marginTop: '4px' }}>
              Zeit abgelaufen
            </div>
          )}
        </div>

        {!hasBracket && (
          <div className="glass rounded-2xl p-8 text-center" style={{ border: '1px solid rgba(0,212,212,0.12)' }}>
            <div className="graffiti" style={{ fontSize: 24, color: '#fff', marginBottom: 6 }}>Die Auslosung folgt</div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: 'rgba(160,230,230,0.55)' }}>
              Sobald die Teams gesetzt sind, erscheinen hier Tische, Gruppen und Bracket.
            </p>
          </div>
        )}

        {/* JETZT AM TISCH (laufende Spiele mit echter Tisch-Nr.) */}
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

        {/* ALS NÄCHSTES (nächste N Spiele, vorhergesagte Tisch-Nr.) */}
        {nextUp.length > 0 && (
          <div className="mb-8">
            <SubHead>Als Nächstes{live.length === 0 ? '' : ' · nach dieser Runde'}</SubHead>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {nextUp.map((m, i) => (
                <MatchCard key={m.id} m={m} nameOf={shownName}
                  tableLabel={`Tisch ${i + 1}`} upcoming />
              ))}
            </div>
            {laterQueue.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(160,230,230,0.4)' }}>Danach:</span>
                {laterQueue.map((m) => (
                  <span key={m.id} className="rounded-full px-3 py-1"
                    style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {shownName(m.team_a)} vs {shownName(m.team_b)}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Gruppen-Tabellen */}
        {groups.length > 0 && (
          <div className="mb-8">
            <SubHead>Gruppen</SubHead>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {groups.map((g) => {
                const rows = standings.filter((s) => s.group_id === g.id).sort((a, b) => a.group_rank - b.group_rank);
                const teamsInGroup = teams.filter((t) => t.group_id === g.id).sort((a, b) => a.id.localeCompare(b.id));
                return (
                  <div key={g.id} className="glass rounded-2xl p-4" style={{ border: '1px solid rgba(0,212,212,0.12)' }}>
                    <div className="graffiti mb-3" style={{ fontSize: '20px', color: '#fff' }}>Gruppe {g.name}</div>
                    {rows.length > 0 ? (
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
                    ) : (
                      <div className="space-y-1.5">
                        {teamsInGroup.map((t) => (
                          <div key={t.id} className="flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: 13.5, color: 'rgba(255,255,255,0.8)' }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(200,232,64,0.5)', flexShrink: 0 }} />
                            <span className="truncate">{shownName(t.id)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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
                    {col.map((m) => (
                      <MatchCard key={m.id} m={m} nameOf={shownName} highlight={m.status === 'live'}
                        tableLabel={m.status === 'live' && m.table_no != null ? `Tisch ${m.table_no}` : undefined} />
                    ))}
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