// netlify/functions/export-cv-pdf.ts
//
// ─────────────────────────────────────────────────────────────────────────────
// SERVERSEITIGER PDF-EXPORT ÜBER EINEN ECHTEN BROWSER (Puppeteer)
// ─────────────────────────────────────────────────────────────────────────────
//
// Ersetzt (parallel zum bisherigen Weg, siehe unten) html2canvas + jsPDF +
// DOM-Klon (src/utils/pdfExportClient.ts) durch einen echten Chromium-Druck
// von src/pages/CvExportRenderPage.tsx. Ergebnis: echter, selektierbarer
// Text im PDF statt eines Bildes pro Seite, und Seitenumbrüche, die von der
// tatsächlichen Layout-Engine kommen statt von einer Pixel-Heuristik.
//
// WICHTIG — bewusst NICHT produktiv scharf geschaltet:
// Diese Function existiert zusätzlich zum bisherigen Export-Pfad. Der
// bestehende Download-Button in CVLiveEditorPage.tsx ruft weiterhin
// `exportCVToPDFBlob` (pdfExportClient.ts) auf. Erst nach eigenem Testen
// (siehe die neue "Server-Export testen"-Aktion in CVLiveEditorPage.tsx)
// sollte der alte Pfad ersetzt werden.
//
// Offene Punkte, die VOR dem produktiven Einsatz geprüft werden müssen (kann
// von hier aus nicht getestet werden):
//   1. Ausführungszeit-Limit der Netlify Functions auf eurem Plan. Ein
//      Chromium-Kaltstart + Navigation + Fontladen + Druck kann je nach CV
//      5–15s dauern. Reicht das Limit nicht, entweder als "Background
//      Function" umbenennen (Dateiname `export-cv-pdf-background.ts`, dann
//      läuft sie bis zu 15 Min, liefert aber sofort 202 zurück — der Client
//      müsste dann per Realtime/Polling auf `stored_cvs.pdf_url` warten,
//      nicht auf die HTTP-Antwort) oder einen dedizierten Dienst (z. B.
//      Render/Fly.io) statt Netlify Functions nutzen.
//   2. Paketgröße: @sparticuz/chromium-min lädt das Chromium-Binary zur
//      Laufzeit von einer CDN-URL nach, um unter Netlflifys Bundle-Limit zu
//      bleiben. Das braucht ausgehenden Netzwerkzugriff aus der Function
//      heraus (sollte bei Netlify Functions Standard sein) und die Env-Var
//      CHROMIUM_REMOTE_EXEC_PATH (siehe unten, Default sollte funktionieren).
//   3. Neue Env-Vars in den Netlify Site-Settings setzen (NICHT die
//      VITE_-Variablen wiederverwenden — die sind nur im Client-Bundle
//      sichtbar, diese Function läuft serverseitig):
//        SUPABASE_URL                 (dieselbe URL wie VITE_SUPABASE_URL)
//        SUPABASE_SERVICE_ROLE_KEY    (aus Supabase → Project Settings → API,
//                                       NIEMALS ins Client-Bundle/Git geben)
//      SUPABASE_ANON_KEY optional, nur zur Token-Prüfung des aufrufenden
//      Users (sonst wird ausschließlich der Service-Role-Client genutzt).
//
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const SUPABASE_URL = process.env.SUPABASE_URL as string;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY as string;
const ANON_KEY = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY) as string;
const SITE_URL = (process.env.SITE_URL || process.env.URL || '').replace(/\/$/, '');

const EXPORT_TOKEN_TTL_MS = 5 * 60 * 1000;

interface RequestBody {
  cvId?: string;
}

async function launchBrowser() {
  // Lokal (netlify dev / npm run dev der Function) reicht die volle
  // `puppeteer`-Devdependency mit gebündeltem Chromium. Im echten Netlify-
  // Deploy (Lambda-Umgebung) übernimmt puppeteer-core + das schlanke,
  // nachladende @sparticuz/chromium-min-Paket, weil ein volles Chromium das
  // Function-Bundle-Limit sprengen würde.
  if (process.env.NETLIFY) {
    const chromium = (await import('@sparticuz/chromium-min')).default;
    const puppeteer = await import('puppeteer-core');
    const executablePath = await chromium.executablePath(
      process.env.CHROMIUM_REMOTE_EXEC_PATH ||
        'https://github.com/Sparticuz/chromium/releases/download/v123.0.0/chromium-v123.0.0-pack.tar'
    );
    return puppeteer.launch({
      args: chromium.args,
      executablePath,
      headless: true,
    });
  }

  const puppeteer = await import('puppeteer');
  return puppeteer.launch({ headless: true });
}

