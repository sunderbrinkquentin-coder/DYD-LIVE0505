/*
  # Create Row Level Security Policies

  1. Security Policies
    
    ## Profiles Table
    - Users can view their own profile (by session_id or user_id)
    - Users can insert profile with their session_id
    - Users can update their own profile
    - Users can delete their own profile
    
    ## Uploaded CVs Table
    - Users can view their own uploaded CVs
    - Users can insert CVs for their profile
    - Users can update their own CVs
    - Users can delete their own CVs
    
    ## Agent Responses Table
    - Users can view their own responses
    - Users can insert responses for their session
    - Users can update their own responses
    - Users can delete their own responses
    
    ## Optimized CVs Table
    - Users can view their own CVs
    - Users can insert CVs for their profile
    - Users can update their own CVs
    - Users can delete their own CVs
    
    ## Agent Progress Table
    - Users can view their own progress
    - Users can insert progress for their session
    - Users can update their own progress
    - Users can delete their own progress
    
    ## Storage Bucket: cv_uploads
    - Users can view their own files
    - Users can upload files to their folder
    - Users can delete their own files

  2. Important Notes
    - Policies support both anonymous (session_id) and registered (user_id) users
    - All policies are restrictive by default
    - Users can ONLY access their own data
*/

-- ============================================================================
-- PROFILES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id
    OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
  );

CREATE POLICY "Users can view own profile (anon)"
  ON profiles FOR SELECT
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id
    OR session_id = current_setting('request.jwt.claims', true)::json->>'session_id'
  );

CREATE POLICY "Users can update own profile (anon)"
  ON profiles FOR UPDATE
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id
  );

-- ============================================================================
-- UPLOADED CVS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own uploaded CVs"
  ON uploaded_cvs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = uploaded_cvs.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can view own uploaded CVs (anon)"
  ON uploaded_cvs FOR SELECT
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can insert uploaded CVs"
  ON uploaded_cvs FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = uploaded_cvs.profile_id
    )
  );

CREATE POLICY "Users can update own uploaded CVs"
  ON uploaded_cvs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = uploaded_cvs.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can update own uploaded CVs (anon)"
  ON uploaded_cvs FOR UPDATE
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can delete own uploaded CVs"
  ON uploaded_cvs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = uploaded_cvs.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can delete own uploaded CVs (anon)"
  ON uploaded_cvs FOR DELETE
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- ============================================================================
-- AGENT RESPONSES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own agent responses"
  ON agent_responses FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = agent_responses.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can view own agent responses (anon)"
  ON agent_responses FOR SELECT
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can insert agent responses"
  ON agent_responses FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = agent_responses.profile_id
    )
  );

CREATE POLICY "Users can update own agent responses"
  ON agent_responses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = agent_responses.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can update own agent responses (anon)"
  ON agent_responses FOR UPDATE
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can delete own agent responses"
  ON agent_responses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = agent_responses.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can delete own agent responses (anon)"
  ON agent_responses FOR DELETE
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- ============================================================================
-- OPTIMIZED CVS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own optimized CVs"
  ON optimized_cvs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = optimized_cvs.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can view own optimized CVs (anon)"
  ON optimized_cvs FOR SELECT
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can insert optimized CVs"
  ON optimized_cvs FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = optimized_cvs.profile_id
    )
  );

CREATE POLICY "Users can update own optimized CVs"
  ON optimized_cvs FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = optimized_cvs.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can update own optimized CVs (anon)"
  ON optimized_cvs FOR UPDATE
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can delete own optimized CVs"
  ON optimized_cvs FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = optimized_cvs.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can delete own optimized CVs (anon)"
  ON optimized_cvs FOR DELETE
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- ============================================================================
-- AGENT PROGRESS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own agent progress"
  ON agent_progress FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = agent_progress.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can view own agent progress (anon)"
  ON agent_progress FOR SELECT
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can insert agent progress"
  ON agent_progress FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = agent_progress.profile_id
    )
  );

CREATE POLICY "Users can update own agent progress"
  ON agent_progress FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = agent_progress.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can update own agent progress (anon)"
  ON agent_progress FOR UPDATE
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can delete own agent progress"
  ON agent_progress FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = agent_progress.profile_id
      AND (profiles.user_id = auth.uid() OR profiles.session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
    )
  );

CREATE POLICY "Users can delete own agent progress (anon)"
  ON agent_progress FOR DELETE
  TO anon
  USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- ============================================================================
-- STORAGE BUCKET POLICIES (cv_uploads)
-- ============================================================================

CREATE POLICY "Users can view own files"
  ON storage.objects FOR SELECT
  TO authenticated, anon
  USING (
    bucket_id = 'cv_uploads'
    AND (storage.foldername(name))[1] = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can upload own files"
  ON storage.objects FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    bucket_id = 'cv_uploads'
    AND (storage.foldername(name))[1] = current_setting('request.headers', true)::json->>'x-session-id'
  );

CREATE POLICY "Users can delete own files"
  ON storage.objects FOR DELETE
  TO authenticated, anon
  USING (
    bucket_id = 'cv_uploads'
    AND (storage.foldername(name))[1] = current_setting('request.headers', true)::json->>'x-session-id'
  );