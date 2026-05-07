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
    console.warn('[PDF Export] Could not convert image to base64:', src?.substring(0, 80), err);
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

function isPlaceholderValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === '' || PLACEHOLDER_STRINGS.has(v);
}

// ── Pixel-freeze: copy critical computed styles from live element to clone element ──
// Reads width, height, font-size, line-height, letter-spacing from the live DOM
// and writes them as explicit px inline values on the clone so the html2canvas
// iframe sees the exact same metrics as the editor.
function freezeComputedStyles(liveEl: HTMLElement, cloneEl: HTMLElement): void {
  const cs = window.getComputedStyle(liveEl);

  // Width: only freeze if it's already a pixel value (skip 'auto' / percentage on
  // elements that should naturally shrink-wrap).
  const w = cs.width;
  if (w && w.endsWith('px') && parseFloat(w) > 0) {
    cloneEl.style.setProperty('width', w, 'important');
  }

  // Font metrics — always freeze these so text renders identically.
  const fontSize = cs.fontSize;
  if (fontSize) cloneEl.style.setProperty('font-size', fontSize, 'important');

  const lineHeight = cs.lineHeight;
  if (lineHeight && lineHeight !== 'normal') {
    cloneEl.style.setProperty('line-height', lineHeight, 'important');
  }

  const letterSpacing = cs.letterSpacing;
  if (letterSpacing && letterSpacing !== 'normal') {
    cloneEl.style.setProperty('letter-spacing', letterSpacing, 'important');
  }

  // Color / background — freeze so theme colours don't drift.
  const color = cs.color;
  if (color) cloneEl.style.setProperty('color', color, 'important');

  const bg = cs.backgroundColor;
  if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') {
    cloneEl.style.setProperty('background-color', bg, 'important');
  }
}

