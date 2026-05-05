/*
  # Add Status Tracking to uploaded_cvs

  1. Changes to uploaded_cvs table:
    - Add `status` (text, default 'pending') - Track analysis progress
      - Allowed values: 'pending', 'processing', 'completed', 'failed'
    - Add `error_message` (text, nullable) - Store error details on failure
    - Add `summary_json` (jsonb, nullable) - Store analysis summary
    - Add `processed_at` (timestamptz, nullable) - Timestamp when processing completed

  2. Constraints:
    - Add CHECK constraint for status enum values

  3. Notes:
    - This enables real-time status tracking instead of fixed timeouts
    - Make.com workflow will update these fields during processing
*/

-- Add status column with default 'pending'
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'uploaded_cvs' AND column_name = 'status'
  ) THEN
    ALTER TABLE uploaded_cvs ADD COLUMN status text DEFAULT 'pending';
  END IF;
END $$;

-- Add CHECK constraint for status values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'uploaded_cvs_status_check'
  ) THEN
    ALTER TABLE uploaded_cvs 
    ADD CONSTRAINT uploaded_cvs_status_check 
    CHECK (status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;
END $$;

-- Add error_message column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'uploaded_cvs' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE uploaded_cvs ADD COLUMN error_message text;
  END IF;
END $$;

-- Add summary_json column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'uploaded_cvs' AND column_name = 'summary_json'
  ) THEN
    ALTER TABLE uploaded_cvs ADD COLUMN summary_json jsonb;
  END IF;
END $$;

-- Add processed_at column
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'uploaded_cvs' AND column_name = 'processed_at'
  ) THEN
    ALTER TABLE uploaded_cvs ADD COLUMN processed_at timestamptz;
  END IF;
END $$;

-- Create index on status for fast filtering
CREATE INDEX IF NOT EXISTS uploaded_cvs_status_idx ON uploaded_cvs(status);

-- Update existing records to have 'pending' status if null
UPDATE uploaded_cvs SET status = 'pending' WHERE status IS NULL;
