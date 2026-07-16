/**
 * src/services/cvUploadService.ts
 * Unified Upload Logic - SDK-Only Flow
 */

import { supabase } from '../lib/supabase';
import { CV_BUCKET, STORAGE_CONFIG } from '../config/storage';
import type { UploadResult, UploadOptions, UploadSource } from '../types/cvUpload';

// Some mobile networks (especially cellular) are known to silently stall a
// long-lived request — no error, no timeout of their own, the connection
// just sits there. fetch() does not time out on its own in that case, so
// without an explicit race here, a stalled storage upload or DB call would
// hang `uploadCvAndCreateRecord` forever: no resolve, no reject, no catch
// block ever runs, no error is ever shown to the user, and the page never
// navigates to the result page. Wrapping every network step in this keeps
// every step bounded, so a stall always surfaces as a normal catchable error.
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} hat zu lange gedauert (Timeout)`)), ms);
    promise.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
}

function sanitizeFileName(fileName: string): string {
  const lastDotIndex = fileName.lastIndexOf('.');
  const nameWithoutExt = lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
  const extension = lastDotIndex > 0 ? fileName.substring(lastDotIndex) : '';

  const cleanName = nameWithoutExt
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9.-]/g, '')
    .replace(/\.+/g, '.')
    .replace(/-+/g, '-')
    .replace(/^[-.]|[-.]$/g, '');

  const cleanExt = extension.toLowerCase().replace(/[^a-z0-9.]/g, '');

  return cleanName + cleanExt || 'file.pdf';
}

function logStep(step: string, data?: Record<string, unknown>): void {
  if (data) {
    console.log(`[CV-UPLOAD] ${step}`, data);
  } else {
    console.log(`[CV-UPLOAD] ${step}`);
  }
}

function logError(step: string, error: unknown, extra?: Record<string, unknown>): void {
  const err = error as any;
  console.error(`[CV-UPLOAD] ERROR at ${step}:`, {
    message: err?.message ?? String(error),
    code: err?.code ?? null,
    statusCode: err?.statusCode ?? err?.status ?? null,
    details: err?.details ?? null,
    hint: err?.hint ?? null,
    ...(extra ?? {}),
  });
}

export async function uploadCvAndCreateRecord(
  file: File,
  options: UploadOptions = {}
): Promise<UploadResult> {
  // triggerNow/status sind neu. Die Defaults bilden exakt das bisherige
  // Verhalten ab — Aufrufer, die sie nicht setzen (CV-Check, Wizard),
  // laufen unverändert durch.
  const {
    source = 'check',
    userId = null,
    tempId = null,
    triggerNow = true,
    status = 'processing',
  } = options;

  logStep('Starting upload', {
    fileName: file.name,
    sizeMB: (file.size / 1024 / 1024).toFixed(2),
    type: file.type,
    source,
    status,
    triggerNow,
    userId: userId ?? 'anonymous',
    tempId: tempId ?? 'none',
  });

  try {
    // ─────────────────────────────────────────────────────────────────────
    // STEP 1: Upload file to Supabase Storage via SDK
    // ─────────────────────────────────────────────────────────────────────
    const sanitizedFileName = sanitizeFileName(file.name);
    const filePath = `${STORAGE_CONFIG.UPLOAD_PATH_PREFIX}/${Date.now()}_${sanitizedFileName}`;

    logStep('Uploading to storage', { path: filePath, sizeMB: (file.size / 1024 / 1024).toFixed(2) });

    const { data: uploadData, error: uploadError } = await withTimeout(
      supabase.storage
        .from(CV_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        }),
      60_000,
      'Datei-Upload'
    );

    if (uploadError) {
      logError('storage upload', uploadError, { filePath, bucket: CV_BUCKET });
      throw new Error(`Storage-Upload fehlgeschlagen: ${uploadError.message}`);
    }

    if (!uploadData?.path) {
      throw new Error('Storage-Upload fehlgeschlagen: Kein Pfad zurückgegeben');
    }

    const storagePath = filePath;
    logStep('File stored', { storagePath, sdkPath: uploadData.path });

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2: Generate URLs + Create DB entry in parallel
    // ─────────────────────────────────────────────────────────────────────
    const { data: { publicUrl } } = supabase.storage.from(CV_BUCKET).getPublicUrl(storagePath);
    const fileUrl = publicUrl;

    const [signedUrlResult, dbResult] = await withTimeout(
      Promise.all([
        supabase.storage.from(CV_BUCKET).createSignedUrl(storagePath, 3600),
        supabase.from('stored_cvs').insert({
          user_id: userId,
          temp_id: tempId,
          session_id: tempId,
          status,
          source,
          file_name: file.name,
          file_url: fileUrl,
          original_file_url: fileUrl,
          file_path: storagePath,
        }).select('id').single(),
      ]),
      30_000,
      'Datenbank-Eintrag'
    );

    if (signedUrlResult.error) {
      logError('signed URL creation', signedUrlResult.error, { storagePath });
    }

    const signedUrl = signedUrlResult.data?.signedUrl ?? null;

    if (dbResult.error || !dbResult.data?.id) {
      logError('DB insert', dbResult.error ?? new Error('No ID returned'), { userId, tempId, source });
      throw new Error(`Datenbank-Fehler: ${dbResult.error?.message || 'Unbekannter Fehler'}`);
    }

    const uploadId = dbResult.data.id;
    logStep('DB entry created', { uploadId, status, hasSignedUrl: !!signedUrl });

    // ─────────────────────────────────────────────────────────────────────
    // STEP 2b: Deferred flow — Datei liegt im Storage, Trigger kommt später
    // (z.B. erst nach der Zahlung). Vor der Paywall entstehen so keine
    // Make-/LLM-Kosten.
    // ─────────────────────────────────────────────────────────────────────
    if (!triggerNow) {
      logStep('Trigger deferred — upload only', { uploadId, status });
      return { success: true, uploadId, fileUrl };
    }

    // ─────────────────────────────────────────────────────────────────────
    // STEP 3: Trigger Make.com via Edge Function
    // ─────────────────────────────────────────────────────────────────────
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const callbackUrl = `${supabaseUrl}/functions/v1/make-cv-callback`;

    console.log('Sende URL an Webhook:', fileUrl);

    const makePayload = {
      upload_id: uploadId,
      url: fileUrl,
      file_url: signedUrl || fileUrl,
      file_url_fallback: signedUrl ? fileUrl : null,
      file_name: file.name,
      file_path: storagePath,
      source,
      user_id: userId || null,
      temp_id: tempId || null,
      callback_url: callbackUrl,
      timestamp: new Date().toISOString(),
    };

    logStep('Invoking trigger-cv-check edge function', { uploadId });

    // Must exceed the edge function's own worst-case duration (2 Make
    // attempts: 28s + 4s delay + 28s ≈ 60s). If this is shorter, the client
    // gives up while the edge function is still running server-side, and
    // CvResultPage's `?retry=1` fires a SECOND trigger-cv-check invocation —
    // if that second one later fails, its markFailed() can overwrite a
    // status that the first (slow but successful) invocation already set to
    // completed, causing intermittent "failed" results on slower (mobile)
    // connections even though the analysis actually succeeded.
    const TRIGGER_TIMEOUT_MS = 65_000;
    let triggerSucceeded = false;

    try {
      const triggerPromise = supabase.functions.invoke('trigger-cv-check', {
        body: makePayload,
      });
      const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Edge function invoke timed out') }), TRIGGER_TIMEOUT_MS)
      );

      const result = await Promise.race([triggerPromise, timeoutPromise]);
      const fnData = result.data;
      const fnError = result.error;

      if (fnError) {
        logError('edge function invoke', fnError, { uploadId });
      } else {
        triggerSucceeded = !fnError && (
          (fnData as any)?.success === true ||
          (fnData as any)?.make_status === 200 ||
          (fnData as any)?.make_status != null
        );
        logStep('Edge function responded', {
          uploadId,
          makeStatus: (fnData as any)?.make_status ?? 'unknown',
          success: (fnData as any)?.success ?? 'unknown',
        });
        if (!triggerSucceeded) {
          logError('edge function returned failure', fnData, { uploadId });
        }
      }
    } catch (triggerErr: unknown) {
      logError('edge function invoke (timeout or network)', triggerErr, { uploadId });
    }

    if (!triggerSucceeded) {
      logStep('Trigger failed but upload succeeded - returning uploadId for retry on result page', { uploadId });
      return {
        success: true,
        uploadId,
        fileUrl,
        triggerFailed: true,
      };
    }

    logStep('Upload complete, trigger dispatched', { uploadId });

    return {
      success: true,
      uploadId,
      fileUrl,
    };
  } catch (error: any) {
    logError('uploadCvAndCreateRecord', error);
    return {
      success: false,
      error: error?.message || 'Ein unerwarteter Fehler ist aufgetreten',
    };
  }
}

/**
 * Startet die CV-Extraktion für eine Zeile, die bereits im Storage liegt —
 * für Flows, die erst später triggern (z.B. nach einer Zahlung).
 *
 * Bewusst getrennt von uploadCvAndCreateRecord: kein File-Objekt nötig,
 * überlebt also einen Redirect.
 */
export async function triggerCvExtraction(
  uploadId: string,
  source: UploadSource,
  userId: string | null,
): Promise<void> {
  const { data: cv, error: loadError } = await supabase
    .from('stored_cvs')
    .select('file_url,file_path,file_name')
    .eq('id', uploadId)
    .maybeSingle();

  if (loadError || !cv) {
    throw new Error('CV-Datensatz nicht gefunden');
  }

  // Signierte URL neu erzeugen — die aus dem Upload ist nach 1h abgelaufen.
  let signedUrl: string | null = null;
  if (cv.file_path) {
    const { data: signed } = await supabase.storage
      .from(CV_BUCKET)
      .createSignedUrl(cv.file_path as string, 3600);
    signedUrl = signed?.signedUrl ?? null;
  }

  await supabase.from('stored_cvs').update({ status: 'processing' }).eq('id', uploadId);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  logStep('Invoking trigger-cv-check (deferred)', { uploadId, source });

  const { error } = await supabase.functions.invoke('trigger-cv-check', {
    body: {
      upload_id: uploadId,
      url: cv.file_url ?? '',
      file_url: signedUrl || cv.file_url || '',
      file_url_fallback: signedUrl ? cv.file_url : null,
      file_name: cv.file_name ?? null,
      file_path: cv.file_path ?? null,
      source,
      user_id: userId,
      temp_id: null,
      callback_url: `${supabaseUrl}/functions/v1/make-cv-callback`,
      timestamp: new Date().toISOString(),
    },
  });

  if (error) {
    logError('deferred trigger', error, { uploadId });
    await supabase.from('stored_cvs').update({ status: 'failed' }).eq('id', uploadId);
    throw new Error(`CV-Extraktion konnte nicht gestartet werden: ${error.message}`);
  }
}