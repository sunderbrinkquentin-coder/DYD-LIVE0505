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

const ACCENT = '#1a2e44';
const ACCENT_LIGHT = '#243d59';
const GOLD = '#c9a84c';

const autoResize = (el: HTMLTextAreaElement) => {
  el.style.height = 'auto';
  el.style.height = el.scrollHeight + 'px';
};

// ── Icon helpers ──────────────────────────────────────────────────────────────
const IconMail = () => (
  <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <rect x="2" y="4" width="16" height="12" rx="2" /><polyline points="2,4 10,13 18,4" />
  </svg>
);
const IconPhone = () => (
  <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M3 4a1 1 0 011-1h2.5a1 1 0 011 1l1 4a1 1 0 01-.29.71l-1.5 1.5a11 11 0 004.58 4.58l1.5-1.5a1 1 0 01.71-.29l4 1A1 1 0 0117 15v2.5a1 1 0 01-1 1A14 14 0 013 4z" />
  </svg>
);
const IconLocation = () => (
  <svg width="10" height="10" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10 2a6 6 0 016 6c0 5-6 10-6 10S4 13 4 8a6 6 0 016-6z" /><circle cx="10" cy="8" r="2" />
  </svg>
);
const IconLinkedIn = () => (
  <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" style={{ flexShrink: 0 }}>
    <rect x="2" y="2" width="16" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    <rect x="5" y="8" width="2" height="7" /><circle cx="6" cy="5.5" r="1" />
    <path d="M9 8h2v1.3a3 3 0 015 2.7V15h-2v-2.8A1.5 1.5 0 0011.5 10.5v-.5H9V8z" />
  </svg>
);

// ── Sidebar section title ─────────────────────────────────────────────────────
const SidebarTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3 style={{ fontSize: '8.5px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, marginBottom: '8px', marginTop: '16px', borderBottom: `1px solid rgba(201,168,76,0.35)`, paddingBottom: '4px' }}>
    {children}
  </h3>
);

// ── Main section title ────────────────────────────────────────────────────────
const MainTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ fontSize: '9px', fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: ACCENT, borderBottom: `2px solid ${GOLD}`, paddingBottom: '4px', marginBottom: '10px', marginTop: '16px' }}>
    {children}
  </h2>
);

const EditableInput: React.FC<{
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}> = ({ value, onChange, placeholder, style, className }) => (
  <input
    className={`bg-transparent outline-none border-none focus:ring-0 w-full ${className ?? ''}`}
    style={style}
    value={value ?? ''}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
  />
);

