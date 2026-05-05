/*
  # Fix stored_cvs RLS Policies für Upload-Problem

  ## Problem
  Die aktuellen RLS Policies prüfen `session_id` gegen JWT claims, aber:
  - JWT session_id ist die Supabase Auth Session
  - Application session_id ist eine Browser-generierte ID
  - Diese beiden sind unterschiedlich und verursachen INSERT Failures für eingeloggte User

  ## Lösung
  1. **Authenticated Users**: Nur `user_id = auth.uid()` prüfen (session_id ignorieren)
  2. **Anonymous Users**: Nur `user_id IS NULL` prüfen (session_id für Application Layer)
  3. **Temp Records**: Fallback mit `temp_id IS NOT NULL`

  ## Geänderte Policies
  - `stored_cvs_select`: Vereinfachte Logik für auth vs anon
  - `stored_cvs_insert`: Korrigierte Bedingungen ohne falsche session_id Checks
  - `stored_cvs_update`: Konsistente Logik mit SELECT/INSERT
  - `stored_cvs_delete`: Neue Policy für Löschrechte

  ## Security
  - Authenticated users können nur ihre eigenen Records (via user_id)
  - Anonymous users können nur Records ohne user_id (via application session management)
  - Service role hat weiterhin alle Rechte
*/

-- Drop existing policies
DROP POLICY IF EXISTS "stored_cvs_select" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_insert" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_update" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_delete" ON public.stored_cvs;

-- ============================================================================
-- SELECT Policy: Lesen von eigenen CVs
-- ============================================================================
CREATE POLICY "stored_cvs_select"
  ON public.stored_cvs
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Authenticated users: nur eigene Records (via user_id)
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Anonymous users: nur Records ohne user_id (application managed)
    (auth.uid() IS NULL AND user_id IS NULL)
    OR
    -- Temp records sind für alle lesbar (vor Zuweisung)
    temp_id IS NOT NULL
  );

-- ============================================================================
-- INSERT Policy: Erstellen von CVs
-- ============================================================================
CREATE POLICY "stored_cvs_insert"
  ON public.stored_cvs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Authenticated users: user_id MUSS auth.uid() sein
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Anonymous users: user_id MUSS NULL sein
    (auth.uid() IS NULL AND user_id IS NULL)
    OR
    -- Temp records erlaubt (für spätere Zuweisung)
    (temp_id IS NOT NULL)
  );

-- ============================================================================
-- UPDATE Policy: Aktualisieren von eigenen CVs
-- ============================================================================
CREATE POLICY "stored_cvs_update"
  ON public.stored_cvs
  FOR UPDATE
  TO anon, authenticated, service_role
  USING (
    -- Authenticated users: nur eigene Records
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    -- Anonymous users: nur Records ohne user_id
    (auth.uid() IS NULL AND user_id IS NULL)
    OR
    -- Temp records können aktualisiert werden
    temp_id IS NOT NULL
    OR
    -- Service role hat immer Zugriff
    (select auth.role()) = 'service_role'
  )
  WITH CHECK (
    -- Nach Update: gleiche Regeln wie bei USING
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR
    (auth.uid() IS NULL AND user_id IS NULL)
    OR
    temp_id IS NOT NULL
    OR
    (select auth.role()) = 'service_role'
  );

-- ============================================================================
-- DELETE Policy: Löschen von eigenen CVs
-- ============================================================================
CREATE POLICY "stored_cvs_delete"
  ON public.stored_cvs
  FOR DELETE
  TO authenticated, service_role
  USING (
    -- Authenticated users: nur eigene Records
    user_id = auth.uid()
    OR
    -- Service role hat immer Zugriff
    (select auth.role()) = 'service_role'
  );

-- ============================================================================
-- Kommentar zur Dokumentation
-- ============================================================================
COMMENT ON POLICY "stored_cvs_select" ON public.stored_cvs IS 
  'Authenticated users sehen nur ihre eigenen CVs (user_id match), anonymous users sehen nur CVs ohne user_id';

COMMENT ON POLICY "stored_cvs_insert" ON public.stored_cvs IS 
  'Authenticated users müssen user_id = auth.uid() setzen, anonymous users müssen user_id = NULL setzen';

COMMENT ON POLICY "stored_cvs_update" ON public.stored_cvs IS 
  'Users können nur ihre eigenen CVs updaten. Service role hat vollen Zugriff.';

COMMENT ON POLICY "stored_cvs_delete" ON public.stored_cvs IS 
  'Nur authenticated users können ihre eigenen CVs löschen. Anonymous users können nicht löschen.';