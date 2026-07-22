import axios from 'axios';
import { supabase } from '../lib/supabase';
import { sessionManager } from '../utils/sessionManager';
import {
  VisionAnalysisRequest,
  VisionAnalysisResponse,
  CurriculumGenerationRequest,
  CurriculumGenerationResponse,
  LearningPath,
  Skill,
  SkillAssessment,
} from '../types/learningPath';

const VISION_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_VISION || '';
const CURRICULUM_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_CURRICULUM || '';
const TARGET_SKILLS_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_TARGET_SKILLS || '';
const LEARNINGPATH_WEBHOOK_URL = import.meta.env.VITE_MAKE_WEBHOOK_LEARNINGPATH || '';

export class CareerVisionService {
  static async getTargetSkills(targetJob: string): Promise<Skill[]> {
    try {
      console.log('[CareerVision] Getting required skills for:', targetJob);

      const webhookUrl = TARGET_SKILLS_WEBHOOK_URL || 'https://hook.eu2.make.com/get-target-skills';

      const payload = {
        target_job: targetJob,
        timestamp: new Date().toISOString(),
      };

      console.log('[CareerVision] Calling skills webhook:', webhookUrl);

      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      });

      console.log('[CareerVision] ✅ Required skills received:', {
        skillsCount: response.data.skills?.length || 0,
      });

