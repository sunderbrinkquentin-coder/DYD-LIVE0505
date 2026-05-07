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
const A4_ASPECT = A4_HEIGHT_MM / A4_WIDTH_MM;
const PAGE_HEIGHT_PX = Math.round(A4_WIDTH_PX * A4_ASPECT); // ~1123px

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function toBase64(src: string): Promise<string> {
  if (!src || src.startsWith('data:')) return src;
  try {
    const r = await fetch(src, { mode: 'cors', cache: 'no-cache' });
    if (!r.ok) return src;
    const blob = await r.blob();
    return await new Promise<string>((res, rej) => {
      const fr = new FileReader();
      fr.onload = () => res(fr.result as string);
      fr.onerror = rej;
      fr.readAsDataURL(blob);
    });
  } catch { return src; }
}

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
  const t = v.trim().toLowerCase();
  return t === '' || PLACEHOLDERS.has(t);
}

async function waitForFonts(): Promise<void> {
  if ((document as any).fonts) {
    await (document as any).fonts.ready;
    await Promise.all([
      '400 12px Inter', '500 12px Inter', '600 12px Inter', '700 12px Inter',
      '400 12px Roboto', '700 12px Roboto',
      '400 12px "Open Sans"', '700 12px "Open Sans"',
    ].map(f => (document as any).fonts.load(f).catch(() => {})));
    await (document as any).fonts.ready;
  }
  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, 200))));
}

// ─── Deep clone with baked inline styles ─────────────────────────────────────
// This is the core of the fix: we walk the live DOM and its clone in lockstep,
// copying EVERY computed style as an inline style onto the clone node.
// This makes the clone completely self-contained — no CSS classes needed.

