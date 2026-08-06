/*
# Create b2b_contact_requests table

1. New Tables
- `b2b_contact_requests`
  - `id` (uuid, primary key)
  - `company_name` (text, not null) — name of the company or institution
  - `contact_name` (text, not null) — full name of the contact person
  - `email` (text, not null) — email address
  - `phone` (text, nullable) — optional phone number
  - `segment` (text, not null) — which tab: 'unternehmen' or 'bildungstraeger'
  - `message` (text, nullable) — optional message
  - `status` (text, default 'new') — tracking status: new, contacted, closed
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `b2b_contact_requests`.
- This is a no-auth B2B landing page form, so allow anon + authenticated to INSERT.
- No SELECT/UPDATE/DELETE for anon — only service role can read/manage submissions.
*/

CREATE TABLE IF NOT EXISTS b2b_contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  email text NOT NULL,
  phone text,
  segment text NOT NULL DEFAULT 'unternehmen',
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE b2b_contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_b2b_contact" ON b2b_contact_requests;
CREATE POLICY "anon_insert_b2b_contact" ON b2b_contact_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);
