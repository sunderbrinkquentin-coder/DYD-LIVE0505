# FAQ-Seite - Dokumentation

## Übersicht

Neue SEO-optimierte FAQ-Seite unter `/faq` mit strukturierten Daten für Suchmaschinen und AI-Systeme.

---

## Dateien erstellt

### 1. **src/components/seo/FaqSchema.tsx**
React-Komponente für JSON-LD strukturierte Daten nach Schema.org.

**Funktion:**
- Generiert FAQPage Schema automatisch aus FAQ-Daten
- Fügt JSON-LD Script dynamisch in `<head>` ein
- Cleanup beim Unmount (removes script)

**Verwendung:**
```tsx
<FaqSchema faqs={[
  { question: "Frage", answer: "Antwort" }
]} />
```

---

### 2. **src/pages/FaqPage.tsx**
Die Haupt-FAQ-Seite mit 14 Fragen und Antworten.

**Features:**
- ✅ SEO-optimierter Title und Meta Description
- ✅ JSON-LD strukturierte Daten (Schema.org FAQPage)
- ✅ 14 fachlich korrekte Fragen zu DYD-Features
- ✅ Responsive Design mit designSystem
- ✅ Framer Motion Animationen
- ✅ CTAs zu CV-Check und CV-Wizard
- ✅ Navigation zurück zur Startseite

**SEO-Metadaten:**
- **Title:** "DYD CV-Check & Lebenslauf Generator – FAQ"
- **Meta Description:** "Antworten zu CV-Analyse, ATS-Optimierung, Stripe-Bezahlung, Zertifikats-PDFs und Datenschutz bei DYD – Decide Your Dream."

---

## Route

**URL:** `/faq`

Hinzugefügt in `src/routes/index.tsx` im "Legal"-Bereich:
```tsx
{ path: '/faq', element: <FaqPage /> },
```

---

## FAQ-Inhalte

### 14 Fragen abgedeckt:

1. **Was ist DYD – Decide Your Dream?**
   - Beschreibung der Plattform und Hauptfunktionen

2. **Wie funktioniert die CV-Analyse?**
   - Upload-Prozess, ATS-Check, Supabase Storage, Make.com Integration

3. **Wie läuft die CV-Erstellung ab?**
   - CV-Wizard, KI-Unterstützung, Formulierungsvorschläge

4. **Welche Rolle spielt Make.com im Prozess?**
   - Webhook-basierte Automatisierung, Analyse-Pipeline

5. **Wie funktioniert die Bezahlung über Stripe?**
   - Stripe Checkout, Token-Pakete, Webhook-Integration

6. **Was passiert nach dem Kauf von Tokens?**
   - Token-Gutschrift, Verwendung, Dashboard-Anzeige

7. **Werden meine Daten gespeichert?**
   - Supabase Storage, Session vs. Account-Speicherung

8. **Wie sicher sind Uploads?**
   - HTTPS, Row Level Security, zeitlich begrenzte URLs

9. **Kann ich Zertifikate als eigene PDFs erstellen?**
   - Ehrliche Antwort: Feature nicht implementiert, nur als CV-Abschnitt

10. **Unterstützt DYD ATS-optimierte Lebensläufe?**
    - ATS-Analyse, Keyword-Check, strukturelle Optimierung

11. **Welche Dateiformate werden akzeptiert?**
    - PDF Upload, PDF/DOCX Export

12. **Für wen ist DYD gedacht?**
    - Jobsuchende, Berufseinsteiger, Coaches, B2B-Nutzung

13. **Gibt es eine kostenlose Version?**
    - Erster Test möglich, Token für vollständige Nutzung

14. **Wie schnell bekomme ich mein Ergebnis?**
    - 2-5 Minuten für CV-Analyse, sofort für Wizard

---

## Structured Data (JSON-LD)

Implementiert nach **Schema.org FAQPage** Standard:

```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Was ist DYD – Decide Your Dream?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "DYD ist eine KI-gestützte Plattform für CV-Analyse..."
      }
    }
  ]
}
```

