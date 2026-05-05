/*
  # Fix RLS Policies for Session-Based Access

  ## Intention:
  This migration fixes Row Level Security (RLS) policies to support:
  1. **Anonymous uploads via session_id**: Users without login can upload and access CVs
  2. **Authenticated access via user_id**: Logged-in users can access their CVs
  3. **Session-to-User migration**: When a user logs in, their session data becomes accessible via user_id

  ## Key Concept:
  - We use `session_id` from request header `x-session-id` (set by sessionManager)
  - Anonymous users: Access data only via matching session_id
  - Authenticated users: Access data via user_id OR session_id
  - This enables seamless transition from anonymous to authenticated state

  ## Tables Covered:
  - uploaded_cvs (CV upload table)
  - profiles
  - agent_responses
  - agent_progress
  - cv_records
  - job_application

  ## NOTE:
  The code uses `.from('cv_uploads')` but the actual table name is `uploaded_cvs`.
  We create a view `cv_uploads` as an alias for backward compatibility.
*/

-- ============================================================================
-- CREATE VIEW: cv_uploads → uploaded_cvs (for backward compatibility)
-- ============================================================================

DROP VIEW IF EXISTS cv_uploads CASCADE;

CREATE VIEW cv_uploads AS SELECT * FROM uploaded_cvs;

-- Grant permissions on view
GRANT SELECT, INSERT, UPDATE, DELETE ON cv_uploads TO anon, authenticated;

-- ============================================================================
-- 1) UPLOADED_CVS (Main CV Upload Table)
-- ============================================================================

-- Ensure RLS is enabled
ALTER TABLE public.uploaded_cvs ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Anonymous users can insert CVs with temp_id" ON public.uploaded_cvs;
DROP POLICY IF EXISTS "Anonymous users can view own CVs by temp_id" ON public.uploaded_cvs;
DROP POLICY IF EXISTS "Anonymous users can update own CVs by temp_id" ON public.uploaded_cvs;
DROP POLICY IF EXISTS "Authenticated users can view own CVs" ON public.uploaded_cvs;
DROP POLICY IF EXISTS "Authenticated users can insert CVs" ON public.uploaded_cvs;
DROP POLICY IF EXISTS "Authenticated users can update own CVs" ON public.uploaded_cvs;
DROP POLICY IF EXISTS "Authenticated users can delete own CVs" ON public.uploaded_cvs;
DROP POLICY IF EXISTS "Users can view own uploaded CVs" ON public.uploaded_cvs;
DROP POLICY IF EXISTS "Users can upload CVs" ON public.uploaded_cvs;
DROP POLICY IF EXISTS "Users can update own CVs" ON public.uploaded_cvs;
DROP POLICY IF EXISTS "Users can delete own CVs" ON public.uploaded_cvs;

-- New unified policies using session_id from header

CREATE POLICY uploaded_cvs_select_own
ON public.uploaded_cvs
FOR SELECT
USING (
  -- Authenticated: user_id matches
  auth.uid() = user_id
  -- Anonymous: session_id matches header
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY uploaded_cvs_insert_own
ON public.uploaded_cvs
FOR INSERT
WITH CHECK (
  -- Authenticated user with matching user_id
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  -- Anonymous user with session_id from header
  OR (auth.uid() IS NULL AND session_id = current_setting('request.headers.x-session-id', true))
);

CREATE POLICY uploaded_cvs_update_own
ON public.uploaded_cvs
FOR UPDATE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
)
WITH CHECK (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY uploaded_cvs_delete_own
ON public.uploaded_cvs
FOR DELETE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

-- ============================================================================
-- 2) PROFILES
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
DROP POLICY IF EXISTS profiles_insert_own ON public.profiles;
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
DROP POLICY IF EXISTS profiles_delete_own ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY profiles_select_own
ON public.profiles
FOR SELECT
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY profiles_insert_own
ON public.profiles
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND user_id = auth.uid())
  OR (auth.uid() IS NULL AND session_id = current_setting('request.headers.x-session-id', true))
);

CREATE POLICY profiles_update_own
ON public.profiles
FOR UPDATE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
)
WITH CHECK (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY profiles_delete_own
ON public.profiles
FOR DELETE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

-- ============================================================================
-- 3) AGENT_RESPONSES
-- ============================================================================

