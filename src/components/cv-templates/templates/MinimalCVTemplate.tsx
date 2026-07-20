// src/components/cv-templates/templates/MinimalCVTemplate.tsx

import React from 'react';
import {
  EditableText,
  dragProps,
  type CVTemplateProps,
  type EditorSection,
} from '../EditableText';
import { getTokens, FONT_STACK } from '../tokens';

const t = getTokens('minimal');

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    data-break-keep-next
    className="mt-4 mb-1.5 font-bold tracking-[0.16em] uppercase flex items-center gap-1.5"
    style={{ fontSize: '9px', color: t.text }}
  >
    <span className="w-1 h-1 rounded-full" style={{ background: t.accent }} />
    {children}
  </h2>
);

const CATEGORY_PREFIX_RE =
  /^(programmiersprachen|technische\s*f[äa]higkeiten|fachkenntnisse|kenntnisse|sprachen|fähigkeiten|soft\s*skills|skills|languages|kompetenzen|tools?)[:\s\-–]+/i;

const clean = (s: string) =>
  s.replace(CATEGORY_PREFIX_RE, '').replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();

const stripLeadingBullet = (s: string) => s.replace(/^[-•\u2022]\s*/, '');

const getBullets = (item: any): string[] => {
  if (!item) return [];

  const arrays = [item.bulletPoints, item.bullet_points, item.bulletpoints, item.tasks, item.highlights, item.erfolge];
  const found = arrays.find((arr) => Array.isArray(arr) && arr.length > 0);
  if (found) {
    return found.map((s: any) => stripLeadingBullet(String(s ?? '').trim())).filter((s: string) => s.length > 0);
  }

  const texts = [item.description, item.beschreibung, item.text, item.aufgaben];
  const foundText = texts.find((txt) => typeof txt === 'string' && txt.trim().length > 0);
  if (foundText) {
    return foundText.split('\n').map((s: string) => stripLeadingBullet(s.trim())).filter((s: string) => s.length > 0);
  }

  return [];
};

const DETAILED_TYPES = new Set([
  'certifications', 'courses', 'awards', 'volunteering', 'stipendien', 'scholarships',
]);

const TYPE_LABELS: Record<string, string> = {
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

const cardStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  position: 'relative',
  padding: '6px 10px',
  borderRadius: '8px',
  border: `1px solid ${t.border}`,
  background: t.surface,
};

