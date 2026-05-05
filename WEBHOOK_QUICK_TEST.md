# Make Webhook - Quick Test Guide

## One-Minute Setup

### 1. Start Dev Server
```bash
npm run dev
```

### 2. Open Browser
- Go to `http://localhost:5173`
- Open DevTools: F12
- Go to Console tab

### 3. Navigate to CV Check
- Click "CV Check" or go to `/cv-check`

### 4. Upload PDF
- Drag & drop a PDF file or click to select
- Click "Upload"

### 5. Watch Console
Look for these logs (type: CV-CHECK):

```
[CV-CHECK] 🔍 Validating webhook configuration...
[CV-CHECK] Validation result: { ok: true, message: '...' }
[CV-CHECK] ✅ Webhook URL resolved: https://hook.eu2.make.com/5epcui...1p68mx9
[CV-CHECK] 📤 Triggering Make webhook with FormData...
  webhook_url_masked: https://hook.eu2.make.com/5epcui...1p68mx9
  upload_id: "550e8400-e29b-41d4-a716-446655440000"
  file_name: "resume.pdf"
  file_size: 245632
  user_id: "authenticated_user_id"
  payload_fields: ["file", "upload_id", "file_url", "user_id"]
[CV-CHECK] 📨 Webhook response received:
  status: 200
  statusText: "OK"
  ok: true
[CV-CHECK] ✅ Webhook POST successful (status 200)
[CV-CHECK] 🔄 Updating database status to processing...
[CV-CHECK] ✅ Database status updated to processing
```

---

## What to Verify

### ✅ Browser Console
- [ ] [CV-CHECK] logs appear (not [CV-UPLOAD] or other)
- [ ] Webhook URL is resolved (not "failed")
- [ ] Response status is 200 (not 500, 404, etc)
- [ ] No JavaScript errors

### ✅ Database
Check table: `cv_uploads`
```sql
SELECT id, status, error_message, created_at
FROM cv_uploads
WHERE created_at > NOW() - INTERVAL '1 minute'
ORDER BY created_at DESC
LIMIT 1;

-- Expected:
-- id: 550e8400-...
-- status: 'processing' (or 'failed' if webhook error)
-- error_message: NULL (if success) or error text (if failed)
```

### ✅ Make.com Scenario
1. Go to Make.com → Your Scenario
2. Click "Run Once" on webhook trigger
3. Look in history for incoming webhook
4. Verify payload:
   ```
   file: [PDF binary data present]
   upload_id: "550e8400-..."
   file_url: "https://vuumqarz...?token=..."
   user_id: "auth_user_id" (if logged in)
   ```

---

## Troubleshooting

### Issue: No [CV-CHECK] logs
**Solution:**
1. Check you're in the right page (/cv-check)
2. Restart dev server: `npm run dev`
3. Hard refresh browser: Ctrl+Shift+R
4. Check browser console for any JavaScript errors

### Issue: Webhook URL shows "not resolved" or "missing"
**Solution:**
1. Check `.env` file has `VITE_MAKE_WEBHOOK_CVCHECK` set
2. Check it's not empty: `VITE_MAKE_WEBHOOK_CVCHECK=https://...`
3. Restart dev server (Vite caches env on start)
4. Check env value is correct from your Make.com scenario

### Issue: Status shows 'failed' in database
**Solution:**
1. Check error_message field in database
2. Look at browser console for error details
3. Common errors:
   - "Webhook URL not configured" → Check .env
   - "Webhook failed with status 404" → Check webhook URL in Make.com
   - "Webhook failed with status 500" → Check Make scenario configuration
4. In Make.com, check scenario logs for errors

### Issue: Network error or CORS issue
**Solution:**
1. Check Make.com webhook URL is reachable from browser
2. If behind proxy/firewall, try different network
3. In Make.com webhook settings, verify:
   - Webhook is enabled
   - No IP restrictions
   - CORS headers are set correctly

### Issue: File not received in Make.com
**Solution:**
1. Payload should show: `payload_fields: ["file", "upload_id", "file_url", "user_id"]`
2. If file missing from payload_fields, check browser console for errors
3. Make scenario should handle multipart/form-data:
   - Don't manually set Content-Type (browser sets it)
   - Configure webhook to parse multipart data

---

## Quick Debugging Commands

### Check env loaded
```javascript
// In browser console:
console.log(import.meta.env.VITE_MAKE_WEBHOOK_CVCHECK)
// Should show: https://hook.eu2.make.com/...
// If undefined, dev server wasn't restarted after .env change
```

### Search logs
```javascript
// In browser console:
// Filter to only CV-CHECK logs
console.log(performance.getEntriesByType("measure").filter(e => e.name.includes("CV-CHECK")))
```

### Check database directly
```sql
-- PostgreSQL/Supabase
SELECT id, status, error_message, created_at, user_id
FROM cv_uploads
ORDER BY created_at DESC
LIMIT 10;
```

---

## Success Criteria

When working correctly, you should see:

1. **Browser Console:**
   ```
   [CV-CHECK] ✅ Webhook POST successful (status 200)
   [CV-CHECK] ✅ Database status updated to processing
   ```

2. **Database:**
   - `cv_uploads.status` = `'processing'`
   - `cv_uploads.error_message` = `NULL`

3. **Make.com:**
   - Webhook trigger shows in "Run Once" log
   - Payload includes file, upload_id, file_url, user_id

4. **User Experience:**
   - Upload completes
   - Redirects to results page
   - No error messages shown

---

## Files to Check

If webhook still not working after this test:

1. **Check code deployed:**
   - `src/services/cvUploadService.ts` has new logging
   - `src/config/makeWebhook.ts` has `maskWebhookUrl()` function

2. **Check env file:**
   - `.env` has both webhook URLs
   - URLs start with `https://hook.eu2.make.com/`

3. **Check Make.com scenario:**
   - Webhook is enabled (toggle ON)
   - Webhook URL in scenario matches `.env`
   - Scenario has logger/router to capture webhook data

---

## Support

For detailed analysis, see:
- `MAKE_WEBHOOK_DEBUG_ANALYSIS.md` - Root cause
- `MAKE_WEBHOOK_CODE_DIFF.md` - Code changes
- `WEBHOOK_FIX_SUMMARY.txt` - Overview
