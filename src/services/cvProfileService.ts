// src/services/cvProfileService.ts
// Zentrale Schnittstelle für den Status Quo (Grunddaten) eines Users.
// EINE Quelle der Wahrheit: cv_profiles. Alle Flows (Wizard, One-Click,
// Dashboard-Anzeige) lesen und schreiben ausschließlich über diesen Service.

import { supabase } from '../lib/supabase';
import { mapEditorDataToWizard } from '../utils/cvDataMapper';

export interface CvProfile {
  id: string;
  user_id: string;
  cv_data: any; // Wizard-Format
  source: 'wizard' | 'cv_upload' | 'manual_edit' | 'migrated';
  created_at: string;
  updated_at: string;
}

// ---------- Format-Helper (aus DashboardPage hierher gezogen — ab jetzt
// importieren alle Komponenten diese Funktionen von hier) ----------

export function hasWizardContent(data: any): boolean {
  return !!(
    data &&
    typeof data === 'object' &&
    (data.personalData?.firstName ||
      (data.workExperiences?.length ?? 0) > 0 ||
      (data.hardSkills?.length ?? 0) > 0 ||
      (data.schoolEducation?.length ?? 0) > 0 ||
      (data.professionalEducation?.length ?? 0) > 0)
  );
}

/** Rohes cv_data (String/Objekt, Wizard-/Optimizer-Format) → Wizard-Format oder null. */
export function normalizeCvData(raw: any): any | null {
  let data = raw;
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      return null;
    }
  }
  if (!data || typeof data !== 'object') return null;

  if (hasWizardContent(data)) return data;

  const isOptimizerFormat = Array.isArray(data.sections) || data.contact || data.experience;
  if (isOptimizerFormat) {
    try {
      const mapped = mapEditorDataToWizard(data);
      return hasWizardContent(mapped) ? mapped : null;
    } catch {
      return null;
    }
  }
  return null;
}

// ---------- Service ----------

export const cvProfileService = {
  /** Profil laden (null, wenn noch keins existiert). */
  async getProfile(userId: string): Promise<CvProfile | null> {
    const { data, error } = await supabase
      .from('cv_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('[cvProfileService] Error loading profile:', error);
      return null;
    }
    return data as CvProfile | null;
  },

  /** Profil speichern/aktualisieren (Upsert auf user_id). cvData muss Wizard-Format sein. */
  async saveProfile(
    userId: string,
    cvData: any,
    source: CvProfile['source'] = 'wizard'
  ): Promise<CvProfile | null> {
    const normalized = normalizeCvData(cvData);
    if (!normalized) {
      console.warn('[cvProfileService] saveProfile: keine verwertbaren Daten, skip');
      return null;
    }

    const { data, error } = await supabase
      .from('cv_profiles')
      .upsert(
        { user_id: userId, cv_data: normalized, source },
        { onConflict: 'user_id' }
      )
      .select()
      .maybeSingle();

    if (error) {
      console.error('[cvProfileService] Error saving profile:', error);
      return null;
    }
    return data as CvProfile | null;
  },

  /**
   * Profil holen — und falls noch keins existiert, einmalig aus dem
   * reichhaltigsten bestehenden stored_cv migrieren (Bestandsuser).
   * Das ersetzt die bisherige pickRichestCv-Heuristik im Dashboard:
   * sie läuft nur noch GENAU EINMAL pro User, danach gilt das Profil.
   */
  async ensureProfile(userId: string): Promise<CvProfile | null> {
    const existing = await this.getProfile(userId);
    if (existing && hasWizardContent(existing.cv_data)) return existing;

    // Migration: besten Kandidaten aus stored_cvs ziehen
    const { data: cvs } = await supabase
      .from('stored_cvs')
      .select('id, cv_data, source, updated_at')
      .eq('user_id', userId)
      .neq('source', 'check')
      .order('updated_at', { ascending: false });

    for (const cv of cvs ?? []) {
      const normalized = normalizeCvData(cv.cv_data);
      if (normalized) {
        console.log('[cvProfileService] Migrating profile from stored_cv:', cv.id);
        return this.saveProfile(userId, normalized, 'migrated');
      }
    }
    return existing; // ggf. leeres Profil oder null
  },

  /**
   * Vollständigkeit in Prozent — für die Status-Quo-Karte im Dashboard.
   * Gewichtung bewusst simpel; bei Bedarf anpassen.
   */
  computeCompleteness(cvData: any): { percent: number; missing: string[] } {
    const checks: Array<[string, boolean]> = [
      ['Persönliche Daten', !!cvData?.personalData?.firstName],
      ['Kontakt', !!(cvData?.personalData?.email || cvData?.personalData?.phone)],
      ['Berufserfahrung', (cvData?.workExperiences?.length ?? 0) > 0],
      ['Ausbildung', ((cvData?.schoolEducation?.length ?? 0) + (cvData?.professionalEducation?.length ?? 0)) > 0],
      ['Hard Skills', (cvData?.hardSkills?.length ?? 0) > 0],
      ['Soft Skills', (cvData?.softSkills?.length ?? 0) > 0],
      ['Sprachen', (cvData?.languages?.length ?? 0) > 0],
    ];
    const done = checks.filter(([, ok]) => ok).length;
    const missing = checks.filter(([, ok]) => !ok).map(([label]) => label);
    return { percent: Math.round((done / checks.length) * 100), missing };
  },
};