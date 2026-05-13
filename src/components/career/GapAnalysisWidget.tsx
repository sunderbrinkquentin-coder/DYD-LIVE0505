import { useState } from 'react';
import { TrendingUp, Lock, Sparkles, ArrowRight, Target, ChevronDown, ChevronUp, Zap, BookOpen } from 'lucide-react';
import { LearningPath } from '../../types/learningPath';
import { LearningPathPaywall } from './LearningPathPaywall';

interface GapAnalysisWidgetProps {
  learningPath: LearningPath;
  onStartLearning?: () => void;
}

function toSkillArray(raw: unknown): import('../../types/learningPath').Skill[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(normalizeSkillItem);
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed.map(normalizeSkillItem);
      if (typeof parsed === 'object' && parsed !== null) return [normalizeSkillItem(parsed)];
    } catch { /* fall through */ }
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

const PRIORITY_CONFIG = {
  high:   { label: 'Kritisch',  color: '#f97316', bg: 'rgba(249,115,22,0.08)',   border: 'rgba(249,115,22,0.25)',  dot: '#f97316' },
  medium: { label: 'Wichtig',   color: '#30E3CA', bg: 'rgba(48,227,202,0.07)',   border: 'rgba(48,227,202,0.22)',  dot: '#30E3CA' },
  low:    { label: 'Aufbau',    color: '#66c0b6', bg: 'rgba(102,192,182,0.06)',  border: 'rgba(102,192,182,0.18)', dot: '#66c0b6' },
};