const EditableArea: React.FC<{
  value?: string;
  onChange: (v: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
  className?: string;
}> = ({ value, onChange, placeholder, style, className }) => (
  <textarea
    className={`bg-transparent outline-none border-none focus:ring-0 w-full resize-none ${className ?? ''}`}
    style={{ overflow: 'hidden', minHeight: '40px', ...style }}
    value={value ?? ''}
    placeholder={placeholder}
    onChange={(e) => { autoResize(e.target); onChange(e.target.value); }}
    onFocus={(e) => autoResize(e.target)}
    ref={(el) => { if (el) autoResize(el); }}
  />
);

const BulletList: React.FC<{ bullets: any[] }> = ({ bullets }) => {
  if (!bullets?.length) return null;
  return (
    <ul style={{ paddingLeft: 0, listStyle: 'none', marginTop: '4px' }}>
      {bullets.map((bp, idx) => {
        const text = typeof bp === 'string' ? bp : bp?.text ?? String(bp);
        if (!text) return null;
        return (
          <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginBottom: '2px' }}>
            <span style={{ flexShrink: 0, marginTop: '5px', width: '4px', height: '4px', background: GOLD, display: 'inline-block', borderRadius: '1px' }} />
            <span style={{ flex: 1, fontSize: '10px', color: '#374151', lineHeight: 1.45 }}>{text}</span>
          </li>
        );
      })}
    </ul>
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
  const findIdx = (type: string) => sections.findIndex((s) => s.type === type);

  const experienceIndex = findIdx('experience');
  const educationIndex = findIdx('education');
  const projectsIndex = findIdx('projects');
  const skillsIndex = findIdx('skills');
  const softSkillsIndex = findIdx('soft_skills');
  const languagesIndex = findIdx('languages');
  const workValuesIndex = findIdx('work_values');

  const stripPrefix = (val: string) =>
    val.replace(/^(programmiersprachen|technische\s*f[äa]higkeiten|fachkenntnisse|kenntnisse|sprachen|fähigkeiten|soft\s*skills|skills|languages|kompetenzen|tools?)[:\s\-–]+/i, '').trim();

  // ── Sidebar chip list ───────────────────────────────────────────────────────
  const renderChips = (index: number, fieldKey = 'skill') => {
    if (index === -1) return null;
    const items = Array.isArray(sections[index]?.items) ? sections[index].items : [];
    if (!items.length) return null;
    return (
      <div style={{ display: 'block', overflow: 'visible' }}>
        {items.map((item: any, idx: number) => {
          const raw = typeof item === 'string' ? item : item[fieldKey] || item.label || item.name || item.skill || '';
          const text = stripPrefix(raw);
          return (
            <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', padding: '2px 8px', borderRadius: '3px', background: 'rgba(201,168,76,0.15)', border: `1px solid rgba(201,168,76,0.5)`, whiteSpace: 'nowrap' }}>
              <input
                style={{ background: 'transparent', outline: 'none', fontSize: '9px', fontWeight: 600, color: '#f9f5eb', minWidth: '20px', border: 'none', width: `${Math.max(20, text.length * 5.8)}px` }}
                value={text}
                onChange={(e) => onUpdateSectionItem(index, idx, fieldKey, e.target.value)}
                placeholder="..."
              />
            </span>
          );
        })}
      </div>
    );
  };

  // ── Languages ───────────────────────────────────────────────────────────────
  const renderLanguages = () => {
    if (languagesIndex === -1) return null;
    const items = Array.isArray(sections[languagesIndex]?.items) ? sections[languagesIndex].items : [];
    if (!items.length) return null;
    return (
      <>
        {items.map((item: any, idx: number) => {
          const lang = stripPrefix(item.language || item.name || item.sprache || '');
          const level = item.level || item.niveau || item.proficiency || '';
          return (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <input
                style={{ background: 'transparent', outline: 'none', fontSize: '9.5px', color: '#e8e0d0', fontWeight: 500, border: 'none', flex: 1 }}
                value={lang}
                onChange={(e) => onUpdateSectionItem(languagesIndex, idx, 'language', e.target.value)}
                placeholder="Sprache"
              />
              <input
                style={{ background: 'transparent', outline: 'none', fontSize: '8.5px', color: 'rgba(201,168,76,0.9)', border: 'none', textAlign: 'right', width: '70px', flexShrink: 0 }}
                value={level}
                onChange={(e) => onUpdateSectionItem(languagesIndex, idx, 'level', e.target.value)}
                placeholder="Niveau"
              />
            </div>
          );
        })}
      </>
    );
  };

  // ── Experience ──────────────────────────────────────────────────────────────
  const renderExperience = () => {
    if (experienceIndex === -1) return null;
    const items = Array.isArray(sections[experienceIndex]?.items) ? sections[experienceIndex].items : [];
    return (
      <div>
        <MainTitle>Berufserfahrung</MainTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((item: any, idx: number) => (
            <div key={idx} data-avoid-break style={{ borderLeft: `3px solid ${GOLD}`, paddingLeft: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <EditableInput
                  value={item.title}
                  onChange={(v) => onUpdateSectionItem(experienceIndex, idx, 'title', v)}
                  placeholder="Position"
                  style={{ fontSize: '11.5px', fontWeight: 700, color: ACCENT, flex: 1 }}
                />
                <span style={{ fontSize: '9px', color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0, paddingTop: '1px' }}>
                  {[item.date_from, item.date_to].filter(Boolean).join(' – ')}
                </span>
              </div>
              <EditableInput
                value={item.company || item.employer || ''}
                onChange={(v) => onUpdateSectionItem(experienceIndex, idx, 'company', v)}
                placeholder="Unternehmen"
                style={{ fontSize: '10px', color: '#4b5563', marginTop: '1px' }}
              />
              {(item.location || item.ort) && (
                <EditableInput
                  value={item.location || item.ort || ''}
                  onChange={(v) => onUpdateSectionItem(experienceIndex, idx, 'location', v)}
                  placeholder="Ort"
                  style={{ fontSize: '9px', color: '#9ca3af' }}
                />
              )}
              {item.description && (
                <EditableArea
                  value={item.description}
                  onChange={(v) => onUpdateSectionItem(experienceIndex, idx, 'description', v)}
                  placeholder="Beschreibung"
                  style={{ fontSize: '10px', color: '#374151', marginTop: '3px' }}
                />
              )}
              {Array.isArray(item.bulletPoints) && item.bulletPoints.length > 0 && (
                <BulletList bullets={item.bulletPoints} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Education ───────────────────────────────────────────────────────────────
  const renderEducation = () => {
    if (educationIndex === -1) return null;
    const items = Array.isArray(sections[educationIndex]?.items) ? sections[educationIndex].items : [];
    return (
      <div>
        <MainTitle>Ausbildung / Studium</MainTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item: any, idx: number) => (
            <div key={idx} data-avoid-break style={{ borderLeft: `3px solid #d1d5db`, paddingLeft: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <EditableInput
                  value={item.degree}
                  onChange={(v) => onUpdateSectionItem(educationIndex, idx, 'degree', v)}
                  placeholder="Abschluss / Studiengang"
                  style={{ fontSize: '11px', fontWeight: 700, color: ACCENT, flex: 1 }}
                />
                <span style={{ fontSize: '9px', color: '#6b7280', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {[item.date_from, item.date_to].filter(Boolean).join(' – ')}
                </span>
              </div>
              <EditableInput
                value={item.institution}
                onChange={(v) => onUpdateSectionItem(educationIndex, idx, 'institution', v)}
                placeholder="Institution"
                style={{ fontSize: '10px', color: '#4b5563' }}
              />
              {item.description && (
                <EditableArea
                  value={item.description}
                  onChange={(v) => onUpdateSectionItem(educationIndex, idx, 'description', v)}
                  placeholder="Schwerpunkte / Details"
                  style={{ fontSize: '10px', color: '#374151', marginTop: '2px' }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Projects ────────────────────────────────────────────────────────────────
  const renderProjects = () => {
    if (projectsIndex === -1) return null;
    const items = Array.isArray(sections[projectsIndex]?.items) ? sections[projectsIndex].items : [];
    if (!items.length) return null;
    return (
      <div>
        <MainTitle>Projekte</MainTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.map((item: any, idx: number) => (
            <div key={idx} style={{ borderLeft: `3px solid #d1d5db`, paddingLeft: '10px' }}>
              <EditableInput
                value={item.title || item.name || ''}
                onChange={(v) => onUpdateSectionItem(projectsIndex, idx, 'title', v)}
                placeholder="Projektname"
                style={{ fontSize: '11px', fontWeight: 700, color: ACCENT }}
              />
              {item.role && (
                <EditableInput
                  value={item.role}
                  onChange={(v) => onUpdateSectionItem(projectsIndex, idx, 'role', v)}
                  placeholder="Rolle"
                  style={{ fontSize: '10px', color: '#4b5563' }}
                />
              )}
              {item.description && (
                <EditableArea
                  value={item.description}
                  onChange={(v) => onUpdateSectionItem(projectsIndex, idx, 'description', v)}
                  placeholder="Projektbeschreibung"
                  style={{ fontSize: '10px', color: '#374151', marginTop: '2px' }}
                />
              )}
              {Array.isArray(item.bulletPoints) && item.bulletPoints.length > 0 && (
                <BulletList bullets={item.bulletPoints} />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Work Values ─────────────────────────────────────────────────────────────
  const renderWorkValues = () => {
    if (workValuesIndex === -1) return null;
    const items = Array.isArray(sections[workValuesIndex]?.items) ? sections[workValuesIndex].items : [];
    if (!items.length) return null;
    return (
      <div>
        <MainTitle>Arbeitsweise & Werte</MainTitle>
        <div style={{ display: 'block', overflow: 'visible' }}>
          {items.map((item: any, idx: number) => {
            const text = typeof item === 'string' ? item : item.label || item.name || item.value || '';
            return (
              <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', marginBottom: '5px', padding: '2px 8px', borderRadius: '3px', background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
                <input
                  style={{ background: 'transparent', outline: 'none', fontSize: '9.5px', color: '#374151', border: 'none', minWidth: '20px', width: `${Math.max(20, text.length * 6)}px` }}
                  value={text}
                  onChange={(e) => onUpdateSectionItem(workValuesIndex, idx, 'value', e.target.value)}
                  placeholder="Wert"
                />
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      style={{
        fontFamily: '"Inter", "Helvetica Neue", Arial, sans-serif',
        minHeight: '1122px',
        width: '100%',
        boxSizing: 'border-box',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        display: 'flex',
        flexDirection: 'column',
        background: '#ffffff',
      }}
    >
      {/* ── Dark accent header strip ─────────────────────────────────────── */}
      <div style={{ background: ACCENT, padding: '28px 32px 24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
        {photoUrl && (
          <div style={{ width: '72px', height: '72px', borderRadius: '4px', overflow: 'hidden', border: `2px solid ${GOLD}`, flexShrink: 0 }}>
            <img
              src={photoUrl}
              alt="Profilfoto"
              style={{ objectFit: 'cover', objectPosition: `${photoPosition.x}% ${photoPosition.y}%`, width: '72px', height: '72px', display: 'block' }}
            />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <EditableInput
            value={personalInfo.name}
            onChange={(v) => onUpdatePersonalInfo('name', v)}
            placeholder="Vollständiger Name"
            style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em', lineHeight: 1.1 }}
          />
          <EditableInput
            value={personalInfo.title}
            onChange={(v) => onUpdatePersonalInfo('title', v)}
            placeholder="Berufsbezeichnung"
            style={{ fontSize: '12px', color: GOLD, fontWeight: 500, marginTop: '4px', letterSpacing: '0.04em' }}
          />
        </div>
        {/* Contact row in header */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
          {[
            { icon: <IconMail />, field: 'email', placeholder: 'E-Mail' },
            { icon: <IconPhone />, field: 'phone', placeholder: 'Telefon' },
            { icon: <IconLocation />, field: 'location', placeholder: 'Ort' },
            { icon: <IconLinkedIn />, field: 'linkedin', placeholder: 'LinkedIn' },
          ].map(({ icon, field, placeholder }) => (
            <div key={field} style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'rgba(255,255,255,0.75)' }}>
              {icon}
              <EditableInput
                value={personalInfo[field]}
                onChange={(v) => onUpdatePersonalInfo(field, v)}
                placeholder={placeholder}
                style={{ fontSize: '9.5px', color: 'rgba(255,255,255,0.85)', width: '140px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Body: sidebar + main ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: '220px', minWidth: '220px', background: ACCENT_LIGHT, padding: '20px 16px', color: '#e8e0d0', flexShrink: 0 }}>

          {/* Summary */}
          <SidebarTitle>Profil</SidebarTitle>
          <textarea
            style={{ background: 'transparent', outline: 'none', border: 'none', width: '100%', resize: 'none', fontSize: '9.5px', color: 'rgba(232,224,208,0.9)', lineHeight: 1.55, overflow: 'hidden', minHeight: '40px' }}
            value={summary || ''}
            placeholder="Kurzprofil"
            onChange={(e) => { autoResize(e.target); onUpdateSummary(e.target.value); }}
            onFocus={(e) => autoResize(e.target)}
            ref={(el) => { if (el) autoResize(el); }}
          />

          {/* Skills */}
          {skillsIndex !== -1 && (
            <>
              <SidebarTitle>Fähigkeiten</SidebarTitle>
              {renderChips(skillsIndex)}
            </>
          )}

          {/* Soft Skills */}
          {softSkillsIndex !== -1 && (
            <>
              <SidebarTitle>Soft Skills</SidebarTitle>
              {renderChips(softSkillsIndex)}
            </>
          )}

          {/* Languages */}
          {languagesIndex !== -1 && (
            <>
              <SidebarTitle>Sprachen</SidebarTitle>
              {renderLanguages()}
            </>
          )}

          {/* Other sidebar sections */}
          {sections.map((section, index) => {
            const sidebarTypes = ['values', 'hobbies', 'interests', 'certifications', 'courses', 'awards', 'volunteering'];
            if (!sidebarTypes.includes(section.type)) return null;
            const items = Array.isArray(section.items) ? section.items : [];
            if (!items.length) return null;
            const labelMap: Record<string, string> = {
              values: 'Werte', hobbies: 'Hobbys & Interessen', interests: 'Interessen',
              certifications: 'Zertifikate', courses: 'Kurse', awards: 'Auszeichnungen', volunteering: 'Ehrenamt',
            };
            const label = section.title || labelMap[section.type] || section.type;
            return (
              <div key={index}>
                <SidebarTitle>{label}</SidebarTitle>
                <div style={{ display: 'block', overflow: 'visible' }}>
                  {items.map((item: any, idx: number) => {
                    const raw = typeof item === 'string' ? item : item.label || item.name || item.title || item.skill || '';
                    return (
                      <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '4px', marginBottom: '4px', padding: '2px 7px', borderRadius: '3px', background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.4)', whiteSpace: 'nowrap' }}>
                        <input
                          style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#f9f5eb', border: 'none', minWidth: '20px', width: `${Math.max(20, raw.length * 5.8)}px` }}
                          value={raw}
                          onChange={(e) => onUpdateSectionItem(index, idx, 'label', e.target.value)}
                          placeholder="Eintrag"
                        />
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, padding: '20px 24px', minWidth: 0 }}>
          {renderExperience()}
          {renderEducation()}
          {renderProjects()}
          {renderWorkValues()}

          {/* Unknown sections fallback */}
          {sections.map((section, index) => {
            const knownTypes = ['experience', 'education', 'projects', 'skills', 'soft_skills',
              'languages', 'work_values', 'values', 'hobbies', 'interests',
              'certifications', 'courses', 'awards', 'volunteering'];
            if (knownTypes.includes(section.type)) return null;
            const items = Array.isArray(section.items) ? section.items : [];
            if (!items.length) return null;
            const title = section.title || section.type.charAt(0).toUpperCase() + section.type.slice(1);
            return (
              <div key={section.type}>
                <MainTitle>{title}</MainTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {items.map((item: any, idx: number) => {
                    const text = typeof item === 'string' ? item : item.description || item.text || item.label || item.name || String(item);
                    return (
                      <EditableArea
                        key={idx}
                        value={text}
                        onChange={(v) => onUpdateSectionItem(index, idx, 'text', v)}
                        placeholder="Eintrag"
                        style={{ fontSize: '10.5px', color: '#374151' }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </main>
      </div>
    </div>
  );
};
