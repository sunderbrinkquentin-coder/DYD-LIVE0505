import { useState } from 'react';
import { TrendingUp, Lock, Sparkles, ArrowRight, Target } from 'lucide-react';
import { LearningPath } from '../../types/learningPath';
import { LearningPathPaywall } from './LearningPathPaywall';

interface GapAnalysisWidgetProps {
  learningPath: LearningPath;
  onStartLearning?: () => void;
}

/**
 * Parses missing_skills / current_skills from any shape Make or Supabase returns:
 *  1. Already an array             → return as-is
 *  2. Valid JSON array string       → JSON.parse
 *  3. Make's "{obj1}, {obj2}" fmt  → wrap in [] and parse
 *  4. Single JSON object string    → wrap in array
 */
function toSkillArray(raw: unknown): import('../../types/learningPath').Skill[] {
  if (!raw) return [];

  if (Array.isArray(raw)) {
    return raw.map(normalizeSkillItem);
  }

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    // Try direct parse first (covers proper arrays and single objects)
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(normalizeSkillItem);
      if (typeof parsed === 'object' && parsed !== null) return [normalizeSkillItem(parsed)];
    } catch { /* fall through */ }

    // Make writes: {obj1}, {obj2}, ... — wrap in [] to make it valid JSON
    try {
      const wrapped = `[${trimmed}]`;
      const parsed = JSON.parse(wrapped);
      if (Array.isArray(parsed)) return parsed.map(normalizeSkillItem);
    } catch { /* fall through */ }
  }

  return [];
}

function normalizeSkillItem(item: any): import('../../types/learningPath').Skill {
  const rawSev = item.gap_severity;
  let priority: 'high' | 'medium' | 'low' = 'low';
  if (typeof rawSev === 'number') {
    priority = rawSev >= 4 ? 'high' : rawSev >= 3 ? 'medium' : 'low';
  } else if (typeof rawSev === 'string') {
    const lower = rawSev.toLowerCase();
    priority = lower === 'high' ? 'high' : lower === 'medium' ? 'medium' : 'low';
  } else if (item.priority) {
    priority = item.priority;
  }
  return {
    name: item.name ?? item.skill_name ?? item.skill ?? String(item),
    category: item.category ?? 'technical',
    priority,
    estimatedTime: item.estimatedTime ?? item.estimated_time ?? undefined,
  };
}

export function GapAnalysisWidget({ learningPath, onStartLearning }: GapAnalysisWidgetProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [localPaid, setLocalPaid] = useState(learningPath.is_paid);

  const missingSkills = toSkillArray(learningPath.missing_skills);
  const currentSkills = toSkillArray(learningPath.current_skills);
  const missingSkillsCount = missingSkills.length;
  const currentSkillsCount = currentSkills.length;
  const hasCurriculum = !!learningPath.curriculum;

  const handleStartLearning = () => {
    if (localPaid || hasCurriculum) {
      onStartLearning?.();
    } else {
      setShowPaywall(true);
    }
  };

  const prioritySkills = missingSkills
    .filter((skill) => skill.priority === 'high')
    .slice(0, 3);

  return (
    <>
      <div className="bg-gradient-to-br from-[#020617] via-[#0a0a1a] to-[#020617] rounded-3xl border border-white/10 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#66c0b6]/10 border border-[#66c0b6]/20">
                <Target size={16} className="text-[#66c0b6]" />
                <span className="text-sm font-medium text-[#66c0b6]">Gap-Analyse</span>
              </div>
              <h3 className="text-2xl font-bold text-white">{learningPath.target_job}</h3>
              {learningPath.target_company && (
                <p className="text-white/60">@ {learningPath.target_company}</p>
              )}
            </div>

            <div className="text-right">
              <div className="text-3xl font-bold text-white">{missingSkillsCount}</div>
              <p className="text-sm text-white/60">Skills zu erlernen</p>
            </div>
          </div>

          {learningPath.vision_description && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-sm text-white/70 italic">
                &ldquo;{learningPath.vision_description}&rdquo;
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-[#66c0b6]/10 to-transparent border border-[#66c0b6]/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-[#66c0b6]" />
                <span className="text-sm font-medium text-white/80">Bereits vorhanden</span>
              </div>
              <div className="text-2xl font-bold text-[#66c0b6]">{currentSkillsCount}</div>
              <p className="text-xs text-white/50 mt-1">Skills</p>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={20} className="text-blue-400" />
                <span className="text-sm font-medium text-white/80">Zu erlernen</span>
              </div>
              <div className="text-2xl font-bold text-blue-400">{missingSkillsCount}</div>
              <p className="text-xs text-white/50 mt-1">Skills</p>
            </div>
          </div>

          {prioritySkills && prioritySkills.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-white/80">
                Top Priority Skills
              </h4>
              <div className="space-y-2">
                {prioritySkills.map((skill, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 flex items-center justify-center">
                      <span className="text-sm font-bold text-red-300">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white">{(skill as any).skill_name ?? skill.name}</p>
                      {skill.estimatedTime && (
                        <p className="text-xs text-white/50">{skill.estimatedTime}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!learningPath.is_paid && !hasCurriculum && (
            <div className="relative p-6 rounded-xl bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-red-500/10 border border-yellow-500/20">
              <div className="absolute top-3 right-3">
                <Lock size={20} className="text-yellow-400" />
              </div>
              <h4 className="text-lg font-bold text-white mb-2">
                Personalisierten Lernpfad freischalten
              </h4>
              <p className="text-sm text-white/70 mb-4">
                Erhalte einen maßgeschneiderten Lernplan mit konkreten Ressourcen, Zeitplan und
                Zertifikat nach Abschluss.
              </p>
              <ul className="space-y-2 text-sm text-white/60">
                <li className="flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  5-10 strukturierte Lernmodule
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  Kuratierte Lernressourcen
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  Fortschrittstracking
                </li>
                <li className="flex items-center gap-2">
                  <Sparkles size={16} className="text-yellow-400" />
                  Abschlusszertifikat
                </li>
              </ul>
            </div>
          )}
        </div>

        <div className="p-6 bg-white/5 border-t border-white/10">
          <button
            onClick={handleStartLearning}
            className="group w-full py-4 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-lg hover:scale-[1.02] transition-all flex items-center justify-center gap-3"
          >
            {learningPath.is_paid || hasCurriculum ? (
              <>
                <Sparkles className="w-5 h-5" />
                Lernpfad starten
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                <Lock className="w-5 h-5" />
                Lernpfad freischalten
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </div>
      </div>

      {showPaywall && (
        <LearningPathPaywall
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          learningPathId={learningPath.id}
          targetJob={learningPath.target_job}
          targetCompany={learningPath.target_company}
          skillCount={missingSkillsCount}
        />
      )}
    </>
  );
}
