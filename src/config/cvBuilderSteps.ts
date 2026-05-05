import { ExperienceLevel, RoleType, IndustryType } from '../types/cvBuilder';

export const ROLE_OPTIONS: Record<ExperienceLevel, { value: RoleType; label: string }[]> = {
  'beginner': [
    { value: 'werkstudent', label: 'Werkstudent' },
    { value: 'praktikum', label: 'Praktikum' },
    { value: 'junior', label: 'Junior Rolle' }
  ],
  'some-experience': [
    { value: 'junior', label: 'Junior' },
    { value: 'trainee', label: 'Trainee' },
    { value: 'associate', label: 'Associate' },
    { value: 'specialist', label: 'Specialist' }
  ],
  'experienced': [
    { value: 'professional', label: 'Professional' },
    { value: 'specialist', label: 'Specialist' },
    { value: 'senior', label: 'Senior' },
    { value: 'teamlead', label: 'Team Lead' }
  ]
};

export const INDUSTRIES = [
  {
    value: 'tech',
    label: 'Tech & IT',
    icon: '💻',
    color: 'from-blue-500/20 to-cyan-500/20',
    borderColor: 'border-blue-500/30',
    iconColor: 'text-blue-400'
  },
  {
    value: 'finance',
    label: 'Finanzen & Banking',
    icon: '💰',
    color: 'from-emerald-500/20 to-green-500/20',
    borderColor: 'border-emerald-500/30',
    iconColor: 'text-emerald-400'
  },
  {
    value: 'consulting',
    label: 'Beratung & Consulting',
    icon: '💼',
    color: 'from-purple-500/20 to-indigo-500/20',
    borderColor: 'border-purple-500/30',
    iconColor: 'text-purple-400'
  },
  {
    value: 'marketing',
    label: 'Marketing & Vertrieb',
    icon: '📈',
    color: 'from-pink-500/20 to-rose-500/20',
    borderColor: 'border-pink-500/30',
    iconColor: 'text-pink-400'
  },
  {
    value: 'healthcare',
    label: 'Gesundheit & Pharma',
    icon: '⚕️',
    color: 'from-red-500/20 to-orange-500/20',
    borderColor: 'border-red-500/30',
    iconColor: 'text-red-400'
  },
  {
    value: 'education',
    label: 'Bildung & Lehre',
    icon: '🎓',
    color: 'from-amber-500/20 to-yellow-500/20',
    borderColor: 'border-amber-500/30',
    iconColor: 'text-amber-400'
  },
  {
    value: 'retail',
    label: 'Handel & E-Commerce',
    icon: '🛍️',
    color: 'from-orange-500/20 to-red-500/20',
    borderColor: 'border-orange-500/30',
    iconColor: 'text-orange-400'
  },
  {
    value: 'other',
    label: 'Andere Branche',
    icon: '🏢',
    color: 'from-gray-500/20 to-slate-500/20',
    borderColor: 'border-gray-500/30',
    iconColor: 'text-gray-400'
  }
];

export const TASKS_BY_LEVEL = {
  'beginner': [
    'Recherche und Marktanalysen durchgeführt',
    'Präsentationen und Reports erstellt',
    'Tagesgeschäft aktiv unterstützt',
    'Kundenanfragen professionell bearbeitet',
    'Social-Media-Content erstellt und gepflegt',
    'Datenanalysen durchgeführt und ausgewertet',
    'Meetings organisiert und koordiniert',
    'Dokumentationen erstellt und strukturiert',
    'Team bei laufenden Projekten unterstützt',
    'Datenpflege und Qualitätssicherung',
    'Interne Prozesse dokumentiert',
    'Administrative Aufgaben eigenständig übernommen',
    'Kundentermine vor- und nachbereitet',
    'Newsletter und Mailings erstellt',
    'Erste Projekterfahrung in agilen Teams gesammelt'
  ],
  'some-experience': [
    'Projekte eigenverantwortlich betreut und umgesetzt',
    'Kundenkommunikation auf professionellem Niveau',
    'Umfangreiche Datenanalysen und Reporting erstellt',
    'Content-Strategie entwickelt und umgesetzt',
    'Prozesse analysiert und optimiert',
    'Kampagnen geplant und durchgeführt',
    'Qualitätssicherung und Testing verantwortet',
    'Markt- und Wettbewerbsanalysen durchgeführt',
    'Tools administriert und Schulungen gegeben',
    'Workshops moderiert und Trainings durchgeführt',
    'Stakeholder-Management aktiv betrieben',
    'Budgets getrackt und Forecasts erstellt',
    'Teams koordiniert und Ressourcen geplant',
    'Onboarding neuer Mitarbeiter begleitet',
    'A/B-Tests durchgeführt und ausgewertet',
    'Schnittstelle zwischen Abteilungen',
    'KPIs definiert und regelmäßig gemonitort'
  ],
  'experienced': [
    'Strategische Initiativen entwickelt und verantwortet',
    'Team von 5-15 Personen geführt und weiterentwickelt',
    'Budget von €200k-€2M verantwortet',
    'Komplexe Projekte mit hoher Verantwortung geleitet',
    'Vendor- und Lieferantenmanagement betrieben',
    'Change-Management-Prozesse gesteuert',
    'Performance kontinuierlich optimiert und skaliert',
    'C-Level-Präsentationen gehalten',
    'Cross-funktionale Teams erfolgreich koordiniert',
    'Prozesse neu designt und implementiert',
    'Recruiting-Strategie entwickelt und umgesetzt',
    'Unternehmensweite KPIs definiert und getrackt',
    'Risiken identifiziert und Management etabliert',
    'Verträge verhandelt und abgeschlossen',
    'Junior-Kollegen gecoacht und entwickelt',
    'Geschäftsentscheidungen auf Führungsebene getroffen',
    'Stakeholder-Alignment auf Executive-Level sichergestellt'
  ]
};

