/*
  # Fix Festival Ticket RLS Policies

  ## Summary
  Fixes two RLS policy issues on festival_ticket_sales that prevent purchased tickets
  from appearing in the dashboard:

  1. The "Users can read festival tickets by buyer email" SELECT policy used a subquery
     into auth.users which can fail silently in RLS context. Replaced with the built-in
     auth.email() function which is more reliable.

  2. The "Users can claim unlinked ticket by session" UPDATE policy had a USING clause
     of (user_id IS NULL) and WITH CHECK of (auth.uid() = user_id). This means a user
     who already owns a ticket (user_id = their id) cannot re-update it, and Supabase
     also needs the row to be visible via SELECT before it allows an UPDATE — the old
     policy would block the update entirely on already-linked tickets. The new USING
     clause allows both NULL and already-owned rows.

  ## Changes
  - Dropped and recreated "Users can read festival tickets by buyer email" SELECT policy
  - Dropped and recreated "Users can claim unlinked ticket by session" UPDATE policy
*/

DROP POLICY IF EXISTS "Users can read festival tickets by buyer email" ON festival_ticket_sales;
DROP POLICY IF EXISTS "Users can claim unlinked ticket by session" ON festival_ticket_sales;

CREATE POLICY "Users can read festival tickets by buyer email"
  ON festival_ticket_sales FOR SELECT
  TO authenticated
  USING (buyer_email = auth.email());

CREATE POLICY "Users can claim unlinked ticket by session"
  ON festival_ticket_sales
  FOR UPDATE
  TO authenticated
  USING (user_id IS NULL OR auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
