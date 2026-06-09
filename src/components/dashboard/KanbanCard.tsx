import { useState, useRef } from 'react';
import { Calendar, User, Briefcase, DollarSign, FileText, Download, Pencil, Sparkles, Bell, ChevronDown, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { KanbanStatus } from './KanbanBoard';

interface KanbanCardProps {
  cv: any;
  status: KanbanStatus;
  onDragStart: () => void;
  onUpdate?: () => void;
  onStatusChange?: (newStatus: KanbanStatus) => void;
  isExample?: boolean;
  isHighlighted?: boolean;
}

const STATUS_ACCENT: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-700',
  applied: 'bg-blue-100 text-blue-700',
  interview: 'bg-sky-100 text-sky-700',
  offer: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  draft: 'Entwurf',
  applied: 'Beworben',
  interview: 'Interview',
  offer: 'Angebot',
  rejected: 'Absage',
};

interface EditableFieldProps {
  value: string;
  placeholder: string;
  onSave: (val: string) => void;
  icon: React.ReactNode;
  highlight?: 'warning' | 'danger' | null;
}

function EditableField({ value, placeholder, onSave, icon, highlight }: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleBlur = () => {
    setEditing(false);
    if (localValue !== value) {
      onSave(localValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') inputRef.current?.blur();
    if (e.key === 'Escape') {
      setLocalValue(value);
      setEditing(false);
    }
  };

  const textColor = highlight === 'danger'
    ? 'text-red-600 font-medium'
    : highlight === 'warning'
    ? 'text-amber-600 font-medium'
    : value
    ? 'text-gray-600'
    : 'text-gray-300 italic';

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="flex-shrink-0">{icon}</span>
        <input
          ref={inputRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          placeholder={placeholder}
          className="text-xs text-gray-700 border-b border-[#66c0b6] outline-none bg-transparent w-full py-0.5"
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center gap-2 group cursor-pointer"
      onClick={handleStartEdit}
    >
      <span className="flex-shrink-0">{icon}</span>
      <span className={`text-xs line-clamp-1 flex-1 ${textColor}`}>
        {localValue || placeholder}
      </span>
      <Pencil className="w-2.5 h-2.5 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </div>
  );
}

function getDeadlineHighlight(deadlineStr: string): 'danger' | 'warning' | null {
  if (!deadlineStr) return null;

  const parts = deadlineStr.trim().split(/[.\-\/]/);
  let date: Date | null = null;

  if (parts.length === 3) {
    const [a, b, c] = parts;
    if (c.length === 4) {
      date = new Date(`${c}-${b.padStart(2, '0')}-${a.padStart(2, '0')}`);
    } else if (a.length === 4) {
      date = new Date(`${a}-${b.padStart(2, '0')}-${c.padStart(2, '0')}`);
    }
  }

  if (!date || isNaN(date.getTime())) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.floor((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diff < 0) return 'danger';
  if (diff <= 3) return 'warning';
  return null;
}

const ALL_STATUSES: KanbanStatus[] = ['draft', 'applied', 'interview', 'offer', 'rejected'];

export function KanbanCard({ cv, status, onDragStart, onUpdate, onStatusChange, isExample = false, isHighlighted = false }: KanbanCardProps) {
  const navigate = useNavigate();
  const jobData = cv.job_data || {};
  const cvData = cv.cv_data || {};

  const isNew = isHighlighted || (!isExample && cv.updated_at &&
    (Date.now() - new Date(cv.updated_at).getTime()) < 24 * 60 * 60 * 1000 &&
    cv.pdf_url);

  const desiredJob = cvData.desired_job || {};
  const initialJobTitle =
    jobData.positionTitle ||
    jobData.jobTitle ||
    jobData.job_title ||
    desiredJob.job_title ||
    cvData.targetJob ||
    cvData.targetRole ||
    cvData.jobTitle ||
    cvData.personalInfo?.title ||
    '';
  const company =
    jobData.company ||
    jobData.companyName ||
    desiredJob.company ||
    cvData.targetCompany ||
    cvData.company ||
    cvData.personalInfo?.company ||
    '';
  const notes = jobData.notes || null;

  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);
  const [contactPerson, setContactPerson] = useState<string>(jobData.contactPerson || jobData.contact_name || '');
  const [applicationDate, setApplicationDate] = useState<string>(
    jobData.applicationDate ||
    (cv.updated_at ? new Date(cv.updated_at).toLocaleDateString('de-DE') : '')
  );
  const [salaryExpectation, setSalaryExpectation] = useState<string>(jobData.salaryExpectation || '');
  const [feedbackDeadline, setFeedbackDeadline] = useState<string>(jobData.feedbackDeadline || '');

  const deadlineHighlight = getDeadlineHighlight(feedbackDeadline);

  const saveField = (field: string, value: string) => {
    const updatedJobData = { ...jobData, [field]: value };
    supabase
      .from('stored_cvs')
      .update({ job_data: updatedJobData })
      .eq('id', cv.id)
      .then(({ error }) => {
        if (error) {
          console.error('[KanbanCard] saveField error:', error.message);
        }
      });
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cv.pdf_url) {
      window.open(cv.pdf_url, '_blank');
    }
  };

  return (
    <div
      draggable={!isExample}
      onDragStart={isExample ? undefined : onDragStart}
      className={`bg-white rounded-xl shadow-sm transition-all border overflow-hidden select-none ${
        isHighlighted
          ? 'border-[#66c0b6] shadow-[0_0_0_3px_rgba(102,192,182,0.2),0_2px_12px_rgba(102,192,182,0.15)] cursor-grab active:cursor-grabbing'
          : isExample
          ? 'border-dashed border-[#66c0b6]/40 opacity-75 cursor-default'
          : 'hover:shadow-md cursor-grab active:cursor-grabbing border-gray-200 active:opacity-70 active:scale-[0.98]'
      }`}
    >
      {isExample && (
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0">
          <Sparkles className="w-3 h-3 text-[#66c0b6]" />
          <span className="text-xs font-semibold text-[#3a9e94] uppercase tracking-wide">Beispiel</span>
        </div>
      )}
      {isNew && !isExample && (
        <div className="flex items-center gap-1.5 px-3 pt-2.5 pb-0">
          <div className="w-1.5 h-1.5 rounded-full bg-[#66c0b6] animate-pulse" />
          <span className="text-xs font-semibold text-[#3a9e94] uppercase tracking-wide">Neu</span>
        </div>
      )}

      <div className="p-3">
        <div className="mb-2.5">
          <EditableField
            value={jobTitle}
            placeholder="Stellenbezeichnung"
            icon={<Briefcase className="w-3 h-3 text-gray-400" />}
            onSave={(val) => {
              setJobTitle(val);
              saveField('positionTitle', val);
            }}
          />
          {company && (
            <div className="flex items-center gap-1.5 mt-0.5 pl-5">
              <span className="text-xs font-medium text-gray-500 line-clamp-1">{company}</span>
            </div>
          )}
        </div>

        <div className="space-y-1.5 mb-3">
          <EditableField
            value={contactPerson}
            placeholder="Ansprechpartner"
            icon={<User className="w-3 h-3 text-gray-400" />}
            onSave={(val) => {
              setContactPerson(val);
              saveField('contactPerson', val);
            }}
          />

          <EditableField
            value={applicationDate}
            placeholder="Bewerbungsdatum"
            icon={<Calendar className="w-3 h-3 text-gray-400" />}
            onSave={(val) => {
              setApplicationDate(val);
              saveField('applicationDate', val);
            }}
          />

          <EditableField
            value={feedbackDeadline}
            placeholder="Feedback bis (z. B. 30.04.2026)"
            icon={
              <Bell className={`w-3 h-3 flex-shrink-0 ${
                deadlineHighlight === 'danger'
                  ? 'text-red-500'
                  : deadlineHighlight === 'warning'
                  ? 'text-amber-500'
                  : 'text-gray-400'
              }`} />
            }
            highlight={deadlineHighlight}
            onSave={(val) => {
              setFeedbackDeadline(val);
              saveField('feedbackDeadline', val);
            }}
          />

          <EditableField
            value={salaryExpectation}
            placeholder="Gehaltswunsch"
            icon={<DollarSign className="w-3 h-3 text-gray-400" />}
            onSave={(val) => {
              setSalaryExpectation(val);
              saveField('salaryExpectation', val);
            }}
          />

          {notes && (
            <div className="flex items-start gap-2">
              <FileText className="w-3 h-3 text-gray-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-gray-500 line-clamp-2">{notes}</span>
            </div>
          )}
        </div>

        {deadlineHighlight && feedbackDeadline && (
          <div className={`text-xs rounded-md px-2 py-1 mb-2.5 flex items-center gap-1.5 ${
            deadlineHighlight === 'danger'
              ? 'bg-red-50 text-red-600 border border-red-200'
              : 'bg-amber-50 text-amber-600 border border-amber-200'
          }`}>
            <Bell className="w-2.5 h-2.5 flex-shrink-0" />
            {deadlineHighlight === 'danger'
              ? 'Feedback-Deadline überschritten'
              : 'Feedback-Deadline in Kürze'}
          </div>
        )}

        <div className="flex items-center justify-between gap-2">
          {isExample ? (
            <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-medium ${STATUS_ACCENT[status]}`}>
              {STATUS_LABELS[status]}
            </span>
          ) : (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setStatusMenuOpen((v) => !v); }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium transition-all hover:opacity-80 ${STATUS_ACCENT[status]}`}
              >
                {STATUS_LABELS[status]}
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>
              {statusMenuOpen && (
                <div
                  className="absolute left-0 bottom-full mb-1 z-50 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden min-w-[130px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {ALL_STATUSES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStatusMenuOpen(false);
                        if (s !== status) onStatusChange?.(s);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-medium text-gray-800 transition-colors hover:bg-gray-50 flex items-center gap-2 ${
                        s === status ? 'opacity-40 cursor-default' : ''
                      }`}
                    >
                      <span className={`inline-block w-2 h-2 rounded-full ${
                        s === 'draft' ? 'bg-gray-400' :
                        s === 'applied' ? 'bg-blue-400' :
                        s === 'interview' ? 'bg-sky-400' :
                        s === 'offer' ? 'bg-green-400' : 'bg-red-400'
                      }`} />
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {!isExample && (
            cv.pdf_url ? (
              <button
                onClick={handleDownload}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black text-xs font-semibold hover:opacity-90 transition-opacity shadow-sm"
              >
                <Download className="w-3 h-3" />
                PDF
              </button>
            ) : cv.id && cv.id !== '__example__' ? (
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/cv/${cv.id}`); }}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/80 border border-gray-200 text-gray-600 text-xs font-medium hover:bg-white hover:border-[#66c0b6] hover:text-[#3a9e94] transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                CV öffnen
              </button>
            ) : null
          )}
        </div>
      </div>

      {cv.pdf_url && !isExample && (
        <div
          className="px-3 py-1.5 bg-gradient-to-r from-[#66c0b6]/8 to-[#30E3CA]/8 border-t border-[#66c0b6]/15 flex items-center justify-between cursor-pointer hover:from-[#66c0b6]/15 hover:to-[#30E3CA]/15 transition-colors"
          onClick={handleDownload}
        >
          <span className="text-xs text-[#3a9e94] font-medium">PDF herunterladen</span>
          <Download className="w-3 h-3 text-[#3a9e94]" />
        </div>
      )}
    </div>
  );
}
