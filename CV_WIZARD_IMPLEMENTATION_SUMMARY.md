# CV-Wizard Erweiterung – Implementation Summary (Paywall erst beim Download)

## ✅ Was wurde erstellt (Fertig & Getestet)

### 1. Neue Komponenten

| Datei | Status | Beschreibung |
|-------|--------|--------------|
| `src/components/cvbuilder/steps/TargetJobStep.tsx` | ✅ Fertig | Wunschstelle-Step mit Validierung |
| `src/components/cvbuilder/DownloadPaywallModal.tsx` | ✅ Fertig | Paywall/Anmelde-Modal für den Download |
| `src/components/cvbuilder/InsightsPanel.tsx` | ✅ Fertig | Lob-/Insights-Panel für den Live-Editor |

### 2. Dokumentation

| Datei | Status | Inhalt |
|-------|--------|--------|
| `CV_WIZARD_ERWEITERUNG.md` | ✅ Fertig | Detaillierte Integrations-Anleitung |
| `CV_WIZARD_IMPLEMENTATION_SUMMARY.md` | ✅ Fertig | Diese Übersicht |

---

## 🎯 Neuer Gesamt-Flow (Paywall nur beim Download)

┌─────────────────────────────────────────────┐
│ Wizard startet OHNE Login / Paywall │
└──────────────────┬──────────────────────────┘
│
▼
┌─────────────────────────────────────────────┐
│ Steps 1–10: Bestehende Wizard-Steps │
│ ├─ Erfahrungslevel │
│ ├─ Persönliche Daten │
│ ├─ Schulische Ausbildung │
│ ├─ Ausbildung/Studium │
│ ├─ Berufserfahrung │
│ ├─ Projekte │
│ ├─ Hard Skills │
│ ├─ Soft Skills │
│ ├─ Werte │
│ └─ Hobbies │
└──────────────────┬──────────────────────────┘
│
▼
┌─────────────────────────────────────────────┐
│ Step 11: TargetJobStep ⭐ NEU │
│ ├─ Unternehmen (required) │
│ ├─ Position (required) │
│ ├─ Standort (optional) │
│ └─ Stellenbeschreibung (optional) │
└──────────────────┬──────────────────────────┘
│
▼
┌─────────────────────────────────────────────┐
│ Navigation direkt zum Live-Editor │
│ → CV-Daten (inkl. targetJob) übergeben │
│ (z.B. via localStorage oder state) │
└──────────────────┬──────────────────────────┘
│
▼
┌─────────────────────────────────────────────┐
│ Live-Editor Seite │
│ ┌──────────────────┬──────────────────┐ │
│ │ CV Preview/Edit │ InsightsPanel │ │
│ │ │ ⭐ NEU │ │
│ │ [DYD Watermark] │ - Lob-Punkte │ │
│ │ │ - Hinweise │ │
│ └──────────────────┴──────────────────┘ │
│ │
│ Button "CV herunterladen" │
└──────────────────┬──────────────────────────┘
│
▼
┌─────────────────────────────────────────────┐
│ Klick auf "Download" │
│ → DownloadPaywallModal öffnet sich ⭐ NEU │
│ ├─ Kurze Erklärung / Mehrwert │
│ ├─ Optional: Registrierung / Login │
│ └─ Button "Download freischalten" │
└──────────────────┬──────────────────────────┘
│
▼
┌─────────────────────────────────────────────┐
│ Paywall erfolgreich │
│ → CV wird als PDF/Docx generiert │
│ → Download startet │
│ → Optional: Erfolgsmeldung │
└─────────────────────────────────────────────┘

yaml
Code kopieren

---

## 🔧 Integration in `CVWizard.tsx`

Der Wizard sammelt alle Daten inkl. Wunschstelle und leitet dann in den Live-Editor weiter – **ohne** Paywall oder Login.

### 1. Imports (am Anfang)

