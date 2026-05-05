/*
  # Create festival_ticket_sales table

  ## Purpose
  Tracks all Harmony Festival ticket purchases processed through Stripe.

  ## New Tables
  - `festival_ticket_sales`
    - `id` (uuid, primary key)
    - `created_at` (timestamptz) - when the purchase was recorded
    - `stripe_session_id` (text, unique) - Stripe checkout session ID, prevents duplicate entries
    - `stripe_payment_intent_id` (text) - Stripe payment intent reference
    - `ticket_type` (text) - machine-readable ticket type: early_bird, dj, concert, bierpong, standup
    - `ticket_label` (text) - human-readable name, e.g. "Early Bird Bundle"
    - `amount_paid` (bigint) - amount in smallest currency unit (cents)
    - `currency` (text) - e.g. "eur"
    - `buyer_email` (text) - email address of the buyer from Stripe
    - `buyer_name` (text, nullable) - name of the buyer if available
    - `payment_status` (text) - e.g. "paid", "unpaid", "refunded"

  ## Security
  - RLS enabled: only service role can insert/update (via Edge Functions)
  - No public read access - admin overview via Supabase Dashboard
*/

CREATE TABLE IF NOT EXISTS festival_ticket_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  stripe_session_id text UNIQUE NOT NULL,
  stripe_payment_intent_id text,
  ticket_type text NOT NULL,
  ticket_label text NOT NULL DEFAULT '',
  amount_paid bigint,
  currency text DEFAULT 'eur',
  buyer_email text,
  buyer_name text,
  payment_status text DEFAULT 'paid'
);

ALTER TABLE festival_ticket_sales ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS festival_ticket_sales_ticket_type_idx ON festival_ticket_sales(ticket_type);
CREATE INDEX IF NOT EXISTS festival_ticket_sales_created_at_idx ON festival_ticket_sales(created_at);
CREATE INDEX IF NOT EXISTS festival_ticket_sales_buyer_email_idx ON festival_ticket_sales(buyer_email);
