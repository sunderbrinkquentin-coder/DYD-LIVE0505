import { useState } from 'react';
import {
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
  BookOpen,
  Target,
  Zap,
} from 'lucide-react';
import { LearningPath, LearningModule } from '../../types/learningPath';
import { careerService } from '../../services/careerService';

interface LearningPathDashboardProps {
  learningPath: LearningPath;
  onCertificateRequest?: () => void;
}

const RESOURCE_ICONS: Record<string, React.ReactNode> = {
  course:   <Sparkles size={15} style={{ color: '#30E3CA' }} />,
  book:     <BookOpen size={15} style={{ color: '#66c0b6' }} />,
  article:  <BookOpen size={15} style={{ color: '#66c0b6' }} />,
  video:    <PlayCircle size={15} style={{ color: '#f97316' }} />,
  practice: <Zap size={15} style={{ color: '#f59e0b' }} />,
};

function getModulePhaseLabel(index: number, total: number): string {
  const third = Math.ceil(total / 3);
  if (index < third) return 'Fundament';
  if (index < third * 2) return 'Aufbau';
  return 'Vertiefung';
}

function getModulePhaseColor(index: number, total: number) {
  const third = Math.ceil(total / 3);
  if (index < third) return { color: '#30E3CA', bg: 'rgba(48,227,202,0.08)', border: 'rgba(48,227,202,0.2)' };
  if (index < third * 2) return { color: '#66c0b6', bg: 'rgba(102,192,182,0.08)', border: 'rgba(102,192,182,0.2)' };
  return { color: '#f97316', bg: 'rgba(249,115,22,0.08)', border: 'rgba(249,115,22,0.2)' };
}

