# CV Upload Logic - Unified Implementation

## Summary

Successfully unified and standardized the CV upload logic across the project. All CV uploads now use a centralized service with consistent behavior.

## Changes Made

### 1. Central Configuration Created
- **File**: `src/config/storage.ts`
- **Purpose**: Central constants for storage bucket names
- **Key Export**: `CV_BUCKET = 'cv-uploads'` (public bucket for direct browser access)

### 2. Type Definitions Created
- **File**: `src/types/cvUpload.ts`
- **Defines**: `UploadedCv`, `UploadOptions`, `UploadResult`, `UploadSource`
- **Purpose**: Type safety and consistent interfaces

### 3. Unified Upload Service
- **File**: `src/services/cvUploadService.ts`
- **Function**: `uploadCvAndCreateRecord(file, options)`
- **Flow**:
  1. Sanitize filename (remove spaces, special chars)
  2. Upload to Supabase Storage bucket `cv-uploads`
  3. Generate public URL via `getPublicUrl()` (not manual construction)
  4. Insert database record in `cv_uploads` table with `original_file_url`
  5. Trigger Make.com webhook with metadata (`uploadId`, `fileUrl`, `source`)
  6. Return `{ success, uploadId, fileUrl }`

### 4. Updated Components

#### CVCheckPage
- **File**: `src/pages/CVCheckPage.tsx`
- **Change**: Replaced inline upload logic with `uploadCvAndCreateRecord()`
- **Benefits**: Simplified from ~70 lines to ~15 lines of upload code

#### DatabaseService
- **File**: `src/services/databaseService.ts`
- **Change**: Updated storage references to use `CV_BUCKET` constant
- **Methods Updated**: `uploadCV()`

## Key Principles Enforced

1. **Single Bucket**: All CV uploads use public bucket `'cv-uploads'`
2. **Public URLs**: Always generated via `supabase.storage.from(CV_BUCKET).getPublicUrl()`
3. **No Manual URL Construction**: Never build URLs with string concatenation
4. **Database Consistency**: `original_file_url` always contains full public URL
5. **Make.com Compatibility**: Webhooks receive `fileUrl` ready for HTTP module

## File Organization

### New Files
- `src/config/storage.ts` - Storage configuration
- `src/types/cvUpload.ts` - Type definitions

### Modified Files
- `src/services/cvUploadService.ts` - Unified upload logic
- `src/pages/CVCheckPage.tsx` - Uses new service
- `src/services/databaseService.ts` - Uses CV_BUCKET constant

### Database Table References (Unchanged)
These files use `.from('cv_uploads')` to query the DATABASE table (not storage bucket):
- `src/services/cvCheckService.ts`
- `src/services/fetchCvStatus.ts`
- `src/services/getCvUpload.ts`
- `src/services/waitForCvAnalysis.ts`

## Usage Example

```typescript
import { uploadCvAndCreateRecord } from '../services/cvUploadService';

const result = await uploadCvAndCreateRecord(file, {
  source: 'check',  // or 'upload', 'wizard'
  userId: user?.id,
});

if (result.success) {
  console.log('Upload ID:', result.uploadId);
  console.log('File URL:', result.fileUrl);  // Full public URL
  navigate(`/cv-analysis?uploadId=${result.uploadId}`);
} else {
  console.error('Upload failed:', result.error);
}
```

## Make.com Integration

The webhook now receives:
```json
{
  "uploadId": "uuid",
  "fileUrl": "https://...supabase.co/storage/v1/object/public/cv-uploads/raw/...",
  "source": "check"
}
```

Make.com can directly use `fileUrl` in HTTP module without any URL manipulation.

## Build Status

✅ Project builds successfully
✅ No TypeScript errors
✅ All imports resolved correctly

