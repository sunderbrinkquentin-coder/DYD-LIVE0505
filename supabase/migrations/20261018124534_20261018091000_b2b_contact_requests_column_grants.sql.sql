/*
# Tighten column grants on b2b_contact_requests (anon may only edit message)

1. Problem
- The previous migration used `REVOKE UPDATE (status) ... FROM anon`, but a legacy
  table-level UPDATE grant to `anon` (from default Supabase grants) supersedes any
  column-level revoke, so anon could still write `status`.

2. Security changes
- Revoke the table-level UPDATE grant from anon entirely.
- Grant anon column-level UPDATE on `message` only (the needs-analysis payload).
- `status` and all other columns remain unwritable via the public key.
- RLS policies from the previous migration are unchanged.

3. Notes
- No data changes; safe to re-run (GRANT/REVOKE are idempotent).
*/

REVOKE UPDATE ON TABLE b2b_contact_requests FROM anon;
GRANT UPDATE (message) ON TABLE b2b_contact_requests TO anon;
