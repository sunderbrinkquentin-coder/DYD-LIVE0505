import { pdf } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import { LearningPath, Certificate } from '../types/learningPath';
import { CertificatePDF } from '../utils/certificatePDF';

export class CertificateService {
  static async issueCertificate(
    learningPath: LearningPath,
    recipientName: string
  ): Promise<string> {
    // Guard: final exam must be passed with 100% before certificate can be issued
    const { data: lpCheck } = await supabase
      .from('learning_paths')
      .select('final_exam_score')
      .eq('id', learningPath.id)
      .maybeSingle();
    if ((lpCheck?.final_exam_score ?? 0) < 80) {
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
      const { data: resultRow } = await supabase
        .from('learning_results')
        .select('certificate_metadata')
        .eq('id', learningPath.id)
        .maybeSingle();
      if (resultRow?.certificate_metadata) {
        certMeta = resultRow.certificate_metadata;
      }
    } catch { /* non-fatal, fall back to learning_path data */ }

    const certificateId = `DYD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Use competency_profile from learning_results if available, otherwise fall back to missing_skills
    const masteredSkills = certMeta?.competency_profile?.length
      ? certMeta.competency_profile
      : (() => {
          const raw = learningPath.missing_skills;
          if (!raw) return [];
          const arr = Array.isArray(raw) ? raw
            : typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return []; } })()
            : [];
          return arr.map((s: any) => s.skill_name || s.name || s);
        })();

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

    const blob = await pdf(
      <CertificatePDF certificate={certificate} modules={moduleTitles} />
    ).toBlob();

    const fileName = `certificate_${certificateId}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from('cv-files')
      .upload(`certificates/${fileName}`, blob, {
        contentType: 'application/pdf',
        upsert: false,
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