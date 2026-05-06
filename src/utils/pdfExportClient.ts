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

/**
 * Fetches an image URL and returns a base64 data-URI.
 * Falls back to the original src on any error so we never block the export.
 */
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
    console.warn('[PDF Export] Could not convert image to base64, using original src:', src?.substring(0, 80), err);
    return src;
  }
}

/**
 * Converts the cloned document into a print-ready flat document:
 * - Replaces <input> with <span> showing their value
 * - Replaces <textarea> with <div> showing their value
 * - Converts ALL <img> src to base64 data-URIs (avoids CORS taint)
 * - Hides all interactive controls (buttons, [data-pdf-hidden])
 * - Converts sticky/fixed/absolute positioning to static/relative so nothing jumps
 * - Removes every height/overflow constraint recursively
 * - Sets whitespace: normal on text nodes so wrapping works correctly
 * - Fixes z-index so text is always above backgrounds
 * - Enforces 794px width (A4 at 96 DPI)
 */
// Placeholder texts that appear when the user has not filled in a field.
// Any input/textarea/contenteditable whose trimmed value equals one of these
// (or is empty) is treated as blank and either removed or left invisible.
const PLACEHOLDER_STRINGS = new Set([
  // Multi-word placeholder phrases — safe to remove, never appear as real content
  'position / rolle', 'unternehmen', 'mm/jjjj', 'projekttitel',
  'deine rolle', 'abschluss', 'institution', 'zeitraum',
  'aufgaben und wichtigste erfolge', 'aufgabe / ergebnis', 'beschreibung / aufgaben',
  'kurz aufgaben und erfolge beschreiben', 'schwerpunkte / noten / themen',
  'zielposition / profil', 'vollständiger name', 'dein name', 'berufsbezeichnung',
  'telefon', 'e-mail', 'linkedin', 'niveau', 'sprache',
  'kurzprofil: wichtige erfahrungen, stärken und dein mehrwert für die rolle.',
  'skill', 'stärke', 'mon/jjjj',
  // NOTE: 'von', 'bis', 'rolle', 'position', 'projekt', 'projekte', 'wert', 'hobby',
  // 'eintrag', 'ort', 'heute' are intentionally excluded — they can appear as real user
  // content (e.g. city name "Ort", date value "Heute", role name "Rolle").
  // Empty string '' is handled by the v === '' check in isPlaceholderValue().
]);

function isPlaceholderValue(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v === '' || PLACEHOLDER_STRINGS.has(v);
}

