import { useState, useCallback, useMemo } from 'react';
import { Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { AddManualCardModal } from './AddManualCardModal';
import { StatusCelebrationModal } from './StatusCelebrationModal';

export type KanbanStatus = 'draft' | 'applied' | 'interview' | 'offer' | 'rejected';

interface KanbanBoardProps {
  cvs: any[];
  onCVUpdate: () => void;
  highlightedCvId?: string | null;
}

const COLUMNS: { id: KanbanStatus; label: string; color: string }[] = [
  { id: 'draft', label: 'Entwurf', color: 'bg-gray-100' },
  { id: 'applied', label: 'Beworben', color: 'bg-blue-100' },
  { id: 'interview', label: 'Interview', color: 'bg-blue-100' },
  { id: 'offer', label: 'Angebot', color: 'bg-green-100' },
  { id: 'rejected', label: 'Absage', color: 'bg-red-100' },
];

const EXAMPLE_CARD = {
  id: '__example__',
  source: 'example',
  status: 'draft' as KanbanStatus,
  is_paid: false,
  download_unlocked: false,
  pdf_url: null,
  job_data: {
    positionTitle: 'Software Engineer',
    company: 'Muster GmbH',
    contactPerson: 'Max Mustermann',
    applicationDate: '15.03.2026',
    feedbackDeadline: '30.03.2026',
    notes: 'Interessante Stelle im Bereich Web-Entwicklung.',
  },
  cv_data: {},
};

type CelebrationInfo = {
  status: 'interview' | 'offer' | 'rejected';
  jobTitle?: string;
  company?: string;
};

export function KanbanBoard({ cvs, onCVUpdate, highlightedCvId }: KanbanBoardProps) {
  const [localStatuses, setLocalStatuses] = useState<Record<string, KanbanStatus>>({});
  const [draggedCard, setDraggedCard] = useState<any | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanStatus | null>(null);
  const [addModalStatus, setAddModalStatus] = useState<KanbanStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [celebration, setCelebration] = useState<CelebrationInfo | null>(null);
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0);

  const VALID_STATUSES = useMemo(() => new Set<string>(COLUMNS.map((c) => c.id)), []);

  const normalizeStatus = useCallback(
    (s: string | undefined): KanbanStatus => {
      if (s && VALID_STATUSES.has(s)) return s as KanbanStatus;
      if (s === 'in_progress') return 'applied';
      return 'draft';
    },
    [VALID_STATUSES]
  );

  const kanbanCvs = useMemo(() => cvs.filter((cv) => cv.source !== 'check'), [cvs]);

  const filteredCvs = useMemo(() => {
    if (!searchQuery.trim()) return kanbanCvs;
    const q = searchQuery.toLowerCase();
    return kanbanCvs.filter((cv) => {
      const jd = cv.job_data || {};
      const cd = cv.cv_data || {};
      const dj = cd.desired_job || {};
      const title = (jd.positionTitle || jd.jobTitle || jd.job_title || dj.job_title || cd.targetJob || cd.jobTitle || '').toLowerCase();
      const company = (jd.company || jd.companyName || dj.company || cd.targetCompany || cd.company || '').toLowerCase();
      return title.includes(q) || company.includes(q);
    });
  }, [kanbanCvs, searchQuery]);

  const getCardStatus = useCallback(
    (cv: any): KanbanStatus => localStatuses[cv.id] ?? normalizeStatus(cv.status),
    [localStatuses, normalizeStatus]
  );

  const groupedCVs = useMemo(
    () =>
      COLUMNS.reduce(
        (acc, col) => {
          acc[col.id] = filteredCvs.filter((cv) => getCardStatus(cv) === col.id);
          return acc;
        },
        {} as Record<KanbanStatus, any[]>
      ),
    [filteredCvs, getCardStatus]
  );

  const handleDragStart = useCallback((cv: any) => {
    setDraggedCard(cv);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, columnId: KanbanStatus) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOverColumn(null);
  }, []);

  const handleDrop = useCallback(
    async (targetStatus: KanbanStatus) => {
      setDragOverColumn(null);
      if (!draggedCard || draggedCard.id === '__example__') {
        setDraggedCard(null);
        return;
      }

      const currentStatus = getCardStatus(draggedCard);
      if (currentStatus === targetStatus) {
        setDraggedCard(null);
        return;
      }

      setLocalStatuses((prev) => ({ ...prev, [draggedCard.id]: targetStatus }));

      if (targetStatus === 'interview' || targetStatus === 'offer' || targetStatus === 'rejected') {
        const jd = draggedCard.job_data || {};
        const cd = draggedCard.cv_data || {};
        const dj = cd.desired_job || {};
        setCelebration({
          status: targetStatus,
          jobTitle: jd.positionTitle || jd.jobTitle || dj.job_title || cd.targetJob || undefined,
          company: jd.company || jd.companyName || dj.company || cd.targetCompany || undefined,
        });
      }

      try {
        const { error } = await supabase
          .from('stored_cvs')
          .update({ status: targetStatus })
          .eq('id', draggedCard.id);

        if (error) {
          setLocalStatuses((prev) => {
            const next = { ...prev };
            delete next[draggedCard.id];
            return next;
          });
        } else {
          onCVUpdate();
        }
      } catch {
        setLocalStatuses((prev) => {
          const next = { ...prev };
          delete next[draggedCard.id];
          return next;
        });
      } finally {
        setDraggedCard(null);
      }
    },
    [draggedCard, getCardStatus, onCVUpdate]
  );

  const handleStatusChange = useCallback(
    async (cv: any, newStatus: KanbanStatus) => {
      setLocalStatuses((prev) => ({ ...prev, [cv.id]: newStatus }));

      if (newStatus === 'interview' || newStatus === 'offer' || newStatus === 'rejected') {
        const jd = cv.job_data || {};
        const cd = cv.cv_data || {};
        const dj = cd.desired_job || {};
        setCelebration({
          status: newStatus,
          jobTitle: jd.positionTitle || jd.jobTitle || dj.job_title || cd.targetJob || undefined,
          company: jd.company || jd.companyName || dj.company || cd.targetCompany || undefined,
        });
      }

      const { error } = await supabase.from('stored_cvs').update({ status: newStatus }).eq('id', cv.id);
      if (error) {
        setLocalStatuses((prev) => {
          const next = { ...prev };
          delete next[cv.id];
          return next;
        });
      } else {
        onCVUpdate();
      }
    },
    [onCVUpdate]
  );

  const handleAddCard = useCallback((status: KanbanStatus) => {
    setAddModalStatus(status);
  }, []);

  const mobileColumn = COLUMNS[mobileColumnIndex];

  return (
    <>
      <div className="mb-4 flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Stelle oder Firma suchen…"
            className="w-full pl-9 pr-8 py-2 text-sm rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#66c0b6]/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Mobile: tab-based single column view */}
      <div className="block md:hidden">
        <div className="flex items-center gap-1 mb-3 bg-white/5 rounded-xl p-1">
          {COLUMNS.map((col, idx) => {
            const count = groupedCVs[col.id]?.length ?? 0;
            const isActive = idx === mobileColumnIndex;
            return (
              <button
                key={col.id}
                onClick={() => setMobileColumnIndex(idx)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex flex-col items-center gap-0.5 ${
                  isActive
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                <span className="truncate leading-none">{col.label}</span>
                {count > 0 && (
                  <span className={`text-[10px] leading-none font-bold ${isActive ? 'text-gray-500' : 'text-white/30'}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setMobileColumnIndex((i) => Math.max(0, i - 1))}
            disabled={mobileColumnIndex === 0}
            className="p-1.5 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 transition-all"
          >
            <ChevronLeft className="w-4 h-4 text-white/60" />
          </button>
          <span className="text-sm font-semibold text-white/70">{mobileColumn.label}</span>
          <button
            onClick={() => setMobileColumnIndex((i) => Math.min(COLUMNS.length - 1, i + 1))}
            disabled={mobileColumnIndex === COLUMNS.length - 1}
            className="p-1.5 rounded-lg bg-white/5 disabled:opacity-30 hover:bg-white/10 transition-all"
          >
            <ChevronRight className="w-4 h-4 text-white/60" />
          </button>
        </div>

        <div className="w-full">
          {(() => {
            const columnCards = groupedCVs[mobileColumn.id];
            const showExample = mobileColumn.id === 'draft' && kanbanCvs.length === 0;
            const displayCount = showExample ? columnCards.length + 1 : columnCards.length;
            return (
              <KanbanColumn
                column={mobileColumn}
                cardCount={displayCount}
                isDragOver={dragOverColumn === mobileColumn.id}
                onDragOver={(e) => handleDragOver(e, mobileColumn.id)}
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(mobileColumn.id)}
                onAddCard={handleAddCard}
              >
                {showExample && (
                  <KanbanCard cv={EXAMPLE_CARD} status="draft" onDragStart={() => {}} isExample />
                )}
                {columnCards.map((cv) => (
                  <KanbanCard
                    key={cv.id}
                    cv={cv}
                    status={getCardStatus(cv)}
                    onDragStart={() => handleDragStart(cv)}
                    onUpdate={onCVUpdate}
                    onStatusChange={(s) => handleStatusChange(cv, s)}
                    isHighlighted={!!highlightedCvId && cv.id === highlightedCvId}
                  />
                ))}
              </KanbanColumn>
            );
          })()}
        </div>
      </div>

      {/* Desktop: horizontal scroll view */}
      <div className="hidden md:flex gap-5 overflow-x-auto pb-6 min-w-0" style={{ alignItems: 'flex-start' }}>
        {COLUMNS.map((column) => {
          const columnCards = groupedCVs[column.id];
          const showExample = column.id === 'draft' && kanbanCvs.length === 0;
          const displayCount = showExample ? columnCards.length + 1 : columnCards.length;

          return (
            <KanbanColumn
              key={column.id}
              column={column}
              cardCount={displayCount}
              isDragOver={dragOverColumn === column.id}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={handleDragLeave}
              onDrop={() => handleDrop(column.id)}
              onAddCard={handleAddCard}
            >
              {showExample && (
                <KanbanCard
                  cv={EXAMPLE_CARD}
                  status="draft"
                  onDragStart={() => {}}
                  isExample
                />
              )}
              {columnCards.map((cv) => (
                <KanbanCard
                  key={cv.id}
                  cv={cv}
                  status={getCardStatus(cv)}
                  onDragStart={() => handleDragStart(cv)}
                  onUpdate={onCVUpdate}
                  isHighlighted={!!highlightedCvId && cv.id === highlightedCvId}
                />
              ))}
            </KanbanColumn>
          );
        })}
      </div>

      {addModalStatus && (
        <AddManualCardModal
          initialStatus={addModalStatus}
          onClose={() => setAddModalStatus(null)}
          onSuccess={() => {
            setAddModalStatus(null);
            onCVUpdate();
          }}
        />
      )}

      {celebration && (
        <StatusCelebrationModal
          status={celebration.status}
          jobTitle={celebration.jobTitle}
          company={celebration.company}
          onClose={() => setCelebration(null)}
        />
      )}
    </>
  );
}
