import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Users, Mic, Handshake, Music, Heart, ArrowRight,
  MapPin, Clock, Beer, Ticket, Laugh, Trophy, Disc3, Mail,
  CheckCircle, Loader2, ChevronDown, X, Lock, ShieldCheck,
  Sparkles, Building2, Star,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SupportThankYouPopup from '../components/festival/SupportThankYouPopup';

/* ------------------------------------------------------------------ */
/*  Farben                                                             */
/* ------------------------------------------------------------------ */

const C = {
  cyan:    '#00d4d4',
  teal:    '#00a8a8',
  blue:    '#1e90d4',
  sky:     '#4dc8e8',
  lime:    '#c8e840',
  orange:  '#f07820',
  red:     '#dc3232',
  bg:      '#080c10',
} as const;

/* ------------------------------------------------------------------ */
/*  Ticket-Konfiguration                                               */
/*  compareAt = marktüblicher Vergleichspreis (durchgestrichen)        */
/* ------------------------------------------------------------------ */

type TicketDef = {
  id: string;
  priceId: string | undefined;
  label: string;
  price: number;
  /** Marktüblicher Vergleichspreis eines gleichwertigen Einzel-Events. Belegbar halten. */
  marketPrice: number | null;
  description: string;
  badge: string | null;
  perk: string;
  accent: string;
  accentAlpha: string;
  accentShadow: string;
  time: string | null;
};

const TICKETS: TicketDef[] = [
  {
    id: 'early_bird',
    priceId: import.meta.env.VITE_STRIPE_HARMONY_EARLY_BIRD,
    label: 'Bundle',
    price: 39.99,
    // early_bird:
marketPrice: null,   // war: compareAt: 43.50  ← das war die eigene Summe, kein Marktpreis

// standup:       marketPrice: 28
// bierpong:      marketPrice: 18
// concert:       marketPrice: 32
// dj:            marketPrice: 15
// soli_shirt:    marketPrice: null
    description: 'Das volle Programm: Live-Konzert mit Zirkel.WTF, Stand-Up Comedy Show & DJ Night in einem Paket – zum günstigsten Preis.',
    badge: 'BELIEBT',
    perk: '',
    accent: 'rgba(0,175,175,0.85)',
    accentAlpha: 'rgba(0,160,160,0.1)',
    accentShadow: 'rgba(0,140,140,0.06)',
    time: null,
  },
  {
    id: 'standup',
    priceId: import.meta.env.VITE_STRIPE_HARMONY_STANDUP,
    label: 'Stand-Up Comedy',
    price: 17.50,
    compareAt: 28,
    description: 'Kevin Küster, Larissa Magnus, Alex Graf, Jahn Boie, Leon Blokesch & Julian Deters – frisch, direkt, aus der lokalen Szene.',
    badge: null,
    perk: '',
    accent: 'rgba(210,110,50,0.85)',
    accentAlpha: 'rgba(200,100,40,0.1)',
    accentShadow: 'rgba(180,85,30,0.06)',
    time: '16:30 Uhr',
  },
  {
    id: 'bierpong',
    priceId: import.meta.env.VITE_STRIPE_HARMONY_BIERPONG,
    label: 'Bierpong-Turnier',
    price: 10.00,
    compareAt: 18,
    description: 'Das Turnier läuft für alle – Musik, Stimmung & Drinks inklusive. Wer als Team aktiv mitspielen will, sichert sich hier seinen Startplatz.',
    badge: 'LIMITIERT',
    perk: 'Gewinnen = den ganzen Abend free trinken',
    accent: 'rgba(185,215,55,0.8)',
    accentAlpha: 'rgba(175,205,50,0.1)',
    accentShadow: 'rgba(155,185,40,0.06)',
    time: '18:00 Uhr',
  },
  {
    id: 'concert',
    priceId: import.meta.env.VITE_STRIPE_HARMONY_CONCERT,
    label: 'Live Konzert Zirkel.WTF',
    price: 17.50,
    compareAt: 32,
    description: 'Norddeutschlands Pop-Punk-Hoffnung hautnah. Moderne Beats, Skater-Vibe, ehrliche Texte.',
    badge: null,
    perk: '',
    accent: 'rgba(60,140,200,0.8)',
    accentAlpha: 'rgba(50,130,190,0.1)',
    accentShadow: 'rgba(40,110,170,0.06)',
    time: '20:30 Uhr',
  },
  {
    id: 'dj',
    priceId: import.meta.env.VITE_STRIPE_HARMONY_DJ,
    label: 'DJ Sets House / Techno',
    price: 8.50,
    compareAt: 15,
    description: 'Justyn Maxx & Vio Leen – House & Techno bis in den Morgen.',
    badge: null,
    perk: '',
    accent: 'rgba(160,120,200,0.8)',
    accentAlpha: 'rgba(145,105,185,0.1)',
    accentShadow: 'rgba(130,90,170,0.06)',
    time: '22:00 Uhr',
  },
  {
    id: 'soli_shirt',
    priceId: import.meta.env.VITE_STRIPE_HARMONY_SOLI_SHIRT,
    label: 'Soli-Shirt',
    price: 25.00,
    compareAt: null,
    description: '100% Gewinn an KeinBockAufNazis e.V.',
    badge: 'SOLI',
    perk: '',
    accent: 'rgba(220,50,50,0.85)',
    accentAlpha: 'rgba(200,40,40,0.1)',
    accentShadow: 'rgba(180,30,30,0.06)',
    time: null,
  },
];

const HERO = TICKETS[0];
const SINGLE_TICKETS = TICKETS.filter(t => t.id !== 'early_bird' && t.id !== 'soli_shirt');
const SHIRT = TICKETS.find(t => t.id === 'soli_shirt')!;

/** Im Bundle enthalten: Comedy, Konzert, DJ. Bierpong NICHT. */
const BUNDLE_CONTENT_IDS = ['standup', 'concert', 'dj'] as const;

const HERO_MARKET = BUNDLE_CONTENT_IDS.reduce(
  (sum, id) => sum + (TICKETS.find(t => t.id === id)?.marketPrice ?? 0), 0,
); // 75.00

const HERO_OWN_SUM = BUNDLE_CONTENT_IDS.reduce(
  (sum, id) => sum + (TICKETS.find(t => t.id === id)?.price ?? 0), 0,
); // 43.50

const HERO_MARKET_SAVING = HERO_MARKET - HERO.price;   // 35.01
const HERO_OWN_SAVING    = HERO_OWN_SUM - HERO.price;  //  3.51

/** Abrunden, nie aufrunden. */
const pctOff = (price: number, market: number) => Math.floor(((market - price) / market) * 100);

const HERO_PCT = pctOff(HERO.price, HERO_MARKET); // 46

const MAX_PCT = Math.max(
  HERO_PCT,
  ...SINGLE_TICKETS.filter(t => t.marketPrice).map(t => pctOff(t.price, t.marketPrice!)),
); // 46

const CHEAPEST_SINGLE = Math.min(...SINGLE_TICKETS.map(t => t.price));

const eur = (n: number) => n.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

/** ⚠️ An deine echte Recherche anpassen — siehe Hinweis unten. */
const MARKET_BASIS =
  'Vergleichswerte: Durchschnittliche Eintrittspreise vergleichbarer Einzel-Veranstaltungen ' +
  'in Düsseldorf (Comedy-Club-Abend, Club-Konzert, Techno-Nacht), erhoben im Juli 2026. ' +
  'Der Bundle-Vergleichswert ist die Summe dieser drei Einzelwerte.';

const ACTS = [
  { num: '01', icon: Laugh,  label: 'Stand-Up Comedy', sub: 'Newcomer der lokalen Szene', time: '16:30', color: C.orange },
  { num: '02', icon: Trophy, label: 'Bierpong Turnier', sub: 'Gewinnen = free drinks',     time: '18:00', color: C.lime   },
  { num: '03', icon: Mic,    label: 'Zirkel.WTF Live',  sub: 'Pop-Punk aus Hamburg',        time: '20:30', color: C.cyan   },
  { num: '04', icon: Disc3,  label: 'DJ Sets',          sub: 'House & Techno bis 02:00',    time: '22:00', color: C.blue   },
];

const BIERPONG_TICKET_IDS = new Set(['bierpong']);
const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'] as const;

const NAV_SECTIONS = [
  { id: 'programm',      label: 'Programm',     emoji: '🎶' },
  { id: 'tickets',       label: 'Tickets',      emoji: '🎟️' },
  { id: 'crew',          label: 'Crew-Deal',    emoji: '🤝' },
  { id: 'sponsoren',     label: 'Sponsoren',    emoji: '🏢' },
  { id: 'shirts',        label: 'Soli-Shirts',  emoji: '👕' },
  { id: 'hardfacts',     label: 'Hard Facts',   emoji: '📍' },
  { id: 'unterstuetzen', label: 'Unterstützen', emoji: '💛' },
] as const;

/* ------------------------------------------------------------------ */
/*  Hintergrund-Canvas                                                 */
/* ------------------------------------------------------------------ */

function GraffitiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Respektiert prefers-reduced-motion: dann nur ein statischer Frame.
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const beams = [
      { x: 0.08, angle:  22, w: 160, col: 'rgba(0,212,212,',  spd: 0.00028, ph: 0   },
      { x: 0.28, angle: -15, w: 110, col: 'rgba(30,144,212,', spd: 0.00038, ph: 1.6 },
      { x: 0.55, angle:  10, w: 130, col: 'rgba(200,232,64,', spd: 0.00022, ph: 3.1 },
      { x: 0.78, angle: -18, w:  95, col: 'rgba(77,200,232,', spd: 0.00032, ph: 4.7 },
      { x: 0.92, angle:  28, w:  80, col: 'rgba(240,120,32,', spd: 0.00044, ph: 2.2 },
    ];

    const blobs = Array.from({ length: 22 }, (_, i) => ({
      x: Math.random(), y: Math.random(),
      r: 35 + Math.random() * 90,
      col: ['rgba(0,212,212,', 'rgba(30,144,212,', 'rgba(200,232,64,', 'rgba(77,200,232,', 'rgba(240,120,32,'][i % 5],
      vx: (Math.random() - 0.5) * 0.00010,
      vy: (Math.random() - 0.5) * 0.00007,
      op: 0.07 + Math.random() * 0.13,
      ph: Math.random() * Math.PI * 2,
      ps: 0.0007 + Math.random() * 0.0014,
    }));

    const draw = (t: number) => {
      const w = canvas.width, h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = C.bg;
      ctx.fillRect(0, 0, w, h);

      const amb = ctx.createRadialGradient(w * 0.5, h * 0.25, 0, w * 0.5, h * 0.25, w * 1.2);
      amb.addColorStop(0, 'rgba(0,60,70,0.55)');
      amb.addColorStop(0.4, 'rgba(0,30,45,0.35)');
      amb.addColorStop(1, 'rgba(8,12,16,0)');
      ctx.fillStyle = amb;
      ctx.fillRect(0, 0, w, h);

      const amb2 = ctx.createRadialGradient(w * 0.2, h * 0.6, 0, w * 0.2, h * 0.6, w * 0.7);
      amb2.addColorStop(0, 'rgba(30,144,212,0.06)');
      amb2.addColorStop(1, 'rgba(8,12,16,0)');
      ctx.fillStyle = amb2;
      ctx.fillRect(0, 0, w, h);

      const amb3 = ctx.createRadialGradient(w * 0.8, h * 0.8, 0, w * 0.8, h * 0.8, w * 0.65);
      amb3.addColorStop(0, 'rgba(0,212,212,0.05)');
      amb3.addColorStop(1, 'rgba(8,12,16,0)');
      ctx.fillStyle = amb3;
      ctx.fillRect(0, 0, w, h);

      beams.forEach(b => {
        const sweep = Math.sin(t * b.spd + b.ph) * 0.055;
        const bx = (b.x + sweep) * w;
        const rad = (b.angle + Math.sin(t * b.spd * 0.6 + b.ph) * 5) * (Math.PI / 180);
        ctx.save();
        ctx.translate(bx, 0);
        ctx.rotate(rad);
        const g = ctx.createLinearGradient(0, 0, 0, h * 1.6);
        g.addColorStop(0,    b.col + '0.0)');
        g.addColorStop(0.03, b.col + '0.18)');
        g.addColorStop(0.22, b.col + '0.09)');
        g.addColorStop(0.55, b.col + '0.04)');
        g.addColorStop(1,    b.col + '0.0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(-b.w / 2, 0);
        ctx.lineTo(-b.w * 4.5, h * 1.6);
        ctx.lineTo(b.w * 4.5, h * 1.6);
        ctx.lineTo(b.w / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      blobs.forEach(s => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < -0.1) s.x = 1.1;
        if (s.x > 1.1) s.x = -0.1;
        if (s.y < -0.1) s.y = 1.1;
        if (s.y > 1.1) s.y = -0.1;
        const op2 = s.op * (0.75 + 0.25 * Math.sin(t * s.ps + s.ph));
        const g2 = ctx.createRadialGradient(s.x * w, s.y * h, 0, s.x * w, s.y * h, s.r);
        g2.addColorStop(0,   s.col + op2 + ')');
        g2.addColorStop(0.5, s.col + op2 * 0.28 + ')');
        g2.addColorStop(1,   s.col + '0)');
        ctx.fillStyle = g2;
        ctx.beginPath();
        ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.04, w / 2, h / 2, h * 1.15);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.6)');
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      if (!reduceMotion) animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ width: '100%', height: '100%' }} />;
}

/* ------------------------------------------------------------------ */
/*  Poster-Switcher                                                    */
/* ------------------------------------------------------------------ */

const POSTER_SLIDES = [
  { src: '/22.08.2026_(8).png', alt: 'Harmony Festival 2026 Poster', label: 'Das Poster', accent: 'rgba(0,212,212,1)', accentAlpha: 'rgba(0,212,212,0.18)', glow: 'rgba(0,212,212,0.1)' },
  { src: '/Gewinne_das_Bierpongturnier_(3).png', alt: 'Gewinne das Bierpongturnier', label: 'Bierpong-Turnier', accent: 'rgba(185,215,55,1)', accentAlpha: 'rgba(185,215,55,0.2)', glow: 'rgba(185,215,55,0.08)' },
  { src: '/Stand-Up_LineUp.png', alt: 'Stand-Up Comedy Line-Up', label: 'Stand-Up Line-Up', accent: 'rgba(240,120,32,1)', accentAlpha: 'rgba(240,120,32,0.18)', glow: 'rgba(240,120,32,0.08)' },
  { src: '/Unbenannt.jpg', alt: 'Zirkel.WTF – Das ist die Tour', label: 'Zirkel.WTF', accent: 'rgba(255,255,255,1)', accentAlpha: 'rgba(255,255,255,0.15)', glow: 'rgba(200,200,200,0.06)' },
  { src: '/22.08.2026_Klub_Kulb_Dusseldorf_(1)%20copy%20copy.png', alt: 'Harmony Festival – Hauptposter', label: 'Festival Poster', accent: 'rgba(0,190,150,1)', accentAlpha: 'rgba(0,190,150,0.18)', glow: 'rgba(0,180,140,0.08)' },
];

const AUTOPLAY_INTERVAL = 10000;

