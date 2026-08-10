// src/hooks/useTournament.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export type TournamentStatus = 'setup' | 'group_stage' | 'ko_stage' | 'done';
export type MatchPhase = 'group' | 'ko';
export type MatchStatus = 'pending' | 'live' | 'done';

export interface Tournament {
  id: string; name: string; status: TournamentStatus;
  table_count: number; advance_per_group: number;
  group_round_seconds: number; ko_round_seconds: number;
  round_ends_at: string | null; round_label: string | null;
  created_at: string;
}
export interface Group { id: string; tournament_id: string; name: string; sort_order: number; }
export interface Team { id: string; tournament_id: string; name: string; group_id: string | null; }
export interface Match {
  id: string; tournament_id: string; phase: MatchPhase; group_id: string | null;
  round: number; position: number;
  team_a: string | null; team_b: string | null;
  score_a: number | null; score_b: number | null;
  status: MatchStatus; winner: string | null;
  next_match_id: string | null; next_slot: 'a' | 'b' | null; label: string | null;
}
export interface Standing {
  tournament_id: string; group_id: string; team_id: string; team_name: string;
  points: number; played: number; won: number; drawn: number; lost: number;
  cups_for: number; cups_against: number; cup_diff: number; group_rank: number;
}

export function useTournament(tournamentId?: string) {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [groups, setGroups] = useState<Group[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const idRef = useRef<string | undefined>(tournamentId);
  const debounceRef = useRef<number | undefined>(undefined);

  const resolveId = useCallback(async (): Promise<string | undefined> => {
    if (tournamentId) return tournamentId;
    const { data } = await supabase
      .from('tournaments').select('id')
      .order('created_at', { ascending: false }).limit(1);
    return data?.[0]?.id;
  }, [tournamentId]);

  const load = useCallback(async () => {
    try {
      const id = idRef.current ?? (await resolveId());
      if (!id) { setLoading(false); return; }
      idRef.current = id;
      const [t, g, tm, m, s] = await Promise.all([
        supabase.from('tournaments').select('*').eq('id', id).single(),
        supabase.from('groups').select('*').eq('tournament_id', id).order('sort_order'),
        supabase.from('teams').select('*').eq('tournament_id', id).order('name'),
        supabase.from('matches').select('*').eq('tournament_id', id)
          .order('round').order('position'),
        supabase.from('group_standings').select('*').eq('tournament_id', id).order('group_rank'),
      ]);
      if (t.error) throw t.error;
      setTournament(t.data as Tournament);
      setGroups((g.data ?? []) as Group[]);
      setTeams((tm.data ?? []) as Team[]);
      setMatches((m.data ?? []) as Match[]);
      setStandings((s.data ?? []) as Standing[]);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, [resolveId]);

  const scheduleReload = useCallback(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => { void load(); }, 150);
  }, [load]);

  useEffect(() => { idRef.current = tournamentId; void load(); }, [tournamentId, load]);

  useEffect(() => {
    let active = true;
    let channel: ReturnType<typeof supabase.channel> | null = null;
    (async () => {
      const id = idRef.current ?? (await resolveId());
      if (!id || !active) return;
      idRef.current = id;
      channel = supabase
        .channel(`tournament:${id}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'matches',     filter: `tournament_id=eq.${id}` }, scheduleReload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments', filter: `id=eq.${id}` }, scheduleReload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'teams',       filter: `tournament_id=eq.${id}` }, scheduleReload)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'groups',      filter: `tournament_id=eq.${id}` }, scheduleReload)
        .subscribe();
    })();
    return () => {
      active = false;
      if (channel) supabase.removeChannel(channel);
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [resolveId, scheduleReload]);

  return {
    tournamentId: idRef.current,
    tournament, groups, teams, matches, standings,
    loading, error, reload: load,
  };
}