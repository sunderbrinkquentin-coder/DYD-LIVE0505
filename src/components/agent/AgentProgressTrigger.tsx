import { motion } from 'framer-motion';
import { ListChecks } from 'lucide-react';

interface AgentProgressTriggerProps {
  totalEntries: number;
  onClick: () => void;
  isOpen: boolean;
}

export default function AgentProgressTrigger({
  totalEntries,
  onClick,
  isOpen,
}: AgentProgressTriggerProps) {
  if (isOpen) return null;

  return (
    <motion.button
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary-hover text-white rounded-full p-4 shadow-2xl flex items-center gap-3 font-semibold transition-colors"
      style={{
        boxShadow: '0 8px 32px rgba(78, 205, 196, 0.3)',
      }}
    >
      <ListChecks size={24} />
      <div className="flex flex-col items-start">
        <span className="text-sm">Übersicht</span>
        {totalEntries > 0 && (
          <span className="text-xs opacity-90">{totalEntries} Einträge</span>
        )}
      </div>
      {totalEntries > 0 && (
        <div className="absolute -top-2 -right-2 bg-white text-primary rounded-full w-7 h-7 flex items-center justify-center text-xs font-bold shadow-lg">
          {totalEntries}
        </div>
      )}
    </motion.button>
  );
}
