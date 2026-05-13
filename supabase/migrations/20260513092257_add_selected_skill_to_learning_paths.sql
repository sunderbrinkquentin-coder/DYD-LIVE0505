/*
  # Add selected_skill to learning_paths

  Stores the specific skill the user selected when purchasing the learning path,
  so the curriculum webhook can generate a focused module for that skill only.

  1. Changes
    - `learning_paths`: add `selected_skill` (text, nullable)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_paths' AND column_name = 'selected_skill'
  ) THEN
    ALTER TABLE learning_paths ADD COLUMN selected_skill text;
  END IF;
END $$;
