/*
  # Add 'gap_analysis_complete' to learning_paths status enum

  - Extends the CHECK constraint on `learning_paths.status` to include 'gap_analysis_complete'
  - This status is set by Make.com when the skill-gap analysis finishes but before curriculum is built
*/

ALTER TABLE learning_paths
  DROP CONSTRAINT IF EXISTS learning_paths_status_check;

ALTER TABLE learning_paths
  ADD CONSTRAINT learning_paths_status_check
    CHECK (status IN ('analyzing', 'gap_analysis_complete', 'curriculum_ready', 'in_progress', 'completed'));