function bakeStyles(live: HTMLElement, clone: HTMLElement): void {
  const liveEls = [live, ...Array.from(live.querySelectorAll<HTMLElement>('*'))];
  const cloneEls = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))];

  for (let i = 0; i < liveEls.length && i < cloneEls.length; i++) {
    const lEl = liveEls[i];
    const cEl = cloneEls[i];
    const tag = lEl.tagName.toLowerCase();

    // Skip SVG internals — they use attributes, not CSS
    if (lEl.closest('svg') && tag !== 'svg') continue;

    const cs = window.getComputedStyle(lEl);

    // For SVG root: just fix dimensions
    if (tag === 'svg') {
      const r = lEl.getBoundingClientRect();
      if (r.width > 0) cEl.style.width = `${r.width}px`;
      if (r.height > 0) cEl.style.height = `${r.height}px`;
      cEl.style.flexShrink = '0';
      cEl.style.overflow = 'visible';
      continue;
    }

    // Bake all visual styles
    cEl.style.fontFamily = cs.fontFamily;
    cEl.style.fontSize = cs.fontSize;
    cEl.style.fontWeight = cs.fontWeight;
    cEl.style.fontStyle = cs.fontStyle;
    cEl.style.lineHeight = cs.lineHeight;
    cEl.style.letterSpacing = cs.letterSpacing;
    cEl.style.color = cs.color;
    cEl.style.backgroundColor = cs.backgroundColor;
    cEl.style.display = cs.display;
    cEl.style.position = cs.position === 'fixed' || cs.position === 'sticky' ? 'relative' : cs.position;
    cEl.style.width = cs.width;
    cEl.style.height = cs.height;
    cEl.style.minWidth = cs.minWidth;
    cEl.style.minHeight = cs.minHeight;
    cEl.style.maxWidth = cs.maxWidth;
    cEl.style.maxHeight = cs.maxHeight;
    cEl.style.paddingTop = cs.paddingTop;
    cEl.style.paddingRight = cs.paddingRight;
    cEl.style.paddingBottom = cs.paddingBottom;
    cEl.style.paddingLeft = cs.paddingLeft;
    cEl.style.marginTop = cs.marginTop;
    cEl.style.marginRight = cs.marginRight;
    cEl.style.marginBottom = cs.marginBottom;
    cEl.style.marginLeft = cs.marginLeft;
    cEl.style.borderTopWidth = cs.borderTopWidth;
    cEl.style.borderTopStyle = cs.borderTopStyle;
    cEl.style.borderTopColor = cs.borderTopColor;
    cEl.style.borderRightWidth = cs.borderRightWidth;
    cEl.style.borderRightStyle = cs.borderRightStyle;
    cEl.style.borderRightColor = cs.borderRightColor;
    cEl.style.borderBottomWidth = cs.borderBottomWidth;
    cEl.style.borderBottomStyle = cs.borderBottomStyle;
    cEl.style.borderBottomColor = cs.borderBottomColor;
    cEl.style.borderLeftWidth = cs.borderLeftWidth;
    cEl.style.borderLeftStyle = cs.borderLeftStyle;
    cEl.style.borderLeftColor = cs.borderLeftColor;
    cEl.style.borderRadius = cs.borderRadius;
    cEl.style.overflow = cs.overflow;
    cEl.style.textAlign = cs.textAlign;
    cEl.style.textDecoration = cs.textDecoration;
    cEl.style.textTransform = cs.textTransform;
    cEl.style.whiteSpace = cs.whiteSpace;
    cEl.style.wordBreak = cs.wordBreak;
    cEl.style.verticalAlign = cs.verticalAlign;
    cEl.style.boxSizing = cs.boxSizing;
    cEl.style.opacity = cs.opacity;
    cEl.style.transform = 'none';
    cEl.style.transition = 'none';
    cEl.style.animation = 'none';

    // Flex properties
    if (cs.display.includes('flex')) {
      cEl.style.flexDirection = cs.flexDirection;
      cEl.style.flexWrap = cs.flexWrap;
      cEl.style.alignItems = cs.alignItems;
      cEl.style.justifyContent = cs.justifyContent;
      cEl.style.gap = cs.gap;
      cEl.style.rowGap = cs.rowGap;
      cEl.style.columnGap = cs.columnGap;
    }

    // Flex child properties
    cEl.style.flexShrink = cs.flexShrink;
    cEl.style.flexGrow = cs.flexGrow;
    cEl.style.flexBasis = cs.flexBasis;
    cEl.style.alignSelf = cs.alignSelf;
    cEl.style.order = cs.order;

    // Grid
    if (cs.display.includes('grid')) {
      cEl.style.gridTemplateColumns = cs.gridTemplateColumns;
      cEl.style.gridTemplateRows = cs.gridTemplateRows;
      cEl.style.gap = cs.gap;
    }
    cEl.style.gridColumn = cs.gridColumn;
    cEl.style.gridRow = cs.gridRow;

    // Background gradient
    if (cs.backgroundImage && cs.backgroundImage !== 'none') {
      cEl.style.backgroundImage = cs.backgroundImage;
    }
    cEl.style.backgroundSize = cs.backgroundSize;
    cEl.style.backgroundPosition = cs.backgroundPosition;
    cEl.style.backgroundRepeat = cs.backgroundRepeat;

    // Remove class to prevent any residual stylesheet interference
    cEl.removeAttribute('class');
  }
}

// ─── Prepare clone for PDF rendering ─────────────────────────────────────────

