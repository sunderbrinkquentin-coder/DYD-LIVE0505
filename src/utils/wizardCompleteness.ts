import { CVBuilderData } from '../types/cvBuilder';
import { isSectionSkipped } from '../config/cvQuestions';

export interface StepCompleteness {
  stepIndex: number;
  isComplete: boolean;
  missingCount: number;
}

// Step-Index → Section-Key. Spiegelt STEP_SECTION aus CVWizard.tsx.
// Nur verzweigbare/überspringbare Sektionen; Schulbildung (2) bleibt immer
// sichtbar und ist daher bewusst NICHT gelistet.
const STEP_SECTION: Record<number, string> = {
  3: 'professionalEducation',
  4: 'workExperience',
  5: 'projects',
  6: 'stipendien',
  7: 'volunteerWork',
  8: 'certificates',
  12: 'hobbies',
};

// Pflichtschritte: Persönliche Daten, Berufserfahrung, Hard Skills, Soft Skills.
// Muss mit REQUIRED_STEP_INDICES in CVWizard.tsx übereinstimmen.
const REQUIRED_STEPS = [1, 4, 9, 10];

/**
 * Vollständigkeit pro Step — jetzt für alle 14 echten Indizes (0–13) und
 * branch-aware: Eine per Gate/Cluster ausgeblendete Sektion zählt als erledigt,
 * damit sie in der Fortschrittsanzeige nicht als „offen" erscheint.
 */
export function checkStepCompleteness(cvData: CVBuilderData, _isBeginner: boolean): StepCompleteness[] {
  const results: StepCompleteness[] = [];

  const push = (stepIndex: number, isComplete: boolean, missingCount = isComplete ? 0 : 1) => {
    const section = STEP_SECTION[stepIndex];
    if (section && isSectionSkipped(section, cvData)) {
      // Ausgeblendet → gilt als erledigt (nicht offen)
      results.push({ stepIndex, isComplete: true, missingCount: 0 });
    } else {
      results.push({ stepIndex, isComplete, missingCount });
    }
  };

  // 0: Erfahrungslevel
  push(0, !!cvData.experienceLevel);

  // 1: Persönliche Daten (Pflicht)
  const pd = cvData.personalData || {};
  const missingPersonal = [!pd.firstName, !pd.lastName, !pd.city, !pd.email, !pd.phone].filter(Boolean).length;
  push(1, missingPersonal === 0, missingPersonal);

  // 2: Schulbildung (optional, immer sichtbar)
  push(2, (cvData.schoolEducation || []).length > 0);

  // 3: Ausbildung / Studium
  push(3, (cvData.professionalEducation || []).length > 0);

  // 4: Berufserfahrung / Praktika (Pflicht)
  push(4, (cvData.workExperiences || []).length > 0);

  // 5: Projekte
  push(5, (cvData.projects || []).length > 0);

  // 6: Stipendien
  push(6, (cvData.stipendien || []).length > 0);

  // 7: Ehrenamt
  push(7, (cvData.volunteerWork || []).length > 0);

  // 8: Zertifikate
  push(8, (cvData.certificates || []).length > 0);

  // 9: Hard Skills (Pflicht)
  push(9, (cvData.hardSkills || []).length > 0);

  // 10: Soft Skills (Pflicht)
  push(10, (cvData.softSkills || []).length > 0);

  // 11: Werte & Arbeitsstil
  const wv = cvData.workValues;
  const hasWorkValues = (wv?.values?.length ?? 0) > 0 || (wv?.workStyle?.length ?? 0) > 0;
  push(11, hasWorkValues);

  // 12: Hobbys
  const hb = cvData.hobbies;
  const hasHobbies = (hb?.hobbies?.length ?? 0) > 0 || !!hb?.details?.trim();
  push(12, hasHobbies);

  // 13: Abschluss
  push(13, true, 0);

  return results;
}

export function findFirstIncompleteStep(cvData: CVBuilderData, isBeginner: boolean, startFrom = 1): number {
  const completeness = checkStepCompleteness(cvData, isBeginner);
  for (const stepIndex of REQUIRED_STEPS) {
    if (stepIndex >= startFrom && !completeness[stepIndex]?.isComplete) {
      return stepIndex;
    }
  }
  return startFrom;
}

export function getIncompleteRequiredSteps(cvData: CVBuilderData, isBeginner: boolean): number[] {
  const completeness = checkStepCompleteness(cvData, isBeginner);
  // Übersprungene Pflicht-Sektionen (z. B. Berufserfahrung bei „Nein")
  // sind durch die branch-aware Logik oben bereits als erledigt markiert
  // und fallen hier automatisch heraus.
  return REQUIRED_STEPS.filter(i => !completeness[i]?.isComplete);
}