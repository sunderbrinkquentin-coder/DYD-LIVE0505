// src/components/cv-templates/templates/ClassicCVTemplate.tsx

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
import { getTokens, FONT_STACK } from '../tokens';

const t = getTokens('classic');

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
  onReorderSectionItem,
}) => {
  // Höhe kommt aus der Break-Engine, nicht aus einem lokalen ResizeObserver.
  const containerMinHeight = minHeightPx ?? 1122;

  // ─── Optionale Felder (Ort, Schwerpunkt) nur auf Klick einblenden ─────────
  //
  // FEATURE (auf Quentins Wunsch): vorher reservierte ein leeres Ort-/
  // Schwerpunkt-Feld KEINE eigene Zeile mehr (das war schon gefixt), aber
  // solange es leer war, gab es auch keine Möglichkeit, es wieder
  // hinzuzufügen — das Feld tauchte erst nach einem Datenimport wieder auf.
  // Jetzt: ein kleiner "+"-Button neben der Firma/Institution blendet das
  // leere Feld gezielt ein (rein lokaler UI-Zustand, `pdf-hidden` — taucht
  // im PDF nie auf, dort gilt weiterhin: leer = kein Platzverbrauch, also
  // automatisch kleinere Kacheln, wenn niemand die Zusatzfelder befüllt).
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const reveal = (key: string) => setRevealed((prev) => new Set(prev).add(key));

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
        width: '14px',
        height: '14px',
        marginLeft: '6px',
        verticalAlign: 'middle',
        border: `1px dashed ${t.border}`,
        borderRadius: '3px',
        background: 'transparent',
        color: t.faint,
        cursor: 'pointer',
        padding: 0,
        lineHeight: 1,
      }}
    >
      <Plus size={10} />
    </button>
  );

  const findSectionIndex = (type: string) => sections.findIndex((s) => s.type === type);

  const experienceIndex = findSectionIndex('experience');
  const educationIndex = findSectionIndex('education');
  const projectsIndex = findSectionIndex('projects');
  const languagesIndex = findSectionIndex('languages');
  const workValuesIndex = findSectionIndex('work_values');

  // ─── Bullets ───────────────────────────────────────────────────────────────
  //
  // BUG (fehlender erster Bulletpoint): `description` und `bulletPoints` sind
  // aus Sicht der Nutzerin EINE Liste ("meine Aufgaben/Erfolge"), technisch
  // aber zwei getrennte Felder — häufig landet (aus Import/KI-Generierung)
  // der erste Punkt in `description`, der Rest in `bulletPoints`. Vorher
  // rendere Classic `description` als eigenen, NICHT gebulleteten Absatz
  // direkt über der gebulleteten `bulletPoints`-Liste — sichtbares Ergebnis:
  // der erste Punkt hat keinen Punkt davor, alle folgenden schon.
  // Minimal/Professional/Creative behandeln beide Felder bereits einheitlich
  // (bulletPoints, sonst zeilenweise aufgeteiltes description) — dieselbe
  // Logik jetzt auch hier, statt description separat zu rendern.
  const getBullets = (item: any): string[] => {
    const raw = Array.isArray(item?.bulletPoints) && item.bulletPoints.length > 0
      ? item.bulletPoints
      : Array.isArray(item?.bullet_points) && item.bullet_points.length > 0
      ? item.bullet_points
      : typeof item?.description === 'string' && item.description.trim()
      ? item.description.split('\n')
      : [];
    return raw
      .map((s: any) => String(s ?? '').replace(/^[-•*]\s*/, '').trim())
      .filter(Boolean);
  };

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
      className="text-right flex-shrink-0 leading-tight font-semibold"
      style={{ fontSize: '9px', color: t.accent, width: '128px' }}
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
            <div
              key={idx}
              data-pdf-section
              data-break-item
              style={{ ...cardWrapper, cursor: onReorderSectionItem ? 'grab' : undefined }}
              {...itemDragProps(experienceIndex, idx, onReorderSectionItem)}
            >
              <ItemDragHandle sectionIndex={experienceIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
              <div className="flex items-baseline justify-between gap-3">
                {/* flex-1 auf einen Wrapper-Div, NICHT auf das EditableText
                    selbst — sonst darf Flexbox es bei langen Titeln auf
                    Zeichenbreite schrumpfen. Bewusst OHNE min-w-0 — siehe
                    die ausführliche Begründung bei Ausbildung/degree unten:
                    mit min-w-0 + overflow-wrap:break-word im EditableText
                    (wrap-Modus) behandeln Browser das Flex-Minimum wie bei
                    'anywhere' und der Text kollabiert doch wieder. */}
                <div className="flex-1">
                  <EditableText
                    value={item.title}
                    onChange={(val) => onUpdateSectionItem(experienceIndex, idx, 'title', val)}
                    className="font-bold leading-tight"
                    style={{ fontSize: '11px', color: t.text }}
                    placeholder="Position / Rolle"
                    wrap
                  />
                </div>
                {renderDateRange(experienceIndex, idx, item)}
              </div>

              <div className="flex items-center mt-0.5">
                <EditableText
                  value={item.company}
                  onChange={(val) => onUpdateSectionItem(experienceIndex, idx, 'company', val)}
                  className="font-semibold leading-snug"
                  style={{ fontSize: '10px', color: t.muted }}
                  placeholder="Unternehmen"
                />
                {/* Nur der Button ist immer da (pdf-hidden) — das Ort-Feld
                    selbst erst nach Klick oder wenn schon befüllt. Löst
                    beides: keine Löcher durch leere Placeholder-Zeilen UND
                    das Feld bleibt trotzdem erreichbar, statt für immer zu
                    verschwinden. */}
                {!(item.location || item.ort) && !revealed.has(`exp-${idx}-location`) && (
                  <AddFieldButton label="Ort hinzufügen" onClick={() => reveal(`exp-${idx}-location`)} />
                )}
              </div>

              {(item.location || item.ort || revealed.has(`exp-${idx}-location`)) && (
                <EditableText
                  value={item.location || item.ort || ''}
                  onChange={(val) => onUpdateSectionItem(experienceIndex, idx, 'location', val)}
                  className="leading-snug mt-0.5"
                  style={{ fontSize: '9.5px', color: t.faint }}
                  placeholder="Ort"
                />
              )}

              {renderBulletPoints(getBullets(item), experienceIndex, idx)}

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
  //
  // FIX (Absturz + vertikales Stapeln + Dublette):
  //  1. Es standen ZWEI Abschluss-Felder übereinander. Das erste referenzierte
  //     `style={titleStyle}` — eine Variable, die nirgends definiert war →
  //     `ReferenceError: titleStyle is not defined` beim Mount des Templates.
  //  2. Der Ersatz-Fix hatte das Feld mit `flex-1 min-w-0` in die Flex-Zeile
  //     gelegt. Zusammen mit `overflowWrap: 'anywhere'` am Root-Container (siehe
  //     unten) kollabierte die min-content-Breite auf ein Zeichen und das Feld
  //     stapelte vertikal ("A b s c h l u s s …").
  // Jetzt: EIN Abschluss-Feld in der Flex-Zeile neben dem Datum, mit `wrap`.
  // Der Root-Container nutzt jetzt `overflowWrap: 'break-word'` (wie Minimal),
  // wodurch `min-w-0` gefahrlos ist: das Feld nimmt den verfügbaren Platz und
  // bricht lange Studiengänge normal um, statt zu kollabieren.
  //
  // Zusätzlich: das `institution`-Feld war nie gerendert, obwohl der Mapper es
  // befüllt. Es sitzt jetzt zwischen Abschluss und Ort — analog zu `company`
  // in der Berufserfahrung.
  const renderEducation = () => {
    if (educationIndex === -1) return null;
    const items = sections[educationIndex].items ?? [];
    if (!items.length) return null;

    return (
      <div>
        <MainTitle>Ausbildung / Studium</MainTitle>
        <div className="space-y-5">
          {items.map((item: any, idx: number) => (
            <div
              key={idx}
              data-pdf-section
              data-break-item
              style={{ ...cardWrapper, cursor: onReorderSectionItem ? 'grab' : undefined }}
              {...itemDragProps(educationIndex, idx, onReorderSectionItem)}
            >
              <ItemDragHandle sectionIndex={educationIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
              <div className="flex items-baseline justify-between gap-3">
                {/* MAXIMAL STABIL: KEIN min-w-0. Ein Flex-Feld mit min-w-0 darf
                    unter seine min-content-Breite (= längstes Wort) schrumpfen —
                    genau das erlaubt das zeichenweise Stapeln. Ohne min-w-0
                    floored das Feld auf Wortbreite und bricht höchstens zwischen
                    Wörtern um. Exakt das Muster der Berufserfahrung, die nie
                    gestapelt hat. Das Datum daneben ist mit `w-32` fest, kann das
                    Feld also nicht quetschen. */}
                {/* WARUM NUR CLASSIC STAPELTE: hier war das EditableText SELBST
                    ein flex-1-Item — Flexbox darf es auf seine min-content-Breite
                    (im wrap-Modus = 1 Zeichen) schrumpfen → zeichenweises Stapeln.
                    Minimal legt das Feld dagegen in einen flex-1-Wrapper und lässt
                    das EditableText ein normaler Block sein (füllt 100%, kann nicht
                    kollabieren). Exakt diese Struktur übernehmen wir jetzt. */}
                <div className="flex-1">
                  <EditableText
                    value={item.degree || item.title || ''}
                    onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'degree', val)}
                    className="font-bold leading-tight"
                    style={{ fontSize: '11px', color: t.text }}
                    placeholder="Abschluss / Studiengang"
                    wrap
                  />
                </div>
                {renderDateRange(educationIndex, idx, item)}
              </div>

              {/* Alle drei Felder unten nur rendern, wenn befüllt — leere
                  Felder reservierten sonst je eine eigene Zeile mit
                  Placeholder und rissen sichtbare Löcher in die Karte. */}
              {item.institution && (
                <div className="flex items-center mt-0.5">
                  <EditableText
                    value={item.institution || ''}
                    onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'institution', val)}
                    className="font-semibold leading-snug"
                    style={{ fontSize: '10px', color: t.muted, width: '100%', whiteSpace: 'normal', wordBreak: 'normal', overflowWrap: 'break-word', overflow: 'visible' }}
                    placeholder="Institution / Hochschule"
                    wrap
                  />
                  {!item.location && !revealed.has(`edu-${idx}-location`) && (
                    <AddFieldButton label="Ort hinzufügen" onClick={() => reveal(`edu-${idx}-location`)} />
                  )}
                  {!item.description && !revealed.has(`edu-${idx}-description`) && (
                    <AddFieldButton label="Schwerpunkte hinzufügen" onClick={() => reveal(`edu-${idx}-description`)} />
                  )}
                </div>
              )}

              {(item.location || revealed.has(`edu-${idx}-location`)) && (
                <EditableText
                  value={item.location || ''}
                  onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'location', val)}
                  className="leading-snug mt-0.5"
                  style={{ fontSize: '9.5px', color: t.faint }}
                  placeholder="Ort"
                />
              )}

              {/* Anders als Berufserfahrung/Projekte bleibt "Schwerpunkte /
                  Beschreibung" bei Ausbildung ein eigenes, nicht gebullettes
                  Feld — analog zu Modern (siehe dort: keepDescription).
                  bulletPoints kommt separat dazu, für konkrete Einzelpunkte. */}
              {(item.description || revealed.has(`edu-${idx}-description`)) && (
                <EditableText
                  value={(item.description || '').replace(/^[-•*]\s*/, '')}
                  onChange={(val) => onUpdateSectionItem(educationIndex, idx, 'description', val)}
                  className="leading-snug mt-1.5"
                  style={{ fontSize: '9.5px', color: t.muted }}
                  multiline
                  placeholder="Schwerpunkte / Beschreibung"
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
            <div
              key={idx}
              data-pdf-section
              data-break-item
              style={{ ...cardWrapper, cursor: onReorderSectionItem ? 'grab' : undefined }}
              {...itemDragProps(projectsIndex, idx, onReorderSectionItem)}
            >
              <ItemDragHandle sectionIndex={projectsIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
              <EditableText
                value={item.title}
                onChange={(val) => onUpdateSectionItem(projectsIndex, idx, 'title', val)}
                className="font-bold leading-tight"
                style={{ fontSize: '11px', color: t.text }}
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
  //
  // FRÜHER: `skillLevelToStars()` verglich das Niveau gegen eine Liste exakter
  // Strings. "Muttersprache" traf und ergab fünf Sterne. "Verhandlungssicher (C1)"
  // traf nicht, ergab 0 — und dann rendete das Template stattdessen einen
  // navyfarbenen Textlabel. Zwei Sprachen untereinander sahen dadurch
  // unterschiedlich aus, obwohl beide ein Niveau hatten.
  //
  // JETZT: durchgehend Textlabels. Sprache in `t.text`, Niveau in `t.muted` —
  // konsistent mit Minimal und Kreativ. Wer die Sterne zurück will, braucht
  // zuerst eine robuste Niveau-Erkennung (CEFR-Regex statt String-Gleichheit),
  // sonst kehrt genau dieser Fehler zurück.
  const renderLanguages = () => {
    if (languagesIndex === -1) return null;
    const items = sections[languagesIndex].items ?? [];
    if (!items.length) return null;

    return (
      <div className="mb-6" data-pdf-section data-break-atomic {...dragProps(languagesIndex, onReorderSections)} style={{ position: 'relative', cursor: onReorderSections ? 'grab' : undefined }}>
        <SectionDragHandle index={languagesIndex} onReorderSections={onReorderSections} />
        <AsideTitle>Sprachen</AsideTitle>
        <ul className="space-y-2">
          {items.map((item: any, idx: number) => {
            const language = stripSectionLabel(item.language || item.name || item.sprache || item.skill || item.label || '');
            const level = item.level || item.niveau || item.proficiency || '';
            if (!language && !level) return null;

            return (
              <li
                key={idx}
                className="flex flex-nowrap justify-between items-center gap-2"
                style={{ fontSize: '9px', position: 'relative', cursor: onReorderSectionItem ? 'grab' : undefined }}
                {...itemDragProps(languagesIndex, idx, onReorderSectionItem)}
              >
                <ItemDragHandle sectionIndex={languagesIndex} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                <div className="flex-1">
                  <EditableText
                    value={language}
                    onChange={(val) => onUpdateSectionItem(languagesIndex, idx, 'language', val)}
                    className="font-medium"
                    style={{ fontSize: '9px', color: t.text }}
                    placeholder="Sprache"
                    wrap
                  />
                </div>
                <EditableText
                  value={level}
                  onChange={(val) => onUpdateSectionItem(languagesIndex, idx, 'level', val)}
                  className="font-medium text-right flex-shrink-0"
                  // FIX (Zeilenumbruch bei "Grundkenntnisse"): eine feste
                  // width:68px war für längere Niveau-Wörter zu schmal und
                  // erzwang mit `wrap` einen Umbruch auf zwei Zeilen. Jetzt
                  // ohne feste Breite (das Feld nimmt genau den Platz, den
                  // sein Text braucht) und explizit `nowrap` + sichtbarer
                  // Overflow statt Ellipsis — das Niveau bleibt garantiert in
                  // einer Zeile, die Sprache (flex-1) weicht stattdessen aus.
                  style={{ fontSize: '9px', color: t.muted, whiteSpace: 'nowrap', overflow: 'visible', textOverflow: 'unset' }}
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
      <div className="mb-6" data-pdf-section data-break-atomic {...dragProps(index, onReorderSections)} style={{ position: 'relative', cursor: onReorderSections ? 'grab' : undefined }}>
        <SectionDragHandle index={index} onReorderSections={onReorderSections} />
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
                  marginLeft: onReorderSectionItem ? '10px' : undefined,
                  verticalAlign: 'middle',
                  padding: '3px 9px',
                  borderRadius: '4px',
                  background: t.chipBg,
                  border: `1px solid ${t.chipBorder}`,
                  lineHeight: 1.4,
                  whiteSpace: 'nowrap',
                  position: 'relative',
                  cursor: onReorderSectionItem ? 'grab' : undefined,
                }}
                {...itemDragProps(index, idx, onReorderSectionItem)}
              >
                <ItemDragHandle sectionIndex={index} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
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

  // ─── Eine Seitenspalten-Sektion (Zertifikate, Stipendien, Ehrenamt, …) ────
  //
  // FIX (Blöcke ließen sich nicht verschieben): Diese Funktion rendert jetzt
  // GENAU EINE Sektion an ihrem tatsächlichen `index` in `sections` — vorher
  // iterierte sie selbst über ALLE Sektionen und wurde dabei immer NACH
  // Fähigkeiten/Soft Skills/Sprachen aufgerufen (siehe renderAsideSections
  // unten). Das Drag&Drop aktualisierte zwar `sections`, aber die Reihenfolge
  // auf dem Papier blieb: Fähigkeiten → Soft Skills → Sprachen → Zertifikate/
  // Stipendien/Ehrenamt, IMMER in dieser Gruppen-Reihenfolge. Jetzt bestimmt
  // ausschließlich die Position in `sections` die Position auf der Seite.
  //
  // FEATURE (Zeitspanne + Ort nachträglich ergänzbar): Zertifikate, Stipendien
  // und Ehrenamt haben nicht immer von Anfang an einen Ort oder Zeitraum.
  // Analog zum "+"-Muster bei Berufserfahrung/Ausbildung blendet ein kleiner
  // "+"-Button das jeweilige Feld gezielt ein, statt es dauerhaft leer
  // vorzuhalten.
  const renderSidebarSection = (section: any, index: number) => {
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
        style={{ position: 'relative', cursor: onReorderSections ? 'grab' : undefined }}
      >
        <SectionDragHandle index={index} onReorderSections={onReorderSections} />
        <AsideTitle>{label}</AsideTitle>
        <div>
          {items.map((item: any, idx: number) => {
            const name = item.name || item.title || item.label || item.degree || '';
            const institution = item.institution || item.issuer || item.company || item.organization || '';
            // Zeitspanne: entweder bereits als fertiger String (`date`) oder
            // aus getrennten Feldern (date_from/date_to bzw. startDate/
            // endDate, z. B. aus dem Ehrenamt-Schritt) zusammengesetzt.
            const rangeFrom = item.date_from || item.startDate || '';
            const rangeTo = item.current ? 'Heute' : (item.date_to || item.endDate || '');
            const composedRange = rangeFrom && rangeTo ? `${rangeFrom} – ${rangeTo}` : rangeFrom;
            const dateValue = item.date || composedRange || item.year || '';
            const location = item.location || item.ort || '';
            const itemKey = `sidebar-${index}-${idx}`;
            const showLocationBtn = !location && !revealed.has(`${itemKey}-location`);
            const showRangeBtn = !dateValue && !revealed.has(`${itemKey}-zeitraum`);

            return (
              <div
                key={idx}
                style={{ display: 'block', marginBottom: '6px', position: 'relative', cursor: onReorderSectionItem ? 'grab' : undefined }}
                {...itemDragProps(index, idx, onReorderSectionItem)}
              >
                <ItemDragHandle sectionIndex={index} itemIndex={idx} onReorderSectionItem={onReorderSectionItem} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                  {/* FIX (abgeschnittene Zertifikate/Weiterbildungen): `flex: 1,
                      minWidth: 0` erlaubte diesem Wrapper, unter die
                      Inhaltsbreite zu schrumpfen — kombiniert mit dem
                      FEHLENDEN `wrap` auf den EditableTexts unten (Default:
                      nowrap + overflow:hidden + ellipsis) wurde jeder etwas
                      längere Name/Titel einfach mit "…" abgeschnitten statt
                      umzubrechen. Jetzt: kein min-w-0 (Feld darf nicht unter
                      seine Wortbreite schrumpfen, siehe Ausbildung/degree
                      oben) + `wrap` auf beiden Feldern, exakt das gleiche
                      Muster wie bei Berufserfahrung/Ausbildung. */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '9.5px' }}>
                      <EditableText
                        value={name}
                        onChange={(val) => onUpdateSectionItem(index, idx, 'name', val)}
                        style={{ color: t.text }}
                        placeholder="Name/Titel"
                        wrap
                      />
                    </div>
                    {institution && (
                      <div style={{ marginTop: '2px' }}>
                        <EditableText
                          value={institution}
                          onChange={(val) => onUpdateSectionItem(index, idx, 'institution', val)}
                          style={{ fontSize: '9px', color: t.muted }}
                          placeholder="Institution"
                          wrap
                        />
                      </div>
                    )}
                  </div>
                  {dateValue && (
                    <div style={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
                      <EditableText
                        value={dateValue}
                        onChange={(val) => onUpdateSectionItem(index, idx, 'date', val)}
                        className="text-right"
                        style={{ fontSize: '9px', color: t.muted }}
                        placeholder="Datum"
                      />
                    </div>
                  )}
                </div>

                {(showLocationBtn || showRangeBtn) && (
                  <div className="flex items-center gap-1 mt-1">
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
                    onChange={(val) => onUpdateSectionItem(index, idx, 'location', val)}
                    style={{ fontSize: '9px', color: t.faint, marginTop: '2px' }}
                    placeholder="Ort"
                  />
                )}

                {(!dateValue && revealed.has(`${itemKey}-zeitraum`)) && (
                  <EditableText
                    value=""
                    onChange={(val) => onUpdateSectionItem(index, idx, 'date', val)}
                    style={{ fontSize: '9px', color: t.muted, marginTop: '2px' }}
                    placeholder="z.B. 03/2022 – 06/2022"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── Seitenspalte: Reihenfolge folgt strikt `sections` ────────────────────
  // Fähigkeiten, Soft Skills, Sprachen und die Zertifikate/Stipendien/
  // Ehrenamt-Blöcke landen alle hier — welcher zuerst kommt, entscheidet
  // ausschließlich ihre Position in `sections`, nicht mehr eine feste
  // Aufrufreihenfolge im Code. Dadurch funktioniert Drag&Drop endlich für
  // ALLE vier Blocktypen gleichermaßen.
  const ASIDE_TYPES = ['skills', 'soft_skills', 'languages', ...SIDEBAR_TYPES];
  const renderAsideSections = () =>
    sections.map((section, index) => {
      if (!ASIDE_TYPES.includes(section.type)) return null;
      if (section.type === 'skills') return <React.Fragment key={index}>{renderChipSection('Fähigkeiten', index)}</React.Fragment>;
      if (section.type === 'soft_skills') return <React.Fragment key={index}>{renderChipSection('Soft Skills', index)}</React.Fragment>;
      if (section.type === 'languages') return <React.Fragment key={index}>{renderLanguages()}</React.Fragment>;
      return renderSidebarSection(section, index);
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
        // FIX (vertikales Buchstaben-Stapeln): `overflowWrap: 'anywhere'` senkt
        // die min-content-Breite jeder Box auf EIN Zeichen. Ein schrumpfbares
        // Flex-Kind (flex-1 + min-w-0) kollabiert dadurch auf Zeichenbreite und
        // stapelt vertikal. `break-word` bricht nur bei echtem Überlauf und
        // lässt die min-content-Breite intakt — identisch zum Minimal-Template,
        // das denselben Fix bereits trägt.
        wordBreak: 'normal',
        overflowWrap: 'break-word',
        border: `1px solid ${t.border}`,
      }}
    >
      <div className="w-full p-8">
        <div className="flex gap-8">

          {/* ── Linke Spalte ────────────────────────────────────────────────
              Hinweis zur Paginierung: die Break-Engine sammelt Verbotszonen aus
              BEIDEN Spalten. Ein Schnitt, der in der Hauptspalte zwischen zwei
              Stationen läge, aber quer durch den Sprachenblock der Seitenspalte
              ginge, wird deshalb verworfen. Das ist gewollt — kann aber dazu
              führen, dass eine Seite früher endet als technisch nötig.

              FIX (Wortweiser Umbruch bei Ausbildung/Berufserfahrung):
              `aside` hatte KEIN `min-w-0`. Ein Flex-Item ohne min-w-0 darf
              nicht unter seine content-basierte Mindestbreite schrumpfen —
              und genau die wurde durch die `nowrap`-Kontaktfelder (E-Mail,
              LinkedIn, Telefon) in der Sidebar hochgezogen: ein langer,
              unumbrechbarer Text dort zählt als Mindestbreite von `aside`,
              selbst wenn er selbst durch overflow:hidden abgeschnitten wird.
              Ist die E-Mail/LinkedIn-URL länger als 33% der Seite, wollte
              `aside` mehr Platz, als ihm zusteht. Da `main` bereits
              `min-w-0` trägt (unten), gab `main` nach und schrumpfte —
              wodurch Titel wie "Digital Engineering and Management (B.Eng.)"
              in der Hauptspalte auf eine winzige Breite gequetscht wurden
              und Wort für Wort umbrachen. Modern und Professional setzen an
              der analogen Stelle bereits `minWidth: 0` auf ihrem `aside` —
              hier fehlte das Pendant. Mit `min-w-0` schrumpft `aside` jetzt
              zuverlässig auf sein Drittel, und die Kontaktfelder kürzen sich
              stattdessen selbst per Ellipsis (bereits vorhanden). */}
          <aside className="w-1/3 max-w-[33%] pr-6 flex flex-col min-w-0" style={{ borderRight: `1px solid ${t.border}` }}>
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
                <div className="flex items-center justify-center gap-1 mt-1.5">
                  <EditableText
                    value={personalInfo.title}
                    onChange={(val) => onUpdatePersonalInfo('title', val)}
                    className="font-bold text-center uppercase tracking-widest"
                    style={{ fontSize: '12px', color: t.muted }}
                    placeholder="Berufsbezeichnung"
                    multiline
                  />
                  {!personalInfo.location && !revealed.has('header-location') && (
                    <AddFieldButton label="Ort hinzufügen" onClick={() => reveal('header-location')} />
                  )}
                </div>
                {(personalInfo.location || revealed.has('header-location')) && (
                  <EditableText
                    value={personalInfo.location || ''}
                    onChange={(val) => onUpdatePersonalInfo('location', val)}
                    className="text-center mt-1"
                    style={{ fontSize: '9.5px', color: t.faint }}
                    placeholder="Ort"
                  />
                )}
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

            {renderAsideSections()}
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