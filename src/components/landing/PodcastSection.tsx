import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Headphones, Mic, Play, ArrowRight, Calendar, Radio, Award } from 'lucide-react';

const SPOTIFY_EPISODE_ID = '7aCJirzEJsctPd5D1AqnWi';
const SPOTIFY_EPISODE_URL =
  'https://open.spotify.com/episode/7aCJirzEJsctPd5D1AqnWi?si=cNesit1BSMGoyltJW-0Ovw';

// Vom Podcast selbst publizierte Reichweite (Quelle: berufsoptimierer.de/kooperation).
// Bleibt der Wert null, wird die Kachel automatisch nicht angezeigt.
const MONTHLY_LISTENERS: string | null = '20.000';

const listenerTarget = MONTHLY_LISTENERS
  ? parseInt(MONTHLY_LISTENERS.replace(/\D/g, ''), 10) || 0
  : 0;
const listenerSuffix = MONTHLY_LISTENERS?.includes('+') ? '+' : '';

// Belegbare Fakten (öffentlich verifizierbar über berufsoptimierer.de / Apple / Spotify)
const PODCAST_STATS = [
  { icon: Calendar, value: 'Seit 2017', label: 'Etablierter Karriere-Podcast' },
  { icon: Radio, value: '300+ Folgen', label: 'Wöchentlich neue Episode' },
  { icon: Award, value: 'Recruiting-Profi', label: 'Host mit 10 J. HR-Erfahrung' },
];

/** Zählt eine Zahl hoch, sobald sie ins Sichtfeld scrollt. */
function CountUp({ target, duration = 1500 }: { target: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [val, setVal] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let raf = 0;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(target * eased));
          if (p < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      },
      { threshold: 0.4 }
    );
    obs.observe(el);
    return () => {
      obs.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, duration]);

  return <span ref={ref}>{val.toLocaleString('de-DE')}</span>;
}

/** Animierte Equalizer-Balken – dekorativer Podcast-Akzent. */
function Equalizer({ className = '' }: { className?: string }) {
  const bars = [0.35, 0.7, 0.45, 0.95, 0.55, 0.8, 0.4];
  return (
    <div className={`flex items-end gap-[3px] h-5 ${className}`} aria-hidden="true">
      {bars.map((h, i) => (
        <motion.span
          key={i}
          className="w-1 rounded-full bg-gradient-to-t from-[#66c0b6] to-[#30E3CA]"
          style={{ height: '100%', transformOrigin: 'bottom' }}
          animate={{ scaleY: [h, 1, h * 0.55, 0.9, h] }}
          transition={{
            duration: 1.3 + (i % 3) * 0.35,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.09,
          }}
        />
      ))}
    </div>
  );
}

