import React, { useCallback, useEffect, useRef, useState } from 'react';

export interface EditableTextProps {
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
  as?: 'div' | 'span' | 'p' | 'h1' | 'h2';
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
   * FIX (Bug A — senkrechter Buchstaben-Stapel):
   *
   * War vorher `overflowWrap: 'anywhere'` im `flows`-Zweig (also bei JEDEM
   * `wrap`- und `multiline`-Feld). `anywhere` erlaubt Umbruch zwischen
   * BELIEBIGEN Zeichen und senkt damit die min-content-Breite eines Elements
   * auf ein einzelnes Zeichen. Steht ein solches Feld in einer Flex-Zeile
   * neben einem festbreiten Nachbarn (z. B. einer Datums-Badge), quetscht
   * Flexbox es bei Platzmangel bis auf 1 Zeichen zusammen — der Text stapelt
   * sich senkrecht, Buchstabe für Buchstabe ("Senior Consultant" vertikal).
   *
   * Betraf nicht nur ClassicCVTemplate: ModernCVTemplate nutzt `wrap` z. B.
   * für `edu.degree`/`edu.institution` in der Ausbildungs-Sektion — dieselbe
   * Falle, nur bisher nicht aufgefallen, weil dort noch kein Titel lang genug
   * war, um sie auszulösen.
   *
   * `break-word` bricht weiterhin lange Wörter um (kein Text läuft über den
   * Rand hinaus), senkt die min-content-Breite aber nur bis zum längsten WORT,
   * nicht bis zu einem einzelnen Zeichen. Der Stapel-Effekt ist damit an der
   * Wurzel ausgeschlossen — für alle Templates, die `wrap` nutzen oder künftig
   * nutzen werden.
   */
  const flowStyle: React.CSSProperties = {
    whiteSpace: multiline ? 'pre-wrap' : wrap ? 'normal' : 'nowrap',
    wordBreak: flows ? 'break-word' : 'normal',
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

export function dragProps(
  index: number,
  onReorderSections?: (from: number, to: number) => void
) {
  if (!onReorderSections) return {};
  return {
    draggable: true,
    style: { cursor: 'grab' as const },
    onDragStart: (e: React.DragEvent) => {
      e.dataTransfer.setData('text/plain', String(index));
      e.dataTransfer.effectAllowed = 'move';
    },
    onDragOver: (e: React.DragEvent) => e.preventDefault(),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
      if (!isNaN(from) && from !== index) onReorderSections(from, index);
    },
  };
}