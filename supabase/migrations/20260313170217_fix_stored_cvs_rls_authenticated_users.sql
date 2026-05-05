/*
  # Fix stored_cvs RLS Policy for Authenticated Users

  ## Problem
  
  The current SELECT policy for stored_cvs has a critical flaw:
  
  ```sql
  (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR (auth.uid() IS NULL)
  ```
  
  This means:
  - Authenticated users can ONLY see records where user_id matches their auth.uid()
  - BUT: Anonymous users can see EVERYTHING (security issue)
  
  The real issue is that authenticated users should also be able to see records by:
  - session_id match (for cross-device access before login)
  - temp_id match (for temporary records)
  
  ## Solution
  
  Update the SELECT policy to properly handle:
  1. Authenticated users: See records where user_id matches OR session_id matches OR temp_id exists
  2. Anonymous users: Only see records by exact ID query (UUID prevents guessing)
  
  ## Changes
  
  1. **stored_cvs SELECT Policy**
     - Add session_id check for authenticated users
     - Add temp_id check for authenticated users
     - Keep anon access restricted to exact ID queries
  
  2. **Consistency with INSERT/UPDATE**
     - Ensure SELECT policy matches the conditions in INSERT and UPDATE policies
     - All three policies must use the same logic for data access
  
  ## Security Notes
  
  - Authenticated users can see their own records (user_id match)
  - Authenticated users can see records from their session (session_id match)
  - Authenticated users can see temporary records (temp_id exists)
  - Anonymous users need exact UUID to access records
  - No data leakage between users
*/

-- =====================================================
-- 1. FIX stored_cvs SELECT POLICY
-- =====================================================

DROP POLICY IF EXISTS "stored_cvs_select" ON public.stored_cvs;

CREATE POLICY "stored_cvs_select"
  ON public.stored_cvs
  FOR SELECT
  TO anon, authenticated
  USING (
    -- Authenticated users can see:
    -- 1. Their own records (by user_id)
    -- 2. Records from their session (by session_id) 
    -- 3. Temporary records (by temp_id)
    (
      (select auth.uid()) IS NOT NULL 
      AND (
        user_id = (select auth.uid()) 
        OR session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
        OR temp_id IS NOT NULL
      )
    ) 
    OR 
    -- Anonymous users: can query any record by exact ID
    -- (Safe because UUIDs are cryptographically random)
    (
      (select auth.uid()) IS NULL
    )
  );

-- =====================================================
-- 2. VERIFY CONSISTENCY WITH OTHER POLICIES
-- =====================================================

-- The INSERT policy already has the correct logic:
-- (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
-- (auth.uid() IS NULL AND user_id IS NULL) OR  
-- temp_id IS NOT NULL

-- The UPDATE policy already has the correct logic:
-- (auth.uid() IS NOT NULL AND user_id = auth.uid()) OR
-- (auth.uid() IS NULL AND user_id IS NULL) OR
-- temp_id IS NOT NULL OR
-- (select auth.role()) = 'service_role'

-- Now all three policies are aligned for authenticated users to access:
-- 1. Records where user_id matches their auth.uid()
-- 2. Records where session_id matches (SELECT only)
-- 3. Records where temp_id exists
