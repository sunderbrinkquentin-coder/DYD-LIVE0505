// src/components/career/AcademyCatalogSection.tsx
//
// "Beliebte Lernpfade" – fertige, allgemeine Lernpfade aus dem Katalog.
// Sofort verfügbar (keine Generierung), 20 % günstiger als ein personalisierter
// Lernpfad. Wird im Dashboard, auf der Career-Vision-Seite und auf der
// Landingpage gezeigt. Ohne Katalog-Einträge rendert die Sektion nichts.

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Zap, Award, BookOpen, ArrowRight, Loader2, Flame } from 'lucide-react';
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
}

export function AcademyCatalogSection({
  title = 'Beliebte Lernpfade',
  subtitle = 'Fertig erstellt, sofort startklar – mit Abschlussprüfung und prüfbarem Zertifikat.',
  limit = 6,
  excludeSkills = [],
  variant = 'app',
  className = '',
}: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const [entries, setEntries] = useState<CatalogEntry[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  if (!entries || entries.length === 0) return null;

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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {entries.map((entry) => (
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

            <div className="pr-12">
              <p className="text-base font-black text-white leading-snug">{entry.skill}</p>
              {entry.description && <p className="text-xs text-white/50 mt-1 line-clamp-2">{entry.description}</p>}
            </div>

            <ul className="space-y-1.5 text-xs text-white/60">
              <li className="flex items-center gap-2"><BookOpen size={13} className="text-[#66c0b6]" /> {entry.unit_count || 5} interaktive Lerneinheiten</li>
              <li className="flex items-center gap-2"><Award size={13} className="text-[#66c0b6]" /> Abschlussprüfung + prüfbares Zertifikat</li>
              <li className="flex items-center gap-2"><Zap size={13} className="text-[#66c0b6]" /> Ohne Wartezeit – direkt loslegen</li>
            </ul>

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

      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-[11px] text-white/30">
        Allgemeine Lernpfade sind nicht auf deinen Lebenslauf zugeschnitten. Für einen persönlichen Lernpfad starte eine kostenlose Skill-Analyse.
      </p>
    </section>
  );
}

export default AcademyCatalogSection;
