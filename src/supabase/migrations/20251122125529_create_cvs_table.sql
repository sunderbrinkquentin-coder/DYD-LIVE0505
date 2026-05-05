/*
  # CV Storage System

  1. New Tables
    - `cvs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `cv_data` (jsonb, stores complete CVBuilderData)
      - `job_data` (jsonb, stores job targeting info)
      - `is_paid` (boolean, default false - paywall flag)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)

  2. Security
    - Enable RLS on `cvs` table
    - Add policies for authenticated users to manage their own CVs
    - Add policies for anonymous users (temporary CVs before auth)
    
  3. Indexes
    - Index on user_id for fast queries
    - Index on is_paid for filtering
    - Index on created_at for sorting

  4. Triggers
    - Auto-update updated_at timestamp
*/

-- Create cvs table
CREATE TABLE IF NOT EXISTS cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  job_data jsonb DEFAULT '{}'::jsonb,
  is_paid boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view own CVs"
  ON cvs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CVs"
  ON cvs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own CVs"
  ON cvs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own CVs"
  ON cvs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for anonymous users (temporary CVs)
CREATE POLICY "Anonymous users can insert CVs"
  ON cvs
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can view CVs by ID"
  ON cvs
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can update CVs"
  ON cvs
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete CVs"
  ON cvs
  FOR DELETE
  TO anon
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_is_paid ON cvs(is_paid);
CREATE INDEX IF NOT EXISTS idx_cvs_created_at ON cvs(created_at DESC);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_cvs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cvs_updated_at
  BEFORE UPDATE ON cvs
  FOR EACH ROW
  EXECUTE FUNCTION update_cvs_updated_at();
