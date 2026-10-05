import { Document, Page, Text, View, Image, StyleSheet } from '@react-pdf/renderer';

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
  /** true = Richtwert (nicht gemessen) → wird als "ca." gedruckt */
  hours_estimated?: boolean;
  period_start?: string | null;
  period_end?: string | null;
  /** Tag der bestandenen Abschlussprüfung (= Ausstellungsdatum) */
  completion_date: string;
  certificate_id: string;
  issuer: string;
  issuer_url?: string;
  issue_place?: string;
  dqr_reference?: string | null;
  /** Prüfungsergebnis in Prozent — erhöht die Aussagekraft gegenüber "bestanden". */
  final_score?: number | null;
  question_count?: number | null;
  verification_footer?: string | null;
  /** Öffentliche Prüfseite (wird als QR-Code und Text gedruckt) */
  verify_url?: string | null;
  /** QR-Code als PNG-Data-URL */
  qr_data_url?: string | null;
  /** Logo als PNG-Data-URL (optional) */
  logo_data_url?: string | null;
  signatory_name?: string;
  signatory_role?: string;
}

/* ── DYD Corporate Design ──
   Führend ist die Produktpalette aus der App (#30E3CA / #66c0b6). */
const NAVY      = '#0A192F';
const NAVY_SOFT = '#3B4A63';
const TEAL      = '#30E3CA';
const TEAL_DEEP = '#2BA597';
const RULE      = '#DCE3EC';
const MUTED     = '#6B7280';
const PAPER     = '#F5FAF9';

const styles = StyleSheet.create({
  page: { padding: 0, backgroundColor: '#FFFFFF', fontFamily: 'Helvetica', color: NAVY },

  spine: { position: 'absolute', top: 0, bottom: 0, left: 0, width: 18, backgroundColor: NAVY },
  spineAccent: { position: 'absolute', top: 0, bottom: 0, left: 18, width: 4, backgroundColor: TEAL },

  content: { marginTop: 30, marginRight: 40, marginBottom: 26, marginLeft: 58, flexDirection: 'column', flexGrow: 1 },

  /* Kopf */
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: RULE, borderBottomStyle: 'solid',
  },
  brand: { flexDirection: 'row', alignItems: 'center' },
  logo: { width: 30, height: 30, marginRight: 9 },
  orgName: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: NAVY, letterSpacing: 0.8 },
  orgSub: { fontSize: 8, color: MUTED, marginTop: 2, letterSpacing: 0.3 },
  headRight: { flexDirection: 'column', alignItems: 'flex-end' },
  eyebrow: { fontSize: 7, fontFamily: 'Helvetica-Bold', color: TEAL_DEEP, letterSpacing: 1.4 },
  headId: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 2, letterSpacing: 0.4 },
  headSub: { fontSize: 7, color: MUTED, marginTop: 2 },

  /* Titel */
  title: { fontSize: 32, fontFamily: 'Helvetica-Bold', color: NAVY, letterSpacing: 2.6, marginTop: 24 },
  titleRule: { height: 3, width: 96, backgroundColor: TEAL, marginTop: 8 },

  lead: { fontSize: 10, color: MUTED, marginTop: 18 },
  recipient: { fontSize: 27, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 6 },
  body: { fontSize: 10, color: MUTED, marginTop: 13, lineHeight: 1.5 },
  skillLine: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 5 },

  /* Spalten */
  columns: { flexDirection: 'row', marginTop: 20 },
  col: {
    flexGrow: 1, flexBasis: 0, backgroundColor: PAPER,
    borderLeftWidth: 2, borderLeftColor: TEAL, borderLeftStyle: 'solid',
    paddingTop: 10, paddingBottom: 10, paddingLeft: 12, paddingRight: 12,
  },
  colSpacer: { width: 12 },
  colTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: NAVY_SOFT, letterSpacing: 1.1, marginBottom: 7 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#66C0B6', borderStyle: 'solid', borderRadius: 9,
    paddingTop: 3, paddingBottom: 3, paddingLeft: 7, paddingRight: 7, marginRight: 4, marginBottom: 4,
  },
  chipText: { fontSize: 7.8, color: NAVY },
  moduleRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  moduleBullet: { width: 3, height: 3, backgroundColor: TEAL, marginTop: 4, marginRight: 6 },
  moduleText: { fontSize: 8.2, color: NAVY_SOFT, flexGrow: 1, flexBasis: 0 },

  /* Kennzahlen */
  factBar: {
    flexDirection: 'row', marginTop: 18,
    borderTopWidth: 1, borderTopColor: RULE, borderTopStyle: 'solid',
    borderBottomWidth: 1, borderBottomColor: RULE, borderBottomStyle: 'solid',
    paddingTop: 10, paddingBottom: 10,
  },
  fact: { flexGrow: 1, flexBasis: 0, paddingRight: 10 },
  factLabel: { fontSize: 6.8, fontFamily: 'Helvetica-Bold', color: MUTED, letterSpacing: 0.9, marginBottom: 3 },
  factValue: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY },
  factValueAccent: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: TEAL_DEEP },
  factNote: { fontSize: 7, color: MUTED, marginTop: 2 },

  /* Fuß */
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 14 },
  footLeft: { flexGrow: 1, flexBasis: 0, paddingRight: 22 },
  disclaimer: { fontSize: 6.6, color: MUTED, lineHeight: 1.45 },
  footNote: { fontSize: 7, color: NAVY_SOFT, marginTop: 5 },
  footLink: { fontSize: 7, color: TEAL_DEEP, fontFamily: 'Helvetica-Bold', marginTop: 2 },

  sigBlock: { width: 175, alignItems: 'center', marginRight: 18 },
  sigLine: { width: 160, height: 1, backgroundColor: NAVY, marginBottom: 4 },
  sigName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: NAVY },
  sigRole: { fontSize: 7, color: MUTED, marginTop: 1 },

  qrBlock: { width: 74, alignItems: 'center' },
  qr: { width: 66, height: 66 },
  qrCaption: { fontSize: 6.2, color: MUTED, marginTop: 3, textAlign: 'center' },
});

