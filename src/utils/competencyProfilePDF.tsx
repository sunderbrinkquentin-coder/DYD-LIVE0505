import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

export interface ProfileEntry {
  skill: string;
  target_job: string;
  certificate_id: string;
  issued_at: string | null;
  score: number | null;
  units: number;
  hours: number;
}

export interface CompetencyProfileData {
  recipient_name: string;
  entries: ProfileEntry[];
  total_hours: number;
  period_start: string | null;
  period_end: string | null;
  generated_at: string;
  issuer: string;
  issuer_url?: string;
  issue_place?: string;
}

/* ── DYD Corporate Design — identisch zu certificatePDF.tsx ── */
const NAVY = '#0A192F';
const NAVY_SOFT = '#3B4A63';
const TEAL = '#30E3CA';
const TEAL_DEEP = '#66C0B6';
const RULE = '#DCE3EC';
const MUTED = '#6B7280';
const PAPER = '#F5FAF9';

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 44,
    paddingLeft: 48,
    paddingRight: 44,
    backgroundColor: '#FFFFFF',
    fontFamily: 'Helvetica',
    color: NAVY,
  },
  spine: {
    position: 'absolute',
    top: 0, bottom: 0, left: 0,
    width: 12,
    backgroundColor: NAVY,
  },
  spineAccent: {
    position: 'absolute',
    top: 0, bottom: 0, left: 12,
    width: 3,
    backgroundColor: TEAL,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingBottom: 9,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
    borderBottomStyle: 'solid',
  },
  orgName: { fontSize: 11, fontFamily: 'Helvetica-Bold', color: NAVY, letterSpacing: 0.8 },
  orgSub: { fontSize: 7.5, color: MUTED, marginTop: 2 },
  eyebrow: {
    fontSize: 7,
    fontFamily: 'Helvetica-Bold',
    color: TEAL_DEEP,
    letterSpacing: 1.5,
    textAlign: 'right',
  },
  headDate: { fontSize: 7, color: MUTED, marginTop: 3, textAlign: 'right' },

  title: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: NAVY,
    letterSpacing: 2,
    marginTop: 20,
  },
  titleRule: { height: 3, width: 84, backgroundColor: TEAL, marginTop: 7 },

  lead: { fontSize: 9, color: MUTED, marginTop: 14 },
  recipient: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: NAVY, marginTop: 5 },
  intro: { fontSize: 9, color: MUTED, marginTop: 10, lineHeight: 1.5 },

  /* Kennzahlen */
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
  fact: { flexGrow: 1, flexBasis: 0, paddingRight: 8 },
  factLabel: {
    fontSize: 6.4,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    letterSpacing: 0.9,
    marginBottom: 3,
  },
  factValue: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: NAVY },
  factValueAccent: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: TEAL_DEEP },

  /* Kompetenz-Chips */
  sectionTitle: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: NAVY_SOFT,
    letterSpacing: 1.1,
    marginTop: 18,
    marginBottom: 8,
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {
    backgroundColor: PAPER,
    borderWidth: 1,
    borderColor: TEAL_DEEP,
    borderStyle: 'solid',
    borderRadius: 10,
    paddingTop: 4, paddingBottom: 4,
    paddingLeft: 9, paddingRight: 9,
    marginRight: 5, marginBottom: 5,
  },
  chipText: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: NAVY },

  /* Zertifikatsblock */
  entry: {
    marginBottom: 10,
    backgroundColor: PAPER,
    borderLeftWidth: 2,
    borderLeftColor: TEAL,
    borderLeftStyle: 'solid',
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
  },
  entryHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  entrySkill: { fontSize: 13, fontFamily: 'Helvetica-Bold', color: NAVY, flexGrow: 1, flexBasis: 0 },
  entryScore: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: TEAL_DEEP },
  entryJob: { fontSize: 8, color: MUTED, marginTop: 2 },
  entryMetaRow: { flexDirection: 'row', marginTop: 8 },
  entryMeta: { flexGrow: 1, flexBasis: 0 },
  entryMetaLabel: {
    fontSize: 6.2,
    fontFamily: 'Helvetica-Bold',
    color: MUTED,
    letterSpacing: 0.8,
  },
  entryMetaValue: { fontSize: 8, color: NAVY_SOFT, marginTop: 2 },

  /* Fuß */
  disclaimer: {
    fontSize: 6.5,
    color: MUTED,
    lineHeight: 1.45,
    marginTop: 18,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: RULE,
    borderTopStyle: 'solid',
  },
  sigBlock: { width: 180, alignItems: 'center', marginTop: 22, marginLeft: 'auto' },
  sigLine: { width: 165, height: 1, backgroundColor: NAVY, marginBottom: 4 },
  sigName: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: NAVY },
  sigRole: { fontSize: 7, color: MUTED, marginTop: 1 },

  pageNo: {
    position: 'absolute',
    bottom: 22,
    left: 48,
    right: 44,
    fontSize: 6.5,
    color: MUTED,
    textAlign: 'right',
  },
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

interface Props {
  profile: CompetencyProfileData;
}

