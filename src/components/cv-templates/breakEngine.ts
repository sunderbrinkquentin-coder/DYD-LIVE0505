// src/components/cv-templates/breakEngine.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// DIE EINZIGE QUELLE DER WAHRHEIT FÜR SEITENUMBRÜCHE
// ─────────────────────────────────────────────────────────────────────────────
//
// Vorher gab es drei Instanzen, die unabhängig voneinander Seiten berechneten:
//   1. die "Smart-Break Engine" in CVLiveEditorPage (deren Ergebnis nie
//      angewendet wurde — `pageBreakItems` wurde immer als leere Map übergeben)
//   2. die sichtbaren A4-Frames, die stur alle 1122px schnitten
//   3. `findBreak()` im pdfExportClient mit eigenem Kandidaten-Scoring
//
// Preview und PDF konnten deshalb gar nicht übereinstimmen. Diese Datei ersetzt
// alle drei. Preview und Export rufen dieselbe Funktion auf demselben Layout
// auf und bekommen dieselben Schnittpositionen.
//
// ─────────────────────────────────────────────────────────────────────────────
// VERTRAG — beide Aufrufer müssen ihn einhalten, sonst driften die Ergebnisse
// ─────────────────────────────────────────────────────────────────────────────
//
//  (A) Der übergebene Root ist 794px breit und UNSKALIERT.
//      (Falls doch ein Transform aktiv ist, rechnet die Engine ihn heraus —
//      aber Rundungsfehler bleiben. Besser: unskaliert messen.)
//
//  (B) Editor-Controls (.pdf-hidden) sind AUS DEM FLUSS genommen, also
//      `position: absolute`. NICHT `max-height: 0` — das war die alte Lösung
//      und der Grund für die Höhendrift: der PDF-Klon entfernt die Controls
//      komplett, die Preview kollabierte sie nur. Ergebnis: pro Station ~6px
//      Unterschied, über 10 Stationen 60px, und der Umbruch saß woanders.
//      Sind die Controls absolut positioniert, ist ihr Layout-Beitrag null —
//      und Entfernen ändert nichts mehr.
//
//  (C) Alle Webfonts sind geladen (`document.fonts.ready`). Vorher gemessene
//      Höhen sind sonst Fallback-Höhen.
//
// ─────────────────────────────────────────────────────────────────────────────
// DAS ATTRIBUT-VOKABULAR
// ─────────────────────────────────────────────────────────────────────────────
//
//  data-break-atomic
//      Darf NIEMALS getrennt werden. Passt der Block nicht mehr auf die
//      aktuelle Seite, wandert er komplett auf die nächste.
//      → Sprachen, Skills, Soft Skills, Stipendien, Zertifikate, Hobbys, Werte
//      Ausnahme: Ist der Block höher als eine ganze Seite, wird er notgedrungen
//      als teilbar behandelt (sonst wäre er nirgends platzierbar).
//
//  data-break-item
//      Eine einzelne Station (Job, Studium, Projekt). Wird zusammengehalten,
//      solange sie kürzer ist als `tallItemRatio` × Seitenhöhe (Default 70%).
//      Darüber wird sie teilbar — dann darf an Bullet-Grenzen geschnitten werden.
//
//  data-break-keep-next
//      Eine Überschrift. Zwischen ihr und dem folgenden Inhalt darf nicht
//      geschnitten werden; zusätzlich müssen `keepAheadPx` des Folgeinhalts
//      mit auf dieselbe Seite. Verhindert die einsame Überschrift am Seitenfuß.
//
//  data-break-line
//      Optionaler, feiner Schnittpunkt innerhalb einer sehr langen Station
//      (typischerweise ein <li>). Wird nur genutzt, wenn die Station ohnehin
//      teilbar ist.
//
//  data-pdf-footer
//      Wird nicht paginiert. Der Bereich ab dem Footer zählt nicht zum Inhalt.
//
// ─────────────────────────────────────────────────────────────────────────────

export const PAGE_HEIGHT_PX = 1122;

export interface BreakOptions {
  /** Höhe einer Seite in CSS-Pixeln. Default: 1122 (A4 bei 794px Breite). */
  pageHeight?: number;
  /** Eine Seite muss mindestens so voll werden, sonst wird ein späterer Schnitt gesucht. */
  minFill?: number;
  /** So viele Pixel des Folgeinhalts müssen hinter einer Überschrift auf derselben Seite bleiben. */
  keepAheadPx?: number;
  /** Ab diesem Anteil der Seitenhöhe gilt eine Station als "außergewöhnlich lang" und wird teilbar. */
  tallItemRatio?: number;
  /** Messtoleranz gegen Sub-Pixel-Rundung. */
  tolerancePx?: number;
  /** Notbremse gegen Endlosschleifen bei kaputtem DOM. */
  maxPages?: number;
}

