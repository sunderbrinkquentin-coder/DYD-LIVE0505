// src/utils/textSanitize.ts

/**
 * Bereinigt Text, der aus einer KI-Generierung stammt (z. B. Job-Targeting /
 * Generalist-Modus), bevor er angezeigt oder exportiert wird.
 *
 * Hintergrund: Quentin hat einen exportierten Lebenslauf geschickt, in dem
 * im Bullet-Text wörtlich "[JD]" auftauchte (ein nicht ersetzter Platzhalter
 * aus der KI-Generierung — vermutlich ein Slot für ein Stichwort aus der
 * Stellenbeschreibung, der leer blieb) und im Profil-Absatz durchgehend ein
 * Leerzeichen VOR Satzzeichen stand ("Abteilungsebene , fundierter",
 * "Problemlösungskompetenz ."). Die Text-Generierung selbst läuft serverseitig
 * und ist von hier aus nicht erreichbar — dieses Modul ist das Sicherheitsnetz
 * an der Anzeige-/Export-Grenze, das solche Artefakte abfängt, egal woher der
 * Text kommt oder ob der Generator morgen wieder denselben Fehler macht.
 *
 * Bewusst NUR am Anzeige-/Export-Rand angewendet (EditableText-Anzeige,
 * PDF-Export) — die zugrunde liegenden Daten in der Datenbank bleiben
 * unangetastet, bis der Nutzer das Feld selbst bearbeitet.
 */
export function sanitizeGeneratedText(text: string): string {
  if (!text) return text;
  return text
    // Kurze eckige Klammern = nicht ersetzter Platzhalter, z. B. "[JD]",
    // "[Keyword]". Auf kurze Inhalte begrenzt (<=24 Zeichen), damit absichtlich
    // vom Nutzer eingegebene, längere Klammer-Inhalte nicht mit verschluckt
    // werden.
    .replace(/\s*\[[^\]\n]{1,24}\]\s*/g, ' ')
    // Leerzeichen vor Satzzeichen entfernen: "Wort , Wort" -> "Wort, Wort"
    .replace(/[ \t]+([.,;:!?])/g, '$1')
    // Durch die Entfernungen entstandene Mehrfach-Leerzeichen normalisieren
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}