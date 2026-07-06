import { pdf } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import { LearningPath, Certificate } from '../types/learningPath';
import { CertificatePDF } from '../utils/certificatePDF';

export class CertificateService {
  static async issueCertificate(
    learningPath: LearningPath,
    recipientName: string
  ): Promise<string> {
    // Guard: Abschlussprüfung muss mit mindestens 80% bestanden sein
    const { data: lpCheck, error: lpCheckError } = await supabase
      .from('learning_paths')
      .select('final_exam_score')
      .eq('id', learningPath.id)
      .maybeSingle();

    // FIX: Aussagekräftige Fehler statt stillem Fehlschlagen — so sehen wir
    // sofort, ob RLS den Lese-Zugriff blockiert oder der Score nie ankam.
    if (lpCheckError) {
      throw new Error(`Prüfungs-Score konnte nicht gelesen werden: ${lpCheckError.message}`);
    }
    if (lpCheck?.final_exam_score == null) {
      throw new Error(
        'Dein Prüfungsergebnis wurde noch nicht gespeichert. ' +
        'Das deutet auf eine fehlende UPDATE-Policy auf learning_paths hin. ' +
        'Bitte versuche es in wenigen Sekunden erneut.'
      );
    }
    if (lpCheck.final_exam_score < 80) {
      throw new Error('Die Abschlussprüfung muss mit mindestens 80% bestanden werden, um das Zertifikat zu erhalten.');
    }

    // Try to get the full display name from the profile
    let displayName = recipientName;
    if (learningPath.user_id) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', learningPath.user_id)
          .maybeSingle();
        if (profile?.full_name) displayName = profile.full_name;
      } catch { /* fall back to provided name */ }
    }

    // Fetch certificate_metadata from learning_results (Make writes rich cert data here)
    let certMeta: {
      official_title?: string;
      competency_profile?: string[];
      dqr_reference?: string;
      verification_footer?: string;
    } | null = null;
    try {
      // FIX (Bug 1): vorher .eq('id', learningPath.id) — das verglich die
      // learning_results-Zeilen-ID mit der learning_path-ID und fand NIE etwas.
      // Richtig: über learning_path_id joinen und die Zeile mit Metadaten nehmen.
      const { data: resultRow } = await supabase
        .from('learning_results')
        .select('certificate_metadata')
        .eq('learning_path_id', learningPath.id)
        .not('certificate_metadata', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (resultRow?.certificate_metadata) {
        let meta: any = resultRow.certificate_metadata;
        // Make liefert JSONB manchmal doppelt serialisiert — defensiv parsen
        if (typeof meta === 'string') {
          try { meta = JSON.parse(meta); } catch { meta = null; }
        }
        if (meta && typeof meta === 'object') certMeta = meta;
      }
    } catch { /* non-fatal, fall back to learning_path data */ }

    const certificateId = `DYD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Use competency_profile from learning_results if available, otherwise fall back to missing_skills
    // FIX: Skills strikt zu Strings mappen — ein Objekt ohne skill_name/name landete
    // vorher als Objekt im PDF-Renderer und ließ react-pdf crashen.
    const masteredSkills: string[] = (certMeta?.competency_profile?.length
      ? certMeta.competency_profile
      : (() => {
          const raw = learningPath.missing_skills;
          if (!raw) return [];
          const arr = Array.isArray(raw) ? raw
            : typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return []; } })()
            : [];
          return arr.map((s: any) =>
            typeof s === 'string' ? s : (s?.skill_name || s?.name || null)
          );
        })()
    )
      .filter((s: any): s is string => typeof s === 'string' && s.trim().length > 0);

    // Use official_title from learning_results if available
    const certTitle = certMeta?.official_title || learningPath.target_job;

    // Collect completed unit titles from unit_completions (5 units, each with variant A/B)
    let moduleTitles: string[] = [];
    try {
      const { data: completions } = await supabase
        .from('unit_completions')
        .select('unit_index, variant, exam_score')
        .eq('learning_path_id', learningPath.id)
        .order('unit_index');
      if (completions && completions.length > 0) {
        moduleTitles = completions.map(
          (c: any) => `Lerneinheit ${c.unit_index} (${c.variant}) — ${c.exam_score}% bestanden`
        );
      }
    } catch { /* non-fatal — fall back to empty */ }
    // Fall back to old curriculum-based titles if no unit_completions exist yet
    if (moduleTitles.length === 0) {
      const allModules = learningPath.curriculum?.modules ?? [];
      moduleTitles = Object.entries(learningPath.progress ?? {})
        .filter(([, p]) => p.status === 'completed')
        .map(([moduleId]) => allModules.find((m) => m.id === moduleId)?.title)
        .filter((t): t is string => Boolean(t));
    }

    const certificate: Certificate = {
      recipient_name: displayName,
      target_job: certTitle,
      mastered_skills: masteredSkills,
      completion_date: new Date().toISOString(),
      certificate_id: certificateId,
      issuer: 'DYD – Decide your Dream',
      dqr_reference: certMeta?.dqr_reference,
      verification_footer: certMeta?.verification_footer,
    };

    // FIX: PDF-Fehler separat fangen, damit die Fehlermeldung verrät,
    // ob es am Rendern oder am Upload liegt.
    let blob: Blob;
    try {
      blob = await pdf(
        <CertificatePDF certificate={certificate} modules={moduleTitles} />
      ).toBlob();
    } catch (err: any) {
      console.error('[Certificate] PDF-Render-Fehler:', err, { certificate, moduleTitles });
      throw new Error(`PDF-Erstellung fehlgeschlagen: ${err.message}`);
    }

    const fileName = `certificate_${certificateId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('cv-files')
      .upload(`certificates/${fileName}`, blob, {
        contentType: 'application/pdf',
        upsert: true, // FIX: Retries dürfen nicht an einer Namenskollision scheitern
      });

    if (uploadError) throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);

    const { data: urlData } = supabase.storage
      .from('cv-files')
      .getPublicUrl(`certificates/${fileName}`);

    const certificateUrl = urlData.publicUrl;

    const { error: updateError } = await supabase
      .from('learning_paths')
      .update({
        certificate_url: certificateUrl,
        certificate_issued_at: new Date().toISOString(),
      })
      .eq('id', learningPath.id);

    if (updateError) throw new Error(`Datenbankaktualisierung fehlgeschlagen: ${updateError.message}`);

    // Auto-download
    const link = document.createElement('a');
    link.href = certificateUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return certificateUrl;
  }

  static async downloadCertificate(certificateUrl: string, fileName?: string): Promise<void> {
    const link = document.createElement('a');
    link.href = certificateUrl;
    link.download = fileName || 'certificate.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const certificateService = CertificateService;