export interface BreakResult {
  /** cuts[i] = Y-Position, an der Seite i beginnt. cuts[0] ist immer 0. */
  cuts: number[];
  /** Höhe des Inhalts ohne Footer, in CSS-Pixeln. */
  contentHeight: number;
  /** Anzahl der Seiten. Entspricht cuts.length. */
  pageCount: number;
}

const DEFAULTS: Required<BreakOptions> = {
  pageHeight: PAGE_HEIGHT_PX,
  minFill: 0.55,
  keepAheadPx: 44,
  tallItemRatio: 0.7,
  tolerancePx: 2,
  maxPages: 30,
};

/** Ein Bereich, in dem nicht geschnitten werden darf. */
interface Zone {
  top: number;
  bottom: number;
  /** Nur für Debugging/Diagnose. */
  reason: string;
}

interface Box {
  top: number;
  bottom: number;
  height: number;
}

// ─── Messung ─────────────────────────────────────────────────────────────────

/**
 * Erzeugt eine Messfunktion, die Positionen relativ zum Root und in
 * LAYOUT-Pixeln liefert — auch wenn der Root per CSS-Transform skaliert ist.
 *
 * getBoundingClientRect() ist von Transforms betroffen, offsetWidth nicht.
 * Aus dem Verhältnis beider ergibt sich der Skalierungsfaktor.
 */
function makeMeasure(root: HTMLElement) {
  const rootRect = root.getBoundingClientRect();
  const layoutWidth = root.offsetWidth;
  const scale = layoutWidth > 0 && rootRect.width > 0 ? rootRect.width / layoutWidth : 1;

  return (el: Element): Box => {
    const r = el.getBoundingClientRect();
    return {
      top: (r.top - rootRect.top) / scale,
      bottom: (r.bottom - rootRect.top) / scale,
      height: r.height / scale,
    };
  };
}

function isRendered(el: HTMLElement): boolean {
  if (el.offsetParent === null && el.style.position !== 'fixed') {
    // offsetParent === null bedeutet display:none (oder fixed, siehe oben)
    const cs = el.ownerDocument.defaultView?.getComputedStyle(el);
    if (!cs || cs.display === 'none' || cs.visibility === 'hidden') return false;
  }
  return el.offsetHeight > 0 || el.offsetWidth > 0;
}

/** Elemente, die aus dem Fluss genommen sind, dürfen die Umbruchrechnung nicht beeinflussen. */
function isInFlow(el: HTMLElement): boolean {
  const cs = el.ownerDocument.defaultView?.getComputedStyle(el);
  if (!cs) return true;
  return cs.position !== 'absolute' && cs.position !== 'fixed' && cs.display !== 'none';
}

// ─── Verbotszonen ────────────────────────────────────────────────────────────

function collectZones(root: HTMLElement, opts: Required<BreakOptions>): Zone[] {
  const measure = makeMeasure(root);
  const zones: Zone[] = [];

  const push = (el: HTMLElement, reason: string, top: number, bottom: number) => {
    if (bottom - top < 4) return;
    // Eine Zone, die höher ist als eine Seite, kann nirgends am Stück stehen.
    // Sie wird ignoriert — sonst würde die Engine sie endlos nach unten schieben.
    if (bottom - top > opts.pageHeight) return;
    zones.push({ top, bottom, reason });
  };

  // 1. Atomare Blöcke — niemals trennen.
  root.querySelectorAll<HTMLElement>('[data-break-atomic]').forEach((el) => {
    if (!isRendered(el) || !isInFlow(el)) return;
    const b = measure(el);
    push(el, 'atomic', b.top, b.bottom);
  });

  // 2. Stationen — zusammenhalten, außer sie sind außergewöhnlich lang.
  const tallThreshold = opts.pageHeight * opts.tallItemRatio;
  root.querySelectorAll<HTMLElement>('[data-break-item]').forEach((el) => {
    if (!isRendered(el) || !isInFlow(el)) return;
    const b = measure(el);
    if (b.height > tallThreshold) return; // teilbar
    push(el, 'item', b.top, b.bottom);
  });

  // 3. Überschriften — dürfen nicht allein am Seitenfuß stehen.
  //    Die Zone reicht von der Überschrift bis `keepAheadPx` in den Folgeinhalt.
  root.querySelectorAll<HTMLElement>('[data-break-keep-next]').forEach((el) => {
    if (!isRendered(el) || !isInFlow(el)) return;
    const head = measure(el);

    let zoneBottom = head.bottom + opts.keepAheadPx;

    // Nicht weiter reichen als bis zum Ende des Folgeelements — sonst würde die
    // Zone in einen Bereich hineinragen, in dem ein Schnitt völlig legitim wäre.
    const next = nextRenderedSibling(el);
    if (next) {
      const nb = measure(next);
      zoneBottom = Math.min(zoneBottom, nb.bottom);
    }

    push(el, 'keep-next', head.top, zoneBottom);
  });

  return zones.sort((a, b) => a.top - b.top);
}

