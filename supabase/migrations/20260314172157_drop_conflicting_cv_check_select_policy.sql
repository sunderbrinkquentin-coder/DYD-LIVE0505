/*
  # Drop conflicting cv_check_select_polling policy

  ## Problem
  Two SELECT policies existed on stored_cvs:
  - stored_cvs_select: USING (true) — fully open
  - cv_check_select_polling: USING (temp_id = header OR session_id = header OR auth.uid() = user_id)

  The second policy was restrictive and required specific request headers that
  the frontend does not send, causing polling to fail for anonymous users who
  don't have those headers set. Since stored_cvs_select already covers all
  legitimate read access, the conflicting policy is removed.

  ## Changes
  - DROP POLICY cv_check_select_polling ON stored_cvs
*/

DROP POLICY IF EXISTS "cv_check_select_polling" ON stored_cvs;