function prepareClone(clone: HTMLElement, liveRoot: HTMLElement): void {
  // Remove editor-only elements
  clone.querySelectorAll<HTMLElement>(
    'button, [data-pdf-hidden], .pdf-hidden'
  ).forEach(el => el.remove());

  // Get live inputs/textareas for value reference
  const liveInputs = Array.from(liveRoot.querySelectorAll<HTMLInputElement>('input'));
  const liveTextareas = Array.from(liveRoot.querySelectorAll<HTMLTextAreaElement>('textarea'));
  const cloneInputs = Array.from(clone.querySelectorAll<HTMLInputElement>('input'));
  const cloneTextareas = Array.from(clone.querySelectorAll<HTMLTextAreaElement>('textarea'));

  // Replace inputs with text-holding divs
  for (let i = 0; i < cloneInputs.length; i++) {
    const cInput = cloneInputs[i];
    const lInput = liveInputs[i];
    const val = lInput?.value || cInput.value || '';

    if (isPlaceholder(val)) {
      const wrap = cInput.closest('li, [data-pdf-field-wrap]');
      (wrap || cInput).remove();
      continue;
    }

    // The clone input already has baked inline styles from bakeStyles().
    // Just swap the tag to a div so html2canvas renders the text.
    const div = clone.ownerDocument.createElement('div');
    div.textContent = val;
    div.style.cssText = cInput.style.cssText;
    // Ensure text is visible (inputs hide overflow by default)
    div.style.overflow = 'hidden';
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    cInput.parentNode?.replaceChild(div, cInput);
  }

  // Replace textareas with div
  for (let i = 0; i < cloneTextareas.length; i++) {
    const cTa = cloneTextareas[i];
    const lTa = liveTextareas[i];
    const val = lTa?.value || cTa.value || '';

    if (isPlaceholder(val)) {
      const wrap = cTa.closest('li, [data-pdf-field-wrap]');
      (wrap || cTa).remove();
      continue;
    }

    const div = clone.ownerDocument.createElement('div');
    div.textContent = val;
    div.style.cssText = cTa.style.cssText;
    div.style.overflow = 'visible';
    div.style.whiteSpace = 'pre-wrap';
    div.style.wordBreak = 'break-word';
    div.style.height = 'auto';
    div.style.resize = 'none';
    cTa.parentNode?.replaceChild(div, cTa);
  }

  // Clean contentEditable elements
  clone.querySelectorAll<HTMLElement>('[contenteditable]').forEach(el => {
    el.removeAttribute('contenteditable');
    el.setAttribute('data-placeholder', '');
    el.style.outline = 'none';
    el.style.cursor = 'default';
    el.style.caretColor = 'transparent';
    const text = el.textContent?.trim() ?? '';
    if (isPlaceholder(text)) {
      el.textContent = '';
      const tag = el.tagName.toLowerCase();
      if (tag === 'span' || tag === 'p') {
        el.style.display = 'none';
      }
    }
  });

  // Convert images with object-fit to background-image divs
  clone.querySelectorAll<HTMLImageElement>('img').forEach(img => {
    const w = img.style.width;
    const h = img.style.height;
    if (!w || !h || w === 'auto' || h === 'auto') return;

    const src = img.getAttribute('src') || '';
    if (!src) return;

    const div = clone.ownerDocument.createElement('div');
    div.style.cssText = img.style.cssText;
    div.style.backgroundImage = `url('${src}')`;
    div.style.backgroundSize = 'cover';
    div.style.backgroundPosition = 'center';
    div.style.backgroundRepeat = 'no-repeat';
    img.parentNode?.replaceChild(div, img);
  });
}

// ─── Page break logic ────────────────────────────────────────────────────────

interface BreakCandidate {
  topPx: number;
  bottomPx: number;
  priority: number;
}

function collectBreaks(root: HTMLElement): BreakCandidate[] {
  const rootTop = root.getBoundingClientRect().top;
  const results: BreakCandidate[] = [];

  const add = (el: HTMLElement, prio: number) => {
    const r = el.getBoundingClientRect();
    if (r.height < 5 || r.width < 5) return;
    results.push({ topPx: r.top - rootTop, bottomPx: r.bottom - rootTop, priority: prio });
  };

  root.querySelectorAll<HTMLElement>('[data-pdf-section]').forEach(el => add(el, 300));
  root.querySelectorAll<HTMLElement>('section, article').forEach(el => add(el, 200));
  root.querySelectorAll<HTMLElement>('h1, h2, h3, h4').forEach(el => add(el, 150));
  root.querySelectorAll<HTMLElement>('li').forEach(el => add(el, 100));
  root.querySelectorAll<HTMLElement>('p').forEach(el => add(el, 70));

  // Divs with visible spacing (section-like separators)
  root.querySelectorAll<HTMLElement>('div').forEach(el => {
    const cs = window.getComputedStyle(el);
    const spacing = (parseFloat(cs.marginTop) || 0) + (parseFloat(cs.marginBottom) || 0);
    if (spacing >= 12) add(el, 80);
  });

  return results.sort((a, b) => a.topPx - b.topPx);
}

