/*
  # Remove duplicate INSERT policy on stored_cvs

  There are two INSERT policies on stored_cvs:
  - "cv_check_insert_bypass" (duplicate, no WITH CHECK condition)
  - "stored_cvs_insert" (canonical policy)

  Dropping the duplicate to avoid ambiguity.
*/

DROP POLICY IF EXISTS "cv_check_insert_bypass" ON public.stored_cvs;
