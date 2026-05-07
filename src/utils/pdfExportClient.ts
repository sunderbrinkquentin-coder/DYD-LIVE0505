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

// Minimal freeze: only touches what html2canvas cannot derive itself.
//
// Why so little? The live editor already paints the CV correctly.
// html2canvas reads computed styles from the source DOM and applies them
// to its clone — it does NOT re-resolve Tailwind classes or re-run layout
// when the source root has an explicit pixel width. Touching padding/margin/
// height on intermediate elements breaks flex centering, SVG coordinates,
// and icon baselines — which is what caused the earlier drift.
//
// All we actually need:
//   1. Lock the root at exactly 794px so html2canvas sees A4 width.
//   2. Strip any CSS transform (scale on the mobile wrapper).
//   3. Turn fixed/sticky into relative (html2canvas mis-positions them).
//   4. Force word-wrap behaviour on block elements so long strings break
//      the same way they do on screen (no overflow into neighbour column).

function freezeLiveDom(root: HTMLElement): SavedStyle[] {
  const saved: SavedStyle[] = [];

  // Save + lock the root first
  saved.push({ el: root, originalStyle: root.getAttribute('style') ?? '' });
  const rootCs = window.getComputedStyle(root);
  root.style.setProperty('width', `${A4_WIDTH_PX}px`, 'important');
  root.style.setProperty('min-width', `${A4_WIDTH_PX}px`, 'important');
  root.style.setProperty('max-width', `${A4_WIDTH_PX}px`, 'important');
  root.style.setProperty('transform', 'none', 'important');
  root.style.setProperty('box-shadow', 'none', 'important');
  root.style.setProperty('border-radius', '0', 'important');
  root.style.setProperty('overflow', 'visible', 'important');
  // Pin typographic defaults to the root so every child inherits them in the
  // clone (html2canvas' iframe has no access to our global Tailwind reset).
  root.style.setProperty('font-family', rootCs.fontFamily, 'important');
  root.style.setProperty('font-size', rootCs.fontSize, 'important');
  root.style.setProperty('line-height', rootCs.lineHeight, 'important');
  root.style.setProperty('color', rootCs.color, 'important');

  // Walk descendants and touch ONLY what's absolutely required
  const allEls = Array.from(root.querySelectorAll<HTMLElement>('*'));
  for (const el of allEls) {
    const tagName = el.tagName.toLowerCase();

    // Never touch SVG or any element inside an SVG — html2canvas rasterizes
    // the SVG element via its own code path; any style injection into paths,
    // groups, etc. distorts the internal viewBox.
    if (tagName === 'svg' || el.closest('svg')) continue;

    const cs = window.getComputedStyle(el);
    const transform = cs.transform;
    const pos = cs.position;
    const hasTransform =
      transform && transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)';
    const hasFixed = pos === 'fixed' || pos === 'sticky';

    // Skip unchanged elements entirely — less DOM mutation, fewer regressions
    if (!hasTransform && !hasFixed) continue;

    saved.push({ el, originalStyle: el.getAttribute('style') ?? '' });
    if (hasTransform) el.style.setProperty('transform', 'none', 'important');
    if (hasFixed) el.style.setProperty('position', 'relative', 'important');
  }

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

  const addCandidate = (el: HTMLElement, priority: number) => {
    const r = el.getBoundingClientRect();
    if (r.height <= 4 || r.width <= 4) return;
    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    candidates.push({
      topPx: r.top - rootTop,
      bottomPx: r.bottom - rootTop,
      priority,
    });
  };

  // 1. Highest priority: explicit section markers
  root.querySelectorAll<HTMLElement>('[data-pdf-section]').forEach((el) =>
    addCandidate(el, 200)
  );
  // 2. Semantic sections
  root.querySelectorAll<HTMLElement>('section, article').forEach((el) =>
    addCandidate(el, 150)
  );
  // 3. Headings (break just BEFORE them ideally, we track bottoms so score is ok)
  root.querySelectorAll<HTMLElement>('h1, h2, h3, h4').forEach((el) =>
    addCandidate(el, 110)
  );
  // 4. Cards / experience / education entries — any direct list item
  root.querySelectorAll<HTMLElement>('li').forEach((el) => addCandidate(el, 90));
  // 5. Generic block paragraphs
  root.querySelectorAll<HTMLElement>('p').forEach((el) => addCandidate(el, 60));
  // 6. Divs that look like "rows": direct children of grids or flex columns
  const blocks = root.querySelectorAll<HTMLElement>('div');
  blocks.forEach((el) => {
    // Only shallow rows — not deeply nested wrappers
    const cs = window.getComputedStyle(el);
    const mb = parseFloat(cs.marginBottom) || 0;
    const pb = parseFloat(cs.paddingBottom) || 0;
    if (mb + pb >= 8) addCandidate(el, 50);
  });

  // De-duplicate by (bottomPx rounded to 1px) keeping highest priority
  const byRow = new Map<number, BreakCandidate>();
  for (const c of candidates) {
    const key = Math.round(c.bottomPx);
    const existing = byRow.get(key);
    if (!existing || c.priority > existing.priority) byRow.set(key, c);
  }

  return Array.from(byRow.values()).sort((a, b) => a.topPx - b.topPx);
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
  // Build input/textarea mappings BEFORE removing any clone elements.
  // html2canvas clones verbatim, so input/textarea indices are 1:1 between
  // live and clone at this point (before any DOM mutations).
  const liveInputs = Array.from(liveRoot.querySelectorAll<HTMLInputElement>('input'));
  const liveTextareas = Array.from(liveRoot.querySelectorAll<HTMLTextAreaElement>('textarea'));
  // html2canvas clones the element into the document body — find it via attribute
  // or fall back to the body itself
  const cloneRoot = cloneDoc.querySelector<HTMLElement>('[data-pdf-root]') || cloneDoc.body;
  const cloneInputs = Array.from(cloneRoot.querySelectorAll<HTMLInputElement>('input'));
  const cloneTextareas = Array.from(cloneRoot.querySelectorAll<HTMLTextAreaElement>('textarea'));
  // Kill animations only. Do NOT touch list-style, display, padding, or any
  // visual attribute — the live editor already renders bullets correctly and
  // html2canvas copies the resolved styles when cloning.
  const styleEl = cloneDoc.createElement('style');
  styleEl.textContent = `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      caret-color: transparent !important;
    }
  `;
  (cloneDoc.head || cloneDoc.documentElement).appendChild(styleEl);

  // All templates render bullets as real <span> elements within flex rows.
  // No bullet injection needed — html2canvas draws the existing DOM correctly.

  // Remove editor UI elements
  cloneDoc.querySelectorAll<HTMLElement>(
    'button, [data-pdf-hidden], .pdf-hidden, .print\\:hidden'
  ).forEach((el) => el.remove());

  // Convert <input> → <div> that replicates the EXACT same box the input occupied.
  // Inputs in flex containers participate in alignment (items-center etc).
  // By making the replacement the same height with flex+center, the text stays
  // vertically centered exactly like in the live editor.
  for (let i = 0; i < cloneInputs.length; i++) {
    const input = cloneInputs[i];
    const liveInput = liveInputs[i];
    const val = liveInput?.value || input.value || '';
    if (isPlaceholder(val)) {
      const wrapper = input.closest('li, [data-pdf-field-wrap]');
      (wrapper || input).remove();
      continue;
    }

    const cs = liveInput ? window.getComputedStyle(liveInput) : null;

    const el = cloneDoc.createElement('div');
    el.textContent = val;
    // Replicate the exact same box dimensions and flex behaviour
    el.style.cssText = [
      'display: flex',
      'align-items: center',
      'background: transparent',
      'border: none',
      'outline: none',
      'margin: 0',
      'box-sizing: border-box',
      'overflow: hidden',
      'white-space: nowrap',
      cs ? `font-family: ${cs.fontFamily}` : '',
      cs ? `font-size: ${cs.fontSize}` : '',
      cs ? `font-weight: ${cs.fontWeight}` : '',
      cs ? `line-height: ${cs.lineHeight}` : '',
      cs ? `letter-spacing: ${cs.letterSpacing}` : '',
      cs ? `color: ${cs.color}` : '',
      cs ? `width: ${cs.width}` : '',
      cs ? `height: ${cs.height}` : '',
      cs ? `padding: ${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}` : 'padding: 0',
      cs ? `text-align: ${cs.textAlign}` : '',
    ].filter(Boolean).join('; ');

    input.parentNode?.replaceChild(el, input);
  }

  // Convert <textarea> → <div> replicating dimensions.
  for (let i = 0; i < cloneTextareas.length; i++) {
    const ta = cloneTextareas[i];
    const liveTa = liveTextareas[i];
    const val = liveTa?.value || ta.value || '';
    if (isPlaceholder(val)) {
      const wrapper = ta.closest('li, [data-pdf-field-wrap]');
      (wrapper || ta).remove();
      continue;
    }

    const cs = liveTa ? window.getComputedStyle(liveTa) : null;

    const el = cloneDoc.createElement('div');
    el.textContent = val;
    el.style.cssText = [
      'background: transparent',
      'border: none',
      'outline: none',
      'margin: 0',
      'box-sizing: border-box',
      'overflow: visible',
      'white-space: pre-wrap',
      'word-break: break-word',
      cs ? `font-family: ${cs.fontFamily}` : '',
      cs ? `font-size: ${cs.fontSize}` : '',
      cs ? `font-weight: ${cs.fontWeight}` : '',
      cs ? `line-height: ${cs.lineHeight}` : '',
      cs ? `letter-spacing: ${cs.letterSpacing}` : '',
      cs ? `color: ${cs.color}` : '',
      cs ? `width: ${cs.width}` : '',
      cs ? `min-height: ${cs.height}` : '',
      cs ? `padding: ${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}` : 'padding: 0',
      cs ? `text-align: ${cs.textAlign}` : '',
    ].filter(Boolean).join('; ');

    ta.parentNode?.replaceChild(el, ta);
  }

  // Clean up contentEditable elements in clone:
  // - Remove editing cursor/outline styles
  // - Clear the data-placeholder attr so ::before pseudo-element shows nothing
  // - ONLY hide truly empty elements that serve as optional field placeholders
  cloneDoc.querySelectorAll<HTMLElement>('[contenteditable]').forEach((el) => {
    el.removeAttribute('contenteditable');
    el.style.outline = 'none';
    el.style.cursor = 'default';
    // Neutralize the placeholder ::before by clearing the attr value
    el.setAttribute('data-placeholder', '');
    const text = el.textContent?.trim() ?? '';
    // Only hide if there's genuinely NO user content AND it's a known placeholder
    if (text === '' || PLACEHOLDER_STRINGS.has(text.toLowerCase())) {
      el.textContent = '';
      // Only hide if it's not a structural element (avoid removing flex containers)
      const tag = el.tagName.toLowerCase();
      if (tag === 'span' || tag === 'p') {
        el.style.setProperty('display', 'none', 'important');
      }
    }
  });

  // html2canvas mishandles object-fit — convert img to background-image div
  cloneDoc.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!src) return;
    if (!img.getAttribute('data-pdf-w')) return;
    const w = img.getAttribute('data-pdf-w') || '48px';
    const h = img.getAttribute('data-pdf-h') || '48px';

    const div = cloneDoc.createElement('div');
    div.style.width = w;
    div.style.height = h;
    div.style.minWidth = w;
    div.style.minHeight = h;
    div.style.backgroundImage = `url('${src}')`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center center';
    div.style.backgroundRepeat = 'no-repeat';
    div.style.flexShrink = '0';
    div.style.borderRadius = img.style.borderRadius || '0';
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

  // Measure footer position in live DOM (needed for bottom-of-page placement)
  const footerEl = element.querySelector<HTMLElement>('[data-pdf-footer]');
  let footerTopCssRatio = 1; // ratio of footer top vs total height
  if (footerEl) {
    const fRect = footerEl.getBoundingClientRect();
    const rRect = element.getBoundingClientRect();
    footerTopCssRatio = (fRect.top - rRect.top) / Math.max(1, liveHeightCssPx);
  }

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

  // Compute footer position in canvas pixels using pre-measured ratio
  const hasFooter = footerEl != null && footerTopCssRatio < 0.99;
  const footerStartCanvasPx = hasFooter
    ? Math.round(footerTopCssRatio * canvas.height)
    : canvas.height;
  const footerHeightCanvasPx = canvas.height - footerStartCanvasPx;

  if (hasFooter) {
    console.log('[PDF] Footer: starts at', footerStartCanvasPx, 'height', footerHeightCanvasPx);
  }

  // Helper: render one PDF page from a canvas region, optionally with footer at bottom
  const renderPage = (
    srcOffset: number,
    srcHeight: number,
    addFooter: boolean,
    isFirst: boolean,
  ) => {
    // Determine page canvas height: if adding footer to a short slice, make it full-page
    const pageCanvasH = addFooter
      ? Math.round(pageHeightPx)
      : Math.ceil(srcHeight);

    const pc = document.createElement('canvas');
    pc.width = canvas.width;
    pc.height = pageCanvasH;
    const ctx = pc.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pc.width, pc.height);

    // Draw content
    ctx.drawImage(canvas, 0, srcOffset, canvas.width, srcHeight, 0, 0, canvas.width, srcHeight);

    // Draw footer at bottom of page
    if (addFooter && footerHeightCanvasPx > 0) {
      const footerY = pageCanvasH - footerHeightCanvasPx;
      ctx.drawImage(
        canvas, 0, footerStartCanvasPx, canvas.width, footerHeightCanvasPx,
        0, footerY, canvas.width, footerHeightCanvasPx
      );
    }

    if (!isFirst) pdfDoc.addPage();
    const mmH = addFooter ? A4_HEIGHT_MM : (srcHeight * imgWidthMM) / canvas.width;
    pdfDoc.addImage(
      pc.toDataURL('image/jpeg', quality), 'JPEG',
      0, 0, imgWidthMM, mmH, undefined, 'FAST'
    );
  };

  // Content height = everything except the footer
  const contentH = hasFooter ? footerStartCanvasPx : canvas.height;

  if (contentH + footerHeightCanvasPx <= pageHeightPx * 1.01) {
    // Everything fits on one page
    renderPage(0, contentH, hasFooter, true);
    console.log('[PDF] Single page');
  } else {
    // Multi-page: paginate content, footer goes on last page bottom
    const cssToCanvas = canvas.height / Math.max(1, liveHeightCssPx);
    console.log('[PDF] Multi-page, contentH:', contentH, 'pageH:', Math.round(pageHeightPx));

    let offsetPx = 0;
    let pageNum = 0;
    const slices: number[] = [];

    while (offsetPx < contentH && pageNum < 30) {
      const remaining = contentH - offsetPx;

      // If remaining content + footer fits on one page, take it all
      if (remaining + footerHeightCanvasPx <= pageHeightPx * 1.01) {
        slices.push(remaining);
        offsetPx += remaining;
        pageNum++;
        break;
      }

      // If remaining content fits on one page (no footer needed here)
      if (remaining <= pageHeightPx * 1.01) {
        slices.push(remaining);
        offsetPx += remaining;
        pageNum++;
        break;
      }

      // Find smart break point
      const slicePx = findDomBreakPoint(
        breakCandidates, offsetPx, pageHeightPx, cssToCanvas, contentH
      );

      slices.push(slicePx);
      offsetPx += slicePx;
      pageNum++;
    }

    // Render pages
    let runningOffset = 0;
    for (let p = 0; p < slices.length; p++) {
      const isLast = p === slices.length - 1;
      renderPage(runningOffset, slices[p], isLast && hasFooter, p === 0);
      console.log(`[PDF] Page ${p + 1}: offset=${runningOffset} h=${Math.ceil(slices[p])}${isLast && hasFooter ? ' +footer' : ''}`);
      runningOffset += slices[p];
    }
    console.log('[PDF] Total pages:', slices.length);
  }

  return pdfDoc.output('blob') as Blob;
}