function findBreakPoint(
  candidates: BreakCandidate[],
  pageStartCss: number,
  pageHeightCss: number,
): number {
  const pageEndCss = pageStartCss + pageHeightCss;
  const minBreak = pageStartCss + pageHeightCss * 0.6;

  let bestPos = -1;
  let bestScore = -Infinity;

  for (const c of candidates) {
    // Break at element TOP — element moves to next page
    if (c.topPx > minBreak && c.topPx <= pageEndCss) {
      const fill = (c.topPx - pageStartCss) / pageHeightCss;
      const score = c.priority + fill * 200;
      if (score > bestScore) { bestScore = score; bestPos = c.topPx; }
    }
    // Break at element BOTTOM — element stays on this page
    if (c.bottomPx > minBreak && c.bottomPx <= pageEndCss) {
      const fill = (c.bottomPx - pageStartCss) / pageHeightCss;
      const score = c.priority * 0.8 + fill * 200;
      if (score > bestScore) { bestScore = score; bestPos = c.bottomPx; }
    }
    if (c.topPx > pageEndCss + 100) break;
  }

  if (bestPos < 0) return pageHeightCss;
  return Math.max(pageHeightCss * 0.55, bestPos - pageStartCss);
}

// ─── Core render ─────────────────────────────────────────────────────────────

