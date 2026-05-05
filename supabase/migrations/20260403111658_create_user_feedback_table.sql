/*
  # Create user_feedback table

  1. New Tables
    - `user_feedback`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable – supports anon users)
      - `trigger_status` (text) – which kanban status triggered the feedback (offer, rejected, interview)
      - `job_title` (text, nullable)
      - `company` (text, nullable)
      - `rating_1` (int) – first question score 1-5
      - `rating_2` (int) – second question score 1-5
      - `rating_3` (int) – third question score 1-5
      - `free_text` (text, nullable) – open free-text field
      - `allow_publish` (boolean) – user consent to publish feedback
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Authenticated users can insert their own feedback
    - Anonymous users can also insert (user_id can be null)
    - Only service role / admins can select all rows
    - Users can only read their own feedback
*/

CREATE TABLE IF NOT EXISTS user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  trigger_status text NOT NULL,
  job_title text,
  company text,
  rating_1 int CHECK (rating_1 BETWEEN 1 AND 5),
  rating_2 int CHECK (rating_2 BETWEEN 1 AND 5),
  rating_3 int CHECK (rating_3 BETWEEN 1 AND 5),
  free_text text,
  allow_publish boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert feedback"
  ON user_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Users can read own feedback"
  ON user_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
