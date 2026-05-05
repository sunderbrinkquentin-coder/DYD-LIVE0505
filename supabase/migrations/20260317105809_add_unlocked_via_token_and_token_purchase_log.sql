/*
  # Add token-unlock support to stored_cvs and ensure token_purchases table exists

  1. Changes to stored_cvs
     - Add `unlocked_via_token` boolean column (default false) to track when a CV was
       unlocked using a credit instead of a direct Stripe payment

  2. New table: token_purchases (if not exists)
     - Logs every token bundle purchase for auditing
     - Columns: id, user_id, stripe_session_id, price_id, tokens_purchased, amount_paid, currency, created_at
     - RLS enabled: only the owning user can read their own rows; service_role inserts

  3. Ensure user_tokens has updated_at column
*/

-- Add unlocked_via_token to stored_cvs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stored_cvs' AND column_name = 'unlocked_via_token'
  ) THEN
    ALTER TABLE public.stored_cvs ADD COLUMN unlocked_via_token boolean DEFAULT false;
  END IF;
END $$;

-- Ensure updated_at exists on user_tokens (in case it was created without it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_tokens' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.user_tokens ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create token_purchases table for purchase audit log
CREATE TABLE IF NOT EXISTS public.token_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_session_id text,
  price_id text,
  tokens_purchased integer NOT NULL DEFAULT 0,
  amount_paid integer,
  currency text DEFAULT 'eur',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.token_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own token purchases"
  ON public.token_purchases
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role can insert token purchases"
  ON public.token_purchases
  FOR INSERT
  TO service_role
  WITH CHECK (true);