function formatLongDate(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'long', year: 'numeric' });
}

/** Kurzform der Prüf-URL für den Text (ohne https://) */
function shortUrl(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

interface CertificatePDFProps {
  certificate: CertificateData;
}

export function CertificatePDF({ certificate }: CertificatePDFProps) {
  const skills = (certificate.mastered_skills ?? []).filter(Boolean).slice(0, 12);
  const modules = (certificate.modules ?? []).slice(0, 7);

  // Start == Ende (alles an einem Tag) → nur ein Datum
  const score = typeof certificate.final_score === 'number' && certificate.final_score > 0
    ? Math.round(certificate.final_score)
    : null;
  const examResult = score != null ? `bestanden · ${score} %` : 'bestanden';
  const examNote = certificate.question_count
    ? `${certificate.question_count} Fragen – Bestehensgrenze 80 %`
    : 'Bestehensgrenze 80 %';

  const measureTitle = certificate.official_title || certificate.skill || 'Lernpfad';
  const site = certificate.issuer_url || 'decide-your-dream.de';
  const signatory = certificate.signatory_name || 'Quentin Sunderbrink';
  const signatoryRole = certificate.signatory_role || 'Founder & CEO, DYD Career Academy';

  return (
    <Document title={`Zertifikat ${certificate.certificate_id}`} author={certificate.issuer} subject={measureTitle}>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.spine} fixed />
        <View style={styles.spineAccent} fixed />

        <View style={styles.content}>
          {/* Kopf */}
          <View style={styles.header}>
            <View style={styles.brand}>
              {certificate.logo_data_url ? <Image src={certificate.logo_data_url} style={styles.logo} /> : null}
              <View>
                <Text style={styles.orgName}>DYD — DECIDE YOUR DREAM</Text>
                <Text style={styles.orgSub}>Career Academy · {site}</Text>
              </View>
            </View>
            <View style={styles.headRight}>
              <Text style={styles.eyebrow}>ZERTIFIKATSNUMMER</Text>
              <Text style={styles.headId}>{certificate.certificate_id}</Text>
              {certificate.dqr_reference ? (
                <Text style={styles.headSub}>DQR-Referenz {certificate.dqr_reference}</Text>
              ) : null}
            </View>
          </View>

          {/* Titel */}
          <Text style={styles.title}>ZERTIFIKAT</Text>
          <View style={styles.titleRule} />

          <Text style={styles.lead}>Hiermit wird bescheinigt, dass</Text>
          <Text style={styles.recipient}>{certificate.recipient_name}</Text>

          <Text style={styles.body}>den Lernpfad zur Kompetenz</Text>
          <Text style={styles.skillLine}>{measureTitle}</Text>
          <Text style={styles.body}>
            erfolgreich abgeschlossen, alle Lerneinheiten absolviert und die Abschlussprüfung bestanden hat.
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
                <Text style={styles.moduleText}>{measureTitle}</Text>
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
              <Text style={styles.factLabel}>ABSCHLUSSPRÜFUNG</Text>
              <Text style={styles.factValueAccent}>{examResult}</Text>
              <Text style={styles.factNote}>{examNote}</Text>
            </View>
            <View style={styles.fact}>
              <Text style={styles.factLabel}>ABGESCHLOSSEN AM</Text>
              <Text style={styles.factValue}>{formatLongDate(certificate.completion_date)}</Text>
              <Text style={styles.factNote}>{certificate.issue_place || 'Düsseldorf'}</Text>
            </View>
          </View>

          {/* Fuß */}
          <View style={styles.footer}>
            <View style={styles.footLeft}>
              <Text style={styles.disclaimer}>
                Das Zertifikat dokumentiert die erfolgreiche Teilnahme an einem digitalen Lernpfad der DYD Career
                Academy sowie das Bestehen der zugehörigen Abschlussprüfung. Es ist kein staatlich anerkannter
                Berufs- oder Bildungsabschluss.
              </Text>
              {certificate.verify_url ? (
                <>
                  <Text style={styles.footNote}>Echtheit prüfen (QR-Code scannen oder aufrufen):</Text>
                  <Text style={styles.footLink}>{shortUrl(certificate.verify_url)}</Text>
                </>
              ) : (
                <Text style={styles.footNote}>
                  Zertifikatsnummer {certificate.certificate_id} · Rückfragen zur Echtheit an {site}
                </Text>
              )}
              {certificate.verification_footer ? (
                <Text style={styles.footNote}>{certificate.verification_footer}</Text>
              ) : null}
            </View>

            <View style={styles.sigBlock}>
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>{signatory}</Text>
              <Text style={styles.sigRole}>{signatoryRole}</Text>
            </View>

            {certificate.qr_data_url ? (
              <View style={styles.qrBlock}>
                <Image src={certificate.qr_data_url} style={styles.qr} />
                <Text style={styles.qrCaption}>Digital ausgestellt{'\n'}und prüfbar</Text>
              </View>
            ) : null}
          </View>
        </View>
      </Page>
    </Document>
  );
}

export default CertificatePDF;