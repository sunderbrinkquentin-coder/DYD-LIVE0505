// src/components/cv-templates/templates/ProfessionalCVTemplate.tsx

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { SectionDragHandle, ItemDragHandle } from '../EditableText';
import { sanitizeGeneratedText } from '../../../utils/textSanitize';

type EditorSection = {
  type: string;
  title?: string;
  items?: any[];
  [key: string]: any;
};

interface PersonalInfo {
  name?: string;
  title?: string;
  email?: string;
  phone?: string;
  location?: string;
  linkedin?: string;
  [key: string]: any;
}

interface ProfessionalCVTemplateProps {
  personalInfo: PersonalInfo;
  summary?: string;
  sections: EditorSection[];
  photoUrl?: string;
  photoPosition?: { x: number; y: number };
  /**
   * NEU: Höhe kommt jetzt — wie bei allen anderen Templates — aus der
   * Break-Engine. Der frühere eigene ResizeObserver ist entfernt; er hat
   * gegen die Engine gearbeitet.
   */
  minHeightPx?: number;
  onUpdatePersonalInfo: (field: string, value: string) => void;
  onUpdateSummary: (value: string) => void;
  onUpdateSection?: (sectionIndex: number, updates: Partial<EditorSection>) => void;
  onUpdateSectionItem: (
    sectionIndex: number,
    itemIndex: number,
    field: string,
    value: any
  ) => void;
  onAddSectionItem?: (sectionIndex: number, defaultItem: any) => void;
  onDeleteSectionItem?: (sectionIndex: number, itemIndex: number) => void;
  onDeleteBullet?: (sectionIndex: number, itemIndex: number, bulletIndex: number) => void;
  onReorderSections?: (fromIndex: number, toIndex: number) => void;
  onReorderSectionItem?: (sectionIndex: number, fromIndex: number, toIndex: number) => void;
  /** LEGACY — nicht mehr verwendet (Paginierung läuft über data-break-*). */
  pageBreakItems?: Map<string, number>;
  pageCount?: number;
}

const EditableText: React.FC<{
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  wrap?: boolean;
  style?: React.CSSProperties;
  /**
   * Element-Tag, Default `div`.
   *
   * FIX (AddFieldButton hängt weit rechts, losgelöst vom Text): jedes
   * EditableText hier bekam bisher zwingend die Klasse `w-full`, auch wenn
   * direkt daneben (im selben Flex-Container) ein "+"-Button folgen sollte.
   * `w-full` auf einem Flex-Item erzwingt die volle Zeilenbreite als
   * Flex-Basis — der Button landet dadurch ganz rechts im Container statt
   * direkt hinterm Text. `as="span"` (wie in EditableText.tsx/Classic bereits
   * gelöst) lässt die Breite dem Inhalt folgen, der Button rutscht direkt
   * neben den Text.
   */
  as?: 'div' | 'span';
}> = ({ value, onChange, className = '', placeholder = '', multiline = false, wrap = false, style, as = 'div' }) => {
  const v = value ?? '';
  const ref = useRef<HTMLElement>(null);
  const isComposing = useRef(false);
  const isFocused = useRef(false);
  const lastValue = useRef(v);
  const [renderKey, setRenderKey] = useState(sanitizeGeneratedText(v));

  // FIX (Quentin: "[JD]" und falsche Abstände vor Satzzeichen im Text): siehe
  // ausführlicher Kommentar in EditableText.tsx (gemeinsame Komponente).
  useEffect(() => {
    if (!isFocused.current) {
      const sanitized = sanitizeGeneratedText(v);
      setRenderKey(sanitized);
      lastValue.current = sanitized;
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

  const flows = multiline || wrap;

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
      className: [
        'outline-none focus:ring-0 cursor-text',
        as === 'div' ? 'w-full' : '',
        'empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300',
        className,
      ].filter(Boolean).join(' '),
      style: {
        whiteSpace: multiline ? 'pre-wrap' : wrap ? 'normal' : 'nowrap',
        wordBreak: flows ? 'break-word' : 'normal',
        overflow: flows ? 'visible' : 'hidden',
        textOverflow: flows ? 'unset' : 'ellipsis',
        ...(flows ? { overflowWrap: 'break-word' as const } : {}),
        ...style,
      },
    },
    renderKey
  );
};

/** Drag-Handler zum Verschieben einzelner Items INNERHALB einer Sektion. */
function itemDragProps(
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
      if (fromSection === sectionIndex && !isNaN(fromItem) && fromItem !== itemIndex) {
        onReorderSectionItem(sectionIndex, fromItem, itemIndex);
      }
    },
  };
}

/**
 * SectionTitle — jetzt mit `data-break-keep-next`, damit die Break-Engine die
 * Überschrift an ihren folgenden Inhalt bindet (kein Schnitt direkt unter dem
 * Titel). Zuvor fehlte dieses Attribut — einer der Gründe fürs Durchschneiden.
 */
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    data-break-keep-next
    className="mb-2 !text-[9px] font-bold tracking-[0.16em] text-slate-700 uppercase flex items-center gap-1.5"
  >
    <span className="w-1 h-1 rounded-full bg-slate-400" />
    {children}
  </h2>
);

const stripLeadingBullet = (s: string) =>
  s.replace(/^[-•\u2022]\s*/, '');

