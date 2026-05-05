import { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { X, Ticket, MapPin, Calendar, Music2, ChevronRight } from 'lucide-react';

const STORAGE_KEY = 'harmony_popup_seen';
const BANNER_KEY  = 'harmony_banner_dismissed';
const AUTO_CLOSE_MS = 12000;

const C = {
  teal:    '#66c0b6',
  tealBright: '#30E3CA',
  tealDim: '#4aa89e',
  white:   '#ffffff',
  dark:    '#0a0a0a',
  darker:  '#060606',
};

interface Particle {
  x: number; y: number; vx: number; vy: number;
  r: number; color: string; alpha: number; decay: number;
  type: 'dot' | 'star' | 'splat';
}

function SprayCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const colors = [C.teal, C.tealBright, C.tealDim, 'rgba(102,192,182,0.6)', 'rgba(48,227,202,0.5)'];

  const spawnBurst = useCallback((cx: number, cy: number) => {
    const count = 18 + Math.floor(Math.random() * 14);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 2.4;
      const types: Particle['type'][] = ['dot', 'dot', 'star', 'splat'];
      particlesRef.current.push({
        x: cx + (Math.random() - 0.5) * 36,
        y: cy + (Math.random() - 0.5) * 36,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - Math.random() * 1.2,
        r: 1 + Math.random() * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 0.35 + Math.random() * 0.45,
        decay: 0.012 + Math.random() * 0.014,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const resize = () => { canvas.width = canvas.offsetWidth; canvas.height = canvas.offsetHeight; };
    resize();
    window.addEventListener('resize', resize);
    const { width: w, height: h } = canvas;
    spawnBurst(w * 0.12, h * 0.2); spawnBurst(w * 0.88, h * 0.15);
    spawnBurst(w * 0.5,  h * 0.85); spawnBurst(w * 0.08, h * 0.7);
    spawnBurst(w * 0.92, h * 0.65);
    const interval = setInterval(() => spawnBurst(Math.random() * canvas.width, Math.random() * canvas.height), 1200);
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particlesRef.current = particlesRef.current.filter(p => p.alpha > 0.01);
      for (const p of particlesRef.current) {
        p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.vx *= 0.98; p.alpha -= p.decay;
        ctx.save(); ctx.globalAlpha = Math.max(0, p.alpha);
        if (p.type === 'star') {
          ctx.translate(p.x, p.y); ctx.fillStyle = p.color;
          for (let s = 0; s < 4; s++) { ctx.rotate(Math.PI / 4); ctx.fillRect(-p.r * 0.4, -p.r * 1.6, p.r * 0.8, p.r * 3.2); }
        } else if (p.type === 'splat') {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 1.5, 0, Math.PI * 2);
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 1.5);
          g.addColorStop(0, p.color); g.addColorStop(1, 'rgba(102,192,182,0)');
          ctx.fillStyle = g; ctx.fill();
        } else {
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color; ctx.shadowColor = C.teal; ctx.shadowBlur = 6; ctx.fill();
        }
        ctx.restore();
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    rafRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(rafRef.current); clearInterval(interval); window.removeEventListener('resize', resize); };
  }, [spawnBurst]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0, borderRadius: 'inherit' }} />;
}

