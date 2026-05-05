import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Heart, Send, CheckCircle, Sparkles, Music, Star, Coffee } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const GOLD = '#c89b4a';
const CYAN = '#00d4d4';

interface Props {
  onClose: () => void;
  stripeSessionId?: string;
  userId?: string;
}

export default function SupportThankYouPopup({ onClose, stripeSessionId, userId }: Props) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setSending(true);
    setSendError(null);
    try {
      const { error } = await supabase.from('support_messages').insert({
        message: message.trim(),
        stripe_session_id: stripeSessionId || null,
        user_id: userId || null,
      });
      if (error) throw error;
      setSent(true);
    } catch {
      setSendError('Nachricht konnte nicht gesendet werden. Bitte versuche es erneut.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto"
        style={{ backgroundColor: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(8px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.88, y: 28 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 16 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          className="relative w-full max-w-md rounded-2xl overflow-hidden my-auto"
          style={{
            background: 'linear-gradient(160deg, #0c1018 0%, #080c10 60%, #0a0e14 100%)',
            border: `1px solid rgba(0,212,212,0.2)`,
            boxShadow: `0 40px 100px rgba(0,0,0,0.8), 0 0 80px rgba(0,212,212,0.05)`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ height: '3px', background: `linear-gradient(to right, transparent, ${CYAN}, ${GOLD}, ${CYAN}, transparent)` }} />

          <div className="px-8 pt-8 pb-8">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-1.5 rounded-lg transition-all hover:bg-white/5"
              style={{ color: 'rgba(240,232,216,0.3)' }}
            >
              <X size={16} />
            </button>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.12, type: 'spring', stiffness: 200, damping: 14 }}
              className="flex items-center justify-center mb-5"
            >
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center relative"
                style={{
                  background: `radial-gradient(circle, rgba(0,212,212,0.15) 0%, rgba(0,212,212,0.03) 70%)`,
                  border: `1px solid rgba(0,212,212,0.3)`,
                }}
              >
                <Heart size={34} style={{ color: CYAN }} fill="rgba(0,212,212,0.25)" />
                <motion.div
                  className="absolute -top-1 -right-1"
                  animate={{ rotate: [0, 15, -10, 15, 0], scale: [1, 1.2, 1, 1.1, 1] }}
                  transition={{ delay: 0.5, duration: 1.2, ease: 'easeInOut' }}
                >
                  <Sparkles size={16} style={{ color: GOLD }} />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
            >
              <p
                className="text-center mb-1"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '10px',
                  fontWeight: 700,
                  letterSpacing: '0.3em',
                  textTransform: 'uppercase',
                  color: CYAN,
                  opacity: 0.65,
                }}
              >
                HARMONY FESTIVAL 2026
              </p>
              <h2
                className="text-center mb-3"
                style={{
                  fontFamily: "'Bebas Neue', 'Barlow Condensed', sans-serif",
                  fontSize: '42px',
                  color: '#f0f4f8',
                  lineHeight: 0.95,
                  letterSpacing: '0.04em',
                }}
              >
                Du bist unser Herzstück
              </h2>
              <p
                className="text-center mb-6"
                style={{
                  fontFamily: "'Inter', sans-serif",
                  fontSize: '14px',
                  color: 'rgba(160,230,230,0.6)',
                  lineHeight: 1.7,
                }}
              >
                Ehrlich gesagt: ohne Menschen wie dich gäbe es das Harmony Festival nicht.
                Deine Unterstützung macht den Unterschied – nicht nur finanziell, sondern auch als Zeichen,
                dass diese Idee es wert ist.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="grid grid-cols-3 gap-2 mb-6"
            >
              {[
                { icon: <Music size={15} />, label: 'Live Musik', sub: 'Zirkel.WTF' },
                { icon: <Star size={15} />, label: 'Stand-Up', sub: 'Comedy' },
                { icon: <Coffee size={15} />, label: 'Community', sub: 'Atmosphäre' },
              ].map(({ icon, label, sub }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1.5 rounded-xl py-3 px-2"
                  style={{ background: 'rgba(0,212,212,0.04)', border: '1px solid rgba(0,212,212,0.1)' }}
                >
                  <span style={{ color: CYAN, opacity: 0.7 }}>{icon}</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', fontWeight: 700, color: 'rgba(240,232,216,0.7)', textAlign: 'center' }}>{label}</span>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '10px', color: 'rgba(240,232,216,0.35)', textAlign: 'center' }}>{sub}</span>
                </div>
              ))}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.4 }}
              className="mb-5"
            >
              <div
                className="rounded-xl p-4 mb-4"
                style={{ background: 'rgba(0,212,212,0.04)', border: '1px solid rgba(0,212,212,0.1)' }}
              >
                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.55)', lineHeight: 1.6 }}>
                  Dein Beitrag fließt direkt in{' '}
                  <span style={{ color: 'rgba(160,230,230,0.85)', fontWeight: 600 }}>Technik, Künstlerhonorare & Atmosphäre</span>
                  {' '}– kein Konzern, kein Sponsor-Budget, nur echte Leidenschaft von Menschen, die diesen Abend unvergesslich machen wollen.
                </p>
              </div>

              {!sent ? (
                <div>
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '12px', fontWeight: 600, color: 'rgba(160,230,230,0.55)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Schreib mir eine Nachricht (optional)
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ich freue mich riesig auf das Festival! Habt ihr..."
                    rows={3}
                    maxLength={500}
                    style={{
                      width: '100%',
                      background: 'rgba(0,212,212,0.04)',
                      border: '1px solid rgba(0,212,212,0.15)',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      color: 'rgba(240,244,248,0.9)',
                      fontFamily: "'Inter', sans-serif",
                      fontSize: '14px',
                      lineHeight: 1.6,
                      resize: 'none',
                      outline: 'none',
                      caretColor: CYAN,
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'rgba(0,212,212,0.4)'}
                    onBlur={(e) => e.target.style.borderColor = 'rgba(0,212,212,0.15)'}
                  />
                  <div className="flex items-center justify-between mt-1 mb-3">
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: 'rgba(160,230,230,0.3)' }}>
                      {message.length}/500
                    </span>
                    {sendError && (
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '11px', color: '#f07820' }}>
                        {sendError}
                      </span>
                    )}
                  </div>
                  {message.trim() && (
                    <motion.button
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleSend}
                      disabled={sending}
                      className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 mb-3"
                      style={{
                        background: sending ? 'rgba(0,212,212,0.1)' : `linear-gradient(135deg, ${CYAN}, #00a8a8)`,
                        color: sending ? 'rgba(160,230,230,0.5)' : '#080c10',
                        fontFamily: "'Bebas Neue', sans-serif",
                        fontSize: '16px',
                        letterSpacing: '0.1em',
                        cursor: sending ? 'not-allowed' : 'pointer',
                        border: sending ? '1px solid rgba(0,212,212,0.2)' : 'none',
                      }}
                    >
                      {sending ? (
                        <>Wird gesendet...</>
                      ) : (
                        <><Send size={15} /> Nachricht senden</>
                      )}
                    </motion.button>
                  )}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 mb-3"
                  style={{ background: 'rgba(0,212,212,0.07)', border: '1px solid rgba(0,212,212,0.2)' }}
                >
                  <CheckCircle size={18} style={{ color: CYAN, flexShrink: 0 }} />
                  <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '13px', color: 'rgba(160,230,230,0.8)' }}>
                    Deine Nachricht ist angekommen – danke!
                  </p>
                </motion.div>
              )}
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.46, duration: 0.4 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2"
              style={{
                background: `linear-gradient(135deg, rgba(0,212,212,0.15), rgba(0,168,168,0.1))`,
                border: `1px solid rgba(0,212,212,0.25)`,
                color: CYAN,
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '17px',
                letterSpacing: '0.12em',
              }}
            >
              Bis zum 22. August!
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