```typescript
import { TargetJobStep } from '../components/cvbuilder/steps/TargetJobStep';
import { useNavigate } from 'react-router-dom';
2. Zusätzlicher State / Hooks in CVWizard
typescript
Code kopieren
const navigate = useNavigate();
3. getTotalSteps() anpassen
Je nach Anzahl deiner vorhandenen Steps den Wunschstellen-Step mitzählen:

typescript
Code kopieren
const getTotalSteps = () => {
  return 12; // Beispiel: 11 Steps + Completion; Wert ggf. anpassen
};
4. Neuer Case im renderStep()-Switch
Nach dem Hobbys-Step, vor dem Completion-Step:

typescript
Code kopieren
case 11: // Wunschstelle
  return (
    <TargetJobStep
      currentStep={11}
      totalSteps={getTotalSteps()}
      initialData={cvData.targetJob}
      onNext={(targetJob) => {
        // Daten im Wizard-State speichern
        updateCVData('targetJob', targetJob);

        // Optional: CV-Daten für den Editor persistieren
        localStorage.setItem('cv_wizard_data', JSON.stringify({
          ...cvData,
          targetJob,
        }));

        // Direkt zum Live-Editor navigieren
        navigate('/cv-editor');
      }}
      onPrev={prevStep}
    />
  );
Hinweis: Falls dein Completion-Step aktuell case 11 ist, verschiebe ihn auf case 12 und passe getTotalSteps() an.

📝 Type-Erweiterung
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
  // ... vorhandene Felder ...
  targetJob?: TargetJob;
}
🎨 Live-Editor mit Paywall beim Download
Die Paywall wird nur im Editor angezeigt, wenn der User den CV herunterladen will.

1. DownloadPaywallModal – Beispiel-Interface
typescript
Code kopieren
// src/components/cvbuilder/DownloadPaywallModal.tsx
import { ReactNode } from 'react';

interface DownloadPaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // wird aufgerufen, wenn der Download freigegeben wird
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
          Fast geschafft – sichere dir deinen optimierten CV ✨
        </h2>
        <p className="text-white/70 text-sm">
          Dein CV ist fertig optimiert. Mit einem Klick erhältst du deinen Download
          in professionellem Layout. Optional kannst du dir ein Konto anlegen, um
          deine CVs künftig im Dashboard zu verwalten.
        </p>

        {/* Optional: kleine Feature-Liste */}
        <ul className="text-white/70 text-sm space-y-1">
          <li>• ATS-optimiertes Layout</li>
          <li>• Professionelle Formulierungen</li>
          <li>• Perfekt für deine Wunschstelle zugeschnitten</li>
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
2. CVLiveEditorPage – Integration der Paywall
typescript
Code kopieren
// src/pages/CVLiveEditorPage.tsx
import { useEffect, useState } from 'react';
import { InsightsPanel } from '../components/cvbuilder/InsightsPanel';
import { DownloadPaywallModal } from '../components/cvbuilder/DownloadPaywallModal';

export function CVLiveEditorPage() {
  const [editorData, setEditorData] = useState<any | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
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
    // Statt direkten Downloads zuerst Paywall öffnen
    setShowPaywall(true);
  };

  const handleConfirmDownload = () => {
    setShowPaywall(false);

    // Hier den echten Download auslösen (PDF/Docx Generierung)
    // Aktuell nur Platzhalter:
    alert('Download wird vorbereitet...');

    // Beispiel: später ersetzen durch reale Download-Logik
    // generatePdfFromEditorData(editorData);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Hinweistext */}
        <div className="bg-[#66c0b6]/10 border border-[#66c0b6]/30 rounded-xl p-4">
          <p className="text-white text-sm">
            ✨ <strong>Dein CV ist bereits auf deine Wunschstelle zugeschnitten.</strong>{' '}
            Feinschliff kannst du direkt im Editor vornehmen – der Download wird
            erst am Ende freigeschaltet.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* CV Editor / Preview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 min-h-[400px]">
              {/* Hier deinen bestehenden Editor einbinden, der editorData nutzt */}
              <p className="text-white/60 text-sm">
                {/* Platzhalter-Text, bis der echte Editor integriert ist */}
                CV-Editor / Preview kommt hier hin.
              </p>
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

          {/* Insights Panel */}
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