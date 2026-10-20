/*
  # Newsletter mit Double-Opt-in und 50-%-Willkommensrabatt

  Tabelle `newsletter_subscribers` – genau ein Eintrag pro Nutzerkonto.

  Zweck
  - Nachweis der Einwilligung nach Art. 7 Abs. 1 DSGVO (wer, wann, welcher
    Einwilligungstext in welcher Version, über welchen Weg, IP/User-Agent
    bei Anmeldung und Bestätigung).
  - Double-Opt-in: Bestätigungslink (nur der SHA-256-Hash des Tokens wird
    gespeichert), Ablaufdatum.
  - Willkommensrabatt: freigeschaltet erst nach Bestätigung, einmalig,
    befristet; Einlösung wird vom Stripe-Webhook vermerkt.
  - Abmeldung über eigenes Abmelde-Token (Link in jeder E-Mail).

  Status
  - pending       Anmeldung erfolgt, E-Mail noch nicht bestätigt
  - confirmed     bestätigt, erhält Newsletter
  - unsubscribed  abgemeldet (Einwilligung widerrufen)
  - declined      Angebot abgelehnt (es werden KEINE Mails versendet;
                  verhindert nur, dass erneut gefragt wird)

  Sicherheit
  - RLS: Nutzer dürfen nur ihren eigenen Eintrag LESEN.
  - Schreiben ausschließlich über die Edge Function `newsletter`
    (Service-Role). Tokens/Hashes sind über eine View nicht sichtbar.
  - Löschung des Kontos löscht den Eintrag (ON DELETE CASCADE).
*/

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 text NOT NULL,
  first_name            text,
  status                text NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'unsubscribed', 'declined')),

  -- Einwilligungsnachweis
  consent_version       text,
  consent_text          text,
  source                text,
  opt_in_at             timestamptz,
  opt_in_ip             text,
  opt_in_user_agent     text,
  confirmed_at          timestamptz,
  confirm_ip            text,
  confirm_user_agent    text,
  unsubscribed_at       timestamptz,
  unsubscribe_reason    text,
  declined_at           timestamptz,

  -- Double-Opt-in
  confirm_token_hash    text,
  confirm_expires_at    timestamptz,
  confirm_sent_at       timestamptz,
  confirm_send_count    integer NOT NULL DEFAULT 0,

  -- Abmeldung (Link in jeder E-Mail)
  unsubscribe_token     uuid NOT NULL DEFAULT gen_random_uuid(),

  -- Willkommensrabatt
  discount_percent      integer NOT NULL DEFAULT 50,
  discount_granted_at   timestamptz,
  discount_expires_at   timestamptz,
  discount_redeemed_at  timestamptz,
  discount_session_id   text,

  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS newsletter_subscribers_email_idx ON public.newsletter_subscribers (lower(email));
CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx ON public.newsletter_subscribers (status);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_confirm_hash_idx ON public.newsletter_subscribers (confirm_token_hash) WHERE confirm_token_hash IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsub_token_idx ON public.newsletter_subscribers (unsubscribe_token);

CREATE OR REPLACE FUNCTION public.newsletter_subscribers_touch()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS newsletter_subscribers_touch ON public.newsletter_subscribers;
CREATE TRIGGER newsletter_subscribers_touch
  BEFORE UPDATE ON public.newsletter_subscribers
  FOR EACH ROW EXECUTE FUNCTION public.newsletter_subscribers_touch();

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Keine Policies = kein direkter Zugriff für anon/authenticated auf die
-- Tabelle (enthält Tokens/IPs). Stattdessen eine schlanke View nur mit den Feldern, die die App braucht.
CREATE OR REPLACE VIEW public.my_newsletter_status
WITH (security_invoker = false) AS
SELECT
  status,
  confirmed_at,
  discount_percent,
  discount_granted_at,
  discount_expires_at,
  discount_redeemed_at,
  (status = 'confirmed'
     AND discount_granted_at IS NOT NULL
     AND discount_redeemed_at IS NULL
     AND (discount_expires_at IS NULL OR discount_expires_at > now())) AS discount_active
FROM public.newsletter_subscribers
WHERE user_id = auth.uid();

REVOKE ALL ON public.my_newsletter_status FROM anon;
GRANT SELECT ON public.my_newsletter_status TO authenticated;

-- Aufräumen gemäß Datenschutzerklärung:
--  - nicht bestätigte Anmeldungen nach 30 Tagen löschen
--  - 3 Jahre nach Abmeldung die Nachweisdaten (IP, Browser, Text) entfernen;
--    der Status "unsubscribed" bleibt, damit nicht erneut gefragt wird
CREATE OR REPLACE FUNCTION public.newsletter_cleanup()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.newsletter_subscribers
   WHERE status = 'pending' AND opt_in_at < now() - interval '30 days';
  UPDATE public.newsletter_subscribers
     SET consent_text = NULL, opt_in_ip = NULL, opt_in_user_agent = NULL,
         confirm_ip = NULL, confirm_user_agent = NULL
   WHERE status = 'unsubscribed' AND unsubscribed_at < now() - interval '3 years'
     AND (consent_text IS NOT NULL OR opt_in_ip IS NOT NULL);
$$;
REVOKE ALL ON FUNCTION public.newsletter_cleanup() FROM PUBLIC, anon, authenticated;

-- Täglich 03:15 Uhr ausführen, falls pg_cron aktiv ist
-- (Supabase: Database → Extensions → pg_cron aktivieren)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('newsletter-cleanup') FROM cron.job WHERE jobname = 'newsletter-cleanup';
    PERFORM cron.schedule('newsletter-cleanup', '15 3 * * *', 'SELECT public.newsletter_cleanup()');
  END IF;
END $$;
