-- ═══════════════════════════════════════════════════════════════════════════
-- Diagnose: Skill-Gap-Analyse & Katalog-Lernpfade
-- Nur Lesen. Im Supabase SQL Editor ausführen und Ergebnis prüfen.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1) Katalog: Wie viele Kurse je Status? Angezeigt werden NUR status = 'ready'.
--    Stehen alle auf 'generating' → Erstellung ist nie fertig geworden.
SELECT status, count(*) AS anzahl FROM public.academy_catalog GROUP BY status ORDER BY status;

-- 2) Katalog: RLS aktiv? Welche Lese-Policies gibt es?
SELECT relrowsecurity AS rls_aktiv FROM pg_class WHERE oid = 'public.academy_catalog'::regclass;
SELECT policyname, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public' AND tablename = 'academy_catalog';

-- 3) Katalog: Fortschritt der Erstellung je Kurs
SELECT c.skill, c.status AS katalog,
       p.academy_generation->>'state' AS schritt,
       p.academy_generation->>'error' AS fehler
  FROM public.academy_catalog c
  LEFT JOIN public.learning_paths p ON p.id = c.template_path_id
 ORDER BY c.created_at DESC;

-- 4) Skill-Gap: die letzten 15 Analysen mit Stufe und Fehlercode
SELECT id, created_at, status, skillgap_paid,
       triggered_at,
       round(extract(epoch FROM (now() - triggered_at)) / 60, 1) AS min_seit_start,
       skillgap_analysis->>'stage'      AS stufe,
       skillgap_analysis->>'error_code' AS fehlercode,
       left(skillgap_analysis->>'error', 160) AS fehler
  FROM public.learning_paths
 WHERE catalog_id IS NULL AND coalesce(is_catalog_template, false) = false
 ORDER BY created_at DESC
 LIMIT 15;

-- 5) Skill-Gap: Häufigkeit der Fehlercodes (letzte 30 Tage)
SELECT skillgap_analysis->>'error_code' AS fehlercode, count(*)
  FROM public.learning_paths
 WHERE status = 'failed' AND updated_at > now() - interval '30 days'
 GROUP BY 1 ORDER BY 2 DESC;
