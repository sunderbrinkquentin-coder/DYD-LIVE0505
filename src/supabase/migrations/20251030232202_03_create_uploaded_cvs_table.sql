/*
  # Create Uploaded CVs Table

  1. New Tables
    - `uploaded_cvs`
      - `id` (uuid, primary key) - Unique identifier for uploaded CV
      - `profile_id` (uuid, FK to profiles) - Owner of the CV
      - `session_id` (text, not null) - Session identifier
      - `original_filename` (text, not null) - Original filename from upload
      - `file_path` (text, not null) - Storage path in cv_uploads bucket
      - `file_size` (bigint) - File size in bytes
      - `mime_type` (text) - MIME type of uploaded file
      - `extracted_text` (text, nullable) - Extracted text content from CV
      - `extraction_status` (text) - Status: 'pending', 'processing', 'completed', 'failed'
      - `uploaded_at` (timestamp) - Upload timestamp

  2. Indexes
    - Index on `profile_id` for user queries
    - Index on `session_id` for anonymous access
    - Index on `extraction_status` for processing queue

  3. Security
    - Enable RLS on `uploaded_cvs` table
    - Cascade delete when profile is deleted
*/

-- Create uploaded_cvs table
CREATE TABLE IF NOT EXISTS uploaded_cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  original_filename text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  extracted_text text,
  extraction_status text DEFAULT 'pending' CHECK (extraction_status IN ('pending', 'processing', 'completed', 'failed')),
  uploaded_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS uploaded_cvs_profile_id_idx ON uploaded_cvs(profile_id);
CREATE INDEX IF NOT EXISTS uploaded_cvs_session_id_idx ON uploaded_cvs(session_id);
CREATE INDEX IF NOT EXISTS uploaded_cvs_extraction_status_idx ON uploaded_cvs(extraction_status);

-- Enable RLS
ALTER TABLE uploaded_cvs ENABLE ROW LEVEL SECURITY;