export const ACHIEVEMENTS_BY_LEVEL = {
  'beginner': [
    'Prozesseffizienz durch Optimierung um 15-20% gesteigert',
    'Durchgehend positives Feedback von Team und Vorgesetzten',
    'Fehlerquote durch sorgfältige Arbeit deutlich reduziert',
    'Komplexe Präsentation erfolgreich vor Management gehalten',
    'Alle Deadlines zuverlässig eingehalten',
    'Innovative Verbesserungsidee erfolgreich eingebracht',
    'Tool-Einführung aktiv unterstützt und mitgestaltet',
    'Dokumentation strukturiert verbessert',
    'Eigenständig kleinere Projekte erfolgreich abgeschlossen',
    'Erste Schulungen für neue Teammitglieder durchgeführt',
    'Kundenfeedback durchweg positiv (>90% Zufriedenheit)',
    'Erfolgreich in agile Arbeitsweisen eingearbeitet'
  ],
  'some-experience': [
    'Conversion Rate um 15-25% nachweislich gesteigert',
    'Kundenzufriedenheit (NPS) von 6 auf 8+ verbessert',
    'Betriebskosten um 10-15% gesenkt',
    'Projekte konstant in Time & Budget abgeschlossen',
    'Neuen Prozess etabliert, der teamweit übernommen wurde',
    'Marketingkampagne mit 20-30% mehr Reichweite umgesetzt',
    'Fehlerquote durch Qualitätsmaßnahmen halbiert',
    'CRM-Tool erfolgreich implementiert und Teams geschult',
    'Kundenzufriedenheit nachweislich verbessert (NPS >8)',
    'Team-Effizienz durch neue Workflows um 20% gesteigert',
    'Lead-Generierung um 25% erhöht',
    'Kampagnen-ROI um 30% verbessert',
    'Eigenverantwortlich 5-10 Kundenprojekte betreut',
    'A/B-Tests mit 15% Conversion-Steigerung durchgeführt'
  ],
  'experienced': [
    'Jahresumsatz um 30-50% gesteigert',
    'Team erfolgreich von 5 auf 15+ Personen skaliert',
    'Budget von €500k-€3M verantwortet und optimiert',
    'Marktanteil um 10-15% erhöht',
    'Projekt mit €2-5M Volumen erfolgreich geleitet',
    'Prozesskosten durch Restrukturierung um 25-40% reduziert',
    'Innovatives Produkt zum Markterfolg geführt',
    'Strategische Partnerschaften mit Key Accounts aufgebaut',
    'ROI um 40-60% durch strategische Maßnahmen verbessert',
    'Lead Time um 50% durch Prozessoptimierung verkürzt',
    'Kundenbindung (Retention Rate) um 18-25% erhöht',
    'Industry Award oder Auszeichnung gewonnen',
    'Neue Geschäftsfelder erschlossen (€1M+ Umsatzpotenzial)',
    'Change-Projekte mit 200+ Mitarbeitern erfolgreich gesteuert',
    'C-Level-Buy-in für strategische Initiative erreicht'
  ]
};

