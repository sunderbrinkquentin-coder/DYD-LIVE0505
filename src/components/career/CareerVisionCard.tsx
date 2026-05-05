import { useState } from 'react';
import {
  ArrowRight, Sparkles, TrendingUp, Zap, Target, Building2,
  Lock, Brain, ChevronRight, CheckCircle2, XCircle, Flame,
  Lightbulb, BarChart3, Trophy,
} from 'lucide-react';
import { LearningPath, Skill } from '../../types/learningPath';
import { PaywallModal } from '../PaywallModal';

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

function severityOf(s: Skill & Record<string, any>): number {
  return (s as any).gap_severity ?? (s.priority === 'high' ? 4 : s.priority === 'medium' ? 3 : 2);
}

// ── ARCS color palette — each tier has a distinct hue ─────────────────────────

// Tier colours are deliberately varied so the card has chromatic richness
const SKILL_PALETTE = [
  { color: '#30E3CA', bg: 'rgba(48,227,202,0.12)',  border: 'rgba(48,227,202,0.28)',  glow: 'rgba(48,227,202,0.18)'  }, // teal
  { color: '#f97316', bg: 'rgba(249,115,22,0.12)',  border: 'rgba(249,115,22,0.28)',  glow: 'rgba(249,115,22,0.15)'  }, // orange
  { color: '#a78bfa', bg: 'rgba(167,139,250,0.10)', border: 'rgba(167,139,250,0.25)', glow: 'rgba(167,139,250,0.12)' }, // violet — only used when user explicitly picks it, never default
  { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',   border: 'rgba(34,197,94,0.25)',   glow: 'rgba(34,197,94,0.12)'  }, // green
  { color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  border: 'rgba(245,158,11,0.25)',  glow: 'rgba(245,158,11,0.12)' }, // amber
  { color: '#38bdf8', bg: 'rgba(56,189,248,0.10)',  border: 'rgba(56,189,248,0.25)',  glow: 'rgba(56,189,248,0.12)' }, // sky
];

// Map severity → palette slot (top-severity gets teal/orange accent, lower gets cooler)
const TIERS = [
  { min: 4, palette: 0, label: 'Top-Hebel',    icon: Flame },
  { min: 3, palette: 1, label: 'Hoher Impact',  icon: TrendingUp },
  { min: 2, palette: 3, label: 'Quick Win',     icon: Lightbulb },
  { min: 0, palette: 5, label: 'Nice-to-have',  icon: BarChart3 },
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

// ── ARCS skill tile (compact dashboard) ───────────────────────────────────────
// Each tile = one skill card showing:
//   A — Attention:  vivid color + skill name + tier badge
//   R — Relevance:  pitch (WHY this matters for the user's target)
//   C — Confidence: market_value_bonus (what they gain)
//   S — Satisfaction: implied via the CTA "Skill freischalten"

function ARCSSkillTile({
  skill, index, targetJob,
}: { skill: Skill & Record<string, any>; index: number; targetJob: string }) {
  const name   = skillName(skill);
  const sev    = severityOf(skill);
  const t      = tierOf(sev);
  const p      = paletteOf(sev);
  const pitch  = (skill as any).pitch || '';
  const bonus  = (skill as any).market_value_bonus || '';
  const TierIcon = t.icon;

  if (!name) return null;

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{ background: p.bg, border: `1px solid ${p.border}` }}
    >
      {/* Glow accent top */}
      <div className="h-[2px]" style={{ background: `linear-gradient(90deg,${p.color},transparent)` }} />

      {/* Corner number */}
      <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black"
        style={{ background: 'rgba(0,0,0,0.35)', color: p.color }}>
        {index + 1}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* A — Attention: tier badge + name */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <TierIcon size={11} style={{ color: p.color }} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: p.color }}>
              {t.label}
            </span>
          </div>
          <h4 className="text-[14px] font-black text-white leading-snug pr-6">{name}</h4>
        </div>

        {/* R — Relevance: pitch (WHY it matters) */}
        {pitch ? (
          <p className="text-[11px] text-white/60 leading-relaxed flex-1">{pitch}</p>
        ) : (
          <p className="text-[11px] text-white/45 leading-relaxed flex-1">
            Kritischer Skill für den Karriereschritt zum {targetJob}.
          </p>
        )}

        {/* C — Confidence: market value gain */}
        {bonus && (
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
            style={{ background: 'rgba(0,0,0,0.25)', border: `1px solid ${p.border}` }}>
            <Zap size={10} className="text-amber-400 flex-shrink-0" />
            <span className="text-[10px] font-black text-amber-300 leading-snug">{bonus}</span>
          </div>
        )}

        {/* S — Satisfaction: impact bar */}
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5 flex-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full"
                style={{ background: i < sev ? p.color : 'rgba(255,255,255,0.06)' }} />
            ))}
          </div>
          <span className="text-[9px] text-white/30 font-bold whitespace-nowrap">Impact {sev}/5</span>
        </div>
      </div>
    </div>
  );
}

