/*
  # Increase stale CV cleanup threshold from 5 to 10 minutes

  ## Problem
  The previous threshold of 5 minutes was too aggressive. Make.com can legitimately
  take longer to process CVs under load, causing valid jobs to be marked as failed
  prematurely. This was one of the root causes of the CV-Check appearing broken.

  ## Changes
  1. Replaces the `mark_stale_processing_cvs_as_failed` function with an updated version
     that uses a 10-minute threshold instead of 5 minutes.
  2. Re-schedules the pg_cron job (unchanged: runs every 2 minutes).

  ## Notes
  - Uses CREATE OR REPLACE – safe to run multiple times.
  - Only marks records as failed if both status='processing' AND updated_at is older
    than 10 minutes (records with recent heartbeat updates are not affected).
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
    AND updated_at < now() - interval '10 minutes';

  GET DIAGNOSTICS updated_count = ROW_COUNT;

  IF updated_count > 0 THEN
    RAISE NOTICE '[mark_stale] Marked % stuck CV(s) as failed', updated_count;
  END IF;

  RETURN updated_count;
END;
$$;
