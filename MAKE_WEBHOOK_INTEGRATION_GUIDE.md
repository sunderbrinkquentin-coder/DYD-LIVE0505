# Make.com Webhook Integration Guide - CV-Check Flow

## Überblick

Der CV-Check Flow funktioniert nach folgendem Workflow:

```
Benutzer Upload
    ↓
1. cvUploadService.ts → Upload zu Supabase Storage
    ↓
2. Public URL generieren + DB-Record erstellen
    ↓
3. Make.com Webhook triggern (async)
    ↓
4. User wird sofort zu /cv-result/:uploadId geleitet (polling startet)
    ↓
5. Make.com verarbeitet den CV und sendet Ergebnis zu Edge Function
    ↓
6. make-cv-callback Edge Function speichert Ergebnisse in DB
    ↓
7. Frontend-Polling findet status='completed' und zeigt Analyse
```

## Make.com Webhook Input

Die Frontend-Anwendung sendet folgende JSON-Struktur an Make.com:

```json
{
  "upload_id": "uuid-des-uploads",
  "file_url": "https://..../cv-uploads/timestamp_filename.pdf",
  "file_url_fallback": "https://....(signed-url-fallback)",
  "file_name": "my-cv.pdf",
  "source": "check",
  "user_id": "uuid-oder-null",
  "session_id": "session_identifier",
  "callback_url": "https://project.supabase.co/functions/v1/make-cv-callback",
  "timestamp": "2025-02-14T10:30:00Z"
}
```

## Make.com Konfiguration

### 1. Webhook HTTP Module

- **URL**: `https://hook.eu2.make.com/XXXXX` (deine Make-Hook-URL)
- **Method**: POST
- **Headers**: `Content-Type: application/json` (automatisch)

### 2. JSON Parser Module

Parse das eingehende JSON und extrahiere:
- `file_url` oder `file_url_fallback` (für den PDF-Download)
- `upload_id` (für die Speicherung der Ergebnisse)
- `callback_url` (für den Callback nach Verarbeitung)

### 3. PDF Download Module

Lade die PDF von der `file_url` herunter:
- Nutze HTTP GET Request
- URL aus dem parsed JSON

### 4. AI Analysis Module (z.B. Claude, ChatGPT)

Analysiere den PDF-Text mit einem KI-Modell für ATS-Score:
- Input: PDF-Text
- Output: Strukturierte Analyse (JSON)

```json
{
  "ats_score": 75,
  "categories": {
    "relevance": 80,
    "achievements": 70,
    "clarity": 75,
    "format": 85,
    "usp": 65
  },
  "recommendations": [
    "...",
    "..."
  ],
  "vision_text": "Extracted raw text from PDF"
}
```

### 5. HTTP POST Callback Module

Sende die Ergebnisse zurück zum Frontend:

```
URL: {callback_url}  (aus dem Input)
Method: POST
Headers: Content-Type: application/json

Body:
{
  "upload_id": "{upload_id}",
  "status": "completed",
  "ats_json": { ... die komplette Analyse ... },
  "vision_text": "Extracted text...",
  "file_url": "{file_url}",  // Optional: Echo back the file URL
  "original_file_url": "{file_url}"  // Optional: Echo back the file URL
}
```

**Bei Fehler:**
```json
{
  "upload_id": "{upload_id}",
  "status": "failed",
  "error_message": "Fehler bei der Analyse",
  "file_url": "{file_url}",  // Optional
  "original_file_url": "{file_url}"  // Optional
}
```

## Edge Function: make-cv-callback

Diese Supabase Edge Function verarbeitet die Webhook-Antwort:

- **Endpoint**: `https://project.supabase.co/functions/v1/make-cv-callback`
- **Method**: POST
- **Authentifizierung**: Öffentlich (keine JWT nötig)
- **Action**: Speichert die Ergebnisse in der `stored_cvs` Tabelle

**Akzeptierte Felder:**
```json
{
  "upload_id": "uuid",
  "status": "completed|failed|processing",
  "ats_json": {},
  "vision_text": "string",
  "error_message": "string (optional)",
  "file_url": "string (optional)",
  "original_file_url": "string (optional)"
}
```

## Database Schema: stored_cvs

```sql
-- Wichtige Spalten für den CV-Check Flow:
- id (uuid) - Upload-ID
- user_id (uuid) - User (optional für anonymous)
- session_id (text) - Session-Identifier
- status (text) - 'pending' → 'processing' → 'completed' oder 'failed'
- source (text) - 'check'
- file_name (text) - Original-Dateiname
- file_url (text) - Public URL zur hochgeladenen Datei (gespeichert beim Upload)
- original_file_url (text) - Backup/alternative URL (gespeichert beim Upload)
- file_path (text) - Speicherpfad in Supabase Storage
- ats_json (jsonb) - Die Analyse-Ergebnisse von Make
- vision_text (text) - Extrahierter Text
- error_message (text) - Fehlermeldungen
- created_at (timestamptz)
- updated_at (timestamptz)
- processed_at (timestamptz)
- make_sent_at (timestamptz) - Zeitstempel, wenn Make-Webhook ausgelöst wurde
```

## Frontend Polling (CvResultPage.tsx)

Das Frontend pollt alle 3 Sekunden die `stored_cvs` Tabelle:

```typescript
- Sucht nach dem Record mit der upload_id
- Prüft den status
- Bei status='completed': Zeigt die Analyse
- Bei status='failed': Zeigt Fehlermeldung
- Timeout nach 20 Versuchen (ca. 1 Minute)
```

## Troubleshooting

### Daten werden nicht zu Make gesendet

**Logs prüfen:**
- Browser DevTools → Console: `[CV-CHECK]` Logs
- Prüfe, ob Webhook-URL konfiguriert ist in `.env`

**Häufige Fehler:**
1. `VITE_MAKE_WEBHOOK_CVCHECK` nicht gesetzt
2. Webhook-URL ist falsch
3. CORS-Probleme (sollten nicht vorkommen da JSON)

### Make-Webhook antwortet nicht

**Debugging:**
- Teste Make-Webhook manuell mit cURL
- Prüfe Make.com Ausführungslogs
- Stelle sicher, dass `callback_url` korrekt ist

### Ergebnisse erscheinen nicht im Frontend

**Prüfpunkte:**
1. Ist die Edge Function `make-cv-callback` deployed?
2. Sendet Make.com die POST-Anfrage zum Callback?
3. Ist die upload_id richtig?

## Environment Variables

```env
# Im .env File erforderlich:
VITE_MAKE_WEBHOOK_CVCHECK=https://hook.eu2.make.com/xxxxx
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=...
```

## Test-Workflow

1. Lade einen Test-CV hoch
2. Beobachte Browser Console für `[CV-CHECK]` Logs
3. Prüfe in Supabase: `stored_cvs` Tabelle
4. Warte auf `status='completed'`
5. Überprüfe `ats_json` für Analyse-Ergebnisse

## Performance

- **Upload**: < 2 Sekunden
- **Make Processing**: 15-30 Sekunden (abhängig von PDF-Größe)
- **Frontend Polling**: 3 Sekunden Intervall
- **Total**: ~20-40 Sekunden von Upload bis zur Anzeige
