import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface CertificateModule {
  title: string;
}

export interface CertificateData {
  recipient_name: string;
  target_job?: string;
  skill?: string | null;
  official_title?: string | null;
  mastered_skills: string[];
  modules?: CertificateModule[];
  total_hours?: number | null;
  period_start?: string | null;
  period_end?: string | null;
  completion_date: string;
  certificate_id: string;
  issuer: string;
  issuer_url?: string;
  issue_place?: string;
  dqr_reference?: string | null;
  /** Prüfungsergebnis in Prozent — erhöht die Aussagekraft gegenüber "bestanden". */
  final_score?: number | null;
  verification_footer?: string | null;
}

/* ── DYD Corporate Design ──
   Führend ist die Produktpalette aus der App (#30E3CA / #66c0b6).
   Nur diese fünf Konstanten anpassen, wenn das CD abweicht. */
const NAVY      = '#0A192F';   // Grundton, Text
const NAVY_SOFT = '#3B4A63';   // Sekundärtext
const TEAL      = '#30E3CA';   // Signaturfarbe
const TEAL_DEEP = '#66C0B6';   // Sekundärakzent
const RULE      = '#DCE3EC';
const MUTED     = '#6B7280';
const PAPER     = '#F5FAF9';   // leicht ins Teal gezogenes Papier

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    color: NAVY,
  },

  /* Navy-Kante links mit Teal-Akzent — Leserichtung ohne Rahmen-Kitsch */
  spine: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: 18,
    backgroundColor: NAVY,
  },
  spineAccent: {
    position: 'absolute',
    top: 0, bottom: 0, left: 18,
    width: 4,
    backgroundColor: TEAL,
  },

  content: {
    marginTop: 30,
    marginRight: 38,
    marginBottom: 26,
    marginLeft: 56,
    flexDirection: 'column',
    flexGrow: 1,
  },

  /* ── Kopf ── */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    borderBottomStyle: 'solid',
  },
  orgName: {
    fontSize: 12,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    letterSpacing: 0.8,
  },
  orgSub: {
    fontSize: 8,
    color: MUTED,
    marginTop: 2,
    letterSpacing: 0.3,
  },
  headRight: { flexDirection: 'column', alignItems: 'flex-end' },
  eyebrow: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: TEAL_DEEP,
    letterSpacing: 1.6,
  },
  headId: { fontSize: 7.5, color: MUTED, marginTop: 3 },

  /* ── Titelblock ── */
  title: {
    fontSize: 30,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    letterSpacing: 2.4,
    marginTop: 22,
  },
  titleRule: {
    height: 3,
    width: 96,
    backgroundColor: TEAL,
    marginTop: 8,
  },

  lead: { fontSize: 9.5, color: MUTED, marginTop: 16 },
  recipient: {
    fontSize: 25,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginTop: 6,
  },
  body: { fontSize: 9.5, color: MUTED, marginTop: 12, lineHeight: 1.5 },
  skillLine: {
    fontSize: 15,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    marginTop: 5,
  },

  /* ── Spalten ── */
  columns: { flexDirection: 'row', marginTop: 18 },
  col: {
    flexGrow: 1,
    flexBasis: 0,
    backgroundColor: PAPER,
    borderLeftWidth: 2,
    borderLeftColor: TEAL,
    borderLeftStyle: 'solid',
    paddingTop: 9,
    paddingBottom: 9,
    paddingLeft: 11,
    paddingRight: 11,
  },
  colSpacer: { width: 12 },
  colTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY_SOFT,
    letterSpacing: 1.1,
    marginBottom: 7,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: TEAL_DEEP,
    borderStyle: 'solid',
    borderRadius: 9,
    paddingTop: 3, paddingBottom: 3,
    paddingLeft: 7, paddingRight: 7,
    marginRight: 4, marginBottom: 4,
  },
  chipText: { fontSize: 7.5, color: NAVY },

  moduleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  moduleBullet: {
    width: 3, height: 3,
    backgroundColor: TEAL,
    marginTop: 4, marginRight: 6,
  },
  moduleText: { fontSize: 8, color: NAVY_SOFT, flexGrow: 1, flexBasis: 0 },

  /* ── Kennzahlenband ── */
  factBar: {
    flexDirection: 'row',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: RULE,
    borderTopStyle: 'solid',
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    borderBottomStyle: 'solid',
    paddingTop: 9,
    paddingBottom: 9,
  },
  fact: { flexGrow: 1, flexBasis: 0, paddingRight: 10 },
  factLabel: {
    fontSize: 6.8,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    letterSpacing: 0.9,
    marginBottom: 3,
  },
  factValue: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: NAVY },
  factValueAccent: { fontSize: 10.5, fontFamily: 'Helvetica-Bold', color: TEAL_DEEP },
  factNote: { fontSize: 7, color: MUTED, marginTop: 2 },

  /* ── Fuß ── */
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 'auto',
    paddingTop: 14,
  },
  footLeft: { flexGrow: 1, flexBasis: 0, paddingRight: 24 },
  disclaimer: { fontSize: 6.6, color: MUTED, lineHeight: 1.45 },
  footNote: { fontSize: 6.8, color: NAVY_SOFT, marginTop: 5 },

  sigBlock: { width: 190, alignItems: 'center' },
  sigLine: { width: 170, height: 1, backgroundColor: NAVY, marginBottom: 4 },
  sigName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: NAVY },
  sigRole: { fontSize: 7, color: MUTED, marginTop: 1 },
});

function formatDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatLongDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

interface CertificatePDFProps {
  certificate: CertificateData;
}

