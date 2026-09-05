// src/components/cv-templates/pdfRenderStyles.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// GEMEINSAMES CSS FÜR DEN "data-pdf-root"-RENDER
// ─────────────────────────────────────────────────────────────────────────────
//
// Vorher stand dieser komplette Block als wörtliches `<style>{...}</style>`
// nur in CVLiveEditorPage.tsx. Für den serverseitigen PDF-Export (siehe
// src/pages/CvExportRenderPage.tsx) wird exakt derselbe versteckte
// `data-pdf-root`-Baum ein zweites Mal gerendert — und muss deshalb exakt
// dieselben Regeln bekommen, sonst driften Editor-Vorschau und Server-Export
// wieder auseinander (genau das Problem, das breakEngine.ts schon einmal für
// die Umbruchberechnung gelöst hat).
//
// Diese Datei ist eine reine Extraktion — der Inhalt ist unverändert aus
// CVLiveEditorPage.tsx übernommen, nur der Ort hat sich geändert. Beide Seiten
// importieren jetzt `PDF_RENDER_STYLES_CSS` statt den Text zweimal zu pflegen.
//
// ─────────────────────────────────────────────────────────────────────────────

export const PDF_RENDER_STYLES_CSS = `
  /* ─────────────────────────────────────────────────────────────────
     .pdf-hidden — Editor-Controls, die nicht ins PDF gehören.

     KRITISCH: Diese Elemente müssen AUS DEM FLUSS sein, nicht nur
     kollabiert. Vorher hat max-height:0 sie zwar unsichtbar gemacht,
     aber ihre Wrapper trugen weiter margin/padding zum Layout bei.
     Der PDF-Klon entfernt sie dagegen komplett. Ergebnis: der Klon war
     pro Station ~6px flacher als die Vorschau, über zehn Stationen
     60px — und der Seitenumbruch saß woanders.

     Mit position:absolute ist ihr Layout-Beitrag exakt null. Entfernen
     im Klon ändert die Höhen dann nicht mehr. Genau das ist die
     Voraussetzung dafür, dass die Break-Engine auf beiden DOMs
     dasselbe Ergebnis liefert.
     ───────────────────────────────────────────────────────────────── */
  .pdf-hidden {
    position: absolute !important;
    margin: 0 !important;
    z-index: 5;
    opacity: 0;
    pointer-events: auto;
    transition: opacity 0.12s ease;
    white-space: nowrap;
  }
  [data-break-item],
  [data-break-atomic],
  [data-spacer-id],
  [data-chip-row] > span,
  [data-pdf-root] li,
  .a4-page-frame li {
    position: relative;
  }

  /* Hover irgendwo auf der Karte/Sektion (nicht nur auf einem
     direkten Kind) blendet ALLE darin verschachtelten
     .pdf-hidden-Steuerelemente ein — Griff, Auf/Ab-Pfeile und
     Plus-Buttons gleichermassen, egal auf welcher Verschachtelungs-
     tiefe sie im Markup stehen. */
  [data-break-item]:hover .pdf-hidden,
  [data-break-atomic]:hover .pdf-hidden,
  [data-spacer-id]:hover .pdf-hidden,
  [data-pdf-root] li:hover .pdf-hidden,
  .a4-page-frame li:hover .pdf-hidden,
  [data-chip-row] > span:hover .pdf-hidden {
    opacity: 1;
  }

  /* Steuerzeile einer Station: unten rechts in die Karte. */
  [data-break-item] > .pdf-hidden,
  [data-spacer-id] > .pdf-hidden {
    right: 6px;
    bottom: 4px;
    display: flex !important;
    gap: 8px;
    align-items: center;
  }

  /* Bullet-Löschen: rechts oben in der Zeile. */
  li > .pdf-hidden {
    right: 0;
    top: 0;
  }

  /* Chip-Löschen: an der rechten Kante des Chips. */
  [data-chip-row] > span > .pdf-hidden {
    right: 2px;
    top: 50%;
    transform: translateY(-50%);
  }

  /* Buttons, die INLINE in einer normalen Text-/Titelzeile sitzen sollen
     (z. B. "Ort hinzufügen" direkt hinter einem Titel): position:static
     statt absolute, damit Flex-Gap/Fluss stimmen. */
  [data-inline-control],
  [data-inline-control] .pdf-hidden {
    position: static !important;
    display: inline-flex !important;
  }

  .nonce-export { display: none !important; }

  .a4-page-frame {
    width: 794px !important;
    height: 1122px !important;
    background-color: #ffffff !important;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4) !important;
    border-radius: 4px;
    position: absolute !important;
    overflow: hidden !important;
  }

  /* text-size-adjust:none verhindert iOS-Text-Boosting, ohne font-size
     zu ändern — für sichtbare Frames UND den versteckten PDF-Render. */
  .a4-page-frame,
  .a4-page-frame *,
  [data-pdf-root],
  [data-pdf-root] * {
    -webkit-text-size-adjust: none !important;
    text-size-adjust: none !important;
  }

  /* Chips: iOS zwingt contenteditable sonst auf min. 16px. */
  .a4-page-frame [data-chip-row] [contenteditable],
  [data-pdf-root] [data-chip-row] [contenteditable] {
    font-size: 9px !important;
    transform: none !important;
  }

  [data-chip-row] {
    overflow: hidden !important;
    max-width: 100% !important;
  }
`;