export function GapAnalysisWidget({ learningPath, onStartLearning }: GapAnalysisWidgetProps) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [showAllSkills, setShowAllSkills] = useState(false);

  const missingSkills = toSkillArray(learningPath.missing_skills);
  const currentSkills = toSkillArray(learningPath.current_skills);
  const hasCurriculum = !!learningPath.curriculum;

  const handleStartLearning = () => {
    if (learningPath.is_paid || hasCurriculum) {
      onStartLearning?.();
    } else {
      setShowPaywall(true);
    }
  };

  // Group by priority for cognitive chunking
  const highPriority   = missingSkills.filter(s => s.priority === 'high');
  const mediumPriority = missingSkills.filter(s => s.priority === 'medium');
  const lowPriority    = missingSkills.filter(s => s.priority === 'low');

  const topSkills = highPriority.slice(0, 3);
  const visibleLow = showAllSkills ? lowPriority : lowPriority.slice(0, 2);

  // Match score indicator: what ratio of current vs required
  const totalRequired = missingSkills.length + currentSkills.length;
  const matchPct = totalRequired > 0 ? Math.round((currentSkills.length / totalRequired) * 100) : 0;

  return (
    <>
      <div
        className="rounded-3xl border border-white/10 overflow-hidden"
        style={{ background: 'linear-gradient(160deg,#06070f 0%,#0a0d1a 100%)' }}
      >
        {/* ── 1. ORIENTIERUNG (Was ist das Ziel?) ───────────────────── */}
        {/* CLT: Establish context first — single focus, no decoration */}
        <div className="px-6 pt-6 pb-5 border-b border-white/[0.07]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(48,227,202,0.1)', border: '1px solid rgba(48,227,202,0.2)' }}
              >
                <Target size={18} style={{ color: '#30E3CA' }} />
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/35 mb-0.5">Ziel-Position</p>
                <h3 className="text-xl font-black text-white leading-tight">{learningPath.target_job}</h3>
                {learningPath.target_company && (
                  <p className="text-sm text-white/45 mt-0.5">@ {learningPath.target_company}</p>
                )}
              </div>
            </div>

            {/* Match-Score: single number, clear meaning */}
            <div
              className="flex-shrink-0 flex flex-col items-center px-4 py-2.5 rounded-2xl text-center"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <span
                className="text-2xl font-black leading-none"
                style={{ color: matchPct >= 60 ? '#22c55e' : matchPct >= 35 ? '#f59e0b' : '#30E3CA' }}
              >
                {matchPct}%
              </span>
              <span className="text-[10px] text-white/35 mt-0.5 font-semibold">Basis</span>
            </div>
          </div>

          {learningPath.vision_description && (
            <div
              className="mt-4 flex gap-2.5 px-4 py-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
              <span className="text-white/25 mt-0.5 flex-shrink-0 text-sm">&ldquo;</span>
              <p className="text-sm text-white/55 italic leading-relaxed">{learningPath.vision_description}</p>
            </div>
          )}
        </div>

        {/* ── 2. STATUS-ÜBERBLICK (Wo stehst du?) ─────────────────── */}
        {/* CLT: Two numbers only — no overload, immediate comprehension */}
        <div className="px-6 py-5 border-b border-white/[0.07]">
          <p className="text-[11px] font-black uppercase tracking-widest text-white/30 mb-3">Dein aktueller Stand</p>
          <div className="grid grid-cols-2 gap-3">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(102,192,182,0.07)', border: '1px solid rgba(102,192,182,0.18)' }}
            >
              <TrendingUp size={18} style={{ color: '#66c0b6' }} className="flex-shrink-0" />
              <div>
                <div className="text-xl font-black text-white leading-none">{currentSkills.length}</div>
                <div className="text-[11px] text-white/45 mt-0.5">Skills vorhanden</div>
              </div>
            </div>
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(249,115,22,0.07)', border: '1px solid rgba(249,115,22,0.18)' }}
            >
              <Zap size={18} style={{ color: '#f97316' }} className="flex-shrink-0" />
              <div>
                <div className="text-xl font-black text-white leading-none">{missingSkills.length}</div>
                <div className="text-[11px] text-white/45 mt-0.5">Skills zu lernen</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── 3. PRIORISIERTE SKILLS (Was zuerst?) ─────────────────── */}
        {/* CLT: Chunked by priority — 3 groups max, highest first, collapsible low-prio */}
        {missingSkills.length > 0 && (
          <div className="px-6 py-5 space-y-5 border-b border-white/[0.07]">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/30">Lernreihenfolge</p>

            {/* High priority: full cards — most important gets most space */}
            {highPriority.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#f97316]" />
                  <span className="text-xs font-bold text-[#f97316]/80">Kritisch · Zuerst lernen</span>
                </div>
                {topSkills.map((skill, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{
                      background: PRIORITY_CONFIG.high.bg,
                      border: `1px solid ${PRIORITY_CONFIG.high.border}`,
                    }}
                  >
                    <span
                      className="flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black"
                      style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{skill.name}</p>
                      {skill.estimatedTime && (
                        <p className="text-[11px] text-white/40 mt-0.5">{skill.estimatedTime}</p>
                      )}
                    </div>
                  </div>
                ))}
                {highPriority.length > 3 && (
                  <p className="text-xs text-white/30 pl-1">+{highPriority.length - 3} weitere kritische Skills im Lernpfad</p>
                )}
              </div>
            )}

            {/* Medium priority: compact list */}
            {mediumPriority.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#30E3CA]" />
                  <span className="text-xs font-bold text-[#30E3CA]/70">Wichtig · Danach aufbauen</span>
                </div>
                {mediumPriority.slice(0, 3).map((skill, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(48,227,202,0.05)', border: '1px solid rgba(48,227,202,0.15)' }}
                  >
                    <BookOpen size={13} style={{ color: '#30E3CA' }} className="flex-shrink-0" />
                    <span className="text-sm text-white/75 truncate">{skill.name}</span>
                  </div>
                ))}
                {mediumPriority.length > 3 && (
                  <p className="text-xs text-white/30 pl-1">+{mediumPriority.length - 3} weitere</p>
                )}
              </div>
            )}

            {/* Low priority: minimal, collapsible to avoid overload */}
            {lowPriority.length > 0 && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#66c0b6]" />
                  <span className="text-xs font-bold text-[#66c0b6]/60">Aufbau · Langfristig</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {visibleLow.map((skill, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg text-xs text-white/45"
                      style={{ background: 'rgba(102,192,182,0.05)', border: '1px solid rgba(102,192,182,0.12)' }}
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
                {lowPriority.length > 2 && (
                  <button
                    onClick={() => setShowAllSkills(!showAllSkills)}
                    className="flex items-center gap-1 text-xs text-white/30 hover:text-white/55 transition-colors mt-0.5"
                  >
                    {showAllSkills ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showAllSkills ? 'Weniger anzeigen' : `+${lowPriority.length - 2} weitere anzeigen`}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── 4. PAYWALL-HINWEIS (optional, wenn nicht bezahlt) ────── */}
        {/* CLT: Single clear message, no list overload */}
        {!learningPath.is_paid && !hasCurriculum && (
          <div className="px-6 py-5 border-b border-white/[0.07]">
            <div
              className="flex items-start gap-3 px-4 py-4 rounded-2xl"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <Lock size={16} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white mb-1">Vollständigen Lernpfad freischalten</p>
                <p className="text-xs text-white/50 leading-relaxed">
                  Strukturierte Module, kuratierte Ressourcen, Zeitplan & Abschlusszertifikat — einmalig 9,99 €.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── 5. PRIMÄRE AKTION (Was soll ich tun?) ───────────────── */}
        {/* CLT: One clear CTA, no competing actions */}
        <div className="px-6 py-5">
          <button
            onClick={handleStartLearning}
            className="group w-full py-4 rounded-2xl font-black text-[15px] text-black flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg,#66c0b6,#30E3CA)',
              boxShadow: '0 4px 20px rgba(48,227,202,0.3)',
            }}
          >
            {learningPath.is_paid || hasCurriculum ? (
              <>
                <Sparkles size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                Lernpfad starten
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            ) : (
              <>
                <Lock size={18} />
                Lernpfad freischalten
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
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
          skillCount={missingSkills.length}
        />
      )}
    </>
  );
}
