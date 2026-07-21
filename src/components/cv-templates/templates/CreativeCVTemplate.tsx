// src/components/cv-templates/templates/CreativeCVTemplate.tsx

import React from 'react';
import {
  EditableText,
  dragProps,
  type CVTemplateProps,
  type EditorSection,
} from '../EditableText';
import { getTokens, FONT_STACK } from '../tokens';

const t = getTokens('creative');

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    data-break-keep-next
    className="mt-3 mb-1.5 font-bold tracking-[0.16em] uppercase flex items-center gap-1.5"
    style={{ fontSize: '9px', color: t.muted }}
  >
    <span className="w-1.5 h-1.5 rounded-full" style={{ background: t.accent }} />
    {children}
  </h2>
);

const SubTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      marginBottom: '6px',
      fontSize: '9px',
      fontWeight: 600,
      letterSpacing: '0.05em',
      color: t.muted,
      textTransform: 'uppercase',
    }}
  >
    {children}
  </div>
);

const ATOMIC_TYPES = new Set([
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
]);

const DETAILED_TYPES = new Set([
  'certifications',
  'courses',
  'awards',
  'volunteering',
  'stipendien',
  'scholarships',
]);

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

const chipStyle = (bg: string, border: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '4px',
  marginBottom: '4px',
  verticalAlign: 'middle',
  padding: '2px 6px',
  borderRadius: '9999px',
  background: bg,
  border: `1px solid ${border}`,
  lineHeight: 1.4,
  whiteSpace: 'nowrap',
});

const chipTextStyle: React.CSSProperties = {
  fontSize: '9px',
  color: t.chipText,
  lineHeight: 1.4,
  display: 'inline-block',
  verticalAlign: 'middle',
  textAlign: 'center',
  width: 'auto',
};

const cardStyle: React.CSSProperties = {
  display: 'block',
  marginBottom: '10px',
  borderRadius: '12px',
  background: t.surface,
  border: `1px solid ${t.border}`,
  padding: '8px 12px',
  boxShadow: '0 1px 2px rgba(15,23,42,0.05)',
  width: '100%',
};

