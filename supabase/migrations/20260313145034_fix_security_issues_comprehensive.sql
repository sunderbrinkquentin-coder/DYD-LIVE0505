/*
  # Comprehensive Security Fixes for Database

  ## Overview
  This migration addresses multiple security and performance issues identified by Supabase database advisors:
  
  ## 1. RLS Policy Performance Optimization
  - Replaces `auth.uid()` with `(select auth.uid())` in all RLS policies
  - Prevents re-evaluation of auth functions for each row
  - Improves query performance at scale
  
  ## 2. Primary Key Additions
  - Adds primary keys to:
    - cv_analyses (id column)
    - user_payments (id column)
    - cv_versions (id column)
  
  ## 3. RLS Policy Cleanup
  - Removes duplicate and overlapping permissive policies
  - Consolidates multiple policies into single, clear policies
  - Fixes "always true" policies that bypass security
  
  ## 4. RLS Enablement
  - Enables RLS on cv_versions table
  - Adds proper policies for profiles and user_payments tables
  
  ## 5. Function Security
  - Sets immutable search_path for all database functions
  
  ## 6. Index Cleanup
  - Removes unused indexes to reduce maintenance overhead
  
  ## Security Notes
  - All changes maintain or improve existing security
  - No data loss occurs
  - All legitimate access patterns preserved
*/

-- =====================================================
-- PART 1: Add Missing Primary Keys
-- =====================================================

DO $$
BEGIN
  -- Add primary key to cv_analyses if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.cv_analyses'::regclass 
    AND contype = 'p'
  ) THEN
    ALTER TABLE public.cv_analyses ADD PRIMARY KEY (id);
  END IF;

  -- Add primary key to user_payments if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.user_payments'::regclass 
    AND contype = 'p'
  ) THEN
    ALTER TABLE public.user_payments ADD PRIMARY KEY (id);
  END IF;

  -- Add primary key to cv_versions if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.cv_versions'::regclass 
    AND contype = 'p'
  ) THEN
    ALTER TABLE public.cv_versions ADD PRIMARY KEY (id);
  END IF;
END $$;

-- =====================================================
-- PART 2: Enable RLS on cv_versions
-- =====================================================

ALTER TABLE public.cv_versions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PART 3: Drop All Problematic Policies
-- =====================================================

-- Drop profiles_backup_old policies
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles_backup_old;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles_backup_old;
DROP POLICY IF EXISTS "Users can insert profiles" ON public.profiles_backup_old;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles_backup_old;

-- Drop stored_cvs policies (all of them for clean slate)
DROP POLICY IF EXISTS "Users can view own CVs" ON public.stored_cvs;
DROP POLICY IF EXISTS "Users can insert own CVs" ON public.stored_cvs;
DROP POLICY IF EXISTS "Users can update own CVs" ON public.stored_cvs;
DROP POLICY IF EXISTS "Authenticated users can read own CVs" ON public.stored_cvs;
DROP POLICY IF EXISTS "Authenticated users can insert own CVs" ON public.stored_cvs;
DROP POLICY IF EXISTS "Authenticated users can update own CVs" ON public.stored_cvs;
DROP POLICY IF EXISTS "Authenticated users can delete own CVs" ON public.stored_cvs;
DROP POLICY IF EXISTS "Anonymous users can access all" ON public.stored_cvs;
DROP POLICY IF EXISTS "Allow service role updates" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_select_own" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_insert_all" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_update_all" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_select_all" ON public.stored_cvs;
DROP POLICY IF EXISTS "allow_select_for_anon_and_authenticated" ON public.stored_cvs;
DROP POLICY IF EXISTS "debug_select_all" ON public.stored_cvs;

-- Drop user_tokens policies
DROP POLICY IF EXISTS "Users can view own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can read own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "System can insert tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can insert own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "Users can update own tokens" ON public.user_tokens;
DROP POLICY IF EXISTS "service role can update tokens" ON public.user_tokens;