const getBullets = (item: any): string[] => {
  if (Array.isArray(item?.bulletPoints) && item.bulletPoints.length > 0) {
    return item.bulletPoints
      .map((s: any) => stripLeadingBullet(String(s ?? '').trim()))
      .filter((s: string) => s.length > 0);
  }

  if (typeof item?.description === 'string' && item.description.trim().length > 0) {
    return item.description
      .split('\n')
      .map((s: string) => stripLeadingBullet(s.trim()))
      .filter((s: string) => s.length > 0);
  }
  return [];
};

export const ProfessionalCVTemplate: React.FC<ProfessionalCVTemplateProps> = ({
  personalInfo,
  summary,
  sections,
  photoUrl,
  photoPosition = { x: 50, y: 50 },
  minHeightPx,
  onUpdatePersonalInfo,
  onUpdateSummary,
  onUpdateSectionItem,
  onDeleteSectionItem = () => {},
  onDeleteBullet,
  onReorderSections,
  onReorderSectionItem,
}) => {
  // Höhe kommt aus der Break-Engine (wie bei allen anderen Templates).
  // Der frühere ResizeObserver + `containerMinHeight`-State ist bewusst
  // entfernt: eine template-eigene Höhenmessung arbeitet gegen die Engine
  // und war Mitursache dafür, dass Professional als einziges „schnitt".
  const containerMinHeight = minHeightPx ?? 1122;

  // Leere optionale Felder (Ort, Kurzbeschreibung) reservieren sonst dauerhaft
  // eine graue Platzhalterzeile — genau die "Löcher"/"Satz vor den Bullets",
  // über die Quentin sich beschwert hat. Jetzt: Feld bleibt komplett weg, bis
  // ein kleiner "+"-Button (oben in der Kopfzeile der Station) es einblendet.
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const reveal = (key: string) => setRevealed((prev) => new Set(prev).add(key));
  // FIX (Quentin: "+" liegt über der Schrift, man kann dann manchmal nicht
  // reinschreiben): dieselbe Ursache wie im Classic-Template (siehe dortiger
  // ausführlicher Kommentar). `.pdf-hidden` erzwingt global position:absolute
  // + margin:0 !important — ohne den `data-inline-control`-Wrapper an jeder
  // Einsatzstelle (siehe unten) fällt der Button auf eine kaum vorhersagbare
  // "statische Position" zurück und landet fast exakt auf dem Text davor statt
  // sichtbar danach, inklusive dem verlorenen marginLeft. Zusätzlich jetzt
  // deutlich kontrastreicher (vorher: fast unsichtbarer gestrichelter Rahmen
  // in Grau), damit er auch bei Hover sofort auffindbar ist.
  const AddFieldButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
    <button
      type="button"
      className="pdf-hidden"
      title={label}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        verticalAlign: 'middle',
        border: '1px solid #30E3CA',
        borderRadius: '3px',
        background: '#ffffff',
        color: '#0f172a',
        cursor: 'pointer',
        padding: 0,
        lineHeight: 1,
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
      }}
    >
      <Plus size={11} />
    </button>
  );

  const handleBulletChange = (
    sectionIndex: number,
    itemIndex: number,
    bulletIndex: number,
    value: string,
    currentItem: any
  ) => {
    const currentBullets = getBullets(currentItem);
    const newBullets = [...currentBullets];
    newBullets[bulletIndex] = value;
    onUpdateSectionItem(sectionIndex, itemIndex, 'bulletPoints', newBullets);
  };

  const handleAddBullet = (
    sectionIndex: number,
    itemIndex: number,
    currentItem: any
  ) => {
    const currentBullets = getBullets(currentItem);
    onUpdateSectionItem(sectionIndex, itemIndex, 'bulletPoints', [
      ...currentBullets,
      'Neuer Punkt',
    ]);
  };

  const leftColumnTypes = ['experience', 'projects'];
  const rightColumnTypes = [
    'education',
    'languages',
    'skills',
    'soft_skills',
    'work_values',
    'values',
    'hobbies',
    'interests',
    'certifications',
    'courses',
    'awards',
    'volunteering',
    'stipendien',
    'scholarships',
  ];

  const leftSections = sections.filter((s) => leftColumnTypes.includes(s.type));
  const rightSections = sections.filter((s) => rightColumnTypes.includes(s.type));
  const otherSections = sections.filter(
    (s) => !leftColumnTypes.includes(s.type) && !rightColumnTypes.includes(s.type)
  );

  const renderSection = (section: EditorSection, sectionIndex: number) => {
    const items = Array.isArray(section.items) ? section.items : [];
    const TYPE_LABELS: Record<string, string> = {
      experience: 'Berufserfahrung',
      projects: 'Projekte',
      education: 'Ausbildung & Studium',
      languages: 'Sprachen',
      work_values: 'Arbeitsweise & Werte',
      values: 'Arbeitsweise & Werte',
      hobbies: 'Hobbys & Interessen',
      interests: 'Interessen',
      skills: 'Fähigkeiten',
      soft_skills: 'Soft Skills',
      hard_skills: 'Fachliche Skills',
      tools: 'Tools & Software',
      certifications: 'Zertifikate',
      courses: 'Weiterbildung',
      awards: 'Auszeichnungen',
      volunteering: 'Ehrenamt',
      stipendien: 'Stipendien',
      scholarships: 'Scholarships',
    };
    const sectionTitle = section.title || TYPE_LABELS[section.type] || section.type;

    const mustShow = section.type === 'experience' || section.type === 'projects';
    if (items.length === 0 && !mustShow) return null;

    switch (section.type) {
      case 'experience':
        if (!items || items.length === 0) return null;
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            <div className="space-y-2">
              {items.map((exp: any, idx: number) => {
                const bullets = getBullets(exp);
                return (
                  <div
                    key={idx}
                    data-pdf-section
                    data-break-item
                    style={{
                      display: 'block',
                      width: '100%',
                      position: 'relative',
                      cursor: onReorderSectionItem ? 'grab' : undefined,
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white/95"
                    {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
                  >
                    <ItemDragHandle sectionIndex={sectionIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                    <div className="flex justify-between gap-2 items-start">
                      {/* FIX (Wort-für-Wort-Umbruch/Buchstaben-Stapeln): das
                          vorherige `min-w-0` HIER zusammen mit `wrap` war
                          genau die Kombination, die in ClassicCVTemplate.tsx
                          (siehe dortige ausführliche Begründung) den Titel
                          auf Wortbreite kollabieren ließ — manche Browser
                          behandeln das Flex-Minimum bei min-w-0 + wrap-Modus
                          (overflowWrap:break-word) wie 'anywhere'. OHNE
                          min-w-0 floored das Feld auf seine längste-Wort-
                          Breite und bricht höchstens zwischen Wörtern um —
                          das reicht, damit die Datums-Spalte (flex-shrink:0)
                          nicht abgeschnitten wird, ohne die Kollaps-Gefahr. */}
                      <div className="flex-1">
                        <EditableText
                          wrap
                          className="text-[11px] font-bold text-slate-900"
                          value={exp.title || exp.position || ''}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'title', val)
                          }
                          placeholder="Position"
                        />
                        <div className="flex items-center">
                          <EditableText
                            as="span"
                            wrap
                            className="mt-0.5 text-[10px] text-slate-500"
                            value={exp.company || ''}
                            onChange={(val) =>
                              onUpdateSectionItem(sectionIndex, idx, 'company', val)
                            }
                            placeholder="Unternehmen"
                          />
                          {(( !(exp.location || exp.ort) && !revealed.has(`exp-${idx}-location`)) ||
                            (bullets.length === 0 && !exp.description && !revealed.has(`exp-${idx}-description`))) && (
                            <div data-inline-control className="pdf-hidden flex items-center gap-0.5">
                              {!(exp.location || exp.ort) && !revealed.has(`exp-${idx}-location`) && (
                                <AddFieldButton label="Ort hinzufügen" onClick={() => reveal(`exp-${idx}-location`)} />
                              )}
                              {bullets.length === 0 && !exp.description && !revealed.has(`exp-${idx}-description`) && (
                                <AddFieldButton label="Kurzbeschreibung hinzufügen" onClick={() => reveal(`exp-${idx}-description`)} />
                              )}
                            </div>
                          )}
                        </div>
                        {(exp.location || exp.ort || revealed.has(`exp-${idx}-location`)) && (
                          <EditableText
                            className="mt-0.5 text-[10px] text-slate-400"
                            value={exp.location || exp.ort || ''}
                            onChange={(val) =>
                              onUpdateSectionItem(sectionIndex, idx, 'location', val)
                            }
                            placeholder="Ort"
                          />
                        )}
                      </div>
                      {(exp.date_from || exp.date_to) && (
                        <div className="text-[9px] text-slate-500 text-right whitespace-nowrap flex flex-col items-end gap-0.5 flex-shrink-0">
                          <EditableText
                            className="text-right"
                            style={{ width: '60px' }}
                            value={exp.date_from || ''}
                            onChange={(val) =>
                              onUpdateSectionItem(sectionIndex, idx, 'date_from', val)
                            }
                            placeholder="Von"
                          />
                          <EditableText
                            className="text-right"
                            style={{ width: '60px' }}
                            value={exp.date_to || ''}
                            onChange={(val) =>
                              onUpdateSectionItem(sectionIndex, idx, 'date_to', val)
                            }
                            placeholder="Bis"
                          />
                        </div>
                      )}
                    </div>

                    {/* WICHTIG: description und bullets sind NIE gleichzeitig
                        sichtbar. getBullets() leitet Bullets AUS description
                        ab, wenn bulletPoints leer ist — description hier
                        zusätzlich als Fließtext zu zeigen hätte denselben
                        Inhalt doppelt gerendert (einmal als Satz, einmal
                        Zeile für Zeile als Bullets darunter). Das war der
                        "Kontext-Satz vor den Bullets", den Quentin gemeldet
                        hat — sein description-Feld kommt real befüllt aus
                        seiner Make/Supabase-Anbindung, ist also nie leer,
                        weshalb ein reines "nur wenn leer"-Guard nicht reichte. */}
                    {bullets.length === 0 && (exp.description || revealed.has(`exp-${idx}-description`)) && (
                      <EditableText
                        multiline
                        className="mt-1.5 text-[9.5px] text-slate-700 leading-tight"
                        style={{ minHeight: '16px' }}
                        value={exp.description || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'description', val)
                        }
                        placeholder="Kurze Beschreibung der Position"
                      />
                    )}
                    {bullets.length > 0 && (
                      <ul className="mt-1 !text-[9.5px] text-slate-800" style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {bullets.map((bp: string, bIdx: number) => (
                          <li key={bIdx} data-break-line style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                            <span style={{ flexShrink: 0, color: '#334155', fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                            <EditableText
                              multiline
                              className="text-slate-800 !text-[9.5px] leading-tight"
                              style={{ flex: 1, minHeight: '20px' }}
                              value={bp}
                              onChange={(val) => {
                                handleBulletChange(sectionIndex, idx, bIdx, val, exp);
                              }}
                              placeholder="Aufgabe / Erfolg"
                            />
                            {onDeleteBullet && (
                              <button
                                type="button"
                                className="pdf-hidden flex-shrink-0 text-red-400 hover:text-red-600 transition-colors mt-0.5"
                                style={{ lineHeight: 1, padding: '1px 3px', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}
                                onClick={() => onDeleteBullet(sectionIndex, idx, bIdx)}
                                title="Bullet löschen"
                              >×</button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    <button
                      type="button"
                      className="mt-1 text-[9px] text-sky-600 hover:underline pdf-hidden"
                      style={{ border: '1px solid #bae6fd', borderRadius: '4px', padding: '2px 7px', background: 'none', cursor: 'pointer', lineHeight: '1.5' }}
                      onClick={() => handleAddBullet(sectionIndex, idx, exp)}
                    >
                      + Bullet
                    </button>
                    <button
                      type="button"
                      className="mt-1 ml-3 text-[9px] text-red-500 hover:underline pdf-hidden"
                      style={{ border: '1px solid #fecaca', borderRadius: '4px', padding: '2px 7px', background: 'none', cursor: 'pointer', lineHeight: '1.5' }}
                      onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                    >
                      Station löschen
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'projects':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            <div className="space-y-2">
              {items.map((proj: any, idx: number) => {
                const bullets = getBullets(proj);
                return (
                  <div
                    key={idx}
                    data-pdf-section
                    data-break-item
                    style={{
                      display: 'block',
                      width: '100%',
                      position: 'relative',
                      cursor: onReorderSectionItem ? 'grab' : undefined,
                    }}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white/95"
                    {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
                  >
                    <ItemDragHandle sectionIndex={sectionIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                    <div className="flex justify-between gap-2 items-start">
                      {/* Kein min-w-0 — siehe Begründung bei Berufserfahrung
                          oben (min-w-0 + wrap kollabiert den Titel). */}
                      <div className="flex-1">
                        <div className="flex items-center">
                          <EditableText
                            as="span"
                            wrap
                            className="text-[11px] font-bold text-slate-900"
                            value={proj.title || proj.name || ''}
                            onChange={(val) =>
                              onUpdateSectionItem(sectionIndex, idx, 'title', val)
                            }
                            placeholder="Projekt"
                          />
                          {!proj.role && !revealed.has(`proj-${idx}-role`) && (
                            <div data-inline-control className="pdf-hidden flex items-center gap-0.5">
                              <AddFieldButton label="Rolle hinzufügen" onClick={() => reveal(`proj-${idx}-role`)} />
                            </div>
                          )}
                        </div>
                        {(proj.role || revealed.has(`proj-${idx}-role`)) && (
                          <EditableText
                            wrap
                            className="mt-0.5 text-[10px] text-slate-500"
                            value={proj.role || ''}
                            onChange={(val) =>
                              onUpdateSectionItem(sectionIndex, idx, 'role', val)
                            }
                            placeholder="Rolle"
                          />
                        )}
                      </div>
                    </div>

                    {bullets.length > 0 ? (
                      <ul className="mt-1 !text-[9.5px] text-slate-800" style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {bullets.map((bp: string, bIdx: number) => (
                          <li key={bIdx} data-break-line style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                            <span style={{ flexShrink: 0, color: '#334155', fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                            <EditableText
                              multiline
                              className="text-slate-800 !text-[9.5px] leading-tight"
                              style={{ minHeight: '20px' }}
                              value={bp}
                              onChange={(val) => {
                                handleBulletChange(sectionIndex, idx, bIdx, val, proj);
                              }}
                              placeholder="Ergebnis / Beitrag"
                            />
                            {onDeleteBullet && (
                              <button
                                type="button"
                                className="pdf-hidden flex-shrink-0 text-red-400 hover:text-red-600 transition-colors mt-0.5"
                                style={{ lineHeight: 1, padding: '1px 3px', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}
                                onClick={() => onDeleteBullet(sectionIndex, idx, bIdx)}
                                title="Bullet löschen"
                              >×</button>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      proj.description && (
                        <EditableText
                          multiline
                          className="mt-0.5 text-[9.5px] text-slate-800 leading-tight"
                          style={{ minHeight: '40px' }}
                          value={proj.description || ''}
                          onChange={(val) => {
                            onUpdateSectionItem(sectionIndex, idx, 'description', val);
                          }}
                          placeholder="Kurzbeschreibung"
                        />
                      )
                    )}

                    <button
                      type="button"
                      className="mt-0.5 text-[9px] text-sky-600 hover:underline pdf-hidden"
                      style={{ border: '1px solid #bae6fd', borderRadius: '4px', padding: '2px 7px', background: 'none', cursor: 'pointer', lineHeight: '1.5' }}
                      onClick={() => handleAddBullet(sectionIndex, idx, proj)}
                    >
                      + Bullet
                    </button>
                    <button
                      type="button"
                      className="mt-0.5 ml-3 text-[9px] text-red-500 hover:underline pdf-hidden"
                      style={{ border: '1px solid #fecaca', borderRadius: '4px', padding: '2px 7px', background: 'none', cursor: 'pointer', lineHeight: '1.5' }}
                      onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                    >
                      Station löschen
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      /**
       * FIX (Ausbildung „komisch" / leer): liest jetzt `edu.degree || edu.title`
       * — kommt der Wert beim One-Click-Mapping als `title` statt `degree`,
       * blieb das Feld sonst leer. Ort jetzt immer sichtbar. `data-break-item`
       * bindet jede Station als unteilbaren Block.
       */
      case 'education':
        return (
          <div key={sectionIndex}>
            <SectionTitle>Ausbildung & Studium</SectionTitle>
            <div className="space-y-1.5">
              {items.map((edu: any, idx: number) => (
                <div
                  key={idx}
                  data-pdf-section
                  data-break-item
                  style={{
                    display: 'block',
                    width: '100%',
                    position: 'relative',
                    cursor: onReorderSectionItem ? 'grab' : undefined,
                  }}
                  className="px-2 py-1 rounded-md"
                  {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
                >
                  <ItemDragHandle sectionIndex={sectionIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                  <div className="flex justify-between gap-2 items-start">
                    {/* Kein min-w-0 — siehe Begründung bei Berufserfahrung
                        oben (min-w-0 + wrap kollabiert den Titel). */}
                    <div className="flex-1">
                      <EditableText
                        wrap
                        className="text-[11px] font-bold text-slate-900"
                        value={edu.degree || edu.title || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'degree', val)
                        }
                        placeholder="Abschluss / Studiengang"
                      />
                      <div className="flex items-center">
                        <EditableText
                          as="span"
                          wrap
                          className="mt-0.5 text-[10px] text-slate-500"
                          value={edu.institution || ''}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'institution', val)
                          }
                          placeholder="Institution"
                        />
                        {((!edu.location && !revealed.has(`edu-${idx}-location`)) ||
                          (!edu.description && !(Array.isArray(edu.focus) ? edu.focus.length : edu.focus) && !revealed.has(`edu-${idx}-description`))) && (
                          <div data-inline-control className="pdf-hidden flex items-center gap-0.5">
                            {!edu.location && !revealed.has(`edu-${idx}-location`) && (
                              <AddFieldButton label="Ort hinzufügen" onClick={() => reveal(`edu-${idx}-location`)} />
                            )}
                            {!edu.description && !(Array.isArray(edu.focus) ? edu.focus.length : edu.focus) && !revealed.has(`edu-${idx}-description`) && (
                              <AddFieldButton label="Schwerpunkte hinzufügen" onClick={() => reveal(`edu-${idx}-description`)} />
                            )}
                          </div>
                        )}
                      </div>
                      {(edu.location || revealed.has(`edu-${idx}-location`)) && (
                        <EditableText
                          className="mt-0.5 text-[9.5px] text-slate-400"
                          value={edu.location || ''}
                          onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'location', val)}
                          placeholder="Ort"
                        />
                      )}
                    </div>
                    {(edu.date_from || edu.date_to) && (
                      <div className="text-[9px] text-slate-500 text-right whitespace-nowrap flex flex-col items-end gap-0.5 flex-shrink-0">
                        <EditableText
                          className="text-right"
                          style={{ width: '60px' }}
                          value={edu.date_from || ''}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'date_from', val)
                          }
                          placeholder="Von"
                        />
                        <EditableText
                          className="text-right"
                          style={{ width: '60px' }}
                          value={edu.date_to || ''}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'date_to', val)
                          }
                          placeholder="Bis"
                        />
                      </div>
                    )}
                  </div>
                  {(edu.grade || edu.grades || edu.note) && (
                    <div className="mt-0.5 flex items-center gap-1 text-[9.5px] text-slate-500">
                      <span className="font-semibold text-[#30E3CA]">Note:</span>
                      <EditableText
                        className="flex-1 text-[9.5px] text-slate-500"
                        value={edu.grade || edu.grades || edu.note || ''}
                        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'grade', val)}
                        placeholder="Note"
                      />
                    </div>
                  )}
                  {(edu.description || edu.focus || revealed.has(`edu-${idx}-description`)) && (
                    <EditableText
                      multiline
                      className="mt-0.5 text-[9.5px] text-slate-600 leading-tight"
                      style={{ minHeight: '16px' }}
                      value={edu.description || (Array.isArray(edu.focus) ? edu.focus.join(', ') : edu.focus) || ''}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'description', val)}
                      placeholder="Schwerpunkte / Beschreibung"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      /**
       * FIX (Sprachniveau abgeschnitten): beide Felder jetzt mit `wrap`, das
       * Niveau bekommt etwas mehr Breite und bricht bei langen Werten UM statt
       * abgeschnitten zu werden. `data-break-atomic` hält den Sprachblock
       * zusammen.
       */
      case 'languages':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section data-break-atomic style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <SectionTitle>Sprachen</SectionTitle>
            <div className="space-y-1">
              {items.map((lang: any, idx: number) => {
                const rawLangVal = typeof lang === 'string'
                  ? lang
                  : (lang.language || lang.name || lang.sprache || lang.skill || lang.label || '');
                const langVal = rawLangVal
                  .replace(/^(programmiersprachen|technische\s*f[äa]higkeiten|fachkenntnisse|kenntnisse|sprachen|fähigkeiten|soft\s*skills|skills|languages|kompetenzen|tools?)[:\s\-–]+/i, '')
                  .replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();

                const levelVal = typeof lang === 'object' && lang !== null
                  ? (lang.level || lang.niveau || lang.proficiency || '')
                  : '';

                if (!langVal && !levelVal) return null;

                return (
                  <div
                    key={idx}
                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid', position: 'relative', cursor: onReorderSectionItem ? 'grab' : undefined }}
                    className="flex items-start justify-between gap-2 text-[9.5px] text-slate-800"
                    {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
                  >
                    <ItemDragHandle sectionIndex={sectionIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                    <EditableText
                      wrap
                      className="font-medium"
                      style={{ flex: '1 1 55%', overflowWrap: 'break-word' }}
                      value={langVal}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'language', val)}
                      placeholder="Sprache"
                    />
                    <EditableText
                      wrap
                      className="text-right text-slate-500"
                      style={{ flex: '0 0 42%', textAlign: 'right', overflowWrap: 'break-word' }}
                      value={levelVal}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'level', val)}
                      placeholder="Niveau"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'skills':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section data-break-atomic style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <SectionTitle>Fachliche Skills</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                if (!skill) return null;
                const val = typeof skill === 'string' ? skill : (skill.skill || skill.name || skill.label || '');
                const level = typeof skill === 'object' && skill !== null ? (skill.level || skill.niveau || '') : '';

                let cleanedVal = val.replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (cleanedVal === '') return null;

                const display = level ? `${cleanedVal} (${level.trim()})` : cleanedVal;
                return (
                  <span
                    key={idx}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '5px', marginBottom: '5px', marginLeft: onReorderSectionItem ? '10px' : undefined, verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid', lineHeight: 1.4, position: 'relative', cursor: onReorderSectionItem ? 'grab' : undefined }}
                    {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
                  >
                    <ItemDragHandle sectionIndex={sectionIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                    <EditableText
                      style={{ fontSize: '9px', color: '#1e293b', lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle', textAlign: 'center', width: 'auto' }}
                      value={display}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'skill', val)}
                      placeholder="Skill"
                    />
                  </span>
                );
              })}
            </div>
          </div>
        );

      case 'soft_skills':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section data-break-atomic style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <SectionTitle>Persönliche Stärken</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                if (!skill) return null;
                const val = typeof skill === 'string' ? skill : (skill.skill || skill.name || skill.label || '');
                const level = typeof skill === 'object' && skill !== null ? (skill.level || skill.niveau || '') : '';

                let cleanedVal = val.replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (cleanedVal === '') return null;

                const display = level ? `${cleanedVal} (${level.trim()})` : cleanedVal;
                return (
                  <span
                    key={idx}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '5px', marginBottom: '5px', marginLeft: onReorderSectionItem ? '10px' : undefined, verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid', lineHeight: 1.4, position: 'relative', cursor: onReorderSectionItem ? 'grab' : undefined }}
                    {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
                  >
                    <ItemDragHandle sectionIndex={sectionIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                    <EditableText
                      style={{ fontSize: '9px', color: '#1e293b', lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle', textAlign: 'center', width: 'auto' }}
                      value={display}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'skill', val)}
                      placeholder="Stärke"
                    />
                  </span>
                );
              })}
            </div>
          </div>
        );

      case 'work_values':
      case 'values':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section data-break-atomic>
            <SectionTitle>Arbeitsweise & Werte</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((val: any, idx: number) => {
                if (!val) return null;
                const v = typeof val === 'string' ? val : (val.label || val.name || '');

                let cleanedV = v.replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (cleanedV === '') return null;

                return (
                  <span
                    key={idx}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '5px', marginBottom: '5px', marginLeft: onReorderSectionItem ? '10px' : undefined, verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid', lineHeight: 1.4, position: 'relative', cursor: onReorderSectionItem ? 'grab' : undefined }}
                    {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
                  >
                    <ItemDragHandle sectionIndex={sectionIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                    <EditableText
                      style={{ fontSize: '9px', color: '#1e293b', lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle', textAlign: 'center', width: 'auto' }}
                      value={cleanedV}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'label', val)}
                      placeholder="Wert"
                    />
                  </span>
                );
              })}
            </div>
          </div>
        );

      case 'hobbies':
      case 'interests':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section data-break-atomic>
            <SectionTitle>Hobbys & Interessen</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((hob: any, idx: number) => {
                if (!hob) return null;
                const v = typeof hob === 'string' ? hob : (hob.label || hob.name || '');

                let cleanedV = v.replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (cleanedV === '') return null;

                return (
                  <span
                    key={idx}
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '5px', marginBottom: '5px', marginLeft: onReorderSectionItem ? '10px' : undefined, verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid', lineHeight: 1.4, position: 'relative', cursor: onReorderSectionItem ? 'grab' : undefined }}
                    {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
                  >
                    <ItemDragHandle sectionIndex={sectionIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                    <EditableText
                      style={{ fontSize: '9px', color: '#1e293b', lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle', textAlign: 'center', width: 'auto' }}
                      value={cleanedV}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'label', val)}
                      placeholder="Hobby"
                    />
                  </span>
                );
              })}
            </div>
          </div>
        );

      default:
        if (items.length === 0) return null;

        const detailedTypes = ['certifications', 'courses', 'awards', 'volunteering', 'stipendien', 'scholarships'];
        if (detailedTypes.includes(section.type)) {
          return (
            <div key={sectionIndex} data-pdf-section data-break-atomic style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <SectionTitle>{sectionTitle}</SectionTitle>
              <ul className="space-y-0.5 text-[9.5px] text-slate-800">
                {items.map((item: any, idx: number) => {
                  const name = item.name || item.title || item.label || item.degree || item.role || '';
                  const institution = item.institution || item.company || item.issuer || item.organization || '';
                  // Zeitspanne: fertiger String (`date`) oder aus getrennten
                  // Feldern zusammengesetzt (date_from/date_to bzw. startDate/
                  // endDate, z. B. aus dem Ehrenamt-Schritt) — vorher fiel
                  // date_to/endDate hier still unter den Tisch.
                  const rangeFrom = item.date_from || item.startDate || '';
                  const rangeTo = item.current ? 'Heute' : (item.date_to || item.endDate || '');
                  const composedRange = rangeFrom && rangeTo ? `${rangeFrom} – ${rangeTo}` : rangeFrom;
                  const date = item.date || composedRange || item.year || '';
                  const location = item.location || item.ort || '';
                  const itemKey = `detail-${sectionIndex}-${idx}`;
                  const showLocationBtn = !location && !revealed.has(`${itemKey}-location`);
                  const showRangeBtn = !date && !revealed.has(`${itemKey}-zeitraum`);
                  return (
                    <li
                      key={idx}
                      className="py-0.5 border-b border-slate-200 last:border-b-0"
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid', position: 'relative', cursor: onReorderSectionItem ? 'grab' : undefined }}
                      {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
                    >
                      <ItemDragHandle sectionIndex={sectionIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                      <div style={{ fontWeight: 600, marginBottom: institution || date ? '2px' : '0' }}>
                        <EditableText
                          wrap
                          className="text-slate-900"
                          value={name}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'name', val)
                          }
                          placeholder="Name/Titel"
                        />
                      </div>
                      {institution && (
                        <div style={{ fontSize: '9px', color: '#334155', marginBottom: date ? '2px' : '0' }}>
                          <EditableText
                            value={institution}
                            onChange={(val) =>
                              onUpdateSectionItem(sectionIndex, idx, 'institution', val)
                            }
                            placeholder="Institution"
                          />
                        </div>
                      )}
                      {date && (
                        <div style={{ fontSize: '9px', color: '#334155' }}>
                          <EditableText
                            value={date}
                            onChange={(val) =>
                              onUpdateSectionItem(sectionIndex, idx, 'date', val)
                            }
                            placeholder="Datum"
                          />
                        </div>
                      )}
                      {(showLocationBtn || showRangeBtn) && (
                        <div data-inline-control className="flex items-center gap-1 mt-0.5">
                          {showLocationBtn && (
                            <AddFieldButton label="Ort hinzufügen" onClick={() => reveal(`${itemKey}-location`)} />
                          )}
                          {showRangeBtn && (
                            <AddFieldButton label="Zeitraum hinzufügen" onClick={() => reveal(`${itemKey}-zeitraum`)} />
                          )}
                        </div>
                      )}
                      {(location || revealed.has(`${itemKey}-location`)) && (
                        <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>
                          <EditableText
                            value={location}
                            onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'location', val)}
                            placeholder="Ort"
                          />
                        </div>
                      )}
                      {(!date && revealed.has(`${itemKey}-zeitraum`)) && (
                        <div style={{ fontSize: '9px', color: '#334155', marginTop: '2px' }}>
                          <EditableText
                            value=""
                            onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'date', val)}
                            placeholder="z.B. 03/2022 – 06/2022"
                          />
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }

        return (
          <div key={sectionIndex} data-pdf-section data-break-atomic>
            <SectionTitle>{sectionTitle}</SectionTitle>
            <ul className="space-y-0.5 text-[9.5px] text-slate-800">
              {items.map((item: any, idx: number) => {
                const displayValue =
                  typeof item === 'string'
                    ? item
                    : item.name || item.title || item.label || JSON.stringify(item);
                return (
                  <li
                    key={idx}
                    className="py-0.5 border-b border-slate-200 last:border-b-0"
                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid', position: 'relative', cursor: onReorderSectionItem ? 'grab' : undefined }}
                    {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
                  >
                    <ItemDragHandle sectionIndex={sectionIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                    <EditableText
                      value={displayValue}
                      onChange={(val) =>
                        onUpdateSectionItem(sectionIndex, idx, 'name', val)
                      }
                      placeholder="Eintrag"
                      wrap
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
    }
  };

  return (
    <div
      className="relative bg-white font-sans w-full"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: `${containerMinHeight}px`,
      }}
    >
      <div>
      <header className="px-8 pt-7 pb-5 bg-slate-900 text-white flex justify-between gap-6 items-start border-b-4 border-[#30E3CA]" data-break-atomic>
        <div className="flex-1 min-w-0">
          <EditableText
            className="text-[22px] font-extrabold tracking-tight text-white"
            value={personalInfo.name || ''}
            onChange={(val) => onUpdatePersonalInfo('name', val)}
            placeholder="Name"
          />
          <div className="flex items-center gap-1 mt-1">
            <EditableText
              as="span"
              className="text-[12px] font-bold text-slate-200"
              value={personalInfo.title || ''}
              onChange={(val) => onUpdatePersonalInfo('title', val)}
              placeholder="Berufsbezeichnung"
            />
            {!personalInfo.location?.trim() && !revealed.has('header-location') && (
              <div data-inline-control className="pdf-hidden flex items-center">
                <AddFieldButton label="Ort hinzufügen" onClick={() => reveal('header-location')} />
              </div>
            )}
          </div>
          {(!personalInfo.location?.trim() && revealed.has('header-location')) && (
            <EditableText
              className="mt-0.5 text-[9.5px] text-slate-300"
              value={personalInfo.location || ''}
              onChange={(val) => onUpdatePersonalInfo('location', val)}
              placeholder="Ort"
            />
          )}

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[9.5px] text-slate-100">
            <div className="flex items-center gap-1.5">
              <span>📍</span>
              <EditableText
                className="placeholder:text-slate-300"
                value={personalInfo.location || ''}
                onChange={(val) => onUpdatePersonalInfo('location', val)}
                placeholder="Ort"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>☎</span>
              <EditableText
                className="placeholder:text-slate-300"
                value={personalInfo.phone || ''}
                onChange={(val) => onUpdatePersonalInfo('phone', val)}
                placeholder="Telefon"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>✉</span>
              <EditableText
                className="placeholder:text-slate-300"
                value={personalInfo.email || ''}
                onChange={(val) => onUpdatePersonalInfo('email', val)}
                placeholder="E-Mail"
              />
            </div>
            {personalInfo.linkedin !== undefined && (
              <div className="flex items-center gap-1.5">
                <span>in</span>
                <EditableText
                  className="placeholder:text-slate-300"
                  value={personalInfo.linkedin || ''}
                  onChange={(val) =>
                    onUpdatePersonalInfo('linkedin', val)
                  }
                  placeholder="LinkedIn (optional)"
                />
              </div>
            )}
          </div>
        </div>

        {photoUrl && (
          <div className="flex-shrink-0">
            <div className="w-20 h-24 rounded-lg overflow-hidden border border-slate-600 bg-slate-800">
              <img
                src={photoUrl}
                alt="Foto"
                className="w-full h-full"
                style={{ objectFit: 'cover', objectPosition: `${photoPosition.x}% ${photoPosition.y}%`, width: '80px', height: '96px', display: 'block' }}
              />
            </div>
          </div>
        )}
      </header>

      <div style={{ display: 'flex', width: '100%', backgroundColor: '#ffffff', flex: 'none', padding: '16px 0', boxSizing: 'border-box' }}>

        <section style={{ flex: '0 0 58%', minWidth: 0, paddingLeft: '32px', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div data-pdf-section data-break-atomic>
            <SectionTitle>Profil & Mehrwert</SectionTitle>
            <EditableText
              multiline
              className="mt-1 text-[9.5px] leading-relaxed text-slate-800 bg-slate-50 rounded-md border border-slate-200 px-3 py-2"
              style={{ minHeight: '60px' }}
              value={summary || ''}
              onChange={onUpdateSummary}
              placeholder="Beschreibe kurz dein Profil, deinen Mehrwert und deine Ziele."
            />
          </div>

          {leftSections.map((section) => {
            const idx = sections.findIndex((s) => s === section);
            const content = renderSection(section, idx);
            if (!content) return null;
            return (
              <div
                key={idx}
                className="pdf-section-drag"
                draggable={!!onReorderSections}
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(idx)); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== idx) onReorderSections?.(from, idx); }}
                style={{ position: 'relative', cursor: onReorderSections ? 'grab' : undefined }}
              >
                <SectionDragHandle index={idx} onReorderSections={onReorderSections} />
                {content}
              </div>
            );
          })}
        </section>

        <aside style={{ flex: '0 0 42%', minWidth: 0, paddingLeft: '12px', paddingRight: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {rightSections.map((section) => {
            const idx = sections.findIndex((s) => s === section);
            const content = renderSection(section, idx);
            if (!content) return null;
            return (
              <div
                key={idx}
                className="pdf-section-drag"
                draggable={!!onReorderSections}
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(idx)); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== idx) onReorderSections?.(from, idx); }}
                style={{ position: 'relative', cursor: onReorderSections ? 'grab' : undefined }}
              >
                <SectionDragHandle index={idx} onReorderSections={onReorderSections} />
                {content}
              </div>
            );
          })}
        </aside>
      </div>

      {otherSections.length > 0 && (
        <div className="px-8 pb-4 space-y-3 bg-white" data-pdf-section>
          {otherSections.map((section) => {
            const idx = sections.findIndex((s) => s === section);
            const content = renderSection(section, idx);
            if (!content) return null;
            return (
              <div
                key={idx}
                className="pdf-section-drag"
                draggable={!!onReorderSections}
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(idx)); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== idx) onReorderSections?.(from, idx); }}
                style={{ position: 'relative', cursor: onReorderSections ? 'grab' : undefined }}
              >
                <SectionDragHandle index={idx} onReorderSections={onReorderSections} />
                {content}
              </div>
            );
          })}
        </div>
      )}

      </div>
      <footer
        data-pdf-footer
        style={{
          borderTop: '1px solid #cbd5e1',
          padding: '10px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: '#64748b',
          fontFamily: 'sans-serif',
          marginTop: 'auto',
          flexShrink: 0,
          backgroundColor: '#ffffff',
          height: '40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ fontWeight: 600, flexShrink: 0 }}>Ort:</span>
          <EditableText
            className="text-slate-500"
            style={{ fontSize: '9px', width: '120px' }}
            value={personalInfo.location || ''}
            onChange={(val) => onUpdatePersonalInfo('location', val)}
            placeholder="Ort"
          />
        </div>

        <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
          {new Date().toLocaleDateString('de-DE')}
        </span>
      </footer>
    </div>
  );
};