export type ApplicationStatus =
  | 'saved'
  | 'preparing'
  | 'applied'
  | 'interview'
  | 'offer'
  | 'accepted'
  | 'rejected'
  | 'withdrawn';

export type ApplicationEventType =
  | 'created'
  | 'status_change'
  | 'interview'
  | 'call'
  | 'email'
  | 'note'
  | 'follow_up';

export interface TrackedApplication {
  id: string;
  user_id: string;
  cv_id: string | null;
  job_title: string;
  company: string | null;
  location: string | null;
  job_url: string | null;
  job_description: string | null;
  source: string | null;
  status: ApplicationStatus;
  status_changed_at: string;
  applied_at: string | null; // YYYY-MM-DD
  interview_round: number;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  contact_name: string | null;
  contact_role: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  next_action: string | null;
  next_action_due: string | null; // YYYY-MM-DD
  notes: string | null;
  closing_reason: string | null;
  prep_checklist: Record<string, boolean>;
  /** Antworten aus dem Anschreiben-Fragebogen (werden wiederverwendet) */
  cover_letter_brief: import('./coverLetter').CoverLetterBrief | null;
  created_at: string;
  updated_at: string;
  /** per Join geladen: verknüpfter CV */
  cv?: { id: string; pdf_url: string | null; file_name: string | null } | null;
}

export interface ApplicationEvent {
  id: string;
  application_id: string;
  type: ApplicationEventType;
  title: string;
  details: string | null;
  from_status: ApplicationStatus | null;
  to_status: ApplicationStatus | null;
  scheduled_at: string | null;
  meta: { round?: number; format?: InterviewFormat; [k: string]: unknown };
  occurred_at: string;
}

export type InterviewFormat = 'video' | 'phone' | 'onsite';

export type ApplicationUpdate = Partial<
  Omit<TrackedApplication, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'status_changed_at' | 'cv'>
>;

export interface StatusMeta {
  id: ApplicationStatus;
  label: string;
  dot: string;
  chip: string;
  archived?: boolean;
}

export const STATUSES: StatusMeta[] = [
  { id: 'saved', label: 'Gemerkt', dot: 'bg-violet-400', chip: 'bg-violet-100 text-violet-700' },
  { id: 'preparing', label: 'In Vorbereitung', dot: 'bg-gray-400', chip: 'bg-gray-100 text-gray-700' },
  { id: 'applied', label: 'Beworben', dot: 'bg-blue-400', chip: 'bg-blue-100 text-blue-700' },
  { id: 'interview', label: 'Interview', dot: 'bg-sky-400', chip: 'bg-sky-100 text-sky-700' },
  { id: 'offer', label: 'Angebot', dot: 'bg-green-400', chip: 'bg-green-100 text-green-700' },
  { id: 'accepted', label: 'Zusage', dot: 'bg-[#30E3CA]', chip: 'bg-teal-100 text-teal-700' },
  { id: 'rejected', label: 'Absage', dot: 'bg-red-400', chip: 'bg-red-100 text-red-700', archived: true },
  { id: 'withdrawn', label: 'Zurückgezogen', dot: 'bg-gray-500', chip: 'bg-gray-200 text-gray-600', archived: true },
];

export const BOARD_STATUSES = STATUSES.filter((s) => !s.archived);
export const ARCHIVE_STATUSES = STATUSES.filter((s) => s.archived);
export const statusMeta = (id: ApplicationStatus) => STATUSES.find((s) => s.id === id)!;

export const INTERVIEW_FORMAT_LABEL: Record<InterviewFormat, string> = {
  video: 'Video',
  phone: 'Telefon',
  onsite: 'Vor Ort',
};
