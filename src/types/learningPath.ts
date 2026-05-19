export interface Skill {
  name: string;
  category?: string;
  priority?: 'high' | 'medium' | 'low';
  estimatedTime?: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  skills: string[];
  estimatedDuration: string;
  resources?: {
    type: 'course' | 'book' | 'article' | 'video' | 'practice';
    title: string;
    url?: string;
    provider?: string;
  }[];
  milestones: string[];
  order: number;
}

export interface Curriculum {
  totalDuration: string;
  modules: LearningModule[];
  prerequisites?: string[];
  careerProgression?: string[];
}

export interface ModuleProgress {
  moduleId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  completedMilestones: string[];
  startedAt?: string;
  completedAt?: string;
  notes?: string;
}

export interface LearningPath {
  id: string;
  user_id?: string;
  session_id?: string;
  cv_id?: string;
  target_job: string;
  target_company?: string;
  vision_description?: string;
  industry?: string;
  missing_skills: Skill[];
  current_skills?: Skill[];
  match_score?: number;
  strategic_outlook_2026?: string;
  curriculum?: Curriculum;
  progress: Record<string, ModuleProgress>;
  status: 'analyzing' | 'curriculum_ready' | 'in_progress' | 'completed';
  is_paid: boolean;
  certificate_issued_at?: string;
  certificate_url?: string;
  created_at: string;
  updated_at: string;
}

export interface VisionAnalysisRequest {
  target_job: string;
  target_company?: string;
  vision_description?: string;
  cv_data?: any;
  cv_id?: string;
  user_id?: string;
  session_id: string;
}

export interface VisionAnalysisResponse {
  missing_skills: Skill[];
  current_skills?: Skill[];
  career_insights?: {
    currentLevel?: string;
    targetLevel: string;
    estimatedTimeframe: string;
    keyGaps: string[];
    recommendations: string[];
  };
}

export interface SkillAssessment {
  skill: string;
  hasSkill: boolean;
  proficiencyLevel?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  notes?: string;
}

export interface CurriculumGenerationRequest {
  missing_skills: Skill[];
  target_job: string;
  current_skills?: Skill[];
  timeframe?: '3_months' | '6_months' | '12_months' | '24_months';
  learning_style?: 'hands_on' | 'theoretical' | 'balanced';
}

export interface CurriculumGenerationResponse {
  curriculum: Curriculum;
  estimatedCost?: string;
  successRate?: string;
}

export interface Certificate {
  recipient_name: string;
  target_job: string;
  mastered_skills: string[];
  completion_date: string;
  certificate_id: string;
  issuer: string;
  dqr_reference?: string;
  verification_footer?: string;
}
