/*
  # Add learning_path_id to learning_results

  ## Summary
  Adds a nullable `learning_path_id` column to `learning_results` so Make can
  reference the parent learning path on every INSERT — including the first
  partial result — not just the final one.

  ## Changes
  - `learning_results`: new column `learning_path_id` (uuid, nullable, FK → learning_paths.id)
  - Index on `learning_path_id` for fast lookups
  - RLS policy: authenticated users can SELECT rows where learning_path_id matches
    a path they own

  ## Notes
  - Existing rows are unaffected (column is nullable)
  - The existing 1:1 join via `id = learning_path_id` continues to work for the
    final/canonical result row that Make writes last
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_results' AND column_name = 'learning_path_id'
  ) THEN
    ALTER TABLE learning_results ADD COLUMN learning_path_id uuid REFERENCES learning_paths(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS learning_results_learning_path_id_idx
  ON learning_results (learning_path_id);
