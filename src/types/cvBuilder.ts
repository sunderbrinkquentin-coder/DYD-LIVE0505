// src/types/cvBuilder.ts
// ─────────────────────────────────────────────────────────────────────────────
// EINZIGE Typquelle für die CV-Daten ("Single Source of Truth").
//
// WICHTIG: cvDataMapper.ts deklariert aktuell ein ZWEITES, schlankeres
// CVBuilderData-Interface. Das ist die Ursache des "Felder verschwinden"-Bugs:
// Jedes Feld, das hier existiert, aber im Mapper-Duplikat fehlt, fällt beim
// PDF-/Mapper-Durchlauf still raus. Im Mapper-Pass ersetzen wir das lokale
// Duplikat durch:  import { CVBuilderData } from '../types/cvBuilder';
//
// Alle NEU-markierten Felder sind optional -> vollständig rückwärtskompatibel.
// ─────────────────────────────────────────────────────────────────────────────

export type ExperienceLevel = 'beginner' | 'some-experience' | 'experienced';

export type RoleType =
  | 'werkstudent' | 'praktikum' | 'junior'
  | 'trainee' | 'associate' | 'specialist'
  | 'professional' | 'senior' | 'teamlead';

export type IndustryType =
  | 'tech' | 'finance' | 'consulting' | 'marketing'
  | 'healthcare' | 'education' | 'retail' | 'other';

export type EducationType = 'university' | 'apprenticeship' | 'certification' | 'school';

export type ExperienceType =
  | 'internship' | 'working-student' | 'side-job' | 'volunteer'
  | 'project-work' | 'full-time' | 'trainee-position';

export type ProjectType = 'university' | 'thesis' | 'personal' | 'internal' | 'client' | 'cross-functional';

// ✅ NEU: Anstellungsart — hebt Werkstudi/Praktika sauber von Festanstellung ab
export type EmploymentType =
  | 'full-time' | 'part-time' | 'working-student'
  | 'internship' | 'freelance' | 'mini-job' | 'apprenticeship';

// ✅ NEU: Sprachniveau nach GER (CEFR) + Muttersprache
export type LanguageLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'native';

// ✅ NEU: Arbeitsmodell — Fuel für Ziel-Matching / Optimierung
export type WorkModel = 'onsite' | 'hybrid' | 'remote' | 'flexible';

export const PROJECT_TYPES = [
  { label: 'Uni-/Schulprojekt', value: 'university' },
  { label: 'Abschlussarbeit / Thesis', value: 'thesis' },
  { label: 'Eigenes / privates Projekt', value: 'personal' },
  { label: 'Internes Projekt (Firma)', value: 'internal' },
  { label: 'Kundenprojekt', value: 'client' },
  { label: 'Cross-functional', value: 'cross-functional' },
] as const;

export type SkillLevel = 'basic' | 'intermediate' | 'expert';

export interface PersonalData {
  firstName?: string;
  lastName?: string;
  city?: string;
  zipCode?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  website?: string;
  portfolio?: string;
  photoUrl?: string;

  // ✅ NEU: Professionelle Überschrift ("Marketing Manager · B2B SaaS")
  headline?: string;
  // ✅ NEU: markt-relevante Profile
  xing?: string;
  github?: string;
  // ✅ NEU: in DE für viele Rollen relevant (z. B. Außendienst, Handwerk)
  drivingLicense?: string; // z. B. "Klasse B"
  // ✅ NEU: traditionell/optional — nur wenn Nutzer es explizit will
  birthDate?: string;
  nationality?: string;
}

export interface DesiredJob {
  company: string;
  job_title: string;
  job_link?: string;
  job_description: string;
}

export interface SchoolEducation {
  type: string;
  school: string;
  graduation: string;
  year: string;
  startYear?: string;
  startMonth?: string;
  endYear?: string;
  endMonth?: string;
  location?: string;
  focus?: string[];       // Leistungskurse / Schwerpunkte
  projects?: string[];
  grades?: string;        // ✅ NEU: Abschlussnote (nur wenn stark)
}

export interface ProfessionalEducation {
  type: EducationType;
  institution: string;
  degree: string;
  startMonth?: string;
  startYear: string;
  endMonth?: string;
  endYear: string;
  location?: string;
  focus?: string[];       // Schwerpunkte / relevante Module
  projects?: string[];
  grades?: string;

  // ✅ NEU: Abschlussarbeit — hoher Signalwert, oft vergessen
  thesisTitle?: string;
  thesisGrade?: string;
  current?: boolean;      // ✅ NEU: laufendes Studium / Ausbildung
}

// 🔥 Branchenübergreifend (nicht nur IT) — bleibt die reiche Version
export interface WorkExperience {
  jobTitle: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;

  // ✅ NEU: Anstellungsart
  employmentType?: EmploymentType;

  // Branchenübergreifende Kontextfelder
  industry?: string;         // z. B. "Sales", "Marketing", "Finance", "HR", "Logistik", "IT"
  roleLevel?: string;        // z. B. "Werkstudent", "Junior", "Senior", "Lead", "Head"
  revenue?: string;          // z. B. "500.000€ Umsatzverantwortung"
  budget?: string;           // z. B. "100.000€ Budgetverantwortung"
  teamSize?: string;         // z. B. "5 Mitarbeiter", "Teamleitung 3 Personen"
  customersMarket?: string;  // z. B. "B2B Key Accounts", "B2C Retail", "DACH-Region"
  achievementsRaw?: string;  // Freitext für messbare Erfolge

