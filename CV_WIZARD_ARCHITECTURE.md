# CV Wizard – Aktuelle, bereinigte Architektur

## Übersicht

Der CV-Wizard basiert jetzt auf **einer einzigen zentralen Wizard-Komponente:**

- **CVWizard** (`src/pages/CVWizard.tsx`)

Es gibt zwei Modi:

1. **Neuen CV erstellen** (`mode = 'new'`) – geführter Wizard von Null
2. **CV prüfen & optimieren** (`mode = 'check'`) – Wizard mit vorbefüllten Feldern aus einem hochgeladenen CV

Der Modus wird über `location.state.mode` gesetzt, **nicht mehr** über unterschiedliche Wizard-Dateien.

---

## Routen-Struktur

```text
/cv-wizard              → Wizard im "new"-Modus (Standard)
/cv-upload              → Upload & Parsing (Check-Flow)
/cv-wizard (state)      → Wizard im gewünschten Modus (new/check)
```

### Navigation

**New-Flow:**

```typescript
navigate('/cv-wizard', { state: { mode: 'new' } });
// oder einfach:
navigate('/cv-wizard');
```

**Check-Flow:**

```typescript
// 1. User geht auf /cv-upload und lädt den CV hoch
// 2. Nach dem Parsen:
navigate('/cv-wizard', {
  state: {
    mode: 'check',
    initialData: parsedCvData
  }
});
```

---

## Implementierte Komponenten

### 1. Kernkomponenten

**CVWizard** (`src/pages/CVWizard.tsx`)

- Zentrale Wizard-Komponente
- Steuert Steps, Motivation-Screens, ProgressBar
- Unterstützt `mode = 'new'` und `mode = 'check'` über `location.state`
- Lädt bei `mode = 'check'` vorbefüllte Daten in `cvData`

**CVUploadCheck** (`src/pages/CVUploadCheck.tsx`)

- Upload- und Parsing-Flow für den Check-Modus
- Extrahiert Daten aus PDF/DOCX (oder Text)
- Mappt die Daten auf `CVBuilderData`
- Navigiert anschließend zu `/cv-wizard` mit `mode = 'check'` und `initialData`

### 2. Step-Komponenten innerhalb von CVWizard.tsx

In `CVWizard.tsx` sind aktuell folgende Steps implementiert:

- `Step0_ExperienceLevel`
- `Step1_PersonalData`
- `Step2_SchoolEducation`
- `Step3_ProfessionalEducation`
- `Step4_WorkExperience`
- `Step5_Projects`
- `Step6_HardSkills` (nutzt `HardSkillsStep`)
- `Step7_SoftSkills` (nutzt `SoftSkillsStep`)
- `Step8_WorkValues`
- `Step9_WorkStyle`
- `Step10_Hobbies`
- `Step11_Completion`

Optional können diese Steps später in eigene Dateien unter `src/components/cvbuilder/steps/` ausgelagert werden, aktuell liegen sie gebündelt in `CVWizard.tsx`.

### 3. Common Components

- `ProgressBar` (`src/components/cvbuilder/ProgressBar.tsx`)
- `AvatarSidebar` (`src/components/cvbuilder/AvatarSidebar.tsx`)
- `DateDropdowns` & `formatDateRange`
- `ChipsInput`
- `HardSkillsStep`
- `SoftSkillsStep`

### 4. Entfernte / veraltete Komponenten

Die folgenden Dateien wurden **entfernt** und werden im Projekt **nicht mehr verwendet**:

- ❌ `CVWizardEntry.tsx`
- ❌ `CVWizardNew.tsx`

Alle ehemaligen Verwendungen wurden auf `CVWizard` umgestellt.

---

## Step-Reihenfolge

Der Wizard hat aktuell **12 Steps** (Index 0–11).
`getTotalSteps()` in `CVWizard.tsx` muss daher `12` zurückgeben.

