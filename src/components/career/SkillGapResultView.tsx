// src/components/career/SkillGapResultView.tsx
//
// Ergebnisdarstellung der Skill-Gap-Analyse.
//
// Aufbau nach ARCS (Keller):
//   Attention    – Hero mit animiertem Abdeckungs-Score und persönlicher Headline
//   Relevance    – jeder Hebel mit Bezug auf Zielposition/-unternehmen + Quellen
//   Confidence   – zuerst die belegten Stärken (mit CV-Zitat), kleine erste Schritte,
//                  "Ansatzpunkt vorhanden" statt "fehlt"
//   Satisfaction – berechneter Score-Zuwachs je Hebel, Lernweg + Zertifikat-Vorschau
//
// DSR-Bezug: Das Ergebnis ist das Artefakt, die Bewertung am Ende (1–5) ist der
// Evaluationsschritt. Sie wird in learning_paths.result_feedback gespeichert.
//
// Conversion: eine Primär-Aktion ("Mit <Top-Hebel> starten") im Hero, je Hebel
// eine kontextbezogene Aktion, auf Mobilgeräten eine Sticky-Leiste, sobald der
// Hero-CTA aus dem Bild scrollt. Alle Zahlen sind aus den Analysedaten berechnet –
// nichts wird geschätzt oder erfunden.

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, ArrowRight, Building2, Check, ChevronDown, Quote, Target,
  TrendingUp, Award, ExternalLink, ShieldCheck, Footprints, Star, Info,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { CertificatePreview, LearningJourney } from './AcademyPreviews';
import { LearningPathPaywall } from './LearningPathPaywall';
import { skillDisplayName, type RawSkill } from '../../utils/skills';

// ── Typen ─────────────────────────────────────────────────────────────────────

/** missing_skills-Eintrag der Edge-Pipeline (skillgap-analyze) */
export type GapSkill = RawSkill & {
  status?: 'missing' | 'partial' | string;
  reason?: string;
  first_step?: string;
  requirement?: string;
  source_urls?: string[];
  estimatedTime?: string;
};

/** current_skills-Eintrag (belegte Stärke) */
export type StrengthSkill = RawSkill & { level?: string; evidence?: string };

export interface AnalysisCoverage {
  covered: number;
  partial: number;
  total: number;
  totalWeight: number;
}

export interface AnalysisResult {
  pathId: string;
  missingSkills: RawSkill[];
  currentSkills: RawSkill[];
  strategicOutlook: string;
  matchScore: number | null;
  sources?: string[];
  scoreMethod?: string;
  coverage?: AnalysisCoverage | null;
  industry: string;
  targetJob: string;
  targetCompany: string;
}

// ── Konstanten & Helfer ───────────────────────────────────────────────────────

const ACCENT = '#30E3CA';
const ACCENT_2 = '#66c0b6';
const STRENGTH_PREVIEW = 8;

const STYLES = `
  @keyframes sgrFadeUp { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
  @keyframes sgrShimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  @keyframes sgrPulse { 0%,100% { box-shadow:0 0 0 0 rgba(48,227,202,0.35); } 60% { box-shadow:0 0 0 12px rgba(48,227,202,0); } }
  @keyframes sgrSlideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }
  @media (prefers-reduced-motion: reduce) {
    .sgr-anim { animation: none !important; }
  }
`;

const CATEGORY_LABEL: Record<string, string> = {
  Hard: 'Fachlich', Soft: 'Sozial', Digital: 'Digital', Methodic: 'Methodisch',
  'Core-Tech': 'Fachlich', Leadership: 'Führung', Domain: 'Branche', 'Soft Skills': 'Sozial',
};

const LEVEL_LABEL: Record<string, string> = {
  grundlagen: 'Grundlagen', fortgeschritten: 'Fortgeschritten', experte: 'Experte',
};

function prefersReducedMotion(): boolean {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
}

