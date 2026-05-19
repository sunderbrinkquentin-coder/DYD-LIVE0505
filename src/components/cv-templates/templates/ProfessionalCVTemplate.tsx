import React, { useEffect, useRef } from 'react';

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
}

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
};

// Einheitlicher Section-Titel
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-4 mb-2 text-[10px] font-semibold tracking-[0.16em] text-slate-700 uppercase flex items-center gap-1.5">
    <span className="w-1 h-1 rounded-full bg-slate-400" />
    {children}
  </h2>
);

// Hilfsfunktion: führende Bullets entfernen („- …“, „• …“)
const stripLeadingBullet = (s: string) =>
  s.replace(/^[-•\u2022]\s*/, '');

// Bullet-Hilfsfunktion – verhindert doppelte Darstellung
const getBullets = (item: any): string[] => {
  if (Array.isArray(item?.bulletPoints) && item.bulletPoints.length > 0) {
    return item.bulletPoints
      .map((s: any) => stripLeadingBullet(String(s).trim()))
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
}) => {
  const summaryRef = useRef<HTMLTextAreaElement | null>(null);

  // Summary-Textarea automatisch an Inhalt anpassen
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
    };
    const sectionTitle = section.title || TYPE_LABELS[section.type] || section.type;

    // Berufserfahrung & Projekte werden gezeigt, wenn Items existieren – sonst Fallback
    const mustShow = section.type === 'experience' || section.type === 'projects';
    if (items.length === 0 && !mustShow) return null;

    switch (section.type) {
      // ───────────────── Berufserfahrung ─────────────────
      case 'experience':
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            <div className="space-y-2">
              {items.map((exp: any, idx: number) => {
                const bullets = getBullets(exp);
                return (
                  <div
                    key={idx}
                    data-avoid-break
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white/95"
                  >
                    <div className="flex justify-between gap-2 items-start">
                      <div className="flex-1 min-w-0">
                        <input
                          className="w-full text-[11px] font-semibold text-slate-900 bg-transparent outline-none"
                          value={exp.title || exp.position || ''}
                          onChange={(e) =>
                            onUpdateSectionItem(
                              sectionIndex,
                              idx,
                              'title',
                              e.target.value
                            )
                          }
                          placeholder="Position"
                        />
                        <input
                          className="mt-0.5 w-full text-[10px] text-slate-500 bg-transparent outline-none"
                          value={exp.company || ''}
                          onChange={(e) =>
                            onUpdateSectionItem(
                              sectionIndex,
                              idx,
                              'company',
                              e.target.value
                            )
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
                        <div className="text-[10px] text-slate-500 text-right whitespace-nowrap flex flex-col items-end gap-0.5 flex-shrink-0">
                          <input
                            className="bg-transparent outline-none w-20 text-right"
                            value={exp.date_from || ''}
                            onChange={(e) =>
                              onUpdateSectionItem(
                                sectionIndex,
                                idx,
                                'date_from',
                                e.target.value
                              )
                            }
                            placeholder="Von"
                          />
                          <input
                            className="bg-transparent outline-none w-20 text-right"
                            value={exp.date_to || ''}
                            onChange={(e) =>
                              onUpdateSectionItem(
                                sectionIndex,
                                idx,
                                'date_to',
                                e.target.value
                              )
                            }
                            placeholder="Bis"
                          />
                        </div>
                      )}
                    </div>

                    {/* Nur eine Darstellung: Liste ODER Textfield – mit Zeilenumbruch */}
                    {bullets.length > 0 ? (
                      <ul className="mt-1 space-y-[2px] text-[10px] text-slate-800" style={{ listStyle: 'none', padding: 0, margin: '4px 0 0' }}>
                        {bullets.map((bp: string, bIdx: number) => (
                          <li key={bIdx} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                            <span style={{ flexShrink: 0, marginTop: '4px', width: '4px', height: '4px', borderRadius: '50%', background: '#334155', display: 'inline-block' }} />
                            <textarea
                              className="w-full bg-transparent outline-none text-slate-800 text-[10px] leading-tight resize-none"
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
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <textarea
                        className="mt-0.5 w-full text-[10px] text-slate-800 bg-transparent outline-none resize-none leading-tight"
                        style={{ overflow: 'hidden', minHeight: '40px' }}
                        value={exp.description || ''}
                        onChange={(e) => {
                          autoResize(e.target);
                          onUpdateSectionItem(sectionIndex, idx, 'description', e.target.value);
                        }}
                        onFocus={(e) => autoResize(e.target)}
                        ref={(el) => { if (el) autoResize(el); }}
                        placeholder="Aufgaben / Erfolge"
                      />
                    )}

                    <button
                      type="button"
                      className="mt-0.5 text-[9px] text-sky-600 hover:underline"
                      onClick={() => handleAddBullet(sectionIndex, idx, exp)}
                    >
                      + Punkt hinzufügen
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      // ───────────────── Projekte ─────────────────
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
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white/95"
                  >
                    <div className="flex justify-between gap-2 items-start">
                      <div className="flex-1 min-w-0">
                        <input
                          className="w-full text-[11px] font-semibold text-slate-900 bg-transparent outline-none"
                          value={proj.title || proj.name || ''}
                          onChange={(e) =>
                            onUpdateSectionItem(
                              sectionIndex,
                              idx,
                              'title',
                              e.target.value
                            )
                          }
                          placeholder="Projekt"
                        />
                        <input
                          className="mt-0.5 w-full text-[10px] text-slate-500 bg-transparent outline-none"
                          value={proj.role || ''}
                          onChange={(e) =>
                            onUpdateSectionItem(
                              sectionIndex,
                              idx,
                              'role',
                              e.target.value
                            )
                          }
                          placeholder="Rolle"
                        />
                      </div>
                    </div>

                    {bullets.length > 0 ? (
                      <ul className="mt-1 ml-4 space-y-[2px] list-disc list-outside text-[10px] text-slate-800">
                        {bullets.map((bp: string, bIdx: number) => (
                          <li key={bIdx}>
                            <textarea
                              className="w-full bg-transparent outline-none text-slate-800 text-[10px] leading-tight resize-none"
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
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <textarea
                        className="mt-0.5 w-full text-[10px] text-slate-800 bg-transparent outline-none resize-none leading-tight"
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
                    )}

                    <button
                      type="button"
                      className="mt-0.5 text-[9px] text-sky-600 hover:underline"
                      onClick={() => handleAddBullet(sectionIndex, idx, proj)}
                    >
                      + Punkt hinzufügen
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );

      // ───────────────── Ausbildung ─────────────────
      case 'education':
        return (
          <div key={sectionIndex}>
            <SectionTitle>Ausbildung & Studium</SectionTitle>
            <div className="space-y-1.5">
              {items.map((edu: any, idx: number) => (
                <div key={idx} data-avoid-break className="px-2 py-1 rounded-md">
                  <input
                    className="w-full text-[11px] font-semibold text-slate-900 bg-transparent outline-none"
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
                      onUpdateSectionItem(
                        sectionIndex,
                        idx,
                        'institution',
                        e.target.value
                      )
                    }
                    placeholder="Institution"
                  />
                  {(edu.date_from || edu.date_to) && (
                    <div className="mt-0.5 text-[10px] text-slate-500 flex gap-1">
                      <input
                        className="bg-transparent outline-none w-16"
                        value={edu.date_from || ''}
                        onChange={(e) =>
                          onUpdateSectionItem(
                            sectionIndex,
                            idx,
                            'date_from',
                            e.target.value
                          )
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
              ))}
            </div>
          </div>
        );

      // ───────────────── Sprachen ─────────────────
      case 'languages':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex}>
            <SectionTitle>Sprachen</SectionTitle>
            <div className="space-y-1">
              {items.map((lang: any, idx: number) => {
                const rawLangVal = typeof lang === 'string' ? lang : (lang.language || lang.name || lang.sprache || '');
                const langVal = rawLangVal.replace(/^(programmiersprachen|technische\s*f[äa]higkeiten|fachkenntnisse|kenntnisse|sprachen|fähigkeiten|soft\s*skills|skills|languages|kompetenzen|tools?)[:\s\-–]+/i, '').trim();
                const levelVal = typeof lang === 'object' && lang !== null ? (lang.level || lang.niveau || lang.proficiency || '') : '';
                return (
                  <div key={idx} className="flex items-center justify-between gap-2 text-[10px] text-slate-800">
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

      // ───────────────── Fachliche Skills ─────────────────
      case 'skills':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex}>
            <SectionTitle>Fachliche Skills</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                const val = typeof skill === 'string' ? skill : skill.skill || skill.name || '';
                const level = typeof skill === 'object' && skill !== null ? skill.level || skill.niveau || '' : '';
                const display = level ? `${val} (${level})` : val;
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', marginBottom: '5px', verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#1e293b', minWidth: '20px', border: 'none', width: `${Math.max(20, display.length * 6)}px` }}
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

      // ───────────────── Soft Skills ─────────────────
      case 'soft_skills':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex}>
            <SectionTitle>Persönliche Stärken</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                const val = typeof skill === 'string' ? skill : skill.skill || skill.name || '';
                const level = typeof skill === 'object' && skill !== null ? skill.level || skill.niveau || '' : '';
                const display = level ? `${val} (${level})` : val;
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', marginBottom: '5px', verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#1e293b', minWidth: '20px', border: 'none', width: `${Math.max(20, display.length * 6)}px` }}
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

      // ───────────────── Arbeitsweise & Werte ─────────────────
      case 'work_values':
      case 'values':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex}>
            <SectionTitle>Arbeitsweise & Werte</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((val: any, idx: number) => {
                const v = typeof val === 'string' ? val : val.label || '';
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', marginBottom: '5px', verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#1e293b', border: 'none', minWidth: '20px', width: `${Math.max(20, v.length * 6)}px` }}
                      value={v}
                      onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'label', e.target.value)}
                      placeholder="Wert"
                    />
                  </span>
                );
              })}
            </div>
          </div>
        );

      // ───────────────── Hobbys & Interessen ─────────────────
      case 'hobbies':
      case 'interests':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex}>
            <SectionTitle>Hobbys & Interessen</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((hob: any, idx: number) => {
                const v = typeof hob === 'string' ? hob : hob.label || '';
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', marginBottom: '5px', verticalAlign: 'middle', padding: '2px 8px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#1e293b', border: 'none', minWidth: '20px', width: `${Math.max(20, v.length * 6)}px` }}
                      value={v}
                      onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'label', e.target.value)}
                      placeholder="Hobby"
                    />
                  </span>
                );
              })}
            </div>
          </div>
        );

      // ───────────────── Fallback ─────────────────
      default:
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            <ul className="space-y-0.5 text-[10px] text-slate-800">
              {items.map((item: any, idx: number) => {
                const displayValue =
                  typeof item === 'string'
                    ? item
                    : item.name || item.title || item.label || JSON.stringify(item);
                return (
                  <li
                    key={idx}
                    className="py-0.5 border-b border-slate-200 last:border-b-0"
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
    <div className="relative bg-slate-100 font-sans flex flex-col w-full" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', minHeight: '1122px' }}>
        {/* Dunkler Professional-Header mit DYD-Akzent */}
        <header className="px-8 pt-7 pb-5 bg-slate-900 text-white flex justify-between gap-6 items-start border-b-4 border-[#30E3CA]">
          <div className="flex-1 min-w-0">
            <input
              className="block w-full text-2xl font-bold tracking-tight outline-none bg-transparent text-white"
              value={personalInfo.name || ''}
              onChange={(e) => onUpdatePersonalInfo('name', e.target.value)}
              placeholder="Name"
            />
            <input
              className="mt-1 block w-full text-sm font-medium text-slate-200 outline-none bg-transparent"
              value={personalInfo.title || ''}
              onChange={(e) => onUpdatePersonalInfo('title', e.target.value)}
              placeholder="Berufsbezeichnung"
            />

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[10px] text-slate-100">
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

        {/* Content */}
        <main className="flex-1 px-8 py-4 grid grid-cols-1 md:grid-cols-12 gap-6 bg-white">
          {/* Linke Spalte */}
          <section className="col-span-1 md:col-span-7 space-y-3">
            {/* Summary / Profil */}
            <div>
              <SectionTitle>Profil & Mehrwert</SectionTitle>
              <textarea
                ref={summaryRef}
                className="w-full mt-1 text-[11px] leading-relaxed text-slate-800 bg-slate-50 rounded-md border border-slate-200 outline-none resize-none px-3 py-2"
                style={{ minHeight: '60px' }}
                value={summary || ''}
                onChange={(e) => {
                  onUpdateSummary(e.target.value);
                  if (summaryRef.current) {
                    summaryRef.current.style.height = 'auto';
                    summaryRef.current.style.height =
                      summaryRef.current.scrollHeight + 'px';
                  }
                }}
                placeholder="Beschreibe kurz dein Profil, deinen Mehrwert und deine Ziele."
              />
            </div>

            {/* Experience + Projekte */}
            {leftSections.map((section) => {
              const idx = sections.findIndex((s) => s === section);
              return renderSection(section, idx);
            })}
          </section>

          {/* Rechte Spalte */}
          <aside className="col-span-1 md:col-span-5 space-y-3">
            {rightSections.map((section) => {
              const idx = sections.findIndex((s) => s === section);
              return renderSection(section, idx);
            })}
          </aside>
        </main>

        {/* Weitere Sections (z.B. Zertifikate etc.) */}
        {otherSections.length > 0 && (
          <div className="px-8 pb-4 space-y-3 bg-white">
            {otherSections.map((section) => {
              const idx = sections.findIndex((s) => s === section);
              return renderSection(section, idx);
            })}
          </div>
        )}
<footer
        data-pdf-footer
        style={{
          borderTop: '1px solid #cbd5e1',
          padding: '10px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between', // 💡 HIER KORRIGIERT: CamelCase und String-Anführungszeichen!
          fontSize: '10px',
          color: '#64748b',
          fontFamily: 'sans-serif',
          marginTop: 'auto',
          flexShrink: 0,
          backgroundColor: '#ffffff',
          height: '40px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ fontWeight: 600, flexShrink: 0 }}>Ort:</span>
          <input
            className="bg-transparent outline-none text-slate-500"
            style={{ fontSize: '10px', width: '120px' }}
            value={personalInfo.location || ''} // Nutzt das Standard-Location-Feld
            onChange={(e) => onUpdatePersonalInfo('location', e.target.value)}
            placeholder="Ort"
          />
        <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
          {new Date().toLocaleDateString('de-DE')} {/* Generiert das heutige Datum dynamisch */}
        </span>
      </footer>
    </div>
  );
};