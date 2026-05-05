/*
  # Application Tracking System

  1. New Tables
    - `applications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `cv_id` (uuid, nullable - reference to CV if exists)
      - `job_title` (text, required)
      - `company` (text, required)
      - `job_link` (text, nullable - URL to job posting)
      - `created_at` (timestamptz, default now)
      - `updated_at` (timestamptz, default now)
      - `status` (text, required - ENTWURF, VERSCHICKT, INTERVIEW, ANGEBOT, TRAUMJOB)
      - `contact_name` (text, nullable)
      - `contact_role` (text, nullable)
      - `contact_email` (text, nullable)
      - `contact_phone` (text, nullable)
      - `notes` (text, nullable)

  2. Security
    - Enable RLS on `applications` table
    - Add policies for authenticated users to manage their own applications
    
  3. Indexes
    - Index on user_id for fast queries
    - Index on status for filtering
    - Index on created_at for sorting

  4. Triggers
    - Auto-update updated_at timestamp
*/

-- Create applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id uuid,
  job_title text NOT NULL,
  company text NOT NULL,
  job_link text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  status text NOT NULL DEFAULT 'ENTWURF' CHECK (status IN ('ENTWURF', 'VERSCHICKT', 'INTERVIEW', 'ANGEBOT', 'TRAUMJOB')),
  contact_name text,
  contact_role text,
  contact_email text,
  contact_phone text,
  notes text
);

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Users can view own applications"
  ON applications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON applications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own applications"
  ON applications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own applications"
  ON applications
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow anonymous users to create applications (for MVP without auth)
CREATE POLICY "Anonymous users can insert applications"
  ON applications
  FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can view all applications"
  ON applications
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can update applications"
  ON applications
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete applications"
  ON applications
  FOR DELETE
  TO anon
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_applications_company ON applications(company);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_updated_at();

-- Create helper function to get application statistics
CREATE OR REPLACE FUNCTION get_application_stats(user_uuid uuid DEFAULT NULL)
RETURNS TABLE (
  total bigint,
  entwurf bigint,
  verschickt bigint,
  interview bigint,
  angebot bigint,
  traumjob bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::bigint as total,
    COUNT(*) FILTER (WHERE status = 'ENTWURF')::bigint as entwurf,
    COUNT(*) FILTER (WHERE status = 'VERSCHICKT')::bigint as verschickt,
    COUNT(*) FILTER (WHERE status = 'INTERVIEW')::bigint as interview,
    COUNT(*) FILTER (WHERE status = 'ANGEBOT')::bigint as angebot,
    COUNT(*) FILTER (WHERE status = 'TRAUMJOB')::bigint as traumjob
  FROM applications
  WHERE user_uuid IS NULL OR applications.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
