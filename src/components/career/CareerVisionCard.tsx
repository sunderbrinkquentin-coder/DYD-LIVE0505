import { useState } from 'react';
import {
  ArrowRight, Sparkles, TrendingUp, Zap, Target, Building2,
  Lock, Brain, ChevronRight, CheckCircle2, XCircle, Flame,
  Lightbulb, BarChart3, Trophy, PlayCircle, BookOpen, Wrench,
} from 'lucide-react';
import { LearningPath, Skill } from '../../types/learningPath';
import { LearningPathPaywall } from './LearningPathPaywall';

// ── Skill normalization ────────────────────────────────────────────────────────

function toSkillArray(raw: unknown): (Skill & Record<string, any>)[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== 'string') return [];
  const s = raw.trim();
  if (!s) return [];
  try {
    const p = JSON.parse(s);
    return Array.isArray(p) ? p : [p];
  } catch { /* fall through */ }
  try {
    const p = JSON.parse(`[${s}]`);
    return Array.isArray(p) ? p : [];
  } catch { return []; }
}

function skillName(s: Skill & Record<string, any>): string {
  return (s as any).skill_name || s.name || '';
}

// Handles both numeric (1-5) and string ("High"/"Medium"/"Low") severity
function severityOf(s: Skill & Record<string, any>): number {
  const raw = (s as any).gap_severity;
  if (typeof raw === 'number') return raw;
  if (typeof raw === 'string') {
    const lower = raw.toLowerCase();
    if (lower === 'high') return 4;
    if (lower === 'medium') return 3;
    if (lower === 'low') return 2;
  }
  // Fallback from priority field
  if (s.priority === 'high') return 4;
  if (s.priority === 'medium') return 3;
  return 2;
}

function categoryOf(s: Skill & Record<string, any>): 'Hard' | 'Soft' {
  const cat = (s as any).category;
  if (typeof cat === 'string' && cat.toLowerCase() === 'soft') return 'Soft';
  return 'Hard';
}

// ── Color palette ──────────────────────────────────────────────────────────────

const SKILL_PALETTE = [
  { color: '#30E3CA', bg: 'rgba(48,227,202,0.10)',  border: 'rgba(48,227,202,0.25)' }, // teal
  { color: '#f97316', bg: 'rgba(249,115,22,0.10)',  border: 'rgba(249,115,22,0.25)' }, // orange
  { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.22)'  }, // green
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.22)' }, // amber
  { color: '#38bdf8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.22)' }, // sky
  { color: '#fb7185', bg: 'rgba(251,113,133,0.10)', border: 'rgba(251,113,133,0.22)' }, // rose
];

const TIERS = [
  { min: 4, palette: 0, label: 'Top-Hebel',    icon: Flame },
  { min: 3, palette: 1, label: 'Hoher Impact',  icon: TrendingUp },
  { min: 2, palette: 2, label: 'Quick Win',     icon: Lightbulb },
  { min: 0, palette: 4, label: 'Nice-to-have',  icon: BarChart3 },
];

function tierOf(sev: number) {
  return TIERS.find((t) => sev >= t.min) ?? TIERS[TIERS.length - 1];
}
function paletteOf(sev: number) {
  const t = tierOf(sev);
  return SKILL_PALETTE[t.palette];
}

// ── Readiness ring ─────────────────────────────────────────────────────────────

