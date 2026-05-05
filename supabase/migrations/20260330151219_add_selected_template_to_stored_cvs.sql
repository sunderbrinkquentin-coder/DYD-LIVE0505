/*
  # Add selected_template column to stored_cvs

  ## Summary
  Adds a `selected_template` column to the `stored_cvs` table so that
  the user's CV template choice (modern, classic, minimal, creative, professional)
  is persisted in the database and restored when they return to the live editor.

  ## Changes
  - `stored_cvs.selected_template` (text, nullable): stores the template id chosen by the user
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stored_cvs' AND column_name = 'selected_template'
  ) THEN
    ALTER TABLE stored_cvs ADD COLUMN selected_template text;
  END IF;
END $$;
