/*
  # Create support_messages table

  Stores messages sent by supporters through the "Jetzt unterstützen" popup
  on the Harmony Festival page after a successful Stripe payment.

  1. New Tables
    - `support_messages`
      - `id` (uuid, primary key)
      - `message` (text) - the supporter's message
      - `stripe_session_id` (text) - the Stripe session ID for reference
      - `user_id` (uuid, nullable) - linked user if authenticated
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS
    - Allow anonymous insert (anyone who just paid can send a message)
    - No select policy for public (only service role / admin can read)
*/

CREATE TABLE IF NOT EXISTS support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL DEFAULT '',
  stripe_session_id text,
  user_id uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert a support message"
  ON support_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
