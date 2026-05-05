# Supabase Table Structure - Complete Reference

## 🎯 **Ziel: Einheitliche Nutzung der richtigen Ressourcen**

Dieses Dokument definiert die **einzig korrekten** Supabase-Ressourcen für das Projekt.

---

## ✅ **Storage Buckets**

| Bucket Name | Purpose | Access |
|-------------|---------|--------|
| **`cv_uploads`** | Hochgeladene CV-Dateien (PDF, DOCX) | Private (Signed URLs) |

### Usage:
```typescript
// ✅ CORRECT: Upload to cv_uploads bucket
await supabase.storage
  .from('cv_uploads')
  .upload(`uploads/${filename}`, file);

// ✅ CORRECT: Get signed URL
await supabase.storage
  .from('cv_uploads')
  .createSignedUrl(filePath, 3600);
```

---

## ✅ **Database Tables**

### **1. CV Upload & Check Flow**

| Table Name | Purpose | Key Fields |
|------------|---------|------------|
| **`cv_uploads`** (VIEW) | CV-Uploads für Check-Flow | `id`, `session_id`, `user_id`, `status`, `summary_json` |
| `uploaded_cvs` (REAL TABLE) | Underlying table | Same as above |

**WICHTIG:**
- Code verwendet `cv_uploads` (View)
- Echte Tabelle heißt `uploaded_cvs`
- View hat INSTEAD OF Triggers → verhält sich wie echte Tabelle
- Migration: `20251124210000_create_cv_uploads_view_with_triggers.sql`

#### Usage:
```typescript
// ✅ CORRECT: Insert into cv_uploads (view)
await supabase
  .from('cv_uploads')
  .insert({
    session_id: sessionManager.getSessionId(),
    original_file_url: fileUrl,
    status: 'pending'
  });

// ✅ CORRECT: Select from cv_uploads (view)
await supabase
  .from('cv_uploads')
  .select('*')
  .eq('id', uploadId);

// ✅ CORRECT: Update cv_uploads (view)
await supabase
  .from('cv_uploads')
  .update({ status: 'completed', summary_json: data })
  .eq('id', uploadId);
```

---

### **2. CV Builder Tables**

| Table Name | Purpose | Key Fields |
|------------|---------|------------|
| **`cv_records`** | Complete CV records | `id`, `user_id`, `session_id`, `title`, `cv_data` |
| `cv_personal_data` | Personal information | `id`, `cv_record_id`, `first_name`, `last_name`, `email` |
| `cv_experience` | Work experiences | `id`, `cv_record_id`, `company`, `position`, `start_date` |
| `cv_education` | Education entries | `id`, `cv_record_id`, `institution`, `degree`, `graduation_year` |
| `cv_soft_skills` | Soft skills | `id`, `cv_record_id`, `skill`, `description` |
| `cv_hard_skills` | Hard skills | `id`, `cv_record_id`, `skill`, `level`, `years` |
| `cv_projects` | Projects | `id`, `cv_record_id`, `title`, `description`, `role` |
| `cv_versions` | CV versions | `id`, `cv_record_id`, `version`, `created_at` |
| `job_targets` | Target jobs | `id`, `cv_record_id`, `company`, `position`, `description` |

#### Usage:
```typescript
// ✅ CORRECT: Create CV record
await supabase
  .from('cv_records')
  .insert({
    user_id: user.id,
    session_id: sessionId,
    title: 'My CV',
    cv_data: { ... }
  });

// ✅ CORRECT: Get all CVs for user
await supabase
  .from('cv_records')
  .select('*')
  .eq('user_id', user.id);
```

---

### **3. User Management Tables**

| Table Name | Purpose | Key Fields |
|------------|---------|------------|
| **`profiles`** | User profiles | `id`, `user_id`, `session_id`, `email`, `name` |
| **`user_settings`** | User preferences | `id`, `user_id`, `theme`, `language` |

#### Usage:
```typescript
// ✅ CORRECT: Get user profile
await supabase
  .from('profiles')
  .select('*')
  .eq('user_id', user.id)
  .single();

// ✅ CORRECT: Update user settings
await supabase
  .from('user_settings')
  .upsert({
    user_id: user.id,
    theme: 'dark'
  });
```

---

### **4. Agent & Progress Tracking**

| Table Name | Purpose | Key Fields |
|------------|---------|------------|
| **`agent_responses`** | AI agent responses | `id`, `user_id`, `session_id`, `step`, `response` |
| **`agent_progress`** | User progress in wizard | `id`, `user_id`, `session_id`, `current_step`, `completed` |

#### Usage:
```typescript
// ✅ CORRECT: Save agent response
await supabase
  .from('agent_responses')
  .insert({
    user_id: user?.id,
    session_id: sessionId,
    step: 'personal_data',
    response: { ... }
  });

// ✅ CORRECT: Update progress
await supabase
  .from('agent_progress')
  .upsert({
    user_id: user?.id,
    session_id: sessionId,
    current_step: 5,
    completed: false
  });
```

---

### **5. Job Applications**

| Table Name | Purpose | Key Fields |
|------------|---------|------------|
| **`job_application`** | Job applications | `id`, `user_id`, `session_id`, `company`, `position`, `status` |
| **`applications`** | Application tracking (Dashboard) | `id`, `user_id`, `company`, `position`, `applied_date` |