/** Score-Zuwachs, wenn dieser Hebel vollständig belegt wäre (gleiche Formel wie der Server-Score). */
function gainFor(skill: GapSkill, totalWeight: number): number | null {
  if (!totalWeight) return null;
  const importance = Number(skill.gap_severity) || 0;
  if (!importance) return null;
  const share = skill.status === 'partial' ? 0.5 : 1;
  return Math.round((importance * share / totalWeight) * 100);
}

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function useCountUp(target: number | null, durationMs = 1100): number {
  const [value, setValue] = useState(target == null || prefersReducedMotion() ? target ?? 0 : 0);
  useEffect(() => {
    if (target == null) return;
    if (prefersReducedMotion()) { setValue(target); return; }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}

// ── Bausteine ─────────────────────────────────────────────────────────────────

function ScoreRing({ score, potential }: { score: number; potential: number | null }) {
  const shown = useCountUp(score);
  const r = 46;
  const c = 2 * Math.PI * r;
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : ACCENT;
  const pot = potential != null ? Math.min(100, potential) : null;
  return (
    <div className="relative w-[124px] h-[124px] flex-shrink-0" role="img"
      aria-label={`Belegte Abdeckung ${score} Prozent${pot != null ? `, Potenzial ${pot} Prozent` : ''}`}>
      <svg viewBox="0 0 110 110" className="w-full h-full -rotate-90">
        <circle cx="55" cy="55" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
        {pot != null && pot > score && (
          <circle cx="55" cy="55" r={r} fill="none" stroke={ACCENT} strokeOpacity="0.22" strokeWidth="9"
            strokeDasharray={`${(pot / 100) * c} ${c}`} strokeLinecap="round" />
        )}
        <circle cx="55" cy="55" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={`${(shown / 100) * c} ${c}`} style={{ transition: 'stroke-dasharray 0.2s linear' }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[30px] font-black leading-none tabular-nums" style={{ color }}>{shown}%</span>
        <span className="text-[10px] text-white/45 mt-1 font-semibold">belegt</span>
      </div>
    </div>
  );
}

function ImpactDots({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Wichtigkeit ${value} von 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="w-1.5 h-1.5 rounded-full"
          style={{ background: i < value ? ACCENT : 'rgba(255,255,255,0.12)' }} />
      ))}
    </span>
  );
}

function PrimaryButton({ children, onClick, pulse = false, className = '' }: {
  children: React.ReactNode; onClick: () => void; pulse?: boolean; className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative w-full py-4 px-5 rounded-xl font-black text-[15px] text-black flex items-center justify-center gap-2.5 overflow-hidden transition-transform duration-200 hover:scale-[1.015] active:scale-[0.98] ${pulse ? 'sgr-anim' : ''} ${className}`}
      style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT_2})`, animation: pulse ? 'sgrPulse 2.6s ease-in-out infinite' : undefined }}
    >
      <span className="sgr-anim absolute inset-0 pointer-events-none"
        style={{ background: 'linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)', backgroundSize: '200% 100%', animation: 'sgrShimmer 2.4s ease-in-out infinite' }} />
      <span className="relative z-10 flex items-center gap-2.5">{children}</span>
    </button>
  );
}

function SectionTitle({ icon, title, hint }: { icon: React.ReactNode; title: string; hint?: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(48,227,202,0.1)', border: '1px solid rgba(48,227,202,0.22)', color: ACCENT }}>
          {icon}
        </span>
        <h4 className="text-[15px] font-black text-white">{title}</h4>
      </div>
      {hint && <span className="text-[11px] text-white/35">{hint}</span>}
    </div>
  );
}

// ── Stärken (Confidence) ──────────────────────────────────────────────────────