function prepareCloneForPrint(cloneDoc: Document, liveRoot: HTMLElement | null): void {
  const body = cloneDoc.body;

  // 1. STABILISIERUNGS-CSS INJIZIEREN (Verhindert Text-Umbrüche und Skalierungsfehler)
  const animStyleEl = cloneDoc.createElement('style');
  animStyleEl.textContent = `
    *, *::before, *::after {
      animation: none !important;
      transition: none !important;
      box-sizing: border-box !important;
      text-rendering: optimizeLegibility !important;
      -webkit-font-smoothing: antialiased !important;
    }
    /* Verhindert das radikale Umbrechen von Wörtern durch html2canvas */
    span, p, div, li {
      white-space: pre-wrap !important; 
      word-break: keep-all !important;
      overflow-wrap: normal !important;
    }
    [data-pdf-root] {
      width: ${A4_WIDTH_PX}px !important;
      min-width: ${A4_WIDTH_PX}px !important;
      max-width: ${A4_WIDTH_PX}px !important;
      transform: none !important;
    }
    .cv-scale-wrapper { transform: none !important; width: 100% !important; }
  `;
  cloneDoc.head.appendChild(animStyleEl);

  // 2. PIXEL-FREEZE: MAẞE VOM LIVE-DOM KOPIEREN
  const cloneRootEl = cloneDoc.querySelector<HTMLElement>('[data-pdf-root]');
  
  if (liveRoot && cloneRootEl) {
    const liveEls = [liveRoot, ...Array.from(liveRoot.querySelectorAll<HTMLElement>('*'))];
    const cloneEls = [cloneRootEl, ...Array.from(cloneRootEl.querySelectorAll<HTMLElement>('*'))];
    
    const len = Math.min(liveEls.length, cloneEls.length);
    
    for (let i = 0; i < len; i++) {
      const liveEl = liveEls[i];
      const cloneEl = cloneEls[i];
      const cs = window.getComputedStyle(liveEl);

      // Fixiere Geometrie: Wenn das Wort im Browser in den Container passt, passt es jetzt auch im PDF
      if (cs.width && cs.width !== 'auto') cloneEl.style.width = cs.width;
      
      // Fixiere Typografie: Verhindert, dass Zeilenabstände im PDF driften
      cloneEl.style.fontSize = cs.fontSize;
      cloneEl.style.lineHeight = cs.lineHeight;
      cloneEl.style.letterSpacing = cs.letterSpacing;
      cloneEl.style.fontFamily = cs.fontFamily;
      
      // Fixiere Layout-Kontext
      if (cs.display === 'flex' || cs.display === 'grid') {
        cloneEl.style.display = cs.display;
        if (cs.display === 'grid') {
          cloneEl.style.gridTemplateColumns = cs.gridTemplateColumns;
          cloneEl.style.gap = cs.gap;
        }
      }
    }
  }

  // 3. BEREINIGUNG (Placeholder und Editor-UI entfernen)
  cloneDoc.querySelectorAll<HTMLElement>('button, [data-pdf-hidden], .pdf-hidden').forEach(el => el.remove());

  // 4. INPUTS ZU TEXT KONVERTIEREN
  cloneDoc.querySelectorAll<HTMLInputElement>('input, textarea').forEach((el) => {
    const val = (el as HTMLInputElement).value || '';
    if (isPlaceholderValue(val)) {
      (el.closest('li, [data-pdf-field-wrap]') || el).remove();
    } else {
      const span = cloneDoc.createElement('span');
      span.textContent = val;
      el.parentNode?.replaceChild(span, el);
    }
  });
}
  // ── 1. Pixel-freeze: walk every element inside [data-pdf-root] ───────────
  // Build a parallel index from the live DOM so we can read computed styles.
  const cloneRootEl =
    cloneDoc.querySelector<HTMLElement>('[data-pdf-root]') ||
    (cloneDoc.body.firstElementChild as HTMLElement | null);

  if (liveRoot && cloneRootEl) {
    const liveEls = Array.from(liveRoot.querySelectorAll<HTMLElement>('*'));
    const cloneEls = Array.from(cloneRootEl.querySelectorAll<HTMLElement>('*'));
    const len = Math.min(liveEls.length, cloneEls.length);
    for (let i = 0; i < len; i++) {
      freezeComputedStyles(liveEls[i], cloneEls[i]);
    }
    // Also freeze the root itself
    freezeComputedStyles(liveRoot, cloneRootEl);
  }

  // ── 2. Remove editor-only UI elements ────────────────────────────────────
  cloneDoc.querySelectorAll<HTMLElement>(
    'button, [data-pdf-hidden], .pdf-hidden, .print\\:hidden'
  ).forEach((el) => el.remove());

  // ── 3. Replace <input> → <span> ──────────────────────────────────────────
  cloneDoc.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
    const val = input.value || '';
    if (isPlaceholderValue(val)) {
      (input.closest('li, [data-pdf-field-wrap]') || input).remove();
      return;
    }
    const span = cloneDoc.createElement('span');
    const cs = window.getComputedStyle(input);
    span.textContent = val;
    span.style.display = 'inline';
    span.style.background = 'transparent';
    span.style.border = 'none';
    span.style.outline = 'none';
    span.style.fontSize = cs.fontSize || '10px';
    span.style.fontWeight = cs.fontWeight || '400';
    span.style.color = cs.color || '#1e293b';
    span.style.fontFamily = cs.fontFamily;
    span.style.lineHeight = cs.lineHeight || '1.4';
    span.style.letterSpacing = cs.letterSpacing || 'normal';
    input.parentNode?.replaceChild(span, input);
  });

  // ── 4. Replace <textarea> → <div> ────────────────────────────────────────
  cloneDoc.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((ta) => {
    const val = ta.value || '';
    if (isPlaceholderValue(val)) {
      (ta.closest('li, [data-pdf-field-wrap]') || ta).remove();
      return;
    }
    const div = cloneDoc.createElement('div');
    const cs = window.getComputedStyle(ta);
    div.textContent = val;
    div.style.display = 'block';
    div.style.background = 'transparent';
    div.style.border = 'none';
    div.style.outline = 'none';
    div.style.resize = 'none';
    div.style.overflow = 'visible';
    div.style.height = 'auto';
    div.style.whiteSpace = 'pre-wrap';
    div.style.fontSize = cs.fontSize || '10px';
    div.style.fontWeight = cs.fontWeight || '400';
    div.style.color = cs.color || '#1e293b';
    div.style.fontFamily = cs.fontFamily;
    div.style.lineHeight = cs.lineHeight || '1.4';
    ta.parentNode?.replaceChild(div, ta);
  });

  // ── 5. Strip contentEditable ──────────────────────────────────────────────
  cloneDoc.querySelectorAll<HTMLElement>('[contenteditable]').forEach((el) => {
    const text = el.textContent?.trim() ?? '';
    const cs = window.getComputedStyle(el);
    el.removeAttribute('contenteditable');
    el.removeAttribute('data-placeholder');
    el.style.outline = 'none';
    el.style.cursor = 'default';
    Array.from(el.classList)
      .filter((c) => c.startsWith('empty:') || c === 'cursor-text' || c === 'outline-none')
      .forEach((c) => el.classList.remove(c));

    if (isPlaceholderValue(text)) {
      el.style.setProperty('display', 'none', 'important');
      el.textContent = '';
      return;
    }
    el.style.whiteSpace = 'normal';
    if (cs.textAlign) el.style.textAlign = cs.textAlign;
    if (cs.fontSize) el.style.setProperty('font-size', cs.fontSize, 'important');
    if (cs.fontWeight) el.style.setProperty('font-weight', cs.fontWeight, 'important');
    if (cs.lineHeight && cs.lineHeight !== 'normal') {
      el.style.setProperty('line-height', cs.lineHeight, 'important');
    }
    if (cs.color) el.style.setProperty('color', cs.color, 'important');
  });

  // ── 6. Convert all <img> → background-image <div> ────────────────────────
  // html2canvas mishandles object-fit; background-size:cover is reliable.
  cloneDoc.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!src) return;

    const preW = img.getAttribute('data-pdf-w') || '';
    const preH = img.getAttribute('data-pdf-h') || '';
    const preFit = img.getAttribute('data-pdf-fit') || 'cover';

    if (preFit === 'cover' && preW && preH) {
      const div = cloneDoc.createElement('div');
      div.style.backgroundImage = `url('${src}')`;
      div.style.backgroundSize = 'cover';
      div.style.backgroundPosition = 'center center';
      div.style.backgroundRepeat = 'no-repeat';
      div.style.width = preW;
      div.style.height = preH;
      div.style.flexShrink = '0';
      div.style.display = 'block';
      // Copy border-radius from parent (circular frames)
      if (img.parentElement) {
        const parentCs = window.getComputedStyle(img.parentElement);
        if (parentCs.borderRadius && parentCs.borderRadius !== '0px') {
          div.style.borderRadius = parentCs.borderRadius;
          img.parentElement.style.overflow = 'hidden';
        }
      }
      const imgCs = window.getComputedStyle(img);
      if (imgCs.borderRadius && imgCs.borderRadius !== '0px') {
        div.style.borderRadius = imgCs.borderRadius;
        div.style.overflow = 'hidden';
      }
      img.parentNode?.replaceChild(div, img);
    } else {
      if (preW) img.style.setProperty('width', preW, 'important');
      if (preH) img.style.setProperty('height', preH, 'important');
      img.style.display = 'block';
      img.style.flexShrink = '0';
    }
  });

  // ── 7. Date badges ────────────────────────────────────────────────────────
  cloneDoc.querySelectorAll<HTMLElement>('[data-pdf-date-badge]').forEach((badge) => {
    badge.style.removeProperty('gap');
    Array.from(badge.children).forEach((child) => {
      (child as HTMLElement).style.setProperty('margin-right', '3px', 'important');
    });
    const allText = Array.from(badge.querySelectorAll('span, [contenteditable]'))
      .map((e) => e.textContent?.trim() ?? '')
      .filter((t) => t.length > 0 && t !== '–' && !isPlaceholderValue(t));
    if (allText.length === 0) {
      badge.style.setProperty('display', 'none', 'important');
    }
  });

  // ── 8. Force Tailwind responsive classes inline ───────────────────────────
  // md:grid-cols-N
  cloneDoc.querySelectorAll<HTMLElement>('[class*="md:grid-cols-"]').forEach((el) => {
    const match = Array.from(el.classList).find((c) => c.startsWith('md:grid-cols-'));
    if (!match) return;
    const cols = match.replace('md:grid-cols-', '');
    el.style.setProperty('display', 'grid', 'important');
    el.style.setProperty('grid-template-columns', `repeat(${cols}, minmax(0, 1fr))`, 'important');
    const computedGap = window.getComputedStyle(el).columnGap;
    const gapPx = computedGap && computedGap !== 'normal' && computedGap !== '0px' ? computedGap : '24px';
    el.style.setProperty('column-gap', gapPx, 'important');
    el.style.setProperty('row-gap', gapPx, 'important');
  });

  // md:col-span-N
  cloneDoc.querySelectorAll<HTMLElement>('[class*="md:col-span-"]').forEach((el) => {
    const match = Array.from(el.classList).find((c) => c.startsWith('md:col-span-'));
    if (!match) return;
    const span = match.replace('md:col-span-', '');
    el.style.setProperty('grid-column', `span ${span} / span ${span}`, 'important');
    el.style.setProperty('min-width', '0', 'important');
  });

  // fr-unit grid columns → pixel values
  cloneDoc.querySelectorAll<HTMLElement>('[style*="fr"]').forEach((el) => {
    const inlineCols = el.style.gridTemplateColumns;
    if (!inlineCols || !inlineCols.includes('fr')) return;
    const cs = window.getComputedStyle(el);
    const computedCols = cs.gridTemplateColumns;
    if (computedCols && computedCols !== 'none' && !computedCols.includes('fr')) {
      el.style.setProperty('grid-template-columns', computedCols, 'important');
    } else {
      const containerW = el.getBoundingClientRect().width || A4_WIDTH_PX;
      const inlineGap = el.style.columnGap || el.style.gap?.split(' ')[1] || '0';
      const gapPx = parseFloat(inlineGap) || 0;
      const frParts = inlineCols.trim().split(/\s+/);
      const frValues = frParts.map((p) => {
        const m = p.match(/^([\d.]+)fr$/);
        return m ? parseFloat(m[1]) : null;
      });
      const allFr = frValues.every((v) => v !== null);
      if (allFr && frValues.length >= 2) {
        const totalFr = frValues.reduce((s, v) => s! + v!, 0)!;
        const gapTotal = gapPx * (frValues.length - 1);
        const usable = containerW - gapTotal;
        const pixelCols = frValues.map((v) => `${Math.round((v! / totalFr) * usable)}px`).join(' ');
        el.style.setProperty('grid-template-columns', pixelCols, 'important');
        if (gapPx > 0) {
          el.style.setProperty('column-gap', `${gapPx}px`, 'important');
        }
      }
    }
  });

  // md:flex-row / md:flex-col
  cloneDoc.querySelectorAll<HTMLElement>('[class*="md:flex-row"]').forEach((el) => {
    el.style.setProperty('flex-direction', 'row', 'important');
  });
  cloneDoc.querySelectorAll<HTMLElement>('[class*="md:flex-col"]').forEach((el) => {
    el.style.setProperty('flex-direction', 'column', 'important');
  });
  cloneDoc.querySelectorAll<HTMLElement>('[class*="sm:flex-row"]').forEach((el) => {
    el.style.setProperty('flex-direction', 'row', 'important');
  });
  cloneDoc.querySelectorAll<HTMLElement>('[class*="sm:px-0"]').forEach((el) => {
    el.style.setProperty('padding-left', '0', 'important');
    el.style.setProperty('padding-right', '0', 'important');
  });

  // md:w-N / md:hidden / md:block / md:flex / md:grid
  cloneDoc.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const classes = Array.from(el.classList);
    const mdW = classes.find((c) => c.startsWith('md:w-'));
    if (mdW) {
      const val = mdW.replace('md:w-', '');
      const fractionMap: Record<string, string> = {
        '1/2': '50%', '1/3': '33.333%', '2/3': '66.667%',
        '1/4': '25%', '3/4': '75%', '2/5': '40%', '3/5': '60%',
        'full': '100%',
      };
      if (fractionMap[val]) el.style.setProperty('width', fractionMap[val], 'important');
    }
    if (classes.includes('md:hidden')) el.style.setProperty('display', 'none', 'important');
    if (classes.includes('md:block')) el.style.setProperty('display', 'block', 'important');
    if (classes.includes('md:flex')) el.style.setProperty('display', 'flex', 'important');
    if (classes.includes('md:inline-flex')) el.style.setProperty('display', 'inline-flex', 'important');
    if (classes.includes('md:grid')) el.style.setProperty('display', 'grid', 'important');
  });

  // ── 9. Classic template sidebar pixel widths ──────────────────────────────
  cloneDoc.querySelectorAll<HTMLElement>('[class*="w-2/5"]').forEach((el) => {
    el.style.setProperty('width', '317px', 'important');
    el.style.setProperty('min-width', '317px', 'important');
    el.style.setProperty('flex-shrink', '0', 'important');
    el.style.setProperty('max-width', '317px', 'important');
  });
  cloneDoc.querySelectorAll<HTMLElement>('.flex-1').forEach((el) => {
    const parent = el.parentElement;
    if (parent && window.getComputedStyle(parent).display === 'flex') {
      el.style.setProperty('flex', '1 1 0%', 'important');
      el.style.setProperty('min-width', '0', 'important');
    }
  });

  // ── 10. Root width enforcement & scale removal ────────────────────────────
  const root =
    body.querySelector<HTMLElement>('[data-pdf-root]') ||
    (body.firstElementChild as HTMLElement | null);

  if (root) {
    root.style.setProperty('width', `${A4_WIDTH_PX}px`, 'important');
    root.style.setProperty('min-width', `${A4_WIDTH_PX}px`, 'important');
    root.style.setProperty('max-width', `${A4_WIDTH_PX}px`, 'important');
    root.style.setProperty('height', 'auto', 'important');
    root.style.setProperty('max-height', 'none', 'important');
    root.style.setProperty('overflow', 'visible', 'important');
    root.style.setProperty('aspect-ratio', 'unset', 'important');
    root.style.setProperty('position', 'relative', 'important');
    root.style.setProperty('box-shadow', 'none', 'important');
    root.style.setProperty('border-radius', '0', 'important');
    root.style.setProperty('padding', '0', 'important');
    root.style.setProperty('transform', 'none', 'important');
    root.style.setProperty('margin', '0', 'important');

    // Strip scale wrappers that distort the coordinate system
    root.querySelectorAll<HTMLElement>('.cv-scale-wrapper, [class*="scale-"]').forEach((el) => {
      el.style.setProperty('transform', 'none', 'important');
      el.style.setProperty('width', `${A4_WIDTH_PX}px`, 'important');
      el.style.setProperty('margin', '0', 'important');
    });

    const wrapperEl = root.firstElementChild as HTMLElement | null;
    if (wrapperEl) {
      wrapperEl.style.setProperty('width', '100%', 'important');
      wrapperEl.style.setProperty('max-width', '100%', 'important');
      wrapperEl.style.setProperty('padding', '0', 'important');
      wrapperEl.style.setProperty('margin', '0', 'important');
      wrapperEl.style.setProperty('transform', 'none', 'important');

      const templateRootEl = wrapperEl.firstElementChild as HTMLElement | null;
      if (templateRootEl) {
        templateRootEl.style.setProperty('width', '100%', 'important');
        templateRootEl.style.setProperty('max-width', '100%', 'important');
        templateRootEl.style.setProperty('min-width', '0', 'important');
        templateRootEl.style.setProperty('margin-left', '0', 'important');
        templateRootEl.style.setProperty('margin-right', '0', 'important');
        templateRootEl.style.setProperty('box-shadow', 'none', 'important');
        templateRootEl.style.setProperty('transform', 'none', 'important');
      }
    }
  }

  // ── 11. Global pass: overflow visible, height unlocks, positioning ─────────
  const HEIGHT_LOCK_CLASSES = [
    'h-screen', 'h-dvh', 'h-lvh', 'h-svh', 'h-full',
    'max-h-screen', 'max-h-full', 'overflow-auto', 'overflow-scroll',
    'sticky', 'fixed',
  ];

  const templateRoot =
    cloneDoc.querySelector<HTMLElement>('[data-pdf-root]') ||
    (cloneDoc.body.firstElementChild as HTMLElement | null);

  cloneDoc.querySelectorAll<HTMLElement>('*').forEach((el) => {
    HEIGHT_LOCK_CLASSES.forEach((cls) => el.classList.remove(cls));
    Array.from(el.classList)
      .filter((c) => c.startsWith('aspect-'))
      .forEach((c) => el.classList.remove(c));

    const s = el.style;
    const isInsideTemplate = templateRoot ? templateRoot.contains(el) : false;
    const cs = window.getComputedStyle(el);

    // Height resets — auto so content flows freely
    if (s.height && s.height !== 'auto') s.height = 'auto';
    if (s.maxHeight) s.maxHeight = 'none';
    if (s.minHeight && (s.minHeight.includes('vh') || s.minHeight.includes('%') || s.minHeight === '100dvh' || s.minHeight === '100svh')) {
      s.minHeight = 'auto';
    }
    if (s.aspectRatio) s.aspectRatio = 'unset';

    const hasBorderRadius = cs.borderRadius && cs.borderRadius !== '0px' && cs.borderRadius !== '0';
    const isImageContainer = el.tagName === 'IMG' || el.style.backgroundImage !== '' ||
      (el.querySelector('img') !== null && !el.querySelector('[data-chip-row]'));

    // Overflow: always visible except on image/rounded containers
    if (!isImageContainer && !hasBorderRadius) {
      s.setProperty('overflow', 'visible', 'important');
      s.setProperty('overflow-x', 'visible', 'important');
      s.setProperty('overflow-y', 'visible', 'important');
    } else if (!isImageContainer) {
      if (cs.overflow === 'auto' || cs.overflow === 'scroll') s.overflow = 'visible';
    }

    // Fix fixed/sticky positioning
    const pos = cs.position;
    if (pos === 'fixed' || pos === 'sticky') {
      s.setProperty('position', 'relative', 'important');
      s.setProperty('top', 'unset', 'important');
      s.setProperty('left', 'unset', 'important');
      s.setProperty('right', 'unset', 'important');
      s.setProperty('bottom', 'unset', 'important');
      s.setProperty('transform', 'none', 'important');
    } else if (pos === 'absolute' && !isInsideTemplate) {
      s.position = 'relative';
      s.top = 'unset';
      s.left = 'unset';
      s.right = 'unset';
      s.bottom = 'unset';
      s.transform = 'none';
    }
  });

  // ── 12. Flex gap → explicit margins (preserve flex context) ───────────────
  cloneDoc.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const classes = Array.from(el.classList);
    const cs = window.getComputedStyle(el);
    const display = cs.display;

    if (display !== 'flex' && display !== 'inline-flex') return;
    if (cs.flexWrap !== 'wrap' && cs.flexWrap !== 'wrap-reverse') return;

    // Read gap from computed style — most reliable source
    const computedGap = parseFloat(cs.gap || cs.columnGap || '0') || 0;
    // Fallback: Tailwind gap class
    const gapClass = classes.find((c) => /^gap-/.test(c));
    const tailwindGap = gapClass ? (parseFloat(gapClass.replace('gap-', '')) || 0) * 4 : 0;
    const gapPx = computedGap || tailwindGap;

    if (gapPx > 0) {
      el.setAttribute('data-chip-row', '1');
      el.style.setProperty('gap', '0', 'important');
      el.style.setProperty('overflow', 'visible', 'important');
      Array.from(el.children).forEach((child) => {
        const c = child as HTMLElement;
        if (window.getComputedStyle(c).display === 'none') return;
        c.style.setProperty('margin-right', `${gapPx}px`, 'important');
        c.style.setProperty('margin-bottom', `${gapPx}px`, 'important');
      });
    }
  });

  // ── 13. Fix role/company stacking in job entries ──────────────────────────
  cloneDoc.querySelectorAll<HTMLElement>('*').forEach((el) => {
    if (el.style.display !== 'flex') return;
    if (el.style.justifyContent !== 'space-between') return;
    const firstChild = el.firstElementChild as HTMLElement | null;
    if (!firstChild) return;
    const fc = firstChild.style.flex || firstChild.style.flexGrow || '';
    if (!fc.startsWith('1')) return;
    const blockChildren = Array.from(firstChild.children).filter(
      (c) => (c as HTMLElement).tagName === 'DIV'
    );
    if (blockChildren.length >= 2) {
      el.style.setProperty('align-items', 'flex-start', 'important');
      firstChild.style.setProperty('display', 'block', 'important');
      firstChild.style.setProperty('flex', '1 1 0%', 'important');
      firstChild.style.setProperty('min-width', '0', 'important');
      blockChildren.forEach((c) => {
        (c as HTMLElement).style.setProperty('display', 'block', 'important');
      });
    }
  });

  // ── 14. Page-level resets ─────────────────────────────────────────────────
  body.style.setProperty('margin', '0', 'important');
  body.style.setProperty('padding', '0', 'important');
  body.style.setProperty('overflow', 'visible', 'important');
  body.style.setProperty('height', 'auto', 'important');
  body.style.setProperty('min-height', '0', 'important');
  body.style.setProperty('width', `${A4_WIDTH_PX}px`, 'important');

  // ── 15. Final stabilization CSS (lowest specificity, !important overrides) ─
  const styleEl = cloneDoc.createElement('style');
  styleEl.textContent = `
    }
    body {
      font-family: 'Inter', 'Roboto', 'Open Sans', Arial, Helvetica, sans-serif !important;
    }
    [data-chip-row] {
      overflow: visible !important;
    }
    [data-chip-row] > * {
      vertical-align: middle !important;
    }
    [data-pdf-bullet-row] {
      display: flex !important;
      align-items: flex-start !important;
      gap: 0 !important;
      margin-bottom: 5px !important;
    }
    [data-pdf-bullet-dot] {
      display: inline-block !important;
      width: 5px !important;
      height: 5px !important;
      min-width: 5px !important;
      min-height: 5px !important;
      border-radius: 50% !important;
      margin-top: 5px !important;
      margin-right: 7px !important;
      flex-shrink: 0 !important;
    }
    [data-pdf-bullet-row] > :last-child {
      display: block !important;
      flex: 1 !important;
      word-break: break-word !important;
      white-space: pre-wrap !important;
    }
    [data-pdf-summary] {
      overflow: visible !important;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
    }
    [data-pdf-date-badge] {
      display: inline-flex !important;
      align-items: center !important;
      flex-shrink: 0 !important;
      white-space: nowrap !important;
    }
  }
  )
  `;
  (cloneDoc.head || cloneDoc.documentElement).appendChild(styleEl);
}

