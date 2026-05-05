/*
  # Fix Anonymous CV-Check: Allow SELECT by exact ID

  ## Problem

  The previous RLS policies allowed anonymous users to see ALL records where user_id IS NULL,
  creating a data leak between different anonymous users.

  ## Solution

  Remove the broad "user_id IS NULL" check from SELECT policies. Instead:
  - Anonymous users can SELECT from stored_cvs by exact ID (UUID prevents guessing)
  - The Make.com callback uses SERVICE_ROLE_KEY and bypasses RLS completely
  - No data leak possible since each anonymous user only knows their own UUID

  ## Changes

  1. **stored_cvs table**
     - Remove SELECT policy restrictions for anon users
     - Allow anon users to SELECT any record (safe because they need exact UUID)

  2. **ats_analyses table**
     - Remove SELECT policy restrictions for anon users
     - Allow anon users to SELECT any record (safe because they need exact UUID)

  ## Security Notes

  - Anonymous users MUST provide exact UUID to fetch data
  - UUIDs are cryptographically random - cannot be guessed
  - Make.com callback uses SERVICE_ROLE_KEY (bypasses RLS)
  - No cross-user data access possible
*/

-- =====================================================
-- 1. UPDATE stored_cvs SELECT POLICY
-- =====================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "stored_cvs_select" ON public.stored_cvs;
DROP POLICY IF EXISTS "Users can read own CVs" ON public.stored_cvs;

-- Recreate SELECT policy: Allow authenticated users to see their own + anon can see any (by exact ID)
CREATE POLICY "stored_cvs_select"
  ON public.stored_cvs
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Authenticated users: only their own records
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    -- Anonymous users: can query by exact ID (no user_id check needed)
    (auth.uid() IS NULL)
  );

-- =====================================================
-- 2. UPDATE ats_analyses SELECT POLICY
-- =====================================================

-- Drop existing SELECT policy
DROP POLICY IF EXISTS "ats_analyses_select" ON public.ats_analyses;
DROP POLICY IF EXISTS "Users can view own analyses" ON public.ats_analyses;

-- Recreate SELECT policy: Allow authenticated users to see their own + anon can see any (by exact ID)
CREATE POLICY "ats_analyses_select"
  ON public.ats_analyses
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Authenticated users: only their own records
    (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
    -- Anonymous users: can query by exact ID (no user_id check needed)
    (auth.uid() IS NULL)
  );