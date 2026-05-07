/**
 * PDF Export — definitive implementation
 *
 * Strategy: snapshot-based rendering
 *  1. Measure all element rects in the live DOM while it's fully painted
 *  2. Build a flat list of absolutely-positioned div/span/text nodes that
 *     replicate EXACTLY what's on screen — no layout re-calculation needed
 *  3. Render that snapshot with html2canvas
 *  4. Slice into A4 pages, placing the footer at the bottom of the last page
 */
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

const PLACEHOLDERS = new Set([
  'position / rolle', 'unternehmen', 'mm/jjjj', 'projekttitel',
  'deine rolle', 'abschluss', 'institution', 'zeitraum',
  'aufgaben und wichtigste erfolge', 'aufgabe / ergebnis', 'beschreibung / aufgaben',
  'kurz aufgaben und erfolge beschreiben', 'schwerpunkte / noten / themen',
  'zielposition / profil', 'vollständiger name', 'dein name', 'berufsbezeichnung',
  'telefon', 'e-mail', 'linkedin', 'niveau', 'sprache',
  'kurzprofil: wichtige erfahrungen, stärken und dein mehrwert für die rolle.',
  'skill', 'stärke', 'mon/jjjj',
]);

function isPlaceholder(v: string): boolean {
  return v.trim() === '' || PLACEHOLDERS.has(v.trim().toLowerCase());
}

async function waitForFonts(): Promise<void> {
  if ((document as any).fonts) {
    await (document as any).fonts.ready;
    await Promise.all([
      '400 12px Inter', '500 12px Inter', '600 12px Inter', '700 12px Inter',
      '400 12px Roboto', '700 12px Roboto',
    ].map(f => (document as any).fonts.load(f).catch(() => {})));
    await (document as any).fonts.ready;
  }
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200))));
}

async function toBase64(src: string): Promise<string> {
  if (!src || src.startsWith('data:') || src.startsWith('blob:')) return src;
  try {
    const r = await fetch(src, { mode: 'cors', cache: 'no-cache' });
    if (!r.ok) return src;
    const b = await r.blob();
    return await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(b);
    });
  } catch { return src; }
}

// ─── Core: clone the live DOM and bake computed styles ───────────────────────
// We walk the live DOM and the clone simultaneously, copying every computed
// style as an inline style. This makes the clone CSS-class independent.
// Key insight: we do NOT bake width/height/minHeight on elements whose size
// is determined by their content (overflow: visible, height: auto), because
// those elements need to re-flow correctly in the off-screen container.

const CONTENT_SIZED_TAGS = new Set(['span', 'a', 'strong', 'em', 'b', 'i', 'label']);