const chip = (bg: string, border: string): React.CSSProperties => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '6px',
  marginBottom: '6px',
  verticalAlign: 'middle',
  padding: '3px 10px',
  borderRadius: '9999px',
  border: `1px solid ${border}`,
  background: bg,
  whiteSpace: 'nowrap',
  lineHeight: 1.4,
});

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
  onDeleteSectionItem = () => {},
  onDeleteBullet,
  onReorderSections,
}) => {
  const containerMinHeight = minHeightPx ?? 1122;

  const renderDates = (sectionIndex: number, idx: number, item: any) => (
    <div
      className="text-right whitespace-nowrap flex flex-col items-end gap-0.5 flex-shrink-0"
      style={{ fontSize: '9px', color: t.muted }}
    >
      <EditableText
        className="text-right"
        style={{ width: '60px' }}
        value={item.date_from || ''}
        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'date_from', val)}
        placeholder="Von"
      />
      <EditableText
        className="text-right"
        style={{ width: '60px' }}
        value={item.date_to || ''}
        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'date_to', val)}
        placeholder="Bis"
      />
    </div>
  );

  // ─── Berufserfahrung / Projekte ───────────────────────────────────────────
  const renderExperienceOrProjects = (section: EditorSection, sectionIndex: number, isProject: boolean) => {
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
              <div key={idx} data-pdf-section data-break-item style={cardStyle}>
                <div className="flex justify-between gap-2 items-start">
                  <div className="flex-1 min-w-0">
                    <EditableText
                      className="font-bold"
                      style={{ fontSize: '11px', color: t.text }}
                      value={isProject ? item.title || item.name || '' : item.title || item.position || item.role || ''}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'title', val)}
                      placeholder={isProject ? 'Projekt' : 'Position'}
                    />
                    <EditableText
                      className="mt-0.5"
                      style={{ fontSize: '10px', color: t.muted }}
                      value={isProject ? item.role || '' : item.company || item.employer || ''}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, isProject ? 'role' : 'company', val)}
                      placeholder={isProject ? 'Rolle' : 'Unternehmen'}
                    />
                    {!isProject && (item.location || item.ort) && (
                      <EditableText
                        className="mt-0.5"
                        style={{ fontSize: '10px', color: t.faint }}
                        value={item.location || item.ort || ''}
                        onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'location', val)}
                        placeholder="Ort"
                      />
                    )}
                  </div>
                  {renderDates(sectionIndex, idx, item)}
                </div>

                {bullets.length > 0 ? (
                  <ul className="mt-1" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {bullets.map((bp: string, bIdx: number) => (
                      <li
                        key={bIdx}
                        data-break-line
                        style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}
                      >
                        <span style={{ flexShrink: 0, color: t.bullet, fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                        <EditableText
                          multiline
                          className="flex-1 leading-snug"
                          style={{ fontSize: '9.5px', color: t.muted }}
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
                    className="mt-1 leading-snug"
                    style={{ fontSize: '9.5px', color: t.muted }}
                    value={item.description || ''}
                    onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'description', val)}
                    placeholder="Kurz Aufgaben und Erfolge beschreiben"
                  />
                )}

                <div className="pdf-hidden">
                  <button
                    type="button"
                    style={{ fontSize: '9px', color: t.muted, background: t.surface, border: `1px solid ${t.border}`, borderRadius: '4px', cursor: 'pointer', padding: '2px 7px', lineHeight: '1.5' }}
                    onClick={() => {
                      const current = getBullets(item);
                      onUpdateSectionItem(sectionIndex, idx, 'bulletPoints', [...current, 'Neuer Punkt']);
                    }}
                  >
                    + Bullet
                  </button>
                  <button
                    type="button"
                    style={{ fontSize: '9px', color: '#dc2626', background: t.surface, border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', padding: '2px 7px', lineHeight: '1.5' }}
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

  // ─── Sektions-Renderer ────────────────────────────────────────────────────
  const renderSection = (section: EditorSection, sectionIndex: number): React.ReactNode => {
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
                <div key={idx} data-pdf-section data-break-item style={cardStyle}>
                  <div className="flex justify-between gap-2 items-start">
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
                      {(edu.grade || edu.grades || edu.note) && (
                        <div className="mt-0.5 flex items-center gap-1" style={{ fontSize: '9.5px', color: t.muted }}>
                          <span className="font-semibold">Note:</span>
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
                          className="mt-0.5 leading-snug"
                          style={{ fontSize: '9.5px', color: t.muted }}
                          value={edu.description || (Array.isArray(edu.focus) ? edu.focus.join(', ') : edu.focus) || ''}
                          onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'description', val)}
                          placeholder="Schwerpunkte / Beschreibung"
                        />
                      )}
                    </div>
                    {renderDates(sectionIndex, idx, edu)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      // Sprachen: Sprache dunkel, Niveau grau — identisch zu Classic und Kreativ.
      case 'languages':
        if (items.length === 0) return null;
        return (
          <div key={sectionIndex} data-pdf-section data-break-atomic>
            <SectionTitle>Sprachen</SectionTitle>
            <div className="space-y-1">
              {items.map((lang: any, idx: number) => {
                if (!lang) return null;
                const rawLanguage =
                  typeof lang === 'string'
                    ? lang
                    : lang.language || lang.name || lang.sprache || lang.skill || lang.label || '';
                const language = clean(rawLanguage);
                const level =
                  typeof lang === 'object' && lang !== null
                    ? lang.level || lang.niveau || lang.proficiency || ''
                    : '';
                // Zeile mit Niveau aber ohne Namen NICHT verwerfen — sonst
                // verschwindet die Sprache. Namensfeld bleibt leer + editierbar.
                if (!language && !level) return null;
                const level =
                  typeof lang === 'object' && lang !== null
                    ? lang.level || lang.niveau || lang.proficiency || ''
                    : '';

                return (
                  <div
                    key={idx}
                    className="flex justify-between items-center gap-2 px-2 py-1 rounded-md"
                    style={{ background: t.surfaceAlt, border: `1px solid ${t.border}`, fontSize: '9.5px' }}
                  >
                    <EditableText
                      className="flex-1 font-medium"
                      style={{ color: t.text }}
                      value={language}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'language', val)}
                      placeholder="Sprache"
                    />
                    <EditableText
                      className="text-right"
                      style={{ minWidth: '60px', color: t.muted }}
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
        if (items.length === 0) return null;
        const isSoft = section.type === 'soft_skills';
        return (
          <div key={sectionIndex} data-pdf-section data-break-atomic>
            <SectionTitle>{section.title || (isSoft ? 'Soft Skills' : 'Fähigkeiten')}</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((skill: any, idx: number) => {
                if (!skill) return null;
                const val = clean(typeof skill === 'string' ? skill : skill.skill || skill.name || skill.label || '');
                if (!val) return null;
                const level = typeof skill === 'object' && skill !== null ? skill.level || skill.niveau || '' : '';
                const display = level ? `${val} (${level.trim()})` : val;

                return (
                  <span
                    key={idx}
                    style={chip(isSoft ? t.chipAltBg : t.chipBg, isSoft ? t.chipAltBorder : t.chipBorder)}
                  >
                    <EditableText
                      style={{
                        fontSize: '9px',
                        color: t.chipText,
                        fontWeight: isSoft ? 500 : 600,
                        lineHeight: 1.4,
                        display: 'inline-block',
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        width: 'auto',
                      }}
                      value={display}
                      onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'skill', v)}
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
      case 'hobbies':
      case 'interests': {
        if (items.length === 0) return null;
        const isValues = section.type === 'work_values' || section.type === 'values';
        return (
          <div key={sectionIndex} data-pdf-section data-break-atomic>
            <SectionTitle>{isValues ? 'Arbeitsweise & Werte' : 'Hobbys & Interessen'}</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {items.map((item: any, idx: number) => {
                if (!item) return null;
                const v = clean(typeof item === 'string' ? item : item.label || item.name || '');
                if (!v) return null;
                return (
                  <span
                    key={idx}
                    style={{ ...chip(t.surfaceAlt, t.chipBorder), borderRadius: '6px', padding: '2px 8px', marginRight: '4px', marginBottom: '4px' }}
                  >
                    <EditableText
                      style={{
                        fontSize: '9px',
                        color: t.text,
                        lineHeight: 1.4,
                        display: 'inline-block',
                        verticalAlign: 'middle',
                        textAlign: 'center',
                        width: 'auto',
                      }}
                      value={v}
                      onChange={(val) => onUpdateSectionItem(sectionIndex, idx, 'label', val)}
                      placeholder={isValues ? 'Wert' : 'Hobby'}
                    />
                  </span>
                );
              })}
            </div>
          </div>
        );
      }

      default: {
        if (items.length === 0) return null;
        const label = section.title || TYPE_LABELS[section.type] || section.type;

        if (DETAILED_TYPES.has(section.type)) {
          return (
            <div key={sectionIndex} data-pdf-section data-break-atomic>
              <SectionTitle>{label}</SectionTitle>
              <ul className="space-y-1.5" style={{ fontSize: '9.5px', color: t.text }}>
                {items.map((it: any, idx: number) => {
                  const name = it.name || it.title || it.label || it.degree || '';
                  const institution = it.institution || it.issuer || it.company || it.organization || '';
                  const date = it.date || it.date_from || it.year || '';

                  return (
                    <li
                      key={idx}
                      className="last:border-b-0"
                      style={{ paddingBottom: '6px', borderBottom: `1px solid ${t.border}`, display: 'block' }}
                    >
                      <div style={{ fontWeight: 600, fontSize: '9.5px', marginBottom: institution ? '2px' : '0' }}>
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
                })}
              </ul>
            </div>
          );
        }

        return (
          <div key={sectionIndex} data-pdf-section data-break-atomic>
            <SectionTitle>{label}</SectionTitle>
            <ul className="space-y-1" style={{ fontSize: '9.5px', color: t.text }}>
              {items.map((it: any, idx: number) => {
                const displayValue = typeof it === 'string' ? it : it.name || it.title || it.label || '';
                if (!displayValue) return null;
                return (
                  <li key={idx} className="py-0.5 last:border-b-0" style={{ borderBottom: `1px solid ${t.border}` }}>
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

  const leftTypes = ['experience', 'projects', 'education'];
  const rightTypes = [
    'skills', 'soft_skills', 'languages', 'work_values', 'values',
    'hobbies', 'interests', 'certifications', 'courses', 'awards',
    'volunteering', 'stipendien', 'scholarships',
  ];

  const leftSections = sections.filter((s) => leftTypes.includes(s.type));
  const rightSections = sections.filter((s) => rightTypes.includes(s.type));
  const otherSections = sections.filter(
    (s) => !leftTypes.includes(s.type) && !rightTypes.includes(s.type)
  );

  const renderColumn = (list: EditorSection[]) =>
    list.map((section) => {
      const index = sections.findIndex((s) => s === section);
      const content = renderSection(section, index);
      if (!content) return null;
      return (
        <div key={index} {...dragProps(index, onReorderSections)}>
          {content}
        </div>
      );
    });

  return (
    <div
      className="w-full flex flex-col"
      style={{
        fontFamily: FONT_STACK,
        color: t.text,
        background: t.surface,
        border: `1px solid ${t.border}`,
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        minHeight: `${containerMinHeight}px`,
      }}
    >
      <div>
        <header
          className="px-8 pt-6 pb-4 flex justify-between gap-6"
          style={{ borderBottom: `1px solid ${t.border}`, background: t.surfaceAlt }}
        >
          <div className="flex-1 min-w-0">
            <EditableText
              className="font-extrabold tracking-wide"
              style={{ fontSize: '22px', color: t.text }}
              value={personalInfo.name || ''}
              onChange={(val) => onUpdatePersonalInfo('name', val)}
              placeholder="Name"
            />
            <EditableText
              className="mt-1 font-bold"
              style={{ fontSize: '12px', color: t.muted }}
              value={personalInfo.title || ''}
              onChange={(val) => onUpdatePersonalInfo('title', val)}
              placeholder="Zielposition / Profil"
            />

            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1" style={{ fontSize: '9.5px', color: t.muted }}>
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
                  <span className="font-semibold" style={{ fontSize: '9.5px' }}>in</span>
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
              <div
                className="w-24 h-24 rounded-full overflow-hidden"
                style={{ border: `1px solid ${t.border}`, background: t.surfaceAlt }}
              >
                <img
                  src={photoUrl}
                  alt="Foto"
                  className="w-full h-full"
                  style={{
                    objectFit: 'cover',
                    objectPosition: `${photoPosition.x}% ${photoPosition.y}%`,
                    width: '96px',
                    height: '96px',
                    display: 'block',
                  }}
                />
              </div>
            </div>
          )}
        </header>

        <div style={{ display: 'flex', width: '100%', background: t.surface, flex: 'none', padding: '16px 0' }}>
          <section
            style={{ flex: '0 0 58%', minWidth: 0, paddingLeft: '32px', paddingRight: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            <div data-break-atomic>
              <SectionTitle>Profil</SectionTitle>
              <EditableText
                multiline
                className="leading-relaxed rounded-lg px-3 py-2"
                style={{
                  fontSize: '9.5px',
                  color: t.text,
                  background: t.surfaceAlt,
                  border: `1px solid ${t.border}`,
                  minHeight: '60px',
                }}
                value={summary || ''}
                onChange={onUpdateSummary}
                placeholder="Kurzprofil: Wer bist du, was bringst du mit und was suchst du?"
              />
            </div>
            {renderColumn(leftSections)}
          </section>

          <aside
            style={{ flex: '0 0 42%', minWidth: 0, paddingLeft: '12px', paddingRight: '32px', display: 'flex', flexDirection: 'column', gap: '12px' }}
          >
            {renderColumn(rightSections)}
          </aside>
        </div>

        {otherSections.length > 0 && (
          <div className="px-8 pb-4 space-y-3" style={{ background: t.surface }}>
            {renderColumn(otherSections)}
          </div>
        )}
      </div>

      <footer
        data-pdf-footer
        style={{
          borderTop: `1px solid ${t.border}`,
          padding: '10px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: t.muted,
          marginTop: 'auto',
          flexShrink: 0,
          backgroundColor: t.surface,
          height: '40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ fontWeight: 600, flexShrink: 0 }}>Ort:</span>
          <EditableText
            style={{ fontSize: '9px', width: '120px', color: t.muted }}
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