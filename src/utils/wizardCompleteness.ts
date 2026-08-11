import { CVBuilderData } from '../types/cvBuilder';
import { isSectionSkipped } from '../config/cvQuestions';

export interface StepCompleteness {
  stepIndex: number;
  isComplete: boolean;
  missingCount: number;
}

// Step-Index → Section-Key. Spiegelt STEP_SECTION aus CVWizard.tsx (nach dem
// Bildungs-Merge: 13 Steps, Bildung = Index 2 ist immer sichtbar und daher NICHT
// gelistet). Nur verzweigbare/überspringbare Sektionen.
const STEP_SECTION: Record<number, string> = {
  3: 'workExperience',
  4: 'projects',
  5: 'stipendien',
  6: 'volunteerWork',
  7: 'certificates',
  11: 'hobbies',
};

// Pflichtschritte: Persönliche Daten, Berufserfahrung, Hard Skills, Soft Skills.
// Muss mit REQUIRED_STEP_INDICES in CVWizard.tsx übereinstimmen.
const REQUIRED_STEPS = [1, 3, 8, 9];

/**
 * Vollständigkeit pro Step — für alle 13 echten Indizes (0–12) nach dem
 * Bildungs-Merge und branch-aware: Eine per Gate/Cluster ausgeblendete Sektion
 * zählt als erledigt, damit sie in der Fortschrittsanzeige nicht als „offen"
 * erscheint.
 */
export function checkStepCompleteness(cvData: CVBuilderData, _isBeginner: boolean): StepCompleteness[] {
  const results: StepCompleteness[] = [];

  const push = (stepIndex: number, isComplete: boolean, missingCount = isComplete ? 0 : 1) => {
    const section = STEP_SECTION[stepIndex];
    if (section && isSectionSkipped(section, cvData)) {
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

  // 2: Bildung (Schule ODER Ausbildung/Studium) – immer sichtbar
  const hasEducation =
    (cvData.schoolEducation || []).length > 0 || (cvData.professionalEducation || []).length > 0;
  push(2, hasEducation);

  // 3: Berufserfahrung / Praktika (Pflicht)
  push(3, (cvData.workExperiences || []).length > 0);

  // 4: Projekte
  push(4, (cvData.projects || []).length > 0);

  // 5: Stipendien
  push(5, (cvData.stipendien || []).length > 0);

  // 6: Ehrenamt
  push(6, (cvData.volunteerWork || []).length > 0);

  // 7: Zertifikate
  push(7, (cvData.certificates || []).length > 0);

  // 8: Hard Skills (Pflicht)
  push(8, (cvData.hardSkills || []).length > 0);

  // 9: Soft Skills (Pflicht)
  push(9, (cvData.softSkills || []).length > 0);

  // 10: Werte & Arbeitsstil
  const wv = cvData.workValues;
  const hasWorkValues = (wv?.values?.length ?? 0) > 0 || (wv?.workStyle?.length ?? 0) > 0;
  push(10, hasWorkValues);

  // 11: Hobbys
  const hb = cvData.hobbies;
  const hasHobbies = (hb?.hobbies?.length ?? 0) > 0 || !!hb?.details?.trim();
  push(11, hasHobbies);

  // 12: Abschluss
  push(12, true, 0);

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
  // Übersprungene Pflicht-Sektionen (z. B. Berufserfahrung bei „Nein") sind durch
  // die branch-aware Logik oben bereits als erledigt markiert und fallen hier raus.
  return REQUIRED_STEPS.filter(i => !completeness[i]?.isComplete);
}