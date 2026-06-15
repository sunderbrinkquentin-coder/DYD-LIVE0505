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

interface ProfessionalCVTemplateProps {
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
  pageCount?: number;
}

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

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-4 mb-2 !text-[9px] font-bold tracking-[0.16em] text-slate-700 uppercase flex items-center gap-1.5">
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
  onUpdatePersonalInfo,
  onUpdateSummary,
  onUpdateSectionItem,
  onDeleteSectionItem = () => {},
  onDeleteBullet,
  onReorderSections,
  pageBreakItems,
  pageCount,
}) => {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [containerMinHeight, setContainerMinHeight] = useState(1122);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const update = () => {
      const h = el.offsetHeight;
      setContainerMinHeight(Math.max(1122, Math.ceil(h / 1122) * 1122));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
                // 🔥 Konsistente ID: section.type + sectionIndex + idx
                const itemKey = `${section.type}-${sectionIndex}-${idx}`;
                const spacer = pageBreakItems?.get(itemKey) ?? 0;
                const bullets = getBullets(exp);
                return (
                  <div
                    key={idx}
                    data-pdf-section
                    data-spacer-id={itemKey}
                    style={{ display: 'block', width: '100%', ...(spacer > 0 ? { marginTop: `${spacer}px` } : {}) }}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white/95"
                  >
                    <div className="flex justify-between gap-2 items-start">
                      <div className="flex-1 min-w-0">
                        <EditableText
                          className="text-[11px] font-bold text-slate-900"
                          value={exp.title || exp.position || ''}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'title', val)
                          }
                          placeholder="Position"
                        />
                        <EditableText
                          className="mt-0.5 text-[10px] text-slate-500"
                          value={exp.company || ''}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'company', val)
                          }
                          placeholder="Unternehmen"
                        />
                        {(exp.location || exp.ort) && (
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

                    {bullets.length > 0 ? (
                      <ul className="mt-1 !text-[9.5px] text-slate-800" style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {bullets.map((bp: string, bIdx: number) => (
                          <li key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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
                    ) : (
                      exp.description && (
                        <EditableText
                          multiline
                          className="mt-1.5 text-[9.5px] text-slate-700 leading-tight"
                          style={{ minHeight: '16px' }}
                          value={exp.description}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'description', val)
                          }
                          placeholder="Beschreibung"
                        />
                      )
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
                // 🔥 Konsistente ID: section.type + sectionIndex + idx
                const itemKey = `${section.type}-${sectionIndex}-${idx}`;
                const spacer = pageBreakItems?.get(itemKey) ?? 0;
                const bullets = getBullets(proj);
                return (
                  <div
                    key={idx}
                    data-pdf-section
                    data-spacer-id={itemKey}
                    style={{ display: 'block', width: '100%', ...(spacer > 0 ? { marginTop: `${spacer}px` } : {}) }}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white/95"
                  >
                    <div className="flex justify-between gap-2 items-start">
                      <div className="flex-1 min-w-0">
                        <EditableText
                          className="text-[11px] font-bold text-slate-900"
                          value={proj.title || proj.name || ''}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'title', val)
                          }
                          placeholder="Projekt"
                        />
                        <EditableText
                          className="mt-0.5 text-[10px] text-slate-500"
                          value={proj.role || ''}
                          onChange={(val) =>
                            onUpdateSectionItem(sectionIndex, idx, 'role', val)
                          }
                          placeholder="Rolle"
                        />
                      </div>
                    </div>

                    {bullets.length > 0 ? (
                      <ul className="mt-1 !text-[9.5px] text-slate-800" style={{ listStyle: 'none', padding: 0, margin: '4px 0 0', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {bullets.map((bp: string, bIdx: number) => (
                          <li key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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

      case 'education':
        return (
          <div key={sectionIndex}>
            <SectionTitle>Ausbildung & Studium</SectionTitle>
            <div className="space-y-1.5">
              {items.map((edu: any, idx: number) => {
                // 🔥 Konsistente ID: section.type + sectionIndex + idx
                const itemKey = `${section.type}-${sectionIndex}-${idx}`;
                const spacer = pageBreakItems?.get(itemKey) ?? 0;
                return (
                <div key={idx} data-pdf-section data-spacer-id={itemKey} style={{ display: 'block', width: '100%', ...(spacer > 0 ? { marginTop: `${spacer}px` } : {}) }} className="px-2 py-1 rounded-md">
                  <EditableText
                    className="text-[11px] font-bold text-slate-900"
                    value={edu.degree || ''}
                    onChange={(val) =>
                      onUpdateSectionItem(sectionIndex, idx, 'degree', val)
                    }
                    placeholder="Abschluss / Studiengang"
                  />
                  <EditableText
                    className="mt-0.5 text-[10px] text-slate-500"
                    value={edu.institution || ''}
                    onChange={(val) =>
                      onUpdateSectionItem(sectionIndex, idx, 'institution', val)
                    }
                    placeholder="Institution"
                  />
                  {edu.location && (
                    <EditableText
                      className="mt-0.5 text-[9.5px] text-slate-400"
                      value={edu.location || ''}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'location', val)}
                      placeholder="Ort"
                    />
                  )}
                  {(edu.date_from || edu.date_to) && (
                    <div className="mt-0.5 text-[9px] text-slate-500 flex gap-1">
                      <EditableText
                        style={{ width: '50px' }}
                        value={edu.date_from || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_from', val)
                        }
                        placeholder="Von"
                      />
                      <span>–</span>
                      <EditableText
                        style={{ width: '50px' }}
                        value={edu.date_to || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_to', val)
                        }
                        placeholder="Bis"
                      />
                    </div>
                  )}
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
                  {(edu.description || edu.focus) && (
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
                );
              })}
            </div>
          </div>
        );

      case 'languages':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <SectionTitle>Sprachen</SectionTitle>
            <div className="space-y-1">
              {items.map((lang: any, idx: number) => {
                const rawLangVal = typeof lang === 'string' ? lang : (lang.language || lang.name || lang.sprache || '');
                const langVal = rawLangVal.replace(/^(programmiersprachen|technische\s*f[äa]higkeiten|fachkenntnisse|kenntnisse|sprachen|fähigkeiten|soft\s*skills|skills|languages|kompetenzen|tools?)[:\s\-–]+/i, '').replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (!langVal) return null;

                const levelVal = typeof lang === 'object' && lang !== null ? (lang.level || lang.niveau || lang.proficiency || '') : '';
                return (
                  <div key={idx} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="flex items-center justify-between gap-2 text-[9.5px] text-slate-800">
                    <EditableText
                      className="flex-1"
                      value={langVal}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'language', val)}
                      placeholder="Sprache"
                    />
                    {levelVal && (
                      <EditableText
                        className="text-right text-slate-500"
                        style={{ width: '70px' }}
                        value={levelVal}
                        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'level', val)}
                        placeholder="Niveau"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'skills':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', marginBottom: '5px', verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', marginBottom: '5px', verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section>
            <SectionTitle>Arbeitsweise & Werte</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((val: any, idx: number) => {
                if (!val) return null;
                const v = typeof val === 'string' ? val : (val.label || val.name || '');
                
                let cleanedV = v.replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (cleanedV === '') return null;

                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', marginBottom: '5px', verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <EditableText
                      style={{ fontSize: '9px', color: '#1e293b', width: `${Math.max(2, cleanedV.length + 1)}ch` }}
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
          <div key={sectionIndex} data-pdf-section>
            <SectionTitle>Hobbys & Interessen</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((hob: any, idx: number) => {
                if (!hob) return null;
                const v = typeof hob === 'string' ? hob : (hob.label || hob.name || '');
                
                let cleanedV = v.replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (cleanedV === '') return null;

                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', marginBottom: '5px', verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <EditableText
                      style={{ fontSize: '9px', color: '#1e293b', width: `${Math.max(2, cleanedV.length + 1)}ch` }}
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

        // Check if this is a detailed section (certifications, courses, awards, volunteering, stipendien, scholarships)
        const detailedTypes = ['certifications', 'courses', 'awards', 'volunteering', 'stipendien', 'scholarships'];
        if (detailedTypes.includes(section.type)) {
          return (
            <div key={sectionIndex} data-pdf-section style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <SectionTitle>{sectionTitle}</SectionTitle>
              <ul className="space-y-0.5 text-[9.5px] text-slate-800">
                {items.map((item: any, idx: number) => {
                  const name = item.name || item.title || item.label || item.degree || '';
                  const institution = item.institution || item.company || item.issuer || item.organization || '';
                  const date = item.date || item.date_from || item.year || '';
                  return (
                    <li
                      key={idx}
                      className="py-0.5 border-b border-slate-200 last:border-b-0"
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: institution || date ? '2px' : '0' }}>
                        <EditableText
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
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }

        return (
          <div key={sectionIndex} data-pdf-section>
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
                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  >
                    <EditableText
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
      className="relative bg-white font-sans w-full"
      style={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: `${containerMinHeight}px`,
      }}
    >
      {/* Dunkler Professional-Header */}
      <div ref={contentRef}>
      <header className="px-8 pt-7 pb-5 bg-slate-900 text-white flex justify-between gap-6 items-start border-b-4 border-[#30E3CA]">
        <div className="flex-1 min-w-0">
          <EditableText
            className="text-[22px] font-extrabold tracking-tight text-white"
            value={personalInfo.name || ''}
            onChange={(val) => onUpdatePersonalInfo('name', val)}
            placeholder="Name"
          />
          <EditableText
            className="mt-1 text-[12px] font-bold text-slate-200"
            value={personalInfo.title || ''}
            onChange={(val) => onUpdatePersonalInfo('title', val)}
            placeholder="Berufsbezeichnung"
          />

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

      {/* Flexbox-Layout */}
      <div style={{ display: 'flex', width: '100%', backgroundColor: '#ffffff', flex: 'none', padding: '16px 0' }}>
        
        {/* Linke Spalte */}
        <section style={{ flex: '0 0 58%', minWidth: 0, paddingLeft: '32px', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
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
                style={{ cursor: onReorderSections ? 'grab' : undefined }}
              >
                {content}
              </div>
            );
          })}
        </section>

        {/* Rechte Spalte */}
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
                style={{ cursor: onReorderSections ? 'grab' : undefined }}
              >
                {content}
              </div>
            );
          })}
        </aside>
      </div>

      {/* Weitere Sections */}
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
                style={{ cursor: onReorderSections ? 'grab' : undefined }}
              >
                {content}
              </div>
            );
          })}
        </div>
      )}

      {/* 🔥 Footer mit marginTop: 'auto' — geht an den Boden der berechneten Seite */}
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