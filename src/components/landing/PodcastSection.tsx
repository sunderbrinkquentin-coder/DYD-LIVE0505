import { motion } from 'framer-motion';
import { Headphones, Mic, Play, ArrowRight, Calendar, Radio, Award } from 'lucide-react';

const SPOTIFY_EPISODE_ID = '7aCJirzEJsctPd5D1AqnWi';
const SPOTIFY_EPISODE_URL =
  'https://open.spotify.com/episode/7aCJirzEJsctPd5D1AqnWi?si=cNesit1BSMGoyltJW-0Ovw';

// Optional: NUR füllen, wenn du vom Host (Bastian Hughes) eine echte,
// belegbare monatliche Hörerzahl bekommst – z. B. '10.000+'.
// Bleibt der Wert null, wird die Kachel automatisch nicht angezeigt.
const MONTHLY_LISTENERS: string | null = null;

// Belegbare Fakten (öffentlich verifizierbar über Apple/Spotify/player.fm)
const PODCAST_STATS = [
  { icon: Calendar, value: 'Seit 2017', label: 'Etablierter Karriere-Podcast' },
  { icon: Radio, value: '300+ Folgen', label: 'Wöchentlich neue Episode' },
  { icon: Award, value: 'Recruiting-Profi', label: 'Host mit 10 J. HR-Erfahrung' },
];

export function PodcastSection() {
  const stats = MONTHLY_LISTENERS
    ? [{ icon: Headphones, value: MONTHLY_LISTENERS, label: 'Hörer pro Monat' }, ...PODCAST_STATS]
    : PODCAST_STATS;

  return (
    <section
      id="podcast"
      className="relative py-16 sm:py-20 px-4 sm:px-6 lg:px-8 overflow-hidden"
      aria-label="Podcast – Quentin Sunderbrink zu Gast bei Berufsoptimierer"
      itemScope
      itemType="https://schema.org/PodcastEpisode"
    >
      {/* Ambient glow, passend zum restlichen Deck */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-[#66c0b6]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#30E3CA]/6 rounded-full blur-3xl" />
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 sm:mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#66c0b6]/15 border border-[#66c0b6]/30 text-[#66c0b6] text-sm font-bold mb-5">
            <Headphones className="w-4 h-4" /> Podcast-Gast
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

        {/* Stats-Leiste – belegbare Trust-Punkte */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className={`grid gap-4 mb-8 max-w-3xl mx-auto ${
            stats.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-3'
          }`}
        >
          {stats.map((stat, i) => (
            <div
              key={i}
              className="flex flex-col items-center text-center gap-1.5 bg-white/5 border border-white/10 rounded-2xl px-4 py-5 hover:border-[#66c0b6]/30 transition-colors"
            >
              <stat.icon className="w-5 h-5 text-[#66c0b6] mb-1" />
              <span className="text-xl font-black text-white">{stat.value}</span>
              <span className="text-[11px] text-white/45 leading-tight">{stat.label}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-3xl border border-[#66c0b6]/25"
          style={{ background: 'linear-gradient(135deg, rgba(102,192,182,0.08) 0%, rgba(10,10,15,0.97) 55%)' }}
        >
          <div
            className="absolute top-0 right-0 w-72 h-72 rounded-full opacity-[0.08] pointer-events-none"
            style={{ background: 'radial-gradient(circle,#30E3CA,transparent)', transform: 'translate(25%,-25%)' }}
          />

          <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 p-6 sm:p-10">
            {/* Text-Spalte */}
            <div className="flex-1 space-y-5 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs font-bold uppercase tracking-widest">
                <Mic className="w-3 h-3 text-[#66c0b6]" /> Gastfolge
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

              <div className="pt-2">
                <a
                  href={SPOTIFY_EPISODE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 transition-all shadow-lg"
                >
                  Folge auf Spotify öffnen
                  <ArrowRight className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Player-Spalte */}
            <div className="w-full lg:w-[380px] flex-shrink-0">
              <iframe
                title="Berufsoptimierer – Podcast-Folge mit Quentin Sunderbrink"
                src={`https://open.spotify.com/embed/episode/${SPOTIFY_EPISODE_ID}?utm_source=generator&theme=0`}
                width="100%"
                height="232"
                frameBorder="0"
                loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="rounded-2xl"
              />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}