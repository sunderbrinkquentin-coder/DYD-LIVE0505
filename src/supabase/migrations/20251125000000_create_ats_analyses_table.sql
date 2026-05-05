/*
  # Create ATS Analyses Table

  1. New Tables
    - `ats_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `upload_id` (uuid, references cv_uploads)
      - `ats_score` (integer)
      - `analysis_data` (jsonb)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `ats_analyses` table
    - Add policies for authenticated users to manage their own analyses
*/

-- Create ats_analyses table
CREATE TABLE IF NOT EXISTS ats_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  upload_id uuid REFERENCES cv_uploads(id) ON DELETE SET NULL,
  ats_score integer NOT NULL CHECK (ats_score >= 0 AND ats_score <= 100),
  analysis_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ats_analyses_user_id ON ats_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_ats_analyses_upload_id ON ats_analyses(upload_id);
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

CREATE TRIGGER set_ats_analyses_updated_at
  BEFORE UPDATE ON ats_analyses
  FOR EACH ROW
  EXECUTE FUNCTION update_ats_analyses_updated_at();
