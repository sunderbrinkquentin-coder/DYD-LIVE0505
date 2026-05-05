export interface FieldConfig {
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'month' | 'checkbox' | 'select';
  placeholder?: string;
  rows?: number;
  required?: boolean;
  options?: string[];
  disabledIf?: string;
}

export interface SectionFieldsConfig {
  [sectionId: string]: FieldConfig[];
}

export const sectionFieldsConfig: SectionFieldsConfig = {
  berufserfahrung: [
    {
      name: 'position',
      label: 'Position',
      type: 'text',
      placeholder: 'z.B. Senior Product Manager',
      required: true,
    },
    {
      name: 'firma',
      label: 'Unternehmen',
      type: 'text',
      placeholder: 'z.B. BMW AG',
      required: true,
    },
    {
      name: 'von',
      label: 'Von',
      type: 'month',
      required: true,
    },
    {
      name: 'bis',
      label: 'Bis',
      type: 'month',
      required: false,
      disabledIf: 'aktuell',
    },
    {
      name: 'aktuell',
      label: 'Ich bin aktuell noch dort',
      type: 'checkbox',
    },
    {
      name: 'aufgaben',
      label: 'Hauptaufgaben',
      type: 'textarea',
      placeholder: 'Beschreibe deine Aufgaben...',
      rows: 4,
      required: true,
    },
  ],
  bildung: [
    {
      name: 'abschluss',
      label: 'Abschluss',
      type: 'select',
      required: true,
      options: [
        'Bachelor of Science (B.Sc.)',
        'Bachelor of Arts (B.A.)',
        'Bachelor of Engineering (B.Eng.)',
        'Master of Science (M.Sc.)',
        'Master of Arts (M.A.)',
        'Master of Engineering (M.Eng.)',
        'Master of Business Administration (MBA)',
        'Diplom',
        'Staatsexamen',
        'Promotion (Dr.)',
        'Ausbildung',
        'Abitur',
        'Fachabitur',
        'Realschulabschluss',
        'Hauptschulabschluss',
        'Sonstiges',
      ],
    },
    {
      name: 'institution',
      label: 'Uni/Schule',
      type: 'text',
      placeholder: 'z.B. TU München',
      required: true,
    },
    {
      name: 'schwerpunkt',
      label: 'Fachrichtung',
      type: 'text',
      placeholder: 'z.B. Informatik, Machine Learning',
    },
    {
      name: 'von',
      label: 'Von',
      type: 'month',
      required: true,
    },
    {
      name: 'bis',
      label: 'Bis',
      type: 'month',
      required: true,
    },
    {
      name: 'note',
      label: 'Note',
      type: 'text',
      placeholder: 'z.B. 1.5 oder Gut',
    },
    {
      name: 'beschreibung',
      label: 'Besonderheiten',
      type: 'textarea',
      placeholder: 'z.B. Stipendium, Auszeichnungen...',
      rows: 2,
    },
  ],
  projekte: [
    {
      name: 'titel',
      label: 'Projektname',
      type: 'text',
      placeholder: 'z.B. CRM-Implementierung',
      required: true,
    },
    {
      name: 'rolle',
      label: 'Rolle',
      type: 'text',
      placeholder: 'z.B. Projektleiter',
      required: true,
    },
    {
      name: 'von',
      label: 'Von',
      type: 'month',
      required: true,
    },
    {
      name: 'bis',
      label: 'Bis',
      type: 'month',
      required: true,
    },
    {
      name: 'beschreibung',
      label: 'Beschreibung',
      type: 'textarea',
      placeholder: 'Ziel und Ergebnisse...',
      rows: 4,
      required: true,
    },
  ],
  zertifikate: [
    {
      name: 'titel',
      label: 'Zertifikat',
      type: 'text',
      placeholder: 'z.B. Certified Scrum Master',
      required: true,
    },
    {
      name: 'organisation',
      label: 'Organisation',
      type: 'text',
      placeholder: 'z.B. Scrum Alliance',
      required: true,
    },
    {
      name: 'datum',
      label: 'Erhalten am',
      type: 'month',
      required: true,
    },
  ],
};
