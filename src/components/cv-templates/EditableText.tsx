import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';

export interface EditableTextProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
  /**
   * Element-Tag. Default `div`.
   *
   * ModernCVTemplate rendert Editables teils inline (in Chips, Date-Badges,
   * Kontaktzeilen). Ein `div` würde dort den Flex-/Inline-Fluss brechen.
   */
  as?: 'div' | 'span' | 'p' | 'h1' | 'h2';
  /**
   * Einzeiliges Feld, das umbrechen DARF. Default `false`.
   *
   * Ohne `multiline` ist ein Editable hart auf `nowrap` + `overflow: hidden`
   * + `text-overflow: ellipsis` gesetzt. Für Datums-Badges und Chips ist das
   * richtig — die sollen nie umbrechen. Für Titel ist es falsch: ein langer
   * Studiengang wurde im Editor bei der Kartenbreite abgeschnitten, und im
   * PDF setzt html2canvas weder das Ellipsis noch das Clipping um.
   *
   * `wrap` erlaubt den Umbruch, ohne `multiline` zu setzen: Enter wird
   * weiterhin von `handleKeyDown` abgefangen, der Wert bleibt einzeilig.
   */
  wrap?: boolean;
}

export const EditableText: React.FC<EditableTextProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '',
  multiline = false,
  style,
  as = 'div',
  wrap = false,
}) => {
  const v = value ?? '';
  const ref = useRef<HTMLElement>(null);
  const isComposing = useRef(false);
  const isFocused = useRef(false);
  const lastValue = useRef(v);

  const [renderKey, setRenderKey] = useState(v);

  useEffect(() => {
    if (!isFocused.current) {
      setRenderKey(v);
      lastValue.current = v;
    }
  }, [v]);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const text = ref.current?.textContent ?? '';
    if (text !== lastValue.current) {
      lastValue.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleFocus = useCallback(() => {
    isFocused.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocused.current = false;
    handleInput();
    setRenderKey(ref.current?.textContent ?? v);
  }, [handleInput, v]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLElement>) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      (e.currentTarget as HTMLElement).blur();
    }
  }, [multiline]);

  const baseClasses = [
    'outline-none focus:ring-0 cursor-text',
    as === 'div' || as === 'p' ? 'w-full' : '',
    'empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300',
    className,
  ].filter(Boolean).join(' ');

  const flows = multiline || wrap;

  /**
   * WICHTIG — hier lag die eigentliche Wurzel des „Buchstaben-Stapelns".
   *
   * `overflowWrap: 'anywhere'` UND `wordBreak: 'break-word'` senken beide die
   * min-content-Breite eines Elements auf EIN Zeichen. Steht so ein Feld in
   * einer Flex-Zeile neben einem festbreiten Nachbarn (Datums-Badge, Spalte),
   * quetscht Flexbox es bei Platzmangel bis auf 1 Zeichen — der Text stapelt
   * sich senkrecht.
   *
   * Deshalb:
   *   wordBreak: 'normal'          → min-content = längstes WORT (nie 1 Zeichen)
   *   overflowWrap: 'break-word'   → überlange Wörter brechen NUR bei echtem
   *                                  Überlauf um, ohne die min-content-Breite
   *                                  zu senken.
   * Damit ist zeichenweises Stapeln strukturell unmöglich — unabhängig davon,
   * wie eng die Spalte wird.
   */
  const flowStyle: React.CSSProperties = {
    whiteSpace: multiline ? 'pre-wrap' : wrap ? 'normal' : 'nowrap',
    wordBreak: 'normal',
    overflow: flows ? 'visible' : 'hidden',
    textOverflow: flows ? 'unset' : 'ellipsis',
    ...(flows ? { overflowWrap: 'break-word' as const } : {}),
  };

  return React.createElement(
    as,
    {
      key: renderKey,
      ref,
      contentEditable: true,
      suppressContentEditableWarning: true,
      onInput: handleInput,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      onCompositionStart: () => { isComposing.current = true; },
      onCompositionEnd: () => { isComposing.current = false; handleInput(); },
      'data-placeholder': placeholder,
      className: baseClasses,
      style: {
        ...flowStyle,
        ...style,
      },
    },
    renderKey
  );
};

