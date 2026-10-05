import { pdf } from '@react-pdf/renderer';
import QRCode from 'qrcode';
import { supabase } from '../lib/supabase';
import { LearningPath } from '../types/learningPath';
import { CertificatePDF, CertificateData } from '../utils/certificatePDF';

/** Öffentliche Adresse der App – Grundlage für die Prüf-URL im QR-Code. */
export const PUBLIC_SITE_URL: string =
  (import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, '') || 'https://decide-your-dream.de';

/** Bucket für Zertifikate (public). Fallback auf den alten Bucket. */
const CERT_BUCKET = 'certificates';
const CERT_BUCKET_FALLBACK = 'cv-files';
const LOGO_PATH = '/DYD Logo RGB.svg';

export function verifyUrlFor(certificateId: string): string {
  return `${PUBLIC_SITE_URL}/#/verify/${encodeURIComponent(certificateId)}`;
}

/* ────────────────────────────────────────────────────────────
 * Hilfsfunktionen
 * ──────────────────────────────────────────────────────────── */

/** Make speichert JSON teils doppelt serialisiert und teils ohne eckige Klammern. */
function parseMakeJson(raw: unknown): any {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;
  const text = raw.trim();
  if (!text) return null;
  const attempts = [text];
  if (!text.startsWith('[') && !text.startsWith('{')) attempts.push(`[${text}]`);
  if (text.startsWith('{') && text.includes('},')) attempts.push(`[${text}]`);
  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      return typeof parsed === 'string' ? parseMakeJson(parsed) : parsed;
    } catch { /* nächster Versuch */ }
  }
  return null;
}

function toSkillStrings(raw: unknown): string[] {
  const parsed = parseMakeJson(raw);
  const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  return arr
    .map((s: any) => (typeof s === 'string' ? s : s?.skill_name || s?.name || s?.label || s?.skill || null))
    .filter((s: any): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim());
}

/** DYD-Logo (SVG) als PNG für das PDF – react-pdf kann keine SVG-Dateien einbetten. */
async function loadLogoPng(): Promise<string | null> {
  try {
    const res = await fetch(encodeURI(LOGO_PATH));
    if (!res.ok) return null;
    const svg = await res.text();
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('logo'));
        img.src = url;
        setTimeout(() => reject(new Error('timeout')), 3000);
      });
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0, 256, 256);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return null;
  }
}

function slug(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/ä/gi, 'ae').replace(/ö/gi, 'oe').replace(/ü/gi, 'ue').replace(/ß/g, 'ss')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 40);
}

export interface IssuedCertificate {
  url: string;
  blob: Blob;
  fileName: string;
  certificateId: string;
  verifyUrl: string;
  data: CertificateData;
}

/* ────────────────────────────────────────────────────────────
 * Service
 * ──────────────────────────────────────────────────────────── */

export class CertificateService {
  /**
   * Stellt das Zertifikat aus: Datensatz serverseitig (Edge Function
   * academy-certificate), PDF mit QR-Code im Browser, Upload in den Speicher.
   *
   * Wirft Error('MISSING_NAME'), wenn kein verwendbarer Name vorliegt.
   */
  static async issue(learningPathId: string, recipientName?: string): Promise<IssuedCertificate> {
    const { data, error } = await supabase.functions.invoke('academy-certificate', {
      body: { action: 'issue', learning_path_id: learningPathId, recipient_name: recipientName?.trim() || undefined },
    });

    let payload: any = data;
    if (error && 'context' in (error as any)) {
      try { payload = await (error as any).context.json(); } catch { /* ignore */ }
    }
    if (!payload?.success) {
      if (payload?.code === 'MISSING_NAME') throw new Error('MISSING_NAME');
      throw new Error(payload?.error || 'Das Zertifikat konnte gerade nicht erstellt werden. Bitte versuche es gleich noch einmal.');
    }
    const cert = payload.certificate;

    // Erworbene Kompetenzen aus den Lernpfad-Metadaten (vom Lernpfad selbst erzeugt)
    const { data: rows } = await supabase
      .from('learning_results')
      .select('certificate_metadata')
      .eq('learning_path_id', learningPathId)
      .not('certificate_metadata', 'is', null)
      .limit(1);
    const meta = parseMakeJson(rows?.[0]?.certificate_metadata) ?? {};
    let mastered = toSkillStrings(meta?.competency_profile);
    if (!mastered.length && meta?.learning_outcomes) mastered = toSkillStrings(meta.learning_outcomes);
    if (!mastered.length) mastered = [cert.skill];

    const verifyUrl = verifyUrlFor(cert.id);
    const [qr, logo] = await Promise.all([
      QRCode.toDataURL(verifyUrl, { margin: 0, width: 320, color: { dark: '#0A192F', light: '#FFFFFF' } }).catch(() => null),
      loadLogoPng(),
    ]);

    const certificate: CertificateData = {
      recipient_name: cert.recipient_name,
      skill: cert.skill,
      official_title: meta?.official_title || null,
      mastered_skills: mastered,
      modules: (Array.isArray(cert.unit_titles) ? cert.unit_titles : []).map((t: string) => ({ title: t })),
      total_hours: cert.total_hours,
      hours_estimated: cert.hours_estimated !== false,
      period_start: cert.period_start,
      period_end: cert.period_end,
      completion_date: cert.passed_at,
      certificate_id: cert.id,
      issuer: 'DYD — Decide Your Dream',
      issuer_url: 'decide-your-dream.de',
      issue_place: 'Düsseldorf',
      dqr_reference: cert.dqr_reference ?? null,
      final_score: cert.score,
      question_count: cert.question_count,
      verify_url: verifyUrl,
      qr_data_url: qr,
      logo_data_url: logo,
    };

    let blob: Blob;
    try {
      blob = await pdf(<CertificatePDF certificate={certificate} />).toBlob();
    } catch (err: any) {
      console.error('[Certificate] PDF-Render-Fehler:', err);
      throw new Error('Das PDF konnte nicht erstellt werden. Bitte lade die Seite neu und versuche es erneut.');
    }

    const lastName = String(cert.recipient_name).trim().split(/\s+/).pop() || 'Teilnehmer';
    const fileName = `Zertifikat_${slug(cert.skill)}_${slug(lastName)}.pdf`;

    const { data: { user } } = await supabase.auth.getUser();
    let url = '';
    try {
      url = await this.upload(`${user?.id ?? 'anonymous'}/certificate_${cert.id}.pdf`, blob);
      await supabase.from('learning_paths').update({ certificate_url: url }).eq('id', learningPathId);
    } catch (e: any) {
      // Upload nicht möglich: Zertifikat ist trotzdem gültig und lokal herunterladbar
      console.warn('[Certificate] Upload fehlgeschlagen:', e?.message ?? e);
    }

    return { url, blob, fileName, certificateId: cert.id, verifyUrl, data: certificate };
  }

