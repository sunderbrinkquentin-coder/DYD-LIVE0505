import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileSearch,
  Shield,
  Zap,
  Target,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Briefcase,
  ArrowRight,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { CVBuilderData } from '../types/cvBuilder';

interface LatestCv {
  id: string;
  cv_data: CVBuilderData | null;
  name: string;
}

function parseJsonRobust(raw: unknown): CVBuilderData | null {
  if (!raw) return null;
  if (typeof raw === 'object') return raw as CVBuilderData;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return JSON.parse(parsed);
      return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

export default function CvEntryPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [latestCv, setLatestCv] = useState<LatestCv | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    const loadLatest = async () => {
      const { data } = await supabase
        .from('stored_cvs')
        .select('id, cv_data')
        .eq('user_id', user.id)
        .in('status', ['completed', 'optimized', 'ready', 'draft'])
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data?.id) {
        const parsed = parseJsonRobust(data.cv_data);
        const firstName = parsed?.personalData?.firstName || '';
        const lastName = parsed?.personalData?.lastName || '';
        const name = [firstName, lastName].filter(Boolean).join(' ') || 'Dein CV';
        setLatestCv({ id: data.id, cv_data: parsed, name });
      }
      setIsLoading(false);
    };
    loadLatest();
  }, [user]);

  const handleQuickJobTarget = () => {
    if (!latestCv) return;
    navigate(`/job-targeting?cvId=${latestCv.id}`, {
      state: {
        cvId: latestCv.id,
        cvData: latestCv.cv_data,
      },
    });
  };

  const hasExistingCv = user && latestCv;

  return (
    <div className="min-h-screen bg-[#080808] text-white relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#30E3CA]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-[#66c0b6]/8 rounded-full blur-[80px]" />
      </div>

      {/* Nav */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#080808]/80 border-b border-white/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex justify-between items-center h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-sm">Decide Your Dream</span>
          </div>
          <div className="flex items-center gap-3">
            {!user && (
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-sm text-white/60 hover:text-white transition-colors"
              >
                Login
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm hover:bg-white/10 transition-all"
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 md:py-20">

        {/* Trust badges */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8"
        >
          <div className="inline-flex items-center gap-4 px-5 py-2 rounded-full bg-white/4 border border-white/8 text-xs text-white/50">
            <span className="flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-[#66c0b6]" /> DSGVO-konform</span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#66c0b6]" /> KI-gestützt</span>
            <span className="text-white/20">|</span>
            <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-[#66c0b6]" /> ATS-optimiert</span>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-24"
            >
              <div className="w-8 h-8 rounded-full border-2 border-[#66c0b6]/30 border-t-[#66c0b6] animate-spin" />
            </motion.div>
          ) : hasExistingCv ? (
            <ExistingCvView
              key="existing"
              name={latestCv.name}
              onQuickApply={handleQuickJobTarget}
              onUpdateWizard={() => navigate(`/cv-wizard?cvId=${latestCv.id}`)}
              onNewCv={() => navigate('/cv-wizard?mode=new')}
            />
          ) : (
            <NewUserView
              key="new"
              isLoggedIn={!!user}
              onCreateCv={() => navigate('/cv-wizard')}
              onCheckCv={() => navigate('/cv-check')}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ─── Existing CV View ─── */
function ExistingCvView({
  name,
  onQuickApply,
  onUpdateWizard,
  onNewCv,
}: {
  name: string;
  onQuickApply: () => void;
  onUpdateWizard: () => void;
  onNewCv: () => void;
}) {
  return (
    <div className="space-y-6">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="text-center space-y-3 mb-10"
      >
        <h1 className="text-4xl sm:text-5xl font-bold">
          Wie möchtest du
          <span className="block bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent">
            deinen CV nutzen?
          </span>
        </h1>
        <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto">
          Dein Profil <span className="text-white/80 font-medium">„{name}"</span> ist bereit. Wähle, wie du weitermachen möchtest.
        </p>
      </motion.div>

      {/* ONE-CLICK HERO CARD */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
      >
        <button
          type="button"
          onClick={onQuickApply}
          className="group relative w-full text-left rounded-3xl overflow-hidden focus:outline-none"
        >
          {/* Glow layer */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#30E3CA]/20 via-[#66c0b6]/10 to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 rounded-3xl border border-[#66c0b6]/30 group-hover:border-[#66c0b6]/60 transition-colors duration-300" />

          <div className="relative p-8 sm:p-10">
            {/* Top row */}
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                  <Briefcase className="w-7 h-7 text-black" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#30E3CA]/15 border border-[#30E3CA]/30 text-[#30E3CA] text-xs font-semibold mb-2">
                    <Zap className="w-3 h-3" />
                    Schnellste Option
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white group-hover:text-[#30E3CA] transition-colors">
                    Direkt bewerben
                  </h2>
                </div>
              </div>
              <div className="hidden sm:flex w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center group-hover:bg-[#66c0b6]/20 group-hover:border-[#66c0b6]/40 transition-all duration-300 flex-shrink-0 mt-1">
                <ArrowRight className="w-5 h-5 text-white/40 group-hover:text-[#66c0b6] group-hover:translate-x-0.5 transition-all duration-300" />
              </div>
            </div>

            <p className="text-white/60 text-base leading-relaxed mb-6 max-w-2xl">
              Gib einfach Jobtitel und Unternehmen ein – wir nehmen deinen aktuellen CV und lassen ihn von der KI direkt auf die Stelle zuschneiden.
            </p>

            {/* Feature pills */}
            <div className="flex flex-wrap gap-2 mb-8">
              {[
                { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Deine CV-Daten bleiben erhalten' },
                { icon: <Clock className="w-3.5 h-3.5" />, label: 'In unter 2 Minuten fertig' },
                { icon: <Target className="w-3.5 h-3.5" />, label: 'KI passt CV an Stelle an' },
              ].map(({ icon, label }) => (
                <span key={label} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-sm text-white/70">
                  <span className="text-[#66c0b6]">{icon}</span>
                  {label}
                </span>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between px-7 py-4 rounded-2xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-lg max-w-sm group-hover:shadow-xl group-hover:shadow-[#66c0b6]/20 transition-all duration-300">
              <span>Jetzt Wunschstelle eingeben</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </button>
      </motion.div>

      {/* Two secondary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SecondaryCard
          delay={0.2}
          icon={<RefreshCw className="w-5 h-5" />}
          label="CV aktualisieren"
          description="Wizard mit vorausgefüllten Daten – ergänze neue Jobs, Skills oder Ausbildungen."
          onClick={onUpdateWizard}
        />
        <SecondaryCard
          delay={0.25}
          icon={<FileSearch className="w-5 h-5" />}
          label="Komplett neu starten"
          description="Erstelle einen brandneuen Lebenslauf von Grund auf ohne bestehende Daten."
          onClick={onNewCv}
        />
      </div>
    </div>
  );
}

function SecondaryCard({
  delay,
  icon,
  label,
  description,
  onClick,
}: {
  delay: number;
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="group text-left rounded-2xl bg-white/4 border border-white/8 p-6 hover:bg-white/8 hover:border-white/16 transition-all duration-200 focus:outline-none"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/20 flex items-center justify-center text-[#66c0b6] group-hover:bg-[#66c0b6]/20 transition-colors">
          {icon}
        </div>
        <span className="font-semibold text-white/90">{label}</span>
        <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-white/60 ml-auto group-hover:translate-x-0.5 transition-all" />
      </div>
      <p className="text-sm text-white/45 leading-relaxed">{description}</p>
    </motion.button>
  );
}

/* ─── New User View ─── */
function NewUserView({
  isLoggedIn,
  onCreateCv,
  onCheckCv,
}: {
  isLoggedIn: boolean;
  onCreateCv: () => void;
  onCheckCv: () => void;
}) {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55 }}
        className="text-center space-y-3 mb-10"
      >
        <h1 className="text-4xl sm:text-5xl font-bold">
          Starte jetzt mit
          <span className="block bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] bg-clip-text text-transparent">
            deinem CV-Center
          </span>
        </h1>
        <p className="text-white/50 text-base sm:text-lg max-w-xl mx-auto">
          Erstelle deinen perfekten Lebenslauf oder analysiere deinen bestehenden.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.button
          type="button"
          onClick={onCreateCv}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="group relative text-left rounded-3xl bg-white/5 border border-white/10 p-8 hover:bg-white/8 hover:border-[#66c0b6]/30 transition-all duration-300 focus:outline-none"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#66c0b6]/20 to-[#30E3CA]/20 flex items-center justify-center border border-[#66c0b6]/30 mb-5 text-[#66c0b6] group-hover:scale-110 transition-transform">
            <Sparkles className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#66c0b6] transition-colors">CV erstellen</h2>
          <p className="text-white/50 text-sm leading-relaxed mb-5">Erstelle deinen CV Schritt für Schritt – strukturiert, modern und ATS-optimiert.</p>
          <div className="flex items-center gap-2 text-sm text-[#66c0b6] font-semibold">
            Wizard starten <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </motion.button>

        {!isLoggedIn && (
          <motion.button
            type="button"
            onClick={onCheckCv}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="group relative text-left rounded-3xl bg-white/5 border border-white/10 p-8 hover:bg-white/8 hover:border-[#66c0b6]/30 transition-all duration-300 focus:outline-none"
          >
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#66c0b6]/20 to-[#30E3CA]/20 flex items-center justify-center border border-[#66c0b6]/30 mb-5 text-[#66c0b6] group-hover:scale-110 transition-transform">
              <FileSearch className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2 group-hover:text-[#66c0b6] transition-colors">CV analysieren</h2>
            <p className="text-white/50 text-sm leading-relaxed mb-5">Lade deinen bestehenden CV hoch – wir analysieren ihn mit KI & ATS und zeigen dir konkrete Verbesserungen.</p>
            <div className="flex items-center gap-2 text-sm text-[#66c0b6] font-semibold">
              Jetzt prüfen <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
}