export function CertificatePDF({ certificate }: CertificatePDFProps) {
  const skills = (certificate.mastered_skills ?? []).filter(Boolean).slice(0, 12);
  const modules = (certificate.modules ?? []).slice(0, 6);

  // Start == Ende (alles an einem Tag) → nur ein Datum, kein "21.07. – 21.07."
  const startStr = formatDate(certificate.period_start);
  const endStr = formatDate(certificate.period_end ?? certificate.completion_date);
  const period =
    !certificate.period_start && !certificate.period_end
      ? formatDate(certificate.completion_date)
      : startStr === endStr
        ? endStr
        : `${startStr} – ${endStr}`;

  const hours =
    typeof certificate.total_hours === 'number' && certificate.total_hours > 0
      ? `${certificate.total_hours} Zeitstunden`
      : '—';

  const examResult =
    typeof certificate.final_score === 'number' && certificate.final_score > 0
      ? `bestanden · ${Math.round(certificate.final_score)} %`
      : 'bestanden';

  const measureTitle =
    certificate.official_title ||
    (certificate.skill ? `Lernpfad ${certificate.skill}` : 'Lernpfad');

  return (
    <Document
      title={`Zertifikat ${certificate.certificate_id}`}
      author={certificate.issuer}
      subject={measureTitle}
    >
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.spine} fixed />
        <View style={styles.spineAccent} fixed />

        <View style={styles.content}>
          {/* Kopf */}
          <View style={styles.header}>
            <View>
              <Text style={styles.orgName}>DYD — DECIDE YOUR DREAM</Text>
              <Text style={styles.orgSub}>
                Career Academy · {certificate.issuer_url || 'decide-your-dream.de'}
              </Text>
            </View>
            <View style={styles.headRight}>
              <Text style={styles.eyebrow}>ABSCHLUSSZERTIFIKAT</Text>
              <Text style={styles.headId}>Zertifikatsnummer {certificate.certificate_id}</Text>
              {certificate.dqr_reference ? (
                <Text style={styles.headId}>DQR-Referenz {certificate.dqr_reference}</Text>
              ) : null}
            </View>
          </View>

          {/* Titel */}
          <Text style={styles.title}>ZERTIFIKAT</Text>
          <View style={styles.titleRule} />

          <Text style={styles.lead}>Hiermit wird bescheinigt, dass</Text>
          <Text style={styles.recipient}>{certificate.recipient_name}</Text>

          <Text style={styles.body}>den Lernpfad zur Kompetenz</Text>
          <Text style={styles.skillLine}>
            {certificate.skill || certificate.official_title || 'Lernpfad'}
          </Text>
          <Text style={styles.body}>
            erfolgreich abgeschlossen, alle Lerneinheiten absolviert und die Abschlussprüfung
            bestanden hat.
          </Text>

          {/* Kompetenzen + Lerneinheiten */}
          <View style={styles.columns}>
            <View style={styles.col}>
              <Text style={styles.colTitle}>ERWORBENE KOMPETENZEN</Text>
              {skills.length > 0 ? (
                <View style={styles.chipRow}>
                  {skills.map((skill, i) => (
                    <View key={`${skill}-${i}`} style={styles.chip}>
                      <Text style={styles.chipText}>{skill}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.moduleText}>{certificate.skill || 'Lernpfad'}</Text>
              )}
            </View>

            <View style={styles.colSpacer} />

            <View style={styles.col}>
              <Text style={styles.colTitle}>ABSOLVIERTE LERNEINHEITEN</Text>
              {modules.length > 0 ? (
                modules.map((mod, i) => (
                  <View key={`${mod.title}-${i}`} style={styles.moduleRow}>
                    <View style={styles.moduleBullet} />
                    <Text style={styles.moduleText}>{mod.title}</Text>
                  </View>
                ))
              ) : (
                <Text style={styles.moduleText}>Alle Lerneinheiten des Lernpfads</Text>
              )}
            </View>
          </View>

          {/* Kennzahlen */}
          <View style={styles.factBar}>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>LERNUMFANG</Text>
              <Text style={styles.factValue}>{hours}</Text>
              <Text style={styles.factNote}>Selbstlernzeit inkl. Prüfungen</Text>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>ZEITRAUM</Text>
              <Text style={styles.factValue}>{period}</Text>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>ABSCHLUSSPRÜFUNG</Text>
              <Text style={styles.factValueAccent}>{examResult}</Text>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>AUSGESTELLT AM</Text>
              <Text style={styles.factValue}>{formatLongDate(certificate.completion_date)}</Text>
              <Text style={styles.factNote}>{certificate.issue_place || 'Düsseldorf'}</Text>
            </View>
          </View>

          {/* Fuß — Verify-URL entfernt, solange /verify nicht existiert */}
          <View style={styles.footer}>
            <View style={styles.footLeft}>
              <Text style={styles.disclaimer}>
                Das Zertifikat dokumentiert die erfolgreiche Teilnahme an einem digitalen Lernpfad
                der DYD Career Academy sowie das Bestehen der zugehörigen Abschlussprüfung. Es ist
                kein staatlich anerkannter Berufs- oder Bildungsabschluss.
              </Text>
              <Text style={styles.footNote}>
                Zertifikatsnummer {certificate.certificate_id} · Rückfragen zur Echtheit an{' '}
                {certificate.issuer_url || 'decide-your-dream.de'}
              </Text>
              {certificate.verification_footer ? (
                <Text style={styles.footNote}>{certificate.verification_footer}</Text>
              ) : null}
            </View>

            <View style={styles.sigBlock}>
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>{certificate.issuer}</Text>
              <Text style={styles.sigRole}>Leitung Career Academy</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default CertificatePDF;