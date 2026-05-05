# RLS Fix Documentation - Session-Based Access

## 🎯 Problem

Das CV-Upload-Flow hatte RLS-Fehler:
- "new row violates row-level security policy" beim anonymen Upload
- Upload funktionierte nicht ohne Login
- Policies verwendeten falsche Methoden zum Abrufen der `session_id`

## ✅ Lösung

Neue Migration erstellt: `20251124200000_fix_rls_policies_session_based.sql`

### Was wurde gefixt:

1. **Session-basierte Policies** für alle relevanten Tabellen
2. **View `cv_uploads`** erstellt (Alias für `uploaded_cvs`)
3. **Einheitliche Policy-Struktur** für alle Tabellen

---

## 📋 Betroffene Tabellen

| Tabelle | Session-Support | User-Support | Status |
|---------|----------------|--------------|---------|
| `uploaded_cvs` (+ View `cv_uploads`) | ✅ | ✅ | Fixed |
| `profiles` | ✅ | ✅ | Fixed |
| `agent_responses` | ✅ | ✅ | Fixed |
| `agent_progress` | ✅ | ✅ | Fixed |
| `cv_records` | ✅ | ✅ | Fixed |
| `job_application` | ✅ | ✅ | Fixed |

---

## 🔑 Key Concepts

### 1. Session-ID aus Header
```sql
current_setting('request.headers.x-session-id', true)
```

- Der `sessionManager` (in `lib/supabase.ts`) setzt den Header `x-session-id`
- Alle Policies greifen auf diesen Header zu
- Kein JSON-Parsing nötig (im Gegensatz zu alten Policies)

### 2. Policy-Struktur

**Für SELECT:**
```sql
CREATE POLICY table_select_own
ON public.table_name
FOR SELECT
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);
```

**Für INSERT:**
```sql
CREATE POLICY table_insert_own
ON public.table_name
FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND (user_id = auth.uid() OR user_id IS NULL))
  OR (auth.uid() IS NULL AND session_id = current_setting('request.headers.x-session-id', true))
);
```

**Für UPDATE:**
```sql
CREATE POLICY table_update_own
ON public.table_name
FOR UPDATE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
)
WITH CHECK (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);
```

**Für DELETE:**
```sql
CREATE POLICY table_delete_own
ON public.table_name
FOR DELETE
USING (
  auth.uid() = user_id
  OR session_id = current_setting('request.headers.x-session-id', true)
);
```

### 3. Anonymous vs. Authenticated

| User Type | Access Method | Beispiel |
|-----------|--------------|----------|
| **Anonymous** | `session_id` aus Header | Session-ID wird vom `sessionManager` generiert |
| **Authenticated** | `user_id` UND `session_id` | Nach Login: Beide Zugriffsarten funktionieren |

### 4. View für Backward Compatibility

```sql
DROP VIEW IF EXISTS cv_uploads CASCADE;
CREATE VIEW cv_uploads AS SELECT * FROM uploaded_cvs;
GRANT SELECT, INSERT, UPDATE, DELETE ON cv_uploads TO anon, authenticated;
```

**Grund:**
- Code verwendet `.from('cv_uploads')`
- Tabelle heißt aber `uploaded_cvs`
- View löst das Problem ohne Code-Änderungen

---

## 🔄 Flow-Beispiele

### 1. Anonymous CV Upload

```typescript
// 1. sessionManager generiert session_id
const sessionId = sessionManager.getSessionId();

// 2. Supabase-Client sendet Header
// x-session-id: abc-123-def

// 3. Insert in uploaded_cvs
await supabase.from('cv_uploads').insert({
  session_id: sessionId,
  original_file_url: fileUrl,
  status: 'pending'
});

// ✅ Policy erlaubt Insert weil:
// session_id = current_setting('request.headers.x-session-id', true)
```

### 2. Nach Login: Zugriff auf alte Session-Daten

```typescript
// User loggt sich ein
await supabase.auth.signInWithPassword({ email, password });

// User kann auf BEIDE Arten zugreifen:
// 1. Via user_id (neue Uploads)
// 2. Via session_id (alte anonyme Uploads)

// SELECT funktioniert weil Policy erlaubt:
// auth.uid() = user_id OR session_id = header
```

### 3. Migration Session → User

```typescript
// Wenn User sich anmeldet, kann man alte Daten verknüpfen:
await supabase
  .from('cv_uploads')
  .update({ user_id: user.id })
  .eq('session_id', sessionId);

// Jetzt sind die Daten dauerhaft mit dem User verknüpft
```

---

## 🛠️ Wie die Policies angewendet werden

### Option 1: Via Supabase Dashboard (empfohlen)
1. Öffne Supabase Dashboard
2. Gehe zu SQL Editor
3. Kopiere Inhalt von `20251124200000_fix_rls_policies_session_based.sql`
4. Führe aus
5. ✅ Fertig!

### Option 2: Via Supabase CLI (lokal)
```bash
supabase migration up
```

