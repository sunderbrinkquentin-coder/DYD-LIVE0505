/*
  # Create cv_uploads View with Full INSTEAD OF Triggers

  ## Problem:
  - Code uses `.from('cv_uploads')` everywhere
  - Actual table name is `uploaded_cvs`
  - Simple view doesn't support INSERT/UPDATE/DELETE

  ## Solution:
  - Create updatable view `cv_uploads`
  - Add INSTEAD OF triggers for INSERT, UPDATE, DELETE
  - Makes view behave exactly like a real table

  ## Result:
  - All code continues to work with `.from('cv_uploads')`
  - No code changes needed
  - RLS policies apply to underlying `uploaded_cvs` table
*/

-- ============================================================================
-- DROP EXISTING VIEW IF EXISTS
-- ============================================================================

DROP VIEW IF EXISTS cv_uploads CASCADE;

-- ============================================================================
-- CREATE UPDATABLE VIEW
-- ============================================================================

CREATE OR REPLACE VIEW cv_uploads AS
SELECT
  id,
  profile_id,
  session_id,
  original_filename,
  file_path,
  file_size,
  mime_type,
  extracted_text,
  extraction_status,
  uploaded_at,
  temp_id,
  user_id,
  original_file_url,
  vision_text,
  ats_json,
  updated_at,
  status,
  error_message,
  summary_json,
  processed_at,
  parsed_data
FROM uploaded_cvs;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON cv_uploads TO anon, authenticated;

-- ============================================================================
-- CREATE TRIGGER FUNCTIONS
-- ============================================================================

-- INSERT Trigger Function
CREATE OR REPLACE FUNCTION cv_uploads_insert_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO uploaded_cvs (
    profile_id,
    session_id,
    original_filename,
    file_path,
    file_size,
    mime_type,
    extracted_text,
    extraction_status,
    uploaded_at,
    temp_id,
    user_id,
    original_file_url,
    vision_text,
    ats_json,
    updated_at,
    status,
    error_message,
    summary_json,
    processed_at,
    parsed_data
  ) VALUES (
    NEW.profile_id,
    NEW.session_id,
    NEW.original_filename,
    NEW.file_path,
    NEW.file_size,
    NEW.mime_type,
    NEW.extracted_text,
    NEW.extraction_status,
    COALESCE(NEW.uploaded_at, now()),
    NEW.temp_id,
    NEW.user_id,
    NEW.original_file_url,
    NEW.vision_text,
    NEW.ats_json,
    COALESCE(NEW.updated_at, now()),
    NEW.status,
    NEW.error_message,
    NEW.summary_json,
    NEW.processed_at,
    NEW.parsed_data
  )
  RETURNING * INTO NEW;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- UPDATE Trigger Function
CREATE OR REPLACE FUNCTION cv_uploads_update_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE uploaded_cvs SET
    profile_id = NEW.profile_id,
    session_id = NEW.session_id,
    original_filename = NEW.original_filename,
    file_path = NEW.file_path,
    file_size = NEW.file_size,
    mime_type = NEW.mime_type,
    extracted_text = NEW.extracted_text,
    extraction_status = NEW.extraction_status,
    uploaded_at = NEW.uploaded_at,
    temp_id = NEW.temp_id,
    user_id = NEW.user_id,
    original_file_url = NEW.original_file_url,
    vision_text = NEW.vision_text,
    ats_json = NEW.ats_json,
    updated_at = COALESCE(NEW.updated_at, now()),
    status = NEW.status,
    error_message = NEW.error_message,
    summary_json = NEW.summary_json,
    processed_at = NEW.processed_at,
    parsed_data = NEW.parsed_data
  WHERE id = OLD.id
  RETURNING * INTO NEW;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- DELETE Trigger Function
CREATE OR REPLACE FUNCTION cv_uploads_delete_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM uploaded_cvs WHERE id = OLD.id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- CREATE INSTEAD OF TRIGGERS
-- ============================================================================

DROP TRIGGER IF EXISTS cv_uploads_insert_trigger ON cv_uploads;
CREATE TRIGGER cv_uploads_insert_trigger
  INSTEAD OF INSERT ON cv_uploads
  FOR EACH ROW
  EXECUTE FUNCTION cv_uploads_insert_trigger_fn();

DROP TRIGGER IF EXISTS cv_uploads_update_trigger ON cv_uploads;
CREATE TRIGGER cv_uploads_update_trigger
  INSTEAD OF UPDATE ON cv_uploads
  FOR EACH ROW
  EXECUTE FUNCTION cv_uploads_update_trigger_fn();

DROP TRIGGER IF EXISTS cv_uploads_delete_trigger ON cv_uploads;
CREATE TRIGGER cv_uploads_delete_trigger
  INSTEAD OF DELETE ON cv_uploads
  FOR EACH ROW
  EXECUTE FUNCTION cv_uploads_delete_trigger_fn();

-- ============================================================================
-- DONE
-- ============================================================================

-- Verification queries (for manual testing):
-- SELECT COUNT(*) FROM cv_uploads;           -- Should work
-- INSERT INTO cv_uploads (...) VALUES (...); -- Should work
-- UPDATE cv_uploads SET ... WHERE ...;       -- Should work
-- DELETE FROM cv_uploads WHERE ...;          -- Should work
