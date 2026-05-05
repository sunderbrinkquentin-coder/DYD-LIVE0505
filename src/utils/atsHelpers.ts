export function getScoreLabel(score: number): string {
  if (score >= 80) return 'Sehr stark! Nur Feinschliff nötig';
  if (score >= 70) return 'Gut aufgestellt, weitere Optimierungen möglich';
  if (score >= 50) return 'Solide Basis mit Verbesserungspotenzial';
  if (score >= 30) return 'Großes Verbesserungspotenzial vorhanden';
  return 'Dringend Optimierung empfohlen';
}

export function getProgressColor(score: number): string {
  if (score >= 70) return 'bg-emerald-400';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}