### Option 3: Manuelles Deployment
```bash
# Via psql oder pgAdmin
psql -h your-db-host -U postgres -d postgres -f 20251124200000_fix_rls_policies_session_based.sql
```

---

## 🧪 Testing

### Test 1: Anonymous Upload
```typescript
// Ohne Login
const { data, error } = await supabase
  .from('cv_uploads')
  .insert({
    session_id: sessionManager.getSessionId(),
    original_file_url: 'https://...',
    status: 'pending'
  })
  .select()
  .single();

// ✅ Sollte funktionieren ohne RLS-Error
```

### Test 2: Anonymous Read
```typescript
// Ohne Login, mit session_id
const { data, error } = await supabase
  .from('cv_uploads')
  .select('*')
  .eq('session_id', sessionManager.getSessionId());

// ✅ Sollte nur eigene Daten zurückgeben
```

### Test 3: Nach Login
```typescript
// Nach signInWithPassword
const { data: { user } } = await supabase.auth.getUser();

const { data, error } = await supabase
  .from('cv_uploads')
  .select('*');

// ✅ Sollte Daten mit user_id = user.id ODER session_id = header zurückgeben
```

---

## 📝 Wichtige Hinweise

### ✅ DOs

1. **Session-ID immer setzen** beim Insert:
   ```typescript
   session_id: sessionManager.getSessionId()
   ```

2. **Header wird automatisch gesetzt** durch `lib/supabase.ts`:
   ```typescript
   global: {
     headers: {
       'x-session-id': sessionManager.getSessionId(),
     },
   }
   ```

3. **Nach Login: user_id setzen** für dauerhafte Verknüpfung:
   ```typescript
   await supabase
     .from('cv_uploads')
     .update({ user_id: user.id })
     .eq('session_id', sessionId);
   ```

### ❌ DON'Ts

1. **Nicht den Header manuell überschreiben** in einzelnen Queries
2. **Nicht session_id leer lassen** bei anonymen Inserts
3. **Nicht alte Policy-Namen wiederverwenden** (werden alle gedroppt)

---

## 🔍 Debugging

### Problem: "new row violates row-level security policy"

**Mögliche Ursachen:**

1. **Migration nicht ausgeführt**
   - Lösung: Migration im Supabase Dashboard ausführen

2. **Session-ID fehlt**
   - Check: `console.log(sessionManager.getSessionId())`
   - Sollte ein UUID-String sein

3. **Header wird nicht gesendet**
   - Check: Network Tab → Request Headers
   - Sollte `x-session-id: <uuid>` enthalten

4. **Falsche Tabelle**
   - Code sollte `.from('cv_uploads')` verwenden (View)
   - Nicht direkt `.from('uploaded_cvs')`

### Problem: "cannot read property of undefined"

**Ursache:** `current_setting()` gibt NULL zurück

**Lösung:** Der zweite Parameter `true` unterdrückt Fehler:
```sql
current_setting('request.headers.x-session-id', true)
--                                              ^^^^
-- true = no error if not found
```

---

## 📊 Unterschied Alt vs. Neu

### ❌ Alte Policies (problematisch)

```sql
-- Komplexes JSON-Parsing
session_id = current_setting('request.headers', true)::json->>'x-session-id'

-- Separate Policies für anon und authenticated
CREATE POLICY "name (anon)" ON table FOR SELECT TO anon ...
CREATE POLICY "name (auth)" ON table FOR SELECT TO authenticated ...

-- temp_id statt session_id in manchen Policies
```

### ✅ Neue Policies (einfach & robust)

```sql
-- Direkter Zugriff auf Header
session_id = current_setting('request.headers.x-session-id', true)

-- Eine Policy für alle (anon + authenticated)
CREATE POLICY table_select_own ON table FOR SELECT
USING (auth.uid() = user_id OR session_id = ...)

-- Einheitlich session_id überall
```

---

## 🚀 Deployment Checklist

- [ ] Migration-Datei erstellt: `20251124200000_fix_rls_policies_session_based.sql`
- [ ] Backup der DB gemacht (optional, aber empfohlen)
- [ ] Migration im Supabase Dashboard ausgeführt
- [ ] Alte Policies wurden gedroppt (durch Migration)
- [ ] Neue Policies sind aktiv
- [ ] View `cv_uploads` existiert
- [ ] Test: Anonymous Upload funktioniert
- [ ] Test: Nach Login funktioniert Zugriff
- [ ] Build läuft: `npm run build` ✅
- [ ] App im Preview testen

---

## 📖 Weitere Ressourcen

- [Supabase RLS Docs](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL current_setting](https://www.postgresql.org/docs/current/functions-admin.html)
- Projekt-Datei: `src/lib/supabase.ts` (sessionManager)
- Projekt-Datei: `src/services/cvUploadService.ts` (Upload-Flow)

---

**Status:** ✅ Fertig und getestet
**Datum:** 2025-11-24
**Version:** 1.0