ALTER TABLE public.agent_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_responses_select_own ON public.agent_responses;
DROP POLICY IF EXISTS agent_responses_insert_own ON public.agent_responses;
DROP POLICY IF EXISTS agent_responses_update_own ON public.agent_responses;
DROP POLICY IF EXISTS agent_responses_delete_own ON public.agent_responses;
DROP POLICY IF EXISTS "Users can view own agent responses" ON public.agent_responses;
DROP POLICY IF EXISTS "Users can insert agent responses" ON public.agent_responses;
DROP POLICY IF EXISTS "Users can update own agent responses" ON public.agent_responses;

CREATE POLICY agent_responses_select_own
ON public.agent_responses
FOR SELECT
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY agent_responses_insert_own
ON public.agent_responses
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  OR (auth.uid() IS NULL AND session_id = current_setting('request.headers.x-session-id', true))
);

CREATE POLICY agent_responses_update_own
ON public.agent_responses
FOR UPDATE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
)
WITH CHECK (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY agent_responses_delete_own
ON public.agent_responses
FOR DELETE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

-- ============================================================================
-- 4) AGENT_PROGRESS
-- ============================================================================

ALTER TABLE public.agent_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agent_progress_select_own ON public.agent_progress;
DROP POLICY IF EXISTS agent_progress_insert_own ON public.agent_progress;
DROP POLICY IF EXISTS agent_progress_update_own ON public.agent_progress;
DROP POLICY IF EXISTS agent_progress_delete_own ON public.agent_progress;
DROP POLICY IF EXISTS "Users can view own agent progress" ON public.agent_progress;
DROP POLICY IF EXISTS "Users can insert agent progress" ON public.agent_progress;
DROP POLICY IF EXISTS "Users can update own agent progress" ON public.agent_progress;

CREATE POLICY agent_progress_select_own
ON public.agent_progress
FOR SELECT
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY agent_progress_insert_own
ON public.agent_progress
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  OR (auth.uid() IS NULL AND session_id = current_setting('request.headers.x-session-id', true))
);

CREATE POLICY agent_progress_update_own
ON public.agent_progress
FOR UPDATE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
)
WITH CHECK (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY agent_progress_delete_own
ON public.agent_progress
FOR DELETE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

-- ============================================================================
-- 5) CV_RECORDS
-- ============================================================================

ALTER TABLE public.cv_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS cv_records_select_own ON public.cv_records;
DROP POLICY IF EXISTS cv_records_insert_own ON public.cv_records;
DROP POLICY IF EXISTS cv_records_update_own ON public.cv_records;
DROP POLICY IF EXISTS cv_records_delete_own ON public.cv_records;

CREATE POLICY cv_records_select_own
ON public.cv_records
FOR SELECT
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY cv_records_insert_own
ON public.cv_records
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  OR (auth.uid() IS NULL AND session_id = current_setting('request.headers.x-session-id', true))
);

CREATE POLICY cv_records_update_own
ON public.cv_records
FOR UPDATE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
)
WITH CHECK (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY cv_records_delete_own
ON public.cv_records
FOR DELETE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

-- ============================================================================
-- 6) JOB_APPLICATION
-- ============================================================================

ALTER TABLE public.job_application ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS job_application_select_own ON public.job_application;
DROP POLICY IF EXISTS job_application_insert_own ON public.job_application;
DROP POLICY IF EXISTS job_application_update_own ON public.job_application;
DROP POLICY IF EXISTS job_application_delete_own ON public.job_application;
DROP POLICY IF EXISTS "Allow anon insert for job_application" ON public.job_application;
DROP POLICY IF EXISTS "Allow anon select for job_application" ON public.job_application;
DROP POLICY IF EXISTS "Allow authenticated select for job_application" ON public.job_application;

CREATE POLICY job_application_select_own
ON public.job_application
FOR SELECT
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY job_application_insert_own
ON public.job_application
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  OR (auth.uid() IS NULL AND session_id = current_setting('request.headers.x-session-id', true))
);

CREATE POLICY job_application_update_own
ON public.job_application
FOR UPDATE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
)
WITH CHECK (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

CREATE POLICY job_application_delete_own
ON public.job_application
FOR DELETE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);

-- ============================================================================
-- DONE
-- ============================================================================

-- Summary:
-- ✅ All tables now support session-based anonymous access
-- ✅ Authenticated users can access their data via user_id
-- ✅ Session data remains accessible after login (via session_id)
-- ✅ No more "new row violates row-level security policy" errors
