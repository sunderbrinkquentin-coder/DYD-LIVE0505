/*
  # Add Foreign Key to Agent Responses

  1. Changes
    - Add foreign key constraint on `agent_responses.cv_id` referencing `optimized_cvs.id`
    - Set to CASCADE on delete so responses are deleted when CV is deleted

  2. Important Notes
    - This migration must run after optimized_cvs table is created
    - Links agent responses to specific CVs
*/

-- Add foreign key constraint to agent_responses.cv_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'agent_responses_cv_id_fkey'
    AND table_name = 'agent_responses'
  ) THEN
    ALTER TABLE agent_responses
    ADD CONSTRAINT agent_responses_cv_id_fkey
    FOREIGN KEY (cv_id) REFERENCES optimized_cvs(id) ON DELETE CASCADE;
  END IF;
END $$;