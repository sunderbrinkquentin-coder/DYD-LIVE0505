/*
  # Fix Storage Policies für cv-uploads Bucket

  ## Problem
  Die INSERT Policy für den cv-uploads Bucket hat keine korrekte with_check Bedingung,
  was zu Problemen beim Upload führen kann.

  ## Änderungen
  1. Entfernt alte, inkonsistente Policies für cv-uploads
  2. Erstellt neue, klare Policies mit korrekten Bedingungen:
     - SELECT: Öffentlicher Lesezugriff auf cv-uploads
     - INSERT: Anonyme und authentifizierte User können hochladen
     - UPDATE: Anonyme und authentifizierte User können aktualisieren
     - DELETE: Authentifizierte User können löschen

  ## Sicherheit
  - Bucket ist public, daher ist SELECT für alle erlaubt
  - INSERT/UPDATE erlaubt für anon + authenticated mit korrekter Bucket-Verifikation
  - DELETE nur für authenticated User
*/

-- Entferne alte Policies für cv-uploads (falls vorhanden)
DROP POLICY IF EXISTS "allow_cv_uploads_all 1e4abc_0" ON storage.objects;
DROP POLICY IF EXISTS "allow_cv_uploads_all 1e4abc_1" ON storage.objects;
DROP POLICY IF EXISTS "allow_cv_uploads_all 1e4abc_2" ON storage.objects;

-- Erstelle neue, korrekte Policies für cv-uploads

-- Policy 1: Öffentlicher Lesezugriff (SELECT)
CREATE POLICY "cv_uploads_public_select"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'cv-uploads');

-- Policy 2: Upload erlauben für anon + authenticated (INSERT)
CREATE POLICY "cv_uploads_anon_authenticated_insert"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'cv-uploads');

-- Policy 3: Update erlauben für anon + authenticated (UPDATE)
CREATE POLICY "cv_uploads_anon_authenticated_update"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'cv-uploads')
WITH CHECK (bucket_id = 'cv-uploads');

-- Policy 4: Delete nur für authenticated User (DELETE)
CREATE POLICY "cv_uploads_authenticated_delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'cv-uploads');