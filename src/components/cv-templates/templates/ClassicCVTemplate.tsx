// src/components/cv-templates/templates/ClassicCVTemplate.tsx

import React from 'react';
import {
  EditableText,
  dragProps,
  type CVTemplateProps,
  type EditorSection,
} from '../EditableText';
import { getTokens, FONT_STACK } from '../tokens';

const t = getTokens('classic');

/**
 * Sichere Umbruch-Regel für Titel.
 *
 * Der Wurzel-Container darf NICHT `overflow-wrap: anywhere` an die Titel
 * vererben: `anywhere` senkt die min-content-Breite auf ein einzelnes Zeichen,
 * und in der Flex-Zeile neben der Datums-Badge quetscht Flexbox den Titel dann
 * bis auf 1 Zeichen Breite — der Text stapelt sich senkrecht, Buchstabe für
 * Buchstabe ("Senior Consultant" vertikal).
 *
 * `overflowWrap: break-word` + `wordBreak: normal` bricht höchstens AM WORT um
 * und lässt die min-content-Breite beim längsten Wort — der Titel kann nicht
 * mehr kollabieren. `whiteSpace: normal` + `overflow: visible` heben die
 * nowrap/ellipsis-Defaults von EditableText auf (html2canvas setzt Ellipsis im
 * PDF ohnehin nicht um — ein abgeschnittener Titel wäre dort sichtbar).
 */
const titleStyle: React.CSSProperties = {
  fontSize: '11px',
  color: t.text,
  whiteSpace: 'normal',
  overflow: 'visible',
  textOverflow: 'clip',
  wordBreak: 'normal',
  overflowWrap: 'break-word',
};

/**
 * Überschrift der Hauptspalte.
 * `data-break-keep-next` bindet sie an den folgenden Inhalt.
 */
const MainTitle: React.FC<{ children: React.ReactNode; first?: boolean }> = ({ children, first }) => (
  <h2
    data-break-keep-next
    className="font-bold tracking-[0.15em] uppercase pb-1 mb-3"
    style={{
      fontSize: '9px',
      color: t.accent,
      borderBottom: `2px solid ${t.accentSoft}`,
      marginTop: first ? 0 : '24px',
    }}
  >
    {children}
  </h2>
);

/** Überschrift der Seitenspalte. */
const AsideTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h3
    data-break-keep-next
    className="font-bold tracking-[0.15em] uppercase mb-3"
    style={{ fontSize: '9px', color: t.accent }}
  >
    {children}
  </h3>
);

const SIDEBAR_TYPES = [
  'values', 'hobbies', 'interests', 'certifications',
  'courses', 'awards', 'volunteering', 'stipendien', 'scholarships',
];

const SIDEBAR_LABELS: Record<string, string> = {
  values: 'Werte',
  hobbies: 'Hobbys & Interessen',
  interests: 'Interessen',
  certifications: 'Zertifikate',
  courses: 'Kurse',
  awards: 'Auszeichnungen',
  volunteering: 'Ehrenamt',
  stipendien: 'Stipendien',
  scholarships: 'Scholarships',
};

const KNOWN_MAIN_TYPES = [
  'experience', 'education', 'projects', 'skills', 'soft_skills',
  'languages', 'work_values', ...SIDEBAR_TYPES,
];

const CATEGORY_PREFIX_RE =
  /^(programmiersprachen|technische\s*f[äa]higkeiten|fachkenntnisse|kenntnisse|sprachen|fähigkeiten|soft\s*skills|skills|languages|kompetenzen|tools?)[:\s\-–]+/i;

const stripSectionLabel = (val: string) => val.replace(CATEGORY_PREFIX_RE, '').trim();

const cardWrapper: React.CSSProperties = { position: 'relative' };

