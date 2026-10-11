import { useDraggable } from '@dnd-kit/core';
import { ArrowRight, CalendarClock, FileText, PenLine, Send, Sparkles, Wallet } from 'lucide-react';
import type { ApplicationEvent, TrackedApplication } from '../../../types/applications';
import { INTERVIEW_FORMAT_LABEL } from '../../../types/applications';
import { daysUntil, formatDateDE, formatSalary } from '../../../services/applicationService';

interface ApplicationCardProps {
  app: TrackedApplication;
  nextInterview?: ApplicationEvent;
  onOpen: (app: TrackedApplication) => void;
  isHighlighted?: boolean;
  muted?: boolean;
  /** Overlay-Kopie während des Ziehens */
  isOverlay?: boolean;
  coverLetterState?: CoverLetterState;
  onOpenLetter?: (app: TrackedApplication) => void;
}

export type CoverLetterState = 'none' | 'draft' | 'unlocked';
const LETTER_CTA_STATUSES = new Set(['saved', 'preparing', 'applied']);

export function NextActionBadge({ action, due }: { action: string | null; due: string | null }) {
  if (!action) return null;
  const d = daysUntil(due);
  const tone =
    d === null ? 'bg-gray-50 border-gray-100 text-gray-600'
    : d < 0 ? 'bg-red-50 border-red-200 text-red-700'
    : d <= 1 ? 'bg-amber-50 border-amber-200 text-amber-800'
    : 'bg-gray-50 border-gray-100 text-gray-600';
  const when =
    d === null ? '' : d < 0 ? `${-d} T überfällig` : d === 0 ? 'heute' : d === 1 ? 'morgen' : formatDateDE(due);

  return (
    <div className={`mt-2 flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] ${tone}`}>
      <ArrowRight className="h-3 w-3 flex-shrink-0" />
      <span className="line-clamp-1 flex-1">{action}</span>
      {when && <span className="flex-shrink-0 font-semibold">{when}</span>}
    </div>
  );
}

function Chip({ children, teal }: { children: React.ReactNode; teal?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[10px] ${
        teal ? 'bg-[#66c0b6]/15 text-[#3a9e94]' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {children}
    </span>
  );
}

export function ApplicationCard({
  app, nextInterview, onOpen, isHighlighted, muted, isOverlay, coverLetterState = 'none', onOpenLetter,
}: ApplicationCardProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: app.id,
    disabled: muted || isOverlay,
  });

  const sinceApplied = app.applied_at ? -(daysUntil(app.applied_at) ?? 0) : null;
  const salary = formatSalary(app);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onOpen(app)}
      className={`select-none rounded-xl border bg-white p-2.5 text-left shadow-sm transition-all touch-none ${
        isOverlay ? 'rotate-2 cursor-grabbing shadow-xl' : 'cursor-grab hover:shadow-md'
      } ${isDragging ? 'opacity-40' : ''} ${muted ? 'opacity-70' : ''} ${
        isHighlighted
          ? 'border-[#66c0b6] shadow-[0_0_0_3px_rgba(102,192,182,0.2)]'
          : 'border-gray-200'
      }`}
    >
      <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-gray-900">{app.job_title}</p>
      <p className="line-clamp-1 text-xs text-gray-500">
        {app.company || 'Firma ergänzen'}
        {app.contact_name ? ` · ${app.contact_name}` : ''}
      </p>

      <div className="mt-2 flex flex-wrap gap-1">
        {sinceApplied !== null && app.status !== 'preparing' && app.status !== 'saved' && (
          <Chip>
            <Send className="h-2.5 w-2.5" />
            {formatDateDE(app.applied_at)} · vor {sinceApplied} T
          </Chip>
        )}
        {app.interview_round > 0 && app.status === 'interview' && <Chip teal>Runde {app.interview_round}</Chip>}
        {nextInterview?.scheduled_at && (
          <Chip teal>
            <CalendarClock className="h-2.5 w-2.5" />
            {formatDateDE(nextInterview.scheduled_at)}{' '}
            {new Date(nextInterview.scheduled_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
            {nextInterview.meta?.format ? ` · ${INTERVIEW_FORMAT_LABEL[nextInterview.meta.format]}` : ''}
          </Chip>
        )}
        {salary && (
          <Chip>
            <Wallet className="h-2.5 w-2.5" />
            {salary}
          </Chip>
        )}
        {app.cv_id && (
          <Chip teal>
            <FileText className="h-2.5 w-2.5" />
            CV
          </Chip>
        )}
        {coverLetterState === 'unlocked' && (
          <Chip teal>
            <PenLine className="h-2.5 w-2.5" />
            Anschreiben ✓
          </Chip>
        )}
        {muted && app.closing_reason && <Chip>{app.closing_reason}</Chip>}
      </div>

      {!muted && !isOverlay && coverLetterState !== 'unlocked' && LETTER_CTA_STATUSES.has(app.status) && onOpenLetter && (
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onOpenLetter(app);
          }}
          className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-[#66c0b6]/60 bg-[#66c0b6]/[0.06] py-1 text-[11px] font-semibold text-[#3a9e94] transition-colors hover:bg-[#66c0b6]/15"
        >
          <Sparkles className="h-3 w-3" />
          {coverLetterState === 'draft' ? 'Anschreiben-Entwurf ansehen' : 'Anschreiben erstellen'}
        </button>
      )}

      {!muted && <NextActionBadge action={app.next_action} due={app.next_action_due} />}
    </div>
  );
}