export async function handler(event: { httpMethod: string; headers: Record<string, string | undefined>; body: string | null }) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return { statusCode: 500, body: 'SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY fehlen in den Function-Env-Vars.' };
  }
  if (!SITE_URL) {
    return { statusCode: 500, body: 'SITE_URL (oder Netlifys automatisches URL) fehlt — kann die Druck-Seite nicht adressieren.' };
  }

  let body: RequestBody;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Ungültiges JSON.' };
  }
  const cvId = body.cvId;
  if (!cvId) {
    return { statusCode: 400, body: 'cvId fehlt.' };
  }

  // ── Aufrufer identifizieren ────────────────────────────────────────────
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  const accessToken = authHeader.replace(/^Bearer\s+/i, '');
  if (!accessToken) {
    return { statusCode: 401, body: 'Kein Authorization-Header.' };
  }

  const authClient = createClient(SUPABASE_URL, ANON_KEY || SERVICE_ROLE_KEY);
  const { data: userData, error: userError } = await authClient.auth.getUser(accessToken);
  if (userError || !userData?.user) {
    return { statusCode: 401, body: 'Ungültige Session.' };
  }
  const userId = userData.user.id;

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

  // ── Besitz + Freischaltung prüfen (dieselbe Regel wie cvDownloadService) ─
  const { data: cvRow, error: cvError } = await admin
    .from('stored_cvs')
    .select('id, user_id, is_paid, download_unlocked')
    .eq('id', cvId)
    .maybeSingle();

  if (cvError || !cvRow) {
    return { statusCode: 404, body: 'CV nicht gefunden.' };
  }
  if (cvRow.user_id !== userId) {
    return { statusCode: 403, body: 'CV gehört nicht zu diesem User.' };
  }
  if (!cvRow.is_paid && !cvRow.download_unlocked) {
    return { statusCode: 402, body: 'CV ist noch nicht freigeschaltet.' };
  }

  // ── Kurzlebiges Export-Token setzen ──────────────────────────────────────
  const exportToken = randomUUID();
  const expiresAt = new Date(Date.now() + EXPORT_TOKEN_TTL_MS).toISOString();

  const { error: tokenError } = await admin
    .from('stored_cvs')
    .update({ export_token: exportToken, export_token_expires_at: expiresAt })
    .eq('id', cvId);

  if (tokenError) {
    return { statusCode: 500, body: `Konnte Export-Token nicht setzen: ${tokenError.message}` };
  }

  const printUrl = `${SITE_URL}/#/cv-export-render/${cvId}?token=${exportToken}`;

  let browser: Awaited<ReturnType<typeof launchBrowser>> | undefined;
  try {
    browser = await launchBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 794, height: 1122 });
    await page.goto(printUrl, { waitUntil: 'networkidle0', timeout: 20000 });

    // Explizit auf den Bereit-Marker warten statt blind auf networkidle zu
    // vertrauen — die Seite setzt ihn erst NACH Fontladen + Umbruch-
    // Berechnung (siehe CvExportRenderPage.tsx).
    await page.waitForSelector('[data-export-ready="true"]', { timeout: 15000 }).catch(async () => {
      const hasError = await page.$('[data-export-error="true"]');
      if (hasError) {
        const errText = await page.$eval('[data-export-error="true"]', (el) => el.textContent || '');
        throw new Error(`Druck-Seite meldet Fehler: ${errText}`);
      }
      throw new Error('Timeout: Druck-Seite hat kein Bereit-Signal gesendet.');
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: false,
    });

    const filePath = `${userId}/${cvId}.pdf`;
    const { error: uploadError } = await admin.storage
      .from('cv-pdfs')
      .upload(filePath, pdfBuffer, { contentType: 'application/pdf', upsert: true });

    if (uploadError) {
      throw new Error(`Upload nach cv-pdfs fehlgeschlagen: ${uploadError.message}`);
    }

    const { data: urlData } = admin.storage.from('cv-pdfs').getPublicUrl(filePath);
    const pdfUrl = urlData.publicUrl;

    await admin
      .from('stored_cvs')
      .update({
        pdf_url: pdfUrl,
        download_unlocked: true,
        // Token verbrauchen — nicht wiederverwendbar liegen lassen.
        export_token: null,
        export_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cvId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, pdfUrl }),
    };
  } catch (err) {
    // Token trotzdem aufräumen, damit es nicht als "gültig" stehen bleibt.
    await admin
      .from('stored_cvs')
      .update({ export_token: null, export_token_expires_at: null })
      .eq('id', cvId);

    const message = err instanceof Error ? err.message : 'Unbekannter Fehler beim PDF-Export.';
    return { statusCode: 500, body: JSON.stringify({ success: false, error: message }) };
  } finally {
    if (browser) await browser.close();
  }
}
