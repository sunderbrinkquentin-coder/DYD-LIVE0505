import React from 'react';

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

interface ClassicCVTemplateProps {
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

const skillLevelToStars = (level: string | undefined): number => {
  if (!level) return 0;
  const l = level.toLowerCase();
  if (l === 'expert' || l === 'experte' || l === 'native' || l === 'muttersprache' || l === 'c2') return 5;
  if (l === 'advanced' || l === 'sehr gut' || l === 'c1' || l === 'verhandlungssicher') return 4;
  if (l === 'intermediate' || l === 'fortgeschritten' || l === 'b2' || l === 'b1' || l === 'gute kenntnisse') return 3;
  if (l === 'basic' || l === 'basiswissen' || l === 'a2' || l === 'a1' || l === 'grundkenntnisse') return 2;
  if (l === 'beginner' || l === 'anfänger') return 1;
  return 0;
};

const StarRating: React.FC<{ stars: number; total?: number }> = ({ stars, total = 5 }) => (
  <span className="inline-flex items-center gap-px flex-shrink-0">
    {Array.from({ length: total }).map((_, i) => (
      <svg key={i} width="7" height="7" viewBox="0 0 12 12" fill={i < stars ? '#6b7280' : '#d1d5db'}>
        <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5" />
      </svg>
    ))}
  </span>
);

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
};