#### Usage:
```typescript
// ✅ CORRECT: Create application
await supabase
  .from('job_application')
  .insert({
    user_id: user?.id,
    session_id: sessionId,
    company: 'Company Name',
    position: 'Position',
    status: 'applied'
  });

// ✅ CORRECT: Get all applications (Dashboard)
await supabase
  .from('applications')
  .select('*')
  .eq('user_id', user.id)
  .order('applied_date', { ascending: false });
```

---

## ❌ **DEPRECATED Tables (DO NOT USE)**

Diese Tabellen existieren möglicherweise noch, aber **dürfen nicht mehr verwendet werden**:

| Table Name | Status | Replacement |
|------------|--------|-------------|
| `uploaded_cvs` | ⚠️ Use view `cv_uploads` instead | `cv_uploads` (view) |
| `cvs` | ❌ Deprecated | `cv_records` |
| `onboarding_data` | ❌ Deprecated | `profiles` + wizard state |
| `chat_conversations` | ❌ Deprecated | Not needed |
| `optimized_cvs` | ❌ Deprecated | `cv_records` |
| `job_matches` | ❌ Deprecated | `applications` |
| `cv_check_entries` | ❌ Deprecated | `cv_uploads` |
| `cv_documents` | ❌ Deprecated | `cv_records` |

---

## 🔄 **Migration Path: uploaded_cvs → cv_uploads**

### **Problem:**
- Real table: `uploaded_cvs`
- Code uses: `cv_uploads`

### **Solution:**
- Created updatable VIEW `cv_uploads`
- VIEW points to `uploaded_cvs`
- INSTEAD OF triggers make it writable

### **Migrations:**
1. `20251124200000_fix_rls_policies_session_based.sql` - RLS policies for `uploaded_cvs`
2. `20251124210000_create_cv_uploads_view_with_triggers.sql` - Creates `cv_uploads` view with triggers

### **Result:**
```typescript
// ✅ This works seamlessly:
await supabase.from('cv_uploads').insert({ ... });

// Under the hood:
// 1. INSERT goes to cv_uploads view
// 2. INSTEAD OF trigger catches it
// 3. Trigger inserts into uploaded_cvs table
// 4. RLS policies on uploaded_cvs apply
// 5. Result returned to caller
```

---

## 📋 **Checklist: Korrekte Tabellennutzung**

### **Für Entwickler:**

- [ ] Verwende `cv_uploads` für CV-Upload/Check
- [ ] Verwende `cv_records` für CV-Builder
- [ ] Verwende `profiles` für User-Daten
- [ ] Verwende `agent_responses` und `agent_progress` für Wizard
- [ ] Verwende `job_application` und `applications` für Bewerbungen
- [ ] Verwende NIEMALS deprecated Tabellen (`cvs`, `onboarding_data`, etc.)
- [ ] Storage Bucket ist immer `cv_uploads`

### **Für neue Features:**

1. ✅ Prüfe, ob passende Tabelle existiert
2. ✅ Wenn nein: Erstelle Migration für neue Tabelle
3. ❌ NIEMALS direkt im Code neue Tabellen erzeugen
4. ✅ Nutze bestehende Tabellen wo möglich
5. ✅ Folge der Namenskonvention: `cv_*`, `job_*`, `agent_*`, `user_*`

### **Vor Deployment:**

- [ ] Migrations im richtigen Order ausgeführt
- [ ] RLS-Policies aktiv
- [ ] View `cv_uploads` existiert und funktioniert
- [ ] INSTEAD OF Triggers funktionieren
- [ ] Build erfolgreich: `npm run build`
- [ ] Keine deprecated Tabellennamen im Code

---

## 🔍 **Debugging: Falsche Tabelle verwendet?**

### **Symptom:** "relation does not exist"

**Ursache:** Code verwendet falsche Tabelle

**Lösung:**
```bash
# Finde alle Vorkommen:
grep -r "\.from('" src/ | grep -v node_modules

# Ersetze falsche Namen:
- .from('cvs') → .from('cv_records')
- .from('uploaded_cvs') → .from('cv_uploads')
- .from('optimized_cvs') → .from('cv_records')
```

### **Symptom:** "new row violates row-level security policy"

**Ursache:** RLS-Policies nicht korrekt

**Lösung:**
1. Prüfe, ob Migration `20251124200000_fix_rls_policies_session_based.sql` ausgeführt wurde
2. Prüfe, ob `x-session-id` Header gesetzt ist
3. Prüfe, ob `session_id` im INSERT enthalten ist

---

## 📖 **Weitere Ressourcen**

- **RLS Fix:** `RLS_FIX_DOCUMENTATION.md`
- **CV Check Flow:** `CV_CHECK_FINAL_COMPLETE.md`
- **Migrations:** `src/supabase/migrations/`
- **Session Manager:** `src/lib/supabase.ts`

---

## ✅ **Status**

- ✅ Storage Bucket `cv_uploads` definiert
- ✅ View `cv_uploads` mit INSTEAD OF Triggers erstellt
- ✅ RLS Policies für session-basiertes Access
- ✅ Alle Services verwenden korrekte Tabellen
- ✅ Deprecated Tabellen dokumentiert
- ✅ Migration path klar definiert

**Letzte Aktualisierung:** 2025-11-24
**Version:** 1.0