export function CompetencyProfilePDF({ profile }: Props) {
  const { entries } = profile;

  const startStr = formatDate(profile.period_start);
  const endStr = formatDate(profile.period_end);
  const period =
    !profile.period_start && !profile.period_end
      ? formatDate(profile.generated_at)
      : startStr === endStr
        ? endStr
        : `${startStr} – ${endStr}`;

  const scores = entries.map((e) => e.score).filter((s): s is number => typeof s === 'number');
  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  const totalUnits = entries.reduce((sum, e) => sum + e.units, 0);

  return (
    <Document
      title={`Kompetenzprofil ${profile.recipient_name}`}
      author={profile.issuer}
      subject="Kompetenzprofil"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.spine} fixed />
        <View style={styles.spineAccent} fixed />

        {/* Kopf — auf jeder Seite */}
        <View style={styles.header} fixed>
          <View>
            <Text style={styles.orgName}>DYD — DECIDE YOUR DREAM</Text>
            <Text style={styles.orgSub}>
              Career Academy · {profile.issuer_url || 'decide-your-dream.de'}
            </Text>
          </View>
          <View>
            <Text style={styles.eyebrow}>KOMPETENZPROFIL</Text>
            <Text style={styles.headDate}>
              Stand {formatDate(profile.generated_at)}
            </Text>
          </View>
        </View>

        {/* Titelblock */}
        <Text style={styles.title}>KOMPETENZPROFIL</Text>
        <View style={styles.titleRule} />

        <Text style={styles.lead}>Nachgewiesene Kompetenzen von</Text>
        <Text style={styles.recipient}>{profile.recipient_name}</Text>

        <Text style={styles.intro}>
          Dieses Profil fasst alle über die DYD Career Academy absolvierten Lernpfade zusammen.
          Jede aufgeführte Kompetenz wurde durch eine bestandene Abschlussprüfung nachgewiesen
          und ist über die jeweilige Zertifikatsnummer einzeln belegt.
        </Text>

        {/* Kennzahlen */}
        <View style={styles.factBar}>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>KOMPETENZEN</Text>
            <Text style={styles.factValueAccent}>{entries.length}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>LERNUMFANG</Text>
            <Text style={styles.factValue}>{profile.total_hours} Std.</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>LERNEINHEITEN</Text>
            <Text style={styles.factValue}>{totalUnits}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>Ø PRÜFUNG</Text>
            <Text style={styles.factValue}>{avgScore !== null ? `${avgScore} %` : '—'}</Text>
          </View>
          <View style={styles.fact}>
            <Text style={styles.factLabel}>ZEITRAUM</Text>
            <Text style={styles.factValue}>{period}</Text>
          </View>
        </View>

        {/* Übersicht */}
        <Text style={styles.sectionTitle}>KOMPETENZEN IM ÜBERBLICK</Text>
        <View style={styles.chipRow}>
          {entries.map((e, i) => (
            <View key={`${e.certificate_id}-${i}`} style={styles.chip}>
              <Text style={styles.chipText}>{e.skill}</Text>
            </View>
          ))}
        </View>

        {/* Einzelnachweise */}
        <Text style={styles.sectionTitle}>EINZELNACHWEISE</Text>
        {entries.map((e, i) => (
          <View key={e.certificate_id} style={styles.entry} wrap={false}>
            <View style={styles.entryHead}>
              <Text style={styles.entrySkill}>
                {i + 1}. {e.skill}
              </Text>
              {typeof e.score === 'number' && (
                <Text style={styles.entryScore}>{Math.round(e.score)} %</Text>
              )}
            </View>
            <Text style={styles.entryJob}>Karriereziel: {e.target_job}</Text>

            <View style={styles.entryMetaRow}>
              <View style={styles.entryMeta}>
                <Text style={styles.entryMetaLabel}>ZERTIFIKATSNUMMER</Text>
                <Text style={styles.entryMetaValue}>{e.certificate_id}</Text>
              </View>
              <View style={styles.entryMeta}>
                <Text style={styles.entryMetaLabel}>AUSGESTELLT AM</Text>
                <Text style={styles.entryMetaValue}>{formatLongDate(e.issued_at)}</Text>
              </View>
              <View style={styles.entryMeta}>
                <Text style={styles.entryMetaLabel}>LERNEINHEITEN</Text>
                <Text style={styles.entryMetaValue}>{e.units}</Text>
              </View>
              <View style={styles.entryMeta}>
                <Text style={styles.entryMetaLabel}>LERNUMFANG</Text>
                <Text style={styles.entryMetaValue}>{e.hours} Zeitstunden</Text>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.disclaimer}>
          Dieses Kompetenzprofil dokumentiert die erfolgreiche Teilnahme an digitalen Lernpfaden
          der DYD Career Academy sowie das Bestehen der jeweils zugehörigen Abschlussprüfungen.
          Es handelt sich nicht um einen staatlich anerkannten Berufs- oder Bildungsabschluss.
          Jede aufgeführte Kompetenz ist durch ein eigenes Zertifikat mit der angegebenen
          Zertifikatsnummer belegt.
        </Text>

        <View style={styles.sigBlock}>
          <View style={styles.sigLine} />
          <Text style={styles.sigName}>{profile.issuer}</Text>
          <Text style={styles.sigRole}>Leitung Career Academy</Text>
        </View>

        <Text
          style={styles.pageNo}
          fixed
          render={({ pageNumber, totalPages }) =>
            `${profile.recipient_name} · Kompetenzprofil · Seite ${pageNumber} von ${totalPages}`
          }
        />
      </Page>
    </Document>
  );
}

export default CompetencyProfilePDF;