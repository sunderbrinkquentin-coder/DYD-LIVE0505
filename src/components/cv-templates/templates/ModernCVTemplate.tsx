import React, { useCallback, useRef, useEffect } from 'react';

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
  footerLocation?: string;
  [key: string]: any;
}

interface ModernCVTemplateProps {
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
  onDeleteSectionItem: (sectionIndex: number, itemIndex: number) => void;
  onDeleteBullet?: (sectionIndex: number, itemIndex: number, bulletIndex: number) => void;
  onReorderSections?: (fromIndex: number, toIndex: number) => void;
  // 🔥 NEU: Die Spacer-Engine & Seitenanzahl
  pageBreakItems?: Map<string, number>;
  pageCount?: number;
}

const CI = {
  primary: '#30E3CA',
  primaryDark: '#26b8a8',
  tint: '#e8f8f6',
  border: '#b6e8e0',
  bg: '#f0faf8',
};

const FONT = "'Inter', 'Roboto', 'Open Sans', system-ui, sans-serif";

const SECTION_ORDER_LEFT = ['experience', 'projects'];
const SECTION_ORDER_RIGHT = [
  'education',
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
  'stipendien',
  'scholarships',
];

interface EditableProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
  style?: React.CSSProperties;
  tag?: 'span' | 'div' | 'p' | 'h1' | 'h2';
  multiline?: boolean;
}

const Editable: React.FC<EditableProps> = ({
  value,
  onChange,
  placeholder = '',
  className = '',
  style = {},
  tag: Tag = 'span',
  multiline = false,
}) => {
  const ref = useRef<HTMLElement>(null);
  const isComposing = useRef(false);
  const lastValue = useRef(value);

  useEffect(() => {
    if (!ref.current) return;
    if (document.activeElement === ref.current) return;
    if (ref.current.textContent !== value) {
      ref.current.textContent = value;
    }
    lastValue.current = value;
  }, [value]);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const text = ref.current?.textContent ?? '';
    if (text !== lastValue.current) {
      lastValue.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      if (!multiline && e.key === 'Enter') {
        e.preventDefault();
        (e.currentTarget as HTMLElement).blur();
      }
    },
    [multiline]
  );

  return React.createElement(Tag as any, {
    ref,
    contentEditable: true,
    suppressContentEditableWarning: true,
    onInput: handleInput,
    onKeyDown: handleKeyDown,
    onCompositionStart: () => { isComposing.current = true; },
    onCompositionEnd: () => {
      isComposing.current = false;
      handleInput();
    },
    'data-placeholder': placeholder,
    className: [
      'outline-none focus:ring-0 cursor-text',
      'empty:before:content-[attr(data-placeholder)] empty:before:text-slate-300',
      className,
    ].join(' '),
    style: { fontFamily: FONT, ...style },
  });
};

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    style={{
      fontFamily: FONT,
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.13em',
      textTransform: 'uppercase',
      color: '#1e293b',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '8px',
      marginTop: '18px',
    }}
  >
    <span
      style={{
        display: 'inline-block',
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: CI.primary,
        flexShrink: 0,
      }}
    />
    {children}
  </h2>
);

