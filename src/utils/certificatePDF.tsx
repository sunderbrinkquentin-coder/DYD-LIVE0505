import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { Certificate } from '../types/learningPath';

const styles = StyleSheet.create({
  page: {
    padding: 50,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 30,
    textAlign: 'center',
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
    alignSelf: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
    textAlign: 'center',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 40,
  },
  mainContent: {
    marginTop: 40,
    marginBottom: 40,
  },
  certificateText: {
    fontSize: 12,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 20,
  },
  recipientName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#66c0b6',
    textAlign: 'center',
    marginVertical: 20,
    textDecoration: 'underline',
  },
  achievementText: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 1.6,
  },
  targetJob: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    marginVertical: 15,
  },
  skillsSection: {
    marginTop: 30,
    marginBottom: 30,
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  skillsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 15,
    textAlign: 'center',
  },
  skillsGrid: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#66c0b6',
    color: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    fontSize: 10,
    margin: 4,
  },
  footer: {
    marginTop: 50,
    paddingTop: 20,
    borderTop: '2px solid #e0e0e0',
  },
  footerRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  footerItem: {
    flex: 1,
    textAlign: 'center',
  },
  footerLabel: {
    fontSize: 10,
    color: '#999999',
    marginBottom: 5,
  },
  footerValue: {
    fontSize: 11,
    color: '#333333',
    fontWeight: 'bold',
  },
  signature: {
    marginTop: 30,
    textAlign: 'center',
  },
  signatureLine: {
    width: 200,
    height: 1,
    backgroundColor: '#333333',
    marginBottom: 5,
    alignSelf: 'center',
  },
  signatureName: {
    fontSize: 11,
    color: '#333333',
    fontWeight: 'bold',
  },
  signatureTitle: {
    fontSize: 9,
    color: '#666666',
    marginTop: 2,
  },
  decorativeBorder: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    border: '4px solid #66c0b6',
    borderRadius: 8,
  },
  watermark: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) rotate(-45deg)',
    fontSize: 60,
    color: '#f0f0f0',
    opacity: 0.1,
    zIndex: -1,
  },
});

interface CertificatePDFProps {
  certificate: Certificate;
}

export function CertificatePDF({ certificate }: CertificatePDFProps) {
  const completionDate = new Date(certificate.completion_date);
  const formattedDate = completionDate.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Document>
      <Page size="A4" style={styles.page} orientation="landscape">
        <View style={styles.decorativeBorder} />
        <Text style={styles.watermark}>CERTIFICATE</Text>

        <View style={styles.header}>
          <Text style={styles.title}>ZERTIFIKAT</Text>
          <Text style={styles.subtitle}>Career Vision Academy</Text>
        </View>

        <View style={styles.mainContent}>
          <Text style={styles.certificateText}>
            Hiermit wird bescheinigt, dass
          </Text>

          <Text style={styles.recipientName}>{certificate.recipient_name}</Text>

          <Text style={styles.achievementText}>
            erfolgreich den Learning Path für die Position
          </Text>

          <Text style={styles.targetJob}>{certificate.target_job}</Text>

          <Text style={styles.achievementText}>
            abgeschlossen und folgende Fähigkeiten erworben hat:
          </Text>

          <View style={styles.skillsSection}>
            <Text style={styles.skillsTitle}>Erworbene Kompetenzen</Text>
            <View style={styles.skillsGrid}>
              {certificate.mastered_skills.slice(0, 12).map((skill, index) => (
                <Text key={index} style={styles.skillBadge}>
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerRow}>
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Ausstellungsdatum</Text>
              <Text style={styles.footerValue}>{formattedDate}</Text>
            </View>
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Zertifikat-ID</Text>
              <Text style={styles.footerValue}>{certificate.certificate_id}</Text>
            </View>
            <View style={styles.footerItem}>
              <Text style={styles.footerLabel}>Ausgestellt von</Text>
              <Text style={styles.footerValue}>{certificate.issuer}</Text>
            </View>
          </View>

          <View style={styles.signature}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureName}>Career Vision Team</Text>
            <Text style={styles.signatureTitle}>Leitung Bildungseinrichtung</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