function Strengths({ skills }: { skills: StrengthSkill[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? skills : skills.slice(0, STRENGTH_PREVIEW);
  const active = open != null ? skills[open] : null;

  return (
    <div className="space-y-3">
      <SectionTitle icon={<Check size={14} />} title="Das bringst du schon mit" hint="antippen für Beleg" />
      <div className="flex flex-wrap gap-2">
        {visible.map((s, i) => {
          const isOpen = open === i;
          return (
            <button key={`${skillDisplayName(s)}-${i}`} onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-semibold transition-all"
              style={{
                background: isOpen ? 'rgba(34,197,94,0.14)' : 'rgba(34,197,94,0.06)',
                border: `1px solid ${isOpen ? 'rgba(34,197,94,0.5)' : 'rgba(34,197,94,0.2)'}`,
                color: isOpen ? '#86efac' : 'rgba(255,255,255,0.75)',
              }}>
              <Check size={11} className="text-green-400" />
              {skillDisplayName(s)}
              {s.level && LEVEL_LABEL[s.level] && (
                <span className="text-[10px] text-white/35 font-medium">· {LEVEL_LABEL[s.level]}</span>
              )}
            </button>
          );
        })}
        {skills.length > STRENGTH_PREVIEW && (
          <button onClick={() => setShowAll((v) => !v)}
            className="px-3 py-1.5 rounded-full text-[12px] font-semibold text-white/50 border border-white/10 hover:text-white/80">
            {showAll ? 'Weniger anzeigen' : `+${skills.length - STRENGTH_PREVIEW} weitere`}
          </button>
        )}
      </div>
      {active?.evidence && (
        <div className="sgr-anim flex gap-2.5 p-3.5 rounded-xl text-xs leading-relaxed"
          style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.18)', animation: 'sgrFadeUp 0.25s ease' }}>
          <Quote size={14} className="text-green-400/70 flex-shrink-0 mt-0.5" />
          <p className="text-white/70">
            <span className="italic">„{active.evidence}“</span>
            <span className="block text-[10px] text-white/35 mt-1">wörtlich aus deinem Lebenslauf</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── Hebel-Karte (Relevance + Confidence + Satisfaction) ───────────────────────

function GapCard({
  skill, rank, open, onToggle, gain, targetJob, targetCompany, onStart,
}: {
  skill: GapSkill; rank: number; open: boolean; onToggle: () => void; gain: number | null;
  targetJob: string; targetCompany: string; onStart: () => void;
}) {
  const name = skillDisplayName(skill);
  const importance = Math.max(1, Math.min(5, Number(skill.gap_severity) || 3));
  const partial = skill.status === 'partial';
  const sources = (skill.source_urls ?? []).filter((u) => /^https?:\/\//i.test(u));
  const category = skill.category ? CATEGORY_LABEL[skill.category] ?? skill.category : null;
  const why = skill.reason && !/^In den vorliegenden Unterlagen noch nicht belegt/.test(skill.reason)
    ? skill.reason
    : `${name} gehört zu den zentralen Anforderungen für ${targetJob}${targetCompany ? ` bei ${targetCompany}` : ''}.`;

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        background: open ? 'linear-gradient(160deg,rgba(48,227,202,0.07),rgba(8,14,24,0.96) 55%)' : 'rgba(255,255,255,0.025)',
        border: `1px solid ${open ? 'rgba(48,227,202,0.35)' : 'rgba(255,255,255,0.08)'}`,
      }}>
      <button onClick={onToggle} aria-expanded={open}
        className="w-full flex items-center gap-3 p-4 text-left">
        <span className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black flex-shrink-0"
          style={{ background: rank === 1 ? `linear-gradient(135deg,${ACCENT},${ACCENT_2})` : 'rgba(255,255,255,0.06)', color: rank === 1 ? '#000' : 'rgba(255,255,255,0.6)' }}>
          {rank}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-black text-white leading-snug">{name}</span>
          <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
              style={partial
                ? { background: 'rgba(245,158,11,0.12)', color: '#fcd34d', border: '1px solid rgba(245,158,11,0.25)' }
                : { background: 'rgba(48,227,202,0.1)', color: ACCENT, border: '1px solid rgba(48,227,202,0.25)' }}>
              {partial ? 'Ansatzpunkt vorhanden' : 'Neu aufbauen'}
            </span>
            <ImpactDots value={importance} />
            {category && <span className="text-[10px] text-white/35">{category}</span>}
          </span>
        </span>
        {gain != null && gain > 0 && (
          <span className="flex-shrink-0 text-right">
            <span className="block text-[15px] font-black tabular-nums" style={{ color: ACCENT }}>+{gain}%</span>
            <span className="block text-[9px] text-white/35 font-semibold">Abdeckung</span>
          </span>
        )}
        <ChevronDown size={16} className={`text-white/40 flex-shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="sgr-anim px-4 pb-4 space-y-3" style={{ animation: 'sgrFadeUp 0.25s ease' }}>
          <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-[10px] font-black uppercase tracking-wider text-white/40 mb-1.5 flex items-center gap-1.5">
              <Target size={11} /> Warum das für dich zählt
            </p>
            <p className="text-[13px] text-white/80 leading-relaxed">{why}</p>
          </div>

          {skill.first_step && (
            <div className="rounded-xl p-3.5" style={{ background: 'rgba(48,227,202,0.06)', border: '1px solid rgba(48,227,202,0.18)' }}>
              <p className="text-[10px] font-black uppercase tracking-wider mb-1.5 flex items-center gap-1.5" style={{ color: ACCENT }}>
                <Footprints size={11} /> Dein erster kleiner Schritt
              </p>
              <p className="text-[13px] text-white/80 leading-relaxed">{skill.first_step}</p>
            </div>
          )}

          {sources.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-white/45">
              <ShieldCheck size={12} className="text-white/40" />
              <span>Belegt durch:</span>
              {sources.slice(0, 3).map((u) => (
                <a key={u} href={u} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-white/10 hover:text-white/80 hover:border-white/25">
                  {hostOf(u)} <ExternalLink size={9} />
                </a>
              ))}
            </div>
          )}

          <PrimaryButton onClick={onStart}>
            <Sparkles size={15} /> Lernpfad für {name} starten <ArrowRight size={14} />
          </PrimaryButton>
          {gain != null && gain > 0 && (
            <p className="text-center text-[11px] text-white/40">
              Mit Zertifikat belegt, steigt deine Abdeckung um bis zu {gain} Prozentpunkte.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Bewertung (DSR-Evaluation) ────────────────────────────────────────────────

function FeedbackBar({ pathId }: { pathId: string }) {
  const [rating, setRating] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const rate = async (value: number) => {
    setRating(value);
    try {
      const { error } = await supabase.from('learning_paths')
        .update({ result_feedback: { rating: value, at: new Date().toISOString() } })
        .eq('id', pathId);
      if (error) console.warn('[SkillGapResult] Feedback nicht gespeichert:', error.message);
    } catch (e) {
      console.warn('[SkillGapResult] Feedback-Fehler:', e);
    }
    setSaved(true);
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 rounded-2xl px-4 py-3"
      style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
      {saved ? (
        <p className="text-xs text-white/60">Danke! Dein Feedback hilft uns, die Analyse weiter zu verbessern.</p>
      ) : (
        <>
          <span className="text-xs text-white/55">Wie hilfreich ist dieser Report für dich?</span>
          <span className="flex gap-1" role="radiogroup" aria-label="Bewertung von 1 bis 5">
            {[1, 2, 3, 4, 5].map((v) => (
              <button key={v} onClick={() => rate(v)} role="radio" aria-checked={rating === v}
                aria-label={`${v} von 5`} className="p-1 transition-transform hover:scale-110">
                <Star size={18} className={rating != null && v <= rating ? 'text-amber-300 fill-amber-300' : 'text-white/25'} />
              </button>
            ))}
          </span>
        </>
      )}
    </div>
  );
}

// ── Hauptkomponente ───────────────────────────────────────────────────────────

export function SkillGapResultView({ result }: { result: AnalysisResult }) {
  const { user: authUser, profile: authProfile } = useAuth() as any;
  const certName: string = (authProfile?.full_name || authUser?.user_metadata?.full_name || '').trim();
  const firstName = certName.split(' ')[0] || '';

  const { matchScore, targetJob, targetCompany, industry, strategicOutlook } = result;
  const totalWeight = result.coverage?.totalWeight ?? 0;

  const gaps = useMemo(() => (result.missingSkills as GapSkill[])
    .filter((s) => skillDisplayName(s) !== '(unbenannt)')
    .map((s) => ({ skill: s, gain: matchScore != null ? gainFor(s, totalWeight) : null }))
    // Größter Hebel zuerst: berechneter Zuwachs, sonst Wichtigkeit
    .sort((a, b) => (b.gain ?? 0) - (a.gain ?? 0) || (Number(b.skill.gap_severity) || 0) - (Number(a.skill.gap_severity) || 0)),
  [result.missingSkills, matchScore, totalWeight]);

  const strengths = useMemo(() => (result.currentSkills as StrengthSkill[])
    .filter((s) => skillDisplayName(s) !== '(unbenannt)'), [result.currentSkills]);

  const top = gaps[0]?.skill ?? null;
  const topName = top ? skillDisplayName(top) : '';
  const potential = matchScore != null
    ? Math.min(100, matchScore + gaps.slice(0, 3).reduce((n, g) => n + (g.gain ?? 0), 0))
    : null;

  const [openIdx, setOpenIdx] = useState(0);
  const [paywallSkill, setPaywallSkill] = useState<string | undefined>(undefined);
  const [showPaywall, setShowPaywall] = useState(false);
  const [heroCtaVisible, setHeroCtaVisible] = useState(true);
  const heroCtaRef = useRef<HTMLDivElement>(null);

  // Sticky-CTA (mobil) erst zeigen, wenn der Hero-CTA aus dem Bild ist
  useEffect(() => {
    const el = heroCtaRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([entry]) => setHeroCtaVisible(entry.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const openPaywall = (skillName?: string) => {
    setPaywallSkill(skillName);
    setShowPaywall(true);
  };

  const covered = result.coverage?.covered ?? null;
  const partial = result.coverage?.partial ?? null;
  const total = result.coverage?.total ?? null;

  const headline = matchScore != null
    ? `${firstName ? `${firstName}, du` : 'Du'} erfüllst bereits ${matchScore} % der Anforderungen – belegbar.`
    : `${firstName ? `${firstName}, dein` : 'Dein'} Weg zur Position ${targetJob}: ${gaps.length} klare Hebel.`;

  return (
    <div className="space-y-6 pb-24 sm:pb-0" style={{ animation: 'sgrFadeUp 0.5s ease' }}>
      <style>{STYLES}</style>

      {/* ── HERO · Attention ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl p-5 sm:p-7"
        style={{ background: 'linear-gradient(140deg,rgba(48,227,202,0.12) 0%,rgba(8,14,24,0.92) 55%,rgba(102,192,182,0.07) 100%)', border: '1px solid rgba(48,227,202,0.22)' }}>
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none opacity-[0.1]"
          style={{ background: `radial-gradient(circle,${ACCENT},transparent)` }} />

        <div className="relative flex flex-col sm:flex-row sm:items-center gap-5">
          {matchScore != null && <ScoreRing score={matchScore} potential={potential} />}
          <div className="flex-1 min-w-0 space-y-2">
            <p className="text-[10px] font-black uppercase tracking-[0.18em]" style={{ color: `${ACCENT}cc` }}>
              Dein Karriere-Report · {targetJob}
            </p>
            <h3 className="text-[22px] sm:text-[26px] font-black text-white leading-tight">{headline}</h3>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {targetCompany && (
                <span className="flex items-center gap-1 text-xs text-white/55"><Building2 size={12} /> {targetCompany}</span>
              )}
              {industry && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold border"
                  style={{ background: 'rgba(102,192,182,0.1)', color: ACCENT_2, borderColor: 'rgba(102,192,182,0.22)' }}>{industry}</span>
              )}
            </div>
            {potential != null && matchScore != null && potential > matchScore && (
              <p className="text-sm text-white/70 flex items-center gap-1.5">
                <TrendingUp size={14} style={{ color: ACCENT }} />
                Mit deinen Top-3-Hebeln sind bis zu <strong className="text-white">{potential} %</strong> möglich.
              </p>
            )}
          </div>
        </div>

        {/* Kennzahlen */}
        {total != null && total > 0 && (
          <div className="relative grid grid-cols-3 gap-2 mt-5">
            {[
              { n: covered ?? 0, label: 'voll belegt', color: '#86efac' },
              { n: partial ?? 0, label: 'Ansatzpunkte', color: '#fcd34d' },
              { n: gaps.length, label: 'Top-Hebel', color: ACCENT },
            ].map((k) => (
              <div key={k.label} className="rounded-xl py-2.5 text-center" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <span className="block text-xl font-black tabular-nums" style={{ color: k.color }}>{k.n}</span>
                <span className="block text-[10px] text-white/45 font-semibold">{k.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Primär-CTA */}
        {top && (
          <div ref={heroCtaRef} className="relative mt-5 space-y-2">
            <PrimaryButton onClick={() => openPaywall(topName)} pulse>
              <Sparkles size={16} /> Mit {topName} starten <ArrowRight size={15} />
            </PrimaryButton>
            <p className="text-center text-[11px] text-white/40">
              Dein größter Hebel{gaps[0]?.gain ? ` · +${gaps[0].gain} % Abdeckung` : ''} · 5 Lerneinheiten · Prüfung · Zertifikat
            </p>
          </div>
        )}
      </div>

      {/* Einordnung */}
      {strategicOutlook && (
        <div className="flex gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Info size={15} className="flex-shrink-0 mt-0.5" style={{ color: ACCENT_2 }} />
          <p className="text-[13px] text-white/70 leading-relaxed">{strategicOutlook}</p>
        </div>
      )}

      {/* ── STÄRKEN · Confidence ─────────────────────────────────────────── */}
      {strengths.length > 0 && <Strengths skills={strengths} />}

      {/* ── HEBEL · Relevance ────────────────────────────────────────────── */}
      {gaps.length > 0 && (
        <div className="space-y-3">
          <SectionTitle icon={<Target size={14} />} title="Deine Hebel – nach Wirkung sortiert"
            hint={matchScore != null ? '+% = Zuwachs deiner Abdeckung' : undefined} />
          <div className="space-y-2.5">
            {gaps.map(({ skill, gain }, i) => (
              <GapCard
                key={`${skillDisplayName(skill)}-${i}`}
                skill={skill}
                rank={i + 1}
                open={openIdx === i}
                onToggle={() => setOpenIdx(openIdx === i ? -1 : i)}
                gain={gain}
                targetJob={targetJob}
                targetCompany={targetCompany}
                onStart={() => openPaywall(skillDisplayName(skill))}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── ERGEBNIS VOR AUGEN · Satisfaction ────────────────────────────── */}
      {top && (
        <div className="rounded-3xl p-5 sm:p-6 space-y-5"
          style={{ background: 'linear-gradient(160deg,rgba(48,227,202,0.06),rgba(6,10,18,0.96) 60%)', border: '1px solid rgba(48,227,202,0.2)' }}>
          <SectionTitle icon={<Award size={14} />} title={`So wird ${topName} zu deinem Nachweis`} />
          <div className="grid grid-cols-1 md:grid-cols-5 gap-5 items-start">
            <div className="md:col-span-2">
              <LearningJourney />
            </div>
            <div className="md:col-span-3">
              <CertificatePreview name={certName} skill={topName} />
            </div>
          </div>
          <PrimaryButton onClick={() => openPaywall(topName)}>
            <Sparkles size={15} /> Jetzt Lernpfad für {topName} starten <ArrowRight size={14} />
          </PrimaryButton>
        </div>
      )}

      {/* ── Transparenz ──────────────────────────────────────────────────── */}
      <details className="group rounded-2xl px-4 py-3 text-xs text-white/55"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <summary className="cursor-pointer list-none flex items-center justify-between gap-2 font-semibold text-white/60">
          <span className="flex items-center gap-1.5"><ShieldCheck size={13} /> So entsteht dein Ergebnis</span>
          <ChevronDown size={14} className="transition-transform group-open:rotate-180" />
        </summary>
        <div className="mt-3 space-y-2 leading-relaxed">
          <p>{result.scoreMethod || 'Die Einschätzung basiert auf deinen Unterlagen.'}</p>
          <p>„Noch nicht belegt“ heißt nur: In deinen Unterlagen steht es (noch) nicht – nicht, dass du es nicht kannst.</p>
          {!!result.sources?.length && (
            <ul className="space-y-1 pt-1">
              {result.sources.filter((u) => /^https?:\/\//i.test(u)).slice(0, 12).map((u) => (
                <li key={u}>
                  <a href={u} target="_blank" rel="noopener noreferrer" className="underline break-all hover:text-white/80">{u}</a>
                </li>
              ))}
            </ul>
          )}
          <p className="text-white/35">KI-gestützte Einschätzung. Quellenverweise ersetzen keinen unabhängigen Faktencheck.</p>
        </div>
      </details>

      <FeedbackBar pathId={result.pathId} />

      {/* ── Sticky-CTA mobil ─────────────────────────────────────────────── */}
      {top && !heroCtaVisible && !showPaywall && (
        <div className="sgr-anim sm:hidden fixed inset-x-0 bottom-0 z-40 px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))]"
          style={{ background: 'rgba(5,10,18,0.96)', borderTop: '1px solid rgba(48,227,202,0.2)', backdropFilter: 'blur(8px)', animation: 'sgrSlideUp 0.3s ease' }}>
          <PrimaryButton onClick={() => openPaywall(topName)} className="!py-3.5">
            <Sparkles size={15} /> Mit {topName} starten <ArrowRight size={14} />
          </PrimaryButton>
        </div>
      )}

      {showPaywall && (
        <LearningPathPaywall
          isOpen
          onClose={() => { setShowPaywall(false); setPaywallSkill(undefined); }}
          analysisPathId={result.pathId}
          missingSkills={gaps.map((g) => g.skill)}
          targetJob={targetJob}
          targetCompany={targetCompany}
          skillCount={gaps.length}
          selectedSkill={paywallSkill}
        />
      )}
    </div>
  );
}

export default SkillGapResultView;
