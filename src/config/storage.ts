/**
 * ═══════════════════════════════════════════════════════════════════════════
 * STORAGE CONFIGURATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Central configuration for Supabase Storage buckets.
 * All CV uploads use the public bucket 'cv-uploads' for direct browser access.
 */

export const CV_BUCKET = 'cv-uploads';

export const STORAGE_CONFIG = {
  CV_BUCKET,
  CACHE_CONTROL: '3600',
  UPLOAD_PATH_PREFIX: 'raw',
} as const;
