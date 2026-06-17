import { useEffect } from 'react';
import type * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Music2, Gift, ArrowRight } from 'lucide-react';

function InstagramIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} style={style} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

function LinkedinIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} style={style}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

const ACCENT = '#66c0b6';
const ACCENT2 = '#30E3CA';

const SESSION_KEY = 'dyd_follow_popup_shown';

type ChannelGroup = 'dyd' | 'festival';

interface Channel {
  id: string;
  group: ChannelGroup;
  label: string;
  handle: string;
  href: string;
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
}

const CHANNELS: Channel[] = [
  {
    id: 'dyd-instagram',
    group: 'dyd',
    label: 'Instagram',
    handle: '@dyd_harmony',
    href: 'https://www.instagram.com/dyd_harmony',
    Icon: InstagramIcon,
  },
  {
    id: 'dyd-linkedin',
    group: 'dyd',
    label: 'LinkedIn',
    handle: 'Decide your Dream',
    href: 'https://www.linkedin.com/company/decideyourdream',
    Icon: LinkedinIcon,
  },
  {
    id: 'festival-instagram',
    group: 'festival',
    label: 'Instagram',
    handle: '@harmonyfestivaldus',
    href: 'https://www.instagram.com/harmonyfestivaldus',
    Icon: InstagramIcon,
  },
  {
    id: 'festival-tiktok',
    group: 'festival',
    label: 'TikTok',
    handle: '@harmonyfestival2026',
    href: 'https://www.tiktok.com/@harmonyfestival2026',
    Icon: Music2,
  },
];

/**
 * Call this from a button's onClick (before navigating) or from a page-level
 * useEffect on direct route entry. It decides whether the popup should be
 * shown this session and, if so, opens it; otherwise it runs `proceed()`
 * immediately so the normal flow (navigation, etc.) isn't blocked.
 */
export function shouldShowFollowPopup(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) !== '1';
  } catch {
    // sessionStorage unavailable (e.g. private mode edge cases) — don't block the flow
    return false;
  }
}

function markFollowPopupShown() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    /* non-fatal */
  }
}

interface FollowRewardPopupProps {
  open: boolean;
  onClose: () => void;
  /** Called when the user clicks "Weiter" (skip or after following) */
  onContinue: () => void;
}

export function FollowRewardPopup({ open, onClose, onContinue }: FollowRewardPopupProps) {
  useEffect(() => {
    if (open) markFollowPopupShown();
  }, [open]);

  const handleContinue = () => {
    onClose();
    onContinue();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
          onClick={handleContinue}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-3xl overflow-hidden"
            style={{
              background: 'linear-gradient(160deg,rgba(10,16,22,0.99),rgba(6,10,14,0.99))',
              border: `1px solid ${ACCENT2}33`,
              boxShadow: `0 30px 80px -20px rgba(0,0,0,0.6), 0 0 0 1px ${ACCENT2}10`,
            }}
          >
            <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg,${ACCENT},${ACCENT2},transparent)` }} />

            <button
              onClick={handleContinue}
              aria-label="Schließen"
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center transition-colors z-10"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
            >
              <X className="w-4 h-4 text-white/60" />
            </button>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Header */}
              <div className="flex items-start gap-3.5">
                <motion.div
                  animate={{ boxShadow: [`0 0 0px ${ACCENT2}00`, `0 0 22px ${ACCENT2}40`, `0 0 0px ${ACCENT2}00`] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT2})` }}
                >
                  <Gift className="w-6 h-6 text-black" />
                </motion.div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${ACCENT2}99` }}>
                    Kleines Dankeschön
                  </p>
                  <h3 className="text-lg sm:text-xl font-bold text-white leading-tight mt-0.5">
                    Folg uns – wir sagen Danke mit einer Skill-Gap-Analyse
                  </h3>
                </div>
              </div>

              <p className="text-sm text-white/55 leading-relaxed">
                Bevor es weitergeht: Wenn du uns auf einem unserer Kanäle folgst, schenken wir dir eine persönliche Skill-Gap-Analyse – als Dankeschön. Komplett freiwillig, du kannst auch einfach weitermachen.
              </p>

              {/* DYD channels */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 px-0.5">DYD – Decide your Dream</p>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNELS.filter((c) => c.group === 'dyd').map((channel) => {
                    const Icon = channel.Icon;
                    return (
                      <a
                        key={channel.id}
                        href={channel.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 px-3.5 py-3 rounded-xl border transition-all hover:scale-[1.02]"
                        style={{ background: 'rgba(255,255,255,0.04)', borderColor: 'rgba(255,255,255,0.1)' }}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: ACCENT }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white leading-tight">{channel.label}</p>
                          <p className="text-[10px] text-white/40 truncate">{channel.handle}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Festival channels */}
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/30 px-0.5">Harmony Festival</p>
                <div className="grid grid-cols-2 gap-2">
                  {CHANNELS.filter((c) => c.group === 'festival').map((channel) => {
                    const Icon = channel.Icon;
                    return (
                      <a
                        key={channel.id}
                        href={channel.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-2.5 px-3.5 py-3 rounded-xl border transition-all hover:scale-[1.02]"
                        style={{ background: 'rgba(0,212,212,0.05)', borderColor: 'rgba(0,212,212,0.18)' }}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: '#00d4d4' }} />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-white leading-tight">{channel.label}</p>
                          <p className="text-[10px] text-white/40 truncate">{channel.handle}</p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-1">
                <motion.button
                  onClick={handleContinue}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3.5 rounded-xl font-bold text-sm text-black flex items-center justify-center gap-2 transition-all"
                  style={{ background: `linear-gradient(135deg,${ACCENT},${ACCENT2})` }}
                >
                  <Sparkles className="w-4 h-4" />
                  Erledigt – weiter geht's
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
                <button
                  onClick={handleContinue}
                  className="w-full text-center text-[12px] text-white/35 hover:text-white/60 transition-colors py-1"
                >
                  Überspringen und ohne Folgen weitermachen
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}