async function waitForFonts(): Promise<void> {
  // Gate 1: wait until FontFaceSet reports 'loaded'
  if ((document as any).fonts) {
    const fonts = (document as any).fonts;
    if (fonts.status !== 'loaded') {
      await fonts.ready;
    }
    // Explicitly load weights used by CV templates
    const faces = [
      '400 12px Inter', '500 12px Inter', '600 12px Inter', '700 12px Inter',
      '400 12px Roboto', '600 12px Roboto', '700 12px Roboto',
      '400 12px "Open Sans"', '600 12px "Open Sans"', '700 12px "Open Sans"',
      '400 12px Georgia', '700 12px Georgia',
    ];
    await Promise.all(faces.map((f) => fonts.load(f).catch(() => {})));
    // Gate 2: confirm loaded again after explicit loads
    await fonts.ready;
  }
  // 500ms rAF settle — layout must be fully painted before we snapshot
  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      setTimeout(resolve, 500);
    }));
  });
}

async function renderElementToPDFBlob(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const { quality = 0.95, scale = 2 } = options;

  // ── Step 1: Font readiness ────────────────────────────────────────────────
  await waitForFonts();

  // ── Step 2: Pre-fetch images as base64 & stamp dimensions ─────────────────
  console.log('[PDF Export] Pre-fetching images...');
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
  liveImages.forEach((img) => {
    const cs = window.getComputedStyle(img);
    img.setAttribute('data-pdf-w', cs.width || img.style.width || '80px');
    img.setAttribute('data-pdf-h', cs.height || img.style.height || '80px');
    img.setAttribute('data-pdf-fit', cs.objectFit || img.style.objectFit || 'cover');
  });

  // ── Step 3: Wait for all images to load ───────────────────────────────────
  await Promise.all(
    Array.from(element.querySelectorAll<HTMLImageElement>('img')).map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => res();
      });
    })
  );

  window.scrollTo(0, 0);

  // ── Step 4: Collect live CSS for injection into clone ─────────────────────
  const liveCSS: string[] = [];
  try {
    Array.from(document.styleSheets).forEach((sheet) => {
      try {
        liveCSS.push(Array.from(sheet.cssRules || []).map((r) => r.cssText).join('\n'));
      } catch { /* cross-origin */ }
    });
  } catch { /* ignore */ }
  const liveCSSText = liveCSS.join('\n');

  console.log('[PDF Export] Rendering canvas (scale:', scale, ')...');

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
      windowWidth: A4_WIDTH_PX,
      width: A4_WIDTH_PX,
      height: element.scrollHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (cloneDoc: Document) => {
        // Inject live CSS first so our !important overrides win
        if (liveCSSText) {
          const liveStyleEl = cloneDoc.createElement('style');
          liveStyleEl.textContent = liveCSSText;
          (cloneDoc.head || cloneDoc.documentElement).insertBefore(
            liveStyleEl,
            (cloneDoc.head || cloneDoc.documentElement).firstChild
          );
        }
        prepareCloneForPrint(cloneDoc, element);
      },
    });
  } catch (err: any) {
    console.error('[PDF Export] html2canvas error:', err);
    throw new Error('PDF-Generierung fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler'));
  } finally {
    liveImages.forEach((img) => {
      const originalSrc = img.getAttribute('data-original-src');
      if (originalSrc) {
        img.setAttribute('src', originalSrc);
        img.removeAttribute('data-original-src');
      }
      img.removeAttribute('data-pdf-w');
      img.removeAttribute('data-pdf-h');
      img.removeAttribute('data-pdf-fit');
    });
  }

  console.log('[PDF Export] Canvas:', canvas.width, 'x', canvas.height, 'px');

  // ── Step 5: Render footer separately (if present) ────────────────────────
  const footerElement = element.querySelector<HTMLElement>('[data-pdf-footer]');
  let footerCanvas: HTMLCanvasElement | null = null;
  let footerHeightPx = 0;

  if (footerElement) {
    try {
      footerCanvas = await (html2canvas as any)(footerElement, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        windowWidth: A4_WIDTH_PX,
        width: A4_WIDTH_PX,
        onclone: (cloneDoc: Document) => {
          prepareCloneForPrint(cloneDoc, footerElement);
          const footerClone = cloneDoc.querySelector<HTMLElement>('[data-pdf-footer]');
          if (footerClone) {
            footerClone.style.setProperty('display', 'flex', 'important');
            footerClone.style.setProperty('visibility', 'visible', 'important');
          }
        },
      });
      footerHeightPx = footerCanvas.height;
    } catch (err) {
      console.warn('[PDF Export] Footer render failed:', err);
      footerCanvas = null;
      footerHeightPx = 0;
    }
  }

  // Re-render main without footer
  let mainCanvas = canvas;
  if (footerCanvas && footerElement) {
    try {
      mainCanvas = await (html2canvas as any)(element, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        windowWidth: A4_WIDTH_PX,
        width: A4_WIDTH_PX,
        height: element.scrollHeight,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0,
        onclone: (cloneDoc: Document) => {
          prepareCloneForPrint(cloneDoc, element);
          const footerClone = cloneDoc.querySelector<HTMLElement>('[data-pdf-footer]');
          if (footerClone) footerClone.style.setProperty('display', 'none', 'important');
        },
      });
    } catch (err) {
      console.warn('[PDF Export] Re-render without footer failed:', err);
      mainCanvas = canvas;
    }
  }

  const imgWidthMM = A4_WIDTH_MM;
  const imgHeightMM = (mainCanvas.height * imgWidthMM) / mainCanvas.width;
  const pageHeightPx = (A4_HEIGHT_MM * mainCanvas.height) / imgHeightMM;
  const footerHeightMM = footerCanvas ? (footerCanvas.height * imgWidthMM) / footerCanvas.width : 0;
  const contentPageHeightPx = footerCanvas ? pageHeightPx - footerHeightPx : pageHeightPx;
  const contentPageHeightMM = A4_HEIGHT_MM - footerHeightMM;

  // ── Smart page break detection ────────────────────────────────────────────
  const AVOID_BREAK_SELECTORS = [
    '[style*="border-radius"]', '.rounded-lg', '.rounded-xl', '.rounded-2xl',
    '[class*="mb-2"]', '[class*="mb-3"]', '[class*="entry"]', '[class*="item"]',
    '[data-avoid-break]',
  ];
  const elementRect = element.getBoundingClientRect();
  const avoidBreakRanges: Array<{ top: number; bottom: number }> = [];
  const seenNodes = new WeakSet<Element>();
  AVOID_BREAK_SELECTORS.forEach((sel) => {
    element.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (seenNodes.has(el)) return;
      seenNodes.add(el);
      const rect = el.getBoundingClientRect();
      const topDom = rect.top - elementRect.top;
      const bottomDom = rect.bottom - elementRect.top;
      if (bottomDom - topDom < 20) return;
      avoidBreakRanges.push({
        top: Math.round(topDom * scale),
        bottom: Math.round(bottomDom * scale),
      });
    });
  });
  avoidBreakRanges.sort((a, b) => a.top - b.top);

  const cutsInsideElement = (cutRow: number): boolean => {
    for (const range of avoidBreakRanges) {
      if (range.top > cutRow) break;
      if (cutRow > range.top && cutRow < range.bottom) return true;
    }
    return false;
  };

  const findBestBreakRow = (cvCanvas: HTMLCanvasElement, idealCutPx: number): number => {
    const windowPx = Math.floor(cvCanvas.height * 0.08);
    if (!cutsInsideElement(idealCutPx)) return idealCutPx;

    const searchDown = Math.min(cvCanvas.height - 1, idealCutPx + windowPx);
    for (let row = idealCutPx + 1; row <= searchDown; row++) {
      if (!cutsInsideElement(row)) return row;
    }

    const searchUp = Math.max(Math.floor(contentPageHeightPx * 0.75), idealCutPx - windowPx);
    for (let row = idealCutPx - 1; row >= searchUp; row--) {
      if (!cutsInsideElement(row)) return row;
    }

    // Luminance fallback
    const ctx = cvCanvas.getContext('2d');
    if (ctx) {
      const lStart = Math.max(0, idealCutPx - windowPx);
      const lEnd = Math.min(cvCanvas.height - 1, idealCutPx + windowPx);
      const imageData = ctx.getImageData(0, lStart, cvCanvas.width, lEnd - lStart + 1);
      const stride = Math.max(1, Math.floor(cvCanvas.width / 80));
      let bestRow = idealCutPx;
      let bestScore = -1;
      for (let row = lStart; row <= lEnd; row++) {
        const rowOffset = (row - lStart) * cvCanvas.width * 4;
        let light = 0, total = 0;
        for (let x = 0; x < cvCanvas.width; x += stride) {
          const idx = rowOffset + x * 4;
          const lum = 0.299 * imageData.data[idx] + 0.587 * imageData.data[idx + 1] + 0.114 * imageData.data[idx + 2];
          if (lum > 220) light++;
          total++;
        }
        const score = total > 0 ? light / total : 0;
        const adjusted = score - (Math.abs(row - idealCutPx) > 50 ? 0.05 : 0);
        if (adjusted > bestScore) { bestScore = adjusted; bestRow = row; }
      }
      return bestRow;
    }
    return idealCutPx;
  };

  const pdfDoc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });

  const stampFooter = (doc: typeof pdfDoc) => {
    if (!footerCanvas) return;
    doc.addImage(
      footerCanvas.toDataURL('image/jpeg', quality), 'JPEG',
      0, A4_HEIGHT_MM - footerHeightMM, imgWidthMM, footerHeightMM,
      undefined, 'FAST'
    );
  };

  if (imgHeightMM <= contentPageHeightMM) {
    pdfDoc.addImage(mainCanvas.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, imgWidthMM, imgHeightMM, undefined, 'FAST');
    stampFooter(pdfDoc);
    console.log('[PDF Export] Single page');
  } else {
    console.log('[PDF Export] Multi-page, height:', mainCanvas.height, 'px');
    let offsetPx = 0;
    let pageNum = 0;
    while (offsetPx < mainCanvas.height) {
      const remainingPx = mainCanvas.height - offsetPx;
      let slicePx: number;
      if (remainingPx <= contentPageHeightPx * 1.1) {
        slicePx = remainingPx;
      } else {
        const ideal = Math.floor(contentPageHeightPx);
        const best = findBestBreakRow(mainCanvas, offsetPx + ideal) - offsetPx;
        slicePx = Math.max(Math.floor(contentPageHeightPx * 0.75), Math.min(best, Math.floor(contentPageHeightPx)));
      }
      slicePx = Math.ceil(slicePx);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = mainCanvas.width;
      pageCanvas.height = slicePx;
      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(mainCanvas, 0, offsetPx, mainCanvas.width, slicePx, 0, 0, mainCanvas.width, slicePx);
      }

      const sliceHeightMM = (slicePx * imgWidthMM) / mainCanvas.width;
      if (pageNum > 0) pdfDoc.addPage();
      pdfDoc.addImage(pageCanvas.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, imgWidthMM, sliceHeightMM, undefined, 'FAST');
      stampFooter(pdfDoc);

      console.log(`[PDF Export] Page ${pageNum + 1}: offset=${offsetPx}px slice=${slicePx}px`);
      offsetPx += slicePx;
      pageNum++;
      if (pageNum > 20) break;
    }
    console.log('[PDF Export] Total pages:', pageNum);
  }

  console.log('[PDF Export] Done.');
  return pdfDoc.output('blob') as Blob;
}

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
  await exportElementToPDF(cvRef.current, { ...options, filename: `Lebenslauf_${safe}_${new Date().toISOString().split('T')[0]}.pdf` });
}

