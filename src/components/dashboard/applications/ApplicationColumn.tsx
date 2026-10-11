import { ReactNode } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Plus } from 'lucide-react';
import type { StatusMeta } from '../../../types/applications';

interface ApplicationColumnProps {
  status: StatusMeta;
  count: number;
  onAdd: () => void;
  children: ReactNode;
}

export function ApplicationColumn({ status, count, onAdd, children }: ApplicationColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <div className="flex min-w-0 flex-col">
      <div className="mb-2 flex items-center gap-2 rounded-lg bg-white/[0.06] px-2.5 py-2">
        <span className={`h-2 w-2 flex-shrink-0 rounded-full ${status.dot}`} />
        <h3 className="text-[13px] font-semibold text-white">{status.label}</h3>
        <span className="ml-auto text-[11px] text-white/50">{count}</span>
        <button
          onClick={onAdd}
          title="Bewerbung hinzufügen"
          className="flex h-5 w-5 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={`flex min-h-[90px] flex-col gap-2 rounded-xl border-2 p-2 transition-colors ${
          isOver ? 'border-[#66c0b6] bg-[#66c0b6]/10' : 'border-transparent bg-white/[0.03]'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