export default function FestivalPopup() {
  const [phase, setPhase] = useState<'hidden' | 'popup' | 'banner'>('hidden');
  const [progress, setProgress] = useState(100);
  const [paused, setPaused] = useState(false);
  const navigate = useNavigate();
  const startRef    = useRef<number>(0);
  const rafRef      = useRef<number>(0);
  const pausedAtRef = useRef<number>(100);

  useEffect(() => {
    const seen   = sessionStorage.getItem(STORAGE_KEY);
    const banned = sessionStorage.getItem(BANNER_KEY);
    if (banned) return;
    if (!seen) {
      const t = setTimeout(() => { setPhase('popup'); startRef.current = performance.now(); }, 1500);
      return () => clearTimeout(t);
    } else {
      setPhase('banner');
    }
  }, []);

  useEffect(() => {
    if (phase !== 'popup' || paused) return;
    const tick = (now: number) => {
      const elapsed = now - startRef.current;
      const remaining = Math.max(0, 100 - (elapsed / AUTO_CLOSE_MS) * 100);
      setProgress(remaining);
      pausedAtRef.current = remaining;
      if (remaining > 0) { rafRef.current = requestAnimationFrame(tick); }
      else { collapseToBar(); }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [phase, paused]);

  const collapseToBar = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    setPhase('banner');
  };

  const dismissAll = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    sessionStorage.setItem(BANNER_KEY, '1');
    setPhase('hidden');
  };

  const goToFestival = () => {
    navigate('/festival#tickets');
  };

  return (
    <>
      <AnimatePresence>
        {phase === 'popup' && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center px-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(20px)' }}
            onClick={collapseToBar}
          >
            <motion.div
              key="popup-card"
              initial={{ scale: 0.88, opacity: 0, y: 32 }}
              animate={{ scale: 1,    opacity: 1, y: 0  }}
              exit={{   scale: 0.92, opacity: 0, y: 20  }}
              transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              onMouseEnter={() => { cancelAnimationFrame(rafRef.current); setPaused(true); }}
              onMouseLeave={() => { startRef.current = performance.now() - ((100 - pausedAtRef.current) / 100) * AUTO_CLOSE_MS; setPaused(false); }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(24px)',
                boxShadow: `0 0 0 1px rgba(102,192,182,0.08), 0 40px 120px rgba(0,0,0,0.8), 0 0 60px rgba(102,192,182,0.06)`,
              }}
            >
              <SprayCanvas />

              <div className="absolute inset-x-0 top-0 h-px"
                style={{ background: `linear-gradient(to right, transparent, ${C.teal}cc, ${C.tealBright}88, transparent)` }} />

              <div className="relative z-10 p-7 pb-5">
                <button
                  onClick={collapseToBar}
                  className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="flex flex-col items-center text-center">

                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                    className="mb-3 text-xs font-semibold tracking-[0.28em] uppercase"
                    style={{ color: `${C.teal}99` }}
                  >
                    ✦ Das DYD Festival ✦
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}
                    className="mb-1 font-bold"
                    style={{
                      fontSize: '58px',
                      lineHeight: 0.92,
                      letterSpacing: '0.04em',
                      background: `linear-gradient(135deg, ${C.white} 0%, ${C.teal} 50%, ${C.tealBright} 100%)`,
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                      textShadow: 'none',
                    }}
                  >
                    Harmony
                  </motion.h2>

                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.26 }}
                    className="mb-5 font-medium italic"
                    style={{ fontSize: '15px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.04em' }}
                  >
                    Andere Ansichten, gleicher Wunsch: Glücklich sein.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32 }}
                    className="flex gap-2 mb-6 flex-wrap justify-center"
                  >
                    {[
                      { icon: <Calendar className="w-3 h-3" style={{ color: C.teal }} />, text: '22.08.2026' },
                      { icon: <MapPin   className="w-3 h-3" style={{ color: C.tealBright }} />, text: 'Burgplatz Düsseldorf' },
                    ].map((b, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
                        style={{
                          background: 'rgba(102,192,182,0.08)',
                          border: '1px solid rgba(102,192,182,0.2)',
                          color: 'rgba(255,255,255,0.8)',
                        }}
                      >
                        {b.icon} {b.text}
                      </span>
                    ))}
                  </motion.div>

                  <motion.p
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.38 }}
                    className="mb-6 text-sm leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.45)', maxWidth: '300px' }}
                  >
                    Musik, Stand-Up, Bierpong & DJ Sets –<br />ein Abend für echte Gemeinschaft.
                  </motion.p>

                  <motion.div
                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.44 }}
                    className="flex gap-3 w-full"
                  >
                    <motion.button
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={goToFestival}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-black transition-all"
                      style={{
                        background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealBright} 100%)`,
                        fontSize: '16px',
                        boxShadow: `0 4px 20px rgba(102,192,182,0.3)`,
                      }}
                    >
                      <Ticket className="w-4 h-4" /> Tickets & Infos
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                      onClick={collapseToBar}
                      className="px-5 py-3 rounded-xl font-semibold transition-all"
                      style={{
                        fontSize: '16px',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: 'rgba(255,255,255,0.65)',
                      }}
                    >
                      Schliessen
                    </motion.button>
                  </motion.div>

                  <p className="mt-3 text-xs font-semibold tracking-widest uppercase" style={{ color: `${C.teal}55` }}>
                    Tickets ab 8,50 €
                  </p>
                </div>
              </div>

              <div className="relative z-10 h-1 w-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <div
                  className="h-full"
                  style={{
                    width: `${progress}%`,
                    background: `linear-gradient(to right, ${C.tealDim}, ${C.teal}, ${C.tealBright})`,
                    boxShadow: `0 0 8px ${C.teal}66`,
                    transition: paused ? 'none' : 'width 0.1s linear',
                  }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'banner' && (
          <motion.div
            key="sticky-banner"
            initial={{ y: -56, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -56, opacity: 0 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-[64px] left-0 right-0 z-[90]"
            style={{
              background: 'rgba(10,10,10,0.92)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              boxShadow: `0 1px 0 rgba(102,192,182,0.12), 0 4px 20px rgba(0,0,0,0.4)`,
            }}
          >
            <div className="max-w-5xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <Music2 className="w-4 h-4 flex-shrink-0" style={{ color: C.teal }} />
                <span className="text-sm font-bold tracking-wide text-white">
                  Harmony Festival
                </span>
                <span className="hidden sm:flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                  <Calendar className="w-3 h-3" style={{ color: C.teal }} />
                  22.08.2026 · Burgplatz Düsseldorf
                </span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={goToFestival}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-black font-semibold transition-all hover:opacity-90"
                  style={{
                    background: `linear-gradient(135deg, ${C.teal} 0%, ${C.tealBright} 100%)`,
                    fontSize: '13px',
                    boxShadow: `0 2px 12px rgba(102,192,182,0.25)`,
                  }}
                >
                  <Ticket className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Tickets kaufen</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={dismissAll}
                  className="w-7 h-7 flex items-center justify-center rounded-xl transition-all hover:scale-110"
                  style={{
                    color: 'rgba(255,255,255,0.35)',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
