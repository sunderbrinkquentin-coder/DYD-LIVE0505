/*
  # Fix ats_analyses table: make columns nullable

  ## Problem
  The ats_analyses table has several NOT NULL columns with no default values:
  - ats_score (integer)
  - category_scores (jsonb)
  - feedback (jsonb)
  - recommendations (jsonb)
  - extracted_cv_data (jsonb)

  The application only saves analysis_data (full JSONB blob) + user_id + upload_id.
  Every INSERT was failing silently because these NOT NULL constraints were violated.

  ## Fix
  Make all these columns nullable so the INSERT succeeds with only the columns the
  app actually populates. The ats_score column also gets a default of 0 so the
  dashboard card display doesn't crash with null.

  ## Changes
  - ats_score: DROP NOT NULL, ADD DEFAULT 0
  - category_scores: DROP NOT NULL
  - feedback: DROP NOT NULL
  - recommendations: DROP NOT NULL
  - extracted_cv_data: DROP NOT NULL
*/

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ats_analyses' AND column_name = 'ats_score'
  ) THEN
    ALTER TABLE ats_analyses ALTER COLUMN ats_score DROP NOT NULL;
    ALTER TABLE ats_analyses ALTER COLUMN ats_score SET DEFAULT 0;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ats_analyses' AND column_name = 'category_scores'
  ) THEN
    ALTER TABLE ats_analyses ALTER COLUMN category_scores DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ats_analyses' AND column_name = 'feedback'
  ) THEN
    ALTER TABLE ats_analyses ALTER COLUMN feedback DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ats_analyses' AND column_name = 'recommendations'
  ) THEN
    ALTER TABLE ats_analyses ALTER COLUMN recommendations DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ats_analyses' AND column_name = 'extracted_cv_data'
  ) THEN
    ALTER TABLE ats_analyses ALTER COLUMN extracted_cv_data DROP NOT NULL;
  END IF;
END $$;