// ── Skill row for detail view — expandable ────────────────────────────────────

function SkillRow({
  skill, rank, targetJob, targetCompany, isFirst,
}: {
  skill: Skill & Record<string, any>;
  rank: number;
  targetJob: string;
  targetCompany?: string;
  isFirst: boolean;
}) {
  const [open, setOpen] = useState(false);
  const name  = skillName(skill);
  const sev   = severityOf(skill);
  const p     = paletteOf(sev);
  const t     = tierOf(sev);
  const pitch = (skill as any).pitch || '';
  const bonus = (skill as any).market_value_bonus || '';
  const TierIcon = t.icon;

  if (!name) return null;

  return (
    <div className="overflow-hidden transition-all duration-300"
      style={{
        borderRadius: '14px',
        border: `1px solid ${open ? p.color + '35' : 'rgba(255,255,255,0.07)'}`,
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
            {isFirst && (
              <span className="text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded"
                style={{ background: p.color, color: '#000' }}>
                Start hier
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
        style={{ maxHeight: open ? '260px' : '0', opacity: open ? 1 : 0 }}>
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
          <div className="flex items-center gap-1.5 text-[10px] text-white/30">
            <TierIcon size={10} style={{ color: p.color }} />
            <span style={{ color: p.color }}>{t.label}</span>
            <span className="mx-1">·</span>
            <span>Impact {sev}/5</span>
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
  onStartLearning?: () => void;
}

// ── COMPACT variant — ARCS-driven, colorful ───────────────────────────────────

function CompactCard({ learningPath, onStartLearning }: Omit<CareerVisionCardProps, 'variant'>) {
  const [showPaywall, setShowPaywall] = useState(false);

  const missing    = toSkillArray(learningPath.missing_skills);
  const sorted     = [...missing].sort((a, b) => severityOf(b) - severityOf(a));
  const topSkills  = sorted.slice(0, 4);
  const score      = learningPath.match_score ?? 0;
  const outlook    = learningPath.strategic_outlook_2026 ?? '';
  const isPaidOrFree = learningPath.is_paid || !!learningPath.curriculum;

  const handleCta = () => {
    if (isPaidOrFree) onStartLearning?.();
    else setShowPaywall(true);
  };

  // Pick dominant color from top skill for card accent
  const accentColor = sorted[0] ? paletteOf(severityOf(sorted[0])).color : '#30E3CA';

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(160deg,rgba(10,14,30,0.98),rgba(15,20,40,0.99))',
          border: `1px solid ${accentColor}25`,
          boxShadow: `0 0 0 0 transparent`,
        }}>

        {/* Top gradient bar — vivid */}
        <div className="h-[3px]"
          style={{ background: `linear-gradient(90deg,${accentColor},${SKILL_PALETTE[1].color},${SKILL_PALETTE[3].color})` }} />

        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-[0.06]"
            style={{ background: `radial-gradient(circle,${accentColor},transparent)` }} />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full opacity-[0.04]"
            style={{ background: `radial-gradient(circle,${SKILL_PALETTE[1].color},transparent)` }} />
        </div>

        <div className="relative p-5 space-y-5">

          {/* ── Header: job + readiness ring ── */}
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

          {/* ── ARCS — market insight (Relevance) ── */}
          {outlook && (
            <div className="flex gap-2.5 items-start p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
              <Brain size={13} className="flex-shrink-0 mt-0.5" style={{ color: accentColor }} />
              <p className="text-[11px] text-white/60 leading-relaxed line-clamp-2">{outlook}</p>
            </div>
          )}

          {/* ── ARCS skill tiles grid ── */}
          {topSkills.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/35">
                  {sorted.length} Wachstums-Chancen
                </p>
                {sorted.length > 4 && (
                  <span className="text-[9px] text-white/25">+{sorted.length - 4} weitere</span>
                )}
              </div>

              {/* 2-column grid for top 4 skill tiles */}
              <div className="grid grid-cols-2 gap-2">
                {topSkills.map((skill, i) => (
                  <ARCSSkillTile
                    key={i}
                    skill={skill}
                    index={i}
                    targetJob={learningPath.target_job}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── Stats row ── */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: sorted.length,              label: 'Chancen',   color: accentColor },
              { val: sorted.filter(s => severityOf(s) >= 4).length, label: 'Top-Hebel', color: SKILL_PALETTE[1].color },
              { val: toSkillArray(learningPath.current_skills ?? []).length, label: 'Basis',  color: SKILL_PALETTE[3].color },
            ].map(({ val, label, color }) => (
              <div key={label} className="flex flex-col items-center py-2.5 rounded-xl"
                style={{ background: `${color}09`, border: `1px solid ${color}18` }}>
                <span className="text-xl font-black leading-none" style={{ color }}>{val}</span>
                <span className="text-[9px] text-white/35 mt-0.5 font-bold">{label}</span>
              </div>
            ))}
          </div>

          {/* ── CTA ── */}
          <button
            onClick={handleCta}
            className="group/btn relative w-full py-3.5 rounded-xl font-black text-[14px] text-black flex items-center justify-center gap-2.5 overflow-hidden transition-all duration-200 hover:scale-[1.015] active:scale-[0.98]"
            style={{ background: `linear-gradient(135deg,${accentColor},${SKILL_PALETTE[1].color})` }}
          >
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)', backgroundSize: '200% 100%', animation: 'cvShimmerC 2.5s ease-in-out infinite' }} />
            {isPaidOrFree
              ? <><Trophy size={15} className="relative z-10 group-hover/btn:scale-110 transition-transform" /><span className="relative z-10">Lernpfad starten</span><ArrowRight size={14} className="relative z-10 group-hover/btn:translate-x-0.5 transition-transform" /></>
              : <><Lock size={15} className="relative z-10" /><span className="relative z-10">Exklusiven Fahrplan freischalten</span><ArrowRight size={14} className="relative z-10 group-hover/btn:translate-x-0.5 transition-transform" /></>
            }
          </button>
        </div>
        <style>{`
          @keyframes cvShimmerC { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
        `}</style>
      </div>

      {showPaywall && (
        <PaywallModal isOpen onClose={() => setShowPaywall(false)} context="learning_path" feature="Career Vision Learning Path" />
      )}
    </>
  );
}

// ── DETAIL variant (Analysis result / LearningPathPage) ───────────────────────

function DetailCard({ learningPath, onStartLearning }: Omit<CareerVisionCardProps, 'variant'>) {
  const [showPaywall, setShowPaywall] = useState(false);

  const missing  = toSkillArray(learningPath.missing_skills);
  const current  = toSkillArray(learningPath.current_skills ?? []);
  const sorted   = [...missing].sort((a, b) => severityOf(b) - severityOf(a));
  const topSkill = sorted[0];
  const score    = learningPath.match_score ?? 0;
  const outlook  = learningPath.strategic_outlook_2026 ?? '';
  const isPaidOrFree = learningPath.is_paid || !!learningPath.curriculum;
  const highCount = sorted.filter((s) => severityOf(s) >= 4).length;
  const accentColor = sorted[0] ? paletteOf(severityOf(sorted[0])).color : '#30E3CA';

  const handleCta = () => {
    if (isPaidOrFree) onStartLearning?.();
    else setShowPaywall(true);
  };

  return (
    <>
      <div className="space-y-4">

        {/* ── 1. Hero summary bar ── */}
        <div className="relative overflow-hidden rounded-2xl p-5"
          style={{
            background: 'linear-gradient(135deg,rgba(48,227,202,0.08),rgba(10,14,30,0.97) 60%,rgba(102,192,182,0.04))',
            border: `1px solid ${accentColor}30`,
          }}>
          <div className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg,transparent,${accentColor}80,transparent)` }} />
          <div className="absolute right-0 top-0 bottom-0 w-32 pointer-events-none opacity-[0.05]"
            style={{ background: `radial-gradient(circle at right center,${accentColor},transparent)` }} />

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
                { val: sorted.length,  label: 'Chancen',      color: accentColor },
                { val: highCount,      label: 'Top-Hebel',    color: SKILL_PALETTE[1].color },
                { val: current.length, label: 'Basis-Skills', color: SKILL_PALETTE[3].color },
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
              <p className="text-[9px] font-black text-[#66c0b6]/70 uppercase tracking-widest">Markt-Insight</p>
              <p className="text-[12px] text-white/65 leading-relaxed">{outlook}</p>
            </div>
          </div>
        )}

        {/* ── 3. Skill list — ranked, expandable ── */}
        {sorted.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <Sparkles size={13} className="text-[#30E3CA]" />
                <span className="text-[11px] font-black text-white uppercase tracking-wider">
                  Deine {sorted.length} Wachstums-Chancen
                </span>
              </div>
              <span className="text-[10px] text-white/25 italic">Klappe für Details</span>
            </div>
            <div className="space-y-1.5">
              {sorted.map((skill, i) => (
                <SkillRow key={i} skill={skill} rank={i + 1}
                  targetJob={learningPath.target_job}
                  targetCompany={learningPath.target_company}
                  isFirst={i === 0} />
              ))}
            </div>
          </div>
        )}

        {/* ── 4. Ist-Soll bridge ── */}
        {current.length > 0 && sorted.length > 0 && (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="grid grid-cols-2 divide-x divide-white/7">
              <div className="p-4 space-y-2" style={{ background: 'rgba(102,192,182,0.04)' }}>
                <p className="text-[9px] font-black text-[#66c0b6]/60 uppercase tracking-widest">Deine Basis</p>
                <div className="flex flex-wrap gap-1">
                  {current.slice(0, 8).map((s, i) => {
                    const n = skillName(s);
                    if (!n) return null;
                    return <span key={i} className="text-[10px] px-2 py-0.5 rounded text-[#66c0b6]/70 bg-[#66c0b6]/8 border border-[#66c0b6]/13">{n}</span>;
                  })}
                  {current.length > 8 && <span className="text-[10px] text-white/25">+{current.length - 8}</span>}
                </div>
              </div>
              <div className="p-4 space-y-2" style={{ background: `${accentColor}05` }}>
                <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: `${accentColor}60` }}>Dein Ziel</p>
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

        {/* ── 5. CTA ── */}
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
                    Jede Stunde Lernzeit zahlt direkt auf dein Gehaltspotenzial ein.
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={handleCta}
              className="group/cta relative w-full py-4 rounded-xl font-black text-[15px] text-black flex items-center justify-center gap-3 overflow-hidden transition-all duration-200 hover:scale-[1.015] active:scale-[0.98]"
              style={{ background: `linear-gradient(135deg,${accentColor},${SKILL_PALETTE[1].color})`, animation: 'cvCTApulseD 2.5s ease-in-out infinite' }}
            >
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent)', backgroundSize: '200% 100%', animation: 'cvShimmerD 2.2s ease-in-out infinite' }} />
              {isPaidOrFree
                ? <><Sparkles size={17} className="relative z-10 group-hover/cta:rotate-12 transition-transform" /><span className="relative z-10">Lernpfad starten</span><ArrowRight size={17} className="relative z-10 group-hover/cta:translate-x-1 transition-transform" /></>
                : <><Lock size={17} className="relative z-10" /><span className="relative z-10">Exklusiven Fahrplan freischalten</span><ArrowRight size={17} className="relative z-10 group-hover/cta:translate-x-1 transition-transform" /></>
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
        <PaywallModal isOpen onClose={() => setShowPaywall(false)} context="learning_path" feature="Career Vision Learning Path" />
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