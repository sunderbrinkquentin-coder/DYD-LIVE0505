// src/components/cv-templates/templates/ModernCVTemplate.tsx

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import {
  EditableText,
  dragProps,
  itemDragProps,
  SectionDragHandle,
  ItemDragHandle,
  type CVTemplateProps,
  type EditorSection,
} from '../EditableText';
import { getTokens } from '../tokens';

const t = getTokens('modern');

const CI = {
  primary: '#30E3CA',
  primaryDark: '#26b8a8',
  tint: '#e8f8f6',
  border: '#b6e8e0',
  canvas: '#f0faf8',
} as const;

const FONT = "'Inter', 'Roboto', 'Open Sans', system-ui, sans-serif";

const SECTION_ORDER_LEFT = new Set(['experience', 'projects']);
const SECTION_ORDER_RIGHT = new Set([
  'education', 'skills', 'soft_skills', 'languages', 'work_values', 'values',
  'hobbies', 'interests', 'certifications', 'courses', 'awards',
  'volunteering', 'stipendien', 'scholarships',
]);
const isLeft = (type: string) => SECTION_ORDER_LEFT.has(type);
const isRight = (type: string) => SECTION_ORDER_RIGHT.has(type) || type === 'certificates' || type === 'stipends';

const ATOMIC_TYPES = new Set([
  'languages', 'skills', 'soft_skills', 'work_values', 'values',
  'hobbies', 'interests', 'certifications', 'courses', 'awards',
  'volunteering', 'stipendien', 'scholarships',
]);

const CATEGORY_PREFIX_RE =
  /^(programmiersprachen|technische\s*f[äa]higkeiten|fachkenntnisse|kenntnisse|sprachen|fähigkeiten|soft\s*skills|skills|languages|kompetenzen|tools?)[:\s\-–]+/i;

