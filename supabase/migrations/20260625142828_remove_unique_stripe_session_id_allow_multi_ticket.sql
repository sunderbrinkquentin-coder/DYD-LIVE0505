-- Remove UNIQUE constraint on stripe_session_id to allow multiple tickets per session
-- (needed for quantity > 1 purchases)

ALTER TABLE festival_ticket_sales
  DROP CONSTRAINT IF EXISTS festival_ticket_sales_stripe_session_id_key;

-- Keep a non-unique index for query performance
CREATE INDEX IF NOT EXISTS festival_ticket_sales_stripe_session_id_idx
  ON festival_ticket_sales(stripe_session_id);
