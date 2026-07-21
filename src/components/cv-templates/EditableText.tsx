// src/components/cv-templates/EditableText.tsx
//
// Bisher lag diese Komponente identisch in ClassicCVTemplate, MinimalCVTemplate
// und CreativeCVTemplate. Drei Kopien bedeuten drei Stellen, an denen ein Fix
// vergessen werden kann. Ab jetzt eine.

import React, { useCallback, useEffect, useRef, useState } from 'react';

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
   * BUG, der hier lag: Ohne `multiline` war ein Editable hart auf
   * `nowrap` + `overflow: hidden` + `text-overflow: ellipsis` gesetzt. Für
   * Datums-Badges und Chips ist das richtig — die sollen nie umbrechen. Für
   * Titel ist es falsch: ein langer Studiengang ("Wirtschaftsingenieurwesen
   * (Digital Engineering and Management, B. Eng.)") wurde im Editor bei der
   * Kartenbreite abgeschnitten, und im PDF setzt html2canvas weder das
   * Ellipsis noch das Clipping um — der volle String lief über die
   * Datums-Badge hinaus und wurde erst an der Blattkante gekappt.
   *
   * `wrap` erlaubt den Umbruch, ohne `multiline` zu setzen: Enter wird
   * weiterhin von `handleKeyDown` abgefangen, der Wert bleibt einzeilig.
   * Der Unterschied ist rein visuell — genau das, was ein Titel braucht.
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

  // `renderKey` wird als JSX-Kind gerendert, der korrekte Text steht also ab
  // dem ERSTEN Paint im DOM. Ein Effect käme zu spät — der PDF-Klon könnte
  // dazwischen gezogen werden und wäre leer.
  //
  // Der Wert spiegelt `v`, außer während der Fokus im Feld liegt: dann bleibt
  // er eingefroren, damit React den Knoten nicht mitten im Tippen neu mountet
  // (was den Cursor an den Anfang zurückwerfen würde).
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

  // `w-full` gehört nur an Block-Elemente. Auf einem inline gerenderten Chip
  // oder Date-Badge würde es die Breite sprengen.
  const baseClasses = [
    'outline-none focus:ring-0 cursor-text',
    as === 'div' || as === 'p' ? 'w-full' : '',
    'empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300',
    className,
  ].filter(Boolean).join(' ');

  // Drei Modi statt zwei:
  //   multiline        → mehrzeilig, Zeilenumbrüche im Wert erlaubt
  //   wrap             → einzeiliger Wert, darf aber visuell umbrechen
  //   (keins von beiden) → nowrap + Ellipsis (Badges, Chips, Datum)
  const flows = multiline || wrap;

  const flowStyle: React.CSSProperties = {
    whiteSpace: multiline ? 'pre-wrap' : wrap ? 'normal' : 'nowrap',
    wordBreak: flows ? 'break-word' : 'normal',
    overflow: flows ? 'visible' : 'hidden',
    textOverflow: flows ? 'unset' : 'ellipsis',
    // `break-word` allein rettet kein einzelnes überlanges Wort. `anywhere`
    // schon — relevant für lange Institutionsnamen ohne Leerzeichen.
    ...(flows ? { overflowWrap: 'anywhere' as const } : {}),
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
   * Seite. Templates dürfen diese Höhe NICHT selbst bestimmen; zwei
   * Höhen-Autoritäten waren einer der Gründe, warum Vorschau und PDF
   * auseinanderliefen.
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
}

/** Drag-Handler zum Verschieben einzelner Items INNERHALB einer Sektion
 *  (z. B. eine Berufsstation über eine andere ziehen). */
export function itemDragProps(
  sectionIndex: number,
  itemIndex: number,
  onReorderSectionItem?: (sectionIndex: number, fromIndex: number, toIndex: number) => void
) {
  if (!onReorderSectionItem) return {};
  return {
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData('application/x-item-index', String(itemIndex));
      e.dataTransfer.setData('application/x-section-index', String(sectionIndex));
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const fromSection = parseInt(e.dataTransfer.getData('application/x-section-index'), 10);
      const fromItem = parseInt(e.dataTransfer.getData('application/x-item-index'), 10);
      // Nur innerhalb derselben Sektion verschieben — zwischen Sektionen
      // (z. B. eine Berufsstation in Ausbildung ziehen) macht inhaltlich
      // keinen Sinn und würde das Datenschema brechen.
      if (fromSection === sectionIndex && !isNaN(fromItem) && fromItem !== itemIndex) {
        onReorderSectionItem(sectionIndex, fromItem, itemIndex);
      }
    },
  };
}