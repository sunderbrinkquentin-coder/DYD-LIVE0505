/*
  # Career Vision Explorer - Learning Paths Table

  1. New Tables
    - `learning_paths`
      - `id` (uuid, primary key) - Unique identifier for learning path
      - `user_id` (uuid, nullable) - Links to auth.users (nullable for anonymous)
      - `session_id` (text, nullable) - Session tracking for anonymous users
      - `cv_id` (uuid, nullable) - Links to stored_cvs (nullable - works without CV)
      - `target_job` (text) - Vision job title (e.g., "Senior Product Manager")
      - `target_company` (text, nullable) - Optional target company
      - `vision_description` (text, nullable) - User's vision statement
      - `missing_skills` (jsonb) - Array of skills user needs to acquire
      - `current_skills` (jsonb, nullable) - Skills user already has (from CV or self-assessment)
      - `curriculum` (jsonb, nullable) - Learning curriculum with modules/stages
      - `progress` (jsonb) - Progress tracking for each module
      - `status` (text) - Status: 'analyzing', 'curriculum_ready', 'in_progress', 'completed'
      - `is_paid` (boolean) - Whether user has paid for learning path
      - `certificate_issued_at` (timestamptz, nullable) - When certificate was issued
      - `certificate_url` (text, nullable) - URL to certificate PDF
      - `created_at` (timestamptz) - Creation timestamp
      - `updated_at` (timestamptz) - Last update timestamp

  2. Security
    - Enable RLS on `learning_paths` table
    - Policies for authenticated users to manage their own paths
    - Policies for anonymous users using session_id
*/

-- Create learning_paths table
CREATE TABLE IF NOT EXISTS learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  cv_id uuid,
  target_job text NOT NULL,
  target_company text,
  vision_description text,
  missing_skills jsonb DEFAULT '[]'::jsonb,
  current_skills jsonb DEFAULT '[]'::jsonb,
  curriculum jsonb,
  progress jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'analyzing' CHECK (status IN ('analyzing', 'curriculum_ready', 'in_progress', 'completed')),
  is_paid boolean DEFAULT false,
  certificate_issued_at timestamptz,
  certificate_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view their own learning paths
CREATE POLICY "Users can view own learning paths"
  ON learning_paths FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Anonymous users can view learning paths by session_id
CREATE POLICY "Anonymous users can view by session"
  ON learning_paths FOR SELECT
  TO anon
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

-- Policy: Authenticated users can insert their own learning paths
CREATE POLICY "Users can create own learning paths"
  ON learning_paths FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Anonymous users can insert with session_id
CREATE POLICY "Anonymous users can create with session"
  ON learning_paths FOR INSERT
  TO anon
  WITH CHECK (session_id IS NOT NULL);

-- Policy: Authenticated users can update their own learning paths
CREATE POLICY "Users can update own learning paths"
  ON learning_paths FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Anonymous users can update by session_id
CREATE POLICY "Anonymous users can update by session"
  ON learning_paths FOR UPDATE
  TO anon
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
  WITH CHECK (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

-- Policy: Authenticated users can delete their own learning paths
CREATE POLICY "Users can delete own learning paths"
  ON learning_paths FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_session_id ON learning_paths(session_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_cv_id ON learning_paths(cv_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_status ON learning_paths(status);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_learning_paths_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_learning_paths_updated_at
  BEFORE UPDATE ON learning_paths
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_paths_updated_at();