export const ClassicCVTemplate: React.FC<CVTemplateProps> = ({
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
  // Höhe kommt aus der Break-Engine, nicht aus einem lokalen ResizeObserver.
  const containerMinHeight = minHeightPx ?? 1122;

  const findSectionIndex = (type: string) => sections.findIndex((s) => s.type === type);

  const experienceIndex = findSectionIndex('experience');
  const educationIndex = findSectionIndex('education');
  const projectsIndex = findSectionIndex('projects');
  const skillsIndex = findSectionIndex('skills');
  const softSkillsIndex = findSectionIndex('soft_skills');
  const languagesIndex = findSectionIndex('languages');
  const workValuesIndex = findSectionIndex('work_values');

  // ─── Bullets ───────────────────────────────────────────────────────────────
  const renderBulletPoints = (bullets: any[] | undefined, sectionIndex: number, itemIndex: number) => {
    if (!Array.isArray(bullets) || bullets.length === 0) return null;

    return (
      <div className="mt-1.5" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {bullets.map((bp, idx) => {
          const text = typeof bp === 'string' ? bp : bp?.text ?? String(bp);
          if (!text) return null;
          const cleanText = text.replace(/^[-•*]\s*/, '');

          return (
            <div key={idx} data-break-line className="flex items-start gap-2" style={{ position: 'relative' }}>
              <span style={{ flexShrink: 0, color: t.bullet, fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
              <EditableText
                value={cleanText}
                onChange={(val) => {
                  const newBullets = [...bullets];
                  newBullets[idx] = typeof bp === 'string' ? val : { ...bp, text: val };
                  onUpdateSectionItem(sectionIndex, itemIndex, 'bulletPoints', newBullets);
                }}
                className="leading-snug flex-1"
                style={{ fontSize: '9.5px', color: t.muted }}
                multiline
                placeholder="Eintrag"
              />
              {onDeleteBullet && (
                <button
                  type="button"
                  className="pdf-hidden flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                  style={{ lineHeight: 1, padding: '1px 3px', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}
                  onClick={() => onDeleteBullet(sectionIndex, itemIndex, idx)}
                  title="Bullet löschen"
                >×</button>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderDateRange = (sectionIndex: number, idx: number, item: any) => (
    <EditableText
      value={[item.date_from, item.date_to].filter(Boolean).join(' – ') || ''}
      onChange={(val) => {
        const [from, to] = val.split('–').map((v) => v.trim());
        onUpdateSectionItem(sectionIndex, idx, 'date_from', from);
        onUpdateSectionItem(sectionIndex, idx, 'date_to', to);
      }}
      className="text-right w-32 flex-shrink-0 leading-tight font-semibold"
      style={{ fontSize: '9px', color: t.accent }}
      placeholder="Zeitraum"
    />
  );

  // ─── Berufserfahrung ───────────────────────────────────────────────────────
  const renderExperience = () => {
    if (experienceIndex === -1) return null;
    const items = sections[experienceIndex].items ?? [];
    if (!items.length) return null;

    return (
      <div>
        <MainTitle first>Berufserfahrung</MainTitle>
        <div className="space-y-5">
          {items.map((item: any, idx: number) => (
            <div key={idx} data-pdf-section data-break-item style={cardWrapper}>
              <div className="flex items-baseline justify-between gap-3">
                {/* `flex-1` OHNE `min-w-0`: min-width bleibt beim längsten Wort,
                    der Titel kann nicht auf 1 Zeichen kollabieren. `titleStyle`
                    erlaubt nur Wort-Umbruch, kein Zeichen-Stapeln. */}
                <EditableText
                  value={item.title || item.position || ''}
                  onChange={(val) => onUpdateSectionItem(experienceIndex, idx, 'title', val)}
                  className="font-bold leading-tight flex-1"
                  style={titleStyle}
                  placeholder="Position / Rolle"
                />
                {renderDateRange(experienceIndex, idx, item)}
              </div>

              <EditableText
                value={item.company}
                onChange={(val) => onUpdateSectionItem(experienceIndex, idx, 'company', val)}
                className="font-semibold mt-0.5 leading-snug"
                style={{ fontSize: '10px', color: t.muted }}
                placeholder="Unternehmen"
              />

              {(item.location || item.ort) && (
                <EditableText
                  value={item.location || item.ort || ''}
                  onChange={(val) => onUpdateSectionItem(experienceIndex, idx, 'location', val)}
                  className="leading-snug mt-0.5"
                  style={{ fontSize: '9.5px', color: t.faint }}
                  placeholder="Ort"
                />
              )}

              {item.description && (
                <div className="flex items-start gap-2 mt-2 leading-snug">
                  <span style={{ flexShrink: 0, color: t.bullet, fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                  <EditableText
                    value={item.description.replace(/^[-•*]\s*/, '')}
                    onChange={(val) => onUpdateSectionItem(experienceIndex, idx, 'description', val)}
                    className="leading-snug flex-1"
                    style={{ fontSize: '9.5px', color: t.muted }}
                    multiline
                    placeholder="Beschreibung / Aufgaben"
                  />
                </div>
              )}

              {renderBulletPoints(item.bulletPoints || item.bullet_points, experienceIndex, idx)}

              <div className="pdf-hidden">
                <button
                  type="button"
                  style={{ fontSize: '9px', color: t.accent, background: t.surface, border: `1px solid ${t.accentSoft}`, borderRadius: '4px', cursor: 'pointer', padding: '2px 7px', lineHeight: '1.5' }}
                  onClick={() => {
                    const current = item.bulletPoints || item.bullet_points || [];
                    onUpdateSectionItem(experienceIndex, idx, 'bulletPoints', [...current, 'Neuer Punkt']);
                  }}
                >
                  + Bullet
                </button>
                <button
                  type="button"
                  style={{ fontSize: '9px', color: '#dc2626', background: t.surface, border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', padding: '2px 7px', lineHeight: '1.5' }}
                  onClick={() => onDeleteSectionItem(experienceIndex, idx)}
                >
                  Station löschen
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Ausbildung ────────────────────────────────────────────────────────────
  const renderEducation = () => {
    if (educationIndex === -1) return null;
    const items = sections[educationIndex].items ?? [];
    if (!items.length) return null;

    return (
      <div>
        <MainTitle>Ausbildung / Studium</MainTitle>
        <div className="space-y-5">
          {items.map((item: any, idx: number) => (
            <div key={idx} data-pdf-section data-break-item style={cardWrapper}>
              <div className="flex items-baseline justify-between gap-3">
                {/* Titel liest `degree` ODER `title` — kommt eine Station mit
                    `title` statt `degree` (KI-Output / neu hinzugefügte Station),
                    war das Feld sonst leer und zeigte nur den hellgrauen
                    Platzhalter → wirkte „unsichtbar". `titleStyle` verhindert
                    zusätzlich den senkrechten Buchstaben-Stapel. */}
                <EditableText
                  value={item.degree || item.title || ''}
                  onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'degree', val)}
                  className="font-bold leading-tight flex-1"
                  style={titleStyle}
                  placeholder="Abschluss / Studiengang"
                />
                {renderDateRange(educationIndex, idx, item)}
              </div>

              <EditableText
                value={item.institution}
                onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'institution', val)}
                className="font-semibold leading-snug mt-0.5"
                style={{ fontSize: '10px', color: t.muted }}
                placeholder="Institution"
              />

              {item.location && (
                <EditableText
                  value={item.location}
                  onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'location', val)}
                  className="leading-snug mt-0.5"
                  style={{ fontSize: '9.5px', color: t.faint }}
                  placeholder="Ort"
                />
              )}

              {(item.grade || item.grades || item.note) && (
                <div className="flex items-center gap-1.5 mt-1" style={{ fontSize: '9.5px', color: t.muted }}>
                  <span className="font-semibold" style={{ color: t.accent }}>Note:</span>
                  <EditableText
                    value={item.grade || item.grades || item.note || ''}
                    onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'grade', val)}
                    style={{ fontSize: '9.5px', color: t.muted }}
                    placeholder="Note"
                  />
                </div>
              )}

              {item.description && (
                <div className="flex items-start gap-2 mt-2 leading-snug">
                  <span style={{ flexShrink: 0, color: t.bullet, fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                  <EditableText
                    value={item.description.replace(/^[-•*]\s*/, '')}
                    onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'description', val)}
                    className="leading-snug flex-1"
                    style={{ fontSize: '9.5px', color: t.muted }}
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

  // ─── Projekte ──────────────────────────────────────────────────────────────
  const renderProjects = () => {
    if (projectsIndex === -1) return null;
    const items = sections[projectsIndex].items ?? [];
    if (!items.length) return null;

    return (
      <div>
        <MainTitle>Projekte</MainTitle>
        <div className="space-y-5">
          {items.map((item: any, idx: number) => (
            <div key={idx} data-pdf-section data-break-item style={cardWrapper}>
              <EditableText
                value={item.title || item.name || ''}
                onChange={(val) => onUpdateSectionItem(projectsIndex, idx, 'title', val)}
                className="font-bold leading-tight"
                style={titleStyle}
                placeholder="Projektname"
              />
              {item.role && (
                <EditableText
                  value={item.role}
                  onChange={(val) => onUpdateSectionItem(projectsIndex, idx, 'role', val)}
                  className="font-semibold mt-0.5"
                  style={{ fontSize: '10px', color: t.muted }}
                  placeholder="Rolle / Verantwortung"
                />
              )}
              {item.description && (
                <div className="flex items-start gap-2 mt-2 leading-snug">
                  <span style={{ flexShrink: 0, color: t.bullet, fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                  <EditableText
                    value={item.description.replace(/^[-•*]\s*/, '')}
                    onChange={(val) => onUpdateSectionItem(projectsIndex, idx, 'description', val)}
                    className="leading-snug flex-1"
                    style={{ fontSize: '9.5px', color: t.muted }}
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

  // ─── Sprachen ──────────────────────────────────────────────────────────────
  // Sprache in `t.text` (dunkel), Niveau in `t.muted`.
  const renderLanguages = () => {
    if (languagesIndex === -1) return null;
    const items = sections[languagesIndex].items ?? [];
    if (!items.length) return null;

    return (
      <div className="mb-6" data-pdf-section data-break-atomic>
        <AsideTitle>Sprachen</AsideTitle>
        <ul className="space-y-2">
          {items.map((item: any, idx: number) => {
            const language = stripSectionLabel(item.language || item.name || item.sprache || '');
            const level = item.level || item.niveau || item.proficiency || '';
            if (!language) return null;

            return (
              <li key={idx} className="flex flex-nowrap justify-between items-center gap-2" style={{ fontSize: '9px' }}>
                <EditableText
                  value={language}
                  onChange={(val) => onUpdateSectionItem(languagesIndex, idx, 'language', val)}
                  className="font-medium flex-1"
                  style={{ color: t.text, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip', wordBreak: 'normal', overflowWrap: 'break-word' }}
                  placeholder="Sprache"
                />
                <EditableText
                  value={level}
                  onChange={(val) => onUpdateSectionItem(languagesIndex, idx, 'level', val)}
                  className="font-medium text-right flex-shrink-0"
                  style={{ width: '68px', color: t.muted }}
                  placeholder="Niveau"
                />
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  // ─── Chip-Listen (Skills, Soft Skills) ────────────────────────────────────
  const renderChipSection = (label: string, index: number) => {
    if (index === -1) return null;
    const items = sections[index].items ?? [];
    if (!items.length) return null;

    return (
      <div className="mb-6" data-pdf-section data-break-atomic>
        <AsideTitle>{label}</AsideTitle>
        <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
          {items.map((item: any, idx: number) => {
            const rawText =
              typeof item === 'string'
                ? item
                : item.skill || item.label || item.name || item.title || '';
            const text = stripSectionLabel(rawText);
            if (!text) return null;
            const level = typeof item === 'object' && item !== null ? item.level || item.niveau || '' : '';
            const display = level ? `${text} (${level.trim()})` : text;

            return (
              <span
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                  marginRight: '5px',
                  marginBottom: '5px',
                  verticalAlign: 'middle',
                  padding: '3px 9px',
                  borderRadius: '4px',
                  background: t.chipBg,
                  border: `1px solid ${t.chipBorder}`,
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                }}
              >
                <EditableText
                  value={display}
                  onChange={(val) => onUpdateSectionItem(index, idx, 'skill', val)}
                  style={{
                    display: 'inline-block',
                    verticalAlign: 'middle',
                    textAlign: 'center',
                    width: 'auto',
                    fontSize: '9px',
                    lineHeight: 1.4,
                    color: t.chipText,
                  }}
                  placeholder="Eintrag"
                />
                <button
                  type="button"
                  className="pdf-hidden"
                  style={{ fontSize: '8px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                  onClick={() => onDeleteSectionItem(index, idx)}
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

  // ─── Arbeitsweise & Werte ─────────────────────────────────────────────────
  const renderWorkValues = () => {
    if (workValuesIndex === -1) return null;
    const items = sections[workValuesIndex].items ?? [];
    if (!items.length) return null;

    return (
      <div data-pdf-section data-break-atomic>
        <MainTitle>Arbeitsweise &amp; Werte</MainTitle>
        <ul className="list-disc list-inside space-y-1.5" style={{ fontSize: '9.5px', color: t.muted }}>
          {items.map((item: any, idx: number) => {
            const text = typeof item === 'string' ? item : item.label || item.name || item.value || '';
            if (!text) return null;
            return (
              <li key={idx} className="leading-snug">
                <EditableText
                  value={text}
                  onChange={(val) => onUpdateSectionItem(workValuesIndex, idx, 'value', val)}
                  style={{ color: t.muted }}
                  placeholder="Wert / Arbeitsstil"
                />
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  // ─── Seitenspalten-Sektionen (Zertifikate, Stipendien, …) ─────────────────
  const renderSidebarSections = () =>
    sections.map((section, index) => {
      if (!SIDEBAR_TYPES.includes(section.type)) return null;
      const items = Array.isArray(section.items) ? section.items : [];
      if (!items.length) return null;

      const label = section.title || SIDEBAR_LABELS[section.type] || section.type;

      return (
        <div
          key={index}
          className="mb-6"
          data-pdf-section
          data-break-atomic
          {...dragProps(index, onReorderSections)}
        >
          <AsideTitle>{label}</AsideTitle>
          <div>
            {items.map((item: any, idx: number) => {
              const name = item.name || item.title || item.label || item.degree || '';
              const institution = item.institution || item.issuer || item.company || item.organization || '';
              const date = item.date || item.date_from || item.year || '';

              return (
                <div key={idx} style={{ display: 'block', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '9.5px' }}>
                        <EditableText
                          value={name}
                          onChange={(val) => onUpdateSectionItem(index, idx, 'name', val)}
                          style={{ color: t.text, whiteSpace: 'normal', overflow: 'visible', textOverflow: 'clip', wordBreak: 'normal', overflowWrap: 'break-word' }}
                          placeholder="Name/Titel"
                        />
                      </div>
                      {institution && (
                        <div style={{ marginTop: '2px' }}>
                          <EditableText
                            value={institution}
                            onChange={(val) => onUpdateSectionItem(index, idx, 'institution', val)}
                            style={{ fontSize: '9px', color: t.muted }}
                            placeholder="Institution"
                          />
                        </div>
                      )}
                    </div>
                    {date && (
                      <div style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                        <EditableText
                          value={date}
                          onChange={(val) => onUpdateSectionItem(index, idx, 'date', val)}
                          className="text-right"
                          style={{ fontSize: '9px', color: t.muted }}
                          placeholder="Datum"
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    });

  // ─── Unbekannte Sektionen in der Hauptspalte ──────────────────────────────
  const renderUnknownSections = () =>
    sections.map((section, index) => {
      if (KNOWN_MAIN_TYPES.includes(section.type)) return null;
      const items = Array.isArray(section.items) ? section.items : [];
      if (!items.length) return null;

      const title = section.title || section.type.charAt(0).toUpperCase() + section.type.slice(1);

      return (
        <div key={section.type} data-pdf-section data-break-atomic>
          <MainTitle>{title}</MainTitle>
          <div className="space-y-3" style={{ fontSize: '9.5px', color: t.muted }}>
            {items.map((item: any, idx: number) => {
              const text =
                typeof item === 'string'
                  ? item
                  : item.description || item.text || item.label || item.name || '';
              if (!text) return null;
              return (
                <div key={idx} className="flex items-start gap-2 leading-snug">
                  <span style={{ flexShrink: 0, color: t.bullet, fontSize: '9.5px', lineHeight: '1.375', userSelect: 'none' }}>•</span>
                  <EditableText
                    value={text.replace(/^[-•*]\s*/, '')}
                    onChange={(val) => onUpdateSectionItem(index, idx, 'text', val)}
                    className="leading-relaxed flex-1"
                    style={{ color: t.muted }}
                    multiline
                    placeholder="Eintrag"
                  />
                </div>
              );
            })}
          </div>
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
        minHeight: `${containerMinHeight}px`,
        width: '100%',
        boxSizing: 'border-box',
        // FIX: war `wordBreak: 'break-word'` + `overflowWrap: 'anywhere'`.
        // Beide senken die min-content-Breite auf 1 Zeichen und ließen Flexbox
        // den Titel senkrecht stapeln. `normal` + `break-word` bricht lange
        // Wörter weiterhin um, kollabiert die Breite aber nicht mehr.
        wordBreak: 'normal',
        overflowWrap: 'break-word',
        border: `1px solid ${t.border}`,
      }}
    >
      <div className="w-full p-8">
        <div className="flex gap-8">

          {/* ── Linke Spalte ──────────────────────────────────────────────── */}
          <aside className="w-1/3 max-w-[33%] pr-6 flex flex-col" style={{ borderRight: `1px solid ${t.border}` }}>
            <div className="mb-6" data-break-atomic>
              {photoUrl && (
                <div
                  className="w-28 h-28 rounded-full overflow-hidden mb-4 mx-auto shadow-sm"
                  style={{ border: `2px solid ${t.border}` }}
                >
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
                  className="font-extrabold tracking-wide text-center"
                  style={{ fontSize: '22px', color: t.accent }}
                  placeholder="Dein Name"
                  multiline
                />
                <EditableText
                  value={personalInfo.title}
                  onChange={(val) => onUpdatePersonalInfo('title', val)}
                  className="font-bold mt-1.5 text-center uppercase tracking-widest"
                  style={{ fontSize: '12px', color: t.muted }}
                  placeholder="Berufsbezeichnung"
                  multiline
                />
              </div>
            </div>

            <div className="mb-6" data-break-atomic>
              <AsideTitle>Kontakt</AsideTitle>
              <div className="space-y-2.5" style={{ fontSize: '9.5px' }}>
                <EditableText
                  value={personalInfo.email}
                  onChange={(val) => onUpdatePersonalInfo('email', val)}
                  className="w-full"
                  style={{ color: t.muted }}
                  placeholder="E-Mail"
                />
                <EditableText
                  value={personalInfo.phone}
                  onChange={(val) => onUpdatePersonalInfo('phone', val)}
                  className="w-full"
                  style={{ color: t.muted }}
                  placeholder="Telefon"
                />
                <EditableText
                  value={personalInfo.location}
                  onChange={(val) => onUpdatePersonalInfo('location', val)}
                  className="w-full"
                  style={{ color: t.muted }}
                  placeholder="Ort"
                />
                <EditableText
                  value={personalInfo.linkedin}
                  onChange={(val) => onUpdatePersonalInfo('linkedin', val)}
                  className="w-full"
                  style={{ color: t.muted }}
                  placeholder="LinkedIn"
                />
              </div>
            </div>

            {renderChipSection('Fähigkeiten', skillsIndex)}
            {renderChipSection('Soft Skills', softSkillsIndex)}
            {renderLanguages()}
            {renderSidebarSections()}
          </aside>

          {/* ── Rechte Spalte ─────────────────────────────────────────────── */}
          <main className="flex-1 flex flex-col min-w-0">
            <div data-pdf-section data-break-atomic className="mb-6">
              <MainTitle first>Profil</MainTitle>
              <EditableText
                value={summary}
                onChange={onUpdateSummary}
                className="leading-relaxed w-full"
                style={{ fontSize: '9.5px', color: t.muted }}
                placeholder="Kurzprofil / Zusammenfassung"
                multiline
              />
            </div>

            {renderExperience()}
            {renderEducation()}
            {renderProjects()}
            {renderWorkValues()}
            {renderUnknownSections()}
          </main>
        </div>
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
        <span style={{ fontWeight: 600, letterSpacing: '0.05em' }}>
          {new Date().toLocaleDateString('de-DE')}
        </span>
      </footer>
    </div>
  );
};