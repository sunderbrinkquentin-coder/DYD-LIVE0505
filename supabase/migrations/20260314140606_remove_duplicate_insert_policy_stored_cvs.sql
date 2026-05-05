/*
  # Remove duplicate INSERT policy on stored_cvs

  ## Summary
  A stale policy named "cv_upload_insert_production" was left over from a previous
  migration. Because RLS evaluates ALL matching policies with OR logic for permissive
  policies, having two INSERT policies should not block inserts — however the presence
  of this duplicate created confusion and risk in future migrations.

  ## Changes
  - DROP the legacy "cv_upload_insert_production" INSERT policy
  - The canonical "stored_cvs_insert" policy (temp_id IS NOT NULL OR session_id IS NOT NULL)
    remains as the sole INSERT policy for anon and authenticated roles

  ## No data risk
  This is a pure policy change. No table structure or data is modified.
*/

DROP POLICY IF EXISTS "cv_upload_insert_production" ON stored_cvs;
