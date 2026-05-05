import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Trash2, Plus, Edit2 } from 'lucide-react';
import AgentEntryEditForm from './AgentEntryEditForm';
import AgentEntryAddForm from './AgentEntryAddForm';

interface AgentProgressSectionProps {
  sectionId: string;
  title: string;
  icon: React.ReactNode;
  entries: any[];
  formatEntry: (entry: any) => { title: string; subtitle: string };
  onDelete: (entryIndex: number) => void;
  onEdit: (entryIndex: number, updatedData: any) => void;
  onAdd: (newEntry: any) => void;
  isExpanded: boolean;
  onToggle: () => void;
}

export default function AgentProgressSection({
  sectionId,
  title,
  icon,
  entries,
  formatEntry,
  onDelete,
  onEdit,
  onAdd,
  isExpanded,
  onToggle,
}: AgentProgressSectionProps) {
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const handleDelete = async (index: number) => {
    if (deletingIndex === index) {
      onDelete(index);
      setDeletingIndex(null);
    } else {
      setDeletingIndex(index);
      setTimeout(() => setDeletingIndex(null), 3000);
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setDeletingIndex(null);
  };

  const handleSaveEdit = async (index: number, updatedData: any) => {
    await onEdit(index, updatedData);
    setEditingIndex(null);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
  };

  const handleAddNew = () => {
    setIsAddingNew(true);
    setEditingIndex(null);
    setDeletingIndex(null);
  };

  const handleSaveNew = async (newEntry: any) => {
    await onAdd(newEntry);
    setIsAddingNew(false);
  };

  const handleCancelAdd = () => {
    setIsAddingNew(false);
  };

  return (
    <div className="border-b border-white border-opacity-10 last:border-0">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-white hover:bg-opacity-5 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="text-primary">{icon}</div>
          <div className="text-left">
            <div className="font-semibold text-white">{title}</div>
            <div className="text-sm text-text-secondary">
              {entries.length} {entries.length === 1 ? 'Eintrag' : 'Einträge'}
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-text-secondary" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {isAddingNew && (
                <AgentEntryAddForm
                  sectionId={sectionId}
                  onSave={handleSaveNew}
                  onCancel={handleCancelAdd}
                />
              )}

              {entries.length === 0 && !isAddingNew ? (
                <div className="text-center py-6 text-text-secondary text-sm">
                  Noch keine Einträge
                </div>
              ) : (
                entries.map((entry, index) => {
                  const formatted = formatEntry(entry);
                  const isEditing = editingIndex === index;

                  if (isEditing) {
                    return (
                      <div key={index} className="mb-2">
                        <AgentEntryEditForm
                          sectionId={sectionId}
                          entry={entry}
                          onSave={(updatedData) => handleSaveEdit(index, updatedData)}
                          onCancel={handleCancelEdit}
                        />
                      </div>
                    );
                  }

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white bg-opacity-5 rounded-lg p-3 flex items-start justify-between gap-3 group hover:bg-opacity-10 transition-all"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-white text-sm truncate">
                          {formatted.title}
                        </div>
                        <div className="text-xs text-text-secondary truncate">
                          {formatted.subtitle}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleEdit(index)}
                          className="p-2 rounded-lg text-text-secondary hover:text-primary hover:bg-primary hover:bg-opacity-10 transition-all"
                          title="Bearbeiten"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(index)}
                          className={`p-2 rounded-lg transition-all ${
                            deletingIndex === index
                              ? 'bg-error text-white'
                              : 'text-text-secondary hover:text-error hover:bg-error hover:bg-opacity-10'
                          }`}
                          title={deletingIndex === index ? 'Nochmal klicken zum Bestätigen' : 'Löschen'}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })
              )}

              {!isAddingNew && (
                <button
                  onClick={handleAddNew}
                  className="w-full mt-3 p-3 rounded-lg bg-primary bg-opacity-10 border-2 border-primary border-opacity-30 text-primary hover:bg-opacity-20 transition-all flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <Plus size={16} />
                  Weitere {title} hinzufügen
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
