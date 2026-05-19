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

interface MinimalCVTemplateProps {
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

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-4 mb-1.5 text-[10px] font-semibold tracking-[0.16em] text-slate-700 uppercase flex items-center gap-1.5">
    <span className="w-1 h-1 rounded-full bg-slate-400" />
    {children}
  </h2>
);

// Gemeinsame Bullet-Logik – keine doppelten Bullets, saubere Zeilen
const stripLeadingBullet = (s: string) =>
  s.replace(/^[-•\u2022]\s*/, '');

const getBullets = (item: any): string[] => {
  if (!item) return [];

  const possibleArrays = [
    item.bulletPoints, 
    item.bullet_points, 
    item.bulletpoints, 
    item.tasks, 
    item.highlights,
    item.erfolge
  ];
  
  const foundArray = possibleArrays.find(arr => Array.isArray(arr) && arr.length > 0);
  
  if (foundArray) {
    return foundArray
      .map((s: any) => stripLeadingBullet(String(s).trim()))
      .filter((s: string) => s.length > 0);
  }

  const possibleTexts = [
    item.description, 
    item.beschreibung, 
    item.text,
    item.aufgaben
  ];
  
  const foundText = possibleTexts.find(txt => typeof txt === 'string' && txt.trim().length > 0);

  if (foundText) {
    return foundText
      .split('\n')
      .map((s: string) => stripLeadingBullet(s.trim()))
      .filter((s: string) => s.length > 0);
  }

  return [];
};

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
};

