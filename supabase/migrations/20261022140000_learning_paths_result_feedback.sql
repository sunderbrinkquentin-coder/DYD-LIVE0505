-- Bewertung des Skill-Gap-Reports (1–5 Sterne) – Evaluationsschritt (DSR).
-- Idempotent. Geschrieben vom Nutzer selbst über die bestehende Update-Policy
-- auf learning_paths (eigene Zeilen).
ALTER TABLE public.learning_paths
  ADD COLUMN IF NOT EXISTS result_feedback jsonb;

COMMENT ON COLUMN public.learning_paths.result_feedback IS
  'Nutzerbewertung des Skill-Gap-Ergebnisses: {"rating": 1-5, "at": ISO-Zeitstempel}';

-- Auswertung:
-- SELECT (result_feedback->>'rating')::int AS sterne, count(*)
--   FROM public.learning_paths WHERE result_feedback IS NOT NULL GROUP BY 1 ORDER BY 1;
