-- ═════════════════════════════════════════════════════════════════════════════
-- DYD Career Academy – 8 Basiskurse für den Katalog anlegen
--
-- Schritt 1 legt die Kurse an (Katalog-Eintrag + neutrale Vorlage).
-- Schritt 2 startet die Erstellung über die Edge Function trigger-learningpath.
-- Dauer: ca. 3–5 Minuten, alle Kurse parallel. Danach stehen sie automatisch
-- als "ready" im Katalog. Bereits vorhandene Skills werden übersprungen.
-- ═════════════════════════════════════════════════════════════════════════════

-- ── Schritt 1: Kurse anlegen ─────────────────────────────────────────────────
WITH skills(skill) AS (
  VALUES
    ('Projektmanagement'),
    ('Microsoft Excel'),
    ('KI im Arbeitsalltag'),
    ('Datenschutz (DSGVO)'),
    ('Agiles Arbeiten mit Scrum'),
    ('Professionelle Kommunikation'),
    ('Prozessoptimierung (Lean)'),
    ('Vertrieb und Verhandlung')
),
fehlend AS (
  SELECT s.skill FROM skills s
   WHERE NOT EXISTS (
     SELECT 1 FROM public.academy_catalog c WHERE c.skill_key = public.academy_skill_key(s.skill)
   )
),
vorlage AS (
  INSERT INTO public.learning_paths (user_id, skill, target_job, status, is_paid, is_catalog_template)
  SELECT NULL, skill, 'Berufstätige aller Branchen', 'gap_analysis_complete', true, true
    FROM fehlend
  RETURNING id, skill
)
INSERT INTO public.academy_catalog (skill_key, skill, status, template_path_id)
SELECT public.academy_skill_key(skill), skill, 'generating', id
  FROM vorlage
ON CONFLICT (skill_key) DO NOTHING;

-- Kontrolle: sollte 8 Zeilen mit Status "generating" zeigen
SELECT skill, status, template_path_id FROM public.academy_catalog ORDER BY created_at DESC;


-- ── Schritt 2: Erstellung starten ────────────────────────────────────────────
-- DEIN_ANON_KEY ersetzen: Supabase → Project Settings → API Keys → "anon public"
-- (derselbe öffentliche Schlüssel wie VITE_SUPABASE_ANON_KEY im Frontend).
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT net.http_post(
  url     := 'https://vuumqarzylewhzvtbtcl.supabase.co/functions/v1/trigger-learningpath',
  headers := jsonb_build_object(
               'Content-Type', 'application/json',
               'Authorization', 'Bearer DEIN_ANON_KEY'
             ),
  body    := jsonb_build_object('action', 'catalog_pending')
);


-- ── Fortschritt ansehen (nach 1–5 Minuten erneut ausführen) ──────────────────
SELECT c.skill,
       c.status                                         AS katalog,
       p.academy_generation->>'state'                   AS schritt,
       (SELECT count(*) FROM jsonb_object_keys(coalesce(p.academy_generation->'units', '{}'::jsonb))) AS einheiten_fertig,
       p.academy_generation->>'error'                   AS fehler
  FROM public.academy_catalog c
  LEFT JOIN public.learning_paths p ON p.id = c.template_path_id
 ORDER BY c.created_at DESC;

-- Fehlgeschlagen? Diesen Kurs zurücksetzen und Schritt 2 erneut ausführen:
-- UPDATE public.learning_paths SET academy_generation = NULL, status = 'gap_analysis_complete'
--  WHERE id = (SELECT template_path_id FROM public.academy_catalog WHERE skill = 'Microsoft Excel');
-- UPDATE public.academy_catalog SET status = 'generating' WHERE skill = 'Microsoft Excel';
