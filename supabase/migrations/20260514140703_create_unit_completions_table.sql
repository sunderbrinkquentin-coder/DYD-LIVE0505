/*
  # Create unit_completions table

  Tracks which learning units (A/B variants from Make) a user has successfully
  completed for each learning path. A certificate is only issued when all 5
  required units are completed.

  ## New Table: unit_completions
  - `id` — auto-generated primary key
  - `learning_path_id` — FK to learning_paths.id
  - `user_id` — FK to auth.users (nullable for anonymous sessions)
  - `learning_result_id` — which learning_results row was completed (the exam content)
  - `unit_index` — position of this unit in the path (1–5)
  - `variant` — 'A' or 'B' (which version of the unit was shown)
  - `exam_score` — percentage correct on the final exam (0–100)
  - `completed_at` — timestamp when exam was passed

  ## Security
  - RLS enabled
  - Authenticated users can only read/insert their own rows
  - Anonymous users blocked (learning paths require payment which requires auth)

  ## Notes
  - UNIQUE on (learning_path_id, unit_index) prevents double-counting the same
    unit slot even if a user retakes a different variant
  - `completed_at` is set by the client when exam is passed, not by a trigger,
    so it represents the actual moment of completion
*/

CREATE TABLE IF NOT EXISTS unit_completions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id   uuid NOT NULL REFERENCES learning_paths(id) ON DELETE CASCADE,
  user_id            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  learning_result_id uuid REFERENCES learning_results(id) ON DELETE SET NULL,
  unit_index         integer NOT NULL CHECK (unit_index BETWEEN 1 AND 5),
  variant            text NOT NULL CHECK (variant IN ('A','B')) DEFAULT 'A',
  exam_score         integer NOT NULL DEFAULT 0 CHECK (exam_score BETWEEN 0 AND 100),
  completed_at       timestamptz NOT NULL DEFAULT now()
);

-- One completion per unit slot per path (prevents gaming by switching variants)
CREATE UNIQUE INDEX IF NOT EXISTS unit_completions_path_unit_uidx
  ON unit_completions (learning_path_id, unit_index);

-- Index for fast "how many units done for this path?" queries
CREATE INDEX IF NOT EXISTS unit_completions_path_idx
  ON unit_completions (learning_path_id);

ALTER TABLE unit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own unit completions"
  ON unit_completions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own unit completions"
  ON unit_completions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
