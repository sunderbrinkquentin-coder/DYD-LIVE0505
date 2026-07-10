// src/components/cv-templates/useBreakPoints.ts

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import {
  computeBreakPoints,
  containerHeightFor,
  PAGE_HEIGHT_PX,
  type BreakOptions,
  type BreakResult,
} from './breakEngine';

const INITIAL: BreakResult = {
  cuts: [0],
  contentHeight: PAGE_HEIGHT_PX,
  pageCount: 1,
};

/**
 * Zwei Ergebnisse gelten als gleich, wenn sie sich um höchstens einen Pixel
 * unterscheiden. Ohne diese Toleranz löst Sub-Pixel-Rundung eine Endlosschleife
 * aus: setState → Re-Render → ResizeObserver → Messung → setState → …
 */
function isSame(a: BreakResult, b: BreakResult): boolean {
  if (a.pageCount !== b.pageCount) return false;
  if (Math.abs(a.contentHeight - b.contentHeight) > 1) return false;
  for (let i = 0; i < a.cuts.length; i++) {
    if (Math.abs(a.cuts[i] - b.cuts[i]) > 1) return false;
  }
  return true;
}

export interface UseBreakPointsResult extends BreakResult {
  /** Höhe, die der Template-Container bekommen muss (Footer am Fuß der letzten Seite). */
  containerHeight: number;
  /** true, bis die erste Messung nach dem Laden der Schriften durch ist. */
  isMeasuring: boolean;
}

/**
 * Misst das übergebene Layout und liefert die Seitenumbrüche.
 *
 * Gemessen wird immer der VERSTECKTE, unskalierte 794px-Render (`data-pdf-root`),
 * niemals die sichtbaren A4-Frames. Die sind per `transform: scale()` verzerrt
 * und würden Rundungsfehler in die Rechnung tragen.
 *
 * Der PDF-Exporter ruft `computeBreakPoints` später auf demselben Layout auf und
 * bekommt dieselben Zahlen. Das ist der ganze Trick: Preview und Export teilen
 * nicht nur den Algorithmus, sondern auch das gemessene DOM.
 *
 * @param rootRef  Ref auf das `data-pdf-root`-Element
 * @param deps     Alles, was den Inhalt ändert (editorData, selectedTemplate, photoUrl …)
 */
export function useBreakPoints(
  rootRef: RefObject<HTMLElement | null>,
  deps: unknown[],
  options: BreakOptions = {}
): UseBreakPointsResult {
  const [result, setResult] = useState<BreakResult>(INITIAL);
  const [isMeasuring, setIsMeasuring] = useState(true);

  // Der aktuelle Wert wird im Ref mitgeführt, damit der Effect ihn lesen kann,
  // ohne ihn als Dependency zu führen (was ihn bei jeder Messung neu starten würde).
  const resultRef = useRef(result);
  resultRef.current = result;

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    let cancelled = false;
    let rafId = 0;

    const measure = () => {
      if (cancelled) return;
      const root = rootRef.current;
      if (!root || root.scrollHeight < 50) return;

      const next = computeBreakPoints(root, optionsRef.current);
      if (!isSame(resultRef.current, next)) {
        setResult(next);
      }
      setIsMeasuring(false);
    };

    // Zwei Frames warten: der erste lässt React committen, der zweite lässt den
    // Browser das Layout auflösen. Eine einzelne rAF reicht nicht — dann misst
    // man gelegentlich noch die Höhen des vorherigen Renders.
    const schedule = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = requestAnimationFrame(measure);
      });
    };

    // Schriften müssen geladen sein, sonst misst man Fallback-Zeilenhöhen.
    const fonts = (document as unknown as { fonts?: FontFaceSet }).fonts;
    if (fonts?.ready) {
      fonts.ready.then(() => {
        if (!cancelled) schedule();
      });
    }
    schedule();

    // Bilder (Profilfoto) ändern die Höhe nachträglich.
    const root = rootRef.current;
    const images = root ? Array.from(root.querySelectorAll('img')) : [];
    const onImgLoad = () => schedule();
    images.forEach((img) => {
      if (!img.complete) {
        img.addEventListener('load', onImgLoad);
        img.addEventListener('error', onImgLoad);
      }
    });

    // Jede Layoutänderung im Inhalt (Tippen, Bullet hinzufügen) neu messen.
    let observer: ResizeObserver | null = null;
    if (root) {
      observer = new ResizeObserver(schedule);
      observer.observe(root);
      for (const child of Array.from(root.children)) {
        if (child instanceof HTMLElement) observer.observe(child);
      }
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      images.forEach((img) => {
        img.removeEventListener('load', onImgLoad);
        img.removeEventListener('error', onImgLoad);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return {
    ...result,
    containerHeight: containerHeightFor(result, optionsRef.current.pageHeight),
    isMeasuring,
  };
}