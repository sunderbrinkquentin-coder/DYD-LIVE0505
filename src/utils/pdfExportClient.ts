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

// ─── Style baking ─────────────────────────────────────────────────────────────
// Walk live+clone trees simultaneously, copying every computed style as inline.
// The clone becomes fully self-contained (no CSS classes required).
//
// Height policy:
//   - Block containers that contain flex/grid children: bake the computed height
//     so columns don't collapse off-screen.
//   - Inputs, textareas, content-sized inline elements: height: auto so text
//     can flow without clipping.
//   - SVG root: bake exact pixel dimensions; preserve verticalAlign for
//     inline-flex icon alignment.

const INLINE_TAGS = new Set(['span', 'a', 'strong', 'em', 'b', 'i', 'label', 'small', 'code']);

function bakeComputedStyles(liveEl: HTMLElement, cloneEl: HTMLElement): void {
  const tag = liveEl.tagName.toLowerCase();
  const cs = window.getComputedStyle(liveEl);
// Position — convert fixed/sticky to relative so off-screen layout works
  const pos = cs.position;
  cloneEl.style.position = (pos === 'fixed' || pos === 'sticky') ? 'relative' : pos;
  
  // 🔥 NEU: z-index sichern, damit Ebenen nicht kollabieren
  cloneEl.style.zIndex = cs.zIndex;

  // 🔥 NEU: Wenn es ein reines Textelement ist, radikal in den Vordergrund zwingen
  if (INLINE_TAGS.has(tag) || ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li'].includes(tag)) {
    cloneEl.style.zIndex = '999';
    cloneEl.style.position = pos === 'static' ? 'relative' : pos; // relative benötigt für z-index
  }
  // ── SVG root ──────────────────────────────────────────────────────────────
  if (tag === 'svg') {
    const r = liveEl.getBoundingClientRect();
    cloneEl.style.width = `${r.width}px`;
    cloneEl.style.height = `${r.height}px`;
    cloneEl.style.minWidth = `${r.width}px`;
    cloneEl.style.minHeight = `${r.height}px`;
    cloneEl.style.flexShrink = '0';
    // Use inline-block so it participates in the flex row of its parent.
    // verticalAlign: middle ensures it sits on the same baseline as adjacent text.
    cloneEl.style.display = 'inline-block';
    cloneEl.style.verticalAlign = 'middle';
    cloneEl.style.overflow = 'visible';
    cloneEl.style.transition = 'none';
    cloneEl.style.animation = 'none';
    return;
  }

  // ── SVG children (path, circle, polyline …) ───────────────────────────────
  // Do not touch these — they use SVG attributes (d, cx, stroke…), not CSS.
  if (liveEl.closest('svg')) return;

  // ── Everything else ───────────────────────────────────────────────────────

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

  // ── 🔥 FIX FÜR DIE EBENEN (Nutzt das bereits deklarierte "pos" und "tag") ──
  // Kopiere den echten z-index aus dem Live-Editor
  cloneEl.style.zIndex = cs.zIndex;

  // Wenn es ein Textelement ist, zwingen wir es nach ganz oben.
  if (INLINE_TAGS.has(tag) || ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li'].includes(tag)) {
    cloneEl.style.zIndex = '999';
    if (pos === 'static') {
      cloneEl.style.position = 'relative';
    }
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Display
  cloneEl.style.display = cs.display;

  // Width — always bake to preserve column layouts
  cloneEl.style.width = cs.width;
  cloneEl.style.maxWidth = cs.maxWidth;
  cloneEl.style.minWidth = cs.minWidth;

  // Height — only bake for block containers, not for content-sized elements.
  // Inputs/textareas need height:auto so replaced divs can size to their text.
  // Inline elements size from content naturally.
  const isContentSized =
    INLINE_TAGS.has(tag) ||
    tag === 'textarea' ||
    tag === 'input' ||
    cs.height === 'auto';

  if (isContentSized) {
    cloneEl.style.height = 'auto';
    cloneEl.style.minHeight = cs.minHeight !== 'auto' ? cs.minHeight : '0';
    cloneEl.style.maxHeight = 'none';
  } else {
    cloneEl.style.height = cs.height;
    cloneEl.style.minHeight = cs.minHeight;
    cloneEl.style.maxHeight = cs.maxHeight === 'none' ? 'none' : cs.maxHeight;
  }

  // Overflow
  cloneEl.style.overflow = cs.overflow;
  cloneEl.style.overflowX = cs.overflowX;
  cloneEl.style.overflowY = cs.overflowY;

  // Flex container
  if (cs.display === 'flex' || cs.display === 'inline-flex') {
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
  if (cs.display === 'grid' || cs.display === 'inline-grid') {
    cloneEl.style.gridTemplateColumns = cs.gridTemplateColumns;
    cloneEl.style.gridTemplateRows = cs.gridTemplateRows;
    cloneEl.style.gap = cs.gap;
    cloneEl.style.rowGap = cs.rowGap;
    cloneEl.style.columnGap = cs.columnGap;
  }
  cloneEl.style.gridColumn = cs.gridColumn;
  cloneEl.style.gridRow = cs.gridRow;

  // Misc
// Misc
  cloneEl.style.opacity = cs.opacity;
  cloneEl.style.visibility = cs.visibility;
  
  // 🛠️ Geändert: Erlaubt dem PDF-Klon, CSS-Transformationen der Boxen zu behalten
  cloneEl.style.transform = cs.transform !== 'none' ? cs.transform : 'none'; 
  
  cloneEl.style.transition = 'none';
  cloneEl.style.animation = 'none';
  cloneEl.style.caretColor = 'transparent';

  // Remove Tailwind class list — all needed styles are now inline
  cloneEl.removeAttribute('class');
}

function bakeAll(liveRoot: HTMLElement, cloneRoot: HTMLElement): void {
  const lEls = [liveRoot, ...Array.from(liveRoot.querySelectorAll<HTMLElement>('*'))];
  const cEls = [cloneRoot, ...Array.from(cloneRoot.querySelectorAll<HTMLElement>('*'))];
  for (let i = 0; i < lEls.length && i < cEls.length; i++) {
    bakeComputedStyles(lEls[i], cEls[i]);
  }
}

// ─── Prepare clone for capture ───────────────────────────────────────────────

function prepareClone(clone: HTMLElement, liveRoot: HTMLElement): void {
  // Remove editor-only UI
  clone.querySelectorAll<HTMLElement>('button, [data-pdf-hidden]').forEach(el => el.remove());

  // Snapshot live input/textarea values BEFORE any DOM changes
  const liveInputs = Array.from(liveRoot.querySelectorAll<HTMLInputElement>('input'));
  const liveTAs = Array.from(liveRoot.querySelectorAll<HTMLTextAreaElement>('textarea'));
  const cloneInputs = Array.from(clone.querySelectorAll<HTMLInputElement>('input'));
  const cloneTAs = Array.from(clone.querySelectorAll<HTMLTextAreaElement>('textarea'));

  // Replace <input> → <div>
  for (let i = 0; i < cloneInputs.length; i++) {
    const ci = cloneInputs[i];
    const val = (liveInputs[i]?.value ?? ci.value ?? '').trim();

    if (isPlaceholder(val)) {
      const row = ci.closest('[data-pdf-field-wrap]') ?? ci.closest('li');
      (row ?? ci).remove();
      continue;
    }

    const div = clone.ownerDocument.createElement('div');
    div.textContent = val;
    div.style.cssText = ci.style.cssText;
    // Let the div size to its content — fixed-width inputs would clip text
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.width = 'auto';
    div.style.minWidth = '0';
    div.style.maxWidth = '100%';
    div.style.overflow = 'visible';
    div.style.whiteSpace = 'normal';
    div.style.wordBreak = 'break-word';
    ci.parentNode?.replaceChild(div, ci);
  }

  // Replace <textarea> → <div>
  for (let i = 0; i < cloneTAs.length; i++) {
    const ct = cloneTAs[i];
    const val = (liveTAs[i]?.value ?? ct.value ?? '').trim();

    if (isPlaceholder(val)) {
      const row = ct.closest('[data-pdf-field-wrap]') ?? ct.closest('li');
      (row ?? ct).remove();
      continue;
    }

    const div = clone.ownerDocument.createElement('div');
    div.textContent = val;
    div.style.cssText = ct.style.cssText;
    // Always auto-height — fixed rows=N bakes a px height that clips content
    div.style.height = 'auto';
    div.style.minHeight = '0';
    div.style.maxHeight = 'none';
    div.style.overflow = 'visible';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordBreak = 'break-word';
    div.style.resize = 'none';
    ct.parentNode?.replaceChild(div, ct);
  }

  // contentEditable spans (ModernCVTemplate)
  clone.querySelectorAll<HTMLElement>('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
    el.setAttribute('data-placeholder', '');
    el.style.outline = 'none';
    el.style.cursor = 'default';
    el.style.caretColor = 'transparent';
    const text = (el.textContent ?? '').trim();
    if (isPlaceholder(text) || text === '') {
      el.textContent = '';
      const d = el.style.display || 'inline';
      if (d === 'inline' || d === 'inline-block' || d === 'inline-flex' || d === 'none') {
        el.style.display = 'none';
      }
    }
  });

  // img with object-fit → background-image div
  clone.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    const src = img.getAttribute('src') || '';
    if (!src) { img.remove(); return; }
    const w = img.style.width;
    const h = img.style.height;
    if (!w || !h || w === 'auto' || h === 'auto') return;
    const div = clone.ownerDocument.createElement('div');
    div.style.cssText = img.style.cssText;
    div.style.backgroundImage = `url("${src}")`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';
    div.style.backgroundRepeat = 'no-repeat';
    img.parentNode?.replaceChild(div, img);
  });
}

