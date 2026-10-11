/*
  # Anschreiben-Fragebogen
  Antworten aus dem Fragebogen werden pro Bewerbung gespeichert und bei
  "Neu erstellen" / späteren Entwürfen wiederverwendet.
*/
ALTER TABLE public.tracked_applications
  ADD COLUMN IF NOT EXISTS cover_letter_brief jsonb;
