import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus, CheckSquare, ExternalLink, FileText, Mail, MessageSquare, Phone, Square, Trash2, Video, X,
} from 'lucide-react';
import type {
  ApplicationEvent, ApplicationEventType, ApplicationStatus, ApplicationUpdate, InterviewFormat, TrackedApplication,
} from '../../../types/applications';
import { INTERVIEW_FORMAT_LABEL, STATUSES, statusMeta } from '../../../types/applications';
import {
  applicationService, downloadInterviewIcs, formatDateDE, toDateInput,
} from '../../../services/applicationService';
import type { CoverLetter } from '../../../types/coverLetter';
import { CoverLetterPanel } from './CoverLetterPanel';

interface ApplicationDrawerProps {
  app: TrackedApplication;
  onClose: () => void;
  onPatch: (id: string, patch: ApplicationUpdate) => Promise<void>;
  onStatusChange: (app: TrackedApplication, status: ApplicationStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onInterviewScheduled: (app: TrackedApplication, event: ApplicationEvent) => void;
  initialTab?: Tab;
  /** Rückkehr aus dem Stripe-Checkout für das Anschreiben */
  awaitingCoverLetterPayment?: boolean;
  onCoverLetterChange?: (letter: CoverLetter) => void;
}

export type Tab = 'details' | 'letter' | 'timeline' | 'prep';

const inputCls =
  'w-full rounded-lg border border-gray-200 px-2.5 py-1.5 text-[13px] text-gray-900 outline-none focus:border-[#66c0b6] focus:ring-2 focus:ring-[#66c0b6]/20';

const PREP_ITEMS = [
  { key: 'research', label: 'Unternehmen, Produkte & aktuelle News recherchiert' },
  { key: 'star', label: '3 STAR-Beispiele zu den Anforderungen vorbereitet' },
  { key: 'pitch', label: '60-Sekunden-Selbstvorstellung geübt' },
  { key: 'questions', label: '3 eigene Fragen an das Unternehmen notiert' },
  { key: 'salary', label: 'Gehaltsrahmen & Untergrenze festgelegt' },
  { key: 'logistics', label: 'Technik / Anfahrt & Unterlagen gecheckt' },
];

const EVENT_TYPES: { id: ApplicationEventType; label: string }[] = [
  { id: 'call', label: 'Telefonat' },
  { id: 'email', label: 'E-Mail' },
  { id: 'follow_up', label: 'Nachgefasst' },
  { id: 'note', label: 'Notiz' },
];

const EVENT_ICON: Partial<Record<ApplicationEventType, React.ReactNode>> = {
  call: <Phone className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  interview: <Video className="h-3 w-3" />,
  note: <MessageSquare className="h-3 w-3" />,
};

/** Textfeld, das erst beim Verlassen speichert */
function Field({
  label, value, onSave, type = 'text', placeholder, className = '',
}: {
  label: string;
  value: string | number | null;
  onSave: (v: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
}) {
  const [local, setLocal] = useState(value ?? '');
  useEffect(() => setLocal(value ?? ''), [value]);
  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] text-gray-500">{label}</label>
      <input
        className={inputCls}
        type={type}
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => String(local) !== String(value ?? '') && onSave(String(local))}
      />
    </div>
  );
}

function TextArea({ label, value, onSave, rows = 3, placeholder }: {
  label: string; value: string | null; onSave: (v: string) => void; rows?: number; placeholder?: string;
}) {
  const [local, setLocal] = useState(value ?? '');
  useEffect(() => setLocal(value ?? ''), [value]);
  return (
    <div>
      <label className="mb-1 block text-[11px] text-gray-500">{label}</label>
      <textarea
        className={inputCls}
        rows={rows}
        value={local}
        placeholder={placeholder}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() => local !== (value ?? '') && onSave(local)}
      />
    </div>
  );
}

const Section = ({ children }: { children: React.ReactNode }) => (
  <h4 className="mb-2 mt-5 text-[11px] font-bold uppercase tracking-wider text-gray-400">{children}</h4>
);

