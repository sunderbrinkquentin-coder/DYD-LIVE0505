// src/hooks/useCountdown.ts
import { useEffect, useState } from 'react';

/** Gibt die Restsekunden bis endsAt zurück, tickt jede Sekunde. Uhr ist lokal (Skew ±1-2s ok). */
export function useCountdown(endsAt: string | null): number {
  const [remaining, setRemaining] = useState(0);
  useEffect(() => {
    if (!endsAt) { setRemaining(0); return; }
    const end = new Date(endsAt).getTime();
    const tick = () => setRemaining(Math.max(0, Math.round((end - Date.now()) / 1000)));
    tick();
    const iv = window.setInterval(tick, 1000);
    return () => window.clearInterval(iv);
  }, [endsAt]);
  return remaining;
}

export function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}