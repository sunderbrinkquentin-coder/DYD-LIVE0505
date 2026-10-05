-- Skill-Gap-Analyse per Edge Function (skillgap-analyze)
-- Vollständiges, nachvollziehbares Analyse-Ergebnis (Recherche mit Quellen,
-- Anforderungen, ESCO-Zuordnung, Abdeckung, Score-Herleitung).
-- Die bestehenden Felder (missing_skills, current_skills, match_score,
-- strategic_outlook_2026) werden weiterhin befüllt – die App liest diese.
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS skillgap_analysis jsonb;
ALTER TABLE public.learning_paths ADD COLUMN IF NOT EXISTS triggered_at timestamptz;
