import { ReactNode } from 'react';
import { Plus } from 'lucide-react';
import { KanbanStatus } from './KanbanBoard';

interface KanbanColumnProps {
  column: { id: KanbanStatus; label: string; color: string };
  cardCount: number;
  children: ReactNode;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: () => void;
  isDragOver: boolean;
  onAddCard: (status: KanbanStatus) => void;
}

const STATUS_COLORS: Record<string, { border: string; bg: string; header: string; dot: string }> = {
  draft: { border: 'border-gray-400', bg: 'bg-gray-50', header: 'bg-gray-100', dot: 'bg-gray-400' },
  applied: { border: 'border-blue-400', bg: 'bg-blue-50', header: 'bg-blue-100', dot: 'bg-blue-400' },
  interview: { border: 'border-sky-400', bg: 'bg-sky-50', header: 'bg-sky-100', dot: 'bg-sky-400' },
  offer: { border: 'border-green-400', bg: 'bg-green-50', header: 'bg-green-100', dot: 'bg-green-400' },
  rejected: { border: 'border-red-400', bg: 'bg-red-50', header: 'bg-red-100', dot: 'bg-red-400' },
};

export function KanbanColumn({
  column,
  cardCount,
  children,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragOver,
  onAddCard,
}: KanbanColumnProps) {
  const colors = STATUS_COLORS[column.id];

  return (
    <div className="flex flex-col w-full md:w-72 md:flex-shrink-0">
      <div className={`${colors.header} px-3 py-2.5 rounded-lg mb-3 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${colors.dot} flex-shrink-0`} />
          <div>
            <h3 className="font-semibold text-gray-800 text-sm leading-tight">{column.label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {cardCount} {cardCount === 1 ? 'Karte' : 'Karten'}
            </p>
          </div>
        </div>
        <button
          onClick={() => onAddCard(column.id)}
          title="Kachel hinzufügen"
          className="flex items-center justify-center w-6 h-6 rounded-md bg-white/70 hover:bg-white transition-colors border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`flex-1 flex flex-col gap-2.5 p-2.5 rounded-lg border-2 transition-all duration-150 ${
          isDragOver
            ? `${colors.border} bg-white shadow-inner scale-[1.01]`
            : `border-transparent ${colors.bg}`
        }`}
        style={{ minHeight: '420px' }}
      >
        {children}
      </div>
    </div>
  );
}
