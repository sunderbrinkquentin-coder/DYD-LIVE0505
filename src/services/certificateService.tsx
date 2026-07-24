import { pdf } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import { LearningPath } from '../types/learningPath';
import { CertificatePDF, CertificateData, CertificateModule } from '../utils/certificatePDF';

/** Bucket für Zertifikate. MUSS public sein. Fallback auf den alten Bucket,
 *  falls `certificates` in deinem Projekt noch nicht angelegt ist. */
const CERT_BUCKET = 'certificates';
const CERT_BUCKET_FALLBACK = 'cv-files';

/** Bestehensgrenze der Abschlussprüfung in Prozent. */
const PASSING_SCORE = 80;

/** Fallback-Lernumfang je Lerneinheit, wenn weder certificate_metadata
 *  noch das Curriculum eine Stundenangabe liefern. Hier anpassen. */
const DEFAULT_HOURS_PER_UNIT = 4;

/* ────────────────────────────────────────────────────────────
 * Hilfsfunktionen
 * ──────────────────────────────────────────────────────────── */

/**
 * Make speichert JSON teils doppelt serialisiert und teils OHNE umschließende
 * eckige Klammern (`{...}, {...}`). Beides hier tolerant abfangen.
 */
function parseMakeJson(raw: unknown): any {
  if (raw == null) return null;
  if (typeof raw === 'object') return raw;
  if (typeof raw !== 'string') return null;

  const text = raw.trim();
  if (!text) return null;

  const attempts = [text];
  // Liste ohne Klammern → einpacken
  if (!text.startsWith('[') && !text.startsWith('{')) attempts.push(`[${text}]`);
  if (text.startsWith('{') && text.includes('},')) attempts.push(`[${text}]`);

  for (const candidate of attempts) {
    try {
      const parsed = JSON.parse(candidate);
      // doppelt serialisiert: JSON.parse liefert erneut einen String
      return typeof parsed === 'string' ? parseMakeJson(parsed) : parsed;
    } catch {
      /* nächster Versuch */
    }
  }
  return null;
}

/** Beliebige Skill-Repräsentation → sauberes String-Array. */
function toSkillStrings(raw: unknown): string[] {
  const parsed = parseMakeJson(raw);
  const arr = Array.isArray(parsed) ? parsed : parsed ? [parsed] : [];
  return arr
    .map((s: any) =>
      typeof s === 'string' ? s : s?.skill_name || s?.name || s?.label || s?.skill || null
    )
    .filter((s: any): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim());
}

/** Prozentwert aus verschiedenen Feldnamen / Formaten herausziehen. */
function toScore(raw: unknown): number | null {
  const value = parseMakeJson(raw) ?? raw;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const n = parseFloat(value.replace('%', '').replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  }
  if (value && typeof value === 'object') {
    const v: any = value;
    const candidate = v.score ?? v.percentage ?? v.result ?? v.final_score ?? v.exam_score;
    return typeof candidate === 'number' ? candidate : toScore(candidate);
  }
  return null;
}

/* ────────────────────────────────────────────────────────────
 * Service
 * ──────────────────────────────────────────────────────────── */

