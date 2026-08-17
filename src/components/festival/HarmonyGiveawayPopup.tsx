import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Ticket, Sparkles, Clock, ArrowRight } from 'lucide-react';

const O = '#f07820';                                   // Kampagnen-Orange
const DEADLINE = new Date('2026-08-18T23:59:59').getTime();
const SESSION_KEY = 'harmony_giveaway_seen';

export default function HarmonyGiveawayPopup() {
  const [open, setOpen] = useState(false);
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0 });

  // Auto-Open: nur vor Deadline & einmal pro Session, nach kurzer Verzögerung
  useEffect(() => {
    if (Date.now() > DEADLINE) return;
    let seen = false;
    try { seen = sessionStorage.getItem(SESSION_KEY) === '1'; } catch { /* ignore */ }
    if (seen) return;
    const t = setTimeout(() => {
      setOpen(true);
      try { sessionStorage.setItem(SESSION_KEY, '1'); } catch { /* ignore */ }
    }, 1200);
    return () => clearTimeout(t);
  }, []);

  // Mini-Countdown bis 18.08.
  useEffect(() => {
    if (!open) return;
    const tick = () => {
      const diff = DEADLINE - Date.now();
      if (diff <= 0) { setCd({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setCd({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [open]);

  // Esc schließt
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const goTickets = () => {
    setOpen(false);
    setTimeout(() => {
      document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };

  const Unit = ({ v, l }: { v: number; l: string }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 }}>
      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 30, lineHeight: 1, color: '#fff' }}>
        {String(v).padStart(2, '0')}
      </span>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: `${O}cc`, marginTop: 3 }}>{l}</span>
    </div>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 60, display: 'flex',
            alignItems: 'center', justifyContent: 'center', padding: 16,
            background: 'rgba(8,12,16,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 24 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 24 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative', width: '100%', maxWidth: 440, borderRadius: 24, overflow: 'hidden', textAlign: 'center',
              background: 'rgba(18,10,4,0.99)', border: `1px solid ${O}44`,
              boxShadow: `0 0 0 1px ${O}12, 0 40px 100px rgba(0,0,0,0.8), 0 0 100px ${O}18`,
            }}
          >
            {/* Top-Glow + Ambient */}
            <div style={{ position: 'absolute', insetInline: 0, top: 0, height: 2, background: `linear-gradient(to right, transparent, ${O}, transparent)` }} />
            <div style={{ position: 'absolute', insetInline: 0, top: 0, height: 190, pointerEvents: 'none', background: `radial-gradient(ellipse 70% 100% at 50% 0%, ${O}26 0%, transparent 100%)` }} />

            {/* Close */}
            <button onClick={() => setOpen(false)}
              style={{ position: 'absolute', top: 14, right: 14, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${O}14`, border: 'none', cursor: 'pointer', color: 'rgba(255,220,190,0.6)', zIndex: 2 }}>
              <X className="w-4 h-4" />
            </button>

            <div style={{ position: 'relative', zIndex: 1, padding: '38px 28px 30px' }}>
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -18 }} animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.12, type: 'spring', stiffness: 220, damping: 16 }}
                style={{ width: 72, height: 72, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', background: `radial-gradient(circle, ${O}33 0%, ${O}0d 100%)`, border: `2px solid ${O}59` }}>
                <Sparkles className="w-8 h-8" style={{ color: O }} />
              </motion.div>

              {/* Eyebrow */}
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: O, opacity: 0.8, marginBottom: 10 }}>
                Gewinnspiel · nur bis 18.08.
              </div>

              {/* Headline */}
              <h2 className="graffiti" style={{ fontSize: 'clamp(30px, 7vw, 44px)', color: '#fff', lineHeight: 0.95, marginBottom: 14 }}>
                Freie Getränke<br /><span style={{ color: O, textShadow: `0 0 30px ${O}88` }}>den ganzen Abend</span>
              </h2>

              {/* Text */}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14.5, color: 'rgba(240,215,195,0.7)', lineHeight: 1.7, maxWidth: 360, margin: '0 auto 22px' }}>
                Kauf dein Ticket bis zum <strong style={{ color: '#fff' }}>18.08.</strong> und mit etwas Glück gewinnst du <strong style={{ color: '#fff' }}>1 von 3 Bändchen</strong> — damit trinkst du den ganzen Abend gratis.
              </p>

              {/* Countdown */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 16px', borderRadius: 16, marginBottom: 22, background: `${O}0f`, border: `1px solid ${O}2e` }}>
                <Clock className="w-4 h-4" style={{ color: O, flexShrink: 0, marginRight: 4 }} />
                <Unit v={cd.d} l="Tage" />
                <span style={{ color: `${O}66`, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, paddingBottom: 12 }}>:</span>
                <Unit v={cd.h} l="Std" />
                <span style={{ color: `${O}66`, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, paddingBottom: 12 }}>:</span>
                <Unit v={cd.m} l="Min" />
                <span style={{ color: `${O}66`, fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, paddingBottom: 12 }}>:</span>
                <Unit v={cd.s} l="Sek" />
              </div>

              {/* CTA */}
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={goTickets}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '15px', borderRadius: 16, border: 'none', cursor: 'pointer',
                  background: `linear-gradient(90deg, ${O} 0%, #d0641a 100%)`, color: '#160a02',
                  fontFamily: "'Bebas Neue', sans-serif", fontSize: 19, letterSpacing: '0.16em', fontWeight: 700,
                  boxShadow: `0 6px 28px ${O}55`,
                }}>
                <Ticket className="w-5 h-5" /> Jetzt Ticket sichern <ArrowRight className="w-4 h-4" />
              </motion.button>

              {/* Fine print */}
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: 'rgba(220,190,170,0.4)', marginTop: 12, lineHeight: 1.5 }}>
                Verlosung nach dem 18.08. · Gewinner werden per DM informiert.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}