import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export interface PDFExportOptions {
  filename?: string;
  quality?: number;
  scale?: number;
}

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const A4_WIDTH_PX = 794;

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function toBase64DataUri(src: string): Promise<string> {
  if (!src || src.startsWith('data:')) return src;
  try {
    const resp = await fetch(src, { mode: 'cors', cache: 'no-cache' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const blob = await resp.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn('[PDF] Could not convert image to base64:', src?.substring(0, 80), err);
    return src;
  }
}

const PLACEHOLDER_STRINGS = new Set([
  'position / rolle', 'unternehmen', 'mm/jjjj', 'projekttitel',
  'deine rolle', 'abschluss', 'institution', 'zeitraum',
  'aufgaben und wichtigste erfolge', 'aufgabe / ergebnis', 'beschreibung / aufgaben',
  'kurz aufgaben und erfolge beschreiben', 'schwerpunkte / noten / themen',
  'zielposition / profil', 'vollständiger name', 'dein name', 'berufsbezeichnung',
  'telefon', 'e-mail', 'linkedin', 'niveau', 'sprache',
  'kurzprofil: wichtige erfahrungen, stärken und dein mehrwert für die rolle.',
  'skill', 'stärke', 'mon/jjjj',
]);

function isPlaceholder(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === '' || PLACEHOLDER_STRINGS.has(v);
}

async function waitForFonts(): Promise<void> {
  if ((document as any).fonts) {
    await (document as any).fonts.ready;
    const faces = [
      '400 12px Inter', '500 12px Inter', '600 12px Inter', '700 12px Inter',
      '400 12px Roboto', '700 12px Roboto',
      '400 12px "Open Sans"', '700 12px "Open Sans"',
      '400 12px Georgia', '700 12px Georgia',
    ];
    await Promise.all(faces.map((f) => (document as any).fonts.load(f).catch(() => {})));
    await (document as any).fonts.ready;
  }
  // Two rAF + 300ms to guarantee paint is complete
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(resolve, 300)))
  );
}

// ─── Live-DOM Freeze ──────────────────────────────────────────────────────────
//
// Strategy: Instead of relying on html2canvas's onclone (which re-runs layout
// in a sandboxed iframe and drifts from the live pixels), we:
//   1. Walk every element in the live [data-pdf-root] tree
//   2. Read its exact computed styles and getBoundingClientRect() measurements
//   3. Write those values as hard inline styles BEFORE html2canvas runs
//   4. Restore all original inline styles AFTER html2canvas finishes
//
// This means html2canvas sees the already-painted, already-measured DOM.
// No layout recalculation, no Tailwind-class drift, no column shifts.

interface SavedStyle {
  el: HTMLElement;
  originalStyle: string;
}

// Tags that must keep their NATURAL inline / text-flow behaviour.
// We do NOT override width / display / white-space on these — doing so
// collapses spacing between icons & text or changes line-wrap offsets.
const INLINE_TAGS = new Set([
  'span', 'a', 'strong', 'em', 'b', 'i', 'u', 'small', 'sub', 'sup',
  'mark', 'abbr', 'code', 'kbd',
]);

const SVG_TAGS = new Set([
  'svg', 'path', 'g', 'circle', 'rect', 'line', 'polygon', 'polyline',
  'ellipse', 'text', 'tspan', 'defs', 'use', 'symbol', 'clippath', 'mask',
  'lineargradient', 'radialgradient', 'stop',
]);

