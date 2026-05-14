import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Certificate } from '../types/learningPath';

// DYD logo hosted from public folder — works in both dev and prod
const DYD_LOGO_URL = `${typeof window !== 'undefined' ? window.location.origin : ''}/DYD Logo RGB.svg`;

const TEAL = '#66c0b6';
const TEAL2 = '#30E3CA';
const DARK = '#0a0f1a';
const DARK2 = '#111827';

const styles = StyleSheet.create({
  page: {
    padding: 0,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },

  // Outer decorative border frame
  outerBorder: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    bottom: 14,
    border: '2.5px solid #66c0b6',
    borderRadius: 6,
  },
  innerBorder: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    border: '0.8px solid rgba(102,192,182,0.35)',
    borderRadius: 4,
  },

  // Top accent bar
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: TEAL,
  },

  content: {
    margin: 36,
    flex: 1,
    flexDirection: 'column',
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 22,
    paddingBottom: 18,
    borderBottom: '1px solid rgba(102,192,182,0.25)',
  },

  logoArea: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 3,
  },
  orgName: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    letterSpacing: 1,
  },
  orgSub: {
    fontSize: 9,
    color: '#6b7280',
    letterSpacing: 0.5,
  },

  certBadge: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 2,
  },
  certLabel: {
    fontSize: 9,
    color: TEAL,
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  certId: {
    fontSize: 7.5,
    color: '#9ca3af',
    letterSpacing: 0.5,
  },

  // Main body
  mainHeading: {
    fontSize: 9,
    color: '#9ca3af',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
    marginBottom: 10,
  },
  mainTitle: {
    fontSize: 34,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textAlign: 'center',
    letterSpacing: 3,
    marginBottom: 20,
  },

  divider: {
    height: 2,
    width: 60,
    backgroundColor: TEAL,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 1,
  },

  bodyText: {
    fontSize: 11,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 1.5,
  },

  recipientName: {
    fontSize: 26,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textAlign: 'center',
    marginVertical: 10,
    letterSpacing: 0.5,
  },
  recipientUnderline: {
    height: 1,
    width: 220,
    alignSelf: 'center',
    backgroundColor: TEAL,
    marginBottom: 12,
    opacity: 0.6,
  },

  achievementText: {
    fontSize: 11,
    color: '#4b5563',
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 1.5,
  },

  jobTitle: {
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
    color: TEAL,
    textAlign: 'center',
    marginVertical: 10,
    letterSpacing: 0.5,
  },

  // Skills + modules row
  twoCol: {
    flexDirection: 'row',
    gap: 14,
    marginTop: 18,
    marginBottom: 18,
  },
  colBox: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f9fafb',
    borderRadius: 6,
    border: '1px solid rgba(102,192,182,0.2)',
  },
  colTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: TEAL,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },

  skillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  skillChip: {
    backgroundColor: '#e6f5f3',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
    fontSize: 7.5,
    color: DARK,
    margin: 2,
  },

  moduleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  moduleDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: TEAL,
    flexShrink: 0,
  },
  moduleText: {
    fontSize: 8.5,
    color: '#374151',
    flex: 1,
  },

  // Footer
  footer: {
    borderTop: '1px solid rgba(102,192,182,0.25)',
    paddingTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },

  footerCol: {
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
  },
  footerLabel: {
    fontSize: 7.5,
    color: '#9ca3af',
    marginBottom: 3,
    letterSpacing: 0.5,
  },
  footerValue: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textAlign: 'center',
  },

  sigLine: {
    width: 80,
    height: 0.8,
    backgroundColor: '#374151',
    marginBottom: 4,
  },
  sigName: {
    fontSize: 8.5,
    fontFamily: 'Helvetica-Bold',
    color: DARK,
    textAlign: 'center',
  },
  sigTitle: {
    fontSize: 7,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 1,
  },

  watermark: {
    position: 'absolute',
    top: '40%',
    left: '20%',
    fontSize: 80,
    color: '#f0f0f0',
    opacity: 0.08,
    transform: 'rotate(-35deg)',
    fontFamily: 'Helvetica-Bold',
    letterSpacing: 6,
    zIndex: -1,
  },
});

