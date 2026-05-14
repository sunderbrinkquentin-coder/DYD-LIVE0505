import { pdf } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import { LearningPath, Certificate } from '../types/learningPath';
import { CertificatePDF } from '../utils/certificatePDF';

export class CertificateService {
  static async issueCertificate(
    learningPath: LearningPath,
    recipientName: string
  ): Promise<string> {
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
      : (learningPath.missing_skills ?? []).map((s: any) => s.skill_name || s.name || s);

    // Use official_title from learning_results if available
    const certTitle = certMeta?.official_title || learningPath.target_job;

    // Collect completed module titles
    const allModules = learningPath.curriculum?.modules ?? [];
    const moduleTitles = Object.entries(learningPath.progress ?? {})
      .filter(([, p]) => p.status === 'completed')
      .map(([moduleId]) => allModules.find((m) => m.id === moduleId)?.title)
      .filter((t): t is string => Boolean(t));

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
