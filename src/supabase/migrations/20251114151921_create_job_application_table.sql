/*
  # Erstelle job_application Tabelle

  1. Neue Tabelle
    - `job_application`
      ## Basis-Identifikatoren
      - `id` (uuid, primary key) - Eindeutige ID
      - `user_id` (uuid, nullable, FK zu auth.users) - Nutzer-ID falls registriert
      - `profile_id` (uuid, not null, FK zu profiles) - Profil-ID
      - `session_id` (text, not null) - Session-ID für Anonymous-Access
      
      ## Kontaktdaten aus base_data
      - `vorname` (text, nullable)
      - `nachname` (text, nullable)
      - `email` (text, nullable)
      - `telefon` (text, nullable)
      - `ort` (text, nullable)
      - `plz` (text, nullable)
      - `linkedin` (text, nullable)
      - `website` (text, nullable)
      
      ## CV-Einträge aus base_data (als JSONB Arrays)
      - `bildung_entries` (jsonb, nullable) - Array von Bildungseinträgen
      - `berufserfahrung_entries` (jsonb, nullable) - Array von Berufserfahrung-Einträgen
      - `projekte_entries` (jsonb, nullable) - Array von Projekt-Einträgen
      - `sprachen_list` (jsonb, nullable) - Array von Sprachen
      - `zertifikate_entries` (jsonb, nullable) - Array von Zertifikaten
      
      ## Skills aus base_data
      - `hard_skills` (jsonb, nullable) - Array von Hard Skills
      - `soft_skills` (jsonb, nullable) - Array von Soft Skills
      - `top_skills` (jsonb, nullable) - Array von Top Skills (max 3)
      - `zusaetzliche_infos` (text, nullable) - Zusätzliche Informationen
      
      ## Stelleninformationen
      - `rolle` (text, not null) - Wunschstelle/Position
      - `unternehmen` (text, not null) - Zielunternehmen
      - `stellenbeschreibung` (text, nullable) - Job Description
      
      ## Optimierte Daten (für spätere Befüllung)
      - `berufserfahrung_entries_optimiert` (jsonb, nullable)
      - `projekte_entries_optimiert` (jsonb, nullable)
      - `skills_optimiert` (jsonb, nullable)
      - `profile_summary` (text, nullable) - KI-generierte Zusammenfassung
      - `sales` (text, nullable) - Sales/Pitch Text
      - `optimized_cv_html` (text, nullable) - Finaler CV als HTML
      
      ## Status und Timestamps
      - `status` (text, default 'entwurf') - Bewerbungsstatus
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Sicherheit
    - Enable RLS auf `job_application` Tabelle
    - Policy: Users können eigene job_applications sehen
    - Policy: Users können eigene job_applications erstellen
    - Policy: Users können eigene job_applications updaten
    - Policy: Users können eigene job_applications löschen

  3. Performance
    - Index auf `user_id` für schnelle User-Queries
    - Index auf `profile_id` für schnelle Profile-Queries
    - Index auf `session_id` für Anonymous-Access
    - Index auf `created_at` für Sortierung nach Datum
    - Index auf `status` für Status-Filterung
*/

-- Erstelle job_application Tabelle
CREATE TABLE IF NOT EXISTS job_application (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  session_id text NOT NULL,
  
  -- Kontaktdaten
  vorname text,
  nachname text,
  email text,
  telefon text,
  ort text,
  plz text,
  linkedin text,
  website text,
  
  -- CV-Einträge
  bildung_entries jsonb,
  berufserfahrung_entries jsonb,
  projekte_entries jsonb,
  sprachen_list jsonb,
  zertifikate_entries jsonb,
  
  -- Skills
  hard_skills jsonb,
  soft_skills jsonb,
  top_skills jsonb,
  zusaetzliche_infos text,
  
  -- Stelleninformationen
  rolle text NOT NULL,
  unternehmen text NOT NULL,
  stellenbeschreibung text,
  
  -- Optimierte Daten (für spätere Befüllung)
  berufserfahrung_entries_optimiert jsonb,
  projekte_entries_optimiert jsonb,
  skills_optimiert jsonb,
  profile_summary text,
  sales text,
  optimized_cv_html text,
  
  -- Status und Timestamps
  status text DEFAULT 'entwurf' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE job_application ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own job_applications"
  ON job_application FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can create own job_applications"
  ON job_application FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update own job_applications"
  ON job_application FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (auth.uid() = user_id OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete own job_applications"
  ON job_application FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR profile_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- Anonymous/Session-based access policies
CREATE POLICY "Anonymous users can view own job_applications by session"
  ON job_application FOR SELECT
  TO anon
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

CREATE POLICY "Anonymous users can create job_applications with session"
  ON job_application FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update own job_applications by session"
  ON job_application FOR UPDATE
  TO anon
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id')
  WITH CHECK (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

CREATE POLICY "Anonymous users can delete own job_applications by session"
  ON job_application FOR DELETE
  TO anon
  USING (session_id = current_setting('request.jwt.claims', true)::json->>'session_id');

-- Indices für Performance
CREATE INDEX IF NOT EXISTS idx_job_application_user_id ON job_application(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_job_application_profile_id ON job_application(profile_id);
CREATE INDEX IF NOT EXISTS idx_job_application_session_id ON job_application(session_id);
CREATE INDEX IF NOT EXISTS idx_job_application_created_at ON job_application(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_application_status ON job_application(status);

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_job_application_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_job_application_updated_at_trigger
  BEFORE UPDATE ON job_application
  FOR EACH ROW
  EXECUTE FUNCTION update_job_application_updated_at();