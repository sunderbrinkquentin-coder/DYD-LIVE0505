export interface CVDataFromEditor {
  contact?: {
    vorname?: string;
    nachname?: string;
    email?: string;
    telefon?: string;
    ort?: string;
    plz?: string;
    linkedin?: string;
    website?: string;
    position?: string;
    profil?: string;
  };
  education?: Array<{
    institution?: string;
    abschluss?: string;
    von?: string;
    bis?: string;
    note?: string;
  }>;
  experience?: Array<{
    position?: string;
    firma?: string;
    von?: string;
    bis?: string;
    aktuell?: boolean;
    aufgaben?: string;
    bullets?: string[];
  }>;
  skills?: string[];
  projects?: any[];
  languages?: Array<{
    sprache?: string;
    niveau?: string;
  }>;
  certificates?: Array<{
    titel?: string;
    organisation?: string;
    datum?: string;
  }>;
  additional?: string;
}

export interface CVDataForDatabase {
  contact: Record<string, any> | null;
  education: Record<string, any> | null;
  experience: Record<string, any> | null;
  skills: Record<string, any> | null;
  projects: Record<string, any> | null;
  languages: Record<string, any> | null;
  certificates: Record<string, any> | null;
  additional: string | null;
}

export function mapCVDataForDatabase(cvData: CVDataFromEditor): CVDataForDatabase {
  return {
    contact: cvData.contact ? {
      vorname: cvData.contact.vorname || '',
      nachname: cvData.contact.nachname || '',
      email: cvData.contact.email || '',
      telefon: cvData.contact.telefon || '',
      ort: cvData.contact.ort || '',
      plz: cvData.contact.plz || '',
      linkedin: cvData.contact.linkedin || '',
      website: cvData.contact.website || '',
      position: cvData.contact.position || '',
      profil: cvData.contact.profil || '',
    } : null,

    education: cvData.education && cvData.education.length > 0 ? {
      entries: cvData.education.map(edu => ({
        institution: edu.institution || '',
        abschluss: edu.abschluss || '',
        von: edu.von || '',
        bis: edu.bis || '',
        note: edu.note || '',
      }))
    } : null,

    experience: cvData.experience && cvData.experience.length > 0 ? {
      entries: cvData.experience.map(exp => ({
        position: exp.position || '',
        firma: exp.firma || '',
        von: exp.von || '',
        bis: exp.bis || '',
        aktuell: exp.aktuell || false,
        aufgaben: exp.aufgaben || '',
        bullets: exp.bullets || [],
      }))
    } : null,

    skills: cvData.skills && cvData.skills.length > 0 ? {
      list: cvData.skills
    } : null,

    projects: cvData.projects && cvData.projects.length > 0 ? {
      entries: cvData.projects
    } : null,

    languages: cvData.languages && cvData.languages.length > 0 ? {
      entries: cvData.languages.map(lang => ({
        sprache: lang.sprache || '',
        niveau: lang.niveau || '',
      }))
    } : null,

    certificates: cvData.certificates && cvData.certificates.length > 0 ? {
      entries: cvData.certificates.map(cert => ({
        titel: cert.titel || '',
        organisation: cert.organisation || '',
        datum: cert.datum || '',
      }))
    } : null,

    additional: cvData.additional || null,
  };
}

export function mapCVDataFromDatabase(dbData: any): CVDataFromEditor {
  const experience = dbData.optimized_experience?.entries || dbData.original_experience?.entries || [];

  const migratedExperience = experience.map((exp: any) => {
    if (typeof exp.erfolge === 'string') {
      return {
        ...exp,
        erfolge: exp.erfolge
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0),
        aufgaben: exp.aufgaben || exp.beschreibung || '',
      };
    }
    return {
      ...exp,
      aufgaben: exp.aufgaben || exp.beschreibung || '',
    };
  });

  return {
    contact: dbData.optimized_contact || dbData.original_contact || {},

    education: (dbData.optimized_education?.entries || dbData.original_education?.entries || []),

    experience: migratedExperience,

    skills: (dbData.optimized_skills?.list || dbData.original_skills?.list || []),

    projects: (dbData.optimized_projects?.entries || dbData.original_projects?.entries || []),

    languages: (dbData.optimized_languages?.entries || dbData.original_languages?.entries || []),

    certificates: (dbData.optimized_certificates?.entries || dbData.original_certificates?.entries || []),

    additional: dbData.optimized_additional || dbData.original_additional || '',
  };
}