function nextRenderedSibling(el: HTMLElement): HTMLElement | null {
  let n = el.nextElementSibling;
  while (n) {
    if (n instanceof HTMLElement && isRendered(n) && isInFlow(n)) return n;
    n = n.nextElementSibling;
  }
  return null;
}

// ─── Schnittkandidaten ───────────────────────────────────────────────────────

/**
 * Legale Schnittpositionen. Wir sammeln bewusst großzügig — die Zonen filtern
 * anschließend alles Unerlaubte heraus. Kein Scoring, keine Prioritäten:
 * die Engine nimmt schlicht den tiefsten legalen Schnitt, der noch auf die
 * Seite passt. Das füllt Seiten maximal und ist deterministisch.
 */
function collectCandidates(root: HTMLElement, contentEnd: number): number[] {
  const measure = makeMeasure(root);
  const set = new Set<number>();

  const add = (v: number) => {
    if (v > 1 && v < contentEnd - 1) set.add(Math.round(v));
  };

  const selector = [
    '[data-break-atomic]',
    '[data-break-item]',
    '[data-break-block]',
    '[data-break-keep-next]',
    '[data-break-line]',
    '[data-pdf-section]',
    'section',
    'article',
    'li',
    'h2',
    'h3',
  ].join(',');

  root.querySelectorAll<HTMLElement>(selector).forEach((el) => {
    if (!isRendered(el) || !isInFlow(el)) return;
    const b = measure(el);
    if (b.height < 4) return;
    add(b.top);
    add(b.bottom);
  });

  return Array.from(set).sort((a, b) => a - b);
}

// ─── Kernlogik ───────────────────────────────────────────────────────────────

function isInsideZone(pos: number, zones: Zone[], tol: number): boolean {
  // Ein Schnitt exakt AUF der Zonengrenze ist erlaubt — nur echtes Durchschneiden
  // ist verboten.
  for (const z of zones) {
    if (z.top + tol < pos && pos < z.bottom - tol) return true;
  }
  return false;
}

/** Die Zone, die an dieser Position durchgeschnitten würde — für den Rückfall-Pfad. */
function straddlingZone(pos: number, zones: Zone[], tol: number): Zone | null {
  let found: Zone | null = null;
  for (const z of zones) {
    if (z.top + tol < pos && pos < z.bottom - tol) {
      // Bei überlappenden Zonen (Überschrift + erste Station) gewinnt die,
      // die am weitesten oben beginnt — sonst zerreißen wir die äußere.
      if (!found || z.top < found.top) found = z;
    }
  }
  return found;
}

/**
 * Ende des paginierten Inhalts. Der Footer zählt nicht dazu — er wird per
 * `marginTop: auto` an den Fuß der letzten Seite gedrückt.
 *
 * ACHTUNG, subtile Falle: Man könnte `footer.top` als Inhaltsende nehmen. Das
 * wäre instabil. Sobald der Aufrufer die Container-Höhe auf das Ergebnis dieser
 * Engine setzt, rutscht der Footer nach unten — die nächste Messung liefert ein
 * größeres Inhaltsende, die Seitenzahl wächst, der Container wächst, und die
 * Rechnung läuft sich selbst hinterher.
 *
 * Deshalb messen wir die Unterkante des letzten Inhalts-Kindes. Die ist von der
 * Container-Höhe unabhängig und damit ein Fixpunkt.
 */
