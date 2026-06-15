// src/components/cv-templates/templates/CreativeCVTemplate.tsx
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

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

interface CreativeCVTemplateProps {
  personalInfo: PersonalInfo;
  summary?: string;
  sections: EditorSection[];
  photoUrl?: string;
  photoPosition?: { x: number; y: number };
  onUpdatePersonalInfo: (field: string, value: string) => void;
  onUpdateSummary: (value: string) => void;
  onUpdateSection: (sectionIndex: number, updates: Partial<EditorSection>) => void;
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
  pageBreakItems?: Map<string, number>;
  pageCount?: number; // 🔥 NEU: Prop statt lokalem State
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-3 mb-1.5 !text-[9px] font-bold tracking-[0.16em] text-slate-600 uppercase flex items-center gap-1.5">
    <span className="w-1.5 h-1.5 rounded-full bg-[#22c1c3]" />
    {children}
  </h2>
);

const PAGE_HEIGHT_PX = 1122;

const EditableText: React.FC<{
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
}> = ({ value, onChange, className = '', placeholder = '', multiline = false, style }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);
  const lastValue = useRef(value ?? '');

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    const v = value ?? '';
    if (ref.current.textContent !== v) {
      ref.current.textContent = v;
    }
    lastValue.current = v;
  }, [value]);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const text = ref.current?.textContent ?? '';
    if (text !== lastValue.current) {
      lastValue.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }, [multiline]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onCompositionStart={() => { isComposing.current = true; }}
      onCompositionEnd={() => { isComposing.current = false; handleInput(); }}
      data-placeholder={placeholder}
      className={[
        'outline-none focus:ring-0 cursor-text w-full',
        'empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300',
        className,
      ].join(' ')}
      style={{
        whiteSpace: multiline ? 'pre-wrap' : 'nowrap',
        wordBreak: multiline ? 'break-word' : 'normal',
        overflow: multiline ? 'visible' : 'hidden',
        textOverflow: multiline ? 'unset' : 'ellipsis',
        ...style,
      }}
    />
  );
};

