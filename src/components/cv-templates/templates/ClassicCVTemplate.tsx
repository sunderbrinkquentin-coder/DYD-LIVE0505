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
  onDeleteSectionItem?: (sectionIndex: number, itemIndex: number) => void;
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
      <svg key={i} width="7" height="7" viewBox="0 0 12 12" fill={i < stars ? '#1e3a8a' : '#d1d5db'}>
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
        style={{ ...style, overflow: 'hidden', minHeight: '24px', padding: 0, margin: 0 }}
        rows={1}
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

  // WICHTIG: Single-Line Inputs für Titel und Datum verhindern Layout-Explosionen!
  return (
    <input
      className={`bg-transparent outline-none border-none focus:ring-0 w-full ${className}`}
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
  onDeleteSectionItem = () => {},
}) => {
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

  // Einheitliche Bulletpoint Logik
  const renderBulletPoints = (bullets: any[] | undefined, sectionIndex: number, itemIndex: number) => {
    if (!bullets || !Array.isArray(bullets) || bullets.length === 0) return null;

    return (
      <div className="mt-1.5" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {bullets.map((bp, idx) => {
          const text = typeof bp === 'string' ? bp : bp?.text ?? String(bp);
          if (!text) return null;
          const cleanText = text.replace(/^[-•*]\s*/, ''); // Säubert manuell getippte Spiegelstriche

          return (
            <div key={idx} className="flex items-start gap-2" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <span style={{ flexShrink: 0, color: '#1e3a8a', fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>
                •
              </span>
              <EditableText
                value={cleanText}
                onChange={(val) => {
                  const newBullets = [...bullets];
                  if (typeof bp === 'string') {
                    newBullets[idx] = val;
                  } else {
                    newBullets[idx] = { ...bp, text: val };
                  }
                  onUpdateSectionItem(sectionIndex, itemIndex, 'bulletPoints', newBullets);
                }}
                className="text-[9.5px] text-slate-700 leading-snug flex-1"
                multiline
                placeholder="Eintrag"
              />
            </div>
          );
        })}
      </div>
    );
  };

  const renderExperience = () => {
    if (experienceIndex === -1) return null;
    const section = sections[experienceIndex];
    const items = Array.isArray(section.items) ? section.items : [];

    return (
      <div>
        <h2 className="!text-[9px] font-bold tracking-[0.15em] uppercase text-[#1e3a8a] border-b-2 border-[#1e3a8a]/20 pb-1 mb-3">
          Berufserfahrung
        </h2>
        <div className="space-y-5">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="relative" data-pdf-section style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              
              {/* STABIL: Title und Date als single-line Input, kein items-baseline Bug mehr! */}
              <div className="flex items-baseline justify-between gap-3">
                <EditableText
                  value={item.title}
                  onChange={(val) => onUpdateSectionItem(experienceIndex, idx, 'title', val)}
                  className="font-bold text-[11px] text-slate-900 leading-tight flex-1"
                  placeholder="Position / Rolle"
                />
                <EditableText
                  value={[item.date_from, item.date_to].filter(Boolean).join(' – ') || ''}
                  onChange={(val) => {
                    const [from, to] = val.split('–').map((v) => v.trim());
                    onUpdateSectionItem(experienceIndex, idx, 'date_from', from);
                    onUpdateSectionItem(experienceIndex, idx, 'date_to', to);
                  }}
                  className="text-[9px] font-semibold text-[#1e3a8a]/80 text-right w-32 flex-shrink-0 leading-tight"
                  placeholder="Zeitraum"
                />
              </div>

              <EditableText
                value={item.company}
                onChange={(val) => onUpdateSectionItem(experienceIndex, idx, 'company', val)}
                className="text-[10px] font-semibold text-slate-700 mt-0.5 leading-snug"
                placeholder="Unternehmen"
              />
              
              {(item.location || item.ort) && (
                <EditableText
                  value={item.location || item.ort || ''}
                  onChange={(val) => onUpdateSectionItem(experienceIndex, idx, 'location', val)}
                  className="text-[9.5px] text-slate-500 leading-snug mt-0.5"
                  placeholder="Ort"
                />
              )}
              
              {/* 💡 FIX: Description rendert nun IMMER als Bulletpoint! Einheitlicher Look. */}
              {item.description && (
                <div className="flex items-start gap-2 mt-2 leading-snug">
                  <span style={{ flexShrink: 0, color: '#1e3a8a', fontSize: '11px', lineHeight: '18px', userSelect: 'none' }}>•</span>
                  <EditableText
                    value={item.description.replace(/^[-•*]\s*/, '')}
                    onChange={(val) => onUpdateSectionItem(experienceIndex, idx, 'description', val)}
                    className="text-[9.5px] text-slate-700 leading-snug flex-1"
                    multiline
                    placeholder="Beschreibung / Aufgaben"
                  />
                </div>
              )}
              
              {/* Weitere Bulletpoints aus der Liste */}
              {renderBulletPoints(item.bulletPoints || item.bullet_points, experienceIndex, idx)}
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
        <h2 className="!text-[9px] font-bold tracking-[0.15em] uppercase text-[#1e3a8a] border-b-2 border-[#1e3a8a]/20 pb-1 mb-3 mt-6">
          Ausbildung / Studium
        </h2>
        <div className="space-y-5">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="relative" data-pdf-section style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <div className="flex items-baseline justify-between gap-3">
                <EditableText
                  value={item.degree}
                  onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'degree', val)}
                  className="font-bold text-[11px] text-slate-900 leading-tight flex-1"
                  placeholder="Abschluss / Studiengang"
                />
                <EditableText
                  value={[item.date_from, item.date_to].filter(Boolean).join(' – ') || ''}
                  onChange={(val) => {
                    const [from, to] = val.split('–').map((v) => v.trim());
                    onUpdateSectionItem(educationIndex, idx, 'date_from', from);
                    onUpdateSectionItem(educationIndex, idx, 'date_to', to);
                  }}
                  className="text-[9px] font-semibold text-[#1e3a8a]/80 text-right w-32 flex-shrink-0 leading-tight"
                  placeholder="Zeitraum"
                />
              </div>
              <EditableText
                value={item.institution}
                onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'institution', val)}
                className="text-[10px] font-semibold text-slate-700 leading-snug mt-0.5"
                placeholder="Institution / Ort"
              />
              
              {item.description && (
                <div className="flex items-start gap-2 mt-2 leading-snug">
                  <span style={{ flexShrink: 0, color: '#1e3a8a', fontSize: '11px', lineHeight: '18px', userSelect: 'none' }}>•</span>
                  <EditableText
                    value={item.description.replace(/^[-•*]\s*/, '')}
                    onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'description', val)}
                    className="text-[9.5px] text-slate-700 leading-snug flex-1"
                    multiline
                    placeholder="Schwerpunkte / Noten / Themen"
                  />
                </div>
              )}
              {renderBulletPoints(item.bulletPoints || item.bullet_points, educationIndex, idx)}
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
        <h2 className="!text-[9px] font-bold tracking-[0.15em] uppercase text-[#1e3a8a] border-b-2 border-[#1e3a8a]/20 pb-1 mb-3 mt-6">
          Projekte
        </h2>
        <div className="space-y-5">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="relative" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <EditableText
                value={item.title}
                onChange={(val) => onUpdateSectionItem(projectsIndex, idx, 'title', val)}
                className="font-bold text-[11px] text-slate-900 leading-tight"
                placeholder="Projektname"
              />
              {item.role && (
                <EditableText
                  value={item.role}
                  onChange={(val) => onUpdateSectionItem(projectsIndex, idx, 'role', val)}
                  className="text-[10px] font-semibold text-slate-700 mt-0.5"
                  placeholder="Rolle / Verantwortung"
                />
              )}
              {item.description && (
                <div className="flex items-start gap-2 mt-2 leading-snug">
                  <span style={{ flexShrink: 0, color: '#1e3a8a', fontSize: '11px', lineHeight: '18px', userSelect: 'none' }}>•</span>
                  <EditableText
                    value={item.description.replace(/^[-•*]\s*/, '')}
                    onChange={(val) => onUpdateSectionItem(projectsIndex, idx, 'description', val)}
                    className="text-[9.5px] text-slate-700 leading-snug flex-1"
                    multiline
                    placeholder="Projektbeschreibung / Ergebnisse"
                  />
                </div>
              )}
              {renderBulletPoints(item.bulletPoints || item.bullet_points, projectsIndex, idx)}
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
      <div className="mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <h3 className="!text-[9px] font-bold tracking-[0.15em] uppercase text-[#1e3a8a] mb-3">
          {label}
        </h3>
        <ul
          className={options?.showLevelsForLanguages ? "space-y-2" : ""}
          style={options?.showLevelsForLanguages ? {} : { display: 'block' }}
        >
          {items.map((item: any, idx: number) => {
            if (options?.showLevelsForLanguages) {
              const rawLang = item.language || item.name || item.sprache || '';
              const language = stripSectionLabel(rawLang);
              const level = item.level || item.niveau || item.proficiency || '';
              const stars = skillLevelToStars(level);
              return (
                // 💡 FIX: min-w-0 und flex-shrink-0 verhindern den Zeilenumbruch!
                <li key={idx} className="flex flex-nowrap justify-between items-center gap-2 text-[9px]">
                  <EditableText
                    value={language}
                    onChange={(val) => onUpdateSectionItem(index, idx, 'language', val)}
                    className="text-slate-800 font-medium flex-1 min-w-0"
                    placeholder="Sprache"
                  />
                  {stars > 0 ? (
                    <StarRating stars={stars} />
                  ) : (
                    <EditableText
                      value={level}
                      onChange={(val) => onUpdateSectionItem(index, idx, 'level', val)}
                      className="text-[#1e3a8a] font-medium text-right w-16 flex-shrink-0"
                      placeholder="Niveau"
                    />
                  )}
                </li>
              );
            }

            const rawText = typeof item === 'string' ? item : item.skill || item.label || item.name || item.title || String(item);
            const text = stripSectionLabel(rawText);
            const level = typeof item === 'object' && item !== null ? item.level || item.niveau || '' : '';
            const display = level ? `${text} (${level.trim()})` : text;

            return (
              <li key={idx} style={{ display: 'inline-flex', marginRight: '5px', marginBottom: '5px', verticalAlign: 'middle', listStyle: 'none' }}>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#f8fafc] border border-[#e2e8f0] text-[9px] font-medium text-slate-700 whitespace-nowrap">
                  <EditableText
                    value={display}
                    onChange={(val) => onUpdateSectionItem(index, idx, 'skill', val)}
                    className="text-slate-700 bg-transparent"
                    style={{ width: `${Math.max(2, display.length + 1)}ch` }}
                    placeholder="Eintrag"
                  />
                  <button
                    type="button"
                    className="pdf-hidden"
                    style={{ fontSize: '8px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}
                    onClick={() => onDeleteSectionItem(index, idx)}
                  >
                    ✕
                  </button>
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
      <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
        <h2 className="!text-[9px] font-bold tracking-[0.15em] uppercase text-[#1e3a8a] border-b-2 border-[#1e3a8a]/20 pb-1 mb-3 mt-6">
          Arbeitsweise & Werte
        </h2>
        <ul className="list-disc list-inside space-y-1.5 text-[9.5px] text-slate-700">
          {items.map((item: any, idx: number) => {
            const text = typeof item === 'string' ? item : item.label || item.name || item.value || String(item);
            return (
              <li key={idx} className="leading-snug">
                <EditableText
                  value={text}
                  onChange={(val) => onUpdateSectionItem(workValuesIndex, idx, 'value', val)}
                  className="text-slate-700"
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
      className="w-full text-slate-800 bg-white"
      style={{
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        minHeight: '1122px',
        width: '100%',
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        border: '1px solid #e2e8f0',
        flex: 1,
      }}
    >
      <div className="w-full p-8" style={{ height: '100%', flex: 1 }}>
        <div className="flex gap-8" style={{ flex: 1 }}>
          
          {/* Linke Spalte */}
          <aside className="w-1/3 max-w-[33%] pr-6 border-r border-slate-200 flex flex-col">
            <div className="mb-6">
              {photoUrl && (
                <div className="w-28 h-28 rounded-full overflow-hidden border-2 border-slate-100 mb-4 mx-auto shadow-sm">
                  <img
                    src={photoUrl}
                    alt="Profilfoto"
                    className="w-full h-full"
                    style={{ objectFit: 'cover', objectPosition: `${photoPosition.x}% ${photoPosition.y}%`, display: 'block' }}
                  />
                </div>
              )}
              <div className="text-center">
                <EditableText
                  value={personalInfo.name}
                  onChange={(val) => onUpdatePersonalInfo('name', val)}
                  className="text-[22px] font-extrabold tracking-wide text-[#1e3a8a] text-center"
                  placeholder="Dein Name"
                  multiline
                />
                <EditableText
                  value={personalInfo.title}
                  onChange={(val) => onUpdatePersonalInfo('title', val)}
                  className="text-[12px] font-bold text-slate-500 mt-1.5 text-center uppercase tracking-widest"
                  placeholder="Berufsbezeichnung"
                  multiline
                />
              </div>
            </div>

            <div className="mb-6">
              <h3 className="!text-[9px] font-bold tracking-[0.15em] uppercase text-[#1e3a8a] mb-3">
                Kontakt
              </h3>
              <div className="space-y-2.5 text-[9.5px]">
                <EditableText
                  value={personalInfo.email}
                  onChange={(val) => onUpdatePersonalInfo('email', val)}
                  className="text-slate-600 w-full"
                  placeholder="E-Mail"
                />
                <EditableText
                  value={personalInfo.phone}
                  onChange={(val) => onUpdatePersonalInfo('phone', val)}
                  className="text-slate-600 w-full"
                  placeholder="Telefon"
                />
                <EditableText
                  value={personalInfo.location}
                  onChange={(val) => onUpdatePersonalInfo('location', val)}
                  className="text-slate-600 w-full"
                  placeholder="Ort"
                />
                <EditableText
                  value={personalInfo.linkedin}
                  onChange={(val) => onUpdatePersonalInfo('linkedin', val)}
                  className="text-slate-600 w-full"
                  placeholder="LinkedIn"
                />
              </div>
            </div>

            {renderListSection('Fähigkeiten', skillsIndex)}
            {renderListSection('Soft Skills', softSkillsIndex)}
            {renderListSection('Sprachen', languagesIndex, { showLevelsForLanguages: true })}
            
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
                <div key={index} className="mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <h3 className="!text-[9px] font-bold tracking-[0.15em] uppercase text-[#1e3a8a] mb-3">
                    {label}
                  </h3>
                  <ul style={{ display: 'block' }}>
                    {items.map((item: any, idx: number) => {
                      const rawText = typeof item === 'string' ? item : item.label || item.name || item.title || item.skill || '';
                      return (
                        <li key={idx} style={{ display: 'inline-flex', marginRight: '5px', marginBottom: '5px', listStyle: 'none' }}>
                          <span className="inline-flex items-center px-2.5 py-1 rounded bg-[#f8fafc] border border-[#e2e8f0] text-[9px] font-medium text-slate-700 whitespace-nowrap">
                            <EditableText
                              value={rawText}
                              onChange={(val) => onUpdateSectionItem(index, idx, 'label', val)}
                              className="text-slate-700 bg-transparent"
                              style={{ width: `${Math.max(2, rawText.length + 1)}ch` }}
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
          </aside>

          {/* Rechte Spalte */}
          <main className="flex-1 flex flex-col min-w-0">
            <div data-pdf-section className="mb-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <section>
                <h2 className="!text-[9px] font-bold tracking-[0.15em] uppercase text-[#1e3a8a] border-b-2 border-[#1e3a8a]/20 pb-1 mb-3">
                  Profil
                </h2>
                <EditableText
                  value={summary}
                  onChange={onUpdateSummary}
                  className="text-[9.5px] text-slate-700 leading-relaxed w-full"
                  placeholder="Kurzprofil / Zusammenfassung"
                  multiline
                />
              </section>
            </div>

            <div data-pdf-section>{renderExperience()}</div>
            <div data-pdf-section>{renderEducation()}</div>
            <div data-pdf-section>{renderProjects()}</div>
            <div data-pdf-section>{renderWorkValues()}</div>

            {sections.map((section, index) => {
              const knownTypes = [
                'experience', 'education', 'projects', 'skills', 'soft_skills',
                'languages', 'work_values', 'values', 'hobbies', 'interests',
                'certifications', 'courses', 'awards', 'volunteering',
              ];
              if (knownTypes.includes(section.type)) return null;

              const items = Array.isArray(section.items) ? section.items : [];
              if (!items.length) return null;

              const title = section.title || section.type.charAt(0).toUpperCase() + section.type.slice(1);

              return (
                <div key={section.type} data-pdf-section className="mt-6" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <section>
                    <h2 className="!text-[9px] font-bold tracking-[0.15em] uppercase text-[#1e3a8a] border-b-2 border-[#1e3a8a]/20 pb-1 mb-3">
                      {title}
                    </h2>
                    <div className="space-y-3 text-[9.5px] text-slate-700">
                      {items.map((item: any, idx: number) => {
                        const text = typeof item === 'string' ? item : item.description || item.text || item.label || item.name || String(item);
                        return (
                          <div key={idx} className="flex items-start gap-2 leading-snug">
                            <span style={{ flexShrink: 0, color: '#1e3a8a', fontSize: '11px', lineHeight: '18px', userSelect: 'none' }}>•</span>
                            <EditableText
                              value={text.replace(/^[-•*]\s*/, '')}
                              onChange={(val) => onUpdateSectionItem(index, idx, 'text', val)}
                              className="leading-relaxed flex-1"
                              multiline
                              placeholder="Eintrag"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </div>
              );
            })}
          </main>
        </div>
      </div>
      
      {/* Footer */}
      <footer
        data-pdf-footer
        style={{
          borderTop: '1px solid #e2e8f0',
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: '#64748b',
          backgroundColor: '#f8fafc',
          height: '45px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600 }}>Ort:</span>
          <EditableText
            className="text-slate-500 font-medium"
            style={{ fontSize: '9px', width: '120px' }}
            value={personalInfo.location || ''}
            onChange={(val) => onUpdatePersonalInfo('location', val)}
            placeholder="Ort"
          />
        </div> 
        
        <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
          {new Date().toLocaleDateString('de-DE')}
        </span>
      </footer>
    </div>
  );
};