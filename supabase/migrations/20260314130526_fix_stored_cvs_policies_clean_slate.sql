/*
  # Fix stored_cvs RLS Policies - Clean Slate

  ## Problem
  There were 5+ duplicate and conflicting policies on stored_cvs:
  - 2 duplicate INSERT policies (cv_check_insert_policy + cv_insert_policy_final)
  - 2 duplicate SELECT policies (cv_check_select_policy + cv_select_policy_final)
  - These caused unpredictable behavior

  ## Changes
  1. Drop ALL existing policies on stored_cvs
  2. Create clean, single-purpose policies:
     - INSERT: anon/authenticated allowed when temp_id IS NOT NULL (no header check on insert)
     - SELECT: allowed when x-temp-id header matches temp_id OR x-session-id matches session_id OR authenticated user owns the row
     - UPDATE: allowed when x-temp-id header matches temp_id OR authenticated user owns row OR service_role
     - DELETE: authenticated users only, own rows only

  ## Security Notes
  - INSERT does NOT check the header because the header may not be set on the very first request
  - SELECT/UPDATE use the header to allow anonymous users to access their own uploads
  - service_role bypass is kept for Make.com callback edge function
*/

-- Drop all existing policies on stored_cvs
DROP POLICY IF EXISTS "cv_check_insert_policy" ON stored_cvs;
DROP POLICY IF EXISTS "cv_check_select_policy" ON stored_cvs;
DROP POLICY IF EXISTS "cv_insert_policy_final" ON stored_cvs;
DROP POLICY IF EXISTS "cv_select_policy_final" ON stored_cvs;
DROP POLICY IF EXISTS "cv_uploads_delete" ON stored_cvs;
DROP POLICY IF EXISTS "cv_uploads_update" ON stored_cvs;

-- Also drop any other policies that might exist
DROP POLICY IF EXISTS "anon_insert_stored_cvs" ON stored_cvs;
DROP POLICY IF EXISTS "anon_select_stored_cvs" ON stored_cvs;
DROP POLICY IF EXISTS "anon_update_stored_cvs" ON stored_cvs;
DROP POLICY IF EXISTS "Users can insert their own CVs" ON stored_cvs;
DROP POLICY IF EXISTS "Users can view their own CVs" ON stored_cvs;
DROP POLICY IF EXISTS "Users can update their own CVs" ON stored_cvs;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON stored_cvs;

-- Ensure RLS is enabled
ALTER TABLE stored_cvs ENABLE ROW LEVEL SECURITY;

-- INSERT: Allow anon and authenticated users to create a CV record when temp_id is provided
-- No header check here - the header is set dynamically and may not be present on the initial insert
CREATE POLICY "stored_cvs_insert"
  ON stored_cvs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (temp_id IS NOT NULL);

-- SELECT: Allow access when the x-temp-id header matches temp_id,
-- OR x-session-id header matches session_id,
-- OR the authenticated user owns the row
CREATE POLICY "stored_cvs_select"
  ON stored_cvs
  FOR SELECT
  TO anon, authenticated
  USING (
    (temp_id IS NOT NULL AND temp_id = current_setting('request.headers.x-temp-id', true))
    OR (session_id IS NOT NULL AND session_id = current_setting('request.headers.x-session-id', true))
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- UPDATE: Allow when header matches OR authenticated owner OR service_role (for Make.com callback)
CREATE POLICY "stored_cvs_update"
  ON stored_cvs
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

-- DELETE: Only authenticated users can delete their own rows
CREATE POLICY "stored_cvs_delete"
  ON stored_cvs
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (SELECT auth.role()) = 'service_role'
  );