function bakeComputedStyles(liveEl: HTMLElement, cloneEl: HTMLElement): void {
  const cs = window.getComputedStyle(liveEl);
  const tag = liveEl.tagName.toLowerCase();
  const inSVG = !!liveEl.closest('svg');

  // SVG internals: only fix dimensions to avoid viewBox distortion
  if (inSVG && tag !== 'svg') {
    return;
  }
  if (tag === 'svg') {
    const r = liveEl.getBoundingClientRect();
    cloneEl.style.width = r.width ? `${r.width}px` : cs.width;
    cloneEl.style.height = r.height ? `${r.height}px` : cs.height;
    cloneEl.style.flexShrink = '0';
    cloneEl.style.display = 'inline-block';
    cloneEl.style.overflow = 'visible';
    return;
  }

  // Typography
  cloneEl.style.fontFamily = cs.fontFamily;
  cloneEl.style.fontSize = cs.fontSize;
  cloneEl.style.fontWeight = cs.fontWeight;
  cloneEl.style.fontStyle = cs.fontStyle;
  cloneEl.style.lineHeight = cs.lineHeight;
  cloneEl.style.letterSpacing = cs.letterSpacing;
  cloneEl.style.color = cs.color;
  cloneEl.style.textAlign = cs.textAlign;
  cloneEl.style.textDecoration = cs.textDecoration;
  cloneEl.style.textTransform = cs.textTransform;
  cloneEl.style.whiteSpace = cs.whiteSpace;
  cloneEl.style.wordBreak = cs.wordBreak;
  cloneEl.style.verticalAlign = cs.verticalAlign;

  // Background & borders
  cloneEl.style.backgroundColor = cs.backgroundColor;
  if (cs.backgroundImage && cs.backgroundImage !== 'none') {
    cloneEl.style.backgroundImage = cs.backgroundImage;
    cloneEl.style.backgroundSize = cs.backgroundSize;
    cloneEl.style.backgroundPosition = cs.backgroundPosition;
    cloneEl.style.backgroundRepeat = cs.backgroundRepeat;
  }
  cloneEl.style.borderTopWidth = cs.borderTopWidth;
  cloneEl.style.borderTopStyle = cs.borderTopStyle;
  cloneEl.style.borderTopColor = cs.borderTopColor;
  cloneEl.style.borderRightWidth = cs.borderRightWidth;
  cloneEl.style.borderRightStyle = cs.borderRightStyle;
  cloneEl.style.borderRightColor = cs.borderRightColor;
  cloneEl.style.borderBottomWidth = cs.borderBottomWidth;
  cloneEl.style.borderBottomStyle = cs.borderBottomStyle;
  cloneEl.style.borderBottomColor = cs.borderBottomColor;
  cloneEl.style.borderLeftWidth = cs.borderLeftWidth;
  cloneEl.style.borderLeftStyle = cs.borderLeftStyle;
  cloneEl.style.borderLeftColor = cs.borderLeftColor;
  cloneEl.style.borderRadius = cs.borderRadius;

  // Box model
  cloneEl.style.boxSizing = cs.boxSizing;
  cloneEl.style.paddingTop = cs.paddingTop;
  cloneEl.style.paddingRight = cs.paddingRight;
  cloneEl.style.paddingBottom = cs.paddingBottom;
  cloneEl.style.paddingLeft = cs.paddingLeft;
  cloneEl.style.marginTop = cs.marginTop;
  cloneEl.style.marginRight = cs.marginRight;
  cloneEl.style.marginBottom = cs.marginBottom;
  cloneEl.style.marginLeft = cs.marginLeft;

  // Display & position — do NOT bake position for normal flow elements
  const display = cs.display;
  cloneEl.style.display = display;
  const pos = cs.position;
  // fixed/sticky break off-screen layout — make them relative
  cloneEl.style.position = (pos === 'fixed' || pos === 'sticky') ? 'relative' : pos;

  // Width: always bake — it's crucial for column layouts
  cloneEl.style.width = cs.width;
  cloneEl.style.maxWidth = cs.maxWidth;
  cloneEl.style.minWidth = cs.minWidth;

  // Height: only bake if the element is NOT content-sized.
  // Content-sized = inline elements, auto-height textareas, flex-grow children.
  const isContentSized =
    CONTENT_SIZED_TAGS.has(tag) ||
    tag === 'textarea' ||
    tag === 'input' ||
    cs.height === 'auto' ||
    cs.overflow === 'visible';

  if (!isContentSized) {
    cloneEl.style.height = cs.height;
    cloneEl.style.minHeight = cs.minHeight;
    cloneEl.style.maxHeight = cs.maxHeight === 'none' ? 'none' : cs.maxHeight;
  } else {
    cloneEl.style.height = 'auto';
    cloneEl.style.minHeight = cs.minHeight !== 'auto' ? cs.minHeight : '0';
  }

  // Overflow
  cloneEl.style.overflow = cs.overflow;
  cloneEl.style.overflowX = cs.overflowX;
  cloneEl.style.overflowY = cs.overflowY;

  // Flex container
  if (display === 'flex' || display === 'inline-flex') {
    cloneEl.style.flexDirection = cs.flexDirection;
    cloneEl.style.flexWrap = cs.flexWrap;
    cloneEl.style.alignItems = cs.alignItems;
    cloneEl.style.alignContent = cs.alignContent;
    cloneEl.style.justifyContent = cs.justifyContent;
    cloneEl.style.gap = cs.gap;
    cloneEl.style.rowGap = cs.rowGap;
    cloneEl.style.columnGap = cs.columnGap;
  }

  // Flex child
  cloneEl.style.flexShrink = cs.flexShrink;
  cloneEl.style.flexGrow = cs.flexGrow;
  cloneEl.style.flexBasis = cs.flexBasis;
  cloneEl.style.alignSelf = cs.alignSelf;
  cloneEl.style.order = cs.order;

  // Grid container
  if (display === 'grid' || display === 'inline-grid') {
    cloneEl.style.gridTemplateColumns = cs.gridTemplateColumns;
    cloneEl.style.gridTemplateRows = cs.gridTemplateRows;
    cloneEl.style.gap = cs.gap;
    cloneEl.style.rowGap = cs.rowGap;
    cloneEl.style.columnGap = cs.columnGap;
  }
  cloneEl.style.gridColumn = cs.gridColumn;
  cloneEl.style.gridRow = cs.gridRow;

  // Visibility
  cloneEl.style.opacity = cs.opacity;
  cloneEl.style.visibility = cs.visibility;

  // Kill animations/transitions
  cloneEl.style.transform = 'none';
  cloneEl.style.transition = 'none';
  cloneEl.style.animation = 'none';
  cloneEl.style.caretColor = 'transparent';

  // Remove Tailwind classes — all needed styles are now inline
  cloneEl.removeAttribute('class');
}