const nullIfEmpty = (v: string) => (v.trim() === '' ? null : v.trim());
const intOrNull = (v: string) => {
  const n = parseInt(v.replace(/\D/g, ''), 10);
  return Number.isFinite(n) ? n : null;
};

export function ApplicationDrawer({
  app, onClose, onPatch, onStatusChange, onDelete, onInterviewScheduled,
  initialTab = 'details', awaitingCoverLetterPayment, onCoverLetterChange,
}: ApplicationDrawerProps) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>(initialTab);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  const [evType, setEvType] = useState<ApplicationEventType>('call');
  const [evText, setEvText] = useState('');
  const [ivDate, setIvDate] = useState('');
  const [ivFormat, setIvFormat] = useState<InterviewFormat>('video');

  const save = (patch: ApplicationUpdate) => onPatch(app.id, patch);

  const loadEvents = () => {
    setEventsLoading(true);
    applicationService
      .listEvents(app.id)
      .then(setEvents)
      .catch((e) => console.error('[ApplicationDrawer] events', e))
      .finally(() => setEventsLoading(false));
  };

  useEffect(loadEvents, [app.id, app.status]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const nextInterview = events
    .filter((e) => e.type === 'interview' && e.scheduled_at && new Date(e.scheduled_at) > new Date())
    .sort((a, b) => a.scheduled_at!.localeCompare(b.scheduled_at!))[0];

  const addEvent = async () => {
    if (!evText.trim()) return;
    const label = EVENT_TYPES.find((t) => t.id === evType)!.label;
    await applicationService.addEvent({ application_id: app.id, type: evType, title: label, details: evText.trim() });
    if (evType === 'follow_up') {
      const d = new Date();
      d.setDate(d.getDate() + 7);
      await save({ next_action: 'Erneut nachfassen', next_action_due: toDateInput(d) });
    }
    setEvText('');
    loadEvents();
  };

  const scheduleInterview = async () => {
    if (!ivDate) return;
    const { event, application } = await applicationService.scheduleInterview(app, new Date(ivDate), ivFormat);
    setIvDate('');
    onInterviewScheduled(application, event);
    loadEvents();
  };

  const isClosed = statusMeta(app.status).archived;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/55" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-[520px] flex-col bg-white text-gray-900 shadow-2xl">
        {/* Header */}
        <div className="border-b border-gray-100 px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-bold leading-tight">{app.job_title}</h2>
              <p className="text-[13px] text-gray-500">
                {app.company || 'Unternehmen ergänzen'}
                {app.location ? ` · ${app.location}` : ''}
              </p>
            </div>
            <button onClick={onClose} className="rounded-lg bg-gray-100 p-1.5 hover:bg-gray-200" aria-label="Schließen">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => s.id !== app.status && onStatusChange(app, s.id)}
                className={`rounded-md px-2 py-0.5 text-[11px] font-medium transition-all ${
                  s.id === app.status ? `${s.chip} ring-1 ring-current` : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-100 px-5">
          {([
            ['details', 'Details'],
            ['letter', 'Anschreiben'],
            ['timeline', 'Timeline'],
            ['prep', 'Interview-Prep'],
          ] as [Tab, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`border-b-2 px-2 py-2.5 text-[13px] ${
                tab === id ? 'border-[#66c0b6] font-semibold text-gray-900' : 'border-transparent text-gray-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {tab === 'details' && (
            <>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Stelle" value={app.job_title} onSave={(v) => v.trim() && save({ job_title: v.trim() })} className="col-span-2" />
                <Field label="Unternehmen" value={app.company} onSave={(v) => save({ company: nullIfEmpty(v) })} />
                <Field label="Ort" value={app.location} onSave={(v) => save({ location: nullIfEmpty(v) })} />
                <Field label="Beworben am" type="date" value={app.applied_at} onSave={(v) => save({ applied_at: v || null })} />
                <Field label="Quelle" value={app.source} placeholder="LinkedIn, StepStone…" onSave={(v) => save({ source: nullIfEmpty(v) })} />
                <Field label="Gehalt min (€/Jahr)" type="number" value={app.salary_min} onSave={(v) => save({ salary_min: intOrNull(v) })} />
                <Field label="Gehalt max (€/Jahr)" type="number" value={app.salary_max} onSave={(v) => save({ salary_max: intOrNull(v) })} />
              </div>
              <div className="mt-2.5 flex items-end gap-2">
                <Field label="Link zur Stellenanzeige" type="url" value={app.job_url} placeholder="https://…" onSave={(v) => save({ job_url: nullIfEmpty(v) })} className="flex-1" />
                {app.job_url && (
                  <a href={app.job_url} target="_blank" rel="noreferrer" className="mb-0.5 rounded-lg border border-gray-200 p-2 text-gray-500 hover:text-[#3a9e94]">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>

              {isClosed ? (
                <>
                  <Section>Abschluss</Section>
                  <Field
                    label={app.status === 'rejected' ? 'Grund der Absage (falls bekannt)' : 'Warum zurückgezogen?'}
                    value={app.closing_reason}
                    onSave={(v) => save({ closing_reason: nullIfEmpty(v) })}
                  />
                </>
              ) : (
                <>
                  <Section>Nächster Schritt</Section>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Was?" value={app.next_action} onSave={(v) => save({ next_action: nullIfEmpty(v) })} />
                    <Field label="Bis wann?" type="date" value={app.next_action_due} onSave={(v) => save({ next_action_due: v || null })} />
                  </div>
                </>
              )}

              <Section>Ansprechpartner</Section>
              <div className="grid grid-cols-2 gap-2.5">
                <Field label="Name" value={app.contact_name} onSave={(v) => save({ contact_name: nullIfEmpty(v) })} />
                <Field label="Rolle" value={app.contact_role} placeholder="z. B. Recruiterin" onSave={(v) => save({ contact_role: nullIfEmpty(v) })} />
                <Field label="E-Mail" type="email" value={app.contact_email} onSave={(v) => save({ contact_email: nullIfEmpty(v) })} />
                <Field label="Telefon" type="tel" value={app.contact_phone} onSave={(v) => save({ contact_phone: nullIfEmpty(v) })} />
              </div>

              <Section>Notizen</Section>
              <TextArea label="Eindrücke, offene Fragen, Verhandlung" value={app.notes} onSave={(v) => save({ notes: nullIfEmpty(v) })} />
            </>
          )}

          {tab === 'letter' && (
            <CoverLetterPanel
              app={app}
              onPatch={onPatch}
              awaitingPayment={awaitingCoverLetterPayment}
              onLetterChange={onCoverLetterChange}
            />
          )}

          {tab === 'timeline' && (
            <>
              <div className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                <p className="mb-2 text-[12px] font-semibold">Interview planen</p>
                <div className="grid grid-cols-[1fr_auto] gap-2">
                  <input type="datetime-local" className={inputCls} value={ivDate} onChange={(e) => setIvDate(e.target.value)} />
                  <select className={inputCls} value={ivFormat} onChange={(e) => setIvFormat(e.target.value as InterviewFormat)}>
                    {(Object.keys(INTERVIEW_FORMAT_LABEL) as InterviewFormat[]).map((f) => (
                      <option key={f} value={f}>{INTERVIEW_FORMAT_LABEL[f]}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={scheduleInterview}
                  disabled={!ivDate}
                  className="mt-2 w-full rounded-lg bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] py-1.5 text-[13px] font-semibold text-black disabled:opacity-40"
                >
                  Runde {app.interview_round + 1} eintragen
                </button>
              </div>

              <div className="mt-3 rounded-xl border border-gray-100 p-3">
                <p className="mb-2 text-[12px] font-semibold">Ereignis festhalten</p>
                <div className="grid grid-cols-[auto_1fr] gap-2">
                  <select className={inputCls} value={evType} onChange={(e) => setEvType(e.target.value as ApplicationEventType)}>
                    {EVENT_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                  <input
                    className={inputCls}
                    placeholder="Was ist passiert?"
                    value={evText}
                    onChange={(e) => setEvText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addEvent()}
                  />
                </div>
              </div>

              <Section>Verlauf</Section>
              {eventsLoading ? (
                <p className="text-[13px] text-gray-400">Lade…</p>
              ) : (
                <ol className="ml-1.5 border-l-2 border-gray-100">
                  {events.map((e) => (
                    <li key={e.id} className="relative pb-3.5 pl-4">
                      <span className="absolute -left-[7px] top-1 flex h-3 w-3 items-center justify-center rounded-full bg-[#66c0b6] ring-2 ring-white" />
                      <p className="flex items-center gap-1.5 text-[13px] font-medium">
                        {EVENT_ICON[e.type]}
                        {e.type === 'status_change' && e.to_status
                          ? `${e.from_status ? statusMeta(e.from_status).label : '–'} → ${statusMeta(e.to_status).label}`
                          : e.title}
                        {e.type === 'interview' && e.meta?.format ? ` · ${INTERVIEW_FORMAT_LABEL[e.meta.format]}` : ''}
                      </p>
                      {e.details && <p className="text-[12px] text-gray-600">{e.details}</p>}
                      <p className="text-[11px] text-gray-400">
                        {e.scheduled_at
                          ? `Termin: ${new Date(e.scheduled_at).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}`
                          : formatDateDE(e.occurred_at, true)}
                      </p>
                      {e.type === 'interview' && e.scheduled_at && (
                        <button onClick={() => downloadInterviewIcs(app, e)} className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#3a9e94] hover:underline">
                          <CalendarPlus className="h-3 w-3" /> In Kalender (.ics)
                        </button>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}

          {tab === 'prep' && (
            <>
              <p className="text-[13px] text-gray-600">
                {nextInterview?.scheduled_at
                  ? `Nächstes Interview: ${new Date(nextInterview.scheduled_at).toLocaleString('de-DE', { dateStyle: 'full', timeStyle: 'short' })}`
                  : 'Noch kein Interview geplant – trage es in der Timeline ein.'}
              </p>
              <Section>Checkliste</Section>
              <ul className="space-y-1.5">
                {PREP_ITEMS.map((item) => {
                  const done = !!app.prep_checklist?.[item.key];
                  return (
                    <li key={item.key}>
                      <button
                        onClick={() => save({ prep_checklist: { ...app.prep_checklist, [item.key]: !done } })}
                        className="flex w-full items-start gap-2 rounded-lg px-1 py-1 text-left text-[13px] hover:bg-gray-50"
                      >
                        {done ? <CheckSquare className="mt-0.5 h-4 w-4 text-[#3a9e94]" /> : <Square className="mt-0.5 h-4 w-4 text-gray-300" />}
                        <span className={done ? 'text-gray-400 line-through' : ''}>{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <Section>Stellenanzeige (Snapshot)</Section>
              <TextArea
                label="Anzeigentext hier einfügen – bleibt erhalten, auch wenn die Anzeige offline geht"
                value={app.job_description}
                rows={8}
                onSave={(v) => save({ job_description: nullIfEmpty(v) })}
              />
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 border-t border-gray-100 px-5 py-3">
          {app.cv?.pdf_url ? (
            <a href={app.cv.pdf_url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-[13px] hover:bg-gray-200">
              <FileText className="h-3.5 w-3.5" /> CV (PDF)
            </a>
          ) : app.cv_id ? (
            <button onClick={() => navigate(`/cv/${app.cv_id}`)} className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-[13px] hover:bg-gray-200">
              <FileText className="h-3.5 w-3.5" /> CV öffnen
            </button>
          ) : null}
          {nextInterview && (
            <button onClick={() => downloadInterviewIcs(app, nextInterview)} className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-[13px] hover:bg-gray-200">
              <CalendarPlus className="h-3.5 w-3.5" /> Kalender
            </button>
          )}
          <button
            onClick={() => window.confirm('Bewerbung wirklich löschen?') && onDelete(app.id)}
            className="ml-auto rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="Löschen"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}
