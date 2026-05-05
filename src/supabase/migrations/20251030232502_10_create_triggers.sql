/*
  # Create Database Triggers

  1. Triggers
    
    ## update_updated_at_timestamp
    - Automatically updates the `updated_at` column on UPDATE
    - Applied to: profiles, agent_responses, optimized_cvs, agent_progress
    - Fires BEFORE UPDATE on each row
    
  2. Trigger Function
    
    ## update_updated_at_column()
    - Generic trigger function to set updated_at = now()
    - Reusable across multiple tables

  3. Important Notes
    - Triggers fire automatically on every UPDATE
    - No manual timestamp management needed
    - Ensures data consistency
*/

-- ============================================================================
-- TRIGGER FUNCTION: update_updated_at_column
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- CREATE TRIGGERS FOR EACH TABLE
-- ============================================================================

-- Trigger for profiles table
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for agent_responses table
DROP TRIGGER IF EXISTS update_agent_responses_updated_at ON agent_responses;
CREATE TRIGGER update_agent_responses_updated_at
  BEFORE UPDATE ON agent_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for optimized_cvs table
DROP TRIGGER IF EXISTS update_optimized_cvs_updated_at ON optimized_cvs;
CREATE TRIGGER update_optimized_cvs_updated_at
  BEFORE UPDATE ON optimized_cvs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for agent_progress table
DROP TRIGGER IF EXISTS update_agent_progress_updated_at ON agent_progress;
CREATE TRIGGER update_agent_progress_updated_at
  BEFORE UPDATE ON agent_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();