async function renderElementToPDFBlob(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const { quality = 0.95, scale = 2 } = options;

  await waitForFonts();

  // Convert images to base64 in the LIVE dom
  const imgs = Array.from(element.querySelectorAll<HTMLImageElement>('img'));
  const origSrcs: string[] = [];
  await Promise.all(imgs.map(async (img, i) => {
    origSrcs[i] = img.getAttribute('src') || '';
    if (origSrcs[i] && !origSrcs[i].startsWith('data:')) {
      img.setAttribute('src', await toBase64(origSrcs[i]));
    }
  }));
  await Promise.all(imgs.map(img =>
    img.complete ? Promise.resolve() : new Promise<void>(r => { img.onload = img.onerror = () => r(); })
  ));

  await new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r())));
  window.scrollTo(0, 0);

  // Measure break points and footer in the live DOM
  const breakCandidates = collectBreaks(element);
  const liveRect = element.getBoundingClientRect();
  const liveHeight = liveRect.height;

  const footerEl = element.querySelector<HTMLElement>('[data-pdf-footer]');
  let footerTopRatio = 1;
  let footerHeightRatio = 0;
  if (footerEl) {
    const fRect = footerEl.getBoundingClientRect();
    footerTopRatio = (fRect.top - liveRect.top) / liveHeight;
    footerHeightRatio = fRect.height / liveHeight;
  }

  // Create off-screen clone with all styles baked in
  const clone = element.cloneNode(true) as HTMLElement;
  bakeStyles(element, clone);

  // Restore live images
  imgs.forEach((img, i) => { if (origSrcs[i]) img.setAttribute('src', origSrcs[i]); });

  // Set clone root dimensions
  clone.style.width = `${A4_WIDTH_PX}px`;
  clone.style.minWidth = `${A4_WIDTH_PX}px`;
  clone.style.maxWidth = `${A4_WIDTH_PX}px`;
  clone.style.height = 'auto';
  clone.style.minHeight = 'auto';
  clone.style.maxHeight = 'none';
  clone.style.transform = 'none';
  clone.style.boxShadow = 'none';
  clone.style.borderRadius = '0';
  clone.style.overflow = 'visible';
  clone.style.position = 'absolute';
  clone.style.top = '0';
  clone.style.left = '-9999px';

  // Append clone to body for rendering
  document.body.appendChild(clone);
  prepareClone(clone, element);

  // Force layout calc
  await new Promise<void>(r => requestAnimationFrame(() => r()));

  console.log('[PDF] Clone size:', clone.scrollWidth, 'x', clone.scrollHeight);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await (html2canvas as any)(clone, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      logging: false,
      imageTimeout: 0,
      windowWidth: A4_WIDTH_PX,
      width: A4_WIDTH_PX,
      height: clone.scrollHeight,
    });
  } finally {
    document.body.removeChild(clone);
  }

  console.log('[PDF] Canvas:', canvas.width, 'x', canvas.height);

  // ─── Slice into pages ────────────────────────────────────────────────────
  const canvasPageH = PAGE_HEIGHT_PX * scale;
  const cssToCanvas = canvas.height / liveHeight;

  const footerStartCanvas = Math.round(footerTopRatio * canvas.height);
  const footerHCanvas = Math.round(footerHeightRatio * canvas.height);
  const hasFooter = footerEl != null && footerHCanvas > 10;

  const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  // Single page case
  if (canvas.height <= canvasPageH * 1.02) {
    const pc = document.createElement('canvas');
    pc.width = canvas.width;
    pc.height = canvasPageH;
    const ctx = pc.getContext('2d')!;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, pc.width, pc.height);
    // Draw content (minus footer)
    if (hasFooter) {
      ctx.drawImage(canvas, 0, 0, canvas.width, footerStartCanvas, 0, 0, canvas.width, footerStartCanvas);
      // Footer at page bottom
      const fy = canvasPageH - footerHCanvas;
      ctx.drawImage(canvas, 0, footerStartCanvas, canvas.width, footerHCanvas, 0, fy, canvas.width, footerHCanvas);
    } else {
      ctx.drawImage(canvas, 0, 0);
    }
    pdfDoc.addImage(pc.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, A4_WIDTH_MM, A4_HEIGHT_MM, undefined, 'FAST');
  } else {
    // Multi-page
    const pageHCss = PAGE_HEIGHT_PX; // CSS pixels per page
    let offsetCss = 0;
    const slicesCss: number[] = [];

    // Paginate the content (excluding footer)
    const contentEndCss = hasFooter ? footerTopRatio * liveHeight : liveHeight;

    while (offsetCss < contentEndCss && slicesCss.length < 30) {
      const remaining = contentEndCss - offsetCss;

      // If remaining + footer fits on one page, take it all
      const footerHCss = footerHeightRatio * liveHeight;
      if (remaining + footerHCss <= pageHCss * 1.02) {
        slicesCss.push(remaining);
        break;
      }
      if (remaining <= pageHCss * 1.02) {
        slicesCss.push(remaining);
        break;
      }

      const sliceH = findBreakPoint(breakCandidates, offsetCss, pageHCss);
      slicesCss.push(sliceH);
      offsetCss += sliceH;
    }

    // Render each page
    let runOffset = 0;
    for (let p = 0; p < slicesCss.length; p++) {
      const sliceH = slicesCss[p];
      const isLast = p === slicesCss.length - 1;

      const srcY = Math.round(runOffset * cssToCanvas);
      const srcH = Math.round(sliceH * cssToCanvas);

      const pc = document.createElement('canvas');
      pc.width = canvas.width;
      // Last page: always full A4 height so footer sits at bottom
      pc.height = isLast && hasFooter ? canvasPageH : Math.min(srcH, canvasPageH);
      const ctx = pc.getContext('2d')!;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, pc.width, pc.height);

      // Draw content slice
      ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH);

      // Last page: footer at very bottom
      if (isLast && hasFooter && footerHCanvas > 0) {
        const fy = pc.height - footerHCanvas;
        ctx.drawImage(canvas, 0, footerStartCanvas, canvas.width, footerHCanvas, 0, fy, canvas.width, footerHCanvas);
      }

      if (p > 0) pdfDoc.addPage();
      const pageMMH = (isLast && hasFooter) ? A4_HEIGHT_MM : (pc.height / scale) * (A4_WIDTH_MM / A4_WIDTH_PX);
      pdfDoc.addImage(pc.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, A4_WIDTH_MM, pageMMH, undefined, 'FAST');

      console.log(`[PDF] Page ${p + 1}: css=${runOffset.toFixed(0)}-${(runOffset + sliceH).toFixed(0)} canvas=${srcY}-${srcY + srcH}${isLast && hasFooter ? ' +footer' : ''}`);
      runOffset += sliceH;
    }
    console.log('[PDF] Total:', slicesCss.length, 'pages');
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
  const safe = name.replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  await exportElementToPDF(cvRef.current, {
    ...options,
    filename: `Lebenslauf_${safe}_${new Date().toISOString().split('T')[0]}.pdf`,
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

export function debugLogPDFHtml(
  cvRef: React.RefObject<HTMLElement> | HTMLElement | null
): void {
  const el = cvRef instanceof HTMLElement ? cvRef : cvRef?.current;
  if (!el) { console.warn('[PDF Debug] No element found.'); return; }
  console.log('[PDF Debug]', el.offsetWidth, 'x', el.offsetHeight);
}
