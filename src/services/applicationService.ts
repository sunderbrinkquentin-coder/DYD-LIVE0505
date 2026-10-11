import { supabase } from '../lib/supabase';
import type {
  ApplicationEvent,
  ApplicationEventType,
  ApplicationStatus,
  ApplicationUpdate,
  InterviewFormat,
  TrackedApplication,
} from '../types/applications';

const APP_SELECT = '*, cv:stored_cvs(id, pdf_url, file_name)';

export const applicationService = {
  async list(): Promise<TrackedApplication[]> {
    const { data, error } = await supabase
      .from('tracked_applications')
      .select(APP_SELECT)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as TrackedApplication[];
  },

  async create(input: ApplicationUpdate & { job_title: string }): Promise<TrackedApplication> {
    const { data, error } = await supabase
      .from('tracked_applications')
      .insert(input)
      .select(APP_SELECT)
      .single();
    if (error) throw error;
    return data as TrackedApplication;
  },

  async update(id: string, patch: ApplicationUpdate): Promise<TrackedApplication> {
    const { data, error } = await supabase
      .from('tracked_applications')
      .update(patch)
      .eq('id', id)
      .select(APP_SELECT)
      .single();
    if (error) throw error;
    return data as TrackedApplication;
  },

  setStatus(id: string, status: ApplicationStatus) {
    return this.update(id, { status });
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('tracked_applications').delete().eq('id', id);
    if (error) throw error;
  },

  async listEvents(applicationId: string): Promise<ApplicationEvent[]> {
    const { data, error } = await supabase
      .from('application_events')
      .select('*')
      .eq('application_id', applicationId)
      .order('occurred_at', { ascending: false });
    if (error) throw error;
    return (data ?? []) as ApplicationEvent[];
  },

  /** Alle kommenden Interviews des Users (für Karten + KPI) */
  async listUpcomingInterviews(): Promise<ApplicationEvent[]> {
    const { data, error } = await supabase
      .from('application_events')
      .select('*')
      .eq('type', 'interview')
      .gte('scheduled_at', new Date(Date.now() - 2 * 3600_000).toISOString())
      .order('scheduled_at', { ascending: true });
    if (error) throw error;
    return (data ?? []) as ApplicationEvent[];
  },

  /** Erste Rückmeldung je Bewerbung (für "Ø Tage bis Rückmeldung") */
  async listFirstResponses(): Promise<{ application_id: string; occurred_at: string }[]> {
    const { data, error } = await supabase
      .from('application_events')
      .select('application_id, occurred_at, to_status')
      .eq('type', 'status_change')
      .in('to_status', ['interview', 'offer', 'rejected'])
      .order('occurred_at', { ascending: true });
    if (error) throw error;
    const first = new Map<string, string>();
    for (const e of data ?? []) if (!first.has(e.application_id)) first.set(e.application_id, e.occurred_at);
    return [...first].map(([application_id, occurred_at]) => ({ application_id, occurred_at }));
  },

  async addEvent(input: {
    application_id: string;
    type: ApplicationEventType;
    title: string;
    details?: string | null;
    occurred_at?: string;
    scheduled_at?: string | null;
    meta?: Record<string, unknown>;
  }): Promise<ApplicationEvent> {
    const { data, error } = await supabase.from('application_events').insert(input).select('*').single();
    if (error) throw error;
    return data as ApplicationEvent;
  },

  async scheduleInterview(app: TrackedApplication, when: Date, format: InterviewFormat, details?: string) {
    const round = Math.max(app.interview_round, 0) + 1;
    const event = await this.addEvent({
      application_id: app.id,
      type: 'interview',
      title: `Interview Runde ${round}`,
      details: details || null,
      scheduled_at: when.toISOString(),
      meta: { round, format },
    });
    const updated = await this.update(app.id, {
      status: 'interview',
      interview_round: round,
      next_action: `Interview Runde ${round}`,
      next_action_due: toDateInput(when),
    });
    return { event, application: updated };
  },
};

// ─── Datums-Helfer (lokale Zeit, keine UTC-Verschiebung) ───────────────
export function toDateInput(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const [y, m, d] = dateStr.slice(0, 10).split('-').map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function formatDateDE(dateStr: string | null, withYear = false): string {
  if (!dateStr) return '';
  const date = dateStr.length <= 10 ? new Date(`${dateStr}T12:00:00`) : new Date(dateStr);
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', ...(withYear ? { year: 'numeric' } : {}) });
}

export function formatSalary(app: Pick<TrackedApplication, 'salary_min' | 'salary_max'>): string {
  const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));
  if (app.salary_min && app.salary_max) return `${k(app.salary_min)}–${k(app.salary_max)}`;
  if (app.salary_min) return `ab ${k(app.salary_min)}`;
  if (app.salary_max) return `bis ${k(app.salary_max)}`;
  return '';
}

/** .ics-Datei für einen Interviewtermin erzeugen und herunterladen */
export function downloadInterviewIcs(app: TrackedApplication, event: ApplicationEvent, durationMin = 60) {
  if (!event.scheduled_at) return;
  const start = new Date(event.scheduled_at);
  const end = new Date(start.getTime() + durationMin * 60_000);
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const esc = (s: string) => s.replace(/[\\;,]/g, (c) => `\\${c}`).replace(/\n/g, '\\n');
  const summary = `${event.title}: ${app.job_title}${app.company ? ` @ ${app.company}` : ''}`;
  const description = [event.details, app.contact_name && `Kontakt: ${app.contact_name}`, app.job_url]
    .filter(Boolean)
    .join('\n');
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Decide Your Dream//Bewerbungsmanagement//DE',
    'BEGIN:VEVENT',
    `UID:${event.id}@decide-your-dream.de`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${esc(summary)}`,
    description ? `DESCRIPTION:${esc(description)}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${esc(summary)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `interview-${(app.company || 'termin').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