export interface CVBuilderData {
  experienceLevel?: string;
  targetRole?: string;
  targetIndustry?: string;
  personalData?: {
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
  };
  schoolEducation?: {
    type: string;
    school: string;
    graduation: string;
    year: string;
    focus?: string[];
    projects?: string[];
  };
  professionalEducation?: Array<{
    type: string;
    institution: string;
    degree: string;
    startYear: string;
    endYear: string;
    focus?: string[];
    projects?: string[];
    grades?: string;
  }>;
  workExperiences?: Array<{
    jobTitle: string;
    company: string;
    location?: string;
    startDate: string;
    endDate: string;
    current?: boolean;
    tasks?: string[];
    responsibilities?: string[];
    tools?: string[];
    kpis?: string[];
    achievements?: string[];
    bullets?: string[];
  }>;
  projects?: Array<{
    type?: string;
    title: string;
    description: string;
    role?: string;
    goal?: string;
    tools?: string[];
    result?: string;
    impact?: string;
    duration?: string;
  }>;
  hardSkills?: Array<{
    skill: string;
    level?: string;
    yearsOfExperience?: string;
    category?: string;
  }>;
  softSkills?: Array<{
    skill: string;
    situation?: string;
    example?: string;
  }>;
  languages?: Array<{
    name?: string;
    language?: string;
    level?: string;
    proficiency?: string;
  }>;
  hobbies?: {
    hobbies: string[];
    details?: string;
  };
  summary?: {
    variant?: string;
    text: string;
  };
}

export interface CVDataForPDF {
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
  }>;
  education: Array<{
    degree: string;
    institution: string;
    timeframe: string;
    details?: string;
    city?: string;
    country?: string;
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
  interests?: string;
}

