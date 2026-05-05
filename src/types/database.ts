export interface Profile {
  id: string;
  user_id: string | null;
  session_id: string;
  email: string | null;
  full_name: string | null;
  status: 'anonymous' | 'registered' | 'active';
  is_anonymous: boolean;
  registered_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UploadedCV {
  id: string;
  profile_id: string;
  session_id: string;
  original_filename: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  extracted_text: string | null;
  extraction_status: 'pending' | 'processing' | 'completed' | 'failed';
  uploaded_at: string;
}

export interface AgentResponse {
  id: string;
  profile_id: string;
  session_id: string;
  cv_id: string | null;
  status: 'in_progress' | 'completed' | 'skipped';
  abschluss: Record<string, any> | null;
  skills: Record<string, any> | null;
  zertifikate: Record<string, any> | null;
  kontakt: Record<string, any> | null;
  sprachen: Record<string, any> | null;
  projekte: Record<string, any> | null;
  berufserfahrung: Record<string, any> | null;
  bildung: Record<string, any> | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  user_id: string | null;
  profile_id: string;
  session_id: string;
  vorname: string | null;
  nachname: string | null;
  email: string | null;
  telefon: string | null;
  ort: string | null;
  plz: string | null;
  linkedin: string | null;
  website: string | null;
  bildung_entries: Record<string, any>[] | null;
  berufserfahrung_entries: Record<string, any>[] | null;
  projekte_entries: Record<string, any>[] | null;
  sprachen_list: Record<string, any>[] | null;
  zertifikate_entries: Record<string, any>[] | null;
  hard_skills: string[] | null;
  soft_skills: string[] | null;
  top_skills: string[] | null;
  zusaetzliche_infos: string | null;
  rolle: string;
  unternehmen: string;
  stellenbeschreibung: string | null;
  berufserfahrung_entries_optimiert: Record<string, any>[] | null;
  projekte_entries_optimiert: Record<string, any>[] | null;
  skills_optimiert: Record<string, any> | null;
  profile_summary: string | null;
  sales: string | null;
  optimized_cv_html: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface AgentProgress {
  id: string;
  profile_id: string;
  session_id: string;
  cv_id: string | null;
  current_section_id: string | null;
  current_section_index: number;
  current_question_index: number;
  completed_sections: Record<string, any>;
  last_active_at: string;
  updated_at: string;
}

export type ProfileInsert = Omit<Profile, 'id' | 'created_at' | 'updated_at'>;
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'session_id' | 'created_at'>>;

export type UploadedCVInsert = Omit<UploadedCV, 'id' | 'uploaded_at'>;
export type UploadedCVUpdate = Partial<Omit<UploadedCV, 'id' | 'profile_id' | 'session_id' | 'uploaded_at'>>;

export type AgentResponseInsert = Omit<AgentResponse, 'id' | 'created_at' | 'updated_at'>;
export type AgentResponseUpdate = Partial<Omit<AgentResponse, 'id' | 'profile_id' | 'session_id' | 'created_at'>>;

export type JobApplicationInsert = Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>;
export type JobApplicationUpdate = Partial<Omit<JobApplication, 'id' | 'created_at'>>;

export type AgentProgressInsert = Omit<AgentProgress, 'id' | 'last_active_at' | 'updated_at'>;
export type AgentProgressUpdate = Partial<Omit<AgentProgress, 'id' | 'profile_id' | 'session_id'>>;
