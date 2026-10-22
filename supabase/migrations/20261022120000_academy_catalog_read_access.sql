-- Katalog-Lernpfade ("Direkt loslegen") lesbar machen.
-- Idempotent: kann beliebig oft im Supabase SQL Editor ausgeführt werden.
-- Ändert KEINE Daten und schaltet RLS nicht um – ergänzt nur Leserechte.

DO $$
BEGIN
  IF to_regclass('public.academy_catalog') IS NULL THEN
    RAISE NOTICE 'Tabelle public.academy_catalog fehlt – Katalog wurde noch nicht eingerichtet.';
    RETURN;
  END IF;

  -- Fertige Kurse für alle sichtbar (Landingpage, Career Vision, Dashboard, /kurse)
  EXECUTE 'DROP POLICY IF EXISTS "academy_catalog_public_read_ready" ON public.academy_catalog';
  EXECUTE $p$CREATE POLICY "academy_catalog_public_read_ready" ON public.academy_catalog
           FOR SELECT TO anon, authenticated USING (status = 'ready')$p$;
  EXECUTE 'GRANT SELECT ON public.academy_catalog TO anon, authenticated';
END $$;

-- Kursdetail (Lerneinheiten) – Funktion freigeben, egal mit welcher Signatur sie angelegt wurde
DO $$
DECLARE f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS sig
      FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
     WHERE n.nspname = 'public' AND p.proname = 'academy_catalog_units'
  LOOP
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO anon, authenticated', f.sig);
  END LOOP;
END $$;
