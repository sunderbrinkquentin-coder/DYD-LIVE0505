/*
  # Create cv_records table

  1. New Tables
    - `cv_records`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users, nullable)
      - `cv_data` (jsonb, stores CV builder data)
      - `job_data` (jsonb, stores job targeting data, nullable)
      - `is_paid` (boolean, payment status, default false)
      - `source` (text, tracking where CV came from, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `cv_records` table
    - Add policies for authenticated users to manage their own CVs
    - Add policies for anonymous users to create CVs before login

  3. Data Migration
    - Copy existing data from `cvs` table to `cv_records`
*/

-- Create cv_records table
CREATE TABLE IF NOT EXISTS cv_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id),
  cv_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  job_data jsonb DEFAULT '{}'::jsonb,
  is_paid boolean DEFAULT false,
  source text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE cv_records ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read their own CVs
CREATE POLICY "Users can read own CVs"
  ON cv_records FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Authenticated users can insert their own CVs
CREATE POLICY "Users can insert own CVs"
  ON cv_records FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can update their own CVs
CREATE POLICY "Users can update own CVs"
  ON cv_records FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Authenticated users can delete their own CVs
CREATE POLICY "Users can delete own CVs"
  ON cv_records FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Anonymous users can create CVs (user_id will be null initially)
CREATE POLICY "Anonymous users can create CVs"
  ON cv_records FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

-- Policy: Anonymous users can read CVs without user_id
CREATE POLICY "Anonymous users can read own CVs"
  ON cv_records FOR SELECT
  TO anon
  USING (user_id IS NULL);

-- Policy: Anonymous users can update CVs without user_id
CREATE POLICY "Anonymous users can update own CVs"
  ON cv_records FOR UPDATE
  TO anon
  USING (user_id IS NULL)
  WITH CHECK (user_id IS NULL);

-- Migrate existing data from cvs to cv_records
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cvs') THEN
    INSERT INTO cv_records (id, user_id, cv_data, job_data, is_paid, created_at, updated_at)
    SELECT id, user_id, cv_data, job_data, is_paid, created_at, updated_at
    FROM cvs
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

-- Create index for faster user lookups
CREATE INDEX IF NOT EXISTS idx_cv_records_user_id ON cv_records(user_id);
CREATE INDEX IF NOT EXISTS idx_cv_records_created_at ON cv_records(created_at DESC);