// ─── Page break detection (measured from the CLONE after baking) ─────────────
// This is critical: we measure break candidates from the CLONE DOM (while it's
// attached to the document), not the live DOM. This guarantees that the CSS
// pixel positions match the canvas pixel positions after html2canvas renders.

interface BreakCandidate {
  topPx: number;
  bottomPx: number;
  priority: number;
}

function collectBreaksFromClone(cloneRoot: HTMLElement): BreakCandidate[] {
  const rootTop = cloneRoot.getBoundingClientRect().top;
  const list: BreakCandidate[] = [];

  const add = (el: HTMLElement, prio: number) => {
    const r = el.getBoundingClientRect();
    if (r.height < 5 || r.width < 5) return;
    if (el.style.display === 'none' || el.style.visibility === 'hidden') return;
    list.push({ topPx: r.top - rootTop, bottomPx: r.bottom - rootTop, priority: prio });
  };

  cloneRoot.querySelectorAll<HTMLElement>('[data-pdf-section]').forEach(el => add(el, 300));
  cloneRoot.querySelectorAll<HTMLElement>('section, article').forEach(el => add(el, 200));
  cloneRoot.querySelectorAll<HTMLElement>('h1,h2,h3,h4').forEach(el => add(el, 150));
  cloneRoot.querySelectorAll<HTMLElement>('li').forEach(el => add(el, 100));
  cloneRoot.querySelectorAll<HTMLElement>('p').forEach(el => add(el, 70));
  cloneRoot.querySelectorAll<HTMLElement>('div').forEach(el => {
    const mt = parseFloat(el.style.marginTop || '0') || 0;
    const pt = parseFloat(el.style.paddingTop || '0') || 0;
    if (mt + pt >= 10) add(el, 60);
  });

  // Deduplicate — keep highest priority at each bottom position
  const map = new Map<number, BreakCandidate>();
  for (const c of list) {
    const k = Math.round(c.bottomPx);
    const prev = map.get(k);
    if (!prev || c.priority > prev.priority) map.set(k, c);
  }
  return Array.from(map.values()).sort((a, b) => a.topPx - b.topPx);
}

