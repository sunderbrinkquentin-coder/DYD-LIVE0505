/*
  # Fix stored_cvs RLS: Switch from session_id to temp_id for anonymous CV-Check

  ## Problem
  The CV-Check flow uses temp_id for anonymous users, but existing RLS policies
  were not correctly matching temp_id for INSERT, SELECT and UPDATE operations.
  This caused "new row violates row-level security policy" errors.

  ## Changes
  - stored_cvs table:
    - Drop existing insert/select/update/delete policies
    - INSERT: Allow anon/authenticated users if temp_id IS NOT NULL OR user_id = auth.uid()
    - SELECT: Allow access if temp_id matches x-temp-id header OR auth.uid() = user_id
    - UPDATE: Same logic as SELECT plus service_role bypass
    - DELETE: Only owner (auth.uid() = user_id) or service_role

  ## Security
  - Anonymous users can only insert rows with a temp_id
  - Anonymous users can only read/update their own rows via the x-temp-id header
  - Authenticated users access their rows via user_id = auth.uid()
  - Service role retains full access
*/

DROP POLICY IF EXISTS "stored_cvs_insert" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_select" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_update" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_delete" ON public.stored_cvs;

DROP POLICY IF EXISTS "cv_uploads_anon_insert" ON public.stored_cvs;
DROP POLICY IF EXISTS "cv_uploads_anon_select" ON public.stored_cvs;

CREATE POLICY "cv_uploads_anon_insert"
  ON public.stored_cvs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    temp_id IS NOT NULL
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "cv_uploads_anon_select"
  ON public.stored_cvs
  FOR SELECT
  TO anon, authenticated
  USING (
    (temp_id IS NOT NULL AND temp_id = current_setting('request.headers.x-temp-id', true))
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

CREATE POLICY "cv_uploads_update"
  ON public.stored_cvs
  FOR UPDATE
  TO anon, authenticated
  USING (
    (temp_id IS NOT NULL AND temp_id = current_setting('request.headers.x-temp-id', true))
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (SELECT auth.role()) = 'service_role'
  )
  WITH CHECK (
    (temp_id IS NOT NULL AND temp_id = current_setting('request.headers.x-temp-id', true))
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (SELECT auth.role()) = 'service_role'
  );

CREATE POLICY "cv_uploads_delete"
  ON public.stored_cvs
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (SELECT auth.role()) = 'service_role'
  );