export const MinimalCVTemplate: React.FC<MinimalCVTemplateProps> = ({
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

  // Summary auto-height
  useEffect(() => {
    if (summaryRef.current) autoResize(summaryRef.current);
  }, [summary]);

  const renderExperienceOrProjects = (
    section: EditorSection,
    sectionIndex: number,
    isProject: boolean
  ) => {
    const items = Array.isArray(section.items) ? section.items : [];
    if (items.length === 0) return null;

    const title = section.title || (isProject ? 'Projekte' : 'Berufserfahrung');

    return (
      <div key={sectionIndex}>
        <SectionTitle>{title}</SectionTitle>
        <div className="space-y-1.5">
          {items.map((item: any, idx: number) => {
            const bullets = getBullets(item);

            return (
              <div
                key={idx}
                /* 💡 HIER KORRIGIERT: data-pdf-section schützt jeden einzelnen Inhaltsblock */
                data-pdf-section
                style={{ display: 'block', width: '100%' }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/90"
              >
                <div className="flex justify-between gap-2 items-start">
                  <div className="flex-1 min-w-0">
                    <input
                      className="w-full text-[11px] font-semibold text-slate-900 bg-transparent outline-none"
                      value={
                        isProject
                          ? item.title || item.name || ''
                          : item.title || item.position || item.role || ''
                      }
                      onChange={(e) =>
                        onUpdateSectionItem(sectionIndex, idx, 'title', e.target.value)
                      }
                      placeholder={isProject ? 'Projekt' : 'Position'}
                    />
                    <input
                      className="mt-0.5 w-full text-[10px] text-slate-500 bg-transparent outline-none"
                      value={
                        isProject
                          ? item.role || ''
                          : item.company || item.employer || ''
                      }
                      onChange={(e) =>
                        onUpdateSectionItem(
                          sectionIndex,
                          idx,
                          isProject ? 'role' : 'company',
                          e.target.value
                        )
                      }
                      placeholder={isProject ? 'Rolle' : 'Unternehmen'}
                    />
                    {!isProject && (item.location || item.ort) && (
                      <input
                        className="mt-0.5 w-full text-[10px] text-slate-400 bg-transparent outline-none"
                        value={item.location || item.ort || ''}
                        onChange={(e) =>
                          onUpdateSectionItem(sectionIndex, idx, 'location', e.target.value)
                        }
                        placeholder="Ort"
                      />
                    )}
                  </div>

                  <div className="text-[10px] text-slate-500 text-right whitespace-nowrap flex flex-col items-end gap-0.5 flex-shrink-0">
                    <input
                      className="bg-transparent outline-none w-20 text-right"
                      value={item.date_from || ''}
                      onChange={(e) =>
                        onUpdateSectionItem(sectionIndex, idx, 'date_from', e.target.value)
                      }
                      placeholder="Von"
                    />
                    <input
                      className="bg-transparent outline-none w-20 text-right"
                      value={item.date_to || ''}
                      onChange={(e) =>
                        onUpdateSectionItem(sectionIndex, idx, 'date_to', e.target.value)
                      }
                      placeholder="Bis"
                    />
                  </div>
                </div>

                {bullets.length > 0 ? (
                  <ul className="mt-1 space-y-[2px] text-[10px] text-slate-800">
                    {bullets.map((bp: string, bIdx: number) => (
                      <li key={bIdx} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="flex items-start gap-1.5">
                        <span 
                          style={{ 
                            flexShrink: 0, 
                            color: '#64748b', 
                            fontSize: '12px', 
                            lineHeight: '10px', 
                            marginTop: '1px', 
                            userSelect: 'none' 
                          }}
                        >
                          •
                        </span>
                        
                        <textarea
                          className="flex-1 bg-transparent outline-none text-slate-800 text-[10px] leading-tight resize-none"
                          value={bp}
                          onChange={(e) => {
                            autoResize(e.target);
                            const newBullets = [...bullets];
                            newBullets[bIdx] = e.target.value;
                            onUpdateSectionItem(
                              sectionIndex,
                              idx,
                              'bulletPoints',
                              newBullets
                            );
                          }}
                          onFocus={(e) => autoResize(e.target)}
                          ref={(el) => { if (el) autoResize(el); }}
                          placeholder="Aufgabe / Ergebnis"
                          style={{ overflow: 'hidden', minHeight: '20px' }}
                        />
                      </li>
                    ))}
                  </ul>
                ) : (
                  <textarea
                    className="mt-1 w-full text-[10px] text-slate-800 bg-transparent outline-none resize-none leading-tight"
                    value={item.description || ''}
                    onChange={(e) => {
                      autoResize(e.target);
                      onUpdateSectionItem(sectionIndex, idx, 'description', e.target.value);
                    }}
                    onFocus={(e) => autoResize(e.target)}
                    ref={(el) => { if (el) autoResize(el); }}
                    placeholder="Kurz Aufgaben und Erfolge beschreiben"
                    style={{ overflow: 'hidden', minHeight: '40px' }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSection = (section: EditorSection, sectionIndex: number) => {
    const items = Array.isArray(section.items) ? section.items : [];

    switch (section.type) {
      case 'experience':
        return renderExperienceOrProjects(section, sectionIndex, false);
      case 'projects':
        return renderExperienceOrProjects(section, sectionIndex, true);

      case 'education':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex}>
            <SectionTitle>{section.title || 'Ausbildung / Studium'}</SectionTitle>
            <div className="space-y-1.5">
              {items.map((edu: any, idx: number) => (
                <div
                  key={idx}
                  /* 💡 HIER KORRIGIERT: data-pdf-section schützt auch die Ausbildung */
                  data-pdf-section
                  style={{ display: 'block', width: '100%' }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/90"
                >
                  <div className="flex justify-between gap-2 items-start">
                    <div className="flex-1 min-w-0">
                      <input
                        className="w-full text-[11px] font-semibold text-slate-900 bg-transparent outline-none"
                        value={edu.degree || ''}
                        onChange={(e) =>
                          onUpdateSectionItem(sectionIndex, idx, 'degree', e.target.value)
                        }
                        placeholder="Abschluss"
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
                    </div>

                    <div className="text-[10px] text-slate-500 text-right whitespace-nowrap flex flex-col items-end gap-0.5 flex-shrink-0">
                      <input
                        className="bg-transparent outline-none w-20 text-right"
                        value={edu.date_from || ''}
                        onChange={(e) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_from', e.target.value)
                        }
                        placeholder="Von"
                      />
                      <input
                        className="bg-transparent outline-none w-20 text-right"
                        value={edu.date_to || ''}
                        onChange={(e) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_to', e.target.value)
                        }
                        placeholder="Bis"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'languages':
        if (!items || items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section>
            <SectionTitle>Sprachen</SectionTitle>
            <div className="space-y-1">
              {items.map((lang: any, idx: number) => {
                if (!lang) return null;
                const rawLanguage = typeof lang === 'string' ? lang : lang.language || lang.name || '';
                
                let language = rawLanguage
                  .replace(/^(programmiersprachen|technische\s*f[äa]higkeiten|fachkenntnisse|kenntnisse|sprachen|fähigkeiten|soft\s*skills|skills|languages|kompetenzen|tools?)[:\s\-–]+/i, '')
                  .replace(/\s*\(?Otherskill\)?/gi, '')
                  .replace(/\s*\($/, '')
                  .trim();

                if (language === '') return null;

                const level = typeof lang === 'object' && lang !== null ? lang.level || lang.niveau || lang.proficiency || '' : '';
                return (
                  <div
                    key={idx}
                    style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}
                    className="flex justify-between items-center gap-2 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[10px]"
                  >
                    <input
                      className="bg-transparent outline-none flex-1 font-medium text-slate-900"
                      value={language}
                      onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'language', e.target.value)}
                      placeholder="Sprache"
                    />
                    <input
                      className="bg-transparent outline-none text-right text-slate-600 min-w-[60px]"
                      value={level}
                      onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'level', e.target.value)}
                      placeholder="Niveau"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );

      case 'skills':
        if (!items || items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section>
            <SectionTitle>{section.title || 'Fähigkeiten'}</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                if (!skill) return null;
                
                const val = typeof skill === 'string' ? skill : (skill.skill || skill.name || skill.label || '');
                const level = typeof skill === 'object' && skill !== null ? (skill.level || skill.niveau || '') : '';
                
                let cleanedVal = val.replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (cleanedVal === '') return null;

                const display = level ? `${cleanedVal} (${level.trim()})` : cleanedVal;
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '6px', marginBottom: '6px', verticalAlign: 'middle', padding: '3px 10px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9.5px', fontWeight: 600, color: '#1e293b', minWidth: '20px', border: 'none', width: `${Math.max(20, display.length * 6.5)}px` }}
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
        if (!items || items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section>
            <SectionTitle>{section.title || 'Soft Skills'}</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                if (!skill) return null;
                
                const val = typeof skill === 'string' ? skill : (skill.skill || skill.name || skill.label || '');
                const level = typeof skill === 'object' && skill !== null ? (skill.level || skill.niveau || '') : '';
                
                let cleanedVal = val.replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (cleanedVal === '') return null;

                const display = level ? `${cleanedVal} (${level.trim()})` : cleanedVal;
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '6px', marginBottom: '6px', verticalAlign: 'middle', padding: '3px 10px', borderRadius: '9999px', border: '1px solid #e2e8f0', background: '#ffffff', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9.5px', fontWeight: 500, color: '#334155', minWidth: '20px', border: 'none', width: `${Math.max(20, display.length * 6.5)}px` }}
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
        if (!items || items.length === 0) return null;
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
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', padding: '2px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#0f172a', border: 'none', minWidth: '20px', width: `${Math.max(20, cleanedV.length * 6)}px` }}
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
        if (!items || items.length === 0) return null;
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
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', padding: '2px 8px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#f8fafc', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#0f172a', border: 'none', minWidth: '20px', width: `${Math.max(20, cleanedV.length * 6)}px` }}
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

      default: {
        const TYPE_LABELS_MIN: Record<string, string> = {
          skills: 'Fähigkeiten', soft_skills: 'Soft Skills', hard_skills: 'Fachliche Skills',
          tools: 'Tools & Software', certifications: 'Zertifikate', courses: 'Weiterbildung',
          awards: 'Auszeichnungen', volunteering: 'Ehrenamt',
        };
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section>
            <SectionTitle>{section.title || TYPE_LABELS_MIN[section.type] || section.type}</SectionTitle>
            <ul className="space-y-1 text-[10px] text-slate-800">
              {items.map((it: any, idx: number) => {
                const value =
                  typeof it === 'string'
                    ? it
                    : it.name || it.title || it.label || JSON.stringify(it);
                return (
                  <li
                    key={idx}
                    className="border-b border-slate-100 last:border-b-0 py-0.5"
                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  >
                    <input
                      className="w-full bg-transparent outline-none text-slate-800"
                      value={value}
                      onChange={(e) =>
                        onUpdateSectionItem(sectionIndex, idx, 'name', e.target.value)
                      }
                      placeholder="Eintrag"
                    />
                  </td>
                );
              })}
            </ul>
          </div>
        );
      }

  const leftTypes = ['experience', 'projects', 'education'];
  const rightTypes = [
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

  const leftSections = sections.filter((s) => leftTypes.includes(s.type));
  const rightSections = sections.filter((s) => rightTypes.includes(s.type));
  const otherSections = sections.filter(
    (s) => !leftTypes.includes(s.type) && !rightTypes.includes(s.type)
  );

  return (
    <div className="bg-white text-slate-900 font-sans w-full flex flex-col border border-slate-200" style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', minHeight: '1122px' }}>
        {/* Header */}
        <header className="px-8 pt-6 pb-4 border-b border-slate-200 flex justify-between gap-6 bg-slate-50/70">
          <div className="flex-1 min-w-0">
            <input
              className="w-full text-[22px] font-semibold tracking-wide text-slate-900 bg-transparent outline-none"
              value={personalInfo.name || ''}
              onChange={(e) => onUpdatePersonalInfo('name', e.target.value)}
              placeholder="Name"
            />
            <input
              className="mt-1 w-full text-sm text-slate-600 bg-transparent outline-none"
              value={personalInfo.title || ''}
              onChange={(e) => onUpdatePersonalInfo('title', e.target.value)}
              placeholder="Zielposition / Profil"
            />

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-700">
              <div className="flex items-center gap-1.5">
                <span>📍</span>
                <input
                  className="bg-transparent outline-none flex-1"
                  value={personalInfo.location || ''}
                  onChange={(e) =>
                    onUpdatePersonalInfo('location', e.target.value)
                  }
                  placeholder="Ort"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>☎</span>
                <input
                  className="bg-transparent outline-none flex-1"
                  value={personalInfo.phone || ''}
                  onChange={(e) =>
                    onUpdatePersonalInfo('phone', e.target.value)
                  }
                  placeholder="Telefon"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>✉</span>
                <input
                  className="bg-transparent outline-none flex-1"
                  value={personalInfo.email || ''}
                  onChange={(e) =>
                    onUpdatePersonalInfo('email', e.target.value)
                  }
                  placeholder="E-Mail"
                />
              </div>

              <div className="flex items-center gap-1.5">
                {personalInfo.linkedin ? (
                  <span className="text-[11px] font-semibold text-slate-700">
                    in
                  </span>
                ) : (
                  <span className="w-3" />
                )}
                <input
                  className="bg-transparent outline-none flex-1"
                  value={personalInfo.linkedin || ''}
                  onChange={(e) =>
                    onUpdatePersonalInfo('linkedin', e.target.value)
                  }
                  placeholder="LinkedIn (optional)"
                />
              </div>
            </div>
          </div>

          {photoUrl && (
            <div className="flex-shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border border-slate-200 bg-slate-100">
                <img
                  src={photoUrl}
                  alt="Foto"
                  className="w-full h-full"
                  style={{ objectFit: 'cover', objectPosition: `${photoPosition.x}% ${photoPosition.y}%`, width: '96px', height: '96px', display: 'block' }}
                />
              </div>
            </div>
          )}
        </header>

        {/* 🛠️ FIX FÜR DEN SEITENUMBRUCH: Flexbox-Spaltensystem statt starrem CSS-Grid */}
        <div style={{ display: 'flex', width: '100%', backgroundColor: '#ffffff', flex: 1, padding: '16px 0' }}>
          
          {/* Linke Spalte (58% Breite) */}
          <section style={{ flex: '0 0 58%', minWidth: 0, paddingLeft: '32px', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <SectionTitle>Profil</SectionTitle>
              <textarea
                ref={summaryRef}
                className="w-full text-[11px] leading-relaxed text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none resize-none"
                style={{ minHeight: '60px', overflow: 'hidden' }}
                value={summary || ''}
                onChange={(e) => {
                  if (summaryRef.current) {
                    summaryRef.current.style.height = 'auto';
                    summaryRef.current.style.height = summaryRef.current.scrollHeight + 'px';
                  }
                  onUpdateSummary(e.target.value);
                }}
                placeholder="Kurzprofil: Wer bist du, was bringst du mit und was suchst du?"
              />
            </div>

            {leftSections.map((section) => {
              const index = sections.findIndex((s) => s === section);
              return renderSection(section, index);
            })}
          </section>

          {/* Rechte Spalte (42% Breite) */}
          <aside style={{ flex: '0 0 42%', minWidth: 0, paddingLeft: '12px', paddingRight: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {rightSections.map((section) => {
              const index = sections.findIndex((s) => s === section);
              return renderSection(section, index);
            })}
          </aside>
        </div>

        {/* Weitere Sections */}
        {otherSections.length > 0 && (
          <div className="px-8 pb-4 space-y-3 bg-white" data-pdf-section>
            {otherSections.map((section) => {
              const index = sections.findIndex((s) => s === section);
              return renderSection(section, index);
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
        </div>
        
        <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>
          {new Date().toLocaleDateString('de-DE')}
        </span>
      </footer>
    </div>
  );
};