const DateBadge: React.FC<{
  from: string;
  to: string;
  onChangeFrom: (v: string) => void;
  onChangeTo: (v: string) => void;
}> = ({ from, to, onChangeFrom, onChangeTo }) => (
  <span
    data-pdf-date-badge
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '3px',
      backgroundColor: CI.tint,
      borderRadius: '999px',
      padding: '3px 10px',
      fontSize: '9px',
      fontWeight: 500,
      color: '#334155',
      border: `1px solid ${CI.border}`,
      fontFamily: FONT,
      whiteSpace: 'nowrap',
      flexShrink: 0,
      lineHeight: 1.4,
      verticalAlign: 'middle',
    }}
  >
    <Editable
      value={from}
      onChange={onChangeFrom}
      placeholder="MM/JJJJ"
      style={{ fontSize: '9px', color: '#334155', textAlign: 'center', lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle' }}
    />
    <span style={{ color: '#94a3b8', margin: '0 2px', lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle' }}>–</span>
    <Editable
      value={to}
      onChange={onChangeTo}
      placeholder="heute"
      style={{ fontSize: '9px', color: '#334155', textAlign: 'center', lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle' }}
    />
  </span>
);

const Chip: React.FC<{
  value: string;
  onChange: (v: string) => void;
  bg?: string;
  borderColor?: string;
  color?: string;
  fontWeight?: string | number;
}> = ({
  value,
  onChange,
  bg = '#ffffff',
  borderColor = CI.border,
  color = '#1e293b',
  fontWeight = 600,
}) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '999px',
      padding: '4px 12px',
      fontSize: '9px',
      fontFamily: FONT,
      fontWeight,
      color,
      backgroundColor: bg,
      border: `1px solid ${borderColor}`,
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
    }}
  >
    <Editable value={value} onChange={onChange} style={{ fontSize: '9px', color, fontWeight, lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle', textAlign: 'center', whiteSpace: 'nowrap' }} />
  </span>
);

const IconLocation: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconPhone: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.47 2 2 0 0 1 3.56 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
  </svg>
);
const IconMail: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
  </svg>
);
const IconLinkedIn: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="#0A66C2" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
  </svg>
);

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
  <span style={{ display: 'inline-flex', gap: '1.5px', alignItems: 'center', flexShrink: 0 }}>
    {Array.from({ length: total }).map((_, i) => (
      <svg key={i} width="7" height="7" viewBox="0 0 12 12" fill={i < stars ? CI.primary : '#cbd5e1'}>
        <polygon points="6,1 7.5,4.5 11,5 8.5,7.5 9,11 6,9.5 3,11 3.5,7.5 1,5 4.5,4.5" />
      </svg>
    ))}
  </span>
);

const normalizeBullet = (s: string) =>
  (s ?? '').replace(/\r/g, '').replace(/^[-•\u2022]\s*/, '').trim();

const splitToBullets = (text: string): string[] =>
  (text ?? '')
    .replace(/\r/g, '')
    .split('\n')
    .map(normalizeBullet)
    .filter((l) => l.length > 0);

const getBullets = (item: any): string[] => {
  if (Array.isArray(item?.bulletPoints) && item.bulletPoints.length > 0) {
    return item.bulletPoints
      .map((b: any) => normalizeBullet(String(b ?? '')))
      .filter((b: string) => b.length > 0);
  }
  if (Array.isArray(item?.highlights) && item.highlights.length > 0) {
    return item.highlights.map((b: any) => normalizeBullet(String(b ?? '')));
  }
  if (Array.isArray(item?.description)) {
    return (item.description as any[]).map((b: any) => normalizeBullet(String(b ?? '')));
  }
  if (typeof item?.description === 'string' && item.description.trim()) {
    return splitToBullets(item.description);
  }
  return [];
};

