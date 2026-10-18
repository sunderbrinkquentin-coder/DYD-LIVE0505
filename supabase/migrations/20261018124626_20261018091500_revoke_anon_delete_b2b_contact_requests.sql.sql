/*
# Remove anon DELETE grant on b2b_contact_requests

1. Security changes
- The public visitor key never deletes leads (the app has no such function), but the
  default grant allowed it. Revoke DELETE from anon so visitors can only submit and
  progress their own request.
- No policy or data changes; safe to re-run.
*/

REVOKE DELETE ON TABLE b2b_contact_requests FROM anon;
