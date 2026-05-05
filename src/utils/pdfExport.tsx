import { Document, Page, View, Text, Image, StyleSheet, pdf } from '@react-pdf/renderer';
import React from 'react';

const saveAs = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface CVData {
  name: string;
  jobTitle: string;
  email: string;
  phone: string;
  location: string;
  profile: string;
  address?: string;
  experience: Array<{
    position: string;
    company: string;
    timeframe: string;
    bullets: string[];
    groupName?: string;
    selectedExperience?: Array<{
      title: string;
      description: string;
    }>;
  }>;
  education: Array<{
    degree: string;
    institution: string;
    timeframe: string;
    details?: string;
    city?: string;
    country?: string;
    gpa?: string;
    gpaScale?: string;
    sat?: string;
    honors?: string[];
    relevantCoursework?: string[];
  }>;
  skills: string[];
  languages?: Array<{
    name: string;
    level: string;
  }>;
  projects?: Array<{
    title: string;
    description: string;
  }>;
  technicalSkills?: string[];
  certifications?: string[];
  activities?: Array<{
    organization: string;
    position: string;
    timeframe: string;
    city?: string;
    country?: string;
    bullets: string[];
  }>;
  interests?: string;
}

const modernStyles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 10,
    lineHeight: 1.45,
    color: '#111',
  },
  header: {
    backgroundColor: '#89a7b2',
    color: 'white',
    flexDirection: 'row',
    padding: 20,
    alignItems: 'center',
    gap: 20,
  },
  photoWrap: {
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'hidden',
    backgroundColor: '#d9d9d9',
    border: '2pt solid rgba(255,255,255,0.6)',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  idBlock: {
    flex: 1,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
    marginBottom: 6,
  },
  contacts: {
    fontSize: 12.5,
    color: 'white',
    opacity: 0.9,
  },
  content: {
    flexDirection: 'row',
    gap: 30,
    padding: '28 35 40',
  },
  column: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 10,
    color: '#333',
    fontWeight: 'bold',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingBottom: 4,
  },
  profileText: {
    fontSize: 10,
    lineHeight: 1.45,
  },
  item: {
    marginBottom: 12,
  },
  itemTitle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  itemSubtitle: {
    fontSize: 10,
    color: '#444',
  },
  itemPeriod: {
    fontSize: 9,
    color: '#777',
  },
  bulletList: {
    marginTop: 6,
    marginLeft: 18,
  },
  bullet: {
    fontSize: 10,
    marginBottom: 3,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillTag: {
    fontSize: 10,
    padding: '6 10',
    border: '1pt solid #e5e7eb',
    borderRadius: 8,
  },
  languageRow: {
    fontSize: 10,
    marginBottom: 6,
  },
  languageLevel: {
    color: '#777',
  },
  educationEntry: {
    marginBottom: 14,
  },
  degree: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  institution: {
    fontSize: 10,
    color: '#444',
  },
  projectItem: {
    marginBottom: 10,
  },
  projectTitle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  projectDescription: {
    fontSize: 10,
    marginTop: 4,
  },
});

const azubiStyles = StyleSheet.create({
  page: {
    padding: 0,
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  header: {
    backgroundColor: '#4ECDC4',
    padding: 25,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  photoWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    backgroundColor: '#fff',
    border: '4pt solid #FFFFFF',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 12,
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 14,
    color: 'white',
    textAlign: 'center',
    marginBottom: 12,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    fontSize: 10,
    color: 'white',
    flexWrap: 'wrap',
  },
  content: {
    padding: '25 30 30',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    backgroundColor: '#F0FDFA',
    color: '#1E3A8A',
    fontSize: 14,
    fontWeight: 'bold',
    padding: '10 15',
    borderRadius: 8,
    marginBottom: 12,
  },
  profileText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#374151',
  },
  experienceItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
    paddingLeft: 12,
    marginBottom: 18,
  },
  positionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0A1929',
    marginBottom: 4,
  },
  company: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4ECDC4',
    marginBottom: 2,
  },
  timeframeBadge: {
    backgroundColor: '#FFA726',
    color: 'white',
    fontSize: 9,
    padding: '4 10',
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  bulletList: {
    marginTop: 8,
  },
  bullet: {
    fontSize: 9,
    color: '#4B5563',
    marginBottom: 4,
    paddingLeft: 12,
  },
  educationItem: {
    marginBottom: 12,
  },
  educationDegree: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0A1929',
  },
  educationInstitution: {
    fontSize: 10,
    color: '#4ECDC4',
  },
  educationTime: {
    fontSize: 9,
    color: '#6B7280',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  skillBadge: {
    backgroundColor: '#4ECDC4',
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    padding: '6 12',
    borderRadius: 15,
  },
  skillBadgeAlt: {
    backgroundColor: '#FFA726',
    color: 'white',
    fontSize: 9,
    fontWeight: 'bold',
    padding: '6 12',
    borderRadius: 15,
  },
});

const uniStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Times-Roman',
    fontSize: 11,
  },
  header: {
    borderBottomWidth: 2,
    borderBottomColor: '#1E3A8A',
    paddingBottom: 20,
    marginBottom: 25,
  },
  headerWithPhoto: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
  },
  photoWrap: {
    width: 90,
    height: 120,
    border: '2pt solid #1E3A8A',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  headerContent: {
    flex: 1,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  nameCenter: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E3A8A',
    marginBottom: 6,
    textAlign: 'center',
  },
  title: {
    fontSize: 12,
    fontFamily: 'Times-Italic',
    color: '#64748B',
    marginBottom: 12,
  },
  titleCenter: {
    fontSize: 12,
    fontFamily: 'Times-Italic',
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
  },
  contactInfo: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.4,
  },
  contactInfoCenter: {
    fontSize: 10,
    color: '#475569',
    lineHeight: 1.4,
    textAlign: 'center',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1E3A8A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 6,
    marginBottom: 15,
  },
  profileText: {
    fontSize: 11,
    lineHeight: 1.5,
    color: '#334155',
  },
  experienceItem: {
    marginBottom: 18,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  positionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  timeframe: {
    fontSize: 10,
    color: '#64748B',
  },
  company: {
    fontSize: 11,
    fontFamily: 'Times-Italic',
    color: '#64748B',
    marginBottom: 6,
  },
  bulletList: {
    marginLeft: 15,
  },
  bullet: {
    fontSize: 10,
    color: '#475569',
    marginBottom: 3,
  },
  educationItem: {
    marginBottom: 12,
  },
  degree: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#1E3A8A',
  },
  institution: {
    fontSize: 11,
    fontFamily: 'Times-Italic',
    color: '#64748B',
  },
  skillsText: {
    fontSize: 11,
    color: '#334155',
  },
});

const beratungStyles = StyleSheet.create({
  page: {
    flexDirection: 'row',
    fontFamily: 'Helvetica',
    fontSize: 10,
  },
  sidebar: {
    width: '35%',
    backgroundColor: '#1E293B',
    color: 'white',
    padding: 35,
  },
  photoWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: '#fff',
    border: '4pt solid #4ECDC4',
    marginLeft: 'auto',
    marginRight: 'auto',
    marginBottom: 20,
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 6,
  },
  jobTitleSidebar: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#4ECDC4',
    textAlign: 'center',
    marginBottom: 25,
  },
  sidebarSection: {
    marginBottom: 25,
  },
  sidebarSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#4ECDC4',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  contactItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
    fontSize: 9,
    alignItems: 'center',
  },
  contactIcon: {
    color: '#4ECDC4',
    fontSize: 9,
  },
  skillItem: {
    fontSize: 9,
    padding: '6 10',
    borderRadius: 4,
    marginBottom: 6,
    backgroundColor: 'rgba(78, 205, 196, 0.2)',
    color: 'white',
  },
  skillItemHighlight: {
    fontSize: 9,
    padding: '6 10',
    borderRadius: 4,
    marginBottom: 6,
    backgroundColor: '#4ECDC4',
    color: '#0F172A',
    fontWeight: 'bold',
  },
  languageItem: {
    marginBottom: 6,
    fontSize: 9,
  },
  languageName: {
    fontWeight: 'bold',
  },
  languageLevel: {
    fontSize: 8,
    color: '#94A3B8',
  },
  mainContent: {
    flex: 1,
    padding: 35,
  },
  mainSection: {
    marginBottom: 25,
  },
  mainSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0F172A',
    borderBottomWidth: 3,
    borderBottomColor: '#4ECDC4',
    paddingBottom: 8,
    marginBottom: 18,
  },
  profileText: {
    fontSize: 10,
    lineHeight: 1.5,
    color: '#334155',
  },
  experienceItem: {
    marginBottom: 18,
  },
  experienceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  positionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  company: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#4ECDC4',
  },
  timeframeBadge: {
    fontSize: 9,
    padding: '4 10',
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  bulletList: {
    marginTop: 10,
  },
  bullet: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 6,
    paddingLeft: 12,
  },
  educationItem: {
    marginBottom: 12,
  },
  degree: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  institution: {
    fontSize: 10,
    color: '#4ECDC4',
  },
  educationTime: {
    fontSize: 9,
    color: '#64748B',
  },
  projectItem: {
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0F172A',
    marginBottom: 4,
  },
  projectDescription: {
    fontSize: 9,
    color: '#475569',
  },
});

const financeStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Times-Roman',
    fontSize: 11,
    lineHeight: 1.3,
  },
  header: {
    marginBottom: 20,
    position: 'relative',
  },
  headerWithPhoto: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  photoWrap: {
    width: 80,
    height: 100,
    border: '1pt solid #000',
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  headerContent: {
    flex: 1,
    textAlign: 'center',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
    textAlign: 'center',
  },
  address: {
    fontSize: 9,
    marginBottom: 4,
    textAlign: 'center',
  },
  contact: {
    fontSize: 9,
    textAlign: 'center',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    borderBottomWidth: 1.5,
    borderBottomColor: '#000',
    paddingBottom: 2,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  educationEntry: {
    marginBottom: 12,
  },
  educationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  institutionName: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  location: {
    fontSize: 9,
  },
  degreeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontFamily: 'Times-Italic',
    fontSize: 11,
    marginBottom: 4,
  },
  detailLine: {
    fontSize: 11,
    marginBottom: 4,
  },
  boldLabel: {
    fontWeight: 'bold',
  },
  experienceEntry: {
    marginBottom: 12,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  companyName: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  positionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    fontFamily: 'Times-Italic',
    fontSize: 11,
    marginBottom: 4,
  },
  bulletList: {
    marginLeft: 12,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 11,
    marginBottom: 4,
  },
  subList: {
    marginLeft: 12,
    marginTop: 4,
  },
  subBullet: {
    fontSize: 11,
    marginBottom: 8,
  },
  subBulletTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  subBulletDescription: {
    marginLeft: 12,
  },
  activityEntry: {
    marginBottom: 10,
  },
  skillsSection: {
    marginBottom: 4,
  },
  skillsLine: {
    fontSize: 11,
    marginBottom: 4,
  },
});

interface CVPDFDocumentProps {
  data: CVData;
  photo?: string | null;
  showPhoto: boolean;
  template: 'modern' | 'azubi' | 'uni' | 'beratung' | 'finance';
}

