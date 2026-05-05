import { supabase } from '../lib/supabase';

export class DataMigrationService {
  private sessionId: string;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    const existingSessionId = localStorage.getItem('dyd_session_id');
    if (existingSessionId) {
      return existingSessionId;
    }

    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('dyd_session_id', newSessionId);
    return newSessionId;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  async migrateToUser(userId: string, tempId?: string | null): Promise<{ success: boolean; error?: string }> {
    try {
      const migrationTasks: Promise<any>[] = [
        supabase
          .from('stored_cvs')
          .update({ user_id: userId })
          .eq('session_id', this.sessionId)
          .is('user_id', null),

        supabase
          .from('job_matches')
          .update({ user_id: userId })
          .eq('session_id', this.sessionId)
          .is('user_id', null),
      ];

      if (tempId) {
        migrationTasks.push(
          supabase
            .from('stored_cvs')
            .update({ user_id: userId })
            .eq('temp_id', tempId)
            .is('user_id', null)
        );
      }

      const updates = await Promise.allSettled(migrationTasks);

      const hasErrors = updates.some(result => result.status === 'rejected');

      if (hasErrors) {
        console.error('Some migrations failed:', updates);
        return {
          success: false,
          error: 'Einige Daten konnten nicht migriert werden'
        };
      }

      console.log('Data migration successful for user:', userId);
      return { success: true };
    } catch (error) {
      console.error('Error migrating data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Migration fehlgeschlagen'
      };
    }
  }

  async saveOnboardingData(data: {
    fieldOfWork: string;
    experienceLevel: string;
    dreamRole: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('onboarding_data').insert({
        session_id: this.sessionId,
        field_of_work: data.fieldOfWork,
        experience_level: data.experienceLevel,
        dream_role: data.dreamRole,
      });

      if (error) {
        console.error('Error saving onboarding data:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Fehler beim Speichern'
      };
    }
  }

  async getSessionData(userId?: string) {
    try {
      const filter = userId
        ? { user_id: userId }
        : { session_id: this.sessionId };

      const [onboarding, cvs, conversations, optimizedCvs, jobMatches] = await Promise.all([
        supabase.from('onboarding_data').select('*').match(filter).maybeSingle(),
        supabase.from('cvs').select('*').match(filter),
        supabase.from('chat_conversations').select('*').match(filter),
        supabase.from('optimized_cvs').select('*').match(filter),
        supabase.from('job_matches').select('*').match(filter),
      ]);

      return {
        onboarding: onboarding.data,
        cvs: cvs.data || [],
        conversations: conversations.data || [],
        optimizedCvs: optimizedCvs.data || [],
        jobMatches: jobMatches.data || [],
      };
    } catch (error) {
      console.error('Error getting session data:', error);
      return null;
    }
  }

  migrateErfolgeToArray(experience: any[]): any[] {
    if (!experience || !Array.isArray(experience)) return experience;

    return experience.map(exp => {
      if (!exp.erfolge) return exp;

      if (typeof exp.erfolge === 'string') {
        const erfolgArray = exp.erfolge
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);

        return {
          ...exp,
          erfolge: erfolgArray,
          aufgaben: exp.aufgaben || exp.beschreibung || '',
        };
      }

      return {
        ...exp,
        aufgaben: exp.aufgaben || exp.beschreibung || '',
      };
    });
  }
}

export const dataMigrationService = new DataMigrationService();
