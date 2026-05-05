# CV Entry Page - WebApp Landing

## 🎯 Übersicht

Die neue **CvEntryPage** ist die zentrale Einstiegsseite der DYD CV-Plattform. Sie ersetzt die klassische Marketing-Landing-Page durch eine moderne WebApp-Oberfläche mit klarem Fokus auf die zwei Hauptaktionen.

## 📍 Routes

### Hauptroute
- **`/`** → `CvEntryPage` (neue WebApp-Startseite)

### CV-Flow Routes
- **`/cv-check`** → `CVUploadCheck` (CV analysieren)
- **`/cv-wizard?mode=new`** → `CVWizard` (CV erstellen)

### Legacy Routes (weiterhin verfügbar)
- `/landing-modern` → ModernLandingPage
- `/landing-old` → LandingPage
- `/cv-upload` → CVUploadCheck (Alias für /cv-check)

## 🎨 Design-Konzept

### WebApp-Feeling
- ✅ **Dunkles Theme**: `bg-[#0a0a0a]` konsistent mit anderen CV-Seiten
- ✅ **Dezente Glow-Effekte**: Gradient-Blur im Hintergrund
- ✅ **Sticky App-Navigation**: Logo + Login/Dashboard oben fixiert
- ✅ **Zentriertes Layout**: `max-w-5xl` auf Desktop, full-width auf Mobile

### Komponenten-Struktur

```
CvEntryPage
├── Background Glow Effects (absolute, blur-3xl)
├── App Navigation (sticky, backdrop-blur)
│   ├── Logo + "Decide Your Dream"
│   └── Login + Dashboard Buttons
├── Hero Section
│   ├── Status Badge (DSGVO, KI, ATS)
│   ├── Main Headline
│   └── Subtitle
├── Action Cards Grid (2 Cards)
│   ├── Card 1: CV analysieren
│   └── Card 2: CV erstellen
└── Helper Text (Entscheidungshilfe)
```

## 🎴 Action Cards

### Card 1: CV Analysieren
```typescript
{
  route: '/cv-check',
  icon: FileSearch,
  badge: 'Empfohlen, wenn du schon einen CV hast',
  title: 'CV analysieren',
  features: [
    'ATS-Score & Matching',
    'Stärken & Lücken',
    'Konkrete To-dos'
  ],
  cta: 'Jetzt CV prüfen'
}
```

**Flow**: Upload → Analyse → ATS-Score → Optimierungsvorschläge

### Card 2: CV Erstellen
```typescript
{
  route: '/cv-wizard?mode=new',
  icon: FileEdit,
  title: 'CV erstellen',
  features: [
    'Geführter Wizard',
    'Optimierte Formulierungen',
    'Perfekte Struktur'
  ],
  cta: 'Neuen CV starten'
}
```

**Flow**: Wizard Step-by-Step → Strukturierter CV → Export

## 🎭 Animationen (Framer Motion)

### Fade-In beim Laden
- **Hero**: `delay: 0`
- **Card 1**: `delay: 0.2s`
- **Card 2**: `delay: 0.3s`
- **Helper Text**: `delay: 0.5s`

### Hover-Effekte
- **Scale**: `1.02` auf Hover
- **Glow**: Box-Shadow mit individueller Farbe
- **Icon**: Rotation um 5° bei Hover
- **Button**: Translate-X Animation

### Tap-Feedback
- **Scale**: `0.98` beim Klick

## 📱 Responsive Design

### Mobile (< 768px)
- Cards untereinander: `grid-cols-1`
- Full-width Navigation
- Kompakte Helper-Text-Spalten

### Desktop (≥ 768px)
- Cards nebeneinander: `grid-cols-2`
- Zentriertes Layout mit `max-w-5xl`
- Horizontale Helper-Text-Anordnung

## 🎨 Farben & Branding

