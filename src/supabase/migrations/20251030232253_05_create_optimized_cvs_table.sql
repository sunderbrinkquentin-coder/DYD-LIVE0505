/*
  # Create Optimized CVs Table

  1. New Tables
    - `optimized_cvs` (Main CV table)
      
      ## Basis Fields
      - `id` (uuid, primary key) - Unique CV identifier
      - `profile_id` (uuid, FK to profiles) - CV owner
      - `session_id` (text, not null) - Session identifier
      - `uploaded_cv_id` (uuid, nullable, FK to uploaded_cvs) - Link to uploaded CV if exists
      
      ## CV Metadata
      - `cv_name` (text) - Name for this CV (user can have multiple)
      - `template` (text) - Template choice: 'modern', 'azubi', 'uni', 'beratung'
      - `photo_base64` (text, nullable) - Base64 encoded profile photo
      
      ## Original Agent Responses (from Agent Flow)
      - `original_contact` (jsonb) - Original contact data
      - `original_education` (jsonb) - Original education entries
      - `original_experience` (jsonb) - Original work experience
      - `original_skills` (jsonb) - Original skills
      - `original_projects` (jsonb) - Original projects
      - `original_languages` (jsonb) - Original languages
      - `original_certificates` (jsonb) - Original certificates
      - `original_additional` (text) - Original additional info
      
      ## Optimized Agent Responses (AI-enhanced)
      - `optimized_contact` (jsonb) - Cleaned/optimized
      - `optimized_education` (jsonb) - Better formatting
      - `optimized_experience` (jsonb) - ATS-optimized bullets
      - `optimized_skills` (jsonb) - Prioritized and structured
      - `optimized_projects` (jsonb) - Professionally rewritten
      - `optimized_languages` (jsonb) - Standardized
      - `optimized_certificates` (jsonb) - Structured
      - `optimized_additional` (text) - Optimized
      
      ## Status & Tracking
      - `optimization_status` (text) - 'pending', 'processing', 'completed', 'failed'
      - `optimization_score` (int) - ATS Score 0-100
      - `optimization_notes` (jsonb) - What was optimized
      - `webhook_status` (text) - 'pending', 'sent', 'completed', 'failed'
      - `webhook_sent_at` (timestamp) - When webhook was sent
      - `webhook_response` (jsonb) - Response from webhook for debugging
      
      ## Timestamps
      - `created_at` (timestamp) - CV creation
      - `updated_at` (timestamp) - Last update
      - `optimization_completed_at` (timestamp) - When optimization finished
      - `exported_at` (timestamp) - When user exported CV

  2. Indexes
    - Index on `profile_id` for user queries
    - Index on `session_id` for anonymous access
    - Index on `optimization_status` for processing queue
    - Index on `webhook_status` for webhook management

  3. Security
    - Enable RLS on `optimized_cvs` table
    - Cascade delete when profile is deleted
    - Set null on uploaded_cv_id when uploaded CV is deleted
*/

-- Create optimized_cvs table
CREATE TABLE IF NOT EXISTS optimized_cvs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  uploaded_cv_id uuid REFERENCES uploaded_cvs(id) ON DELETE SET NULL,
  
  -- CV Metadata
  cv_name text DEFAULT 'Mein Lebenslauf',
  template text DEFAULT 'modern' CHECK (template IN ('modern', 'azubi', 'uni', 'beratung')),
  photo_base64 text,
  
  -- Original Agent Responses
  original_contact jsonb,
  original_education jsonb,
  original_experience jsonb,
  original_skills jsonb,
  original_projects jsonb,
  original_languages jsonb,
  original_certificates jsonb,
  original_additional text,
  
  -- Optimized Agent Responses
  optimized_contact jsonb,
  optimized_education jsonb,
  optimized_experience jsonb,
  optimized_skills jsonb,
  optimized_projects jsonb,
  optimized_languages jsonb,
  optimized_certificates jsonb,
  optimized_additional text,
  
  -- Status & Tracking
  optimization_status text DEFAULT 'pending' CHECK (optimization_status IN ('pending', 'processing', 'completed', 'failed')),
  optimization_score int CHECK (optimization_score >= 0 AND optimization_score <= 100),
  optimization_notes jsonb,
  webhook_status text DEFAULT 'pending' CHECK (webhook_status IN ('pending', 'sent', 'completed', 'failed')),
  webhook_sent_at timestamptz,
  webhook_response jsonb,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  optimization_completed_at timestamptz,
  exported_at timestamptz
);

-- Create indexes
CREATE INDEX IF NOT EXISTS optimized_cvs_profile_id_idx ON optimized_cvs(profile_id);
CREATE INDEX IF NOT EXISTS optimized_cvs_session_id_idx ON optimized_cvs(session_id);
CREATE INDEX IF NOT EXISTS optimized_cvs_optimization_status_idx ON optimized_cvs(optimization_status);
CREATE INDEX IF NOT EXISTS optimized_cvs_webhook_status_idx ON optimized_cvs(webhook_status);

-- Enable RLS
ALTER TABLE optimized_cvs ENABLE ROW LEVEL SECURITY;