export const ModernCVTemplate: React.FC<ModernCVTemplateProps> = ({
  personalInfo,
  summary,
  sections,
  photoUrl,
  photoPosition = { x: 50, y: 50 },
  onUpdatePersonalInfo,
  onUpdateSummary,
  onUpdateSectionItem,
  onAddSectionItem,
  onDeleteSectionItem,
  onDeleteBullet,
  onReorderSections,
  pageBreakItems,
  pageCount,
}) => {
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const footerLocation = (personalInfo.footerLocation ?? personalInfo.location ?? '').toString();

  const renderExperienceOrProjects = (
    section: EditorSection,
    sectionIndex: number,
    isProject: boolean
  ) => {
    const items = Array.isArray(section.items) ? section.items : [];
    const title = section.title || (isProject ? 'Projekte' : 'Berufserfahrung');

    return (
      <div key={`${section.type}-${sectionIndex}`}>
        <SectionTitle>{title}</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((item: any, idx: number) => {
            const bullets = getBullets(item);
            
            // 🔥 DER UMBRUCH-SCHUTZ: Holt sich den genauen Abstand aus dem Editor!
            const spacerId = `${section.type}-${sectionIndex}-${idx}`;
            const spacerHeight = pageBreakItems?.get(spacerId) || 0;

            return (
              <div
                key={idx}
                data-spacer-id={spacerId}
                data-pdf-section
                style={{
                  marginTop: spacerHeight > 0 ? `${spacerHeight}px` : '0px',
                  border: `1px solid ${CI.border}`,
                  borderRadius: '12px',
                  padding: '10px 14px',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                  breakInside: 'avoid',
                  pageBreakInside: 'avoid',
                  fontFamily: FONT,
                  display: 'block',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Editable
                      tag="div"
                      value={isProject ? item.title || item.name || '' : item.title || item.position || item.role || ''}
                      onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'title', v)}
                      placeholder={isProject ? 'Projekttitel' : 'Position / Rolle'}
                      style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}
                    />
                    <Editable
                      tag="div"
                      value={isProject ? item.role || '' : item.company || item.employer || ''}
                      onChange={(v) => onUpdateSectionItem(sectionIndex, idx, isProject ? 'role' : 'company', v)}
                      placeholder={isProject ? 'Deine Rolle' : 'Unternehmen'}
                      style={{ fontSize: '10px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}
                    />
                  </div>
                  <DateBadge
                    from={item.date_from || ''}
                    to={item.date_to || ''}
                    onChangeFrom={(v) => onUpdateSectionItem(sectionIndex, idx, 'date_from', v)}
                    onChangeTo={(v) => onUpdateSectionItem(sectionIndex, idx, 'date_to', v)}
                  />
                </div>

                {bullets.length > 0 ? (
                  <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {bullets.map((bp: string, bIdx: number) => (
                      <li key={bIdx} data-pdf-bullet-row style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                        <span
                          aria-hidden="true"
                          data-pdf-bullet-dot
                          style={{
                            display: 'inline-block',
                            flexShrink: 0,
                            color: CI.primaryDark,
                            fontSize: '9.5px',
                            lineHeight: 1.55,
                            userSelect: 'none',
                          }}
                        >
                          •
                        </span>
                        <Editable
                          tag="div"
                          multiline
                          value={bp}
                          onChange={(v) => {
                            const base = Array.isArray(item?.bulletPoints) && item.bulletPoints.length > 0
                              ? [...item.bulletPoints]
                              : [...bullets];
                            while (base.length <= bIdx) base.push('');
                            base[bIdx] = v;
                            onUpdateSectionItem(sectionIndex, idx, 'bulletPoints', base);
                            if (!Array.isArray(item?.bulletPoints)) {
                              onUpdateSectionItem(sectionIndex, idx, 'description', '');
                            }
                          }}
                          placeholder="Aufgabe / Ergebnis"
                          style={{ fontSize: '9.5px', color: '#1e293b', lineHeight: 1.55, flex: 1, display: 'block', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
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
                  <Editable
                    tag="div"
                    multiline
                    value={item.description || ''}
                    onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'description', v)}
                    placeholder="Aufgaben und wichtigste Erfolge"
                    style={{ fontSize: '9.5px', color: '#1e293b', lineHeight: 1.55, marginTop: '8px' }}
                  />
                )}

                <div
                  className="pdf-hidden"
                  data-pdf-hidden
                  style={{ marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <button
                    type="button"
                    style={{ fontSize: '9px', color: CI.primaryDark, background: 'none', border: `1px solid ${CI.border}`, borderRadius: '4px', cursor: 'pointer', padding: '2px 7px', lineHeight: '1.5' }}
                    onClick={() => {
                      const base = Array.isArray(item?.bulletPoints) && item.bulletPoints.length > 0
                        ? [...item.bulletPoints]
                        : typeof item?.description === 'string' && item.description.trim()
                          ? splitToBullets(item.description)
                          : [];
                      onUpdateSectionItem(sectionIndex, idx, 'bulletPoints', [...base, 'Neuer Punkt']);
                      if (typeof item?.description === 'string' && item.description.trim()) {
                        onUpdateSectionItem(sectionIndex, idx, 'description', '');
                      }
                    }}
                  >
                    + Bullet
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '9px', color: '#dc2626', background: 'none', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', padding: '2px 7px', lineHeight: '1.5' }}
                    onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                  >
                    Station löschen
                  </button>
                </div>
              </div>
            );
          })}

          <button
            type="button"
            className="pdf-hidden nonce-export"
            style={{ fontSize: '9px', fontWeight: 600, color: CI.primaryDark, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: '4px', padding: '4px 0' }}
            onClick={() => onAddSectionItem?.(sectionIndex, isProject ? { title: 'Neues Projekt', role: 'Deine Rolle' } : { title: 'Neue Position', company: 'Unternehmen', date_from: '01/2026', date_to: 'Heute' })}
          >
            + Eintrag hinzufügen
          </button>
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
          <div key={`education-${sectionIndex}`}>
            <SectionTitle>{section.title || 'Ausbildung & Studium'}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {items.map((edu: any, idx: number) => {
                const spacerId = `education-${sectionIndex}-${idx}`;
                const spacerHeight = pageBreakItems?.get(spacerId) || 0;

                return (
                  <div
                    key={idx}
                    data-spacer-id={spacerId}
                    data-pdf-section
                    style={{
                      marginTop: spacerHeight > 0 ? `${spacerHeight}px` : '0px',
                      border: `1px solid ${CI.border}`,
                      borderRadius: '12px',
                      padding: '10px 14px',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      breakInside: 'avoid',
                      pageBreakInside: 'avoid',
                      fontFamily: FONT,
                      display: 'block',
                      width: '100%',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Editable
                          tag="div"
                          value={edu.degree || edu.title || ''}
                          onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'degree', v)}
                          placeholder="Abschluss"
                          style={{ fontSize: '11px', fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}
                        />
                        <Editable
                          tag="div"
                          value={edu.institution || edu.school || edu.university || ''}
                          onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'institution', v)}
                          placeholder="Institution"
                          style={{ fontSize: '10px', color: '#475569', marginTop: '2px', lineHeight: 1.4 }}
                        />
                      </div>
                      <DateBadge
                        from={edu.date_from || ''}
                        to={edu.date_to || ''}
                        onChangeFrom={(v) => onUpdateSectionItem(sectionIndex, idx, 'date_from', v)}
                        onChangeTo={(v) => onUpdateSectionItem(sectionIndex, idx, 'date_to', v)}
                      />
                    </div>
                    {edu.description ? (
                      <Editable
                        tag="div"
                        multiline
                        value={edu.description}
                        onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'description', v)}
                        placeholder=""
                        style={{ fontSize: '9.5px', color: '#64748b', marginTop: '4px', lineHeight: 1.5 }}
                      />
                    ) : null}
                    <div className="pdf-hidden" data-pdf-hidden style={{ marginTop: '6px' }}>
                      <button
                        type="button"
                        style={{ fontSize: '9px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                      >
                        Eintrag löschen
                      </button>
                    </div>
                  </div>
                );
              })}
              
              <button
                type="button"
                className="pdf-hidden nonce-export"
                style={{ fontSize: '9px', fontWeight: 600, color: CI.primaryDark, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: '4px', padding: '4px 0' }}
                onClick={() => onAddSectionItem?.(sectionIndex, { degree: 'Neuer Abschluss', institution: 'Schule / Universität', date_from: '01/2026', date_to: 'Heute' })}
              >
                + Eintrag zu "Ausbildung" hinzufügen
              </button>
            </div>
          </div>
        );

      case 'languages': {
        const langItems = items.map((lang: any) => {
          let language = '';
          let level = '';
          if (typeof lang === 'string') {
            const parts = lang.split(/[-–:,]/).map((p: string) => p.trim());
            language = parts[0] || lang;
            level = parts[1] || '';
          } else if (typeof lang === 'object' && lang !== null) {
            language = lang.language || lang.name || lang.sprache || '';
            level = lang.level || lang.niveau || lang.proficiency || '';
            language = language.replace(/^(programmiersprachen|technische\s*f[äa]higkeiten|fachkenntnisse|kenntnisse|sprachen|fähigkeiten|soft\s*skills|skills|languages|kompetenzen|tools?)[:\s\-–]+/i, '').trim();
            if (level && language.toLowerCase().endsWith(level.toLowerCase())) {
              language = language.slice(0, language.length - level.length).replace(/[-–:,\s]+$/, '').trim();
            }
          } else {
            language = String(lang);
          }
          return { language, level };
        }).filter((l: { language: string; level: string }) => l.language.trim());

        if (langItems.length === 0) return null;
        return (
          <div key={`languages-${sectionIndex}`} data-pdf-section>
            <SectionTitle>{section.title || 'Sprachen'}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {langItems.map((lang: { language: string; level: string }, idx: number) => {
                const spacerId = `languages-${sectionIndex}-${idx}`;
                const spacerHeight = pageBreakItems?.get(spacerId) || 0;
                
                return (
                  <div
                    key={idx}
                    data-spacer-id={spacerId}
                    style={{
                      marginTop: spacerHeight > 0 ? `${spacerHeight}px` : '0px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderRadius: '8px',
                      padding: '5px 12px',
                      fontSize: '9px',
                      fontFamily: FONT,
                      backgroundColor: CI.tint,
                      border: `1px solid ${CI.border}`,
                      breakInside: 'avoid',
                      pageBreakInside: 'avoid',
                    }}
                  >
                    <Editable
                      value={lang.language}
                      onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'language', v)}
                      placeholder="Sprache"
                      style={{ fontSize: '9px', fontWeight: 600, color: '#0f172a' }}
                    />
                    {skillLevelToStars(lang.level) > 0 ? (
                      <StarRating stars={skillLevelToStars(lang.level)} />
                    ) : (
                      <Editable
                        value={lang.level}
                        onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'level', v)}
                        placeholder="Niveau"
                        style={{ fontSize: '9.5px', color: '#475569', textAlign: 'right' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      case 'skills': {
        if (items.length === 0) return null;
        const hasLevels = items.some((s: any) => typeof s === 'object' && s !== null && (s.level || s.niveau));
        
        const spacerId = `skills-block-${sectionIndex}`;
        const spacerHeight = pageBreakItems?.get(spacerId) || 0;

        return (
          <div key={`skills-${sectionIndex}`} data-spacer-id={spacerId} data-pdf-section style={{ marginTop: spacerHeight > 0 ? `${spacerHeight}px` : '0px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <SectionTitle>{section.title || 'Fähigkeiten'}</SectionTitle>
            {hasLevels ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {items.map((skill: any, idx: number) => {
                  const name = typeof skill === 'string' ? skill : skill.skill || skill.name || '';
                  const level = typeof skill === 'object' ? skill.level || skill.niveau || '' : '';
                  const display = level ? `${name} (${level.trim()})` : name;
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: '8px', padding: '5px 12px', fontSize: '9px', backgroundColor: CI.tint, border: `1px solid ${CI.border}`, breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <Editable value={display} onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'skill', v)} style={{ fontSize: '9px', fontWeight: 600, color: '#0f172a', flex: 1 }} />
                      <button
                        type="button"
                        className="pdf-hidden"
                        style={{ fontSize: '9px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 8px', flexShrink: 0 }}
                        onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
                {items.map((skill: any, idx: number) => {
                  const name = typeof skill === 'string' ? skill : skill.skill || skill.name || '';
                  const level = typeof skill === 'object' && skill !== null ? skill.level || skill.niveau || '' : '';
                  const display = level ? `${name} (${level.trim()})` : name;
                  return (
                    <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', marginBottom: '5px', verticalAlign: 'middle', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: CI.tint, border: `1px solid ${CI.border}`, borderRadius: '9999px', padding: '2px 8px', gap: '4px' }}>
                        <input
                          size={Math.max(3, display.length)}
                          style={{ background: 'transparent', outline: 'none', fontSize: '9px', fontWeight: 600, color: '#0f172a', minWidth: 'unset', border: 'none', width: 'auto' }}
                          value={display}
                          onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'skill', e.target.value)}
                          placeholder="Skill"
                        />
                        <button
                          type="button"
                          className="pdf-hidden"
                          style={{ fontSize: '8px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}
                          onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                        >
                          ✕
                        </button>
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      case 'soft_skills': {
        if (items.length === 0) return null;
        const spacerId = `softskills-block-${sectionIndex}`;
        const spacerHeight = pageBreakItems?.get(spacerId) || 0;

        return (
          <div key={`soft-${sectionIndex}`} data-spacer-id={spacerId} data-pdf-section style={{ marginTop: spacerHeight > 0 ? `${spacerHeight}px` : '0px', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <SectionTitle>{section.title || 'Soft Skills'}</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                const val = typeof skill === 'string' ? skill : skill.skill || skill.name || '';
                return (
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', marginRight: '5px', marginBottom: '5px', verticalAlign: 'middle', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '9999px', padding: '2px 8px', gap: '4px' }}>
                      <input
                        size={Math.max(3, val.length)}
                        style={{ background: 'transparent', outline: 'none', fontSize: '9px', color: '#334155', minWidth: 'unset', border: 'none', width: 'auto' }}
                        value={val}
                        onChange={(e) => onUpdateSectionItem(sectionIndex, idx, 'skill', e.target.value)}
                        placeholder="Soft Skill"
                      />
                      <button
                        type="button"
                        className="pdf-hidden"
                        style={{ fontSize: '8px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0 }}
                        onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                      >
                        ✕
                      </button>
                    </span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      }

      case 'work_values':
      case 'values': {
        if (items.length === 0) return null;
        const spacerId = `values-block-${sectionIndex}`;
        const spacerHeight = pageBreakItems?.get(spacerId) || 0;

        return (
          <div key={`values-${sectionIndex}`} data-spacer-id={spacerId} data-pdf-section style={{ marginTop: spacerHeight > 0 ? `${spacerHeight}px` : '0px' }}>
            <SectionTitle>Arbeitsweise & Werte</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((val: any, idx: number) => (
                <span key={idx} style={{ display: 'inline-flex', marginRight: '6px', marginBottom: '6px', verticalAlign: 'middle', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <Chip
                    value={typeof val === 'string' ? val : val.label || val.value || val.name || ''}
                    onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'label', v)}
                  />
                </span>
              ))}
            </div>
          </div>
        );
      }

      case 'hobbies':
      case 'interests': {
        if (items.length === 0) return null;
        const spacerId = `hobbies-block-${sectionIndex}`;
        const spacerHeight = pageBreakItems?.get(spacerId) || 0;

        return (
          <div key={`hobbies-${sectionIndex}`} data-spacer-id={spacerId} data-pdf-section style={{ marginTop: spacerHeight > 0 ? `${spacerHeight}px` : '0px' }}>
            <SectionTitle>Hobbys & Interessen</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((hob: any, idx: number) => (
                <span key={idx} style={{ display: 'inline-flex', marginRight: '6px', marginBottom: '6px', verticalAlign: 'middle', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                  <Chip
                    value={typeof hob === 'string' ? hob : hob.label || hob.name || ''}
                    onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'label', v)}
                  />
                </span>
              ))}
            </div>
          </div>
        );
      }

      case 'certifications':
      case 'courses':
      case 'awards':
      case 'volunteering':
      case 'stipendien':
      case 'scholarships':
        if (items.length === 0) return null;
        return (
          <div key={`${section.type}-${sectionIndex}`} data-pdf-section>
            <SectionTitle>{section.title || { awards: 'Auszeichnungen', volunteering: 'Ehrenamt', certifications: 'Zertifikate', stipendien: 'Stipendien', scholarships: 'Stipendien', courses: 'Weiterbildung' }[section.type] || section.type}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map((it: any, idx: number) => {
                const itemKey = `${sectionIndex}-${idx}`;
                const spacer = pageBreakItems?.get(itemKey) ?? 0;
                const label = it.name || it.title || it.label || it.degree || '';
                const sub = it.institution || it.company || it.issuer || it.organization || '';
                const date = it.date || it.date_from || it.year || '';

                return (
                  <div
                    key={idx}
                    data-pdf-section
                    data-spacer-id={itemKey}
                    style={{
                      border: `1px solid ${CI.border}`,
                      borderRadius: '10px',
                      padding: '8px 12px',
                      backgroundColor: '#ffffff',
                      fontFamily: FONT,
                      breakInside: 'avoid',
                      pageBreakInside: 'avoid',
                      ...(spacer > 0 ? { marginTop: `${spacer}px` } : {}),
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <Editable
                          tag="div"
                          value={label}
                          onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'name', v)}
                          placeholder="Bezeichnung"
                          style={{ fontSize: '9.5px', fontWeight: 600, color: '#1e293b', lineHeight: 1.5 }}
                        />
                        {sub && (
                          <Editable
                            tag="div"
                            value={sub}
                            onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'institution', v)}
                            placeholder="Organisation"
                            style={{ fontSize: '9px', color: '#64748b', lineHeight: 1.4, marginTop: '1px' }}
                          />
                        )}
                      </div>
                      {date && <span style={{ fontSize: '9px', color: '#64748b', whiteSpace: 'nowrap', flexShrink: 0 }}>{date}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );

      default: {
        const TYPE_LABELS_DEFAULT: Record<string, string> = {
          skills: 'Fähigkeiten', soft_skills: 'Soft Skills', hard_skills: 'Fachliche Skills',
          tools: 'Tools & Software', certifications: 'Zertifikate', courses: 'Weiterbildung',
          awards: 'Auszeichnungen', volunteering: 'Ehrenamt',
        };
        if (items.length === 0) return null;
        return (
          <div key={`${section.type}-${sectionIndex}`} data-pdf-section>
            <SectionTitle>{section.title || TYPE_LABELS_DEFAULT[section.type] || section.type}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {items.map((it: any, idx: number) => {
                const spacerId = `default-${sectionIndex}-${idx}`;
                const spacerHeight = pageBreakItems?.get(spacerId) || 0;

                return (
                  <div
                    key={idx}
                    data-spacer-id={spacerId}
                    style={{
                      marginTop: spacerHeight > 0 ? `${spacerHeight}px` : '0px',
                      border: `1px solid ${CI.border}`,
                      borderRadius: '10px',
                      padding: '8px 12px',
                      backgroundColor: '#ffffff',
                      fontFamily: FONT,
                      breakInside: 'avoid',
                      pageBreakInside: 'avoid',
                    }}
                  >
                    <Editable
                      tag="div"
                      value={typeof it === 'string' ? it : it.name || it.title || it.label || ''}
                      onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'name', v)}
                      placeholder="Eintrag"
                      style={{ fontSize: '9.5px', color: '#1e293b', lineHeight: 1.5 }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    }
  };

  const leftSections = sections.filter((s) => SECTION_ORDER_LEFT.includes(s.type));
  const rightSections = sections.filter(
    (s) => SECTION_ORDER_RIGHT.includes(s.type) || s.type === 'certificates' || s.type === 'stipends'
  );
  const otherSections = sections.filter(
    (s) => !SECTION_ORDER_LEFT.includes(s.type) && !SECTION_ORDER_RIGHT.includes(s.type) && s.type !== 'certificates' && s.type !== 'stipends'
  );

  return (
    <>
      <style>{`
        @media screen {
          .cv-render-root {
            position: relative !important;
            background-color: transparent !important;
          }
        }
      `}</style>

      <div
        className="cv-render-root"
        data-pdf-root
        style={{
          fontFamily: FONT,
          color: '#1e293b',
          width: '794px',
          minHeight: '1122px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: CI.bg,
          borderLeft: `4px solid ${CI.primary}`,
          wordBreak: 'break-word',
          overflowWrap: 'anywhere',
        }}
      >
        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header
          style={{
            backgroundColor: CI.bg,
            borderBottom: `1px solid ${CI.border}`,
            padding: '28px 32px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '24px',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <Editable
              tag="h1"
              value={personalInfo.name || ''}
              onChange={(v) => onUpdatePersonalInfo('name', v)}
              placeholder="Vollständiger Name"
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.01em',
                lineHeight: 1.2,
                marginBottom: '4px',
                display: 'block',
              }}
            />
            {personalInfo.title?.trim() && (
              <Editable
                tag="div"
                value={personalInfo.title}
                onChange={(v) => onUpdatePersonalInfo('title', v)}
                placeholder="Zielposition / Profil"
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: CI.primaryDark,
                  marginBottom: '14px',
                  display: 'block',
                }}
              />
            )}

            <div
              style={{
                display: 'block',
                fontSize: '9.5px',
                color: '#334155',
                marginTop: personalInfo.title?.trim() ? 0 : '10px',
                overflow: 'hidden',
              }}
            >
              {personalInfo.location?.trim() && (
                <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '20px', marginBottom: '4px', verticalAlign: 'middle' }}>
                  <IconLocation />
                  <Editable
                    value={personalInfo.location}
                    onChange={(v) => onUpdatePersonalInfo('location', v)}
                    placeholder="Ort"
                    style={{ fontSize: '9.5px', color: '#334155', marginLeft: '4px' }}
                  />
                </span>
              )}
              {personalInfo.phone?.trim() && (
                <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '20px', marginBottom: '4px', verticalAlign: 'middle' }}>
                  <IconPhone />
                  <Editable
                    value={personalInfo.phone}
                    onChange={(v) => onUpdatePersonalInfo('phone', v)}
                    placeholder="Telefon"
                    style={{ fontSize: '9.5px', color: '#334155', marginLeft: '4px' }}
                  />
                </span>
              )}
              {personalInfo.email?.trim() && (
                <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '20px', marginBottom: '4px', verticalAlign: 'middle' }}>
                  <IconMail />
                  <Editable
                    value={personalInfo.email}
                    onChange={(v) => onUpdatePersonalInfo('email', v)}
                    placeholder="E-Mail"
                    style={{ fontSize: '9.5px', color: '#334155', marginLeft: '4px' }}
                  />
                </span>
              )}
              {personalInfo.linkedin?.trim() && (
                <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '20px', marginBottom: '4px', verticalAlign: 'middle' }}>
                  <IconLinkedIn />
                  <Editable
                    value={personalInfo.linkedin}
                    onChange={(v) => onUpdatePersonalInfo('linkedin', v)}
                    placeholder="LinkedIn"
                    style={{ fontSize: '9.5px', color: '#334155', marginLeft: '4px' }}
                  />
                </span>
              )}
            </div>
          </div>

          {photoUrl && (
            <div style={{ flexShrink: 0 }}>
              <div
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: `2px solid ${CI.border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  backgroundColor: '#f1f5f9',
                }}
              >
                <img src={photoUrl} alt="Foto" style={{ width: '90px', height: '90px', objectFit: 'cover', objectPosition: `${photoPosition.x}% ${photoPosition.y}%`, display: 'block' }} />
              </div>
            </div>
          )}
        </header>

        {/* ── CONTENT ────────────────────────────────────────────────────── */}
        <main
          style={{
            padding: '4px 32px 16px',
            display: 'flex',
            width: '100%',
            flex: 1,
          }}
        >
          {/* LEFT COLUMN (58% Breite) */}
          <section style={{ flex: '0 0 58%', minWidth: 0, paddingRight: '14px', display: 'flex', flexDirection: 'column' }}>
            {summary?.trim() && (
              <div data-pdf-section style={{ display: 'block', width: '100%' }}>
                <SectionTitle>Profil</SectionTitle>
                <Editable
                  tag="p"
                  multiline
                  value={summary}
                  onChange={onUpdateSummary}
                  placeholder="Kurzprofil..."
                  style={{
                    fontSize: '9.5px',
                    lineHeight: 1.65,
                    color: '#1e293b',
                    backgroundColor: CI.tint,
                    border: `1px solid ${CI.border}`,
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'block',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                    overflowWrap: 'anywhere',
                  }}
                />
              </div>
            )}
            {leftSections.map((section) => {
              const index = sections.findIndex((s) => s === section);
              const content = renderSection(section, index);
              if (!content) return null;
              return (
                <div key={index} draggable={!!onReorderSections}
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== index) onReorderSections?.(from, index); }}
                  style={{ cursor: onReorderSections ? 'grab' : undefined }}
                >{content}</div>
              );
            })}
          </section>

          {/* RIGHT COLUMN (42% Breite) */}
          <aside style={{ flex: '0 0 42%', minWidth: 0, paddingLeft: '14px', display: 'flex', flexDirection: 'column' }}>
            {rightSections.map((section) => {
              const index = sections.findIndex((s) => s === section);
              const content = renderSection(section, index);
              if (!content) return null;
              return (
                <div key={index} draggable={!!onReorderSections}
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== index) onReorderSections?.(from, index); }}
                  style={{ cursor: onReorderSections ? 'grab' : undefined }}
                >{content}</div>
              );
            })}
          </aside>
        </main>

        {otherSections.length > 0 && (
          <div style={{ padding: '0 32px 16px', flex: 'none' }} data-pdf-section>
            {otherSections.map((section) => {
              const index = sections.findIndex((s) => s === section);
              const content = renderSection(section, index);
              if (!content) return null;
              return (
                <div key={index} draggable={!!onReorderSections}
                  onDragStart={(e) => { e.dataTransfer.setData('text/plain', String(index)); e.dataTransfer.effectAllowed = 'move'; }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => { e.preventDefault(); const from = parseInt(e.dataTransfer.getData('text/plain')); if (from !== index) onReorderSections?.(from, index); }}
                  style={{ cursor: onReorderSections ? 'grab' : undefined }}
                >{content}</div>
              );
            })}
          </div>
        )}

        {/* ── FOOTER ─────────────────────────────────────────────────────── */}
        <footer
          data-pdf-footer
          style={{
            borderTop: `1px solid ${CI.border}`,
            padding: '10px 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '9px',
            color: '#64748b',
            fontFamily: FONT,
            marginTop: 'auto', /* 🔥 FIX: Der Footer geht jetzt an den Boden der berechneten Seite */
            flexShrink: 0,
            backgroundColor: CI.bg,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ fontWeight: 600, flexShrink: 0 }}>Ort:</span>
            <Editable
              value={footerLocation}
              onChange={(v) => onUpdatePersonalInfo('footerLocation', v)}
              placeholder="Ort"
              style={{ fontSize: '9px', color: '#64748b' }}
            />
          </div>
          <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{today}</span>
        </footer>
      </div>
    </>
  );
};