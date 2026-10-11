/*
  # KI-Anschreiben (Cover Letters)

  - `cover_letters`: ein Anschreiben pro Entwurf, verknüpft mit einer Bewerbung aus `tracked_applications`
  - Inhalt (`content`) ist strukturiert: Absätze mit Text + "Warum steht das hier?" + Belegen aus Anzeige/CV
  - Paywall serverseitig: Clients dürfen `content` NICHT direkt lesen (Spalten-Grants).
    Gelesen wird über `get_cover_letter()`, das vor dem Freischalten nur die Vorschau liefert
    (Betreff, Anrede, 1. Absatz + alle Erklärungen).
  - Freischalten: per Credit (`unlock_cover_letter_with_credit`) oder per Stripe (Webhook, service role)
  - Bearbeiten: `save_cover_letter()` – nur wenn freigeschaltet
  - Insert/KI-Updates nur durch die Edge Function `cover-letter` (service role)
*/

CREATE TABLE IF NOT EXISTS public.cover_letters (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  application_id    uuid NOT NULL REFERENCES public.tracked_applications(id) ON DELETE CASCADE,
  cv_id             uuid REFERENCES public.stored_cvs(id) ON DELETE SET NULL,
  status            text NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'failed')),
  tone              text NOT NULL DEFAULT 'professionell'
                    CHECK (tone IN ('professionell', 'modern', 'selbstbewusst', 'herzlich')),
  content           jsonb NOT NULL,
  preview           jsonb NOT NULL,
  is_unlocked       boolean NOT NULL DEFAULT false,
  unlocked_via      text CHECK (unlocked_via IN ('credit', 'stripe', 'stripe_addon', 'admin')),
  unlocked_at       timestamptz,
  rewrite_count     integer NOT NULL DEFAULT 0,
  regenerate_count  integer NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cover_letters_application ON public.cover_letters(application_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_created ON public.cover_letters(user_id, created_at DESC);

-- ─── RLS + Spalten-Grants ───────────────────────────────────────────
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own cover letters (read)" ON public.cover_letters;
CREATE POLICY "own cover letters (read)" ON public.cover_letters
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "own cover letters (delete)" ON public.cover_letters;
CREATE POLICY "own cover letters (delete)" ON public.cover_letters
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Kein direkter Zugriff auf `content`, kein Insert/Update vom Client
REVOKE ALL ON public.cover_letters FROM anon, authenticated;
GRANT SELECT (id, user_id, application_id, cv_id, status, tone, is_unlocked, unlocked_via,
              rewrite_count, regenerate_count, created_at, updated_at)
  ON public.cover_letters TO authenticated;
GRANT DELETE ON public.cover_letters TO authenticated;

CREATE OR REPLACE FUNCTION public.cover_letters_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cover_letters_touch ON public.cover_letters;
CREATE TRIGGER trg_cover_letters_touch
  BEFORE UPDATE ON public.cover_letters
  FOR EACH ROW EXECUTE FUNCTION public.cover_letters_touch();

-- ─── Lesen (Vorschau vs. Volltext) ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_cover_letter(p_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', c.id,
    'application_id', c.application_id,
    'tone', c.tone,
    'is_unlocked', c.is_unlocked,
    'unlocked_via', c.unlocked_via,
    'rewrite_count', c.rewrite_count,
    'regenerate_count', c.regenerate_count,
    'created_at', c.created_at,
    'updated_at', c.updated_at,
    'letter', CASE WHEN c.is_unlocked THEN c.content ELSE c.preview END
  )
  FROM public.cover_letters c
  WHERE c.id = p_id AND c.user_id = auth.uid()
$$;

-- ─── Speichern (eigene Änderungen) ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.save_cover_letter(p_id uuid, p_letter jsonb)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF jsonb_typeof(p_letter->'paragraphs') <> 'array'
     OR jsonb_array_length(p_letter->'paragraphs') = 0
     OR length(p_letter::text) > 60000 THEN
    RAISE EXCEPTION 'invalid letter';
  END IF;

  UPDATE public.cover_letters
     SET content = p_letter
   WHERE id = p_id AND user_id = auth.uid() AND is_unlocked;

  RETURN FOUND;
END;
$$;

-- ─── Freischalten per Credit ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unlock_cover_letter_with_credit(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_unlocked boolean;
BEGIN
  SELECT is_unlocked INTO v_unlocked
    FROM public.cover_letters
   WHERE id = p_id AND user_id = v_uid
   FOR UPDATE;

  IF v_unlocked IS NULL THEN
    RAISE EXCEPTION 'not found';
  END IF;
  IF v_unlocked THEN
    RETURN true;
  END IF;

  IF NOT public.consume_token(v_uid, 1) THEN
    RETURN false;
  END IF;

  UPDATE public.cover_letters
     SET is_unlocked = true, unlocked_via = 'credit', unlocked_at = now()
   WHERE id = p_id;

  RETURN true;
END;
$$;

-- ─── Kombi-Preis nur, wenn der verknüpfte CV bezahlt ist ────────────
CREATE OR REPLACE FUNCTION public.cover_letter_addon_eligible(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.cover_letters c
      JOIN public.tracked_applications a ON a.id = c.application_id
      JOIN public.stored_cvs s ON s.id = a.cv_id
     WHERE c.id = p_id
       AND c.user_id = auth.uid()
       AND (s.is_paid OR s.download_unlocked)
  )
$$;

REVOKE ALL ON FUNCTION public.get_cover_letter(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.save_cover_letter(uuid, jsonb) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.unlock_cover_letter_with_credit(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cover_letter_addon_eligible(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_cover_letter(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.save_cover_letter(uuid, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_cover_letter_with_credit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cover_letter_addon_eligible(uuid) TO authenticated;