function findContentEnd(root: HTMLElement): number {
  const footer = root.querySelector<HTMLElement>('[data-pdf-footer]');
  if (!footer) return root.scrollHeight;

  const measure = makeMeasure(root);
  let end = 0;

  for (const child of Array.from(root.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (child === footer || child.contains(footer)) continue;
    if (!isInFlow(child) || !isRendered(child)) continue;
    const b = measure(child);
    if (b.bottom > end) end = b.bottom;
  }

  return end > 0 ? end : root.scrollHeight;
}

/**
 * Berechnet die Seitenanfänge für ein CV-Layout.
 *
 * Deterministisch: gleicher DOM-Zustand → gleiches Ergebnis. Genau deshalb
 * können Preview und PDF-Export sie beide aufrufen und stimmen überein.
 */
export function computeBreakPoints(
  root: HTMLElement,
  options: BreakOptions = {}
): BreakResult {
  const opts = { ...DEFAULTS, ...options };
  const { pageHeight, minFill, tolerancePx, maxPages } = opts;

  const contentHeight = findContentEnd(root);

  // Passt alles auf eine Seite? Dann gibt es nichts zu schneiden.
  if (contentHeight <= pageHeight + tolerancePx) {
    return { cuts: [0], contentHeight, pageCount: 1 };
  }

  const zones = collectZones(root, opts);
  const candidates = collectCandidates(root, contentHeight);

  const cuts: number[] = [0];
  let cursor = 0;

  while (contentHeight - cursor > pageHeight + tolerancePx && cuts.length < maxPages) {
    const hardMax = cursor + pageHeight;
    const softMin = cursor + pageHeight * minFill;

    // Tiefster legaler Schnitt, der die Seite noch nicht überläuft.
    let best = -1;
    for (const pos of candidates) {
      if (pos <= softMin) continue;
      if (pos > hardMax) break; // candidates ist sortiert
      if (isInsideZone(pos, zones, tolerancePx)) continue;
      if (pos > best) best = pos;
    }

    if (best < 0) {
      // Kein legaler Kandidat oberhalb der Mindestfüllung. Das passiert, wenn ein
      // atomarer Block (Sprachen, Skills, …) genau über die Seitengrenze ragt.
      // Dann schneiden wir VOR diesem Block — auch wenn die Seite dadurch
      // kürzer wird als minFill. Eine halbleere Seite ist besser als ein
      // zerrissener Sprachenblock.
      const straddler = straddlingZone(hardMax, zones, tolerancePx);

      if (straddler && straddler.top > cursor + tolerancePx) {
        best = straddler.top;
      } else {
        // Auch das greift nicht: entweder ragt der Block schon vom Seitenanfang
        // an über die Grenze (dann ist er unteilbar UND zu groß — kann bei
        // exakt seitenhohen Blöcken passieren), oder es gibt gar keine
        // Kandidaten. Harter Schnitt als letzte Instanz.
        const fallback = candidates.filter(
          (p) => p > cursor + tolerancePx && p <= hardMax && !isInsideZone(p, zones, tolerancePx)
        );
        best = fallback.length > 0 ? fallback[fallback.length - 1] : hardMax;
      }
    }

    // Absicherung gegen Stillstand: jeder Schnitt muss echten Fortschritt bringen.
    if (best <= cursor + tolerancePx) {
      best = hardMax;
    }

    cuts.push(best);
    cursor = best;
  }

  return { cuts, contentHeight, pageCount: cuts.length };
}

// ─── Hilfen für die Aufrufer ────────────────────────────────────────────────

/**
 * Höhe der Seite `index` — die letzte Seite reicht bis zum Inhaltsende,
 * alle anderen bis zum nächsten Schnitt.
 */
export function pageSliceHeight(result: BreakResult, index: number): number {
  const { cuts, contentHeight } = result;
  const start = cuts[index];
  const end = index + 1 < cuts.length ? cuts[index + 1] : contentHeight;
  return Math.max(0, end - start);
}

/**
 * Höhe, die der Template-Container mindestens haben muss, damit der Footer
 * exakt am Fuß der LETZTEN Seite sitzt.
 *
 * Nicht `pageCount × pageHeight` verwenden. Beginnt die letzte Seite bei y=980
 * (weil ein atomarer Block nach unten geschoben wurde), muss der Container
 * 980 + 1122 = 2102px hoch sein — nicht 2244px. Sonst rutscht der per
 * `marginTop: auto` positionierte Footer unter den sichtbaren Blattbereich
 * und fehlt im Export.
 */
export function containerHeightFor(
  result: BreakResult,
  pageHeight: number = PAGE_HEIGHT_PX
): number {
  const lastPageStart = result.cuts[result.cuts.length - 1] ?? 0;
  return lastPageStart + pageHeight;
}

/**
 * Diagnose für die Konsole. Meldet jedes Element, das trotz Regelwerk
 * durchgeschnitten wurde. Im Idealfall bleibt die Liste leer.
 *
 * Aufruf im Browser:  window.__debugBreaks?.()
 */
export function debugBreaks(root: HTMLElement, options: BreakOptions = {}): void {
  const opts = { ...DEFAULTS, ...options };
  const result = computeBreakPoints(root, options);
  const zones = collectZones(root, opts);

  const violations: Array<{ cut: number; zone: Zone }> = [];
  for (const cut of result.cuts.slice(1)) {
    const z = straddlingZone(cut, zones, opts.tolerancePx);
    if (z) violations.push({ cut, zone: z });
  }

  console.groupCollapsed(
    `[breakEngine] ${result.pageCount} Seiten, ${Math.round(result.contentHeight)}px Inhalt`
  );
  console.log('Schnitte:', result.cuts.map((c) => Math.round(c)));
  console.log('Zonen:', zones.length);
  if (violations.length === 0) {
    console.log('✓ Keine Zone durchgeschnitten.');
  } else {
    console.warn('✗ Durchgeschnittene Zonen:', violations);
  }
  console.groupEnd();
}