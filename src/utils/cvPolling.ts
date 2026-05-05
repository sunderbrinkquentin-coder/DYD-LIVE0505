import { supabase } from '../lib/supabase';
import { mapEditorDataToWizard, CVBuilderData } from './cvDataMapper';

export interface PollOptions {
  uploadId: string;
  userId: string | null;
  tempId?: string;
  maxAttempts?: number;
  intervalMs?: number;
  onSuccess: (data: CVBuilderData) => void;
  onError: (msg: string) => void;
  onAttempt?: (attempt: number, max: number) => void;
}

function deepParseCvData(raw: any): CVBuilderData {
  let parsed = raw;

  // Unwrap up to 5 layers of JSON-string serialization (Make.com can double/triple serialize)
  for (let i = 0; i < 5; i++) {
    if (typeof parsed !== 'string') break;
    try { parsed = JSON.parse(parsed); } catch { break; }
  }

  if (parsed?.cv_data && typeof parsed.cv_data === 'string') {
    try { parsed = { ...parsed, cv_data: JSON.parse(parsed.cv_data) }; } catch {}
  }
  if (parsed?.editor_data && typeof parsed.editor_data === 'string') {
    try { parsed = { ...parsed, editor_data: JSON.parse(parsed.editor_data) }; } catch {}
  }

  if (!parsed || typeof parsed !== 'object') return {};

  // Priority 1: root object is already in wizard format
  if (
    parsed.personalData != null ||
    parsed.workExperiences != null ||
    parsed.experienceLevel != null
  ) {
    const workExperiences = (parsed.workExperiences || []).map((exp: any) => {
      if (Array.isArray(exp.tasksWithMetrics) && exp.tasksWithMetrics.length > 0) return exp;
      const bullets: string[] = Array.isArray(exp.bullets) ? exp.bullets.filter(Boolean) :
        Array.isArray(exp.tasks) ? exp.tasks.filter(Boolean) : [];
      return {
        ...exp,
        tasksWithMetrics: bullets.map((b: string) => ({ task: b, metrics: { description: b } })),
      };
    });
    return {
      ...parsed,
      workExperiences,
      projects: parsed.projects || [],
      hardSkills: parsed.hardSkills || [],
      softSkills: parsed.softSkills || [],
      professionalEducation: parsed.professionalEducation || [],
      languages: parsed.languages || [],
      workValues: parsed.workValues || { values: [], workStyle: [] },
      hobbies: parsed.hobbies || { hobbies: [], details: '' },
    } as CVBuilderData;
  }

  // Priority 2: editor_data sub-object in wizard format
  const ed = parsed.editor_data;
  if (ed && typeof ed === 'object') {
    if (ed.personalData != null || ed.workExperiences != null || ed.experienceLevel != null) {
      const edWorkExperiences = (ed.workExperiences || []).map((exp: any) => {
        if (Array.isArray(exp.tasksWithMetrics) && exp.tasksWithMetrics.length > 0) return exp;
        const bullets: string[] = Array.isArray(exp.bullets) ? exp.bullets.filter(Boolean) :
          Array.isArray(exp.tasks) ? exp.tasks.filter(Boolean) : [];
        return {
          ...exp,
          tasksWithMetrics: bullets.map((b: string) => ({ task: b, metrics: { description: b } })),
        };
      });
      return {
        ...ed,
        workExperiences: edWorkExperiences,
        projects: ed.projects || [],
        hardSkills: ed.hardSkills || [],
        softSkills: ed.softSkills || [],
        professionalEducation: ed.professionalEducation || [],
        languages: ed.languages || [],
        workValues: ed.workValues || { values: [], workStyle: [] },
        hobbies: ed.hobbies || { hobbies: [], details: '' },
      } as CVBuilderData;
    }
    // editor_data in legacy/Make format
    return mapEditorDataToWizard(ed);
  }

  // Priority 3: root has legacy Make/check format keys
  if (parsed.personal_data || parsed.experiences || parsed.contact || parsed.experience) {
    return mapEditorDataToWizard(parsed);
  }

  // Priority 4: nested cv_data object
  if (parsed.cv_data && typeof parsed.cv_data === 'object') {
    return deepParseCvData(parsed.cv_data);
  }

  // Fallback: try mapping whatever we have
  return mapEditorDataToWizard(parsed);
}