function freezeLiveDom(root: HTMLElement): SavedStyle[] {
  const saved: SavedStyle[] = [];
  const allEls = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];

  for (const el of allEls) {
    const tagName = el.tagName.toLowerCase();

    // SVG children: never touch (breaks viewBox coordinate system)
    if (SVG_TAGS.has(tagName) && tagName !== 'svg') continue;

    saved.push({ el, originalStyle: el.getAttribute('style') ?? '' });

    const cs = window.getComputedStyle(el);
    const isInline = INLINE_TAGS.has(tagName);
    const isSvgRoot = tagName === 'svg';
    const display = cs.display;
    const isBlockish =
      display === 'block' || display === 'flex' || display === 'inline-flex' ||
      display === 'grid' || display === 'inline-grid' || display === 'list-item';

    // ── SVG root: freeze its on-screen box but leave innards alone ────────────
    if (isSvgRoot) {
      const r = el.getBoundingClientRect();
      if (r.width > 0) el.style.setProperty('width', `${r.width}px`, 'important');
      if (r.height > 0) el.style.setProperty('height', `${r.height}px`, 'important');
      el.style.setProperty('flex-shrink', '0', 'important');
      el.style.setProperty('display', display || 'inline-block', 'important');
      if (cs.color) el.style.setProperty('color', cs.color, 'important');
      continue;
    }

    // ── Typography on ALL elements (pixel-frozen so text renders identically) ─
    el.style.setProperty('font-size', cs.fontSize, 'important');
    if (cs.fontFamily) el.style.setProperty('font-family', cs.fontFamily, 'important');
    if (cs.fontWeight) el.style.setProperty('font-weight', cs.fontWeight, 'important');
    if (cs.fontStyle && cs.fontStyle !== 'normal') {
      el.style.setProperty('font-style', cs.fontStyle, 'important');
    }
    if (cs.lineHeight && cs.lineHeight !== 'normal') {
      el.style.setProperty('line-height', cs.lineHeight, 'important');
    }
    if (cs.letterSpacing && cs.letterSpacing !== 'normal') {
      el.style.setProperty('letter-spacing', cs.letterSpacing, 'important');
    }
    if (cs.color) el.style.setProperty('color', cs.color, 'important');

    // Bg only where visible (skip transparent to avoid stacking white on white)
    const bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
      el.style.setProperty('background-color', bg, 'important');
    }

    // ── Inline elements: stop here — preserve natural line-flow ──────────────
    // Touching width/margin/display/white-space on inline nodes causes icons
    // and text to drift. The browser already laid them out correctly.
    if (isInline) {
      // Preserve text-decoration for links
      if (cs.textDecorationLine && cs.textDecorationLine !== 'none') {
        el.style.setProperty('text-decoration', cs.textDecoration, 'important');
      }
      continue;
    }

    // ── Block-level: freeze box-model pixel values ───────────────────────────
    if (isBlockish) {
      const r = el.getBoundingClientRect();

      // Width: only freeze on block-level containers so text can still wrap
      if (r.width > 0) {
        el.style.setProperty('width', `${r.width}px`, 'important');
        el.style.setProperty('max-width', `${r.width}px`, 'important');
      }

      // Display: preserve flex / grid / block
      el.style.setProperty('display', display, 'important');

      // Layout context
      if (display === 'flex' || display === 'inline-flex') {
        el.style.setProperty('flex-direction', cs.flexDirection, 'important');
        el.style.setProperty('flex-wrap', cs.flexWrap, 'important');
        el.style.setProperty('align-items', cs.alignItems, 'important');
        el.style.setProperty('justify-content', cs.justifyContent, 'important');
        if (cs.columnGap && cs.columnGap !== 'normal' && cs.columnGap !== '0px') {
          el.style.setProperty('column-gap', cs.columnGap, 'important');
        }
        if (cs.rowGap && cs.rowGap !== 'normal' && cs.rowGap !== '0px') {
          el.style.setProperty('row-gap', cs.rowGap, 'important');
        }
      }

      if (display === 'grid' || display === 'inline-grid') {
        if (cs.gridTemplateColumns && cs.gridTemplateColumns !== 'none') {
          el.style.setProperty('grid-template-columns', cs.gridTemplateColumns, 'important');
        }
        if (cs.gridTemplateRows && cs.gridTemplateRows !== 'none') {
          el.style.setProperty('grid-template-rows', cs.gridTemplateRows, 'important');
        }
        if (cs.columnGap && cs.columnGap !== 'normal') {
          el.style.setProperty('column-gap', cs.columnGap, 'important');
        }
        if (cs.rowGap && cs.rowGap !== 'normal') {
          el.style.setProperty('row-gap', cs.rowGap, 'important');
        }
      }

      // Padding: freeze exact pixels
      el.style.setProperty('padding-top', cs.paddingTop, 'important');
      el.style.setProperty('padding-right', cs.paddingRight, 'important');
      el.style.setProperty('padding-bottom', cs.paddingBottom, 'important');
      el.style.setProperty('padding-left', cs.paddingLeft, 'important');

      // Margin: freeze exact pixels (don't zero out — rows need their spacing)
      el.style.setProperty('margin-top', cs.marginTop, 'important');
      el.style.setProperty('margin-right', cs.marginRight, 'important');
      el.style.setProperty('margin-bottom', cs.marginBottom, 'important');
      el.style.setProperty('margin-left', cs.marginLeft, 'important');

      // Border (freeze so coloured dividers don't drop out)
      if (cs.borderTopWidth && cs.borderTopWidth !== '0px') {
        el.style.setProperty('border-top', `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`, 'important');
      }
      if (cs.borderRightWidth && cs.borderRightWidth !== '0px') {
        el.style.setProperty('border-right', `${cs.borderRightWidth} ${cs.borderRightStyle} ${cs.borderRightColor}`, 'important');
      }
      if (cs.borderBottomWidth && cs.borderBottomWidth !== '0px') {
        el.style.setProperty('border-bottom', `${cs.borderBottomWidth} ${cs.borderBottomStyle} ${cs.borderBottomColor}`, 'important');
      }
      if (cs.borderLeftWidth && cs.borderLeftWidth !== '0px') {
        el.style.setProperty('border-left', `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${cs.borderLeftColor}`, 'important');
      }
      if (cs.borderRadius && cs.borderRadius !== '0px') {
        el.style.setProperty('border-radius', cs.borderRadius, 'important');
      }

      // List bullets: convert CSS marker into a real span so html2canvas draws it
      if (display === 'list-item') {
        const markerContent = cs.getPropertyValue('--marker-char') || '•';
        el.style.setProperty('list-style-position', 'outside', 'important');
        el.style.setProperty('padding-left', `${Math.max(parseFloat(cs.paddingLeft) || 0, 16)}px`, 'important');
      }
    }

    // ── Strip transforms globally (scale/translate distort html2canvas coords)
    const transform = cs.transform;
    if (transform && transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)') {
      el.style.setProperty('transform', 'none', 'important');
    }

    // ── Positioning: fixed/sticky break html2canvas — pin as relative ────────
    const pos = cs.position;
    if (pos === 'fixed' || pos === 'sticky') {
      el.style.setProperty('position', 'relative', 'important');
    }

    // ── Overflow: visible on every block (prevents mysterious clipping) ──────
    const hasRoundedBorder = cs.borderRadius && cs.borderRadius !== '0px';
    if (!hasRoundedBorder && tagName !== 'img') {
      el.style.setProperty('overflow', 'visible', 'important');
    }
  }

  // Root: lock to exactly 794px A4 width
  root.style.setProperty('width', `${A4_WIDTH_PX}px`, 'important');
  root.style.setProperty('min-width', `${A4_WIDTH_PX}px`, 'important');
  root.style.setProperty('max-width', `${A4_WIDTH_PX}px`, 'important');
  root.style.setProperty('transform', 'none', 'important');
  root.style.setProperty('margin', '0', 'important');
  root.style.setProperty('box-shadow', 'none', 'important');
  root.style.setProperty('border-radius', '0', 'important');
  root.style.setProperty('overflow', 'visible', 'important');

  return saved;
}

