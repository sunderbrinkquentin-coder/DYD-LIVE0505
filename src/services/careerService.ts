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

      const newStatus =
        completedModules === allModules.length
          ? 'completed'
          : completedModules > 0
          ? 'in_progress'
          : path.status;

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

  static async generateCertificate(pathId: string): Promise<string> {
    try {
      console.log('[CareerVision] Generating certificate for path:', pathId);

      const path = await this.getLearningPath(pathId);
      if (!path) throw new Error('Learning path not found');

      if (path.status !== 'completed') {
        throw new Error('Learning path must be completed first');
      }

      if (path.certificate_url) {
        console.log('[CareerVision] Certificate already exists:', path.certificate_url);
        return path.certificate_url;
      }

      const { data: { user } } = await supabase.auth.getUser();
      const recipientName = user?.email?.split('@')[0] || 'Absolvent';

      const { certificateService } = await import('./certificateService');
      const certificateUrl = await certificateService.issueCertificate(path, recipientName);

      console.log('[CareerVision] ✅ Certificate generated:', certificateUrl);
      return certificateUrl;
    } catch (error: any) {
      console.error('[CareerVision] Certificate generation failed:', error.message);
      throw error;
    }
  }
}

export const careerService = CareerVisionService;