/** Gemeinsame Props aller CV-Templates. */
export interface PersonalInfo {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  [key: string]: any;
}

export interface EditorSection {
  type: string;
  title?: string;
  items?: any[];
  [key: string]: any;
}

export interface CVTemplateProps {
  personalInfo: PersonalInfo;
  summary?: string;
  sections: EditorSection[];
  photoUrl?: string;
  photoPosition?: { x: number; y: number };

  /**
   * Höhe des Containers, berechnet von der Break-Engine. Der Footer sitzt per
   * `marginTop: auto` an dessen Unterkante — also exakt am Fuß der letzten
   * Seite. Templates dürfen diese Höhe NICHT selbst bestimmen.
   */
  minHeightPx?: number;

  onUpdatePersonalInfo: (field: string, value: string) => void;
  onUpdateSummary: (value: string) => void;
  onUpdateSection?: (sectionIndex: number, updates: Partial<EditorSection>) => void;
  onUpdateSectionItem: (sectionIndex: number, itemIndex: number, field: string, value: any) => void;
  onAddSectionItem?: (sectionIndex: number, defaultItem: any) => void;
  onDeleteSectionItem?: (sectionIndex: number, itemIndex: number) => void;
  onDeleteBullet?: (sectionIndex: number, itemIndex: number, bulletIndex: number) => void;
  onReorderSections?: (fromIndex: number, toIndex: number) => void;
  /** Verschiebt ein einzelnes Item INNERHALB einer Sektion (z. B. eine
   *  Berufsstation über eine andere ziehen), unabhängig vom Verschieben
   *  ganzer Sektionen via onReorderSections. */
  onReorderSectionItem?: (sectionIndex: number, fromIndex: number, toIndex: number) => void;
}

// ─── Pointer-basiertes Drag & Drop ─────────────────────────────────────────
//
// BUG (kein Block/keine Station ließ sich wirklich verschieben): die vorherige
// Implementierung nutzte natives HTML5-Drag&Drop (`draggable` + `dragstart`/
// `dragover`/`drop`). Genau dieser Mechanismus wird von Chromium (und anderen
// Browsern) STILLSCHWEIGEND deaktiviert, sobald irgendein Vorfahre-Element
// ein CSS `transform` trägt — `dragover`/`drop` feuern dann einfach nicht
// mehr, ganz ohne Fehler in der Konsole. CVLiveEditorPage packt JEDE
// sichtbare A4-Seite (und die gezoomte Fokus-Ansicht beim Klick in ein Feld)
// grundsätzlich in `transform: scale(...)` — auch bei scale(1). Dadurch war
// natives Drag&Drop in der echten Vorschau IMMER gebrochen, unabhängig davon,
// welcher Block-Typ es war; nur die reine Render-Reihenfolge (bei manuell
// geänderten Testdaten) sah vorher schon korrekt aus, weil sie nie über einen
// echten Drag lief. Verifiziert per Playwright-Mausdrag: mit
// `transform: scale(0.6)` (und sogar `scale(1)`) auf einem Vorfahren blieb
// die Sektionsreihenfolge nach einem vollständigen mousedown→move→up exakt
// unverändert; ohne jedes transform funktionierte derselbe Drag einwandfrei.
//
// Fix: eigenes, Transform-unabhängiges Drag&Drop über mousedown/mousemove/
// mouseup + `document.elementFromPoint()` statt der nativen Browser-API.
// Das Ziel wird beim Loslassen anhand eines data-Attributs auf dem
// jeweiligen Container ermittelt — unabhängig von jeder CSS-Transformation
// dazwischen, weil `elementFromPoint` mit echten Bildschirmkoordinaten
// arbeitet, nicht mit dem (durch `transform` verzerrten) Layout-Koordinatensystem.