// Find all top-level "block" candidates where a page can safely break.
// Strategy: walk depth-first inside the root, collect elements whose vertical
// position represents a section/card boundary (sections, list items, rows).
interface BreakCandidate {
  topPx: number;       // absolute top within root's coordinate space
  bottomPx: number;    // absolute bottom
  priority: number;    // higher = better break point
}

function collectBreakCandidates(root: HTMLElement): BreakCandidate[] {
  const rootTop = root.getBoundingClientRect().top;
  const candidates: BreakCandidate[] = [];

  // Walk every block-level direct child and descendant, capture rows
  const all = Array.from(root.querySelectorAll<HTMLElement>('*'));
  for (const el of all) {
    const cs = window.getComputedStyle(el);
    const display = cs.display;
    if (display === 'inline' || display === 'none') continue;
    if (cs.visibility === 'hidden') continue;

    const r = el.getBoundingClientRect();
    if (r.height <= 0 || r.width <= 0) continue;
    if (r.height > 500) continue; // container too tall to be a sensible breakpoint

    // Explicit "don't break inside" hint
    const hint = el.getAttribute('data-pdf-keep-together');
    if (hint === 'true') continue;

    // Prefer breaks at boundaries of: sections, articles, list items, grid/flex children
    let priority = 0;
    const tag = el.tagName.toLowerCase();
    if (tag === 'section' || tag === 'article' || tag === 'header' || tag === 'footer') priority = 100;
    else if (tag === 'h1' || tag === 'h2' || tag === 'h3') priority = 90;
    else if (tag === 'li') priority = 70;
    else if (tag === 'p' || tag === 'div') priority = 40;

    // Boost for elements with visible top spacing (usually section separators)
    const mt = parseFloat(cs.marginTop) || 0;
    const pt = parseFloat(cs.paddingTop) || 0;
    if (mt + pt >= 8) priority += 15;

    candidates.push({
      topPx: r.top - rootTop,
      bottomPx: r.bottom - rootTop,
      priority,
    });
  }

  return candidates.sort((a, b) => a.topPx - b.topPx);
}

