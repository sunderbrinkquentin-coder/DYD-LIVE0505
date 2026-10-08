import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Sparkles, Volume2, VolumeX, Play, AlertCircle, ArrowRight } from 'lucide-react';

/* ─── DYD ORBIT – Video-Showcase (4 Hochkant-Videos, 1080×1350 / 4:5) ───
   Eingebunden in B2BTabs.tsx → TabBContent (Bildungsträger), direkt nach
   ORBIT-Intro + "Warum das zählt" und vor Skill-Gap-Widget / Preisen.
   Verhalten: Videos laufen stumm, sobald sie zu mind. 50 % sichtbar sind,
   und pausieren beim Wegscrollen bzw. Wegwischen. Klick = Ton an (startet
   den Clip von vorn); es hat immer nur ein Video gleichzeitig Ton.
   Bei "Bewegung reduzieren" (OS-Einstellung) kein Autoplay, nur Play-Button. */

// ▼ Public-URL des Supabase-Storage-Buckets (mit / am Ende).
//   Project-Ref aus src/lib/supabase.ts übernommen; Bucket: marketing (geprüft, alle 4 Dateien erreichbar).
const VIDEO_BASE = 'https://vuumqarzylewhzvtbtcl.supabase.co/storage/v1/object/public/marketing/';

const VIEWPORT = { once: true, margin: '-60px' } as const;
const SKY_LIME = 'linear-gradient(135deg, #38BDF8, #DEFF9A)';
const LIME_SKY = 'linear-gradient(135deg, #DEFF9A, #38BDF8)';

type Clip = { file: string; tag: string; title: string; text: string; hasAudio: boolean };

const CLIPS: Clip[] = [
  {
    file: '2026-10-07_Mi_0830_ORBIT.mp4',
    tag: 'Überblick',
    title: 'ORBIT in 6 Schritten',
    text: 'Werdegang, Skills, Wunsch, Lücke, Passung – am Ende steht ein qualifizierter Lead.',
    hasAudio: false,
  },
  {
    file: 'LinkedIn_B2B_1_Formular-zu-Beratung.mp4',
    tag: 'Beratung',
    title: 'Vom Formular zur Beratung',
    text: 'Statt Filterformular berät ORBIT Interessenten wie Ihre besten Berater – bis zum passenden Kurs.',
    hasAudio: true,
  },
  {
    file: 'LinkedIn_B2B_2_Bedenken.mp4',
    tag: 'Bedenken',
    title: 'Kosten & Zeit direkt klären',
    text: 'ORBIT beantwortet Fragen zu Kosten und Zeitaufwand genau dort, wo Interessenten sonst abspringen: am Kurs.',
    hasAudio: true,
  },
  {
    file: 'LinkedIn_B2B_3_Lead-Qualitaet.mp4',
    tag: 'Lead-Qualität',
    title: 'Mehr als Name + E-Mail',
    text: 'Sie wissen schon vor dem Anruf: Ziel, Vorwissen, Wunschstart und Förderbedarf.',
    hasAudio: true,
  },
];

