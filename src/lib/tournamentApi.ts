// src/lib/tournamentApi.ts
import { supabase } from './supabase';

export const TOURNAMENT_ADMIN_ID = '58479fa0-b070-4ac8-8cdc-dcf451b086bd';

export async function createTournament(p: {
  name: string; table_count: number; advance_per_group: number;
  group_round_seconds: number; ko_round_seconds: number;
}): Promise<string> {
  const { data, error } = await supabase
    .from('tournaments').insert({ ...p, status: 'setup' }).select('id').single();
  if (error) throw error;
  return data!.id as string;
}

export async function addTeams(tournamentId: string, names: string[]): Promise<void> {
  const rows = names
    .map((n) => n.trim())
    .filter(Boolean)
    .map((name) => ({ tournament_id: tournamentId, name }));
  if (rows.length === 0) return;
  const { error } = await supabase.from('teams').insert(rows);
  if (error) throw error;
}

export async function syncBierpongTeams(tournamentId: string): Promise<number> {
  const { data, error } = await supabase.rpc('sync_bierpong_teams', { p_tournament: tournamentId });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function deleteTeam(id: string): Promise<void> {
  const { error } = await supabase.from('teams').delete().eq('id', id);
  if (error) throw error;
}

export async function drawGroups(id: string): Promise<void> {
  const { error } = await supabase.rpc('draw_groups_and_schedule', { p_tournament: id });
  if (error) throw error;
}

export async function startNextWave(id: string): Promise<number> {
  const { data, error } = await supabase.rpc('start_next_wave', { p_tournament: id });
  if (error) throw error;
  return (data as number) ?? 0;
}

export async function submitResult(matchId: string, a: number, b: number): Promise<void> {
  const { error } = await supabase.rpc('submit_result', {
    p_match_id: matchId, p_score_a: a, p_score_b: b,
  });
  if (error) throw error;
}

export async function generateKo(id: string): Promise<void> {
  const { error } = await supabase.rpc('generate_ko_bracket', { p_tournament: id });
  if (error) throw error;
}

export async function setTableCount(id: string, n: number): Promise<void> {
  const { error } = await supabase.from('tournaments').update({ table_count: n }).eq('id', id);
  if (error) throw error;
}

export async function adjustTimer(id: string, currentEndsAt: string | null, deltaSec: number): Promise<void> {
  const base = currentEndsAt ? new Date(currentEndsAt).getTime() : Date.now();
  const next = new Date(base + deltaSec * 1000).toISOString();
  const { error } = await supabase.from('tournaments').update({ round_ends_at: next }).eq('id', id);
  if (error) throw error;
}

export async function stopTimer(id: string): Promise<void> {
  const { error } = await supabase.from('tournaments').update({ round_ends_at: null }).eq('id', id);
  if (error) throw error;
}

export async function finishTournament(id: string): Promise<void> {
  const { error } = await supabase
    .from('tournaments').update({ status: 'done', round_ends_at: null }).eq('id', id);
  if (error) throw error;
}