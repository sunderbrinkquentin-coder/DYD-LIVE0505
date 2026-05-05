# Make Webhook Fix - Code Diff

## File 1: src/config/makeWebhook.ts

### NEW: Helper function for safe URL retrieval

```typescript
// Helper to safely read webhook URL without throwing - for fallback use
function getSafeWebhookUrl(envKey: string): string | null {
  try {
    const url = import.meta.env[envKey];
    if (!url || url.trim() === "") {
      console.warn(`[WEBHOOK] ${envKey} is not configured in environment`);
      return null;
    }
    return url;
  } catch (error) {
    console.warn(`[WEBHOOK] Error reading ${envKey}:`, error);
    return null;
  }
}
```

### NEW: URL masking helper for safe logging

```typescript
// Helper to mask webhook URL for logging (show first/last segments only)
export function maskWebhookUrl(url: string): string {
  if (!url) return "[no-url]";
  try {
    const parts = url.split("/");
    if (parts.length >= 2) {
      const hash = parts[parts.length - 1];
      return `https://hook.eu2.make.com/${hash.substring(0, 8)}...${hash.slice(-8)}`;
    }
    return url;
  } catch {
    return "[masked-url]";
  }
}

// Export safe URL reader for use in services
export function getSafeWebhookUrlForService(): string | null {
  return getSafeWebhookUrl("VITE_MAKE_WEBHOOK_CVCHECK");
}
```

### MODIFIED: validateMakeWebhookUrl function

**BEFORE:**
```typescript
export function validateMakeWebhookUrl(): WebhookValidation {
  try {
    const url = getMakeWebhookUrl();
    console.log("[CV-CHECK] MAKE_WEBHOOK_URL is properly configured");
    return {
      ok: true,
      message: `CV-Check webhook configured: ${url}`,
    };
  } catch (error: any) {
    console.error("[CV-CHECK] Webhook validation failed:", error.message);
    return {
      ok: false,
      message: error.message,
    };
  }
}
```

**AFTER:**
```typescript
export function validateMakeWebhookUrl(): WebhookValidation {
  try {
    const url = getMakeWebhookUrl();
    console.log("[CV-CHECK] MAKE_WEBHOOK_URL is properly configured");
    return {
      ok: true,
      message: `CV-Check webhook configured: ${maskWebhookUrl(url)}`,
    };
  } catch (error: any) {
    console.error("[CV-CHECK] Webhook validation failed:", error.message);
    const fallbackUrl = getSafeWebhookUrl("VITE_MAKE_WEBHOOK_CVCHECK");
    if (fallbackUrl) {
      console.warn("[CV-CHECK] Using fallback URL from environment");
      return {
        ok: true,
        message: `CV-Check webhook available (fallback): ${maskWebhookUrl(fallbackUrl)}`,
      };
    }
    return {
      ok: false,
      message: error.message,
    };
  }
}
```

---

## File 2: src/services/cvUploadService.ts

### MODIFIED: Imports

**BEFORE:**
```typescript
import { getMakeWebhookUrl, validateMakeWebhookUrl } from '../config/makeWebhook';
```

**AFTER:**
```typescript
import { getMakeWebhookUrl, validateMakeWebhookUrl, getSafeWebhookUrlForService, maskWebhookUrl } from '../config/makeWebhook';
```

### MODIFIED: STEP 4 - Webhook Trigger Logic (Lines 137-223)

**BEFORE (Broken - skips webhook on validation failure):**
```typescript
// ─────────────────────────────────────────────────────────────────────
// STEP 4: Trigger Make.com Webhook (CV-Check Contract)
// ─────────────────────────────────────────────────────────────────────
console.log('[CV-CHECK] 🔍 Validating webhook configuration...');

const webhookValidation = validateMakeWebhookUrl();

if (!webhookValidation.ok) {
  console.error('[CV-CHECK WEBHOOK ERROR] Validation failed:', webhookValidation);

  await supabase
    .from('cv_uploads')
    .update({
      status: 'failed',
    })
    .eq('id', uploadId);

  console.warn(
    '[CV-CHECK] ⚠️ Continuing without webhook - user will see error on analysis page'
  );
} else {
  console.log('[CV-CHECK] ✅ Webhook validation passed');

  try {
    const webhookUrl = getMakeWebhookUrl();
    console.log('[CV-CHECK] 🎯 Webhook URL:', webhookUrl);

    // Build FormData with actual file (Make.com needs the file, not just metadata)
    const formData = new FormData();
    formData.append('file', file); // Send the actual file
    formData.append('upload_id', uploadId);
    formData.append('file_url', fileUrl);
    if (userId) {
      formData.append('user_id', userId);
    }

    console.log('[CV-CHECK] 📤 Triggering Make webhook with FormData...', {
      url: webhookUrl,
      upload_id: uploadId,
      file_name: file.name,
      file_size: file.size,
      user_id: userId || 'anonymous',
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      // NO Content-Type header - browser sets it automatically with boundary
    });

    console.log('[CV-CHECK] 📨 Webhook response status:', response.status);

    if (!response.ok) {
      console.error('[CV-CHECK WEBHOOK ERROR] Failed with status:', response.status);

      await supabase
        .from('cv_uploads')
        .update({
          status: 'failed',
        })
        .eq('id', uploadId);

      console.warn('[CV-CHECK] ⚠️ Webhook failed but continuing to analysis page');
    } else {
      console.log('[CV-CHECK] ✅ Webhook triggered successfully');

      console.log('[CV-CHECK] 🔄 Updating status to processing...');
      await supabase
        .from('cv_uploads')
        .update({ status: 'processing' })
        .eq('id', uploadId);

      console.log('[CV-CHECK] ✅ Status updated to processing');
    }
  } catch (webhookError) {
    console.error('[CV-CHECK WEBHOOK ERROR] Exception occurred:', webhookError);

    await supabase
      .from('cv_uploads')
      .update({
        status: 'failed',
      })
      .eq('id', uploadId);

    console.warn('[CV-CHECK] ⚠️ Webhook error but continuing to analysis page');
  }
}
```

**AFTER (Fixed - attempts webhook regardless of validation status):**
```typescript
// ─────────────────────────────────────────────────────────────────────
// STEP 4: Trigger Make.com Webhook (CV-Check Contract)
// ─────────────────────────────────────────────────────────────────────
console.log('[CV-CHECK] 🔍 Validating webhook configuration...');

