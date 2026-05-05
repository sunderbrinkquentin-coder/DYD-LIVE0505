/*
  # Enable Realtime on stored_cvs table

  ## Purpose
  Enables Supabase Realtime broadcasts for the stored_cvs table so that
  the CvResultPage can receive instant UPDATE notifications when the AI
  analysis completes, instead of relying solely on polling.

  ## Changes
  - Adds the stored_cvs table to the supabase_realtime publication

  ## Notes
  - This is additive and safe - no data is modified
  - The publication already exists (managed by Supabase), we just add the table
  - If the table is already in the publication, the IF NOT EXISTS guard prevents errors
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'stored_cvs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.stored_cvs;
  END IF;
END $$;