interface CertificatePDFProps {
  certificate: Certificate;
  modules?: string[];
}

export function CertificatePDF({ certificate, modules = [] }: CertificatePDFProps) {
  const completionDate = new Date(certificate.completion_date);
  const formattedDate = completionDate.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const displaySkills = certificate.mastered_skills.slice(0, 10);
  const displayModules = modules.slice(0, 6);

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        {/* Decorative borders */}
        <View style={styles.outerBorder} />
        <View style={styles.innerBorder} />
        {/* Top accent bar */}
        <View style={styles.accentBar} />
        {/* Watermark */}
        <Text style={styles.watermark}>ZERTIFIKAT</Text>

        <View style={styles.content}>
          {/* ── Header: Logo + cert ID ── */}
          <View style={styles.header}>
            <View style={styles.logoArea}>
              <Text style={styles.orgName}>DYD – Design Your Dream</Text>
              <Text style={styles.orgSub}>Career Academy · dyd.academy</Text>
            </View>
            <View style={styles.certBadge}>
              <Text style={styles.certLabel}>Abschlusszertifikat</Text>
              <Text style={styles.certId}>ID: {certificate.certificate_id}</Text>
            </View>
          </View>

          {/* ── Main content ── */}
          <Text style={styles.mainHeading}>Certificate of Completion</Text>
          <Text style={styles.mainTitle}>ZERTIFIKAT</Text>
          <View style={styles.divider} />

          <Text style={styles.bodyText}>Hiermit wird bescheinigt, dass</Text>

          <Text style={styles.recipientName}>{certificate.recipient_name}</Text>
          <View style={styles.recipientUnderline} />

          <Text style={styles.achievementText}>
            den Lernpfad für die Zielposition
          </Text>
          <Text style={styles.jobTitle}>{certificate.target_job}</Text>
          <Text style={styles.achievementText}>
            erfolgreich abgeschlossen und alle Module absolviert hat.
          </Text>

          {/* ── Skills + Modules ── */}
          <View style={styles.twoCol}>
            {/* Skills */}
            <View style={styles.colBox}>
              <Text style={styles.colTitle}>Erworbene Kompetenzen</Text>
              <View style={styles.skillsWrap}>
                {displaySkills.map((skill, i) => (
                  <Text key={i} style={styles.skillChip}>{skill}</Text>
                ))}
              </View>
            </View>

            {/* Modules */}
            {displayModules.length > 0 && (
              <View style={styles.colBox}>
                <Text style={styles.colTitle}>Abgeschlossene Module</Text>
                {displayModules.map((mod, i) => (
                  <View key={i} style={styles.moduleItem}>
                    <View style={styles.moduleDot} />
                    <Text style={styles.moduleText}>{mod}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* ── Footer ── */}
          <View style={styles.footer}>
            <View style={styles.footerCol}>
              <Text style={styles.footerLabel}>Ausstellungsdatum</Text>
              <Text style={styles.footerValue}>{formattedDate}</Text>
              {certificate.dqr_reference ? (
                <>
                  <Text style={[styles.footerLabel, { marginTop: 6 }]}>DQR-Referenz</Text>
                  <Text style={styles.footerValue}>{certificate.dqr_reference}</Text>
                </>
              ) : null}
            </View>

            <View style={styles.footerCol}>
              <View style={styles.sigLine} />
              <Text style={styles.sigName}>DYD – Design Your Dream</Text>
              <Text style={styles.sigTitle}>Career Academy Leitung</Text>
              {certificate.verification_footer ? (
                <Text style={[styles.sigTitle, { marginTop: 4, fontSize: 6.5, color: '#9ca3af' }]}>
                  {certificate.verification_footer}
                </Text>
              ) : null}
            </View>

            <View style={styles.footerCol}>
              <Text style={styles.footerLabel}>Ausgestellt von</Text>
              <Text style={styles.footerValue}>{certificate.issuer}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
}
