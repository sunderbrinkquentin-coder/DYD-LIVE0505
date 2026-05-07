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
  // Pair every clone element with its live counterpart (index-based walk).
  // The clone has the exact same tree shape because html2canvas clones it verbatim.
  const cloneRoot = cloneDoc.querySelector<HTMLElement>('[data-pdf-root]');
  const liveAll = [liveRoot, ...Array.from(liveRoot.querySelectorAll<HTMLElement>('*'))];
  const cloneAll = cloneRoot
    ? [cloneRoot, ...Array.from(cloneRoot.querySelectorAll<HTMLElement>('*'))]
    : [];
  const liveByClone = new Map<HTMLElement, HTMLElement>();
  for (let i = 0; i < cloneAll.length; i++) {
    if (liveAll[i]) liveByClone.set(cloneAll[i], liveAll[i]);
  }
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

  // html2canvas cannot draw ::marker pseudo-elements. For <ul class="list-disc">
  // templates we inject a real <span>• </span> once per <li> IN THE CLONE ONLY,
  // and strip the CSS marker to avoid doubling.
  cloneDoc.querySelectorAll<HTMLLIElement>('li').forEach((li) => {
    const live = liveByClone.get(li);
    if (!live) return;
    const liveCs = window.getComputedStyle(live);
    const listStyleType = liveCs.listStyleType;
    const display = liveCs.display;

    // Only inject a bullet where the live element actually RENDERS one
    // (ul with list-disc / list-item w/ disc,circle,square).
    const hasBullet =
      display === 'list-item' &&
      (listStyleType === 'disc' || listStyleType === 'circle' ||
       listStyleType === 'square');

    if (!hasBullet) return;

    const bullet = cloneDoc.createElement('span');
    bullet.textContent = '•';
    bullet.setAttribute('aria-hidden', 'true');
    bullet.style.cssText =
      'display:inline-block;min-width:1em;margin-right:4px;flex-shrink:0;line-height:inherit;';
    li.insertBefore(bullet, li.firstChild);
    // Swap list-item for flex so the bullet aligns with the first text line.
    // This is the ONLY layout change — padding/margin stay untouched.
    li.style.setProperty('list-style', 'none', 'important');
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
