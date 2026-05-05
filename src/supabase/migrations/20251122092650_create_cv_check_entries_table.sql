-- Create CV Check Entries Table
-- This table stores CV check results and parsed data

CREATE TABLE IF NOT EXISTS cv_check_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id),
  session_id text NOT NULL,
  uploaded_cv_id uuid REFERENCES uploaded_cvs(id),
  mode text DEFAULT 'check',
  cv_raw text,
  cv_parsed jsonb DEFAULT '{}'::jsonb,
  check_scores jsonb DEFAULT '{}'::jsonb,
  check_feedback jsonb DEFAULT '{}'::jsonb,
  overall_score integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cv_check_entries ENABLE ROW LEVEL SECURITY;

-- Policies for anonymous users (session-based)
CREATE POLICY "Anonymous users can insert own CV checks"
  ON cv_check_entries FOR INSERT
  TO anon
  WITH CHECK (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

CREATE POLICY "Anonymous users can view own CV checks"
  ON cv_check_entries FOR SELECT
  TO anon
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

CREATE POLICY "Anonymous users can update own CV checks"
  ON cv_check_entries FOR UPDATE
  TO anon
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view own CV checks"
  ON cv_check_entries FOR SELECT
  TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can insert own CV checks"
  ON cv_check_entries FOR INSERT
  TO authenticated
  WITH CHECK (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Authenticated users can update own CV checks"
  ON cv_check_entries FOR UPDATE
  TO authenticated
  USING (profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cv_check_entries_session_id ON cv_check_entries(session_id);
CREATE INDEX IF NOT EXISTS idx_cv_check_entries_profile_id ON cv_check_entries(profile_id);