function restoreLiveDom(saved: SavedStyle[]): void {
  for (const { el, originalStyle } of saved) {
    if (originalStyle) {
      el.setAttribute('style', originalStyle);
    } else {
      el.removeAttribute('style');
    }
  }
}

// ─── onclone: minimal cleanup only (no layout changes) ───────────────────────
//
// Since the live DOM is already frozen, onclone only needs to:
//  - Convert <input>/<textarea> values to visible <span>/<div> text
//  - Remove editor-only UI (buttons, toolbars)
//  - Convert <img> with object-fit to background-image (html2canvas bug fix)

function cleanCloneForCapture(cloneDoc: Document, liveRoot: HTMLElement): void {
  // Kill animations + ensure markers render inside the text box
  const styleEl = cloneDoc.createElement('style');
  styleEl.textContent = `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    /* html2canvas draws ::marker poorly — we'll inject real bullets below */
    ul, ol { list-style: none !important; padding-left: 0 !important; }
    li { list-style: none !important; }
    svg { overflow: visible !important; }
  `;
  (cloneDoc.head || cloneDoc.documentElement).appendChild(styleEl);

  // Replace list markers with real <span> prefixes (html2canvas can draw these)
  cloneDoc.querySelectorAll<HTMLLIElement>('li').forEach((li) => {
    // Only add a bullet to items inside a <ul> (not <ol> or other lists)
    const parent = li.parentElement;
    if (!parent || parent.tagName.toLowerCase() !== 'ul') return;
    if (li.getAttribute('data-bullet-added') === '1') return;

    const bullet = cloneDoc.createElement('span');
    bullet.textContent = '•  ';
    bullet.style.display = 'inline-block';
    bullet.style.marginRight = '6px';
    bullet.style.fontWeight = 'normal';
    bullet.setAttribute('aria-hidden', 'true');
    li.insertBefore(bullet, li.firstChild);
    li.setAttribute('data-bullet-added', '1');
    li.style.setProperty('display', 'flex', 'important');
    li.style.setProperty('align-items', 'baseline', 'important');
  });

  // Remove editor UI
  cloneDoc.querySelectorAll<HTMLElement>(
    'button, [data-pdf-hidden], .pdf-hidden, .print\\:hidden'
  ).forEach((el) => el.remove());

  // Convert <input> → <span>
  cloneDoc.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
    const val = input.value || '';
    if (isPlaceholder(val)) {
      (input.closest('li, [data-pdf-field-wrap]') || input).remove();
      return;
    }
    const span = cloneDoc.createElement('span');
    span.textContent = val;
    // Copy frozen inline style from the live element (already set in freezeLiveDom)
    span.style.cssText = input.style.cssText;
    span.style.display = 'inline';
    span.style.background = 'transparent';
    span.style.border = 'none';
    input.parentNode?.replaceChild(span, input);
  });

  // Convert <textarea> → <div>
  cloneDoc.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((ta) => {
    const val = ta.value || '';
    if (isPlaceholder(val)) {
      (ta.closest('li, [data-pdf-field-wrap]') || ta).remove();
      return;
    }
    const div = cloneDoc.createElement('div');
    div.textContent = val;
    div.style.cssText = ta.style.cssText;
    div.style.overflow = 'visible';
    div.style.height = 'auto';
    div.style.whiteSpace = 'pre-wrap';
    ta.parentNode?.replaceChild(div, ta);
  });

  // Strip contentEditable placeholders
  cloneDoc.querySelectorAll<HTMLElement>('[contenteditable]').forEach((el) => {
    el.removeAttribute('contenteditable');
    el.removeAttribute('data-placeholder');
    el.style.outline = 'none';
    el.style.cursor = 'default';
    const text = el.textContent?.trim() ?? '';
    if (isPlaceholder(text)) {
      el.style.setProperty('display', 'none', 'important');
      el.textContent = '';
    }
  });

  // Convert <img> with object-fit:cover to background-image div
  // html2canvas mishandles object-fit, background-size:cover is reliable
  cloneDoc.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!src) return;
    const cs = img.style; // already frozen in freezeLiveDom
    if (!img.getAttribute('data-pdf-w')) return;

    const div = cloneDoc.createElement('div');
    div.style.cssText = img.style.cssText;
    div.style.backgroundImage = `url('${src}')`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center center';
    div.style.backgroundRepeat = 'no-repeat';
    div.style.flexShrink = '0';
    img.parentNode?.replaceChild(div, img);
  });
}

