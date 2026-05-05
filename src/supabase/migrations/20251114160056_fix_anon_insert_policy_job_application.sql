/*
  # Fix Anonymous INSERT Policy für job_application Tabelle

  ## Problem
  Anonyme Nutzer können keine neuen job_applications erstellen, obwohl die Policy 
  `WITH CHECK (true)` verwendet. Dies liegt daran, dass Supabase für anon-Nutzer 
  zusätzliche Prüfungen durchführt, die nicht explizit definiert waren.

  ## Lösung
  1. Entfernen der bestehenden INSERT-Policy für anonyme Nutzer
  2. Erstellen einer neuen, permissiveren Policy mit expliziter TO public Rolle
  3. Sicherstellen, dass keine USING-Clause die INSERT-Operation blockiert

  ## Sicherheit
  - Die Policy erlaubt allen anonymen Nutzern das Erstellen von job_applications
  - Die session_id wird weiterhin in der Tabelle gespeichert für spätere Zuordnung
  - UPDATE/DELETE-Policies bleiben restriktiv und prüfen die session_id
  - Bei Nutzer-Registrierung können Datensätze über session_id zugeordnet werden

  ## Betroffene Policies
  - DROP: "Anonymous users can create job_applications with session"
  - CREATE: "Allow anonymous INSERT into job_application"
*/

-- Entferne die bestehende INSERT-Policy für anonyme Nutzer
DROP POLICY IF EXISTS "Anonymous users can create job_applications with session" ON job_application;

-- Erstelle eine neue, permissivere INSERT-Policy für anonyme Nutzer
-- Diese Policy erlaubt allen anon-Nutzern das Erstellen von job_applications
-- Die session_id-Validierung erfolgt auf Applikationsebene
CREATE POLICY "Allow anonymous INSERT into job_application"
  ON job_application
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Optional: Erstelle auch eine Policy für public (authenticated + anon)
-- Dies stellt sicher, dass sowohl anon als auch authenticated Nutzer erstellen können
CREATE POLICY "Allow public INSERT into job_application"
  ON job_application
  FOR INSERT
  TO public
  WITH CHECK (true);