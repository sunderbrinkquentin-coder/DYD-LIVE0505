import { pdf } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import {
  CompetencyProfilePDF,
  CompetencyProfileData,
  ProfileEntry,
} from '../utils/competencyProfilePDF';

/** Identisch zu DEFAULT_HOURS_PER_UNIT in certificateService. */
const DEFAULT_HOURS_PER_UNIT = 4;

export class CompetencyProfileService {
  /**
   * Erzeugt das Kompetenzprofil aus ALLEN zertifizierten Lernpfaden und lädt es
   * direkt herunter.
   *
   * Bewusst KEIN Storage-Upload: das Dokument veraltet, sobald ein weiteres
   * Zertifikat hinzukommt. Eine gespeicherte URL wäre sofort falsch.
   */
  static async generateAndDownload(
    userId: string,
    recipientName?: string
  ): Promise<void> {
    if (!userId) throw new Error('Kein Nutzer angemeldet.');

    /* ── 1. Zertifizierte Pfade ── */
    const { data: paths, error: pathErr } = await supabase
      .from('learning_paths')
      .select(
        'id, skill, target_job, final_exam_score, certificate_id, certificate_url, certificate_issued_at, created_at'
      )
      .eq('user_id', userId)
      .not('certificate_url', 'is', null)
      .order('certificate_issued_at', { ascending: true });

    if (pathErr) {
      throw new Error(`Zertifikate konnten nicht geladen werden: ${pathErr.message}`);
    }
    if (!paths || paths.length === 0) {
      throw new Error('NO_CERTIFICATES');
    }

    /* ── 2. Name ── */
    let displayName = recipientName?.trim() || '';
    if (!displayName) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('user_id', userId)
        .is('deleted_at', null)
        .maybeSingle();
      if (profile?.full_name) displayName = profile.full_name.trim();
    }
    if (!displayName) throw new Error('MISSING_NAME');

    /* ── 3. Lerneinheiten pro Pfad — ein Query für alle ── */
    const ids = paths.map((p: any) => p.id);
    const { data: completions } = await supabase
      .from('unit_completions')
      .select('learning_path_id, unit_index')
      .in('learning_path_id', ids);

    const unitCounts = new Map<string, number>();
    for (const row of completions ?? []) {
      const id = (row as any).learning_path_id as string;
      unitCounts.set(id, (unitCounts.get(id) ?? 0) + 1);
    }

    /* ── 4. Einträge bauen ── */
    const entries: ProfileEntry[] = paths.map((p: any) => {
      const units = unitCounts.get(p.id) ?? 0;
      return {
        skill: p.skill || p.target_job || 'Lernpfad',
        target_job: p.target_job || '—',
        certificate_id: p.certificate_id || '—',
        issued_at: p.certificate_issued_at ?? null,
        score: typeof p.final_exam_score === 'number' ? p.final_exam_score : null,
        units,
        hours: units * DEFAULT_HOURS_PER_UNIT,
      };
    });

    const issuedDates = paths
      .map((p: any) => p.certificate_issued_at)
      .filter(Boolean)
      .sort();

    const profileData: CompetencyProfileData = {
      recipient_name: displayName,
      entries,
      total_hours: entries.reduce((sum, e) => sum + e.hours, 0),
      period_start: (paths[0] as any).created_at ?? issuedDates[0] ?? null,
      period_end: issuedDates[issuedDates.length - 1] ?? new Date().toISOString(),
      generated_at: new Date().toISOString(),
      issuer: 'DYD — Decide Your Dream',
      issuer_url: 'decide-your-dream.de',
      issue_place: 'Düsseldorf',
    };

    /* ── 5. Rendern ── */
    let blob: Blob;
    try {
      blob = await pdf(<CompetencyProfilePDF profile={profileData} />).toBlob();
    } catch (err: any) {
      console.error('[CompetencyProfile] PDF-Render-Fehler:', err, profileData);
      throw new Error(`PDF-Erstellung fehlgeschlagen: ${err?.message ?? err}`);
    }

    /* ── 6. Download ── */
    const safeName = displayName.replace(/[^\p{L}\p{N}]+/gu, '_');
    this.downloadBlob(blob, `Kompetenzprofil_${safeName}.pdf`);

    console.log('[CompetencyProfile] ✅ erstellt:', entries.length, 'Kompetenzen');
  }

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
}

export const competencyProfileService = CompetencyProfileService;