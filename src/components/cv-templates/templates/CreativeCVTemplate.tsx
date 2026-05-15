// src/components/cv-templates/templates/CreativeCVTemplate.tsx
import React, { useEffect, useRef, useState } from 'react';

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
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-3 mb-1.5 text-xs font-semibold tracking-[0.16em] text-[#f9fafb] uppercase flex items-center gap-1.5">
    <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-[#22c1c3] to-[#66c0b6]" />
    {children}
  </h2>
);

// grobe A4-Höhe in px (für Preview-Guides)
const PAGE_HEIGHT_PX = 1123;

export const CreativeCVTemplate: React.FC<CreativeCVTemplateProps> = ({
  personalInfo,
  summary,
  sections,
  photoUrl,
  photoPosition = { x: 50, y: 50 },
  onUpdatePersonalInfo,
  onUpdateSummary,
  onUpdateSectionItem,
}) => {
  const summaryRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pageCount, setPageCount] = useState(1);

  // Summary automatisch an Inhalt anpassen
  useEffect(() => {
    if (summaryRef.current) {
      summaryRef.current.style.height = 'auto';
      summaryRef.current.style.height = summaryRef.current.scrollHeight + 'px';
    }
  }, [summary]);

  // Seitenhöhe grob messen für A4-Guides
  useEffect(() => {
    const measure = () => {
      if (!containerRef.current) return;
      const scrollHeight = containerRef.current.scrollHeight;
      const pages = Math.max(1, Math.ceil(scrollHeight / PAGE_HEIGHT_PX));
      setPageCount(pages);
    };

    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [sections, summary, personalInfo]);

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

    // Berufserfahrung & Projekte IMMER anzeigen
    const mustShow = section.type === 'experience' || section.type === 'projects';
    if (items.length === 0 && !mustShow) return null;

    switch (section.type) {
      // ───────────────── Experience ─────────────────
      case 'experience':
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            {items.map((exp: any, idx: number) => {
              const bullets = getBullets(exp);
              return (
                <div
                  key={idx}
                  className="mb-2.5 rounded-xl bg-[#020617] border border-white/35 px-3 py-2 shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                      <input
                        className="font-semibold text-[11px] outline-none w-full bg-transparent text-[#f9fafb]"
                        value={exp.title || exp.position || ''}
                        onChange={(e) =>
                          onUpdateSectionItem(sectionIndex, idx, 'title', e.target.value)
                        }
                        placeholder="Position"
                      />
                      <input
                        className="outline-none bg-transparent w-full text-[10px] text-[#cbd5f5] mt-0.5"
                        value={exp.company || ''}
                        onChange={(e) =>
                          onUpdateSectionItem(sectionIndex, idx, 'company', e.target.value)
                        }
                        placeholder="Unternehmen"
                      />
                      {(exp.location || exp.ort) && (
                        <input
                          className="outline-none bg-transparent w-full text-[9px] text-[#94a3b8] mt-0.5"
                          value={exp.location || exp.ort || ''}
                          onChange={(e) =>
                            onUpdateSectionItem(sectionIndex, idx, 'location', e.target.value)
                          }
                          placeholder="Ort"
                        />
                      )}
                    </div>
                    <div className="text-[10px] text-[#e5e7eb] whitespace-nowrap flex-shrink-0 flex items-center gap-0.5">
                      <input
                        className="outline-none bg-transparent w-14 text-right"
                        value={exp.date_from || ''}
                        onChange={(e) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_from', e.target.value)
                        }
                        placeholder="Von"
                      />
                      –
                      <input
                        className="outline-none bg-transparent w-14"
                        value={exp.date_to || ''}
                        onChange={(e) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_to', e.target.value)
                        }
                        placeholder="Bis"
                      />
                    </div>
                  </div>

                  {bullets.length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-[10px] text-[#e5e7eb]">
                      {bullets.map((bp: string, bIdx: number) => (
                        <li key={bIdx} className="flex items-start gap-1">
                          <span className="text-[#22c1c3] mt-0.5 text-[11px]">▸</span>
                          <textarea
                            className="flex-1 bg-transparent outline-none resize-none overflow-hidden leading-snug text-[#e5e7eb]"
                            style={{ minHeight: '20px', height: 'auto' }}
                            value={bp}
                            onChange={(e) => {
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                              handleBulletChange(
                                sectionIndex,
                                idx,
                                bIdx,
                                e.target.value,
                                exp
                              );
                            }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                            onFocus={(e) => {
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            placeholder="Aufgabe / Erfolg"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <textarea
                      className="mt-0.5 w-full text-[10px] text-[#e5e7eb] outline-none resize-none overflow-hidden bg-transparent leading-snug"
                      style={{ minHeight: '40px', height: 'auto' }}
                      value={exp.description || ''}
                      onChange={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                        onUpdateSectionItem(sectionIndex, idx, 'description', e.target.value);
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Aufgaben und Erfolge (jede Zeile = eigener Punkt)"
                    />
                  )}

                  <button
                    type="button"
                    className="mt-0.5 text-[9px] text-[#38bdf8] hover:underline"
                    onClick={() => handleAddBullet(sectionIndex, idx, exp)}
                  >
                    + Punkt
                  </button>
                </div>
              );
            })}
          </div>
        );

      // ───────────────── Projekte ─────────────────
      case 'projects':
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            {items.map((proj: any, idx: number) => {
              const bullets = getBullets(proj);
              return (
                <div
                  key={idx}
                  className="mb-2 rounded-xl bg-[#020617] border border-white/35 px-3 py-2 shadow-sm"
                >
                  <input
                    className="font-semibold text-[11px] outline-none w-full bg-transparent text-[#f9fafb]"
                    value={proj.title || proj.name || ''}
                    onChange={(e) =>
                      onUpdateSectionItem(sectionIndex, idx, 'title', e.target.value)
                    }
                    placeholder="Projekt"
                  />

                  {bullets.length > 0 ? (
                    <ul className="mt-1 space-y-0.5 text-[10px] text-[#e5e7eb]">
                      {bullets.map((bp: string, bIdx: number) => (
                        <li key={bIdx} className="flex items-start gap-1">
                          <span className="text-[#22c1c3] mt-0.5 text-[11px]">▸</span>
                          <textarea
                            className="flex-1 bg-transparent outline-none resize-none overflow-hidden leading-snug text-[#e5e7eb]"
                            style={{ minHeight: '20px', height: 'auto' }}
                            value={bp}
                            onChange={(e) => {
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                              handleBulletChange(
                                sectionIndex,
                                idx,
                                bIdx,
                                e.target.value,
                                proj
                              );
                            }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = target.scrollHeight + 'px';
                            }}
                            onFocus={(e) => {
                              e.target.style.height = 'auto';
                              e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            placeholder="Detail / Ergebnis"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <textarea
                      className="mt-0.5 w-full text-[10px] text-[#e5e7eb] outline-none resize-none overflow-hidden bg-transparent leading-snug"
                      style={{ minHeight: '25px', height: 'auto' }}
                      value={proj.description || ''}
                      onChange={(e) => {
                        e.target.style.height = 'auto';
                        e.target.style.height = e.target.scrollHeight + 'px';
                        onUpdateSectionItem(sectionIndex, idx, 'description', e.target.value);
                      }}
                      onInput={(e) => {
                        const target = e.target as HTMLTextAreaElement;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                      placeholder="Kurzbeschreibung des Projekts"
                    />
                  )}

                  <button
                    type="button"
                    className="mt-0.5 text-[9px] text-[#38bdf8] hover:underline"
                    onClick={() => handleAddBullet(sectionIndex, idx, proj)}
                  >
                    + Punkt
                  </button>
                </div>
              );
            })}
          </div>
        );

      // ───────────────── Ausbildung ─────────────────
      case 'education':
        return (
          <div key={sectionIndex}>
            <SectionTitle>Ausbildung & Studium</SectionTitle>
            {items.map((edu: any, idx: number) => (
              <div
                key={idx}
                className="mb-2 rounded-xl bg-[#020617] border border-white/35 px-3 py-2 shadow-sm"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <input
                      className="font-semibold text-[11px] outline-none w-full bg-transparent text-[#f9fafb]"
                      value={edu.degree || ''}
                      onChange={(e) =>
                        onUpdateSectionItem(sectionIndex, idx, 'degree', e.target.value)
                      }
                      placeholder="Abschluss"
                    />
                    <input
                      className="outline-none bg-transparent w-full text-[10px] text-[#cbd5f5] mt-0.5"
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
                  <div className="text-[10px] text-[#e5e7eb] whitespace-nowrap flex-shrink-0 flex items-center gap-0.5">
                    <input
                      className="outline-none bg-transparent w-14 text-right"
                      value={edu.date_from || ''}
                      onChange={(e) =>
                        onUpdateSectionItem(sectionIndex, idx, 'date_from', e.target.value)
                      }
                      placeholder="Von"
                    />
                    –
                    <input
                      className="outline-none bg-transparent w-14"
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
        );

      // ───────────────── Sprachen ─────────────────
      case 'languages':
        return (
          <div key={sectionIndex}>
            <SectionTitle>Sprachen</SectionTitle>
            <div className="space-y-0.5">
              {items.map((lang: any, idx: number) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-[10px] text-[#f9fafb]"
                >
                  <input
                    className="outline-none bg-transparent font-medium w-1/2"
                    value={
                      typeof lang === 'string'
                        ? lang
                        : lang.language || lang.name || ''
                    }
                    onChange={(e) =>
                      onUpdateSectionItem(sectionIndex, idx, 'language', e.target.value)
                    }
                    placeholder="Sprache"
                  />
                  <input
                    className="outline-none bg-transparent text-white/70 w-1/2 text-right text-[9px]"
                    value={
                      typeof lang === 'object'
                        ? lang.level || lang.proficiency || ''
                        : ''
                    }
                    onChange={(e) =>
                      onUpdateSectionItem(sectionIndex, idx, 'level', e.target.value)
                    }
                    placeholder="Niveau"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      // ───────────────── Fachliche Skills ─────────────────
      case 'skills':
        return (
          <div key={sectionIndex}>
            <div style={{ marginBottom: '2px', fontSize: '9px', fontWeight: 600, letterSpacing: '0.05em', color: '#cbd5f5', textTransform: 'uppercase' }}>
              Fachlich
            </div>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                const val = typeof skill === 'string' ? skill : skill.skill || skill.name || '';
                const level = typeof skill === 'object' && skill !== null ? skill.level || skill.niveau || '' : '';
                const display = level ? `${val} (${level})` : val;
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', padding: '2px 6px', borderRadius: '9999px', background: '#020617', border: '1px solid #38bdf8', whiteSpace: 'nowrap' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#f9fafb', minWidth: '20px', border: 'none', width: `${Math.max(20, display.length * 5.5)}px` }}
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
        return (
          <div key={sectionIndex}>
            <div style={{ marginBottom: '2px', fontSize: '9px', fontWeight: 600, letterSpacing: '0.05em', color: '#cbd5f5', textTransform: 'uppercase' }}>
              Persönlich
            </div>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                const val = typeof skill === 'string' ? skill : skill.skill || skill.name || '';
                const level = typeof skill === 'object' && skill !== null ? skill.level || skill.niveau || '' : '';
                const display = level ? `${val} (${level})` : val;
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', padding: '2px 6px', borderRadius: '9999px', background: '#020617', border: '1px solid #a855f7', whiteSpace: 'nowrap' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#f9fafb', minWidth: '20px', border: 'none', width: `${Math.max(20, display.length * 5.5)}px` }}
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
        return (
          <div key={sectionIndex}>
            <SectionTitle>Arbeitsweise & Werte</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((val: any, idx: number) => {
                const v = typeof val === 'string' ? val : val.label || '';
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', padding: '2px 6px', borderRadius: '9999px', background: '#020617', border: '1px solid #22c1c3', whiteSpace: 'nowrap' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#f9fafb', border: 'none', minWidth: '20px', width: `${Math.max(20, v.length * 5.5)}px` }}
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
        return (
          <div key={sectionIndex}>
            <SectionTitle>Hobbys & Interessen</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((hob: any, idx: number) => {
                const v = typeof hob === 'string' ? hob : hob.label || '';
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', verticalAlign: 'middle', padding: '2px 6px', borderRadius: '9999px', background: '#020617', border: '1px solid #f97316', whiteSpace: 'nowrap' }}>
                    <input
                      style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#f9fafb', border: 'none', minWidth: '20px', width: `${Math.max(20, v.length * 5.5)}px` }}
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
        return (
          <div key={sectionIndex}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            <ul className="space-y-1 text-[10px] text-[#e5e7eb]">
              {items.map((item: any, idx: number) => {
                const displayValue =
                  typeof item === 'string'
                    ? item
                    : item.name || item.title || item.label || JSON.stringify(item);
                return (
                  <li
                    key={idx}
                    className="py-0.5 border-b border-white/15 last:border-b-0"
                  >
                    <input
                      className="w-full outline-none bg-transparent text-[#f9fafb]"
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
        ref={containerRef}
        className="relative bg-[#020314] text-white font-sans flex flex-col w-full"
        style={{ wordBreak: 'break-word', overflowWrap: 'anywhere', minHeight: '1122px' }}
      >
        {/* A4-Guides (gestrichelte Trennlinien) – nur im Editor sichtbar */}
        {pageCount > 1 &&
          Array.from({ length: pageCount - 1 }).map((_, i) => (
            <div
              key={i}
              data-pdf-hidden
              className="pdf-hidden pointer-events-none absolute left-4 right-4 border-t border-dashed border-white/20"
              style={{ top: (i + 1) * PAGE_HEIGHT_PX }}
            />
          ))}

        {/* Glow-Hintergrund */}
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div className="absolute -top-10 -left-16 w-52 h-52 bg-[#22c1c3] blur-3xl rounded-full" />
          <div className="absolute -bottom-20 right-0 w-64 h-64 bg-[#66c0b6] blur-3xl rounded-full" />
        </div>

        {/* Header */}
        <header className="relative px-6 pt-4 pb-2.5 flex items-center justify-between border-b border-white/15 bg-[#020617]/90 gap-3 flex-shrink-0">
          <div className="relative flex-1">
            <input
              className="block w-full text-2xl font-bold tracking-[0.12em] uppercase outline-none bg-transparent text-[#f9fafb]"
              value={personalInfo.name || ''}
              onChange={(e) => onUpdatePersonalInfo('name', e.target.value)}
              placeholder="Name"
            />
            <input
              className="mt-0.5 block w-full text-sm font-medium text-[#e5e7eb] outline-none bg-transparent"
              value={personalInfo.title || ''}
              onChange={(e) => onUpdatePersonalInfo('title', e.target.value)}
              placeholder="Titel"
            />
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5 text-[11px] text-[#f9fafb]">
              <div className="flex items-center gap-1.5">
                <span>📍</span>
                <input
                  className="w-full bg-transparent outline-none"
                  value={personalInfo.location || ''}
                  onChange={(e) => onUpdatePersonalInfo('location', e.target.value)}
                  placeholder="Ort"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>☎</span>
                <input
                  className="w-full bg-transparent outline-none"
                  value={personalInfo.phone || ''}
                  onChange={(e) => onUpdatePersonalInfo('phone', e.target.value)}
                  placeholder="Telefon"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>✉</span>
                <input
                  className="w-full bg-transparent outline-none"
                  value={personalInfo.email || ''}
                  onChange={(e) => onUpdatePersonalInfo('email', e.target.value)}
                  placeholder="E-Mail"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span>in</span>
                <input
                  className="w-full bg-transparent outline-none"
                  value={personalInfo.linkedin || ''}
                  onChange={(e) => onUpdatePersonalInfo('linkedin', e.target.value)}
                  placeholder="LinkedIn"
                />
              </div>
            </div>
          </div>

          {photoUrl && (
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-3xl overflow-hidden border-2 border-white bg-[#020617] shadow-md">
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
        <main className="relative flex-1 px-6 py-3 grid grid-cols-12 gap-4 text-[#e5e7eb] bg-[#020314]/90">
          <section className="col-span-7 space-y-3">
            <div>
              <SectionTitle>Profil & Story</SectionTitle>
              <textarea
                ref={summaryRef}
                className="w-full mt-0.5 text-[11px] leading-relaxed text-[#f9fafb] bg-white/10 rounded-lg border border:white/25 border-white/25 outline-none resize-none px-2 py-1.5 backdrop-blur-sm overflow-hidden"
                style={{ minHeight: '60px', height: 'auto' }}
                value={summary || ''}
                onChange={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = e.target.scrollHeight + 'px';
                  onUpdateSummary(e.target.value);
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = target.scrollHeight + 'px';
                }}
                placeholder="Beschreibe kurz deinen Werdegang, dein Profil und was dich ausmacht."
              />
            </div>

            {leftSections.map((section) => {
              const sectionIndex = sections.findIndex((s) => s === section);
              return renderSection(section, sectionIndex);
            })}
          </section>

          <aside className="col-span-5 space-y-3">
            {rightSections.map((section) => {
              const sectionIndex = sections.findIndex((s) => s === section);

              // Skills + Soft Skills zusammen als Block "Skills & Tools"
              if (section.type === 'skills' || section.type === 'soft_skills') {
                const skillsSection = rightSections.find((s) => s.type === 'skills');
                const softSkillsSection = rightSections.find(
                  (s) => s.type === 'soft_skills'
                );

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
                  // Wird bereits im kombinierten Block gerendert
                  return null;
                }
              }

              return renderSection(section, sectionIndex);
            })}
          </aside>
        </main>

        {otherSections.length > 0 && (
          <div className="relative px-6 pb-3 space-y-3 bg-[#020314]/90">
            {otherSections.map((section) => {
              const sectionIndex = sections.findIndex((s) => s === section);
              return renderSection(section, sectionIndex);
            })}
          </div>
        )}

        {/* Footer */}
        <footer data-pdf-footer className="relative px-6 py-3 border-t border-white/15 text-[10px] text-white/80 flex flex-col sm:flex-row justify-between gap-2 bg-[#020617] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span>Ort:</span>
            <input
              className="bg-transparent outline-none border-b border-dashed border-white/40 px-1 flex-1 sm:w-32 text-white"
              placeholder="Stadt"
              defaultValue=""
            />
          </div>
          <div className="flex items-center gap-2">
            <span>Datum:</span>
            <input
              className="bg-transparent outline-none border-b border-dashed border-white/40 px-1 flex-1 sm:w-32 text-white"
              placeholder="TT.MM.JJJJ"
              defaultValue={new Date().toLocaleDateString('de-DE')}
            />
          </div>
          {pageCount > 1 && (
            <div className="flex items-center gap-1 sm:ml-auto">
              <span>Voraussichtliche Seiten:</span>
              <span className="font-semibold text-white">{pageCount}</span>
            </div>
          )}
        </footer>
      </div>
  );
};
