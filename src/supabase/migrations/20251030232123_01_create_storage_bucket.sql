/*
  # Create Storage Bucket for CV Uploads

  1. Storage Setup
    - Create `cv_uploads` bucket for PDF/DOC/DOCX files
    - Private bucket (not public)
    - Max file size: 5MB
    - Allowed MIME types: PDF, DOC, DOCX
  
  2. Security
    - RLS enabled by default on storage
    - Policies will be added in separate migration
*/

-- Create the cv_uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'cv_uploads',
  'cv_uploads',
  false,
  5242880, -- 5MB in bytes
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;