const clean = (s: string) => (s ?? '').replace(CATEGORY_PREFIX_RE, '').trim();

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2
    data-break-keep-next
    style={{
      fontFamily: FONT,
      fontSize: '9px',
      fontWeight: 700,
      letterSpacing: '0.13em',
      textTransform: 'uppercase',
      color: t.text,
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '8px',
      marginTop: '0',
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
}> = ({ from, to, onChangeFrom, onChangeTo }) => {
  const hasFrom = !!from?.trim();
  const hasTo = !!to?.trim();
  if (!hasFrom && !hasTo) return null;

  return (
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
        color: t.muted,
        border: `1px solid ${CI.border}`,
        fontFamily: FONT,
        whiteSpace: 'nowrap',
        flexShrink: 0,
        lineHeight: 1.4,
        verticalAlign: 'middle',
      }}
    >
      {hasFrom && (
        <EditableText
          as="span"
          value={from}
          onChange={onChangeFrom}
          placeholder="MM/JJJJ"
          style={{ fontSize: '9px', color: t.muted, textAlign: 'center', lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle' }}
        />
      )}
      {hasFrom && hasTo && (
        <span style={{ color: t.faint, margin: '0 2px', lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle' }}>–</span>
      )}
      {hasTo && (
        <EditableText
          as="span"
          value={to}
          onChange={onChangeTo}
          placeholder="heute"
          style={{ fontSize: '9px', color: t.muted, textAlign: 'center', lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle' }}
        />
      )}
    </span>
  );
};

const Chip: React.FC<{
  value: string;
  onChange: (v: string) => void;
  onDelete?: () => void;
  bg?: string;
  borderColor?: string;
  color?: string;
  fontWeight?: string | number;
  sectionIndex?: number;
  itemIndex?: number;
  onReorderSectionItem?: (sectionIndex: number, from: number, to: number) => void;
}> = ({ value, onChange, onDelete, bg = CI.tint, borderColor = CI.border, color = t.text, fontWeight = 600, sectionIndex, itemIndex, onReorderSectionItem }) => (
  <span
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      borderRadius: '999px',
      padding: '3px 10px',
      marginRight: '5px',
      marginBottom: '5px',
      marginLeft: onReorderSectionItem ? '10px' : undefined,
      verticalAlign: 'middle',
      fontSize: '9px',
      fontFamily: FONT,
      backgroundColor: bg,
      border: `1px solid ${borderColor}`,
      lineHeight: 1.4,
      whiteSpace: 'nowrap',
      position: 'relative',
      cursor: onReorderSectionItem ? 'grab' : undefined,
    }}
    {...(sectionIndex !== undefined && itemIndex !== undefined ? itemDragProps(sectionIndex, itemIndex, onReorderSectionItem) : {})}
  >
    {sectionIndex !== undefined && itemIndex !== undefined && (
      <ItemDragHandle sectionIndex={sectionIndex} itemIndex={itemIndex} onReorderSectionItem={onReorderSectionItem} />
    )}
    <EditableText
      as="span"
      value={value}
      onChange={onChange}
      style={{ fontSize: '9px', color, fontWeight, lineHeight: 1.4, display: 'inline-block', verticalAlign: 'middle', textAlign: 'center', width: 'auto' }}
    />
    {onDelete && (
      <button
        type="button"
        className="pdf-hidden"
        style={{ fontSize: '8px', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0, lineHeight: 1, flexShrink: 0, opacity: 0.6, pointerEvents: 'auto' }}
        onClick={onDelete}
      >
        ✕
      </button>
    )}
  </span>
);

const iconStyle: React.CSSProperties = { flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' };

const IconLocation: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
  </svg>
);
const IconPhone: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.59 3.47 2 2 0 0 1 3.56 1.3h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.84a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const IconMail: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={iconStyle}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
  </svg>
);
const IconLinkedIn: React.FC = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="#0A66C2" style={iconStyle}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" /><rect x="2" y="9" width="4" height="12" /><circle cx="4" cy="4" r="2" />
  </svg>
);

const normalizeBullet = (s: string) => (s ?? '').replace(/\r/g, '').replace(/^[-•\u2022]\s*/, '').trim();

const splitToBullets = (text: string): string[] =>
  (text ?? '').replace(/\r/g, '').split('\n').map(normalizeBullet).filter((l) => l.length > 0);

const getBullets = (item: any): string[] => {
  if (Array.isArray(item?.bulletPoints) && item.bulletPoints.length > 0) {
    return item.bulletPoints.map((b: any) => normalizeBullet(String(b ?? ''))).filter((b: string) => b.length > 0);
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

const cardStyle: React.CSSProperties = {
  border: `1px solid ${CI.border}`,
  borderRadius: '12px',
  padding: '10px 14px',
  backgroundColor: '#ffffff',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
  fontFamily: FONT,
  display: 'block',
  width: '100%',
  position: 'relative',
};

export const ModernCVTemplate: React.FC<CVTemplateProps> = ({
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
  const today = new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const footerLocation = (personalInfo.footerLocation ?? personalInfo.location ?? '').toString();

  const containerMinHeight = minHeightPx ?? 1122;

  // Leere optionale Felder (Ort, Schwerpunkte) reservieren sonst dauerhaft
  // eine graue Platzhalterzeile. Jetzt: Feld bleibt weg, bis ein kleiner
  // "+"-Button (in der Kopfzeile der Station) es einblendet.
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const reveal = (key: string) => setRevealed((prev) => new Set(prev).add(key));
  // FIX (Quentin: "+" liegt über der Schrift, man kann dann manchmal nicht
  // reinschreiben): dieselbe Ursache wie im Classic-/Professional-Template
  // (siehe dortiger ausführlicher Kommentar). `.pdf-hidden` erzwingt global
  // position:absolute + margin:0 !important — ohne den `data-inline-control`-
  // Wrapper an jeder Einsatzstelle (siehe unten) landet der Button fast exakt
  // auf dem Text davor statt sichtbar danach. Zusätzlich jetzt deutlich
  // kontrastreicher (vorher: fast unsichtbarer gestrichelter Rahmen), damit
  // er auch bei Hover sofort auffindbar ist.
  const AddFieldButton: React.FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
    <button
      type="button"
      className="pdf-hidden"
      title={label}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '16px',
        height: '16px',
        marginLeft: '6px',
        verticalAlign: 'middle',
        border: `1px solid ${t.accent}`,
        borderRadius: '3px',
        background: t.surface,
        color: t.accent,
        cursor: 'pointer',
        padding: 0,
        lineHeight: 1,
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
      }}
    >
      <Plus size={11} />
    </button>
  );

  const renderCardControls = (
    sectionIndex: number,
    idx: number,
    item: any,
    opts?: { addBullet?: boolean; keepDescription?: boolean }
  ) => (
    <div className="pdf-hidden" data-pdf-hidden>
      {opts?.addBullet && (
        <button
          type="button"
          style={{ fontSize: '9px', color: CI.primaryDark, background: '#fff', border: `1px solid ${CI.border}`, borderRadius: '4px', cursor: 'pointer', padding: '2px 7px', lineHeight: '1.5' }}
          onClick={() => {
            const hasDescription = typeof item?.description === 'string' && item.description.trim();
            const convert = hasDescription && !opts?.keepDescription;
            const base = Array.isArray(item?.bulletPoints) && item.bulletPoints.length > 0
              ? [...item.bulletPoints]
              : convert
                ? splitToBullets(item.description)
                : [];
            onUpdateSectionItem(sectionIndex, idx, 'bulletPoints', [...base, 'Neuer Punkt']);
            if (convert) {
              onUpdateSectionItem(sectionIndex, idx, 'description', '');
            }
          }}
        >
          + Bullet
        </button>
      )}
      <button
        type="button"
        style={{ fontSize: '9px', color: '#dc2626', background: '#fff', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer', padding: '2px 7px', lineHeight: '1.5' }}
        onClick={() => onDeleteSectionItem(sectionIndex, idx)}
      >
        Station löschen
      </button>
    </div>
  );

  /**
   * Berufserfahrung UND Projekte teilen sich diese Funktion — die
   * Schleifenvariable heißt hier durchgehend `item`, NICHT `edu`. `edu`
   * existiert ausschließlich im `education`-Case weiter unten. Eine
   * Verwechslung der beiden führte zuletzt zu `ReferenceError: edu is not
   * defined`, weil ein Ausbildungs-Codeschnipsel versehentlich hier
   * hineinkopiert wurde.
   */
  const renderExperienceOrProjects = (section: EditorSection, sectionIndex: number, isProject: boolean) => {
    const items = Array.isArray(section.items) ? section.items : [];
    if (items.length === 0) return null;

    const title = section.title || (isProject ? 'Projekte' : 'Berufserfahrung');

    return (
      <div key={`${section.type}-${sectionIndex}`}>
        <SectionTitle>{title}</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {items.map((item: any, idx: number) => {
            const bullets = getBullets(item);
            return (
              <div
                key={idx}
                data-pdf-section
                data-break-item
                style={{ ...cardStyle, cursor: onReorderSectionItem ? 'grab' : undefined }}
                {...itemDragProps(sectionIndex, idx, onReorderSectionItem)}
              >
                <ItemDragHandle sectionIndex={sectionIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <EditableText
                      wrap
                      value={isProject ? item.title || item.name || '' : item.title || item.position || item.role || ''}
                      onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'title', v)}
                      placeholder={isProject ? 'Projekttitel' : 'Position / Rolle'}
                      style={{ fontSize: '11px', fontWeight: 700, color: t.text, lineHeight: 1.4 }}
                    />
                    <div data-inline-control style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <EditableText
                        as="span"
                        wrap
                        value={isProject ? item.role || '' : item.company || item.employer || ''}
                        onChange={(v) => onUpdateSectionItem(sectionIndex, idx, isProject ? 'role' : 'company', v)}
                        placeholder={isProject ? 'Deine Rolle' : 'Unternehmen'}
                        style={{ fontSize: '10px', color: t.muted, lineHeight: 1.4 }}
                      />
                      {!isProject && !(item.location || item.ort) && !revealed.has(`exp-${idx}-location`) && (
                        <AddFieldButton label="Ort hinzufügen" onClick={() => reveal(`exp-${idx}-location`)} />
                      )}
                    </div>
                    {!isProject && (item.location || item.ort || revealed.has(`exp-${idx}-location`)) && (
                      <EditableText
                        value={item.location || item.ort || ''}
                        onChange={(v) => onUpdateSectionItem(sectionIndex, idx, 'location', v)}
                        placeholder="Ort"
                        style={{ fontSize: '9.5px', color: t.faint, marginTop: '2px', lineHeight: 1.4 }}
                      />
                    )}
                  </div>
                  <DateBadge
                    from={item.date_from || ''}
                    to={item.date_to || ''}
                    onChangeFrom={(v) => onUpdateSectionItem(sectionIndex, idx, 'date_from', v)}
                    onChangeTo={(v) => onUpdateSectionItem(sectionIndex, idx, 'date_to', v)}
                  />
                </div>

                {/*
                  BUG (fehlender erster Bulletpoint / doppelte Anzeige): hier
                  stand vorher zusätzlich ein rohes, NICHT gebullettes
                  `description`-Feld über der Liste unten. `bullets` (siehe
                  `getBullets()` oben) fällt bereits selbst auf `description`
                  zurück, wenn keine `bulletPoints` existieren — das rohe Feld
                  zeigte denselben Text dann ein zweites Mal an. War
                  `bulletPoints` gefüllt, sah es stattdessen so aus, als hätte
                  der erste Punkt keinen Aufzählungspunkt (er stand ja separat,
                  ohne Punkt, direkt über der echten Liste). Beides entfällt,
                  wenn `description` nur noch über `getBullets()` einfließt.
                */}
                {bullets.length > 0 && (
                  <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {bullets.map((bp: string, bIdx: number) => (
                      <li key={bIdx} data-break-line data-pdf-bullet-row style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                        <span
                          aria-hidden="true"
                          data-pdf-bullet-dot
                          style={{ display: 'inline-block', flexShrink:0, color: CI.primaryDark, fontSize: '9.5px', lineHeight: 1.55, userSelect: 'none' }}
                        >•</span>
                        <EditableText
                          multiline
                          value={bp}
                          onChange={(v) => {
                            const base = Array.isArray(item?.bulletPoints) && item.bulletPoints.length > 0
                              ? [...item.bulletPoints]
                              : [...bullets];
                            while (base.length <= bIdx) base.push('');
                            base[bIdx] = v;
                            onUpdateSectionItem(sectionIndex, idx, 'bulletPoints', base);
                          }}
                          placeholder="Aufgabe / Ergebnis"
                          style={{ fontSize: '9.5px', color: t.text, lineHeight: 1.55, flex: 1, display: 'block' }}
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
                )}

                {renderCardControls(sectionIndex, idx, item, { addBullet: true })}
              </div>
            );
          })}

          {onAddSectionItem && (
            <button
              type="button"
              className="pdf-hidden"
              style={{ position: 'static', fontSize: '9px', fontWeight: 600, color: CI.primaryDark, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: '4px', padding: '4px 0' }}
              onClick={() => onAddSectionItem(sectionIndex, isProject
                ? { title: 'Neues Projekt', role: 'Deine Rolle' }
                : { title: 'Neue Position', company: 'Unternehmen', date_from: '01/2026', date_to: 'Heute' })}
            >
              + Eintrag hinzufügen
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderSection = (section: EditorSection, sectionIndex: number): React.ReactNode => {
    const items = Array.isArray(section.items) ? section.items : [];

    switch (section.type) {
      case 'experience':
        return renderExperienceOrProjects(section, sectionIndex, false);
      case 'projects':
        return renderExperienceOrProjects(section, sectionIndex, true);

      /**
       * Ausbildung — die Schleifenvariable heißt hier `edu`, ausschließlich
       * in diesem Case. FIX (Titel überlappte die Datums-Badge): Der Titel
       * lief in `DateBadge` hinein, statt umzubrechen. `minWidth: 0` auf dem
       * Flex-Kind ist zwingend nötig — ohne das ignoriert Flexbox das
       * Schrumpfen und der Inhalt läuft über die Nachbarspalte hinaus.
       * `wrap` auf dem EditableText erlaubt dann den tatsächlichen Umbruch.
       * Beides zusammen verhindert die Überlappung UND den in EditableText
       * separat gefixten Buchstaben-Stapel (overflowWrap: break-word statt
       * anywhere).
       */
      case 'education': {
        const eduItems = items
          .map((e: any, originalIdx: number) => ({ edu: e, originalIdx }))
          .filter(({ edu }) =>
            (edu?.degree || edu?.title || '').toString().trim() ||
            (edu?.institution || edu?.school || edu?.university || '').toString().trim()
          );
        if (eduItems.length === 0) return null;

        return (
          <div key={`education-${sectionIndex}`}>
            <SectionTitle>{section.title || 'Ausbildung & Studium'}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {eduItems.map(({ edu, originalIdx }) => {
                // ANDERS als Berufserfahrung/Projekte: bei Ausbildung bleibt
                // `description` ("Schwerpunkte / Beschreibung") bewusst ein
                // eigenes Feld, das NICHT in die Bullet-Liste einfließt (siehe
                // `keepDescription: true` im renderCardControls-Aufruf unten).
                // eduBullets zeigt deshalb nur echte `bulletPoints` an.
                const eduBullets = Array.isArray(edu.bulletPoints)
                  ? edu.bulletPoints
                      .map((b: any) => normalizeBullet(String(b ?? '')))
                      .filter((b: string) => b.length > 0)
                  : [];

                return (
                  <div
                    key={originalIdx}
                    data-pdf-section
                    data-break-item
                    style={{ ...cardStyle, cursor: onReorderSectionItem ? 'grab' : undefined }}
                    {...itemDragProps(sectionIndex, originalIdx, onReorderSectionItem)}
                  >
                    <ItemDragHandle sectionIndex={sectionIndex} itemIndex={originalIdx} onReorderSectionItem={onReorderSectionItem} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <EditableText
                          wrap
                          value={edu.degree || edu.title || ''}
                          onChange={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'degree', v)}
                          placeholder="Abschluss"
                          style={{ fontSize: '11px', fontWeight: 700, color: t.text, lineHeight: 1.4 }}
                        />
                        <div data-inline-control style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <EditableText
                            as="span"
                            wrap
                            value={edu.institution || edu.school || edu.university || ''}
                            onChange={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'institution', v)}
                            placeholder="Institution"
                            style={{ fontSize: '10px', color: t.muted, lineHeight: 1.4 }}
                          />
                          {!edu.location && !revealed.has(`edu-${originalIdx}-location`) && (
                            <AddFieldButton label="Ort hinzufügen" onClick={() => reveal(`edu-${originalIdx}-location`)} />
                          )}
                          {!edu.description && !revealed.has(`edu-${originalIdx}-description`) && (
                            <AddFieldButton label="Schwerpunkte hinzufügen" onClick={() => reveal(`edu-${originalIdx}-description`)} />
                          )}
                        </div>
                        {(edu.location || revealed.has(`edu-${originalIdx}-location`)) && (
                          <EditableText
                            value={edu.location || ''}
                            onChange={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'location', v)}
                            placeholder="Ort"
                            style={{ fontSize: '9.5px', color: t.faint, marginTop: '2px', lineHeight: 1.4 }}
                          />
                        )}
                      </div>
                      <DateBadge
                        from={edu.date_from || ''}
                        to={edu.date_to || ''}
                        onChangeFrom={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'date_from', v)}
                        onChangeTo={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'date_to', v)}
                      />
                    </div>

                    {(edu.description || revealed.has(`edu-${originalIdx}-description`)) && (
                      <EditableText
                        multiline
                        value={edu.description || ''}
                        onChange={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'description', v)}
                        placeholder="Schwerpunkte / Beschreibung"
                        style={{ fontSize: '9.5px', color: t.muted, marginTop: '4px', lineHeight: 1.5 }}
                      />
                    )}

                    {eduBullets.length > 0 && (
                      <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {eduBullets.map((bp: string, bIdx: number) => (
                          <li key={bIdx} data-break-line data-pdf-bullet-row style={{ display: 'flex', alignItems: 'flex-start', gap: '7px' }}>
                            <span
                              aria-hidden="true"
                              data-pdf-bullet-dot
                              style={{ display: 'inline-block', flexShrink: 0, color: CI.primaryDark, fontSize: '9.5px', lineHeight: 1.55, userSelect: 'none' }}
                            >•</span>
                            <EditableText
                              multiline
                              value={bp}
                              onChange={(v) => {
                                const base = [...eduBullets];
                                while (base.length <= bIdx) base.push('');
                                base[bIdx] = v;
                                onUpdateSectionItem(sectionIndex, originalIdx, 'bulletPoints', base);
                              }}
                              placeholder="Inhalt / Schwerpunkt"
                              style={{ fontSize: '9.5px', color: t.text, lineHeight: 1.55, flex: 1, display: 'block' }}
                            />
                            {onDeleteBullet && (
                              <button
                                type="button"
                                className="pdf-hidden flex-shrink-0 text-red-400 hover:text-red-600 transition-colors"
                                style={{ lineHeight: 1, padding: '1px 3px', fontSize: '11px', background: 'none', border: 'none', cursor: 'pointer' }}
                                onClick={() => onDeleteBullet(sectionIndex, originalIdx, bIdx)}
                                title="Bullet löschen"
                              >×</button>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}

                    {(edu.grade || edu.grades || edu.note) && (
                      <div style={{ fontSize: '9.5px', color: t.muted, marginTop: '4px', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 600 }}>Note: </span>
                        <EditableText
                          as="span"
                          value={edu.grade || edu.grades || edu.note || ''}
                          onChange={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'grade', v)}
                          placeholder="Note"
                          style={{ fontSize: '9.5px', color: t.muted }}
                        />
                      </div>
                    )}

                    {renderCardControls(sectionIndex, originalIdx, edu, { addBullet: true, keepDescription: true })}
                  </div>
                );
              })}

              {onAddSectionItem && (
                <button
                  type="button"
                  className="pdf-hidden"
                  style={{ position: 'static', fontSize: '9px', fontWeight: 600, color: CI.primaryDark, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', marginTop: '4px', padding: '4px 0' }}
                  onClick={() => onAddSectionItem(sectionIndex, { degree: 'Neuer Abschluss', institution: 'Schule / Universität', date_from: '01/2026', date_to: 'Heute' })}
                >
                  + Eintrag hinzufügen
                </button>
              )}
            </div>
          </div>
        );
      }

      /**
       * FIX (Sprachen unsichtbar): `language` liest jetzt zusätzlich
       * `skill`/`label` (KI-Fallback-Format), und der finale Filter wirft
       * keinen Eintrag mehr raus, der nur ein Niveau ohne erkannten Namen hat
       * — genau das ließ zuvor eine Sprache spurlos verschwinden ("nur
       * 'Muttersprache' sichtbar, kein Name davor").
       */
      case 'languages': {
        const langItems = items
          .map((lang: any, originalIdx: number) => {
            let language = '';
            let level = '';
            if (typeof lang === 'string') {
              const parts = lang.split(/[-–:,]/).map((p: string) => p.trim());
              language = parts[0] || lang;
              level = parts[1] || '';
            } else if (typeof lang === 'object' && lang !== null) {
              language = lang.language || lang.name || lang.sprache || lang.skill || lang.label || '';
              level = lang.level || lang.niveau || lang.proficiency || '';
              language = clean(language);
              if (level && language.toLowerCase().endsWith(level.toLowerCase())) {
                language = language.slice(0, language.length - level.length).replace(/[-–:,\s]+$/, '').trim();
              }
            }
            return { language: language.trim(), level: level.trim(), originalIdx };
          })
          .filter((l) => (l.language && l.language !== '[object Object]') || l.level);

        if (langItems.length === 0) return null;

        return (
          <div key={`languages-${sectionIndex}`} data-pdf-section data-break-atomic>
            <SectionTitle>{section.title || 'Sprachen'}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {langItems.map((lang) => (
                <div
                  key={lang.originalIdx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: '8px',
                    padding: '5px 12px',
                    fontSize: '9px',
                    fontFamily: FONT,
                    backgroundColor: CI.tint,
                    border: `1px solid ${CI.border}`,
                    position: 'relative',
                    cursor: onReorderSectionItem ? 'grab' : undefined,
                  }}
                  {...itemDragProps(sectionIndex, lang.originalIdx, onReorderSectionItem)}
                >
                  <ItemDragHandle sectionIndex={sectionIndex} itemIndex={lang.originalIdx} onReorderSectionItem={onReorderSectionItem} />
                  <EditableText
                    as="span"
                    value={lang.language}
                    onChange={(v) => onUpdateSectionItem(sectionIndex, lang.originalIdx, 'language', v)}
                    placeholder="Sprache"
                    style={{ fontSize: '9px', fontWeight: 600, color: t.text }}
                  />
                  <EditableText
                    as="span"
                    value={lang.level}
                    onChange={(v) => onUpdateSectionItem(sectionIndex, lang.originalIdx, 'level', v)}
                    placeholder="Niveau"
                    style={{ fontSize: '9px', color: t.muted, textAlign: 'right' }}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }

      case 'skills':
      case 'soft_skills': {
        const isSoft = section.type === 'soft_skills';
        const chips = items
          .map((skill: any, originalIdx: number) => {
            const name = typeof skill === 'string' ? skill : skill?.skill || skill?.name || skill?.label || '';
            const level = typeof skill === 'object' && skill !== null ? skill.level || skill.niveau || '' : '';
            const cleaned = clean(name).replace(/\s*\(?Otherskill\)?/gi, '').replace(/\s*\($/, '').trim();
            return { display: level ? `${cleaned} (${String(level).trim()})` : cleaned, originalIdx };
          })
          .filter((c) => c.display);

        if (chips.length === 0) return null;

        return (
          <div key={`${section.type}-${sectionIndex}`} data-pdf-section data-break-atomic>
            <SectionTitle>{section.title || (isSoft ? 'Soft Skills' : 'Fähigkeiten')}</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {chips.map((c) => (
                <Chip
                  key={c.originalIdx}
                  value={c.display}
                  onChange={(v) => onUpdateSectionItem(sectionIndex, c.originalIdx, 'skill', v)}
                  onDelete={() => onDeleteSectionItem(sectionIndex, c.originalIdx)}
                  bg={isSoft ? '#f8fafc' : CI.tint}
                  borderColor={isSoft ? t.border : CI.border}
                  color={isSoft ? t.muted : t.text}
                  fontWeight={isSoft ? 500 : 600}
                  sectionIndex={sectionIndex}
                  itemIndex={c.originalIdx}
                  onReorderSectionItem={onReorderSectionItem}
                />
              ))}
            </div>
          </div>
        );
      }

      case 'work_values':
      case 'values':
      case 'hobbies':
      case 'interests': {
        const isValues = section.type === 'work_values' || section.type === 'values';
        const chips = items
          .map((item: any, originalIdx: number) => ({
            display: (typeof item === 'string' ? item : item?.label || item?.value || item?.name || '').trim(),
            originalIdx,
          }))
          .filter((c) => c.display);

        if (chips.length === 0) return null;

        return (
          <div key={`${section.type}-${sectionIndex}`} data-pdf-section data-break-atomic>
            <SectionTitle>{isValues ? 'Arbeitsweise & Werte' : 'Hobbys & Interessen'}</SectionTitle>
            <div data-chip-row style={{ display: 'block', overflow: 'visible' }}>
              {chips.map((c) => (
                <Chip
                  key={c.originalIdx}
                  value={c.display}
                  onChange={(v) => onUpdateSectionItem(sectionIndex, c.originalIdx, 'label', v)}
                  onDelete={() => onDeleteSectionItem(sectionIndex, c.originalIdx)}
                  sectionIndex={sectionIndex}
                  itemIndex={c.originalIdx}
                  onReorderSectionItem={onReorderSectionItem}
                />
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
      case 'scholarships': {
        // BUG-FIX: vorher `items.filter(...)` — dabei ging der ORIGINAL-Index
        // verloren, sobald ein Item übersprungen wurde (kein Name/Titel).
        // `onUpdateSectionItem`/`itemDragProps` erhielten dann den Index in
        // der gefilterten Liste statt in `items`, wodurch Bearbeiten und
        // Verschieben nach dem ersten leeren Eintrag das FALSCHE Item traf.
        const entries = items
          .map((it: any, originalIdx: number) => ({ it, originalIdx }))
          .filter(({ it }) => (it?.name || it?.title || it?.label || it?.degree || it?.role || '').toString().trim());
        if (entries.length === 0) return null;

        const LABELS: Record<string, string> = {
          awards: 'Auszeichnungen', volunteering: 'Ehrenamt', certifications: 'Zertifikate',
          stipendien: 'Stipendien', scholarships: 'Stipendien', courses: 'Weiterbildung',
        };

        return (
          <div key={`${section.type}-${sectionIndex}`} data-pdf-section data-break-atomic>
            <SectionTitle>{section.title || LABELS[section.type] || section.type}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {entries.map(({ it, originalIdx }) => {
                const label = it.name || it.title || it.label || it.degree || it.role || '';
                const sub = it.institution || it.issuer || it.company || it.organization || '';
                // Zeitspanne aus fertigem String ODER getrennten Feldern
                // (date_from/date_to bzw. startDate/endDate aus dem
                // Ehrenamt-Schritt) — vorher fiel date_to/endDate hier
                // still weg.
                const rangeFrom = it.date_from || it.startDate || '';
                const rangeTo = it.current ? 'Heute' : (it.date_to || it.endDate || '');
                const composedRange = rangeFrom && rangeTo ? `${rangeFrom} – ${rangeTo}` : rangeFrom;
                const date = it.date || composedRange || it.year || '';
                const location = it.location || it.ort || '';
                const itemKey = `detail-${sectionIndex}-${originalIdx}`;
                const showLocationBtn = !location && !revealed.has(`${itemKey}-location`);
                const showRangeBtn = !date && !revealed.has(`${itemKey}-zeitraum`);

                return (
                  <div
                    key={originalIdx}
                    style={{
                      border: `1px solid ${CI.border}`,
                      borderRadius: '10px',
                      padding: '8px 12px',
                      backgroundColor: '#ffffff',
                      fontFamily: FONT,
                      position: 'relative',
                      cursor: onReorderSectionItem ? 'grab' : undefined,
                    }}
                    {...itemDragProps(sectionIndex, originalIdx, onReorderSectionItem)}
                  >
                    <ItemDragHandle sectionIndex={sectionIndex} itemIndex={originalIdx} onReorderSectionItem={onReorderSectionItem} />
                    {/* FIX (abgeschnittene Zertifikate/Weiterbildungen): kein
                        min-w-0 mehr (Feld darf nicht unter seine Wortbreite
                        schrumpfen) + `wrap` auf Name/Institution, statt der
                        Default-Kombination nowrap+ellipsis, die lange Namen
                        stillschweigend abgeschnitten hat. */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <EditableText
                          value={label}
                          onChange={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'name', v)}
                          placeholder="Bezeichnung"
                          style={{ fontSize: '9.5px', fontWeight: 600, color: t.text, lineHeight: 1.5 }}
                          wrap
                        />
                        {sub && (
                          <EditableText
                            value={sub}
                            onChange={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'institution', v)}
                            placeholder="Organisation"
                            style={{ fontSize: '9px', color: t.muted, lineHeight: 1.4, marginTop: '1px' }}
                            wrap
                          />
                        )}
                      </div>
                      {date && (
                        <EditableText
                          as="span"
                          value={date}
                          onChange={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'date', v)}
                          placeholder="Datum"
                          style={{ fontSize: '9px', color: t.muted, whiteSpace: 'nowrap', flexShrink: 0 }}
                        />
                      )}
                    </div>
                    {(showLocationBtn || showRangeBtn) && (
                      <div data-inline-control style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                        {showLocationBtn && (
                          <AddFieldButton label="Ort hinzufügen" onClick={() => reveal(`${itemKey}-location`)} />
                        )}
                        {showRangeBtn && (
                          <AddFieldButton label="Zeitraum hinzufügen" onClick={() => reveal(`${itemKey}-zeitraum`)} />
                        )}
                      </div>
                    )}
                    {(location || revealed.has(`${itemKey}-location`)) && (
                      <EditableText
                        value={location}
                        onChange={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'location', v)}
                        placeholder="Ort"
                        style={{ fontSize: '9px', color: t.muted, marginTop: '2px', display: 'block' }}
                      />
                    )}
                    {(!date && revealed.has(`${itemKey}-zeitraum`)) && (
                      <EditableText
                        value=""
                        onChange={(v) => onUpdateSectionItem(sectionIndex, originalIdx, 'date', v)}
                        placeholder="z.B. 03/2022 – 06/2022"
                        style={{ fontSize: '9px', color: t.muted, marginTop: '2px', display: 'block' }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      default: {
        const entries = items
          .map((it: any, originalIdx: number) => ({
            display: (typeof it === 'string' ? it : it?.name || it?.title || it?.label || '').trim(),
            originalIdx,
          }))
          .filter((e) => e.display);
        if (entries.length === 0) return null;

        const isAtomic = ATOMIC_TYPES.has(section.type);

        return (
          <div
            key={`${section.type}-${sectionIndex}`}
            data-pdf-section
            {...(isAtomic ? { 'data-break-atomic': '' } : {})}
          >
            <SectionTitle>{section.title || section.type}</SectionTitle>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {entries.map((e) => (
                <div
                  key={e.originalIdx}
                  style={{
                    border: `1px solid ${CI.border}`,
                    borderRadius: '10px',
                    padding: '8px 12px',
                    backgroundColor: '#ffffff',
                    fontFamily: FONT,
                    position: 'relative',
                    cursor: onReorderSectionItem ? 'grab' : undefined,
                  }}
                  {...itemDragProps(sectionIndex, e.originalIdx, onReorderSectionItem)}
                >
                  <ItemDragHandle sectionIndex={sectionIndex} itemIndex={e.originalIdx} onReorderSectionItem={onReorderSectionItem} />
                  <EditableText
                    value={e.display}
                    onChange={(v) => onUpdateSectionItem(sectionIndex, e.originalIdx, 'name', v)}
                    placeholder="Eintrag"
                    style={{ fontSize: '9.5px', color: t.text, lineHeight: 1.5 }}
                    wrap
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }
    }
  };

  const leftSections = sections.filter((s) => isLeft(s.type));
  const rightSections = sections.filter((s) => isRight(s.type));
  const otherSections = sections.filter((s) => !isLeft(s.type) && !isRight(s.type));

  const renderColumn = (list: EditorSection[]) =>
    list.map((section) => {
      const index = sections.findIndex((s) => s === section);
      const content = renderSection(section, index);
      if (!content) return null;
      return (
        <div
          key={index}
          {...dragProps(index, onReorderSections)}
          style={{ position: 'relative', cursor: onReorderSections ? 'grab' : undefined }}
          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
          onDrop={(e) => {
            e.preventDefault();
            const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (!isNaN(from) && from !== index) onReorderSections?.(from, index);
          }}
        >
          <SectionDragHandle index={index} onReorderSections={onReorderSections} />
          {content}
        </div>
      );
    });

  return (
    <div
      className="cv-render-root"
      style={{
        fontFamily: FONT,
        color: t.text,
        width: '794px',
        boxSizing: 'border-box',
        minHeight: `${containerMinHeight}px`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: CI.canvas,
        borderLeft: `4px solid ${CI.primary}`,
        wordBreak: 'normal',
        overflowWrap: 'break-word',
      }}
    >
      <div>
        <header
          style={{
            backgroundColor: CI.canvas,
            borderBottom: `1px solid ${CI.border}`,
            padding: '28px 32px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '24px',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <EditableText
              as="h1"
              value={personalInfo.name || ''}
              onChange={(v) => onUpdatePersonalInfo('name', v)}
              placeholder="Vollständiger Name"
              style={{ fontSize: '22px', fontWeight: 800, color: t.text, letterSpacing: '-0.01em', lineHeight: 1.2, marginBottom: '4px', display: 'block' }}
            />
            {personalInfo.title?.trim() ? (
              <div data-inline-control style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '14px' }}>
                <EditableText
                  as="span"
                  value={personalInfo.title}
                  onChange={(v) => onUpdatePersonalInfo('title', v)}
                  placeholder="Zielposition / Profil"
                  style={{ fontSize: '12px', fontWeight: 700, color: CI.primaryDark }}
                />
                {!personalInfo.location?.trim() && !revealed.has('header-location') && (
                  <AddFieldButton label="Ort hinzufügen" onClick={() => reveal('header-location')} />
                )}
              </div>
            ) : (
              !personalInfo.location?.trim() && !revealed.has('header-location') && (
                <div data-inline-control style={{ marginBottom: '4px' }}>
                  <AddFieldButton label="Ort hinzufügen" onClick={() => reveal('header-location')} />
                </div>
              )
            )}

            <div style={{ display: 'block', fontSize: '9.5px', color: t.muted, marginTop: personalInfo.title?.trim() ? 0 : '10px', overflow: 'hidden' }}>
              {(personalInfo.location?.trim() || revealed.has('header-location')) && (
                <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '20px', marginBottom: '4px', verticalAlign: 'middle' }}>
                  <IconLocation />
                  <EditableText as="span" value={personalInfo.location || ''} onChange={(v) => onUpdatePersonalInfo('location', v)} placeholder="Ort" style={{ fontSize: '9.5px', color: t.muted, marginLeft: '4px' }} />
                </span>
              )}
              {personalInfo.phone?.trim() && (
                <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '20px', marginBottom: '4px', verticalAlign: 'middle' }}>
                  <IconPhone />
                  <EditableText as="span" value={personalInfo.phone} onChange={(v) => onUpdatePersonalInfo('phone', v)} placeholder="Telefon" style={{ fontSize: '9.5px', color: t.muted, marginLeft: '4px' }} />
                </span>
              )}
              {personalInfo.email?.trim() && (
                <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '20px', marginBottom: '4px', verticalAlign: 'middle' }}>
                  <IconMail />
                  <EditableText as="span" value={personalInfo.email} onChange={(v) => onUpdatePersonalInfo('email', v)} placeholder="E-Mail" style={{ fontSize: '9.5px', color: t.muted, marginLeft: '4px' }} />
                </span>
              )}
              {personalInfo.linkedin?.trim() && (
                <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '20px', marginBottom: '4px', verticalAlign: 'middle' }}>
                  <IconLinkedIn />
                  <EditableText as="span" value={personalInfo.linkedin} onChange={(v) => onUpdatePersonalInfo('linkedin', v)} placeholder="LinkedIn" style={{ fontSize: '9.5px', color: t.muted, marginLeft: '4px' }} />
                </span>
              )}
            </div>
          </div>

          {photoUrl && (
            <div style={{ flexShrink: 0 }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '12px', overflow: 'hidden', border: `2px solid ${CI.border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.1)', backgroundColor: '#f1f5f9' }}>
                <img src={photoUrl} alt="Foto" style={{ width: '90px', height: '90px', objectFit: 'cover', objectPosition: `${photoPosition.x}% ${photoPosition.y}%`, display: 'block' }} />
              </div>
            </div>
          )}
        </header>

        <main style={{ padding: '4px 32px 16px', display: 'flex', width: '100%', boxSizing: 'border-box' }}>
          <section style={{ flex: '0 0 58%', minWidth: 0, paddingRight: '14px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {summary?.trim() && (
              <div data-pdf-section data-break-atomic style={{ display: 'block', width: '100%' }}>
                <SectionTitle>Profil</SectionTitle>
                <EditableText
                  as="p"
                  multiline
                  value={summary}
                  onChange={onUpdateSummary}
                  placeholder="Kurzprofil..."
                  style={{
                    fontSize: '9.5px',
                    lineHeight: 1.65,
                    color: t.text,
                    backgroundColor: CI.tint,
                    border: `1px solid ${CI.border}`,
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'block',
                    overflow: 'hidden',
                    wordBreak: 'break-word',
                    overflowWrap: 'break-word',
                  }}
                />
              </div>
            )}
            {renderColumn(leftSections)}
          </section>

          <aside style={{ flex: '0 0 42%', minWidth: 0, paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {renderColumn(rightSections)}
          </aside>
        </main>

        {otherSections.length > 0 && (
          <div style={{ padding: '0 32px 16px', display: 'flex', flexDirection: 'column', gap: '18px' }} data-pdf-section>
            {renderColumn(otherSections)}
          </div>
        )}
      </div>

      <footer
        data-pdf-footer
        style={{
          borderTop: `1px solid ${CI.border}`,
          padding: '10px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '9px',
          color: t.muted,
          fontFamily: FONT,
          marginTop: 'auto',
          flexShrink: 0,
          backgroundColor: CI.canvas,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
          <span style={{ fontWeight: 600, flexShrink: 0 }}>Ort:</span>
          <EditableText
            as="span"
            value={footerLocation}
            onChange={(v) => onUpdatePersonalInfo('footerLocation', v)}
            placeholder="Ort"
            style={{ fontSize: '9px', color: t.muted }}
          />
        </div>
        <span style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{today}</span>
      </footer>
    </div>
  );
};