export function PodcastSection() {
  return (
    <section
      id="podcast"
      className="relative py-16 sm:py-24 px-4 sm:px-6 lg:px-8 overflow-hidden"
      aria-label="Podcast – Quentin Sunderbrink zu Gast bei Berufsoptimierer"
      itemScope
      itemType="https://schema.org/PodcastEpisode"
    >
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#66c0b6]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#30E3CA]/8 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-14"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#66c0b6]/15 border border-[#66c0b6]/30 text-[#66c0b6] text-sm font-bold mb-5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#66c0b6] opacity-75 animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#66c0b6]" />
            </span>
            Podcast-Gast
            <Equalizer className="ml-0.5" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black mb-4">
            Reingehört:{' '}
            <span className="bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent">
              DYD im Podcast
            </span>
          </h2>
          <p className="text-lg text-white/60 max-w-2xl mx-auto">
            Quentin war zu Gast bei{' '}
            <span className="text-white/80 font-semibold">Berufsoptimierer – Erfolg in Bewerbung und Karriere</span>{' '}
            und spricht über KI-gestützte Bewerbungen, ATS und wie DYD Chancengleichheit schafft.
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className={`grid gap-4 mb-10 max-w-4xl mx-auto ${
            MONTHLY_LISTENERS ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
          }`}
        >
          {/* Highlight-Kachel: Reichweite */}
          {MONTHLY_LISTENERS && (
            <div className="relative overflow-hidden rounded-2xl p-[1.5px] bg-gradient-to-br from-[#66c0b6] via-[#30E3CA]/50 to-transparent">
              <div className="relative h-full flex flex-col items-center text-center gap-1.5 rounded-2xl px-4 py-5 bg-[#0a0f10]">
                <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full bg-[#66c0b6]/20 blur-2xl" />
                <Headphones className="w-5 h-5 text-[#66c0b6] mb-1" />
                <span className="text-2xl font-black bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent">
                  <CountUp target={listenerTarget} />
                  {listenerSuffix}
                </span>
                <span className="text-[11px] text-white/55 leading-tight font-medium">Hörer:innen pro Monat</span>
              </div>
            </div>
          )}

          {PODCAST_STATS.map((stat, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className="flex flex-col items-center text-center gap-1.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-5 hover:border-[#66c0b6]/40 transition-colors"
            >
              <span className="w-9 h-9 rounded-xl bg-[#66c0b6]/15 border border-[#66c0b6]/25 flex items-center justify-center mb-1">
                <stat.icon className="w-4.5 h-4.5 text-[#66c0b6]" />
              </span>
              <span className="text-lg font-black text-white">{stat.value}</span>
              <span className="text-[11px] text-white/45 leading-tight">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-[#66c0b6]/25"
          style={{ background: 'linear-gradient(135deg, rgba(102,192,182,0.10) 0%, rgba(10,10,15,0.97) 55%)' }}
        >
          {/* Akzent-Leiste oben */}
          <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg,#30E3CA,#66c0b6,transparent)' }} />

          <div
            className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.10] pointer-events-none"
            style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', transform: 'translate(25%,-25%)' }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 p-6 sm:p-10">
            {/* Text-Spalte */}
            <div className="flex-1 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-widest">
                <Mic className="w-3 h-3 text-[#66c0b6]" /> Gastfolge
                <Equalizer className="h-4" />
              </div>

              <h3 className="text-2xl sm:text-3xl font-black text-white leading-tight" itemProp="name">
                Berufsoptimierer –{' '}
                <span className="text-[#66c0b6]">Erfolg in Bewerbung &amp; Karriere</span>
              </h3>

              <p className="text-white/60 leading-relaxed max-w-xl mx-auto lg:mx-0" itemProp="description">
                Ein offenes Gespräch über den Bewerbungsprozess im KI-Zeitalter: warum viele CVs an
                ATS-Systemen scheitern, wie man sich davon abhebt und welche Rolle DYD dabei spielt.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-1">
                {[
                  { icon: Headphones, label: 'Direkt anhören' },
                  { icon: Mic, label: 'Quentin als Gast' },
                  { icon: Play, label: 'Auf Spotify' },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-2 text-sm text-white/70">
                    <item.icon className="w-4 h-4 text-[#66c0b6]" />
                    {item.label}
                  </span>
                ))}
              </div>

              {/* Host-Credibility */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/20 text-left">
                <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center flex-shrink-0">
                  <Mic className="w-4 h-4 text-black" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-white leading-tight">Host: Bastian Hughes</span>
                  <span className="block text-[11px] text-white/50 leading-tight">Ex-Recruiter &amp; Karriere-Coach seit 2017</span>
                </span>
              </div>

              <div className="pt-1">
                <a
                  href={SPOTIFY_EPISODE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 transition-all shadow-lg shadow-[#66c0b6]/20"
                >
                  Folge auf Spotify öffnen
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </a>
              </div>
            </div>

            {/* Player-Spalte mit leuchtendem Gradient-Rahmen */}
            <div className="w-full lg:w-[380px] flex-shrink-0">
              <motion.div
                className="relative rounded-2xl p-[1.5px] bg-gradient-to-br from-[#66c0b6] via-[#30E3CA]/40 to-[#2d5365]/40"
                animate={{
                  boxShadow: [
                    '0 0 0 0 rgba(102,192,182,0.0)',
                    '0 0 40px 0 rgba(102,192,182,0.25)',
                    '0 0 0 0 rgba(102,192,182,0.0)',
                  ],
                }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <div className="rounded-2xl overflow-hidden bg-[#0a0f10]">
                  <iframe
                    title="Berufsoptimierer – Podcast-Folge mit Quentin Sunderbrink"
                    src={`https://open.spotify.com/embed/episode/${SPOTIFY_EPISODE_ID}?utm_source=generator&theme=0`}
                    width="100%"
                    height="232"
                    frameBorder="0"
                    loading="lazy"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    className="block"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}