import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Ticket, ArrowRight, Music, Instagram, Download, X, Heart, Star, Beer } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { downloadFestivalTicketPDF } from '../utils/festivalTicketPDF';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

const C = {
  cyan:   '#00d4d4',
  teal:   '#00a8a8',
  blue:   '#1e90d4',
  lime:   '#c8e840',
  orange: '#f07820',
  bg:     '#080c10',
};

const TICKET_LABEL_MAP: Record<string, string> = {
  early_bird: 'Early Bird Bundle',
  concert:    'Live Konzert Zirkel.WTF',
  standup:    'Stand-Up Comedy',
  dj:         'DJ Sets House / Techno',
  bierpong:   'Bierpong-Turnier',
};

const TICKET_ACCENT_MAP: Record<string, string> = {
  early_bird: C.cyan,
  concert:    C.blue,
  standup:    C.orange,
  dj:         '#4dc8e8',
  bierpong:   C.lime,
};

const GOLD = '#c89b4a';

function ThankYouPopup({ onClose, ticketType, accent }: { onClose: () => void; ticketType: string; accent: string }) {
  const isEarlyBird = ticketType === 'early_bird';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', stiffness: 220, damping: 20 }}
          className="relative w-full max-w-sm rounded-2xl overflow-hidden"
          style={{
            background: 'linear-gradient(160deg, #161008 0%, #0e0b07 60%, #111209 100%)',
            border: `1px solid rgba(200,155,74,0.28)`,
            boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(200,155,74,0.06)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ height: '3px', background: `linear-gradient(to right, transparent, ${accent}, ${GOLD}, transparent)` }} />

          <div className="px-8 pt-8 pb-7">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-lg transition-all hover:bg-white/5"
              style={{ color: 'rgba(240,232,216,0.35)' }}
            >
              <X size={16} />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 14 }}
              className="flex items-center justify-center mb-5"
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: `radial-gradient(circle, rgba(200,155,74,0.18) 0%, rgba(200,155,74,0.04) 70%)`,
                  border: `1px solid rgba(200,155,74,0.3)`,
                }}
              >
                <Heart size={30} style={{ color: GOLD }} fill="rgba(200,155,74,0.3)" />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.45 }}
            >
              <p
                className="text-center mb-1"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: GOLD,
                  opacity: 0.7,
                }}
              >
                HARMONY FESTIVAL 2026
              </p>
              <h2
                className="text-center mb-3"
                style={{
                  fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif",
                  fontSize: '38px',
                  color: '#f0e8d8',
                  lineHeight: 0.95,
                  letterSpacing: '0.04em',
                }}
              >
                Danke – du bist dabei!
              </h2>
              <p
                className="text-center mb-6"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: 'rgba(240,232,216,0.5)',
                  lineHeight: 1.65,
                }}
              >
                Wir freuen uns riesig, dich am{' '}
                <span style={{ color: 'rgba(240,232,216,0.82)', fontWeight: 600 }}>22. August 2026</span>{' '}
                im Klub Kulb begrüßen zu dürfen. Es wird ein unvergesslicher Abend.
              </p>
            </motion.div>

            {isEarlyBird && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32, duration: 0.4 }}
                className="rounded-xl px-4 py-3.5 mb-5 flex items-start gap-3"
                style={{
                  background: 'rgba(200,155,74,0.07)',
                  border: '1px solid rgba(200,155,74,0.22)',
                }}
              >
                <Beer size={18} style={{ color: GOLD, flexShrink: 0, marginTop: 1 }} />
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', fontWeight: 700, color: '#dbb96a', marginBottom: '2px' }}>
                    Dein Freigetränk wartet
                  </p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(200,155,74,0.65)', lineHeight: 1.5 }}>
                    Als Early Bird hast du ein Getränk frei – einfach Ticket an der Bar vorzeigen.
                  </p>
                </div>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isEarlyBird ? 0.4 : 0.35, duration: 0.4 }}
              className="grid grid-cols-3 gap-2 mb-6"
            >
              {[
                { icon: <Music size={15} />, label: 'Zirkel.WTF' },
                { icon: <Star size={15} />, label: 'Stand-Up' },
                { icon: <Beer size={15} />, label: 'Bierpong' },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl py-3"
                  style={{ background: 'rgba(240,232,216,0.03)', border: '1px solid rgba(240,232,216,0.07)' }}
                >
                  <span style={{ color: 'rgba(200,155,74,0.7)' }}>{icon}</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, color: 'rgba(240,232,216,0.45)', letterSpacing: '0.04em' }}>{label}</span>
                </div>
              ))}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: isEarlyBird ? 0.48 : 0.42, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, ${GOLD}dd, #a07a32)`,
                color: '#0e0b07',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '17px',
                letterSpacing: '0.12em',
                boxShadow: `0 4px 20px rgba(200,155,74,0.22)`,
              }}
            >
              Bis zum 22. August! <ArrowRight size={16} />
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function DownloadButton({ ticket, accent }: { ticket: any; accent: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await downloadFestivalTicketPDF(ticket);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleDownload}
      disabled={downloading}
      className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold"
      style={{
        background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
        color: '#080c10',
        fontFamily: "'Bebas Neue', sans-serif",
        fontSize: '18px',
        letterSpacing: '0.12em',
        boxShadow: `0 4px 24px ${C.cyan}35`,
        opacity: downloading ? 0.7 : 1,
        cursor: downloading ? 'not-allowed' : 'pointer',
      }}
    >
      <Download size={18} />
      {downloading ? 'Wird erstellt...' : 'Ticket herunterladen'}
    </motion.button>
  );
}