function VideoCard({
  clip, index, hasSound, onSoundChange, reduce, variants,
}: {
  clip: Clip;
  index: number;
  hasSound: boolean;
  onSoundChange: (index: number, on: boolean) => void;
  reduce: boolean;
  variants: Variants;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Autoplay (stumm) bei Sichtbarkeit, Pause beim Wegscrollen/-wischen.
  useEffect(() => {
    const v = ref.current;
    if (!v || typeof IntersectionObserver === 'undefined') return;
    v.muted = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (!reduce) v.play().catch(() => {});
        } else {
          v.pause();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [reduce]);

  // Ton-Zustand kommt vom Elternteil (nur ein Video mit Ton gleichzeitig).
  useEffect(() => {
    if (ref.current) ref.current.muted = !hasSound;
  }, [hasSound]);

  const handleClick = () => {
    const v = ref.current;
    if (!v || hasError) return;
    if (!clip.hasAudio) {
      // Video ohne Ton: Klick = Abspielen/Pause
      if (v.paused) v.play().catch(() => {});
      else v.pause();
      return;
    }
    if (hasSound) {
      onSoundChange(index, false);
    } else {
      v.muted = false; // synchron im Klick, damit Browser den Ton freigeben
      v.currentTime = 0;
      v.play().catch(() => {});
      onSoundChange(index, true);
    }
  };

  const label = clip.hasAudio
    ? hasSound ? `${clip.title}: Ton aus` : `${clip.title}: Ton an`
    : isPlaying ? `${clip.title}: Pause` : `${clip.title}: Abspielen`;

  return (
    <motion.figure
      variants={variants}
      className="m-0 flex flex-col rounded-2xl p-3 bg-white border border-[#E3EBF5] hover:shadow-lg transition-shadow snap-start shrink-0 w-[78%] sm:w-[46%] md:w-auto"
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        className="group relative block w-full aspect-[4/5] rounded-xl overflow-hidden bg-[#0A192F] b2b-focus-ring"
      >
        {!hasError ? (
          <video
            ref={ref}
            src={`${VIDEO_BASE}${encodeURIComponent(clip.file)}#t=0.1`}
            muted
            loop
            playsInline
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => setHasError(true)}
            className="absolute inset-0 w-full h-full object-cover"
            aria-hidden="true"
          />
        ) : (
          <span className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ background: 'linear-gradient(150deg, #0A192F, #123059)' }}>
            <AlertCircle className="w-9 h-9 text-[#38BDF8]" aria-hidden="true" />
            <span className="font-arimo text-sm text-white/70">Das Video konnte leider nicht geladen werden.</span>
          </span>
        )}

        {/* Play-Overlay, wenn (noch) nicht läuft – z. B. bei "Bewegung reduzieren" */}
        {!isPlaying && !hasError && (
          <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/10" aria-hidden="true">
            <span className="w-14 h-14 rounded-full flex items-center justify-center shadow-2xl" style={{ background: LIME_SKY }}>
              <Play className="w-6 h-6 text-[#0A192F] ml-0.5" fill="currentColor" />
            </span>
          </span>
        )}

        {!hasError && (
          <span
            className="absolute right-2.5 bottom-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-arimo text-xs font-bold text-white backdrop-blur"
            style={{ background: 'rgba(10,25,47,0.75)' }}
            aria-hidden="true"
          >
            {clip.hasAudio ? (
              hasSound ? (<><Volume2 className="w-3.5 h-3.5 text-[#DEFF9A]" /> Ton aus</>) : (<><VolumeX className="w-3.5 h-3.5" /> Ton an</>)
            ) : (
              <>Ohne Ton</>
            )}
          </span>
        )}
      </button>

      <figcaption className="px-2 pt-4 pb-2">
        <div className="flex items-center gap-2 mb-2">
          <span className="font-poppins font-black text-xs w-7 h-7 flex items-center justify-center rounded-lg text-[#0A192F]" style={{ background: SKY_LIME }}>
            {String(index + 1).padStart(2, '0')}
          </span>
          <span className="font-arimo text-[11px] font-bold text-[#38BDF8] uppercase tracking-wide">{clip.tag}</span>
        </div>
        <h4 className="font-poppins font-bold text-base text-[#0F1E34] mb-1.5 leading-snug">{clip.title}</h4>
        <p className="font-arimo text-sm text-[#55637A] leading-relaxed">{clip.text}</p>
      </figcaption>
    </motion.figure>
  );
}

export default function OrbitVideoShowcase() {
  const reduce = useReducedMotion() ?? false;
  const [soundIndex, setSoundIndex] = useState<number | null>(null);

  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } };
  const fadeUp: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 20 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } } };

  const handleSoundChange = useCallback((index: number, on: boolean) => {
    setSoundIndex(on ? index : null);
  }, []);

  const scrollToPricing = () => {
    document.getElementById('orbit-pricing')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  return (
    <section id="orbit-videos" aria-labelledby="orbit-videos-title" className="scroll-mt-20 lg:scroll-mt-24">
      <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center mb-8">
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-[#38BDF8]/30 bg-[#38BDF8]/5">
          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
          <span className="font-arimo text-xs font-bold text-[#38BDF8] uppercase tracking-wide">ORBIT in 4 Kurzvideos</span>
        </motion.div>
        <motion.h3
          id="orbit-videos-title"
          variants={fadeUp}
          className="font-poppins font-black text-[#0F1E34] text-2xl sm:text-3xl leading-tight max-w-2xl mx-auto mb-3"
          style={{ letterSpacing: '-0.02em' }}
        >
          So wird Ihr Kurskatalog zur Beratung.
        </motion.h3>
        <motion.p variants={fadeUp} className="font-arimo text-[#55637A] text-base max-w-xl mx-auto leading-relaxed">
          Jeweils unter 30 Sekunden: was ORBIT tut, wie es berät und was Sie am Ende in der Hand haben.
        </motion.p>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-px-4 sm:scroll-px-6 scrollbar-hide -mx-4 px-4 sm:-mx-6 sm:px-6 pb-2 md:mx-0 md:px-0 md:pb-0 md:grid md:grid-cols-2 md:gap-6 md:overflow-visible lg:grid-cols-4"
      >
        {CLIPS.map((clip, i) => (
          <VideoCard
            key={clip.file}
            clip={clip}
            index={i}
            hasSound={soundIndex === i}
            onSoundChange={handleSoundChange}
            reduce={reduce}
            variants={fadeUp}
          />
        ))}
      </motion.div>

      <p className="md:hidden text-center font-arimo text-xs text-[#94a3b8] mt-3">Wischen für mehr →</p>

      <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="flex justify-center mt-8">
        <button
          type="button"
          onClick={scrollToPricing}
          className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:shadow-xl hover:shadow-[#DEFF9A]/25 hover:-translate-y-0.5"
          style={{ background: LIME_SKY }}
        >
          Kostenlos testen
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
        </button>
      </motion.div>
    </section>
  );
}