function ReadinessRing({ score }: { score: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#30E3CA';
  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg viewBox="0 0 76 76" className="w-full h-full -rotate-90">
        <circle cx="38" cy="38" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
        <circle cx="38" cy="38" r={r} fill="none" stroke={color} strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * circ} ${circ}`}
          style={{ transition: 'stroke-dasharray 1.2s ease' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[17px] font-black leading-none" style={{ color }}>{score}%</span>
        <span className="text-[8px] text-white/35 font-bold uppercase tracking-wide mt-0.5">Match</span>
      </div>
    </div>
  );
}

// ── Skill Tile — used in compact grid ─────────────────────────────────────────

function SkillTile({
  skill, index, targetJob, onStart, isLocked,
}: {
  skill: Skill & Record<string, any>;
  index: number;
  targetJob: string;
  onStart: () => void;
  isLocked: boolean;
}) {
  const name  = skillName(skill);
  const sev   = severityOf(skill);
  const t     = tierOf(sev);
  const p     = paletteOf(sev);
  const pitch = (skill as any).pitch || '';
  const cat   = categoryOf(skill);
  const TierIcon = t.icon;
  const CatIcon  = cat === 'Hard' ? Wrench : Brain;

  if (!name) return null;

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col group/tile cursor-pointer transition-all duration-200 hover:scale-[1.015]"
      style={{ background: p.bg, border: `1px solid ${p.border}` }}
      onClick={onStart}
    >
      {/* Top accent line */}
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg,${p.color},transparent 70%)` }} />

      {/* Corner number badge */}
      <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
        style={{ background: 'rgba(0,0,0,0.40)', color: p.color }}>
        {index + 1}
      </div>

      <div className="p-4 flex flex-col gap-2.5 flex-1">
        {/* Tier + category badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1">
            <TierIcon size={10} style={{ color: p.color }} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: p.color }}>
              {t.label}
            </span>
          </div>
          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)' }}>
            <CatIcon size={8} />{cat}
          </span>
        </div>

        {/* Skill name */}
        <h4 className="text-[13px] font-black text-white leading-snug pr-4">{name}</h4>

        {/* Pitch */}
        {pitch ? (
          <p className="text-[11px] text-white/55 leading-relaxed flex-1 line-clamp-3">{pitch}</p>
        ) : (
          <p className="text-[11px] text-white/35 leading-relaxed flex-1">
            Kritischer Skill für den Karriereschritt zum {targetJob}.
          </p>
        )}

        {/* Impact bar */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 flex-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full"
                style={{ background: i < sev ? p.color : 'rgba(255,255,255,0.06)' }} />
            ))}
          </div>
          <span className="text-[9px] text-white/30 font-bold whitespace-nowrap">Impact {sev}/5</span>
        </div>

        {/* Start CTA */}
        <button
          className="mt-1 w-full py-2 rounded-xl text-[11px] font-black flex items-center justify-center gap-1.5 transition-all duration-150 group-hover/tile:gap-2"
          style={{
            background: isLocked ? 'rgba(255,255,255,0.05)' : `${p.color}18`,
            border: isLocked ? '1px solid rgba(255,255,255,0.10)' : `1px solid ${p.border}`,
            color: isLocked ? 'rgba(255,255,255,0.40)' : p.color,
          }}
          onClick={(e) => { e.stopPropagation(); onStart(); }}
        >
          {isLocked ? (
            <><Lock size={10} />Lernpfad freischalten</>
          ) : (
            <><PlayCircle size={10} />Lernpfad starten<ArrowRight size={9} className="transition-transform group-hover/tile:translate-x-0.5" /></>
          )}
        </button>
      </div>
    </div>
  );
}

// ── Skill Row — used in detail view, expandable ───────────────────────────────

