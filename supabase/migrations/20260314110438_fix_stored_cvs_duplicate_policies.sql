/*
  # Fix duplicate RLS policies on stored_cvs

  ## Problem
  Multiple conflicting RLS policies exist simultaneously on the stored_cvs table:
  
  - INSERT: 3 policies active at once:
    - "Allow anon insert" (WITH CHECK = true) - outdated, allows everything
    - "Allow anonymous inserts" (WITH CHECK = true) - outdated duplicate, allows everything
    - "stored_cvs_insert" - the correct specific policy
  
  - SELECT: 3 policies active at once:
    - "Allow anon select by id" (USING = true) - outdated, allows everything
    - "Allow public select" (USING = true) - outdated, allows everything
    - "stored_cvs_select" - the correct specific policy
  
  - UPDATE: 2 policies active at once:
    - "Allow public update" (USING = true, WITH CHECK = true) - outdated, allows everything
    - "stored_cvs_update" - the correct specific policy
  
  ## Fix
  Remove all outdated "allow everything" policies, keeping only the correct specific ones.
  The conflicting policies cause Supabase client AbortErrors on insert.

  ## Tables modified
  - stored_cvs: Removed 5 duplicate/outdated policies

  ## Security
  The remaining policies (stored_cvs_insert, stored_cvs_select, stored_cvs_update, stored_cvs_delete)
  correctly handle both authenticated users (by user_id) and anonymous users (by temp_id).
*/

DROP POLICY IF EXISTS "Allow anon insert" ON stored_cvs;
DROP POLICY IF EXISTS "Allow anonymous inserts" ON stored_cvs;
DROP POLICY IF EXISTS "Allow anon select by id" ON stored_cvs;
DROP POLICY IF EXISTS "Allow public select" ON stored_cvs;
DROP POLICY IF EXISTS "Allow public update" ON stored_cvs;