const EditableText: React.FC<{
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
}> = ({ value, onChange, className = '', placeholder = '', multiline = false, style }) => {
  if (multiline) {
    return (
      <textarea
        className={`w-full resize-none bg-transparent outline-none border-none focus:ring-0 ${className}`}
        style={{ ...style, overflow: 'hidden', minHeight: '40px' }}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => {
          autoResize(e.target);
          onChange(e.target.value);
        }}
        onFocus={(e) => autoResize(e.target)}
        ref={(el) => { if (el) autoResize(el); }}
      />
    );
  }

  return (
    <input
      className={`bg-transparent outline-none border-none focus:ring-0 ${className}`}
      style={style}
      value={value ?? ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export const ClassicCVTemplate: React.FC<ClassicCVTemplateProps> = ({
  personalInfo,
  summary,
  sections,
  photoUrl,
  photoPosition = { x: 50, y: 50 },
  onUpdatePersonalInfo,
  onUpdateSummary,
  onUpdateSection,
  onUpdateSectionItem,
}) => {
  // Hilfsfunktionen, um bestimmte Section-Typen zu finden
  const findSectionIndex = (type: string) =>
    sections.findIndex((s) => s.type === type);

  const experienceIndex = findSectionIndex('experience');
  const educationIndex = findSectionIndex('education');
  const projectsIndex = findSectionIndex('projects');
  const skillsIndex = findSectionIndex('skills');
  const softSkillsIndex = findSectionIndex('soft_skills');
  const languagesIndex = findSectionIndex('languages');
  const workValuesIndex = findSectionIndex('work_values');

  const stripSectionLabel = (val: string) =>
    val.replace(/^(programmiersprachen|technische\s*f[äa]higkeiten|fachkenntnisse|kenntnisse|sprachen|fähigkeiten|soft\s*skills|skills|languages|kompetenzen|tools?)[:\s\-–]+/i, '').trim();

  const renderBulletPoints = (bullets: any[] | undefined) => {
    if (!bullets || !Array.isArray(bullets) || bullets.length === 0) return null;

    return (
      <ul className="space-y-0.5 mt-1" style={{ paddingLeft: 0, listStyle: 'none' }}>
        {bullets.map((bp, idx) => {
          const text = typeof bp === 'string' ? bp : bp?.text ?? String(bp);
          if (!text) return null;
          return (
            <li key={idx} className="leading-snug" style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span style={{ flexShrink: 0, marginTop: '3px', width: '5px', height: '5px', borderRadius: '50%', background: '#6b7280', display: 'inline-block' }} />
              <span style={{ flex: 1 }}>{text}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  const renderExperience = () => {
    if (experienceIndex === -1) return null;
    const section = sections[experienceIndex];
    const items = Array.isArray(section.items) ? section.items : [];

    return (
      <div>
        <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-700 border-b border-gray-300 pb-1 mb-2">
          Berufserfahrung
        </h2>
        <div className="space-y-3">
          {items.map((item: any, idx: number) => (
            <div key={idx} data-avoid-break>
              <div className="flex items-baseline justify-between gap-2">
                <EditableText
                  value={item.title}
                  onChange={(val) =>
                    onUpdateSectionItem(experienceIndex, idx, 'title', val)
                  }
                  className="font-semibold text-[12px] text-gray-900 leading-snug"
                  placeholder="Position / Rolle"
                />
                <EditableText
                  value={
                    [item.date_from, item.date_to]
                      .filter(Boolean)
                      .join(' – ') || ''
                  }
                  onChange={(val) => {
                    const [from, to] = val.split('–').map((v) => v.trim());
                    onUpdateSectionItem(experienceIndex, idx, 'date_from', from);
                    onUpdateSectionItem(experienceIndex, idx, 'date_to', to);
                  }}
                  className="text-[10px] text-gray-500 text-right min-w-[80px] flex-shrink-0 leading-snug"
                  placeholder="Zeitraum"
                />
              </div>
              <EditableText
                value={item.company}
                onChange={(val) =>
                  onUpdateSectionItem(experienceIndex, idx, 'company', val)
                }
                className="text-[11px] text-gray-700 mt-0.5 leading-snug"
                placeholder="Unternehmen / Ort"
              />
              {(item.location || item.ort) && (
                <EditableText
                  value={item.location || item.ort || ''}
                  onChange={(val) =>
                    onUpdateSectionItem(experienceIndex, idx, 'location', val)
                  }
                  className="text-[10px] text-gray-500 leading-snug"
                  placeholder="Ort"
                />
              )}
              {item.description && (
                <EditableText
                  value={item.description}
                  onChange={(val) =>
                    onUpdateSectionItem(
                      experienceIndex,
                      idx,
                      'description',
                      val
                    )
                  }
                  className="text-[11px] text-gray-800 mt-1 leading-snug"
                  multiline
                  placeholder="Beschreibung / Aufgaben"
                />
              )}
              {renderBulletPoints(item.bulletPoints)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEducation = () => {
    if (educationIndex === -1) return null;
    const section = sections[educationIndex];
    const items = Array.isArray(section.items) ? section.items : [];

    return (
      <div>
        <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-700 border-b border-gray-300 pb-1 mb-2 mt-4">
          Ausbildung / Studium
        </h2>
        <div className="space-y-3">
          {items.map((item: any, idx: number) => (
            <div key={idx} data-avoid-break>
              <EditableText
                value={item.degree}
                onChange={(val) =>
                  onUpdateSectionItem(educationIndex, idx, 'degree', val)
                }
                className="font-semibold text-[12px] text-gray-900 leading-snug"
                placeholder="Abschluss / Studiengang"
              />
              <div className="flex items-baseline justify-between gap-2 mt-0.5">
                <EditableText
                  value={item.institution}
                  onChange={(val) =>
                    onUpdateSectionItem(
                      educationIndex,
                      idx,
                      'institution',
                      val
                    )
                  }
                  className="text-[11px] text-gray-700 leading-snug"
                  placeholder="Institution / Ort"
                />
                <EditableText
                  value={
                    [item.date_from, item.date_to]
                      .filter(Boolean)
                      .join(' – ') || ''
                  }
                  onChange={(val) => {
                    const [from, to] = val.split('–').map((v) => v.trim());
                    onUpdateSectionItem(educationIndex, idx, 'date_from', from);
                    onUpdateSectionItem(educationIndex, idx, 'date_to', to);
                  }}
                  className="text-[10px] text-gray-500 text-right min-w-[80px] flex-shrink-0 leading-snug"
                  placeholder="Zeitraum"
                />
              </div>
              {item.description && (
                <EditableText
                  value={item.description}
                  onChange={(val) =>
                    onUpdateSectionItem(
                      educationIndex,
                      idx,
                      'description',
                      val
                    )
                  }
                  className="text-[11px] text-gray-800 mt-1 leading-snug"
                  multiline
                  placeholder="Schwerpunkte / Noten / Themen"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderProjects = () => {
    if (projectsIndex === -1) return null;
    const section = sections[projectsIndex];
    const items = Array.isArray(section.items) ? section.items : [];

    return (
      <div>
        <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-700 border-b border-gray-300 pb-1 mb-2 mt-4">
          Projekte
        </h2>
        <div className="space-y-3">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="leading-tight">
              <EditableText
                value={item.title}
                onChange={(val) =>
                  onUpdateSectionItem(projectsIndex, idx, 'title', val)
                }
                className="font-semibold text-[12px] text-gray-900"
                placeholder="Projektname"
              />
              {item.role && (
                <EditableText
                  value={item.role}
                  onChange={(val) =>
                    onUpdateSectionItem(projectsIndex, idx, 'role', val)
                  }
                  className="text-[11px] text-gray-700"
                  placeholder="Rolle / Verantwortung"
                />
              )}
              {item.description && (
                <EditableText
                  value={item.description}
                  onChange={(val) =>
                    onUpdateSectionItem(
                      projectsIndex,
                      idx,
                      'description',
                      val
                    )
                  }
                  className="text-[11px] text-gray-800 mt-1"
                  multiline
                  placeholder="Projektbeschreibung / Ergebnisse"
                />
              )}
              {renderBulletPoints(item.bulletPoints)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderListSection = (
    label: string,
    index: number,
    options?: { showLevelsForLanguages?: boolean }
  ) => {
    if (index === -1) return null;
    const section = sections[index];
    const items = Array.isArray(section.items) ? section.items : [];

    if (!items.length) return null;

    return (
      <div className="mb-4">
        <h3 className="text-[10px] font-semibold tracking-[0.16em] uppercase text-gray-700 mb-1">
          {label}
        </h3>
        <ul
          className={options?.showLevelsForLanguages ? "space-y-1" : ""}
          {...(!options?.showLevelsForLanguages ? { 'data-chip-row': '' } : {})}
          style={options?.showLevelsForLanguages ? {} : { display: 'block', overflow: 'hidden' }}
        >
          {items.map((item: any, idx: number) => {
            if (options?.showLevelsForLanguages) {
              const rawLang = item.language || item.name || item.sprache || '';
              const language = stripSectionLabel(rawLang);
              const level = item.level || item.niveau || item.proficiency || '';
              const stars = skillLevelToStars(level);
              return (
                <li key={idx} className="flex justify-between items-center gap-2 text-[10px]">
                  <EditableText
                    value={language}
                    onChange={(val) =>
                      onUpdateSectionItem(index, idx, 'language', val)
                    }
                    className="text-gray-800"
                    placeholder="Sprache"
                  />
                  {stars > 0 ? (
                    <StarRating stars={stars} />
                  ) : (
                    <EditableText
                      value={level}
                      onChange={(val) =>
                        onUpdateSectionItem(index, idx, 'level', val)
                      }
                      className="text-gray-600 text-right min-w-[60px]"
                      placeholder="Niveau"
                    />
                  )}
                </li>
              );
            }

            const rawText =
              typeof item === 'string'
                ? item
                : item.skill || item.label || item.name || item.title || String(item);
            const text = stripSectionLabel(rawText);

            return (
              <li key={idx} style={{ display: 'inline-flex', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', listStyle: 'none' }}>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 border border-gray-300 text-[9.5px] font-semibold text-gray-800 leading-snug whitespace-nowrap">
                  <EditableText
                    value={text}
                    onChange={(val) =>
                      onUpdateSectionItem(index, idx, 'value', val)
                    }
                    className="text-gray-800"
                    style={{ width: `${Math.max(20, text.length * 6.5)}px` }}
                    placeholder="Eintrag"
                  />
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const renderWorkValues = () => {
    if (workValuesIndex === -1) return null;
    const section = sections[workValuesIndex];
    const items = Array.isArray(section.items) ? section.items : [];
    if (!items.length) return null;

    return (
      <div>
        <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-700 border-b border-gray-300 pb-1 mb-2 mt-4">
          Arbeitsweise & Werte
        </h2>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-gray-800">
          {items.map((item: any, idx: number) => {
            const text =
              typeof item === 'string'
                ? item
                : item.label || item.name || item.value || String(item);
            return (
              <li key={idx} className="leading-snug">
                <EditableText
                  value={text}
                  onChange={(val) =>
                    onUpdateSectionItem(workValuesIndex, idx, 'value', val)
                  }
                  className="text-gray-800"
                  placeholder="Wert / Arbeitsstil"
                />
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  return (
    <div
      className="w-full text-[13px] text-gray-900 font-serif"
      style={{
        fontFamily: 'Georgia, "Times New Roman", serif',
        minHeight: '1122px',
        width: '100%',
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        border: '1px solid #d1d5db',
      }}
    >
      {/* Außenrand für klassischen Look */}
      <div className="w-full p-6" style={{ minHeight: '1122px' }}>
        <div className="flex gap-6" style={{ minHeight: '1080px' }}>
          {/* Linke Spalte */}
          <aside className="w-2/5 max-w-[32%] pr-4 border-r border-gray-200 flex flex-col">
            {/* Foto + Name */}
            <div className="mb-4">
              {photoUrl && (
                <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-300 mb-3 mx-auto">
                  <img
                    src={photoUrl}
                    alt="Profilfoto"
                    className="w-full h-full"
                    style={{ objectFit: 'cover', objectPosition: `${photoPosition.x}% ${photoPosition.y}%`, width: '96px', height: '96px', display: 'block' }}
                  />
                </div>
              )}
              <div className="text-center">
                <EditableText
                  value={personalInfo.name}
                  onChange={(val) => onUpdatePersonalInfo('name', val)}
                  className="text-[18px] font-bold tracking-wide text-gray-900"
                  placeholder="Dein Name"
                />
                <EditableText
                  value={personalInfo.title}
                  onChange={(val) => onUpdatePersonalInfo('title', val)}
                  className="text-[11px] text-gray-600 mt-1"
                  placeholder="Berufsbezeichnung"
                />
              </div>
            </div>

            {/* Kontakt */}
            <div className="mb-4">
              <h3 className="text-[10px] font-semibold tracking-[0.16em] uppercase text-gray-700 mb-1">
                Kontakt
              </h3>
              <div className="space-y-1 text-[10px]">
                <EditableText
                  value={personalInfo.email}
                  onChange={(val) => onUpdatePersonalInfo('email', val)}
                  className="text-gray-800"
                  placeholder="E-Mail"
                />
                <EditableText
                  value={personalInfo.phone}
                  onChange={(val) => onUpdatePersonalInfo('phone', val)}
                  className="text-gray-800"
                  placeholder="Telefon"
                />
                <EditableText
                  value={personalInfo.location}
                  onChange={(val) => onUpdatePersonalInfo('location', val)}
                  className="text-gray-800"
                  placeholder="Ort"
                />
                <EditableText
                  value={personalInfo.linkedin}
                  onChange={(val) => onUpdatePersonalInfo('linkedin', val)}
                  className="text-gray-800"
                  placeholder="LinkedIn"
                />
              </div>
            </div>

            {/* Skills / Soft Skills / Sprachen in der Sidebar */}
            {renderListSection('Fähigkeiten', skillsIndex)}
            {renderListSection('Soft Skills', softSkillsIndex)}
            {renderListSection('Sprachen', languagesIndex, {
              showLevelsForLanguages: true,
            })}
            {/* Werte, Hobbys und sonstige Sections in der Sidebar */}
            {sections.map((section, index) => {
              const sidebarTypes = ['values', 'hobbies', 'interests', 'certifications', 'courses', 'awards', 'volunteering'];
              if (!sidebarTypes.includes(section.type)) return null;
              const items = Array.isArray(section.items) ? section.items : [];
              if (!items.length) return null;
              const labelMap: Record<string, string> = {
                values: 'Werte',
                hobbies: 'Hobbys & Interessen',
                interests: 'Interessen',
                certifications: 'Zertifikate',
                courses: 'Kurse',
                awards: 'Auszeichnungen',
                volunteering: 'Ehrenamt',
              };
              const label = section.title || labelMap[section.type] || section.type;
              return (
                <div key={index} className="mb-4">
                  <h3 className="text-[10px] font-semibold tracking-[0.16em] uppercase text-gray-700 mb-1">
                    {label}
                  </h3>
                  <ul style={{ display: 'block', overflow: 'hidden' }}>
                    {items.map((item: any, idx: number) => {
                      const rawText = typeof item === 'string' ? item : item.label || item.name || item.title || item.skill || '';
                      return (
                        <li key={idx} style={{ display: 'inline-flex', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', listStyle: 'none' }}>
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 border border-gray-300 text-[9.5px] font-medium text-gray-800 whitespace-nowrap">
                            <EditableText
                              value={rawText}
                              onChange={(val) => onUpdateSectionItem(index, idx, 'label', val)}
                              className="text-gray-800"
                              style={{ width: `${Math.max(20, rawText.length * 6.5)}px` }}
                              placeholder="Eintrag"
                            />
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            {/* Optional: Work Values auch links anzeigen, falls du sie lieber dort hast
            {workValuesIndex !== -1 && (
              <div className="mt-2">
                {renderWorkValues()}
              </div>
            )} */}
          </aside>

          {/* Rechte Spalte */}
          <main className="flex-1 flex flex-col">
            {/* Profil / Summary */}
            <section className="mb-4">
              <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-700 border-b border-gray-300 pb-1 mb-2">
                Profil
              </h2>
              <EditableText
                value={summary}
                onChange={onUpdateSummary}
                className="text-[11px] text-gray-800 leading-snug"
                placeholder="Kurzprofil / Zusammenfassung"
                multiline
              />
            </section>

            {renderExperience()}
            {renderEducation()}
            {renderProjects()}
            {renderWorkValues()}

            {/* Sonstige unbekannte Sections generisch rendern (falls vorhanden) */}
            {sections.map((section, index) => {
              const knownTypes = [
                'experience',
                'education',
                'projects',
                'skills',
                'soft_skills',
                'languages',
                'work_values',
                'values',
                'hobbies',
                'interests',
                'certifications',
                'courses',
                'awards',
                'volunteering',
              ];
              if (knownTypes.includes(section.type)) return null;

              const items = Array.isArray(section.items) ? section.items : [];
              if (!items.length) return null;

              const title =
                section.title ||
                section.type.charAt(0).toUpperCase() + section.type.slice(1);

              return (
                <section key={section.type} className="mt-4">
                  <h2 className="text-[11px] font-semibold tracking-[0.16em] uppercase text-gray-700 border-b border-gray-300 pb-1 mb-2">
                    {title}
                  </h2>
                  <div className="space-y-2 text-[11px] text-gray-800">
                    {items.map((item: any, idx: number) => {
                      const text =
                        typeof item === 'string'
                          ? item
                          : item.description ||
                            item.text ||
                            item.label ||
                            item.name ||
                            String(item);

                      return (
                        <EditableText
                          key={idx}
                          value={text}
                          onChange={(val) =>
                            onUpdateSectionItem(index, idx, 'text', val)
                          }
                          className="leading-snug"
                          multiline
                          placeholder="Eintrag"
                        />
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </main>
        </div>
      </div>
      <footer
        data-pdf-footer
        style={{
          borderTop: '1px solid #cbd5e1',
          padding: '10px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
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
            value={personalInfo.location || ''}
            onChange={(e) => onUpdatePersonalInfo('location', e.target.value)}
            placeholder="Ort"
          />
        </div> {/* 💡 HIER KORRIGIERT: Das fehlende schließende div-Tag hinzugefügt! */}
        
        <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
          {new Date().toLocaleDateString('de-DE')}
        </span>
      </footer>
    </div>
  );
};