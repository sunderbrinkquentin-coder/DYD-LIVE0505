import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import { motion, AnimatePresence, useReducedMotion, type Variants } from 'framer-motion';
import { Sparkles, Volume2, VolumeX, Play, RotateCcw, ArrowRight, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

/* ─── DYD ORBIT – Video-Story (4 Hochkant-Videos, 1080×1350 / 4:5) ───
   Eingebunden in B2BTabs.tsx → TabBContent (Bildungsträger), nach dem
   ORBIT-Einstieg und vor Skill-Gap-Widget / Preisen.

   Konzept: EINE Bühne statt vier paralleler Videos. Die Clips laufen als
   Kapitel nacheinander (wie eine Story): Fortschrittsbalken oben, Kapitel-
   liste daneben, automatisches Weiterschalten, am Ende ein Abschluss mit
   "Kostenlos testen".
   - Startet stumm, sobald die Bühne sichtbar ist; pausiert beim Wegscrollen.
   - "Ton an" gilt für alle folgenden Kapitel und startet das aktuelle neu.
   - Mobil: Tippen links/rechts bzw. Wischen = Kapitel zurück/vor, Mitte = Pause.
   - Tastatur (Bühne fokussiert): ← / → Kapitel, Leertaste Pause.
   - "Bewegung reduzieren" (OS): kein Autoplay, Start per Klick. */

// Public-URL des Supabase-Storage-Buckets (mit / am Ende).
const VIDEO_BASE = 'https://vuumqarzylewhzvtbtcl.supabase.co/storage/v1/object/public/marketing/';

const VIEWPORT = { once: true, margin: '-60px' } as const;
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

const LAST = CLIPS.length - 1;
const num = (i: number) => String(i + 1).padStart(2, '0');
const fmt = (s: number) => {
  const r = Math.round(s);
  return `${Math.floor(r / 60)}:${String(r % 60).padStart(2, '0')}`;
};

export default function OrbitVideoShowcase() {
  const reduce = useReducedMotion() ?? false;

  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [finished, setFinished] = useState(false);
  const [inView, setInView] = useState(false);
  const [durations, setDurations] = useState<(number | null)[]>(() => CLIPS.map(() => null));
  const [failed, setFailed] = useState<boolean[]>(() => CLIPS.map(() => false));

  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const userPausedRef = useRef(false);
  const interactedRef = useRef(false);
  const touchXRef = useRef<number | null>(null);

  const container: Variants = { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.1 } } };
  const fadeUp: Variants = { hidden: { opacity: 0, y: reduce ? 0 : 20 }, show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.5 } } };

  /* Abspielen mit Fallback: blockiert der Browser Ton-Autoplay (v. a. iOS),
     läuft das Video stumm weiter statt stehen zu bleiben. */
  const safePlay = useCallback((v: HTMLVideoElement) => {
    v.play().catch(() => {
      if (!v.muted) {
        v.muted = true;
        setSoundOn(false);
        v.play().catch(() => {});
      }
    });
  }, []);

  // Sichtbarkeit der Bühne beobachten
  useEffect(() => {
    const el = stageRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.45 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Nur das aktive Kapitel läuft – alle anderen pausiert und zurückgespult
  useEffect(() => {
    videoRefs.current.forEach((v, i) => {
      if (!v || i === active) return;
      v.pause();
      if (v.currentTime > 0) v.currentTime = 0;
    });
    const v = videoRefs.current[active];
    if (!v) return;
    const shouldPlay = inView && !finished && !userPausedRef.current && (!reduce || interactedRef.current);
    if (shouldPlay) safePlay(v);
    else v.pause();
  }, [active, inView, finished, reduce, safePlay]);

  // Ton-Einstellung auf das aktive Kapitel übertragen
  useEffect(() => {
    const v = videoRefs.current[active];
    if (v) v.muted = !soundOn;
  }, [active, soundOn]);

  const goTo = (i: number) => {
    interactedRef.current = true;
    userPausedRef.current = false;
    setFinished(false);
    setProgress(0);
    if (i === active) {
      const v = videoRefs.current[i];
      if (v) {
        v.currentTime = 0;
        safePlay(v);
      }
    } else {
      setActive(i);
    }
  };

  const next = () => {
    if (active < LAST) goTo(active + 1);
    else {
      videoRefs.current[active]?.pause();
      setProgress(1);
      setFinished(true);
    }
  };
  const prev = () => goTo(Math.max(0, active - 1));

  const togglePlay = () => {
    interactedRef.current = true;
    const v = videoRefs.current[active];
    if (!v) return;
    if (finished) return goTo(0);
    if (v.paused) {
      userPausedRef.current = false;
      safePlay(v);
    } else {
      userPausedRef.current = true;
      v.pause();
    }
  };

  const toggleSound = () => {
    interactedRef.current = true;
    userPausedRef.current = false;
    const on = !soundOn;
    const v = videoRefs.current[active];
    if (v) {
      v.muted = !on; // synchron im Klick, damit der Browser den Ton freigibt
      if (on && CLIPS[active].hasAudio) v.currentTime = 0;
      if (!finished) safePlay(v);
    }
    setSoundOn(on);
  };

  const handleEnded = (i: number) => {
    if (i !== active) return;
    if (active < LAST) {
      setProgress(0);
      setActive(active + 1);
    } else {
      setProgress(1);
      setFinished(true);
    }
  };

  const onStageKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
  };

  const onTouchStart = (e: TouchEvent<HTMLDivElement>) => { touchXRef.current = e.touches[0].clientX; };
  const onTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchXRef.current === null) return;
    const dx = e.changedTouches[0].clientX - touchXRef.current;
    touchXRef.current = null;
    if (Math.abs(dx) > 45) (dx < 0 ? next : prev)();
  };

  const scrollToPricing = () => {
    document.getElementById('orbit-pricing')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  const fill = (i: number) => (finished || i < active ? 1 : i > active ? 0 : progress);
  const total = durations.every((d) => d) ? durations.reduce<number>((s, d) => s + (d ?? 0), 0) : null;
  const clip = CLIPS[active];

  return (
    <section
      id="orbit-videos"
      aria-labelledby="orbit-videos-title"
      className="relative overflow-hidden rounded-3xl px-5 py-12 sm:px-10 sm:py-14 lg:px-14 lg:py-16 scroll-mt-20 lg:scroll-mt-24"
      style={{ background: 'radial-gradient(700px 320px at 15% 0%, rgba(56,189,248,0.20), transparent 70%), radial-gradient(520px 300px at 100% 100%, rgba(222,255,154,0.10), transparent 70%), linear-gradient(150deg, #0A192F, #123059)' }}
    >
      <div className="grid gap-8 lg:gap-x-14 lg:gap-y-6 lg:grid-cols-[minmax(0,400px)_1fr] lg:grid-rows-[1fr_auto_auto_auto_1fr]">
        {/* ── Kopf ── */}
        <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="text-center lg:text-left lg:col-start-2 lg:row-start-2">
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-5 border border-[#DEFF9A]/40 bg-[#DEFF9A]/10">
            <Sparkles className="w-3.5 h-3.5 text-[#DEFF9A]" aria-hidden="true" />
            <span className="font-arimo text-xs font-bold text-[#DEFF9A] uppercase tracking-wide">
              ORBIT in {CLIPS.length} Kapiteln{total ? ` · ${fmt(total)} Min.` : ''}
            </span>
          </motion.div>
          <motion.h3
            id="orbit-videos-title"
            variants={fadeUp}
            className="font-poppins font-black text-white text-2xl sm:text-3xl leading-tight mb-3"
            style={{ letterSpacing: '-0.02em' }}
          >
            So wird Ihr Kurskatalog zur Beratung.
          </motion.h3>
          <motion.p variants={fadeUp} className="font-arimo text-white/70 text-base leading-relaxed max-w-xl mx-auto lg:mx-0">
            Eine kurze Story in vier Kapiteln: was ORBIT tut, wie es berät und was Sie am Ende in der Hand haben.
          </motion.p>
        </motion.div>

        {/* ── Bühne ── */}
        <motion.div
          initial={{ opacity: 0, y: reduce ? 0 : 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={VIEWPORT}
          transition={{ duration: reduce ? 0 : 0.6 }}
          className="lg:col-start-1 lg:row-start-1 lg:row-span-5 self-center"
        >
          <div
            ref={stageRef}
            tabIndex={0}
            role="region"
            aria-roledescription="Video-Story"
            aria-label={`Kapitel ${active + 1} von ${CLIPS.length}: ${clip.title}`}
            onKeyDown={onStageKey}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="group relative w-full max-w-[400px] mx-auto aspect-[4/5] rounded-[22px] overflow-hidden bg-black shadow-2xl ring-1 ring-white/10 b2b-focus-ring select-none"
          >
            {CLIPS.map((c, i) => (
              <video
                key={c.file}
                ref={(el) => { videoRefs.current[i] = el; }}
                src={`${VIDEO_BASE}${encodeURIComponent(c.file)}#t=0.1`}
                muted
                playsInline
                preload={i === active || i === active + 1 ? 'auto' : 'metadata'}
                onPlay={() => i === active && setIsPlaying(true)}
                onPause={() => i === active && setIsPlaying(false)}
                onTimeUpdate={(e) => {
                  if (i !== active) return;
                  const v = e.currentTarget;
                  if (v.duration) setProgress(v.currentTime / v.duration);
                }}
                onEnded={() => handleEnded(i)}
                onLoadedMetadata={(e) => {
                  const d = e.currentTarget.duration;
                  setDurations((prevD) => prevD.map((x, j) => (j === i ? d : x)));
                }}
                onError={() => setFailed((prevF) => prevF.map((x, j) => (j === i ? true : x)))}
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${i === active ? 'opacity-100' : 'opacity-0'}`}
                aria-hidden="true"
              />
            ))}

            {/* Story-Fortschritt + Kapitel-Label + Ton */}
            <div className="absolute inset-x-0 top-0 z-20 px-3 pt-3 pb-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
              <div className="flex gap-1.5">
                {CLIPS.map((c, i) => (
                  <span key={c.file} className="relative flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden">
                    <span
                      className="absolute inset-0 rounded-full origin-left"
                      style={{
                        background: LIME_SKY,
                        transform: `scaleX(${fill(i)})`,
                        transition: i === active && !reduce ? 'transform 260ms linear' : 'none',
                      }}
                    />
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="font-arimo text-xs font-bold text-white/90">
                  <span className="text-[#DEFF9A]">{num(active)}</span> · {clip.tag}
                </span>
                <button
                  type="button"
                  onClick={toggleSound}
                  className="pointer-events-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full font-arimo text-xs font-bold text-white backdrop-blur b2b-focus-ring transition hover:bg-white/20"
                  style={{ background: 'rgba(10,25,47,0.6)' }}
                  aria-pressed={soundOn}
                >
                  {soundOn ? <Volume2 className="w-3.5 h-3.5 text-[#DEFF9A]" aria-hidden="true" /> : <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />}
                  {soundOn ? (clip.hasAudio ? 'Ton aus' : 'Clip ohne Ton') : 'Ton an'}
                </button>
              </div>
            </div>

            {/* Tipp-Zonen: links zurück, Mitte Pause, rechts weiter */}
            {!finished && (
              <div className="absolute inset-0 z-10 flex">
                <button type="button" onClick={prev} className="w-[30%] h-full flex items-center cursor-w-resize focus:outline-none" aria-label="Vorheriges Kapitel" tabIndex={-1}>
                  <ChevronLeft className="hidden sm:block ml-2 w-8 h-8 text-white/0 group-hover:text-white/70 transition" aria-hidden="true" />
                </button>
                <button type="button" onClick={togglePlay} className="flex-1 h-full focus:outline-none" aria-label={isPlaying ? 'Pause' : 'Abspielen'} tabIndex={-1} />
                <button type="button" onClick={next} className="w-[30%] h-full flex items-center justify-end cursor-e-resize focus:outline-none" aria-label="Nächstes Kapitel" tabIndex={-1}>
                  <ChevronRight className="hidden sm:block mr-2 w-8 h-8 text-white/0 group-hover:text-white/70 transition" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Pause-Anzeige */}
            <AnimatePresence>
              {!isPlaying && !finished && !failed[active] && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none"
                >
                  <span className="w-16 h-16 rounded-full flex items-center justify-center shadow-2xl" style={{ background: LIME_SKY }}>
                    <Play className="w-7 h-7 text-[#0A192F] ml-1" fill="currentColor" aria-hidden="true" />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Fehler */}
            {failed[active] && (
              <div className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-3 p-6 text-center" style={{ background: 'linear-gradient(150deg, #0A192F, #123059)' }}>
                <AlertCircle className="w-9 h-9 text-[#38BDF8]" aria-hidden="true" />
                <span className="font-arimo text-sm text-white/70">Dieses Video konnte leider nicht geladen werden.</span>
              </div>
            )}

            {/* Abschluss nach dem letzten Kapitel */}
            <AnimatePresence>
              {finished && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? 0 : 0.4 }}
                  className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 p-8 text-center backdrop-blur-md"
                  style={{ background: 'rgba(10,25,47,0.82)' }}
                >
                  <span className="font-arimo text-xs font-bold text-[#DEFF9A] uppercase tracking-wide">Alle {CLIPS.length} Kapitel gesehen</span>
                  <p className="font-poppins font-black text-white text-2xl leading-tight" style={{ letterSpacing: '-0.02em' }}>
                    Jetzt mit Ihren eigenen Kursen ausprobieren.
                  </p>
                  <button
                    type="button"
                    onClick={scrollToPricing}
                    className="group/cta inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:shadow-xl hover:shadow-[#DEFF9A]/25 hover:-translate-y-0.5"
                    style={{ background: LIME_SKY }}
                  >
                    Kostenlos testen
                    <ArrowRight className="w-4 h-4 group-hover/cta:translate-x-1 transition-transform" aria-hidden="true" />
                  </button>
                  <button type="button" onClick={() => goTo(0)} className="inline-flex items-center gap-1.5 font-arimo text-sm font-bold text-white/70 hover:text-white b2b-focus-ring transition">
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    Nochmal ansehen
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* ── Kapitel ── */}
        <div className="lg:col-start-2 lg:row-start-3">
          {/* Desktop: Kapitelliste */}
          <ol className="hidden lg:flex flex-col gap-1.5" aria-label="Kapitel">
            {CLIPS.map((c, i) => {
              const isActive = i === active && !finished;
              const done = finished || i < active;
              return (
                <li key={c.file}>
                  <button
                    type="button"
                    onClick={() => goTo(i)}
                    aria-current={isActive ? 'step' : undefined}
                    className={`w-full text-left rounded-2xl px-4 py-3.5 border transition b2b-focus-ring ${
                      isActive ? 'bg-white/[0.07] border-white/15' : 'border-transparent hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <span
                        className={`font-poppins font-black text-sm w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-xl transition ${
                          isActive ? 'text-[#0A192F]' : done ? 'text-[#DEFF9A] border border-[#DEFF9A]/30' : 'text-white/45 border border-white/15'
                        }`}
                        style={isActive ? { background: LIME_SKY } : undefined}
                      >
                        {num(i)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-arimo text-[11px] font-bold uppercase tracking-wide text-[#38BDF8]">{c.tag}</span>
                          {durations[i] ? <span className="font-arimo text-xs text-white/40 tabular-nums">{fmt(durations[i] as number)}</span> : null}
                        </div>
                        <h4 className={`font-poppins font-bold text-base leading-snug transition-colors ${isActive ? 'text-white' : 'text-white/60'}`}>{c.title}</h4>
                        <AnimatePresence initial={false}>
                          {isActive && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: reduce ? 0 : 0.3 }}
                              className="overflow-hidden"
                            >
                              <p className="font-arimo text-sm text-white/65 leading-relaxed pt-1.5">{c.text}</p>
                              <span className="mt-3 block h-[2px] rounded-full bg-white/10 overflow-hidden">
                                <span
                                  className="block h-full origin-left"
                                  style={{ background: LIME_SKY, transform: `scaleX(${progress})`, transition: reduce ? 'none' : 'transform 260ms linear' }}
                                />
                              </span>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ol>

          {/* Mobil: aktives Kapitel + Sprungmarken */}
          <div className="lg:hidden text-center">
            <div className="flex justify-center gap-2 mb-4" role="group" aria-label="Kapitel wählen">
              {CLIPS.map((c, i) => (
                <button
                  key={c.file}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Kapitel ${i + 1}: ${c.title}`}
                  aria-current={i === active && !finished ? 'step' : undefined}
                  className={`font-poppins font-black text-xs w-10 h-10 rounded-xl transition b2b-focus-ring ${
                    i === active && !finished ? 'text-[#0A192F]' : 'text-white/55 border border-white/15'
                  }`}
                  style={i === active && !finished ? { background: LIME_SKY } : undefined}
                >
                  {num(i)}
                </button>
              ))}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active}
                initial={{ opacity: 0, y: reduce ? 0 : 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -8 }}
                transition={{ duration: reduce ? 0 : 0.25 }}
                className="min-h-[96px]"
                aria-live="polite"
              >
                <span className="font-arimo text-[11px] font-bold uppercase tracking-wide text-[#38BDF8]">{clip.tag}</span>
                <h4 className="font-poppins font-bold text-lg text-white leading-snug mt-1">{clip.title}</h4>
                <p className="font-arimo text-sm text-white/65 leading-relaxed mt-1.5 max-w-sm mx-auto">{clip.text}</p>
              </motion.div>
            </AnimatePresence>
            <p className="font-arimo text-xs text-white/40 mt-2">Tippen oder wischen für das nächste Kapitel</p>
          </div>
        </div>

        {/* ── CTA ── */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="show" viewport={VIEWPORT} className="lg:col-start-2 lg:row-start-4 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 sm:gap-5">
          <button
            type="button"
            onClick={scrollToPricing}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:shadow-xl hover:shadow-[#DEFF9A]/25 hover:-translate-y-0.5"
            style={{ background: LIME_SKY }}
          >
            Kostenlos testen
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
          </button>
          <span className="font-arimo text-sm text-white/55">7 Tage unverbindlich – ohne Zahlungsdaten</span>
        </motion.div>
      </div>
    </section>
  );
}