export class CertificateService {
  /**
   * Stellt das Zertifikat für einen (per-Skill-)Lernpfad aus.
   * Idempotent: existiert bereits eine certificate_url, wird diese
   * zurückgegeben statt eine zweite Urkunde mit neuer Nummer zu erzeugen.
   */
  static async issueCertificate(
    learningPath: LearningPath,
    recipientName: string,
    options: { force?: boolean; autoDownload?: boolean } = {}
  ): Promise<string> {
    const { force = false, autoDownload = true } = options;

    /* ── 1. Lernpfad-Zeile laden (Score, Skill, Zeitraum, bestehendes Zertifikat) ── */
    const { data: pathRow, error: pathError } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('id', learningPath.id)
      .maybeSingle();

    if (pathError) {
      throw new Error(`Lernpfad konnte nicht gelesen werden: ${pathError.message}`);
    }
    if (!pathRow) {
      throw new Error('Zu diesem Lernpfad wurde keine Zeile gefunden (falsche ID oder RLS).');
    }

    // Idempotenz: schon ausgestellt → wiederverwenden
    if (!force && pathRow.certificate_url) {
      if (autoDownload) await this.downloadCertificate(pathRow.certificate_url);
      return pathRow.certificate_url as string;
    }

    /* ── 2. Ergebnisse aus learning_results (Metadaten + Prüfung) ── */
    const { data: resultRow } = await supabase
      .from('learning_results')
      .select('certificate_metadata, final_exam, content, selected_skill, created_at')
      .eq('learning_path_id', learningPath.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const certMeta = parseMakeJson(resultRow?.certificate_metadata) ?? {};
    const finalExam = parseMakeJson(resultRow?.final_exam);

    /* ── 3. Prüfungsergebnis: erst learning_paths, dann learning_results ── */
    const score =
      toScore(pathRow.final_exam_score) ??
      toScore(finalExam) ??
      toScore(certMeta?.final_exam_score);

    if (score == null) {
      throw new Error(
        'Dein Prüfungsergebnis wurde noch nicht gespeichert. Prüfe, ob die Abschlussprüfung ' +
          'den Score nach learning_paths.final_exam_score bzw. learning_results.final_exam schreibt.'
      );
    }
    if (score < PASSING_SCORE) {
      throw new Error(
        `Die Abschlussprüfung muss mit mindestens ${PASSING_SCORE} % bestanden werden ` +
          `(dein Ergebnis: ${Math.round(score)} %).`
      );
    }

    /* ── 4. Name der Person ── */
    let displayName = recipientName?.trim() || '';
    const userId = pathRow.user_id ?? learningPath.user_id;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();
      if (profile?.full_name) displayName = profile.full_name;
    }
    if (!displayName) {
      throw new Error('Für das Zertifikat fehlt der Name. Bitte im Profil hinterlegen.');
    }

    /* ── 5. Skill, Titel, Kompetenzen ── */
    const skill: string | null =
      pathRow.skill || resultRow?.selected_skill || certMeta?.skill || null;

    const targetJob: string =
      pathRow.target_job || learningPath.target_job || 'Zielposition';

    const officialTitle: string | null = certMeta?.official_title || null;

    let masteredSkills = toSkillStrings(certMeta?.competency_profile);
    if (masteredSkills.length === 0 && certMeta?.learning_outcomes) {
      masteredSkills = toSkillStrings(certMeta.learning_outcomes);
    }
    if (masteredSkills.length === 0) {
      // Fallback: nur den freigeschalteten Skill zeigen, NICHT die ganze Gap-Liste
      // (missing_skills sind die noch fehlenden Skills der Analyse, keine erworbenen).
      masteredSkills = skill ? [skill] : [];
    }

    /* ── 6. Lerneinheiten + Zeitraum ── */
    // Achtung: unit_completions hat KEIN created_at — der Upsert in
    // LearningPathPage schreibt completed_at. Falscher Spaltenname = HTTP 400.
    const { data: completions } = await supabase
      .from('unit_completions')
      .select('unit_index, variant, exam_score, completed_at')
      .eq('learning_path_id', learningPath.id)
      .order('unit_index', { ascending: true });

    // Prozentwerte bewusst NICHT ans PDF geben — auf dem Zertifikat stehen nur Titel.
    let modules: CertificateModule[] = (completions ?? []).map((c: any) => ({
      title: `Lerneinheit ${c.unit_index}${c.variant ? ` (${c.variant})` : ''}`,
    }));

    if (modules.length === 0) {
      const allModules = (pathRow.curriculum ?? learningPath.curriculum)?.modules ?? [];
      const progress = pathRow.progress ?? learningPath.progress ?? {};
      modules = Object.entries(progress)
        .filter(([, p]: [string, any]) => p?.status === 'completed')
        .map(([moduleId]) => allModules.find((m: any) => m.id === moduleId)?.title)
        .filter((t: any): t is string => Boolean(t))
        .map((title) => ({ title }));
    }

    const completionTimestamps = (completions ?? [])
      .map((c: any) => c.completed_at)
      .filter(Boolean)
      .sort();

    const periodStart: string | null =
      pathRow.created_at || completionTimestamps[0] || null;
    const periodEnd: string | null =
      completionTimestamps[completionTimestamps.length - 1] || new Date().toISOString();

    /* ── 7. Lernumfang in Stunden ── */
    const totalHours = this.resolveHours(certMeta, pathRow, modules.length);

    /* ── 8. Zertifikatsnummer (stabil pro Lernpfad, nicht pro Klick) ── */
    const certificateId =
      (pathRow.certificate_id as string | null) ||
      `DYD-${new Date().getFullYear()}-${String(learningPath.id).slice(0, 8).toUpperCase()}`;

    const certificate: CertificateData = {
      recipient_name: displayName,
      target_job: targetJob, // nur intern (Dateiname/Metadaten), wird nicht gedruckt
      skill,
      official_title: officialTitle,
      mastered_skills: masteredSkills,
      modules,
      total_hours: totalHours,
      period_start: periodStart,
      period_end: periodEnd,
      completion_date: new Date().toISOString(),
      certificate_id: certificateId,
      issuer: 'DYD — Decide Your Dream',
      issuer_url: 'decide-your-dream.de',
      issue_place: 'Düsseldorf',
      dqr_reference: certMeta?.dqr_reference ?? null,
      verification_url: `https://decide-your-dream.de/#/verify/${certificateId}`,
      verification_footer: certMeta?.verification_footer ?? null,
    };

    /* ── 9. PDF rendern ── */
    let blob: Blob;
    try {
      blob = await pdf(<CertificatePDF certificate={certificate} />).toBlob();
    } catch (err: any) {
      console.error('[Certificate] PDF-Render-Fehler:', err, certificate);
      throw new Error(`PDF-Erstellung fehlgeschlagen: ${err?.message ?? err}`);
    }

    /* ── 10. Upload ── */
    const fileName = `certificate_${certificateId}.pdf`;
    const objectPath = `${userId ?? 'anonymous'}/${fileName}`;
    const { bucket, publicUrl } = await this.uploadCertificate(objectPath, blob);

    /* ── 11. Datenbank aktualisieren ── */
    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        certificate_url: publicUrl,
        certificate_id: certificateId,
        certificate_issued_at: new Date().toISOString(),
      })
      .eq('id', learningPath.id);

    if (updateError) {
      // Das PDF liegt bereits im Storage — der Nutzer bekommt es trotzdem.
      console.error(
        `[Certificate] DB-Update fehlgeschlagen (Bucket ${bucket}):`,
        updateError.message
      );
    }

    /* ── 12. Download aus dem Blob (funktioniert auch cross-origin) ── */
    if (autoDownload) this.downloadBlob(blob, fileName);

    return publicUrl;
  }

  /** Lernumfang ermitteln: Metadaten → Curriculum → Fallback pro Lerneinheit. */
  private static resolveHours(certMeta: any, pathRow: any, moduleCount: number): number | null {
    const fromMeta =
      certMeta?.total_hours ?? certMeta?.learning_hours ?? certMeta?.workload_hours;
    const metaHours = toScore(fromMeta);
    if (metaHours && metaHours > 0) return Math.round(metaHours);

    const curriculum = parseMakeJson(pathRow?.curriculum);
    const curriculumModules: any[] = curriculum?.modules ?? [];
    const summed = curriculumModules.reduce((sum: number, m: any) => {
      const h = toScore(m?.duration_hours ?? m?.hours ?? m?.duration);
      return sum + (h && h > 0 ? h : 0);
    }, 0);
    if (summed > 0) return Math.round(summed);

    if (moduleCount > 0) return moduleCount * DEFAULT_HOURS_PER_UNIT;
    return null;
  }

  /** Upload mit Bucket-Fallback; liefert die öffentliche URL. */
  private static async uploadCertificate(
    objectPath: string,
    blob: Blob
  ): Promise<{ bucket: string; publicUrl: string }> {
    for (const bucket of [CERT_BUCKET, CERT_BUCKET_FALLBACK]) {
      const { error } = await supabase.storage.from(bucket).upload(objectPath, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });

      if (!error) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
        return { bucket, publicUrl: data.publicUrl };
      }

      const message = error.message ?? '';
      const bucketMissing = /bucket/i.test(message) && /not found|exist/i.test(message);
      if (!bucketMissing) {
        throw new Error(`Upload nach "${bucket}" fehlgeschlagen: ${message}`);
      }
      console.warn(`[Certificate] Bucket "${bucket}" fehlt — versuche Fallback.`);
    }

    throw new Error(
      `Kein Storage-Bucket verfügbar. Lege in Supabase einen public Bucket "${CERT_BUCKET}" an.`
    );
  }

  /** Download direkt aus dem Blob — das download-Attribut greift bei fremden Domains nicht. */
  private static downloadBlob(blob: Blob, fileName: string): void {
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
      const blob = await response.blob();
      this.downloadBlob(blob, fileName || 'zertifikat.pdf');
    } catch {
      // Bucket nicht public oder CORS → wenigstens im neuen Tab öffnen
      window.open(certificateUrl, '_blank', 'noopener');
    }
  }
}

export const certificateService = CertificateService;