import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Users, Mic, Handshake, Music, Heart, ArrowRight,
  MapPin, Clock, Beer, Ticket, Laugh, Trophy, Disc3, Mail,
  CheckCircle, Loader2, ChevronDown, X, CalendarDays, Hash, Lock, ShieldCheck,
  Sparkles, Building2, Star,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import SupportThankYouPopup from '../components/festival/SupportThankYouPopup';


const C = {
  cyan:    '#00d4d4',
  teal:    '#00a8a8',
  blue:    '#1e90d4',
  sky:     '#4dc8e8',
  lime:    '#c8e840',
  orange:  '#f07820',
  bg:      '#080c10',
  bgCard:  'rgba(0,180,180,0.04)',
  border:  'rgba(0,212,212,0.14)',
};

const TICKETS = [
  { id: 'early_bird',  priceId: import.meta.env.VITE_STRIPE_HARMONY_EARLY_BIRD,  label: 'Early Bird Bundle',      price: 37.99, description: 'Das volle Programm: Live-Konzert mit Zirkel.WTF, Stand-Up Comedy Show & DJ Night in einem Paket – zum günstigsten Preis.', highlight: true,  badge: 'BELIEBT',   perk: '',                                     accent: 'rgba(0,175,175,0.85)',   accentAlpha: 'rgba(0,160,160,0.1)',   accentShadow: 'rgba(0,140,140,0.06)'  },
  { id: 'concert',     priceId: import.meta.env.VITE_STRIPE_HARMONY_CONCERT,      label: 'Live Konzert Zirkel.WTF',price: 17.50, description: 'Norddeutschlands Pop-Punk-Hoffnung hautnah. Moderne Beats, Skater-Vibe, ehrliche Texte.', highlight: false, badge: null,        perk: '',                                     accent: 'rgba(60,140,200,0.8)',   accentAlpha: 'rgba(50,130,190,0.1)',  accentShadow: 'rgba(40,110,170,0.06)' },
  { id: 'standup',     priceId: import.meta.env.VITE_STRIPE_HARMONY_STANDUP,      label: 'Stand-Up Comedy',       price: 17.50, description: '5–6 Newcomer aus der lokalen Stand-Up Comedy Szene.',                               highlight: false, badge: null,        perk: '',                                     accent: 'rgba(210,110,50,0.85)',  accentAlpha: 'rgba(200,100,40,0.1)',  accentShadow: 'rgba(180,85,30,0.06)'  },
  { id: 'dj',          priceId: import.meta.env.VITE_STRIPE_HARMONY_DJ,           label: 'DJ Sets House / Techno', price:  8.50, description: 'Lokale DJs für die Club Night – House & Techno bis in den Morgen.',                 highlight: false, badge: null,        perk: '',                                     accent: 'rgba(160,120,200,0.8)', accentAlpha: 'rgba(145,105,185,0.1)', accentShadow: 'rgba(130,90,170,0.06)' },
  { id: 'bierpong',    priceId: import.meta.env.VITE_STRIPE_HARMONY_BIERPONG,     label: 'Bierpong-Turnier',      price: 10.00, description: 'Tritt gegen andere Teams an und sichere dir deinen Platz im Turnier.',              highlight: false, badge: 'LIMITIERT', perk: 'Gewinnen = den ganzen Abend free trinken', accent: 'rgba(185,215,55,0.8)', accentAlpha: 'rgba(175,205,50,0.1)', accentShadow: 'rgba(155,185,40,0.06)' },
];

const ACTS = [
  { num: '01', icon: Laugh,  label: 'Stand-Up Comedy',  sub: 'Newcomer der lokalen Szene',  time: '16:30', color: C.orange },
  { num: '02', icon: Trophy, label: 'Bierpong Turnier',  sub: 'Gewinnen = free drinks',       time: '18:00', color: C.lime   },
  { num: '03', icon: Mic,    label: 'Zirkel.WTF Live',  sub: 'Pop-Punk aus Hamburg',          time: '20:30', color: C.cyan   },
  { num: '04', icon: Disc3,  label: 'DJ Sets',           sub: 'House & Techno bis 02:00',     time: '22:00', color: C.blue   },
];

function GraffitiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);

    const beams = [
      { x: 0.08,  angle:  22, w: 160, col: 'rgba(0,212,212,',   spd: 0.00028, ph: 0    },
      { x: 0.28,  angle: -15, w: 110, col: 'rgba(30,144,212,',  spd: 0.00038, ph: 1.6  },
      { x: 0.55,  angle:  10, w: 130, col: 'rgba(200,232,64,',  spd: 0.00022, ph: 3.1  },
      { x: 0.78,  angle: -18, w:  95, col: 'rgba(77,200,232,',  spd: 0.00032, ph: 4.7  },
      { x: 0.92,  angle:  28, w:  80, col: 'rgba(240,120,32,',  spd: 0.00044, ph: 2.2  },
    ];

    const blobs = Array.from({ length: 22 }, (_, i) => ({
      x:  Math.random(), y: Math.random(),
      r:  35 + Math.random() * 90,
      col: ['rgba(0,212,212,','rgba(30,144,212,','rgba(200,232,64,','rgba(77,200,232,','rgba(240,120,32,'][i % 5],
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
      amb.addColorStop(0,   'rgba(0,60,70,0.55)');
      amb.addColorStop(0.4, 'rgba(0,30,45,0.35)');
      amb.addColorStop(1,   'rgba(8,12,16,0)');
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
        const bx    = (b.x + sweep) * w;
        const rad   = (b.angle + Math.sin(t * b.spd * 0.6 + b.ph) * 5) * (Math.PI / 180);
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
        ctx.lineTo( b.w * 4.5, h * 1.6);
        ctx.lineTo( b.w / 2, 0);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });

      blobs.forEach(s => {
        s.x += s.vx; s.y += s.vy;
        if (s.x < -0.1) s.x = 1.1; if (s.x > 1.1) s.x = -0.1;
        if (s.y < -0.1) s.y = 1.1; if (s.y > 1.1) s.y = -0.1;
        const op2 = s.op * (0.75 + 0.25 * Math.sin(t * s.ps + s.ph));
        const g2  = ctx.createRadialGradient(s.x * w, s.y * h, 0, s.x * w, s.y * h, s.r);
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

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" style={{ width: '100%', height: '100%' }} />;
}

const POSTER_SLIDES = [
  {
    src: '/22.08.2026_(8).png',
    alt: 'Harmony Festival 2026 Poster',
    label: 'Das Poster',
    accent: 'rgba(0,212,212,1)',
    accentAlpha: 'rgba(0,212,212,0.18)',
    glow: 'rgba(0,212,212,0.1)',
  },
  {
    src: '/Gewinne_das_Bierpongturnier_(3).png',
    alt: 'Gewinne das Bierpongturnier',
    label: 'Bierpong-Turnier',
    accent: 'rgba(185,215,55,1)',
    accentAlpha: 'rgba(185,215,55,0.2)',
    glow: 'rgba(185,215,55,0.08)',
  },
];

function PosterSwitcher() {
  const [active, setActive] = useState(0);
  const [dir, setDir] = useState(1);
  const next = (active + 1) % POSTER_SLIDES.length;
  const current = POSTER_SLIDES[active];
  const nextSlide = POSTER_SLIDES[next];

  const go = () => {
    setDir(1);
    setActive(next);
  };

  return (
    <section>
      <motion.div {...{ initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.6 } }}>
        <div className="tag-label mb-10 text-center">{current.label}</div>

        <div className="relative mx-auto" style={{ maxWidth: '600px', paddingRight: '36px' }}>
          <div className="flex items-start gap-0" style={{ position: 'relative' }}>

            <div style={{ flex: '1 1 0', minWidth: 0 }}>
              <div
                style={{
                  borderRadius: '16px',
                  boxShadow: `0 0 0 1px ${current.accentAlpha}, 0 8px 40px rgba(0,0,0,0.5), 0 0 60px ${current.glow}`,
                  overflow: 'hidden',
                  lineHeight: 0,
                  transition: 'box-shadow 0.4s ease',
                }}
              >
                <img
                  key={active}
                  src={current.src}
                  alt={current.alt}
                  style={{ display: 'block', width: '100%', height: 'auto' }}
                />
              </div>
            </div>

            <div
              style={{
                width: '90px',
                flexShrink: 0,
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                paddingLeft: '10px',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  width: '80px',
                  cursor: 'pointer',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  opacity: 0.45,
                  filter: 'blur(1px)',
                  transition: 'opacity 0.25s, filter 0.25s',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLDivElement).style.opacity = '0.7';
                  (e.currentTarget as HTMLDivElement).style.filter = 'blur(0px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLDivElement).style.opacity = '0.45';
                  (e.currentTarget as HTMLDivElement).style.filter = 'blur(1px)';
                }}
                onClick={go}
              >
                <img src={nextSlide.src} alt={nextSlide.alt} style={{ display: 'block', width: '100%', height: 'auto', borderRadius: '12px' }} />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 100%)',
                  borderRadius: '12px',
                }} />
              </div>

              <button
                onClick={go}
                style={{
                  position: 'absolute',
                  right: '-18px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: current.accent,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: `0 0 24px ${current.glow}, 0 4px 16px rgba(0,0,0,0.5)`,
                  zIndex: 10,
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1.12)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-50%) scale(1)';
                }}
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
                key={i}
                onClick={() => { setDir(i > active ? 1 : -1); setActive(i); }}
                style={{
                  width: i === active ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: i === active ? s.accent : 'rgba(255,255,255,0.18)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  padding: 0,
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}

const BIERPONG_TICKET_IDS = new Set(['bierpong']);

export default function HarmonyFestivalPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error,     setError]     = useState<string | null>(null);
  const [showSlowHint, setShowSlowHint] = useState(false);
  const [cd, setCd] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [ebCd, setEbCd] = useState({ d: 0, h: 0, m: 0, s: 0 });
  const { scrollY } = useScroll();
  const bannerY   = useTransform(scrollY, [0, 600], [0, -80]);
  const bannerOp  = useTransform(scrollY, [0, 500], [1, 0.3]);

  const [bierpongModal, setBierpongModal] = useState<{ ticket: typeof TICKETS[0] } | null>(null);
  const [teamName, setTeamName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [teamNameError, setTeamNameError] = useState('');
  const [bierpongBuyerName, setBierpongBuyerName] = useState('');
  const [bierpongBuyerNameError, setBierpongBuyerNameError] = useState('');

  const [nameModal, setNameModal] = useState<{ ticket: typeof TICKETS[0] } | null>(null);
  const [buyerName, setBuyerName] = useState('');
  const [buyerNameError, setBuyerNameError] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [agbConfirmed, setAgbConfirmed] = useState(false);
  const [bierpongAgeConfirmed, setBierpongAgeConfirmed] = useState(false);
  const [bierpongAgbConfirmed, setBierpongAgbConfirmed] = useState(false);

  const [authModal, setAuthModal] = useState<{ pendingTicket: typeof TICKETS[0] } | null>(null);
  const [authTab, setAuthTab] = useState<'signup' | 'login'>('signup');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [purchasedTickets, setPurchasedTickets] = useState<any[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [cancelledHint, setCancelledHint] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [showSupportPopup, setShowSupportPopup] = useState(false);
  const [supportSessionId, setSupportSessionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setLoadingId(null);
    setShowSlowHint(false);
    if (searchParams.get('payment') === 'cancelled') {
      setError('Zahlung wurde abgebrochen. Du kannst es jederzeit erneut versuchen.');
      setCancelledHint(true);
    }
    if (searchParams.get('payment') === 'success') {
      setShowThankYou(true);
    }
    if (searchParams.get('support_success') === '1') {
      const sid = searchParams.get('session_id') || undefined;
      setSupportSessionId(sid);
      setShowSupportPopup(true);
    }
  }, []);

  useEffect(() => {
    const target = new Date('2026-08-22T17:00:00').getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) return;
      setCd({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const target = new Date('2026-04-30T23:59:59').getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setEbCd({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setEbCd({ d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000), m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const loadUserTickets = async () => {
    if (!user) return;
    setLoadingTickets(true);
    const { data } = await supabase
      .from('festival_ticket_sales')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setPurchasedTickets(data || []);
    setLoadingTickets(false);
  };

  useEffect(() => {
    loadUserTickets();
  }, [user]);

  useEffect(() => {
    if (window.location.hash === '#tickets') {
      const el = document.getElementById('tickets');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const doCheckout = async (ticket: typeof TICKETS[0], name: string, bpTeam?: string, bpPartner?: string) => {
    setError(null);
    setLoadingId(ticket.id);
    setShowSlowHint(false);

    if (!ticket.priceId) {
      setError('Ticket-Konfiguration fehlt. Bitte versuche es spaeter erneut.');
      setLoadingId(null);
      return;
    }

    const slowHintTimer = setTimeout(() => setShowSlowHint(true), 3000);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const checkoutUrl = `${supabaseUrl}/functions/v1/stripe-checkout`;

    const attemptCheckout = async (): Promise<string> => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const { data: { session: authSession } } = await supabase.auth.getSession();
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
            success_url: ticket.id === 'support'
              ? `${window.location.origin}/#/festival?support_success=1&session_id={CHECKOUT_SESSION_ID}`
              : `${window.location.origin}/#/festival-success?session_id={CHECKOUT_SESSION_ID}&type=${ticket.id}`,
            cancel_url: `${window.location.origin}/#/festival?payment=cancelled`,
            mode: 'payment',
            metadata: { ticket_type: ticket.id },
            ...(user?.id ? { user_id: user.id } : {}),
            buyer_name: name,
            ...(bpTeam ? { bierpong_team_name: bpTeam } : {}),
            ...(bpPartner ? { bierpong_partner_name: bpPartner } : {}),
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          let serverMessage: string | undefined;
          try {
            const errBody = await response.json();
            serverMessage = errBody?.error;
          } catch {
            // ignore parse failures
          }
          throw new Error(serverMessage || 'Checkout fehlgeschlagen. Bitte versuche es erneut.');
        }

        const data = await response.json();
        if (!data?.url) throw new Error(data?.error || 'Checkout fehlgeschlagen.');
        return data.url;
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          throw new Error('Verbindungs-Timeout. Bitte versuche es erneut.');
        }
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
        if (attempt < MAX_RETRIES) {
          await new Promise(res => setTimeout(res, 1500));
        }
      }
    }

    clearTimeout(slowHintTimer);
    setError(lastError?.message || 'Checkout fehlgeschlagen. Bitte versuche es erneut.');
    setLoadingId(null);
    setShowSlowHint(false);
  };

  const openTicketModal = (ticket: typeof TICKETS[0]) => {
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

  const handleBuy = (ticket: typeof TICKETS[0]) => {
    openTicketModal(ticket);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      if (authTab === 'signup') {
        const { data, error: err } = await supabase.auth.signUp({ email: authEmail, password: authPassword });
        if (err) throw err;
        if (!data.user) throw new Error('Registrierung fehlgeschlagen.');
      } else {
        const { data, error: err } = await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
        if (err) throw err;
        if (!data.user) throw new Error('Login fehlgeschlagen.');
      }
      const pending = authModal!.pendingTicket;
      setAuthModal(null);
      openTicketModal(pending);
    } catch (err: any) {
      setAuthError(err.message || 'Fehler beim Anmelden.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleNameConfirm = () => {
    if (!buyerName.trim()) { setBuyerNameError('Bitte gib deinen Namen ein.'); return; }
    if (!ageConfirmed) return;
    if (!agbConfirmed) return;
    const ticket = nameModal!.ticket;
    setNameModal(null);
    doCheckout(ticket, buyerName.trim());
  };

  const handleBierpongConfirm = () => {
    if (!teamName.trim()) { setTeamNameError('Bitte gib einen Teamnamen ein.'); return; }
    if (!bierpongBuyerName.trim()) { setBierpongBuyerNameError('Bitte gib deinen Namen ein.'); return; }
    if (!bierpongAgeConfirmed) return;
    if (!bierpongAgbConfirmed) return;
    const ticket = bierpongModal!.ticket;
    setBierpongModal(null);
    doCheckout(ticket, bierpongBuyerName.trim(), teamName.trim(), partnerName.trim() || undefined);
  };

  const payStatus = new URLSearchParams(window.location.search).get('payment');

  useEffect(() => {
    if (payStatus === 'success' && user) {
      const t = setTimeout(() => loadUserTickets(), 3000);
      return () => clearTimeout(t);
    }
  }, [payStatus, user]);

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

  const fadeUp = { initial: { opacity: 0, y: 28 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: '-50px' }, transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } };

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ backgroundColor: C.bg, color: '#fff' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Barlow+Condensed:ital,wght@0,400;0,600;0,700;0,900;1,700;1,900&family=Bebas+Neue&display=swap');

        :root {
          --cyan: ${C.cyan};
          --teal: ${C.teal};
          --blue: ${C.blue};
          --sky:  ${C.sky};
          --lime: ${C.lime};
          --orange: ${C.orange};
        }

        /* ── Graffiti marker effect on headings ── */
        .graffiti {
          font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
          font-weight: 400;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .graffiti-italic {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-style: italic;
          letter-spacing: 0.03em;
          text-transform: uppercase;
        }

        /* ── Labels ── */
        .tag-label {
          font-family: 'Barlow Condensed', sans-serif;
          font-weight: 700;
          font-size: 10px;
          letter-spacing: 0.36em;
          text-transform: uppercase;
          color: ${C.cyan};
          opacity: 0.65;
        }

        /* ── Glass cards with cyan tint ── */
        .glass {
          background: rgba(0,200,200,0.055);
          border: 1px solid rgba(0,212,212,0.16);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .glass-cyan {
          background: linear-gradient(135deg, rgba(0,212,212,0.12) 0%, rgba(30,144,212,0.07) 100%);
          border: 1px solid rgba(0,212,212,0.28);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }

        /* ── Spray-paint border effect ── */
        .spray-border {
          position: relative;
        }
        .spray-border::before {
          content: '';
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, ${C.cyan}, ${C.blue}, ${C.sky}, ${C.lime});
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.5;
          pointer-events: none;
        }

        /* ── CTA Buttons ── */
        .btn-cyan {
          font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          background: linear-gradient(135deg, ${C.cyan} 0%, ${C.blue} 100%);
          color: #080c10;
          font-weight: 700;
          border: none;
          transition: all 0.18s ease;
          box-shadow: 0 4px 24px rgba(0,212,212,0.4), 0 0 48px rgba(0,212,212,0.12);
        }
        .btn-cyan:hover {
          filter: brightness(1.12);
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0,212,212,0.55), 0 0 60px rgba(0,212,212,0.2);
        }
        .btn-ghost-cyan {
          font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          background: rgba(0,212,212,0.07);
          color: ${C.cyan};
          border: 1px solid rgba(0,212,212,0.28);
          transition: all 0.18s ease;
        }
        .btn-ghost-cyan:hover {
          background: rgba(0,212,212,0.13);
          border-color: rgba(0,212,212,0.5);
          color: #fff;
        }

        /* ── Divider ── */
        .divider {
          height: 1px;
          background: linear-gradient(to right, transparent, rgba(0,212,212,0.3) 20%, rgba(30,144,212,0.2) 50%, rgba(0,212,212,0.3) 80%, transparent);
          margin: 72px 0;
        }

        /* ── Act rows ── */
        .act-row {
          border-bottom: 1px solid rgba(0,212,212,0.08);
          transition: background 0.18s;
        }
        .act-row:hover { background: rgba(0,212,212,0.04); }
        .act-row:last-child { border-bottom: none; }

        /* ── Ticket cards ── */
        .t-card {
          background: rgba(8,12,16,0.85);
          border-left: 4px solid var(--ticket-accent, #00d4d4);
          border-top: 1px solid rgba(255,255,255,0.06);
          border-right: 1px solid rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: all 0.22s ease;
          position: relative;
          overflow: hidden;
        }
        .t-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 220px; height: 100%;
          background: radial-gradient(ellipse 120px 80% at -10px 50%, var(--ticket-accent-alpha, rgba(0,212,212,0.1)) 0%, transparent 80%);
          pointer-events: none;
        }
        .t-card:hover {
          border-left-color: var(--ticket-accent, #00d4d4);
          border-top-color: rgba(255,255,255,0.1);
          transform: translateY(-3px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 4px 0 0 var(--ticket-accent, #00d4d4) inset;
        }
        .t-card-feat {
          background: rgba(8,12,16,0.9);
          border-left: 5px solid var(--ticket-accent, #00d4d4);
          border-top: 1px solid rgba(255,255,255,0.1);
          border-right: 1px solid rgba(255,255,255,0.06);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          position: relative;
          overflow: hidden;
          box-shadow: 0 4px 40px rgba(0,0,0,0.4), 0 0 40px var(--ticket-accent-shadow, rgba(0,212,212,0.08));
        }
        .t-card-feat::before {
          content: '';
          position: absolute;
          top: 0; left: 0;
          width: 280px; height: 100%;
          background: radial-gradient(ellipse 160px 100% at -10px 50%, var(--ticket-accent-alpha, rgba(0,212,212,0.14)) 0%, transparent 80%);
          pointer-events: none;
        }
        .t-card-feat::after {
          content: '';
          position: absolute;
          bottom: 0; left: 5px; right: 0;
          height: 1px;
          background: linear-gradient(to right, var(--ticket-accent, #00d4d4), transparent 60%);
          opacity: 0.3;
          pointer-events: none;
        }
        .t-card-feat:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 48px rgba(0,0,0,0.5), 0 0 60px var(--ticket-accent-shadow, rgba(0,212,212,0.12));
        }

        /* ── Sticker badges ── */
        .sticker {
          font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          padding: 4px 12px;
          border-radius: 3px;
          transform: rotate(-3deg);
          display: inline-block;
          box-shadow: 2px 2px 0 rgba(0,0,0,0.5);
        }

        /* ── Ticket stub tear line ── */
        .ticket-stub-line {
          position: absolute;
          right: 140px;
          top: 0; bottom: 0;
          width: 1px;
          background: repeating-linear-gradient(to bottom, rgba(255,255,255,0.07) 0px, rgba(255,255,255,0.07) 6px, transparent 6px, transparent 12px);
          pointer-events: none;
        }

        /* ── Price display ── */
        .price-num {
          font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif;
          font-weight: 400;
          letter-spacing: 0.02em;
          line-height: 1;
        }

        /* ── Ticket row cards (single) ── */
        .tr-card {
          background: rgba(10,16,22,0.9);
          border: 1px solid rgba(255,255,255,0.06);
          border-left: none;
          border-radius: 14px;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: stretch;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        .tr-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; bottom: 0;
          width: 3px;
          background: var(--ticket-accent, #00d4d4);
          border-radius: 14px 0 0 14px;
        }
        .tr-card::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(ellipse 60% 100% at 0% 50%, var(--ticket-accent-alpha, rgba(0,212,212,0.07)) 0%, transparent 70%);
          pointer-events: none;
        }
        .tr-card:hover {
          transform: translateX(4px);
          box-shadow: 0 8px 32px rgba(0,0,0,0.5), 0 0 24px var(--ticket-accent-shadow, rgba(0,212,212,0.08));
        }
        /* ── Hero bundle card ── */
        .tr-hero {
          background: rgba(0,22,26,0.97);
          border: 1px solid rgba(0,200,200,0.18);
          border-radius: 20px;
          position: relative;
          overflow: hidden;
          transition: transform 0.22s ease, box-shadow 0.22s ease;
          box-shadow: 0 0 0 1px rgba(0,200,200,0.06), 0 8px 60px rgba(0,0,0,0.5), 0 0 60px rgba(0,180,180,0.07);
        }
        .tr-hero::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          background: linear-gradient(to right, transparent 0%, rgba(0,200,200,0.55) 30%, rgba(0,200,200,0.55) 70%, transparent 100%);
        }
        .tr-hero::after {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 200px;
          background: radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,200,200,0.09) 0%, transparent 100%);
          pointer-events: none;
        }
        .tr-hero:hover {
          transform: translateY(-3px);
          box-shadow: 0 0 0 1px rgba(0,200,200,0.14), 0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(0,180,180,0.1);
        }

        /* ── Spray-stroke underline ── */
        .spray-underline {
          position: relative;
          display: inline-block;
        }
        .spray-underline::after {
          content: '';
          position: absolute;
          left: 0; right: 0; bottom: -4px;
          height: 4px;
          background: linear-gradient(to right, ${C.cyan}, ${C.blue});
          border-radius: 2px;
          filter: blur(1px);
          opacity: 0.7;
        }
      `}</style>

      <GraffitiCanvas />

      {/* ── NAV ─────────────────────────────────────────────────── */}
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
            <button onClick={() => document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })} className="btn-cyan flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm" style={{ fontSize: '14px' }}>
              <Ticket className="w-3.5 h-3.5" /> Tickets
            </button>
          </div>
        </div>
      </nav>

      {payStatus === 'success' && (
        <div className="fixed top-16 inset-x-0 z-40" style={{ backgroundColor: 'rgba(0,212,212,0.07)', borderBottom: '1px solid rgba(0,212,212,0.2)', backdropFilter: 'blur(16px)' }}>
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center gap-3">
            <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: C.cyan }} />
            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: C.cyan }}>Zahlung erfolgreich! Dein Ticket kommt per E-Mail.</p>
          </div>
        </div>
      )}

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="relative z-10">
        {/* Banner — fully visible, pushed below nav */}
        <motion.div className="relative w-full" style={{ paddingTop: '64px', y: bannerY, opacity: bannerOp }}>
          <img src="/22.08.2026_(2).jpg" alt="Harmony Festival 2026"
            style={{ display: 'block', width: '100%', height: 'auto', objectFit: 'cover', objectPosition: 'center top' }} />
          {/* subtle cyan tint at top of banner */}
          <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(0,212,212,0.05) 0%, transparent 25%)' }} />
          {/* bottom fade: banner bleeds into content area */}
          <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '220px', background: `linear-gradient(to bottom, transparent 0%, rgba(8,12,16,0.55) 50%, ${C.bg} 100%)` }} />
        </motion.div>

        {/* Glow band at the transition point */}
        <div className="relative pointer-events-none" style={{ height: '2px', background: `linear-gradient(to right, transparent 0%, ${C.cyan}55 25%, ${C.blue}70 50%, ${C.cyan}55 75%, transparent 100%)`, filter: 'blur(1px)', marginTop: '-2px' }} />

        {/* Ambient light spill below banner */}
        <div className="absolute left-0 right-0 pointer-events-none" style={{
          top: '64px', height: '520px',
          background: `radial-gradient(ellipse 70% 40% at 50% 0%, rgba(0,212,212,0.09) 0%, rgba(30,144,212,0.05) 40%, transparent 100%)`,
          zIndex: 1,
        }} />

        {/* Title + CTAs below the banner */}
        <div className="relative max-w-6xl mx-auto px-6 sm:px-10 pt-12 pb-20" style={{ zIndex: 2 }}>
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}>
            <div className="tag-label mb-4">Ein Abend für Düsseldorf · 22. August 2026</div>

            <h1 className="graffiti" style={{
              fontSize: 'clamp(72px, 16vw, 180px)',
              lineHeight: 0.86,
              color: '#ffffff',
              marginBottom: '8px',
              textShadow: `0 0 80px rgba(0,212,212,0.35), 0 0 140px rgba(30,144,212,0.2)`,
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
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 500, fontSize: '15px', color: 'rgba(180,240,240,0.8)' }}>16:30 – 02:00 Uhr</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-cyan inline-flex items-center justify-center gap-2.5 px-10 py-4 rounded-xl"
                style={{ fontSize: '17px' }}>
                <Ticket className="w-5 h-5" /> Ticket sichern · ab 8,50 €
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => document.getElementById('programm')?.scrollIntoView({ behavior: 'smooth' })}
                className="btn-ghost-cyan inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl"
                style={{ fontSize: '16px' }}>
                Programm <ChevronDown className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── COUNTDOWN ───────────────────────────────────────────── */}
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
                "Ich lade dich ein in meinen Safe Space am Rhein."
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.65)', lineHeight: 1.8 }}>
                Inspiriert vom Harmony Beach, angetrieben von meiner Vision für DYD. Erlebe Musik, echte Begegnung und mein liebstes Bier aus der Heimat.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTENT ─────────────────────────────────────────────── */}
      <div className="relative z-10">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 pb-32">

          {/* ── PROGRAMM ─────────────────────────────────────────── */}
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

            <div className="rounded-2xl overflow-hidden glass" style={{ border: `1px solid rgba(0,212,212,0.1)` }}>
              {ACTS.map((act, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="act-row flex items-center gap-6 sm:gap-10 px-6 sm:px-10 py-6 sm:py-7">
                  <span className="graffiti hidden sm:block flex-shrink-0"
                    style={{ fontSize: 'clamp(38px, 5vw, 56px)', color: `${act.color}18`, lineHeight: 1 }}>{act.num}</span>
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

          {/* ── POSTER ───────────────────────────────────────────── */}
          <PosterSwitcher />

          <div className="divider" />

          {/* ── WARUM ────────────────────────────────────────────── */}
          <section>
            <motion.div {...fadeUp} className="mb-12">
              <div className="tag-label mb-3">Warum Harmony?</div>
              <h2 className="graffiti" style={{ fontSize: 'clamp(48px, 8vw, 88px)', color: '#fff', lineHeight: 0.9 }}>
                Musik bringt<br /><span style={{ color: C.cyan, textShadow: `0 0 40px ${C.cyan}55` }}>uns zusammen</span>
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-12">
              {[
                { n: '01', label: 'Offen für alle',        sub: 'Humane Preise, kein VIP-Bullshit',         color: C.orange },
                { n: '02', label: 'Nicht kommerziell',     sub: 'Authentische Künstler, echte Energie',     color: C.cyan   },
                { n: '03', label: 'You will always remember', sub: 'Mix aus allen Genres, für alle Menschen', color: C.sky  },
              ].map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.55, delay: i * 0.1 }}
                  className="glass rounded-2xl p-7 relative overflow-hidden hover:border-cyan-500/20 transition-colors duration-200"
                  style={{ border: `1px solid rgba(0,212,212,0.1)` }}>
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
                "Ich habe das Gefühl, wir stecken in Deutschland gerade mitten in einer tiefen Spaltung. Wir reden oft mehr übereinander als miteinander. Aber ich weiß, dass es einen Weg zurück gibt."
              </p>
              <div style={{ width: '40px', height: '2px', background: `linear-gradient(to right, ${C.cyan}, transparent)`, marginBottom: '20px', borderRadius: '2px' }} />
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.65)', lineHeight: 1.85, marginBottom: '16px' }}>
                Auf Jamaika war es in den 70ern genau das Gleiche: Das Land war zerrissen, bis die Musik – vor allem der Reggae – die Menschen wieder zusammengebracht hat. Heute ist Jamaika laut, unfassbar lebendig und geprägt von einem krassen Zusammenhalt. Klar, als Tourist ist es manchmal anstrengend, und beim „Abziehen" sind sie leider auch ganz vorne mit dabei – aber genau das gehört zu dieser rohen, echten Energie.
              </p>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.65)', lineHeight: 1.85 }}>
                Mitten in diesem lauten Getümmel der Innenstadt von Montego Bay liegt der Harmony Beach. Dieser Strand hat mir neben einem wundervollen Ausblick vor allem eines gegeben: Die Kraft, wieder zurück ins Getümmel zu gehen. Genau so einen Platz möchte ich mit Harmony nach Düsseldorf bringen – ein Ort, an dem wir kurz durchatmen, die Vorurteile vergessen und uns darauf konzentrieren, was wir alle wollen: Einfach glücklich sein und eine geile Zeit haben.
              </p>
            </motion.div>
          </section>

          <div className="divider" />

          {/* ── DYD MISSION ──────────────────────────────────────── */}
          <motion.section {...fadeUp}>
            <div className="glass-cyan rounded-2xl px-8 sm:px-12 py-10">
              <div className="flex items-start gap-4 mb-5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `rgba(0,212,212,0.12)`, border: `1px solid rgba(0,212,212,0.28)` }}>
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
              <button onClick={() => navigate('/cv-check')} className="btn-ghost-cyan inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm" style={{ fontSize: '14px' }}>
                CV checken & optimieren <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.section>

          <div className="divider" />

          {/* ── FEATURES ─────────────────────────────────────────── */}
          <section>
            <motion.div {...fadeUp} className="mb-10">
              <div className="tag-label mb-3">Was Harmony besonders macht</div>
            </motion.div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Users,     title: 'Für alle',          desc: 'Fair, zugänglich und gemeinsam gestaltet.',                                  color: C.sky    },
                { icon: Mic,       title: 'Neue Talente',       desc: 'Bühne für lokale Künstlerinnen und Künstler, die gehört werden wollen.',    color: C.cyan   },
                { icon: Handshake, title: 'Offene Räume',       desc: 'Begegnung, Workshops und kultureller Austausch in entspannter Atmosphäre.', color: C.lime   },
                { icon: Music,     title: 'Musik & Miteinander',desc: 'Nicht kommerziell – echter Fokus auf Verbindung.',                          color: C.orange },
              ].map((f, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }} whileHover={{ y: -3 }}
                  className="glass rounded-2xl p-6 flex gap-5 items-start transition-all duration-200">
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

          {/* ── BIER-BRÜCKE ──────────────────────────────────────── */}
          <motion.section {...fadeUp}>
            <div className="glass rounded-2xl px-8 sm:px-12 py-10" style={{ border: `1px solid rgba(200,232,64,0.14)` }}>
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
                  { file: 'gruner_bier_radeberger_gruppe_41338-167277218.png', name: 'Grüner Bier', bg: '#fff' },
                  { file: 'Hofmann.png', name: 'Hofmann', bg: '#fff' },
                  { file: 'brauerei-greif.png', name: 'Greif Bräu', bg: '#fff' },
                ].map(brand => (
                  <motion.div key={brand.name} whileHover={{ y: -3 }}
                    className="flex flex-col items-center gap-3 rounded-xl py-6 px-3 transition-all duration-200"
                    style={{ background: 'rgba(200,232,64,0.04)', border: '1px solid rgba(200,232,64,0.1)' }}>
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: brand.bg }}>
                      <img src={`/${brand.file}`} alt={brand.name} className="w-full h-full object-contain p-2" />
                    </div>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 500, color: 'rgba(200,232,64,0.55)', letterSpacing: '0.04em', textAlign: 'center' }}>{brand.name}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <div className="divider" />

          {/* ── CREW-DEAL ────────────────────────────────────────── */}
          <motion.section {...fadeUp}>
            <div className="glass rounded-2xl px-8 sm:px-12 py-10">
              <div className="flex items-start justify-between flex-wrap gap-5 mb-8">
                <div>
                  <div className="tag-label mb-3">Community</div>
                  <h2 className="graffiti" style={{ fontSize: 'clamp(32px, 5vw, 54px)', color: '#fff' }}>Crew-Deal</h2>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(160,230,230,0.55)', marginTop: '8px' }}>Ticket gegen Hilfe — Budget ist knapp? Werde Teil meiner Crew!</p>
                </div>
                <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.cyan, padding: '5px 12px', border: `1px solid rgba(0,212,212,0.28)`, borderRadius: '6px', alignSelf: 'flex-start', whiteSpace: 'nowrap' }}>Spots limitiert</span>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                {[
                  { label: 'Dein Einsatz', value: '2,5 h Theke oder Service' },
                  { label: 'Dein Benefit', value: 'Freies Ticket für den restlichen Abend' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl p-6" style={{ background: 'rgba(0,212,212,0.04)', border: `1px solid rgba(0,212,212,0.1)` }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.cyan, opacity: 0.5, marginBottom: '10px' }}>{item.label}</p>
                    <p className="graffiti" style={{ fontSize: '22px', color: '#fff' }}>{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2.2 }}
                  className="flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 600, color: C.cyan }}>
                  <Clock className="w-3.5 h-3.5" /> Deadline: 15.07.2026
                </motion.div>
                <motion.a whileHover={{ scale: 1.02 }} href="https://forms.gle/iX7CoWsBXTrausYM7"
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg"
                  style={{ background: `rgba(0,212,212,0.08)`, border: `1px solid rgba(0,212,212,0.22)`, color: C.cyan, fontFamily: "'Inter', sans-serif", fontSize: '14px', fontWeight: 600 }}>
                  <Mail className="w-4 h-4" /> Betreff „Crew" schreiben
                </motion.a>
              </div>
            </div>
          </motion.section>

          <div className="divider" />

          {/* ── HARMONY UNTERSTÜTZEN ─────────────────────────────── */}
          <motion.section {...fadeUp}>
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

                {/* Official Sponsor Badge */}
                <div className="mb-6" style={{ maxWidth: '320px' }}>
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '12px', color: 'rgba(0,212,212,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px' }}>Offizieller Sponsor</div>
                  <div className="rounded-xl px-5 py-4" style={{ background: '#fff' }}>
                    <img src="/SSKDD_Logo3.png" alt="Stadtsparkasse Düsseldorf – Offizieller Sponsor" style={{ display: 'block', width: '100%', height: 'auto' }} />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    const supportTicket = {
                      id: 'support',
                      priceId: import.meta.env.VITE_STRIPE_HARMONY_SUPPORT,
                      label: 'Community Support',
                      price: 0,
                      description: '',
                      highlight: false,
                      badge: null,
                      perk: '',
                      accent: 'rgba(0,175,175,0.85)',
                      accentAlpha: 'rgba(0,160,160,0.1)',
                      accentShadow: 'rgba(0,140,140,0.06)',
                    };
                    doCheckout(supportTicket as typeof TICKETS[0], profile?.full_name || '');
                  }}
                  disabled={loadingId !== null}
                  className="btn-cyan inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ fontSize: '15px' }}>
                  {loadingId === 'support'
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Weiterleitung...</>
                    : <><Heart className="w-4 h-4" /> Jetzt unterstützen</>}
                </motion.button>
              </div>
            </div>
          </motion.section>

          <div className="divider" />

          {/* ── LOKALE SPONSOREN ─────────────────────────────────── */}
          <motion.section {...fadeUp}>
            <div className="mb-10">
              <div className="tag-label mb-3">Partner & Sponsoren</div>
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
                  { icon: Star,      title: 'Logo auf allen Materialien',  desc: 'Print, Digital, Social Media – dein Brand überall sichtbar.',         color: C.cyan   },
                  { icon: Mic,       title: 'Nennung auf der Bühne',       desc: 'Dein Unternehmen wird vor dem Publikum vorgestellt.',                  color: C.sky    },
                  { icon: Users,     title: 'Direkter Kundenkontakt',      desc: 'Stand oder Präsenz vor Ort – echte Begegnung mit deiner Zielgruppe.', color: C.lime   },
                  { icon: Heart,     title: 'Regionale Identität stärken', desc: 'Als lokaler Partner zeigst du, dass du Düsseldorf liebst.',            color: C.orange },
                ].map((perk, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: i * 0.08 }}
                    className="flex items-start gap-4 rounded-xl p-5"
                    style={{ background: 'rgba(0,212,212,0.03)', border: `1px solid rgba(0,212,212,0.1)` }}>
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

              {/* Stadtsparkasse Düsseldorf – Official Sponsor */}
              <div className="mb-6 rounded-2xl p-6" style={{ background: 'rgba(232,51,10,0.06)', border: '1px solid rgba(232,51,10,0.2)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#E8330A', boxShadow: '0 0 8px #E8330A88' }} />
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: 'rgba(232,51,10,0.9)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Offizieller Sponsor
                  </div>
                </div>
                <div className="rounded-xl px-6 py-5 mb-4" style={{ background: '#fff', maxWidth: '380px' }}>
                  <img src="/SSKDD_Logo3.png" alt="Stadtsparkasse Düsseldorf" style={{ display: 'block', width: '100%', height: 'auto' }} />
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.65 }}>
                  Die Stadtsparkasse Düsseldorf ist offizieller Sponsor von Harmony – und zeigt damit, wie ein starker lokaler Partner aussieht.
                </p>
              </div>

              {/* Füchschen Alt – Lokaler Sponsor */}
              <div className="mb-6 rounded-2xl p-6" style={{ background: 'rgba(180,60,20,0.06)', border: '1px solid rgba(180,60,20,0.2)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#B43C14', boxShadow: '0 0 8px #B43C1488' }} />
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: 'rgba(220,100,60,0.9)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Lokaler Sponsor
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="rounded-xl p-3 flex-shrink-0" style={{ background: '#fff', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/logo_fuechschen-alt.jpg" alt="Füchschen Alt" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain', borderRadius: '6px' }} />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '20px', color: '#fff', marginBottom: '4px' }}>Füchschen Alt</h4>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.65 }}>
                      Eine traditionelle Brauerei aus der Düsseldorfer Altstadt – echtes Altbier, echter Charakter. Füchschen bringt die Altstadt-Seele zu Harmony.
                    </p>
                  </div>
                </div>
              </div>

              {/* Monsterslush – Lokaler Sponsor */}
              <div className="mb-6 rounded-2xl p-6" style={{ background: 'rgba(220,40,40,0.05)', border: '1px solid rgba(220,40,40,0.18)' }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#DC2828', boxShadow: '0 0 8px #DC282888' }} />
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: 'rgba(220,80,60,0.9)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Lokaler Sponsor
                  </div>
                </div>
                <div className="flex items-center gap-5">
                  <div className="rounded-xl p-2 flex-shrink-0" style={{ background: '#fff', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src="/monsterslush-logo.png" alt="Monsterslush" style={{ display: 'block', width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <div>
                    <h4 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '20px', color: '#fff', marginBottom: '4px' }}>Monsterslush</h4>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.65 }}>
                      Kühle Erfrischung für heiße Abende – Monsterslush sorgt dafür, dass auf Harmony niemand dursten muss.
                    </p>
                  </div>
                </div>
              </div>

              {/* Medienpartner & Reichweite */}
              <div className="mb-6 rounded-2xl p-6" style={{ background: 'rgba(0,140,212,0.05)', border: '1px solid rgba(0,140,212,0.18)' }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: C.sky, boxShadow: `0 0 8px ${C.sky}88` }} />
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '13px', color: 'rgba(100,190,255,0.9)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    Reichweite & Sichtbarkeit
                  </div>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(160,230,230,0.65)', lineHeight: 1.7, marginBottom: '20px' }}>
                  Harmony ist dort zu finden, wo Düsseldorf unterwegs ist – auf den größten lokalen Plattformen der Stadt.
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { file: 'Mr._Duesseldorf.png', name: 'Mr. Düsseldorf', bg: '#fff' },
                    { file: 'Visit_Dusseldorf.png', name: 'Visit Düsseldorf', bg: '#fff' },
                    { file: 'rausgegangen.png', name: 'Rausgegangen', bg: '#fff' },
                  ].map(p => (
                    <motion.div key={p.name} whileHover={{ y: -2 }}
                      className="flex flex-col items-center gap-3 rounded-xl py-5 px-3"
                      style={{ background: 'rgba(0,140,212,0.04)', border: '1px solid rgba(0,140,212,0.12)' }}>
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden" style={{ background: p.bg }}>
                        <img src={`/${p.file}`} alt={p.name} className="w-full h-full object-contain p-2" />
                      </div>
                      <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: '12px', color: 'rgba(160,210,255,0.75)', textAlign: 'center', lineHeight: 1.3 }}>{p.name}</div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Fränkische Biermarken */}
              <div className="mb-7 rounded-2xl p-6" style={{ background: 'rgba(200,232,64,0.04)', border: '1px solid rgba(200,232,64,0.12)' }}>
                <div className="flex items-center gap-3 mb-4">
                  <Beer className="w-5 h-5" style={{ color: C.lime }} />
                  <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '17px', color: '#fff', letterSpacing: '0.06em' }}>
                    Bereits an Bord: Die Bier-Brücke
                  </div>
                </div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.5)', lineHeight: 1.7, marginBottom: '16px' }}>
                  Als Fürther bringe ich echtes fränkisches Handwerk mit nach Düsseldorf – und mit Füchschen Alt eine echte Altstadt-Legende direkt aus Düsseldorf. Diese Brauereien zeigen, wie lokales Sponsoring aussehen kann – authentisch, mit Charakter.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { file: 'gruner_bier_radeberger_gruppe_41338-167277218.png', name: 'Grüner Bier', city: 'Fürth' },
                    { file: 'Hofmann.png', name: 'Hofmann', city: 'Pahres' },
                    { file: 'brauerei-greif.png', name: 'Greif Bräu', city: 'Forchheim' },
                    { file: 'logo_fuechschen-alt.jpg', name: 'Füchschen Alt', city: 'Düsseldorf' },
                  ].map(brand => (
                    <motion.div key={brand.name} whileHover={{ y: -2 }}
                      className="flex flex-col items-center gap-2 rounded-xl py-5 px-3 transition-all duration-200"
                      style={{ background: 'rgba(200,232,64,0.04)', border: '1px solid rgba(200,232,64,0.1)' }}>
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center bg-white overflow-hidden">
                        <img src={`/${brand.file}`} alt={brand.name} className="w-full h-full object-contain p-1.5" />
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
                  "Sponsoring bei Harmony bedeutet nicht, Werbefläche zu mieten – es bedeutet, Teil einer echten Community-Geschichte zu werden."
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '24px', height: '2px', background: `linear-gradient(to right, ${C.lime}, transparent)`, borderRadius: '2px' }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(200,232,64,0.5)', letterSpacing: '0.1em' }}>DYD – Decide Your Dream</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
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

          {/* ── DEINE TICKETS (if logged in and have tickets) ─────── */}
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
                    {purchasedTickets.map((t) => {
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
                            </div>

                            {(t.bierpong_team_name) && (
                              <div className="mt-3 rounded-xl p-4" style={{ background: `rgba(200,232,64,0.05)`, border: `1px solid rgba(200,232,64,0.18)` }}>
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

                            <div className="mt-4 pt-4 flex items-center justify-between" style={{ borderTop: `1px solid rgba(0,212,212,0.08)` }}>
                              <div className="flex items-center gap-2" style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(160,230,230,0.4)' }}>
                                <MapPin className="w-3 h-3" /> Burgplatz · 16:30–02:00 Uhr
                              </div>
                              <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '16px', color: accent }}>
                                {t.amount_paid ? (t.amount_paid / 100).toLocaleString('de-DE', { minimumFractionDigits: 2 }) + ' €' : ''}
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

          {/* ── TICKETS ──────────────────────────────────────────── */}
          <section id="tickets">
            {/* Header */}
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
              <div className="mb-8 p-4 rounded-xl text-center"
                style={{ background: 'rgba(240,120,32,0.07)', border: `1px solid ${C.orange}28`, color: C.orange, fontFamily: "'Inter', sans-serif", fontSize: '14px' }}>
                {error}
              </div>
            )}

            {/* ── HERO BUNDLE ── */}
            {(() => {
              const hero = TICKETS[0];
              return (
                <motion.div key={hero.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.55 }} className="tr-hero mb-5">
                  <div className="relative z-10 p-7 sm:p-10">
                    {/* badge row – always visible, no overflow clip */}
                    {hero.badge && (
                      <div className="flex items-center gap-3 mb-5">
                        <span style={{
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: '11px', letterSpacing: '0.28em', fontWeight: 900,
                          textTransform: 'uppercase', padding: '4px 14px', borderRadius: '4px',
                          backgroundColor: 'rgba(0,200,200,0.22)', color: '#00c8c8',
                          border: '1px solid rgba(0,200,200,0.45)',
                        }}>
                          {hero.badge}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <Star className="w-3 h-3" style={{ color: 'rgba(0,175,175,0.5)' }} />
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(0,175,175,0.5)' }}>
                            Meistgewählt · Bestes Angebot
                          </span>
                        </div>
                      </div>
                    )}
                    {/* main row */}
                    <div className="flex flex-col sm:flex-row sm:items-end gap-6 sm:gap-10 mb-7">
                      <div className="flex-1 min-w-0">
                        <h3 className="graffiti" style={{ fontSize: 'clamp(30px, 5vw, 52px)', color: '#fff', lineHeight: 0.9, marginBottom: '12px' }}>
                          {hero.label}
                        </h3>
                        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(180,230,230,0.55)', lineHeight: 1.7, maxWidth: '480px' }}>
                          {hero.description}
                        </p>
                      </div>
                      {/* price block */}
                      <div className="flex-shrink-0 text-right">
                        <div className="flex items-center justify-end gap-2 mb-1">
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(180,210,210,0.4)', textDecoration: 'line-through', letterSpacing: '0.04em' }}>43,50 €</span>
                          <span className="px-2 py-0.5 rounded-md" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', background: 'rgba(0,160,160,0.1)', color: 'rgba(0,185,185,0.75)', border: '1px solid rgba(0,160,160,0.2)' }}>
                            −5,51 € sparen
                          </span>
                        </div>
                        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(0,175,175,0.35)', marginBottom: '2px' }}>Bundlepreis</div>
                        <span className="price-num" style={{ fontSize: 'clamp(36px, 6vw, 58px)', color: '#00c8c8', lineHeight: 1 }}>
                          {hero.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                        </span>
                      </div>
                    </div>
                    {/* included chips */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        { icon: Mic,   label: 'Zirkel.WTF Live' },
                        { icon: Laugh, label: 'Stand-Up Comedy' },
                        { icon: Disc3, label: 'DJ Night' },
                      ].map((item) => (
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
                    {/* Early Bird urgency bar */}
                    <div className="rounded-xl mb-4 overflow-hidden" style={{ border: '1px solid rgba(0,200,200,0.2)', background: 'rgba(0,18,22,0.7)' }}>
                      <div className="flex items-center gap-3 px-4 py-2.5" style={{ borderBottom: '1px solid rgba(0,200,200,0.1)', background: 'rgba(0,200,200,0.07)' }}>
                        <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '11px', letterSpacing: '0.22em', color: '#00c8c8' }}>EARLY BIRD ENDET AM 30.04.2026</span>
                        <span className="ml-auto" style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color: 'rgba(255,120,80,0.9)', letterSpacing: '0.04em' }}>
                          Nur noch 120 Tickets
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-5 px-4 py-3">
                        {[
                          { val: ebCd.d, label: 'Tage' },
                          { val: ebCd.h, label: 'Std' },
                          { val: ebCd.m, label: 'Min' },
                          { val: ebCd.s, label: 'Sek' },
                        ].map(({ val, label }, i) => (
                          <div key={label} className="flex items-center gap-5">
                            <div className="flex flex-col items-center" style={{ minWidth: '40px' }}>
                              <AnimatePresence mode="popLayout">
                                <motion.span key={val} initial={{ y: -12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 12, opacity: 0 }} transition={{ duration: 0.15 }}
                                  style={{ display: 'block', fontFamily: "'Bebas Neue', sans-serif", fontSize: '28px', color: '#fff', lineHeight: 1, letterSpacing: '0.04em' }}>
                                  {String(val).padStart(2, '0')}
                                </motion.span>
                              </AnimatePresence>
                              <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '9px', letterSpacing: '0.24em', color: 'rgba(0,200,200,0.55)', fontWeight: 600, textTransform: 'uppercase', marginTop: '1px' }}>{label}</span>
                            </div>
                            {i < 3 && <span style={{ color: 'rgba(0,200,200,0.3)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', lineHeight: 1, marginTop: '-6px' }}>:</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* free drink bonus */}
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-7"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}>
                      <Beer className="w-4 h-4 flex-shrink-0" style={{ color: 'rgba(200,220,100,0.7)' }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 500, color: 'rgba(210,230,160,0.7)' }}>
                        + 1 Getränk nach Wahl gratis beim Einlass
                      </span>
                      <span className="ml-auto px-2 py-0.5 rounded-md flex-shrink-0" style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', background: 'rgba(200,220,80,0.1)', color: 'rgba(210,230,130,0.7)', border: '1px solid rgba(200,220,80,0.18)' }}>
                        GRATIS
                      </span>
                    </div>
                    {/* CTA */}
                    <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.97 }}
                      onClick={() => handleBuy(hero)} disabled={loadingId !== null}
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl disabled:opacity-40 disabled:cursor-not-allowed"
                      style={{
                        background: `linear-gradient(90deg, #00c8c8 0%, #00a0a0 100%)`,
                        color: '#040c0c',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '22px', letterSpacing: '0.2em',
                        boxShadow: `0 4px 36px rgba(0,200,200,0.45), 0 1px 0 rgba(255,255,255,0.18) inset`,
                      }}>
                      {loadingId === hero.id
                        ? <><Loader2 className="w-5 h-5 animate-spin" />Weiterleitung...</>
                        : <><Ticket className="w-5 h-5" />Bundle sichern – {hero.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €</>}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })()}

            {/* ── SINGLE TICKETS LIST ── */}
            <div className="space-y-3 mb-6">
              {TICKETS.slice(1).map((ticket, i) => (
                <motion.div key={ticket.id} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="tr-card"
                  style={{
                    '--ticket-accent': ticket.accent,
                    '--ticket-accent-alpha': ticket.accentAlpha,
                    '--ticket-accent-shadow': ticket.accentShadow,
                  } as React.CSSProperties}>
                  {/* left accent bar handled by ::before */}
                  <div className="relative z-10 flex items-center gap-4 sm:gap-6 w-full px-6 py-5">
                    {/* index number */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ background: `${ticket.accent}12`, border: `1px solid ${ticket.accent}22` }}>
                      <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '18px', color: ticket.accent, lineHeight: 1 }}>{String(i + 2).padStart(2, '0')}</span>
                    </div>
                    {/* label + desc */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="graffiti" style={{ fontSize: 'clamp(17px, 2.2vw, 22px)', color: '#fff', lineHeight: 1 }}>{ticket.label}</h3>
                        {ticket.badge && (
                          <span className="sticker relative" style={{ backgroundColor: ticket.accent, color: '#080c10', fontSize: '9px', padding: '2px 8px', transform: 'rotate(0deg)', top: 0 }}>
                            {ticket.badge}
                          </span>
                        )}
                      </div>
                      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(180,210,210,0.48)', lineHeight: 1.55, marginTop: '3px' }}>{ticket.description}</p>
                      {ticket.perk && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg"
                          style={{ background: ticket.accentAlpha, border: `1px solid ${ticket.accent}25` }}>
                          <Trophy className="w-3 h-3 flex-shrink-0" style={{ color: ticket.accent }} />
                          <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 600, color: ticket.accent }}>{ticket.perk}</span>
                        </div>
                      )}
                    </div>
                    {/* price + buy */}
                    <div className="flex-shrink-0 flex flex-col items-end gap-2 pl-4"
                      style={{ borderLeft: `1px solid rgba(255,255,255,0.05)` }}>
                      <span className="price-num" style={{ fontSize: '24px', color: ticket.accent, lineHeight: 1 }}>
                        {ticket.price.toLocaleString('de-DE', { minimumFractionDigits: 2 })} €
                      </span>
                      <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => handleBuy(ticket)} disabled={loadingId !== null}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        style={{
                          background: `${ticket.accent}18`,
                          border: `1px solid ${ticket.accent}40`,
                          color: ticket.accent,
                          fontFamily: "'Bebas Neue', sans-serif",
                          fontSize: '13px', letterSpacing: '0.16em',
                        }}>
                        {loadingId === ticket.id
                          ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Laden</>
                          : <>Kaufen<ArrowRight className="w-3.5 h-3.5" /></>}
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {loadingId !== null && showSlowHint && (
              <p className="text-center mt-2 mb-4" style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(160,200,200,0.35)', letterSpacing: '0.05em' }}>
                Beim ersten Mal kann dies etwas laenger dauern...
              </p>
            )}

            {/* Trust bar */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-8 py-4 px-5 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
              {[
                { icon: Lock,        text: 'Sichere Zahlung via Stripe' },
                { icon: Mail,        text: 'Ticket per E-Mail' },
                { icon: ShieldCheck, text: 'Kauf unterstützt DYD direkt' },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'rgba(160,200,200,0.35)' }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(160,200,200,0.35)', letterSpacing: '0.04em' }}>{item.text}</span>
                </div>
              ))}
            </div>
          </section>

          <div className="divider" />

          {/* ── HARD FACTS ───────────────────────────────────────── */}
          <motion.section {...fadeUp}>
            <div className="tag-label mb-10">Hard Facts</div>
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              {[
                { icon: MapPin, label: 'Location', value: 'Klub Kulb\nBurgplatz 11 · 40213 Düsseldorf', color: C.cyan   },
                { icon: Clock,  label: 'Zeit',     value: '22.08.2026\n16:30 – 02:00 Uhr',   color: C.sky    },
                { icon: Users,  label: 'Einlass',  value: 'Ab 18 Jahren\nAwareness-Team',    color: C.lime   },
              ].map((item, i) => (
                <motion.div key={i} whileHover={{ y: -3 }} className="glass rounded-2xl p-7 transition-all duration-200">
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
              onClick={() => document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })}
              className="btn-cyan w-full flex items-center justify-center gap-3 py-5 rounded-2xl"
              style={{ fontSize: '18px' }}>
              <Ticket className="w-5 h-5" /> Jetzt Ticket kaufen · 22.08.2026
            </motion.button>
          </motion.section>

        </div>
      </div>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="relative z-10 py-10 text-center glass" style={{ borderTop: `1px solid rgba(0,212,212,0.09)` }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '14px', letterSpacing: '0.3em', textTransform: 'uppercase', color: `${C.cyan}40`, marginBottom: '12px' }}>
          Harmony 2026 · DYD
        </div>
        <div className="flex items-center justify-center gap-4 mb-4">
          <a
            href="https://www.instagram.com/dyd_harmony"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 px-4 py-2 rounded-full border transition-all"
            style={{ borderColor: 'rgba(0,212,212,0.2)', background: 'rgba(0,212,212,0.05)', color: 'rgba(0,212,212,0.7)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,212,212,0.12)'; (e.currentTarget as HTMLAnchorElement).style.color = C.cyan; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0,212,212,0.05)'; (e.currentTarget as HTMLAnchorElement).style.color = 'rgba(0,212,212,0.7)'; }}
          >
            <svg viewBox="0 0 24 24" fill="none" style={{ width: '15px', height: '15px' }} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
              <circle cx="12" cy="12" r="4"/>
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
            </svg>
            <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', letterSpacing: '0.04em' }}>@dyd_harmony</span>
          </a>
        </div>
        <button onClick={() => navigate('/')} className="transition-opacity hover:opacity-50"
          style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.22)', letterSpacing: '0.04em' }}>
          ← Zurück zu DYD
        </button>
      </footer>

      {/* ── MOBILE STICKY CTA ───────────────────────────────────── */}
      <motion.div initial={{ y: 80 }} animate={{ y: 0 }} transition={{ delay: 2.5, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="fixed bottom-0 inset-x-0 z-40 sm:hidden p-4"
        style={{ background: `linear-gradient(to top, rgba(8,12,16,0.98) 55%, transparent)` }}>
        <button onClick={() => document.getElementById('tickets')?.scrollIntoView({ behavior: 'smooth' })}
          className="btn-cyan w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl" style={{ fontSize: '16px' }}>
          <Ticket className="w-4 h-4" /> Ticket sichern – ab 8,50 €
        </button>
      </motion.div>

      {/* ── NAME MODAL ───────────────────────────────────────────── */}
      <AnimatePresence>
        {nameModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(8,12,16,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setNameModal(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl p-8"
              style={{ background: 'rgba(8,18,22,0.98)', border: `1px solid rgba(0,212,212,0.22)`, boxShadow: `0 0 80px rgba(0,212,212,0.08), 0 32px 80px rgba(0,0,0,0.7)` }}>
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(to right, transparent, ${C.cyan}80, transparent)` }} />

              <button onClick={() => setNameModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'rgba(160,230,230,0.4)', background: 'rgba(0,212,212,0.05)' }}>
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `rgba(0,212,212,0.1)`, border: `1px solid rgba(0,212,212,0.25)` }}>
                  <Ticket className="w-5 h-5" style={{ color: C.cyan }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.cyan, opacity: 0.7 }}>{nameModal.ticket.label}</p>
                  <h3 className="graffiti" style={{ fontSize: '26px', color: '#fff', lineHeight: 1 }}>Dein Name</h3>
                </div>
              </div>

              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '14px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.7, marginBottom: '24px' }}>
                Dein Name erscheint auf dem Ticket und wird fuer die Buchungsbestaetigung benoetigt.
              </p>

              <div>
                <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.5)', display: 'block', marginBottom: '8px' }}>
                  Vor- & Nachname <span style={{ color: C.cyan }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="z.B. Max Mustermann"
                  value={buyerName}
                  onChange={(e) => { setBuyerName(e.target.value); setBuyerNameError(''); }}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameConfirm()}
                  autoFocus
                  className="w-full rounded-xl px-4 py-3 outline-none transition-all"
                  style={{ background: 'rgba(0,212,212,0.04)', border: buyerNameError ? `1px solid ${C.orange}` : `1px solid rgba(0,212,212,0.2)`, color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '15px' }}
                />
                {buyerNameError && (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.orange, marginTop: '6px' }}>{buyerNameError}</p>
                )}
              </div>

              <label className="flex items-start gap-3 mt-6 cursor-pointer select-none"
                style={{ padding: '14px', borderRadius: '12px', background: ageConfirmed ? 'rgba(0,212,212,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${ageConfirmed ? 'rgba(0,212,212,0.3)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}>
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                    style={{ background: ageConfirmed ? C.cyan : 'transparent', border: `2px solid ${ageConfirmed ? C.cyan : 'rgba(160,230,230,0.3)'}` }}>
                    {ageConfirmed && <CheckCircle className="w-3 h-3" style={{ color: '#080c10' }} />}
                  </div>
                </div>
                <input type="checkbox" className="sr-only" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.7)', lineHeight: 1.5 }}>
                  Ich bestatige, dass ich mindestens <strong style={{ color: '#fff' }}>18 Jahre alt</strong> bin. <span style={{ color: C.cyan }}>*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 mt-3 cursor-pointer select-none"
                style={{ padding: '14px', borderRadius: '12px', background: agbConfirmed ? 'rgba(0,212,212,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${agbConfirmed ? 'rgba(0,212,212,0.3)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}>
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                    style={{ background: agbConfirmed ? C.cyan : 'transparent', border: `2px solid ${agbConfirmed ? C.cyan : 'rgba(160,230,230,0.3)'}` }}>
                    {agbConfirmed && <CheckCircle className="w-3 h-3" style={{ color: '#080c10' }} />}
                  </div>
                </div>
                <input type="checkbox" className="sr-only" checked={agbConfirmed} onChange={(e) => setAgbConfirmed(e.target.checked)} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.7)', lineHeight: 1.5 }}>
                  Ich habe die{' '}
                  <a href="/#/agb" target="_blank" rel="noopener noreferrer"
                    style={{ color: C.cyan, textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    onClick={(e) => e.stopPropagation()}>
                    Allgemeinen Geschaftsbedingungen
                  </a>{' '}
                  gelesen und stimme ihnen zu. <span style={{ color: C.cyan }}>*</span>
                </span>
              </label>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setNameModal(null)}
                  className="flex-1 py-3 rounded-xl transition-colors"
                  style={{ background: 'rgba(0,212,212,0.04)', border: `1px solid rgba(0,212,212,0.12)`, color: 'rgba(160,230,230,0.5)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em' }}>
                  Abbrechen
                </button>
                <motion.button whileHover={ageConfirmed && agbConfirmed && !!buyerName.trim() ? { scale: 1.03 } : {}} whileTap={ageConfirmed && agbConfirmed && !!buyerName.trim() ? { scale: 0.97 } : {}}
                  onClick={handleNameConfirm}
                  disabled={!ageConfirmed || !agbConfirmed || !buyerName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                  style={ageConfirmed && agbConfirmed && buyerName.trim() ? { background: `linear-gradient(135deg, ${C.cyan}, rgba(0,168,168,0.9))`, color: '#080c10', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em', fontWeight: 700, boxShadow: `0 3px 16px rgba(0,212,212,0.3)`, cursor: 'pointer' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em', cursor: 'not-allowed' }}>
                  <Ticket className="w-4 h-4" /> Weiter zum Kauf
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── BIERPONG TEAM MODAL ──────────────────────────────────── */}
      <AnimatePresence>
        {bierpongModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(8,12,16,0.85)', backdropFilter: 'blur(12px)' }}
            onClick={() => setBierpongModal(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl p-8"
              style={{ background: 'rgba(8,18,22,0.98)', border: `1px solid rgba(200,232,64,0.22)`, boxShadow: `0 0 80px rgba(200,232,64,0.08), 0 32px 80px rgba(0,0,0,0.7)` }}>
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(to right, transparent, ${C.lime}80, transparent)` }} />

              <button onClick={() => setBierpongModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'rgba(160,230,230,0.4)', background: 'rgba(0,212,212,0.05)' }}>
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `rgba(200,232,64,0.1)`, border: `1px solid rgba(200,232,64,0.25)` }}>
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
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.5)', display: 'block', marginBottom: '8px' }}>
                    Dein Name <span style={{ color: C.lime }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Max Mustermann"
                    value={bierpongBuyerName}
                    onChange={(e) => { setBierpongBuyerName(e.target.value); setBierpongBuyerNameError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleBierpongConfirm()}
                    autoFocus
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all"
                    style={{ background: 'rgba(0,212,212,0.04)', border: bierpongBuyerNameError ? `1px solid ${C.orange}` : `1px solid rgba(200,232,64,0.2)`, color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '15px' }}
                  />
                  {bierpongBuyerNameError && (
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.orange, marginTop: '6px' }}>{bierpongBuyerNameError}</p>
                  )}
                </div>

                <div>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.5)', display: 'block', marginBottom: '8px' }}>
                    Teamname <span style={{ color: C.lime }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="z.B. Pong Kings"
                    value={teamName}
                    onChange={(e) => { setTeamName(e.target.value); setTeamNameError(''); }}
                    onKeyDown={(e) => e.key === 'Enter' && handleBierpongConfirm()}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all"
                    style={{ background: 'rgba(0,212,212,0.04)', border: teamNameError ? `1px solid ${C.orange}` : `1px solid rgba(200,232,64,0.2)`, color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '15px' }}
                  />
                  {teamNameError && (
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: C.orange, marginTop: '6px' }}>{teamNameError}</p>
                  )}
                </div>

                <div>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.5)', display: 'block', marginBottom: '8px' }}>
                    Teammitglied <span style={{ color: 'rgba(160,230,230,0.3)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }}>(optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Vorname & Nachname"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleBierpongConfirm()}
                    className="w-full rounded-xl px-4 py-3 outline-none transition-all"
                    style={{ background: 'rgba(0,212,212,0.04)', border: `1px solid rgba(0,212,212,0.12)`, color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '15px' }}
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 mt-2 cursor-pointer select-none"
                style={{ padding: '14px', borderRadius: '12px', background: bierpongAgeConfirmed ? 'rgba(200,232,64,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${bierpongAgeConfirmed ? 'rgba(200,232,64,0.3)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}>
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                    style={{ background: bierpongAgeConfirmed ? C.lime : 'transparent', border: `2px solid ${bierpongAgeConfirmed ? C.lime : 'rgba(200,232,64,0.3)'}` }}>
                    {bierpongAgeConfirmed && <CheckCircle className="w-3 h-3" style={{ color: '#080c10' }} />}
                  </div>
                </div>
                <input type="checkbox" className="sr-only" checked={bierpongAgeConfirmed} onChange={(e) => setBierpongAgeConfirmed(e.target.checked)} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.7)', lineHeight: 1.5 }}>
                  Ich bestatige, dass ich mindestens <strong style={{ color: '#fff' }}>18 Jahre alt</strong> bin. <span style={{ color: C.lime }}>*</span>
                </span>
              </label>

              <label className="flex items-start gap-3 mt-3 cursor-pointer select-none"
                style={{ padding: '14px', borderRadius: '12px', background: bierpongAgbConfirmed ? 'rgba(200,232,64,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${bierpongAgbConfirmed ? 'rgba(200,232,64,0.3)' : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.2s' }}>
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-5 h-5 rounded-md flex items-center justify-center transition-all"
                    style={{ background: bierpongAgbConfirmed ? C.lime : 'transparent', border: `2px solid ${bierpongAgbConfirmed ? C.lime : 'rgba(200,232,64,0.3)'}` }}>
                    {bierpongAgbConfirmed && <CheckCircle className="w-3 h-3" style={{ color: '#080c10' }} />}
                  </div>
                </div>
                <input type="checkbox" className="sr-only" checked={bierpongAgbConfirmed} onChange={(e) => setBierpongAgbConfirmed(e.target.checked)} />
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.7)', lineHeight: 1.5 }}>
                  Ich habe die{' '}
                  <a href="/#/agb" target="_blank" rel="noopener noreferrer"
                    style={{ color: C.lime, textDecoration: 'underline', textUnderlineOffset: '3px' }}
                    onClick={(e) => e.stopPropagation()}>
                    Allgemeinen Geschaftsbedingungen
                  </a>{' '}
                  gelesen und stimme ihnen zu. <span style={{ color: C.lime }}>*</span>
                </span>
              </label>

              <div className="flex gap-3 mt-4">
                <button onClick={() => setBierpongModal(null)}
                  className="flex-1 py-3 rounded-xl transition-colors"
                  style={{ background: 'rgba(0,212,212,0.04)', border: `1px solid rgba(0,212,212,0.12)`, color: 'rgba(160,230,230,0.5)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em' }}>
                  Abbrechen
                </button>
                <motion.button whileHover={bierpongAgeConfirmed && bierpongAgbConfirmed && !!teamName.trim() && !!bierpongBuyerName.trim() ? { scale: 1.03 } : {}} whileTap={bierpongAgeConfirmed && bierpongAgbConfirmed && !!teamName.trim() && !!bierpongBuyerName.trim() ? { scale: 0.97 } : {}}
                  onClick={handleBierpongConfirm}
                  disabled={!bierpongAgeConfirmed || !bierpongAgbConfirmed || !teamName.trim() || !bierpongBuyerName.trim()}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all"
                  style={bierpongAgeConfirmed && bierpongAgbConfirmed && teamName.trim() && bierpongBuyerName.trim() ? { background: `linear-gradient(135deg, ${C.lime}, rgba(180,210,40,0.9))`, color: '#080c10', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em', fontWeight: 700, boxShadow: `0 3px 16px rgba(200,232,64,0.3)`, cursor: 'pointer' } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '15px', letterSpacing: '0.14em', cursor: 'not-allowed' }}>
                  <Ticket className="w-4 h-4" /> Weiter zum Kauf
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── AUTH MODAL (Login / Registrierung vor dem Kauf) ───────── */}
      <AnimatePresence>
        {authModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(8,12,16,0.9)', backdropFilter: 'blur(14px)' }}
            onClick={() => setAuthModal(null)}>
            <motion.div initial={{ scale: 0.92, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.92, opacity: 0, y: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl p-8"
              style={{ background: 'rgba(8,18,22,0.99)', border: `1px solid rgba(0,212,212,0.22)`, boxShadow: `0 0 80px rgba(0,212,212,0.09), 0 32px 80px rgba(0,0,0,0.75)` }}>
              <div className="absolute inset-x-0 top-0 h-0.5 rounded-t-2xl" style={{ background: `linear-gradient(to right, transparent, ${C.cyan}90, transparent)` }} />

              <button onClick={() => setAuthModal(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ color: 'rgba(160,230,230,0.4)', background: 'rgba(0,212,212,0.05)' }}>
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `rgba(0,212,212,0.1)`, border: `1px solid rgba(0,212,212,0.25)` }}>
                  <ShieldCheck className="w-5 h-5" style={{ color: C.cyan }} />
                </div>
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.cyan, opacity: 0.7 }}>{authModal.pendingTicket.label}</p>
                  <h3 className="graffiti" style={{ fontSize: '26px', color: '#fff', lineHeight: 1 }}>Ticket sichern</h3>
                </div>
              </div>

              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.6, marginBottom: '20px' }}>
                Melde dich an oder erstelle einen Account – dein Ticket wird dann automatisch in deinem Dashboard gespeichert und ist jederzeit abrufbar.
              </p>

              <div className="flex gap-2 mb-6" style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '4px' }}>
                {(['signup', 'login'] as const).map((tab) => (
                  <button key={tab} onClick={() => { setAuthTab(tab); setAuthError(null); }}
                    className="flex-1 py-2.5 rounded-lg transition-all"
                    style={authTab === tab ? { background: `linear-gradient(135deg, ${C.cyan}, rgba(0,168,168,0.9))`, color: '#080c10', fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700 } : { color: 'rgba(160,230,230,0.5)', fontFamily: "'Inter', sans-serif", fontSize: '13px' }}>
                    {tab === 'signup' ? 'Neu registrieren' : 'Ich habe einen Account'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                <div>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.5)', display: 'block', marginBottom: '8px' }}>
                    E-Mail <span style={{ color: C.cyan }}>*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,212,212,0.5)' }} />
                    <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="deine@email.com" required
                      className="w-full rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                      style={{ background: 'rgba(0,212,212,0.04)', border: `1px solid rgba(0,212,212,0.2)`, color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '15px' }} />
                  </div>
                </div>

                <div>
                  <label style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.5)', display: 'block', marginBottom: '8px' }}>
                    Passwort <span style={{ color: C.cyan }}>*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(0,212,212,0.5)' }} />
                    <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Mindestens 6 Zeichen" minLength={6} required
                      className="w-full rounded-xl pl-10 pr-4 py-3 outline-none transition-all"
                      style={{ background: 'rgba(0,212,212,0.04)', border: `1px solid rgba(0,212,212,0.2)`, color: '#fff', fontFamily: "'Inter', sans-serif", fontSize: '15px' }} />
                  </div>
                </div>

                {authError && (
                  <div style={{ background: 'rgba(240,120,32,0.08)', border: `1px solid rgba(240,120,32,0.25)`, borderRadius: '10px', padding: '12px' }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: C.orange }}>{authError}</p>
                  </div>
                )}

                <motion.button type="submit" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  disabled={authLoading || authEmail.length < 3 || authPassword.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl transition-all"
                  style={!authLoading && authEmail.length >= 3 && authPassword.length >= 6 ? { background: `linear-gradient(135deg, ${C.cyan}, rgba(0,168,168,0.9))`, color: '#080c10', fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', letterSpacing: '0.14em', fontWeight: 700, boxShadow: `0 3px 16px rgba(0,212,212,0.28)` } : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.3)', fontFamily: "'Bebas Neue', sans-serif", fontSize: '16px', letterSpacing: '0.14em', cursor: 'not-allowed' }}>
                  {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                  {authLoading ? 'Bitte warten...' : authTab === 'signup' ? 'Account erstellen & weiter' : 'Anmelden & weiter'}
                </motion.button>
              </form>

              <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(0,212,212,0.1)' }}>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.35)', marginBottom: '10px' }}>Deine Vorteile</p>
                <div className="flex flex-col gap-2">
                  {[
                    'Dein Ticket erscheint automatisch in deinem Dashboard',
                    'Jederzeit abrufbar – kein langes Suchen in deiner E-Mail',
                  ].map((b) => (
                    <div key={b} className="flex items-center gap-2">
                      <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" style={{ color: C.cyan }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(160,230,230,0.6)' }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUPPORT THANK YOU POPUP ─────────────────────────────── */}
      {showSupportPopup && (
        <SupportThankYouPopup
          onClose={() => setShowSupportPopup(false)}
          stripeSessionId={supportSessionId}
          userId={user?.id}
        />
      )}

      {/* ── THANK YOU MODAL ──────────────────────────────────────── */}
      <AnimatePresence>
        {showThankYou && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(4,10,14,0.88)', backdropFilter: 'blur(16px)' }}
            onClick={() => setShowThankYou(false)}>
            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.88, opacity: 0, y: 30 }}
              transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-3xl overflow-hidden text-center"
              style={{
                background: 'rgba(4,18,22,0.99)',
                border: '1px solid rgba(0,212,212,0.25)',
                boxShadow: '0 0 0 1px rgba(0,212,212,0.08), 0 40px 100px rgba(0,0,0,0.8), 0 0 100px rgba(0,212,212,0.1)',
              }}>
              {/* top glow line */}
              <div className="absolute inset-x-0 top-0 h-0.5"
                style={{ background: `linear-gradient(to right, transparent, ${C.cyan}, transparent)` }} />
              {/* ambient glow */}
              <div className="absolute inset-x-0 top-0 h-48 pointer-events-none"
                style={{ background: 'radial-gradient(ellipse 70% 100% at 50% 0%, rgba(0,212,212,0.15) 0%, transparent 100%)' }} />

              <div className="relative z-10 px-8 pt-10 pb-9">
                {/* icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, duration: 0.5, type: 'spring', stiffness: 220, damping: 16 }}
                  className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-7"
                  style={{ background: 'radial-gradient(circle, rgba(0,212,212,0.2) 0%, rgba(0,212,212,0.06) 100%)', border: '2px solid rgba(0,212,212,0.35)' }}>
                  <Heart className="w-9 h-9" style={{ color: C.cyan }} />
                </motion.div>

                {/* eyebrow */}
                <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.28em', textTransform: 'uppercase', color: C.cyan, opacity: 0.65, marginBottom: '10px' }}>
                  Zahlung erfolgreich
                </div>

                {/* headline */}
                <h2 className="graffiti" style={{ fontSize: 'clamp(32px, 6vw, 52px)', color: '#ffffff', lineHeight: 0.95, marginBottom: '18px' }}>
                  Danke für<br /><span style={{ color: C.cyan, textShadow: `0 0 30px ${C.cyan}60` }}>deine Unterstützung!</span>
                </h2>

                {/* body */}
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '15px', color: 'rgba(180,230,230,0.6)', lineHeight: 1.75, maxWidth: '380px', margin: '0 auto 28px' }}>
                  Dein Ticket ist auf dem Weg zu dir. Du erhältst eine Bestätigung per E-Mail – wir freuen uns riesig, dich am <strong style={{ color: 'rgba(200,245,245,0.85)', fontWeight: 600 }}>22. August 2026</strong> in Düsseldorf zu sehen.
                </p>

                {/* highlight box */}
                <div className="flex items-center gap-3 px-5 py-4 rounded-2xl mb-8"
                  style={{ background: 'rgba(0,212,212,0.06)', border: '1px solid rgba(0,212,212,0.15)' }}>
                  <Sparkles className="w-5 h-5 flex-shrink-0" style={{ color: C.cyan }} />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(180,240,240,0.75)', lineHeight: 1.6, textAlign: 'left' }}>
                    Mit diesem Kauf unterstützt du direkt DYD und faire Ausbildungschancen für junge Menschen – danke, dass du diesen Abend möglich machst.
                  </p>
                </div>

                {/* CTA */}
                <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                  onClick={() => setShowThankYou(false)}
                  className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl"
                  style={{
                    background: `linear-gradient(90deg, ${C.cyan} 0%, ${C.teal} 100%)`,
                    color: '#060c10',
                    fontFamily: "'Bebas Neue', sans-serif",
                    fontSize: '18px', letterSpacing: '0.18em',
                    boxShadow: '0 4px 28px rgba(0,212,212,0.25)',
                  }}>
                  <Ticket className="w-5 h-5" /> Bis zum 22. August!
                </motion.button>
              </div>

              {/* close */}
              <button onClick={() => setShowThankYou(false)}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg transition-opacity hover:opacity-60"
                style={{ color: 'rgba(160,230,230,0.45)', background: 'rgba(0,212,212,0.06)' }}>
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