// Walk live + clone simultaneously and bake all styles
function bakeAll(liveRoot: HTMLElement, cloneRoot: HTMLElement): void {
  const liveEls = [liveRoot, ...Array.from(liveRoot.querySelectorAll<HTMLElement>('*'))];
  const cloneEls = [cloneRoot, ...Array.from(cloneRoot.querySelectorAll<HTMLElement>('*'))];
  for (let i = 0; i < liveEls.length && i < cloneEls.length; i++) {
    bakeComputedStyles(liveEls[i], cloneEls[i]);
  }
}

// ─── Prepare clone for capture ───────────────────────────────────────────────

function prepareClone(clone: HTMLElement, liveRoot: HTMLElement): void {
  // Remove editor-only UI
  clone.querySelectorAll<HTMLElement>(
    'button, [data-pdf-hidden]'
  ).forEach(el => el.remove());

  // Get live inputs/textareas BEFORE any removals (index must stay in sync)
  const liveInputs = Array.from(liveRoot.querySelectorAll<HTMLInputElement>('input'));
  const liveTextareas = Array.from(liveRoot.querySelectorAll<HTMLTextAreaElement>('textarea'));
  const cloneInputs = Array.from(clone.querySelectorAll<HTMLInputElement>('input'));
  const cloneTextareas = Array.from(clone.querySelectorAll<HTMLTextAreaElement>('textarea'));

  // Replace <input> with <div> carrying the same baked styles + the text value
  for (let i = 0; i < cloneInputs.length; i++) {
    const cInput = cloneInputs[i];
    const lInput = liveInputs[i];
    const val = (lInput?.value ?? cInput.value ?? '').trim();

    if (isPlaceholder(val) || val === '') {
      // Remove the whole ancestor row so no empty gap remains
      const row = cInput.closest('[data-pdf-field-wrap]') ?? cInput.closest('li');
      (row ?? cInput).remove();
      continue;
    }

    const div = clone.ownerDocument.createElement('div');
    div.textContent = val;
    // Copy ALL baked inline styles from the clone input
    div.style.cssText = cInput.style.cssText;
    // Ensure text renders like an input: vertically centred, no clipping
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.overflow = 'hidden';
    div.style.whiteSpace = 'nowrap';
    div.style.height = cInput.style.height !== 'auto' && cInput.style.height
      ? cInput.style.height
      : 'auto';
    cInput.parentNode?.replaceChild(div, cInput);
  }

  // Replace <textarea> with <div> carrying the same baked styles + the text value
  for (let i = 0; i < cloneTextareas.length; i++) {
    const cTa = cloneTextareas[i];
    const lTa = liveTextareas[i];
    const val = (lTa?.value ?? cTa.value ?? '').trim();

    if (isPlaceholder(val) || val === '') {
      const row = cTa.closest('[data-pdf-field-wrap]') ?? cTa.closest('li');
      (row ?? cTa).remove();
      continue;
    }

    const div = clone.ownerDocument.createElement('div');
    div.textContent = val;
    div.style.cssText = cTa.style.cssText;
    div.style.overflow = 'visible';
    div.style.height = 'auto';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordBreak = 'break-word';
    div.style.resize = 'none';
    cTa.parentNode?.replaceChild(div, cTa);
  }

  // contentEditable elements (ModernCVTemplate uses these)
  clone.querySelectorAll<HTMLElement>('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
    // Neutralise placeholder pseudo-element
    el.setAttribute('data-placeholder', '');
    el.style.outline = 'none';
    el.style.cursor = 'default';
    el.style.caretColor = 'transparent';

    const text = (el.textContent ?? '').trim();
    if (isPlaceholder(text) || text === '') {
      el.textContent = '';
      // Only collapse inline/span elements — don't collapse block containers
      const d = el.style.display || 'inline';
      if (d === 'inline' || d === 'inline-block' || d === 'inline-flex') {
        el.style.display = 'none';
      }
    }
  });

  // html2canvas mishandles object-fit:cover — convert to background-image
  clone.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    const src = img.getAttribute('src') || '';
    if (!src) { img.remove(); return; }
    const cs = img.style;
    const w = cs.width;
    const h = cs.height;
    if (!w || !h) return; // skip if no baked size

    const div = clone.ownerDocument.createElement('div');
    div.style.cssText = img.style.cssText;
    div.style.width = w;
    div.style.height = h;
    div.style.backgroundImage = `url("${src}")`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';
    div.style.backgroundRepeat = 'no-repeat';
    img.parentNode?.replaceChild(div, img);
  });
}