```text
0  ExperienceLevel      – Wo stehst du gerade in deiner Karriere?
1  PersonalData         – Kontaktdaten
2  SchoolEducation      – Schulische Ausbildung
3  ProfessionalEducation– Ausbildung / Studium / Weiterbildung
4  WorkExperience       – Berufserfahrung
5  Projects             – Projekte (Studium, Beruf, privat)
6  HardSkills           – Fachliche Skills
7  SoftSkills           – Persönliche / soziale Skills
8  WorkValues           – Werte
9  WorkStyle            – Arbeitsweise
10 Hobbies              – Hobbys & Interessen
11 Completion           – Abschluss & Übergang zur Wunschstelle
```

Im Check-Modus kann optional mit Step 1 gestartet werden, falls Experience-Level bereits aus dem CV geparst wurde.

---

## Datenfluss im CVWizard

```typescript
const [cvData, setCVData] = useState<CVBuilderData>({});
const [currentStep, setCurrentStep] = useState(0);
const [showMotivation, setShowMotivation] = useState(false);
const [motivationVariant, setMotivationVariant] = useState<1 | 2 | 3>(1);
const [isCheckMode, setIsCheckMode] = useState(false);

useEffect(() => {
  if (location.state?.mode === 'check' && location.state?.initialData) {
    setIsCheckMode(true);
    setCVData(location.state.initialData);
    // optional: direkt nach ExperienceLevel einsteigen
    setCurrentStep(1);
  }
}, [location.state]);

const updateCVData = <K extends keyof CVBuilderData>(
  key: K,
  value: CVBuilderData[K]
) => {
  setCVData(prev => ({ ...prev, [key]: value }));
};
```

Jeder Step liest seine initialData aus `cvData` und schreibt bei „Weiter":

```typescript
onClick={() => {
  updateCVData('personalData', data);
  nextStep();
}}
```

---

## Motivations-Screens

Motivations-Screens werden zentral in `nextStep` gesteuert:

```typescript
const nextStep = () => {
  if ((currentStep + 1) % 3 === 0 && currentStep > 0 && currentStep <= 10) {
    setMotivationVariant((((currentStep + 1) / 3) % 3 + 1) as 1 | 2 | 3);
    setShowMotivation(true);
  } else {
    setCurrentStep(prev => prev + 1);
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
```

- Wenn `showMotivation = true` ist, wird anstelle des eigentlichen Steps die `MotivationScreen`-Komponente gerendert
- Nach dem Klick auf „Weiter" in der Motivation wird `handleMotivationComplete` aufgerufen und der Wizard fährt mit dem nächsten Step fort
- Motivation-Screens erscheinen nach Steps 3, 6, 9

---

## Design-Prinzipien

✅ Fullscreen-Layout, schwarzer Hintergrund
✅ 1 Hauptfrage pro Screen
✅ Fortschrittsanzeige oben (`ProgressBar`)
✅ Avatar-Sidebar (Desktop rechts, Mobile oben oder darunter)
✅ Große Headlines (`text-5xl` / `text-6xl`)
✅ Datums-Dropdowns (keine Freitexteingaben für Zeiträume)
✅ Chips-Inputs mit vordefinierten Optionen + Custom-Werten
✅ Motivations-Screens als kleine „Breaks" alle paar Steps
✅ Klare Call-to-Actions („Weiter", „Zurück")

---

## Testing

### New-Flow

```bash
# im Browser:
http://localhost:5173/cv-wizard
  → Wizard startet im "new"-Modus
  → alle Steps nacheinander durchklicken
```

### Check-Flow

```bash
# im Browser:
http://localhost:5173/cv-upload
  → CV hochladen / Text einfügen
  → Parsing
  → automatische Navigation zu /cv-wizard mit mode=check
  → Steps werden, soweit möglich, vorbefüllt
```

---

## Nach dem Wizard: Navigation zu Job Targeting

Nach Abschluss von Step 11 (Completion) navigiert der Wizard zu:

```typescript
navigate('/job-targeting', { state: { cvData } });
```

Der User gibt dann seine Wunschstelle ein (Unternehmen, Jobtitel, Link, Stellenbeschreibung).

Nach Klick auf „Weiter zum Editor":

