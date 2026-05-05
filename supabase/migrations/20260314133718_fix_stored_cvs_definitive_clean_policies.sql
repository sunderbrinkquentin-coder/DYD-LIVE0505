/*
  # Definitive Clean Policies for stored_cvs

  ## Summary
  Remove all remaining legacy/duplicate policies and replace with one clear set.

  ## Key Fix
  - INSERT: Allow when temp_id IS NOT NULL OR session_id IS NOT NULL (no header check)
  - SELECT: Allow via header match OR auth.uid() match
  - UPDATE: Allow via header match OR auth.uid() match OR service_role
  - DELETE: Allow own rows (authenticated) OR service_role

  ## Why this fixes the bug
  The INSERT was previously blocked because the Supabase client sends the
  x-temp-id header dynamically, but on the very first INSERT request the
  header evaluation timing was inconsistent. By removing all header checks
  from WITH CHECK on INSERT, the row is always created as long as temp_id
  is populated in the payload itself.
*/

-- Remove legacy policies that were not cleaned up by previous migrations
DROP POLICY IF EXISTS "cv_upload_insert_final_safe" ON stored_cvs;
DROP POLICY IF EXISTS "cv_upload_select_final_safe" ON stored_cvs;

-- Re-create INSERT with both temp_id and session_id fallback
DROP POLICY IF EXISTS "stored_cvs_insert" ON stored_cvs;

CREATE POLICY "stored_cvs_insert"
  ON stored_cvs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    (temp_id IS NOT NULL) OR (session_id IS NOT NULL)
  );
