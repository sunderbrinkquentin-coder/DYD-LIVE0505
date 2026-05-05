/*
  # Fix CV Uploads Storage Policy - Resolve Upload Hang Issue

  ## Problem
  The current INSERT policy `cv_uploads_anon_authenticated_insert` is correctly structured,
  but uploads are hanging at "Starting storage upload..." because of a potential RLS issue
  or missing explicit PUBLIC access for the public bucket.

  ## Changes
  1. Drop and recreate the INSERT policy with clearer logic
  2. Ensure both anon and authenticated users can upload to raw/ folder
  3. Add explicit PUBLIC read access for cv-uploads bucket
  4. Remove the dangerous allow_all_storage policy that uses USING (true)

  ## Security
  - INSERT: Only to raw/ folder in cv-uploads bucket
  - SELECT: Public read access (bucket is public)
  - UPDATE/DELETE: Only owners can modify their files
*/

-- Drop the dangerous catch-all policy
DROP POLICY IF EXISTS "allow_all_storage" ON storage.objects;

-- Recreate the INSERT policy with better logic
DROP POLICY IF EXISTS "cv_uploads_anon_authenticated_insert" ON storage.objects;

CREATE POLICY "cv_uploads_anon_authenticated_insert"
  ON storage.objects
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (
    bucket_id = 'cv-uploads'
    AND (storage.foldername(name))[1] = 'raw'
  );

-- Ensure public SELECT access for cv-uploads
DROP POLICY IF EXISTS "cv_uploads_public_select" ON storage.objects;

CREATE POLICY "cv_uploads_public_select"
  ON storage.objects
  FOR SELECT
  TO PUBLIC
  USING (bucket_id = 'cv-uploads');

-- Keep the authenticated select policy for additional security
-- (already exists as cv_uploads_authenticated_select)

-- Ensure authenticated users can update their own files
DROP POLICY IF EXISTS "cv_uploads_owner_update" ON storage.objects;

CREATE POLICY "cv_uploads_owner_update"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'cv-uploads'
    AND name IN (
      SELECT substring(file_path, 'raw/(.*)')
      FROM stored_cvs
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'cv-uploads'
    AND name IN (
      SELECT substring(file_path, 'raw/(.*)')
      FROM stored_cvs
      WHERE user_id = auth.uid()
    )
  );

-- Ensure authenticated users can delete their own files
DROP POLICY IF EXISTS "cv_uploads_owner_delete" ON storage.objects;

CREATE POLICY "cv_uploads_owner_delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'cv-uploads'
    AND name IN (
      SELECT substring(file_path, 'raw/(.*)')
      FROM stored_cvs
      WHERE user_id = auth.uid()
    )
  );