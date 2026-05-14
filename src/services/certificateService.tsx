import { pdf } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import { LearningPath, Certificate } from '../types/learningPath';
import { CertificatePDF } from '../utils/certificatePDF';

export class CertificateService {
  static async issueCertificate(
    learningPath: LearningPath,
    recipientName: string
  ): Promise<string> {
    if (learningPath.status !== 'completed') {
      throw new Error('Lernpfad muss vollständig abgeschlossen sein');
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

    const certificateId = `DYD-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const masteredSkills = (learningPath.missing_skills ?? []).map((s: any) => s.skill_name || s.name || s);

    // Collect completed module titles
    const allModules = learningPath.curriculum?.modules ?? [];
    const moduleTitles = Object.entries(learningPath.progress ?? {})
      .filter(([, p]) => p.status === 'completed')
      .map(([moduleId]) => allModules.find((m) => m.id === moduleId)?.title)
      .filter((t): t is string => Boolean(t));

    const certificate: Certificate = {
      recipient_name: displayName,
      target_job: learningPath.target_job,
      mastered_skills: masteredSkills,
      completion_date: new Date().toISOString(),
      certificate_id: certificateId,
      issuer: 'DYD – Design Your Dream',
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
