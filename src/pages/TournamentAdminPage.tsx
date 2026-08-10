// src/pages/TournamentAdminPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTournament, type Match } from '../hooks/useTournament';
import { useCountdown, formatTime } from '../hooks/useCountdown';
import {
  TOURNAMENT_ADMIN_ID, createTournament, addTeams, deleteTeam, drawGroups,
  startNextWave, submitResult, generateKo, setTableCount, adjustTimer, stopTimer,
} from '../lib/tournamentApi';

export default function TournamentAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const { tournament, groups, teams, matches, loading, reload } = useTournament();
  const remaining = useCountdown(tournament?.round_ends_at ?? null);

  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Create-Form
  const [name, setName] = useState('Bierpong-Turnier');
  const [tableCount, setTC] = useState(3);
  const [advance, setAdvance] = useState(2);
  const [groupSec, setGroupSec] = useState(600);
  const [koSec, setKoSec] = useState(780);
  const [teamText, setTeamText] = useState('');

  // Score-Inputs
  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthorized(data.user?.id === TOURNAMENT_ADMIN_ID);
    });
  }, []);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true); setMsg(null);
    try { await fn(); if (ok) setMsg(ok); await reload(); }
    catch (e: any) { setMsg('⚠ ' + (e?.message ?? 'Fehler')); }
    finally { setBusy(false); }
  };

  const nameOf = (id: string | null) =>
    id ? teams.find((t) => t.id === id)?.name ?? '—' : '—';

  if (authorized === null) return <Gate>Prüfe Berechtigung…</Gate>;
  if (!authorized) return <Gate>Kein Zugriff. Bitte als Admin einloggen.</Gate>;
  if (loading) return <Gate>Lädt…</Gate>;

  const live = matches.filter((m) => m.status === 'live');
  const groupPending = matches.filter((m) => m.phase === 'group' && m.status === 'pending');
  const groupAllDone =
    matches.some((m) => m.phase === 'group') &&
    matches.filter((m) => m.phase === 'group').every((m) => m.status === 'done');
  const koExists = matches.some((m) => m.phase === 'ko');
  const canStartWave =
    (tournament?.status === 'group_stage' || tournament?.status === 'ko_stage') &&
    live.length === 0;

  const needSetup = !tournament || tournament.status === 'setup';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Turnier-Admin</h1>
          {tournament && <span className="text-sm text-slate-400">{tournament.name}</span>}
        </div>

        {msg && (
          <div className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm">
            {msg}
          </div>
        )}

        {/* ---------- SETUP ---------- */}
        {needSetup && (
          <section className="space-y-4 rounded-2xl bg-slate-900 border border-slate-800 p-5">
            <h2 className="font-semibold">1 · Turnier anlegen</h2>
            <Field label="Name">
              <input className={inp} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tische (live änderbar)">
                <input type="number" min={1} className={inp} value={tableCount}
                  onChange={(e) => setTC(+e.target.value)} />
              </Field>
              <Field label="Aufsteiger pro Gruppe">
                <input type="number" min={1} className={inp} value={advance}
                  onChange={(e) => setAdvance(+e.target.value)} />
              </Field>
              <Field label="Gruppenspiel (Sek.)">
                <input type="number" min={60} step={30} className={inp} value={groupSec}
                  onChange={(e) => setGroupSec(+e.target.value)} />
              </Field>
              <Field label="KO-Spiel (Sek.)">
                <input type="number" min={60} step={30} className={inp} value={koSec}
                  onChange={(e) => setKoSec(+e.target.value)} />
              </Field>
            </div>
            {!tournament && (
              <button className={btn} disabled={busy}
                onClick={() => run(async () => {
                  await createTournament({
                    name, table_count: tableCount, advance_per_group: advance,
                    group_round_seconds: groupSec, ko_round_seconds: koSec,
                  });
                }, 'Turnier angelegt.')}>
                Turnier erstellen
              </button>
            )}

            {tournament && (
              <>
                <h2 className="pt-2 font-semibold">2 · Teams (eine pro Zeile)</h2>
                <textarea rows={6} className={inp} value={teamText}
                  onChange={(e) => setTeamText(e.target.value)}
                  placeholder={'Team Alpha\nTeam Bravo\n…'} />
                <button className={btn} disabled={busy}
                  onClick={() => run(async () => {
                    await addTeams(tournament.id, teamText.split('\n'));
                    setTeamText('');
                  }, 'Teams hinzugefügt.')}>
                  Teams speichern
                </button>

                {teams.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {teams.map((t) => (
                      <span key={t.id}
                        className="flex items-center gap-1 rounded-full bg-slate-800 px-3 py-1 text-sm">
                        {t.name}
                        <button className="text-slate-500 hover:text-red-400"
                          onClick={() => run(() => deleteTeam(t.id))}>✕</button>
                      </span>
                    ))}
                  </div>
                )}

                <button className={btnPrimary} disabled={busy || teams.length < 2}
                  onClick={() => run(() => drawGroups(tournament.id),
                    'Gruppen ausgelost & Spielplan erstellt.')}>
                  3 · Gruppen auslosen & Spielplan erstellen ({teams.length} Teams)
                </button>
              </>
            )}
          </section>
        )}

        {/* ---------- LIVE-STEUERUNG ---------- */}
        {tournament && (tournament.status === 'group_stage' || tournament.status === 'ko_stage') && (
          <>
            <section className="rounded-2xl bg-slate-900 border border-slate-800 p-5 text-center">
              <div className="text-sm uppercase tracking-widest text-slate-400">
                {tournament.round_label ?? 'Bereit'}
              </div>
              <div className={`font-mono text-5xl font-bold tabular-nums ${
                tournament.round_ends_at
                  ? remaining <= 30 ? 'text-red-400' : 'text-emerald-400'
                  : 'text-slate-600'}`}>
                {tournament.round_ends_at ? formatTime(remaining) : '–:––'}
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <button className={btnPrimary} disabled={busy || !canStartWave}
                  onClick={() => run(async () => {
                    const n = await startNextWave(tournament.id);
                    setMsg(`${n} Spiel(e) gestartet.`);
                  })}>
                  ▶ Nächste Welle starten
                </button>
                <button className={btn} disabled={busy || !tournament.round_ends_at}
                  onClick={() => run(() => adjustTimer(tournament.id, tournament.round_ends_at, 60))}>
                  +1 min
                </button>
                <button className={btn} disabled={busy || !tournament.round_ends_at}
                  onClick={() => run(() => adjustTimer(tournament.id, tournament.round_ends_at, 120))}>
                  +2 min
                </button>
                <button className={btn} disabled={busy || !tournament.round_ends_at}
                  onClick={() => run(() => adjustTimer(tournament.id, tournament.round_ends_at, -60))}>
                  −1 min
                </button>
                <button className={btn} disabled={busy || !tournament.round_ends_at}
                  onClick={() => run(() => stopTimer(tournament.id))}>
                  ■ Timer stoppen
                </button>
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-sm">
                <span className="text-slate-400">Tische:</span>
                {[2, 3, 4, 5].map((n) => (
                  <button key={n} disabled={busy}
                    className={`rounded px-3 py-1 ${
                      tournament.table_count === n
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-800 text-slate-300'}`}
                    onClick={() => run(() => setTableCount(tournament.id, n))}>
                    {n}
                  </button>
                ))}
              </div>
              {!canStartWave && live.length > 0 && (
                <p className="mt-3 text-sm text-amber-300">
                  Erst alle laufenden Ergebnisse eintragen, dann nächste Welle.
                </p>
              )}
            </section>

            {/* Laufende Spiele -> Ergebnis */}
            {live.length > 0 && (
              <section className="space-y-3">
                <h2 className="font-semibold">Ergebnisse eintragen</h2>
                {live.map((m) => {
                  const s = scores[m.id] ?? { a: '', b: '' };
                  return (
                    <div key={m.id}
                      className="rounded-xl bg-slate-900 border border-slate-800 p-4">
                      <div className="mb-2 text-xs text-slate-400">{m.label ?? 'Gruppe'}</div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div className="text-right truncate">{nameOf(m.team_a)}</div>
                        <div className="flex items-center gap-2">
                          <input type="number" min={0} className={`${inp} w-16 text-center`}
                            value={s.a}
                            onChange={(e) =>
                              setScores({ ...scores, [m.id]: { ...s, a: e.target.value } })} />
                          <span>:</span>
                          <input type="number" min={0} className={`${inp} w-16 text-center`}
                            value={s.b}
                            onChange={(e) =>
                              setScores({ ...scores, [m.id]: { ...s, b: e.target.value } })} />
                        </div>
                        <div className="truncate">{nameOf(m.team_b)}</div>
                      </div>
                      <button className={`${btnPrimary} mt-3 w-full`} disabled={busy}
                        onClick={() => run(async () => {
                          await submitResult(m.id, Number(s.a), Number(s.b));
                          const next = { ...scores }; delete next[m.id]; setScores(next);
                        }, 'Ergebnis gespeichert.')}>
                        Eintragen
                      </button>
                      {m.phase === 'ko' && (
                        <p className="mt-2 text-xs text-amber-300">
                          KO: bei Gleichstand Sudden Death spielen, dann Sieger +1 eintragen.
                        </p>
                      )}
                    </div>
                  );
                })}
              </section>
            )}

            {/* Übergang zum KO */}
            {tournament.status === 'group_stage' && groupAllDone && !koExists && (
              <button className={`${btnPrimary} w-full`} disabled={busy}
                onClick={() => run(() => generateKo(tournament.id),
                  'KO-Bracket erstellt.')}>
                Gruppenphase fertig → KO-Bracket erstellen
              </button>
            )}
            {tournament.status === 'group_stage' && (
              <p className="text-center text-sm text-slate-400">
                Offene Gruppenspiele: {groupPending.length}
              </p>
            )}
          </>
        )}

        {tournament?.status === 'done' && (
          <div className="rounded-2xl bg-emerald-900/30 border border-emerald-700 p-6 text-center text-xl font-bold text-emerald-300">
            🏆 Turnier beendet
          </div>
        )}

        {tournament && (
          <p className="text-center text-xs text-slate-500">
            Öffentliches Tableau: <code>/#/turnier/{tournament.id}</code>
          </p>
        )}
      </div>
    </div>
  );
}

const inp =
  'w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500';
const btn =
  'rounded-lg bg-slate-800 border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-40';
const btnPrimary =
  'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm text-slate-400">{label}</span>
      {children}
    </label>
  );
}
function Gate({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
      {children}
    </div>
  );
}