export default function FestivalPaymentSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const ticketType = searchParams.get('type') || '';
  const sessionId  = searchParams.get('session_id') || '';

  const [ticketData, setTicketData] = useState<any>(null);
  const [loadingTicket, setLoadingTicket] = useState(true);
  const [showThankYou, setShowThankYou] = useState(false);
  const resolvedRef = useRef(false);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const label  = TICKET_LABEL_MAP[ticketType] || 'Festival Ticket';
  const accent = TICKET_ACCENT_MAP[ticketType] || C.cyan;

  const callFallback = async (): Promise<boolean> => {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/confirm-festival-ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ session_id: sessionId, user_id: user?.id || undefined }),
      });
      if (res.ok) {
        const json = await res.json();
        if (json.ticket) {
          handleTicketFound(json.ticket);
          return true;
        }
      }
    } catch {
      // fallback failed silently
    }
    return false;
  };

  const handleTicketFound = (ticket: any) => {
    if (resolvedRef.current) return;
    resolvedRef.current = true;
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    setTicketData(ticket);
    setLoadingTicket(false);
    setTimeout(() => setShowThankYou(true), 400);
  };

  const checkDbOnce = async (): Promise<any | null> => {
    try {
      const { data } = await supabase
        .from('festival_ticket_sales')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();
      return data || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem('harmony_festival_session_id', sessionId);
    }

    if (!sessionId) {
      setLoadingTicket(false);
      return;
    }

    checkDbOnce().then((existing) => {
      if (existing) {
        handleTicketFound(existing);
        return;
      }

      const channel = supabase
        .channel(`festival-ticket-${sessionId}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'festival_ticket_sales',
            filter: `stripe_session_id=eq.${sessionId}`,
          },
          (payload) => {
            if (payload.new) {
              handleTicketFound(payload.new);
            }
          }
        )
        .subscribe();

      const attemptResolve = async () => {
        if (resolvedRef.current) return;
        const [ticket, confirmed] = await Promise.all([checkDbOnce(), callFallback()]);
        if (resolvedRef.current) return;
        if (ticket) { handleTicketFound(ticket); return; }
        if (!confirmed) setLoadingTicket(false);
      };

      fallbackTimerRef.current = setTimeout(async () => {
        if (resolvedRef.current) return;
        const ticket = await checkDbOnce();
        if (ticket) { handleTicketFound(ticket); return; }
        const confirmed = await callFallback();
        if (!confirmed) {
          setTimeout(attemptResolve, 2000);
        }
      }, 800);

      return () => {
        supabase.removeChannel(channel);
        if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const goToDashboard = () => {
    navigate('/dashboard?ticket_success=1');
  };

  const goToFestival = () => {
    navigate('/festival');
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden"
      style={{ backgroundColor: C.bg, color: '#fff' }}
    >
      {showThankYou && (
        <ThankYouPopup
          onClose={() => setShowThankYou(false)}
          ticketType={ticketType}
          accent={accent}
        />
      )}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Bebas+Neue&family=Barlow+Condensed:ital,wght@0,700;0,900&display=swap');
        .graffiti { font-family: 'Bebas Neue', 'Barlow Condensed', sans-serif; font-weight: 400; letter-spacing: 0.04em; text-transform: uppercase; }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${120 + i * 60}px`,
              height: `${120 + i * 60}px`,
              background: `radial-gradient(circle, ${accent}08 0%, transparent 70%)`,
              top: `${10 + i * 14}%`,
              left: `${5 + i * 16}%`,
            }}
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 180, damping: 14 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
            style={{ background: `${accent}14`, border: `1px solid ${accent}40` }}
          >
            <CheckCircle size={40} style={{ color: accent }} />
          </motion.div>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: accent,
              opacity: 0.7,
              marginBottom: '10px',
            }}
          >
            HARMONY FESTIVAL 2026
          </p>

          <h1
            className="graffiti"
            style={{ fontSize: 'clamp(36px, 8vw, 60px)', color: '#fff', lineHeight: 0.95, marginBottom: '12px' }}
          >
            Ticket gesichert!
          </h1>

          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '15px',
              color: 'rgba(160,230,230,0.6)',
              lineHeight: 1.7,
            }}
          >
            Deine Zahlung war erfolgreich. Lade dir dein Ticket herunter und zeige es am 22.08. vor.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.55 }}
          className="rounded-2xl overflow-hidden mb-6"
          style={{ background: 'rgba(0,212,212,0.04)', border: `1px solid ${accent}22` }}
        >
          <div className="h-0.5" style={{ background: `linear-gradient(to right, transparent, ${accent}80, transparent)` }} />
          <div className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${accent}12`, border: `1px solid ${accent}28` }}
              >
                <Ticket size={18} style={{ color: accent }} />
              </div>
              <div>
                <p
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.26em',
                    textTransform: 'uppercase',
                    color: accent,
                    opacity: 0.7,
                    marginBottom: '4px',
                  }}
                >
                  DEIN TICKET
                </p>
                <h3
                  className="graffiti"
                  style={{ fontSize: '24px', color: '#fff', lineHeight: 1 }}
                >
                  {ticketData?.ticket_label || label}
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.4)', marginBottom: '3px' }}>Datum</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>22. August 2026</p>
              </div>
              <div>
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.4)', marginBottom: '3px' }}>Location</p>
                <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>Burgplatz, Düsseldorf</p>
              </div>
              {ticketData?.buyer_name && (
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.4)', marginBottom: '3px' }}>Name</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>{ticketData.buyer_name}</p>
                </div>
              )}
              {ticketData?.ticket_number && (
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(160,230,230,0.4)', marginBottom: '3px' }}>Ticket-Nr.</p>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: '12px', color: accent, letterSpacing: '0.08em' }}>{ticketData.ticket_number}</p>
                </div>
              )}
            </div>

            {ticketData?.bierpong_team_name && (
              <div
                className="mt-4 rounded-xl p-3"
                style={{ background: 'rgba(200,232,64,0.05)', border: '1px solid rgba(200,232,64,0.18)' }}
              >
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.26em', textTransform: 'uppercase', color: C.lime, opacity: 0.7, marginBottom: '6px' }}>
                  Bierpong-Team
                </p>
                <p style={{ fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, fontSize: '18px', color: C.lime }}>
                  {ticketData.bierpong_team_name}
                </p>
                {ticketData.bierpong_partner_name && (
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                    mit {ticketData.bierpong_partner_name}
                  </p>
                )}
              </div>
            )}

            {loadingTicket && (
              <div
                className="mt-3 flex items-center gap-2"
                style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', color: 'rgba(160,230,230,0.4)' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="w-3 h-3 rounded-full border-t-2"
                  style={{ borderColor: accent }}
                />
                Ticket-Details werden geladen...
              </div>
            )}
          </div>
        </motion.div>

        <motion.a
          href="https://www.instagram.com/dyd_harmony"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3.5 rounded-2xl px-5 py-4 mb-4 group"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            textDecoration: 'none',
          }}
          whileHover={{ borderColor: 'rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
              boxShadow: '0 2px 12px rgba(220,39,67,0.35)',
            }}
          >
            <Instagram size={17} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '13px',
                color: 'rgba(255,255,255,0.55)',
                lineHeight: 1.45,
                marginBottom: '2px',
              }}
            >
              Nichts mehr verpassen?
            </p>
            <p
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '14px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.88)',
              }}
            >
              @dyd_harmony
            </p>
          </div>
          <ArrowRight size={14} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, transition: 'transform 0.18s' }} className="group-hover:translate-x-0.5" />
        </motion.a>

        {ticketData && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mb-3"
          >
            <DownloadButton ticket={ticketData} accent={accent} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col gap-3"
        >
          {user && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={goToDashboard}
              className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-bold"
              style={{
                background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})`,
                color: '#080c10',
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '18px',
                letterSpacing: '0.12em',
                boxShadow: `0 4px 24px ${C.cyan}35`,
              }}
            >
              Zum Dashboard <ArrowRight size={18} />
            </motion.button>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={goToFestival}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl"
            style={{
              background: 'rgba(0,212,212,0.06)',
              border: `1px solid rgba(0,212,212,0.2)`,
              color: C.cyan,
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '16px',
              letterSpacing: '0.12em',
            }}
          >
            <Music size={16} /> Zurück zum Festival
          </motion.button>
        </motion.div>

        <p
          className="text-center mt-6"
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '12px',
            color: `rgba(160,230,230,0.3)`,
            letterSpacing: '0.04em',
          }}
        >
          22.08.2026 · Burgplatz, Düsseldorf · 17:00–02:00 Uhr
        </p>
      </motion.div>
    </div>
  );
}