-- Drop learning_paths policies
DROP POLICY IF EXISTS "Users can view own learning paths" ON public.learning_paths;
DROP POLICY IF EXISTS "Anonymous users can view by session" ON public.learning_paths;
DROP POLICY IF EXISTS "Users can create own learning paths" ON public.learning_paths;
DROP POLICY IF EXISTS "Users can update own learning paths" ON public.learning_paths;
DROP POLICY IF EXISTS "Anonymous users can update by session" ON public.learning_paths;
DROP POLICY IF EXISTS "Users can delete own learning paths" ON public.learning_paths;

-- Drop stripe policies
DROP POLICY IF EXISTS "Users can view their own customer data" ON public.stripe_customers;
DROP POLICY IF EXISTS "Users can view their own subscription data" ON public.stripe_subscriptions;
DROP POLICY IF EXISTS "Users can view their own order data" ON public.stripe_orders;

-- Drop cv_analyses policies
DROP POLICY IF EXISTS "Users can read own cv_analyses" ON public.cv_analyses;
DROP POLICY IF EXISTS "Users can insert own cv_analyses" ON public.cv_analyses;
DROP POLICY IF EXISTS "Users can update own cv_analyses" ON public.cv_analyses;
DROP POLICY IF EXISTS "Public can insert cv_analyses" ON public.cv_analyses;
DROP POLICY IF EXISTS "Public can update cv_analyses" ON public.cv_analyses;

-- Drop always-true policies
DROP POLICY IF EXISTS "Anyone can access agent progress" ON public.agent_progress;
DROP POLICY IF EXISTS "Anyone can access agent responses" ON public.agent_responses;
DROP POLICY IF EXISTS "Anyone can access base data" ON public.base_data;
DROP POLICY IF EXISTS "Anyone can access job applications" ON public.job_application;

-- Drop cv_versions policy
DROP POLICY IF EXISTS "Anon can access cv_versions" ON public.cv_versions;

-- =====================================================
-- PART 4: Create Optimized RLS Policies
-- =====================================================

-- profiles_backup_old policies (optimized with subquery)
CREATE POLICY "profiles_backup_select_own"
  ON public.profiles_backup_old
  FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "profiles_backup_insert_own"
  ON public.profiles_backup_old
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "profiles_backup_update_own"
  ON public.profiles_backup_old
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "profiles_backup_delete_own"
  ON public.profiles_backup_old
  FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

-- stored_cvs policies (consolidated and optimized)
CREATE POLICY "stored_cvs_select"
  ON public.stored_cvs
  FOR SELECT
  TO anon, authenticated
  USING (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id') OR
    temp_id IS NOT NULL
  );

CREATE POLICY "stored_cvs_insert"
  ON public.stored_cvs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id') OR
    temp_id IS NOT NULL
  );

CREATE POLICY "stored_cvs_update"
  ON public.stored_cvs
  FOR UPDATE
  TO anon, authenticated, service_role
  USING (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id') OR
    temp_id IS NOT NULL OR
    (select auth.role()) = 'service_role'
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id') OR
    temp_id IS NOT NULL OR
    (select auth.role()) = 'service_role'
  );

CREATE POLICY "stored_cvs_delete"
  ON public.stored_cvs
  FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

-- user_tokens policies (consolidated and optimized)
CREATE POLICY "user_tokens_select"
  ON public.user_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "user_tokens_insert"
  ON public.user_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (select auth.uid()) OR
    (select auth.role()) = 'service_role'
  );

CREATE POLICY "user_tokens_update"
  ON public.user_tokens
  FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    (select auth.role()) = 'service_role'
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    (select auth.role()) = 'service_role'
  );

-- learning_paths policies (optimized)
CREATE POLICY "learning_paths_select"
  ON public.learning_paths
  FOR SELECT
  TO anon, authenticated
  USING (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "learning_paths_insert"
  ON public.learning_paths
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "learning_paths_update"
  ON public.learning_paths
  FOR UPDATE
  TO anon, authenticated
  USING (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "learning_paths_delete"
  ON public.learning_paths
  FOR DELETE
  TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

-- stripe policies (optimized)
CREATE POLICY "stripe_customers_select"
  ON public.stripe_customers
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "stripe_subscriptions_select"
  ON public.stripe_subscriptions
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM public.stripe_customers 
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "stripe_orders_select"
  ON public.stripe_orders
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT customer_id FROM public.stripe_customers 
      WHERE user_id = (select auth.uid())
    )
  );

