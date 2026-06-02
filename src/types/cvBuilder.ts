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

const PROJECT_TYPES = [
  { label: 'Uni-/Schulprojekt', value: 'university' },
  { label: 'Abschlussarbeit / Thesis', value: 'thesis' },
  { label: 'Eigenes / privates Projekt', value: 'personal' },
  { label: 'Internes Projekt (Firma)', value: 'internal' },
  { label: 'Kundenprojekt', value: 'client' },
  { label: 'Cross-functional', value: 'cross-functional' },
];

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
  focus?: string[];
  projects?: string[];
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
  focus?: string[];
  projects?: string[];
  grades?: string;
}

// 🔥 ERWEITERT: Individueller und branchenübergreifend (nicht nur IT)
export interface WorkExperience {
  jobTitle: string;
  company: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;

  // ✅ NEU: Branchenübergreifende Felder
  industry?: string; // z.B. "Sales", "Marketing", "Finance", "HR", "Logistik", "Health", "IT", "Produktion", "öffentlicher Dienst"
  roleLevel?: string; // z.B. "Werkstudent", "Junior", "Senior", "Lead", "Manager", "Head", "Director"
  revenue?: string; // z.B. "500.000€ Umsatzverantwortung"
  budget?: string; // z.B. "100.000€ Budgetverantwortung"
  teamSize?: string; // z.B. "5 Mitarbeiter", "Teamleitung 3 Personen"
  customersMarket?: string; // z.B. "B2B Key Accounts", "B2C Retail", "DACH-Region"
  achievementsRaw?: string; // Freitext für messbare Erfolge

  // ✅ Bestehende Felder
  tasks: string[];
  responsibilities: string[];
  tools: string[];
  kpis: string[];
  achievements: string[];

  // ✅ NEU: Aufgaben und Erfolge mit konkreten Kennzahlen
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

  // ✅ NEU: Generierte Bulletpoints von Make/OpenAI
  bullets?: string[]; // 3-5 ATS-optimierte Bulletpoints pro Station
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
}

export interface HardSkill {
  skill: string;
  level?: SkillLevel;
  yearsOfExperience?: string;
  category?: 'tool' | 'language' | 'method' | 'framework' | 'other';
}

export interface SoftSkill {
  skill: string;
  situation: string;
  example?: string;
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
}

export interface Certificate {
  name: string;
  issuer: string;
  year?: string;
  description?: string;
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
  targetJob?: TargetJob; // NEW: For TargetJobStep
  languages?: any[];
  stipendien?: Stipendium[];
  volunteerWork?: VolunteerWork[];
  certificates?: Certificate[];

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