1. **Kein Login erforderlich** ✅
2. **Keine Token/Credit-Prüfung** ✅
3. Make.com Webhook wird aufgerufen (CV-Optimierung)
4. CV wird in Supabase gespeichert mit `is_paid: false`
5. Navigation zum Editor: `/cv/{id}/editor`

**Im Editor:**
- Bei Klick auf "Speichern" oder "Download":
  - Wenn nicht eingeloggt → Redirect zu `/login`
  - Wenn eingeloggt & `is_paid=false` → PaywallModal
  - Wenn eingeloggt & `is_paid=true` → Action wird ausgeführt

---

## Offene Punkte (Roadmap)

- [ ] Optional: Steps aus `CVWizard.tsx` in eigene Dateien auslagern
- [ ] Typen für Sprachen (`languages` im `CVBuilderData`) harmonisieren
- [ ] CV-Parsing im Check-Flow verbessern
- [ ] Persistierung in Supabase (Zwischenspeichern, Laden, Fortsetzen)
- [ ] Error-Handling & Loading-States verfeinern
- [ ] Mobile UX testen und Details optimieren

---

## Architektur-Diagramm

```text
┌─────────────────────────────────────────────────────────────────┐
│                          Landing Page                            │
│                       (ModernLandingPage)                        │
└────────────────┬────────────────────────────┬────────────────────┘
                 │                            │
                 │                            │
        ┌────────▼────────┐         ┌────────▼────────┐
        │  CV erstellen   │         │   CV prüfen     │
        │  (New-Flow)     │         │  (Check-Flow)   │
        └────────┬────────┘         └────────┬────────┘
                 │                            │
                 │                            │
                 │                   ┌────────▼────────┐
                 │                   │  /cv-upload     │
                 │                   │  CVUploadCheck  │
                 │                   └────────┬────────┘
                 │                            │
                 │                    Parsing & Mapping
                 │                            │
                 └──────────┬─────────────────┘
                            │
                   ┌────────▼────────┐
                   │   /cv-wizard    │
                   │    CVWizard     │
                   │                 │
                   │  Steps 0-11     │
                   │  + Motivation   │
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │ /job-targeting  │
                   │  JobTargeting   │
                   │                 │
                   │ Wunschstelle    │
                   └────────┬────────┘
                            │
                     Make.com Webhook
                     CV-Optimierung
                            │
                   ┌────────▼────────┐
                   │ /cv/:id/editor  │
                   │CVLiveEditorPage │
                   │                 │
                   │ Paywall Guard   │
                   └─────────────────┘
```

---

## Datenmodell (CVBuilderData)

```typescript
export interface CVBuilderData {
  experienceLevel?: ExperienceLevel;
  targetRole?: RoleType;
  targetIndustry?: IndustryType;

  personalData?: PersonalData;
  schoolEducation?: SchoolEducation;
  professionalEducation?: ProfessionalEducation[];
  workExperiences?: WorkExperience[];
  projects?: Project[];
  hardSkills?: HardSkill[];
  softSkills?: SoftSkill[];
  workValues?: WorkValues;           // { values: string[], workStyle: string[] }
  hobbies?: Hobbies;                 // { hobbies: string[], details?: string }
  jobTarget?: JobTarget;
  targetJob?: TargetJob;
  languages?: any[];

  summary?: {
    variant: 'professional' | 'confident' | 'friendly';
    text: string;
  };
}
```

---

## Zusammenfassung

✅ **Eine zentrale Wizard-Komponente**: `CVWizard.tsx`
✅ **Eine Route**: `/cv-wizard`
✅ **12 Steps** vollständig implementiert (0-11)
✅ **Motivation-Screens** nach Steps 3, 6, 9
✅ **Zwei Modi**: `new` und `check` via `location.state`
✅ **Kein Login** beim Generieren im Wizard
✅ **Paywall nur im Editor** bei Save/Download
✅ **Build erfolgreich** ohne Fehler

Die Architektur ist jetzt sauber, wartbar und vollständig dokumentiert! 🎉
