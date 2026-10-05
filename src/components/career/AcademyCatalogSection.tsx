// src/components/career/AcademyCatalogSection.tsx
//
// "Beliebte Lernpfade" – fertige, allgemeine Lernpfade aus dem Katalog.
// Sofort verfügbar (keine Generierung), 20 % günstiger als ein personalisierter
// Lernpfad. Wird im Dashboard, auf der Career-Vision-Seite, auf der
// Landingpage und auf der Kursseite (/kurse) gezeigt.
// Ohne Katalog-Einträge rendert die Sektion nichts (außer showEmpty).

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Zap, Award, BookOpen, ArrowRight, Loader2, Flame, Search, X, CheckCircle2, ShieldCheck, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { CertificatePreview, LearningJourney, LinkedInPreview } from './AcademyPreviews';
import {
  academyCatalogService,
  CATALOG_DISCOUNT_LABEL,
  CATALOG_PRICE_LABEL,
  REGULAR_PRICE_LABEL,
  type CatalogEntry,
} from '../../services/academyCatalogService';

interface Props {
  title?: string;
  subtitle?: string;
  limit?: number;
  /** Skills, die der Nutzer schon hat/gekauft hat – werden ausgeblendet */
  excludeSkills?: string[];
  /** Dunkles App-Design (Dashboard) oder Landingpage */
  variant?: 'app' | 'landing';
  className?: string;
  /** Link "Alle Kurse ansehen" zur Kursseite */
  showAllLink?: boolean;
  /** Suchfeld über den Kursen (Kursseite) */
  searchable?: boolean;
  /** Auch ohne Kurse etwas anzeigen (Kursseite) */
  showEmpty?: boolean;
}

