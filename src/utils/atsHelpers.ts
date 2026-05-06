export function getScoreLabel(score: number): string {
  if (score >= 85) return 'Hervorragendes Profil';
  if (score >= 75) return 'Starkes Profil';
  if (score >= 65) return 'Solide Basis';
  if (score >= 50) return 'Ausbaufähiges Profil';
  if (score >= 35) return 'Großes Verbesserungspotenzial';
  return 'Dringend optimieren';
}

export function getProgressColor(score: number): string {
  if (score >= 70) return 'bg-emerald-400';
  if (score >= 40) return 'bg-amber-400';
  return 'bg-red-400';
}
