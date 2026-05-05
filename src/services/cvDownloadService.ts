import { supabase } from '../lib/supabase';

export interface DownloadResult {
  success: boolean;
  error?: string;
}

export const cvDownloadService = {
  async downloadCV(cvId: string): Promise<DownloadResult> {
    try {
      console.log('[CV Download] Starting download for CV:', cvId);

      const { data: cvData, error: fetchError } = await supabase
        .from('stored_cvs')
        .select('pdf_url, file_name, download_unlocked, is_paid')
        .eq('id', cvId)
        .maybeSingle();

      if (fetchError || !cvData) {
        console.error('[CV Download] Failed to fetch CV:', fetchError);
        return {
          success: false,
          error: 'CV nicht gefunden',
        };
      }

      if (!cvData.download_unlocked && !cvData.is_paid) {
        console.error('[CV Download] CV is not unlocked');
        return {
          success: false,
          error: 'Dieser CV ist noch nicht freigeschaltet. Bitte bezahlen Sie zuerst.',
        };
      }

      const downloadUrl = cvData.pdf_url;

      if (!downloadUrl) {
        console.log('[CV Download] No pdf_url found, redirecting to editor to generate PDF');
        return {
          success: false,
          error: 'redirect_to_editor',
        };
      }

      const fileName = cvData.file_name || 'Lebenslauf.pdf';
      console.log('[CV Download] Downloading from pdf_url');

      const response = await fetch(downloadUrl);
      if (!response.ok) {
        console.error('[CV Download] Failed to fetch PDF:', response.statusText);
        return {
          success: false,
          error: 'PDF konnte nicht heruntergeladen werden',
        };
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      const { error: updateError } = await supabase
        .rpc('increment_download_count', {
          cv_id: cvId,
        });

      if (updateError) {
        console.warn('[CV Download] Failed to update download count:', updateError);
      }

      console.log('[CV Download] Download completed successfully');

      return {
        success: true,
      };
    } catch (error: any) {
      console.error('[CV Download] Error:', error);
      return {
        success: false,
        error: error.message || 'Ein unbekannter Fehler ist aufgetreten',
      };
    }
  },
};
