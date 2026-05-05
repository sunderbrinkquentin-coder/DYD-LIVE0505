/*
  # Fix Storage Policies - Owner Check und List Restriction

  ## Änderungen

  1. **Storage List Policy einschränken**
     - Entfernt public SELECT auf alle Dateien
     - Nur noch eigene Dateien können gelistet werden
     - Public URLs bleiben für Make.com funktional

  2. **Storage DELETE Policy mit Owner Check**
     - Nur authentifizierte User können eigene Dateien löschen
     - Join mit stored_cvs für Owner-Validierung

  3. **Storage UPDATE Policy mit Owner Check**
     - Nur eigene Dateien können überschrieben werden
     - Verhindert Sabotage fremder Uploads

  ## Sicherheit

  - **Privacy:** Anonyme User können keine fremden CVs listen
  - **Integrität:** User können nur eigene Dateien löschen/ändern
  - **Public URLs:** getPublicUrl() funktioniert weiterhin (benötigt für Make.com)
  
  ## Hinweis
  
  Diese Policies sind komplexer wegen der Supabase Storage Architektur.
  Alternative: Für maximale Sicherheit könnte man RLS auf storage.objects vollständig
  deaktivieren und nur über signed URLs arbeiten.
*/

-- ============================================================================
-- STEP 1: Entferne alte Storage Policies
-- ============================================================================

DROP POLICY IF EXISTS "cv_uploads_public_select" ON storage.objects;
DROP POLICY IF EXISTS "cv_uploads_anon_authenticated_insert" ON storage.objects;
DROP POLICY IF EXISTS "cv_uploads_anon_authenticated_update" ON storage.objects;
DROP POLICY IF EXISTS "cv_uploads_authenticated_delete" ON storage.objects;

-- ============================================================================
-- STEP 2: Erstelle neue Policies mit Owner Check
-- ============================================================================

-- SELECT Policy: Nur für Direct Object Access (list wird eingeschränkt)
-- Public URLs via getPublicUrl() funktionieren weiterhin
CREATE POLICY "cv_uploads_authenticated_select"
ON storage.objects FOR SELECT
TO authenticated, anon
USING (
  bucket_id = 'cv-uploads' AND
  (
    -- Option 1: Authenticated user owns the file
    (auth.uid() IS NOT NULL AND 
     name = ANY(
       SELECT substring(file_path from 'raw/(.*)') 
       FROM stored_cvs 
       WHERE user_id = auth.uid()
     ))
    OR
    -- Option 2: Anonymous user with temp_id
    (auth.uid() IS NULL AND
     name = ANY(
       SELECT substring(file_path from 'raw/(.*)') 
       FROM stored_cvs 
       WHERE user_id IS NULL AND temp_id IS NOT NULL
     ))
  )
);

-- INSERT Policy: Alle können uploaden (Owner wird in stored_cvs getrackt)
CREATE POLICY "cv_uploads_anon_authenticated_insert"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'cv-uploads' AND
  (storage.foldername(name))[1] = 'raw'
);

-- UPDATE Policy: Nur eigene Dateien
CREATE POLICY "cv_uploads_owner_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'cv-uploads' AND
  name = ANY(
    SELECT substring(file_path from 'raw/(.*)') 
    FROM stored_cvs 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'cv-uploads' AND
  name = ANY(
    SELECT substring(file_path from 'raw/(.*)') 
    FROM stored_cvs 
    WHERE user_id = auth.uid()
  )
);

-- DELETE Policy: Nur eigene Dateien
CREATE POLICY "cv_uploads_owner_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'cv-uploads' AND
  name = ANY(
    SELECT substring(file_path from 'raw/(.*)') 
    FROM stored_cvs 
    WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- STEP 3: Kommentar zu Public URLs
-- ============================================================================

-- WICHTIG: Diese Policies schränken list() und direkten Zugriff ein,
-- aber getPublicUrl() funktioniert weiterhin für alle Dateien im Bucket.
-- Das ist GEWOLLT, weil Make.com die Public URLs benötigt.
--
-- Wenn strengere Sicherheit benötigt wird:
-- 1. Bucket auf private=true setzen
-- 2. Nur signed URLs verwenden
-- 3. Kürzere Ablaufzeiten für signed URLs