export const SOFT_SKILLS = [
  { value: 'communication', label: 'Kommunikation', icon: '💬' },
  { value: 'teamwork', label: 'Teamarbeit', icon: '🤝' },
  { value: 'problem-solving', label: 'Problemlösung', icon: '🧩' },
  { value: 'adaptability', label: 'Anpassungsfähigkeit', icon: '🔄' },
  { value: 'leadership', label: 'Leadership', icon: '⭐' },
  { value: 'time-management', label: 'Zeitmanagement', icon: '⏱️' },
  { value: 'creativity', label: 'Kreativität', icon: '💡' },
  { value: 'analytical-thinking', label: 'Analytisches Denken', icon: '📊' },
  { value: 'customer-focus', label: 'Kundenorientierung', icon: '🎯' },
  { value: 'presentation', label: 'Präsentationsfähigkeit', icon: '🎤' },
  { value: 'conflict-resolution', label: 'Konfliktlösung', icon: '🤝' },
  { value: 'initiative', label: 'Eigeninitiative', icon: '🚀' }
];

export const SOFT_SKILL_SITUATIONS: Record<string, string[]> = {
  'communication': [
    'In Kundengesprächen',
    'Bei Team-Präsentationen',
    'In schriftlicher Kommunikation',
    'Bei Konfliktgesprächen',
    'In internationalen Teams',
    'Bei Stakeholder-Updates',
    'In Verhandlungen',
    'Bei der Wissensvermittlung'
  ],
  'teamwork': [
    'In cross-funktionalen Projekten',
    'Bei Remote-Zusammenarbeit',
    'In agilen Teams',
    'Bei Team-Events',
    'In Krisensituationen',
    'Bei Onboarding neuer Kollegen',
    'In Peer-Reviews',
    'Bei gemeinsamen Deadlines'
  ],
  'problem-solving': [
    'Bei technischen Herausforderungen',
    'In Kundenproblemen',
    'Bei Prozess-Ineffizienzen',
    'In Budget-Engpässen',
    'Bei unerwarteten Hindernissen',
    'In Qualitätsproblemen',
    'Bei Ressourcenknappheit',
    'In komplexen Entscheidungen'
  ],
  'adaptability': [
    'Bei Organisationsveränderungen',
    'In neuen Tool-Umgebungen',
    'Bei Prioritätenwechseln',
    'In verschiedenen Projekten',
    'Bei neuen Aufgaben',
    'In dynamischen Märkten',
    'Bei Team-Wechseln',
    'In Krisensituationen'
  ],
  'leadership': [
    'Bei Projektleitungen',
    'Im Mentoring',
    'Bei der Team-Motivation',
    'In schwierigen Entscheidungen',
    'Bei Change-Prozessen',
    'Im Konfliktmanagement',
    'Bei der Vision-Kommunikation',
    'In der Talententwicklung'
  ],
  'time-management': [
    'Bei mehreren Projekten parallel',
    'In stressigen Phasen',
    'Bei engen Deadlines',
    'In der Priorisierung',
    'Bei unerwarteten Tasks',
    'In der Wochenplanung',
    'Bei Meetings & Deep Work',
    'In der Delegation'
  ],
  'creativity': [
    'Bei Brainstorming-Sessions',
    'In Marketing-Kampagnen',
    'Bei Problemlösungen',
    'In Produktentwicklung',
    'Bei Prozess-Innovation',
    'In Content-Creation',
    'Bei Workshop-Formaten',
    'In der Strategieentwicklung'
  ],
  'analytical-thinking': [
    'In Datenanalysen',
    'Bei Business Cases',
    'In KPI-Tracking',
    'Bei Root-Cause-Analysen',
    'In Marktforschung',
    'Bei A/B-Tests',
    'In Reporting',
    'Bei Forecasting'
  ],
  'customer-focus': [
    'In der Kundenbetreuung',
    'Bei Feedback-Implementierung',
    'In User Research',
    'Bei Beschwerdemanagement',
    'In Service-Design',
    'Bei Produktverbesserungen',
    'In Kundenpräsentationen',
    'Bei Loyalty-Programmen'
  ],
  'presentation': [
    'Vor C-Level',
    'Bei Kunden-Pitches',
    'In Team-Meetings',
    'Bei Konferenzen',
    'In Trainings',
    'Bei Investoren',
    'In Webinaren',
    'Bei Quarterly Reviews'
  ],
  'conflict-resolution': [
    'In Team-Konflikten',
    'Bei Kundenbeschwer den',
    'In Ressourcen-Disputes',
    'Bei Meinungsverschiedenheiten',
    'In Eskalationen',
    'Bei Prioritätenkonflikten',
    'In Verhandlungen',
    'Bei Change-Widerstand'
  ],
  'initiative': [
    'Bei Prozessverbesserungen',
    'In neuen Projekten',
    'Bei Tool-Einführungen',
    'In der Weiterbildung',
    'Bei Innovation-Initiativen',
    'In der Ideenfindung',
    'Bei Volunteering',
    'In der Selbstorganisation'
  ]
};

