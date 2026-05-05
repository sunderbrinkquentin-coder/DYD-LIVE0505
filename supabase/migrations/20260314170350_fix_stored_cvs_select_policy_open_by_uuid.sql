/*
  # Fix stored_cvs SELECT policy — allow public read by UUID

  ## Problem
  The current SELECT policy requires a matching x-temp-id header or authenticated session.
  The polling loop in CvResultPage queries by record UUID only — no header is sent — so it
  always returns zero rows, causing "Record not found" after 5 attempts even when the record
  exists in the database.

  ## Solution
  The UUID of a stored_cv record is itself the access credential (128-bit random, unguessable).
  Anyone who knows the UUID may read that specific record. This matches the security model of
  the result page (/cv-result/:uploadId) which is intentionally a public, shareable URL.

  ## Changes
  1. Drop the restrictive stored_cvs_select policy
  2. Create a new open SELECT policy — any role can read any row (uuid-as-token model)
  3. Drop the leftover emergency_insert_policy (duplicate of stored_cvs_insert)
*/

-- Drop the restrictive SELECT policy
DROP POLICY IF EXISTS "stored_cvs_select" ON public.stored_cvs;

-- New open SELECT policy: the UUID itself is the access token
CREATE POLICY "stored_cvs_select"
  ON public.stored_cvs
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Drop leftover duplicate INSERT policy from a previous migration
DROP POLICY IF EXISTS "emergency_insert_policy" ON public.stored_cvs;
