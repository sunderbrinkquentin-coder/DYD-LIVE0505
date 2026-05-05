import { pdf } from '@react-pdf/renderer';
import { supabase } from '../lib/supabase';
import { LearningPath, Certificate } from '../types/learningPath';
import { CertificatePDF } from '../utils/certificatePDF';

export class CertificateService {
  static async issueCertificate(
    learningPath: LearningPath,
    recipientName: string
  ): Promise<string> {
    try {
      console.log('[Certificate] Generating certificate for:', recipientName);

      // Check if already completed
      if (learningPath.status !== 'completed') {
        throw new Error('Lernpfad muss vollständig abgeschlossen sein');
      }

      // Generate certificate ID
      const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

      // Extract mastered skills
      const masteredSkills = learningPath.missing_skills?.map((skill) => skill.name) || [];

      // Create certificate data
      const certificate: Certificate = {
        recipient_name: recipientName,
        target_job: learningPath.target_job,
        mastered_skills: masteredSkills,
        completion_date: new Date().toISOString(),
        certificate_id: certificateId,
        issuer: 'Career Vision Academy',
      };

      // Generate PDF
      const blob = await pdf(<CertificatePDF certificate={certificate} />).toBlob();

      // Create file name
      const fileName = `certificate_${certificateId}.pdf`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('cv-files')
        .upload(`certificates/${fileName}`, blob, {
          contentType: 'application/pdf',
          upsert: false,
        });

      if (uploadError) {
        console.error('[Certificate] Upload error:', uploadError);
        throw new Error(`Upload fehlgeschlagen: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('cv-files')
        .getPublicUrl(`certificates/${fileName}`);

      const certificateUrl = urlData.publicUrl;

      // Update learning path with certificate URL
      const { error: updateError } = await supabase
        .from('learning_paths')
        .update({
          certificate_url: certificateUrl,
          certificate_issued_at: new Date().toISOString(),
        })
        .eq('id', learningPath.id);

      if (updateError) {
        console.error('[Certificate] Database update error:', updateError);
        throw new Error(`Datenbankaktualisierung fehlgeschlagen: ${updateError.message}`);
      }

      console.log('[Certificate] ✅ Certificate issued successfully');

      // Auto-download
      const link = document.createElement('a');
      link.href = certificateUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return certificateUrl;
    } catch (error: any) {
      console.error('[Certificate] Generation failed:', error);
      throw new Error(`Zertifikatserstellung fehlgeschlagen: ${error.message}`);
    }
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
