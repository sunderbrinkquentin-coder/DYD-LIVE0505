import { CVBuilderData } from '../types/cvBuilder';

export interface StepCompleteness {
  stepIndex: number;
  isComplete: boolean;
  missingCount: number;
}

export function checkStepCompleteness(cvData: CVBuilderData, isBeginner: boolean): StepCompleteness[] {
  const results: StepCompleteness[] = [];

  // Step 0: Experience Level
  results.push({
    stepIndex: 0,
    isComplete: !!cvData.experienceLevel,
    missingCount: cvData.experienceLevel ? 0 : 1,
  });

  // Step 1: Personal Data
  const pd = cvData.personalData || {};
  const missingPersonal = [!pd.firstName, !pd.lastName, !pd.city, !pd.email, !pd.phone].filter(Boolean).length;
  results.push({ stepIndex: 1, isComplete: missingPersonal === 0, missingCount: missingPersonal });

  // Step 2: School Education (always optional – skip)
  const school = cvData.schoolEducation || [];
  results.push({ stepIndex: 2, isComplete: school.length > 0, missingCount: school.length === 0 ? 1 : 0 });

  // Step 3: Professional Education
  const profEdu = cvData.professionalEducation || [];
  results.push({ stepIndex: 3, isComplete: profEdu.length > 0, missingCount: profEdu.length === 0 ? 1 : 0 });

  // Step 4: Work Experiences / Internships
  const workExp = cvData.workExperiences || [];
  results.push({ stepIndex: 4, isComplete: workExp.length > 0, missingCount: workExp.length === 0 ? 1 : 0 });

  // Step 5: Projects (always optional)
  const projects = cvData.projects || [];
  results.push({ stepIndex: 5, isComplete: projects.length > 0, missingCount: projects.length === 0 ? 1 : 0 });

  // Step 6: Hard Skills
  const hardSkills = cvData.hardSkills || [];
  results.push({ stepIndex: 6, isComplete: hardSkills.length > 0, missingCount: hardSkills.length === 0 ? 1 : 0 });

  // Step 7: Soft Skills
  const softSkills = cvData.softSkills || [];
  results.push({ stepIndex: 7, isComplete: softSkills.length > 0, missingCount: softSkills.length === 0 ? 1 : 0 });

  // Step 8: Work Values
  const wv = cvData.workValues;
  const hasWorkValues = (wv?.values?.length ?? 0) > 0 || (wv?.workStyle?.length ?? 0) > 0;
  results.push({ stepIndex: 8, isComplete: hasWorkValues, missingCount: hasWorkValues ? 0 : 1 });

  // Step 9: Hobbies
  const hb = cvData.hobbies;
  const hasHobbies = (hb?.hobbies?.length ?? 0) > 0 || !!hb?.details?.trim();
  results.push({ stepIndex: 9, isComplete: hasHobbies, missingCount: hasHobbies ? 0 : 1 });

  // Step 10: Completion
  results.push({ stepIndex: 10, isComplete: true, missingCount: 0 });

  return results;
}

export function findFirstIncompleteStep(cvData: CVBuilderData, isBeginner: boolean, startFrom = 1): number {
  const completeness = checkStepCompleteness(cvData, isBeginner);
  const requiredSteps = [1, 4, 6, 7];
  for (const stepIndex of requiredSteps) {
    if (stepIndex >= startFrom && !completeness[stepIndex]?.isComplete) {
      return stepIndex;
    }
  }
  return startFrom;
}

export function getIncompleteRequiredSteps(cvData: CVBuilderData, isBeginner: boolean): number[] {
  const completeness = checkStepCompleteness(cvData, isBeginner);
  // Only steps 1 (personal), 4 (work experience), 6 (hard skills), 7 (soft skills) are required.
  // Step 3 (professional education) is optional — not everyone has formal credentials.
  const requiredSteps = [1, 4, 6, 7];
  return requiredSteps.filter(i => !completeness[i]?.isComplete);
}