function PosterSwitcher() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const total = POSTER_SLIDES.length;
  const next = (active + 1) % total;
  const current = POSTER_SLIDES[active];
  const nextSlide = POSTER_SLIDES[next];

  // Ein einziger Timer. Läuft bei jedem Slide-Wechsel neu an – dadurch
  // setzt auch manuelle Navigation die Autoplay-Uhr automatisch zurück.
  useEffect(() => {
    if (paused) return;
    const id = setTimeout(() => setActive(p => (p + 1) % total), AUTOPLAY_INTERVAL);
    return () => clearTimeout(id);
  }, [paused, active, total]);

  const goNext = useCallback(() => setActive(p => (p + 1) % total), [total]);

  return (
    <section>
      <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}>
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="tag-label">{current.label}</div>
          <button
            type="button"
            onClick={() => setPaused(p => !p)}
            aria-label={paused ? 'Autoplay starten' : 'Autoplay pausieren'}
            title={paused ? 'Autoplay starten' : 'Autoplay pausieren'}
            style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, transition: 'background 0.18s',
            }}
          >
            {paused ? (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="rgba(255,255,255,0.7)"><path d="M0 0L10 6L0 12Z" /></svg>
            ) : (
              <svg width="10" height="12" viewBox="0 0 10 12" fill="rgba(255,255,255,0.7)">
                <rect x="0" y="0" width="3.5" height="12" rx="1" />
                <rect x="6.5" y="0" width="3.5" height="12" rx="1" />
              </svg>
            )}
          </button>
        </div>

        <div className="relative mx-auto" style={{ maxWidth: '600px', paddingRight: '36px' }}>
          <div className="flex items-start gap-0" style={{ position: 'relative' }}>

            <div style={{ flex: '1 1 0', minWidth: 0, position: 'relative' }}>
              <div style={{
                borderRadius: '16px',
                boxShadow: `0 0 0 1px ${current.accentAlpha}, 0 8px 40px rgba(0,0,0,0.5), 0 0 60px ${current.glow}`,
                overflow: 'hidden', lineHeight: 0, transition: 'box-shadow 0.4s ease',
              }}>
                <AnimatePresence mode="wait">
                  <motion.img
                    key={active}
                    src={current.src}
                    alt={current.alt}
                    loading="lazy"
                    initial={{ opacity: 0, scale: 1.03 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.97 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    style={{ display: 'block', width: '100%', height: 'auto' }}
                  />
                </AnimatePresence>
              </div>

              {/* Fortschrittsbalken: reine CSS-Animation statt 20 Re-Renders/Sekunde */}
              {!paused && (
                <div style={{
                  position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
                  background: 'rgba(255,255,255,0.1)', borderRadius: '0 0 16px 16px', overflow: 'hidden',
                }}>
                  <div
                    key={active}
                    style={{
                      height: '100%', width: 0, background: current.accent,
                      borderRadius: '0 0 16px 16px',
                      animation: `hfProgress ${AUTOPLAY_INTERVAL}ms linear forwards`,
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ width: '90px', flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingLeft: '10px' }}>
              <div
                role="button"
                tabIndex={0}
                onClick={goNext}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') goNext(); }}
                style={{
                  position: 'relative', width: '80px', cursor: 'pointer', borderRadius: '12px',
                  overflow: 'hidden', opacity: 0.55, filter: 'blur(0.5px)',
                  transition: 'opacity 0.25s, filter 0.25s, transform 0.2s', flexShrink: 0,
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  el.style.opacity = '0.85'; el.style.filter = 'blur(0px)'; el.style.transform = 'scale(1.04)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  el.style.opacity = '0.55'; el.style.filter = 'blur(0.5px)'; el.style.transform = 'scale(1)';
                }}
              >
                <AnimatePresence mode="wait">
                  <motion.img
                    key={next}
                    src={nextSlide.src}
                    alt={nextSlide.alt}
                    loading="lazy"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '12px' }}
                  />
                </AnimatePresence>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.35) 100%)', borderRadius: '12px', pointerEvents: 'none' }} />
                <div style={{
                  position: 'absolute', bottom: '6px', left: 0, right: 0, textAlign: 'center',
                  fontFamily: "'Inter', sans-serif", fontSize: '8px', fontWeight: 700,
                  letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)', pointerEvents: 'none',
                }}>
                  {nextSlide.label}
                </div>
              </div>

              <button
                type="button"
                onClick={goNext}
                aria-label="Nächstes Poster"
                style={{
                  position: 'absolute', right: '-18px', top: '50%', transform: 'translateY(-50%)',
                  width: '44px', height: '44px', borderRadius: '50%', background: current.accent,
                  border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 24px ${current.glow}, 0 4px 16px rgba(0,0,0,0.5)`, zIndex: 10,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease', flexShrink: 0,
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-50%) scale(1.12)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(-50%) scale(1)'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex justify-center gap-2 mt-6">
            {POSTER_SLIDES.map((s, i) => (
              <button
                key={s.src}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`Poster ${i + 1}: ${s.label}`}
                style={{
                  width: i === active ? '24px' : '8px', height: '8px', borderRadius: '999px',
                  background: i === active ? s.accent : 'rgba(255,255,255,0.18)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */

function FaqSection() {
  const [open, setOpen] = useState<number | null>(null);
  const items = [
    { q: 'Wie bekomme ich mein Ticket?', a: 'Nach dem Kauf erhältst du sofort eine E-Mail mit deinem digitalen Ticket. Zeig es einfach am Einlass auf deinem Handy vor – kein Ausdruck nötig.' },
    { q: 'Für wen ist das Festival geeignet?', a: 'Das Harmony Festival ist ab 18 Jahren. Es richtet sich an alle, die Lust auf Live-Musik, Comedy und gute Vibes haben – unabhängig von Hintergrund oder Szene.' },
    { q: 'Was ist im Bundle enthalten?', a: 'Das Bundle umfasst den Einlass für alle drei Programmpunkte: Zirkel.WTF Live-Konzert, Stand-Up Comedy Show und DJ Night – plus 1 Freigetränk nach Wahl beim Einlass.' },
    { q: 'Ist das Bierpong-Turnier im Bundle enthalten?', a: 'Zuschauen und feiern ist für alle kostenlos – das Turnier läuft mitten im Abend, kein Extra-Ticket nötig. Nur wer als Team aktiv mitspielen will, braucht das separate Bierpong-Ticket.' },
    { q: 'Kann ich mehrere Tickets für Freunde kaufen?', a: 'Ja! Auf der Ticketkarte kannst du die Anzahl direkt anpassen. Jede Person bekommt ein eigenes Ticket per E-Mail.' },
    { q: 'Was passiert wenn ich nicht kommen kann?', a: 'Tickets sind grundsätzlich nicht erstattbar. Du kannst dein Ticket aber an jemand anderen weitergeben – schick uns dafür einfach eine Nachricht über Instagram.' },
  ];

  return (
    <motion.section initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="mt-16">
      <div className="tag-label mb-6">FAQ</div>
      <h2 className="graffiti mb-8" style={{ fontSize: 'clamp(32px, 5vw, 52px)', color: '#fff', lineHeight: 0.95 }}>
        Häufige Fragen
      </h2>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={item.q} className="rounded-2xl overflow-hidden"
            style={{ background: open === i ? 'rgba(0,212,212,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${open === i ? 'rgba(0,212,212,0.22)' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.2s' }}>
            <button
              type="button"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
              className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
              style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', fontWeight: 600, color: open === i ? '#e0f4f4' : 'rgba(200,230,230,0.75)', cursor: 'pointer', background: 'none', border: 'none' }}>
              <span>{item.q}</span>
              <ChevronDown className="w-4 h-4 flex-shrink-0 transition-transform duration-200" style={{ color: 'rgba(0,212,212,0.6)', transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }} />
            </button>
            {open === i && (
              <div className="px-6 pb-5" style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(170,215,215,0.65)', lineHeight: 1.75 }}>
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/*  Wiederverwendbare Checkbox                                         */
/* ------------------------------------------------------------------ */

function ConsentBox({ checked, onChange, color, children }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  color: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none"
      style={{
        padding: '14px', borderRadius: '12px',
        background: checked ? `${color}12` : 'rgba(255,255,255,0.02)',
        border: `1px solid ${checked ? `${color}55` : 'rgba(255,255,255,0.08)'}`,
        transition: 'all 0.2s',
      }}>
      <div className="flex-shrink-0 mt-0.5">
        <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
          style={{ background: checked ? color : 'transparent', border: `2px solid ${checked ? color : 'rgba(160,230,230,0.3)'}` }}>
          {checked && <CheckCircle className="w-3 h-3" style={{ color: '#080c10' }} />}
        </div>
      </div>
      <input type="checkbox" className="sr-only" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.7)', lineHeight: 1.5 }}>
        {children}
      </span>
    </label>
  );
}
/* ------------------------------------------------------------------ */
/* Patch-File Komponenten                                            */
/* ------------------------------------------------------------------ */

interface PriceBlockProps {
  price: string | number;
  oldPrice?: string | number;
  discountPct?: number;
  label?: string;
}

// 1. SavingsBand Komponente
function SavingsBand({ price, oldPrice, discountPct }: PriceBlockProps) {
  return (
    <div className="savings-band">
      <div className="stat-cell">
        <span className="stat-label">Du sparst</span>
        <span className="stat-value">{discountPct}%</span>
      </div>
      <div className="stat-cell">
        <span className="stat-label">Statt</span>
        <span className="price-old">{oldPrice}</span>
      </div>
      {discountPct && discountPct > 20 && (
        <span className="pct-badge">Mega Deal</span>
      )}
    </div>
  );
}

// 2. HeroPriceBlock Komponente (für prominente Platzierung)
function HeroPriceBlock({ price, oldPrice, discountPct, label }: PriceBlockProps) {
  return (
    <div className="flex flex-col items-center justify-center p-4">
      {label && <span className="tag-label mb-1">{label}</span>}
      <div className="flex items-baseline gap-3">
        {oldPrice && <span className="price-old text-lg">{oldPrice}</span>}
        <span className="price-num text-4xl font-bold">{price}</span>
      </div>
      {discountPct && (
        <div className="ribbon mt-2">-{discountPct}% RABATT</div>
      )}
    </div>
  );
}

// 3. SinglePriceBlock Komponente (für Standard-Karten)
function SinglePriceBlock({ price, oldPrice, discountPct }: PriceBlockProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="price-num text-2xl">{price}</span>
      {oldPrice && <span className="price-old text-sm">{oldPrice}</span>}
      {discountPct && <span className="pct-badge">-{discountPct}%</span>}
    </div>
  );
}
/* ------------------------------------------------------------------ */
/*  Hauptkomponente                                                    */
/* ------------------------------------------------------------------ */

export default function HarmonyFestivalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();

  const [selectedShirtSize, setSelectedShirtSize] = useState<string>('');
  const [sizeError, setSizeError] = useState<string>('');

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSlowHint, setShowSlowHint] = useState(false);
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0 });

  const { scrollY } = useScroll();
  const bannerY = useTransform(scrollY, [0, 600], [0, -80]);
  const bannerOp = useTransform(scrollY, [0, 500], [1, 0.3]);

  const [bierpongModal, setBierpongModal] = useState<{ ticket: TicketDef } | null>(null);
  const [teamName, setTeamName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [teamNameError, setTeamNameError] = useState('');
  const [bierpongBuyerName, setBierpongBuyerName] = useState('');
  const [bierpongBuyerNameError, setBierpongBuyerNameError] = useState('');
  const [bierpongAgeConfirmed, setBierpongAgeConfirmed] = useState(false);
  const [bierpongAgbConfirmed, setBierpongAgbConfirmed] = useState(false);

  const [nameModal, setNameModal] = useState<{ ticket: TicketDef } | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerNameError, setBuyerNameError] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [agbConfirmed, setAgbConfirmed] = useState(false);

  const [purchasedTickets, setPurchasedTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [supportSessionId, setSupportSessionId] = useState<string | undefined>(undefined);
  const [activeSection, setActiveSection] = useState<string>('');

  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(TICKETS.map(t => [t.id, t.id === 'early_bird' ? 2 : 1]))
  );

  const updateQty = (id: string, delta: number) => {
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, Math.min(10, (prev[id] ?? 1) + delta)) }));
  };

  /* FIX: bei HashRouter liegen Query-Params im Hash, nicht in location.search.
     searchParams von react-router liest korrekt aus der aktiven Route. */
  const payStatus = searchParams.get('payment');

  /* --- URL-Parameter auswerten --- */
  useEffect(() => {
    setLoadingId(null);
    setShowSlowHint(false);

    if (payStatus === 'cancelled') {
      setError('Zahlung wurde abgebrochen. Du kannst es jederzeit erneut versuchen.');
    }
    if (payStatus === 'success') {
      setShowThankYou(true);
    }
    if (searchParams.get('support_success') === '1') {
      setSupportSessionId(searchParams.get('session_id') || undefined);
      setShowSupportPopup(true);
    }
  }, [payStatus, searchParams]);

  /* --- Countdown (feste Zeitzone, damit alle dasselbe sehen) --- */
  useEffect(() => {
    const target = new Date('2026-08-22T16:00:00+02:00').getTime();
    const tick = () => {
      const diff = target - Date.now();
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
  }, []);

  /* --- Gekaufte Tickets laden --- */
  const loadUserTickets = useCallback(async () => {
    if (!user) { setPurchasedTickets([]); return; }
    setLoadingTickets(true);
    const { data } = await supabase
      .from('festival_ticket_sales')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPurchasedTickets(data || []);
    setLoadingTickets(false);
  }, [user]);

  useEffect(() => { loadUserTickets(); }, [loadUserTickets]);

  useEffect(() => {
    if (payStatus === 'success' && user) {
      const t = setTimeout(() => loadUserTickets(), 3000);
      return () => clearTimeout(t);
    }
  }, [payStatus, user, loadUserTickets]);

  /* --- Deep-Link Scroll (nur echte Section-IDs, nicht der Router-Hash) --- */
  useEffect(() => {
    const raw = window.location.hash;
    const id = raw.includes('#', 1) ? raw.slice(raw.lastIndexOf('#') + 1) : '';
    if (!id || !NAV_SECTIONS.some(s => s.id === id)) return;
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);
    return () => clearTimeout(t);
  }, []);

  /* --- Aktive Section via rAF-Throttle (kein Layout-Thrashing) --- */
  useEffect(() => {
    let ticking = false;
    const measure = () => {
      ticking = false;
      let bestId = '';
      let bestTop = Infinity;
      for (const { id } of NAV_SECTIONS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = Math.abs(el.getBoundingClientRect().top - 100);
        if (top < bestTop) { bestTop = top; bestId = id; }
      }
      if (bestId) setActiveSection(bestId);
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(measure);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    measure();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  /* --- Checkout --- */
  const doCheckout = async (
    ticket: TicketDef,
    name: string,
    bpTeam?: string,
    bpPartner?: string,
    shirtSize?: string,
    quantity = 1,
  ) => {
    setError(null);
    setLoadingId(ticket.id);
    setShowSlowHint(false);

    if (!ticket.priceId) {
      setError('Ticket-Konfiguration fehlt. Bitte versuche es später erneut.');
      setLoadingId(null);
      return;
    }

    const slowHintTimer = setTimeout(() => setShowSlowHint(true), 3000);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const checkoutUrl = `${supabaseUrl}/functions/v1/stripe-checkout`;

    const successUrl =
      ticket.id === 'support'
        ? `${window.location.origin}/#/festival?support_success=1&session_id={CHECKOUT_SESSION_ID}`
        : `${window.location.origin}/#/festival-success?session_id={CHECKOUT_SESSION_ID}&type=${ticket.id}`;

    const attemptCheckout = async (): Promise<string> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const { data: { session: authSession } } = await Promise.race([
          supabase.auth.getSession(),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Session-Timeout. Bitte Seite neu laden.')), 5000)
          ),
        ]);
        const authToken = authSession?.access_token || anonKey;

        const response = await fetch(checkoutUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
            'apikey': anonKey,
          },
          body: JSON.stringify({
            price_id: ticket.priceId,
            quantity,
            success_url: successUrl,
            cancel_url: `${window.location.origin}/#/festival?payment=cancelled`,
            mode: 'payment',
            metadata: { ticket_type: ticket.id },
            ...(user?.id ? { user_id: user.id } : {}),
            buyer_name: name,
            ...(bpTeam ? { bierpong_team_name: bpTeam } : {}),
            ...(bpPartner ? { bierpong_partner_name: bpPartner } : {}),
            ...(shirtSize ? { shirt_size: shirtSize } : {}),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let serverMessage: string | undefined;
          try {
            const errBody = await response.json();
            serverMessage = errBody?.error;
          } catch { /* Antwort war kein JSON */ }
          // Server hat geantwortet → NICHT retryen, sonst entstehen doppelte Stripe-Sessions.
          const err = new Error(serverMessage || 'Checkout fehlgeschlagen. Bitte versuche es erneut.');
          (err as any).noRetry = true;
          throw err;
        }

        const data = await response.json();
        if (!data?.url) {
          const err = new Error(data?.error || 'Checkout fehlgeschlagen.');
          (err as any).noRetry = true;
          throw err;
        }
        return data.url;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') throw new Error('Verbindungs-Timeout. Bitte versuche es erneut.');
        throw err;
      }
    };

    const MAX_RETRIES = 2;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const url = await attemptCheckout();
        clearTimeout(slowHintTimer);
        window.location.href = url;
        return;
      } catch (e: any) {
        lastError = e;
        if ((e as any).noRetry || attempt === MAX_RETRIES) break;
        await new Promise(res => setTimeout(res, 1500));
      }
    }

    clearTimeout(slowHintTimer);
    setError(lastError?.message || 'Checkout fehlgeschlagen. Bitte versuche es erneut.');
    setLoadingId(null);
    setShowSlowHint(false);
  };

  /* --- Modal-Steuerung --- */
  const openTicketModal = (ticket: TicketDef) => {
    if (BIERPONG_TICKET_IDS.has(ticket.id)) {
      setTeamName(''); setPartnerName(''); setTeamNameError('');
      setBierpongBuyerName(profile?.full_name || ''); setBierpongBuyerNameError('');
      setBierpongAgeConfirmed(false);
      setBierpongAgbConfirmed(false);
      setBierpongModal({ ticket });
    } else {
      setBuyerName(profile?.full_name || '');
      setBuyerNameError('');
      setAgeConfirmed(false);
      setAgbConfirmed(false);
      setNameModal({ ticket });
    }
  };

  const handleBuy = (ticket: TicketDef) => openTicketModal(ticket);

  const handleShirtBuy = () => {
    if (!selectedShirtSize) {
      setSizeError('Bitte wähle zuerst eine Größe.');
      return;
    }
    setSizeError('');
    openTicketModal(SHIRT);
  };

  const nameModalValid = !!nameModal && !!buyerName.trim() && ageConfirmed && agbConfirmed;

  const handleNameConfirm = () => {
    if (!nameModal) return;
    const ticket = nameModal.ticket;

    if (!buyerName.trim()) { setBuyerNameError('Bitte gib deinen Namen ein.'); return; }
    // FIX: Größe wurde vorher nie an Stripe übergeben.
    if (ticket.id === 'soli_shirt' && !selectedShirtSize) {
      setSizeError('Bitte wähle zuerst eine Größe.');
      setNameModal(null);
      scrollTo('shirts');
      return;
    }
    // FIX: agbConfirmed wurde vorher nie geprüft.
    if (!ageConfirmed || !agbConfirmed) return;

    setNameModal(null);
    doCheckout(
      ticket,
      buyerName.trim(),
      undefined,
      undefined,
      ticket.id === 'soli_shirt' ? selectedShirtSize : undefined,
      quantities[ticket.id] ?? 1,
    );
  };

  const bierpongValid = !!teamName.trim() && !!bierpongBuyerName.trim() && bierpongAgeConfirmed && bierpongAgbConfirmed;

  const handleBierpongConfirm = () => {
    if (!bierpongModal) return;
    if (!bierpongBuyerName.trim()) { setBierpongBuyerNameError('Bitte gib deinen Namen ein.'); return; }
    if (!teamName.trim()) { setTeamNameError('Bitte gib einen Teamnamen ein.'); return; }
    if (!bierpongAgeConfirmed || !bierpongAgbConfirmed) return;

    const ticket = bierpongModal.ticket;
    setBierpongModal(null);
    doCheckout(ticket, bierpongBuyerName.trim(), teamName.trim(), partnerName.trim() || undefined, undefined, quantities[ticket.id] ?? 1);
  };

  const handleSupport = () => {
    const supportTicket: TicketDef = {
      id: 'support',
      priceId: import.meta.env.VITE_STRIPE_HARMONY_SUPPORT,
      label: 'Community Support',
      price: 0,
      compareAt: null,
      description: '',
      badge: null,
      perk: '',
      accent: 'rgba(0,175,175,0.85)',
      accentAlpha: 'rgba(0,160,160,0.1)',
      accentShadow: 'rgba(0,140,140,0.06)',
      time: null,
    };
    doCheckout(supportTicket, profile?.full_name || 'Supporter');
  };

  const CDUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div style={{ minWidth: '72px', textAlign: 'center', overflow: 'hidden' }}>
        <AnimatePresence mode="popLayout">
          <motion.span key={value} initial={{ y: -28, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 28, opacity: 0 }} transition={{ duration: 0.18 }}
            style={{ display: 'block', fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontWeight: 400, fontSize: 'clamp(50px, 9vw, 84px)', color: '#ffffff', lineHeight: 1, letterSpacing: '0.04em' }}>
            {String(value).padStart(2, '0')}
          </motion.span>
        </AnimatePresence>
      </div>
      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', letterSpacing: '0.34em', color: C.cyan, fontWeight: 600, textTransform: 'uppercase', marginTop: '3px', opacity: 0.7 }}>{label}</span>
    </div>
  );

  const fadeUp = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-50px' },
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  } as const;

  /* ---------------------------------------------------------------- */

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: C.bg, color: '#fff' }}>

