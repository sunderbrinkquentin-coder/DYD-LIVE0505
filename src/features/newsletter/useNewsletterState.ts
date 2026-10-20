// src/features/newsletter/useNewsletterState.ts
//
// Newsletter-/Rabatt-Status des eingeloggten Nutzers, app-weit geteilt
// (ein Abruf pro Login, Aktualisierung per refreshNewsletterState()).

import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { newsletterApi, type NewsletterState } from './newsletterApi';

const EMPTY: NewsletterState = { status: 'none', discountActive: false, discountPercent: 50, discountExpiresAt: null, discountRedeemedAt: null };

let cache: { userId: string; state: NewsletterState } | null = null;
let inflight: Promise<NewsletterState> | null = null;
const listeners = new Set<(s: NewsletterState) => void>();

async function load(userId: string, force = false): Promise<NewsletterState> {
  if (!force && cache?.userId === userId) return cache.state;
  if (!inflight) {
    inflight = newsletterApi.getState().finally(() => { inflight = null; });
  }
  const state = await inflight;
  cache = { userId, state };
  listeners.forEach((l) => l(state));
  return state;
}

export async function refreshNewsletterState(userId: string): Promise<NewsletterState> {
  return load(userId, true);
}

export function useNewsletterState(): { state: NewsletterState; loading: boolean } {
  const { user } = useAuth();
  const [state, setState] = useState<NewsletterState>(cache && user && cache.userId === user.id ? cache.state : EMPTY);
  const [loading, setLoading] = useState<boolean>(!!user && !(cache && cache.userId === user.id));

  useEffect(() => {
    if (!user) { setState(EMPTY); setLoading(false); return; }
    let alive = true;
    const onChange = (s: NewsletterState) => { if (alive) setState(s); };
    listeners.add(onChange);
    load(user.id).then((s) => { if (alive) { setState(s); setLoading(false); } }).catch(() => { if (alive) setLoading(false); });
    return () => { alive = false; listeners.delete(onChange); };
  }, [user]);

  return { state, loading };
}
