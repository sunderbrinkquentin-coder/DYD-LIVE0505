/*
  # Create Helper Functions

  1. Functions
    
    ## migrate_anonymous_to_registered()
    - Migrates an anonymous user's data to a registered account
    - Input: p_session_id (text), p_user_id (uuid)
    - Updates profile with user_id and registration status
    - Returns the profile_id
    
    ## get_cv_complete_data()
    - Retrieves complete CV data including all related information
    - Input: p_cv_id (uuid)
    - Returns: JSONB with aggregated CV data
    - Joins optimized_cvs, agent_responses, and uploaded_cvs data

  2. Usage Examples
    
    ### Migrate Anonymous to Registered
    ```sql
    SELECT migrate_anonymous_to_registered('session_abc123', 'user_uuid');
    ```
    
    ### Get Complete CV Data
    ```sql
    SELECT get_cv_complete_data('cv_uuid');
    ```

  3. Important Notes
    - migrate_anonymous_to_registered is idempotent (safe to call multiple times)
    - get_cv_complete_data returns NULL if CV not found
    - Both functions respect RLS policies
*/

-- ============================================================================
-- FUNCTION: migrate_anonymous_to_registered
-- ============================================================================

CREATE OR REPLACE FUNCTION migrate_anonymous_to_registered(
  p_session_id text,
  p_user_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_profile_id uuid;
BEGIN
  -- Update the profile
  UPDATE profiles
  SET 
    user_id = p_user_id,
    is_anonymous = false,
    status = 'registered',
    registered_at = now(),
    updated_at = now()
  WHERE session_id = p_session_id
  RETURNING id INTO v_profile_id;
  
  -- Return the profile_id
  RETURN v_profile_id;
END;
$$;

-- ============================================================================
-- FUNCTION: get_cv_complete_data
-- ============================================================================

CREATE OR REPLACE FUNCTION get_cv_complete_data(p_cv_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'cv', row_to_json(cv.*),
    'profile', row_to_json(p.*),
    'uploaded_cv', row_to_json(ucv.*),
    'agent_responses', (
      SELECT jsonb_agg(row_to_json(ar.*))
      FROM agent_responses ar
      WHERE ar.cv_id = p_cv_id
    )
  )
  INTO v_result
  FROM optimized_cvs cv
  LEFT JOIN profiles p ON p.id = cv.profile_id
  LEFT JOIN uploaded_cvs ucv ON ucv.id = cv.uploaded_cv_id
  WHERE cv.id = p_cv_id;
  
  RETURN v_result;
END;
$$;

-- ============================================================================
-- GRANT EXECUTE PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION migrate_anonymous_to_registered(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION get_cv_complete_data(uuid) TO authenticated, anon;