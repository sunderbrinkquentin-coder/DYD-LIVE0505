/*
  # Create Agent Progress Table

  1. New Tables
    - `agent_progress` (Session Management for Agent Flow)
      - `id` (uuid, primary key) - Unique identifier
      - `profile_id` (uuid, unique, FK to profiles) - One progress per profile
      - `session_id` (text, unique, not null) - Session identifier
      - `cv_id` (uuid, nullable, FK to optimized_cvs) - Current CV being worked on
      - `current_section_id` (text) - Current section in agent flow
      - `current_section_index` (int) - Current section position
      - `current_question_index` (int) - Current question within section
      - `completed_sections` (jsonb) - Array of completed section IDs
      - `last_active_at` (timestamp) - Last activity timestamp
      - `updated_at` (timestamp) - Last update timestamp

  2. Indexes
    - Unique index on `profile_id`
    - Unique index on `session_id`
    - Index on `cv_id`

  3. Security
    - Enable RLS on `agent_progress` table
    - Cascade delete when profile is deleted
  
  4. Important Notes
    - This table enables resume functionality for agent flow
    - One progress record per profile (enforced by unique constraint)
    - Updated whenever user progresses through agent flow
*/

-- Create agent_progress table
CREATE TABLE IF NOT EXISTS agent_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id text UNIQUE NOT NULL,
  cv_id uuid REFERENCES optimized_cvs(id) ON DELETE SET NULL,
  current_section_id text,
  current_section_index int DEFAULT 0,
  current_question_index int DEFAULT 0,
  completed_sections jsonb DEFAULT '[]'::jsonb,
  last_active_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS agent_progress_profile_id_idx ON agent_progress(profile_id);
CREATE UNIQUE INDEX IF NOT EXISTS agent_progress_session_id_idx ON agent_progress(session_id);
CREATE INDEX IF NOT EXISTS agent_progress_cv_id_idx ON agent_progress(cv_id);

-- Enable RLS
ALTER TABLE agent_progress ENABLE ROW LEVEL SECURITY;