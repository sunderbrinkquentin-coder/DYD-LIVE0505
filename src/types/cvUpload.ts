/**
 * ═══════════════════════════════════════════════════════════════════════════
 * CV UPLOAD TYPES (Aligned with Supabase stored_cvs schema)
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface UploadedCv {
  id: string;
  user_id: string | null;
  session_id?: string | null;
  temp_id?: string | null;
  file_name: string;
  file_path: string;
  file_url: string | null;
  file_size: number | null;
  mime_type: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  analysis_status?: 'pending' | 'processing' | 'completed' | 'failed' | null;
  ats_json?: any;
  vision_text?: string | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
}

export type UploadSource = 'upload' | 'check' | 'wizard';

export interface UploadOptions {
  source?: UploadSource;
  userId?: string | null;
  tempId?: string | null;
  sessionId?: string | null;
}

export type UploadResult =
  | { success: true; uploadId: string; fileUrl: string | null; triggerFailed?: boolean }
  | { success: false; error: string; uploadId?: string };