<style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,700;1,900&family=Bebas+Neue&display=swap');

        @keyframes hfProgress { from { width: 0%; } to { width: 100%; } }
        
        @keyframes hfPulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,212,212,0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 8px rgba(0,212,212,0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(0,212,212,0); }
        }

        .hf-scroll-x { scrollbar-width: none; -ms-overflow-style: none; }
        .hf-scroll-x::-webkit-scrollbar { display: none; }

        .graffiti {
          font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
          font-weight: 400; letter-spacing: 0.04em; text-transform: uppercase;
        }
        .graffiti-italic {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900; font-style: italic; letter-spacing: 0.03em; text-transform: uppercase;
        }
        .tag-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700; font-size: 10px; letter-spacing: 0.36em;
          text-transform: uppercase; color: ${C.cyan}; opacity: 0.65;
        }
        .glass {
          background: rgba(0,200,200,0.055);
          border: 1px solid rgba(0,212,212,0.16);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        }
        .glass-cyan {
          background: linear-gradient(135deg, rgba(0,212,212,0.12) 0%, rgba(30,144,212,0.07) 100%);
          border: 1px solid rgba(0,212,212,0.28);
          backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        }
        .btn-cyan {
          font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
          letter-spacing: 0.14em; text-transform: uppercase;
          background: linear-gradient(135deg, ${C.cyan} 0%, ${C.blue} 100%);
          color: #080c10; font-weight: 700; border: none; transition: all 0.18s ease;
          box-shadow: 0 4px 24px rgba(0,212,212,0.4), 0 0 48px rgba(0,212,212,0.12);
        }
        .btn-cyan:hover {
          filter: brightness(1.12); transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,212,212,0.55), 0 0 60px rgba(0,212,212,0.2);
        }
        .btn-ghost-cyan {
          font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
          letter-spacing: 0.14em; text-transform: uppercase;
          background: rgba(0,212,212,0.07); color: ${C.cyan};
          border: 1px solid rgba(0,212,212,0.28); transition: all 0.18s ease;
        }
        .btn-ghost-cyan:hover {
          background: rgba(0,212,212,0.13); border-color: rgba(0,212,212,0.5); color: #fff;
        }
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(0,212,212,0.3) 20%, rgba(30,144,212,0.2) 50%, rgba(0,212,212,0.3) 80%, transparent);
          margin: 72px 0;
        }
        .act-row { border-bottom: 1px solid rgba(0,212,212,0.08); transition: background 0.18s; }
        .act-row:hover { background: rgba(0,212,212,0.04); }
        .act-row:last-child { border-bottom: none; }

        .sticker {
          font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
          font-weight: 900; font-size: 11px; letter-spacing: 0.28em;
          text-transform: uppercase; padding: 4px 12px; border-radius: 3px;
          display: inline-block; box-shadow: 2px 2px 0 rgba(0,0,0,0.5);
        }
        .price-num {
          font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
          font-weight: 400; letter-spacing: 0.02em; line-height: 1;
        }
        
        /* --- PATCH EXTRA_CSS START --- */
        .savings-band {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(0,212,212,0.06); padding: 6px 12px; border-radius: 8px;
          border: 1px solid rgba(0,212,212,0.15); margin: 12px 0;
        }
        .pct-mega {
          font-family: 'Bebas Neue', sans-serif; font-size: 2.2rem;
          font-weight: 400; color: #fff; line-height: 1; letter-spacing: 0.02em;
        }
        .stat-cell {
          display: flex; flex-direction: column; padding: 0 16px;
          border-right: 1px solid rgba(0,212,212,0.15);
        }
        .stat-cell:last-child { border-right: none; }
        .stat-label {
          font-family: 'Barlow Condensed', sans-serif; font-size: 11px;
          text-transform: uppercase; color: rgba(180,210,210,0.5); letter-spacing: 0.15em;
        }
        .stat-value {
          font-family: 'Inter', sans-serif; font-size: 14px; font-weight: 700; color: #fff;
        }
        .pct-badge {
          font-family: 'Inter', sans-serif; font-weight: 700; font-size: 12px;
          letter-spacing: 0.04em; border-radius: 6px; white-space: nowrap;
          padding: 4px 8px; background: ${C.cyan}; color: #080c10;
          animation: hfPulse 2s infinite;
        }
        .price-old {
          font-family: 'Inter', sans-serif; text-decoration: line-through;
          color: rgba(180,210,210,0.38); letter-spacing: 0.02em;
        }
        .ribbon {
          position: relative; background: linear-gradient(135deg, ${C.cyan} 0%, ${C.blue} 100%);
          color: #080c10; padding: 2px 6px; font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
        }
        /* --- PATCH EXTRA_CSS END --- */

        .tr-card {
          background: rgba(10,16,22,0.9);
          border: 1px solid rgba(255,255,255,0.06); border-left: none;
          border-radius: 14px; position: relative; overflow: hidden;
          display: flex; align-items: stretch;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .tr-card::before {
          content: ''; position: absolute; top: 0; left: 0; bottom: 0; width: 3px;
          background: var(--ticket-accent, #00d4d4); border-radius: 14px 0 0 14px;
        }
        .tr-card::after {
          content: ''; position: absolute; inset: 0;
          background: radial-gradient(ellipse 60% 100% at 0% 50%, var(--ticket-accent-alpha, rgba(0,212,212,0.07)) 0%, transparent 70%);
          pointer-events: none;
        }
        .tr-card:hover {
          transform: translateX(4px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 24px var(--ticket-accent-shadow, rgba(0,212,212,0.08));
        }
        .tr-hero {
          background: rgba(0,22,26,0.97);
          border: 1px solid rgba(0,200,200,0.18); border-radius: 20px;
          position: relative; overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          box-shadow: 0 0 0 1px rgba(0,200,200,0.06), 0 8px 60px rgba(0,0,0,0.5), 0 0 60px rgba(0,180,180,0.07);
        }
        .tr-hero::before {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
          background: linear-gradient(to right, transparent 0%, rgba(0,200,200,0.55) 30%, rgba(0,200,200,0.55) 70%, transparent 100%);
        }
        .tr-hero::after {
          content: ''; position: absolute; top: 0; left: 0; right: 0; height: 200px;
          background: radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,200,200,0.09) 0%, transparent 100%);
          pointer-events: none;
        }
        .tr-hero:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 0 1px rgba(0,200,200,0.14), 0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(0,180,180,0.1);
        }
        .spray-underline { position: relative; display: inline-block; }
        .spray-underline::after {
          content: ''; position: absolute; left: 0; right: 0; bottom: -4px; height: 4px;
          background: linear-gradient(to right, ${C.cyan}, ${C.blue});
          border-radius: 2px; filter: blur(1px); opacity: 0.7;
        }
        .qty-btn {
          background: none; border: none; cursor: pointer; line-height: 1;
          padding: 0 4px; transition: opacity 0.15s;
        }
        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      <GraffitiCanvas />

      {/* ── SECTION TAB BAR (Desktop) ── */}
      <div className="hidden lg:flex fixed top-16 inset-x-0 z-40 items-center overflow-x-auto hf-scroll-x"
        style={{
          background: 'rgba(8,12,16,0.92)',
          borderBottom: '1px solid rgba(0,212,212,0.12)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        }}>
        {NAV_SECTIONS.map(section => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollTo(section.id)}
              style={{
                flexShrink: 0, padding: '11px 20px', background: 'transparent', border: 'none',
                borderBottom: isActive ? `2px solid ${C.cyan}` : '2px solid transparent',
                color: isActive ? C.cyan : 'rgba(255,255,255,0.38)',
                fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '11px',
                letterSpacing: '0.18em', textTransform: 'uppercase', cursor: 'pointer',
                whiteSpace: 'nowrap', transition: 'all 0.18s ease',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(255,255,255,0.38)'; }}
            >
              {section.label}
            </button>
          );
        })}
      </div>

      {/* ── SIDEBAR NAV (Desktop) ── */}
      <div className="hidden lg:flex fixed left-6 top-1/2 -translate-y-1/2 z-40 flex-col gap-4">
        {NAV_SECTIONS.map(section => {
          const isActive = activeSection === section.id;
          return (
            <div key={section.id} className="group relative flex items-center">
              <button
                type="button"
                onClick={() => scrollTo(section.id)}
                aria-label={section.label}
                style={{
                  width: isActive ? '10px' : '7px', height: isActive ? '10px' : '7px',
                  borderRadius: '50%',
                  background: isActive ? C.cyan : 'rgba(255,255,255,0.25)',
                  border: isActive ? `2px solid ${C.cyan}` : '2px solid rgba(255,255,255,0.2)',
                  boxShadow: isActive ? `0 0 10px ${C.cyan}` : 'none',
                  cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0, padding: 0,
                }}
              />
              <div className="group-hover:opacity-100"
                style={{
                  position: 'absolute', left: '20px', whiteSpace: 'nowrap',
                  background: 'rgba(8,12,16,0.92)',
                  border: `1px solid ${isActive ? 'rgba(0,212,212,0.4)' : 'rgba(255,255,255,0.1)'}`,
                  borderRadius: '8px', padding: '5px 10px', opacity: 0, pointerEvents: 'none',
                  transition: 'opacity 0.18s ease', backdropFilter: 'blur(12px)',
                }}>
                <span style={{
                  fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '11px',
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: isActive ? C.cyan : 'rgba(255,255,255,0.6)',
                }}>
                  {section.emoji} {section.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── TOP NAV ── */}
      <nav className="fixed top-0 w-full z-50 glass" style={{ borderBottom: '1px solid rgba(0,212,212,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate('/')} className="flex items-center gap-2.5 group transition-all hover:opacity-60">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" style={{ color: C.cyan }} />
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '0.18em', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase' }}>DYD</span>
            </button>
            <div className="flex items-center gap-3 sm:gap-6">
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', letterSpacing: '0.18em', color: C.cyan, opacity: 0.55, textTransform: 'uppercase' }}>22.08.2026</span>
              <span className="hidden sm:inline" style={{ color: 'rgba(0,212,212,0.2)', fontSize: '18px' }}>·</span>
              <span className="hidden sm:inline" style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', letterSpacing: '0.22em', color: 'rgba(255,255,255,0.28)', textTransform: 'uppercase' }}>Düsseldorf</span>
            </div>
            <button onClick={() => scrollTo('tickets')} className="btn-cyan flex items-center gap-2 px-5 py-2.5 rounded-lg" style={{ fontSize: '14px' }}>
              <Ticket className="w-3.5 h-3.5" /> Tickets
            </button>
          </div>
        </div>
      </nav>

      {/* ── MOBILE BOTTOM NAV (enthält bereits den Ticket-CTA) ── */}
      <nav
        aria-label="Schnellnavigation"
        className="lg:hidden hf-scroll-x"
        style={{
          position: 'fixed', bottom: '16px', left: '50%', transform: 'translateX(-50%)',
          zIndex: 50, display: 'flex', alignItems: 'center', gap: '4px',
          padding: '6px 8px', borderRadius: '999px', maxWidth: 'calc(100vw - 24px)',
          overflowX: 'auto',
          background: 'rgba(8,12,16,0.88)', border: '1px solid rgba(0,212,212,0.22)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(0,212,212,0.06), 0 0 40px rgba(0,212,212,0.08)',
        }}
      >
        {NAV_SECTIONS.map(section => {
          const isActive = activeSection === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => scrollTo(section.id)}
              aria-label={section.label}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
                padding: isActive ? '7px 14px' : '7px 10px', borderRadius: '999px',
                background: isActive ? 'rgba(0,212,212,0.18)' : 'transparent',
                border: isActive ? '1px solid rgba(0,212,212,0.4)' : '1px solid transparent',
                cursor: 'pointer', transition: 'all 0.2s ease', flexShrink: 0,
                minWidth: isActive ? '76px' : '40px',
                boxShadow: isActive ? '0 0 16px rgba(0,212,212,0.2)' : 'none',
              }}
            >
              <span style={{ fontSize: '16px', lineHeight: 1 }}>{section.emoji}</span>
              {isActive && (
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', fontWeight: 700, letterSpacing: '0.06em', color: C.cyan, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                  {section.label}
                </span>
              )}
            </button>
          );
        })}

        <div style={{ width: '1px', height: '24px', background: 'rgba(0,212,212,0.15)', margin: '0 4px', flexShrink: 0 }} />
        <button
          type="button"
          onClick={() => scrollTo('tickets')}
          style={{
            display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 14px',
            borderRadius: '999px', background: `linear-gradient(135deg, ${C.cyan} 0%, ${C.blue} 100%)`,
            border: 'none', cursor: 'pointer', flexShrink: 0,
            boxShadow: '0 4px 16px rgba(0,212,212,0.35)',
          }}
        >
          <Ticket style={{ width: '13px', height: '13px', color: '#080c10', flexShrink: 0 }} />
          <span style={{ fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', color: '#080c10', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Tickets
          </span>
        </button>
      </nav>

      {payStatus === 'success' && (
        <div className="fixed top-16 inset-x-0 z-40" style={{ backgroundColor: 'rgba(0,212,212,0.07)', borderBottom: '1px solid rgba(0,212,212,0.2)', backdropFilter: 'blur(16px)' }}>
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: C.cyan }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: C.cyan }}>Zahlung erfolgreich! Dein Ticket kommt per E-Mail.</p>
          </div>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="relative z-10">
        <motion.div className="relative w-full" style={{ paddingTop: '106px', y: bannerY, opacity: bannerOp }}>
          <img src="/22.08.2026_(2).jpg" alt="Harmony Festival 2026"
            style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'cover', objectPosition: 'center top' }} />
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(0,212,212,0.05) 0%, transparent 25%)' }} />
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '220px', background: `linear-gradient(to bottom, transparent 0%, rgba(8,12,16,0.55) 50%, ${C.bg} 100%)` }} />
        </motion.div>

        <div className="relative pointer-events-none" style={{ height: '2px', background: `linear-gradient(to right, transparent 0%, ${C.cyan}55 25%, ${C.blue}70 50%, ${C.cyan}55 75%, transparent 100%)`, filter: 'blur(1px)', marginTop: '-2px' }} />

        <div className="absolute left-0 right-0 pointer-events-none" style={{
          top: '64px', height: '520px',
          background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,212,212,0.09) 0%, rgba(30,144,212,0.05) 40%, transparent 100%)',
          zIndex: 1,
        }} />

        <div className="relative max-w-6xl mx-auto px-6 sm:px-10 pt-12 pb-20" style={{ zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}>
            <div className="tag-label mb-4">Ein Abend für Düsseldorf · 22. August 2026</div>

            <h1 className="graffiti" style={{
              fontSize: 'clamp(72px, 16vw, 180px)', lineHeight: 0.86, color: '#ffffff', marginBottom: '8px',
              textShadow: '0 0 80px rgba(0,212,212,0.35), 0 0 140px rgba(30,144,212,0.2)',
            }}>
              Har<span style={{ color: C.cyan, textShadow: `0 0 40px ${C.cyan}` }}>mo</span>ny
            </h1>
            <div className="graffiti-italic mb-3" style={{ fontSize: 'clamp(18px, 3vw, 32px)', color: 'rgba(255,255,255,0.45)', letterSpacing: '0.12em' }}>
              DYD · Decide Your Dream
            </div>
            <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontStyle: 'italic', fontSize: 'clamp(16px, 2.2vw, 22px)', color: `${C.cyan}cc`, letterSpacing: '0.04em', marginBottom: '32px', lineHeight: 1.3 }}>
              Andere Ansichten, gleicher Wunsch: Glücklich sein.
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-8 mb-10">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: C.cyan }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '15px', color: 'rgba(180,240,240,0.8)' }}>Burgplatz, Düsseldorf</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 flex-shrink-0" style={{ color: C.sky }} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '15px', color: 'rgba(180,240,240,0.8)' }}>Einlass 16:00 · Start 16:30 – 02:00 Uhr</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => scrollTo('tickets')}
                className="btn-cyan inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-xl"
                style={{ fontSize: '17px' }}>
                <Ticket className="w-5 h-5" /> Ticket sichern · Bundle {eur(HERO.price)}
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => scrollTo('programm')}
                className="btn-ghost-cyan inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl"
                style={{ fontSize: '16px' }}>
                Programm <ChevronDown className="w-4 h-4" />
              </motion.button>
            </div>
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,210,210,0.45)', marginTop: '14px' }}>
              Einzeltickets ab {eur(CHEAPEST_SINGLE)} · Bundle spart {eur(HERO_SAVINGS)} gegenüber Einzelkauf
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── COUNTDOWN ── */}
      <section className="relative z-10 py-20" style={{ borderTop: '1px solid rgba(0,212,212,0.1)', borderBottom: '1px solid rgba(0,212,212,0.1)' }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left">
              <div className="tag-label mb-4">Noch</div>
              <div className="flex items-end justify-center lg:justify-start gap-1 sm:gap-3">
                <CDUnit value={cd.d} label="Tage" />
                <span style={{ fontSize: 'clamp(30px, 5vw, 60px)', color: `${C.cyan}50`, fontFamily: "'Bebas Neue', sans-serif", paddingBottom: '26px' }}>:</span>
                <CDUnit value={cd.h} label="Std" />
                <span style={{ fontSize: 'clamp(30px, 5vw, 60px)', color: `${C.cyan}50`, fontFamily: "'Bebas Neue', sans-serif", paddingBottom: '26px' }}>:</span>
                <CDUnit value={cd.m} label="Min" />
                <span style={{ fontSize: 'clamp(30px, 5vw, 60px)', color: `${C.cyan}50`, fontFamily: "'Bebas Neue', sans-serif", paddingBottom: '26px' }}>:</span>
                <CDUnit value={cd.s} label="Sek" />
              </div>
            </div>
            <div className="hidden lg:block w-px self-stretch" style={{ background: 'rgba(0,212,212,0.1)' }} />
            <div className="flex-1 max-w-md">
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(20px, 3vw, 30px)', color: 'rgba(255,255,255,0.88)', lineHeight: 1.38, marginBottom: '14px' }}>
                „Ich lade dich ein in meinen Safe Space am Rhein.“
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.65)', lineHeight: 1.8 }}>
                Inspiriert vom Harmony Beach, angetrieben von meiner Vision für DYD. Erlebe Musik, echte Begegnung und mein liebstes Bier aus der Heimat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT ── */}
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 pb-32">

          {/* PROGRAMM */}
          <section id="programm" className="pt-24">
            <motion.div {...fadeUp} className="flex items-end justify-between mb-12">
              <div>
                <div className="tag-label mb-3">Das Programm</div>
                <h2 className="graffiti" style={{ fontSize: 'clamp(48px, 8vw, 88px)', color: '#fff', lineHeight: 0.9 }}>
                  Ein Abend,<br /><span className="spray-underline" style={{ color: C.cyan }}>Vier Acts</span>
                </h2>
              </div>
              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', letterSpacing: '0.22em', color: `${C.cyan}50`, textTransform: 'uppercase', paddingBottom: '6px' }}>22.08.2026</span>
            </motion.div>

            <div className="rounded-2xl overflow-hidden glass" style={{ border: '1px solid rgba(0,212,212,0.1)' }}>
              {ACTS.map((act, i) => (
                <motion.div key={act.num} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="act-row flex items-center gap-6 sm:gap-10 px-6 sm:px-10 py-6 sm:py-7">
                  <span className="graffiti hidden sm:block flex-shrink-0" style={{ fontSize: 'clamp(38px, 5vw, 56px)', color: `${act.color}18`, lineHeight: 1 }}>{act.num}</span>
                  <div className="w-1 self-stretch flex-shrink-0 rounded-full" style={{ backgroundColor: act.color, minHeight: '48px', boxShadow: `0 0 12px ${act.color}60` }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: act.color, marginBottom: '5px', opacity: 0.9 }}>
                      {act.time} Uhr
                    </div>
                    <h3 className="graffiti" style={{ fontSize: 'clamp(22px, 3.5vw, 36px)', color: '#fff' }}>{act.label}</h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(160,230,230,0.5)', marginTop: '2px' }}>{act.sub}</p>
                  </div>
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${act.color}10`, border: `1px solid ${act.color}28`, boxShadow: `0 0 20px ${act.color}20` }}>
                    <act.icon className="w-5 h-5" style={{ color: act.color }} />
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <div className="divider" />

          <PosterSwitcher />

          <div className="divider" />

          {/* WARUM */}
          <section>
            <motion.div {...fadeUp} className="mb-12">
              <div className="tag-label mb-3">Warum Harmony?</div>
              <h2 className="graffiti" style={{ fontSize: 'clamp(48px, 8vw, 88px)', color: '#fff', lineHeight: 0.9 }}>
                Musik bringt<br /><span style={{ color: C.cyan, textShadow: `0 0 40px ${C.cyan}55` }}>uns zusammen</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              {[
                { n: '01', label: 'Offen für alle', sub: 'Humane Preise, kein VIP-Bullshit', color: C.orange },
                { n: '02', label: 'Nicht kommerziell', sub: 'Authentische Künstler, echte Energie', color: C.cyan },
                { n: '03', label: 'You will always remember', sub: 'Mix aus allen Genres, für alle Menschen', color: C.sky },
              ].map((item, i) => (
                <motion.div key={item.n} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1 }}
                  className="glass rounded-2xl p-7 relative overflow-hidden"
                  style={{ border: '1px solid rgba(0,212,212,0.1)' }}>
                  <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${item.color}70, transparent)` }} />
                  <span className="graffiti" style={{ fontSize: '42px', color: `${item.color}18`, lineHeight: 1 }}>{item.n}</span>
                  <h3 className="graffiti" style={{ fontSize: 'clamp(19px, 2.6vw, 24px)', color: '#fff', marginTop: '8px', marginBottom: '8px' }}>{item.label}</h3>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.65 }}>{item.sub}</p>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.7 }} className="glass-cyan rounded-2xl py-8 px-8 sm:px-10">
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(18px, 2.8vw, 26px)', color: 'rgba(255,255,255,0.92)', lineHeight: 1.45, marginBottom: '20px' }}>
                „Ich habe das Gefühl, wir stecken in Deutschland gerade mitten in einer tiefen Spaltung. Wir reden oft mehr übereinander als miteinander. Aber ich weiß, dass es einen Weg zurück gibt.“
              </p>
              <div style={{ width: '40px', height: '2px', background: `linear-gradient(to right, ${C.cyan}, transparent)`, marginBottom: '20px', borderRadius: '2px' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.65)', lineHeight: 1.85, marginBottom: '16px' }}>
                Auf Jamaika war es in den 70ern genau das Gleiche: Das Land war zerrissen, bis die Musik – vor allem der Reggae – die Menschen wieder zusammengebracht hat. Heute ist Jamaika laut, unfassbar lebendig und geprägt von einem krassen Zusammenhalt. Klar, als Tourist ist es manchmal anstrengend, und beim „Abziehen“ sind sie leider auch ganz vorne mit dabei – aber genau das gehört zu dieser rohen, echten Energie.
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.65)', lineHeight: 1.85 }}>
                Mitten in diesem lauten Getümmel der Innenstadt von Montego Bay liegt der Harmony Beach. Dieser Strand hat mir neben einem wundervollen Ausblick vor allem eines gegeben: Die Kraft, wieder zurück ins Getümmel zu gehen. Genau so einen Platz möchte ich mit Harmony nach Düsseldorf bringen – ein Ort, an dem wir kurz durchatmen, die Vorurteile vergessen und uns darauf konzentrieren, was wir alle wollen: Einfach glücklich sein und eine geile Zeit haben.
              </p>
            </motion.div>
          </section>

          <div className="divider" />

          {/* DYD MISSION */}
          <motion.section {...fadeUp}>
            <div className="glass-cyan rounded-2xl px-8 sm:px-12 py-10">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,212,212,0.12)', border: '1px solid rgba(0,212,212,0.28)' }}>
                  <Heart className="w-5 h-5" style={{ color: C.cyan }} />
                </div>
                <div>
                  <div className="tag-label mb-1">Mehr als nur Feiern</div>
                  <h2 className="graffiti" style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', color: '#fff' }}>DYD – Decide Your Dream</h2>
                </div>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.65)', lineHeight: 1.8, marginBottom: '12px' }}>
                Hinter dem Festival steht meine Plattform <strong style={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>DYD (Decide Your Dream)</strong>. Ich kämpfe für faire Bewerbungschancen, denn ich bin überzeugt: Echte Chancen entstehen dort, wo Menschen sich auf Augenhöhe begegnen –
              </p>
              <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontStyle: 'italic', fontSize: 'clamp(15px, 2vw, 18px)', color: `${C.cyan}cc`, lineHeight: 1.5, marginBottom: '16px' }}>
                egal ob am Lebenslauf oder am Tresen.
              </p>
              <button onClick={() => navigate('/cv-check')} className="btn-ghost-cyan inline-flex items-center gap-2 px-5 py-2.5 rounded-lg" style={{ fontSize: '14px' }}>
                CV checken &amp; optimieren <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.section>

          <div className="divider" />

          {/* FEATURES */}
          <section>
            <motion.div {...fadeUp} className="mb-10">
              <div className="tag-label mb-3">Was Harmony besonders macht</div>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Users, title: 'Für alle', desc: 'Fair, zugänglich und gemeinsam gestaltet.', color: C.sky },
                { icon: Mic, title: 'Neue Talente', desc: 'Bühne für lokale Künstlerinnen und Künstler, die gehört werden wollen.', color: C.cyan },
                { icon: Handshake, title: 'Offene Räume', desc: 'Begegnung, Workshops und kultureller Austausch in entspannter Atmosphäre.', color: C.lime },
                { icon: Music, title: 'Musik & Miteinander', desc: 'Nicht kommerziell – echter Fokus auf Verbindung.', color: C.orange },
              ].map((f, i) => (
                <motion.div key={f.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }} whileHover={{ y: -3 }}
                  className="glass rounded-2xl p-6 flex gap-5 items-start">
                  <div className="w-11 h-11 rounded-xl flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: `${f.color}10`, border: `1px solid ${f.color}25`, boxShadow: `0 0 18px ${f.color}18` }}>
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <div>
                    <h3 className="graffiti" style={{ fontSize: '22px', color: '#fff', marginBottom: '5px' }}>{f.title}</h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.7 }}>{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </section>

          <div className="divider" />

          {/* BIER-BRÜCKE */}
          <motion.section {...fadeUp}>
            <div className="glass rounded-2xl px-8 sm:px-12 py-10" style={{ border: '1px solid rgba(200,232,64,0.14)' }}>
              <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
                <div>
                  <div className="tag-label mb-2" style={{ color: C.lime, opacity: 0.65 }}>Partner</div>
                  <div className="flex items-center gap-3">
                    <Beer className="w-6 h-6" style={{ color: C.lime }} />
                    <h2 className="graffiti" style={{ fontSize: 'clamp(28px, 4vw, 42px)', color: '#fff' }}>Die Bier-Brücke</h2>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="price-num" style={{ fontSize: 'clamp(52px, 9vw, 84px)', color: C.lime, textShadow: `0 0 32px ${C.lime}55` }}>4,00 €</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(200,232,64,0.5)', fontWeight: 500 }}>/ 0,5 l</span>
                </div>
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.6)', lineHeight: 1.75, marginBottom: '20px' }}>
                Als Fürther bringe ich echtes Handwerk aus meiner Heimat mit nach Düsseldorf.
              </p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { file: 'gruner_bier_radeberger_gruppe_41338-167277218.png', name: 'Grüner Bier' },
                  { file: 'Hofmann.png', name: 'Hofmann' },
                  { file: 'brauerei-greif.png', name: 'Greif Bräu' },
                ].map(brand => (
                  <motion.div key={brand.name} whileHover={{ y: -3 }}
                    className="flex flex-col items-center gap-3 rounded-xl py-6 px-3"
                    style={{ background: 'rgba(200,232,64,0.04)', border: '1px solid rgba(200,232,64,0.1)' }}>
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: '#fff' }}>
                      <img src={`/${brand.file}`} alt={brand.name} loading="lazy" className="w-full h-full object-contain p-2" />
                    </div>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: 'rgba(200,232,64,0.55)', letterSpacing: '0.04em', textAlign: 'center' }}>{brand.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <div className="divider" />

          {/* CREW-DEAL */}
          <motion.section id="crew" {...fadeUp}>
            <div className="glass rounded-2xl px-8 sm:px-12 py-10">
              <div className="flex items-start justify-between flex-wrap gap-5 mb-6">
                <div>
                  <div className="tag-label mb-3">Community</div>
                  <h2 className="graffiti" style={{ fontSize: 'clamp(32px, 5vw, 54px)', color: '#fff' }}>Crew-Deal</h2>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.55)', marginTop: '8px' }}>Kein Budget? Kein Problem. Hilf mit — und komm gratis rein.</p>
                </div>
                <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ repeat: Infinity, duration: 2.5 }}
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.cyan, padding: '5px 12px', border: '1px solid rgba(0,212,212,0.28)', borderRadius: '6px', alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>Spots limitiert</motion.span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'Dein Einsatz', value: '2,5 h Theke oder Service' },
                  { label: 'Dein Benefit', value: 'Freies Ticket für den restlichen Abend' },
                ].map(item => (
                  <div key={item.label} className="rounded-xl p-6" style={{ background: 'rgba(0,212,212,0.04)', border: '1px solid rgba(0,212,212,0.1)' }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.cyan, opacity: 0.5, marginBottom: '10px' }}>{item.label}</p>
                    <p className="graffiti" style={{ fontSize: '22px', color: '#fff' }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.45)', marginBottom: '20px' }}>
                Anmeldung dauert unter 1 Minute — nur ein kurzes Formular, kein Account nötig.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2.2 }}
                  className="flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: C.cyan }}>
                  <Clock className="w-3.5 h-3.5" /> Deadline: 15.07.2026
                </motion.div>
                <motion.a whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                  href="https://forms.gle/iX7CoWsBXTrausYM7" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-lg"
                  style={{ background: 'rgba(0,212,212,0.15)', border: '1px solid rgba(0,212,212,0.5)', color: C.cyan, fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, letterSpacing: '0.03em', boxShadow: '0 0 18px rgba(0,212,212,0.12)', textDecoration: 'none' }}>
                  <ArrowRight className="w-4 h-4" /> Jetzt als Crew bewerben
                </motion.a>
              </div>
            </div>
          </motion.section>

          <div className="divider" />

          {/* UNTERSTÜTZEN */}
          <motion.section id="unterstuetzen" {...fadeUp}>
            <div className="relative rounded-2xl overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,212,212,0.08) 0%, rgba(30,144,212,0.06) 100%)', border: '1px solid rgba(0,212,212,0.2)' }}>
              <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(to right, transparent, ${C.cyan}90, ${C.blue}80, transparent)` }} />
              <div className="px-8 sm:px-12 py-10">
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,212,212,0.12)', border: '1px solid rgba(0,212,212,0.28)' }}>
                    <Sparkles className="w-5 h-5" style={{ color: C.cyan }} />
                  </div>
                  <div>
                    <div className="tag-label mb-1">Community Support</div>
                    <h2 className="graffiti" style={{ fontSize: 'clamp(28px, 4.5vw, 52px)', color: '#fff', lineHeight: 0.95 }}>
                      Harmony finanziell<br /><span style={{ color: C.cyan, textShadow: `0 0 32px ${C.cyan}55` }}>unterstützen</span>
                    </h2>
                  </div>
                </div>

                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.65)', lineHeight: 1.8, marginBottom: '8px', maxWidth: '620px' }}>
                  Du kannst nicht dabei sein – aber du glaubst an die Idee? Dann unterstütz Harmony von zuhause aus.
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(160,230,230,0.45)', lineHeight: 1.75, marginBottom: '20px', maxWidth: '620px' }}>
                  Harmony ist ein privates Festival – kein Konzern, kein Sponsor-Budget, nur echte Leidenschaft. Jeder Euro geht direkt in Technik, Künstlergagen und die Atmosphäre, die diesen Abend besonders macht.
                </p>

                <div className="mb-6" style={{ maxWidth: '320px' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '12px', color: 'rgba(0,212,212,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Offizieller Sponsor</div>
                  <div className="rounded-xl px-5 py-4" style={{ background: '#fff' }}>
                    <img src="/SSKDD_Logo3.png" alt="Stadtsparkasse Düsseldorf – Offizieller Sponsor" loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} />
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleSupport}
                  disabled={loadingId !== null}
                  className="btn-cyan inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontSize: '15px' }}>
                  {loadingId === 'support'
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Weiterleitung…</>
                    : <><Heart className="w-4 h-4" /> Jetzt unterstützen</>}
                </motion.button>
              </div>
            </div>
          </motion.section>

          <div className="divider" />

          {/* SPONSOREN */}
          <motion.section id="sponsoren" {...fadeUp}>
            <div className="mb-10">
              <div className="tag-label mb-3">Partner &amp; Sponsoren</div>
              <h2 className="graffiti" style={{ fontSize: 'clamp(42px, 7vw, 78px)', color: '#fff', lineHeight: 0.9 }}>
                Werde lokaler<br /><span style={{ color: C.cyan, textShadow: `0 0 40px ${C.cyan}55` }}>Sponsor</span>
              </h2>
            </div>

            <div className="glass-cyan rounded-2xl px-8 sm:px-12 py-10 mb-6">
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.7)', lineHeight: 1.85, marginBottom: '24px' }}>
                Harmony zieht ein junges, engagiertes Düsseldorfer Publikum an – genau die Menschen, die lokale Marken lieben und weiterempfehlen. Als Sponsor wirst du nicht nur sichtbar, sondern wirklich Teil dieser Bewegung.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mb-8">
                {[
                  { icon: Star, title: 'Logo auf allen Materialien', desc: 'Print, Digital, Social Media – dein Brand überall sichtbar.', color: C.cyan },
                  { icon: Mic, title: 'Nennung auf der Bühne', desc: 'Dein Unternehmen wird vor dem Publikum vorgestellt.', color: C.sky },
                  { icon: Users, title: 'Direkter Kundenkontakt', desc: 'Stand oder Präsenz vor Ort – echte Begegnung mit deiner Zielgruppe.', color: C.lime },
                  { icon: Heart, title: 'Regionale Identität stärken', desc: 'Als lokaler Partner zeigst du, dass du Düsseldorf liebst.', color: C.orange },
                ].map((perk, i) => (
                  <motion.div key={perk.title} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="flex items-start gap-4 rounded-xl p-5"
                    style={{ background: 'rgba(0,212,212,0.03)', border: '1px solid rgba(0,212,212,0.1)' }}>
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${perk.color}10`, border: `1px solid ${perk.color}22` }}>
                      <perk.icon className="w-4 h-4" style={{ color: perk.color }} />
                    </div>
                    <div>
                      <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '16px', color: '#fff', marginBottom: '3px' }}>{perk.title}</h4>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.5)', lineHeight: 1.6 }}>{perk.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mb-6 rounded-2xl p-6" style={{ background: 'rgba(232,51,10,0.06)', border: '1px solid rgba(232,51,10,0.2)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#E8330A', boxShadow: '0 0 8px #E8330A88' }} />
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: 'rgba(232,51,10,0.9)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Offizieller Sponsor
                  </div>
                </div>
                <div className="rounded-xl px-6 py-5 mb-4" style={{ background: '#fff', maxWidth: '380px' }}>
                  <img src="/SSKDD_Logo3.png" alt="Stadtsparkasse Düsseldorf" loading="lazy" style={{ display: 'block', width: '100%', height: 'auto' }} />
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.65 }}>
                  Die Stadtsparkasse Düsseldorf ist offizieller Sponsor von Harmony – und zeigt damit, wie ein starker lokaler Partner aussieht.
                </p>
              </div>

              {[
                { color: '#B43C14', labelColor: 'rgba(220,100,60,0.9)', bg: 'rgba(180,60,20,0.06)', border: 'rgba(180,60,20,0.2)', file: 'logo_fuechschen-alt.jpg', name: 'Füchschen Alt', desc: 'Eine traditionelle Brauerei aus der Düsseldorfer Altstadt – echtes Altbier, echter Charakter. Füchschen bringt die Altstadt-Seele zu Harmony.' },
                { color: '#DC2828', labelColor: 'rgba(220,80,60,0.9)', bg: 'rgba(220,40,40,0.05)', border: 'rgba(220,40,40,0.18)', file: 'monsterslush-logo.png', name: 'Monsterslush', desc: 'Kühle Erfrischung für heiße Abende – Monsterslush sorgt dafür, dass auf Harmony niemand dursten muss.' },
              ].map(s => (
                <div key={s.name} className="mb-6 rounded-2xl p-6" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-2 h-2 rounded-full" style={{ background: s.color, boxShadow: `0 0 8px ${s.color}88` }} />
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: s.labelColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      Lokaler Sponsor
                    </div>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="rounded-xl p-3 flex-shrink-0" style={{ background: '#fff', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={`/${s.file}`} alt={s.name} loading="lazy" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                    </div>
                    <div>
                      <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '20px', color: '#fff', marginBottom: '4px' }}>{s.name}</h4>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.65 }}>{s.desc}</p>
                    </div>
                  </div>
                </div>
              ))}

              <div className="mb-6 rounded-2xl p-6" style={{ background: 'rgba(0,140,212,0.05)', border: '1px solid rgba(0,140,212,0.18)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: C.sky, boxShadow: `0 0 8px ${C.sky}88` }} />
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: 'rgba(100,190,255,0.9)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Reichweite &amp; Sichtbarkeit
                  </div>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(160,230,230,0.65)', lineHeight: 1.7, marginBottom: '20px' }}>
                  Harmony ist dort zu finden, wo Düsseldorf unterwegs ist – auf den größten lokalen Plattformen der Stadt.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { file: 'Mr._Duesseldorf.png', name: 'Mr. Düsseldorf' },
                    { file: 'Visit_Dusseldorf.png', name: 'Visit Düsseldorf' },
                    { file: 'rausgegangen.png', name: 'Rausgegangen' },
                  ].map(p => (
                    <motion.div key={p.name} whileHover={{ y: -2 }}
                      className="flex flex-col items-center gap-3 rounded-xl py-5 px-3"
                      style={{ background: 'rgba(0,140,212,0.04)', border: '1px solid rgba(0,140,212,0.12)' }}>
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: '#fff' }}>
                        <img src={`/${p.file}`} alt={p.name} loading="lazy" className="w-full h-full object-contain p-2" />
                      </div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '12px', color: 'rgba(160,210,255,0.75)', textAlign: 'center', lineHeight: 1.3 }}>{p.name}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="mb-7 rounded-2xl p-6" style={{ background: 'rgba(200,232,64,0.04)', border: '1px solid rgba(200,232,64,0.12)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Beer className="w-5 h-5" style={{ color: C.lime }} />
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '17px', color: '#fff', letterSpacing: '0.06em' }}>
                    Bereits an Bord: Die Bier-Brücke
                  </div>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.5)', lineHeight: 1.7, marginBottom: '16px' }}>
                  Als Fürther bringe ich echtes fränkisches Handwerk mit nach Düsseldorf – und mit Füchschen Alt eine echte Altstadt-Legende direkt aus Düsseldorf.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { file: 'gruner_bier_radeberger_gruppe_41338-167277218.png', name: 'Grüner Bier', city: 'Fürth' },
                    { file: 'Hofmann.png', name: 'Hofmann', city: 'Pahres' },
                    { file: 'brauerei-greif.png', name: 'Greif Bräu', city: 'Forchheim' },
                    { file: 'logo_fuechschen-alt.jpg', name: 'Füchschen Alt', city: 'Düsseldorf' },
                  ].map(brand => (
                    <motion.div key={brand.name} whileHover={{ y: -2 }}
                      className="flex flex-col items-center gap-2 rounded-xl py-5 px-3"
                      style={{ background: 'rgba(200,232,64,0.04)', border: '1px solid rgba(200,232,64,0.1)' }}>
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white overflow-hidden">
                        <img src={`/${brand.file}`} alt={brand.name} loading="lazy" className="w-full h-full object-contain p-1.5" />
                      </div>
                      <div className="text-center">
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: 'rgba(200,232,64,0.7)', marginBottom: '1px' }}>{brand.name}</div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em' }}>{brand.city}</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <div className="rounded-xl p-5 mb-7" style={{ background: 'rgba(200,232,64,0.05)', border: '1px solid rgba(200,232,64,0.14)' }}>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontStyle: 'italic', fontSize: 'clamp(15px, 2.2vw, 20px)', color: 'rgba(255,255,255,0.85)', lineHeight: 1.45, marginBottom: '10px' }}>
                  „Sponsoring bei Harmony bedeutet nicht, Werbefläche zu mieten – es bedeutet, Teil einer echten Community-Geschichte zu werden.“
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '2px', background: `linear-gradient(to right, ${C.lime}, transparent)`, borderRadius: '2px' }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(200,232,64,0.5)', letterSpacing: '0.1em' }}>DYD – Decide Your Dream</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  href="mailto:kontakt.dyd@googlemail.com?subject=Sponsoring%20Harmony%202026"
                  className="btn-cyan inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl"
                  style={{ fontSize: '15px', textDecoration: 'none' }}>
                  <Building2 className="w-4 h-4" /> Sponsoring anfragen
                </motion.a>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.4)', lineHeight: 1.6 }}>
                  Kontakt: kontakt.dyd@googlemail.com
                </span>
              </div>
            </div>
          </motion.section>

          <div className="divider" />

          {/* MEINE TICKETS */}
          {user && (purchasedTickets.length > 0 || loadingTickets) && (
            <>
              <section>
                <motion.div {...fadeUp} className="mb-8">
                  <div className="tag-label mb-3">Meine Tickets</div>
                  <h2 className="graffiti" style={{ fontSize: 'clamp(36px, 6vw, 64px)', color: '#fff', lineHeight: 0.9 }}>
                    Deine <span style={{ color: C.cyan }}>Eintrittskarten</span>
                  </h2>
                </motion.div>

                {loadingTickets ? (
                  <div className="flex items-center gap-3 py-8" style={{ color: 'rgba(160,230,230,0.4)', fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
                    <Loader2 className="w-4 h-4 animate-spin" /> Tickets werden geladen…
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {purchasedTickets.map(t => {
                      const ticketDef = TICKETS.find(tk => tk.id === t.ticket_type);
                      const accent = ticketDef?.accent || C.cyan;
                      return (
                        <motion.div key={t.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                          className="relative rounded-2xl overflow-hidden"
                          style={{ background: 'rgba(0,180,180,0.04)', border: `1px solid ${accent}22`, boxShadow: `0 0 40px ${accent}08` }}>
                          <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(to right, transparent, ${accent}80, transparent)` }} />
                          <div className="p-6">
                            <div className="flex items-start justify-between gap-3 mb-4">
                              <div>
                                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: accent, opacity: 0.7, marginBottom: '6px' }}>
                                  HARMONY 2026 · Festival Ticket
                                </p>
                                <h3 className="graffiti" style={{ fontSize: 'clamp(20px, 3vw, 26px)', color: '#fff', lineHeight: 1 }}>{t.ticket_label}</h3>
                              </div>
                              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-1" style={{ color: accent }} />
                            </div>

                            <div className="grid grid-cols-2 gap-3 mb-4">
                              {t.buyer_name && (
                                <div>
                                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.4)', marginBottom: '3px' }}>Name</p>
                                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: '15px', color: 'rgba(255,255,255,0.88)' }}>{t.buyer_name}</p>
                                </div>
                              )}
                              <div>
                                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.4)', marginBottom: '3px' }}>Datum</p>
                                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: '15px', color: 'rgba(255,255,255,0.88)' }}>22.08.2026</p>
                              </div>
                              <div>
                                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.4)', marginBottom: '3px' }}>Location</p>
                                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: '15px', color: 'rgba(255,255,255,0.88)' }}>Klub Kulb, Düsseldorf</p>
                              </div>
                              {t.ticket_number && (
                                <div>
                                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.4)', marginBottom: '3px' }}>Ticket-Nr.</p>
                                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: '13px', color: accent, letterSpacing: '0.05em' }}>{t.ticket_number}</p>
                                </div>
                              )}
                              {t.shirt_size && (
                                <div>
                                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.4)', marginBottom: '3px' }}>Größe</p>
                                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: '15px', color: 'rgba(255,255,255,0.88)' }}>{t.shirt_size}</p>
                                </div>
                              )}
                            </div>

                            {t.bierpong_team_name && (
                              <div className="mt-3 rounded-xl p-4" style={{ background: 'rgba(200,232,64,0.05)', border: '1px solid rgba(200,232,64,0.18)' }}>
                                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.lime, opacity: 0.7, marginBottom: '8px' }}>
                                  Bierpong-Team
                                </p>
                                <div className="flex flex-wrap gap-4">
                                  <div>
                                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(160,230,230,0.4)', marginBottom: '2px' }}>Teamname</p>
                                    <p className="graffiti" style={{ fontSize: '18px', color: C.lime }}>{t.bierpong_team_name}</p>
                                  </div>
                                  {t.bierpong_partner_name && (
                                    <div>
                                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(160,230,230,0.4)', marginBottom: '2px' }}>Teammitglied</p>
                                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, fontSize: '15px', color: 'rgba(255,255,255,0.88)' }}>{t.bierpong_partner_name}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: '1px solid rgba(0,212,212,0.08)' }}>
                              <div className="flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(160,230,230,0.4)' }}>
                                <MapPin className="w-3 h-3" /> Burgplatz · 16:30–02:00 Uhr
                              </div>
                              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '16px', color: accent }}>
                                {t.amount_paid ? eur(t.amount_paid / 100) : ''}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </section>
              <div className="divider" />
            </>
          )}

          {/* HOW IT WORKS */}
          <motion.section {...fadeUp} className="mb-16">
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              {[
                { step: '1', icon: Ticket, title: 'Ticket kaufen', desc: 'Online bezahlen · dauert 60 Sekunden' },
                { step: '2', icon: Mail, title: 'E-Mail erhalten', desc: 'Dein Ticket landet sofort im Postfach' },
                { step: '3', icon: CheckCircle, title: 'Am Einlass vorzeigen', desc: 'Digital auf dem Handy – kein Ausdruck nötig' },
              ].map(item => (
                <div key={item.step} className="flex flex-col items-center text-center gap-3 p-4 sm:p-6 rounded-2xl"
                  style={{ background: 'rgba(0,212,212,0.04)', border: '1px solid rgba(0,212,212,0.1)' }}>
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(0,212,212,0.1)', border: '1px solid rgba(0,212,212,0.2)' }}>
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: C.cyan }} />
                  </div>
                  <div>
                    <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', letterSpacing: '0.1em', color: '#fff', marginBottom: '4px' }}>{item.title}</p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(160,210,210,0.5)', lineHeight: 1.5 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>

          {/* ── TICKETS ── */}
          <section id="tickets">
            <motion.div {...fadeUp} className="mb-12">
              <div className="tag-label mb-4">Tickets</div>
              <h2 className="graffiti" style={{ fontSize: 'clamp(48px, 8vw, 88px)', color: '#fff', lineHeight: 0.9 }}>
                Sei dabei am<br /><span style={{ color: 'rgba(0,195,195,0.85)' }}>22.08.2026</span>
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(180,210,210,0.45)', marginTop: '16px', lineHeight: 1.7, maxWidth: '520px' }}>
                Mit deinem Kauf unterstützt du direkt DYD und faire Ausbildungschancen.
              </p>
            </motion.div>

            {error && (
              <div role="alert" className="mb-8 p-4 rounded-xl text-center"
                style={{ background: 'rgba(240,120,32,0.07)', border: `1px solid ${C.orange}28`, color: C.orange, fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
                {error}
              </div>
            )}

            {/* HERO BUNDLE */}
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
              transition={{ duration: 0.55 }} className="tr-hero mb-5">
              <div className="relative z-10 p-7 sm:p-10">
                <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full"
                  style={{ background: 'rgba(0,212,212,0.08)', border: '1px solid rgba(0,212,212,0.25)' }}>
                  <Heart className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.cyan }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 700, color: C.cyan }}>
                    100% privat organisiert – kein Konzern, keine Marge. Nur echte Kosten.
                  </span>
                </div>

                {HERO.badge && (
                  <div className="flex items-center gap-3 mb-5 flex-wrap">
                    <span style={{
                      fontFamily: "'Bebas Neue', sans-serif", fontSize: '11px', letterSpacing: '0.28em',
                      fontWeight: 900, textTransform: 'uppercase', padding: '4px 14px', borderRadius: '4px',
                      backgroundColor: 'rgba(0,200,200,0.22)', color: '#00c8c8', border: '1px solid rgba(0,200,200,0.45)',
                    }}>
                      {HERO.badge}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3 h-3" style={{ color: 'rgba(0,175,175,0.5)' }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(0,175,175,0.5)' }}>
                        Meistgewählt · Bestes Angebot
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10 mb-7">
                  <div className="flex-1 min-w-0">
                    <h3 className="graffiti" style={{ fontSize: 'clamp(30px, 5vw, 52px)', color: '#fff', lineHeight: 0.9, marginBottom: '12px' }}>
                      {HERO.label}
                    </h3>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(180,230,230,0.55)', lineHeight: 1.7, maxWidth: '480px' }}>
                      {HERO.description}
                    </p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: 'rgba(0,212,212,0.75)', marginTop: '10px', lineHeight: 1.5 }}>
                      Vermutlich das günstigste Festival, auf dem du diesen Sommer in Düsseldorf sein wirst.
                    </p>
                  </div>

                  {/* Preisblock: Vergleichspreis berechnet, nicht hardcodiert */}
                  <div className="flex-shrink-0 sm:text-right">
                    {HERO.compareAt && (
                      <div className="flex items-center sm:justify-end gap-2 mb-1 flex-wrap">
                        <span className="price-old" style={{ fontSize: '12px' }}>{eur(HERO.compareAt)}</span>
                        <span className="save-pill px-2 py-0.5"
                          style={{ fontSize: '11px', background: 'rgba(0,160,160,0.1)', color: 'rgba(0,185,185,0.85)', border: '1px solid rgba(0,160,160,0.25)' }}>
                          −{eur(HERO_SAVINGS)} sparen
                        </span>
                      </div>
                    )}
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(0,175,175,0.35)', marginBottom: '2px' }}>Bundlepreis</div>
                    <span className="price-num" style={{ fontSize: 'clamp(36px, 6vw, 58px)', color: '#00c8c8', lineHeight: 1 }}>
                      {eur(HERO.price)}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {[
                    { icon: Mic, label: 'Zirkel.WTF Live' },
                    { icon: Laugh, label: 'Stand-Up Comedy' },
                    { icon: Disc3, label: 'DJ Night' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 px-3.5 py-2 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(180,220,220,0.6)' }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: 'rgba(190,220,220,0.65)' }}>{item.label}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 px-3.5 py-2 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(160,210,210,0.4)' }} />
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: 'rgba(160,210,210,0.45)' }}>Alles in einem Ticket</span>
                  </div>
                </div>

                <a href="https://www.instagram.com/harmonyfestivaldus" target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-4 rounded-xl mb-4 px-5 py-4 group transition-all"
                  style={{ background: 'rgba(0,212,212,0.07)', border: '1px solid rgba(0,212,212,0.22)', textDecoration: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,212,0.13)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,212,212,0.07)'; }}>
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(0,212,212,0.12)', border: '1px solid rgba(0,212,212,0.3)' }}>
                    <svg viewBox="0 0 24 24" fill="none" style={{ width: '18px', height: '18px', color: C.cyan }} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                      <circle cx="12" cy="12" r="4" />
                      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '14px', letterSpacing: '0.18em', color: '#fff', marginBottom: '2px' }}>
                      Folge uns auf Instagram &amp; spare 20 %
                    </p>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(0,212,212,0.6)', letterSpacing: '0.02em' }}>
                      @harmonyfestivaldus · DM uns nach dem Follow für deinen Code
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1" style={{ color: 'rgba(0,212,212,0.55)' }} />
                </a>

                <div className="rounded-xl mb-7 overflow-hidden"
                  style={{ background: 'rgba(185,215,55,0.06)', border: '1px solid rgba(185,215,55,0.28)', boxShadow: '0 0 24px rgba(185,215,55,0.06)' }}>
                  <div className="flex items-center gap-3 px-4 py-2" style={{ borderBottom: '1px solid rgba(185,215,55,0.15)', background: 'rgba(185,215,55,0.08)' }}>
                    <Beer className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(210,235,80,0.9)' }} />
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', letterSpacing: '0.22em', color: 'rgba(210,235,80,0.9)' }}>
                      EXKLUSIV IM BUNDLE
                    </span>
                    <span className="ml-auto px-2 py-0.5 rounded-md flex-shrink-0" style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', background: 'rgba(185,215,55,0.18)', color: 'rgba(220,245,90,0.95)', border: '1px solid rgba(185,215,55,0.35)' }}>
                      GRATIS · ~5 € WERT
                    </span>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-3">
                    <div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 700, color: 'rgba(220,245,140,0.9)', marginBottom: '2px' }}>
                        1 Getränk nach Wahl beim Einlass
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(190,220,120,0.55)', lineHeight: 1.5 }}>
                        Bier, Softdrink oder Wasser – direkt beim Betreten. Zeig dein Ticket, hol dir deinen Drink.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4 flex-wrap">
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.5)' }}>Anzahl Tickets</span>
                  <div className="flex items-center gap-3 rounded-xl px-4 py-2"
                    style={{ background: 'rgba(0,212,212,0.06)', border: '1px solid rgba(0,212,212,0.18)' }}>
                    <button type="button" className="qty-btn" aria-label="Weniger" onClick={() => updateQty(HERO.id, -1)}
                      style={{ color: C.cyan, fontSize: '20px', opacity: quantities[HERO.id] <= 1 ? 0.3 : 1 }}>−</button>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: '#fff', minWidth: '24px', textAlign: 'center' }}>
                      {quantities[HERO.id]}
                    </span>
                    <button type="button" className="qty-btn" aria-label="Mehr" onClick={() => updateQty(HERO.id, 1)}
                      style={{ color: C.cyan, fontSize: '20px', opacity: quantities[HERO.id] >= 10 ? 0.3 : 1 }}>+</button>
                  </div>
                  {quantities[HERO.id] > 1 && (
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(0,212,212,0.7)' }}>
                      = {eur(HERO.price * quantities[HERO.id])}
                      {HERO.compareAt && (
                        <span style={{ color: 'rgba(0,185,185,0.55)' }}> · {eur(HERO_SAVINGS * quantities[HERO.id])} gespart</span>
                      )}
                    </span>
                  )}
                </div>

                <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                  onClick={() => handleBuy(HERO)} disabled={loadingId !== null}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(90deg, #00c8c8 0%, #00a0a0 100%)', color: '#040c0c',
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.2em',
                    boxShadow: '0 4px 36px rgba(0,200,200,0.45), 0 1px 0 rgba(255,255,255,0.18) inset',
                  }}>
                  {loadingId === HERO.id
                    ? <><Loader2 className="w-5 h-5 animate-spin" />Weiterleitung…</>
                    : <><Ticket className="w-5 h-5" />Bundle sichern – {eur(HERO.price)}</>}
                </motion.button>
              </div>
            </motion.div>

            <div className="flex items-start gap-3 px-5 py-4 rounded-2xl mb-5"
              style={{ background: 'rgba(185,215,55,0.05)', border: '1px solid rgba(185,215,55,0.15)' }}>
              <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                style={{ background: 'rgba(185,215,55,0.10)', border: '1px solid rgba(185,215,55,0.22)' }}>
                <Trophy className="w-3.5 h-3.5" style={{ color: 'rgba(200,232,64,0.85)' }} />
              </div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color: 'rgba(200,232,64,0.85)', marginBottom: '3px' }}>
                  Bierpong zuschauen ist inklusive – aktiv mitspielen nicht
                </p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(180,210,180,0.55)', lineHeight: 1.6 }}>
                  Das Bundle enthält Konzert, Stand-Up &amp; DJ Night. Beim Bierpong-Turnier dürfen alle zuschauen &amp; feiern – kein Extra-Ticket nötig. Wer <em>als Team aktiv mitspielen</em> will, bucht zusätzlich das Bierpong-Ticket.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-5 py-4 rounded-2xl mb-5"
              style={{ background: 'rgba(0,212,212,0.04)', border: '1px solid rgba(0,212,212,0.15)' }}>
              <Heart className="w-4 h-4 flex-shrink-0" style={{ color: C.cyan }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(180,230,230,0.65)', lineHeight: 1.6 }}>
                <strong style={{ color: '#fff' }}>Warum so günstig?</strong> Harmony wird privat organisiert – ohne Konzern-Budget, ohne Gewinnmarge. Jeder Euro fließt direkt in Technik, Künstlergagen und den Abend selbst.
              </p>
            </div>

            {/* EINZELTICKETS */}
            <div className="space-y-3 mb-6">
              {SINGLE_TICKETS.map((ticket, i) => {
                const saving = ticket.compareAt ? ticket.compareAt - ticket.price : 0;
                const savingPct = ticket.compareAt ? Math.round((saving / ticket.compareAt) * 100) : 0;
                return (
                  <React.Fragment key={ticket.id}>
                    <motion.div initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: i * 0.06 }}
                      className="tr-card"
                      style={{
                        '--ticket-accent': ticket.accent,
                        '--ticket-accent-alpha': ticket.accentAlpha,
                        '--ticket-accent-shadow': ticket.accentShadow,
                      } as React.CSSProperties}>
                      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full px-6 py-5">
                        <div className="hidden sm:flex flex-shrink-0 w-10 h-10 rounded-xl items-center justify-center"
                          style={{ background: `${ticket.accent}12`, border: `1px solid ${ticket.accent}22` }}>
                          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: ticket.accent, lineHeight: 1 }}>{String(i + 2).padStart(2, '0')}</span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className="graffiti" style={{ fontSize: 'clamp(17px, 2.2vw, 22px)', color: '#fff', lineHeight: 1 }}>{ticket.label}</h3>
                            {ticket.badge && (
                              <span className="sticker" style={{ backgroundColor: ticket.accent, color: '#080c10', fontSize: '9px', padding: '2px 8px' }}>
                                {ticket.badge}
                              </span>
                            )}
                            {ticket.time && (
                              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full"
                                style={{ background: `${ticket.accent}18`, border: `1px solid ${ticket.accent}40` }}>
                                <Clock className="w-3 h-3 flex-shrink-0" style={{ color: ticket.accent }} />
                                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', color: ticket.accent, letterSpacing: '0.1em', lineHeight: 1 }}>
                                  {ticket.time}
                                </span>
                              </div>
                            )}
                          </div>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(180,210,210,0.48)', lineHeight: 1.55 }}>{ticket.description}</p>
                          {ticket.perk && (
                            <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                              style={{ background: ticket.accentAlpha, border: `1px solid ${ticket.accent}25` }}>
                              <Trophy className="w-3 h-3 flex-shrink-0" style={{ color: ticket.accent }} />
                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: ticket.accent }}>{ticket.perk}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex-shrink-0 flex flex-col items-start sm:items-end gap-2 sm:pl-4"
                          style={{ borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                          {ticket.compareAt && (
                            <div className="flex items-center gap-2">
                              <span className="price-old" style={{ fontSize: '11px' }}>{eur(ticket.compareAt)}</span>
                              <span className="save-pill px-1.5 py-0.5"
                                style={{ fontSize: '10px', background: `${ticket.accent}18`, color: ticket.accent, border: `1px solid ${ticket.accent}35` }}>
                                −{savingPct}%
                              </span>
                            </div>
                          )}
                          <span className="price-num" style={{ fontSize: '24px', color: ticket.accent, lineHeight: 1 }}>
                            {eur(ticket.price)}
                          </span>
                          {ticket.compareAt && (
                            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(180,210,210,0.35)', letterSpacing: '0.04em' }}>
                              üblich {eur(ticket.compareAt)} · du sparst {eur(saving)}
                            </span>
                          )}

                          <div className="flex items-center gap-2 my-1">
                            <button type="button" className="qty-btn" aria-label="Weniger" onClick={e => { e.stopPropagation(); updateQty(ticket.id, -1); }}
                              style={{ color: ticket.accent, fontSize: '18px', opacity: quantities[ticket.id] <= 1 ? 0.3 : 1 }}>−</button>
                            <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: '#fff', minWidth: '20px', textAlign: 'center' }}>
                              {quantities[ticket.id]}
                            </span>
                            <button type="button" className="qty-btn" aria-label="Mehr" onClick={e => { e.stopPropagation(); updateQty(ticket.id, 1); }}
                              style={{ color: ticket.accent, fontSize: '18px', opacity: quantities[ticket.id] >= 10 ? 0.3 : 1 }}>+</button>
                          </div>

                          <motion.button whileHover={{ scale: 1.05, filter: 'brightness(1.1)' }} whileTap={{ scale: 0.95 }}
                            onClick={() => handleBuy(ticket)} disabled={loadingId !== null}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                            style={{
                              background: ticket.accent, color: '#060c0c',
                              fontFamily: "'Bebas Neue', sans-serif", fontSize: '13px', letterSpacing: '0.16em',
                              border: 'none', boxShadow: `0 2px 12px ${ticket.accentShadow}`,
                            }}>
                            {loadingId === ticket.id
                              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Laden</>
                              : <>Ticket sichern<ArrowRight className="w-3.5 h-3.5" /></>}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>

                    {ticket.id === 'bierpong' && (
                      <div className="flex items-start gap-3 px-5 py-4 rounded-2xl"
                        style={{ background: 'rgba(185,215,55,0.05)', border: '1px solid rgba(185,215,55,0.18)' }}>
                        <div className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5"
                          style={{ background: 'rgba(185,215,55,0.12)', border: '1px solid rgba(185,215,55,0.25)' }}>
                          <Trophy className="w-3.5 h-3.5" style={{ color: 'rgba(200,232,64,0.9)' }} />
                        </div>
                        <div>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color: 'rgba(200,232,64,0.9)', marginBottom: '3px' }}>
                            Zuschauen &amp; feiern ist für alle kostenlos
                          </p>
                          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(180,210,180,0.6)', lineHeight: 1.6 }}>
                            Kein Extra-Ticket nötig – Musik läuft, Drinks fließen, alle dürfen bleiben. Dieses Ticket berechtigt nur zum <em>aktiven Mitspielen</em> als angemeldetes Team.
                          </p>
                        </div>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {loadingId !== null && showSlowHint && (
              <p className="text-center mt-2 mb-4" style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(160,200,200,0.35)', letterSpacing: '0.05em' }}>
                Beim ersten Mal kann das etwas länger dauern…
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 py-4 px-5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { icon: Lock, text: 'Sichere Zahlung via Stripe' },
                { icon: Mail, text: 'Ticket per E-Mail' },
                { icon: ShieldCheck, text: 'Kauf unterstützt DYD direkt' },
              ].map(item => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(160,200,200,0.35)' }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(160,200,200,0.35)', letterSpacing: '0.04em' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="divider" />

          {/* ── SOLI-SHIRTS ── */}
          <motion.section id="shirts" {...fadeUp}>
            <div className="mb-12">
              <div className="tag-label mb-4" style={{ color: C.red, opacity: 0.85 }}>Solidarität</div>
              <h2 className="graffiti" style={{ fontSize: 'clamp(48px, 8vw, 88px)', color: '#fff', lineHeight: 0.9 }}>
                Zeig Haltung —<br />
                <span style={{ color: C.red, textShadow: '0 0 40px rgba(220,50,50,0.55)' }}>Kauf ein Soli-Shirt</span>
              </h2>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(180,210,210,0.55)', marginTop: '16px', lineHeight: 1.7, maxWidth: '560px' }}>
                Harmony steht für Zusammenhalt — und gegen das, was uns spaltet. Jeder Cent Gewinn geht direkt an{' '}
                <a href="https://www.keinbockaufnazis.de" target="_blank" rel="noopener noreferrer"
                  style={{ color: C.red, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                  KeinBockAufNazis e.V.
                </a>
                {' '}— ich verdiene keinen Euro daran — das ist kein Produkt, das ist eine Haltung.
              </p>
            </div>

            <div className="relative rounded-3xl overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(220,50,50,0.10) 0%, rgba(0,18,22,0.97) 60%)',
                border: '1px solid rgba(220,50,50,0.32)',
                boxShadow: '0 8px 50px rgba(0,0,0,0.5), 0 0 60px rgba(220,50,50,0.08)',
              }}>
              <div className="absolute inset-x-0 top-0" style={{ height: '3px', background: `linear-gradient(to right, transparent, ${C.red}, transparent)` }} />

              <div className="relative z-10 p-7 sm:p-10">
                <div className="flex items-center gap-3 mb-10 px-4 py-4 rounded-2xl"
                  style={{ background: 'rgba(220,50,50,0.06)', border: '1px solid rgba(220,50,50,0.18)' }}>
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: C.red, boxShadow: '0 0 8px rgba(220,50,50,0.7)' }} />
                  <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '16px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(220,120,120,0.9)' }}>
                    Bilder folgen in Kürze
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-8">
                  <div className="flex-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4"
                      style={{ background: 'rgba(220,50,50,0.12)', border: '1px solid rgba(220,50,50,0.3)' }}>
                      <Heart className="w-3 h-3 flex-shrink-0" style={{ color: C.red }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color: C.red }}>
                        100% Gewinn geht an KeinBockAufNazis e.V.
                      </span>
                    </div>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(180,210,210,0.5)', lineHeight: 1.7, maxWidth: '440px' }}>
                      Weißes Shirt mit Harmony-Graffiti-Print auf der Rückseite und dem Harmony-Logo vorne. Hochwertig bedruckt. Größen XS bis XXL.
                    </p>
                  </div>
                  <div className="flex-shrink-0 sm:text-right">
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(220,80,80,0.45)', marginBottom: '2px' }}>
                      Stückpreis
                    </div>
                    <span className="price-num" style={{ fontSize: 'clamp(36px, 6vw, 58px)', color: C.red, lineHeight: 1 }}>
                      {eur(SHIRT.price)}
                    </span>
                  </div>
                </div>

                {/* Größenwahl */}
                <div className="mb-8">
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(220,120,120,0.55)', marginBottom: '12px' }}>
                    Größe wählen <span style={{ color: C.red }}>*</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SHIRT_SIZES.map(size => {
                      const on = selectedShirtSize === size;
                      return (
                        <button
                          key={size}
                          type="button"
                          aria-pressed={on}
                          onClick={() => { setSelectedShirtSize(size); setSizeError(''); }}
                          style={{
                            fontFamily: "'Bebas Neue', sans-serif", fontSize: '17px', letterSpacing: '0.1em',
                            padding: '10px 18px', borderRadius: '12px',
                            background: on ? 'rgba(220,50,50,0.22)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${on ? 'rgba(220,50,50,0.6)' : 'rgba(255,255,255,0.1)'}`,
                            color: on ? C.red : 'rgba(255,255,255,0.45)',
                            cursor: 'pointer', transition: 'all 0.15s ease',
                            transform: on ? 'scale(1.06)' : 'scale(1)',
                            boxShadow: on ? '0 0 14px rgba(220,50,50,0.22)' : 'none',
                          }}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                  {sizeError && (
                    <p role="alert" style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.orange, marginTop: '8px' }}>
                      {sizeError}
                    </p>
                  )}
                </div>

                {/* Anzahl */}
                <div className="flex items-center gap-4 mb-8 flex-wrap">
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(200,180,180,0.5)' }}>Anzahl Shirts</span>
                  <div className="flex items-center gap-3 rounded-xl px-4 py-2"
                    style={{ background: 'rgba(220,50,50,0.06)', border: '1px solid rgba(220,50,50,0.2)' }}>
                    <button type="button" className="qty-btn" aria-label="Weniger" onClick={() => updateQty(SHIRT.id, -1)}
                      style={{ color: C.red, fontSize: '20px', opacity: quantities[SHIRT.id] <= 1 ? 0.3 : 1 }}>−</button>
                    <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: '#fff', minWidth: '24px', textAlign: 'center' }}>
                      {quantities[SHIRT.id]}
                    </span>
                    <button type="button" className="qty-btn" aria-label="Mehr" onClick={() => updateQty(SHIRT.id, 1)}
                      style={{ color: C.red, fontSize: '20px', opacity: quantities[SHIRT.id] >= 10 ? 0.3 : 1 }}>+</button>
                  </div>
                  {quantities[SHIRT.id] > 1 && (
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(220,120,120,0.75)' }}>
                      = {eur(SHIRT.price * quantities[SHIRT.id])}
                    </span>
                  )}
                </div>

                <div className="rounded-2xl p-5 mb-8" style={{ background: 'rgba(220,50,50,0.06)', border: '1px solid rgba(220,50,50,0.18)' }}>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-2" style={{ background: C.red, boxShadow: '0 0 8px rgba(220,50,50,0.7)' }} />
                    <div>
                      <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '14px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(220,80,80,0.85)', marginBottom: '6px' }}>
                        KeinBockAufNazis e.V.
                      </p>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(180,210,210,0.55)', lineHeight: 1.7 }}>
                        Der gemeinnützige Verein kämpft seit Jahren gegen Rechtsextremismus und für eine offene, demokratische Gesellschaft – genau das, wofür Harmony steht.{' '}
                        <a href="https://www.keinbockaufnazis.de" target="_blank" rel="noopener noreferrer"
                          style={{ color: C.cyan, fontWeight: 700, textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                          Mehr erfahren
                        </a>
                      </p>
                    </div>
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                  onClick={handleShirtBuy}
                  disabled={loadingId !== null}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    background: 'linear-gradient(90deg, #dc3232 0%, #b02020 100%)', color: '#fff',
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', letterSpacing: '0.2em',
                    border: 'none', boxShadow: '0 4px 36px rgba(220,50,50,0.4)',
                  }}>
                  {loadingId === SHIRT.id
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> Weiterleitung…</>
                    : <><Heart className="w-5 h-5" /> Shirt sichern — {eur(SHIRT.price)} für KeinBockAufNazis</>}
                </motion.button>

                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(180,200,200,0.3)', textAlign: 'center', marginTop: '12px', letterSpacing: '0.04em' }}>
                  Kein Gewinn für mich · 100% geht direkt an den Verein · Verteilung am Festival (Versand möglich)
                </p>
              </div>
            </div>
          </motion.section>

          <div className="divider" />

          {/* HARD FACTS */}
          <motion.section id="hardfacts" {...fadeUp}>
            <div className="tag-label mb-10">Hard Facts</div>
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: MapPin, label: 'Location', value: 'Klub Kulb\nBurgplatz 11 · 40213 Düsseldorf', color: C.cyan },
                { icon: Clock, label: 'Zeit', value: '22.08.2026\nStart 16:30 – 02:00', color: C.sky },
                { icon: Users, label: 'Einlass', value: 'Ab 16:00 Uhr\nAb 18 Jahren', color: C.lime },
              ].map(item => (
                <motion.div key={item.label} whileHover={{ y: -3 }} className="glass rounded-2xl p-7">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                    style={{ backgroundColor: `${item.color}10`, border: `1px solid ${item.color}22`, boxShadow: `0 0 18px ${item.color}20` }}>
                    <item.icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: item.color, opacity: 0.5, marginBottom: '8px' }}>{item.label}</div>
                  <p className="graffiti" style={{ fontSize: '22px', color: '#fff', lineHeight: 1.4, whiteSpace: 'pre-line' }}>{item.value}</p>
                </motion.div>
              ))}
            </div>

            <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.98 }}
              onClick={() => scrollTo('tickets')}
              className="btn-cyan w-full flex items-center justify-center gap-3 py-5 rounded-2xl"
              style={{ fontSize: '18px' }}>
              <Ticket className="w-5 h-5" /> Jetzt Ticket kaufen · 22.08.2026
            </motion.button>
          </motion.section>

          <FaqSection />
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer className="relative z-10 py-10 pb-28 lg:pb-10 text-center glass" style={{ borderTop: '1px solid rgba(0,212,212,0.09)' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '14px', letterSpacing: '0.3em', textTransform: 'uppercase', color: `${C.cyan}40`, marginBottom: '12px' }}>
          Harmony 2026 · DYD
        </div>
        <div className="flex items-center justify-center gap-4 mb-4">
          <a href="https://www.instagram.com/harmonyfestivaldus" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-full border transition-all"
            style={{ borderColor: 'rgba(0,212,212,0.2)', background: 'rgba(0,212,212,0.05)', color: 'rgba(0,212,212,0.7)', textDecoration: 'none' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,212,212,0.12)'; e.currentTarget.style.color = C.cyan; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,212,212,0.05)'; e.currentTarget.style.color = 'rgba(0,212,212,0.7)'; }}>
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '15px', height: '15px' }} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', letterSpacing: '0.04em' }}>@harmonyfestivaldus</span>
          </a>
        </div>
        <button onClick={() => navigate('/')} className="transition-opacity hover:opacity-50"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.04em', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Zurück zu DYD
        </button>
      </footer>

      {/* ── NAME MODAL ── */}
      <AnimatePresence>
        {nameModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto"
            style={{ background: 'rgba(8,12,16,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setNameModal(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              role="dialog" aria-modal="true"
              className="relative w-full max-w-md rounded-2xl p-8 my-8"
              style={{ background: 'rgba(8,18,22,0.98)', border: '1px solid rgba(0,212,212,0.22)', boxShadow: '0 0 80px rgba(0,212,212,0.08), 0 32px 80px rgba(0,0,0,0.7)' }}>
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(to right, transparent, ${C.cyan}80, transparent)` }} />

              <button onClick={() => setNameModal(null)} aria-label="Schließen"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ color: 'rgba(160,230,230,0.4)', background: 'rgba(0,212,212,0.05)', border: 'none', cursor: 'pointer' }}>
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(0,212,212,0.1)', border: '1px solid rgba(0,212,212,0.25)' }}>
                  <Ticket className="w-5 h-5" style={{ color: C.cyan }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.cyan, opacity: 0.7 }}>
                    {nameModal.ticket.label}
                    {nameModal.ticket.id === 'soli_shirt' && selectedShirtSize ? ` · Größe ${selectedShirtSize}` : ''}
                  </p>
                  <h3 className="graffiti" style={{ fontSize: '26px', color: '#fff', lineHeight: 1 }}>Dein Name</h3>
                </div>
              </div>

              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.7, marginBottom: '24px' }}>
                Dein Name erscheint auf dem Ticket und wird für die Buchungsbestätigung benötigt.
              </p>

              <div>
                <label htmlFor="hf-buyer-name" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.5)', display: 'block', marginBottom: '8px' }}>
                  Vor- &amp; Nachname <span style={{ color: C.cyan }}>*</span>
                </label>
                <input
                  id="hf-buyer-name"
                  type="text"
                  placeholder="z. B. Max Mustermann"
                  value={buyerName}
                  onChange={e => { setBuyerName(e.target.value); setBuyerNameError(''); }}
                  onKeyDown={e => { if (e.key === 'Enter' && nameModalValid) handleNameConfirm(); }}
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 outline-none"
                  style={{ background: 'rgba(0,212,212,0.04)', border: buyerNameError ? `1px solid ${C.orange}` : '1px solid rgba(0,212,212,0.2)', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '15px' }}
                />
                {buyerNameError && (
                  <p role="alert" style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.orange, marginTop: '6px' }}>{buyerNameError}</p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <ConsentBox checked={ageConfirmed} onChange={setAgeConfirmed} color={C.cyan}>
                  Ich bestätige, dass ich mindestens <strong style={{ color: '#fff' }}>18 Jahre alt</strong> bin. <span style={{ color: C.cyan }}>*</span>
                </ConsentBox>

                {/* FIX: AGB-Checkbox war im Standard-Flow gar nicht vorhanden */}
                <ConsentBox checked={agbConfirmed} onChange={setAgbConfirmed} color={C.cyan}>
                  Ich habe die{' '}
                  <a href="/#/agb" target="_blank" rel="noopener noreferrer"
                    style={{ color: C.cyan, textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    onClick={e => e.stopPropagation()}>
                    Allgemeinen Geschäftsbedingungen
                  </a>{' '}gelesen und stimme ihnen zu. <span style={{ color: C.cyan }}>*</span>
                </ConsentBox>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setNameModal(null)}
                  className="flex-1 py-3 rounded-xl"
                  style={{ background: 'rgba(0,212,212,0.04)', border: '1px solid rgba(0,212,212,0.12)', color: 'rgba(160,230,230,0.5)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em', cursor: 'pointer' }}>
                  Abbrechen
                </button>
                <motion.button
                  whileHover={nameModalValid ? { scale: 1.03 } : {}}
                  whileTap={nameModalValid ? { scale: 0.97 } : {}}
                  onClick={handleNameConfirm}
                  disabled={!nameModalValid}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
                  style={nameModalValid
                    ? { background: `linear-gradient(135deg, ${C.cyan}, rgba(0,168,168,0.9))`, color: '#080c10', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em', fontWeight: 700, border: 'none', boxShadow: '0 3px 16px rgba(0,212,212,0.3)', cursor: 'pointer' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em', border: 'none', cursor: 'not-allowed' }}>
                  <Lock className="w-3.5 h-3.5" /> Sicher kaufen · Stripe
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BIERPONG MODAL ── */}
      <AnimatePresence>
        {bierpongModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto"
            style={{ background: 'rgba(8,12,16,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setBierpongModal(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              role="dialog" aria-modal="true"
              className="relative w-full max-w-md rounded-2xl p-8 my-8"
              style={{ background: 'rgba(8,18,22,0.98)', border: '1px solid rgba(200,232,64,0.22)', boxShadow: '0 0 80px rgba(200,232,64,0.08), 0 32px 80px rgba(0,0,0,0.7)' }}>
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(to right, transparent, ${C.lime}80, transparent)` }} />

              <button onClick={() => setBierpongModal(null)} aria-label="Schließen"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg"
                style={{ color: 'rgba(160,230,230,0.4)', background: 'rgba(0,212,212,0.05)', border: 'none', cursor: 'pointer' }}>
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(200,232,64,0.1)', border: '1px solid rgba(200,232,64,0.25)' }}>
                  <Trophy className="w-5 h-5" style={{ color: C.lime }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.lime, opacity: 0.7 }}>Bierpong-Turnier</p>
                  <h3 className="graffiti" style={{ fontSize: '26px', color: '#fff', lineHeight: 1 }}>Dein Team</h3>
                </div>
              </div>

              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.7, marginBottom: '24px' }}>
                Euer Teamname erscheint auf dem Ticket und im Turnier-Bracket. Trag deinen Mitspieler optional mit ein.
              </p>

              <div className="space-y-4">
                <div>
                  <label htmlFor="bp-name" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.5)', display: 'block', marginBottom: '8px' }}>
                    Dein Name <span style={{ color: C.lime }}>*</span>
                  </label>
                  <input id="bp-name" type="text" placeholder="z. B. Max Mustermann" autoFocus
                    value={bierpongBuyerName}
                    onChange={e => { setBierpongBuyerName(e.target.value); setBierpongBuyerNameError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter' && bierpongValid) handleBierpongConfirm(); }}
                    className="w-full rounded-xl px-4 py-3 outline-none"
                    style={{ background: 'rgba(0,212,212,0.04)', border: bierpongBuyerNameError ? `1px solid ${C.orange}` : '1px solid rgba(200,232,64,0.2)', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '15px' }} />
                  {bierpongBuyerNameError && (
                    <p role="alert" style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.orange, marginTop: '6px' }}>{bierpongBuyerNameError}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bp-team" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.5)', display: 'block', marginBottom: '8px' }}>
                    Teamname <span style={{ color: C.lime }}>*</span>
                  </label>
                  <input id="bp-team" type="text" placeholder="z. B. Pong Kings"
                    value={teamName}
                    onChange={e => { setTeamName(e.target.value); setTeamNameError(''); }}
                    onKeyDown={e => { if (e.key === 'Enter' && bierpongValid) handleBierpongConfirm(); }}
                    className="w-full rounded-xl px-4 py-3 outline-none"
                    style={{ background: 'rgba(0,212,212,0.04)', border: teamNameError ? `1px solid ${C.orange}` : '1px solid rgba(200,232,64,0.2)', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '15px' }} />
                  {teamNameError && (
                    <p role="alert" style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.orange, marginTop: '6px' }}>{teamNameError}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="bp-partner" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.5)', display: 'block', marginBottom: '8px' }}>
                    Teammitglied <span style={{ color: 'rgba(160,230,230,0.3)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>(optional)</span>
                  </label>
                  <input id="bp-partner" type="text" placeholder="Vorname &amp; Nachname"
                    value={partnerName}
                    onChange={e => setPartnerName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && bierpongValid) handleBierpongConfirm(); }}
                    className="w-full rounded-xl px-4 py-3 outline-none"
                    style={{ background: 'rgba(0,212,212,0.04)', border: '1px solid rgba(0,212,212,0.12)', color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '15px' }} />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <ConsentBox checked={bierpongAgeConfirmed} onChange={setBierpongAgeConfirmed} color={C.lime}>
                  Ich bestätige, dass ich mindestens <strong style={{ color: '#fff' }}>18 Jahre alt</strong> bin. <span style={{ color: C.lime }}>*</span>
                </ConsentBox>
                <ConsentBox checked={bierpongAgbConfirmed} onChange={setBierpongAgbConfirmed} color={C.lime}>
                  Ich habe die{' '}
                  <a href="/#/agb" target="_blank" rel="noopener noreferrer"
                    style={{ color: C.lime, textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    onClick={e => e.stopPropagation()}>
                    Allgemeinen Geschäftsbedingungen
                  </a>{' '}gelesen und stimme ihnen zu. <span style={{ color: C.lime }}>*</span>
                </ConsentBox>
              </div>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setBierpongModal(null)}
                  className="flex-1 py-3 rounded-xl"
                  style={{ background: 'rgba(0,212,212,0.04)', border: '1px solid rgba(0,212,212,0.12)', color: 'rgba(160,230,230,0.5)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em', cursor: 'pointer' }}>
                  Abbrechen
                </button>
                <motion.button
                  whileHover={bierpongValid ? { scale: 1.03 } : {}}
                  whileTap={bierpongValid ? { scale: 0.97 } : {}}
                  onClick={handleBierpongConfirm}
                  disabled={!bierpongValid}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl"
                  style={bierpongValid
                    ? { background: `linear-gradient(135deg, ${C.lime}, rgba(180,210,40,0.9))`, color: '#080c10', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em', fontWeight: 700, border: 'none', boxShadow: '0 3px 16px rgba(200,232,64,0.3)', cursor: 'pointer' }
                    : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em', border: 'none', cursor: 'not-allowed' }}>
                  <Ticket className="w-4 h-4" /> Weiter zum Kauf
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUPPORT THANK YOU POPUP ── */}
      {showSupportPopup && (
        <SupportThankYouPopup
          onClose={() => setShowSupportPopup(false)}
          stripeSessionId={supportSessionId}
          userId={user?.id}
        />
      )}

      {/* ── THANK YOU MODAL ── */}
      <AnimatePresence>
        {showThankYou && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 overflow-y-auto"
            style={{ background: 'rgba(4,10,14,0.88)', backdropFilter: 'blur(16px)' }}
            onClick={() => setShowThankYou(false)}>
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              onClick={e => e.stopPropagation()}
              role="dialog" aria-modal="true"
              className="relative w-full max-w-lg rounded-3xl overflow-hidden text-center my-8"
              style={{
                background: 'rgba(4,18,22,0.99)', border: '1px solid rgba(0,212,212,0.25)',
                boxShadow: '0 0 0 1px rgba(0,212,212,0.08), 0 40px 100px rgba(0,0,0,0.8), 0 0 100px rgba(0,212,212,0.1)',
              }}>
              <div className="absolute inset-x-0 top-0 h-0.5" style={{ background: `linear-gradient(to right, transparent, ${C.cyan}, transparent)` }} />
              <div className="absolute inset-x-0 top-0 h-48 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,212,212,0.15) 0%, transparent 100%)' }} />

              <div className="relative z-10 px-8 pt-10 pb-9">
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 220, damping: 16 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-7"
                  style={{ background: 'radial-gradient(circle, rgba(0,212,212,0.2) 0%, rgba(0,212,212,0.06) 100%)', border: '2px solid rgba(0,212,212,0.35)' }}>
                  <Heart className="w-9 h-9" style={{ color: C.cyan }} />
                </motion.div>

                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.cyan, opacity: 0.65, marginBottom: '10px' }}>
                  Zahlung erfolgreich
                </div>

                <h2 className="graffiti" style={{ fontSize: 'clamp(32px, 6vw, 52px)', color: '#ffffff', lineHeight: 0.95, marginBottom: '18px' }}>
                  Danke für<br /><span style={{ color: C.cyan, textShadow: `0 0 30px ${C.cyan}60` }}>deine Unterstützung!</span>
                </h2>

                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(180,230,230,0.6)', lineHeight: 1.75, maxWidth: '380px', margin: '0 auto 28px' }}>
                  Dein Ticket ist auf dem Weg zu dir. Du erhältst eine Bestätigung per E-Mail – wir freuen uns riesig, dich am <strong style={{ color: 'rgba(200,245,245,0.85)', fontWeight: 600 }}>22. August 2026</strong> in Düsseldorf zu sehen.
                </p>

                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl mb-8"
                  style={{ background: 'rgba(0,212,212,0.06)', border: '1px solid rgba(0,212,212,0.15)' }}>
                  <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: C.cyan }} />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(180,240,240,0.75)', lineHeight: 1.6, textAlign: 'left' }}>
                    Mit diesem Kauf unterstützt du direkt DYD und faire Ausbildungschancen für junge Menschen – danke, dass du diesen Abend möglich machst.
                  </p>
                </div>

                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowThankYou(false)}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl"
                  style={{
                    background: `linear-gradient(90deg, ${C.cyan} 0%, ${C.teal} 100%)`, color: '#060c10',
                    fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', letterSpacing: '0.18em',
                    border: 'none', cursor: 'pointer', boxShadow: '0 4px 28px rgba(0,212,212,0.25)',
                  }}>
                  <Ticket className="w-5 h-5" /> Bis zum 22. August!
                </motion.button>
              </div>

              <button onClick={() => setShowThankYou(false)} aria-label="Schließen"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-opacity hover:opacity-60"
                style={{ color: 'rgba(160,230,230,0.45)', background: 'rgba(0,212,212,0.06)', border: 'none', cursor: 'pointer' }}>
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}