import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Briefcase, GraduationCap, FolderOpen, Award } from 'lucide-react';
import AgentProgressSection from './AgentProgressSection';

interface AgentProgressPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entries: {
    berufserfahrung: any[];
    bildung: any[];
    projekte: any[];
    zertifikate: any[];
  };
  onDeleteEntry: (sectionId: string, entryIndex: number) => void;
  onEditEntry: (sectionId: string, entryIndex: number, updatedData: any) => void;
  onAddEntry: (sectionId: string, newEntry: any) => void;
}

export default function AgentProgressPanel({
  isOpen,
  onClose,
  entries,
  onDeleteEntry,
  onEditEntry,
  onAddEntry,
}: AgentProgressPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['berufserfahrung', 'bildung'])
  );

  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const sections = [
    {
      id: 'berufserfahrung',
      title: 'Berufserfahrung',
      icon: <Briefcase size={20} />,
      entries: entries.berufserfahrung || [],
      formatEntry: (entry: any) => ({
        title: entry.position || 'Keine Position',
        subtitle: entry.firma || 'Keine Firma',
      }),
    },
    {
      id: 'bildung',
      title: 'Bildung',
      icon: <GraduationCap size={20} />,
      entries: entries.bildung || [],
      formatEntry: (entry: any) => ({
        title: entry.abschluss || 'Kein Abschluss',
        subtitle: entry.institution || 'Keine Institution',
      }),
    },
    {
      id: 'projekte',
      title: 'Projekte',
      icon: <FolderOpen size={20} />,
      entries: entries.projekte || [],
      formatEntry: (entry: any) => ({
        title: entry.titel || 'Kein Titel',
        subtitle: entry.rolle || 'Keine Rolle',
      }),
    },
    {
      id: 'zertifikate',
      title: 'Zertifikate',
      icon: <Award size={20} />,
      entries: entries.zertifikate || [],
      formatEntry: (entry: any) => ({
        title: entry.titel || 'Kein Titel',
        subtitle: entry.organisation || 'Keine Organisation',
      }),
    },
  ];

  const totalEntries = sections.reduce((sum, section) => sum + section.entries.length, 0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[450px] bg-dark-card shadow-2xl z-50 flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white border-opacity-10">
              <div>
                <h2 className="text-2xl font-bold text-white">Übersicht</h2>
                <p className="text-sm text-text-secondary mt-1">
                  {totalEntries} {totalEntries === 1 ? 'Eintrag' : 'Einträge'} gespeichert
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors text-text-secondary hover:text-white"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {totalEntries === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-6">
                  <div className="text-6xl mb-4">📋</div>
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Noch keine Einträge
                  </h3>
                  <p className="text-text-secondary text-sm">
                    Fülle den Agent-Flow aus, um deine Einträge hier zu sehen
                  </p>
                </div>
              ) : (
                sections.map((section) => (
                  <AgentProgressSection
                    key={section.id}
                    sectionId={section.id}
                    title={section.title}
                    icon={section.icon}
                    entries={section.entries}
                    formatEntry={section.formatEntry}
                    onDelete={(entryIndex) => onDeleteEntry(section.id, entryIndex)}
                    onEdit={(entryIndex, updatedData) => onEditEntry(section.id, entryIndex, updatedData)}
                    onAdd={(newEntry) => onAddEntry(section.id, newEntry)}
                    isExpanded={expandedSections.has(section.id)}
                    onToggle={() => toggleSection(section.id)}
                  />
                ))
              )}
            </div>

            <div className="p-4 border-t border-white border-opacity-10 bg-dark-bg bg-opacity-50">
              <p className="text-xs text-text-secondary text-center">
                💡 Tipp: Füge 3-5 relevante Einträge pro Sektion hinzu für den besten Eindruck
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