export function LearningPathDashboard({
  learningPath: initialPath,
  onCertificateRequest,
}: LearningPathDashboardProps) {
  const [localProgress, setLocalProgress] = useState<Record<string, { status: 'not_started' | 'in_progress' | 'completed' }>>(
    () => Object.fromEntries(
      Object.entries(initialPath.progress ?? {}).map(([k, v]) => [k, { status: v.status }])
    )
  );
  const [localCompleted, setLocalCompleted] = useState(initialPath.status === 'completed');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [updatingModule, setUpdatingModule] = useState<string | null>(null);

  // Merge local progress into the path object for display
  const learningPath: LearningPathDashboardProps['learningPath'] = {
    ...initialPath,
    status: localCompleted ? 'completed' : initialPath.status,
    progress: {
      ...initialPath.progress,
      ...Object.fromEntries(
        Object.entries(localProgress).map(([k, v]) => [k, { ...(initialPath.progress?.[k] ?? {}), status: v.status } as any])
      ),
    },
  };

  const completionPercentage = careerService.calculateCompletionPercentage(learningPath);
  const estimatedCompletion = careerService.getEstimatedCompletionDate(learningPath);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  };

  const handleModuleStatusChange = async (
    moduleId: string,
    status: 'not_started' | 'in_progress' | 'completed'
  ) => {
    // Optimistic update
    setLocalProgress(prev => ({ ...prev, [moduleId]: { status } }));
    setUpdatingModule(moduleId);

    try {
      await careerService.updateModuleProgress(learningPath.id, moduleId, { status });

      // Check if all modules are now completed
      const sortedMods = [...(learningPath.curriculum?.modules || [])].sort((a, b) => a.order - b.order);
      const updatedProgress = { ...localProgress, [moduleId]: { status } };
      const allDone = sortedMods.every(m => updatedProgress[m.id]?.status === 'completed');
      if (allDone) setLocalCompleted(true);
    } catch (error) {
      console.error('Failed to update module status:', error);
      // Revert on failure
      setLocalProgress(prev => ({ ...prev, [moduleId]: { status: initialPath.progress?.[moduleId]?.status ?? 'not_started' } }));
    } finally {
      setUpdatingModule(null);
    }
  };

  const getModuleStatus = (moduleId: string) =>
    localProgress[moduleId]?.status ?? learningPath.progress?.[moduleId]?.status ?? 'not_started';

  const sortedModules = [...(learningPath.curriculum?.modules || [])].sort(
    (a, b) => a.order - b.order
  );
  const total = sortedModules.length;
  const completedCount = sortedModules.filter(m => getModuleStatus(m.id) === 'completed').length;
  const inProgressModule = sortedModules.find(m => getModuleStatus(m.id) === 'in_progress');
  const nextModule = sortedModules.find(m => getModuleStatus(m.id) === 'not_started');
  const isCompleted = localCompleted || learningPath.status === 'completed';

  return (
    <div className="space-y-6">

      {/* ── 1. ORIENTIERUNG: Wo bin ich & was ist das Ziel ─────────── */}
      {/* CLT: Establish mental model first — target + single progress number */}
      <div
        className="rounded-3xl p-6 space-y-5"
        style={{ background: 'linear-gradient(160deg,#06070f 0%,#0a0d1a 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(48,227,202,0.1)', border: '1px solid rgba(48,227,202,0.2)' }}
            >
              <Target size={20} style={{ color: '#30E3CA' }} />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/30 mb-0.5">Dein Lernpfad</p>
              <h2 className="text-2xl font-black text-white leading-tight">{learningPath.target_job}</h2>
              {learningPath.target_company && (
                <p className="text-sm text-white/45">@ {learningPath.target_company}</p>
              )}
            </div>
          </div>

          <div className="flex-shrink-0 flex flex-col items-center gap-1">
            {isCompleted && learningPath.certificate_url ? (
              <a
                href={learningPath.certificate_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold transition-all hover:scale-105"
                style={{ background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.25)', color: '#fbbf24' }}
              >
                <Award size={16} />
                Zertifikat
              </a>
            ) : isCompleted && !learningPath.certificate_url ? (
              <button
                onClick={onCertificateRequest}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold text-black transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}
              >
                <Download size={16} />
                Zertifikat
              </button>
            ) : null}
          </div>
        </div>

        {/* Progress: single clear number + bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50 font-medium">
              {completedCount} von {total} Modulen abgeschlossen
            </span>
            <span
              className="font-black text-base"
              style={{ color: completionPercentage === 100 ? '#22c55e' : '#30E3CA' }}
            >
              {completionPercentage}%
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${completionPercentage}%`,
                background: completionPercentage === 100
                  ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                  : 'linear-gradient(90deg,#66c0b6,#30E3CA)',
              }}
            />
          </div>
          {estimatedCompletion && !isCompleted && (
            <p className="text-xs text-white/30">
              Voraussichtlicher Abschluss: {estimatedCompletion.toLocaleDateString('de-DE')}
            </p>
          )}
        </div>

        {/* Secondary stats: small, not competing with progress */}
        <div className="flex items-center gap-4 pt-1">
          <div className="flex items-center gap-1.5 text-xs text-white/35">
            <Clock size={13} style={{ color: '#66c0b6' }} />
            <span>{learningPath.curriculum?.totalDuration || 'N/A'} Gesamtdauer</span>
          </div>
          {inProgressModule && (
            <div className="flex items-center gap-1.5 text-xs text-white/35">
              <PlayCircle size={13} style={{ color: '#30E3CA' }} />
              <span className="truncate max-w-[180px]">Aktiv: {inProgressModule.title}</span>
            </div>
          )}
        </div>
      </div>

      {/* ── 2. NÄCHSTER SCHRITT (Was soll ich jetzt tun?) ─────────── */}
      {/* CLT: Reduce decision paralysis — surface the one next action */}
      {!isCompleted && (inProgressModule || nextModule) && (
        <div
          className="rounded-2xl px-5 py-4 flex items-center gap-4"
          style={{ background: 'rgba(48,227,202,0.06)', border: '1px solid rgba(48,227,202,0.2)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(48,227,202,0.12)', border: '1px solid rgba(48,227,202,0.25)' }}
          >
            <Zap size={16} style={{ color: '#30E3CA' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-black uppercase tracking-widest text-[#30E3CA]/60 mb-0.5">
              {inProgressModule ? 'Weitermachen' : 'Als nächstes'}
            </p>
            <p className="text-sm font-bold text-white truncate">
              {(inProgressModule || nextModule)?.title}
            </p>
          </div>
          <button
            onClick={() => {
              const m = inProgressModule || nextModule;
              if (m) toggleModule(m.id);
            }}
            className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-black transition-all hover:scale-105"
            style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}
          >
            Öffnen
          </button>
        </div>
      )}

      {/* ── 3. LERNMODULE: Phasiert nach Schema-Aufbau ──────────────── */}
      {/* CLT: Modules grouped in 3 learning phases (Fundament/Aufbau/Vertiefung) */}
      {/* Each module expands progressively — details only when needed */}
      <div className="space-y-3">
        <p className="text-[11px] font-black uppercase tracking-widest text-white/30 px-1">Module</p>

        {sortedModules.map((module, index) => {
          const moduleStatus = getModuleStatus(module.id);
          const isExpanded = expandedModules.has(module.id);
          const isModuleCompleted = moduleStatus === 'completed';
          const isModuleInProgress = moduleStatus === 'in_progress';
          const phase = getModulePhaseColor(index, total);

          return (
            <div
              key={module.id}
              className="rounded-2xl overflow-hidden transition-all duration-200"
              style={{
                background: isModuleCompleted
                  ? 'rgba(34,197,94,0.04)'
                  : isModuleInProgress
                  ? 'rgba(48,227,202,0.05)'
                  : 'rgba(255,255,255,0.03)',
                border: `1px solid ${
                  isModuleCompleted
                    ? 'rgba(34,197,94,0.2)'
                    : isModuleInProgress
                    ? 'rgba(48,227,202,0.2)'
                    : 'rgba(255,255,255,0.07)'
                }`,
              }}
            >
              {/* Module header — always visible, contains essential info only */}
              <button
                onClick={() => toggleModule(module.id)}
                className="w-full px-5 py-4 flex items-center gap-4 text-left transition-all hover:bg-white/[0.025]"
              >
                {/* Status icon */}
                <div className="flex-shrink-0">
                  {isModuleCompleted ? (
                    <CheckCircle2 size={22} style={{ color: '#22c55e' }} />
                  ) : isModuleInProgress ? (
                    <PlayCircle size={22} style={{ color: '#30E3CA' }} />
                  ) : (
                    <Circle size={22} style={{ color: 'rgba(255,255,255,0.2)' }} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Phase label + module number: context without overload */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: phase.color + 'aa' }}>
                      {getModulePhaseLabel(index, total)}
                    </span>
                    <span className="text-[10px] text-white/25">· Modul {index + 1}</span>
                  </div>
                  <h4 className="text-base font-bold text-white leading-snug truncate">{module.title}</h4>
                  {/* Only show description when collapsed — reduces visual noise */}
                  {!isExpanded && (
                    <p className="text-xs text-white/40 mt-0.5 truncate">{module.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-white/30 hidden sm:flex items-center gap-1">
                    <Clock size={12} />
                    {module.estimatedDuration}
                  </span>
                  {isExpanded
                    ? <ChevronUp size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    : <ChevronDown size={18} style={{ color: 'rgba(255,255,255,0.3)' }} />
                  }
                </div>
              </button>

              {/* Expanded content — progressive disclosure */}
              {isExpanded && (
                <div
                  className="px-5 pb-5 pt-3 space-y-5"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                  {/* Description */}
                  <p className="text-sm text-white/60 leading-relaxed">{module.description}</p>

                  {/* Skills: small chips, low visual weight */}
                  {module.skills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/25">Skills in diesem Modul</p>
                      <div className="flex flex-wrap gap-1.5">
                        {module.skills.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg text-xs text-white/55"
                            style={{ background: phase.bg, border: `1px solid ${phase.border}` }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Resources: titled list, icon communicates type */}
                  {module.resources && module.resources.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/25">Lernressourcen</p>
                      <div className="space-y-1.5">
                        {module.resources.map((resource, idx) => (
                          <a
                            key={idx}
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(102,192,182,0.3)')}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
                          >
                            <div
                              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                              style={{ background: 'rgba(255,255,255,0.05)' }}
                            >
                              {RESOURCE_ICONS[resource.type] ?? <BookOpen size={15} style={{ color: '#66c0b6' }} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white/85 group-hover:text-white transition-colors truncate">
                                {resource.title}
                              </p>
                              {resource.provider && (
                                <p className="text-xs text-white/35">{resource.provider}</p>
                              )}
                            </div>
                            <ExternalLink size={14} style={{ color: 'rgba(255,255,255,0.2)' }} className="flex-shrink-0 group-hover:text-[#66c0b6] transition-colors" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Milestones: checklist — clear goal signposts */}
                  {module.milestones && module.milestones.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[11px] font-black uppercase tracking-widest text-white/25">Meilensteine</p>
                      <div className="space-y-1.5">
                        {module.milestones.map((milestone, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <CheckCircle2 size={14} style={{ color: '#66c0b6' }} className="flex-shrink-0 mt-0.5" />
                            <span className="text-sm text-white/60 leading-snug">{milestone}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Module action: single clear next step */}
                  <div
                    className="flex items-center gap-3 pt-2"
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                  >
                    {moduleStatus === 'not_started' && (
                      <button
                        onClick={() => handleModuleStatusChange(module.id, 'in_progress')}
                        disabled={updatingModule === module.id}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm text-white flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ background: 'rgba(48,227,202,0.15)', border: '1px solid rgba(48,227,202,0.3)' }}
                      >
                        {updatingModule === module.id ? (
                          <div className="w-4 h-4 rounded-full border-2 border-[#30E3CA]/40 border-t-[#30E3CA] animate-spin" />
                        ) : (
                          <PlayCircle size={16} style={{ color: '#30E3CA' }} />
                        )}
                        <span style={{ color: '#30E3CA' }}>Modul starten</span>
                      </button>
                    )}
                    {moduleStatus === 'in_progress' && (
                      <button
                        onClick={() => handleModuleStatusChange(module.id, 'completed')}
                        disabled={updatingModule === module.id}
                        className="px-5 py-2.5 rounded-xl font-bold text-sm text-black flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-60 disabled:cursor-not-allowed"
                        style={{ background: 'linear-gradient(135deg,#66c0b6,#30E3CA)' }}
                      >
                        {updatingModule === module.id ? (
                          <div className="w-4 h-4 rounded-full border-2 border-black/30 border-t-black animate-spin" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}
                        Als abgeschlossen markieren
                      </button>
                    )}
                    {moduleStatus === 'completed' && (
                      <div
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold"
                        style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}
                      >
                        <CheckCircle2 size={15} />
                        Abgeschlossen
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── 4. ABSCHLUSS: Belohnung & nächster Schritt ──────────────── */}
      {/* CLT: Positive reinforcement anchors the schema — completion = reward */}
      {isCompleted && (
        <div
          className="rounded-3xl p-8 text-center space-y-4"
          style={{ background: 'linear-gradient(135deg,rgba(234,179,8,0.08) 0%,rgba(249,115,22,0.06) 100%)', border: '1px solid rgba(234,179,8,0.2)' }}
        >
          <Award size={44} style={{ color: '#fbbf24' }} className="mx-auto" />
          <div>
            <h3 className="text-2xl font-black text-white mb-1">Herzlichen Glückwunsch!</h3>
            <p className="text-sm text-white/55 max-w-sm mx-auto">
              Du hast alle Module erfolgreich abgeschlossen. Lade dir jetzt dein Zertifikat herunter.
            </p>
          </div>
          {!learningPath.certificate_url && onCertificateRequest && (
            <button
              onClick={onCertificateRequest}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg,#f59e0b,#f97316)' }}
            >
              <Download size={18} />
              Zertifikat erstellen
            </button>
          )}
        </div>
      )}
    </div>
  );
}
