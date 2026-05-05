import { useEffect } from 'react';
import { Sparkles, TrendingUp, Target } from 'lucide-react';

interface MotivationScreenProps {
  onContinue: () => void;
  variant?: 1 | 2 | 3;
}

const motivationMessages = {
  1: {
    icon: Sparkles,
    title: 'Super gemacht!',
    message: 'Jeder Schritt bringt dich näher zu deinem perfekten CV 🚀',
    color: 'from-blue-500/20 to-cyan-500/20',
    iconColor: 'text-blue-400'
  },
  2: {
    icon: TrendingUp,
    title: 'Stark!',
    message: 'Du baust gerade ein Profil auf, das Recruiter begeistert 🙌',
    color: 'from-emerald-500/20 to-green-500/20',
    iconColor: 'text-emerald-400'
  },
  3: {
    icon: Target,
    title: 'Weiter so!',
    message: 'Du machst das großartig – dein CV nimmt Form an 💪',
    color: 'from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400'
  }
};

export function MotivationScreen({ onContinue, variant = 1 }: MotivationScreenProps) {
  const config = motivationMessages[variant];
  const Icon = config.icon;

  useEffect(() => {
    const timer = setTimeout(() => {
      onContinue();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onContinue]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 animate-fade-in">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className={`relative rounded-3xl bg-gradient-to-br ${config.color} p-12 border border-white/10 shadow-2xl`}>
            <div className="absolute inset-0 bg-gradient-to-br from-[#66c0b6]/10 to-[#30E3CA]/10 blur-3xl rounded-3xl"></div>
            <Icon size={80} className={`relative ${config.iconColor} animate-bounce`} />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent">
            {config.title}
          </h2>
          <p className="text-xl md:text-2xl text-white/80 leading-relaxed">
            {config.message}
          </p>
        </div>

        <div className="flex justify-center">
          <button
            onClick={onContinue}
            className="px-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all"
          >
            Weiter
          </button>
        </div>

        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 max-w-md mx-auto">
          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-8 h-8">
                  <circle cx="50" cy="35" r="18" fill="#0a0a0a" />
                  <ellipse cx="50" cy="70" rx="28" ry="32" fill="#0a0a0a" />
                  <circle cx="44" cy="32" r="3" fill="white" />
                  <circle cx="56" cy="32" r="3" fill="white" />
                  <path d="M 42 42 Q 50 46 58 42" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                </svg>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm text-white/90 leading-relaxed">
                Ich bin weiter bei dir – Schritt für Schritt zum perfekten CV!
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === variant ? 'w-8 bg-[#66c0b6]' : 'w-1.5 bg-white/20'
              }`}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