function SkillRow({
  skill, rank, targetJob, targetCompany, isFirst, onStart, isLocked,
}: {
  skill: Skill & Record<string, any>;
  rank: number;
  targetJob: string;
  targetCompany?: string;
  isFirst: boolean;
  onStart: () => void;
  isLocked: boolean;
}) {
  const [open, setOpen] = useState(false);
  const name  = skillName(skill);
  const sev   = severityOf(skill);
  const p     = paletteOf(sev);
  const t     = tierOf(sev);
  const pitch = (skill as any).pitch || '';
  const bonus = (skill as any).market_value_bonus || '';
  const cat   = categoryOf(skill);
  const TierIcon = t.icon;
  const CatIcon  = cat === 'Hard' ? Wrench : Brain;

  if (!name) return null;

  return (
    <div className="overflow-hidden transition-all duration-300 group/row"
      style={{
        borderRadius: '14px',
        border: `1px solid ${open ? p.color + '40' : 'rgba(255,255,255,0.07)'}`,
        background: open ? p.bg : 'rgba(255,255,255,0.015)',
      }}>
      <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        onClick={() => setOpen((v) => !v)}>
        <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black"
          style={{ background: isFirst ? p.color : 'rgba(255,255,255,0.06)', color: isFirst ? '#000' : p.color }}>
          {rank}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white text-[13px] leading-snug">{name}</span>
            <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' }}>
              <CatIcon size={8} />{cat}
            </span>
            {isFirst && (
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{ background: p.color, color: '#000' }}>
                Einstieg
              </span>
            )}
          </div>
          {pitch && !open && (
            <p className="text-[11px] text-white/40 mt-0.5 truncate">{pitch}</p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {bonus && (
            <span className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black text-amber-300"
              style={{ background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)' }}>
              <Zap size={8} />{bonus}
            </span>
          )}
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="w-1.5 h-3 rounded-sm"
                style={{ background: i < sev ? p.color : 'rgba(255,255,255,0.06)' }} />
            ))}
          </div>
          <ChevronRight size={13} className="text-white/25 transition-transform duration-200 flex-shrink-0"
            style={{ transform: open ? 'rotate(90deg)' : 'rotate(0)' }} />
        </div>
      </button>

      <div className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? '320px' : '0', opacity: open ? 1 : 0 }}>
        <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: `${p.color}15` }}>
          {pitch && <p className="text-[12px] text-white/65 leading-relaxed pt-3">{pitch}</p>}
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)' }}>
              <div className="flex items-center gap-1.5">
                <XCircle size={11} className="text-red-400 flex-shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-wider text-red-400">Ohne diesen Skill</p>
              </div>
              <p className="text-[11px] text-white/55 leading-relaxed">
                Riskierst du, bei {targetCompany || 'Top-Arbeitgebern'} nicht in die engere Wahl zu kommen.
              </p>
            </div>
            <div className="rounded-xl p-3 space-y-1" style={{ background: p.bg, border: `1px solid ${p.border}` }}>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={11} style={{ color: p.color }} className="flex-shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-wider" style={{ color: p.color }}>Mit diesem Skill</p>
              </div>
              <p className="text-[11px] text-white/55 leading-relaxed">
                {bonus || `Erhöht deinen Marktwert als ${targetJob} deutlich.`}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] text-white/30">
              <TierIcon size={10} style={{ color: p.color }} />
              <span style={{ color: p.color }}>{t.label}</span>
              <span className="mx-1">·</span>
              <span>Impact {sev}/5</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onStart(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black transition-all hover:scale-105"
              style={{
                background: isLocked ? 'rgba(255,255,255,0.05)' : `${p.color}18`,
                border: isLocked ? '1px solid rgba(255,255,255,0.10)' : `1px solid ${p.border}`,
                color: isLocked ? 'rgba(255,255,255,0.45)' : p.color,
              }}
            >
              {isLocked ? <><Lock size={10} />Freischalten</> : <><PlayCircle size={10} />Jetzt starten</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────────────────────────

interface CareerVisionCardProps {
  learningPath: LearningPath;
  variant?: 'compact' | 'detail';
  onStartLearning?: (skillIndex?: number) => void;
}

// ── COMPACT variant ───────────────────────────────────────────────────────────

function CompactCard({ learningPath, onStartLearning }: Omit<CareerVisionCardProps, 'variant'>) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [localPaid, setLocalPaid] = useState(learningPath.is_paid);
  const [pendingSkill, setPendingSkill] = useState<string | undefined>(undefined);

  const missing      = toSkillArray(learningPath.missing_skills);
  const sorted       = [...missing].sort((a, b) => severityOf(b) - severityOf(a));
  const topSkills    = sorted.slice(0, 4);
  const score        = learningPath.match_score ?? 0;
  const outlook      = learningPath.strategic_outlook_2026 ?? (learningPath as any).market_trend_2026 ?? '';
  const isPaidOrFree = localPaid || !!learningPath.curriculum;
  const accentColor  = sorted[0] ? paletteOf(severityOf(sorted[0])).color : '#30E3CA';

  const handleCta = (skillIdx?: number) => {
    if (isPaidOrFree) onStartLearning?.(skillIdx);
    else {
      setPendingSkill(skillIdx !== undefined ? sorted[skillIdx]?.name : undefined);
      setShowPaywall(true);
    }
  };

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg,rgba(10,14,30,0.98),rgba(15,20,40,0.99))',
          border: `1px solid ${accentColor}25`,
        }}>
        <div className="h-[3px]"
          style={{ background: `linear-gradient(90deg,${accentColor},${SKILL_PALETTE[1].color},${SKILL_PALETTE[2].color})` }} />

        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-[0.06]"
            style={{ background: `radial-gradient(circle,${accentColor},transparent)` }} />
        </div>

        <div className="relative p-5 space-y-5">
          {/* Header */}
          <div className="flex items-start gap-4">
            {score > 0 && <ReadinessRing score={score} />}
            <div className="flex-1 min-w-0 space-y-1.5 pt-1">
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${accentColor}99` }}>
                Deine Vision
              </p>
              <h3 className="text-lg font-black text-white leading-tight">{learningPath.target_job}</h3>
              <div className="flex flex-wrap items-center gap-2">
                {learningPath.target_company && (
                  <span className="flex items-center gap-1 text-[11px] text-white/45">
                    <Building2 size={10} />{learningPath.target_company}
                  </span>
                )}
                {learningPath.industry && (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border"
                    style={{ background: `${accentColor}12`, color: accentColor, borderColor: `${accentColor}25` }}>
                    {learningPath.industry}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Market insight */}
          {outlook && (
            <div className="flex gap-2.5 items-start p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Brain size={13} className="flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
              <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2">{outlook}</p>
            </div>
          )}

          {/* Skill tiles grid — each individually startable */}
          {topSkills.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles size={11} style={{ color: accentColor }} />
                  <p className="text-[9px] font-black uppercase tracking-widest text-white/35">
                    {sorted.length} Lernpfade verfügbar
                  </p>
                </div>
                {sorted.length > 4 && (
                  <span className="text-[9px] text-white/25">+{sorted.length - 4} weitere</span>
                )}
              </div>
              <div className="grid grid-cols-2 gap-2">
                {topSkills.map((skill, i) => (
                  <SkillTile
                    key={i}
                    skill={skill}
                    index={i}
                    targetJob={learningPath.target_job}
                    onStart={() => handleCta(i)}
                    isLocked={!isPaidOrFree}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: sorted.length,              label: 'Lernpfade', color: accentColor },
              { val: sorted.filter(s => severityOf(s) >= 4).length, label: 'Top-Hebel', color: SKILL_PALETTE[1].color },
              { val: toSkillArray(learningPath.current_skills ?? []).length, label: 'Basis',  color: SKILL_PALETTE[2].color },
            ].map(({ val, label, color }) => (
              <div key={label} className="flex flex-col items-center py-2.5 rounded-xl"
                style={{ background: `${color}09`, border: `1px solid ${color}18` }}>
                <span className="text-xl font-black leading-none" style={{ color }}>{val}</span>
                <span className="text-[9px] text-white/35 mt-0.5 font-bold">{label}</span>
              </div>
            ))}
          </div>

          {/* Main CTA */}
          <button
            onClick={() => handleCta()}
            className="group/btn relative w-full py-3.5 rounded-xl font-black text-[14px] text-black flex items-center justify-center gap-2.5 overflow-hidden transition-all duration-200 hover:scale-[1.015] active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg,${accentColor},${SKILL_PALETTE[1].color})` }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)', backgroundSize: '200% 100%', animation: 'cvShimmerC 2.5s ease-in-out infinite' }} />
            {isPaidOrFree
              ? <><Trophy size={15} className="relative z-10" /><span className="relative z-10">Alle Lernpfade starten</span><ArrowRight size={14} className="relative z-10 group-hover/btn:translate-x-0.5 transition-transform" /></>
              : <><Lock size={15} className="relative z-10" /><span className="relative z-10">Lernpfade freischalten</span><ArrowRight size={14} className="relative z-10 group-hover/btn:translate-x-0.5 transition-transform" /></>
            }
          </button>
        </div>
        <style>{`
          @keyframes cvShimmerC { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        `}</style>
      </div>

      {showPaywall && (
        <LearningPathPaywall
          isOpen
          onClose={() => setShowPaywall(false)}
          learningPathId={learningPath.id}
          targetJob={learningPath.target_job}
          targetCompany={learningPath.target_company}
          skillCount={sorted.length}
          selectedSkill={pendingSkill}
        />
      )}
    </>
  );
}

