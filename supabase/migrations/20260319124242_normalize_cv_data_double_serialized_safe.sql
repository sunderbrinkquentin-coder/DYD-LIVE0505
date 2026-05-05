/*
  # Normalize double-serialized cv_data in stored_cvs (safe version)

  ## Problem
  Some cv_data rows are stored as a JSONB string (jsonb_typeof = 'string') rather
  than a JSONB object. This happens when Make.com sends a JSON string instead of
  a JSON object to the Supabase webhook, causing the value to be double-serialized.

  ## Fix
  Iterates through each affected row individually, attempts to cast the inner string
  back to JSONB. Rows where the inner value is not valid JSON are left unchanged.

  ## Safety
  - Processes one row at a time with exception handling
  - Invalid rows are skipped and logged but not modified
  - Only affects rows where jsonb_typeof(cv_data) = 'string'
*/

DO $$
DECLARE
  rec RECORD;
  updated_count integer := 0;
  skipped_count integer := 0;
  parsed jsonb;
BEGIN
  FOR rec IN
    SELECT id, cv_data #>> '{}' AS raw_string
    FROM stored_cvs
    WHERE jsonb_typeof(cv_data) = 'string'
      AND (cv_data #>> '{}') IS NOT NULL
      AND (cv_data #>> '{}') <> ''
  LOOP
    BEGIN
      parsed := rec.raw_string::jsonb;
      UPDATE stored_cvs
      SET cv_data = parsed,
          updated_at = now()
      WHERE id = rec.id;
      updated_count := updated_count + 1;
    EXCEPTION WHEN OTHERS THEN
      skipped_count := skipped_count + 1;
    END;
  END LOOP;

  RAISE NOTICE 'cv_data normalization: % rows updated, % rows skipped (invalid JSON)', updated_count, skipped_count;
END $$;
