/*
  # Create Applications Table

  1. New Tables
    - `applications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `position` (text) - Job position title
      - `company` (text) - Company name
      - `description` (text, nullable) - Job description
      - `status` (text) - Application status
      - `cv_id` (uuid, nullable, foreign key to optimized_cvs)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. Security
    - Enable RLS on `applications` table
    - Add policies for authenticated users to manage their own applications
*/

CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  position text NOT NULL,
  company text NOT NULL,
  description text,
  status text DEFAULT 'entwurf' NOT NULL,
  cv_id uuid REFERENCES optimized_cvs(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own applications"
  ON applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own applications"
  ON applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON applications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);