**Vorteile:**
- Google Rich Results (FAQ Snippets)
- AI-Systeme können Antworten direkt extrahieren
- Bessere Sichtbarkeit in Suchergebnissen
- Voice Search Optimierung

---

## CTA-Buttons

Am Ende der Seite:

1. **"Jetzt CV analysieren"**
   - Navigiert zu `/cv-check`
   - Primary Button (teal)
   - Icon: Upload

2. **"Lebenslauf erstellen"**
   - Navigiert zu `/cv-wizard`
   - Secondary Button (outline)
   - Icon: FileText

---

## Design

**Konsistenz:**
- Verwendet `designSystem.ts` für alle Styles
- Slate-950 Gradient Background
- Teal (#66c0b6) Accent Color
- Responsive Breakpoints (sm, md, lg)
- Framer Motion für smooth Animationen

**Layout:**
- Max-width: 4xl (1024px)
- Spacing: Mobile-first (sm/md/lg breakpoints)
- Card-basiertes FAQ-Design
- Zentrale Ausrichtung

---

## Inhaltliche Richtlinien

**Antwort-Struktur:**
1. **Erste Zeile:** Kurze, präzise Antwort (max. 2 Sätze)
2. **Details:** Ausführlichere Erklärung mit technischen Details
3. **Sachlich:** Keine Werbesprache, nur Fakten
4. **Ehrlich:** Keine Features erfunden (z.B. Zertifikats-PDFs)

**Quellen der Informationen:**
- Basiert auf echtem Code in `src/services/`
- Supabase Storage und RLS
- Make.com Webhook-Integration
- Stripe Payment Flow
- CV-Wizard Architektur

---

## SEO-Optimierung

**On-Page SEO:**
- ✅ Semantisches HTML (`<h1>`, `<h2>`)
- ✅ Meta Title optimiert
- ✅ Meta Description mit Keywords
- ✅ JSON-LD strukturierte Daten
- ✅ Mobile-first responsive
- ✅ Schnelle Ladezeit (Vite build optimiert)

**Keywords abgedeckt:**
- CV-Analyse
- ATS-Optimierung
- Lebenslauf Generator
- Stripe-Bezahlung
- Datenschutz
- Make.com Integration
- Zertifikats-PDFs

---

## Navigation

**Erreichbar über:**
- Direkte URL: `/#/faq`
- Footer-Links (wenn implementiert)
- Sitemap (wenn generiert)

**Verlinkungen von FAQ:**
- `/cv-check` (CV-Analyse)
- `/cv-wizard` (Lebenslauf erstellen)
- `/` (Startseite)

---

## Testing

**Manuell testen:**
1. `npm run dev`
2. Navigiere zu `http://localhost:5173/#/faq`
3. Überprüfe:
   - Title im Browser-Tab
   - Alle 14 Fragen werden angezeigt
   - CTAs funktionieren
   - Responsive auf Mobile/Desktop
   - Animationen laufen smooth

**SEO testen:**
1. View Page Source → `<script type="application/ld+json">` sollte sichtbar sein
2. Google Rich Results Test: https://search.google.com/test/rich-results
3. Schema Validator: https://validator.schema.org/

---

## Build Status

✅ Build erfolgreich
✅ Keine TypeScript Errors
✅ Keine Breaking Changes
✅ 3 neue Module: +2672 → 2672 (FaqPage + FaqSchema)

---

## Zukünftige Erweiterungen

**Mögliche Verbesserungen:**
- [ ] FAQ-Suche (Filter/Search Box)
- [ ] Kategorisierung (Allgemein, Technik, Bezahlung)
- [ ] Expandable/Collapsible Sections
- [ ] Vote-System (War diese Antwort hilfreich?)
- [ ] Verlinkung zu verwandten FAQs
- [ ] Mehrsprachigkeit (EN/DE)

---

## Constraints erfüllt

✅ Keine UI-Änderungen an bestehenden Seiten
✅ Keine Datenbank-Schema-Änderungen
✅ Keine Stripe-Logik-Änderungen
✅ Keine Features erfunden
✅ Sachlich und neutral
✅ SEO-optimiert
✅ Schema.org konform
✅ Build erfolgreich