function prepareCloneForPrint(cloneDoc: Document): void {
  const body = cloneDoc.body;

  // ── 0. Remove elements that are hidden editor-only (data-pdf-hidden / .pdf-hidden) ──
  // Do this first so their inputs are not processed below.
  const HIDE_SELECTORS_EARLY = [
    'button',
    '[data-pdf-hidden]',
    '.pdf-hidden',
    '.print\\:hidden',
  ];
  cloneDoc.querySelectorAll<HTMLElement>(HIDE_SELECTORS_EARLY.join(', ')).forEach((el) => {
    el.remove();
  });

  // ── 1. Replace <input> → <span>, remove if placeholder/empty ────────────
  cloneDoc.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
    const val = input.value || '';
    const isEmpty = isPlaceholderValue(val);

    if (isEmpty) {
      // Remove the entire nearest meaningful wrapper (li, or the input itself)
      const wrapper = input.closest('li, [data-pdf-field-wrap]') || input;
      wrapper.remove();
      return;
    }

    const span = cloneDoc.createElement('span');
    const inputCs = window.getComputedStyle(input);
    span.textContent = val;
    span.style.cssText = input.style.cssText;
    span.style.display = 'inline';
    span.style.background = 'transparent';
    span.style.border = 'none';
    span.style.outline = 'none';
    span.style.fontSize = inputCs.fontSize || '10px';
    span.style.fontWeight = inputCs.fontWeight || '400';
    span.style.color = inputCs.color || '#1e293b';
    span.style.fontFamily = inputCs.fontFamily;
    span.style.lineHeight = '1.4';
    span.style.whiteSpace = 'nowrap';
    input.parentNode?.replaceChild(span, input);
  });

  // ── 2. Replace <textarea> → <div>, remove if placeholder/empty ──────────
  cloneDoc.querySelectorAll<HTMLTextAreaElement>('textarea').forEach((ta) => {
    const val = ta.value || '';
    const isEmpty = isPlaceholderValue(val);

    if (isEmpty) {
      const wrapper = ta.closest('li, [data-pdf-field-wrap]') || ta;
      wrapper.remove();
      return;
    }

    const div = cloneDoc.createElement('div');
    const taCs = window.getComputedStyle(ta);
    div.textContent = val;
    div.style.cssText = ta.style.cssText;
    div.style.display = 'block';
    div.style.background = 'transparent';
    div.style.border = 'none';
    div.style.outline = 'none';
    div.style.resize = 'none';
    div.style.overflow = 'visible';
    div.style.height = 'auto';
    div.style.whiteSpace = 'pre-wrap';
    div.style.fontSize = taCs.fontSize || '10px';
    div.style.fontWeight = taCs.fontWeight || '400';
    div.style.color = taCs.color || '#1e293b';
    div.style.fontFamily = taCs.fontFamily;
    div.style.lineHeight = '1.4';
    ta.parentNode?.replaceChild(div, ta);
  });

  // ── 2b. Strip contentEditable ─────────────────────────────────────────────
  cloneDoc.querySelectorAll<HTMLElement>('[contenteditable]').forEach((el) => {
    const text = el.textContent?.trim() ?? '';
    const isEmpty = isPlaceholderValue(text);

    // Capture styles before mutating
    const cs = window.getComputedStyle(el);
    const textAlign = cs.textAlign;
    const fontSize = cs.fontSize;
    const fontWeight = cs.fontWeight;
    const color = cs.color;
    const verticalAlign = cs.verticalAlign;

    el.removeAttribute('contenteditable');
    el.removeAttribute('data-placeholder');
    el.style.outline = 'none';
    el.style.cursor = 'default';
    el.classList.remove('cursor-text', 'outline-none', 'focus:ring-0');
    Array.from(el.classList)
      .filter((c) => c.startsWith('empty:'))
      .forEach((c) => el.classList.remove(c));

    if (isEmpty) {
      // Hide placeholder-only contenteditable elements completely
      el.style.setProperty('display', 'none', 'important');
      el.textContent = '';
      return;
    }

    // Keep real content — enforce stable rendering styles
    el.style.whiteSpace = 'normal';
    el.style.lineHeight = '1.4';
    if (textAlign) el.style.textAlign = textAlign;
    if (fontSize) el.style.fontSize = fontSize;
    if (fontWeight) el.style.fontWeight = fontWeight;
    if (color) el.style.color = color;
    if (verticalAlign && verticalAlign !== 'baseline') el.style.verticalAlign = verticalAlign;
  });

  // ── 2c. Clean up date badges — fix gap and hide if both dates are empty ──────
  // DateBadge uses display:inline-flex + gap which breaks in html2canvas.
  // Convert gap to margin on children, and remove the badge entirely if both
  // date fields are empty (placeholder state).
  cloneDoc.querySelectorAll<HTMLElement>('[data-pdf-date-badge]').forEach((badge) => {
    // Fix the gap
    badge.style.removeProperty('gap');
    Array.from(badge.children).forEach((child) => {
      (child as HTMLElement).style.setProperty('margin-right', '3px', 'important');
    });

    // If ALL visible text inside is empty, hide the badge
    const visibleText = Array.from(badge.querySelectorAll<HTMLElement>('[contenteditable]'))
      .map((e) => e.textContent?.trim() ?? '')
      .filter((t) => t.length > 0 && !isPlaceholderValue(t));
    // Also check already-processed spans (contenteditable already replaced)
    const allSpans = Array.from(badge.querySelectorAll('span'))
      .map((e) => e.textContent?.trim() ?? '')
      .filter((t) => t.length > 0 && t !== '–');
    if (visibleText.length === 0 && allSpans.length === 0) {
      badge.style.setProperty('display', 'none', 'important');
    }
  });

  // ── 2d. Enforce collected styles on images so they render at the right size ─
  // We keep images as <img> tags (html2canvas handles base64 src natively).
  // We only fix up explicit width/height/objectFit so they print correctly.
  cloneDoc.querySelectorAll<HTMLImageElement>('img').forEach((img) => {
    const src = img.getAttribute('src') || '';
    if (!src) return;

    const preW = img.getAttribute('data-pdf-w') || '';
    const preH = img.getAttribute('data-pdf-h') || '';
    const preFit = img.getAttribute('data-pdf-fit') || 'cover';

    if (preW) img.style.width = preW;
    if (preH) img.style.height = preH;
    img.style.objectFit = preFit as any;
    img.style.display = 'block';
    img.style.flexShrink = '0';
    // Ensure overflow is not hidden at parent level for circular photos
    if (img.parentElement) {
      const parentCs = window.getComputedStyle(img.parentElement);
      if (parentCs.borderRadius && parentCs.borderRadius !== '0px') {
        img.parentElement.style.overflow = 'hidden';
      }
    }
  });

  // ── 3. Hide all interactive / editor-only elements ────────────────────────
  const HIDE_SELECTORS = [
    'button',
    '[data-pdf-hidden]',
    '.pdf-hidden',
    '.print\\:hidden',
  ];
  cloneDoc.querySelectorAll<HTMLElement>(HIDE_SELECTORS.join(', ')).forEach((el) => {
    el.style.setProperty('display', 'none', 'important');
  });

  // ── 4. Remove height / overflow locks + fix positioning on ALL elements ───
  const HEIGHT_LOCK_CLASSES = [
    'h-screen', 'h-dvh', 'h-lvh', 'h-svh', 'h-full',
    'max-h-screen', 'max-h-full',
    'overflow-auto', 'overflow-scroll',
    'sticky', 'fixed',
  ];

  // Find the template root so we can distinguish inside-template vs outside
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

    // ── Height / overflow ───────────────────────────────────────────────────
    if (s.height && s.height !== 'auto') s.height = 'auto';
    if (s.maxHeight) s.maxHeight = 'none';
    if (s.minHeight && (s.minHeight.includes('vh') || s.minHeight.includes('%') || s.minHeight === '100dvh' || s.minHeight === '100svh')) s.minHeight = 'auto';
    if (s.aspectRatio) s.aspectRatio = 'unset';

    const computed2 = window.getComputedStyle(el);
    const hasBorderRadius = computed2.borderRadius && computed2.borderRadius !== '0px' && computed2.borderRadius !== '0';
    const hasImg = el.querySelector('img') !== null || el.tagName === 'IMG';

    // Inside the template: only strip scrollable overflow (overflow-auto/scroll),
    // never strip overflow:hidden because templates use it intentionally for
    // photos, decorative elements, and clipping backgrounds.
    // Outside the template: strip all overflow constraints.
    if (isInsideTemplate) {
      const ov = computed2.overflow;
      const ovY = computed2.overflowY;
      const ovX = computed2.overflowX;
      if (ov === 'auto' || ov === 'scroll') s.overflow = 'visible';
      if (ovY === 'auto' || ovY === 'scroll') s.overflowY = 'visible';
      if (ovX === 'auto' || ovX === 'scroll') s.overflowX = 'visible';
    } else {
      if (!hasBorderRadius && !hasImg) {
        if (s.overflow && s.overflow !== 'visible') s.overflow = 'visible';
        if (s.overflowY && s.overflowY !== 'visible') s.overflowY = 'visible';
        if (s.overflowX && s.overflowX !== 'visible') s.overflowX = 'visible';
      }
    }

    // ── Positioning: only convert fixed/sticky → relative (globally)
    // Leave absolute positioning alone inside templates — templates use it
    // for decorative elements (glows, page guides) that must stay in place.
    const pos = computed2.position;
    if (pos === 'fixed' || pos === 'sticky') {
      s.setProperty('position', 'relative', 'important');
      s.setProperty('top', 'unset', 'important');
      s.setProperty('left', 'unset', 'important');
      s.setProperty('right', 'unset', 'important');
      s.setProperty('bottom', 'unset', 'important');
      s.setProperty('transform', 'none', 'important');
    }
    // Outside the template, also flatten absolute → relative to prevent
    // navigation bars / modals jumping into the canvas snapshot.
    else if (pos === 'absolute' && !isInsideTemplate) {
      s.position = 'relative';
      s.top = 'unset';
      s.left = 'unset';
      s.right = 'unset';
      s.bottom = 'unset';
      s.transform = 'none';
    }

  });

  // ── 5. Enforce 794px on the root element and all wrappers ────────────────
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
    root.style.setProperty('background', 'transparent', 'important');

    // root > first child = <div class="w-full"> (LiveEditor inner wrapper)
    const wrapperEl = root.firstElementChild as HTMLElement | null;
    if (wrapperEl) {
      wrapperEl.style.setProperty('width', '100%', 'important');
      wrapperEl.style.setProperty('max-width', '100%', 'important');
      wrapperEl.style.setProperty('padding', '0', 'important');
      wrapperEl.style.setProperty('margin', '0', 'important');
      wrapperEl.style.setProperty('display', 'block', 'important');

      // wrapperEl > first child = template root element (all templates now w-full)
      const templateRoot2 = wrapperEl.firstElementChild as HTMLElement | null;
      if (templateRoot2) {
        templateRoot2.style.setProperty('width', '100%', 'important');
        templateRoot2.style.setProperty('max-width', '100%', 'important');
        templateRoot2.style.setProperty('min-width', '0', 'important');
        templateRoot2.style.setProperty('margin-left', '0', 'important');
        templateRoot2.style.setProperty('margin-right', '0', 'important');
        templateRoot2.style.setProperty('box-shadow', 'none', 'important');
      }
    }
  }

  // ── 5b. Resolve responsive Tailwind classes at A4 width ──────────────────
  // Templates use md:grid-cols-12 and grid-cols-2 for responsive layouts.
  // At 794px the "md" breakpoint (768px) is active, so we force those classes.
  cloneDoc.querySelectorAll<HTMLElement>('[class*="md:grid-cols-"]').forEach((el) => {
    const match = Array.from(el.classList).find((c) => c.startsWith('md:grid-cols-'));
    if (match) {
      const cols = match.replace('md:grid-cols-', '');
      el.style.setProperty('grid-template-columns', `repeat(${cols}, minmax(0, 1fr))`, 'important');
      el.style.setProperty('display', 'grid', 'important');
      // Preserve gap: html2canvas doesn't honour Tailwind gap-N classes reliably,
      // so read the computed column-gap from the live element and re-apply inline.
      // Tailwind gap-6 = 24px, gap-4 = 16px. Fall back to 24px if unresolvable.
      const computedGap = window.getComputedStyle(el).columnGap;
      const gapPx = computedGap && computedGap !== 'normal' ? computedGap : '24px';
      el.style.setProperty('column-gap', gapPx, 'important');
      el.style.setProperty('row-gap', gapPx, 'important');
    }
  });

  // Force md:col-span-N classes
  cloneDoc.querySelectorAll<HTMLElement>('[class*="md:col-span-"]').forEach((el) => {
    const match = Array.from(el.classList).find((c) => c.startsWith('md:col-span-'));
    if (match) {
      const span = match.replace('md:col-span-', '');
      el.style.setProperty('grid-column', `span ${span} / span ${span}`, 'important');
      el.style.setProperty('min-width', '0', 'important');
    }
  });

  // ── 5c. Fix Classic template flex sidebar widths ─────────────────────────
  // Classic uses w-2/5 max-w-[32%] (sidebar) and flex-1 (main). Neither has
  // md: prefix so step 5b doesn't touch them. Force widths explicitly.
  cloneDoc.querySelectorAll<HTMLElement>('[class*="w-2/5"]').forEach((el) => {
    el.style.setProperty('width', '40%', 'important');
    el.style.setProperty('flex-shrink', '0', 'important');
    el.style.setProperty('max-width', '40%', 'important');
  });
  cloneDoc.querySelectorAll<HTMLElement>('[class*="max-w-\\[32%\\]"]').forEach((el) => {
    el.style.setProperty('max-width', 'none', 'important');
  });

  // ── 5d. Fix overflow:hidden on flex/block skill containers ───────────────
  // Classic <ul style="overflow:hidden"> clips the inline-flex chip row to 0px
  // because inline-flex children fall outside normal block flow.
  // Strip inline overflow:hidden from elements that are NOT photo containers.
  cloneDoc.querySelectorAll<HTMLElement>('ul, ol').forEach((el) => {
    const s = el.style;
    if (s.overflow === 'hidden' || s.overflowY === 'hidden' || s.overflowX === 'hidden') {
      const hasImg = el.querySelector('img') !== null;
      const cs = window.getComputedStyle(el);
      const hasBorderRadius = cs.borderRadius && cs.borderRadius !== '0px' && cs.borderRadius !== '0';
      if (!hasImg && !hasBorderRadius) {
        s.setProperty('overflow', 'visible', 'important');
      }
    }
  });

  // Force sm:flex-row (footers use flex-col sm:flex-row)
  cloneDoc.querySelectorAll<HTMLElement>('[class*="sm:flex-row"]').forEach((el) => {
    el.style.setProperty('flex-direction', 'row', 'important');
  });

  // Force sm:px-0 / sm:px-4 (templates use sm: padding variants)
  cloneDoc.querySelectorAll<HTMLElement>('[class*="sm:px-0"]').forEach((el) => {
    el.style.setProperty('padding-left', '0', 'important');
    el.style.setProperty('padding-right', '0', 'important');
  });

  // ── 6. Prevent page breaks inside CV content cards ───────────────────────
  // Targets common card/entry wrappers across all CV templates so that
  // experience, education, project, and skill items are never split between
  // two PDF pages.
  const BREAK_AVOID_SELECTORS = [
    // Inline-styled cards (Modern template already uses breakInside, but we set it here too)
    '[style*="border-radius"]',
    // Tailwind rounded card classes used by Classic / Minimal / Professional
    '.rounded-lg',
    '.rounded-xl',
    '.rounded-2xl',
    // Explicit avoid classes used by some templates
    '[class*="mb-2"]',
    '[class*="mb-2.5"]',
    '[class*="mb-3"]',
  ];

  // Use a Set to avoid processing the same element twice
  const seen = new WeakSet<HTMLElement>();
  BREAK_AVOID_SELECTORS.forEach((sel) => {
    cloneDoc.querySelectorAll<HTMLElement>(sel).forEach((el) => {
      if (seen.has(el)) return;
      seen.add(el);
      el.style.setProperty('break-inside', 'avoid', 'important');
      el.style.setProperty('page-break-inside', 'avoid', 'important');
    });
  });

  // ── 7. Page-level resets ──────────────────────────────────────────────────
  body.style.setProperty('margin', '0', 'important');
  body.style.setProperty('padding', '0', 'important');
  body.style.setProperty('overflow', 'visible', 'important');
  body.style.setProperty('height', 'auto', 'important');
  body.style.setProperty('min-height', '0', 'important');
  body.style.setProperty('width', `${A4_WIDTH_PX}px`, 'important');

  // ── 8. Inject inline print-stabilization CSS ─────────────────────────────
  // Injected directly into the cloned <head> — no external network requests,
  // no CORS failures. This is the only reliable CSS injection path for html2canvas.
  const styleEl = cloneDoc.createElement('style');
  styleEl.textContent = `
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Ensure backgrounds are never stripped — critical for tinted header/section colors */
    * {
      -webkit-print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    /* Body font fallback — never Times New Roman.
       Templates that use Georgia set it via inline style, which wins. */
    body {
      font-family: 'Inter', 'Roboto', 'Open Sans', Arial, Helvetica, sans-serif !important;
    }

    /* ── Global line-height lock: prevents browser-default variation ── */
    p, div, span, li, h1, h2, h3, h4 {
      line-height: 1.4 !important;
    }

    /* ── Skill/chip containers ── */
    [data-chip-row] {
      display: block !important;
      overflow: hidden !important;
    }
    [data-chip-row] > * {
      display: inline-flex !important;
      align-items: center !important;
      margin-right: 5px !important;
      margin-bottom: 5px !important;
      vertical-align: middle !important;
      min-height: 22px !important;
      line-height: 1.4 !important;
    }

    /* ── Bullet point alignment ──
       Force flex layout with start alignment so the dot stays at the top
       of multi-line text, not vertically centered mid-block. */
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
    /* Last child of a bullet row = the text content */
    [data-pdf-bullet-row] > :last-child {
      display: block !important;
      flex: 1 !important;
      line-height: 1.55 !important;
      word-break: break-word !important;
      white-space: pre-wrap !important;
    }

    /* ── A4 root: fixed dimensions ── */
    [data-pdf-root] {
      width: 794px !important;
      min-width: 794px !important;
      max-width: 794px !important;
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    /* ── Summary/profile box: contained overflow ── */
    [data-pdf-summary] {
      overflow: hidden !important;
      word-break: break-word !important;
      overflow-wrap: anywhere !important;
    }

    /* ── Date badge: ensure inline-flex stays stable ── */
    [data-pdf-date-badge] {
      display: inline-flex !important;
      align-items: center !important;
      flex-shrink: 0 !important;
      white-space: nowrap !important;
    }

    /* ── Remove any residual input/textarea styling artifacts ── */
    input, textarea {
      display: none !important;
    }
  `;
  (cloneDoc.head || cloneDoc.documentElement).appendChild(styleEl);

  // ── 9. Convert gap-based flex/wrap containers → margin-based ───────────────
  // html2canvas clones the DOM into a hidden iframe that does NOT inherit the
  // page's Tailwind stylesheet. Tailwind classes like `flex flex-wrap gap-1.5`
  // produce zero computed gap in the clone. We must detect BOTH:
  //   (a) Inline style: display:flex + flex-wrap:wrap + gap
  //   (b) Tailwind class names: presence of "flex-wrap" AND any "gap-" class
  // and convert them to block + inline-flex + margin so layout is stable.

  // Maps Tailwind gap-N → px value (Tailwind default spacing: 1 unit = 4px)
  const tailwindGapToPx = (cls: string): number | null => {
    // gap-px → 1px, gap-0.5 → 2px, gap-1 → 4px, gap-1.5 → 6px, gap-2 → 8px, etc.
    const m = cls.match(/^gap-(.+)$/);
    if (!m) return null;
    const val = m[1];
    if (val === 'px') return 1;
    const num = parseFloat(val);
    if (!isNaN(num)) return Math.round(num * 4);
    return null;
  };

  const applyGapFix = (el: HTMLElement, gapPx: number) => {
    el.style.setProperty('display', 'block', 'important');
    el.style.setProperty('overflow', 'hidden', 'important');
    el.setAttribute('data-chip-row', '1');
    Array.from(el.children).forEach((child) => {
      const c = child as HTMLElement;
      // Don't override elements that are hidden or already have display:none
      if (c.style.display === 'none') return;
      c.style.setProperty('display', 'inline-flex', 'important');
      c.style.setProperty('align-items', 'center', 'important');
      c.style.setProperty('vertical-align', 'middle', 'important');
      c.style.setProperty('margin-right', `${gapPx}px`, 'important');
      c.style.setProperty('margin-bottom', `${gapPx}px`, 'important');
      c.style.setProperty('min-height', '22px', 'important');
    });
  };

  cloneDoc.querySelectorAll<HTMLElement>('*').forEach((el) => {
    const classes = Array.from(el.classList);

    // ── Path A: Tailwind class-based detection ─────────────────────────────
    const hasFlex = classes.includes('flex');
    const hasFlexWrap = classes.includes('flex-wrap');
    if (hasFlex && hasFlexWrap) {
      // Find the gap class (gap-1, gap-1.5, gap-2, gap-3, etc.)
      const gapClass = classes.find((c) => /^gap-/.test(c));
      const gapPx = gapClass ? (tailwindGapToPx(gapClass) ?? 4) : 0;
      if (gapPx > 0) {
        applyGapFix(el, gapPx);
        return;
      }
    }

    // ── Path B: Inline-style detection (ModernCVTemplate uses inline styles) ─
    const inlineDisplay = el.style.display;
    const inlineWrap = el.style.flexWrap;
    const inlineGap = el.style.gap || el.style.columnGap || '';
    if (
      (inlineDisplay === 'flex' || inlineDisplay === 'inline-flex') &&
      (inlineWrap === 'wrap' || inlineWrap === 'wrap-reverse')
    ) {
      const gapPx = parseFloat(inlineGap) || 0;
      if (gapPx > 0) {
        applyGapFix(el, gapPx);
      }
    }
  });
}

