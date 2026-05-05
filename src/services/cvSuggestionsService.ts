/**
 * CV Suggestions Service
 *
 * Generiert personalisierte Vorschläge basierend auf den tatsächlichen Eingaben des Users.
 * Nutzt Make.com/OpenAI um kontextbezogene, relevante Vorschläge zu erstellen.
 */

import { ExperienceLevel } from '../types/cvBuilder';

const SUGGESTIONS_WEBHOOK_URL = import.meta.env.VITE_MAKE_SUGGESTIONS_WEBHOOK_URL;

interface SuggestionsRequest {
  context: {
    jobTitle: string;
    company: string;
    industry?: string;
    roleLevel?: string;
    experienceLevel: ExperienceLevel;
    location?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
  };
  type: 'tasks' | 'achievements' | 'responsibilities';
  count?: number;
}

interface SuggestionsResponse {
  status: 'success' | 'error';
  suggestions?: string[];
  error?: string;
}

/**
 * Generiert personalisierte Vorschläge basierend auf Job-Kontext
 */
export async function getPersonalizedSuggestions(
  request: SuggestionsRequest
): Promise<string[]> {
  console.log('[CV-SUGGESTIONS] 🎯 Requesting personalized suggestions:', {
    jobTitle: request.context.jobTitle,
    type: request.type,
    experienceLevel: request.context.experienceLevel
  });

  // Fallback zu statischen Vorschlägen wenn Webhook nicht konfiguriert
  if (!SUGGESTIONS_WEBHOOK_URL || SUGGESTIONS_WEBHOOK_URL.includes('placeholder')) {
    console.warn('[CV-SUGGESTIONS] ⚠️ Webhook not configured, using fallback');
    return getFallbackSuggestions(request);
  }

  try {
    const response = await fetch(SUGGESTIONS_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...request,
        count: request.count || 10
      }),
    });

    if (!response.ok) {
      console.error('[CV-SUGGESTIONS] ❌ API error:', response.status);
      return getFallbackSuggestions(request);
    }

    const data: SuggestionsResponse = await response.json();

    if (data.status === 'success' && data.suggestions && data.suggestions.length > 0) {
      console.log('[CV-SUGGESTIONS] ✅ Received', data.suggestions.length, 'suggestions');
      return data.suggestions;
    }

    console.warn('[CV-SUGGESTIONS] ⚠️ No suggestions in response, using fallback');
    return getFallbackSuggestions(request);
  } catch (error) {
    console.error('[CV-SUGGESTIONS] ❌ Error:', error);
    return getFallbackSuggestions(request);
  }
}

/**
 * Fallback zu statischen aber kontextbezogenen Vorschlägen
 */
function getFallbackSuggestions(request: SuggestionsRequest): string[] {
  const { experienceLevel } = request.context;
  const { type } = request;

  // Basierend auf Experience Level
  if (type === 'tasks') {
    return getTasksSuggestions(experienceLevel);
  } else if (type === 'achievements') {
    return getAchievementsSuggestions(experienceLevel);
  } else {
    return getResponsibilitiesSuggestions(experienceLevel);
  }
}

function getTasksSuggestions(level: ExperienceLevel): string[] {
  if (level === 'beginner') {
    return [
      'Unterstützung bei der Durchführung von Projekten und Aufgaben',
      'Eigenständige Bearbeitung von Kundenanfragen',
      'Erstellung von Präsentationen und Reports',
      'Durchführung von Recherchen und Analysen',
      'Pflege und Aktualisierung von Datenbanken',
      'Koordination von Meetings und Terminen',
      'Erstellung von Dokumentationen',
      'Unterstützung bei administrativen Aufgaben',
      'Mitarbeit an laufenden Projekten',
      'Qualitätssicherung und Testing'
    ];
  } else if (level === 'some-experience') {
    return [
      'Eigenverantwortliche Projektleitung und -durchführung',
      'Strategische Planung und Umsetzung von Maßnahmen',
      'Führung und Entwicklung von Teammitgliedern',
      'Analyse und Optimierung von Geschäftsprozessen',
      'Budgetverantwortung und Kostencontrolling',
      'Stakeholder-Management auf verschiedenen Ebenen',
      'Entwicklung und Implementierung neuer Konzepte',
      'Cross-funktionale Zusammenarbeit',
      'KPI-Definition und Performance-Tracking',
      'Vendor- und Lieferantenmanagement'
    ];
  } else {
    return [
      'Strategische Führung und Weiterentwicklung großer Teams',
      'Verantwortung für P&L und signifikante Budgets',
      'Entwicklung und Umsetzung der Unternehmensstrategie',
      'C-Level Präsentationen und Board-Reporting',
      'Change Management und Transformation',
      'Aufbau und Skalierung von Bereichen/Abteilungen',
      'M&A Due Diligence und Integration',
      'Executive Stakeholder Management',
      'Risikomanagement auf Unternehmensebene',
      'Entwicklung von Business Cases und ROI-Analysen'
    ];
  }
}

