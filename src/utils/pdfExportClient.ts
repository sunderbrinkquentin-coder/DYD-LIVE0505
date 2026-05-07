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

function freezeLiveDom(root: HTMLElement): SavedStyle[] {
  const saved: SavedStyle[] = [];
  const rootRect = root.getBoundingClientRect();
  const allEls = [root, ...Array.from(root.querySelectorAll<HTMLElement>('*'))];

  for (const el of allEls) {
    // Save the original inline style so we can restore it later
    saved.push({ el, originalStyle: el.getAttribute('style') ?? '' });

    const rect = el.getBoundingClientRect();
    const cs = window.getComputedStyle(el);

    // ── Width & Height: absolute pixel values from getBoundingClientRect ────
    // These are the exact rendered dimensions - no Tailwind re-calc needed
    const w = rect.width;
    const h = rect.height;

    el.style.setProperty('width', `${w}px`, 'important');
    el.style.setProperty('min-width', `${w}px`, 'important');
    el.style.setProperty('max-width', `${w}px`, 'important');

    // Only freeze height for non-auto elements (text containers must stay auto
    // so text wraps correctly at the frozen width)
    const tagName = el.tagName.toLowerCase();
    const isTextContainer =
      tagName === 'p' || tagName === 'span' || tagName === 'li' ||
      tagName === 'a' || tagName === 'strong' || tagName === 'em' ||
      tagName === 'b' || tagName === 'i';

    if (!isTextContainer && h > 0) {
      el.style.setProperty('height', `${h}px`, 'important');
      el.style.setProperty('min-height', `${h}px`, 'important');
    }

    // ── Position: keep flow layout (NOT absolute) but strip transforms ───────
    // We preserve the normal document flow so text nodes wrap correctly.
    // Only strip scale/translate transforms that would distort coordinates.
    const transform = cs.transform;
    if (transform && transform !== 'none' && transform !== 'matrix(1, 0, 0, 1, 0, 0)') {
      el.style.setProperty('transform', 'none', 'important');
    }

    // ── Box model: freeze padding (already included in rect, but keep for text) ─
    el.style.setProperty('padding-top', cs.paddingTop, 'important');
    el.style.setProperty('padding-right', cs.paddingRight, 'important');
    el.style.setProperty('padding-bottom', cs.paddingBottom, 'important');
    el.style.setProperty('padding-left', cs.paddingLeft, 'important');
    // Zero margin on non-root elements - rect already captures their position
    if (el !== root) {
      el.style.setProperty('margin', '0', 'important');
    }

    // ── Typography: freeze exact pixel values ────────────────────────────────
    el.style.setProperty('font-size', cs.fontSize, 'important');
    el.style.setProperty('font-family', cs.fontFamily, 'important');
    el.style.setProperty('font-weight', cs.fontWeight, 'important');
    if (cs.lineHeight !== 'normal') {
      el.style.setProperty('line-height', cs.lineHeight, 'important');
    }
    if (cs.letterSpacing !== 'normal') {
      el.style.setProperty('letter-spacing', cs.letterSpacing, 'important');
    }
    // Anti-fragmentation: keep words intact as seen in editor
    el.style.setProperty('word-break', 'keep-all', 'important');
    el.style.setProperty('overflow-wrap', 'normal', 'important');
    el.style.setProperty('white-space', 'pre-wrap', 'important');

    // ── Colors ───────────────────────────────────────────────────────────────
    el.style.setProperty('color', cs.color, 'important');
    const bg = cs.backgroundColor;
    if (bg && bg !== 'rgba(0, 0, 0, 0)') {
      el.style.setProperty('background-color', bg, 'important');
    }

    // ── Display / Layout context ─────────────────────────────────────────────
    const display = cs.display;
    el.style.setProperty('display', display, 'important');

    if (display === 'flex' || display === 'inline-flex') {
      el.style.setProperty('flex-direction', cs.flexDirection, 'important');
      el.style.setProperty('flex-wrap', cs.flexWrap, 'important');
      el.style.setProperty('align-items', cs.alignItems, 'important');
      el.style.setProperty('justify-content', cs.justifyContent, 'important');
      // Freeze gap as resolved pixel values
      if (cs.columnGap && cs.columnGap !== 'normal') {
        el.style.setProperty('column-gap', cs.columnGap, 'important');
      }
      if (cs.rowGap && cs.rowGap !== 'normal') {
        el.style.setProperty('row-gap', cs.rowGap, 'important');
      }
    }

    if (display === 'grid') {
      // gridTemplateColumns is already resolved to px by the browser
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

    // ── Overflow: must be visible so nothing is clipped ──────────────────────
    const hasRoundedBorder = cs.borderRadius && cs.borderRadius !== '0px';
    const isImgContainer =
      tagName === 'img' || el.style.backgroundImage !== '';
    if (!hasRoundedBorder && !isImgContainer) {
      el.style.setProperty('overflow', 'visible', 'important');
    }

    // ── Border radius ─────────────────────────────────────────────────────────
    if (cs.borderRadius && cs.borderRadius !== '0px') {
      el.style.setProperty('border-radius', cs.borderRadius, 'important');
    }

    // ── Positioning: un-freeze fixed/sticky so they don't float over content ─
    const pos = cs.position;
    if (pos === 'fixed' || pos === 'sticky') {
      el.style.setProperty('position', 'relative', 'important');
    }
  }

  // Root itself: ensure exactly 794px and no box-shadow/border-radius distortion
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
  // Kill animations
  const styleEl = cloneDoc.createElement('style');
  styleEl.textContent = `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
  `;
  (cloneDoc.head || cloneDoc.documentElement).appendChild(styleEl);

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

  // 3. FREEZE: stamp all computed styles onto the live DOM as inline values
  //    This is the core of the "hard pixel freeze" — html2canvas now sees
  //    the already-resolved, already-painted values with no re-layout needed.
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
    // Single page
    pdfDoc.addImage(
      canvas.toDataURL('image/jpeg', quality), 'JPEG',
      0, 0, imgWidthMM, imgHeightMM, undefined, 'FAST'
    );
    console.log('[PDF] Single page');
  } else {
    // Multi-page with smart break detection
    console.log('[PDF] Multi-page, total height:', canvas.height, 'px');
    let offsetPx = 0;
    let pageNum = 0;

    while (offsetPx < canvas.height && pageNum < 20) {
      const remaining = canvas.height - offsetPx;
      const slicePx = remaining <= pageHeightPx * 1.1
        ? remaining
        : findBreakPoint(canvas, offsetPx, pageHeightPx);

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

// Find the best pixel row to break a page (avoids cutting through text/images)
function findBreakPoint(canvas: HTMLCanvasElement, offsetPx: number, pageHeightPx: number): number {
  const ideal = Math.floor(pageHeightPx);
  const winPx = Math.floor(canvas.height * 0.06);
  const ctx = canvas.getContext('2d');
  if (!ctx) return ideal;

  const scanStart = Math.max(0, offsetPx + ideal - winPx);
  const scanEnd = Math.min(canvas.height - 1, offsetPx + ideal + winPx);
  const scanH = scanEnd - scanStart + 1;
  if (scanH <= 0) return ideal;

  const data = ctx.getImageData(0, scanStart, canvas.width, scanH);
  const stride = Math.max(1, Math.floor(canvas.width / 80));

  let best = offsetPx + ideal;
  let bestScore = -1;

  for (let row = 0; row < scanH; row++) {
    const off = row * canvas.width * 4;
    let lightPx = 0, total = 0;
    for (let x = 0; x < canvas.width; x += stride) {
      const i = off + x * 4;
      const lum = 0.299 * data.data[i] + 0.587 * data.data[i + 1] + 0.114 * data.data[i + 2];
      if (lum > 220) lightPx++;
      total++;
    }
    const score = total > 0 ? lightPx / total : 0;
    const distance = Math.abs(row - winPx);
    const adjusted = score - (distance > 40 ? 0.03 : 0);
    if (adjusted > bestScore) {
      bestScore = adjusted;
      best = scanStart + row;
    }
  }

  const absoluteRow = best;
  const relativeRow = absoluteRow - offsetPx;
  return Math.max(Math.floor(pageHeightPx * 0.7), relativeRow);
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
