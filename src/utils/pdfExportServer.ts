// src/utils/pdfExportServer.ts
//
// Client-seitiger Helfer für den NEUEN, serverseitigen PDF-Export (echter
// Chromium-Druck statt html2canvas-Screenshot, siehe
// netlify/functions/export-cv-pdf.ts + src/pages/CvExportRenderPage.tsx).
//
// Bewusst als eigene, zusätzliche Funktion angelegt — ersetzt vorerst NICHT
// `exportCVToPDFBlob` aus pdfExportClient.ts. Erst nach eigenem Testen (siehe
// die neue Aktion in CVLiveEditorPage.tsx) den alten Aufruf hierdurch
// ersetzen.

import { supabase } from '../lib/supabase';

export interface ServerPdfExportResult {
  success: boolean;
  pdfUrl?: string;
  error?: string;
}

export async function exportCvViaServerPdf(cvId: string): Promise<ServerPdfExportResult> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    return { success: false, error: 'Kein aktiver Login — Server-Export braucht eine Session.' };
  }

  try {
    const response = await fetch('/.netlify/functions/export-cv-pdf', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ cvId }),
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.success) {
      return { success: false, error: payload?.error || `Server-Export fehlgeschlagen (${response.status}).` };
    }

    return { success: true, pdfUrl: payload.pdfUrl };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unbekannter Netzwerkfehler.';
    return { success: false, error: message };
  }
}
