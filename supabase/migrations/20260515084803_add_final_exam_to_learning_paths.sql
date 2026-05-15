/*
  # Add final exam fields to learning_paths

  ## Summary
  Adds columns to track the final exam lifecycle on a learning path:
  - final_exam_status: tracks where the exam is (none / triggered / ready / passed / failed)
  - final_exam_score: 0–100 percentage score from the exam
  - final_exam_questions: JSONB array of questions returned by Make after triggering the exam webhook
  - final_exam_triggered_at: timestamp when the exam webhook was fired

  ## New Columns (learning_paths)
  - `final_exam_status` text DEFAULT 'none' — none | triggered | ready | passed | failed
  - `final_exam_score` integer DEFAULT NULL — 0–100, set after exam submission
  - `final_exam_questions` jsonb DEFAULT NULL — question array written back by Make callback
  - `final_exam_triggered_at` timestamptz DEFAULT NULL — when exam webhook was fired
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_paths' AND column_name = 'final_exam_status'
  ) THEN
    ALTER TABLE learning_paths ADD COLUMN final_exam_status text DEFAULT 'none';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_paths' AND column_name = 'final_exam_score'
  ) THEN
    ALTER TABLE learning_paths ADD COLUMN final_exam_score integer DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_paths' AND column_name = 'final_exam_questions'
  ) THEN
    ALTER TABLE learning_paths ADD COLUMN final_exam_questions jsonb DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'learning_paths' AND column_name = 'final_exam_triggered_at'
  ) THEN
    ALTER TABLE learning_paths ADD COLUMN final_exam_triggered_at timestamptz DEFAULT NULL;
  END IF;
END $$;