export async function exportCVToPDFBlob(
  cvRef: React.RefObject<HTMLElement>,
  personalInfo?: { name?: string },
  options?: PDFExportOptions
): Promise<Blob> {
  if (!cvRef.current) throw new Error('CV-Element nicht gefunden');
  console.log('[PDF Export] Generating blob for:', personalInfo?.name);
  return renderElementToPDFBlob(cvRef.current, options);
}

export function debugLogPDFHtml(
  cvRef: React.RefObject<HTMLElement> | HTMLElement | null
): void {
  const el = cvRef instanceof HTMLElement ? cvRef : cvRef?.current;
  if (!el) { console.warn('[PDF Debug] No element found.'); return; }

  const clone = el.cloneNode(true) as HTMLElement;
  const allEls = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))];
  const liveEls = [el, ...Array.from(el.querySelectorAll<HTMLElement>('*'))];
  allEls.forEach((cloneEl, i) => {
    const liveEl = liveEls[i] as HTMLElement | undefined;
    if (!liveEl) return;
    const cs = window.getComputedStyle(liveEl);
    const props = [
      'display', 'flexDirection', 'flexWrap', 'gap', 'columnGap', 'rowGap',
      'gridTemplateColumns', 'width', 'maxWidth', 'minWidth', 'height', 'overflow',
      'fontFamily', 'fontSize', 'fontWeight', 'color', 'backgroundColor',
      'padding', 'margin', 'border', 'borderRadius', 'position',
    ];
    let s = '';
    props.forEach((p) => {
      const val = cs.getPropertyValue(p.replace(/([A-Z])/g, '-$1').toLowerCase());
      if (val) s += `${p.replace(/([A-Z])/g, '-$1').toLowerCase()}:${val};`;
    });
    (cloneEl as HTMLElement).setAttribute('data-computed', s);
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(clone);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{background:#ccc;padding:20px;}[data-pdf-root]{background:white;}</style></head><body>${wrapper.innerHTML}</body></html>`;
  console.group('[PDF Debug] HTML snapshot');
  console.log('Dimensions:', el.offsetWidth, 'x', el.offsetHeight);
  console.log(html);
  console.groupEnd();
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(html).then(() => console.log('[PDF Debug] Copied to clipboard.')).catch(() => {});
  }
}