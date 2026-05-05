import { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Clock,
  Award,
  Download,
  ChevronDown,
  ChevronUp,
  PlayCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { LearningPath, LearningModule } from '../../types/learningPath';
import { careerService } from '../../services/careerService';

interface LearningPathDashboardProps {
  learningPath: LearningPath;
  onCertificateRequest?: () => void;
}

export function LearningPathDashboard({
  learningPath,
  onCertificateRequest,
}: LearningPathDashboardProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const completionPercentage = careerService.calculateCompletionPercentage(learningPath);
  const estimatedCompletion = careerService.getEstimatedCompletionDate(learningPath);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) {
        next.delete(moduleId);
      } else {
        next.add(moduleId);
      }
      return next;
    });
  };

  const handleModuleStatusChange = async (
    moduleId: string,
    status: 'not_started' | 'in_progress' | 'completed'
  ) => {
    try {
      await careerService.updateModuleProgress(learningPath.id, moduleId, { status });
      window.location.reload();
    } catch (error) {
      console.error('Failed to update module status:', error);
    }
  };

  const getModuleStatus = (moduleId: string) => {
    return learningPath.progress?.[moduleId]?.status || 'not_started';
  };

  const sortedModules = [...(learningPath.curriculum?.modules || [])].sort(
    (a, b) => a.order - b.order
  );

  const isCompleted = learningPath.status === 'completed';

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-[#020617] via-[#0a0a1a] to-[#020617] rounded-3xl border border-white/10 p-8">
        <div className="flex items-start justify-between mb-6">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-white">{learningPath.target_job}</h2>
            {learningPath.target_company && (
              <p className="text-white/60">@ {learningPath.target_company}</p>
            )}
          </div>

          {isCompleted && learningPath.certificate_url && (
            <a
              href={learningPath.certificate_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 text-yellow-300 hover:scale-105 transition-all"
            >
              <Award size={20} />
              <span className="font-semibold">Zertifikat anzeigen</span>
            </a>
          )}

          {isCompleted && !learningPath.certificate_url && (
            <button
              onClick={onCertificateRequest}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold hover:scale-105 transition-all"
            >
              <Download size={20} />
              Zertifikat erstellen
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={20} className="text-[#66c0b6]" />
              <span className="text-sm font-medium text-white/80">Module</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {Object.values(learningPath.progress || {}).filter((p: any) => p.status === 'completed')
                .length}{' '}
              / {sortedModules.length}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={20} className="text-blue-400" />
              <span className="text-sm font-medium text-white/80">Gesamtdauer</span>
            </div>
            <div className="text-2xl font-bold text-white">
              {learningPath.curriculum?.totalDuration || 'N/A'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={20} className="text-yellow-400" />
              <span className="text-sm font-medium text-white/80">Fortschritt</span>
            </div>
            <div className="text-2xl font-bold text-white">{completionPercentage}%</div>
          </div>
        </div>

        <div className="relative pt-2 pb-1">
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {estimatedCompletion && !isCompleted && (
            <p className="text-xs text-white/50 mt-2">
              Voraussichtlicher Abschluss: {estimatedCompletion.toLocaleDateString('de-DE')}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">Lernmodule</h3>

        {sortedModules.map((module, index) => {
          const moduleStatus = getModuleStatus(module.id);
          const isExpanded = expandedModules.has(module.id);
          const isModuleCompleted = moduleStatus === 'completed';
          const isModuleInProgress = moduleStatus === 'in_progress';

          return (
            <div
              key={module.id}
              className={`
                bg-white/5 backdrop-blur-xl border rounded-2xl overflow-hidden transition-all
                ${
                  isModuleCompleted
                    ? 'border-[#66c0b6]/50'
                    : isModuleInProgress
                    ? 'border-blue-500/50'
                    : 'border-white/10'
                }
              `}
            >
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full p-6 flex items-start gap-4 hover:bg-white/5 transition-all"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-[#66c0b6]/20 to-[#30E3CA]/20 border border-[#66c0b6]/30 flex items-center justify-center">
                  {isModuleCompleted ? (
                    <CheckCircle2 size={24} className="text-[#66c0b6]" />
                  ) : isModuleInProgress ? (
                    <PlayCircle size={24} className="text-blue-400" />
                  ) : (
                    <Circle size={24} className="text-white/30" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-white/50">Modul {index + 1}</span>
                        {isModuleCompleted && (
                          <span className="px-2 py-0.5 rounded-full bg-[#66c0b6]/20 text-[#66c0b6] text-xs font-medium">
                            Abgeschlossen
                          </span>
                        )}
                        {isModuleInProgress && (
                          <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-medium">
                            In Bearbeitung
                          </span>
                        )}
                      </div>
                      <h4 className="text-lg font-semibold text-white mb-2">{module.title}</h4>
                      <p className="text-sm text-white/70 mb-3">{module.description}</p>
                      <div className="flex items-center gap-4 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {module.estimatedDuration}
                        </span>
                        <span>{module.skills.length} Skills</span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {isExpanded ? (
                        <ChevronUp size={24} className="text-white/50" />
                      ) : (
                        <ChevronDown size={24} className="text-white/50" />
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {isExpanded && (
                <div className="px-6 pb-6 space-y-6 border-t border-white/10 pt-6">
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-white/80">Zu lernende Skills</h5>
                    <div className="flex flex-wrap gap-2">
                      {module.skills.map((skill, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-white/80"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {module.resources && module.resources.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-white/80">Lernressourcen</h5>
                      <div className="space-y-2">
                        {module.resources.map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 hover:border-[#66c0b6]/50 transition-all"
                          >
                            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#66c0b6]/20 to-[#30E3CA]/20 flex items-center justify-center">
                              <BookOpen size={20} className="text-[#66c0b6]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-white group-hover:text-[#66c0b6] transition-colors">
                                {resource.title}
                              </p>
                              {resource.provider && (
                                <p className="text-xs text-white/50">{resource.provider}</p>
                              )}
                            </div>
                            <ExternalLink
                              size={16}
                              className="flex-shrink-0 text-white/30 group-hover:text-[#66c0b6] transition-colors"
                            />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {module.milestones && module.milestones.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-semibold text-white/80">Meilensteine</h5>
                      <div className="space-y-2">
                        {module.milestones.map((milestone, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-xl bg-white/5"
                          >
                            <CheckCircle2 size={16} className="flex-shrink-0 text-[#66c0b6] mt-0.5" />
                            <span className="text-sm text-white/80">{milestone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 pt-4 border-t border-white/10">
                    {moduleStatus === 'not_started' && (
                      <button
                        onClick={() => handleModuleStatusChange(module.id, 'in_progress')}
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold hover:scale-105 transition-all"
                      >
                        <PlayCircle size={18} className="inline mr-2" />
                        Modul starten
                      </button>
                    )}

                    {moduleStatus === 'in_progress' && (
                      <button
                        onClick={() => handleModuleStatusChange(module.id, 'completed')}
                        className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold hover:scale-105 transition-all"
                      >
                        <CheckCircle2 size={18} className="inline mr-2" />
                        Als abgeschlossen markieren
                      </button>
                    )}

                    {moduleStatus === 'completed' && (
                      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/20 text-[#66c0b6]">
                        <CheckCircle2 size={18} />
                        <span className="font-semibold">Abgeschlossen</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {isCompleted && (
        <div className="bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20 rounded-2xl p-8 text-center space-y-4">
          <Award size={48} className="text-yellow-400 mx-auto" />
          <h3 className="text-2xl font-bold text-white">Herzlichen Glückwunsch!</h3>
          <p className="text-white/70 max-w-2xl mx-auto">
            Du hast alle Module erfolgreich abgeschlossen. Lade dir jetzt dein Zertifikat herunter!
          </p>
          {!learningPath.certificate_url && onCertificateRequest && (
            <button
              onClick={onCertificateRequest}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold hover:scale-105 transition-all"
            >
              <Download size={20} className="inline mr-2" />
              Zertifikat erstellen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
