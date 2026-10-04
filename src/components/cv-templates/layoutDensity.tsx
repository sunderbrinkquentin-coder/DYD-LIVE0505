// src/components/cv-templates/layoutDensity.tsx
//
// "Seiten besser nutzen": Bleibt auf der letzten Seite nur ein kleiner Rest
// stehen (ein paar Fähigkeiten, eine einzelne Station), wird das gesamte Layout
// leicht verdichtet, sodass es eine Seite weniger braucht. Das passiert
// gleichmäßig über CSS `zoom` (Schrift, Abstände, Bilder), in kleinen Stufen
// und nie unter MIN_DENSITY – der CV bleibt gut lesbar.
//
// Editor und PDF-Druckseite nutzen dieselbe Dichte (gespeichert in
// cv_data._layout.density) und dieselbe Seitenaufteilung → identisches Bild.

import type { CSSProperties, ReactNode } from 'react';
import { PAGE_HEIGHT_PX, type BreakResult } from './breakEngine';

export const MIN_DENSITY = 0.86;
const TEMPLATE_WIDTH_PX = 794;
/** Ab dieser Füllung der letzten Seite (natürliches Layout) wird nichts verdichtet. */
const LAST_PAGE_OK_FILL = 0.4;
/** Kleiner Puffer: das seitenweise Layout füllt Seiten fast vollständig. */
const USABLE_PAGE_RATIO = 0.98;
const STEP = 0.02;

export function clampDensity(value: unknown): number {
  const n = typeof value === 'number' && Number.isFinite(value) ? value : 1;
  return Math.max(MIN_DENSITY, Math.min(1, Math.round(n * 100) / 100));
}

/**
 * Hüllt das Template ein: bei density < 1 wird es breiter gerendert und per
 * `zoom` wieder auf 794 px gebracht – alles wird gleichmäßig kleiner, die
 * Seitenbreite bleibt gleich. `zoom` beeinflusst (anders als transform) das
 * Layout, daher misst die Break-Engine automatisch die verdichteten Höhen.
 */
export function DensityWrapper({ density, children }: { density: number; children: ReactNode }) {
  if (density >= 0.999) return <>{children}</>;
  return (
    <div style={{ zoom: density, width: `${TEMPLATE_WIDTH_PX / density}px` } as CSSProperties}>
      {children}
    </div>
  );
}

/** Mindesthöhe für das Template innerhalb des DensityWrappers (Template-Koordinaten). */
export function templateMinHeight(containerHeightPx: number, density: number): number {
  return Math.ceil(containerHeightPx / (density > 0 ? density : 1));
}

/**
 * Schlägt die Dichte für das aktuelle Layout vor.
 * @param result   Break-Ergebnis, gemessen bei `current`
 * @param current  aktuell angewendete Dichte
 * @returns        neue Dichte (1 = keine Verdichtung) oder `null`, wenn die
 *                 Verdichtung bis MIN_DENSITY keine Seite spart (dann aufgeben)
 */
export function suggestDensity(result: BreakResult, current: number): number | null {
  const visualHeight = result.contentHeight + result.footerHeight;
  if (visualHeight <= 0) return 1;

  // Ohne die Verschiebungen des seitenweisen Layouts schätzen – sonst zählt der
  // Leerraum über verschobenen Karten als Inhalt.
  const rawVisual = (result.rawContentHeight ?? result.contentHeight) + result.footerHeight;
  const naturalHeight = rawVisual / current;
  const usable = PAGE_HEIGHT_PX * USABLE_PAGE_RATIO;
  const isNatural = current >= 0.999;
  // Im unverdichteten Zustand zählt die ECHTE Aufteilung der Umbruch-Engine,
  // sonst eine Schätzung aus der natürlichen Höhe.
  const naturalPages = isNatural ? result.pageCount : Math.max(1, Math.ceil(naturalHeight / usable));
  const lastPageFill = isNatural
    ? (visualHeight - (result.cuts[result.cuts.length - 1] ?? 0)) / PAGE_HEIGHT_PX
    : (naturalHeight - (naturalPages - 1) * usable) / PAGE_HEIGHT_PX;

  // Natürliches Layout ist gut verteilt → nicht verdichten
  if (naturalPages === 1 || lastPageFill >= LAST_PAGE_OK_FILL) return 1;

  const targetPages = naturalPages - 1;

  // Schon verdichtet, aber die Umbruch-Engine braucht noch zu viele Seiten
  // (Stationen werden nicht zerteilt) → eine Stufe weiter verdichten
  if (current < 1 && result.pageCount > targetPages) {
    const next = Math.round((current - STEP) * 100) / 100;
    return next >= MIN_DENSITY ? next : null;
  }
  const needed = Math.floor(((targetPages * usable) / naturalHeight) * 100) / 100;
  if (needed < MIN_DENSITY) return current < 1 ? current : null;

  // Ziel erreicht: Dichte halten – oder lockern, wenn inzwischen weniger nötig ist
  if (current < 1) return needed > current + STEP ? needed : current;
  return needed;
}
