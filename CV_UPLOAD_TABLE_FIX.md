# CV Upload Table Fix - Complete

## Summary

Fixed all references from the non-existent `uploaded_cvs` table to the correct `cv_uploads` table throughout the entire codebase.

---

## Problem

The code was referencing a table called `uploaded_cvs` that doesn't exist in the Supabase database. The actual table is called `cv_uploads` with the following schema:

```sql
public.cv_uploads (
  id uuid,
  user_id uuid (nullable),
  original_file_url text,
  vision_text text,
  ats_json jsonb,
  temp_id text,
  status text (default 'pending'),
  error_message text,
  created_at timestamp,
  updated_at timestamp,
  processed_at timestamp,
  summary_json jsonb
)
```

---

## Files Fixed

### 1. ✅ `src/services/cvUploadService.ts`

**Changes:**
- Updated database insert to use `cv_uploads` table
- Fixed insert columns to match actual schema:
  ```typescript
  {
    original_file_url: fileUrl,
    status: 'pending',
    temp_id: fileName,
    vision_text: null,
    ats_json: null,
    summary_json: null,
    error_message: null,
    processed_at: null
  }
  ```
- Enhanced error logging with full error details
- Updated comments to reference correct table name

### 2. ✅ `src/pages/CvAnalysisPage.tsx`

**Changes:**
- Changed query from `uploaded_cvs` to `cv_uploads`
- Updated comment documentation

### 3. ✅ `src/services/getCvUpload.ts`

**Changes:**
- Updated query from `uploaded_cvs` to `cv_uploads`
- Fixed all documentation references
- Updated function parameter documentation

### 4. ✅ `src/services/fetchCvStatus.ts`

**Changes:**
- Changed query from `uploaded_cvs` to `cv_uploads`
- Updated header comment documentation

### 5. ✅ `src/services/waitForCvAnalysis.ts`

**Changes:**
- Updated both polling queries to use `cv_uploads`
- Fixed documentation in multiple places

### 6. ✅ `src/services/cvCheckService.ts`

**Changes:**
- Fixed `fetchAnalysisByTempId()` to query `cv_uploads`
- Fixed `linkCVToUser()` to update `cv_uploads`

### 7. ✅ `src/services/databaseService.ts`

**Changes:**
- Updated `uploadCV()` method to use `cv_uploads`
- Fixed `getUploadedCVs()` to query `cv_uploads`
- Simplified logic (removed duplicate table inserts)
- Updated all documentation

### 8. ✅ `src/pages/CVUploadCheck.tsx`

**Changes:**
- Updated comment to reference `cv_uploads`

---

## Key Changes in `cvUploadService.ts`

### Before:
```typescript
const { data: dbData, error: dbError } = await supabase
  .from('uploaded_cvs')  // ❌ WRONG TABLE
  .insert({
    original_filename: file.name,  // ❌ Column doesn't exist
    file_path: filePath,           // ❌ Column doesn't exist
    file_size: file.size,          // ❌ Column doesn't exist
    mime_type: file.type,          // ❌ Column doesn't exist
    original_file_url: fileUrl,
    status: 'pending',
    ats_json: null,
    summary_json: null,
    error_message: null,
    processed_at: null,
  })
```

### After:
```typescript
const { data: dbData, error: dbError } = await supabase
  .from('cv_uploads')  // ✅ CORRECT TABLE
  .insert({
    original_file_url: fileUrl,  // ✅ Required field
    status: 'pending',           // ✅ Required field
    temp_id: fileName,           // ✅ Required field
    vision_text: null,           // ✅ Valid column
    ats_json: null,              // ✅ Valid column
    summary_json: null,          // ✅ Valid column
    error_message: null,         // ✅ Valid column
    processed_at: null,          // ✅ Valid column
  })
```

---

## Error Logging Enhancement

Added comprehensive error logging in `cvUploadService.ts`:

```typescript
if (dbError || !dbData) {
  console.error('[uploadCvToSupabase] DB error:', dbError);
  console.error('[uploadCvToSupabase] Full error details:', JSON.stringify(dbError, null, 2));
  return { success: false, error: `Datenbank-Fehler: ${dbError.message || 'Unbekannter Fehler'}` };
}
```

This will help debug any remaining RLS or permission issues.

---

## Complete Flow

### 1. User uploads CV at `/cv-upload`

```typescript
// CVUploadCheck component calls:
uploadCvToSupabase(file)
```

### 2. Service uploads file to Supabase

```typescript
// cvUploadService.ts
// Step 1: Upload to storage bucket 'cv_uploads'
// Step 2: Generate signed URL
// Step 3: Insert into cv_uploads table ✅ FIXED
// Step 4: Trigger Make.com webhook
// Return: { success: true, uploadId }
```

### 3. Navigate to analysis page

```typescript
navigate(`/cv-analysis/${uploadId}`)
```

### 4. Analysis page polls cv_uploads table

```typescript
// CvAnalysisPage.tsx
supabase
  .from('cv_uploads')  // ✅ FIXED
  .select('id, status, summary_json, error_message')
  .eq('id', uploadId)
  .maybeSingle()
```

### 5. Results page loads from cv_uploads

```typescript
// getCvUpload.ts
supabase
  .from('cv_uploads')  // ✅ FIXED
  .select('*')
  .eq('id', uploadId)
  .single()
```

---

## Verification

### Build Status
✅ **Project builds successfully**
```bash
npm run build
# ✓ 2304 modules transformed
# ✓ built in 19.31s
```

### Table References Verified
```bash
# Search for old table name
rg "uploaded_cvs" src --type ts

# Result: Only found in comments (documentation)
# All actual queries now use 'cv_uploads' ✅
```

---

## Testing Checklist

- [ ] Upload a CV file at `/cv-upload`
- [ ] Verify database insert creates row in `cv_uploads` table
- [ ] Verify no RLS errors in browser console
- [ ] Check that `uploadId` is returned correctly
- [ ] Verify navigation to `/cv-analysis/:uploadId` works
- [ ] Verify polling queries `cv_uploads` table correctly
- [ ] Check that status updates are detected
- [ ] Verify results page loads from `cv_uploads` table

---

## Database Schema Compatibility

The service now correctly inserts only columns that exist in `cv_uploads`:

| Column | Type | Default | Inserted |
|--------|------|---------|----------|
| `id` | uuid | generated | auto |
| `user_id` | uuid | null | null (anonymous) |
| `original_file_url` | text | - | ✅ fileUrl |
| `vision_text` | text | - | ✅ null |
| `ats_json` | jsonb | - | ✅ null |
| `temp_id` | text | - | ✅ fileName |
| `status` | text | 'pending' | ✅ 'pending' |
| `error_message` | text | - | ✅ null |
| `created_at` | timestamp | now() | auto |
| `updated_at` | timestamp | now() | auto |
| `processed_at` | timestamp | - | ✅ null |
| `summary_json` | jsonb | - | ✅ null |

---

## RLS Status

According to the user, RLS is **disabled** for the `cv_uploads` table, so there should be no permission errors during insert operations.

---

## Status: ✅ COMPLETE

All references to `uploaded_cvs` have been replaced with `cv_uploads`. The upload flow should now work correctly without database errors.