  // Bestehende Struktur
  tasks: string[];
  responsibilities: string[];
  tools: string[];
  kpis: string[];
  achievements: string[];

  // Aufgaben/Erfolge mit konkreten Kennzahlen
  tasksWithMetrics?: Array<{
    task: string;
    metrics: {
      number?: string;
      percentage?: string;
      money?: string;
      timeframe?: string;
      description: string;
    };
  }>;
  achievementsWithMetrics?: Array<{
    task: string;
    metrics: {
      number?: string;
      percentage?: string;
      money?: string;
      timeframe?: string;
      description: string;
    };
  }>;

  // Generierte, ATS-optimierte Bulletpoints (Make/OpenAI)
  bullets?: string[];
}

export interface Project {
  type?: ProjectType;
  title: string;
  description: string;
  role: string;
  goal?: string;
  tools?: string[];
  result?: string;
  impact?: string;
  duration?: string;
  bulletPoints?: string[];
  link?: string;          // ✅ NEU: Live-Demo / Repo / Case-Study
}

export interface HardSkill {
  skill: string;
  level?: SkillLevel;
  yearsOfExperience?: string;
  category?: 'tool' | 'language' | 'method' | 'framework' | 'other';
}

export interface SoftSkill {
  skill: string;
  situation: string;      // konkrete Situation (macht Soft Skill belegbar)
  example?: string;
}

// ✅ NEU: eigener Sprach-Typ (vorher languages?: any[])
// Alias-Felder (name/proficiency) bleiben optional, damit bestehender
// Lese-Code (mapCVBuilderDataToPDF) nicht bricht.
export interface Language {
  language: string;
  level: LanguageLevel | string;
  name?: string;          // Alias für language
  proficiency?: string;   // Alias für level
  isNative?: boolean;
}

export interface WorkValues {
  values: string[];
  workStyle: string[];
}

export interface Hobbies {
  hobbies: string[];
  details?: string;
}

export interface JobTarget {
  hasTarget: boolean;
  company?: string;
  jobTitle?: string;
  description?: string;
  requirements?: string[];
}

export interface TargetJob {
  company: string;
  position: string;
  location?: string;
  jobDescription?: string;
}

export interface Stipendium {
  name: string;
  organization: string;
  year?: string;
  description?: string;
}

export interface VolunteerWork {
  role: string;
  organization: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  description?: string;
  bulletPoints?: string[];
  impact?: string;        // ✅ NEU: Wirkung/Ergebnis (oft vergessen)
}

export interface Certificate {
  name: string;
  issuer: string;
  year?: string;
  description?: string;
  url?: string;           // ✅ NEU: Verifizierungslink / Credential-ID
  expires?: string;       // ✅ NEU: Ablaufdatum (z. B. Sprachzertifikate)
}

// ✅ NEU: Bewerbungs-Präferenzen — reines Optimierungs-/Matching-Fuel,
// erscheint NICHT zwingend im PDF, hilft aber beim Zuschneiden.
export interface Preferences {
  earliestStart?: string;        // "sofort", "ab 09/2026"
  workModel?: WorkModel;
  willingToRelocate?: boolean;
  desiredLocations?: string[];
  salaryExpectation?: string;
}

// ✅ NEU: Antworten auf Gate-Fragen (steuern die Verzweigung im Wizard).
// Wird von den Skip-Prädikaten in CVWizard gelesen. Alles optional:
// undefined = "noch nicht gefragt", explizit false = "bewusst verneint".
export interface WizardFlags {
  hasWorkExperience?: boolean;
  hasFormalEducation?: boolean;   // Ausbildung/Studium
  hasProjects?: boolean;
  hasOtherLanguages?: boolean;    // außer Muttersprache
  // Opt-in-Cluster "Noch etwas?" — welche Zusatz-Sektionen der Nutzer wählt
  extras?: Array<'projects' | 'stipendien' | 'volunteer' | 'certificates' | 'hobbies'>;
}

export interface CVBuilderData {
  experienceLevel?: ExperienceLevel;
  targetRole?: RoleType;
  targetIndustry?: IndustryType;

  personalData?: PersonalData;
  schoolEducation?: SchoolEducation[];
  professionalEducation?: ProfessionalEducation[];
  workExperiences?: WorkExperience[];
  projects?: Project[];
  hardSkills?: HardSkill[];
  softSkills?: SoftSkill[];
  workValues?: WorkValues;
  hobbies?: Hobbies;
  jobTarget?: JobTarget;
  targetJob?: TargetJob;
  languages?: Language[];          // ✅ vorher any[]
  stipendien?: Stipendium[];
  volunteerWork?: VolunteerWork[];
  certificates?: Certificate[];

  // ✅ NEU
  preferences?: Preferences;
  flags?: WizardFlags;

  summary?: {
    variant: 'professional' | 'confident' | 'friendly';
    text: string;
  };
}

export interface StepConfig {
  id: string;
  title: string;
  avatarMessage: string;
  avatarInfo?: string;
  type: 'selection' | 'multi-selection' | 'text-input' | 'chips' | 'review' | 'motivation';
  options?: any[];
  dependsOn?: string;
  condition?: (data: CVBuilderData) => boolean;
}