function formatTimeframe(startDate: string, endDate: string, current?: boolean): string {
  if (!startDate) return '';

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    // YYYY-MM format (canonical): convert to MM/YYYY
    const isoMatch = dateStr.match(/^(\d{4})-(\d{2})$/);
    if (isoMatch) return `${isoMatch[2]}/${isoMatch[1]}`;
    // MM/YYYY or MM.YYYY already — return as-is
    if (/^\d{2}[./]\d{4}$/.test(dateStr)) return dateStr.replace('.', '/');
    // YYYY only
    if (/^\d{4}$/.test(dateStr)) return dateStr;
    // Legacy split-by-dash fallback (original behavior)
    const parts = dateStr.split('-');
    if (parts.length >= 2) return `${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  const start = formatDate(startDate);
  const end = current ? 'Heute' : formatDate(endDate);

  return start && end ? `${start} - ${end}` : start || end;
}

function getSortYear(exp: { startDate?: string; startYear?: string }): number {
  const raw = exp.startDate || exp.startYear || '';
  if (!raw) return 0;
  const parts = raw.split(/[-./]/);
  const year = parseInt(parts[0] || '0', 10);
  const month = parseInt(parts[1] || '0', 10);
  return year * 100 + month;
}

export function sortExperiencesNewestFirst<T extends { startDate?: string; startYear?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => getSortYear(b) - getSortYear(a));
}

export function mapCVBuilderDataToPDF(data: CVBuilderData): CVDataForPDF {
  const pd = data.personalData || {};

  const name = [pd.firstName, pd.lastName].filter(Boolean).join(' ') || 'Ihr Name';
  const location = [pd.zipCode, pd.city].filter(Boolean).join(' ') || '';

  const experience = sortExperiencesNewestFirst(data.workExperiences || []).map(exp => ({
    position: exp.jobTitle || 'Position',
    company: exp.company || 'Unternehmen',
    timeframe: formatTimeframe(exp.startDate, exp.endDate, exp.current),
    bullets: exp.bullets || exp.achievements || exp.responsibilities || exp.tasks || []
  }));

  const education: Array<any> = [];

  if (data.schoolEducation) {
    education.push({
      degree: data.schoolEducation.graduation || 'Schulabschluss',
      institution: data.schoolEducation.school || 'Schule',
      timeframe: data.schoolEducation.year || '',
      details: data.schoolEducation.focus?.join(', ')
    });
  }

  if (data.professionalEducation && data.professionalEducation.length > 0) {
    data.professionalEducation.forEach(edu => {
      education.push({
        degree: edu.degree || 'Abschluss',
        institution: edu.institution || 'Institution',
        timeframe: formatTimeframe(edu.startYear, edu.endYear),
        details: edu.focus?.join(', ')
      });
    });
  }

  const allSkills = [
    ...(data.hardSkills || []).map(s => s.skill),
    ...(data.softSkills || []).map(s => s.skill)
  ];

  const languages = (data.languages || []).map(lang => ({
    name: lang.name || lang.language || 'Sprache',
    level: lang.level || lang.proficiency || 'Grundkenntnisse'
  }));

  const projects = (data.projects || []).map(proj => ({
    title: proj.title || 'Projekt',
    description: proj.description || proj.result || ''
  }));

  const hobbiesText = data.hobbies?.hobbies?.join(', ') || '';

  return {
    name,
    jobTitle: data.targetRole || 'Gewünschte Position',
    email: pd.email || 'email@example.com',
    phone: pd.phone || '',
    location,
    profile: data.summary?.text || '',
    experience,
    education,
    skills: allSkills,
    languages: languages.length > 0 ? languages : undefined,
    projects: projects.length > 0 ? projects : undefined,
    interests: hobbiesText || undefined
  };
}

/**
 * Maps cv_data.editor_data (from CVLiveEditor / Make.com webhook output)
 * into the CVBuilderData wizard format.
 *
 * editor_data shape example:
 * {
 *   contact: { vorname, nachname, email, telefon, ort, plz, linkedin, website },
 *   experience: [{ position, firma, von, bis, aktuell, aufgaben, bullets }],
 *   education: [{ institution, abschluss, von, bis, note }],
 *   skills: string[],
 *   languages: [{ sprache, niveau }],
 *   projects: [...],
 * }
 */
const MONTH_MAP: Record<string, string> = {
  january: '01', januar: '01', jan: '01',
  february: '02', februar: '02', feb: '02',
  march: '03', märz: '03', maerz: '03', mar: '03', mär: '03',
  april: '04', apr: '04',
  may: '05', mai: '05',
  june: '06', juni: '06', jun: '06',
  july: '07', juli: '07', jul: '07',
  august: '08', aug: '08',
  september: '09', sep: '09', sept: '09',
  october: '10', oktober: '10', oct: '10', okt: '10',
  november: '11', nov: '11',
  december: '12', dezember: '12', dec: '12', dez: '12',
};

function parseDateToMonthYear(raw: string): { month: string; year: string } {
  if (!raw) return { month: '', year: '' };
  const s = raw.trim();

  const numericMatch = s.match(/^(\d{1,2})[./-](\d{4})$/);
  if (numericMatch) return { month: numericMatch[1].padStart(2, '0'), year: numericMatch[2] };

  const yearOnlyMatch = s.match(/^(\d{4})$/);
  if (yearOnlyMatch) return { month: '', year: yearOnlyMatch[1] };

  const parts = s.split(/[\s,]+/).filter(Boolean);
  let month = '';
  let year = '';
  for (const part of parts) {
    if (/^\d{4}$/.test(part)) { year = part; continue; }
    const key = part.toLowerCase();
    if (MONTH_MAP[key]) { month = MONTH_MAP[key]; continue; }
  }
  return { month, year };
}

export function mapEditorDataToWizard(editorData: any): CVBuilderData {
  if (!editorData || typeof editorData !== 'object') return {};

  const safe = (v: any) => (v == null ? '' : String(v).trim());

  // Support both German field names (vorname/nachname) and English (firstName/first_name)
  // contact can also be stored as personal_data
  const contact = editorData.contact || editorData.personal_data || editorData.personalInfo || {};

  const firstName =
    safe(contact.vorname || contact.firstName || contact.first_name) ||
    (() => {
      const full = safe(contact.name || contact.full_name || contact.fullName);
      return full ? full.split(/\s+/)[0] : '';
    })();

  const lastName =
    safe(contact.nachname || contact.lastName || contact.last_name) ||
    (() => {
      const full = safe(contact.name || contact.full_name || contact.fullName);
      const parts = full ? full.split(/\s+/).filter(Boolean) : [];
      return parts.length > 1 ? parts.slice(1).join(' ') : '';
    })();

  const rawCity = safe(contact.ort || contact.city || contact.location || contact.stadt);
  const city = rawCity.includes(',') ? rawCity.split(',')[0].trim() : rawCity;

  const personalData = {
    firstName,
    lastName,
    email: safe(contact.email),
    phone: safe(contact.telefon || contact.phone || contact.tel),
    city,
    zipCode: safe(contact.plz || contact.zip || contact.zipCode || contact.postal_code),
    linkedin: safe(contact.linkedin),
    website: safe(contact.website || contact.url),
    portfolio: safe(contact.portfolio),
    photoUrl: safe(contact.photoUrl || contact.photo_url || contact.avatar),
  };

  // Support experience / experiences / work_experience / workExperiences
  const rawExperience: any[] =
    Array.isArray(editorData.experience) ? editorData.experience :
    Array.isArray(editorData.experiences) ? editorData.experiences :
    Array.isArray(editorData.work_experience) ? editorData.work_experience :
    Array.isArray(editorData.workExperiences) ? editorData.workExperiences :
    [];

  const PRESENT_STRINGS = new Set(['present', 'heute', 'now', 'aktuell', 'bis heute', 'current', 'laufend', 'ongoing']);

  const workExperiences: CVBuilderData['workExperiences'] = rawExperience.map((exp: any) => {
    const rawEndDate = safe(exp.bis || exp.endDate || exp.end_date || exp.date_to || exp.to);
    const endDateIsPresent = PRESENT_STRINGS.has(rawEndDate.toLowerCase().trim());
    const isCurrent = !!(exp.aktuell || exp.current || exp.isCurrent || exp.is_current) || endDateIsPresent;
    const bullets: string[] = Array.isArray(exp.bullets) ? exp.bullets.filter(Boolean) :
      Array.isArray(exp.bulletPoints) ? exp.bulletPoints.filter(Boolean) :
      Array.isArray(exp.aufgaben_list) ? exp.aufgaben_list.filter(Boolean) :
      Array.isArray(exp.tasks) ? exp.tasks.filter(Boolean) :
      typeof exp.aufgaben === 'string' ? exp.aufgaben.split('\n').map((s: string) => s.trim()).filter(Boolean) :
      [];

    const tasksWithMetrics = bullets.map((b: string) => ({
      task: b,
      metrics: { description: b },
    }));

    const rawStartDate = safe(exp.von || exp.startDate || exp.start_date || exp.date_from || exp.from);
    const startParsed = parseDateToMonthYear(rawStartDate);
    const endParsed = isCurrent ? { month: '', year: '' } : parseDateToMonthYear(rawEndDate);

    // Normalize startDate/endDate to YYYY-MM format (required by formatTimeframe)
    const normalizedStartDate = startParsed.year && startParsed.month
      ? `${startParsed.year}-${startParsed.month}`
      : startParsed.year || rawStartDate;
    const normalizedEndDate = isCurrent ? 'Heute'
      : (endParsed.year && endParsed.month ? `${endParsed.year}-${endParsed.month}` : endParsed.year || rawEndDate);

    return {
      jobTitle: safe(exp.position || exp.jobTitle || exp.job_title || exp.title || exp.role),
      company: safe(exp.firma || exp.company || exp.arbeitgeber || exp.employer),
      location: safe(exp.location || exp.ort || exp.stadt),
      startDate: normalizedStartDate,
      endDate: normalizedEndDate,
      startMonth: startParsed.month,
      startYear: startParsed.year,
      endMonth: endParsed.month,
      endYear: endParsed.year,
      current: isCurrent,
      tasks: bullets,
      responsibilities: [],
      tools: Array.isArray(exp.tools) ? exp.tools : [],
      kpis: [],
      achievements: Array.isArray(exp.achievements) ? exp.achievements : [],
      bullets,
      industry: safe(exp.industry || exp.branche),
      roleLevel: safe(exp.roleLevel || exp.role_level || exp.level),
      revenue: '',
      budget: '',
      teamSize: '',
      customersMarket: '',
      achievementsRaw: safe(exp.erfolge || exp.achievementsRaw),
      tasksWithMetrics,
      achievementsWithMetrics: [],
    };
  });

  // Support education / educations / ausbildung
  const rawEducation: any[] =
    Array.isArray(editorData.education) ? editorData.education :
    Array.isArray(editorData.educations) ? editorData.educations :
    Array.isArray(editorData.ausbildung) ? editorData.ausbildung :
    Array.isArray(editorData.professionalEducation) ? editorData.professionalEducation :
    [];

  const professionalEducation: CVBuilderData['professionalEducation'] = rawEducation.map((edu: any) => {
    const rawEduStart = safe(edu.von || edu.startYear || edu.start_year || edu.date_from || edu.start);
    const rawEduEnd = safe(edu.bis || edu.endYear || edu.end_year || edu.date_to || edu.end);
    const eduStartParsed = parseDateToMonthYear(rawEduStart);
    const eduEndParsed = parseDateToMonthYear(rawEduEnd);
    return {
      type: (edu.type as any) || 'university',
      institution: safe(edu.institution || edu.schule || edu.school || edu.university || edu.hochschule),
      degree: safe(edu.abschluss || edu.degree || edu.titel || edu.title || edu.qualification || edu.description),
      startYear: eduStartParsed.year || rawEduStart,
      endYear: eduEndParsed.year || rawEduEnd,
      startMonth: eduStartParsed.month || safe(edu.startMonth || edu.start_month),
      endMonth: eduEndParsed.month || safe(edu.endMonth || edu.end_month),
      location: safe(edu.location || edu.ort),
      focus: Array.isArray(edu.focus) ? edu.focus : Array.isArray(edu.schwerpunkte) ? edu.schwerpunkte : [],
      projects: [],
      grades: safe(edu.note || edu.grade || edu.grades || edu.gpa),
    };
  });

  // Support skills / hard_skills / hardSkills
  const rawSkills: any[] =
    Array.isArray(editorData.skills) ? editorData.skills :
    Array.isArray(editorData.hard_skills) ? editorData.hard_skills :
    Array.isArray(editorData.hardSkills) ? editorData.hardSkills :
    Array.isArray(editorData.kenntnisse) ? editorData.kenntnisse :
    [];

  const hardSkills: CVBuilderData['hardSkills'] = rawSkills
    .map((s: any) => ({
      skill: typeof s === 'string' ? s : safe(s?.name || s?.skill || s?.titel || s?.title),
      level: (s?.level || s?.niveau || 'intermediate') as any,
      yearsOfExperience: safe(s?.years || s?.jahre || ''),
      category: (s?.category || s?.kategorie || 'other') as any,
    }))
    .filter((s: any) => s.skill);

  // Support soft_skills / softSkills
  const rawSoftSkills: any[] =
    Array.isArray(editorData.soft_skills) ? editorData.soft_skills :
    Array.isArray(editorData.softSkills) ? editorData.softSkills :
    [];

  const softSkills: CVBuilderData['softSkills'] = rawSoftSkills
    .map((s: any) => ({
      skill: typeof s === 'string' ? s : safe(s?.name || s?.skill),
      situation: safe(s?.situation || s?.example || ''),
      example: safe(s?.example || ''),
    }))
    .filter((s: any) => s.skill);

  // Languages
  const rawLanguages: any[] =
    Array.isArray(editorData.languages) ? editorData.languages :
    Array.isArray(editorData.sprachen) ? editorData.sprachen :
    [];

  const languages: CVBuilderData['languages'] = rawLanguages
    .map((l: any) => ({
      language: safe(l.sprache || l.language || l.name),
      level: safe(l.niveau || l.level || l.proficiency) || 'intermediate',
    }))
    .filter((l: any) => l.language);

  // Projects
  const rawProjects: any[] =
    Array.isArray(editorData.projects) ? editorData.projects :
    Array.isArray(editorData.projekte) ? editorData.projekte :
    [];

  const projects: CVBuilderData['projects'] = rawProjects
    .map((p: any) => ({
      type: (p.type || 'personal') as any,
      title: safe(p.title || p.titel || p.name),
      description: safe(p.description || p.beschreibung || p.result || p.ergebnis || ''),
      role: safe(p.role || p.rolle || ''),
      goal: safe(p.goal || p.ziel || ''),
      tools: Array.isArray(p.tools) ? p.tools : [],
      result: safe(p.result || p.ergebnis || ''),
      impact: safe(p.impact || ''),
      duration: safe(p.duration || p.dauer || ''),
    }))
    .filter((p: any) => p.title);

  const experienceCount = workExperiences.length;
  const experienceLevel: CVBuilderData['experienceLevel'] =
    experienceCount >= 2 ? 'experienced' : experienceCount === 1 ? 'some-experience' : 'beginner';

  const rawSummary = editorData.summary || editorData.zusammenfassung || editorData.profil || '';
  const summaryText = typeof rawSummary === 'string' ? rawSummary.trim() :
    typeof rawSummary?.text === 'string' ? rawSummary.text.trim() : '';
  const summary: CVBuilderData['summary'] = summaryText
    ? { variant: typeof rawSummary?.variant === 'string' ? rawSummary.variant : 'professional', text: summaryText }
    : undefined;

  return {
    experienceLevel,
    personalData,
    workExperiences,
    professionalEducation,
    hardSkills,
    softSkills: softSkills.length > 0 ? softSkills : [],
    languages,
    projects,
    workValues: { values: [], workStyle: [] },
    hobbies: { hobbies: [], details: '' },
    schoolEducation: undefined,
    summary,
  };
}