// ─── Core render function ─────────────────────────────────────────────────────

async function renderElementToPDFBlob(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const { quality = 0.95, scale = 2 } = options;

  // 1. Wait for all fonts to be loaded and painted
  await waitForFonts();

  // 2. Pre-fetch images as base64 & stamp dimensions onto live elements
  //    (must happen before freezeLiveDom so rects are correct)
  const liveImages = Array.from(element.querySelectorAll<HTMLImageElement>('img'));
  await Promise.all(
    liveImages.map(async (img) => {
      const originalSrc = img.getAttribute('src') || '';
      if (!originalSrc || originalSrc.startsWith('data:')) return;
      const b64 = await toBase64DataUri(originalSrc);
      img.setAttribute('src', b64);
      img.setAttribute('data-original-src', originalSrc);
    })
  );

  // Wait for replaced base64 images to load
  await Promise.all(
    liveImages.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
      });
    })
  );

  // Stamp dimensions for cleanCloneForCapture's img→div conversion
  liveImages.forEach((img) => {
    const cs = window.getComputedStyle(img);
    img.setAttribute('data-pdf-w', cs.width || `${img.offsetWidth}px`);
    img.setAttribute('data-pdf-h', cs.height || `${img.offsetHeight}px`);
    img.setAttribute('data-pdf-fit', cs.objectFit || 'cover');
  });

  // One more rAF after image load to ensure layout is stable
  await new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(resolve))
  );

  window.scrollTo(0, 0);

  // 3a. Collect DOM-level page-break candidates BEFORE freezing. Rects are
  //     captured in the live, on-screen coordinate space (in CSS pixels).
  const breakCandidates = collectBreakCandidates(element);
  const liveHeightCssPx = element.getBoundingClientRect().height;

  // 3b. FREEZE: stamp all computed styles onto the live DOM as inline values.
  //     html2canvas now sees the already-resolved, already-painted values.
  const savedStyles = freezeLiveDom(element);

  // One more rAF after freeze so the browser paints the frozen state
  await new Promise<void>((resolve) => requestAnimationFrame(resolve));

  console.log('[PDF] Capturing element:', element.scrollWidth, 'x', element.scrollHeight);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await (html2canvas as any)(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
      removeContainer: true,
      // Tell html2canvas the viewport is exactly 794px — matches our frozen root
      windowWidth: A4_WIDTH_PX,
      width: A4_WIDTH_PX,
      height: element.scrollHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (cloneDoc: Document) => {
        cleanCloneForCapture(cloneDoc, element);
      },
    });
  } finally {
    // 4. RESTORE: put the live DOM back exactly as it was
    restoreLiveDom(savedStyles);
    liveImages.forEach((img) => {
      const orig = img.getAttribute('data-original-src');
      if (orig) { img.setAttribute('src', orig); img.removeAttribute('data-original-src'); }
      img.removeAttribute('data-pdf-w');
      img.removeAttribute('data-pdf-h');
      img.removeAttribute('data-pdf-fit');
    });
  }

  console.log('[PDF] Canvas:', canvas.width, 'x', canvas.height);

  // 5. Slice canvas into A4 pages
  const imgWidthMM = A4_WIDTH_MM;
  const imgHeightMM = (canvas.height * imgWidthMM) / canvas.width;
  const pageHeightPx = (A4_HEIGHT_MM * canvas.height) / imgHeightMM;

  const pdfDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  if (imgHeightMM <= A4_HEIGHT_MM) {
    pdfDoc.addImage(
      canvas.toDataURL('image/jpeg', quality), 'JPEG',
      0, 0, imgWidthMM, imgHeightMM, undefined, 'FAST'
    );
    console.log('[PDF] Single page');
  } else {
    // Multi-page with DOM-aware break detection.
    // We map CSS pixel rects (from the live DOM) into canvas pixel rows using
    // the scale ratio: canvas.height / liveHeightCssPx.
    const cssToCanvas = canvas.height / Math.max(1, liveHeightCssPx);
    console.log('[PDF] Multi-page, canvas height:', canvas.height, 'cssToCanvas:', cssToCanvas);

    let offsetPx = 0;
    let pageNum = 0;

    while (offsetPx < canvas.height && pageNum < 30) {
      const remaining = canvas.height - offsetPx;
      const slicePx =
        remaining <= pageHeightPx * 1.02
          ? remaining
          : findDomBreakPoint(
              breakCandidates,
              offsetPx,
              pageHeightPx,
              cssToCanvas,
              canvas.height
            );

      const pc = document.createElement('canvas');
      pc.width = canvas.width;
      pc.height = Math.ceil(slicePx);
      const ctx = pc.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pc.width, pc.height);
      ctx.drawImage(canvas, 0, offsetPx, canvas.width, slicePx, 0, 0, canvas.width, slicePx);

      if (pageNum > 0) pdfDoc.addPage();
      pdfDoc.addImage(
        pc.toDataURL('image/jpeg', quality), 'JPEG',
        0, 0, imgWidthMM, (slicePx * imgWidthMM) / canvas.width, undefined, 'FAST'
      );

      console.log(`[PDF] Page ${pageNum + 1}: offset=${offsetPx}px slice=${Math.ceil(slicePx)}px`);
      offsetPx += slicePx;
      pageNum++;
    }

    console.log('[PDF] Total pages:', pageNum);
  }

  return pdfDoc.output('blob') as Blob;
}