      return response.data.skills || [];
    } catch (error: any) {
      console.error('[CareerVision] Get target skills failed:', error.message);

      return [
        { name: 'Leadership', category: 'soft_skills', priority: 'high', estimatedTime: '6 months' },
        { name: 'Strategic Planning', category: 'business', priority: 'high', estimatedTime: '4 months' },
        { name: 'Data Analysis', category: 'technical', priority: 'medium', estimatedTime: '3 months' },
        { name: 'Project Management', category: 'business', priority: 'high', estimatedTime: '5 months' },
        { name: 'Communication', category: 'soft_skills', priority: 'high', estimatedTime: '3 months' },
        { name: 'Team Management', category: 'soft_skills', priority: 'medium', estimatedTime: '6 months' },
        { name: 'Budget Planning', category: 'business', priority: 'medium', estimatedTime: '2 months' },
        { name: 'Industry Knowledge', category: 'domain', priority: 'high', estimatedTime: '12 months' },
        { name: 'Stakeholder Management', category: 'soft_skills', priority: 'medium', estimatedTime: '4 months' },
        { name: 'Innovation', category: 'soft_skills', priority: 'low', estimatedTime: '6 months' },
      ];
    }
  }

  // ──────────────────────────────────────────────────────────────────────────
  // PER-SKILL-UNLOCK
  // ──────────────────────────────────────────────────────────────────────────

  /**
   * Legt eine eigene learning_paths-Zeile für EINEN Skill einer Analyse an
   * (oder gibt die bestehende zurück), sodass jeder freigeschaltete Skill sein
   * eigenes is_paid + eigenes learning_results bekommt.
   *
   * Die Analyse-Zeile (skill = null, missing_skills gefüllt) wird NIEMALS
   * verändert — sie bleibt die einzige Quelle der Gap-Liste.
   *
   * Voraussetzung in der DB:
   *   alter table learning_paths
   *     add column if not exists analysis_id uuid references learning_paths(id) on delete cascade;
   *   create unique index if not exists learning_paths_analysis_skill_uniq
   *     on learning_paths (analysis_id, skill) where analysis_id is not null;
   */
  static async getOrCreateSkillPath(analysisPathId: string, skillName: string): Promise<string> {
    if (!analysisPathId) throw new Error('Keine Analyse-id übergeben');
    if (!skillName?.trim()) throw new Error('Kein Skill-Name übergeben');

    const skill = skillName.trim();

    // 1) Analyse-Zeile laden — sie liefert den kompletten Kontext für die Skill-Zeile.
    const { data: analysis, error: loadErr } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('id', analysisPathId)
      .maybeSingle();

    if (loadErr) throw new Error(`Analyse konnte nicht geladen werden: ${loadErr.message}`);
    if (!analysis) throw new Error('Analyse-Zeile nicht gefunden');

    const a = analysis as any;

    // Falls versehentlich eine Skill-Zeile übergeben wurde: auf deren Eltern-Analyse
    // zurückfallen, damit keine Ketten (Skill-Zeile → Skill-Zeile) entstehen.
    const analysisId: string = a.analysis_id ?? a.id;
    if (!analysisId) throw new Error('Analyse-Zeile ohne gültige id');

    // 2) Existiert die Skill-Zeile schon? Dann wiederverwenden (idempotent —
    //    wichtig, weil der "Alle freischalten"-Loop mehrfach laufen kann).
    const { data: existing, error: existErr } = await supabase
      .from('learning_paths')
      .select('id')
      .eq('analysis_id', analysisId)
      .eq('skill', skill)
      .limit(1)
      .maybeSingle();

    if (existErr) throw new Error(`Skill-Pfad konnte nicht geprüft werden: ${existErr.message}`);
    if (existing?.id) {
      console.log('[CareerVision] Skill-Pfad wiederverwendet:', skill, existing.id);
      return existing.id;
    }

    // 3) Sonst neue Skill-Zeile mit dem kompletten Analyse-Kontext anlegen.
    //    is_paid bleibt false — das setzt AUSSCHLIESSLICH der Stripe-Webhook.
    const { data: created, error } = await supabase
      .from('learning_paths')
      .insert({
        user_id: a.user_id ?? null,
        session_id: a.session_id ?? null,
        cv_id: a.cv_id ?? null,
        analysis_id: analysisId,
        skill,
        target_job: a.target_job,
        target_company: a.target_company ?? null,
        vision_description: a.vision_description ?? null,
        industry: a.industry ?? null,
        match_score: a.match_score ?? null,
        missing_skills: a.missing_skills,
        current_skills: a.current_skills ?? [],
        strategic_outlook_2026: a.strategic_outlook_2026 ?? null,
        // Die Analyse ist bezahlt — die Skill-Zeile erbt das, sonst würde die
        // Gap-Analyse auf der Skill-Zeile erneut zur Zahlung angeboten.
        skillgap_paid: a.skillgap_paid ?? false,
        // Muss ein Wert sein, den die Waiting-Page als "noch nicht getriggert"
        // versteht (siehe handleRetry in LearningPathWaitingPage).
        status: 'gap_analysis_complete',
        is_paid: false,
        progress: {},
      })
      .select('id')
      .single();

    // Race-Fall: zwei parallele Klicks. Der Unique-Index (analysis_id, skill)
    // lässt nur einen Insert durch — der Verlierer holt sich die Gewinner-Zeile.
    if (error?.code === '23505') {
      const { data: raced } = await supabase
        .from('learning_paths')
        .select('id')
        .eq('analysis_id', analysisId)
        .eq('skill', skill)
        .limit(1)
        .maybeSingle();
      if (raced?.id) return raced.id;
    }

    if (error || !created?.id) {
      throw new Error(error?.message ?? 'Skill-Pfad konnte nicht angelegt werden');
    }

    console.log('[CareerVision] ✅ Skill-Pfad angelegt:', skill, created.id);
    return created.id;
  }

  /** Alle Skill-Zeilen einer Analyse (für Dashboard / Fortschrittsanzeige). */
  static async getSkillPathsForAnalysis(analysisPathId: string): Promise<LearningPath[]> {
    const { data, error } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('analysis_id', analysisPathId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[CareerVision] Failed to load skill paths:', error.message);
      return [];
    }
    return (data as LearningPath[]) || [];
  }

  // ──────────────────────────────────────────────────────────────────────────

  static async analyzeVision(
    request: VisionAnalysisRequest
  ): Promise<VisionAnalysisResponse> {
    try {
      console.log('[CareerVision] Starting vision analysis...', {
        hasCV: !!request.cv_data,
        targetJob: request.target_job,
      });

      const webhookUrl = VISION_WEBHOOK_URL || 'https://hook.eu2.make.com/analyze-vision';

      const payload = {
        target_job: request.target_job,
        target_company: request.target_company || null,
        vision_description: request.vision_description || null,
        cv_data: request.cv_data || null,
        cv_id: request.cv_id || null,
        user_id: request.user_id || null,
        session_id: request.session_id,
        timestamp: new Date().toISOString(),
      };

      console.log('[CareerVision] Calling Make.com webhook:', webhookUrl);

      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 45000,
      });

      console.log('[CareerVision] ✅ Analysis complete:', {
        skillsCount: response.data.missing_skills?.length || 0,
      });

      return response.data;
    } catch (error: any) {
      console.error('[CareerVision] Analysis failed:', error.message);
      throw new Error(
        `Vision analysis failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  static async generateCurriculum(
    request: CurriculumGenerationRequest
  ): Promise<CurriculumGenerationResponse> {
    try {
      console.log('[CareerVision] Generating learning curriculum...', {
        skillsCount: request.missing_skills.length,
        targetJob: request.target_job,
      });

      const webhookUrl =
        CURRICULUM_WEBHOOK_URL || 'https://hook.eu2.make.com/generate-curriculum';

      const payload = {
        missing_skills: request.missing_skills,
        target_job: request.target_job,
        current_skills: request.current_skills || [],
        timeframe: request.timeframe || '12_months',
        learning_style: request.learning_style || 'balanced',
        timestamp: new Date().toISOString(),
      };

      console.log('[CareerVision] Calling curriculum webhook:', webhookUrl);

      const response = await axios.post(webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      });

      console.log('[CareerVision] ✅ Curriculum generated:', {
        modulesCount: response.data.curriculum?.modules?.length || 0,
      });

      return response.data;
    } catch (error: any) {
      console.error('[CareerVision] Curriculum generation failed:', error.message);
      throw new Error(
        `Curriculum generation failed: ${error.response?.data?.message || error.message}`
      );
    }
  }

  static async createLearningPath(params: {
    userId?: string;
    sessionId: string;
    cvId?: string;
    targetJob: string;
    targetCompany?: string;
    visionDescription?: string;
    missingSkills: Skill[];
    currentSkills?: Skill[];
  }): Promise<string> {
    try {
      console.log('[CareerVision] Creating learning path in database...');

      const { data, error } = await supabase
        .from('learning_paths')
        .insert({
          user_id: params.userId || null,
          session_id: params.sessionId,
          cv_id: params.cvId || null,
          target_job: params.targetJob,
          target_company: params.targetCompany || null,
          vision_description: params.visionDescription || null,
          missing_skills: params.missingSkills,
          current_skills: params.currentSkills || [],
          status: 'analyzing',
          is_paid: false,
          progress: {},
        })
        .select('id')
        .single();

      if (error) throw error;

      console.log('[CareerVision] ✅ Learning path created:', data.id);
      return data.id;
    } catch (error: any) {
      console.error('[CareerVision] Failed to create learning path:', error.message);
      throw new Error(`Failed to create learning path: ${error.message}`);
    }
  }

  static async updateLearningPath(
    pathId: string,
    updates: Partial<LearningPath>
  ): Promise<void> {
    try {
      console.log('[CareerVision] Updating learning path:', pathId);

      const { error } = await supabase
        .from('learning_paths')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', pathId);

      if (error) throw error;

      console.log('[CareerVision] ✅ Learning path updated');
    } catch (error: any) {
      console.error('[CareerVision] Update failed:', error.message);
      throw new Error(`Failed to update learning path: ${error.message}`);
    }
  }

  static async getLearningPath(pathId: string): Promise<LearningPath | null> {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('id', pathId)
        .single();

      if (error) throw error;

      return data as LearningPath;
    } catch (error: any) {
      console.error('[CareerVision] Failed to load learning path:', error.message);
      return null;
    }
  }

  static async getUserLearningPaths(userId: string): Promise<LearningPath[]> {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as LearningPath[]) || [];
    } catch (error: any) {
      console.error('[CareerVision] Failed to load user paths:', error.message);
      return [];
    }
  }

  /**
   * ACHTUNG: Setzt is_paid clientseitig. Der reguläre Kauf-Flow läuft
   * ausschließlich über den Stripe-Webhook (Service Role). Diese Methode nur
   * für Admin-/Kulanz-Fälle verwenden — nicht aus der Paywall aufrufen.
   */
  static async unlockLearningPath(pathId: string): Promise<void> {
    // Mark as paid in DB
    const { error } = await supabase
      .from('learning_paths')
      .update({ is_paid: true, updated_at: new Date().toISOString() })
      .eq('id', pathId);

    if (error) throw new Error(`Failed to unlock learning path: ${error.message}`);

    // Fetch full path data to send to Make
    const { data: path } = await supabase
      .from('learning_paths')
      .select('*')
      .eq('id', pathId)
      .maybeSingle();

    if (LEARNINGPATH_WEBHOOK_URL && path) {
      try {
        const selectedSkill = (path as any).skill ?? null;
        await fetch(LEARNINGPATH_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: pathId,
            // Make MUSS diese id zurückschreiben — learning_results.learning_path_id
            // ist NOT NULL.
            learning_path_id: pathId,
            user_id: path.user_id,
            target_job: path.target_job,
            target_company: path.target_company,
            industry: path.industry,
            skill: selectedSkill,
            selected_skill: selectedSkill,
            // Nur der EINE freigeschaltete Skill — nicht die ganze Gap-Liste,
            // sonst generiert Make Inhalte quer über alle Skills.
            missing_skills: selectedSkill ? [selectedSkill] : path.missing_skills,
            current_skills: path.current_skills,
            match_score: path.match_score,
            is_paid: true,
            unlocked_at: new Date().toISOString(),
          }),
        });
      } catch (e: any) {
        console.warn('[CareerVision] Unlock webhook error (non-fatal):', e.message);
      }
    }
  }

  static async updateModuleProgress(
    pathId: string,
    moduleId: string,
    progressUpdate: {
      status: 'not_started' | 'in_progress' | 'completed';
      completedMilestones?: string[];
      notes?: string;
    }
  ): Promise<void> {
    try {
      const path = await this.getLearningPath(pathId);
      if (!path) throw new Error('Learning path not found');

      const currentProgress = path.progress || {};
      const moduleProgress = currentProgress[moduleId] || {
        moduleId,
        status: 'not_started',
        completedMilestones: [],
      };

      const updatedModuleProgress = {
        ...moduleProgress,
        ...progressUpdate,
        ...(progressUpdate.status === 'in_progress' && !moduleProgress.startedAt
          ? { startedAt: new Date().toISOString() }
          : {}),
        ...(progressUpdate.status === 'completed'
          ? { completedAt: new Date().toISOString() }
          : {}),
      };

      const newProgress = {
        ...currentProgress,
        [moduleId]: updatedModuleProgress,
      };

      const allModules = path.curriculum?.modules || [];
      const completedModules = Object.values(newProgress).filter(
        (p: any) => p.status === 'completed'
      ).length;

 // 'completed' setzt ausschließlich completeLearningPath() nach der Prüfung.
      const newStatus =
        completedModules > 0 && path.status !== 'completed' ? 'in_progress' : path.status;

      await this.updateLearningPath(pathId, {
        progress: newProgress,
        status: newStatus,
      });

      console.log('[CareerVision] ✅ Module progress updated:', moduleId);
    } catch (error: any) {
      console.error('[CareerVision] Failed to update module progress:', error.message);
      throw error;
    }
  }

  static async processSkillAssessment(
    targetJob: string,
    requiredSkills: Skill[],
    assessments: SkillAssessment[]
  ): Promise<{ missingSkills: Skill[]; currentSkills: Skill[] }> {
    const missingSkills: Skill[] = [];
    const currentSkills: Skill[] = [];

    requiredSkills.forEach((skill) => {
      const assessment = assessments.find((a) => a.skill === skill.name);

      if (assessment?.hasSkill) {
        currentSkills.push({
          ...skill,
          category: skill.category || 'assessed',
        });
      } else {
        missingSkills.push(skill);
      }
    });

    return { missingSkills, currentSkills };
  }

  static calculateCompletionPercentage(path: LearningPath): number {
    if (!path.curriculum?.modules || path.curriculum.modules.length === 0) {
      return 0;
    }

    const totalModules = path.curriculum.modules.length;
    const completedModules = Object.values(path.progress || {}).filter(
      (p: any) => p.status === 'completed'
    ).length;

    return Math.round((completedModules / totalModules) * 100);
  }

  static getEstimatedCompletionDate(path: LearningPath): Date | null {
    if (!path.curriculum?.totalDuration) return null;

    try {
      const match = path.curriculum.totalDuration.match(/(\d+)\s*(month|week|day)/i);
      if (!match) return null;

      const value = parseInt(match[1]);
      const unit = match[2].toLowerCase();

      const date = new Date();

      switch (unit) {
        case 'month':
          date.setMonth(date.getMonth() + value);
          break;
        case 'week':
          date.setDate(date.getDate() + value * 7);
          break;
        case 'day':
          date.setDate(date.getDate() + value);
          break;
      }

      return date;
    } catch {
      return null;
    }
  }

/** Bestehensgrenze — identisch zu PASSING_SCORE in certificateService. */
static readonly PASSING_SCORE = 80;

/**
 * Schließt einen Lernpfad nach der Abschlussprüfung ab.
 * Einzige Stelle im Code, die status = 'completed' setzt.
 */
static async completeLearningPath(
  pathId: string,
  finalExamScore: number
): Promise<{ passed: boolean; score: number }> {
  // 1. CareerVisionService statt 'this' nutzen, damit der Kontext nicht verloren geht
  const passed = finalExamScore >= CareerVisionService.PASSING_SCORE;

  // 2. Basis-Update-Payload
  const updatePayload: Record<string, any> = {
    final_exam_score: finalExamScore,
    final_exam_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // 3. Explizite Status-Steuerung (verhindert Alt-Status 'completed' bei Fehlversuchen)
  if (passed) {
    updatePayload.status = 'completed';
    updatePayload.completed_at = new Date().toISOString();
  } else {
    updatePayload.status = 'failed'; // oder 'in_progress', je nach gewünschter Fachlogik
  }

  const { error } = await supabase
    .from('learning_paths')
    .update(updatePayload)
    .eq('id', pathId);

  if (error) {
    throw new Error(`Prüfungsergebnis konnte nicht gespeichert werden: ${error.message}`);
  }

  console.log('[CareerVision] Prüfung gespeichert:', { pathId, finalExamScore, passed });
  return { passed, score: finalExamScore };
}

/**
 * Erstellt das Zertifikat. KEIN eigener Status-Check — die fachliche
 * Bedingung (Score >= PASSING_SCORE) liegt allein in certificateService.
 */
static async generateCertificate(
  pathId: string,
  options: { autoDownload?: boolean } = {}
): Promise<string> {
  const path = await CareerVisionService.getLearningPath(pathId);
  if (!path) throw new Error('Lernpfad nicht gefunden');

  if (path.certificate_url) {
    console.log('[CareerVision] Zertifikat existiert bereits:', path.certificate_url);
    return path.certificate_url;
  }

  const { data: { user } } = await supabase.auth.getUser();

  let recipientName = '';
  if (user?.id) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
      
    recipientName =
      profile?.full_name ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email?.split('@')[0] ||
      '';
  }

  const { certificateService } = await import('./certificateService');
  const certificateUrl = await certificateService.issueCertificate(path, recipientName, {
    autoDownload: options.autoDownload ?? true,
  });

  console.log('[CareerVision] ✅ Zertifikat erstellt:', certificateUrl);
  return certificateUrl;
}

/** Alle bezahlten Skill-Pfade eines Nutzers — Datenquelle der Zertifikats-Sektion. */
static async getCertificateOverview(userId: string): Promise<LearningPath[]> {
  const { data, error } = await supabase
    .from('learning_paths')
    .select('*')
    .eq('user_id', userId)
    .eq('is_paid', true)
    .not('skill', 'is', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[CareerVision] Zertifikatsübersicht fehlgeschlagen:', error.message);
    return [];
  }
  return (data as LearningPath[]) || [];
}

export const careerService = CareerVisionService;