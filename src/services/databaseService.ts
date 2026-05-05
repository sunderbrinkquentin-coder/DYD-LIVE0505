// src/services/databaseService.ts
import { supabase } from '../lib/supabase';
import { sessionManager } from '../utils/sessionManager';
import { CV_BUCKET } from '../config/storage';
import type {
  Profile,
  ProfileInsert,
  ProfileUpdate,
  UploadedCV,
  UploadedCVInsert,
  AgentResponse,
  AgentResponseInsert,
  AgentResponseUpdate,
  JobApplication,
  JobApplicationInsert,
  JobApplicationUpdate,
  AgentProgress,
  AgentProgressInsert,
  AgentProgressUpdate,
} from '../types/database';

export class DatabaseService {
  private static instance: DatabaseService;
  private profileId: string | null = null;
  private updateTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private pendingUpdates: Map<string, any> = new Map();

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  // ----------------------------------------------------
  // PROFILE
  // ----------------------------------------------------

  async getOrCreateProfile(): Promise<Profile> {
    const sessionId = sessionManager.getSessionId();

    const { data: existing, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (fetchError) {
      throw new Error(`Failed to fetch profile: ${fetchError.message}`);
    }

    if (existing) {
      this.profileId = existing.id;
      return existing;
    }

    const profileData: ProfileInsert = {
      user_id: null,
      session_id: sessionId,
      email: null,
      full_name: null,
      status: 'anonymous',
      is_anonymous: true,
      registered_at: null,
    };

    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (insertError || !newProfile) {
      throw new Error(`Failed to create profile: ${insertError?.message}`);
    }

    this.profileId = newProfile.id;
    return newProfile;
  }

  debouncedUpdateProfile(updates: ProfileUpdate, delay: number = 1500): Promise<void> {
    return new Promise((resolve, reject) => {
      const key = 'profile';

      if (this.updateTimeouts.has(key)) {
        clearTimeout(this.updateTimeouts.get(key)!);
      }

      this.pendingUpdates.set(key, { ...this.pendingUpdates.get(key), ...updates });

      const timeout = setTimeout(async () => {
        try {
          const allUpdates = this.pendingUpdates.get(key);
          this.pendingUpdates.delete(key);
          this.updateTimeouts.delete(key);

          await this.updateProfile(allUpdates);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.updateTimeouts.set(key, timeout);
    });
  }

  async updateProfile(updates: ProfileUpdate): Promise<Profile> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Failed to update profile: ${error?.message}`);
      }

      return data;
    }

    const sessionId = sessionManager.getSessionId();

    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('session_id', sessionId)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update profile: ${error?.message}`);
    }

    return data;
  }

  // ----------------------------------------------------
  // AGENT RESPONSES
  // ----------------------------------------------------

  async upsertAgentResponse(
    sectionId: string,
    responses: Record<string, any>,
    status: 'in_progress' | 'completed' | 'skipped' = 'in_progress'
  ): Promise<AgentResponse> {
    const profile = await this.getOrCreateProfile();
    const sessionId = sessionManager.getSessionId();

    const { data: existing } = await supabase
      .from('agent_responses')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    const updateData: Record<string, any> = {
      [sectionId]: responses,
      updated_at: new Date().toISOString(),
    };

    if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    }

    if (existing) {
      const { data, error } = await supabase
        .from('agent_responses')
        .update(updateData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Failed to update agent response: ${error?.message}`);
      }

      return data;
    }

    const responseData: AgentResponseInsert = {
      profile_id: profile.id,
      session_id: sessionId,
      cv_id: null,
      status,
      abschluss: sectionId === 'abschluss' ? responses : null,
      skills: sectionId === 'skills' ? responses : null,
      zertifikate: sectionId === 'zertifikate' ? responses : null,
      kontakt: sectionId === 'kontakt' ? responses : null,
      sprachen: sectionId === 'sprachen' ? responses : null,
      projekte: sectionId === 'projekte' ? responses : null,
      berufserfahrung: sectionId === 'berufserfahrung' ? responses : null,
      bildung: sectionId === 'bildung' ? responses : null,
      completed_at: status === 'completed' ? new Date().toISOString() : null,
    };

    const { data, error } = await supabase
      .from('agent_responses')
      .insert(responseData)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to insert agent response: ${error?.message}`);
    }

    return data;
  }