export const CreativeCVTemplate: React.FC<CreativeCVTemplateProps> = ({
  personalInfo,
  summary,
  sections,
  photoUrl,
  photoPosition = { x: 50, y: 50 },
  onUpdatePersonalInfo,
  onUpdateSummary,
  onUpdateSectionItem,
  onDeleteSectionItem = () => {},
  onDeleteBullet,
  onReorderSections,
  pageBreakItems,
  pageCount, // 🔥 direkt als Prop
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [containerMinHeight, setContainerMinHeight] = useState(PAGE_HEIGHT_PX);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => {
      const h = el.offsetHeight;
      setContainerMinHeight(Math.max(PAGE_HEIGHT_PX, Math.ceil(h / PAGE_HEIGHT_PX) * PAGE_HEIGHT_PX));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ─────────── Bullet-Helper ───────────
  const getBullets = (item: any): string[] => {
    if (Array.isArray(item?.bulletPoints) && item.bulletPoints.length > 0) {
      return item.bulletPoints;
    }
    if (typeof item?.description === 'string' && item.description.trim().length > 0) {
      return item.description
        .split('\n')
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    }
    return [];
  };

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
      'Neuer Bulletpoint',
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
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            {items.map((exp: any, idx: number) => {
              // 🔥 Konsistente ID: section.type + sectionIndex + idx
              const itemKey = `${section.type}-${sectionIndex}-${idx}`;
              const spacer = pageBreakItems?.get(itemKey) ?? 0;
              const bullets = getBullets(exp);
              return (
                <div
                  key={idx}
                  data-pdf-section
                  data-spacer-id={itemKey}
                  className="mb-2.5 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm w-full split-box-fix"
                  style={{ display: 'block', breakInside: 'auto', pageBreakInside: 'auto', ...(spacer > 0 ? { marginTop: `${spacer}px` } : {}) }}
                >
                  <div className="flex justify-between items-start gap-2" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <div className="flex-1 min-w-0">
                      <EditableText
                        className="font-bold text-[11px] text-slate-900"
                        value={exp.title || exp.position || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'title', val)
                        }
                        placeholder="Position"
                      />
                      <EditableText
                        className="text-[10px] text-slate-500 mt-0.5"
                        value={exp.company || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'company', val)
                        }
                        placeholder="Unternehmen"
                      />
                      {(exp.location || exp.ort) && (
                        <EditableText
                          className="text-[9.5px] text-slate-400 mt-0.5"
                          value={exp.location || exp.ort || ''}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'location', val)
                          }
                          placeholder="Ort"
                        />
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500 whitespace-nowrap flex-shrink-0 flex items-center gap-0.5">
                      <EditableText
                        className="text-right"
                        style={{ width: '40px' }}
                        value={exp.date_from || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_from', val)
                        }
                        placeholder="Von"
                      />
                      –
                      <EditableText
                        style={{ width: '40px' }}
                        value={exp.date_to || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_to', val)
                        }
                        placeholder="Bis"
                      />
                    </div>
                  </div>

                  {bullets.length > 0 ? (
                    <ul className="mt-1 !text-[9.5px] text-slate-700" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {bullets.map((bp: string, bIdx: number) => (
                        <li key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                          <span style={{ flexShrink: 0, color: '#22c1c3', fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                          <EditableText
                            multiline
                            className="flex-1 leading-snug text-slate-700 !text-[9.5px]"
                            value={bp}
                            onChange={(val) => {
                              handleBulletChange(sectionIndex, idx, bIdx, val, exp);
                            }}
                            placeholder="Aufgabe / Erfolg"
                          />
                          {onDeleteBullet && (
                            <button
                              type="button"
                              className="pdf-hidden flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                              style={{ lineHeight: 1, padding: '1px 3px', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}
                              onClick={() => onDeleteBullet(sectionIndex, idx, bIdx)}
                              title="Bullet löschen"
                            >×</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <EditableText
                        multiline
                        className="mt-0.5 text-[9.5px] text-slate-700 leading-snug"
                        style={{ minHeight: '20px' }}
                        value={exp.description || ''}
                        onChange={(val) => {
                          onUpdateSectionItem(sectionIndex, idx, 'description', val);
                        }}
                        placeholder="Aufgaben und Erfolge (jede Zeile = eigener Punkt)"
                      />
                    </div>
                  )}

                  <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="pdf-hidden">
                    <button
                      type="button"
                      className="mt-0.5 text-[9px] text-[#22c1c3]"
                      style={{ border: '1px solid #a5f3fc', borderRadius: '4px', padding: '2px 7px', background: 'none', cursor: 'pointer', lineHeight: '1.5' }}
                      onClick={() => handleAddBullet(sectionIndex, idx, exp)}
                    >
                      + Bullet
                    </button>
                    <button
                      type="button"
                      className="mt-0.5 ml-3 text-[9px] text-red-500"
                      style={{ border: '1px solid #fecaca', borderRadius: '4px', padding: '2px 7px', background: 'none', cursor: 'pointer', lineHeight: '1.5' }}
                      onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                    >
                      Station löschen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'projects':
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            {items.map((proj: any, idx: number) => {
              // 🔥 Konsistente ID: section.type + sectionIndex + idx
              const itemKey = `${section.type}-${sectionIndex}-${idx}`;
              const spacer = pageBreakItems?.get(itemKey) ?? 0;
              const bullets = getBullets(proj);
              return (
                <div
                  key={idx}
                  data-pdf-section
                  data-spacer-id={itemKey}
                  className="mb-2 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm w-full split-box-fix"
                  style={{ display: 'block', breakInside: 'auto', pageBreakInside: 'auto', ...(spacer > 0 ? { marginTop: `${spacer}px` } : {}) }}
                >
                  <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <EditableText
                      className="font-bold text-[11px] text-slate-900"
                      value={proj.title || proj.name || ''}
                      onChange={(val) =>
                        onUpdateSectionItem(sectionIndex, idx, 'title', val)
                      }
                      placeholder="Projekt"
                    />
                  </div>

                  {bullets.length > 0 ? (
                    <ul className="mt-1 !text-[9.5px] text-slate-700" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {bullets.map((bp: string, bIdx: number) => (
                        <li key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '4px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                          <span style={{ flexShrink: 0, color: '#22c1c3', fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                          <EditableText
                            multiline
                            className="flex-1 leading-snug text-slate-700 !text-[9.5px]"
                            value={bp}
                            onChange={(val) => {
                              handleBulletChange(sectionIndex, idx, bIdx, val, proj);
                            }}
                            placeholder="Detail / Ergebnis"
                          />
                          {onDeleteBullet && (
                            <button
                              type="button"
                              className="pdf-hidden flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                              style={{ lineHeight: 1, padding: '1px 3px', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}
                              onClick={() => onDeleteBullet(sectionIndex, idx, bIdx)}
                              title="Bullet löschen"
                            >×</button>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <EditableText
                        multiline
                        className="mt-0.5 text-[9.5px] text-slate-700 leading-snug"
                        style={{ minHeight: '20px' }}
                        value={proj.description || ''}
                        onChange={(val) => {
                          onUpdateSectionItem(sectionIndex, idx, 'description', val);
                        }}
                        placeholder="Kurzbeschreibung des Projekts"
                      />
                    </div>
                  )}

                  <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="pdf-hidden">
                    <button
                      type="button"
                      className="mt-0.5 text-[9px] text-[#22c1c3] hover:underline"
                      onClick={() => handleAddBullet(sectionIndex, idx, proj)}
                    >
                      + Bullet
                    </button>
                    <button
                      type="button"
                      className="mt-0.5 ml-3 text-[9px] text-red-500 hover:underline"
                      onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                    >
                      Station löschen
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );

      case 'education':
        return (
          <div key={sectionIndex}>
            <SectionTitle>Ausbildung & Studium</SectionTitle>
            {items.map((edu: any, idx: number) => {
              // 🔥 Konsistente ID: section.type + sectionIndex + idx
              const itemKey = `${section.type}-${sectionIndex}-${idx}`;
              const spacer = pageBreakItems?.get(itemKey) ?? 0;
              return (
                <div
                  key={idx}
                  data-pdf-section
                  data-spacer-id={itemKey}
                  className="mb-2 rounded-xl bg-white border border-slate-200 px-3 py-2 shadow-sm w-full split-box-fix"
                  style={{ display: 'block', breakInside: 'avoid', pageBreakInside: 'avoid', ...(spacer > 0 ? { marginTop: `${spacer}px` } : {}) }}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <EditableText
                        className="font-bold text-[11px] text-slate-900"
                        value={edu.degree || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'degree', val)
                        }
                        placeholder="Abschluss"
                      />
                      <EditableText
                        className="text-[10px] text-slate-500 mt-0.5"
                        value={edu.institution || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'institution', val)
                        }
                        placeholder="Institution"
                      />
                      {edu.location && (
                        <EditableText
                          className="text-[9.5px] text-slate-400 mt-0.5"
                          value={edu.location || ''}
                          onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'location', val)}
                          placeholder="Ort"
                        />
                      )}
                    </div>
                    <div className="text-[9.5px] text-slate-500 whitespace-nowrap flex-shrink-0 flex items-center gap-0.5">
                      <EditableText
                        className="text-right"
                        style={{ width: '40px' }}
                        value={edu.date_from || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_from', val)
                        }
                        placeholder="Von"
                      />
                      –
                      <EditableText
                        style={{ width: '40px' }}
                        value={edu.date_to || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_to', val)
                        }
                        placeholder="Bis"
                      />
                    </div>
                  </div>
                  {(edu.grade || edu.grades || edu.note) && (
                    <div className="mt-1 flex items-center gap-1 text-[9.5px] text-slate-500">
                      <span className="font-semibold text-[#22c1c3]">Note:</span>
                      <EditableText
                        className="flex-1 text-[9.5px] text-slate-500"
                        value={edu.grade || edu.grades || edu.note || ''}
                        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'grade', val)}
                        placeholder="Note"
                      />
                    </div>
                  )}
                  {(edu.description || edu.focus) && (
                    <EditableText
                      multiline
                      className="mt-1 text-[9.5px] text-slate-600 leading-snug"
                      style={{ minHeight: '16px' }}
                      value={edu.description || (Array.isArray(edu.focus) ? edu.focus.join(', ') : edu.focus) || ''}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'description', val)}
                      placeholder="Schwerpunkte / Beschreibung"
                    />
                  )}
                </div>
              );
            })}
          </div>
        );

      case 'languages':
        return (
          <div key={sectionIndex} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <SectionTitle>Sprachen</SectionTitle>
            <div className="space-y-0.5">
              {items.map((lang: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-[9.5px] text-slate-700"
                  style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                >
                  <EditableText
                    className="font-medium"
                    style={{ width: '50%' }}
                    value={
                      typeof lang === 'string'
                        ? lang
                        : lang.language || lang.name || ''
                    }
                    onChange={(val) =>
                      onUpdateSectionItem(sectionIndex, idx, 'language', val)
                    }
                    placeholder="Sprache"
                  />
                  <EditableText
                    className="text-slate-500 text-right text-[9px]"
                    style={{ width: '50%' }}
                    value={
                      typeof lang === 'object'
                        ? lang.level || lang.proficiency || ''
                        : ''
                    }
                    onChange={(val) =>
                      onUpdateSectionItem(sectionIndex, idx, 'level', val)
                    }
                    placeholder="Niveau"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'skills':
        return (
          <div key={sectionIndex} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div style={{ marginBottom: '2px', fontSize: '9px', fontWeight: 600, letterSpacing: '0.05em', color: '#64748b', textTransform: 'uppercase' }}>
              Fachlich
            </div>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                if (!skill) return null;
                const raw = typeof skill === 'string' ? skill : skill.skill || skill.name || '';
                const cleanedVal = raw.replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (!cleanedVal) return null;
                const level = typeof skill === 'object' && skill !== null ? skill.level || skill.niveau || '' : '';
                const display = level ? `${cleanedVal} (${level.trim()})` : cleanedVal;
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', padding: '2px 6px', borderRadius: '9999px', background: '#f0fdfe', border: '1px solid #38bdf8', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <EditableText
                      style={{ fontSize: '9px', color: '#1e293b', width: `${Math.max(2, display.length + 1)}ch` }}
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
        return (
          <div key={sectionIndex} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div style={{ marginBottom: '2px', fontSize: '9px', fontWeight: 600, letterSpacing: '0.05em', color: '#64748b', textTransform: 'uppercase' }}>
              Persönlich
            </div>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                if (!skill) return null;
                const raw = typeof skill === 'string' ? skill : skill.skill || skill.name || '';
                const cleanedVal = raw.replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (!cleanedVal) return null;
                const level = typeof skill === 'object' && skill !== null ? skill.level || skill.niveau || '' : '';
                const display = level ? `${cleanedVal} (${level.trim()})` : cleanedVal;
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', padding: '2px 6px', borderRadius: '9999px', background: '#f5f3ff', border: '1px solid #a855f7', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <EditableText
                      style={{ fontSize: '9px', color: '#1e293b', width: `${Math.max(2, display.length + 1)}ch` }}
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
        return (
          <div key={sectionIndex}>
            <SectionTitle>Arbeitsweise & Werte</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((val: any, idx: number) => {
                const v = typeof val === 'string' ? val : val.label || '';
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', padding: '2px 6px', borderRadius: '9999px', background: '#f0fdfe', border: '1px solid #22c1c3', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <EditableText
                      style={{ fontSize: '9px', color: '#1e293b', width: `${Math.max(2, v.length + 1)}ch` }}
                      value={v}
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
        return (
          <div key={sectionIndex}>
            <SectionTitle>Hobbys & Interessen</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((hob: any, idx: number) => {
                const v = typeof hob === 'string' ? hob : hob.label || '';
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', padding: '2px 6px', borderRadius: '9999px', background: '#fff7ed', border: '1px solid #f97316', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <EditableText
                      style={{ fontSize: '9px', color: '#1e293b', width: `${Math.max(2, v.length + 1)}ch` }}
                      value={v}
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
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            <ul className="space-y-1 text-[9.5px] text-slate-700">
              {items.map((item: any, idx: number) => {
                // Check if this is a detailed section (certifications, courses, awards, volunteering, stipendien, scholarships)
                const detailedTypes = ['certifications', 'courses', 'awards', 'volunteering', 'stipendien', 'scholarships'];

                if (detailedTypes.includes(section.type)) {
                  const name = item.name || item.title || item.label || item.degree || '';
                  const institution = item.institution || item.company || item.issuer || item.organization || '';
                  const date = item.date || item.date_from || item.year || '';
                  return (
                    <li
                      key={idx}
                      className="py-0.5 border-b border-white/30 last:border-b-0"
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: institution || date ? '2px' : '0' }}>
                        <EditableText
                          className="text-[#f9fafb]"
                          value={name}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'name', val)
                          }
                          placeholder="Name/Titel"
                        />
                      </div>
                      {institution && (
                        <div style={{ fontSize: '9px', color: '#e2e8f0', marginBottom: date ? '2px' : '0' }}>
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
                        <div style={{ fontSize: '9px', color: '#e2e8f0' }}>
                          <EditableText
                            value={date}
                            onChange={(val) =>
                              onUpdateSectionItem(sectionIndex, idx, 'date', val)
                            }
                            placeholder="Datum"
                          />
                        </div>
                      )}
                    </li>
                  );
                }

                const displayValue =
                  typeof item === 'string'
                    ? item
                    : item.name || item.title || item.label || JSON.stringify(item);
                return (
                  <li
                    key={idx}
                    className="py-0.5 border-b border-white/30 last:border-b-0"
                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  >
                    <EditableText
                      className="text-[#f9fafb]"
                      value={displayValue}
                      onChange={(val) =>
                        onUpdateSectionItem(sectionIndex, idx, 'name', val)
                      }
                      placeholder="Eintrag"
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
      className="relative bg-white text-slate-900 font-sans flex flex-col w-full"
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        minHeight: `${containerMinHeight}px`,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <style>{`
        @media print {
          @page { margin: 0 !important; }
          body, html, #root {
            background-color: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .split-box-fix {
            box-decoration-break: clone !important;
            -webkit-box-decoration-break: clone !important;
          }
        }
      `}</style>

      {/* Glow-Hintergrund */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute -top-10 -left-16 w-52 h-52 bg-[#22c1c3] blur-3xl rounded-full" />
        <div className="absolute -bottom-20 right-0 w-64 h-64 bg-[#66c0b6] blur-3xl rounded-full" />
      </div>

      {/* Header */}
      <div ref={contentRef}>
      <header className="relative px-6 pt-4 pb-2.5 flex items-center justify-between border-b border-slate-200 bg-slate-50 gap-3 flex-shrink-0">
        <div className="relative flex-1 min-w-0">
          <EditableText
            className="text-[22px] font-extrabold tracking-[0.12em] uppercase text-slate-900"
            value={personalInfo.name || ''}
            onChange={(val) => onUpdatePersonalInfo('name', val)}
            placeholder="Name"
          />
          <EditableText
            className="mt-0.5 text-[12px] font-bold text-slate-600"
            value={personalInfo.title || ''}
            onChange={(val) => onUpdatePersonalInfo('title', val)}
            placeholder="Titel"
          />
          <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[9.5px] text-slate-700">
            <div className="flex items-center gap-1.5">
              <span>📍</span>
              <EditableText
                value={personalInfo.location || ''}
                onChange={(val) => onUpdatePersonalInfo('location', val)}
                placeholder="Ort"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>☎</span>
              <EditableText
                value={personalInfo.phone || ''}
                onChange={(val) => onUpdatePersonalInfo('phone', val)}
                placeholder="Telefon"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>✉</span>
              <EditableText
                value={personalInfo.email || ''}
                onChange={(val) => onUpdatePersonalInfo('email', val)}
                placeholder="E-Mail"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>in</span>
              <EditableText
                value={personalInfo.linkedin || ''}
                onChange={(val) => onUpdatePersonalInfo('linkedin', val)}
                placeholder="LinkedIn"
              />
            </div>
          </div>
        </div>

        {photoUrl && (
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-slate-200 bg-slate-100 shadow-md">
              <img
                src={photoUrl}
                alt="Foto"
                className="w-full h-full"
                style={{ objectFit: 'cover', objectPosition: `${photoPosition.x}% ${photoPosition.y}%`, width: '80px', height: '80px', display: 'block' }}
              />
            </div>
          </div>
        )}
      </header>

      {/* Content */}
      <main className="relative px-6 py-3 grid grid-cols-12 gap-4 text-slate-800 bg-white" style={{ flex: 'none' }}>
        <section className="col-span-7 space-y-3">
          <div>
            <SectionTitle>Profil & Story</SectionTitle>
            <EditableText
              multiline
              className="mt-0.5 text-[9.5px] leading-relaxed text-slate-800 bg-slate-50 rounded-lg border border-slate-200 px-2 py-1.5"
              style={{ minHeight: '60px' }}
              value={summary || ''}
              onChange={onUpdateSummary}
              placeholder="Beschreibe kurz deinen Werdegang, dein Profil und was dich ausmacht."
            />
          </div>

          {leftSections.map((section) => {
            const sectionIndex = sections.findIndex((s) => s === section);
            const content = renderSection(section, sectionIndex);
            if (!content) return null;
            return (
              <div key={sectionIndex} draggable={!!onReorderSections}
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(sectionIndex)); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== sectionIndex) onReorderSections?.(from, sectionIndex); }}
                style={{ cursor: onReorderSections ? 'grab' : undefined }}
              >{content}</div>
            );
          })}
        </section>

        <aside className="col-span-5 space-y-3">
          {rightSections.map((section) => {
            const sectionIndex = sections.findIndex((s) => s === section);

            // Skills + Soft Skills zusammen als Block "Skills & Tools"
            if (section.type === 'skills' || section.type === 'soft_skills') {
              const skillsSection = rightSections.find((s) => s.type === 'skills');
              const softSkillsSection = rightSections.find((s) => s.type === 'soft_skills');

              if (section.type === 'skills' && (skillsSection || softSkillsSection)) {
                return (
                  <div key="skills-tools-block">
                    <SectionTitle>Skills & Tools</SectionTitle>
                    {skillsSection &&
                      renderSection(
                        skillsSection,
                        sections.findIndex((s) => s === skillsSection)
                      )}
                    {softSkillsSection &&
                      renderSection(
                        softSkillsSection,
                        sections.findIndex((s) => s === softSkillsSection)
                      )}
                  </div>
                );
              }

              if (section.type === 'soft_skills') {
                return null;
              }
            }

            return (
              <div key={sectionIndex} draggable={!!onReorderSections}
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(sectionIndex)); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== sectionIndex) onReorderSections?.(from, sectionIndex); }}
                style={{ cursor: onReorderSections ? 'grab' : undefined }}
              >{renderSection(section, sectionIndex)}</div>
            );
          })}
        </aside>
      </main>

      {otherSections.length > 0 && (
        <div className="relative px-6 pb-3 space-y-3 bg-white">
          {otherSections.map((section) => {
            const sectionIndex = sections.findIndex((s) => s === section);
            const content = renderSection(section, sectionIndex);
            if (!content) return null;
            return (
              <div key={sectionIndex} draggable={!!onReorderSections}
                onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(sectionIndex)); e.dataTransfer.effectAllowed = 'move'; }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== sectionIndex) onReorderSections?.(from, sectionIndex); }}
                style={{ cursor: onReorderSections ? 'grab' : undefined }}
              >{content}</div>
            );
          })}
        </div>
      )}

      {/* 🔥 Footer mit marginTop: 'auto' — geht an den Boden der berechneten Seite */}
      </div>
      <footer
        data-pdf-footer
        className="relative flex-shrink-0"
        style={{
          marginTop: 'auto',
          padding: '10px 24px',
          borderTop: '1px solid #cbd5e1',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          fontSize: '9px',
          color: '#64748b',
          backgroundColor: '#f8fafc',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Ort:</span>
          <EditableText
            className="border-b border-dashed border-slate-300 px-1 text-slate-700"
            style={{ width: '128px' }}
            placeholder="Stadt"
            value={personalInfo.location || ''}
            onChange={(val) => onUpdatePersonalInfo('location', val)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Datum:</span>
          <span style={{ fontWeight: 600 }}>{new Date().toLocaleDateString('de-DE')}</span>
        </div>
      </footer>
    </div>
  );
};