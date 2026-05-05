/*
  # Fix cv-pdfs Storage Bucket Policies

  ## Problem
  The cv-pdfs bucket was missing SELECT and UPDATE policies, causing a 400 "row-level
  security policy" error when authenticated users tried to upload PDFs. Supabase storage
  uses upsert=true which internally requires:
    1. SELECT – to check if the file already exists
    2. INSERT or UPDATE – to write the file

  Without a SELECT policy, the upsert pre-check fails and the entire upload is rejected.

  ## Changes
  1. Add SELECT policy: authenticated users can read their own PDFs (folder = their user id)
  2. Add UPDATE policy: authenticated users can overwrite their own PDFs (needed for upsert)

  ## Security
  Both policies restrict access to files under the user's own folder (storage.foldername(name)[1] = auth.uid())
*/

CREATE POLICY "Users can read own PDFs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'cv-pdfs'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own PDFs"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'cv-pdfs'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  )
  WITH CHECK (
    bucket_id = 'cv-pdfs'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