export const COMMON_LANGUAGES = [
  'Deutsch',
  'Englisch',
  'Französisch',
  'Spanisch',
  'Italienisch',
  'Portugiesisch',
  'Niederländisch',
  'Russisch',
  'Polnisch',
  'Türkisch',
  'Arabisch',
  'Chinesisch',
  'Japanisch',
  'Koreanisch',
  'Hindi',
  'Griechisch',
  'Schwedisch',
  'Dänisch',
  'Norwegisch',
  'Finnisch'
];

export const HARD_SKILLS_BY_INDUSTRY: Record<IndustryType, string[]> = {
  'tech': [
    'JavaScript', 'Python', 'React', 'Node.js', 'SQL', 'Git',
    'Docker', 'AWS', 'API Design', 'Agile/Scrum', 'Testing',
    'CI/CD', 'TypeScript', 'MongoDB', 'Kubernetes'
  ],
  'finance': [
    'Excel (Advanced)', 'Financial Modeling', 'SAP', 'Bloomberg Terminal',
    'SQL', 'PowerBI', 'Risk Management', 'Accounting', 'Compliance',
    'Reporting', 'Tableau', 'VBA', 'Python', 'Financial Analysis'
  ],
  'consulting': [
    'PowerPoint', 'Excel', 'Business Analysis', 'Project Management',
    'Stakeholder Management', 'Workshop Facilitation', 'Change Management',
    'Strategy Development', 'Process Optimization', 'Data Analysis'
  ],
  'marketing': [
    'Google Analytics', 'SEO/SEM', 'Social Media Marketing', 'Content Creation',
    'Adobe Creative Suite', 'Marketing Automation', 'CRM (Salesforce/HubSpot)',
    'Email Marketing', 'Copywriting', 'A/B Testing', 'Canva', 'Meta Ads'
  ],
  'healthcare': [
    'Medical Terminology', 'Patient Care', 'Electronic Health Records',
    'HIPAA Compliance', 'Clinical Documentation', 'Quality Assurance'
  ],
  'education': [
    'Curriculum Development', 'Learning Management Systems', 'Assessment Design',
    'Instructional Design', 'Educational Technology', 'Student Engagement'
  ],
  'retail': [
    'Inventory Management', 'POS Systems', 'Customer Service', 'Merchandising',
    'Sales Analytics', 'E-Commerce Platforms', 'Supply Chain', 'CRM'
  ],
  'other': [
    'Microsoft Office', 'Excel', 'PowerPoint', 'Word', 'Outlook',
    'Project Management', 'Data Analysis', 'SQL', 'Jira', 'Confluence',
    'Tableau', 'Power BI', 'SAP', 'Salesforce', 'HubSpot',
    'Trello', 'Google Workspace', 'Slack', 'Zoom', 'Monday.com'
  ]
};

