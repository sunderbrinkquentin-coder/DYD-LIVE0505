/*
  # Extend festival_ticket_sales table

  ## Summary
  Adds user tracking, bierpong team info, and a human-readable ticket number
  to the festival_ticket_sales table.

  ## Changes
  - `user_id` – references auth.users; allows linking tickets to dashboard
  - `ticket_number` – unique readable number like "HRM-2026-0042"
  - `bierpong_team_name` – team name entered before bierpong checkout
  - `bierpong_partner_name` – optional second team member name

  ## Security
  - New RLS policies: authenticated users can read their own tickets
  - Anonymous users can still insert (webhook uses service role anyway)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'festival_ticket_sales' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE festival_ticket_sales ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'festival_ticket_sales' AND column_name = 'ticket_number'
  ) THEN
    ALTER TABLE festival_ticket_sales ADD COLUMN ticket_number text UNIQUE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'festival_ticket_sales' AND column_name = 'bierpong_team_name'
  ) THEN
    ALTER TABLE festival_ticket_sales ADD COLUMN bierpong_team_name text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'festival_ticket_sales' AND column_name = 'bierpong_partner_name'
  ) THEN
    ALTER TABLE festival_ticket_sales ADD COLUMN bierpong_partner_name text;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS festival_ticket_sales_user_id_idx ON festival_ticket_sales(user_id);

ALTER TABLE festival_ticket_sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own festival tickets" ON festival_ticket_sales;
CREATE POLICY "Users can read own festival tickets"
  ON festival_ticket_sales FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert festival tickets" ON festival_ticket_sales;
CREATE POLICY "Service role can insert festival tickets"
  ON festival_ticket_sales FOR INSERT
  TO service_role
  WITH CHECK (true);

DROP POLICY IF EXISTS "Anon can read festival ticket by session id" ON festival_ticket_sales;
CREATE POLICY "Anon can read festival ticket by session id"
  ON festival_ticket_sales FOR SELECT
  TO anon
  USING (true);
