# CV-Builder Flow Struktur

## ✅ Bereinigte Flow-Architektur

### **1. Zentrale Start-Page**
**Route:** `/service-selection`
**Komponente:** `ServiceSelection.tsx`

Dies ist der **einzige zentrale Entscheidungspunkt** mit zwei Kacheln:
- ✨ **"Neuen CV erstellen"** → führt zu `/cv-builder`
- 🔍 **"CV analysieren lassen"** → führt zu `/cv-check/upload`

### **2. Landing Pages**
Beide Landing Pages führen zur zentralen Start-Page:

**Route:** `/` (Standard)
**Komponente:** `ModernLandingPage.tsx`
- Alle CTA-Buttons führen zu `/service-selection`
- Kein Wizard-Overlay mehr

**Route:** `/landing-old`
**Komponente:** `LandingPage.tsx`
- Alle CTA-Buttons führen zu `/service-selection`

### **3. CV-Erstellen Flow**
**Route:** `/cv-builder`
**Komponente:** `TaxfixCVBuilder.tsx`

**9 Schritte im Taxfix-Stil:**
1. **Erfahrungslevel** (positiv formuliert)
2. **Zielrolle & Branche**
3. **Ausbildung**
4. **Praktische Erfahrungen** (dynamisch)
5. **Projekte**
6. **Soft Skills** (mit Situationen)
7. **Hard Skills** (branchenbasiert)
8. **Profiltext** (3 Varianten)
9. **Review & Export**

**Features:**
- 1 Frage pro Screen
- 90% klickbasiert
- Avatar mit Erklärungen
- Fortschrittsbalken
- Dynamische Verzweigungen
- Smooth Navigation

### **4. CV-Check Flow**
**Route:** `/cv-check/upload`
**Komponente:** `CVCheckUpload.tsx`

Führt zu CV-Score und Optimierung.

### **5. Dashboard**
**Route:** `/dashboard`
**Komponente:** `Dashboard.tsx`

**Keine doppelten Start-Screens!**
- Tabs: Übersicht, Profil, cvAgent
- Bewerbungen verwalten
- Profildaten bearbeiten

### **6. Nach Abschluss**
Nach CV-Erstellen oder CV-Check:
- User kommt zum **Dashboard** (`/dashboard`)
- NICHT zurück zur Start-Page
- Dashboard zeigt Erfolg und nächste Schritte

---

## 🚫 Entfernte Duplikate

### **CVWizard als Overlay**
- ❌ Wurde aus `ModernLandingPage.tsx` entfernt
- ❌ Mode-Selection Screen im Wizard nicht mehr nötig
- ✅ Alle Flows gehen durch zentrale ServiceSelection

### **Mehrere Start-Screens**
- ❌ Wizard-Overlay entfernt
- ✅ Nur eine zentrale Start-Page: `/service-selection`

---

## 🎯 Klare User-Journeys

### **Journey 1: Neuen CV erstellen**
```
Landing (/)
  → CTA Click
  → ServiceSelection (/service-selection)
  → "Neuen CV erstellen"
  → TaxfixCVBuilder (/cv-builder)
  → 9 Schritte durchlaufen
  → Dashboard (/dashboard)
```

### **Journey 2: CV prüfen**
```
Landing (/)
  → CTA Click
  → ServiceSelection (/service-selection)
  → "CV analysieren lassen"
  → CVCheckUpload (/cv-check/upload)
  → Score-Anzeige
  → Dashboard (/dashboard)
```

---

## 📋 Routing-Übersicht

```
/                          → ModernLandingPage (Standard)
/landing-old               → LandingPage (Alt)
/service-selection         → ServiceSelection (Zentral!)
/cv-builder                → TaxfixCVBuilder (Neu erstellen)
/cv-check/upload           → CVCheckUpload (Prüfen)
/cv-check/score            → CVScore
/dashboard                 → Dashboard (Nach Abschluss)
/onboarding                → OnboardingFlow (Alt, nicht mehr verwendet)
```

---

## ✨ Vorteile der neuen Struktur

1. **Keine Dopplungen** - Nur ein Start-Screen
2. **Klare Navigation** - Jeder Button hat ein Ziel
3. **Kein Zurückfallen** - Nach Abschluss zum Dashboard
4. **Moderne UX** - Taxfix-Stil, geführt, intuitiv
5. **Wartbar** - Einfache Struktur, klare Verantwortlichkeiten