async function renderElementToPDFBlob(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<Blob> {
  const { quality = 0.95, scale = 2 } = options;

  // ── Step 1: Convert all images in the LIVE element to base64 ─────────────
  // This happens BEFORE html2canvas clones the DOM, so the clone already has
  // base64 src values — no CORS issues, no taint errors.
  // Also collect computed styles (width/height/objectFit) before cloning,
  // since window.getComputedStyle doesn't work inside onclone callbacks.
  console.log('[PDF Export] Pre-fetching images as base64...');
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

  // Stamp computed size + objectFit onto each img as data attributes so onclone can read them
  liveImages.forEach((img) => {
    const cs = window.getComputedStyle(img);
    img.setAttribute('data-pdf-w', cs.width || img.style.width || '80px');
    img.setAttribute('data-pdf-h', cs.height || img.style.height || '80px');
    img.setAttribute('data-pdf-fit', cs.objectFit || img.style.objectFit || 'cover');
  });

  // ── Step 2: Wait for DOM flush + fonts ───────────────────────────────────
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  // Wait for FontFaceSet to be fully ready before loading individual faces.
  // This is the primary gate — individual font.load() calls below are
  // supplementary to force-load specific weights that may be lazy-loaded.
  await Promise.all([
    (document as any).fonts?.ready ?? Promise.resolve(),
  ]);

  // Explicitly load all font variants used by the CV templates before rendering.
  // This prevents fonts from falling back to system fonts in the PDF screenshot.
  if ((document as any).fonts?.load) {
    const fontFaces = [
      '400 12px Inter',
      '600 12px Inter',
      '700 12px Inter',
      '400 12px Roboto',
      '600 12px Roboto',
      '700 12px Roboto',
      '400 12px "Open Sans"',
      '600 12px "Open Sans"',
      '700 12px "Open Sans"',
      '400 12px Georgia',
      '700 12px Georgia',
    ];
    await Promise.all(
      fontFaces.map((f) =>
        (document as any).fonts.load(f).catch(() => {})
      )
    );
  }

  // Second fonts.ready await — ensures any fonts triggered by the load() calls
  // above have also settled before we snapshot the DOM.
  await Promise.all([
    (document as any).fonts?.ready ?? Promise.resolve(),
  ]);

  // Short additional settle time for layout repaint after fonts load
  await new Promise((r) => setTimeout(r, 300));

  // ── Step 3: Confirm all images loaded ─────────────────────────────────────
  await Promise.all(
    Array.from(element.querySelectorAll<HTMLImageElement>('img')).map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((res) => {
        img.onload = () => res();
        img.onerror = () => {
          console.warn('[PDF Export] Image failed to load:', img.src?.substring(0, 80));
          res();
        };
      });
    })
  );

  window.scrollTo(0, 0);

  console.log('[PDF Export] Rendering canvas (scale:', scale, ')...');
  console.log('[PDF Export] Element size:', element.offsetWidth, 'x', element.offsetHeight, 'scrollH:', element.scrollHeight);

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: true,
      imageTimeout: 0,
      removeContainer: true,
      windowWidth: A4_WIDTH_PX,
      width: A4_WIDTH_PX,
      height: element.scrollHeight,
      x: 0,
      y: 0,
      scrollX: 0,
      scrollY: 0,
      onclone: (cloneDoc) => {
        prepareCloneForPrint(cloneDoc);
      },
    });
  } catch (err: any) {
    console.error('[PDF Export] html2canvas error:', err);
    throw new Error('PDF-Generierung fehlgeschlagen: ' + (err.message || 'Unbekannter Fehler'));
  } finally {
    // ── Restore original src values so the live editor isn't affected ───────
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
  // The footer element is identified by [data-pdf-footer] attribute.
  // We render it as a separate canvas so it can be stamped at the bottom of
  // every PDF page without being cut by the page-slice algorithm.
  const footerElement = element.querySelector<HTMLElement>('[data-pdf-footer]');
  let footerCanvas: HTMLCanvasElement | null = null;
  let footerHeightPx = 0;

  if (footerElement) {
    try {
      footerCanvas = await html2canvas(footerElement, {
        scale,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        imageTimeout: 0,
        removeContainer: true,
        windowWidth: A4_WIDTH_PX,
        width: A4_WIDTH_PX,
        onclone: (cloneDoc) => {
          prepareCloneForPrint(cloneDoc);
          // Make footer fully visible in its own canvas pass
          const footerClone = cloneDoc.querySelector<HTMLElement>('[data-pdf-footer]');
          if (footerClone) {
            footerClone.style.setProperty('display', 'flex', 'important');
            footerClone.style.setProperty('visibility', 'visible', 'important');
          }
        },
      });
      footerHeightPx = footerCanvas.height;
      console.log('[PDF Export] Footer canvas:', footerCanvas.width, 'x', footerCanvas.height);
    } catch (err) {
      console.warn('[PDF Export] Footer render failed, will be included in main canvas:', err);
      footerCanvas = null;
      footerHeightPx = 0;
    }
  }

  // When we have a separately rendered footer, re-render the main element
  // with the footer hidden so content doesn't appear twice.
  let mainCanvas = canvas;
  if (footerCanvas && footerElement) {
    try {
      mainCanvas = await html2canvas(element, {
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
        onclone: (cloneDoc) => {
          prepareCloneForPrint(cloneDoc);
          // Hide the footer in the main pass so it is not double-rendered
          const footerClone = cloneDoc.querySelector<HTMLElement>('[data-pdf-footer]');
          if (footerClone) {
            footerClone.style.setProperty('display', 'none', 'important');
          }
        },
      });
      console.log('[PDF Export] Main canvas (footer excluded):', mainCanvas.width, 'x', mainCanvas.height);
    } catch (err) {
      console.warn('[PDF Export] Re-render without footer failed, using original canvas:', err);
      mainCanvas = canvas;
    }
  }

  const imgWidthMM = A4_WIDTH_MM;
  const imgHeightMM = (mainCanvas.height * imgWidthMM) / mainCanvas.width;
  const pageHeightPx = (A4_HEIGHT_MM * mainCanvas.height) / imgHeightMM;

  // Footer dimensions in mm (proportional to the A4 width)
  const footerHeightMM = footerCanvas
    ? (footerCanvas.height * imgWidthMM) / footerCanvas.width
    : 0;

  // Usable content area per page (leave room for the footer at the bottom)
  const contentPageHeightPx = footerCanvas
    ? pageHeightPx - footerHeightPx
    : pageHeightPx;
  const contentPageHeightMM = A4_HEIGHT_MM - footerHeightMM;

  // ── Collect DOM element boundaries for smart break detection ─────────────
  // Measure bounding boxes of all "avoid-break" elements relative to the
  // rendered element's top. These are CV entry cards, section items, etc.
  // The canvas is rendered at `scale` × the DOM pixel size, so we multiply
  // DOM offsets by `scale` to get canvas-space coordinates.
  const AVOID_BREAK_SELECTORS = [
    '[style*="border-radius"]',
    '.rounded-lg',
    '.rounded-xl',
    '.rounded-2xl',
    '[class*="mb-2"]',
    '[class*="mb-3"]',
    '[class*="entry"]',
    '[class*="item"]',
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
      // Only track elements taller than 20px (skip decorative micro-elements)
      if (bottomDom - topDom < 20) return;
      avoidBreakRanges.push({
        top: Math.round(topDom * scale),
        bottom: Math.round(bottomDom * scale),
      });
    });
  });
  // Sort by top so we can binary-search efficiently
  avoidBreakRanges.sort((a, b) => a.top - b.top);

  /**
   * Returns true if cutting at `cutRow` (canvas px) would land inside a
   * tracked "avoid-break" element.
   */
  const cutsInsideElement = (cutRow: number): boolean => {
    for (const range of avoidBreakRanges) {
      if (range.top > cutRow) break; // sorted, no need to look further
      if (cutRow > range.top && cutRow < range.bottom) return true;
    }
    return false;
  };

  /**
   * Finds the best pixel row to cut the canvas for a page break.
   *
   * Strategy (in priority order):
   * 1. Try the ideal cut row. If it does not land inside an avoid-break
   *    element, use it directly.
   * 2. Search downward (within 8% of page height) for the first gap between
   *    elements — i.e. the first row that is NOT inside any avoid-break block.
   * 3. Search upward (within 8%) for the last gap before the ideal cut.
   * 4. If no gap is found in either direction, fall back to the luminance-
   *    based light-row heuristic so we at least try to avoid dense content.
   * 5. Hard fallback: use the ideal cut regardless.
   */
  const findBestBreakRow = (
    canvas: HTMLCanvasElement,
    idealCutPx: number,
    windowFraction = 0.08
  ): number => {
    const windowPx = Math.floor(canvas.height * windowFraction);

    // 1. Ideal cut is already in a gap → use it
    if (!cutsInsideElement(idealCutPx)) return idealCutPx;

    // 2. Search downward for a gap (prefer putting element on the next page)
    const searchDown = Math.min(canvas.height - 1, idealCutPx + windowPx);
    for (let row = idealCutPx + 1; row <= searchDown; row++) {
      if (!cutsInsideElement(row)) return row;
    }

    // 3. Search upward for a gap (element fits on current page)
    const searchUp = Math.max(Math.floor(contentPageHeightPx * 0.75), idealCutPx - windowPx);
    for (let row = idealCutPx - 1; row >= searchUp; row--) {
      if (!cutsInsideElement(row)) return row;
    }

    // 4. Luminance-based fallback (light pixel rows = whitespace between sections)
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const lStart = Math.max(0, idealCutPx - windowPx);
      const lEnd = Math.min(canvas.height - 1, idealCutPx + windowPx);
      const imageData = ctx.getImageData(0, lStart, canvas.width, lEnd - lStart + 1);
      const rowWidth = canvas.width;
      const stride = Math.max(1, Math.floor(rowWidth / 80));

      let bestRow = idealCutPx;
      let bestScore = -1;

      for (let row = lStart; row <= lEnd; row++) {
        const rowOffset = (row - lStart) * rowWidth * 4;
        let lightCount = 0;
        let totalSampled = 0;

        for (let x = 0; x < rowWidth; x += stride) {
          const idx = rowOffset + x * 4;
          const r = imageData.data[idx];
          const g = imageData.data[idx + 1];
          const b = imageData.data[idx + 2];
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          if (lum > 220) lightCount++;
          totalSampled++;
        }

        const score = totalSampled > 0 ? lightCount / totalSampled : 0;
        const distancePenalty = Math.abs(row - idealCutPx) > 50 ? 0.05 : 0;
        const adjustedScore = score - distancePenalty;

        if (adjustedScore > bestScore) {
          bestScore = adjustedScore;
          bestRow = row;
        }
      }
      return bestRow;
    }

    // 5. Hard fallback
    return idealCutPx;
  };

  const pdfDoc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  /**
   * Stamps the footer canvas at the bottom of the current PDF page.
   */
  const stampFooter = (doc: typeof pdfDoc) => {
    if (!footerCanvas) return;
    const footerData = footerCanvas.toDataURL('image/jpeg', quality);
    doc.addImage(
      footerData,
      'JPEG',
      0,
      A4_HEIGHT_MM - footerHeightMM,
      imgWidthMM,
      footerHeightMM,
      undefined,
      'FAST'
    );
  };

  if (imgHeightMM <= contentPageHeightMM) {
    // ── Single page ────────────────────────────────────────────────────────
    const imgData = mainCanvas.toDataURL('image/jpeg', quality);
    pdfDoc.addImage(imgData, 'JPEG', 0, 0, imgWidthMM, imgHeightMM, undefined, 'FAST');
    stampFooter(pdfDoc);
    console.log('[PDF Export] Single page');
  } else {
    // ── Multi-page with DOM-aware break detection ──────────────────────────
    console.log('[PDF Export] Multi-page content height:', mainCanvas.height, 'px, page height:', contentPageHeightPx, 'px, avoid-break elements:', avoidBreakRanges.length);

    let offsetPx = 0;
    let pageNum = 0;

    while (offsetPx < mainCanvas.height) {
      const remainingPx = mainCanvas.height - offsetPx;

      let slicePx: number;
      if (remainingPx <= contentPageHeightPx * 1.1) {
        // Last page — take everything remaining
        slicePx = remainingPx;
      } else {
        const idealCut = Math.floor(contentPageHeightPx);
        const bestCut = findBestBreakRow(mainCanvas, offsetPx + idealCut) - offsetPx;
        // Clamp: never go below 75% of a page (avoid infinite loops) or above 100%
        slicePx = Math.max(Math.floor(contentPageHeightPx * 0.75), Math.min(bestCut, Math.floor(contentPageHeightPx)));
      }

      slicePx = Math.ceil(slicePx);

      const pageCanvas = document.createElement('canvas');
      pageCanvas.width = mainCanvas.width;
      pageCanvas.height = slicePx;

      const ctx = pageCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(
          mainCanvas,
          0, offsetPx,
          mainCanvas.width, slicePx,
          0, 0,
          mainCanvas.width, slicePx
        );
      }

      const sliceHeightMM = (slicePx * imgWidthMM) / mainCanvas.width;
      const imgData = pageCanvas.toDataURL('image/jpeg', quality);

      if (pageNum > 0) pdfDoc.addPage();
      pdfDoc.addImage(imgData, 'JPEG', 0, 0, imgWidthMM, sliceHeightMM, undefined, 'FAST');
      stampFooter(pdfDoc);

      console.log(`[PDF Export] Page ${pageNum + 1}: offset=${offsetPx}px slice=${slicePx}px`);

      offsetPx += slicePx;
      pageNum++;

      // Safety guard
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
  const safe = name
    .replace(/[^a-zA-Z0-9äöüÄÖÜß]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const filename = `Lebenslauf_${safe}_${new Date().toISOString().split('T')[0]}.pdf`;

  await exportElementToPDF(cvRef.current, { ...options, filename });
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

/**
 * Debug helper: logs the serialized HTML that would be passed to html2canvas.
 * Call this from the browser console or a debug button:
 *   import { debugLogPDFHtml } from '../utils/pdfExportClient';
 *   debugLogPDFHtml(pdfRenderRef);
 *
 * The output in the console shows you exactly what CSS classes are present
 * (or missing) before the clone transformation runs. Copy the logged string
 * into a local HTML file to inspect the layout in a browser.
 */
export function debugLogPDFHtml(
  cvRef: React.RefObject<HTMLElement> | HTMLElement | null
): void {
  const el = cvRef instanceof HTMLElement ? cvRef : cvRef?.current;
  if (!el) {
    console.warn('[PDF Debug] No element found.');
    return;
  }

  const clone = el.cloneNode(true) as HTMLElement;

  // Snapshot computed styles for every element so the debug HTML is self-contained
  const allEls = [clone, ...Array.from(clone.querySelectorAll<HTMLElement>('*'))];
  const liveEls = [el, ...Array.from(el.querySelectorAll<HTMLElement>('*'))];
  allEls.forEach((cloneEl, i) => {
    const liveEl = liveEls[i] as HTMLElement | undefined;
    if (!liveEl) return;
    const cs = window.getComputedStyle(liveEl);
    const props = [
      'display','flexDirection','flexWrap','gap','columnGap','rowGap',
      'gridTemplateColumns','width','maxWidth','minWidth','height','overflow',
      'fontFamily','fontSize','fontWeight','color','backgroundColor',
      'padding','margin','border','borderRadius','boxSizing',
      'position','top','left','right','bottom',
    ];
    let inlineStyle = '';
    props.forEach((p) => {
      const val = cs.getPropertyValue(p.replace(/([A-Z])/g, '-$1').toLowerCase());
      if (val) inlineStyle += `${p.replace(/([A-Z])/g, '-$1').toLowerCase()}:${val};`;
    });
    (cloneEl as HTMLElement).setAttribute('data-computed', inlineStyle);
  });

  const wrapper = document.createElement('div');
  wrapper.appendChild(clone);
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <style>body{background:#ccc;padding:20px;} [data-pdf-root]{background:white;}</style>
    </head><body>${wrapper.innerHTML}</body></html>`;

  console.group('[PDF Debug] HTML snapshot — copy into a .html file to inspect');
  console.log('Element dimensions:', el.offsetWidth, 'x', el.offsetHeight, '(scroll:', el.scrollWidth, 'x', el.scrollHeight, ')');
  console.log('Classes on root:', el.className);
  console.log('HTML length:', html.length, 'chars');
  console.log(html);
  console.groupEnd();

  // Also copy to clipboard if available
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(html).then(() => {
      console.log('[PDF Debug] HTML copied to clipboard.');
    }).catch(() => {});
  }
}