export const CreativeCVTemplate: React.FC<CVTemplateProps> = ({
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
}) => {
  const containerMinHeight = minHeightPx ?? 1122;

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

  const handleAddBullet = (sectionIndex: number, itemIndex: number, currentItem: any) => {
    const currentBullets = getBullets(currentItem);
    onUpdateSectionItem(sectionIndex, itemIndex, 'bulletPoints', [
      ...currentBullets,
      'Neuer Bulletpoint',
    ]);
  };

  const leftColumnTypes = ['experience', 'projects'];
  const rightColumnTypes = [
    'education', 'languages', 'skills', 'soft_skills', 'work_values', 'values',
    'hobbies', 'interests', 'certifications', 'courses', 'awards',
    'volunteering', 'stipendien', 'scholarships',
  ];

  const leftSections = sections.filter((s) => leftColumnTypes.includes(s.type));
  const rightSections = sections.filter((s) => rightColumnTypes.includes(s.type));
  const otherSections = sections.filter(
    (s) => !leftColumnTypes.includes(s.type) && !rightColumnTypes.includes(s.type)
  );

  const renderBullets = (
    bullets: string[],
    sectionIndex: number,
    itemIndex: number,
    item: any,
    placeholder: string
  ) => (
    <ul
      className="mt-1"
      style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}
    >
      {bullets.map((bp: string, bIdx: number) => (
        <li
          key={bIdx}
          data-break-line
          style={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}
        >
          <span style={{ flexShrink: 0, color: t.bullet, fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
          <EditableText
            multiline
            className="flex-1 leading-snug"
            style={{ fontSize: '9.5px', color: t.muted }}
            value={bp}
            onChange={(val) => handleBulletChange(sectionIndex, itemIndex, bIdx, val, item)}
            placeholder={placeholder}
          />
          {onDeleteBullet && (
            <button
              type="button"
              className="pdf-hidden flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
              style={{ lineHeight: 1, padding: '1px 3px', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}
              onClick={() => onDeleteBullet(sectionIndex, itemIndex, bIdx)}
              title="Bullet löschen"
            >×</button>
          )}
        </li>
      ))}
    </ul>
  );

  const renderCardControls = (sectionIndex: number, itemIndex: number, item: any) => (
    <div className="pdf-hidden">
      <button
        type="button"
        style={{ fontSize: '9px', color: t.accent, border: `1px solid ${t.accentSoft}`, borderRadius: '4px', padding: '2px 7px', background: t.surface, cursor: 'pointer', lineHeight: '1.5' }}
        onClick={() => handleAddBullet(sectionIndex, itemIndex, item)}
      >
        + Bullet
      </button>
      <button
        type="button"
        style={{ fontSize: '9px', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', padding: '2px 7px', background: t.surface, cursor: 'pointer', lineHeight: '1.5' }}
        onClick={() => onDeleteSectionItem(sectionIndex, itemIndex)}
      >
        Station löschen
      </button>
    </div>
  );

  const renderDateRange = (sectionIndex: number, idx: number, item: any) => (
    <div
      className="whitespace-nowrap flex-shrink-0 flex items-center gap-0.5"
      style={{ fontSize: '9px', color: t.muted }}
    >
      <EditableText
        className="text-right"
        style={{ width: '40px' }}
        value={item.date_from || ''}
        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'date_from', val)}
        placeholder="Von"
      />
      –
      <EditableText
        style={{ width: '40px' }}
        value={item.date_to || ''}
        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'date_to', val)}
        placeholder="Bis"
      />
    </div>
  );

  const renderSection = (section: EditorSection, sectionIndex: number): React.ReactNode => {
    const items = Array.isArray(section.items) ? section.items : [];
    const sectionTitle = section.title || TYPE_LABELS[section.type] || section.type;

    const mustShow = section.type === 'experience' || section.type === 'projects';
    if (items.length === 0 && !mustShow) return null;

    switch (section.type) {
      case 'experience':
        return (
          <div>
            <SectionTitle>{sectionTitle}</SectionTitle>
            {items.map((exp: any, idx: number) => {
              const bullets = getBullets(exp);
              return (
                <div key={idx} data-pdf-section data-break-item style={cardStyle}>
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <EditableText
                        className="font-bold"
                        style={{ fontSize: '11px', color: t.text }}
                        value={exp.title || exp.position || ''}
                        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'title', val)}
                        placeholder="Position"
                      />
                      <EditableText
                        className="mt-0.5"
                        style={{ fontSize: '10px', color: t.muted }}
                        value={exp.company || ''}
                        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'company', val)}
                        placeholder="Unternehmen"
                      />
                      {(exp.location || exp.ort) && (
                        <EditableText
                          className="mt-0.5"
                          style={{ fontSize: '9.5px', color: t.faint }}
                          value={exp.location || exp.ort || ''}
                          onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'location', val)}
                          placeholder="Ort"
                        />
                      )}
                    </div>
                    {renderDateRange(sectionIndex, idx, exp)}
                  </div>

                  {bullets.length > 0 ? (
                    renderBullets(bullets, sectionIndex, idx, exp, 'Aufgabe / Erfolg')
                  ) : (
                    <EditableText
                      multiline
                      className="mt-0.5 leading-snug"
                      style={{ fontSize: '9.5px', color: t.muted, minHeight: '20px' }}
                      value={exp.description || ''}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'description', val)}
                      placeholder="Aufgaben und Erfolge (jede Zeile = eigener Punkt)"
                    />
                  )}

                  {renderCardControls(sectionIndex, idx, exp)}
                </div>
              );
            })}
          </div>
        );

      case 'projects':
        return (
          <div>
            <SectionTitle>{sectionTitle}</SectionTitle>
            {items.map((proj: any, idx: number) => {
              const bullets = getBullets(proj);
              return (
                <div key={idx} data-pdf-section data-break-item style={cardStyle}>
                  <EditableText
                    className="font-bold"
                    style={{ fontSize: '11px', color: t.text }}
                    value={proj.title || proj.name || ''}
                    onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'title', val)}
                    placeholder="Projekt"
                  />

                  {bullets.length > 0 ? (
                    renderBullets(bullets, sectionIndex, idx, proj, 'Detail / Ergebnis')
                  ) : (
                    <EditableText
                      multiline
                      className="mt-0.5 leading-snug"
                      style={{ fontSize: '9.5px', color: t.muted, minHeight: '20px' }}
                      value={proj.description || ''}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'description', val)}
                      placeholder="Kurzbeschreibung des Projekts"
                    />
                  )}

                  {renderCardControls(sectionIndex, idx, proj)}
                </div>
              );
            })}
          </div>
        );

      case 'education':
        return (
          <div>
            <SectionTitle>Ausbildung &amp; Studium</SectionTitle>
            {items.map((edu: any, idx: number) => (
              <div key={idx} data-pdf-section data-break-item style={cardStyle}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <EditableText
                      className="font-bold"
                      style={{ fontSize: '11px', color: t.text }}
                      value={edu.degree || ''}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'degree', val)}
                      placeholder="Abschluss"
                    />
                    <EditableText
                      className="mt-0.5"
                      style={{ fontSize: '10px', color: t.muted }}
                      value={edu.institution || ''}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'institution', val)}
                      placeholder="Institution"
                    />
                    {edu.location && (
                      <EditableText
                        className="mt-0.5"
                        style={{ fontSize: '9.5px', color: t.faint }}
                        value={edu.location || ''}
                        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'location', val)}
                        placeholder="Ort"
                      />
                    )}
                  </div>
                  {renderDateRange(sectionIndex, idx, edu)}
                </div>

                {(edu.grade || edu.grades || edu.note) && (
                  <div className="mt-1 flex items-center gap-1" style={{ fontSize: '9.5px', color: t.muted }}>
                    <span className="font-semibold" style={{ color: t.accent }}>Note:</span>
                    <EditableText
                      className="flex-1"
                      style={{ fontSize: '9.5px', color: t.muted }}
                      value={edu.grade || edu.grades || edu.note || ''}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'grade', val)}
                      placeholder="Note"
                    />
                  </div>
                )}

                {(edu.description || edu.focus) && (
                  <EditableText
                    multiline
                    className="mt-1 leading-snug"
                    style={{ fontSize: '9.5px', color: t.muted, minHeight: '16px' }}
                    value={edu.description || (Array.isArray(edu.focus) ? edu.focus.join(', ') : edu.focus) || ''}
                    onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'description', val)}
                    placeholder="Schwerpunkte / Beschreibung"
                  />
                )}
              </div>
            ))}
          </div>
        );

      /**
       * FIX (Konsistenz): Sprache liest jetzt auch `skill`/`label`, wie die
       * anderen vier Templates. Verwarf hier zwar bisher nichts (kein
       * `return null`), zeigte aber bei fehlendem `language`/`name` einen
       * leeren Sprachnamen, obwohl der Wert unter `skill` vorhanden war.
       */
      case 'languages':
        return (
          <div data-pdf-section data-break-atomic>
            <SectionTitle>Sprachen</SectionTitle>
            <div className="space-y-0.5">
              {items.map((lang: any, idx: number) => {
                const language = typeof lang === 'string'
                  ? lang
                  : (lang.language || lang.name || lang.sprache || lang.skill || lang.label || '');
                const level = typeof lang === 'object' && lang !== null
                  ? (lang.level || lang.niveau || lang.proficiency || '')
                  : '';
                return (
                  <div key={idx} className="flex justify-between items-center" style={{ fontSize: '9.5px' }}>
                    <EditableText
                      className="font-medium"
                      style={{ width: '50%', color: t.text }}
                      value={language}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'language', val)}
                      placeholder="Sprache"
                    />
                    <EditableText
                      className="text-right"
                      style={{ width: '50%', fontSize: '9px', color: t.muted }}
                      value={level}
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
      case 'soft_skills': {
        const isSoft = section.type === 'soft_skills';
        return (
          <div>
            <SubTitle>{isSoft ? 'Persönlich' : 'Fachlich'}</SubTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                if (!skill) return null;
                const raw = typeof skill === 'string' ? skill : skill.skill || skill.name || '';
                const cleaned = raw.replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
                if (!cleaned) return null;
                const level = typeof skill === 'object' && skill !== null ? skill.level || skill.niveau || '' : '';
                const display = level ? `${cleaned} (${level.trim()})` : cleaned;
                return (
                  <span
                    key={idx}
                    style={chipStyle(
                      isSoft ? t.chipAltBg : t.chipBg,
                      isSoft ? t.chipAltBorder : t.chipBorder
                    )}
                  >
                    <EditableText
                      style={chipTextStyle}
                      value={display}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'skill', val)}
                      placeholder={isSoft ? 'Stärke' : 'Skill'}
                    />
                  </span>
                );
              })}
            </div>
          </div>
        );
      }

      case 'work_values':
      case 'values':
        return (
          <div data-pdf-section data-break-atomic>
            <SectionTitle>Arbeitsweise &amp; Werte</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((item: any, idx: number) => {
                const v = typeof item === 'string' ? item : item.label || item.name || '';
                if (!v) return null;
                return (
                  <span key={idx} style={chipStyle(t.chipBg, t.accent)}>
                    <EditableText
                      style={chipTextStyle}
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
          <div data-pdf-section data-break-atomic>
            <SectionTitle>Hobbys &amp; Interessen</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((item: any, idx: number) => {
                const v = typeof item === 'string' ? item : item.label || item.name || '';
                if (!v) return null;
                return (
                  <span key={idx} style={chipStyle('#fff7ed', '#f97316')}>
                    <EditableText
                      style={chipTextStyle}
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

      default: {
        const isDetailed = DETAILED_TYPES.has(section.type);
        const isAtomic = ATOMIC_TYPES.has(section.type);

        return (
          <div data-pdf-section {...(isAtomic ? { 'data-break-atomic': '' } : {})}>
            <SectionTitle>{sectionTitle}</SectionTitle>
            <ul className="space-y-1" style={{ fontSize: '9.5px' }}>
              {items.map((item: any, idx: number) => {
                if (isDetailed) {
                  const name = item.name || item.title || item.label || item.degree || '';
                  const institution = item.institution || item.company || item.issuer || item.organization || '';
                  const date = item.date || item.date_from || item.year || '';

                  return (
                    <li
                      key={idx}
                      className="py-0.5 last:border-b-0"
                      style={{ borderBottom: `1px solid ${t.border}` }}
                    >
                      <div style={{ fontWeight: 600, marginBottom: institution || date ? '2px' : '0' }}>
                        <EditableText
                          style={{ color: t.text }}
                          value={name}
                          onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'name', val)}
                          placeholder="Name/Titel"
                        />
                      </div>
                      {institution && (
                        <div style={{ marginBottom: date ? '2px' : '0' }}>
                          <EditableText
                            style={{ fontSize: '9px', color: t.muted }}
                            value={institution}
                            onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'institution', val)}
                            placeholder="Institution"
                          />
                        </div>
                      )}
                      {date && (
                        <EditableText
                          style={{ fontSize: '9px', color: t.muted }}
                          value={date}
                          onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'date', val)}
                          placeholder="Datum"
                        />
                      )}
                    </li>
                  );
                }

                const displayValue =
                  typeof item === 'string'
                    ? item
                    : item.name || item.title || item.label || '';
                if (!displayValue) return null;

                return (
                  <li
                    key={idx}
                    className="py-0.5 last:border-b-0"
                    style={{ borderBottom: `1px solid ${t.border}` }}
                  >
                    <EditableText
                      style={{ color: t.text }}
                      value={displayValue}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'name', val)}
                      placeholder="Eintrag"
                    />
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
    }
  };

  const renderRightSection = (section: EditorSection): React.ReactNode => {
    const sectionIndex = sections.findIndex((s) => s === section);

    if (section.type === 'soft_skills') {
      const hasSkills = rightSections.some((s) => s.type === 'skills');
      if (hasSkills) return null;
      return (
        <div key="skills-tools-block" data-pdf-section data-break-atomic>
          <SectionTitle>Skills &amp; Tools</SectionTitle>
          {renderSection(section, sectionIndex)}
        </div>
      );
    }

    if (section.type === 'skills') {
      const softSkillsSection = rightSections.find((s) => s.type === 'soft_skills');
      return (
        <div key="skills-tools-block" data-pdf-section data-break-atomic>
          <SectionTitle>Skills &amp; Tools</SectionTitle>
          {renderSection(section, sectionIndex)}
          {softSkillsSection &&
            renderSection(softSkillsSection, sections.findIndex((s) => s === softSkillsSection))}
        </div>
      );
    }

    const content = renderSection(section, sectionIndex);
    if (!content) return null;
    return (
      <div key={sectionIndex} {...dragProps(sectionIndex, onReorderSections)}>
        {content}
      </div>
    );
  };

  return (
    <div
      className="relative flex flex-col w-full"
      style={{
        fontFamily: FONT_STACK,
        color: t.text,
        backgroundColor: t.surface,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        minHeight: `${containerMinHeight}px`,
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ opacity: 0.35 }}>
        <div className="absolute -top-10 -left-16 w-52 h-52 blur-3xl rounded-full" style={{ background: t.accent }} />
        <div className="absolute -bottom-20 right-0 w-64 h-64 blur-3xl rounded-full" style={{ background: '#66c0b6' }} />
      </div>

      <div>
        <header
          className="relative px-6 pt-4 pb-2.5 flex items-center justify-between gap-3 flex-shrink-0"
          style={{ borderBottom: `1px solid ${t.border}`, background: t.surfaceAlt }}
        >
          <div className="relative flex-1 min-w-0">
            <EditableText
              className="font-extrabold tracking-[0.12em] uppercase"
              style={{ fontSize: '22px', color: t.text }}
              value={personalInfo.name || ''}
              onChange={(val) => onUpdatePersonalInfo('name', val)}
              placeholder="Name"
            />
            <EditableText
              className="mt-0.5 font-bold"
              style={{ fontSize: '12px', color: t.muted }}
              value={personalInfo.title || ''}
              onChange={(val) => onUpdatePersonalInfo('title', val)}
              placeholder="Titel"
            />
            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-0.5" style={{ fontSize: '9.5px', color: t.muted }}>
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
              <div
                className="w-20 h-20 rounded-3xl overflow-hidden shadow-md"
                style={{ border: `2px solid ${t.border}`, background: t.surfaceAlt }}
              >
                <img
                  src={photoUrl}
                  alt="Foto"
                  className="w-full h-full"
                  style={{
                    objectFit: 'cover',
                    objectPosition: `${photoPosition.x}% ${photoPosition.y}%`,
                    width: '80px',
                    height: '80px',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          )}
        </header>

        <main
          className="relative px-6 py-3 grid grid-cols-12 gap-4"
          style={{ flex: 'none', background: t.surface }}
        >
          <section className="col-span-7 space-y-3">
            <div data-break-atomic>
              <SectionTitle>Profil &amp; Story</SectionTitle>
              <EditableText
                multiline
                className="mt-0.5 leading-relaxed rounded-lg px-2 py-1.5"
                style={{
                  fontSize: '9.5px',
                  color: t.text,
                  background: t.surfaceAlt,
                  border: `1px solid ${t.border}`,
                  minHeight: '60px',
                }}
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
                <div key={sectionIndex} {...dragProps(sectionIndex, onReorderSections)}>
                  {content}
                </div>
              );
            })}
          </section>

          <aside className="col-span-5 space-y-3">
            {rightSections.map(renderRightSection)}
          </aside>
        </main>

        {otherSections.length > 0 && (
          <div className="relative px-6 pb-3 space-y-3" style={{ background: t.surface }}>
            {otherSections.map((section) => {
              const sectionIndex = sections.findIndex((s) => s === section);
              const content = renderSection(section, sectionIndex);
              if (!content) return null;
              return (
                <div key={sectionIndex} {...dragProps(sectionIndex, onReorderSections)}>
                  {content}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <footer
        data-pdf-footer
        className="relative flex-shrink-0"
        style={{
          marginTop: 'auto',
          padding: '10px 24px',
          borderTop: `1px solid ${t.border}`,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '8px',
          fontSize: '9px',
          color: t.muted,
          backgroundColor: t.surfaceAlt,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>Ort:</span>
          <EditableText
            style={{ width: '128px', color: t.text, borderBottom: `1px dashed ${t.border}`, paddingLeft: '4px', paddingRight: '4px' }}
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