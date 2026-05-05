/*
  # Fix stored_cvs RLS - Remove Duplicate Policies (Definitive Golden State)

  ## Problem
  Two conflicting INSERT policies exist simultaneously on stored_cvs:
  1. "Allow anon insert stored_cvs" - legacy policy (session_id IS NOT NULL OR temp_id IS NOT NULL)
  2. "cv_uploads_anon_insert" - current canonical policy (temp_id IS NOT NULL OR user_id = auth.uid())

  Two conflicting SELECT policies also exist:
  1. "Allow users to select own stored_cvs" - legacy policy reading x-session-id header
  2. "cv_uploads_anon_select" - current canonical policy reading x-temp-id header

  This creates ambiguity, potential evaluation order issues, and makes debugging impossible.
  The client sends BOTH x-temp-id and x-session-id headers (same value) but the canonical
  policy is the x-temp-id based one.

  ## Changes

  ### Dropped Policies
  - "Allow anon insert stored_cvs" (legacy INSERT - superseded by cv_uploads_anon_insert)
  - "Allow users to select own stored_cvs" (legacy SELECT using x-session-id header)

  ### Active Policies After This Migration
  - INSERT: "cv_uploads_anon_insert" - temp_id IS NOT NULL OR user_id = auth.uid()
  - SELECT: "cv_uploads_anon_select" - temp_id matches x-temp-id header OR user_id = auth.uid()
  - UPDATE: "cv_uploads_update" - same as select, plus service_role
  - DELETE: "cv_uploads_delete" - authenticated users own rows, plus service_role

  ## Security Notes
  - Anonymous CV-check uploads work when temp_id is provided in insert AND x-temp-id header
  - Authenticated users access their own rows via user_id = auth.uid()
  - Wizard flow (stored_cvs with source='wizard') uses user_id for authenticated users,
    or temp_id for anonymous - both covered by the canonical policies
  - No wizard-specific policies are touched
*/

-- Drop the legacy duplicate INSERT policy
DROP POLICY IF EXISTS "Allow anon insert stored_cvs" ON public.stored_cvs;

-- Drop the legacy SELECT policy that uses the wrong header (x-session-id)
-- The canonical cv_uploads_anon_select policy correctly uses x-temp-id
DROP POLICY IF EXISTS "Allow users to select own stored_cvs" ON public.stored_cvs;
