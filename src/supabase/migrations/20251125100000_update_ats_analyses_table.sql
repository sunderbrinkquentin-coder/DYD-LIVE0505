/*
  # Update ATS Analyses Table with Complete Structure

  1. Changes
    - Add category_scores JSONB column
    - Add feedback JSONB column
    - Add recommendations JSONB column
    - Add extracted_cv_data JSONB column
    - Add cv_id reference to cvs table
    - Update constraints and indexes

  2. Security
    - Keep existing RLS policies
*/

-- Drop existing table if needed
DROP TABLE IF EXISTS ats_analyses CASCADE;

-- Create complete ats_analyses table
CREATE TABLE IF NOT EXISTS ats_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_id uuid REFERENCES cv_uploads(id) ON DELETE SET NULL,
  cv_id uuid REFERENCES cvs(id) ON DELETE SET NULL,
  ats_score integer NOT NULL CHECK (ats_score >= 0 AND ats_score <= 100),
  category_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  feedback jsonb NOT NULL DEFAULT '{}'::jsonb,
  recommendations jsonb NOT NULL DEFAULT '{}'::jsonb,
  extracted_cv_data jsonb DEFAULT '{}'::jsonb,
  analysis_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_ats_analyses_user_id ON ats_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ats_analyses_upload_id ON ats_analyses(upload_id);
CREATE INDEX IF NOT EXISTS idx_ats_analyses_cv_id ON ats_analyses(cv_id);
CREATE INDEX IF NOT EXISTS idx_ats_analyses_created_at ON ats_analyses(created_at DESC);

-- Enable RLS
ALTER TABLE ats_analyses ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own analyses
CREATE POLICY "Users can view own analyses"
  ON ats_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own analyses
CREATE POLICY "Users can insert own analyses"
  ON ats_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own analyses
CREATE POLICY "Users can update own analyses"
  ON ats_analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own analyses
CREATE POLICY "Users can delete own analyses"
  ON ats_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_ats_analyses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_ats_analyses_updated_at ON ats_analyses;

CREATE TRIGGER set_ats_analyses_updated_at
  BEFORE UPDATE ON ats_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_ats_analyses_updated_at();
