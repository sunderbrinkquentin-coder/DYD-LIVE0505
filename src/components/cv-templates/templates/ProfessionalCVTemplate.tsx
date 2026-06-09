import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

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

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
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
  const summaryRef = useRef<HTMLTextAreaElement | null>(null);
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

  useEffect(() => {
    if (summaryRef.current) {
      summaryRef.current.style.height = 'auto';
      summaryRef.current.style.height = summaryRef.current.scrollHeight + 'px';
    }
  }, [summary]);

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
                        <input
                          className="w-full text-[11px] font-bold text-slate-900 bg-transparent outline-none"
                          value={exp.title || exp.position || ''}
                          onChange={(e) =>
                            onUpdateSectionItem(sectionIndex, idx, 'title', e.target.value)
                          }
                          placeholder="Position"
                        />
                        <input
                          className="mt-0.5 w-full text-[10px] text-slate-500 bg-transparent outline-none"
                          value={exp.company || ''}
                          onChange={(e) =>
                            onUpdateSectionItem(sectionIndex, idx, 'company', e.target.value)
                          }
                          placeholder="Unternehmen"
                        />
                        {(exp.location || exp.ort) && (
                          <input
                            className="mt-0.5 w-full text-[10px] text-slate-400 bg-transparent outline-none"
                            value={exp.location || exp.ort || ''}
                            onChange={(e) =>
                              onUpdateSectionItem(sectionIndex, idx, 'location', e.target.value)
                            }
                            placeholder="Ort"
                          />
                        )}
                      </div>
                      {(exp.date_from || exp.date_to) && (
                        <div className="text-[9px] text-slate-500 text-right whitespace-nowrap flex flex-col items-end gap-0.5 flex-shrink-0">
                          <input
                            className="bg-transparent outline-none w-20 text-right"
                            value={exp.date_from || ''}
                            onChange={(e) =>
                              onUpdateSectionItem(sectionIndex, idx, 'date_from', e.target.value)
                            }
                            placeholder="Von"
                          />
                          <input
                            className="bg-transparent outline-none w-20 text-right"
                            value={exp.date_to || ''}
                            onChange={(e) =>
                              onUpdateSectionItem(sectionIndex, idx, 'date_to', e.target.value)
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
                            <textarea
                              className="w-full bg-transparent outline-none text-slate-800 !text-[9.5px] leading-tight resize-none"
                              style={{ flex: 1, overflow: 'hidden', minHeight: '20px' }}
                              value={bp}
                              onChange={(e) => {
                                autoResize(e.target);
                                handleBulletChange(sectionIndex, idx, bIdx, e.target.value, exp);
                              }}
                              onFocus={(e) => autoResize(e.target)}
                              ref={(el) => { if (el) autoResize(el); }}
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
                        <textarea
                          className="mt-1.5 w-full text-[9.5px] text-slate-700 bg-transparent outline-none resize-none leading-tight"
                          style={{ height: 'auto', minHeight: '16px' }}
                          value={exp.description}
                          onChange={(e) =>
                            onUpdateSectionItem(sectionIndex, idx, 'description', e.target.value)
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
                        <input
                          className="w-full text-[11px] font-bold text-slate-900 bg-transparent outline-none"
                          value={proj.title || proj.name || ''}
                          onChange={(e) =>
                            onUpdateSectionItem(sectionIndex, idx, 'title', e.target.value)
                          }
                          placeholder="Projekt"
                        />
                        <input
                          className="mt-0.5 w-full text-[10px] text-slate-500 bg-transparent outline-none"
                          value={proj.role || ''}
                          onChange={(e) =>
                            onUpdateSectionItem(sectionIndex, idx, 'role', e.target.value)
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
                            <textarea
                              className="w-full bg-transparent outline-none text-slate-800 !text-[9.5px] leading-tight resize-none"
                              style={{ overflow: 'hidden', minHeight: '20px' }}
                              value={bp}
                              onChange={(e) => {
                                autoResize(e.target);
                                handleBulletChange(sectionIndex, idx, bIdx, e.target.value, proj);
                              }}
                              onFocus={(e) => autoResize(e.target)}
                              ref={(el) => { if (el) autoResize(el); }}
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
                        <textarea
                          className="mt-0.5 w-full text-[9.5px] text-slate-800 bg-transparent outline-none resize-none leading-tight"
                          style={{ overflow: 'hidden', minHeight: '40px' }}
                          value={proj.description || ''}
                          onChange={(e) => {
                            autoResize(e.target);
                            onUpdateSectionItem(sectionIndex, idx, 'description', e.target.value);
                          }}
                          onFocus={(e) => autoResize(e.target)}
                          ref={(el) => { if (el) autoResize(el); }}
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
                  <input
                    className="w-full text-[11px] font-bold text-slate-900 bg-transparent outline-none"
                    value={edu.degree || ''}
                    onChange={(e) =>
                      onUpdateSectionItem(sectionIndex, idx, 'degree', e.target.value)
                    }
                    placeholder="Abschluss / Studiengang"
                  />
                  <input
                    className="mt-0.5 w-full text-[10px] text-slate-500 bg-transparent outline-none"
                    value={edu.institution || ''}
                    onChange={(e) =>
                      onUpdateSectionItem(sectionIndex, idx, 'institution', e.target.value)
                    }
                    placeholder="Institution"
                  />
                  {(edu.date_from || edu.date_to) && (
                    <div className="mt-0.5 text-[9px] text-slate-500 flex gap-1">
                      <input
                        className="bg-transparent outline-none w-16"
                        value={edu.date_from || ''}
                        onChange={(e) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_from', e.target.value)
                        }
                        placeholder="Von"
                      />
                      <span>–</span>
                      <input
                        className="bg-transparent outline-none w-16"
                        value={edu.date_to || ''}
                        onChange={(e) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_to', e.target.value)
                        }
                        placeholder="Bis"
                      />
                    </div>
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
                    <input
                      className="bg-transparent outline-none flex-1"
                      value={langVal}
                      onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'language', e.target.value)}
                      placeholder="Sprache"
                    />
                    {levelVal && (
                      <input
                        className="bg-transparent outline-none text-right text-slate-500 w-[70px]"
                        value={levelVal}
                        onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'level', e.target.value)}
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
                    <input
                      size={Math.max(3, display.length)}
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#1e293b', minWidth: 'unset', border: 'none', width: 'auto', whiteSpace: 'nowrap' }}
                      value={display}
                      onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'skill', e.target.value)}
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
                    <input
                      size={Math.max(3, display.length)}
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#1e293b', minWidth: 'unset', border: 'none', width: 'auto', whiteSpace: 'nowrap' }}
                      value={display}
                      onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'skill', e.target.value)}
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
                    <input
                      size={Math.max(3, cleanedV.length)}
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#1e293b', border: 'none', minWidth: 'unset', width: 'auto' }}
                      value={cleanedV}
                      onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'label', e.target.value)}
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
                    <input
                      size={Math.max(3, cleanedV.length)}
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#1e293b', border: 'none', minWidth: 'unset', width: 'auto' }}
                      value={cleanedV}
                      onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'label', e.target.value)}
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
                        <input
                          className="w-full bg-transparent outline-none text-slate-900"
                          value={name}
                          onChange={(e) =>
                            onUpdateSectionItem(sectionIndex, idx, 'name', e.target.value)
                          }
                          placeholder="Name/Titel"
                        />
                      </div>
                      {institution && (
                        <div style={{ fontSize: '9px', color: '#334155', marginBottom: date ? '2px' : '0' }}>
                          <input
                            className="w-full bg-transparent outline-none"
                            value={institution}
                            onChange={(e) =>
                              onUpdateSectionItem(sectionIndex, idx, 'institution', e.target.value)
                            }
                            placeholder="Institution"
                          />
                        </div>
                      )}
                      {date && (
                        <div style={{ fontSize: '9px', color: '#334155' }}>
                          <input
                            className="w-full bg-transparent outline-none"
                            value={date}
                            onChange={(e) =>
                              onUpdateSectionItem(sectionIndex, idx, 'date', e.target.value)
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
                    <input
                      className="w-full bg-transparent outline-none"
                      value={displayValue}
                      onChange={(e) =>
                        onUpdateSectionItem(sectionIndex, idx, 'name', e.target.value)
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
          <input
            className="block w-full text-[22px] font-extrabold tracking-tight outline-none bg-transparent text-white"
            value={personalInfo.name || ''}
            onChange={(e) => onUpdatePersonalInfo('name', e.target.value)}
            placeholder="Name"
          />
          <input
            className="mt-1 block w-full text-[12px] font-bold text-slate-200 outline-none bg-transparent"
            value={personalInfo.title || ''}
            onChange={(e) => onUpdatePersonalInfo('title', e.target.value)}
            placeholder="Berufsbezeichnung"
          />

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[9.5px] text-slate-100">
            <div className="flex items-center gap-1.5">
              <span>📍</span>
              <input
                className="w-full bg-transparent outline-none placeholder:text-slate-300"
                value={personalInfo.location || ''}
                onChange={(e) => onUpdatePersonalInfo('location', e.target.value)}
                placeholder="Ort"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>☎</span>
              <input
                className="w-full bg-transparent outline-none placeholder:text-slate-300"
                value={personalInfo.phone || ''}
                onChange={(e) => onUpdatePersonalInfo('phone', e.target.value)}
                placeholder="Telefon"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>✉</span>
              <input
                className="w-full bg-transparent outline-none placeholder:text-slate-300"
                value={personalInfo.email || ''}
                onChange={(e) => onUpdatePersonalInfo('email', e.target.value)}
                placeholder="E-Mail"
              />
            </div>
            {personalInfo.linkedin !== undefined && (
              <div className="flex items-center gap-1.5">
                <span>in</span>
                <input
                  className="w-full bg-transparent outline-none placeholder:text-slate-300"
                  value={personalInfo.linkedin || ''}
                  onChange={(e) =>
                    onUpdatePersonalInfo('linkedin', e.target.value)
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
            <textarea
              ref={summaryRef}
              className="w-full mt-1 text-[9.5px] leading-relaxed text-slate-800 bg-slate-50 rounded-md border border-slate-200 outline-none resize-none px-3 py-2"
              style={{ minHeight: '60px' }}
              value={summary || ''}
              onChange={(e) => {
                onUpdateSummary(e.target.value);
                if (summaryRef.current) {
                  summaryRef.current.style.height = 'auto';
                  summaryRef.current.style.height = summaryRef.current.scrollHeight + 'px';
                }
              }}
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
          <input
            className="bg-transparent outline-none text-slate-500"
            style={{ fontSize: '9px', width: '120px' }}
            value={personalInfo.location || ''}
            onChange={(e) => onUpdatePersonalInfo('location', e.target.value)}
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