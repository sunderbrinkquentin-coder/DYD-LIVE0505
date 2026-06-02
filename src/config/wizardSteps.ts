export interface WizardStep {
  id: string;
  label: string;
  shortLabel: string;
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'experienceLevel',
    label: 'Erfahrungslevel',
    shortLabel: 'Level'
  },
  {
    id: 'personalData',
    label: 'Persönliche Daten',
    shortLabel: 'Kontakt'
  },
  {
    id: 'schoolEducation',
    label: 'Schulbildung',
    shortLabel: 'Schule'
  },
  {
    id: 'professionalEducation',
    label: 'Ausbildung',
    shortLabel: 'Ausbildung'
  },
  {
    id: 'workExperience',
    label: 'Berufserfahrung',
    shortLabel: 'Erfahrung'
  },
  {
    id: 'projects',
    label: 'Projekte',
    shortLabel: 'Projekte'
  },
  {
    id: 'stipendien',
    label: 'Stipendien',
    shortLabel: 'Stipendien'
  },
  {
    id: 'volunteerWork',
    label: 'Ehrenamt',
    shortLabel: 'Ehrenamt'
  },
  {
    id: 'certificates',
    label: 'Zertifikate',
    shortLabel: 'Zertifikate'
  },
  {
    id: 'hardSkills',
    label: 'Fachliche Skills',
    shortLabel: 'Skills'
  },
  {
    id: 'softSkills',
    label: 'Soft Skills',
    shortLabel: 'Soft Skills'
  },
  {
    id: 'workValues',
    label: 'Arbeitswerte',
    shortLabel: 'Werte'
  },
  {
    id: 'hobbies',
    label: 'Hobbys',
    shortLabel: 'Hobbys'
  },
  {
    id: 'completion',
    label: 'Abschluss',
    shortLabel: 'Fertig'
  }
];

export function getStepById(stepId: string): WizardStep | undefined {
  return WIZARD_STEPS.find(step => step.id === stepId);
}

export function getStepByIndex(index: number): WizardStep | undefined {
  return WIZARD_STEPS[index];
}
