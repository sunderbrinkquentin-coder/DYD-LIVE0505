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
  onAddSectionItem?: (sectionIndex: number, defaultItem: any) => void;
  onDeleteSectionItem?: (sectionIndex: number, itemIndex: number) => void;
  onDeleteBullet?: (sectionIndex: number, itemIndex: number, bulletIndex: number) => void;
  onReorderSections?: (fromIndex: number, toIndex: number) => void;
  pageBreakItems?: Map<string, number>;
  pageCount?: number; // 🔥 NEU
}

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 className="mt-4 mb-1.5 !text-[9px] font-bold tracking-[0.16em] text-slate-700 uppercase flex items-center gap-1.5">
    <span className="w-1 h-1 rounded-full bg-slate-400" />
    {children}
  </h2>
);

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
      .map((s: any) => stripLeadingBullet(String(s ?? '').trim()))
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

const EditableText: React.FC<{
  value?: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
}> = ({ value, onChange, className = '', placeholder = '', multiline = false, style }) => {
  const v = value ?? '';
  const ref = useRef<HTMLDivElement>(null);
  const isComposing = useRef(false);
  const isFocused = useRef(false);
  const lastValue = useRef(v);
  // `renderKey` is rendered as JSX children, so the correct text is present
  // from the FIRST render/paint — no need to wait for an effect (which could
  // run after a PDF clone is taken, leaving the clone empty). It mirrors `v`
  // except while focused, where it's frozen so React doesn't remount the
  // node mid-keystroke (which would reset the cursor position).
  const [renderKey, setRenderKey] = useState(v);

  useEffect(() => {
    if (!isFocused.current) {
      setRenderKey(v);
      lastValue.current = v;
    }
  }, [v]);

  const handleInput = useCallback(() => {
    if (isComposing.current) return;
    const text = ref.current?.textContent ?? '';
    if (text !== lastValue.current) {
      lastValue.current = text;
      onChange(text);
    }
  }, [onChange]);

  const handleFocus = useCallback(() => {
    isFocused.current = true;
  }, []);

  const handleBlur = useCallback(() => {
    isFocused.current = false;
    handleInput();
    setRenderKey(ref.current?.textContent ?? v);
  }, [handleInput, v]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!multiline && e.key === 'Enter') {
      e.preventDefault();
      e.currentTarget.blur();
    }
  }, [multiline]);

  return (
    <div
      key={renderKey}
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
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
    >{renderKey}</div>
  );
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
  onDeleteSectionItem = () => {},
  onDeleteBullet,
  onReorderSections,
  pageBreakItems,
  pageCount, // 🔥 NEU
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
            // 🔥 Konsistente ID: section.type + sectionIndex + idx
            const itemKey = `${section.type}-${sectionIndex}-${idx}`;
            const spacer = pageBreakItems?.get(itemKey) ?? 0;
            const bullets = getBullets(item);

            return (
              <div
                key={idx}
                data-pdf-section
                data-spacer-id={itemKey}
                style={{ display: 'block', width: '100%', ...(spacer > 0 ? { marginTop: `${spacer}px` } : {}) }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/90"
              >
                <div className="flex justify-between gap-2 items-start">
                  <div className="flex-1 min-w-0">
                    <EditableText
                      className="text-[11px] font-bold text-slate-900"
                      value={
                        isProject
                          ? item.title || item.name || ''
                          : item.title || item.position || item.role || ''
                      }
                      onChange={(val) =>
                        onUpdateSectionItem(sectionIndex, idx, 'title', val)
                      }
                      placeholder={isProject ? 'Projekt' : 'Position'}
                    />
                    <EditableText
                      className="mt-0.5 text-[10px] text-slate-500"
                      value={
                        isProject
                          ? item.role || ''
                          : item.company || item.employer || ''
                      }
                      onChange={(val) =>
                        onUpdateSectionItem(
                          sectionIndex,
                          idx,
                          isProject ? 'role' : 'company',
                          val
                        )
                      }
                      placeholder={isProject ? 'Rolle' : 'Unternehmen'}
                    />
                    {!isProject && (item.location || item.ort) && (
                      <EditableText
                        className="mt-0.5 text-[10px] text-slate-400"
                        value={item.location || item.ort || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'location', val)
                        }
                        placeholder="Ort"
                      />
                    )}
                  </div>

                  <div className="text-[9px] text-slate-500 text-right whitespace-nowrap flex flex-col items-end gap-0.5 flex-shrink-0">
                    <EditableText
                      className="text-right"
                      style={{ width: '60px' }}
                      value={item.date_from || ''}
                      onChange={(val) =>
                        onUpdateSectionItem(sectionIndex, idx, 'date_from', val)
                      }
                      placeholder="Von"
                    />
                    <EditableText
                      className="text-right"
                      style={{ width: '60px' }}
                      value={item.date_to || ''}
                      onChange={(val) =>
                        onUpdateSectionItem(sectionIndex, idx, 'date_to', val)
                      }
                      placeholder="Bis"
                    />
                  </div>
                </div>

                {bullets.length > 0 ? (
                  <ul className="mt-1 text-[9.5px] text-slate-700" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {bullets.map((bp: string, bIdx: number) => (
                      <li key={bIdx} style={{ breakInside: 'avoid', pageBreakInside: 'avoid', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                        <span style={{ flexShrink: 0, color: '#64748b', fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                        <EditableText
                          multiline
                          className="flex-1 text-slate-800 text-[9.5px] leading-snug"
                          value={bp}
                          onChange={(val) => {
                            const newBullets = [...bullets];
                            newBullets[bIdx] = val;
                            onUpdateSectionItem(sectionIndex, idx, 'bulletPoints', newBullets);
                          }}
                          placeholder="Aufgabe / Ergebnis"
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
                  <EditableText
                    multiline
                    className="mt-1 text-[9.5px] text-slate-800 leading-snug"
                    value={item.description || ''}
                    onChange={(val) => {
                      onUpdateSectionItem(sectionIndex, idx, 'description', val);
                    }}
                    placeholder="Kurz Aufgaben und Erfolge beschreiben"
                  />
                )}

                <div className="pdf-hidden" style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    style={{ fontSize: '9px', color: '#475569', background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', cursor: 'pointer', padding: '2px 7px', lineHeight: '1.5' }}
                    onClick={() => {
                      const current = getBullets(item);
                      onUpdateSectionItem(sectionIndex, idx, 'bulletPoints', [...current, 'Neuer Punkt']);
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
              {items.map((edu: any, idx: number) => {
                // 🔥 Konsistente ID: section.type + sectionIndex + idx
                const itemKey = `${section.type}-${sectionIndex}-${idx}`;
                const spacer = pageBreakItems?.get(itemKey) ?? 0;
                return (
                <div
                  key={idx}
                  data-pdf-section
                  data-spacer-id={itemKey}
                  style={{ display: 'block', width: '100%', ...(spacer > 0 ? { marginTop: `${spacer}px` } : {}) }}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white/90"
                >
                  <div className="flex justify-between gap-2 items-start">
                    <div className="flex-1 min-w-0">
                      <EditableText
                        className="text-[11px] font-bold text-slate-900"
                        value={edu.degree || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'degree', val)
                        }
                        placeholder="Abschluss"
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
                      {(edu.grade || edu.grades || edu.note) && (
                        <div className="mt-0.5 flex items-center gap-1 text-[9.5px] text-slate-500">
                          <span className="font-semibold">Note:</span>
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
                          className="mt-0.5 text-[9.5px] text-slate-600 leading-snug"
                          value={edu.description || (Array.isArray(edu.focus) ? edu.focus.join(', ') : edu.focus) || ''}
                          onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'description', val)}
                          placeholder="Schwerpunkte / Beschreibung"
                        />
                      )}
                    </div>

                    <div className="text-[9px] text-slate-500 text-right whitespace-nowrap flex flex-col items-end gap-0.5 flex-shrink-0">
                      <EditableText
                        className="text-right"
                        style={{ width: '60px' }}
                        value={edu.date_from || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_from', val)
                        }
                        placeholder="Von"
                      />
                      <EditableText
                        className="text-right"
                        style={{ width: '60px' }}
                        value={edu.date_to || ''}
                        onChange={(val) =>
                          onUpdateSectionItem(sectionIndex, idx, 'date_to', val)
                        }
                        placeholder="Bis"
                      />
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        );

      case 'languages':
        if (!items || items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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
                    className="flex justify-between items-center gap-2 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-[9.5px]"
                  >
                    <EditableText
                      className="flex-1 font-medium text-slate-900"
                      value={language}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'language', val)}
                      placeholder="Sprache"
                    />
                    <EditableText
                      className="text-right text-slate-600"
                      style={{ minWidth: '60px' }}
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
        if (!items || items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 'normal', marginRight: '6px', marginBottom: '6px', verticalAlign: 'middle', padding: '3px 10px', borderRadius: '9999px', border: '1px solid #cbd5e1', background: '#f1f5f9', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <EditableText
                      style={{ fontSize: '9px', lineHeight: 'normal', fontWeight: 600, color: '#1e293b', width: `${Math.max(2, display.length + 1)}ch` }}
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
        if (!items || items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
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
                  <span key={idx} style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 'normal', marginRight: '6px', marginBottom: '6px', verticalAlign: 'middle', padding: '3px 10px', borderRadius: '9999px', border: '1px solid #e2e8f0', background: '#ffffff', whiteSpace: 'nowrap', breakInside: 'avoid', pageBreakInside: 'avoid' }}>
                    <EditableText
                      style={{ fontSize: '9px', lineHeight: 'normal', fontWeight: 500, color: '#334155', width: `${Math.max(2, display.length + 1)}ch` }}
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
                    <EditableText
                      style={{ fontSize: '9px', lineHeight: 'normal', color: '#0f172a', width: `${Math.max(2, cleanedV.length + 1)}ch` }}
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
                    <EditableText
                      style={{ fontSize: '9px', lineHeight: 'normal', color: '#0f172a', width: `${Math.max(2, cleanedV.length + 1)}ch` }}
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

      default: {
        const TYPE_LABELS_MIN: Record<string, string> = {
          skills: 'Fähigkeiten', soft_skills: 'Soft Skills', hard_skills: 'Fachliche Skills',
          tools: 'Tools & Software', certifications: 'Zertifikate', courses: 'Weiterbildung',
          awards: 'Auszeichnungen', volunteering: 'Ehrenamt', stipendien: 'Stipendien', scholarships: 'Scholarships',
        };
        if (items.length === 0) return null;

        // Check if this is a detailed section (certifications, courses, awards, volunteering, stipendien, scholarships)
        const detailedTypes = ['certifications', 'courses', 'awards', 'volunteering', 'stipendien', 'scholarships'];
        if (detailedTypes.includes(section.type)) {
          return (
            <div key={sectionIndex} data-pdf-section style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
              <SectionTitle>{section.title || TYPE_LABELS_MIN[section.type] || section.type}</SectionTitle>
              <ul className="space-y-1.5 text-[9.5px] text-slate-800">
                {items.map((it: any, idx: number) => {
                  const name = it.name || it.title || it.label || it.degree || '';
                  const institution = it.institution || it.company || it.issuer || it.organization || '';
                  const date = it.date || it.date_from || it.year || '';
                  return (
                    <li
                      key={idx}
                      style={{ breakInside: 'avoid', pageBreakInside: 'avoid', paddingBottom: '6px', borderBottom: '1px solid #e2e8f0', display: 'block' }}
                      className="last:border-b-0"
                    >
                      <div style={{ fontWeight: 600, fontSize: '9.5px', marginBottom: institution ? '2px' : '0' }}>
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
            <SectionTitle>{section.title || TYPE_LABELS_MIN[section.type] || section.type}</SectionTitle>
            <ul className="space-y-1 text-[9.5px] text-slate-800">
              {items.map((it: any, idx: number) => {
                const displayValue =
                  typeof it === 'string'
                    ? it
                    : it.name || it.title || it.label || JSON.stringify(it);
                return (
                  <li
                    key={idx}
                    className="border-b border-slate-100 last:border-b-0 py-0.5"
                    style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}
                  >
                    <EditableText
                      className="text-slate-800"
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
    }
  };

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
    'stipendien',
    'scholarships',
  ];

  const leftSections = sections.filter((s) => leftTypes.includes(s.type));
  const rightSections = sections.filter((s) => rightTypes.includes(s.type));
  const otherSections = sections.filter(
    (s) => !leftTypes.includes(s.type) && !rightTypes.includes(s.type)
  );

  return (
    <div
      className="bg-white text-slate-900 font-sans w-full flex flex-col border border-slate-200"
      style={{
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        minHeight: `${containerMinHeight}px`,
      }}
    >
      <div ref={contentRef}>
      {/* Header */}
      <header className="px-8 pt-6 pb-4 border-b border-slate-200 flex justify-between gap-6 bg-slate-50/70">
        <div className="flex-1 min-w-0">
          <EditableText
            className="text-[22px] font-extrabold tracking-wide text-slate-900"
            value={personalInfo.name || ''}
            onChange={(val) => onUpdatePersonalInfo('name', val)}
            placeholder="Name"
          />
          <EditableText
            className="mt-1 text-[12px] font-bold text-slate-600"
            value={personalInfo.title || ''}
            onChange={(val) => onUpdatePersonalInfo('title', val)}
            placeholder="Zielposition / Profil"
          />

          <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-[9.5px] text-slate-700">
            <div className="flex items-center gap-1.5">
              <span>📍</span>
              <EditableText
                className="flex-1"
                value={personalInfo.location || ''}
                onChange={(val) => onUpdatePersonalInfo('location', val)}
                placeholder="Ort"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>☎</span>
              <EditableText
                className="flex-1"
                value={personalInfo.phone || ''}
                onChange={(val) => onUpdatePersonalInfo('phone', val)}
                placeholder="Telefon"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span>✉</span>
              <EditableText
                className="flex-1"
                value={personalInfo.email || ''}
                onChange={(val) => onUpdatePersonalInfo('email', val)}
                placeholder="E-Mail"
              />
            </div>
            <div className="flex items-center gap-1.5">
              {personalInfo.linkedin ? (
                <span className="text-[9.5px] font-semibold text-slate-700">in</span>
              ) : (
                <span className="w-3" />
              )}
              <EditableText
                className="flex-1"
                value={personalInfo.linkedin || ''}
                onChange={(val) => onUpdatePersonalInfo('linkedin', val)}
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

      {/* Flexbox-Spaltensystem */}
      <div style={{ display: 'flex', width: '100%', backgroundColor: '#ffffff', flex: 'none', padding: '16px 0' }}>
        
        {/* Linke Spalte (58%) */}
        <section style={{ flex: '0 0 58%', minWidth: 0, paddingLeft: '32px', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <SectionTitle>Profil</SectionTitle>
            <EditableText
              multiline
              className="text-[9.5px] leading-relaxed text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2"
              style={{ minHeight: '60px' }}
              value={summary || ''}
              onChange={onUpdateSummary}
              placeholder="Kurzprofil: Wer bist du, was bringst du mit und was suchst du?"
            />
          </div>

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

        {/* Rechte Spalte (42%) */}
        <aside style={{ flex: '0 0 42%', minWidth: 0, paddingLeft: '12px', paddingRight: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
      </div>

      {/* Weitere Sections */}
      {otherSections.length > 0 && (
        <div className="px-8 pb-4 space-y-3 bg-white" data-pdf-section>
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

      {/* 🔥 Footer mit marginTop: 'auto' */}
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