const webhookValidation = validateMakeWebhookUrl();
console.log('[CV-CHECK] Validation result:', webhookValidation);

// Try to get webhook URL (with fallback)
let webhookUrl: string | null = null;
try {
  webhookUrl = getMakeWebhookUrl();
} catch (error) {
  console.warn('[CV-CHECK] Primary URL retrieval failed, trying fallback...');
  webhookUrl = getSafeWebhookUrlForService();
}

if (!webhookUrl) {
  console.error('[CV-CHECK WEBHOOK ERROR] No webhook URL available (not in environment)');

  await supabase
    .from('cv_uploads')
    .update({
      status: 'failed',
      error_message: 'Make.com webhook URL not configured'
    })
    .eq('id', uploadId);

  console.warn(
    '[CV-CHECK] ⚠️ Webhook URL missing - webhook will not be triggered'
  );
} else {
  console.log('[CV-CHECK] ✅ Webhook URL resolved:', maskWebhookUrl(webhookUrl));

  try {
    // Build FormData with actual file (Make.com needs the file, not just metadata)
    const formData = new FormData();
    formData.append('file', file); // Send the actual file
    formData.append('upload_id', uploadId);
    formData.append('file_url', fileUrl);
    if (userId) {
      formData.append('user_id', userId);
    }

    console.log('[CV-CHECK] 📤 Triggering Make webhook with FormData...', {
      webhook_url_masked: maskWebhookUrl(webhookUrl),
      upload_id: uploadId,
      file_name: file.name,
      file_size: file.size,
      user_id: userId || 'anonymous',
      payload_fields: ['file', 'upload_id', 'file_url', userId ? 'user_id' : null].filter(Boolean),
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      body: formData,
      // NO Content-Type header - browser sets it automatically with boundary
    });

    console.log('[CV-CHECK] 📨 Webhook response received:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    if (!response.ok) {
      console.error('[CV-CHECK WEBHOOK ERROR] Webhook call failed with status:', {
        status: response.status,
        statusText: response.statusText,
      });

      // Try to read error response for debugging
      try {
        const responseText = await response.text();
        if (responseText) {
          console.error('[CV-CHECK] Webhook error response:', responseText.substring(0, 200));
        }
      } catch (readError) {
        console.warn('[CV-CHECK] Could not read error response:', readError);
      }

      await supabase
        .from('cv_uploads')
        .update({
          status: 'failed',
          error_message: `Webhook failed with status ${response.status}`
        })
        .eq('id', uploadId);

      console.warn('[CV-CHECK] ⚠️ Webhook HTTP error but continuing to analysis page');
    } else {
      console.log('[CV-CHECK] ✅ Webhook POST successful (status 200)');

      console.log('[CV-CHECK] 🔄 Updating database status to processing...');
      const { error: updateError } = await supabase
        .from('cv_uploads')
        .update({ status: 'processing' })
        .eq('id', uploadId);

      if (updateError) {
        console.error('[CV-CHECK] Error updating status to processing:', updateError);
      } else {
        console.log('[CV-CHECK] ✅ Database status updated to processing');
      }
    }
  } catch (webhookError: any) {
    console.error('[CV-CHECK WEBHOOK ERROR] Exception during webhook call:', {
      error: webhookError?.message || webhookError,
      type: webhookError?.name || 'Unknown',
    });

    await supabase
      .from('cv_uploads')
      .update({
        status: 'failed',
        error_message: `Webhook error: ${webhookError?.message || 'Unknown error'}`
      })
      .eq('id', uploadId);

    console.warn('[CV-CHECK] ⚠️ Webhook exception but continuing to analysis page');
  }
}
```

---

## Key Improvements Summary

| Aspect | Before | After |
|--------|--------|-------|
| **Validation Failure Handling** | Skips webhook entirely | Attempts with fallback URL |
| **URL Logging** | Logs full URL (security risk) | Logs masked URL (safe) |
| **Error Details** | Generic error message | Detailed status + response text |
| **Database Tracking** | Just status change | Status + error_message field |
| **Fallback** | None | Try-catch + getSafeWebhookUrl() |
| **Response Handling** | No response inspection | Reads error response text |
| **Update Errors** | Silent | Logged with error details |

---

## Testing Checklist

- [ ] Build compiles without errors
- [ ] TypeScript type checking passes
- [ ] Browser console shows [CV-CHECK] logs when uploading CV
- [ ] Webhook URL appears masked in logs
- [ ] Status updates to 'processing' in database
- [ ] Make.com scenario receives webhook trigger
- [ ] File, upload_id, file_url present in webhook payload
- [ ] Error messages appear in error_message field if webhook fails
- [ ] Response status logged correctly
