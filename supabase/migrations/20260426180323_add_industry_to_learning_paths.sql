/*
  # Add industry column to learning_paths

  1. Changes
    - `learning_paths`: add optional `industry` text column to store the user-selected sector
      for the skill-gap analysis. Used in the Make webhook payload.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_paths' AND column_name = 'industry'
  ) THEN
    ALTER TABLE learning_paths ADD COLUMN industry text;
  END IF;
END $$;