// Find the best slice height (in CSS/clone pixels) for a page.
// Rules:
//   1. Only break at element TOP or BOTTOM — never mid-element.
//   2. Prefer breaks that fill the page as much as possible.
//   3. Minimum fill: 55% of page height.
function findBreak(
  candidates: BreakCandidate[],
  pageStart: number,
  pageH: number,
  contentEnd: number,
): number {
  const maxPos = Math.min(pageStart + pageH, contentEnd);
  const minPos = pageStart + pageH * 0.55;

  const opts: { pos: number; score: number }[] = [];

  for (const c of candidates) {
    // Break BEFORE this element (element starts next page)
    if (c.topPx > minPos && c.topPx <= maxPos) {
      const fill = (c.topPx - pageStart) / pageH;
      opts.push({ pos: c.topPx, score: c.priority * 2 + fill * 400 });
    }
    // Break AFTER this element (element stays on this page)
    if (c.bottomPx > minPos && c.bottomPx <= maxPos) {
      const fill = (c.bottomPx - pageStart) / pageH;
      opts.push({ pos: c.bottomPx, score: c.priority + fill * 400 });
    }
    if (c.topPx > maxPos + 100) break;
  }

  if (opts.length === 0) return Math.min(pageH, contentEnd - pageStart);
  opts.sort((a, b) => b.score - a.score);
  return Math.max(pageH * 0.5, opts[0].pos - pageStart);
}

