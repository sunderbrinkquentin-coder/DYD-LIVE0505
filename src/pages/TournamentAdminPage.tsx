// src/pages/TournamentAdminPage.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useTournament } from '../hooks/useTournament';
import { useCountdown, formatTime } from '../hooks/useCountdown';
import {
  TOURNAMENT_ADMIN_ID, createTournament, addTeams, syncBierpongTeams, deleteTeam, drawGroups,
  startNextWave, submitResult, generateKo, setTableCount, adjustTimer, stopTimer,
} from '../lib/tournamentApi';

export default function TournamentAdminPage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const { tournament, teams, matches, loading, reload } = useTournament();
  const remaining = useCountdown(tournament?.round_ends_at ?? null);

  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Formulare
  const [name, setName] = useState('Bierpong-Turnier');
  const [tableCount, setTC] = useState(3);
  const [advance, setAdvance] = useState(2);
  const [groupSec, setGroupSec] = useState(600);
  const [koSec, setKoSec] = useState(780);
  const [singleTeamInput, setSingleTeamInput] = useState('');

  const [scores, setScores] = useState<Record<string, { a: string; b: string }>>({});

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthorized(data.user?.id === TOURNAMENT_ADMIN_ID);
    });
  }, []);

  const run = async (fn: () => Promise<unknown>, ok?: string) => {
    setBusy(true); setMsg(null);
    try { await fn(); if (ok) setMsg(ok); await reload(); }
    catch (e: any) { setMsg('⚠ ' + (e?.message ?? 'Fehler: ' + e.toString())); }
    finally { setBusy(false); }
  };

  const nameOf = (id: string | null) =>
    id ? teams.find((t) => t.id === id)?.name ?? '—' : '—';

  // 🗑️ Turnier löschen
  const handleDeleteTournament = async () => {
    if (!tournament) return;
    if (!window.confirm('⚠️ Turniere & alle Spiele unwiderruflich LÖSCHEN?')) return;

    run(async () => {
      const { error } = await supabase.from('tournaments').delete().eq('id', tournament.id);
      if (error) throw error;
    }, 'Turnier gelöscht.');
  };

  // 🔄 Status zurücksetzen
  const handleResetToSetup = async () => {
    if (!tournament) return;
    if (!window.confirm('Turnier zurück auf Setup stellen? (Teams bleiben erhalten)')) return;

    run(async () => {
      const { error } = await supabase.from('tournaments').update({ status: 'setup' }).eq('id', tournament.id);
      if (error) throw error;
    }, 'Turnier zurück auf Setup gestellt.');
  };

  if (authorized === null) return <Gate>Prüfe Berechtigung…</Gate>;
  if (!authorized) return <Gate>Kein Zugriff. Bitte als Admin einloggen.</Gate>;
  if (loading) return <Gate>Lädt…</Gate>;

  // Kategorisierung der Partien
  const live = matches.filter((m) => m.status === 'live').sort((a, b) => (a.table_no ?? 99) - (b.table_no ?? 99));
  const pendingMatches = matches.filter((m) => m.status === 'pending');
  const doneMatches = matches.filter((m) => m.status === 'done').sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''));

  const groupAllDone = matches.some((m) => m.phase === 'group') && matches.filter((m) => m.phase === 'group').every((m) => m.status === 'done');
  const koExists = matches.some((m) => m.phase === 'ko');
  const canStartWave = (tournament?.status === 'group_stage' || tournament?.status === 'ko_stage') && live.length === 0 && pendingMatches.length > 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* HEADER & COCKPIT-STEUERUNG */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div>
            <h1 className="text-3xl font-black text-white">🏓 Turnier-Cockpit</h1>
            <p className="text-xs text-slate-400 mt-1">
              Status: <span className="text-emerald-400 uppercase font-bold">{tournament?.status ?? 'Kein Turnier aktiv'}</span>
            </p>
          </div>

          {tournament && (
            <div className="flex gap-2">
              {tournament.status !== 'setup' && (
                <button onClick={handleResetToSetup} disabled={busy} className="text-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/20">
                  ↩ Reset auf Setup
                </button>
              )}
              <button onClick={handleDeleteTournament} disabled={busy} className="text-xs bg-red-500/10 text-red-400 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20">
                🗑️ Turnier Löschen
              </button>
            </div>
          )}
        </div>

        {msg && (
          <div className="rounded-xl bg-slate-900 border border-emerald-500/40 px-4 py-3 text-sm text-emerald-300">
            {msg}
          </div>
        )}

        {/* 1️⃣ TURNIER INITIALISIEREN */}
        {!tournament && (
          <section className="space-y-4 rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <h2 className="text-xl font-bold text-white">Neues Turnier starten</h2>
            <Field label="Turniername">
              <input className={inp} value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Tische"><input type="number" min={1} className={inp} value={tableCount} onChange={(e) => setTC(+e.target.value)} /></Field>
              <Field label="Aufsteiger/Gruppe"><input type="number" min={1} className={inp} value={advance} onChange={(e) => setAdvance(+e.target.value)} /></Field>
            </div>
            <button className={`${btnPrimary} w-full py-3`} disabled={busy}
              onClick={() => run(async () => {
                await createTournament({
                  name, table_count: tableCount, advance_per_group: advance,
                  group_round_seconds: groupSec, ko_round_seconds: koSec,
                });
              }, 'Turnier angelegt.')}>
              Turnier anlegen
            </button>
          </section>
        )}

        {/* 2️⃣ TEAMS MANAGEN (JEDERZEIT NEUE TEAMS HINZUFÜGEN) */}
        {tournament && (
          <section className="space-y-4 rounded-2xl bg-slate-900 border border-slate-800 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Teams verwalten ({teams.length})</h2>
              <button className={`${btn} text-xs`} disabled={busy}
                onClick={() => run(async () => {
                  const n = await syncBierpongTeams(tournament.id);
                  setMsg(n > 0 ? `${n} Teams importiert.` : 'Keine neuen Teams.');
                })}>
                ⤵ Tickets importieren
              </button>
            </div>

            {/* Eingabe für neue Teams (Auch während des laufenden Turniers!) */}
            <div className="flex gap-2">
              <input
                className={inp}
                value={singleTeamInput}
                onChange={(e) => setSingleTeamInput(e.target.value)}
                placeholder="Teamname eingeben (auch Spätankömmlinge)..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && singleTeamInput.trim()) {
                    e.preventDefault();
                    run(async () => {
                      await addTeams(tournament.id, [singleTeamInput.trim()]);
                      setSingleTeamInput('');
                    }, 'Neues Team hinzugefügt.');
                  }
                }}
              />
              <button
                className={`${btnPrimary} whitespace-nowrap`}
                disabled={busy || !singleTeamInput.trim()}
                onClick={() => run(async () => {
                  await addTeams(tournament.id, [singleTeamInput.trim()]);
                  setSingleTeamInput('');
                }, 'Neues Team hinzugefügt.')}
              >
                + Team Hinzufügen
              </button>
            </div>

            {/* Teamliste */}
            {teams.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2 max-h-40 overflow-y-auto">
                {teams.map((t) => (
                  <div key={t.id} className="flex items-center justify-between gap-1 rounded-lg bg-slate-800 px-3 py-1.5 text-xs">
                    <span className="truncate">{t.name}</span>
                    <button className="text-slate-500 hover:text-red-400" onClick={() => run(() => deleteTeam(t.id))}>✕</button>
                  </div>
                ))}
              </div>
            )}

            {tournament.status === 'setup' && (
              <button className={`${btnPrimary} w-full py-3 mt-4 text-base font-bold`} disabled={busy || teams.length < 2}
                onClick={() => run(() => drawGroups(tournament.id), 'Gruppen ausgelost & Spielplan erstellt!')}>
                🎲 3 · Gruppen auslosen & Turnier starten ({teams.length} Teams)
              </button>
            )}
          </section>
        )}

        {/* 3️⃣ LIVE STEUERUNG & TIMER */}
        {tournament && (tournament.status === 'group_stage' || tournament.status === 'ko_stage') && (
          <>
            <section className="rounded-2xl bg-slate-900 border border-slate-800 p-6 text-center space-y-4">
              <div className="text-xs uppercase tracking-widest text-slate-400 font-bold">
                {tournament.round_label ?? 'Bereit für Welle'}
              </div>
              <div className={`font-mono text-6xl font-black tabular-nums ${
                tournament.round_ends_at ? (remaining <= 30 ? 'text-red-400' : 'text-emerald-400') : 'text-slate-600'}`}>
                {tournament.round_ends_at ? formatTime(remaining) : '–:––'}
              </div>

              <div className="flex flex-wrap justify-center gap-2">
                <button className={`${btnPrimary} py-2.5 px-6 font-bold`} disabled={busy || !canStartWave}
                  onClick={() => run(async () => {
                    const n = await startNextWave(tournament.id);
                    setMsg(`${n} Spiel(e) ohne Team-Doppelbelegung gestartet.`);
                  })}>
                  ▶ Nächste Welle starten ({pendingMatches.length} Ausstehend)
                </button>
                <button className={btn} disabled={busy || !tournament.round_ends_at} onClick={() => run(() => adjustTimer(tournament.id, tournament.round_ends_at, 60))}>+1 min</button>
                <button className={btn} disabled={busy || !tournament.round_ends_at} onClick={() => run(() => adjustTimer(tournament.id, tournament.round_ends_at, -60))}>−1 min</button>
                <button className={btn} disabled={busy || !tournament.round_ends_at} onClick={() => run(() => stopTimer(tournament.id))}>■ Stoppen</button>
              </div>

              <div className="flex items-center justify-center gap-2 text-xs pt-2">
                <span className="text-slate-400">Tische:</span>
                {[2, 3, 4, 5, 6].map((n) => (
                  <button key={n} disabled={busy}
                    className={`rounded px-2.5 py-1 ${tournament.table_count === n ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300'}`}
                    onClick={() => run(() => setTableCount(tournament.id, n))}>{n}</button>
                ))}
              </div>
            </section>

            {/* LIVE ERGEBNISSE EINTRAGEN */}
            {live.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse"></span>
                  Laufende Spiele ({live.length})
                </h2>
                {live.map((m) => {
                  const s = scores[m.id] ?? { a: '', b: '' };
                  return (
                    <div key={m.id} className="rounded-xl bg-slate-900 border border-slate-800 p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        {m.table_no != null && <span className="rounded bg-emerald-600 px-2 py-0.5 font-bold text-white">Tisch {m.table_no}</span>}
                        <span className="text-slate-400">{m.label ?? 'Gruppe'}</span>
                      </div>
                      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                        <div className="text-right font-semibold truncate text-emerald-300">{nameOf(m.team_a)}</div>
                        <div className="flex items-center gap-2">
                          <input type="number" min={0} className={`${inp} w-14 text-center text-base`} value={s.a} onChange={(e) => setScores({ ...scores, [m.id]: { ...s, a: e.target.value } })} />
                          <span>:</span>
                          <input type="number" min={0} className={`${inp} w-14 text-center text-base`} value={s.b} onChange={(e) => setScores({ ...scores, [m.id]: { ...s, b: e.target.value } })} />
                        </div>
                        <div className="font-semibold truncate text-emerald-300">{nameOf(m.team_b)}</div>
                      </div>
                      <button className={`${btnPrimary} w-full py-2`} disabled={busy || s.a === '' || s.b === ''}
                        onClick={() => run(async () => {
                          await submitResult(m.id, Number(s.a), Number(s.b));
                          const next = { ...scores }; delete next[m.id]; setScores(next);
                        }, 'Ergebnis gespeichert.')}>
                        Ergebnis Eintragen
                      </button>
                    </div>
                  );
                })}
              </section>
            )}

            {/* 🔮 VORSCHAU AUF DIE NÄCHSTE RUNDE / PENDING MATCHES */}
            {pendingMatches.length > 0 && (
              <section className="space-y-3 pt-4 border-t border-slate-800">
                <h2 className="text-lg font-bold text-slate-300">Nächste Runden / Ausstehende Spiele ({pendingMatches.length})</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {pendingMatches.map((m) => (
                    <div key={m.id} className="flex items-center justify-between rounded-lg bg-slate-900/60 border border-slate-800 p-2.5 text-xs text-slate-400">
                      <span className="truncate flex-1 text-right">{nameOf(m.team_a)}</span>
                      <span className="px-2 font-bold text-slate-600">vs</span>
                      <span className="truncate flex-1 text-left">{nameOf(m.team_b)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* KO-PHASE GENERIEREN */}
            {tournament.status === 'group_stage' && groupAllDone && !koExists && (
              <button className={`${btnPrimary} w-full py-4 text-lg font-bold bg-amber-600 hover:bg-amber-500`} disabled={busy}
                onClick={() => run(() => generateKo(tournament.id), 'KO-Bracket erstellt.')}>
                🏆 Alle Gruppenspiele fertig! → KO-Bracket erstellen
              </button>
            )}
          </>
        )}

        {/* 4️⃣ EINGETRAGENE ERGEBNISSE BEARBEITEN / KORRIGIEREN */}
        {doneMatches.length > 0 && (
          <section className="space-y-3 pt-4 border-t border-slate-800">
            <h2 className="text-lg font-bold text-slate-400">Gespielte Partien / Korrekturen ({doneMatches.length})</h2>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {doneMatches.map((m) => {
                const s = scores[m.id] ?? { a: String(m.score_a ?? 0), b: String(m.score_b ?? 0) };
                return (
                  <div key={m.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-900/40 border border-slate-800/80 p-2.5 text-xs">
                    <span className="text-slate-500 w-16 truncate">{m.phase === 'ko' ? 'KO' : 'Gruppe'}</span>
                    <div className="flex-1 flex items-center justify-center gap-2">
                      <span className="font-medium text-right flex-1 truncate text-slate-300">{nameOf(m.team_a)}</span>
                      <input type="number" min={0} className="w-10 rounded bg-slate-800 text-center py-0.5 text-slate-100" value={s.a} onChange={(e) => setScores({ ...scores, [m.id]: { ...s, a: e.target.value } })} />
                      <span className="text-slate-500">:</span>
                      <input type="number" min={0} className="w-10 rounded bg-slate-800 text-center py-0.5 text-slate-100" value={s.b} onChange={(e) => setScores({ ...scores, [m.id]: { ...s, b: e.target.value } })} />
                      <span className="font-medium flex-1 truncate text-slate-300">{nameOf(m.team_b)}</span>
                    </div>
                    <button className="bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded text-slate-300" disabled={busy}
                      onClick={() => run(() => submitResult(m.id, Number(s.a), Number(s.b)), 'Ergebnis korrigiert.')}>
                      Korr.
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

      </div>
    </div>
  );
}

const inp = 'w-full rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-slate-100 outline-none focus:border-emerald-500 text-sm';
const btn = 'rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm font-medium hover:bg-slate-700 disabled:opacity-40';
const btnPrimary = 'rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-40';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs text-slate-400 font-medium">{label}</span>
      {children}
    </label>
  );
}

function Gate({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">{children}</div>
  );
}