// ─── Page break logic ────────────────────────────────────────────────────────

interface BreakCandidate {
  topCss: number;
  bottomCss: number;
  priority: number;
}

function collectBreaks(root: HTMLElement): BreakCandidate[] {
  const rootTop = root.getBoundingClientRect().top;
  const list: BreakCandidate[] = [];

  const add = (el: HTMLElement, prio: number) => {
    const r = el.getBoundingClientRect();
    if (r.height < 5 || r.width < 5) return;
    const cs = window.getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return;
    list.push({ topCss: r.top - rootTop, bottomCss: r.bottom - rootTop, priority: prio });
  };

  // Priority order: explicit markers > sections > headings > list items > divs
  root.querySelectorAll<HTMLElement>('[data-pdf-section]').forEach(el => add(el, 300));
  root.querySelectorAll<HTMLElement>('section, article, header, footer').forEach(el => add(el, 200));
  root.querySelectorAll<HTMLElement>('h1,h2,h3,h4').forEach(el => add(el, 150));
  root.querySelectorAll<HTMLElement>('li').forEach(el => add(el, 100));
  root.querySelectorAll<HTMLElement>('p').forEach(el => add(el, 70));
  root.querySelectorAll<HTMLElement>('div').forEach(el => {
    const cs = window.getComputedStyle(el);
    const spacing = (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.paddingTop) || 0);
    if (spacing >= 10) add(el, 60);
  });

  // Deduplicate by position, keep highest priority
  const byBottom = new Map<number, BreakCandidate>();
  for (const c of list) {
    const k = Math.round(c.bottomCss);
    const prev = byBottom.get(k);
    if (!prev || c.priority > prev.priority) byBottom.set(k, c);
  }
  return Array.from(byBottom.values()).sort((a, b) => a.topCss - b.topCss);
}

// Returns the slice height in CSS pixels for this page.
// Rules:
//   - Never break inside an element
//   - Prefer break at element top (element goes to next page) — avoids "orphan" heads
//   - Fill the page as much as possible (score favours positions close to page end)
//   - Minimum 55% fill to avoid tiny pages
function findBreak(
  candidates: BreakCandidate[],
  pageStartCss: number,
  pageHCss: number,
  contentEndCss: number,
): number {
  const maxCss = Math.min(pageStartCss + pageHCss, contentEndCss);
  const minCss = pageStartCss + pageHCss * 0.55;

  // Build candidate break positions
  const options: { pos: number; score: number }[] = [];
  for (const c of candidates) {
    // Break BEFORE element (element goes to next page)
    if (c.topCss > minCss && c.topCss <= maxCss) {
      const fill = (c.topCss - pageStartCss) / pageHCss;
      options.push({ pos: c.topCss, score: c.priority * 2 + fill * 300 });
    }
    // Break AFTER element (element stays on this page)
    if (c.bottomCss > minCss && c.bottomCss <= maxCss) {
      const fill = (c.bottomCss - pageStartCss) / pageHCss;
      options.push({ pos: c.bottomCss, score: c.priority + fill * 300 });
    }
    if (c.topCss > maxCss + 50) break;
  }

  if (options.length === 0) return Math.min(pageHCss, contentEndCss - pageStartCss);
  options.sort((a, b) => b.score - a.score);
  return Math.max(pageHCss * 0.5, options[0].pos - pageStartCss);
}

// ─── Core render ─────────────────────────────────────────────────────────────

