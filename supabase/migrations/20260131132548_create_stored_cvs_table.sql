/*
  # Create stored_cvs Table - Unified CV Storage

  ## Overview
  Creates the missing `stored_cvs` table that the application code references throughout.
  This table consolidates CV Builder and CV Check workflows.

  ## New Table: stored_cvs
  
  ### Core Fields
  - `id` (uuid, primary key) - Unique CV identifier
  - `user_id` (uuid, FK to auth.users) - CV owner (nullable for anonymous)
  - `session_id` (text) - Session identifier for anonymous users
  - `cv_data` (jsonb) - Main CV builder data
  - `job_data` (jsonb) - Job targeting data
  
  ### Editor & Insights
  - `editor_data` (jsonb) - Editor-specific data
  - `insights` (jsonb array) - AI-generated insights
  
  ### Status Tracking
  - `status` (text) - Workflow status: draft, processing, completed, failed
  - `source` (text) - Origin: wizard, check, upload, agent
  - `is_paid` (boolean) - Payment status
  - `download_unlocked` (boolean) - Download permission
  
  ### Files & Processing
  - `pdf_url` (text) - Generated PDF URL
  - `file_name` (text) - Original filename
  - `ats_json` (jsonb) - ATS analysis results
  - `vision_text` (text) - OCR extracted text
  - `error_message` (text) - Error details if failed
  
  ### Timestamps
  - `created_at` (timestamptz) - Creation time
  - `updated_at` (timestamptz) - Last update time
  - `processed_at` (timestamptz) - Processing completion time

  ## Indexes
  - Index on `user_id` for authenticated user queries
  - Index on `session_id` for anonymous access
  - Index on `status` for workflow filtering
  - Index on `source` for flow-specific queries

  ## Security (RLS)
  - Authenticated users can manage their own CVs
  - Anonymous users can access via session (permissive for development)
  - Anon role can create CVs before authentication

  ## Data Migration
  - Migrates existing data from `cvs` table if it exists
  - Preserves all existing CV data
*/

-- Create stored_cvs table with all required fields
CREATE TABLE IF NOT EXISTS stored_cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text,
  
  -- Core CV Data
  cv_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  job_data jsonb DEFAULT '{}'::jsonb,
  editor_data jsonb DEFAULT '{}'::jsonb,
  insights jsonb DEFAULT '[]'::jsonb,
  
  -- Status & Metadata
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'processing', 'completed', 'failed')),
  source text DEFAULT 'wizard' CHECK (source IN ('wizard', 'check', 'upload', 'agent', 'builder')),
  is_paid boolean DEFAULT false,
  download_unlocked boolean DEFAULT false,
  
  -- Files & Processing Results
  pdf_url text,
  file_name text,
  ats_json jsonb,
  vision_text text,
  error_message text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_stored_cvs_user_id ON stored_cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_stored_cvs_session_id ON stored_cvs(session_id);
CREATE INDEX IF NOT EXISTS idx_stored_cvs_status ON stored_cvs(status);
CREATE INDEX IF NOT EXISTS idx_stored_cvs_source ON stored_cvs(source);
CREATE INDEX IF NOT EXISTS idx_stored_cvs_created_at ON stored_cvs(created_at DESC);

-- Enable RLS
ALTER TABLE stored_cvs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Authenticated Users
CREATE POLICY "Authenticated users can read own CVs"
  ON stored_cvs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own CVs"
  ON stored_cvs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own CVs"
  ON stored_cvs FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own CVs"
  ON stored_cvs FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for Anonymous Users (permissive for development)
CREATE POLICY "Anonymous users can access all"
  ON stored_cvs FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- Migrate existing data from cvs table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cvs' AND table_schema = 'public') THEN
    INSERT INTO stored_cvs (id, user_id, cv_data, job_data, is_paid, created_at, updated_at)
    SELECT 
      id, 
      user_id, 
      cv_data, 
      job_data, 
      is_paid, 
      created_at, 
      updated_at
    FROM cvs
    WHERE NOT EXISTS (SELECT 1 FROM stored_cvs WHERE stored_cvs.id = cvs.id)
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