const SECTION_DROP_ATTR = 'data-section-drop-index';
const ITEM_DROP_ATTR = 'data-item-drop-key';

/** Nur ein Drag kann je aktiv sein — räumt einen evtl. hängengebliebenen
 *  vorherigen Drag auf (z. B. wenn mouseup außerhalb des Fensters verloren ging). */
let activeDragCleanup: (() => void) | null = null;

function startPointerDrag(
  e: React.MouseEvent,
  dropAttr: string,
  selfValue: string,
  onDrop: (targetValue: string) => void
) {
  // Nur die linke Maustaste startet einen Drag.
  if (e.button !== 0) return;
  e.preventDefault();
  e.stopPropagation();

  activeDragCleanup?.();

  const onMouseUp = (ev: MouseEvent) => {
    cleanup();
    const el = document.elementFromPoint(ev.clientX, ev.clientY);
    const targetEl = el ? (el as HTMLElement).closest(`[${dropAttr}]`) : null;
    if (!targetEl) return;
    const targetValue = targetEl.getAttribute(dropAttr);
    if (targetValue !== null && targetValue !== selfValue) onDrop(targetValue);
  };

  // Verhindert Text-/Bild-Markierung während des Ziehens, ganz ohne natives
  // HTML5-Drag zu benötigen.
  const onSelectStart = (ev: Event) => ev.preventDefault();

  function cleanup() {
    window.removeEventListener('mouseup', onMouseUp, true);
    document.removeEventListener('selectstart', onSelectStart);
    activeDragCleanup = null;
  }

  activeDragCleanup = cleanup;
  window.addEventListener('mouseup', onMouseUp, true);
  document.addEventListener('selectstart', onSelectStart);
}

/** Drag-Handler für die Sektions-Umsortierung (ganze Abschnitte). Überall identisch. */
export function dragProps(
  index: number,
  onReorderSections?: (from: number, to: number) => void
) {
  if (!onReorderSections) return {};
  return {
    style: { cursor: 'grab' as const },
    [SECTION_DROP_ATTR]: String(index),
  };
}

/**
 * Sichtbarer Ziehgriff für die Sektions-Umsortierung (ganze Abschnitte:
 * Zertifikate, Sprachen, Stipendien, …).
 *
 * WARUM ES DIESEN GRIFF BRAUCHT — und `draggable` auf der Karte allein NICHT
 * reicht:
 *
 * CVLiveEditorPage zeigt jede Karte in einer verkleinerten Vorschau. Ein Klick
 * darauf öffnet eine vergrößerte Fokus-Ansicht zum Editieren (sonst wäre auf
 * einer 0.5×-skalierten Karte kein Text präzise treffbar). Damit dieser Klick
 * nicht zuerst eine Text-Markierung oder einen nativen Text-Drag im winzigen
 * contentEditable-Feld auslöst, wird `mousedown` auf jeder Karte in der
 * Vorschau abgefangen (`swallowMouseDown`, `e.preventDefault()`).
 *
 * Genau das verhindert aber AUCH den Start von HTML5-Drag: der Browser
 * initiiert einen Drag nur, wenn das auslösende `mousedown` nicht abgefangen
 * wurde. Mit `draggable` auf der ganzen Karte (die fast vollständig aus
 * contentEditable-Feldern besteht) gab es dadurch faktisch keine Stelle mehr,
 * von der aus ein Drag hätte starten können — das war der eigentliche Grund,
 * warum sich Sektionen/Stationen nicht verschieben ließen.
 *
 * Der Griff ist deshalb ein eigenes, NICHT editierbares Element
 * (`contentEditable={false}`) mit `data-drag-handle`. CVLiveEditorPage lässt
 * `mousedown`/`click` auf `[data-drag-handle]` ausdrücklich durch
 * (swallowMouseDown/openFocus), sodass von hier aus ein echter Browser-Drag
 * starten kann. `draggable` bleibt zusätzlich auf der Karte selbst (via
 * `dragProps`/`itemDragProps`) bestehen — nicht als zweiter Startpunkt
 * (der würde durch swallowMouseDown weiterhin blockiert), sondern damit die
 * Karte weiterhin als Drop-Ziel (`onDragOver`/`onDrop`) funktioniert.
 */
