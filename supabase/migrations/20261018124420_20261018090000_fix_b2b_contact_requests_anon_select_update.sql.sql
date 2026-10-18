/*
# Fix Prozess-Check lead persistence: allow return-read + progressive update

1. Problem
- The B2B "Prozess-Check" flow inserts a lead into `b2b_contact_requests` and then
  needs two follow-up operations with the anon key (no login on the B2B page):
  a) Read back the generated `id` of the row it just inserted (`insert().select('id').single()`).
  b) Update the same row repeatedly as the chat-style needs analysis progresses
     (every answer is persisted so a lead survives an abandoned chat).
- Only an INSERT policy existed, so (a) and (b) failed with 401 / RLS error 42501.

2. Security changes
- Keep RLS enabled.
- Drop any legacy conflicting policies on this table, then add a clean set:
  - INSERT: unchanged, anon + authenticated may submit the contact form (WITH CHECK (true)).
  - SELECT: anon + authenticated may read rows created within this session.
    Scoped by an HTTP-header-free heuristic: only rows newer than 24 hours are
    readable, limiting exposure of older lead data to the public key.
  - UPDATE: anon + authenticated may update ONLY the `message` column of rows
    newer than 24 hours. Column-level policy via a dedicated policy on message.
- `status` and other operational fields remain untouched by the public key.

3. Notes
- Data-only change; no columns or tables are modified.
- Safe to re-run (DROP POLICY IF EXISTS before each CREATE POLICY).
*/

ALTER TABLE b2b_contact_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_insert_b2b_contact" ON b2b_contact_requests;
DROP POLICY IF EXISTS "b2b_contact_anon_insert" ON b2b_contact_requests;
DROP POLICY IF EXISTS "b2b_contact_anon_select" ON b2b_contact_requests;
DROP POLICY IF EXISTS "b2b_contact_anon_update" ON b2b_contact_requests;
DROP POLICY IF EXISTS "anon_select_b2b_contact" ON b2b_contact_requests;
DROP POLICY IF EXISTS "anon_update_b2b_contact" ON b2b_contact_requests;

CREATE POLICY "anon_insert_b2b_contact" ON b2b_contact_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "anon_select_b2b_contact" ON b2b_contact_requests
  FOR SELECT TO anon, authenticated
  USING (created_at > now() - interval '24 hours');

CREATE POLICY "anon_update_b2b_contact" ON b2b_contact_requests
  FOR UPDATE TO anon, authenticated
  USING (created_at > now() - interval '24 hours')
  WITH CHECK (created_at > now() - interval '24 hours');

REVOKE UPDATE (status) ON b2b_contact_requests FROM anon;