export function countPrefillFields(data: CVBuilderData): {
  total: number;
  categories: Array<{ label: string; count: number }>;
} {
  const categories: Array<{ label: string; count: number }> = [];
  let total = 0;

  const pd = data.personalData;
  if (pd) {
    const personalCount = [pd.firstName, pd.lastName, pd.email, pd.phone, pd.city].filter(Boolean).length;
    if (personalCount > 0) {
      categories.push({ label: 'Persönliche Daten', count: personalCount });
      total += personalCount;
    }
  }

  if (data.workExperiences?.length) {
    categories.push({ label: 'Berufserfahrung', count: data.workExperiences.length });
    total += data.workExperiences.length;
  }

  if (data.professionalEducation?.length) {
    categories.push({ label: 'Ausbildung', count: data.professionalEducation.length });
    total += data.professionalEducation.length;
  }

  if (data.hardSkills?.length) {
    categories.push({ label: 'Skills', count: data.hardSkills.length });
    total += data.hardSkills.length;
  }

  if (data.languages?.length) {
    categories.push({ label: 'Sprachen', count: data.languages.length });
    total += data.languages.length;
  }

  if (data.projects?.length) {
    categories.push({ label: 'Projekte', count: data.projects.length });
    total += data.projects.length;
  }

  return { total, categories };
}

function hasMeaningfulCvData(raw: any): boolean {
  if (!raw || typeof raw !== 'object') return false;
  const keys = Object.keys(raw);
  if (keys.length === 0) return false;
  const meaningfulKeys = [
    'personalData', 'workExperiences', 'experienceLevel',
    'personal_data', 'experiences', 'contact', 'experience',
    'editor_data', 'cv_data',
  ];
  return meaningfulKeys.some(k => raw[k] != null);
}

export function startCvPolling(options: PollOptions): () => void {
  const {
    uploadId,
    userId,
    tempId,
    maxAttempts = 50,
    intervalMs = 3000,
    onSuccess,
    onError,
    onAttempt,
  } = options;

  let attempts = 0;
  let stopped = false;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let realtimeChannel: ReturnType<typeof supabase.channel> | null = null;

  const stop = () => {
    stopped = true;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    if (realtimeChannel) {
      supabase.removeChannel(realtimeChannel);
      realtimeChannel = null;
    }
  };

  const checkRecord = async () => {
    if (stopped) return;

    attempts += 1;
    onAttempt?.(attempts, maxAttempts);

    if (attempts > maxAttempts) {
      stop();
      onError('Die Verarbeitung dauert zu lange. Bitte fülle die Felder manuell aus oder versuche es erneut.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('stored_cvs')
        .select('status, cv_data')
        .eq('id', uploadId)
        .maybeSingle();

      if (error) {
        console.warn(`[cvPolling] attempt ${attempts} – query error:`, error.message);
        return;
      }

      if (!data) {
        console.warn(`[cvPolling] attempt ${attempts} – record not found (id: ${uploadId})`);
        return;
      }

      console.log(`[cvPolling] attempt ${attempts} – status: ${data.status}, cv_data present: ${!!data.cv_data && Object.keys(data.cv_data ?? {}).length > 0}`);

      if (data.status === 'completed') {
        stop();
        const mapped = deepParseCvData(data.cv_data ?? {});
        onSuccess(mapped);
      } else if (data.status === 'failed') {
        stop();
        onError('Die Analyse ist fehlgeschlagen. Du kannst deinen CV auch manuell eingeben.');
      } else if (hasMeaningfulCvData(data.cv_data)) {
        console.log(`[cvPolling] cv_data is present with status still '${data.status}' — triggering success early`);
        stop();
        const mapped = deepParseCvData(data.cv_data ?? {});
        onSuccess(mapped);
      }
    } catch (err) {
      console.warn(`[cvPolling] attempt ${attempts} – unexpected error:`, err);
    }
  };

  realtimeChannel = supabase
    .channel(`cv-poll-${uploadId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stored_cvs',
        filter: `id=eq.${uploadId}`,
      },
      (payload) => {
        if (stopped) return;
        const record = payload.new as any;
        console.log('[cvPolling] realtime update – status:', record?.status);
        if (record?.status === 'completed') {
          stop();
          const mapped = deepParseCvData(record?.cv_data ?? {});
          onSuccess(mapped);
        } else if (record?.status === 'failed') {
          stop();
          onError('Die Analyse ist fehlgeschlagen. Du kannst deinen CV auch manuell eingeben.');
        } else if (hasMeaningfulCvData(record?.cv_data)) {
          console.log(`[cvPolling] realtime: cv_data present with status '${record?.status}' — triggering success early`);
          stop();
          const mapped = deepParseCvData(record?.cv_data ?? {});
          onSuccess(mapped);
        }
      }
    )
    .subscribe();

  checkRecord();
  intervalId = setInterval(checkRecord, intervalMs);

  return stop;
}