// ─── Core render ─────────────────────────────────────────────────────────────

async function renderElementToPDFBlob(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const { quality = 0.95, scale = 2 } = options;

  await waitForFonts();

  // Pre-convert images to base64
  const liveImgs = Array.from(element.querySelectorAll<HTMLImageElement>('img'));
  const origSrcs = liveImgs.map(img => img.getAttribute('src') || '');
  await Promise.all(liveImgs.map(async (img, i) => {
    if (origSrcs[i] && !origSrcs[i].startsWith('data:')) {
      img.setAttribute('src', await toBase64(origSrcs[i]));
    }
  }));
  await Promise.all(liveImgs.map(img =>
    img.complete ? Promise.resolve()
      : new Promise<void>(r => { img.onload = img.onerror = () => r(); })
  ));

  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  window.scrollTo(0, 0);

  // Measure footer ratio in live DOM
  const liveRect = element.getBoundingClientRect();
  const liveH = liveRect.height;
  const footerEl = element.querySelector<HTMLElement>('[data-pdf-footer]');
  let footerTopRatio = 1;
  let footerHRatio = 0;
  if (footerEl) {
    const fr = footerEl.getBoundingClientRect();
    footerTopRatio = (fr.top - liveRect.top) / liveH;
    footerHRatio = fr.height / liveH;
  }

  // Stamp img dimensions for img→div conversion
  liveImgs.forEach(img => {
    const cs = window.getComputedStyle(img);
    img.setAttribute('data-pdf-w', cs.width || `${img.offsetWidth}px`);
    img.setAttribute('data-pdf-h', cs.height || `${img.offsetHeight}px`);
  });

  // Build baked clone
  const clone = element.cloneNode(true) as HTMLElement;
  bakeAll(element, clone);

  // Restore live images & cleanup attrs
  liveImgs.forEach((img, i) => {
    img.setAttribute('src', origSrcs[i]);
    img.removeAttribute('data-pdf-w');
    img.removeAttribute('data-pdf-h');
  });

  // Apply baked img dimensions to clone
  const cloneImgs = Array.from(clone.querySelectorAll<HTMLImageElement>('img'));
  liveImgs.forEach((lImg, i) => {
    if (!cloneImgs[i]) return;
    cloneImgs[i].style.width = lImg.getAttribute('data-pdf-w') || cloneImgs[i].style.width;
    cloneImgs[i].style.height = lImg.getAttribute('data-pdf-h') || cloneImgs[i].style.height;
  });

  // Root clone styles
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

  document.body.appendChild(clone);
  prepareClone(clone, element);

  // Let browser lay out the clone
  await new Promise<void>(r => requestAnimationFrame(() => r()));

  const cloneH = clone.scrollHeight;

  // ── Measure break candidates from the CLONE (not live DOM) ───────────────
  const breakCandidates = collectBreaksFromClone(clone);
  // Measure footer position from clone
  const cloneFooter = clone.querySelector<HTMLElement>('[data-pdf-footer]');
  let cloneFooterTopPx = cloneH;
  let cloneFooterHPx = 0;
  if (cloneFooter) {
    const cr = clone.getBoundingClientRect();
    const fr = cloneFooter.getBoundingClientRect();
    cloneFooterTopPx = fr.top - cr.top;
    cloneFooterHPx = fr.height;
  }
  const hasFooter = cloneFooter != null && cloneFooterHPx > 5;

  console.log('[PDF] Clone:', clone.scrollWidth, 'x', cloneH,
    hasFooter ? `  footer at ${cloneFooterTopPx.toFixed(0)}+${cloneFooterHPx.toFixed(0)}px` : '');

  // Render
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

  // ── Page geometry ─────────────────────────────────────────────────────────
  const cssToCanvas = canvas.height / cloneH;
  // A4 page height in canvas pixels
  const canvasPageH = Math.round(A4_HEIGHT_MM * canvas.width / A4_WIDTH_MM);
  // Clone-CSS pixels per A4 page
  const clonePageHCss = canvasPageH / cssToCanvas;

  // Footer in canvas pixels
  const footerStartCanvas = hasFooter ? Math.round(cloneFooterTopPx * cssToCanvas) : canvas.height;
  const footerHCanvas = hasFooter ? Math.round(cloneFooterHPx * cssToCanvas) : 0;
  // Content (without footer)
  const contentEndCss = hasFooter ? cloneFooterTopPx : cloneH;
  const contentEndCanvas = hasFooter ? footerStartCanvas : canvas.height;

  const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  // Draw one PDF page
  const drawPage = (srcY: number, srcH: number, addFooter: boolean, isFirst: boolean) => {
    // Last page (with footer) is always full A4; other pages are sized to content
    const dstH = addFooter ? canvasPageH : srcH;
    const pc = document.createElement('canvas');
    pc.width = canvas.width;
    pc.height = dstH;
    const ctx = pc.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pc.width, pc.height);
    // Content slice
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);
    // Footer at very bottom of last page
    if (addFooter && footerHCanvas > 0) {
      const fy = dstH - footerHCanvas;
      ctx.drawImage(canvas, 0, footerStartCanvas, canvas.width, footerHCanvas, 0, fy, canvas.width, footerHCanvas);
    }
    if (!isFirst) pdfDoc.addPage();
    const mmH = (dstH / scale) * (A4_WIDTH_MM / A4_WIDTH_PX);
    pdfDoc.addImage(pc.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, A4_WIDTH_MM, mmH, undefined, 'FAST');
  };

  // Single page?
  const totalH = contentEndCanvas + footerHCanvas;
  if (totalH <= canvasPageH * 1.02) {
    drawPage(0, contentEndCanvas, hasFooter, true);
    console.log('[PDF] Single page');
    return pdfDoc.output('blob') as Blob;
  }

  // Multi-page: slice content using CLONE CSS coordinates
  const footerHCss = hasFooter ? cloneFooterHPx : 0;
  let cursor = 0;
  const slicesCss: number[] = [];

  while (cursor < contentEndCss && slicesCss.length < 30) {
    const remaining = contentEndCss - cursor;
    // If rest + footer fits on one page → final slice
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
    console.log(`[PDF] p${p + 1}: ${canvasCursor}–${canvasCursor + sliceH}px` + (isLast && hasFooter ? ' +footer' : ''));
    canvasCursor += sliceH;
  }
  console.log('[PDF] Total pages:', slicesCss.length);

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
