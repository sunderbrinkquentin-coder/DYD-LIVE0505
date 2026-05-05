# CV-Wizard Erweiterung – Implementation Guide (Paywall erst beim Download, ohne Login/Make/Supabase)

## Übersicht

Der bestehende DYD-CV-Wizard wurde erweitert um:

1. **Neuen Wunschstellen-Step** im Wizard (`TargetJobStep`)
2. **Keinen Login und keine Paywall im Wizard**
3. **Live-Editor** nach Abschluss des Wizards
4. **Paywall erst beim Download** des fertigen CV (z.B. Modal)
5. Optional: **Insights-Panel** als positives Feedback im Editor

Dieser Guide beschreibt nur die **Frontend-/Bolt-Seite** – ohne externe Services.

---

## ✅ Was wurde erstellt

### 1. Neue Komponenten

#### `src/components/cvbuilder/steps/TargetJobStep.tsx`

- Neuer Wizard-Step für die **Wunschstelle**
- Felder: Unternehmen, Position, Standort, Stellenbeschreibung
- Integriert sich nahtlos in den bestehenden Wizard-Flow

**Features:**

- Responsives Design mit DYD-Branding
- Optionale Stellenbeschreibung für bessere CV-Optimierung
- Validierung (mindestens Unternehmen + Position erforderlich)
- „Weiter“ → speichert `targetJob` im Wizard-State und geht zum nächsten Step

---

#### `src/components/cvbuilder/DownloadPaywallModal.tsx`

- Modal, das **nur im Editor** angezeigt wird, wenn der User auf „CV herunterladen“ klickt
- Zeigt Mehrwert des Downloads und Call-to-Action
- Ruft nach Bestätigung einen Callback `onConfirm` auf, in dem später die eigentliche Download-Logik implementiert wird

**Features:**

- Schlichtes, klares DYD-UI
- Zwei Buttons: „Zurück“ und „Download freischalten“
- Keine Login- oder Payment-Logik in diesem Guide – nur UI/Flow

---

#### `src/components/cvbuilder/InsightsPanel.tsx`

- Optionales Panel für den Editor (rechte Spalte)
- Zeigt Lob-/Insights-Punkte zum CV
- Kann mit echten Insights oder mit Default-Texten gefüllt werden

**Features:**

- Positive, motivierende Texte
- Klar strukturierte Liste
- Vollständig unabhängig von Backend-Logik

---

## 🔧 Schritt 1: `CVWizard.tsx` um Wunschstellen-Step erweitern

Der Wizard läuft vollständig ohne Login/Paywall. Die Paywall kommt erst im Editor.

### 1.1 Neue Imports hinzufügen

Am Anfang von `CVWizard.tsx`:

```typescript
import { TargetJobStep } from '../components/cvbuilder/steps/TargetJobStep';
import { useNavigate } from 'react-router-dom';
1.2 State/Hooks erweitern
In CVWizard:

typescript
Code kopieren
const navigate = useNavigate();
(Weitere States sind bereits vorhanden: cvData, currentStep, showMotivation etc.)

1.3 getTotalSteps() anpassen
Wenn du aktuell 12 Steps (0–11) hast und Completion bei case 11 ist:

typescript
Code kopieren
const getTotalSteps = () => {
  return 13; // +1 für den Wunschstellen-Step
};
1.4 Neuen Step im renderStep()-Switch hinzufügen
Beispiel:

Hobbies ist case 10

Completion war bisher case 11

Jetzt wird TargetJobStep case 11 und Completion case 12

typescript
Code kopieren
const renderStep = () => {
  if (showMotivation) {
    return (
      <MotivationScreen
        onContinue={handleMotivationComplete}
        variant={motivationVariant}
      />
    );
  }

  switch (currentStep) {
    case 0: return <Step0_ExperienceLevel />;
    case 1: return <Step1_PersonalData />;
    case 2: return <Step2_SchoolEducation />;
    case 3: return <Step3_ProfessionalEducation />;
    case 4: return <Step4_WorkExperience />;
    case 5: return <Step5_Projects />;
    case 6: return <Step6_HardSkills />;
    case 7: return <Step7_SoftSkills />;
    case 8: return <Step8_WorkValues />;
    case 9: return <Step9_WorkStyle />;
    case 10: return <Step10_Hobbies />;

    case 11: // Wunschstelle
      return (
        <TargetJobStep
          currentStep={11}
          totalSteps={getTotalSteps()}
          initialData={cvData.targetJob}
          onNext={(targetJob) => {
            updateCVData('targetJob', targetJob);

            // Optional: CV-Daten direkt persistieren
            localStorage.setItem(
              'cv_wizard_data',
              JSON.stringify({ ...cvData, targetJob })
            );

            // Weiter zum Completion-Step
            nextStep();
          }}
          onPrev={prevStep}
        />
      );

    case 12: // Completion
      return (
        <Step11_Completion
          onContinue={() => {
            // Nach Completion direkt in den Editor
            localStorage.setItem('cv_wizard_data', JSON.stringify(cvData));
            navigate('/cv-editor', { state: { cvData } });
          }}
        />
      );

    default:
      return null;
  }
};
Hinweis: Passe die Step-Indizes (currentStep-Zählung) ggf. an deine aktuelle Implementierung an.

🔧 Schritt 2: CVBuilderData um targetJob erweitern
In src/types/cvBuilder.ts:

typescript
Code kopieren
export interface TargetJob {
  company: string;
  position: string;
  location?: string;
  jobDescription?: string;
}

export interface CVBuilderData {
  // ... bestehende Felder ...
  targetJob?: TargetJob;
}
Damit kann TargetJobStep deine Wunschstellen-Daten sauber im Typ-System speichern.

🔧 Schritt 3: Live-Editor mit Paywall beim Download
Der Editor wird ohne Login & ohne Paywall aufgerufen.
Die Paywall kommt nur, wenn der User auf „CV herunterladen“ klickt.

3.1 DownloadPaywallModal.tsx (reine UI)
typescript
Code kopieren
// src/components/cvbuilder/DownloadPaywallModal.tsx
interface DownloadPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // wird aufgerufen, wenn der Download freigegeben werden soll
}

export function DownloadPaywallModal({
  isOpen,
  onClose,
  onConfirm,
}: DownloadPaywallModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-[#111] border border-white/10 p-8 space-y-6">
        <h2 className="text-2xl font-bold text-white">
          Fast geschafft – hol dir deinen optimierten CV ✨
        </h2>
        <p className="text-white/70 text-sm">
          Dein CV ist fertig optimiert und bereit zum Download. Mit einem Klick
          erhältst du ihn im professionellen Layout – perfekt für deine nächste Bewerbung.
        </p>

        <ul className="text-white/70 text-sm space-y-1">
          <li>• ATS-freundliches Layout</li>
          <li>• Klare Struktur und starke Bulletpoints</li>
          <li>• Optimal auf deine Wunschstelle ausgerichtet</li>
        </ul>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-white/20 text-white/70 hover:bg-white/5 transition"
          >
            Zurück
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold hover:opacity-90 transition"
          >
            Download freischalten
          </button>
        </div>
      </div>
    </div>
  );
}
3.2 InsightsPanel.tsx (optional, Editor rechts)
typescript
Code kopieren
// src/components/cvbuilder/InsightsPanel.tsx
interface InsightsPanelProps {
  insights?: string[];
}

export function InsightsPanel({ insights = [] }: InsightsPanelProps) {
  const defaultInsights = [
    'Deine zuletzt genannte Erfahrung passt sehr gut zu deiner Wunschstelle.',
    'Sehr gut: Deine wichtigsten Tools und Skills sind klar hervorgehoben.',
    'Dein Profil ist fokussiert und wirkt professionell strukturiert.',
    'Top: Deine Projekte zeigen genau die Kompetenzen, die viele Recruiter suchen.',
  ];

  const displayInsights = insights.length > 0 ? insights : defaultInsights;

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
      <h3 className="text-xl font-bold text-white">
        Warum dein CV jetzt stark wirkt
      </h3>
      <ul className="space-y-3">
        {displayInsights.map((insight, index) => (
          <li key={index} className="flex items-start gap-3">
            <span className="text-[#66c0b6] mt-1">✓</span>
            <span className="text-white/80 text-sm">{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
3.3 CVLiveEditorPage mit Paywall bei Download
typescript
Code kopieren
// src/pages/CVLiveEditorPage.tsx
import { useEffect, useState } from 'react';
import { DownloadPaywallModal } from '../components/cvbuilder/DownloadPaywallModal';
import { InsightsPanel } from '../components/cvbuilder/InsightsPanel';

export function CVLiveEditorPage() {
  const [editorData, setEditorData] = useState<any | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    // Daten aus Wizard laden
    const savedData = localStorage.getItem('optimized_cv_data')
      || localStorage.getItem('cv_wizard_data');

    const savedInsights = localStorage.getItem('cv_insights');

    if (savedData) {
      setEditorData(JSON.parse(savedData));
    }
    if (savedInsights) {
      setInsights(JSON.parse(savedInsights));
    }
  }, []);

  const handleDownloadClick = () => {
    // Statt sofortem Download: Paywall öffnen
    setShowPaywall(true);
  };

  const handleConfirmDownload = () => {
    setShowPaywall(false);

    // Hier kommt später die echte Download-Logik hin
    // (PDF generieren, Datei erstellen, etc.)
    alert('Download wird vorbereitet... (hier später echte Download-Logik einbauen)');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hinweis oben */}
        <div className="bg-[#66c0b6]/10 border border-[#66c0b6]/30 rounded-xl p-4">
          <p className="text-white text-sm">
            ✨ <strong>Dein CV ist fertig gesammelt und auf deine Wunschstelle ausgerichtet.</strong>{' '}
            Du kannst jetzt Feinschliff vornehmen und ihn anschließend herunterladen.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor / Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 min-h-[400px] relative">
              {/* Optional: Wasserzeichen */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
                <div className="transform -rotate-45">
                  <span className="text-5xl font-bold tracking-widest">
                    DECIDE YOUR DREAM
                  </span>
                </div>
              </div>

              {/* Eigentliche Editor-Inhalte */}
              <div className="relative z-10">
                {/* Hier deinen bestehenden Editor einbinden, der editorData nutzt */}
                <p className="text-white/60 text-sm">
                  CV-Editor / Preview kommt hier hin (Platzhalter).
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleDownloadClick}
                className="px-8 py-3 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold hover:opacity-90 transition shadow-xl"
              >
                CV herunterladen
              </button>
            </div>
          </div>

          {/* Insights rechts */}
          <div>
            <InsightsPanel insights={insights} />
          </div>
        </div>
      </div>

      <DownloadPaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        onConfirm={handleConfirmDownload}
      />
    </div>
  );
}
🔧 Schritt 4: Optionales Wasserzeichen im PDF/Preview
Wenn du später eine PDF-Generierung einbaust, kannst du das Wasserzeichen ähnlich wie oben im Editor auch im PDF-Layout verwenden.
Der Code im Editor zeigt bereits ein Beispiel mit einem textbasierten Wasserzeichen.

🎯 Flow-Zusammenfassung (ohne Login, ohne externe Services)
text
Code kopieren
1. Wizard (CVWizard)
   - Steps 0–10: Daten einsammeln
   - Step 11: Wunschstelle (TargetJobStep)
   - Step 12: Completion
       ↓
2. Navigation zu /cv-editor
   - CV-Daten via state + localStorage
       ↓
3. Live-Editor (CVLiveEditorPage)
   - User editiert CV
   - Klick auf "CV herunterladen"
       ↓
4. DownloadPaywallModal
   - Kurze Erklärung, CTA "Download freischalten"
       ↓
5. Bestätigung
   - Download-Logik (später implementieren)
✅ Checkliste für diese Version
 TargetJobStep in CVWizard.tsx integriert

 CVBuilderData um targetJob erweitert

 getTotalSteps() auf inkl. Wunschstellen-Step angepasst

 /cv-editor Route vorhanden (z.B. CVLiveEditorPage)

 DownloadPaywallModal implementiert

 „CV herunterladen“-Button öffnet Paywall

 Nach „Download freischalten“ wird (zunächst) eine Dummy-Download-Logik ausgeführt

Diese Version ist vollständig frontend-only und kann später bei Bedarf um echte Login-, Payment- oder Backend-Logik ergänzt werden – ohne dass der Wizard-Flow geändert werden muss. 🚀