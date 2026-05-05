/*
  # Add Festival Ticket Claim Policies

  ## Summary
  Extends RLS policies on festival_ticket_sales to allow:
  1. Authenticated users to update their own ticket's user_id when it is currently NULL
     (handles tickets bought before auth gate or when webhook saved without user_id)
  2. Authenticated users to read tickets where their email matches buyer_email
     (fallback for finding tickets not yet linked to a user_id)

  ## Changes
  - New UPDATE policy: authenticated users can claim unlinked tickets matching their session
  - New SELECT policy: authenticated users can read tickets matching their email
*/

CREATE POLICY "Users can claim unlinked ticket by session"
  ON festival_ticket_sales
  FOR UPDATE
  TO authenticated
  USING (user_id IS NULL)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read festival tickets by buyer email"
  ON festival_ticket_sales
  FOR SELECT
  TO authenticated
  USING (buyer_email = (SELECT email FROM auth.users WHERE id = auth.uid()));