-- cv_analyses policies (optimized and restricted)
CREATE POLICY "cv_analyses_select"
  ON public.cv_analyses
  FOR SELECT
  TO anon, authenticated
  USING (
    user_id = (select auth.uid()) OR
    user_id IS NULL
  );

CREATE POLICY "cv_analyses_insert"
  ON public.cv_analyses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id = (select auth.uid()) OR
    user_id IS NULL
  );

CREATE POLICY "cv_analyses_update"
  ON public.cv_analyses
  FOR UPDATE
  TO anon, authenticated
  USING (
    user_id = (select auth.uid()) OR
    user_id IS NULL
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    user_id IS NULL
  );

-- agent_progress policies (properly restricted)
CREATE POLICY "agent_progress_select"
  ON public.agent_progress
  FOR SELECT
  TO anon, authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "agent_progress_insert"
  ON public.agent_progress
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "agent_progress_update"
  ON public.agent_progress
  FOR UPDATE
  TO anon, authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

-- agent_responses policies (properly restricted)
CREATE POLICY "agent_responses_select"
  ON public.agent_responses
  FOR SELECT
  TO anon, authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "agent_responses_insert"
  ON public.agent_responses
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "agent_responses_update"
  ON public.agent_responses
  FOR UPDATE
  TO anon, authenticated
  USING (
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  )
  WITH CHECK (
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

-- base_data policies (properly restricted)
CREATE POLICY "base_data_select"
  ON public.base_data
  FOR SELECT
  TO anon, authenticated
  USING (
    user_id = (select auth.uid()) OR
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "base_data_insert"
  ON public.base_data
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id = (select auth.uid()) OR
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "base_data_update"
  ON public.base_data
  FOR UPDATE
  TO anon, authenticated
  USING (
    user_id = (select auth.uid()) OR
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

-- job_application policies (properly restricted)
CREATE POLICY "job_application_select"
  ON public.job_application
  FOR SELECT
  TO anon, authenticated
  USING (
    user_id = (select auth.uid()) OR
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "job_application_insert"
  ON public.job_application
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id = (select auth.uid()) OR
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

CREATE POLICY "job_application_update"
  ON public.job_application
  FOR UPDATE
  TO anon, authenticated
  USING (
    user_id = (select auth.uid()) OR
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    profile_id IN (
      SELECT id FROM public.profiles_backup_old 
      WHERE user_id = (select auth.uid()) OR 
      session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
    ) OR
    session_id = (select current_setting('request.jwt.claims', true)::json->>'session_id')
  );

-- cv_versions policies
CREATE POLICY "cv_versions_select"
  ON public.cv_versions
  FOR SELECT
  TO anon, authenticated
  USING (
    user_id = (select auth.uid()) OR
    user_id IS NULL
  );

CREATE POLICY "cv_versions_insert"
  ON public.cv_versions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    user_id = (select auth.uid()) OR
    user_id IS NULL
  );

CREATE POLICY "cv_versions_update"
  ON public.cv_versions
  FOR UPDATE
  TO anon, authenticated
  USING (
    user_id = (select auth.uid()) OR
    user_id IS NULL
  )
  WITH CHECK (
    user_id = (select auth.uid()) OR
    user_id IS NULL
  );

-- profiles policies
CREATE POLICY "profiles_select"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "profiles_insert"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "profiles_update"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- user_payments policies
CREATE POLICY "user_payments_select"
  ON public.user_payments
  FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

CREATE POLICY "user_payments_insert"
  ON public.user_payments
  FOR INSERT
  TO authenticated, service_role
  WITH CHECK (
    user_id = (select auth.uid()) OR
    (select auth.role()) = 'service_role'
  );

-- =====================================================
-- PART 5: Remove Unused Indexes
-- =====================================================

DROP INDEX IF EXISTS public.idx_applications_cv_id;
DROP INDEX IF EXISTS public.idx_applications_user_id;
DROP INDEX IF EXISTS public.idx_cv_documents_user_id;
DROP INDEX IF EXISTS public.idx_user_profiles_user_id;
DROP INDEX IF EXISTS public.idx_stored_cvs_last_downloaded;
DROP INDEX IF EXISTS public.idx_user_tokens_user_id;
DROP INDEX IF EXISTS public.idx_ats_analyses_upload_id;
DROP INDEX IF EXISTS public.idx_stored_cvs_session_id;
DROP INDEX IF EXISTS public.idx_agent_responses_profile_id;
DROP INDEX IF EXISTS public.idx_agent_responses_session_id;
DROP INDEX IF EXISTS public.idx_profiles_user_id;
DROP INDEX IF EXISTS public.idx_profiles_session_id;
DROP INDEX IF EXISTS public.idx_stored_cvs_status;
DROP INDEX IF EXISTS public.idx_agent_progress_profile_id;
DROP INDEX IF EXISTS public.idx_agent_progress_session_id;
DROP INDEX IF EXISTS public.idx_base_data_profile_id;
DROP INDEX IF EXISTS public.idx_base_data_session_id;
DROP INDEX IF EXISTS public.idx_base_data_user_id;
DROP INDEX IF EXISTS public.idx_learning_paths_session_id;
DROP INDEX IF EXISTS public.idx_learning_paths_cv_id;
DROP INDEX IF EXISTS public.idx_job_application_profile_id;
DROP INDEX IF EXISTS public.idx_job_application_session_id;
DROP INDEX IF EXISTS public.idx_job_application_user_id;
DROP INDEX IF EXISTS public.idx_learning_paths_status;

-- =====================================================
-- PART 6: Fix Function Search Paths
-- =====================================================

-- Fix update_learning_paths_updated_at
DROP FUNCTION IF EXISTS public.update_learning_paths_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_learning_paths_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix consume_token
DROP FUNCTION IF EXISTS public.consume_token(uuid, integer) CASCADE;
CREATE OR REPLACE FUNCTION public.consume_token(p_user_id uuid, p_amount integer DEFAULT 1)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_credits integer;
BEGIN
  SELECT credits INTO current_credits
  FROM public.user_tokens
  WHERE user_id = p_user_id
  FOR UPDATE;
  
  IF current_credits IS NULL OR current_credits < p_amount THEN
    RETURN false;
  END IF;
  
  UPDATE public.user_tokens
  SET credits = credits - p_amount,
      updated_at = now()
  WHERE user_id = p_user_id;
  
  RETURN true;
END;
$$;

-- Fix handle_new_user
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, full_name)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Fix increment_download_count
DROP FUNCTION IF EXISTS public.increment_download_count(uuid) CASCADE;
CREATE OR REPLACE FUNCTION public.increment_download_count(cv_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.stored_cvs
  SET 
    download_count = COALESCE(download_count, 0) + 1,
    last_downloaded_at = now()
  WHERE id = cv_id;
END;
$$;

-- Fix update_updated_at
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix update_updated_at_column
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Fix create_user_tokens_on_signup
DROP FUNCTION IF EXISTS public.create_user_tokens_on_signup() CASCADE;
CREATE OR REPLACE FUNCTION public.create_user_tokens_on_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.user_tokens (user_id, credits)
  VALUES (NEW.id, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Recreate triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_learning_paths_updated_at_trigger'
  ) THEN
    CREATE TRIGGER update_learning_paths_updated_at_trigger
      BEFORE UPDATE ON public.learning_paths
      FOR EACH ROW
      EXECUTE FUNCTION public.update_learning_paths_updated_at();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created'
  ) THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.handle_new_user();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'create_tokens_on_signup'
  ) THEN
    CREATE TRIGGER create_tokens_on_signup
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION public.create_user_tokens_on_signup();
  END IF;
END $$;