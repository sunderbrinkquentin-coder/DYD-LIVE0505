/*
  # Bewerbungsmanagement v2 (Application Tracker)

  Trennt Bewerbungen von CVs:
  - `tracked_applications`: eine Zeile pro Bewerbung, CV optional per `cv_id` verknüpft
    (ein CV kann für mehrere Bewerbungen genutzt werden)
  - `application_events`: Timeline pro Bewerbung (Statuswechsel, Interviews, Calls, Notizen)

  Automatik (Trigger):
  - Statuswechsel → Event in der Timeline, `status_changed_at` gesetzt
  - Status `applied` → `applied_at` = heute + nächster Schritt "Nachfassen" in 10 Tagen
  - Neuer fertiger CV in `stored_cvs` (nicht CV-Check, nicht manuell) → Bewerbung wird automatisch angelegt
  - Backfill: bestehende Kanban-Karten aus `stored_cvs` werden einmalig übernommen

  `stored_cvs.status` bleibt unangetastet und beschreibt künftig nur noch den CV-Verarbeitungsstatus.
*/

-- ─────────────────────────────────────────────────────────────
-- 1. Tabellen
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.tracked_applications (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  cv_id                uuid REFERENCES public.stored_cvs(id) ON DELETE SET NULL,
  legacy_stored_cv_id  uuid UNIQUE,              -- nur für Backfill / Idempotenz

  job_title            text NOT NULL DEFAULT 'Unbenannte Stelle',
  company              text,
  location             text,
  job_url              text,
  job_description      text,                     -- Snapshot des Anzeigentexts
  source               text,                     -- LinkedIn, StepStone, Empfehlung …

  status               text NOT NULL DEFAULT 'saved'
                       CHECK (status IN ('saved','preparing','applied','interview','offer','accepted','rejected','withdrawn')),
  status_changed_at    timestamptz NOT NULL DEFAULT now(),
  applied_at           date,
  interview_round      smallint NOT NULL DEFAULT 0,

  salary_min           integer CHECK (salary_min IS NULL OR salary_min >= 0),
  salary_max           integer CHECK (salary_max IS NULL OR salary_max >= 0),
  salary_currency      text NOT NULL DEFAULT 'EUR',

  contact_name         text,
  contact_role         text,
  contact_email        text,
  contact_phone        text,

  next_action          text,
  next_action_due      date,
  notes                text,
  closing_reason       text,                     -- Absage-/Rückzugsgrund
  prep_checklist       jsonb NOT NULL DEFAULT '{}'::jsonb,  -- Interview-Vorbereitung {"research":true,…}

  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT salary_range_valid CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

CREATE TABLE IF NOT EXISTS public.application_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  uuid NOT NULL REFERENCES public.tracked_applications(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type            text NOT NULL
                  CHECK (type IN ('created','status_change','interview','call','email','note','follow_up')),
  title           text NOT NULL,
  details         text,
  from_status     text,
  to_status       text,
  scheduled_at    timestamptz,                   -- z. B. Interviewtermin
  meta            jsonb NOT NULL DEFAULT '{}'::jsonb,  -- z. B. {"round":2,"format":"video"}
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tracked_apps_user_status ON public.tracked_applications(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tracked_apps_user_due    ON public.tracked_applications(user_id, next_action_due);
CREATE INDEX IF NOT EXISTS idx_tracked_apps_cv          ON public.tracked_applications(cv_id);
CREATE INDEX IF NOT EXISTS idx_app_events_app           ON public.application_events(application_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_events_user_sched    ON public.application_events(user_id, scheduled_at)
  WHERE scheduled_at IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. RLS
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.tracked_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_events   ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own applications" ON public.tracked_applications;
CREATE POLICY "own applications" ON public.tracked_applications
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "own application events" ON public.application_events;
CREATE POLICY "own application events" ON public.application_events
  FOR ALL TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND EXISTS (
      SELECT 1 FROM public.tracked_applications a
      WHERE a.id = application_id AND a.user_id = (SELECT auth.uid())
    )
  );

-- ─────────────────────────────────────────────────────────────
-- 3. Trigger-Funktionen
-- ─────────────────────────────────────────────────────────────

-- 3a. Vor Insert/Update: Zeitstempel + Automatik bei Statuswechsel
CREATE OR REPLACE FUNCTION public.tracked_applications_before_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();

  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status_changed_at := now();

    IF NEW.status = 'applied' THEN
      NEW.applied_at := COALESCE(NEW.applied_at, current_date);
      IF NEW.next_action IS NULL OR (TG_OP = 'UPDATE' AND NEW.next_action IS NOT DISTINCT FROM OLD.next_action) THEN
        NEW.next_action     := 'Nachfassen';
        NEW.next_action_due := COALESCE(NEW.applied_at, current_date) + 10;
      END IF;
    ELSIF NEW.status = 'interview' THEN
      NEW.interview_round := GREATEST(NEW.interview_round, 1);
    ELSIF NEW.status IN ('accepted','rejected','withdrawn') THEN
      -- abgeschlossene Bewerbungen haben keine offenen Schritte mehr
      NEW.next_action     := NULL;
      NEW.next_action_due := NULL;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tracked_applications_before_write ON public.tracked_applications;
CREATE TRIGGER trg_tracked_applications_before_write
  BEFORE INSERT OR UPDATE ON public.tracked_applications
  FOR EACH ROW EXECUTE FUNCTION public.tracked_applications_before_write();

-- 3b. Nach Insert/Update: Timeline-Eintrag
CREATE OR REPLACE FUNCTION public.tracked_applications_log_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.application_events (application_id, user_id, type, title, to_status, occurred_at)
    VALUES (NEW.id, NEW.user_id, 'created', 'Bewerbung angelegt', NEW.status, NEW.created_at);
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.application_events (application_id, user_id, type, title, from_status, to_status)
    VALUES (NEW.id, NEW.user_id, 'status_change', 'Status geändert', OLD.status, NEW.status);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tracked_applications_log_event ON public.tracked_applications;
CREATE TRIGGER trg_tracked_applications_log_event
  AFTER INSERT OR UPDATE OF status ON public.tracked_applications
  FOR EACH ROW EXECUTE FUNCTION public.tracked_applications_log_event();

-- 3c. Hilfsfunktionen: Stellentitel / Firma aus stored_cvs-JSON lesen
CREATE OR REPLACE FUNCTION public.extract_job_title(job_data jsonb, cv_data jsonb)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(TRIM(COALESCE(
    job_data->>'positionTitle', job_data->>'jobTitle', job_data->>'job_title',
    cv_data->'desired_job'->>'job_title', cv_data->>'targetJob', cv_data->>'targetRole',
    cv_data->>'jobTitle', cv_data->'personalInfo'->>'title', ''
  )), '')
$$;

CREATE OR REPLACE FUNCTION public.extract_company(job_data jsonb, cv_data jsonb)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT NULLIF(TRIM(COALESCE(
    job_data->>'company', job_data->>'companyName', cv_data->'desired_job'->>'company',
    cv_data->>'targetCompany', cv_data->>'company', ''
  )), '')
$$;

-- 3d. Fertiger CV → Bewerbung automatisch anlegen (ersetzt "CV = Kanban-Karte")
CREATE OR REPLACE FUNCTION public.stored_cvs_create_application()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL
     OR COALESCE(NEW.source, '') IN ('check', 'manual')
     OR COALESCE(NEW.status, '') IN ('processing', 'pending', 'failed') THEN
    RETURN NEW;
  END IF;

  -- Nur beim ersten "fertig"-Werden, damit gelöschte Bewerbungen nicht wieder auftauchen
  IF TG_OP = 'UPDATE' AND COALESCE(OLD.status, '') NOT IN ('processing', 'pending', 'failed') THEN
    RETURN NEW;
  END IF;

  IF EXISTS (SELECT 1 FROM public.tracked_applications WHERE cv_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.tracked_applications (user_id, cv_id, job_title, company, job_url, status)
  VALUES (
    NEW.user_id,
    NEW.id,
    COALESCE(public.extract_job_title(NEW.job_data, NEW.cv_data), 'Unbenannte Stelle'),
    public.extract_company(NEW.job_data, NEW.cv_data),
    NULLIF(NEW.job_data->>'jobUrl', ''),
    'preparing'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stored_cvs_create_application ON public.stored_cvs;
CREATE TRIGGER trg_stored_cvs_create_application
  AFTER INSERT OR UPDATE OF status ON public.stored_cvs
  FOR EACH ROW EXECUTE FUNCTION public.stored_cvs_create_application();

-- ─────────────────────────────────────────────────────────────
-- 4. Backfill: bestehende Kanban-Karten übernehmen (idempotent)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION pg_temp.parse_de_date(s text)
RETURNS date LANGUAGE plpgsql AS $$
BEGIN
  IF s ~ '^\d{1,2}\.\d{1,2}\.\d{4}$' THEN RETURN to_date(s, 'DD.MM.YYYY'); END IF;
  IF s ~ '^\d{4}-\d{2}-\d{2}' THEN RETURN substring(s, 1, 10)::date; END IF;
  RETURN NULL;
EXCEPTION WHEN others THEN RETURN NULL;
END;
$$;

INSERT INTO public.tracked_applications (
  user_id, cv_id, legacy_stored_cv_id, job_title, company, status,
  applied_at, contact_name, notes, next_action, next_action_due, created_at
)
SELECT
  s.user_id,
  CASE WHEN s.source = 'manual' THEN NULL ELSE s.id END,
  s.id,
  COALESCE(public.extract_job_title(s.job_data, s.cv_data), 'Unbenannte Stelle'),
  public.extract_company(s.job_data, s.cv_data),
  CASE s.status
    WHEN 'draft'       THEN 'preparing'
    WHEN 'applied'     THEN 'applied'
    WHEN 'in_progress' THEN 'applied'
    WHEN 'interview'   THEN 'interview'
    WHEN 'offer'       THEN 'offer'
    WHEN 'rejected'    THEN 'rejected'
    ELSE 'preparing'
  END,
  pg_temp.parse_de_date(s.job_data->>'applicationDate'),
  NULLIF(COALESCE(s.job_data->>'contactPerson', s.job_data->>'contact_name', ''), ''),
  NULLIF(CONCAT_WS(E'\n',
    NULLIF(s.job_data->>'notes', ''),
    CASE WHEN NULLIF(s.job_data->>'salaryExpectation', '') IS NOT NULL
         THEN 'Gehaltswunsch: ' || (s.job_data->>'salaryExpectation') END
  ), ''),
  CASE WHEN pg_temp.parse_de_date(s.job_data->>'feedbackDeadline') IS NOT NULL THEN 'Feedback erwartet' END,
  pg_temp.parse_de_date(s.job_data->>'feedbackDeadline'),
  s.created_at
FROM public.stored_cvs s
WHERE s.user_id IS NOT NULL
  AND COALESCE(s.source, '') <> 'check'
  AND COALESCE(s.status, '') NOT IN ('processing', 'pending', 'failed')
ON CONFLICT (legacy_stored_cv_id) DO NOTHING;