  async getAgentResponses(): Promise<AgentResponse | null> {
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        const { data, error } = await supabase
          .from('agent_responses')
          .select('*')
          .eq('profile_id', profile.id)
          .maybeSingle();

        if (error) {
          throw new Error(`Failed to fetch agent responses: ${error.message}`);
        }

        return data;
      }
    }

    const profile = await this.getOrCreateProfile();

    const { data, error } = await supabase
      .from('agent_responses')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch agent responses: ${error.message}`);
    }

    return data;
  }

  async deleteAgentResponse(sectionId: string): Promise<void> {
    const profile = await this.getOrCreateProfile();

    const { data: existing } = await supabase
      .from('agent_responses')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (!existing) {
      return;
    }

    const { error } = await supabase
      .from('agent_responses')
      .update({ [sectionId]: null })
      .eq('id', existing.id);

    if (error) {
      throw new Error(`Failed to delete agent response: ${error.message}`);
    }
  }

  // ----------------------------------------------------
  // AGENT PROGRESS
  // ----------------------------------------------------

  async upsertAgentProgress(progressData: Partial<AgentProgressUpdate>): Promise<AgentProgress> {
    const profile = await this.getOrCreateProfile();
    const sessionId = sessionManager.getSessionId();

    const { data: existing } = await supabase
      .from('agent_progress')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (existing) {
      const { data, error } = await supabase
        .from('agent_progress')
        .update({
          ...progressData,
          last_active_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error || !data) {
        throw new Error(`Failed to update agent progress: ${error?.message}`);
      }

      return data;
    }

    const insertData: AgentProgressInsert = {
      profile_id: profile.id,
      session_id: sessionId,
      cv_id: null,
      current_section_id: progressData.current_section_id || null,
      current_section_index: progressData.current_section_index || 0,
      current_question_index: progressData.current_question_index || 0,
      completed_sections: progressData.completed_sections || {},
    };

    const { data, error } = await supabase
      .from('agent_progress')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to insert agent progress: ${error?.message}`);
    }

    return data;
  }

  async getAgentProgress(): Promise<AgentProgress | null> {
    const profile = await this.getOrCreateProfile();

    const { data, error } = await supabase
      .from('agent_progress')
      .select('*')
      .eq('profile_id', profile.id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch agent progress: ${error.message}`);
    }

    return data;
  }

  // ----------------------------------------------------
  // JOB APPLICATIONS
  // ----------------------------------------------------

  async createJobApplication(appData: Omit<JobApplicationInsert, 'profile_id' | 'session_id'>): Promise<JobApplication> {
    console.log('[databaseService:createJobApplication] Starting with data:', JSON.stringify(appData, null, 2));

    const profile = await this.getOrCreateProfile();
    const sessionId = sessionManager.getSessionId();
    const { data: { user } } = await supabase.auth.getUser();

    console.log('[databaseService:createJobApplication] Profile ID:', profile.id);
    console.log('[databaseService:createJobApplication] Session ID:', sessionId);
    console.log('[databaseService:createJobApplication] User ID:', user?.id || 'null');

    const insertData: JobApplicationInsert = {
      ...appData,
      profile_id: profile.id,
      session_id: sessionId,
      user_id: user?.id || null,
    };

    console.log('[databaseService:createJobApplication] Final insert data:', JSON.stringify(insertData, null, 2));
    console.log('[databaseService:createJobApplication] Stelleninformationen:');
    console.log('  - rolle:', insertData.rolle);
    console.log('  - unternehmen:', insertData.unternehmen);
    console.log('  - stellenbeschreibung:', insertData.stellenbeschreibung);

    const { data, error } = await supabase
      .from('job_application')
      .insert(insertData)
      .select()
      .single();

    if (error || !data) {
      console.error('[databaseService:createJobApplication] INSERT failed:', error);
      throw new Error(`Failed to create job application: ${error?.message}`);
    }

    console.log('[databaseService:createJobApplication] INSERT successful, created record:', JSON.stringify(data, null, 2));

    return data;
  }

  async updateJobApplication(id: string, updates: JobApplicationUpdate): Promise<JobApplication> {
    const { data, error } = await supabase
      .from('job_application')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update job application: ${error?.message}`);
    }

    return data;
  }

  async getJobApplications(): Promise<JobApplication[]> {
    const profile = await this.getOrCreateProfile();

    const { data, error } = await supabase
      .from('job_application')
      .select('*')
      .eq('profile_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch job applications: ${error.message}`);
    }

    return data || [];
  }

  async getJobApplicationById(id: string): Promise<JobApplication | null> {
    const { data, error } = await supabase
      .from('job_application')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch job application: ${error.message}`);
    }

    return data;
  }

  async deleteJobApplication(id: string): Promise<void> {
    const { error } = await supabase
      .from('job_application')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete job application: ${error.message}`);
    }
  }

  debouncedUpdateJobApplication(id: string, updates: JobApplicationUpdate, delay: number = 1500): Promise<void> {
    return new Promise((resolve, reject) => {
      const key = `job_application_${id}`;

      if (this.updateTimeouts.has(key)) {
        clearTimeout(this.updateTimeouts.get(key)!);
      }

      this.pendingUpdates.set(key, { ...this.pendingUpdates.get(key), ...updates });

      const timeout = setTimeout(async () => {
        try {
          const allUpdates = this.pendingUpdates.get(key);
          this.pendingUpdates.delete(key);
          this.updateTimeouts.delete(key);

          await this.updateJobApplication(id, allUpdates);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.updateTimeouts.set(key, timeout);
    });
  }

  // ----------------------------------------------------
  // BASE DATA
  // ----------------------------------------------------

  async getBaseData(): Promise<any | null> {
    const sessionId = sessionManager.getSessionId();

    const { data, error } = await supabase
      .from('base_data')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to fetch base_data: ${error.message}`);
    }

    return data;
  }

  // ----------------------------------------------------
  // CV UPLOAD + ANALYSE-FLOW (wichtiger Teil)
  // ----------------------------------------------------


  getProfileId(): string | null {
    return this.profileId;
  }

  // ----------------------------------------------------
  // USER SETTINGS / PROFILE SHORTCUTS
  // ----------------------------------------------------

  async getUserSettings(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch user settings: ${error.message}`);
    return data;
  }

  async updateUserSettings(updates: any): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('user_settings')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw new Error(`Failed to update user settings: ${error.message}`);
    return data;
  }

  async getProfile(): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw new Error(`Failed to fetch profile: ${error.message}`);
    return data;
  }

  // ----------------------------------------------------
  // AGENT DATA → BASE_DATA
  // ----------------------------------------------------

  debouncedUpdateAgentResponse(section: string, data: any, delay: number = 1500): Promise<void> {
    return new Promise((resolve, reject) => {
      const key = `agent_response_${section}`;

      if (this.updateTimeouts.has(key)) {
        clearTimeout(this.updateTimeouts.get(key)!);
      }

      this.pendingUpdates.set(key, data);

      const timeout = setTimeout(async () => {
        try {
          const dataToUpdate = this.pendingUpdates.get(key);
          this.pendingUpdates.delete(key);
          this.updateTimeouts.delete(key);

          await this.updateAgentResponse(section, dataToUpdate);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.updateTimeouts.set(key, timeout);
    });
  }

  async updateAgentResponse(section: string, data: any): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();

    let profileId: string;

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profile) {
        profileId = profile.id;
      } else {
        const createdProfile = await this.getOrCreateProfile();
        profileId = createdProfile.id;
      }
    } else {
      const createdProfile = await this.getOrCreateProfile();
      profileId = createdProfile.id;
    }

    const { data: existing } = await supabase
      .from('agent_responses')
      .select('*')
      .eq('profile_id', profileId)
      .maybeSingle();

    const sectionMap: Record<string, string> = {
      education: 'bildung',
      experience: 'berufserfahrung',
      projects: 'projekte',
      languages: 'sprachen',
      certificates: 'zertifikate',
    };

    const dbColumn = sectionMap[section] || section;

    console.log('[updateAgentResponse] section:', section, '→ dbColumn:', dbColumn);
    console.log('[updateAgentResponse] data:', JSON.stringify(data, null, 2));

    const updateData: Record<string, any> = {
      [dbColumn]: data,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      await supabase
        .from('agent_responses')
        .update(updateData)
        .eq('id', existing.id);
    } else {
      const sessionId = sessionManager.getSessionId();
      const responseData: AgentResponseInsert = {
        profile_id: profileId,
        session_id: sessionId,
        cv_id: null,
        status: 'in_progress',
        abschluss: dbColumn === 'abschluss' ? data : null,
        skills: dbColumn === 'skills' ? data : null,
        zertifikate: dbColumn === 'zertifikate' ? data : null,
        kontakt: dbColumn === 'kontakt' ? data : null,
        sprachen: dbColumn === 'sprachen' ? data : null,
        projekte: dbColumn === 'projekte' ? data : null,
        berufserfahrung: dbColumn === 'berufserfahrung' ? data : null,
        bildung: dbColumn === 'bildung' ? data : null,
        completed_at: null,
      };

      await supabase
        .from('agent_responses')
        .insert(responseData);
    }
  }

  async saveOnboardingToBaseData(onboardingData: {
    reason: string;
    industry: string;
    experienceLevel: string;
  }): Promise<void> {
    const profile = await this.getOrCreateProfile();
    const sessionId = sessionManager.getSessionId();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: existing } = await supabase
      .from('base_data')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    const baseData = {
      user_id: user?.id || null,
      profile_id: profile.id,
      session_id: sessionId,
      onboarding_reason: onboardingData.reason,
      onboarding_industry: onboardingData.industry,
      onboarding_experience_level: onboardingData.experienceLevel,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await supabase
        .from('base_data')
        .update(baseData)
        .eq('id', existing.id);

      if (error) {
        throw new Error(`Failed to update base_data: ${error.message}`);
      }
    } else {
      const { error } = await supabase
        .from('base_data')
        .insert(baseData);

      if (error) {
        throw new Error(`Failed to insert base_data: ${error.message}`);
      }
    }
  }

  debouncedSaveAgentDataToBaseData(
    agentData: {
      contact: any;
      bildung: any[];
      berufserfahrung: any[];
      skills: {
        hard: string[];
        soft: string[];
        top: string[];
      };
      projekte: any[];
      sprachen: any[];
      zertifikate: any[];
      zusaetzlich?: string;
    },
    delay: number = 2000,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const key = 'base_data';

      if (this.updateTimeouts.has(key)) {
        clearTimeout(this.updateTimeouts.get(key)!);
      }

      this.pendingUpdates.set(key, agentData);

      const timeout = setTimeout(async () => {
        try {
          const dataToSave = this.pendingUpdates.get(key);
          this.pendingUpdates.delete(key);
          this.updateTimeouts.delete(key);

          await this.saveAgentDataToBaseData(dataToSave);
          resolve();
        } catch (error) {
          reject(error);
        }
      }, delay);

      this.updateTimeouts.set(key, timeout);
    });
  }

  async saveAgentDataToBaseData(agentData: {
    contact: any;
    bildung: any[];
    berufserfahrung: any[];
    skills: {
      hard: string[];
      soft: string[];
      top: string[];
    };
    projekte: any[];
    sprachen: any[];
    zertifikate: any[];
    zusaetzlich?: string;
  }): Promise<void> {
    const profile = await this.getOrCreateProfile();
    const sessionId = sessionManager.getSessionId();
    const { data: { user } } = await supabase.auth.getUser();

    const { data: existing } = await supabase
      .from('base_data')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    console.log('[saveAgentDataToBaseData] Incoming bildung data:', JSON.stringify(agentData.bildung, null, 2));
    console.log('[saveAgentDataToBaseData] bildung array length:', agentData.bildung?.length || 0);

    const baseData = {
      user_id: user?.id || null,
      profile_id: profile.id,
      session_id: sessionId,
      vorname: agentData.contact?.vorname || null,
      nachname: agentData.contact?.nachname || null,
      email: agentData.contact?.email || null,
      telefon: agentData.contact?.telefon || null,
      ort: agentData.contact?.ort || null,
      plz: agentData.contact?.plz || null,
      linkedin: agentData.contact?.linkedin || null,
      website: agentData.contact?.website || null,
      bildung_entries: agentData.bildung || [],
      berufserfahrung_entries: agentData.berufserfahrung || [],
      projekte_entries: agentData.projekte || [],
      sprachen_list: agentData.sprachen || [],
      zertifikate_entries: agentData.zertifikate || [],
      hard_skills: agentData.skills?.hard || [],
      soft_skills: agentData.skills?.soft || [],
      top_skills: agentData.skills?.top || [],
      zusaetzliche_infos: agentData.zusaetzlich || null,
      updated_at: new Date().toISOString(),
    };

    console.log('[saveAgentDataToBaseData] baseData.bildung_entries:', JSON.stringify(baseData.bildung_entries, null, 2));

    if (existing) {
      const { error } = await supabase
        .from('base_data')
        .update(baseData)
        .eq('id', existing.id);

      if (error) {
        throw new Error(`Failed to update base_data: ${error.message}`);
      }
    } else {
      const { error } = await supabase
        .from('base_data')
        .insert(baseData);

      if (error) {
        throw new Error(`Failed to insert base_data: ${error.message}`);
      }
    }
  }

  // ----------------------------------------------------
  // MISC
  // ----------------------------------------------------

  flushPendingUpdates(): void {
    this.updateTimeouts.forEach((timeout) => clearTimeout(timeout));
    this.updateTimeouts.clear();
    this.pendingUpdates.clear();
  }

  hasPendingUpdates(): boolean {
    return this.updateTimeouts.size > 0;
  }
}

export const dbService = DatabaseService.getInstance();