// DOM-aware page-break: finds the best element boundary in the DOM whose
// bottom falls just before the ideal page height, avoiding cutting cards/rows.
function findDomBreakPoint(
  candidates: BreakCandidate[],
  offsetPx: number,
  pageHeightPx: number,
  cssToCanvas: number,
  canvasHeight: number
): number {
  const ideal = Math.floor(pageHeightPx);
  const idealAbs = offsetPx + ideal; // absolute canvas row we aim to break at
  const minSlice = Math.floor(pageHeightPx * 0.6); // never make a page < 60%
  const maxSlice = Math.floor(pageHeightPx * 1.0); // never overflow the page
  const minAbs = offsetPx + minSlice;
  const maxAbs = offsetPx + maxSlice;

  // Score every candidate: prefer the one whose BOTTOM is closest to, but
  // does not exceed, the ideal canvas row.
  let best = -1;
  let bestScore = -Infinity;

  for (const c of candidates) {
    const bottomAbs = c.bottomPx * cssToCanvas;
    if (bottomAbs <= minAbs) continue; // too early — would make a tiny page
    if (bottomAbs > maxAbs) break;     // past the page — we're done scanning

    // Distance from ideal (negative = below ideal, positive = above ideal).
    // Prefer breaks that are just before the ideal row.
    const delta = idealAbs - bottomAbs;
    // Score: priority minus distance penalty. Small distances score highest.
    const score = c.priority - Math.abs(delta) * 0.05;

    if (score > bestScore) {
      bestScore = score;
      best = bottomAbs;
    }
  }

  // Fallback: if no element fits, take a soft break at the ideal row.
  if (best < 0) {
    best = Math.min(canvasHeight, idealAbs);
  }

  const slice = Math.max(minSlice, Math.min(maxSlice, best - offsetPx));
  return slice;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const { filename = `CV_${new Date().toISOString().split('T')[0]}.pdf` } = options;
  const blob = await renderElementToPDFBlob(element, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function exportCVToPDF(
  cvRef: React.RefObject<HTMLElement>,
  personalInfo?: { name?: string },
  options?: PDFExportOptions
): Promise<void> {
  if (!cvRef.current) throw new Error('CV-Element nicht gefunden');
  const name = personalInfo?.name || 'CV';
  const safe = name
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  await exportElementToPDF(cvRef.current, {
    ...options,
    filename: `Lebenslauf_${safe}_${new Date().toISOString().split('T')[0]}.pdf`,
  });
}

export async function exportCVToPDFBlob(
  cvRef: React.RefObject<HTMLElement>,
  personalInfo?: { name?: string },
  options?: PDFExportOptions
): Promise<Blob> {
  if (!cvRef.current) throw new Error('CV-Element nicht gefunden');
  console.log('[PDF] Generating blob for:', personalInfo?.name);
  return renderElementToPDFBlob(cvRef.current, options);
}

export function debugLogPDFHtml(
  cvRef: React.RefObject<HTMLElement> | HTMLElement | null
): void {
  const el = cvRef instanceof HTMLElement ? cvRef : cvRef?.current;
  if (!el) { console.warn('[PDF Debug] No element found.'); return; }
  console.log('[PDF Debug] Dimensions:', el.offsetWidth, 'x', el.offsetHeight, 'scrollH:', el.scrollHeight);
  const rect = el.getBoundingClientRect();
  console.log('[PDF Debug] BoundingRect:', JSON.stringify(rect));
  console.log('[PDF Debug] Children:', el.children.length);
}