// ── DETAIL variant ─────────────────────────────────────────────────────────────

function DetailCard({ learningPath, onStartLearning }: Omit<CareerVisionCardProps, 'variant'>) {
  const [showPaywall, setShowPaywall] = useState(false);
  const [localPaid, setLocalPaid] = useState(learningPath.is_paid);
  const [pendingSkill, setPendingSkill] = useState<string | undefined>(undefined);

  const missing      = toSkillArray(learningPath.missing_skills);
  const current      = toSkillArray(learningPath.current_skills ?? []);
  const sorted       = [...missing].sort((a, b) => severityOf(b) - severityOf(a));
  const topSkill     = sorted[0];
  const score        = learningPath.match_score ?? 0;
  const outlook      = learningPath.strategic_outlook_2026 ?? (learningPath as any).market_trend_2026 ?? '';
  const isPaidOrFree = localPaid || !!learningPath.curriculum;
  const highCount    = sorted.filter((s) => severityOf(s) >= 4).length;
  const accentColor  = sorted[0] ? paletteOf(severityOf(sorted[0])).color : '#30E3CA';

  const handleCta = (skillIdx?: number) => {
    if (isPaidOrFree) onStartLearning?.(skillIdx);
    else {
      setPendingSkill(skillIdx !== undefined ? sorted[skillIdx]?.name : undefined);
      setShowPaywall(true);
    }
  };

  // Split skills by category for visual grouping
  const hardSkills = sorted.filter(s => categoryOf(s) === 'Hard');
  const softSkills = sorted.filter(s => categoryOf(s) === 'Soft');

  return (
    <>
      <div className="space-y-5">

        {/* ── 1. Hero summary bar ── */}
        <div className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg,rgba(48,227,202,0.08),rgba(10,14,30,0.97) 60%,rgba(102,192,182,0.04))',
            border: `1px solid ${accentColor}30`,
          }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg,transparent,${accentColor}80,transparent)` }} />

          <div className="flex items-center gap-4 relative">
            {score > 0 && <ReadinessRing score={score} />}
            <div className="flex-1 min-w-0">
              <p className="text-[9px] font-black uppercase tracking-widest mb-1"
                style={{ color: `${accentColor}99` }}>
                Bereitschafts-Index · {new Date().getFullYear()}
              </p>
              <h2 className="text-xl font-black text-white leading-tight">{learningPath.target_job}</h2>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {learningPath.target_company && (
                  <span className="flex items-center gap-1 text-xs text-white/45">
                    <Building2 size={10} />{learningPath.target_company}
                  </span>
                )}
                {learningPath.industry && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border"
                    style={{ background: `${accentColor}12`, color: accentColor, borderColor: `${accentColor}25` }}>
                    {learningPath.industry}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-shrink-0 hidden sm:flex flex-col gap-1.5 text-right">
              {[
                { val: sorted.length,  label: 'Lernpfade',    color: accentColor },
                { val: highCount,      label: 'Top-Hebel',    color: SKILL_PALETTE[1].color },
                { val: current.length, label: 'Basis-Skills', color: SKILL_PALETTE[2].color },
              ].map(({ val, label, color }) => (
                <div key={label} className="flex items-center justify-end gap-1.5">
                  <span className="text-[11px] font-black" style={{ color }}>{val}</span>
                  <span className="text-[10px] text-white/35">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── 2. Market insight ── */}
        {outlook && (
          <div className="flex gap-3 items-start p-4 rounded-xl"
            style={{ background: 'rgba(102,192,182,0.05)', border: '1px solid rgba(102,192,182,0.13)' }}>
            <Brain size={15} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="text-[9px] font-black text-[#66c0b6]/70 uppercase tracking-widest">Markt-Insight 2026</p>
              <p className="text-[12px] text-white/65 leading-relaxed">{outlook}</p>
            </div>
          </div>
        )}

        {/* ── 3. Current skills summary ── */}
        {current.length > 0 && (
          <div className="p-4 rounded-xl space-y-2"
            style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)' }}>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-green-400" />
              <p className="text-[9px] font-black text-green-400/70 uppercase tracking-widest">Deine vorhandene Basis</p>
            </div>
            <p className="text-[12px] text-white/65 leading-relaxed">{typeof current[0] === 'string' ? current[0] : (current[0] as any).name || (current[0] as any).skill_name || ''}</p>
          </div>
        )}

        {/* ── 4. Skill rows — grouped by category ── */}
        {sorted.length > 0 && (
          <div className="space-y-4">
            {/* Hard skills */}
            {hardSkills.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Wrench size={12} className="text-[#30E3CA]" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                    Hard Skills · {hardSkills.length} Lernpfade
                  </span>
                </div>
                <div className="space-y-1.5">
                  {hardSkills.map((skill, i) => (
                    <SkillRow key={i} skill={skill}
                      rank={sorted.indexOf(skill) + 1}
                      targetJob={learningPath.target_job}
                      targetCompany={learningPath.target_company}
                      isFirst={sorted.indexOf(skill) === 0}
                      onStart={() => handleCta(sorted.indexOf(skill))}
                      isLocked={!isPaidOrFree}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Soft skills */}
            {softSkills.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-1">
                  <Brain size={12} className="text-[#f97316]" />
                  <span className="text-[10px] font-black text-white/40 uppercase tracking-wider">
                    Soft Skills · {softSkills.length} Lernpfade
                  </span>
                </div>
                <div className="space-y-1.5">
                  {softSkills.map((skill, i) => (
                    <SkillRow key={i} skill={skill}
                      rank={sorted.indexOf(skill) + 1}
                      targetJob={learningPath.target_job}
                      targetCompany={learningPath.target_company}
                      isFirst={false}
                      onStart={() => handleCta(sorted.indexOf(skill))}
                      isLocked={!isPaidOrFree}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 5. Existing skills bridge ── */}
        {current.length > 0 && sorted.length > 0 && typeof current[0] !== 'string' && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="grid grid-cols-2 divide-x divide-white/7">
              <div className="p-4 space-y-2" style={{ background: 'rgba(34,197,94,0.04)' }}>
                <div className="flex items-center gap-1.5">
                  <BookOpen size={10} className="text-green-400/60" />
                  <p className="text-[9px] font-black text-green-400/60 uppercase tracking-widest">Deine Basis</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {current.slice(0, 8).map((s: any, i) => {
                    const n = skillName(s);
                    if (!n) return null;
                    return <span key={i} className="text-[10px] px-2 py-0.5 rounded text-green-400/70 bg-green-500/8 border border-green-500/13">{n}</span>;
                  })}
                  {current.length > 8 && <span className="text-[10px] text-white/25">+{current.length - 8}</span>}
                </div>
              </div>
              <div className="p-4 space-y-2" style={{ background: `${accentColor}05` }}>
                <div className="flex items-center gap-1.5">
                  <Target size={10} style={{ color: `${accentColor}60` }} />
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${accentColor}60` }}>Dein Ziel</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {sorted.slice(0, 8).map((s, i) => {
                    const n = skillName(s);
                    if (!n) return null;
                    return <span key={i} className="text-[10px] px-2 py-0.5 rounded border"
                      style={{ color: `${accentColor}90`, background: `${accentColor}08`, borderColor: `${accentColor}18` }}>{n}</span>;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 6. Main CTA block ── */}
        <div className="relative overflow-hidden rounded-2xl"
          style={{ border: `1px solid ${accentColor}35`, background: `linear-gradient(135deg,${accentColor}09,rgba(10,14,30,0.98))` }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg,transparent,${accentColor}80,transparent)` }} />
          <div className="p-5 space-y-4">
            {topSkill && (
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${accentColor}12`, border: `1px solid ${accentColor}25` }}>
                  <Target size={16} style={{ color: accentColor }} />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${accentColor}70` }}>Empfohlener Einstieg</p>
                  <p className="text-sm font-black text-white mt-0.5">
                    Starte mit <span style={{ color: accentColor }}>{skillName(topSkill)}</span>
                  </p>
                  <p className="text-[11px] text-white/45 mt-0.5 leading-snug">
                    Höchste Wirkung auf deine Chancen bei {learningPath.target_company || 'Top-Arbeitgebern'}.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => handleCta()}
              className="group/cta relative w-full py-4 rounded-xl font-black text-[15px] text-black flex items-center justify-center gap-3 overflow-hidden transition-all duration-200 hover:scale-[1.015] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg,${accentColor},${SKILL_PALETTE[1].color})`, animation: 'cvCTApulseD 2.5s ease-in-out infinite' }}
            >
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', backgroundSize: '200% 100%', animation: 'cvShimmerD 2.2s ease-in-out infinite' }} />
              {isPaidOrFree
                ? <><Sparkles size={17} className="relative z-10" /><span className="relative z-10">Alle Lernpfade starten</span><ArrowRight size={17} className="relative z-10 group-hover/cta:translate-x-1 transition-transform" /></>
                : <><Lock size={17} className="relative z-10" /><span className="relative z-10">Lernpfade freischalten</span><ArrowRight size={17} className="relative z-10 group-hover/cta:translate-x-1 transition-transform" /></>
              }
            </button>
            <p className="text-center text-[10px] text-white/22">ESCO-validiert · Branchenspezifisch · {new Date().getFullYear()}</p>
          </div>
          <style>{`
            @keyframes cvCTApulseD { 0%,100% { box-shadow:0 0 0 0 rgba(48,227,202,0.35); } 60% { box-shadow:0 0 0 12px rgba(48,227,202,0); } }
            @keyframes cvShimmerD  { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
          `}</style>
        </div>
      </div>

      {showPaywall && (
        <LearningPathPaywall
          isOpen
          onClose={() => setShowPaywall(false)}
          learningPathId={learningPath.id}
          targetJob={learningPath.target_job}
          targetCompany={learningPath.target_company}
          skillCount={sorted.length}
          selectedSkill={pendingSkill}
        />
      )}
    </>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────

function CareerVisionCard({ learningPath, variant = 'compact', onStartLearning }: CareerVisionCardProps) {
  if (variant === 'detail') {
    return <DetailCard learningPath={learningPath} onStartLearning={onStartLearning} />;
  }
  return <CompactCard learningPath={learningPath} onStartLearning={onStartLearning} />;
}

export { CareerVisionCard };