const ModernPDFDocument = ({ data, photo, showPhoto }: Omit<CVPDFDocumentProps, 'template'>) => {
  const hasPhoto = showPhoto && photo;

  return (
    <Document>
      <Page size="A4" style={modernStyles.page}>
        <View style={modernStyles.header}>
          {hasPhoto && (
            <View style={modernStyles.photoWrap}>
              <Image src={photo!} style={modernStyles.photo} />
            </View>
          )}

          <View style={modernStyles.idBlock}>
            <Text style={modernStyles.name}>{data.name}</Text>
            <Text style={modernStyles.title}>{data.jobTitle}</Text>
            <Text style={modernStyles.contacts}>
              {data.location} · {data.phone} · {data.email}
            </Text>
          </View>
        </View>

        <View style={modernStyles.content}>
          <View style={modernStyles.column}>
            <View style={modernStyles.section}>
              <Text style={modernStyles.sectionTitle}>Profil</Text>
              <Text style={modernStyles.profileText}>{data.profile}</Text>
            </View>

            <View style={modernStyles.section}>
              <Text style={modernStyles.sectionTitle}>Berufserfahrung</Text>
              {data.experience.map((exp, index) => (
                <View key={index} style={modernStyles.item}>
                  <Text style={modernStyles.itemTitle}>{exp.position}</Text>
                  <Text style={modernStyles.itemSubtitle}>{exp.company}</Text>
                  <Text style={modernStyles.itemPeriod}>{exp.timeframe}</Text>
                  <View style={modernStyles.bulletList}>
                    {exp.bullets.map((bullet, i) => (
                      <Text key={i} style={modernStyles.bullet}>
                        • {bullet}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            {data.projects && data.projects.length > 0 && (
              <View style={modernStyles.section}>
                <Text style={modernStyles.sectionTitle}>Projekte</Text>
                {data.projects.map((project, index) => (
                  <View key={index} style={modernStyles.projectItem}>
                    <Text style={modernStyles.projectTitle}>{project.title}</Text>
                    <Text style={modernStyles.projectDescription}>{project.description}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={modernStyles.column}>
            <View style={modernStyles.section}>
              <Text style={modernStyles.sectionTitle}>Skills & Kompetenzen</Text>
              <View style={modernStyles.skillsContainer}>
                {data.skills.map((skill, index) => (
                  <Text key={index} style={modernStyles.skillTag}>
                    {skill}
                  </Text>
                ))}
              </View>
            </View>

            {data.languages && data.languages.length > 0 && (
              <View style={modernStyles.section}>
                <Text style={modernStyles.sectionTitle}>Sprachen</Text>
                {data.languages.map((lang, index) => (
                  <View key={index} style={modernStyles.languageRow}>
                    <Text>
                      {lang.name} <Text style={modernStyles.languageLevel}>({lang.level})</Text>
                    </Text>
                  </View>
                ))}
              </View>
            )}

            <View style={modernStyles.section}>
              <Text style={modernStyles.sectionTitle}>Bildung</Text>
              {data.education.map((edu, index) => (
                <View key={index} style={modernStyles.educationEntry}>
                  <Text style={modernStyles.degree}>{edu.degree}</Text>
                  <Text style={modernStyles.institution}>{edu.institution}</Text>
                  <Text style={modernStyles.itemPeriod}>{edu.timeframe}</Text>
                  {edu.details && <Text style={modernStyles.itemPeriod}>{edu.details}</Text>}
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const AzubiPDFDocument = ({ data, photo, showPhoto }: Omit<CVPDFDocumentProps, 'template'>) => {
  const hasPhoto = showPhoto && photo;

  return (
    <Document>
      <Page size="A4" style={azubiStyles.page}>
        <View style={azubiStyles.header}>
          {hasPhoto && (
            <View style={azubiStyles.photoWrap}>
              <Image src={photo!} style={azubiStyles.photo} />
            </View>
          )}

          <Text style={azubiStyles.name}>{data.name}</Text>
          <Text style={azubiStyles.title}>{data.jobTitle}</Text>

          <View style={azubiStyles.contactRow}>
            <Text>{data.email}</Text>
            <Text>{data.phone}</Text>
            <Text>{data.location}</Text>
          </View>
        </View>

        <View style={azubiStyles.content}>
          <View style={azubiStyles.section}>
            <Text style={azubiStyles.sectionHeader}>Über mich</Text>
            <Text style={azubiStyles.profileText}>{data.profile}</Text>
          </View>

          <View style={azubiStyles.section}>
            <Text style={azubiStyles.sectionHeader}>Berufserfahrung</Text>
            {data.experience.map((exp, index) => (
              <View key={index} style={azubiStyles.experienceItem}>
                <Text style={azubiStyles.positionTitle}>{exp.position}</Text>
                <Text style={azubiStyles.company}>{exp.company}</Text>
                <Text style={azubiStyles.timeframeBadge}>{exp.timeframe}</Text>
                <View style={azubiStyles.bulletList}>
                  {exp.bullets.map((bullet, i) => (
                    <Text key={i} style={azubiStyles.bullet}>
                      ✓ {bullet}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={azubiStyles.section}>
            <Text style={azubiStyles.sectionHeader}>Bildung</Text>
            {data.education.map((edu, index) => (
              <View key={index} style={azubiStyles.educationItem}>
                <Text style={azubiStyles.educationDegree}>{edu.degree}</Text>
                <Text style={azubiStyles.educationInstitution}>{edu.institution}</Text>
                <Text style={azubiStyles.educationTime}>{edu.timeframe}</Text>
              </View>
            ))}
          </View>

          <View style={azubiStyles.section}>
            <Text style={azubiStyles.sectionHeader}>Meine Skills</Text>
            <View style={azubiStyles.skillsContainer}>
              {data.skills.map((skill, index) => (
                <Text
                  key={index}
                  style={index < 3 ? azubiStyles.skillBadgeAlt : azubiStyles.skillBadge}
                >
                  {skill}
                </Text>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const UniPDFDocument = ({ data, photo, showPhoto }: Omit<CVPDFDocumentProps, 'template'>) => {
  const hasPhoto = showPhoto && photo;

  return (
    <Document>
      <Page size="A4" style={uniStyles.page}>
        <View style={uniStyles.header}>
          {hasPhoto ? (
            <View style={uniStyles.headerWithPhoto}>
              <View style={uniStyles.photoWrap}>
                <Image src={photo!} style={uniStyles.photo} />
              </View>

              <View style={uniStyles.headerContent}>
                <Text style={uniStyles.name}>{data.name}</Text>
                <Text style={uniStyles.title}>{data.jobTitle}</Text>
                <View style={uniStyles.contactInfo}>
                  <Text>{data.email}</Text>
                  <Text>{data.phone}</Text>
                  <Text>{data.location}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View>
              <Text style={uniStyles.nameCenter}>{data.name}</Text>
              <Text style={uniStyles.titleCenter}>{data.jobTitle}</Text>
              <View style={uniStyles.contactInfoCenter}>
                <Text>{data.email}</Text>
                <Text>{data.phone}</Text>
                <Text>{data.location}</Text>
              </View>
            </View>
          )}
        </View>

        <View style={uniStyles.section}>
          <Text style={uniStyles.sectionTitle}>Profil</Text>
          <Text style={uniStyles.profileText}>{data.profile}</Text>
        </View>

        <View style={uniStyles.section}>
          <Text style={uniStyles.sectionTitle}>Berufserfahrung</Text>
          {data.experience.map((exp, index) => (
            <View key={index} style={uniStyles.experienceItem}>
              <View style={uniStyles.experienceHeader}>
                <Text style={uniStyles.positionTitle}>{exp.position}</Text>
                <Text style={uniStyles.timeframe}>{exp.timeframe}</Text>
              </View>
              <Text style={uniStyles.company}>{exp.company}</Text>
              <View style={uniStyles.bulletList}>
                {exp.bullets.map((bullet, i) => (
                  <Text key={i} style={uniStyles.bullet}>
                    • {bullet}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </View>

        <View style={uniStyles.section}>
          <Text style={uniStyles.sectionTitle}>Ausbildung</Text>
          {data.education.map((edu, index) => (
            <View key={index} style={uniStyles.educationItem}>
              <View style={uniStyles.experienceHeader}>
                <Text style={uniStyles.degree}>{edu.degree}</Text>
                <Text style={uniStyles.timeframe}>{edu.timeframe}</Text>
              </View>
              <Text style={uniStyles.institution}>{edu.institution}</Text>
              {edu.details && <Text style={uniStyles.bullet}>{edu.details}</Text>}
            </View>
          ))}
        </View>

        <View style={uniStyles.section}>
          <Text style={uniStyles.sectionTitle}>Kompetenzen</Text>
          <Text style={uniStyles.skillsText}>{data.skills.join(' • ')}</Text>
        </View>
      </Page>
    </Document>
  );
};

const BeratungPDFDocument = ({ data, photo, showPhoto }: Omit<CVPDFDocumentProps, 'template'>) => {
  const hasPhoto = showPhoto && photo;

  return (
    <Document>
      <Page size="A4" style={beratungStyles.page}>
        <View style={beratungStyles.sidebar}>
          {hasPhoto && (
            <View style={beratungStyles.photoWrap}>
              <Image src={photo!} style={beratungStyles.photo} />
            </View>
          )}

          <Text style={beratungStyles.name}>{data.name}</Text>
          <Text style={beratungStyles.jobTitleSidebar}>{data.jobTitle}</Text>

          <View style={beratungStyles.sidebarSection}>
            <Text style={beratungStyles.sidebarSectionTitle}>Kontakt</Text>
            <View style={beratungStyles.contactItem}>
              <Text style={beratungStyles.contactIcon}>✉</Text>
              <Text>{data.email}</Text>
            </View>
            <View style={beratungStyles.contactItem}>
              <Text style={beratungStyles.contactIcon}>☎</Text>
              <Text>{data.phone}</Text>
            </View>
            <View style={beratungStyles.contactItem}>
              <Text style={beratungStyles.contactIcon}>📍</Text>
              <Text>{data.location}</Text>
            </View>
          </View>

          <View style={beratungStyles.sidebarSection}>
            <Text style={beratungStyles.sidebarSectionTitle}>Skills</Text>
            {data.skills.map((skill, index) => (
              <Text
                key={index}
                style={index < 3 ? beratungStyles.skillItemHighlight : beratungStyles.skillItem}
              >
                {skill}
              </Text>
            ))}
          </View>

          {data.languages && data.languages.length > 0 && (
            <View style={beratungStyles.sidebarSection}>
              <Text style={beratungStyles.sidebarSectionTitle}>Sprachen</Text>
              {data.languages.map((lang, index) => (
                <View key={index} style={beratungStyles.languageItem}>
                  <Text style={beratungStyles.languageName}>{lang.name}</Text>
                  <Text style={beratungStyles.languageLevel}> {lang.level}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={beratungStyles.mainContent}>
          <View style={beratungStyles.mainSection}>
            <Text style={beratungStyles.mainSectionTitle}>Profil</Text>
            <Text style={beratungStyles.profileText}>{data.profile}</Text>
          </View>

          <View style={beratungStyles.mainSection}>
            <Text style={beratungStyles.mainSectionTitle}>Berufserfahrung</Text>
            {data.experience.map((exp, index) => (
              <View key={index} style={beratungStyles.experienceItem}>
                <View style={beratungStyles.experienceHeader}>
                  <View>
                    <Text style={beratungStyles.positionTitle}>{exp.position}</Text>
                    <Text style={beratungStyles.company}>{exp.company}</Text>
                  </View>
                  <Text style={beratungStyles.timeframeBadge}>{exp.timeframe}</Text>
                </View>
                <View style={beratungStyles.bulletList}>
                  {exp.bullets.map((bullet, i) => (
                    <Text key={i} style={beratungStyles.bullet}>
                      ▸ {bullet}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>

          <View style={beratungStyles.mainSection}>
            <Text style={beratungStyles.mainSectionTitle}>Ausbildung</Text>
            {data.education.map((edu, index) => (
              <View key={index} style={beratungStyles.educationItem}>
                <Text style={beratungStyles.degree}>{edu.degree}</Text>
                <Text style={beratungStyles.institution}>{edu.institution}</Text>
                <Text style={beratungStyles.educationTime}>{edu.timeframe}</Text>
                {edu.details && <Text style={beratungStyles.educationTime}>{edu.details}</Text>}
              </View>
            ))}
          </View>

          {data.projects && data.projects.length > 0 && (
            <View style={beratungStyles.mainSection}>
              <Text style={beratungStyles.mainSectionTitle}>Projekte</Text>
              {data.projects.map((project, index) => (
                <View key={index} style={beratungStyles.projectItem}>
                  <Text style={beratungStyles.projectTitle}>{project.title}</Text>
                  <Text style={beratungStyles.projectDescription}>{project.description}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

const FinancePDFDocument = ({ data, photo, showPhoto }: Omit<CVPDFDocumentProps, 'template'>) => {
  const hasPhoto = showPhoto && photo;

  return (
    <Document>
      <Page size="A4" style={financeStyles.page}>
        {hasPhoto ? (
          <View style={financeStyles.headerWithPhoto}>
            <View style={financeStyles.photoWrap}>
              <Image src={photo!} style={financeStyles.photo} />
            </View>
            <View style={financeStyles.headerContent}>
              <Text style={financeStyles.name}>{data.name}</Text>
              {data.address && <Text style={financeStyles.address}>{data.address}</Text>}
              <Text style={financeStyles.contact}>
                {data.phone} | {data.email}
              </Text>
            </View>
          </View>
        ) : (
          <View style={financeStyles.header}>
            <Text style={financeStyles.name}>{data.name}</Text>
            {data.address && <Text style={financeStyles.address}>{data.address}</Text>}
            <Text style={financeStyles.contact}>
              {data.phone} | {data.email}
            </Text>
          </View>
        )}

        <View style={financeStyles.section}>
          <Text style={financeStyles.sectionTitle}>EDUCATION</Text>
          {data.education.map((edu, index) => (
            <View key={index} style={financeStyles.educationEntry}>
              <View style={financeStyles.educationHeader}>
                <Text style={financeStyles.institutionName}>{edu.institution}</Text>
                {edu.city && edu.country && (
                  <Text style={financeStyles.location}>
                    {edu.city}, {edu.country}
                  </Text>
                )}
              </View>
              <View style={financeStyles.degreeRow}>
                <Text>{edu.degree}</Text>
                {edu.timeframe && <Text>Expected {edu.timeframe}</Text>}
              </View>
              {(edu.gpa || edu.sat) && (
                <View style={financeStyles.detailLine}>
                  <Text style={financeStyles.boldLabel}>• GPA: </Text>
                  <Text>
                    {edu.gpa && `${edu.gpa} / ${edu.gpaScale || '4.0'}`}
                    {edu.sat && `; SAT: ${edu.sat}`}
                  </Text>
                </View>
              )}
              {edu.honors && edu.honors.length > 0 && (
                <View style={financeStyles.detailLine}>
                  <Text style={financeStyles.boldLabel}>• Honors: </Text>
                  <Text>{edu.honors.join(', ')}</Text>
                </View>
              )}
              {edu.relevantCoursework && edu.relevantCoursework.length > 0 && (
                <View style={financeStyles.detailLine}>
                  <Text style={financeStyles.boldLabel}>• Relevant Coursework: </Text>
                  <Text>{edu.relevantCoursework.join(' / ')}</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        <View style={financeStyles.section}>
          <Text style={financeStyles.sectionTitle}>WORK & LEADERSHIP EXPERIENCE</Text>
          {data.experience.map((exp, index) => (
            <View key={index} style={financeStyles.experienceEntry}>
              <View style={financeStyles.companyHeader}>
                <Text style={financeStyles.companyName}>{exp.company}</Text>
                {!exp.company.includes(',') && (
                  <Text style={financeStyles.location}>{data.location}</Text>
                )}
              </View>
              <View style={financeStyles.positionRow}>
                <Text>
                  {exp.position}
                  {exp.groupName && `, ${exp.groupName}`}
                </Text>
                <Text>{exp.timeframe}</Text>
              </View>
              {exp.bullets && exp.bullets.length > 0 && (
                <View style={financeStyles.bulletList}>
                  {exp.bullets.map((bullet, i) => (
                    <Text key={i} style={financeStyles.bullet}>
                      • {bullet}
                    </Text>
                  ))}
                </View>
              )}
              {exp.selectedExperience && exp.selectedExperience.length > 0 && (
                <View style={financeStyles.subList}>
                  <Text style={financeStyles.detailLine}>
                    Selected {exp.groupName?.includes('Client') ? 'Client' : 'Project'} Experience:
                  </Text>
                  {exp.selectedExperience.map((item, i) => (
                    <View key={i} style={financeStyles.subBullet}>
                      <Text style={financeStyles.subBulletTitle}>○ {item.title}</Text>
                      <Text style={financeStyles.subBulletDescription}>▪ {item.description}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>

        {data.activities && data.activities.length > 0 && (
          <View style={financeStyles.section}>
            {data.activities.map((activity, index) => (
              <View key={index} style={financeStyles.activityEntry}>
                <View style={financeStyles.companyHeader}>
                  <Text style={financeStyles.companyName}>{activity.organization}</Text>
                  {activity.city && activity.country && (
                    <Text style={financeStyles.location}>
                      {activity.city}, {activity.country}
                    </Text>
                  )}
                </View>
                <View style={financeStyles.positionRow}>
                  <Text>{activity.position}</Text>
                  <Text>{activity.timeframe}</Text>
                </View>
                <View style={financeStyles.bulletList}>
                  {activity.bullets.map((bullet, i) => (
                    <Text key={i} style={financeStyles.bullet}>
                      • {bullet}
                    </Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={financeStyles.section}>
          <Text style={financeStyles.sectionTitle}>SKILLS, ACTIVITIES & INTERESTS</Text>
          {data.languages && data.languages.length > 0 && (
            <View style={financeStyles.skillsSection}>
              <Text style={financeStyles.skillsLine}>
                <Text style={financeStyles.boldLabel}>Languages: </Text>
                {data.languages.map((lang, i) => (
                  <Text key={i}>
                    Fluent in {lang.name}
                    {lang.level && lang.level !== 'Fluent' && ` (${lang.level})`}
                    {i < data.languages!.length - 1 ? '; ' : ''}
                  </Text>
                ))}
              </Text>
            </View>
          )}
          {data.technicalSkills && data.technicalSkills.length > 0 && (
            <View style={financeStyles.skillsSection}>
              <Text style={financeStyles.skillsLine}>
                <Text style={financeStyles.boldLabel}>Technical Skills: </Text>
                {data.technicalSkills.join(', ')}
              </Text>
            </View>
          )}
          {data.certifications && data.certifications.length > 0 && (
            <View style={financeStyles.skillsSection}>
              <Text style={financeStyles.skillsLine}>
                <Text style={financeStyles.boldLabel}>Certifications & Training: </Text>
                {data.certifications.join(', ')}
              </Text>
            </View>
          )}
          {data.interests && (
            <View style={financeStyles.skillsSection}>
              <Text style={financeStyles.skillsLine}>
                <Text style={financeStyles.boldLabel}>Interests: </Text>
                {data.interests}
              </Text>
            </View>
          )}
        </View>
      </Page>
    </Document>
  );
};

const CVPDFDocument = ({ data, photo, showPhoto, template }: CVPDFDocumentProps) => {
  switch (template) {
    case 'azubi':
      return <AzubiPDFDocument data={data} photo={photo} showPhoto={showPhoto} />;
    case 'uni':
      return <UniPDFDocument data={data} photo={photo} showPhoto={showPhoto} />;
    case 'beratung':
      return <BeratungPDFDocument data={data} photo={photo} showPhoto={showPhoto} />;
    case 'finance':
      return <FinancePDFDocument data={data} photo={photo} showPhoto={showPhoto} />;
    default:
      return <ModernPDFDocument data={data} photo={photo} showPhoto={showPhoto} />;
  }
};

export async function downloadAsPDF(
  data: CVData,
  photo?: string | null,
  showPhoto: boolean = true,
  template: 'modern' | 'azubi' | 'uni' | 'beratung' | 'finance' = 'modern'
): Promise<void> {
  try {
    const doc = React.createElement(CVPDFDocument, { data, photo, showPhoto, template });
    const blob = await pdf(doc).toBlob();

    const fileName = `${data.name.replace(/\s+/g, '_')}_CV_${template}.pdf`;
    saveAs(blob, fileName);
  } catch (error) {
    console.error('PDF Export Error:', error);
    throw new Error('PDF-Generierung fehlgeschlagen');
  }
}
