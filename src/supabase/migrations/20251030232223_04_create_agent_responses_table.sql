/*
  # Create Agent Responses Table

  1. New Tables
    - `agent_responses`
      - `id` (uuid, primary key) - Unique identifier
      - `profile_id` (uuid, FK to profiles) - Profile owner
      - `session_id` (text, not null) - Session identifier
      - `cv_id` (uuid, nullable, FK to optimized_cvs) - Which CV these responses belong to
      - `section_id` (text, not null) - Section identifier: 'kontakt', 'bildung', 'berufserfahrung', etc.
      - `entry_index` (int) - For repeatable sections (multiple jobs, education, etc.)
      - `responses` (jsonb, not null) - The actual agent responses
      - `status` (text) - 'in_progress', 'completed', 'skipped'
      - `completed_at` (timestamp, nullable) - When section was completed
      - `created_at` (timestamp) - Creation timestamp
      - `updated_at` (timestamp) - Last update timestamp

  2. Indexes
    - Index on `profile_id`
    - Index on `session_id`
    - Index on `cv_id`
    - Index on `section_id`
    - Composite index on (`cv_id`, `section_id`, `entry_index`) for efficient queries

  3. Security
    - Enable RLS on `agent_responses` table
    - Cascade delete when profile is deleted
*/

-- Create agent_responses table
CREATE TABLE IF NOT EXISTS agent_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  cv_id uuid,
  section_id text NOT NULL,
  entry_index int DEFAULT 0,
  responses jsonb NOT NULL,
  status text DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'skipped')),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS agent_responses_profile_id_idx ON agent_responses(profile_id);
CREATE INDEX IF NOT EXISTS agent_responses_session_id_idx ON agent_responses(session_id);
CREATE INDEX IF NOT EXISTS agent_responses_cv_id_idx ON agent_responses(cv_id);
CREATE INDEX IF NOT EXISTS agent_responses_section_id_idx ON agent_responses(section_id);
CREATE INDEX IF NOT EXISTS agent_responses_cv_section_entry_idx ON agent_responses(cv_id, section_id, entry_index);

-- Enable RLS
ALTER TABLE agent_responses ENABLE ROW LEVEL SECURITY;