// DOM-aware page-break: find the best gap BETWEEN elements to split at.
// Key rule: NEVER break through the middle of a block. Only break:
//   - At the TOP of an element (that element goes to next page)
//   - At the BOTTOM of an element (that element stays on this page)
// Prefers to fill the page as much as possible without overflowing.
function findDomBreakPoint(
  candidates: BreakCandidate[],
  offsetPx: number,
  pageHeightPx: number,
  cssToCanvas: number,
  contentEnd: number
): number {
  const maxSliceAbs = offsetPx + pageHeightPx; // absolute max row for this page
  const minSliceAbs = offsetPx + pageHeightPx * 0.5; // don't make pages too short

  // Collect all valid break positions (element boundaries within our window)
  interface BreakOption { pos: number; score: number; }
  const options: BreakOption[] = [];

  for (const c of candidates) {
    const topAbs = c.topPx * cssToCanvas;
    const bottomAbs = c.bottomPx * cssToCanvas;

    // Skip elements completely above our minimum
    if (bottomAbs <= minSliceAbs) continue;
    // Stop when elements are fully beyond our maximum
    if (topAbs > maxSliceAbs + 50) break;

    // Option A: break at element TOP (element moves to next page).
    // Only valid if the top is within our breakable zone.
    if (topAbs > minSliceAbs && topAbs <= maxSliceAbs) {
      // Prefer breaks closer to the page bottom (fill the page)
      const fillRatio = (topAbs - offsetPx) / pageHeightPx; // 0..1
      const score = c.priority * 1.5 + fillRatio * 100;
      options.push({ pos: topAbs, score });
    }

    // Option B: break at element BOTTOM (element stays on this page).
    if (bottomAbs > minSliceAbs && bottomAbs <= maxSliceAbs) {
      const fillRatio = (bottomAbs - offsetPx) / pageHeightPx;
      const score = c.priority + fillRatio * 100;
      options.push({ pos: bottomAbs, score });
    }
  }

  if (options.length === 0) {
    // No element boundaries found — fall back to full page height
    return Math.min(contentEnd - offsetPx, pageHeightPx);
  }

  // Pick highest scoring option
  options.sort((a, b) => b.score - a.score);
  const best = options[0].pos;
  const slice = best - offsetPx;
  return Math.max(pageHeightPx * 0.45, Math.min(pageHeightPx, slice));
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
