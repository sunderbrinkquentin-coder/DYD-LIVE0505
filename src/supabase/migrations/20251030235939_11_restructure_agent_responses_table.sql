/*
  # Restructure Agent Responses Table

  This migration restructures the agent_responses table from a "row per section" model
  to a "row per response with columns per section" model.

  ## Changes

  1. Drop existing agent_responses table
    - Remove old structure with section_id, entry_index, and generic responses field
    - This is a clean slate migration - no data preservation needed

  2. Create new agent_responses table with section-specific columns
    - `id` (uuid, primary key) - Unique identifier
    - `profile_id` (uuid, FK to profiles) - Profile owner
    - `session_id` (text, not null) - Session identifier
    - `cv_id` (uuid, nullable, FK to optimized_cvs) - Which CV these responses belong to
    - `status` (text) - Overall status: 'in_progress', 'completed', 'skipped'
    - `abschluss` (jsonb, nullable) - Responses for Abschluss section
    - `skills` (jsonb, nullable) - Responses for Skills section
    - `zertifikate` (jsonb, nullable) - Responses for Zertifikate section
    - `kontakt` (jsonb, nullable) - Responses for Kontakt section
    - `sprachen` (jsonb, nullable) - Responses for Sprachen section
    - `projekte` (jsonb, nullable) - Responses for Projekte section
    - `berufserfahrung` (jsonb, nullable) - Responses for Berufserfahrung section
    - `bildung` (jsonb, nullable) - Responses for Bildung section
    - `completed_at` (timestamp, nullable) - When all sections were completed
    - `created_at` (timestamp) - Creation timestamp
    - `updated_at` (timestamp) - Last update timestamp

  3. Indexes
    - Index on `profile_id`
    - Index on `session_id`
    - Index on `cv_id`

  4. Security
    - Enable RLS on `agent_responses` table
    - Create policies for authenticated users to manage their own data
*/

-- Drop existing agent_responses table and related objects
DROP TABLE IF EXISTS agent_responses CASCADE;

-- Create new agent_responses table with section columns
CREATE TABLE IF NOT EXISTS agent_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  cv_id uuid REFERENCES optimized_cvs(id) ON DELETE SET NULL,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'skipped')),
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

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS agent_responses_profile_id_idx ON agent_responses(profile_id);
CREATE INDEX IF NOT EXISTS agent_responses_session_id_idx ON agent_responses(session_id);
CREATE INDEX IF NOT EXISTS agent_responses_cv_id_idx ON agent_responses(cv_id);

-- Enable RLS
ALTER TABLE agent_responses ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own agent responses"
  ON agent_responses FOR SELECT
  TO authenticated
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert own agent responses"
  ON agent_responses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can update own agent responses"
  ON agent_responses FOR UPDATE
  TO authenticated
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "Users can delete own agent responses"
  ON agent_responses FOR DELETE
  TO authenticated
  USING (auth.uid() = profile_id);

-- Anonymous users can manage their session-based responses
CREATE POLICY "Anonymous users can view own session responses"
  ON agent_responses FOR SELECT
  TO anon
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

CREATE POLICY "Anonymous users can insert own session responses"
  ON agent_responses FOR INSERT
  TO anon
  WITH CHECK (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

CREATE POLICY "Anonymous users can update own session responses"
  ON agent_responses FOR UPDATE
  TO anon
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
  WITH CHECK (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

CREATE POLICY "Anonymous users can delete own session responses"
  ON agent_responses FOR DELETE
  TO anon
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_agent_responses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agent_responses_updated_at
  BEFORE UPDATE ON agent_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_agent_responses_updated_at();
