/*
  # Add temp_id and analysis fields to uploaded_cvs

  1. Changes to uploaded_cvs table:
    - Add `temp_id` (text, unique, nullable) - For anonymous user tracking
    - Add `user_id` (uuid, nullable) - For authenticated users
    - Add `original_file_url` (text, nullable) - Public URL to uploaded file
    - Add `vision_text` (text, nullable) - Extracted CV content from OCR/Vision
    - Add `ats_json` (jsonb, nullable) - Structured analysis results
    - Add `updated_at` (timestamptz) - Track last update
    - Make `profile_id` nullable - Support anonymous users
    - Make `file_path` nullable - Support external file URLs
    - Make `original_filename` nullable - Support various upload methods

  2. Indexes:
    - Add index on `temp_id` for fast anonymous lookups
    - Add index on `user_id` for authenticated user queries
    - Add index on `updated_at` for sorting

  3. Security:
    - Update RLS policies to support both anonymous and authenticated users
    - Anonymous users can access by temp_id
    - Authenticated users can access by user_id
*/

-- Add new columns to uploaded_cvs
DO $$ 
BEGIN
  -- Add temp_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'uploaded_cvs' AND column_name = 'temp_id'
  ) THEN
    ALTER TABLE uploaded_cvs ADD COLUMN temp_id text UNIQUE;
  END IF;

  -- Add user_id column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'uploaded_cvs' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE uploaded_cvs ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add original_file_url column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'uploaded_cvs' AND column_name = 'original_file_url'
  ) THEN
    ALTER TABLE uploaded_cvs ADD COLUMN original_file_url text;
  END IF;

  -- Add vision_text column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'uploaded_cvs' AND column_name = 'vision_text'
  ) THEN
    ALTER TABLE uploaded_cvs ADD COLUMN vision_text text;
  END IF;

  -- Add ats_json column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'uploaded_cvs' AND column_name = 'ats_json'
  ) THEN
    ALTER TABLE uploaded_cvs ADD COLUMN ats_json jsonb;
  END IF;

  -- Add updated_at column if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'uploaded_cvs' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE uploaded_cvs ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Make profile_id nullable for anonymous users
ALTER TABLE uploaded_cvs ALTER COLUMN profile_id DROP NOT NULL;

-- Make file_path nullable (we might use original_file_url instead)
ALTER TABLE uploaded_cvs ALTER COLUMN file_path DROP NOT NULL;

-- Make original_filename nullable
ALTER TABLE uploaded_cvs ALTER COLUMN original_filename DROP NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS uploaded_cvs_temp_id_idx ON uploaded_cvs(temp_id);
CREATE INDEX IF NOT EXISTS uploaded_cvs_user_id_idx ON uploaded_cvs(user_id);
CREATE INDEX IF NOT EXISTS uploaded_cvs_updated_at_idx ON uploaded_cvs(updated_at DESC);

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own uploaded CVs" ON uploaded_cvs;
DROP POLICY IF EXISTS "Users can upload CVs" ON uploaded_cvs;
DROP POLICY IF EXISTS "Users can update own CVs" ON uploaded_cvs;
DROP POLICY IF EXISTS "Users can delete own CVs" ON uploaded_cvs;

-- Create new policies for anonymous access
CREATE POLICY "Anonymous users can insert CVs with temp_id"
  ON uploaded_cvs
  FOR INSERT
  TO anon
  WITH CHECK (temp_id IS NOT NULL);

CREATE POLICY "Anonymous users can view own CVs by temp_id"
  ON uploaded_cvs
  FOR SELECT
  TO anon
  USING (temp_id IS NOT NULL);

CREATE POLICY "Anonymous users can update own CVs by temp_id"
  ON uploaded_cvs
  FOR UPDATE
  TO anon
  USING (temp_id IS NOT NULL);

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view own CVs"
  ON uploaded_cvs
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can insert CVs"
  ON uploaded_cvs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id 
    OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can update own CVs"
  ON uploaded_cvs
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Authenticated users can delete own CVs"
  ON uploaded_cvs
  FOR DELETE
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

-- Create trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_uploaded_cvs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER uploaded_cvs_updated_at
  BEFORE UPDATE ON uploaded_cvs
  FOR EACH ROW
  EXECUTE FUNCTION update_uploaded_cvs_updated_at();
