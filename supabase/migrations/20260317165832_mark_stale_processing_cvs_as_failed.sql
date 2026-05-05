/*
  # Mark stale processing CVs as failed

  ## Purpose
  CVs stuck in status='processing' for more than 5 minutes indicate a broken
  pipeline (Make.com timeout, webhook never received, etc.). This migration
  creates a helper function and schedules it via pg_cron to automatically
  flip such records to status='failed' with a descriptive error message.

  ## Changes
  1. Creates function `mark_stale_processing_cvs_as_failed()` that updates all
     stored_cvs rows where status='processing' AND updated_at is older than 5 minutes.
  2. Schedules the function to run every 2 minutes via pg_cron (if the extension
     is available).

  ## Notes
  - Uses IF EXISTS guards throughout – safe to run multiple times.
  - pg_cron is available on Supabase Pro/Team plans. On lower plans the function
    is still created and can be called manually or via an external cron.
  - No data is deleted – only the status field is updated.
*/

CREATE OR REPLACE FUNCTION mark_stale_processing_cvs_as_failed()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE stored_cvs
  SET
    status        = 'failed',
    error_message = 'Analyse-Timeout: Die Verarbeitung hat zu lange gedauert. Bitte versuche es erneut.',
    updated_at    = now()
  WHERE
    status     = 'processing'
    AND updated_at < now() - interval '5 minutes';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count > 0 THEN
    RAISE NOTICE '[mark_stale] Marked % stuck CV(s) as failed', updated_count;
  END IF;

  RETURN updated_count;
END;
$$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.unschedule('mark-stale-processing-cvs');
    PERFORM cron.schedule(
      'mark-stale-processing-cvs',
      '*/2 * * * *',
      'SELECT mark_stale_processing_cvs_as_failed()'
    );
    RAISE NOTICE '[mark_stale] pg_cron job scheduled every 2 minutes';
  ELSE
    RAISE NOTICE '[mark_stale] pg_cron not available – function created but not scheduled';
  END IF;
END $$;
