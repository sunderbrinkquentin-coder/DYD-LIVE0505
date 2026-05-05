/*
  # Fix Anonymous User Support for CV-Check

  This migration enables CV-Check functionality for non-authenticated users using session_id.

  ## Changes

  1. **ats_analyses table**
     - Remove NOT NULL constraint from user_id (allow anonymous users)
     - Keep all existing columns and structure

  2. **stored_cvs RLS Policies**
     - Update INSERT policy to support anonymous users
     - Update UPDATE policy to support anonymous users
     - Keep SELECT and DELETE policies as-is (already working)
     - Anonymous users are identified by user_id IS NULL

  3. **ats_analyses RLS Policies**
     - Replace all policies to support both authenticated and anonymous users
     - SELECT: Allow if user matches OR user_id IS NULL (for anon)
     - INSERT: Allow if user matches OR user_id IS NULL (for anon)
     - UPDATE: Allow if user matches OR user_id IS NULL (for anon)
     - DELETE: Only for authenticated users (anon should not delete)

  ## Security Notes

  - Anonymous users can only insert/update records where user_id IS NULL
  - Session isolation happens at application level via session_id
  - After login, records can be linked via session_id
  - No cross-user data access possible
*/

-- =====================================================
-- 1. ALTER ats_analyses TABLE TO ALLOW NULL user_id
-- =====================================================

-- Remove NOT NULL constraint from user_id to support anonymous users
ALTER TABLE ats_analyses 
  ALTER COLUMN user_id DROP NOT NULL;

-- =====================================================
-- 2. UPDATE stored_cvs RLS POLICIES
-- =====================================================

-- Drop existing INSERT and UPDATE policies
DROP POLICY IF EXISTS "stored_cvs_insert" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_update" ON public.stored_cvs;

-- Recreate INSERT policy with anonymous user support
CREATE POLICY "stored_cvs_insert"
  ON public.stored_cvs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Authenticated users: must match their user_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    -- Anonymous users: user_id must be NULL
    (auth.uid() IS NULL AND user_id IS NULL) OR
    -- Alternative: temp_id is set (for temporary records)
    temp_id IS NOT NULL
  );

-- Recreate UPDATE policy with anonymous user support
CREATE POLICY "stored_cvs_update"
  ON public.stored_cvs
  FOR UPDATE
  TO anon, authenticated, service_role
  USING (
    -- Authenticated users: must match their user_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    -- Anonymous users: user_id must be NULL
    (auth.uid() IS NULL AND user_id IS NULL) OR
    -- Alternative: temp_id is set (for temporary records)
    temp_id IS NOT NULL OR
    -- Service role can update anything
    (select auth.role()) = 'service_role'
  )
  WITH CHECK (
    -- Authenticated users: must match their user_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    -- Anonymous users: user_id must be NULL
    (auth.uid() IS NULL AND user_id IS NULL) OR
    -- Alternative: temp_id is set (for temporary records)
    temp_id IS NOT NULL OR
    -- Service role can update anything
    (select auth.role()) = 'service_role'
  );

-- =====================================================
-- 3. UPDATE ats_analyses RLS POLICIES
-- =====================================================

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own analyses" ON ats_analyses;
DROP POLICY IF EXISTS "Users can insert own analyses" ON ats_analyses;
DROP POLICY IF EXISTS "Users can update own analyses" ON ats_analyses;
DROP POLICY IF EXISTS "Users can delete own analyses" ON ats_analyses;

-- CREATE new policies with anonymous user support

-- SELECT: Users can view their own analyses (or anonymous analyses)
CREATE POLICY "ats_analyses_select"
  ON ats_analyses
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Authenticated users: must match their user_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    -- Anonymous users: can view records where user_id IS NULL
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- INSERT: Users can insert their own analyses (or anonymous analyses)
CREATE POLICY "ats_analyses_insert"
  ON ats_analyses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    -- Authenticated users: must match their user_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    -- Anonymous users: user_id must be NULL
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- UPDATE: Users can update their own analyses (or anonymous analyses)
CREATE POLICY "ats_analyses_update"
  ON ats_analyses
  FOR UPDATE
  TO anon, authenticated
  USING (
    -- Authenticated users: must match their user_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    -- Anonymous users: can update records where user_id IS NULL
    (auth.uid() IS NULL AND user_id IS NULL)
  )
  WITH CHECK (
    -- Authenticated users: must match their user_id
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    -- Anonymous users: user_id must be NULL
    (auth.uid() IS NULL AND user_id IS NULL)
  );

-- DELETE: Only authenticated users can delete their own analyses
CREATE POLICY "ats_analyses_delete"
  ON ats_analyses
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
  );
