// src/components/cv-templates/templates/MinimalCVTemplate.tsx

import React from 'react';
import {
  EditableText,
  dragProps,
  itemDragProps,
  type CVTemplateProps,
  type EditorSection,
} from '../EditableText';
import { getTokens, FONT_STACK } from '../tokens';

const t = getTokens('minimal');

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    data-break-keep-next
    className="mb-2 font-bold tracking-[0.14em] uppercase"
    style={{ fontSize: '9px', color: t.muted, borderBottom: `1px solid ${t.border}`, paddingBottom: '4px' }}
  >
    {children}
  </h2>
);

const CATEGORY_PREFIX_RE =
  /^(programmiersprachen|technische\s*f[äa]higkeiten|fachkenntnisse|kenntnisse|sprachen|fähigkeiten|soft\s*skills|skills|languages|kompetenzen|tools?)[:\s\-–]+/i;

const clean = (s: string) => (s ?? '').replace(CATEGORY_PREFIX_RE, '').trim();

const getBullets = (item: any): string[] => {
  if (Array.isArray(item?.bulletPoints) && item.bulletPoints.length > 0) {
    return item.bulletPoints.map((s: any) => String(s ?? '').replace(/^[-•\u2022]\s*/, '').trim()).filter(Boolean);
  }
  if (typeof item?.description === 'string' && item.description.trim()) {
    return item.description.split('\n').map((s: string) => s.replace(/^[-•\u2022]\s*/, '').trim()).filter(Boolean);
  }
  return [];
};

const cardStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  padding: '10px 14px',
  marginBottom: '10px',
  borderRadius: '8px',
  border: `1px solid ${t.border}`,
  background: t.surface,
};

