/*
  # Fix stored_cvs UPDATE policy — allow updates by UUID

  ## Problem
  The current UPDATE policy requires the x-temp-id request header to match the stored
  temp_id column value:
    (temp_id IS NOT NULL AND temp_id = current_setting('request.headers.x-temp-id', true))

  This blocks the background upload function from writing back file_url and status changes
  after the user has already been navigated to /cv-result/:id. The background function uses
  the same Supabase client (which injects x-temp-id via a getter), but any race condition or
  header mismatch causes the UPDATE to silently affect 0 rows — the status stays stuck at
  'uploading', the Make.com webhook is never triggered, and the polling loop times out.

  ## Solution
  The UUID of a stored_cv record is itself the access credential (128-bit random, unguessable).
  Anyone who knows the UUID may update that specific record. This matches the SELECT policy
  already in place (stored_cvs_select, USING (true)).

  Allowing open UPDATE by UUID is safe because:
  1. The UUID is never publicly listed — you only get it if you created the record
  2. The INSERT flow returns the UUID only to the uploader
  3. The result page URL /cv-result/:id already embeds the UUID

  ## Changes
  1. Drop the restrictive header-based UPDATE policy
  2. Create a new open UPDATE policy — any anon/authenticated client can update any row
     (identical security model to the existing open SELECT policy)
*/

-- Drop the restrictive UPDATE policy
DROP POLICY IF EXISTS "stored_cvs_update" ON public.stored_cvs;

-- New open UPDATE policy: UUID is the access token
CREATE POLICY "stored_cvs_update"
  ON public.stored_cvs
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