### Primärfarben
- **Teal**: `#66c0b6` (Hauptakzent)
- **Cyan**: `#30E3CA` (Gradient-Ende)
- **Dark BG**: `#0a0a0a` (Hintergrund)

### Glow-Farben pro Card
- **Card 1**: `rgba(102, 192, 182, 0.35)`
- **Card 2**: `rgba(48, 227, 202, 0.35)`

### Text-Hierarchie
- **Headline**: `text-4xl sm:text-5xl lg:text-6xl`
- **Card-Title**: `text-2xl`
- **Description**: `text-white/60`
- **Features**: `text-sm text-white/70`

## 🔧 Technische Details

### Dependencies
- `react-router-dom` (Navigation)
- `framer-motion` (Animationen)
- `lucide-react` (Icons)
- `tailwindcss` (Styling)

### Icons verwendet
- `FileSearch` (CV analysieren)
- `FileEdit` (CV erstellen)
- `Shield` (DSGVO)
- `Zap` (KI)
- `Target` (ATS)
- `Sparkles` (Logo)
- `ChevronRight` (Arrows)

### TypeScript Interfaces
```typescript
interface ActionCardProps {
  icon: React.ReactNode;
  badge?: string;
  title: string;
  description: string;
  features: string[];
  buttonText: string;
  onClick: () => void;
  glowColor: string;
}
```

## 🚀 Navigation-Logik

### Kein doppelter Flow
- ✅ "CV analysieren" → **immer** `/cv-check`
- ✅ "CV erstellen" → **immer** `/cv-wizard?mode=new`
- ❌ Keine Verwirrung durch mehrere Einstiege
- ❌ Keine gemischten Actions

### URL-Parameter
- `/cv-wizard?mode=new` → Neuer CV
- `/cv-wizard?mode=check&cvId=...` → Aus Analyse
- `/cv-wizard?mode=unlock&cvId=...` → Nach Stripe

## 📊 User-Journey

```
Startseite (CvEntryPage)
    │
    ├─> "CV analysieren"
    │   └─> /cv-check (CVUploadCheck)
    │       └─> /cv-analysis/:uploadId
    │           └─> ATS-Score + Optimierungen
    │               └─> [Wunschstelle optimieren]
    │                   └─> Stripe → /cv-wizard?mode=unlock&cvId=...
    │
    └─> "CV erstellen"
        └─> /cv-wizard?mode=new
            └─> Step-by-Step Wizard
                └─> Fertiger CV → Export
```

## ✅ Checkliste: Erfolgskriterien

- ✅ WebApp-Feeling statt Marketing-Seite
- ✅ Zwei klare Hauptaktionen
- ✅ Keine doppelten/verwirrenden Flows
- ✅ Mobile-First Design
- ✅ Framer Motion Animationen
- ✅ Sticky App-Navigation
- ✅ Dezente Background-Effekte
- ✅ Konsistentes Dark-Theme
- ✅ Klare User-Journey
- ✅ Responsive Grid-Layout

## 🔄 Migration von alten Pages

### Was bleibt
- `ModernLandingPage` → `/landing-modern` (Fallback)
- `LandingPage` → `/landing-old` (Fallback)

### Was NEU ist
- `CvEntryPage` → `/` (Haupt-Einstieg)

### Routing-Priorität
1. `/` → CvEntryPage (primär)
2. `/cv-check` → CVUploadCheck (Analyse)
3. `/cv-wizard` → CVWizard (Erstellung)

## 🎯 Nächste Schritte (optional)

1. **A/B-Testing**: CvEntryPage vs. ModernLandingPage
2. **Analytics**: Click-Tracking für beide Actions
3. **Personalisierung**: Badge basierend auf User-Historie
4. **Onboarding**: Tooltip-Tour für Erstbesucher
5. **Dashboard-Integration**: Direct-Link für eingeloggte User

---

**Erstellt**: 2025-11-25
**Version**: 1.0
**Status**: ✅ Produktionsbereit
