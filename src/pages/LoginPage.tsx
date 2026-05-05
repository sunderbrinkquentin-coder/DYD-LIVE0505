import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, Eye, EyeOff, LogIn, UserPlus, ArrowLeft } from 'lucide-react';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, resetPassword } = useAuth();

  const [isSignup, setIsSignup] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Redirect aus URL params oder location.state
  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const actionParam = searchParams.get('action');

  const from = redirectParam || (location.state as any)?.from || '/dashboard';
  const plan = (location.state as any)?.plan;

  console.log('[LoginPage] Redirect config:', {
    redirectParam,
    actionParam,
    from,
    plan
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Password reset flow
      if (isForgotPassword) {
        const result = await resetPassword(email);
        if (result.success) {
          setSuccess(result.message || 'E-Mail wurde gesendet!');
          setEmail('');
        } else {
          setError(result.error || 'Ein Fehler ist aufgetreten');
        }
        setLoading(false);
        return;
      }

      // Login/Signup flow
      const result = isSignup
        ? await signup(email, password)
        : await login(email, password);

      if (result.success) {
        console.log('[LoginPage] ✅ Login successful, redirecting to:', from);

        // After successful login, redirect based on action or plan
        if (actionParam === 'buy-tokens') {
          // User was redirected from checkout attempt - go to dashboard with action to open paywall
          console.log('[LoginPage] 💳 Token purchase flow - redirecting to dashboard with action');
          navigate('/dashboard?action=buy-tokens', { replace: true });
        } else if (actionParam === 'cv-unlock') {
          // User was redirected from CV unlock attempt - go to dashboard with action to start checkout
          const cvId = searchParams.get('cvId');
          if (cvId) {
            console.log('[LoginPage] 🔓 CV unlock flow - redirecting to dashboard with cvId:', cvId);
            navigate(`/dashboard?action=cv-unlock&cvId=${cvId}`, { replace: true });
          } else {
            navigate('/dashboard', { replace: true });
          }
        } else if (plan === 'pro') {
          // User clicked on Pro plan - go to pricing/paywall
          navigate('/pricing', { state: { plan: 'pro' }, replace: true });
        } else if (plan === 'free') {
          // User clicked on Free plan - go to dashboard
          navigate('/dashboard', { replace: true });
        } else if (plan === 'enterprise') {
          // User clicked on Enterprise - go to contact
          navigate('/unternehmen', { replace: true });
        } else if (actionParam === 'paywall' && from.includes('/cv-result/')) {
          // CV-Check flow: nach Login direkt zur Paywall
          const uploadId = from.split('/cv-result/')[1];
          console.log('[LoginPage] 🔐 CV-Check flow detected, redirecting to paywall with uploadId:', uploadId);
          navigate(`/cv-paywall?cvId=${uploadId}&source=cv-check`, { replace: true });
        } else {
          // Redirect to original page (z.B. /cv-result/:uploadId)
          // Action param wird in der Zielseite abgefragt
          const targetUrl = actionParam
            ? `${from}?action=${actionParam}`
            : from;
          navigate(targetUrl, { replace: true });
        }
      } else {
        setError(result.error || 'Ein Fehler ist aufgetreten');
      }
    } catch (err: any) {
      setError(err.message || 'Ein Fehler ist aufgetreten');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate('/')}
          className="mb-6 flex items-center gap-2 text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
          <span>Zurück</span>
        </button>

        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              {isForgotPassword
                ? 'Passwort zurücksetzen'
                : isSignup
                ? 'Konto erstellen'
                : 'Willkommen zurück'}
            </h1>
            <p className="text-white/60 text-sm sm:text-base">
              {isForgotPassword
                ? 'Gib deine E-Mail-Adresse ein, um dein Passwort zurückzusetzen'
                : isSignup
                ? 'Erstelle dein Konto, um deinen CV zu speichern'
                : 'Melde dich an, um fortzufahren'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                E-Mail
              </label>
              <div className="relative">
                <Mail
                  size={20}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6] transition-all"
                  placeholder="deine@email.com"
                />
              </div>
            </div>

            {!isForgotPassword && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-white/80">
                    Passwort
                  </label>
                  {!isSignup && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPassword(true);
                        setError('');
                        setSuccess('');
                      }}
                      className="text-xs text-[#66c0b6] hover:text-[#57b0a6] transition-colors"
                    >
                      Passwort vergessen?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock
                    size={20}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                  />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#66c0b6] transition-all"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                {isSignup && (
                  <p className="mt-2 text-xs text-white/50">
                    Mindestens 6 Zeichen
                  </p>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-sm">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>
                    {isForgotPassword
                      ? 'Sende E-Mail...'
                      : isSignup
                      ? 'Registrierung...'
                      : 'Anmeldung...'}
                  </span>
                </>
              ) : (
                <>
                  <Mail size={20} />
                  <span>
                    {isForgotPassword
                      ? 'Link senden'
                      : isSignup
                      ? 'Konto erstellen'
                      : 'Anmelden'}
                  </span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center space-y-3">
            {isForgotPassword ? (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                  setSuccess('');
                }}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Zurück zur Anmeldung
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsSignup(!isSignup);
                  setError('');
                  setSuccess('');
                }}
                className="text-sm text-white/60 hover:text-[#66c0b6] transition-colors"
              >
              {isSignup ? (
                <>
                  Bereits ein Konto?{' '}
                  <span className="font-semibold">Jetzt anmelden</span>
                </>
              ) : (
                <>
                  Noch kein Konto?{' '}
                  <span className="font-semibold">Jetzt registrieren</span>
                </>
              )}
              </button>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-white/40">
          <p>
            Mit der Anmeldung akzeptierst du unsere{' '}
            <a href="#" className="text-[#66c0b6] hover:underline">
              Nutzungsbedingungen
            </a>{' '}
            und{' '}
            <a href="#" className="text-[#66c0b6] hover:underline">
              Datenschutzerklärung
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