export const MinimalCVTemplate: React.FC<CVTemplateProps> = ({
  personalInfo,
  summary,
  sections,
  photoUrl,
  photoPosition = { x: 50, y: 50 },
  minHeightPx,
  onUpdatePersonalInfo,
  onUpdateSummary,
  onUpdateSectionItem,
  onAddSectionItem,
  onDeleteSectionItem = () => {},
  onDeleteBullet,
  onReorderSections,
  onReorderSectionItem,
}) => {
  const containerMinHeight = minHeightPx ?? 1122;

  /**
   * `renderDates` — zwei getrennte Felder (von/bis) untereinander, jeweils
   * mit fester Breite und text-right. FIX (Clipping): ohne wrap/multiline
   * erbt EditableText overflow:hidden + ellipsis + nowrap; bei text-right
   * schneidet hidden LINKS ab ("11/202…"). overflow:visible + textOverflow:
   * clip heben das auf, minWidth statt fixer width lässt längere Werte zu.
   */
  const renderDates = (sectionIndex: number, idx: number, item: any) => (
    <div
      className="text-right whitespace-nowrap flex flex-col items-end gap-0.5 flex-shrink-0"
      style={{ fontSize: '9px', color: t.muted }}
    >
      <EditableText
        className="text-right"
        style={{ minWidth: '60px', whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip' }}
        value={item.date_from || ''}
        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'date_from', val)}
        placeholder="Von"
      />
      <EditableText
        className="text-right"
        style={{ minWidth: '60px', whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'clip' }}
        value={item.date_to || ''}
        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'date_to', val)}
        placeholder="Bis"
      />
    </div>
  );

  const renderExperience = (section: EditorSection, sectionIndex: number) => {
    const items = Array.isArray(section.items) ? section.items : [];
    if (items.length === 0) return null;

    return (
      <div key={sectionIndex}>
        <SectionTitle>{section.title || 'Berufserfahrung'}</SectionTitle>
        {items.map((exp: any, idx: number) => {
          const bullets = getBullets(exp);
          return (
            <div
              key={idx}
              data-pdf-section
              data-break-item
              style={{ ...cardStyle, cursor: onReorderSectionItem ? 'grab' : undefined }}
              {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
            >
              <div className="flex justify-between items-start gap-2">
                {/* FIX (Titel abgeschnitten): min-w-0 auf dem Flex-Kind ist
                    zwingend nötig, sonst schrumpft der Titel nicht und läuft
                    hinter die Datums-Spalte statt umzubrechen. `wrap` erlaubt
                    dem EditableText selbst den Umbruch. */}
                <div className="flex-1 min-w-0">
                  <EditableText
                    wrap
                    className="font-bold"
                    style={{ fontSize: '11px', color: t.text }}
                    value={exp.title || exp.position || ''}
                    onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'title', val)}
                    placeholder="Position"
                  />
                  <EditableText
                    wrap
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
                {renderDates(sectionIndex, idx, exp)}
              </div>

              {bullets.length > 0 ? (
                <ul className="mt-1.5" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {bullets.map((bp, bIdx) => (
                    <li key={bIdx} data-break-line style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ flexShrink: 0, color: t.bullet, fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                      <EditableText
                        multiline
                        className="flex-1 leading-snug"
                        style={{ fontSize: '9.5px', color: t.muted }}
                        value={bp}
                        onChange={(val) => {
                          const base = Array.isArray(exp.bulletPoints) ? [...exp.bulletPoints] : [...bullets];
                          base[bIdx] = val;
                          onUpdateSectionItem(sectionIndex, idx, 'bulletPoints', base);
                        }}
                        placeholder="Aufgabe / Erfolg"
                      />
                      {onDeleteBullet && (
                        <button
                          type="button"
                          className="pdf-hidden flex-shrink-0 text-red-400 hover:text-red-600"
                          style={{ fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer', padding: '1px 3px' }}
                          onClick={() => onDeleteBullet(sectionIndex, idx, bIdx)}
                        >×</button>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                exp.description && (
                  <EditableText
                    multiline
                    className="mt-1.5 leading-snug"
                    style={{ fontSize: '9.5px', color: t.muted }}
                    value={exp.description}
                    onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'description', val)}
                    placeholder="Beschreibung"
                  />
                )
              )}

              <div className="pdf-hidden mt-1.5">
                <button
                  type="button"
                  style={{ fontSize: '9px', color: t.accent, background: t.surfaceAlt, border: `1px solid ${t.border}`, borderRadius: '4px', padding: '2px 7px', cursor: 'pointer' }}
                  onClick={() => {
                    const base = Array.isArray(exp.bulletPoints) ? [...exp.bulletPoints] : bullets;
                    onUpdateSectionItem(sectionIndex, idx, 'bulletPoints', [...base, 'Neuer Punkt']);
                  }}
                >
                  + Bullet
                </button>
                <button
                  type="button"
                  style={{ fontSize: '9px', color: '#dc2626', background: t.surfaceAlt, border: '1px solid #fecaca', borderRadius: '4px', padding: '2px 7px', cursor: 'pointer', marginLeft: '6px' }}
                  onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                >
                  Station löschen
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderProjects = (section: EditorSection, sectionIndex: number) => {
    const items = Array.isArray(section.items) ? section.items : [];
    if (items.length === 0) return null;

    return (
      <div key={sectionIndex}>
        <SectionTitle>{section.title || 'Projekte'}</SectionTitle>
        {items.map((proj: any, idx: number) => {
          const bullets = getBullets(proj);
          return (
            <div
              key={idx}
              data-pdf-section
              data-break-item
              style={{ ...cardStyle, cursor: onReorderSectionItem ? 'grab' : undefined }}
              {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
            >
              <EditableText
                wrap
                className="font-bold"
                style={{ fontSize: '11px', color: t.text }}
                value={proj.title || proj.name || ''}
                onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'title', val)}
                placeholder="Projekt"
              />
              {proj.role && (
                <EditableText
                  wrap
                  className="mt-0.5"
                  style={{ fontSize: '10px', color: t.muted }}
                  value={proj.role}
                  onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'role', val)}
                  placeholder="Rolle"
                />
              )}
              {bullets.length > 0 ? (
                <ul className="mt-1.5" style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {bullets.map((bp, bIdx) => (
                    <li key={bIdx} data-break-line style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                      <span style={{ flexShrink: 0, color: t.bullet, fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                      <EditableText
                        multiline
                        className="flex-1 leading-snug"
                        style={{ fontSize: '9.5px', color: t.muted }}
                        value={bp}
                        onChange={(val) => {
                          const base = Array.isArray(proj.bulletPoints) ? [...proj.bulletPoints] : [...bullets];
                          base[bIdx] = val;
                          onUpdateSectionItem(sectionIndex, idx, 'bulletPoints', base);
                        }}
                        placeholder="Ergebnis / Beitrag"
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                proj.description && (
                  <EditableText
                    multiline
                    className="mt-1.5 leading-snug"
                    style={{ fontSize: '9.5px', color: t.muted }}
                    value={proj.description}
                    onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'description', val)}
                    placeholder="Kurzbeschreibung"
                  />
                )
              )}
              <div className="pdf-hidden mt-1.5">
                <button
                  type="button"
                  style={{ fontSize: '9px', color: '#dc2626', background: t.surfaceAlt, border: '1px solid #fecaca', borderRadius: '4px', padding: '2px 7px', cursor: 'pointer' }}
                  onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                >
                  Station löschen
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  /**
   * FIX (Titel abgeschnitten): dasselbe Muster wie bei Berufserfahrung —
   * `min-w-0` auf dem Flex-Kind + `wrap` auf dem EditableText. Vorher lief
   * ein langer Studiengang hinter das Datumsfeld statt umzubrechen.
   */
  const renderEducation = (section: EditorSection, sectionIndex: number) => {
    const items = Array.isArray(section.items) ? section.items : [];
    if (items.length === 0) return null;

    return (
      <div key={sectionIndex}>
        <SectionTitle>{section.title || 'Ausbildung & Studium'}</SectionTitle>
        {items.map((edu: any, idx: number) => (
          <div
            key={idx}
            data-pdf-section
            data-break-item
            style={{ ...cardStyle, cursor: onReorderSectionItem ? 'grab' : undefined }}
            {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
          >
            <div className="flex justify-between items-start gap-2">
              <div className="flex-1 min-w-0">
                <EditableText
                  wrap
                  className="font-bold"
                  style={{ fontSize: '11px', color: t.text }}
                  value={edu.degree || edu.title || ''}
                  onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'degree', val)}
                  placeholder="Abschluss / Studiengang"
                />
                <EditableText
                  wrap
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
                    value={edu.location}
                    onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'location', val)}
                    placeholder="Ort"
                  />
                )}
              </div>
              {renderDates(sectionIndex, idx, edu)}
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
                style={{ fontSize: '9.5px', color: t.muted }}
                value={edu.description || (Array.isArray(edu.focus) ? edu.focus.join(', ') : edu.focus) || ''}
                onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'description', val)}
                placeholder="Schwerpunkte / Beschreibung"
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  /**
   * FIX (Sprachen unsichtbar): `language` liest jetzt zusätzlich
   * `skill`/`label`, und der Guard verwirft keine Zeile mehr, die nur ein
   * Niveau ohne erkannten Namen hat — Namensfeld bleibt leer & editierbar
   * statt die ganze Sprache verschwinden zu lassen.
   */
const renderLanguages = (section: EditorSection, sectionIndex: number) => {
    const items = Array.isArray(section.items) ? section.items : [];
    if (items.length === 0) return null;

    return (
      <div key={sectionIndex} data-pdf-section data-break-atomic>
        <SectionTitle>Sprachen</SectionTitle>
        <div className="space-y-1">
          {items.map((lang: any, idx: number) => {
            const rawLanguage =
              typeof lang === 'string'
                ? lang
                : lang.language || lang.name || lang.sprache || lang.skill || lang.label || '';
            const language = clean(rawLanguage);
            const level =
              typeof lang === 'object' && lang !== null
                ? lang.level || lang.niveau || lang.proficiency || ''
                : '';

            if (!language && !level) return null;

            return (
              <div
                key={idx}
                className="flex justify-between items-center gap-2 px-2 py-1 rounded-md"
                style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, fontSize: '9.5px' }}
              >
                {/* FIX (Sprachen unsichtbar trotz Box): explizite fontSize statt
                    Vererbung ins contenteditable, plus `wrap` + `min-w-0`, damit
                    EditableText nicht den Default nowrap+overflow:hidden+ellipsis
                    erbt und in der schmalen rechten Spalte auf 0 clippt. */}
                <EditableText
                  wrap
                  className="flex-1 min-w-0 font-medium"
                  style={{ fontSize: '9.5px', color: t.text }}
                  value={language}
                  onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'language', val)}
                  placeholder="Sprache"
                />
                <EditableText
                  wrap
                  className="text-right flex-shrink-0"
                  style={{ fontSize: '9.5px', minWidth: '60px', color: t.muted }}
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
  };

  const renderChipSection = (section: EditorSection, sectionIndex: number, label: string) => {
    const items = Array.isArray(section.items) ? section.items : [];
    if (items.length === 0) return null;

    return (
      <div key={sectionIndex} data-pdf-section data-break-atomic>
        <SectionTitle>{section.title || label}</SectionTitle>
        <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
          {items.map((item: any, idx: number) => {
            const rawText =
              typeof item === 'string' ? item : item.skill || item.label || item.name || item.title || '';
            const text = clean(rawText);
            if (!text) return null;
            const level = typeof item === 'object' && item !== null ? item.level || item.niveau || '' : '';
            const display = level ? `${text} (${level.trim()})` : text;

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginRight: '5px',
                  marginBottom: '5px',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: t.surfaceAlt,
                  border: `1px solid ${t.border}`,
                  fontSize: '9px',
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                }}
              >
                <EditableText
                  value={display}
                  onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'skill', val)}
                  style={{ fontSize: '9px', color: t.text, display: 'inline-block', width: 'auto' }}
                  placeholder="Eintrag"
                />
                <button
                  type="button"
                  className="pdf-hidden"
                  style={{ fontSize: '8px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  onClick={() => onDeleteSectionItem(sectionIndex, idx)}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDetailedList = (section: EditorSection, sectionIndex: number, label: string) => {
    const items = Array.isArray(section.items) ? section.items : [];
    if (items.length === 0) return null;

    return (
      <div key={sectionIndex} data-pdf-section data-break-atomic>
        <SectionTitle>{section.title || label}</SectionTitle>
        <div className="space-y-1.5">
          {items.map((item: any, idx: number) => {
            const name = item.name || item.title || item.label || item.degree || '';
            const institution = item.institution || item.issuer || item.company || item.organization || '';
            const date = item.date || item.date_from || item.year || '';
            if (!name) return null;

            return (
              <div key={idx} className="flex justify-between items-start gap-2" style={{ fontSize: '9.5px' }}>
                <div className="flex-1 min-w-0">
                  <EditableText
                    wrap
                    className="font-semibold"
                    style={{ color: t.text }}
                    value={name}
                    onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'name', val)}
                    placeholder="Name / Titel"
                  />
                  {institution && (
                    <EditableText
                      className="mt-0.5"
                      style={{ fontSize: '9px', color: t.muted }}
                      value={institution}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'institution', val)}
                      placeholder="Institution"
                    />
                  )}
                </div>
                {date && (
                  <EditableText
                    className="text-right"
                    style={{ fontSize: '9px', color: t.muted, whiteSpace: 'nowrap', flexShrink: 0 }}
                    value={date}
                    onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'date', val)}
                    placeholder="Datum"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const LABELS: Record<string, string> = {
    certifications: 'Zertifikate',
    courses: 'Weiterbildung',
    awards: 'Auszeichnungen',
    volunteering: 'Ehrenamt',
    stipendien: 'Stipendien',
    scholarships: 'Stipendien',
  };

  const leftTypes = ['experience', 'projects'];
  const rightTypes = [
    'education', 'languages', 'skills', 'soft_skills', 'work_values', 'values',
    'hobbies', 'interests', 'certifications', 'courses', 'awards',
    'volunteering', 'stipendien', 'scholarships',
  ];

  const renderSection = (section: EditorSection, sectionIndex: number): React.ReactNode => {
    switch (section.type) {
      case 'experience': return renderExperience(section, sectionIndex);
      case 'projects': return renderProjects(section, sectionIndex);
      case 'education': return renderEducation(section, sectionIndex);
      case 'languages': return renderLanguages(section, sectionIndex);
      case 'skills': return renderChipSection(section, sectionIndex, 'Fähigkeiten');
      case 'soft_skills': return renderChipSection(section, sectionIndex, 'Soft Skills');
      case 'work_values':
      case 'values': return renderChipSection(section, sectionIndex, 'Arbeitsweise & Werte');
      case 'hobbies':
      case 'interests': return renderChipSection(section, sectionIndex, 'Hobbys & Interessen');
      case 'certifications':
      case 'courses':
      case 'awards':
      case 'volunteering':
      case 'stipendien':
      case 'scholarships':
        return renderDetailedList(section, sectionIndex, LABELS[section.type] || section.type);
      default:
        return renderDetailedList(section, sectionIndex, section.title || section.type);
    }
  };

  const leftSections = sections.filter((s) => leftTypes.includes(s.type));
  const rightSections = sections.filter((s) => rightTypes.includes(s.type));
  const otherSections = sections.filter((s) => !leftTypes.includes(s.type) && !rightTypes.includes(s.type));

  const renderColumn = (list: EditorSection[]) =>
    list.map((section) => {
      const index = sections.findIndex((s) => s === section);
      const content = renderSection(section, index);
      if (!content) return null;
      return <div key={index} {...dragProps(index, onReorderSections)}>{content}</div>;
    });

  return (
    <div
      className="w-full flex flex-col"
      style={{
        fontFamily: FONT_STACK,
        color: t.text,
        background: t.surface,
        minHeight: `${containerMinHeight}px`,
        width: '100%',
        boxSizing: 'border-box',
        wordBreak: 'normal',
        overflowWrap: 'break-word',
      }}
    >
      <div className="w-full p-8">
        <header className="mb-6 pb-4" style={{ borderBottom: `1px solid ${t.border}` }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <EditableText
                className="font-extrabold"
                style={{ fontSize: '22px', color: t.text }}
                value={personalInfo.name || ''}
                onChange={(val) => onUpdatePersonalInfo('name', val)}
                placeholder="Dein Name"
              />
              <EditableText
                className="mt-1 font-semibold"
                style={{ fontSize: '12px', color: t.muted }}
                value={personalInfo.title || ''}
                onChange={(val) => onUpdatePersonalInfo('title', val)}
                placeholder="Berufsbezeichnung"
              />
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: '9.5px', color: t.muted }}>
                <EditableText value={personalInfo.location || ''} onChange={(val) => onUpdatePersonalInfo('location', val)} placeholder="Ort" />
                <EditableText value={personalInfo.phone || ''} onChange={(val) => onUpdatePersonalInfo('phone', val)} placeholder="Telefon" />
                <EditableText value={personalInfo.email || ''} onChange={(val) => onUpdatePersonalInfo('email', val)} placeholder="E-Mail" />
                <EditableText value={personalInfo.linkedin || ''} onChange={(val) => onUpdatePersonalInfo('linkedin', val)} placeholder="LinkedIn" />
              </div>
            </div>
            {photoUrl && (
              <div className="flex-shrink-0 w-20 h-20 rounded-full overflow-hidden" style={{ border: `2px solid ${t.border}` }}>
                <img
                  src={photoUrl}
                  alt="Foto"
                  style={{ width: '80px', height: '80px', objectFit: 'cover', objectPosition: `${photoPosition.x}% ${photoPosition.y}%`, display: 'block' }}
                />
              </div>
            )}
          </div>
        </header>

        <div data-pdf-section data-break-atomic className="mb-6">
          <SectionTitle>Profil</SectionTitle>
          <EditableText
            multiline
            className="leading-relaxed"
            style={{ fontSize: '9.5px', color: t.muted }}
            value={summary || ''}
            onChange={onUpdateSummary}
            placeholder="Kurzprofil / Zusammenfassung"
          />
        </div>

        <div className="flex gap-8">
          <main className="flex-1 min-w-0">{renderColumn(leftSections)}</main>
          <aside className="w-[38%] flex-shrink-0">{renderColumn(rightSections)}</aside>
        </div>

        {otherSections.length > 0 && (
          <div className="mt-4">{renderColumn(otherSections)}</div>
        )}
      </div>

      <footer
        data-pdf-footer
        style={{
          borderTop: `1px solid ${t.border}`,
          padding: '12px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: t.muted,
          backgroundColor: t.surfaceAlt,
          marginTop: 'auto',
          flexShrink: 0,
          height: '45px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontWeight: 600 }}>Ort:</span>
          <EditableText
            style={{ fontSize: '9px', width: '120px', color: t.muted }}
            value={personalInfo.location || ''}
            onChange={(val) => onUpdatePersonalInfo('location', val)}
            placeholder="Ort"
          />
        </div>
        <span style={{ fontWeight: 600 }}>{new Date().toLocaleDateString('de-DE')}</span>
      </footer>
    </div>
  );
};