  /**
   * Kompatibilität mit bestehenden Aufrufen (Dashboard): stellt aus und lädt
   * optional direkt herunter. Liefert die öffentliche URL.
   */
  static async issueCertificate(
    learningPath: LearningPath,
    recipientName: string,
    options: { force?: boolean; autoDownload?: boolean } = {}
  ): Promise<string> {
    const result = await this.issue(learningPath.id, recipientName);
    if (options.autoDownload !== false) this.downloadBlob(result.blob, result.fileName);
    return result.url || URL.createObjectURL(result.blob);
  }

  /** Upload mit Bucket-Fallback; liefert die öffentliche URL. */
  private static async upload(objectPath: string, blob: Blob): Promise<string> {
    for (const bucket of [CERT_BUCKET, CERT_BUCKET_FALLBACK]) {
      const { error } = await supabase.storage.from(bucket).upload(objectPath, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });
      if (!error) return supabase.storage.from(bucket).getPublicUrl(objectPath).data.publicUrl;
      const message = error.message ?? '';
      if (!(/bucket/i.test(message) && /not found|exist/i.test(message))) throw new Error(message);
    }
    throw new Error(`Kein Storage-Bucket "${CERT_BUCKET}" vorhanden.`);
  }

  /** Download direkt aus dem Blob — das download-Attribut greift bei fremden Domains nicht. */
  static downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }

  /** Bereits ausgestelltes Zertifikat erneut herunterladen. */
  static async downloadCertificate(certificateUrl: string, fileName?: string): Promise<void> {
    try {
      const response = await fetch(certificateUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.downloadBlob(await response.blob(), fileName || 'Zertifikat.pdf');
    } catch {
      window.open(certificateUrl, '_blank', 'noopener');
    }
  }

  /** LinkedIn "Zertifikat zum Profil hinzufügen" */
  static linkedInAddUrl(params: { name: string; certificateId: string; issuedAt: string; verifyUrl: string }): string {
    const d = new Date(params.issuedAt);
    const q = new URLSearchParams({
      startTask: 'CERTIFICATION_NAME',
      name: params.name,
      organizationName: 'DYD – Decide Your Dream',
      issueYear: String(d.getFullYear()),
      issueMonth: String(d.getMonth() + 1),
      certUrl: params.verifyUrl,
      certId: params.certificateId,
    });
    return `https://www.linkedin.com/profile/add?${q.toString()}`;
  }

  /**
   * Trägt das Zertifikat in den aktuellsten eigenen Lebenslauf ein
   * (stored_cvs.cv_data.certificates). Liefert false, wenn kein CV existiert.
   */
  static async addToCv(params: { name: string; year: string; verifyUrl: string }): Promise<'added' | 'exists' | 'no_cv'> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 'no_cv';
    const { data: cvs } = await supabase
      .from('stored_cvs')
      .select('id, cv_data, source, status')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(10);

    const parse = (raw: unknown): any => {
      let v: any = raw;
      for (let i = 0; i < 3 && typeof v === 'string'; i++) {
        try { v = JSON.parse(v); } catch { return null; }
      }
      return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
    };

    const target = (cvs ?? []).find((c: any) => c.source !== 'check' && parse(c.cv_data));
    if (!target) return 'no_cv';

    const cvData = parse(target.cv_data);
    const list: any[] = Array.isArray(cvData.certificates) ? cvData.certificates : [];
    const exists = list.some((c) => String(c?.name ?? '').trim().toLowerCase() === params.name.trim().toLowerCase());
    if (exists) return 'exists';

    const next = {
      ...cvData,
      certificates: [
        ...list,
        { name: params.name, issuer: 'DYD Career Academy', year: params.year, url: params.verifyUrl, description: '' },
      ],
    };
    const { error } = await supabase.from('stored_cvs').update({ cv_data: next, updated_at: new Date().toISOString() }).eq('id', target.id);
    if (error) throw new Error('Der Lebenslauf konnte nicht aktualisiert werden.');
    return 'added';
  }
}

export const certificateService = CertificateService;
