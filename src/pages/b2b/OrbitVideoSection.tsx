import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react';
import { motion, useReducedMotion, type Variants } from 'framer-motion';
import { Play, Pause, Maximize2, RotateCcw, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';
import { b2bContent } from './content';

const NAVY_SKY = 'linear-gradient(135deg, #0A192F, #38BDF8)';
const VIEWPORT = { once: true, margin: '-60px' } as const;

type TabId = 'unternehmen' | 'bildungstraeger';

export default function OrbitVideoSection({ onDemo }: { onDemo: (segment: TabId, institution?: string) => void }) {
  const { orbitVideo } = b2bContent;
  const reduce = useReducedMotion() ?? false;

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.1, delayChildren: reduce ? 0 : 0.05 } },
  };
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: reduce ? 0 : 20 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.6 } },
  };
  const fadeRight: Variants = {
    hidden: { opacity: 0, x: reduce ? 0 : 24 },
    show: { opacity: 1, x: 0, transition: { duration: reduce ? 0 : 0.6 } },
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState('0:00');
  const [duration, setDuration] = useState('0:24');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showReplay, setShowReplay] = useState(false);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(fmt(videoRef.current.duration));
      setIsLoading(false);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(isFinite(pct) ? pct : 0);
    setCurrentTime(fmt(videoRef.current.currentTime));
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setShowReplay(true);
  };

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const togglePlay = useCallback(() => {
    if (!videoRef.current || hasError) return;
    if (videoRef.current.paused) {
      void videoRef.current.play();
      setShowReplay(false);
    } else {
      videoRef.current.pause();
    }
  }, [hasError]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setShowReplay(false);
    if (videoRef.current) {
      videoRef.current.load();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = pct * videoRef.current.duration;
  };

  const handleReplay = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    void videoRef.current.play();
    setShowReplay(false);
    setIsPlaying(true);
  };

  // Sync isPlaying state with actual video events
  const onPlayEvent = () => setIsPlaying(true);
  const onPauseEvent = () => setIsPlaying(false);

  // Fullscreen dialog: focus trap + Escape to close
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const fullscreenVideoRef = useRef<HTMLVideoElement>(null);
  const [fsPlaying, setFsPlaying] = useState(false);
  const [fsProgress, setFsProgress] = useState(0);
  const [fsCurrent, setFsCurrent] = useState('0:00');
  const [fsDuration, setFsDuration] = useState('0:24');

  const openFullscreen = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
    setIsFullscreenOpen(true);
  };

  const closeFullscreen = useCallback(() => {
    setIsFullscreenOpen(false);
    if (fullscreenVideoRef.current) {
      fullscreenVideoRef.current.pause();
    }
  }, []);

  useEffect(() => {
    if (!isFullscreenOpen) return;
    const el = fullscreenRef.current;
    if (!el) return;
    const focusable = el.querySelectorAll<HTMLElement>('button, [tabindex="0"]');
    const first = focusable[0];
    first?.focus();

    const trap = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeFullscreen();
        return;
      }
      if (e.key !== 'Tab' || focusable.length === 0) return;
      const firstEl = focusable[0];
      const lastEl = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };
    document.addEventListener('keydown', trap);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', trap);
      document.body.style.overflow = '';
    };
  }, [isFullscreenOpen, closeFullscreen]);

  const toggleFsPlay = () => {
    if (!fullscreenVideoRef.current) return;
    if (fullscreenVideoRef.current.paused) void fullscreenVideoRef.current.play();
    else fullscreenVideoRef.current.pause();
  };

  const handleFsTimeUpdate = () => {
    if (!fullscreenVideoRef.current) return;
    const pct = (fullscreenVideoRef.current.currentTime / fullscreenVideoRef.current.duration) * 100;
    setFsProgress(isFinite(pct) ? pct : 0);
    setFsCurrent(fmt(fullscreenVideoRef.current.currentTime));
  };

  const handleFsSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!fullscreenVideoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    fullscreenVideoRef.current.currentTime = pct * fullscreenVideoRef.current.duration;
  };

  const handleFsKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      toggleFsPlay();
    }
  };

  return (
    <section id="orbit-erleben" className="relative bg-[#0A192F] py-20 px-4 sm:px-6 lg:px-8 scroll-mt-20 lg:scroll-mt-24 overflow-hidden">
      {/* Glow accents */}
      <div
        className="absolute top-[10%] right-[5%] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(56,189,248,0.15), transparent 70%)', filter: 'blur(60px)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-[5%] left-[10%] w-[320px] h-[320px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(222,255,154,0.10), transparent 70%)', filter: 'blur(70px)' }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text column */}
          <motion.div variants={container} initial="hidden" whileInView="show" viewport={VIEWPORT} className="order-2 lg:order-1">
            <motion.div
              variants={fadeUp}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6"
              style={{ background: 'rgba(56,189,248,0.10)', border: '1px solid rgba(56,189,248,0.25)' }}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" aria-hidden="true" />
              <span className="text-xs font-arimo font-bold uppercase text-[#38BDF8]" style={{ letterSpacing: '0.12em' }}>
                {orbitVideo.eyebrow}
              </span>
            </motion.div>

            <motion.h2
              variants={fadeUp}
              className="font-poppins font-black text-white leading-[1.1] mb-5"
              style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.03em' }}
            >
              {orbitVideo.heading}
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="font-arimo text-white/65 leading-relaxed mb-8 max-w-lg"
              style={{ fontSize: 'clamp(0.95rem, 1.5vw, 1.1rem)' }}
            >
              {orbitVideo.description}
            </motion.p>

            <motion.div variants={container} className="space-y-4 mb-8">
              {orbitVideo.steps.map((step) => (
                <motion.div key={step.num} variants={fadeUp} className="flex items-start gap-4">
                  <span
                    className="font-poppins font-black text-lg flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-xl"
                    style={{ background: 'linear-gradient(135deg, rgba(56,189,248,0.15), rgba(222,255,154,0.15))', color: '#DEFF9A', border: '1px solid rgba(222,255,154,0.20)' }}
                  >
                    {step.num}
                  </span>
                  <div>
                    <h3 className="font-poppins font-bold text-white text-sm sm:text-base mb-0.5">{step.title}</h3>
                    <p className="font-arimo text-white/55 text-sm leading-relaxed">{step.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.button
              variants={fadeUp}
              type="button"
              onClick={() => onDemo('bildungstraeger', 'Erklärvideo')}
              className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl font-arimo font-bold text-[#0A192F] b2b-focus-ring transition hover:shadow-xl hover:shadow-[#DEFF9A]/25 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}
            >
              {orbitVideo.cta}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
            </motion.button>
          </motion.div>

          {/* Video column */}
          <motion.div
            variants={fadeRight}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            className="order-1 lg:order-2"
          >
            <div
              className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl"
              style={{ background: '#000' }}
            >
              {/* Video element */}
              {!hasError && (
                <video
                  ref={videoRef}
                  src={orbitVideo.videoSrc}
                  poster={orbitVideo.posterSrc || undefined}
                  preload="metadata"
                  playsInline
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  onEnded={handleEnded}
                  onError={handleError}
                  onPlay={onPlayEvent}
                  onPause={onPauseEvent}
                  onWaiting={() => setIsLoading(true)}
                  onCanPlay={() => setIsLoading(false)}
                  onClick={togglePlay}
                  className="block w-full"
                  style={{ aspectRatio: '4 / 5', maxHeight: '70vh', objectFit: 'cover', cursor: 'pointer' }}
                  aria-label="ORBIT Erklärvideo"
                />
              )}

              {/* Loading state */}
              {isLoading && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#0A192F] pointer-events-none">
                  <div className="w-12 h-12 rounded-full border-2 border-[#38BDF8]/30 border-t-[#38BDF8] animate-spin" aria-hidden="true" />
                </div>
              )}

              {/* Error state */}
              {hasError && (
                <div
                  className="flex flex-col items-center justify-center gap-4 p-8 text-center"
                  style={{ aspectRatio: '4 / 5', maxHeight: '70vh', background: 'linear-gradient(150deg, #0A192F, #123059)' }}
                >
                  <AlertCircle className="w-12 h-12 text-[#38BDF8]" aria-hidden="true" />
                  <p className="font-arimo text-white/70 text-sm max-w-xs">
                    Das Video konnte leider nicht geladen werden.
                  </p>
                  <button
                    type="button"
                    onClick={handleRetry}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-arimo font-bold text-sm text-[#0A192F] b2b-focus-ring transition hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}
                  >
                    <RotateCcw className="w-4 h-4" aria-hidden="true" />
                    Erneut versuchen
                  </button>
                </div>
              )}

              {/* Replay overlay */}
              {showReplay && !hasError && (
                <button
                  type="button"
                  onClick={handleReplay}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50 transition hover:bg-black/40 b2b-focus-ring"
                  aria-label="Video erneut abspielen"
                >
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}>
                    <RotateCcw className="w-7 h-7 text-[#0A192F]" aria-hidden="true" />
                  </div>
                  <span className="font-arimo font-bold text-white text-sm">Erneut ansehen</span>
                </button>
              )}

              {/* Big play button when paused and not replaying */}
              {!isPlaying && !hasError && !showReplay && !isLoading && (
                <button
                  type="button"
                  onClick={togglePlay}
                  className="absolute inset-0 flex items-center justify-center bg-black/20 transition hover:bg-black/10 b2b-focus-ring"
                  aria-label="Video abspielen"
                >
                  <div className="w-20 h-20 rounded-full flex items-center justify-center shadow-2xl" style={{ background: 'linear-gradient(135deg, #DEFF9A, #38BDF8)' }}>
                    <Play className="w-9 h-9 text-[#0A192F] ml-1" fill="currentColor" aria-hidden="true" />
                  </div>
                </button>
              )}

              {/* Custom controls bar */}
              {!hasError && (
                <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center b2b-focus-ring transition hover:bg-white/10"
                      aria-label={isPlaying ? 'Pause' : 'Abspielen'}
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white" fill="currentColor" aria-hidden="true" />
                      ) : (
                        <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" aria-hidden="true" />
                      )}
                    </button>

                    {/* Progress bar */}
                    <div className="flex-1 flex items-center gap-2">
                      <span className="font-arimo text-xs text-white/70 tabular-nums w-10 text-right">{currentTime}</span>
                      <div
                        className="relative flex-1 h-1.5 rounded-full bg-white/20 cursor-pointer group"
                        onClick={handleSeek}
                        role="slider"
                        aria-label="Video-Fortschritt"
                        aria-valuenow={Math.round(progress)}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        tabIndex={0}
                      >
                        <div
                          className="absolute left-0 top-0 h-full rounded-full"
                          style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #DEFF9A, #38BDF8)' }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ left: `calc(${progress}% - 6px)` }}
                        />
                      </div>
                      <span className="font-arimo text-xs text-white/50 tabular-nums w-10">{duration}</span>
                    </div>

                    {/* Enlarge button */}
                    <button
                      type="button"
                      onClick={openFullscreen}
                      className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center b2b-focus-ring transition hover:bg-white/10"
                      aria-label="Video vergrößern"
                    >
                      <Maximize2 className="w-4 h-4 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Fullscreen dialog */}
      {isFullscreenOpen && (
        <div
          ref={fullscreenRef}
          role="dialog"
          aria-modal="true"
          aria-label="ORBIT Erklärvideo – Vollbild"
          className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 sm:p-8"
          onKeyDown={handleFsKeyDown}
        >
          <button
            type="button"
            onClick={closeFullscreen}
            className="absolute top-4 right-4 px-4 py-2 rounded-xl font-arimo font-bold text-sm text-white b2b-focus-ring transition hover:bg-white/10"
            aria-label="Vollbild schließen (Esc)"
          >
            Schließen ✕
          </button>

          <div className="relative max-w-full max-h-full" style={{ aspectRatio: '4 / 5', height: 'min(85vh, 100%)' }}>
            <video
              ref={fullscreenVideoRef}
              src={orbitVideo.videoSrc}
              preload="metadata"
              playsInline
              autoPlay
              controls={false}
              onLoadedMetadata={(e) => setFsDuration(fmt(e.currentTarget.duration))}
              onTimeUpdate={handleFsTimeUpdate}
              onPlay={() => setFsPlaying(true)}
              onPause={() => setFsPlaying(false)}
              onClick={toggleFsPlay}
              className="block w-full h-full object-contain rounded-2xl"
              aria-label="ORBIT Erklärvideo – Vollbild"
            />

            {/* Fullscreen controls */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-12 bg-gradient-to-t from-black/80 to-transparent rounded-b-2xl">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={toggleFsPlay}
                  className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center b2b-focus-ring transition hover:bg-white/10"
                  aria-label={fsPlaying ? 'Pause' : 'Abspielen'}
                >
                  {fsPlaying ? (
                    <Pause className="w-5 h-5 text-white" fill="currentColor" aria-hidden="true" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" fill="currentColor" aria-hidden="true" />
                  )}
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <span className="font-arimo text-xs text-white/70 tabular-nums w-10 text-right">{fsCurrent}</span>
                  <div
                    className="relative flex-1 h-1.5 rounded-full bg-white/20 cursor-pointer group"
                    onClick={handleFsSeek}
                    role="slider"
                    aria-label="Video-Fortschritt"
                    aria-valuenow={Math.round(fsProgress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    tabIndex={0}
                  >
                    <div
                      className="absolute left-0 top-0 h-full rounded-full"
                      style={{ width: `${fsProgress}%`, background: 'linear-gradient(90deg, #DEFF9A, #38BDF8)' }}
                    />
                  </div>
                  <span className="font-arimo text-xs text-white/50 tabular-nums w-10">{fsDuration}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
