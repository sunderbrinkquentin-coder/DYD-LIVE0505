import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle, ArrowRight, Save, FileText, Loader2, BarChart3, FileCheck, Lock } from 'lucide-react';
import { AtsResult } from '../types/ats';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { getScoreLabel } from '../utils/atsHelpers';
import { CircularScore } from './ats/CircularScore';
import { CategoryRow } from './ats/CategoryRow';
import { DetailCard } from './ats/DetailCard';

type Props = {
  result: AtsResult | null;
  uploadId?: string;
  showActions?: boolean;
  isFromDashboard?: boolean;
  autoSave?: boolean;
  onSaveComplete?: () => void;
  onOptimize?: () => void;
  isPaid?: boolean; // 🔥 Entscheidend für Freischaltung
};

export const AtsResultDisplay: React.FC<Props> = ({
  result,
  uploadId,
  showActions = true,
  isFromDashboard = false,
  autoSave = false,
  onSaveComplete,
  onOptimize,
  isPaid = false, // 🔥 default = false
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'detail'>('overview');
  const [showUnlockModal, setShowUnlockModal] = useState(false);

  const effectiveTab = activeTab;

  if (!result) {
    return (
      <div className="max-w-xl mx-auto px-4 py-6">
        <div className="rounded-3xl bg-[#0b1220] border border-white/5 p-6 text-center">
          <p className="text-white/70">Die Analyse-Daten konnten nicht geladen werden.</p>
        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // SCORE + DATA
  // --------------------------------------------------
  const score = Math.max(0, Math.min(100, result.ats_score ?? 0));
  const todos = result.top_todos ?? {};
  const scoreLabel = getScoreLabel(score);

  // Flat score format (new) with legacy nested fallback
  const categories = [
    {
      key: 'relevanz_score',
      title: 'Relevanz & Fokus',
      score: result.relevanz_score ?? result.relevanz_fokus?.score ?? 0,
      feedback: result.relevanz_feedback ?? result.relevanz_fokus?.feedback,
      verbesserung: result.relevanz_fokus?.verbesserung,
    },
    {
      key: 'erfolge_score',
      title: 'Erfolge & KPIs',
      score: result.erfolge_score ?? result.erfolge_kpis?.score ?? 0,
      feedback: result.erfolge_feedback ?? result.erfolge_kpis?.feedback,
      verbesserung: result.erfolge_kpis?.verbesserung,
    },
    {
      key: 'sprache_score',
      title: 'Klarheit der Sprache',
      score: result.sprache_score ?? result.klarheit_sprache?.score ?? 0,
      feedback: result.sprache_feedback ?? result.klarheit_sprache?.feedback,
      verbesserung: result.klarheit_sprache?.verbesserung,
    },
    {
      key: 'usp_score',
      title: 'USP & Skills',
      score: result.usp_score ?? result.usp_skills?.score ?? 0,
      feedback: result.usp_feedback ?? result.usp_skills?.feedback,
      verbesserung: result.usp_skills?.verbesserung,
    },
    {
      key: 'formales_score',
      title: 'Formales & Design',
      score: result.formales_score ?? result.formales?.score ?? 0,
      feedback: result.formales_feedback ?? result.formales?.feedback,
      verbesserung: result.formales?.verbesserung,
    },
    {
      key: 'tiefe_score',
      title: 'Erfahrungstiefe',
      score: result.tiefe_score ?? 0,
      feedback: result.tiefe_feedback,
      verbesserung: undefined,
    },
  ];

  // --------------------------------------------------
  // SPEICHERN IM DASHBOARD (kein Paywall mehr!)
  // --------------------------------------------------
  const handleSaveToDashboard = async () => {
    if (!user) {
      const currentPath = `/cv-result/${uploadId}`;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`);
      return;
    }

    setIsSaving(true);

    const { error } = await supabase.from('ats_analyses').insert({
      user_id: user.id,
      upload_id: uploadId,
      analysis_data: result,
      ats_score: result.ats_score ?? 0,
    });

    if (error) {
      console.error('[AtsResultDisplay] Save error:', error);
      setIsSaving(false);
      return;
    }

    setSaveSuccess(true);
    onSaveComplete?.();
    setIsSaving(false);

    if (!isPaid) {
      setShowUnlockModal(true);
    } else {
      navigate('/dashboard');
    }
  };

  const handleUnlockYes = () => {
    setShowUnlockModal(false);
    if (!user) {
      const redirectTarget = `/cv-paywall?cvId=${uploadId}&source=cv_unlock`;
      navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
    } else {
      navigate(`/cv-paywall?cvId=${uploadId}&source=cv_unlock`);
    }
  };

  const handleUnlockNo = () => {
    setShowUnlockModal(false);
    navigate('/dashboard');
  };


  // --------------------------------------------------
  // UI RENDER
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#050816]">
      <div className="max-w-7xl mx-auto px-3 py-4 space-y-4 sm:px-4 sm:py-6">

        {/* HEADER */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center lg:text-left"
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-1">
            Dein ATS-Score
          </h1>
          <p className="text-xs sm:text-sm text-white/60">
            Score + Top-Empfehlungen für bessere Ergebnisse
          </p>
        </motion.header>

        <div className="lg:grid lg:grid-cols-[1.5fr,1fr] lg:gap-6">

          {/* LEFT COLUMN */}
          <div className="space-y-4 sm:space-y-6">

            {/* SCORE CARD */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-[#0b1220] border border-white/5 shadow-xl p-4"
            >
              <div className="flex flex-col items-center text-center space-y-4">
                <CircularScore score={score} />
                <div>
                  <p className="text-lg md:text-xl font-bold text-white mb-1">
                    {scoreLabel}
                  </p>
                  <p className="text-sm text-white/60">
                    Dein CV hat einen ATS-Score von {score}/100
                  </p>
                </div>
              </div>
            </motion.div>

            {/* TABS */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="flex gap-2 sm:gap-3"
            >
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                  effectiveTab === 'overview'
                    ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <BarChart3 size={18} /> Übersicht
              </button>

              <button
                onClick={() => setActiveTab('detail')}
                className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all ${
                  effectiveTab === 'detail'
                    ? 'bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                <FileCheck size={18} /> Detailanalyse
              </button>
            </motion.div>

            {/* OVERVIEW TAB - Immer sichtbar, keine Paywall */}
            {effectiveTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl bg-[#0b1220] border border-white/5 shadow-lg p-4 space-y-4"
              >
                <h2 className="text-lg font-semibold text-white">ATS-Bewertung (Übersicht)</h2>
                {categories.map((cat, idx) => (
                  <CategoryRow
                    key={cat.key}
                    title={cat.title}
                    score={Math.max(0, Math.min(100, cat.score))}
                    delay={0.3 + idx * 0.1}
                  />
                ))}
              </motion.div>
            )}

            {/* DETAIL TAB - Mit Paywall wenn nicht bezahlt */}
            {effectiveTab === 'detail' && (
              <>
                {!isPaid ? (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="text-center max-w-2xl mx-auto p-8 rounded-2xl bg-[#0b1220] border border-[#66c0b6]/30 shadow-2xl"
                  >
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center mx-auto mb-6">
                      <Lock size={36} className="text-black" />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3">
                      Detailanalyse freischalten
                    </h3>

                    <p className="text-white/70 mb-6 text-lg">
                      Erhalte Zugriff auf detaillierte Kategorien-Bewertungen, konkretes Feedback und Verbesserungsvorschläge für deinen Lebenslauf.
                    </p>

                    <div className="bg-white/5 rounded-xl p-6 mb-6">
                      <h4 className="text-white font-semibold mb-3">Das bekommst du:</h4>
                      <ul className="text-left text-white/80 space-y-2">
                        <li className="flex items-start gap-2">
                          <CheckCircle size={20} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />
                          <span>Detaillierte Bewertung in 6 Kategorien</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle size={20} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />
                          <span>Individuelles Feedback zu jeder Kategorie</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle size={20} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />
                          <span>Konkrete Verbesserungsvorschläge</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle size={20} className="text-[#66c0b6] flex-shrink-0 mt-0.5" />
                          <span>Top-3 Prioritäten für sofortige Optimierung</span>
                        </li>
                      </ul>
                    </div>

                    <button
                      onClick={() => {
                        if (!user) {
                          const redirectTarget = `/cv-paywall?cvId=${uploadId}&source=cv_unlock`;
                          navigate(`/login?redirect=${encodeURIComponent(redirectTarget)}`);
                        } else {
                          navigate(`/cv-paywall?cvId=${uploadId}&source=cv_unlock`);
                        }
                      }}
                      className="w-full px-8 py-4 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold text-lg hover:opacity-90 transition-all shadow-lg"
                    >
                      Jetzt für 5€ freischalten
                    </button>

                    {/* Blurred Preview */}
                    <div className="blur-md opacity-30 mt-8 pointer-events-none">
                      <div className="rounded-2xl bg-[#0b1220] border border-white/5 p-4 space-y-3">
                        <div className="h-4 bg-white/10 rounded w-1/3"></div>
                        <div className="h-20 bg-white/10 rounded"></div>
                        <div className="h-20 bg-white/10 rounded"></div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                    <h2 className="text-lg font-semibold text-white mb-4">
                      Detailbewertung
                    </h2>

                    <div className="space-y-4">
                      {categories.map((cat, idx) => (
                        <DetailCard
                          key={cat.key}
                          title={cat.title}
                          category={cat.feedback !== undefined ? { score: cat.score, feedback: cat.feedback, verbesserung: cat.verbesserung } : undefined}
                          delay={0.2 + idx * 0.08}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4 sm:space-y-6 mt-6 lg:mt-0">
            
            {/* Top To-Dos */}
            {Object.keys(todos).length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl bg-[#0b1220] border border:white/5 shadow-lg p-4 space-y-3"
              >
                <h2 className="text-lg font-semibold text-white">Top-3 To-dos</h2>

                {Object.entries(todos).map(([key, value], index) => (
                  <div key={key} className="flex gap-3 items-start">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-sky-400 flex items-center justify-center text-black font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-teal-400">{key}</p>
                      <p className="text-sm text-white/80">{value}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Time Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="rounded-xl bg-[#0b1220] border border-white/5 p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-teal-500/10 flex items-center justify-center flex-shrink-0">
                  <Clock className="text-teal-400" size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/90">Zeitaufwand</p>
                  <p className="text-sm text-white/60">
                    Die nächsten Schritte dauern ca. 2–3 Minuten
                  </p>
                </div>
              </div>
            </motion.div>

            {/* NÄCHSTER SCHRITT */}
            {showActions && !isFromDashboard && (
              <>
                {!saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    {/* Next step header */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #66c0b6, #30E3CA)' }}>
                        <ArrowRight size={11} className="text-black" />
                      </div>
                      <span className="text-xs font-semibold tracking-widest uppercase text-[#66c0b6]">Nächster Schritt</span>
                    </div>

                    <div
                      className="relative overflow-hidden rounded-2xl border border-[#66c0b6]/25 p-5 space-y-3"
                      style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1f3c 100%)' }}
                    >
                      <div
                        className="absolute -top-10 -right-10 w-40 h-40 rounded-full pointer-events-none"
                        style={{ background: 'radial-gradient(circle, rgba(102,192,182,0.1) 0%, transparent 70%)' }}
                      />

                      <div className="relative">
                        <p className="text-white font-semibold text-sm mb-0.5">Ergebnis im Dashboard sichern</p>
                        <p className="text-white/45 text-xs leading-relaxed">
                          Speichere deine Analyse und erstelle direkt einen optimierten CV.
                        </p>
                      </div>

                      <button
                        onClick={handleSaveToDashboard}
                        disabled={isSaving}
                        className="relative w-full rounded-xl font-bold py-3.5 text-sm text-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{
                          background: 'linear-gradient(135deg, #66c0b6 0%, #30E3CA 100%)',
                          boxShadow: '0 4px 16px rgba(102,192,182,0.35)',
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 6px 22px rgba(102,192,182,0.5)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(102,192,182,0.35)'; e.currentTarget.style.transform = 'translateY(0)'; }}
                      >
                        {isSaving ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Speichere...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Im Dashboard speichern
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => navigate(uploadId ? `/cv-wizard?importFrom=${uploadId}` : '/cv-wizard')}
                        className="w-full rounded-xl font-semibold py-3 text-sm text-white/70 border border-white/10 hover:bg-white/5 hover:text-white hover:border-white/20 transition-all flex items-center justify-center gap-2"
                      >
                        <FileText size={15} />
                        CV erstellen
                      </button>
                    </div>
                  </motion.div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showUnlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-md rounded-2xl bg-[#0b1220] border border-[#66c0b6]/30 p-6 shadow-2xl"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center mx-auto mb-4">
              <Lock size={26} className="text-black" />
            </div>

            <h3 className="text-xl font-bold text-white text-center mb-2">
              Detailanalyse freischalten?
            </h3>
            <p className="text-white/60 text-sm text-center mb-6">
              Dein CV wurde gespeichert. Möchtest du jetzt die detaillierte Analyse mit konkretem Feedback und Verbesserungsvorschlägen freischalten?
            </p>

            <ul className="space-y-2 mb-6">
              {[
                'Detaillierte Bewertung in 6 Kategorien',
                'Individuelles Feedback zu jeder Kategorie',
                'Konkrete Verbesserungsvorschläge',
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-white/80">
                  <CheckCircle size={16} className="text-[#66c0b6] flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>

            <button
              onClick={handleUnlockYes}
              className="w-full rounded-full bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-semibold py-3 mb-3 hover:opacity-90 transition-all"
            >
              Jetzt für 5€ freischalten
            </button>

            <button
              onClick={handleUnlockNo}
              className="w-full rounded-full bg-white/10 border border-white/20 text-white font-semibold py-3 hover:bg-white/20 transition-all"
            >
              Nein, zum Dashboard
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
};
