export interface StepContent {
  title: string;
  why: string;
  whatToInclude: string[];
  advantages: string[];
  tip?: string;
}

export const WIZARD_STEP_CONTENT: Record<string, StepContent> = {
  experienceLevel: {
    title: 'Erfahrungslevel',
    why: 'Dein Erfahrungslevel bestimmt, welche Inhalte und welcher Detailgrad für deinen Lebenslauf relevant sind. So können wir dir passende Vorschläge machen.',
    whatToInclude: [
      'Deine aktuelle Karrierestufe',
      'Jahre relevanter Berufserfahrung',
      'Art der bisherigen Positionen'
    ],
    advantages: [
      'Maßgeschneiderte Vorschläge für dein Level',
      'Passende Formulierungen und Begriffe',
      'Richtige Fokussierung deiner Stärken'
    ],
    tip: 'Sei ehrlich bei deinem Level - so passen die Vorschläge am besten zu dir.'
  },

  personalData: {
    title: 'Persönliche Daten',
    why: 'Deine Kontaktdaten sind das Erste, was Personaler sehen. Sie müssen vollständig und professionell sein, damit man dich erreichen kann.',
    whatToInclude: [
      'Vollständiger Name',
      'Professionelle E-Mail-Adresse',
      'Telefonnummer mit Vorwahl',
      'Aktuelle Stadt (Postleitzahl optional)',
      'LinkedIn-Profil (falls vorhanden)'
    ],
    advantages: [
      'Schnelle Kontaktaufnahme möglich',
      'Professioneller erster Eindruck',
      'Vollständiges Profil wirkt seriös',
      'Einfache Terminvereinbarung'
    ],
    tip: 'Nutze eine professionelle E-Mail-Adresse (idealerweise vorname.nachname@...)'
  },

  schoolEducation: {
    title: 'Schulbildung',
    why: 'Deine schulische Ausbildung zeigt deine Grundqualifikation und ist besonders wichtig bei Berufseinsteigern. Bei mehr Erfahrung kann dieser Teil kürzer ausfallen.',
    whatToInclude: [
      'Höchster Schulabschluss',
      'Name der Schule',
      'Abschlussjahr',
      'Notendurchschnitt (bei guten Noten)',
      'Relevante Schwerpunkte oder Leistungskurse'
    ],
    advantages: [
      'Zeigt deine Grundqualifikation',
      'Wichtig für Ausbildung & Studium',
      'Gute Noten sind ein Plus',
      'Schwerpunkte zeigen frühe Interessen'
    ],
    tip: 'Gute Noten ruhig erwähnen - bei Durchschnitt kannst du es weglassen.'
  },

  professionalEducation: {
    title: 'Berufliche Ausbildung',
    why: 'Deine Ausbildung oder dein Studium ist oft die Eintrittskarte für deinen Traumjob. Hier kannst du zeigen, was du gelernt hast und wo deine Expertise liegt.',
    whatToInclude: [
      'Art der Ausbildung (Studium, Ausbildung, Weiterbildung)',
      'Institution/Hochschule',
      'Studiengang oder Ausbildungsberuf',
      'Zeitraum (Start und Ende)',
      'Abschluss und Note (bei guten Ergebnissen)',
      'Relevante Schwerpunkte oder Module',
      'Besondere Projekte oder Abschlussarbeiten'
    ],
    advantages: [
      'Belegt deine fachliche Qualifikation',
      'Zeigt Spezialisierungen auf',
      'Gute Noten unterstreichen Leistung',
      'Projekte demonstrieren praktische Erfahrung'
    ],
    tip: 'Hebe Schwerpunkte hervor, die zur Zielposition passen.'
  },

  workExperience: {
    title: 'Berufserfahrung',
    why: 'Das ist der wichtigste Teil deines Lebenslaufs! Hier zeigst du, was du schon erreicht hast und welchen Mehrwert du einem Unternehmen bringst.',
    whatToInclude: [
      'Alle relevanten beruflichen Stationen',
      'Jobtitel und Unternehmen',
      'Zeitraum (Monat/Jahr)',
      'Konkrete Aufgaben und Verantwortlichkeiten',
      'Messbare Erfolge und Ergebnisse',
      'Verwendete Tools und Technologien',
      'Teamgröße oder Budget (bei Führungsrollen)'
    ],
    advantages: [
      'Beweist deine praktische Erfahrung',
      'Zahlen und Fakten überzeugen Personaler',
      'Zeigt deine Entwicklung auf',
      'Macht deine Erfolge sichtbar'
    ],
    tip: 'Nutze Zahlen und Fakten! "Umsatz um 25% gesteigert" wirkt besser als "Umsatz gesteigert".'
  },

  projects: {
    title: 'Projekte',
    why: 'Projekte zeigen, dass du eigenständig arbeiten kannst und über den Tellerrand hinausschaust. Sie demonstrieren praktische Fähigkeiten.',
    whatToInclude: [
      'Name und Beschreibung des Projekts',
      'Deine Rolle und Verantwortung',
      'Verwendete Technologien oder Methoden',
      'Zeitraum oder Dauer',
      'Konkrete Ergebnisse oder Erfolge',
      'Team-Setup (falls relevant)'
    ],
    advantages: [
      'Zeigt Initiative und Engagement',
      'Beweist praktische Fähigkeiten',
      'Ideal für Quereinsteiger',
      'Füllt Lücken bei wenig Berufserfahrung'
    ],
    tip: 'Auch Uni-Projekte, Freelance-Arbeiten oder persönliche Projekte zählen!'
  },

  hardSkills: {
    title: 'Fachliche Skills',
    why: 'Hard Skills sind messbare Fähigkeiten, die du brauchst, um deinen Job zu machen. Sie sind oft das erste, wonach Recruiter filtern.',
    whatToInclude: [
      'Software und Tools (z.B. Excel, SAP, Adobe)',
      'Methodenkenntnisse (z.B. Agile, Six Sigma)',
      'Zertifikate und Qualifikationen',
      'Branchenspezifisches Wissen',
      'Technische Kompetenzen'
    ],
    advantages: [
      'Wichtig für ATS-Systeme (Bewerbungssoftware)',
      'Zeigt konkrete Qualifikationen',
      'Oft Ausschlusskriterium bei Bewerbungen',
      'Macht dich vergleichbar mit anderen Kandidaten'
    ],
    tip: 'Priorisiere Skills, die in der Stellenanzeige gefordert werden!'
  },

  softSkills: {
    title: 'Soft Skills',
    why: 'Soft Skills zeigen, WIE du arbeitest. Sie sind entscheidend für Teamarbeit, Führung und den Umgang mit Herausforderungen.',
    whatToInclude: [
      'Persönliche Stärken (z.B. Kommunikation)',
      'Arbeitsweise (z.B. strukturiert, kreativ)',
      'Soziale Kompetenzen (z.B. Teamfähigkeit)',
      'Konkrete Situationen als Beweis',
      'Leadership-Qualitäten (bei Führungsrollen)'
    ],
    advantages: [
      'Unterscheidet dich von anderen Kandidaten',
      'Zeigt Cultural Fit mit dem Unternehmen',
      'Wichtig für Führungspositionen',
      'Macht dich als Person greifbar'
    ],
    tip: 'Belege jeden Soft Skill mit einem konkreten Beispiel aus deiner Erfahrung.'
  },

  workValues: {
    title: 'Arbeitswerte',
    why: 'Deine Werte zeigen, was dir im Job wichtig ist und helfen, den richtigen Cultural Fit zu finden. Das spart Zeit und erhöht die Jobzufriedenheit.',
    whatToInclude: [
      'Deine Top 3-5 Arbeitswerte',
      'Was dir in der Zusammenarbeit wichtig ist',
      'Welche Arbeitsumgebung dir liegt',
      'Deine Prioritäten im Berufsleben'
    ],
    advantages: [
      'Zeigt authentisches Profil',
      'Hilft beim Cultural Fit',
      'Vermeidet Fehlbesetzungen',
      'Macht dich als Person interessant'
    ],
    tip: 'Sei ehrlich - ein guter Match ist wichtiger als viele Bewerbungen.'
  },

  hobbies: {
    title: 'Hobbys & Interessen',
    why: 'Hobbys machen dich als Person greifbar und können Soft Skills unterstreichen. Sie sind oft ein guter Gesprächseinstieg im Interview.',
    whatToInclude: [
      '2-4 aussagekräftige Hobbys',
      'Aktivitäten, die Soft Skills zeigen',
      'Besondere Engagements oder Ehrenämter',
      'Langfristige Interessen (nicht Trends)'
    ],
    advantages: [
      'Zeigt dich als vollständige Person',
      'Kann Soft Skills unterstreichen',
      'Guter Gesprächseinstieg im Interview',
      'Ehrenamt zeigt Engagement'
    ],
    tip: 'Wähle Hobbys, die zu deiner Zielposition passen (z.B. Teamdport für Teamfähigkeit).'
  },

  targetJob: {
    title: 'Zielposition',
    why: 'Wenn wir wissen, welche Art von Job du suchst, können wir deinen Lebenslauf perfekt darauf abstimmen und die richtigen Keywords einbauen.',
    whatToInclude: [
      'Gewünschte Jobtitel',
      'Branche oder Industrie',
      'Unternehmensgröße (Start-up, Konzern, etc.)',
      'Besondere Anforderungen der Zielposition'
    ],
    advantages: [
      'Lebenslauf wird zielgerichtet optimiert',
      'Keywords passen zu deiner Zielposition',
      'Höhere Chancen bei ATS-Systemen',
      'Roter Faden wird klarer'
    ],
    tip: 'Sei spezifisch, aber nicht zu einschränkend - halte dir Optionen offen.'
  },

  completion: {
    title: 'Abschluss',
    why: 'Geschafft! Jetzt erstellen wir deinen perfekten Lebenslauf basierend auf allen Informationen.',
    whatToInclude: [
      'Template-Auswahl',
      'Finaler Check aller Daten',
      'Optional: Profilfoto hochladen',
      'Vorschau und Download'
    ],
    advantages: [
      'Professioneller Lebenslauf in Minuten',
      'ATS-optimiert und auf dich zugeschnitten',
      'Jederzeit editierbar',
      'Mehrere Format-Optionen (PDF, DOCX)'
    ],
    tip: 'Du kannst deinen Lebenslauf jederzeit im Dashboard bearbeiten und anpassen.'
  }
};