function getAchievementsSuggestions(level: ExperienceLevel): string[] {
  if (level === 'beginner') {
    return [
      'Prozesseffizienz um 15-20% durch Optimierungen gesteigert',
      'Durchgehend positives Feedback von Vorgesetzten',
      'Alle Projektziele und Deadlines termingerecht erreicht',
      'Erfolgreich neue Tools und Methoden eingeführt',
      'Kundenzufriedenheit auf über 90% gesteigert',
      'Eigenständig kleinere Projekte erfolgreich abgeschlossen',
      'Fehlerquote durch sorgfältige Arbeit reduziert',
      'Komplexe Präsentationen erfolgreich vor Team gehalten',
      'Innovative Verbesserungsideen eingebracht und umgesetzt',
      'Erste Schulungen für neue Kollegen durchgeführt'
    ];
  } else if (level === 'some-experience') {
    return [
      'Umsatz/Revenue um 20-30% gesteigert',
      'Kostenreduktion von 15-25% erreicht',
      'Team von 5-15 Personen erfolgreich geführt',
      'NPS-Score von 6 auf 8+ verbessert',
      'Conversion Rate um 20-30% erhöht',
      'Projekte mit Budget >€100k erfolgreich abgeschlossen',
      'Marktanteil um 10-15% ausgebaut',
      'Time-to-Market um 30% verkürzt',
      'Neue Prozesse implementiert mit messbarem ROI',
      'Kundenzufriedenheit um 25% gesteigert'
    ];
  } else {
    return [
      'Unternehmensumsatz um 40-60% gesteigert',
      'EBITDA-Marge um 10+ Prozentpunkte verbessert',
      'Teams von 50+ Mitarbeitern erfolgreich geleitet',
      'Transformation mit €10M+ Budget durchgeführt',
      'Marktführerschaft in Segment etabliert',
      'Strategische Akquisitionen erfolgreich integriert',
      'Internationalen Markteintritt realisiert',
      'Exit mit 10x Return erreicht',
      'Abteilung von 0 auf 100+ Mitarbeiter skaliert',
      'Unternehmensweite Effizienzsteigerung von 35%+ erreicht'
    ];
  }
}

function getResponsibilitiesSuggestions(level: ExperienceLevel): string[] {
  if (level === 'beginner') {
    return [
      'Unterstützung des Teams bei täglichen Aufgaben',
      'Bearbeitung von Kundenanfragen',
      'Datenpflege und -verwaltung',
      'Erstellung von Reports und Dokumentationen',
      'Koordination von internen Prozessen',
      'Qualitätssicherung',
      'Administrative Tätigkeiten',
      'Recherche und Analyse',
      'Meeting-Organisation',
      'Tool- und System-Pflege'
    ];
  } else if (level === 'some-experience') {
    return [
      'Führung und Entwicklung von Teammitgliedern',
      'Budgetplanung und -kontrolle',
      'Projektmanagement und -steuerung',
      'Stakeholder-Kommunikation',
      'Prozessoptimierung',
      'Strategische Planung',
      'Vendor Management',
      'Performance Tracking',
      'Cross-funktionale Koordination',
      'Compliance und Risk Management'
    ];
  } else {
    return [
      'Strategische Gesamtverantwortung',
      'P&L Ownership',
      'Executive Leadership',
      'Board-Level Reporting',
      'M&A und Corporate Development',
      'Change Management',
      'Transformation Roadmap',
      'Enterprise-wide Initiatives',
      'C-Level Stakeholder Management',
      'Long-term Strategy Development'
    ];
  }
}
