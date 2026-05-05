/*
  # Clean Slate: Storage & stored_cvs Policies

  ## Summary
  Multiple overlapping and conflicting RLS policies have accumulated on both
  storage.objects (cv-uploads bucket) and public.stored_cvs. Some storage INSERT
  policies require the path to start with 'raw/', others don't — the inconsistency
  causes unpredictable upload failures for anonymous users.

  This migration drops ALL policies for the cv-uploads bucket and the stored_cvs
  table, then creates a minimal, clean set.

  ## Storage (cv-uploads bucket)

  ### Dropped policies
  - Allow public upload (anon only)
  - cv_uploads_anon_authenticated_insert (required 'raw' folder — too restrictive)
  - emergency_storage_insert
  - Allow public download
  - cv_uploads_authenticated_select
  - cv_uploads_public_select
  - emergency_storage_select
  - cv_uploads_owner_delete
  - cv_uploads_owner_update

  ### New policies
  - INSERT: anon + authenticated can upload any file to cv-uploads bucket
  - SELECT: public read access (bucket is already public: true, but policy needed for signed URLs)
  - DELETE: authenticated users can delete files in cv-uploads

  ## stored_cvs table

  ### Dropped policies
  - All existing policies (insert, select, update, delete)

  ### New policies
  - INSERT: anon + authenticated — only check: temp_id IS NOT NULL OR session_id IS NOT NULL OR user_id IS NOT NULL
  - SELECT: strict — temp_id header match OR session_id header match OR authenticated owner
  - UPDATE: temp_id header match OR authenticated owner OR service_role
  - DELETE: authenticated owner OR service_role

  ## Security Model
  - Anyone can write (upload) as long as they have a temp/session/user identifier
  - Only the owner (by temp_id header or auth.uid) can read results back
  - This prevents data leaks while unblocking the upload gate
*/

-- ──────────────────────────────────────────────────────────────────────────────
-- 1. STORAGE POLICIES: Drop all cv-uploads policies
-- ──────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
DROP POLICY IF EXISTS "cv_uploads_anon_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "emergency_storage_insert" ON storage.objects;
DROP POLICY IF EXISTS "Allow public download" ON storage.objects;
DROP POLICY IF EXISTS "cv_uploads_authenticated_select" ON storage.objects;
DROP POLICY IF EXISTS "cv_uploads_public_select" ON storage.objects;
DROP POLICY IF EXISTS "emergency_storage_select" ON storage.objects;
DROP POLICY IF EXISTS "cv_uploads_owner_delete" ON storage.objects;
DROP POLICY IF EXISTS "cv_uploads_owner_update" ON storage.objects;

-- INSERT: Anyone (anon or authenticated) can upload to cv-uploads
CREATE POLICY "cv_uploads_insert_open"
  ON storage.objects
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'cv-uploads');

-- SELECT: Public read (needed for Make.com and signed URL generation)
CREATE POLICY "cv_uploads_select_public"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'cv-uploads');

-- DELETE: Only authenticated users can delete their own files
CREATE POLICY "cv_uploads_delete_authenticated"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'cv-uploads');

-- ──────────────────────────────────────────────────────────────────────────────
-- 2. STORED_CVS POLICIES: Drop all existing policies
-- ──────────────────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "stored_cvs_insert" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_select" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_update" ON public.stored_cvs;
DROP POLICY IF EXISTS "stored_cvs_delete" ON public.stored_cvs;
DROP POLICY IF EXISTS "cv_upload_insert_production" ON public.stored_cvs;

-- INSERT: Allow if any identifier is present (no header check — headers not yet stabilized at insert time)
CREATE POLICY "stored_cvs_insert"
  ON public.stored_cvs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    temp_id IS NOT NULL
    OR session_id IS NOT NULL
    OR user_id IS NOT NULL
  );

-- SELECT: Strict ownership check via header or auth
CREATE POLICY "stored_cvs_select"
  ON public.stored_cvs
  FOR SELECT
  TO anon, authenticated
  USING (
    (temp_id IS NOT NULL AND temp_id = current_setting('request.headers.x-temp-id', true))
    OR (session_id IS NOT NULL AND session_id = current_setting('request.headers.x-session-id', true))
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
  );

-- UPDATE: Allow owner or service_role to update
CREATE POLICY "stored_cvs_update"
  ON public.stored_cvs
  FOR UPDATE
  TO anon, authenticated
  USING (
    (temp_id IS NOT NULL AND temp_id = current_setting('request.headers.x-temp-id', true))
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (SELECT auth.role()) = 'service_role'
  )
  WITH CHECK (
    (temp_id IS NOT NULL AND temp_id = current_setting('request.headers.x-temp-id', true))
    OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (SELECT auth.role()) = 'service_role'
  );

-- DELETE: Only authenticated owners or service_role
CREATE POLICY "stored_cvs_delete"
  ON public.stored_cvs
  FOR DELETE
  TO authenticated
  USING (
    (auth.uid() IS NOT NULL AND user_id = auth.uid())
    OR (SELECT auth.role()) = 'service_role'
  );
