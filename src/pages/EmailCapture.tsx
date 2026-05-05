import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { useStore } from '../store/useStore';
import Button from '../components/Button';

export default function EmailCapture() {
  const navigate = useNavigate();
  const { setUser } = useStore();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Bitte gib eine E-Mail-Adresse ein');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Bitte gib eine gültige E-Mail-Adresse ein');
      return;
    }

    setUser({ email });
    navigate('/chat');
  };

  const handleSkip = () => {
    navigate('/chat');
  };

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-dark-card p-8 rounded-lg card-shadow"
      >
        <div className="text-center mb-8">
          <Mail className="mx-auto mb-4 text-primary" size={64} />
          <h2 className="text-3xl font-bold mb-2">Wohin sollen wir dein Ergebnis senden?</h2>
          <p className="text-text-secondary">Damit du jederzeit darauf zugreifen kannst</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              E-Mail-Adresse
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="deine@email.de"
              className="w-full p-4 rounded-lg bg-dark-bg border-2 border-transparent focus:border-primary outline-none text-white"
            />
            {error && <p className="mt-2 text-sm text-error">{error}</p>}
          </div>

          <p className="text-sm text-text-secondary text-center">
            Wir spammen nicht. Versprochen. 🤝
          </p>

          <Button type="submit" className="w-full" size="large">
            Weiter zum Chat
          </Button>

          <button
            type="button"
            onClick={handleSkip}
            className="w-full text-center text-text-secondary hover:text-white underline transition-colors"
          >
            Später
          </button>
        </form>
      </motion.div>
    </div>
  );
}
