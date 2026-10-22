// Nicht geheime Einstellungen. Hier ändern, nicht in Supabase Secrets.
// Nach jeder Änderung die betroffenen Edge Functions neu deployen.
//
// Skill-Gap-Analyse: GPT-5.6 Luna – bestes Preis-Leistungs-Verhältnis
// (ca. 0,20 $ / 1,20 $ je 1 Mio. Input-/Output-Token, gleiches Modell wie
// cv-depth-analysis). Luna akzeptiert KEIN "temperature" – wird hier nicht gesendet.
export const ACADEMY_MODEL = 'gpt-5.6-luna';
// Recherche-Schritt mit Websuche. Separat einstellbar: Falls Luna die Websuche
// ablehnt (Log: "OpenAI recherche HTTP 400 … web_search"), nur diese Zeile auf
// 'gpt-5.6-terra' setzen – die übrigen Schritte bleiben günstig auf Luna.
export const ACADEMY_RESEARCH_MODEL = 'gpt-5.6-luna';
export const newsletterConfig = {
  syncProperties: false,
  segmentId: '',
};