// Bulletpoint-Vorschläge für Berufserfahrung (ATS-optimiert mit Fakten & Zahlen)
export const WORK_BULLETPOINTS_BY_LEVEL: Record<ExperienceLevel, string[]> = {
  'beginner': [
    'Unterstützte das Team bei [Aufgabe] und trug zu [messbarem Ergebnis] bei',
    'Erstellte [X] Reports/Präsentationen für [Zielgruppe]',
    'Bearbeitete [X] Kundenanfragen pro Woche mit [Y%] Zufriedenheitsrate',
    'Reduzierte Fehlerquote bei [Prozess] um [X%] durch [Maßnahme]',
    'Verwaltete [X] Projekte/Tasks parallel und hielt alle Deadlines ein',
    'Steigerte [Metrik] um [X%] durch [konkrete Aktion]',
    'Optimierte [Prozess] und sparte dem Team [X] Stunden pro Woche',
    'Pflegte [X] Datensätze/Einträge mit [Y%] Genauigkeit',
    'Koordinierte [X] Meetings/Events mit [Y+] Teilnehmern',
    'Erzielte [X%] Verbesserung bei [Qualitätsmetrik] durch [Maßnahme]'
  ],
  'some-experience': [
    'Steigerte [KPI/Metrik] um [X%] durch Implementierung von [Strategie/Tool]',
    'Betreute [X] Kundenprojekte im Wert von [€Y] erfolgreich',
    'Reduzierte [Kosten/Zeit] um [X%] durch [Prozessoptimierung]',
    'Führte [X] A/B-Tests durch und erzielte [Y%] Conversion-Steigerung',
    'Erhöhte [Umsatz/Leads/Traffic] um [X%] durch [Kampagne/Initiative]',
    'Verantwortete Budget von [€X] und erzielte [Y%] ROI',
    'Schulte [X] Teammitglieder in [Tool/Prozess] und steigerte Effizienz um [Y%]',
    'Analysierte [X] Datensätze und identifizierte Optimierungspotenzial von [€Y]',
    'Koordinierte cross-funktionales Team von [X] Personen für [Projekt]',
    'Verbesserte [Qualitätsmetrik] von [X] auf [Y] innerhalb von [Z] Monaten'
  ],
  'experienced': [
    'Steigerte Jahresumsatz um [€X] / [Y%] durch [strategische Initiative]',
    'Führte Team von [X] Mitarbeitern und erzielte [Y%] Performance-Steigerung',
    'Verantwortete Budget von [€X] und optimierte Kosten um [Y%]',
    'Skalierte [Prozess/Produkt] von [X] auf [Y] [Einheiten] innerhalb [Z] Monaten',
    'Erhöhte Marktanteil um [X%] durch [Strategie] in [Zeitraum]',
    'Leitete Projekt mit [€X] Volumen und lieferte [Y%] unter Budget',
    'Reduzierte Betriebskosten um [€X] / [Y%] durch [Restrukturierung]',
    'Baute [X] strategische Partnerschaften auf mit [€Y] Umsatzpotenzial',
    'Verbesserte ROI um [X%] und erzielte [€Y] zusätzlichen Profit',
    'Optimierte Lead Time um [X%] und steigerte Output um [Y] Einheiten'
  ]
};

// Bulletpoint-Vorschläge für Projekte (ATS-optimiert mit Fakten & Zahlen)
export const PROJECT_BULLETPOINTS_BY_LEVEL: Record<ExperienceLevel, string[]> = {
  'beginner': [
    'Entwickelte [Lösung/Feature] das [X] Nutzer erreichte',
    'Trug zur [X%] Verbesserung von [Metrik] durch [Aktion] bei',
    'Implementierte [Tool/Prozess] das [X] Stunden pro Woche einsparte',
    'Sammelte und analysierte [X] Datenpunkte für [Ziel]',
    'Unterstützte [X] Stakeholder bei [Aufgabe] mit [Y%] Zufriedenheit',
    'Erstellte [X] Dokumente/Designs für [Projekt] innerhalb [Y] Wochen',
    'Testete [X] Features und identifizierte [Y] kritische Bugs',
    'Präsentierte Projektergebnisse vor [X] Personen im Team'
  ],
  'some-experience': [
    'Leitete Projekt mit [X] Teammitgliedern und erreichte [Y%] der KPIs',
    'Steigerte [Metrik] um [X%] durch Implementierung von [Lösung]',
    'Reduzierte [Zeit/Kosten] um [X%] durch [Optimierung/Automation]',
    'Entwickelte [Lösung] die [X] Nutzer/Kunden erreichte und [€Y] generierte',
    'Erhöhte [Conversion/Engagement] um [X%] durch [A/B-Tests/Features]',
    'Verantwortete Projekt-Budget von [€X] und lieferte pünktlich',
    'Koordinierte [X] Stakeholder und sicherte 100% Buy-in für [Initiative]',
    'Analysierte [X] User Feedbacks und priorisierte Top [Y] Features'
  ],
  'experienced': [
    'Leitete strategisches Projekt mit [€X] Budget und [Y] Mitarbeitern',
    'Skalierte [Produkt/Service] auf [X] Nutzer und [€Y] ARR',
    'Reduzierte Time-to-Market um [X%] durch [Prozess-Innovation]',
    'Erzielte [€X] Kosteneinsparung durch [Restrukturierung/Automation]',
    'Erhöhte [Metrik] um [X%] und generierte [€Y] zusätzlichen Umsatz',
    'Baute [X] strategische Partnerschaften mit [Y] Mio. Reichweite auf',
    'Führte Change-Initiative mit [X] betroffenen Mitarbeitern durch',
    'Verantwortete Roadmap für [X] Teams und [€Y] Investment'
  ]
};