export const SectionDragHandle: React.FC<{
  index: number;
  onReorderSections?: (from: number, to: number) => void;
  title?: string;
}> = ({ index, onReorderSections, title = 'Ziehen zum Verschieben' }) => {
  if (!onReorderSections) return null;
  return (
    <span
      data-drag-handle
      contentEditable={false}
      suppressContentEditableWarning
      className="pdf-hidden"
      title={title}
      style={dragHandleStyle}
      onMouseDown={(e) =>
        startPointerDrag(e, SECTION_DROP_ATTR, String(index), (targetValue) => {
          const to = parseInt(targetValue, 10);
          if (!isNaN(to)) onReorderSections(index, to);
        })
      }
    >
      <GripVertical size={16} />
    </span>
  );
};

/** Ziehgriff für ein einzelnes Item INNERHALB einer Sektion (z. B. eine
 *  Berufsstation über eine andere ziehen). Gleiche Begründung wie
 *  `SectionDragHandle`, eigene dataTransfer-Keys damit beide Dragging-Arten
 *  nicht kollidieren (siehe `itemDragProps`). */
export const ItemDragHandle: React.FC<{
  sectionIndex: number;
  itemIndex: number;
  onReorderSectionItem?: (sectionIndex: number, from: number, to: number) => void;
  title?: string;
}> = ({ sectionIndex, itemIndex, onReorderSectionItem, title = 'Ziehen zum Verschieben' }) => {
  if (!onReorderSectionItem) return null;
  const selfKey = `${sectionIndex}:${itemIndex}`;
  return (
    <span
      data-drag-handle
      contentEditable={false}
      suppressContentEditableWarning
      className="pdf-hidden"
      title={title}
      style={dragHandleStyle}
      onMouseDown={(e) =>
        startPointerDrag(e, ITEM_DROP_ATTR, selfKey, (targetValue) => {
          const [targetSection, targetItem] = targetValue.split(':').map((v) => parseInt(v, 10));
          // Nur innerhalb derselben Sektion verschieben — zwischen Sektionen
          // (z. B. eine Berufsstation nach Ausbildung ziehen) würde das
          // Datenschema brechen.
          if (targetSection === sectionIndex && !isNaN(targetItem)) {
            onReorderSectionItem(sectionIndex, itemIndex, targetItem);
          }
        })
      }
    >
      <GripVertical size={16} />
    </span>
  );
};

const dragHandleStyle: React.CSSProperties = {
  position: 'absolute',
  top: '-2px',
  left: '-22px',
  width: '22px',
  height: '22px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'grab',
  color: '#94a3b8',
  background: 'rgba(255,255,255,0.9)',
  borderRadius: '3px',
  zIndex: 10,
};

/** Drag-Handler zum Verschieben einzelner Items INNERHALB einer Sektion
 *  (z. B. eine Berufsstation über eine andere ziehen). Nutzt eigene
 *  dataTransfer-Keys, damit ein gleichzeitig aktives Sektions-Dragging
 *  (dragProps) nicht kollidiert. */
export function itemDragProps(
  sectionIndex: number,
  itemIndex: number,
  onReorderSectionItem?: (sectionIndex: number, fromIndex: number, toIndex: number) => void
) {
  if (!onReorderSectionItem) return {};
  return {
    [ITEM_DROP_ATTR]: `${sectionIndex}:${itemIndex}`,
  };
}