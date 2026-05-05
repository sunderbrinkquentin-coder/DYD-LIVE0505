/*
  # Add Missing Columns and Create Required Tables

  ## Overview
  Extends the existing profiles table and creates missing tables needed by the application.

  ## Changes

  ### 1. Extend profiles table
  Add missing columns:
  - user_id (references auth.users)
  - session_id (for anonymous users)
  - is_anonymous (boolean flag)
  - registered_at (timestamp)

  ### 2. Create agent_responses table
  Stores agent conversation data

  ### 3. Create agent_progress table
  Tracks wizard progress

  ### 4. Create base_data table
  Stores collected wizard data

  ### 5. Create job_application table
  Stores job applications

  ## Security
  - RLS enabled on all tables
  - Policies for both authenticated and anonymous access
*/

-- Add missing columns to profiles table
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'session_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN session_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'is_anonymous'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_anonymous boolean DEFAULT true;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'registered_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN registered_at timestamptz;
  END IF;
END $$;

-- Create indexes on profiles
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_session_id ON profiles(session_id);

-- Update RLS policies for profiles
DROP POLICY IF EXISTS "Users can read own profile via user_id" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile via user_id" ON profiles;
DROP POLICY IF EXISTS "Anonymous can access via session_id" ON profiles;
DROP POLICY IF EXISTS "Authenticated can insert profiles" ON profiles;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (
    (auth.uid() = user_id) OR 
    (auth.role() = 'anon')
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (
    (auth.uid() = user_id) OR 
    (auth.role() = 'anon')
  )
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (auth.role() = 'anon')
  );

CREATE POLICY "Users can insert profiles"
  ON profiles FOR INSERT
  WITH CHECK (
    (auth.uid() = user_id) OR 
    (auth.role() = 'anon')
  );

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  USING (
    (auth.uid() = user_id) OR 
    (auth.role() = 'anon')
  );

-- Create agent_responses table
CREATE TABLE IF NOT EXISTS agent_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  cv_id uuid,
  status text NOT NULL,
  abschluss jsonb,
  skills jsonb,
  zertifikate jsonb,
  kontakt jsonb,
  sprachen jsonb,
  projekte jsonb,
  berufserfahrung jsonb,
  bildung jsonb,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agent_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can access agent responses"
  ON agent_responses FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_agent_responses_profile_id ON agent_responses(profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_responses_session_id ON agent_responses(session_id);

-- Create agent_progress table
CREATE TABLE IF NOT EXISTS agent_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  cv_id uuid,
  current_section_id text,
  current_section_index integer DEFAULT 0,
  current_question_index integer DEFAULT 0,
  completed_sections jsonb DEFAULT '{}'::jsonb,
  last_active_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE agent_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can access agent progress"
  ON agent_progress FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_agent_progress_profile_id ON agent_progress(profile_id);
CREATE INDEX IF NOT EXISTS idx_agent_progress_session_id ON agent_progress(session_id);

-- Create base_data table
CREATE TABLE IF NOT EXISTS base_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  onboarding_reason text,
  onboarding_industry text,
  onboarding_experience_level text,
  vorname text,
  nachname text,
  email text,
  telefon text,
  ort text,
  plz text,
  linkedin text,
  website text,
  bildung_entries jsonb DEFAULT '[]'::jsonb,
  berufserfahrung_entries jsonb DEFAULT '[]'::jsonb,
  projekte_entries jsonb DEFAULT '[]'::jsonb,
  sprachen_list jsonb DEFAULT '[]'::jsonb,
  zertifikate_entries jsonb DEFAULT '[]'::jsonb,
  hard_skills jsonb DEFAULT '[]'::jsonb,
  soft_skills jsonb DEFAULT '[]'::jsonb,
  top_skills jsonb DEFAULT '[]'::jsonb,
  zusaetzliche_infos text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE base_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can access base data"
  ON base_data FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_base_data_profile_id ON base_data(profile_id);
CREATE INDEX IF NOT EXISTS idx_base_data_session_id ON base_data(session_id);
CREATE INDEX IF NOT EXISTS idx_base_data_user_id ON base_data(user_id);

-- Create job_application table
CREATE TABLE IF NOT EXISTS job_application (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_id text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  rolle text,
  unternehmen text,
  stellenbeschreibung text,
  status text DEFAULT 'draft',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE job_application ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can access job applications"
  ON job_application FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_job_application_profile_id ON job_application(profile_id);
CREATE INDEX IF NOT EXISTS idx_job_application_session_id ON job_application(session_id);
CREATE INDEX IF NOT EXISTS idx_job_application_user_id ON job_application(user_id);
