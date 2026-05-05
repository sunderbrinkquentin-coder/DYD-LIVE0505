import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Save, CheckCircle, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from './Button';
import { authService } from '../services/authService';

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onSkip?: () => void;
  prefilledEmail?: string;
  initialMode?: 'signup' | 'login';
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

export default function RegisterModal({ isOpen, onClose, onSuccess, onSkip, prefilledEmail, initialMode = 'signup' }: RegisterModalProps) {
  const [mode, setMode] = useState<'signup' | 'login'>(initialMode);
  const [email, setEmail] = useState(prefilledEmail || '');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail);
    }
    if (isOpen) {
      setMode(initialMode);
      // Lock scroll on both html and body
      document.documentElement.style.overflow = 'hidden';
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      // Reset scroll lock
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      // Cleanup on unmount
      document.documentElement.style.overflow = '';
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [prefilledEmail, isOpen, initialMode]);

  const calculatePasswordStrength = (pwd: string): PasswordStrength => {
    if (pwd.length < 8) return 'weak';

    let strength = 0;
    if (pwd.length >= 10) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z\d]/.test(pwd)) strength++;

    if (strength >= 3) return 'strong';
    if (strength >= 2) return 'medium';
    return 'weak';
  };

  const passwordStrength = password ? calculatePasswordStrength(password) : null;

  const getStrengthConfig = (strength: PasswordStrength | null) => {
    if (!strength) return null;

    const configs = {
      weak: { color: '#EF5350', text: 'Schwach', width: '33%' },
      medium: { color: '#FFA726', text: 'Mittel', width: '66%' },
      strong: { color: '#4CAF50', text: 'Stark', width: '100%' },
    };

    return configs[strength];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    setLoading(true);

    try {
      if (mode === 'signup') {
        const { user, error: signUpError } = await authService.signUp({
          email,
          password,
          fullName,
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            setError('Diese E-Mail ist bereits registriert. <a href="#" class="underline text-primary">Zum Login</a>');
          } else {
            setError(signUpError.message);
          }
          setLoading(false);
          return;
        }

        if (user) {
          onSuccess();
        }
      } else {
        const { user, error: signInError } = await authService.signIn({
          email,
          password,
        });

        if (signInError) {
          setError(signInError.message);
          setLoading(false);
          return;
        }

        if (user) {
          onSuccess();
        }
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten. Bitte versuche es erneut.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'linkedin') => {
    console.log(`Social login with ${provider}`);
  };

  const handleClose = () => {
    setShowCloseConfirm(true);
  };

  const handleSkip = () => {
    if (onSkip) {
      onSkip();
    }
    onClose();
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed z-[9999] flex items-center justify-center"
        style={{
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          minHeight: '100vh',
          background: 'rgba(10, 25, 41, 0.95)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-[500px] rounded-2xl p-10 shadow-2xl mx-4"
          style={{
            background: '#132F4C',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
            maxHeight: '90vh',
          }}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>

          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', damping: 20 }}
            className="flex justify-center mb-6"
          >
            <div className="w-12 h-12 rounded-full bg-primary bg-opacity-20 flex items-center justify-center">
              <Save className="text-primary" size={28} />
            </div>
          </motion.div>

          <h2 className="text-3xl font-bold text-center mb-4">
            {mode === 'signup' ? '💾 Speichere deinen optimierten CV' : 'Willkommen zurück'}
          </h2>

          {mode === 'signup' && (
            <>
              <p className="text-center text-gray-300 mb-6">
                Erstelle einen kostenlosen Account um:
              </p>

              <div className="space-y-3 mb-8">
                {[
                  'CV jederzeit herunterladen',
                  'Änderungen speichern',
                  'Passende Job-Matches erhalten',
                  'Von Top-Unternehmen gefunden werden',
                ].map((benefit, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="text-success flex-shrink-0" size={20} />
                    <span className="text-white text-[15px]">{benefit}</span>
                  </motion.div>
                ))}
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 mb-6">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-white bg-opacity-5 border-2 border-gray-600 border-opacity-20 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary focus:ring-opacity-20 transition-all"
                    placeholder="Dein vollständiger Name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">E-Mail-Adresse</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white bg-opacity-5 border-2 border-gray-600 border-opacity-20 rounded-lg pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary focus:ring-opacity-20 transition-all"
                  placeholder="deine@email.de"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {mode === 'signup' ? 'Passwort erstellen' : 'Passwort'}
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white bg-opacity-5 border-2 border-gray-600 border-opacity-20 rounded-lg pl-12 pr-12 py-3 text-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary focus:ring-opacity-20 transition-all"
                  placeholder="Mindestens 8 Zeichen"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {mode === 'signup' && password && passwordStrength && (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: getStrengthConfig(passwordStrength)?.width }}
                      className="h-full rounded-full transition-all"
                      style={{ backgroundColor: getStrengthConfig(passwordStrength)?.color }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: getStrengthConfig(passwordStrength)?.color }}>
                    Passwortstärke: {getStrengthConfig(passwordStrength)?.text}
                  </p>
                </div>
              )}
            </div>

            {mode === 'signup' && (
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-gray-600 text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-xs text-gray-300">
                  Ich akzeptiere die{' '}
                  <a href="#" className="text-primary underline">
                    AGB
                  </a>{' '}
                  und{' '}
                  <a href="#" className="text-primary underline">
                    Datenschutzerklärung
                  </a>
                </span>
              </label>
            )}

            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg">
                <AlertCircle className="text-red-400 flex-shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-red-400" dangerouslySetInnerHTML={{ __html: error }} />
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Lädt...' : mode === 'signup' ? 'Account erstellen & downloaden' : 'Einloggen & downloaden'}
            </Button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[#132F4C] text-gray-400">oder</span>
            </div>
          </div>

          <div className="space-y-3 mb-8">
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-all border border-white border-opacity-10"
            >
              <Mail size={20} />
              Mit Google anmelden
            </button>

            <button
              type="button"
              onClick={() => handleSocialLogin('linkedin')}
              className="w-full flex items-center justify-center gap-3 px-6 py-3 rounded-lg font-medium transition-all border border-white border-opacity-10"
              style={{ background: '#0A66C2', color: '#FFFFFF' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.32 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.79M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
              </svg>
              Mit LinkedIn anmelden
            </button>
          </div>

          <div className="text-center mb-6">
            <button
              onClick={() => {
                setMode(mode === 'signup' ? 'login' : 'signup');
                setError('');
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {mode === 'signup' ? 'Bereits ein Account? Einloggen' : 'Noch kein Account? Registrieren'}
            </button>
          </div>

          {onSkip && (
            <div className="pt-6 border-t border-gray-600 border-opacity-30">
              <p className="text-center text-sm text-gray-300 mb-3">Nur diesmal downloaden</p>
              <button
                onClick={handleSkip}
                className="w-full text-sm text-gray-400 hover:text-white underline transition-colors"
              >
                Ohne Account fortfahren
              </button>
              <p className="text-center text-xs text-gray-500 mt-2">Dein CV wird nicht gespeichert</p>
            </div>
          )}

          <AnimatePresence>
            {showCloseConfirm && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black bg-opacity-75 rounded-2xl flex items-center justify-center p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.9 }}
                  className="bg-dark-card p-6 rounded-xl max-w-sm w-full"
                >
                  <h3 className="text-xl font-bold mb-3">Möchtest du wirklich abbrechen?</h3>
                  <p className="text-text-secondary mb-6">Dein optimierter CV wird nicht gespeichert.</p>
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      onClick={() => setShowCloseConfirm(false)}
                    >
                      Zurück zur Registrierung
                    </Button>
                    <button
                      onClick={onClose}
                      className="w-full px-4 py-2 text-text-secondary hover:text-white transition-colors"
                    >
                      Trotzdem schließen
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