async function renderElementToPDFBlob(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const { quality = 0.95, scale = 2 } = options;

  await waitForFonts();

  // Pre-convert images to base64 so html2canvas can access them cross-origin
  const liveImgs = Array.from(element.querySelectorAll<HTMLImageElement>('img'));
  const origSrcs = liveImgs.map(img => img.getAttribute('src') || '');
  await Promise.all(liveImgs.map(async (img, i) => {
    if (origSrcs[i] && !origSrcs[i].startsWith('data:')) {
      img.setAttribute('src', await toBase64(origSrcs[i]));
    }
  }));
  // Wait for images to decode
  await Promise.all(liveImgs.map(img =>
    img.complete ? Promise.resolve()
      : new Promise<void>(r => { img.onload = img.onerror = () => r(); })
  ));

  // Wait for paint
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  window.scrollTo(0, 0);

  // ── Measure everything in the live DOM ──────────────────────────────────
  const rootRect = element.getBoundingClientRect();
  const liveHeight = rootRect.height;
  const liveWidth = rootRect.width;

  const breakCandidates = collectBreaks(element);

  // Measure footer
  const footerEl = element.querySelector<HTMLElement>('[data-pdf-footer]');
  let footerTopRatio = 1;
  let footerHRatio = 0;
  if (footerEl) {
    const fr = footerEl.getBoundingClientRect();
    footerTopRatio = (fr.top - rootRect.top) / liveHeight;
    footerHRatio = fr.height / liveHeight;
  }

  // Also stamp img dimensions for img→div conversion
  liveImgs.forEach(img => {
    const cs = window.getComputedStyle(img);
    img.setAttribute('data-pdf-w', cs.width || `${img.offsetWidth}px`);
    img.setAttribute('data-pdf-h', cs.height || `${img.offsetHeight}px`);
  });

  // ── Build style-baked off-screen clone ───────────────────────────────────
  const clone = element.cloneNode(true) as HTMLElement;
  bakeAll(element, clone);

  // Restore live images
  liveImgs.forEach((img, i) => {
    img.setAttribute('src', origSrcs[i]);
    img.removeAttribute('data-pdf-w');
    img.removeAttribute('data-pdf-h');
  });

  // Set root dimensions on clone
  clone.style.position = 'absolute';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.minWidth = `${A4_WIDTH_PX}px`;
  clone.style.maxWidth = `${A4_WIDTH_PX}px`;
  clone.style.height = 'auto';
  clone.style.minHeight = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.overflow = 'visible';
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';

  // Scale factor (live DOM may be 794px, same as A4_WIDTH_PX — factor is 1)
  const widthScale = A4_WIDTH_PX / liveWidth;

  // Apply img baked dimensions to clone imgs before prepareClone
  const cloneImgs = Array.from(clone.querySelectorAll<HTMLImageElement>('img'));
  liveImgs.forEach((lImg, i) => {
    if (cloneImgs[i]) {
      cloneImgs[i].style.width = lImg.getAttribute('data-pdf-w') || cloneImgs[i].style.width;
      cloneImgs[i].style.height = lImg.getAttribute('data-pdf-h') || cloneImgs[i].style.height;
    }
  });
  // Restore live img data-attrs cleanup (already done above, but keep clean)

  document.body.appendChild(clone);
  prepareClone(clone, element);

  // One layout pass
  await new Promise<void>(r => requestAnimationFrame(() => r()));

  const cloneH = clone.scrollHeight;
  console.log('[PDF] Clone:', clone.scrollWidth, 'x', cloneH, '  scale:', widthScale.toFixed(3));

  // ── Render ───────────────────────────────────────────────────────────────
  let canvas: HTMLCanvasElement;
  try {
    canvas = await (html2canvas as any)(clone, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 0,
      windowWidth: A4_WIDTH_PX,
      width: A4_WIDTH_PX,
      height: cloneH,
      scrollX: 0,
      scrollY: 0,
    });
  } finally {
    document.body.removeChild(clone);
  }

  console.log('[PDF] Canvas:', canvas.width, 'x', canvas.height);

  // ── Compute page geometry ─────────────────────────────────────────────────
  // A4 page height in canvas pixels
  const canvasPageH = Math.round(A4_HEIGHT_MM * canvas.width / A4_WIDTH_MM);
  // CSS pixels per canvas pixel (in the clone coordinate system)
  const cssToCanvas = canvas.height / cloneH;

  // Footer position in canvas pixels (measured from live DOM ratios × clone height)
  const hasFooter = footerEl != null && footerHRatio > 0;
  const footerStartCanvas = hasFooter ? Math.round(footerTopRatio * canvas.height) : canvas.height;
  const footerHCanvas = hasFooter ? Math.round(footerHRatio * canvas.height) : 0;
  // Content = everything above footer
  const contentEndCanvas = hasFooter ? footerStartCanvas : canvas.height;

  // CSS-space equivalents (for break candidate matching)
  const clonePageHCss = canvasPageH / cssToCanvas;
  const contentEndCss = contentEndCanvas / cssToCanvas;

  // ── Determine page slices (in CSS pixels) ────────────────────────────────
  const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  // Helper: draw one PDF page
  const drawPage = (srcCanvasY: number, srcCanvasH: number, addFooter: boolean, isFirst: boolean) => {
    const dstH = (addFooter || srcCanvasH > canvasPageH * 0.95) ? canvasPageH : srcCanvasH;
    const pc = document.createElement('canvas');
    pc.width = canvas.width;
    pc.height = dstH;
    const ctx = pc.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pc.width, pc.height);
    // Content
    ctx.drawImage(canvas, 0, srcCanvasY, canvas.width, srcCanvasH, 0, 0, canvas.width, srcCanvasH);
    // Footer at very bottom
    if (addFooter && footerHCanvas > 0) {
      const footerY = dstH - footerHCanvas;
      ctx.drawImage(canvas, 0, footerStartCanvas, canvas.width, footerHCanvas, 0, footerY, canvas.width, footerHCanvas);
    }
    if (!isFirst) pdfDoc.addPage();
    const pageMmH = (pc.height / scale) * (A4_WIDTH_MM / A4_WIDTH_PX);
    pdfDoc.addImage(pc.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, A4_WIDTH_MM, pageMmH, undefined, 'FAST');
  };

  // Single page case
  const totalContentH = contentEndCanvas + footerHCanvas;
  if (totalContentH <= canvasPageH * 1.02) {
    drawPage(0, contentEndCanvas, hasFooter, true);
    console.log('[PDF] Single page');
  } else {
    // Multi-page: build CSS-space slice list
    const footerHCss = footerHRatio * liveHeight;
    let cursor = 0;
    const slicesCss: number[] = [];

    while (cursor < contentEndCss && slicesCss.length < 30) {
      const remaining = contentEndCss - cursor;
      // If rest of content + footer fits on one page → last slice
      if (remaining + footerHCss <= clonePageHCss * 1.02) {
        slicesCss.push(remaining);
        break;
      }
      if (remaining <= clonePageHCss * 1.02) {
        slicesCss.push(remaining);
        break;
      }
      slicesCss.push(findBreak(breakCandidates, cursor, clonePageHCss, contentEndCss));
      cursor += slicesCss[slicesCss.length - 1];
    }

    let canvasCursor = 0;
    for (let p = 0; p < slicesCss.length; p++) {
      const sliceH = Math.round(slicesCss[p] * cssToCanvas);
      const isLast = p === slicesCss.length - 1;
      drawPage(canvasCursor, sliceH, isLast && hasFooter, p === 0);
      console.log(`[PDF] p${p + 1}: canvas ${canvasCursor}–${canvasCursor + sliceH}${isLast && hasFooter ? ' +footer' : ''}`);
      canvasCursor += sliceH;
    }
    console.log('[PDF] Total pages:', slicesCss.length);
  }

  return pdfDoc.output('blob') as Blob;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function exportElementToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const { filename = `CV_${new Date().toISOString().split('T')[0]}.pdf` } = options;
  const blob = await renderElementToPDFBlob(element, options);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a);
  a.click(); a.remove();
  URL.revokeObjectURL(url);
}

export async function exportCVToPDF(
  cvRef: React.RefObject<HTMLElement>,
  personalInfo?: { name?: string },
  options?: PDFExportOptions
): Promise<void> {
  if (!cvRef.current) throw new Error('CV-Element nicht gefunden');
  const name = (personalInfo?.name || 'CV')
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  await exportElementToPDF(cvRef.current, {
    ...options,
    filename: `Lebenslauf_${name}_${new Date().toISOString().split('T')[0]}.pdf`,
  });
}

export async function exportCVToPDFBlob(
  cvRef: React.RefObject<HTMLElement>,
  _personalInfo?: { name?: string },
  options?: PDFExportOptions
): Promise<Blob> {
  if (!cvRef.current) throw new Error('CV-Element nicht gefunden');
  return renderElementToPDFBlob(cvRef.current, options);
}

export function debugLogPDFHtml(cvRef: React.RefObject<HTMLElement> | HTMLElement | null): void {
  const el = cvRef instanceof HTMLElement ? cvRef : cvRef?.current;
  if (!el) { console.warn('[PDF Debug] No element.'); return; }
  console.log('[PDF Debug]', el.offsetWidth, 'x', el.scrollHeight);
}