export function AcademyCatalogSection({
  title = 'Beliebte Lernpfade',
  subtitle = 'Fertig erstellt, sofort startklar – mit Abschlussprüfung und prüfbarem Zertifikat.',
  limit = 6,
  excludeSkills = [],
  variant = 'app',
  className = '',
  showAllLink = false,
  searchable = false,
  showEmpty = false,
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [entries, setEntries] = useState<CatalogEntry[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [detail, setDetail] = useState<CatalogEntry | null>(null);

  const excludeKey = excludeSkills.map((s) => s.trim().toLowerCase()).sort().join('|');

  useEffect(() => {
    let cancelled = false;
    academyCatalogService.list(limit + excludeSkills.length).then((list) => {
      if (cancelled) return;
      const excluded = new Set(excludeKey ? excludeKey.split('|') : []);
      setEntries(list.filter((e) => !excluded.has(e.skill_key)).slice(0, limit));
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit, excludeKey]);

  const visible = useMemo(() => {
    if (!entries) return [];
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => e.skill.toLowerCase().includes(q) || (e.description ?? '').toLowerCase().includes(q));
  }, [entries, query]);

  if (entries === null) {
    return showEmpty ? (
      <div className={`flex items-center gap-2 text-sm text-white/50 ${className}`}>
        <Loader2 size={16} className="animate-spin" /> Kurse werden geladen …
      </div>
    ) : null;
  }
  if (entries.length === 0 && !showEmpty) return null;

  const buy = async (entry: CatalogEntry) => {
    setBusyId(entry.id);
    setError(null);
    try {
      const res = await academyCatalogService.startCheckout(entry, location.pathname);
      if ('needsLogin' in res) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      } else if ('ownedPathId' in res) {
        navigate(`/learning-path/${res.ownedPathId}`);
      }
    } catch (e: any) {
      setError(e?.message || 'Der Kauf konnte nicht gestartet werden.');
    } finally {
      setBusyId(null);
    }
  };

  const isLanding = variant === 'landing';

  return (
    <section className={`space-y-4 ${className}`}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/70 flex items-center gap-1.5">
            <Zap size={12} /> Sofort verfügbar · {CATALOG_DISCOUNT_LABEL}
          </p>
          <h3 className={`font-black text-white mt-1 ${isLanding ? 'text-2xl sm:text-3xl' : 'text-lg'}`}>{title}</h3>
          <p className="text-sm text-white/50 mt-1 max-w-xl">{subtitle}</p>
        </div>
        {showAllLink && entries.length > 0 && (
          <button
            onClick={() => navigate('/kurse')}
            className="flex items-center gap-1.5 text-sm font-bold text-[#30E3CA] hover:text-white transition-colors"
          >
            Alle Kurse ansehen <ArrowRight size={14} />
          </button>
        )}
      </div>

      {searchable && entries.length > 0 && (
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/35" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Kurs suchen, z. B. Excel, Projektmanagement …"
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#30E3CA]/50"
          />
        </div>
      )}

      {entries.length === 0 ? (
        <div className="rounded-2xl p-6 text-sm text-white/55" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
          Die ersten Kurse werden gerade vorbereitet. Schau bald wieder vorbei – oder starte direkt deinen persönlichen Lernpfad über die kostenlose Skill-Analyse.
        </div>
      ) : visible.length === 0 ? (
        <p className="text-sm text-white/50">Kein Kurs zu „{query}“ gefunden. Für jeden Skill gibt es einen persönlichen Lernpfad über die Skill-Analyse.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {visible.map((entry) => (
            <div
              key={entry.id}
              className="relative rounded-2xl p-5 flex flex-col gap-3 transition-all hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(150deg,rgba(48,227,202,0.08),rgba(6,10,18,0.95) 60%)',
                border: '1px solid rgba(48,227,202,0.2)',
              }}
            >
              <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-black text-black"
                style={{ background: 'linear-gradient(90deg,#30E3CA,#66c0b6)' }}>
                {CATALOG_DISCOUNT_LABEL}
              </div>

              <button type="button" onClick={() => setDetail(entry)} className="pr-12 text-left">
                <p className="text-base font-black text-white leading-snug hover:text-[#30E3CA] transition-colors">{entry.skill}</p>
                {entry.description && <p className="text-xs text-white/50 mt-1 line-clamp-2">{entry.description}</p>}
              </button>

              <ul className="space-y-1.5 text-xs text-white/60">
                <li className="flex items-center gap-2"><BookOpen size={13} className="text-[#66c0b6]" /> {entry.unit_count || 5} interaktive Lerneinheiten</li>
                <li className="flex items-center gap-2"><Award size={13} className="text-[#66c0b6]" /> Abschlussprüfung + prüfbares Zertifikat</li>
                <li className="flex items-center gap-2"><Zap size={13} className="text-[#66c0b6]" /> Ohne Wartezeit – direkt loslegen</li>
              </ul>

              <button
                type="button"
                onClick={() => setDetail(entry)}
                className="self-start flex items-center gap-1.5 text-xs font-bold text-[#30E3CA] hover:text-white transition-colors"
              >
                <Eye size={13} /> Inhalte & Zertifikat ansehen
              </button>

              {entry.purchases >= 3 && (
                <p className="text-[11px] text-amber-300/80 flex items-center gap-1"><Flame size={12} /> {entry.purchases}× gestartet</p>
              )}

              <div className="mt-auto flex items-center justify-between gap-3 pt-1">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-black text-white">{CATALOG_PRICE_LABEL}</span>
                  <span className="text-xs text-white/35 line-through">{REGULAR_PRICE_LABEL}</span>
                </div>
                <button
                  onClick={() => buy(entry)}
                  disabled={busyId !== null}
                  className="px-4 py-2.5 rounded-xl text-sm font-black text-black flex items-center gap-1.5 transition-all hover:scale-[1.03] disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}
                >
                  {busyId === entry.id ? <Loader2 size={15} className="animate-spin" /> : <>Starten <ArrowRight size={14} /></>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {detail && (
        <CourseDetailModal
          entry={detail}
          busy={busyId === detail.id}
          onClose={() => setDetail(null)}
          onBuy={() => buy(detail)}
        />
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-[11px] text-white/30">
        Allgemeine Lernpfade sind nicht auf deinen Lebenslauf zugeschnitten. Für einen persönlichen Lernpfad starte eine kostenlose Skill-Analyse.
      </p>
    </section>
  );
}

export default AcademyCatalogSection;

// ─────────────────────────────────────────────────────────────────────────────
// Kursdetail: Inhalte, Lernweg, persönliches Zertifikat, Kauf
// ─────────────────────────────────────────────────────────────────────────────
function CourseDetailModal({ entry, busy, onClose, onBuy }: {
  entry: CatalogEntry; busy: boolean; onClose: () => void; onBuy: () => void;
}) {
  const { user, profile } = useAuth() as any;
  const name: string = (profile?.full_name || user?.user_metadata?.full_name || '').trim();
  const [units, setUnits] = useState<{ unit_id: number; title: string; objectives: string[] }[] | null>(null);

  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    let alive = true;
    academyCatalogService.units(entry.id).then((u) => alive && setUnits(u));
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { alive = false; window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [entry.id]);

  const titles = (units ?? []).map((u) => u.title).filter(Boolean);
  const objectives = (units ?? []).flatMap((u) => u.objectives.slice(0, 1)).slice(0, 5);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`Kurs ${entry.skill}`}
    >
      <div className="relative w-full sm:max-w-4xl max-h-[94vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl"
        style={{ background: 'linear-gradient(160deg,#080f18,#050b12)', border: '1px solid rgba(48,227,202,0.2)' }}>
        <div className="h-[3px]" style={{ background: 'linear-gradient(90deg,#30E3CA,#66c0b6,transparent)' }} />

        <div className="flex items-start justify-between gap-4 p-5 sm:p-7 pb-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#30E3CA]/80 flex items-center gap-1.5">
              <Zap size={12} /> Sofort startklar · {CATALOG_DISCOUNT_LABEL}
            </p>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">{entry.skill}</h3>
            {entry.description && <p className="text-sm text-white/60 mt-2 max-w-2xl">{entry.description}</p>}
          </div>
          <button onClick={onClose} aria-label="Schließen" className="w-9 h-9 rounded-xl flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 p-5 sm:p-7 pt-4">
          <div className="md:col-span-2 space-y-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Dein Weg zum Zertifikat</p>
              {units === null
                ? <div className="flex items-center gap-2 text-sm text-white/50"><Loader2 size={15} className="animate-spin" /> Inhalte werden geladen …</div>
                : <LearningJourney units={titles} />}
            </div>
            {objectives.length > 0 && (
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Danach kannst du</p>
                <ul className="space-y-1.5">
                  {objectives.map((o, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-white/70"><CheckCircle2 size={13} className="text-[#66c0b6] mt-0.5 flex-shrink-0" /> {o}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="md:col-span-3 space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40">
              {name ? `So sieht dein Zertifikat aus, ${name.split(' ')[0]}` : 'So sieht dein Zertifikat aus'}
            </p>
            <CertificatePreview name={name} skill={entry.skill} units={titles} />
            <LinkedInPreview skill={entry.skill} className="hidden sm:block" />
          </div>
        </div>

        {/* Kaufleiste – bleibt beim Scrollen sichtbar */}
        <div className="sticky bottom-0 p-4 sm:px-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between"
          style={{ background: 'rgba(5,11,18,0.96)', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{CATALOG_PRICE_LABEL}</span>
              <span className="text-sm text-white/35 line-through">{REGULAR_PRICE_LABEL}</span>
            </div>
            <div className="hidden sm:flex flex-col text-[11px] text-white/50">
              <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-[#30E3CA]" /> Einmalzahlung, kein Abo</span>
              <span className="flex items-center gap-1"><Award size={12} className="text-[#30E3CA]" /> Zertifikat inklusive</span>
            </div>
          </div>
          <button
            onClick={onBuy}
            disabled={busy}
            className="px-6 py-3.5 rounded-xl font-black text-black flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#30E3CA,#66c0b6)' }}
          >
            {busy ? <Loader2 size={17} className="animate-spin" /> : <>Jetzt starten <ArrowRight size={16} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}
