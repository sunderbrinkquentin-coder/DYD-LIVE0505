import { useState, useRef, useEffect } from 'react';
import { Upload, PlusCircle, ArrowRight, FileText, CheckCircle, AlertCircle, X, Sparkles, Linkedin, ExternalLink, User, Briefcase, GraduationCap, Zap, Globe, FolderOpen } from 'lucide-react';
import { uploadCvAndCreateRecord } from '../../services/cvUploadService';
import { CVBuilderData } from '../../utils/cvDataMapper';
import { getOrCreateTempId } from '../../utils/tempIdManager';
import { AvatarSidebar } from './AvatarSidebar';
import { startCvPolling } from '../../utils/cvPolling';

interface WizardEntryScreenProps {
  userId: string | null;
  wizardCvId?: string | null;
  onUploadComplete: (data: CVBuilderData) => void;
  onCreateNew: () => void;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

const ANALYSIS_HINTS = [
  'Persönliche Daten werden erkannt...',
  'Berufserfahrung wird strukturiert...',
  'Ausbildung & Zertifikate werden gelesen...',
  'Fachliche Skills werden identifiziert...',
  'Sprachen & Softskills werden analysiert...',
  'Abschluss-Check läuft...',
];

const ANALYSIS_STEPS = [
  { icon: User, label: 'Persönliche Daten', key: 'personal' },
  { icon: Briefcase, label: 'Berufserfahrung', key: 'experience' },
  { icon: GraduationCap, label: 'Ausbildung', key: 'education' },
  { icon: Zap, label: 'Skills', key: 'skills' },
  { icon: Globe, label: 'Sprachen', key: 'languages' },
  { icon: FolderOpen, label: 'Projekte', key: 'projects' },
];

function LoadingScreen({
  uploadState,
  attempt,
  maxAttempts,
  onCancel,
}: {
  uploadState: 'uploading' | 'processing';
  attempt: number;
  maxAttempts: number;
  onCancel: () => void;
}) {
  const [hintIndex, setHintIndex] = useState(0);
  const [checkedSteps, setCheckedSteps] = useState<number[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    startRef.current = Date.now();
    setElapsedMs(0);
    setCheckedSteps([]);
    setHintIndex(0);
  }, [uploadState]);

  useEffect(() => {
    if (uploadState !== 'processing') return;
    const timer = setInterval(() => {
      setElapsedMs(Date.now() - startRef.current);
    }, 200);
    return () => clearInterval(timer);
  }, [uploadState]);

  useEffect(() => {
    if (uploadState !== 'processing') return;
    const interval = setInterval(() => {
      setHintIndex(i => (i + 1) % ANALYSIS_HINTS.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [uploadState]);

  useEffect(() => {
    if (uploadState !== 'processing') return;
    const delays = [1500, 4000, 8000, 14000, 20000, 28000];
    const timers = delays.map((d, i) =>
      setTimeout(() => setCheckedSteps(prev => [...prev, i]), d)
    );
    return () => timers.forEach(clearTimeout);
  }, [uploadState]);

  const estimatedMs = 45000;
  let progressPct: number;

  if (uploadState === 'uploading') {
    progressPct = 15;
  } else {
    const timeProgress = Math.min(elapsedMs / estimatedMs, 0.9);
    const attemptProgress = Math.min(attempt / maxAttempts, 0.9);
    progressPct = 20 + Math.max(timeProgress, attemptProgress) * 75;
  }

  progressPct = Math.min(progressPct, 93);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020617] px-6 overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#66c0b6]/4 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-[#30E3CA]/3 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
      </div>

      <div className="relative flex flex-col items-center gap-8 text-center max-w-sm w-full">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border border-[#66c0b6]/10" />
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 96 96">
            <circle cx="48" cy="48" r="44" fill="none" stroke="rgba(102,192,182,0.08)" strokeWidth="2" />
            <circle
              cx="48" cy="48" r="44"
              fill="none"
              stroke="url(#grad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 44}`}
              strokeDashoffset={`${2 * Math.PI * 44 * (1 - progressPct / 100)}`}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
            <defs>
              <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#66c0b6" />
                <stop offset="100%" stopColor="#30E3CA" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            {uploadState === 'uploading' ? (
              <Upload size={28} className="text-[#66c0b6]" />
            ) : (
              <Sparkles size={28} className="text-[#66c0b6]" style={{ animation: 'pulse 2s ease-in-out infinite' }} />
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-tight">
            {uploadState === 'uploading' ? 'Wird hochgeladen...' : 'KI analysiert deinen Lebenslauf'}
          </h2>
          <p
            key={hintIndex}
            className="text-sm text-white/50 leading-relaxed transition-all duration-500"
            style={{ animation: uploadState === 'processing' ? 'fadeInUp 0.5s ease' : undefined }}
          >
            {uploadState === 'uploading'
              ? 'Dein Dokument wird sicher übertragen.'
              : ANALYSIS_HINTS[hintIndex]}
          </p>
        </div>

        {uploadState === 'processing' && (
          <div className="w-full grid grid-cols-3 gap-2">
            {ANALYSIS_STEPS.map((step, i) => {
              const Icon = step.icon;
              const isChecked = checkedSteps.includes(i);
              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl transition-all duration-500"
                  style={{
                    background: isChecked ? 'rgba(102,192,182,0.08)' : 'rgba(255,255,255,0.02)',
                    border: isChecked ? '1px solid rgba(102,192,182,0.25)' : '1px solid rgba(255,255,255,0.05)',
                    opacity: isChecked ? 1 : 0.4,
                  }}
                >
                  {isChecked ? (
                    <CheckCircle size={16} className="text-[#66c0b6]" />
                  ) : (
                    <Icon size={16} className="text-white/30" />
                  )}
                  <span className="text-[10px] text-white/50 leading-tight text-center">{step.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="w-full space-y-1.5">
          <div className="w-full h-1 rounded-full bg-white/5 overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${progressPct}%`,
                background: 'linear-gradient(90deg, #66c0b6, #30E3CA)',
                transition: 'width 0.8s ease',
              }}
            />
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-white/25">
              {uploadState === 'uploading' ? 'Schritt 1/2: Upload' : 'Schritt 2/2: Analyse'}
            </p>
            <p className="text-xs text-white/25">{Math.round(progressPct)}%</p>
          </div>
        </div>

        {uploadState === 'processing' && (
          <p className="text-xs text-white/25 -mt-3">
            Dauert etwa 30–60 Sekunden
          </p>
        )}

        <button
          onClick={onCancel}
          className="text-xs text-white/20 hover:text-white/50 transition-colors"
        >
          Abbrechen
        </button>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export function WizardEntryScreen({ userId, wizardCvId: _wizardCvId, onUploadComplete, onCreateNew }: WizardEntryScreenProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUploadArea, setShowUploadArea] = useState(false);
  const [pollAttempt, setPollAttempt] = useState(0);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stopPollingRef = useRef<(() => void) | null>(null);

  const MAX_ATTEMPTS = 50;

  const stopPolling = () => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.match(/\.pdf$/i)) {
      setErrorMsg('Bitte lade nur PDF-Dateien hoch. Word-Dokumente werden derzeit nicht unterstützt.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Die Datei ist zu groß. Maximal 10 MB.');
      return;
    }

    setErrorMsg(null);
    setUploadState('uploading');
    setPollAttempt(0);

    const tempId = getOrCreateTempId();

    const result = await uploadCvAndCreateRecord(file, {
      source: 'wizard',
      userId,
      tempId,
    });

    if (!result.success || !result.uploadId) {
      setUploadState('error');
      setErrorMsg(result.error || 'Upload fehlgeschlagen. Bitte versuche es erneut.');
      return;
    }

    setUploadState('processing');

    stopPollingRef.current = startCvPolling({
      uploadId: result.uploadId,
      userId,
      tempId,
      maxAttempts: MAX_ATTEMPTS,
      intervalMs: 3000,
      onAttempt: (attempt) => setPollAttempt(attempt),
      onSuccess: (mapped) => {
        const safeData = (mapped && typeof mapped === 'object' ? mapped : {}) as CVBuilderData;
        setUploadState('done');
        onUploadComplete(safeData);
      },
      onError: (msg) => {
        setUploadState('error');
        setErrorMsg(msg);
      },
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const reset = () => {
    stopPolling();
    setUploadState('idle');
    setErrorMsg(null);
    setShowUploadArea(false);
    setPollAttempt(0);
  };

  const isActive = uploadState === 'uploading' || uploadState === 'processing';

  if (isActive) {
    return (
      <LoadingScreen
        uploadState={uploadState as 'uploading' | 'processing'}
        attempt={pollAttempt}
        maxAttempts={MAX_ATTEMPTS}
        onCancel={reset}
      />
    );
  }

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:p-6 lg:max-w-7xl lg:mx-auto">
        <div className="flex-1 space-y-6 animate-fade-in px-4 sm:px-0">
          <div className="text-center max-w-2xl mx-auto space-y-2 pt-2">
            <h1 className="text-xl sm:text-2xl lg:text-4xl font-bold bg-gradient-to-r from-white via-[#66c0b6] to-white bg-clip-text text-transparent leading-tight px-2">
              Wie möchtest du starten?
            </h1>
            <p className="text-sm sm:text-base text-white/60 leading-relaxed px-2">
              Lade deinen bestehenden Lebenslauf hoch und spare Zeit – oder erstelle ihn komplett neu.
            </p>
          </div>

          <div className="max-w-xl mx-auto w-full space-y-3">
            {!showUploadArea ? (
              <button
                onClick={() => setShowUploadArea(true)}
                className="group w-full relative rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 hover:border-[#66c0b6]/40 transition-all duration-300 shadow-lg hover:shadow-[0_0_40px_rgba(102,192,182,0.2)] cursor-pointer text-left hover:scale-[1.01]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#66c0b6]/20 to-[#30E3CA]/20 flex items-center justify-center border border-[#66c0b6]/30 group-hover:scale-110 transition-transform flex-shrink-0">
                    <Upload size={22} className="text-[#66c0b6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-white mb-0.5 group-hover:text-[#66c0b6] transition-colors">
                      Bestehenden Lebenslauf hochladen
                    </h3>
                    <p className="text-xs sm:text-sm text-white/50">
                      PDF — alle Felder werden automatisch ausgefüllt
                    </p>
                  </div>
                  <ArrowRight size={20} className="text-[#66c0b6] group-hover:translate-x-1 transition-transform flex-shrink-0" />
                </div>
              </button>
            ) : (
              <div className="rounded-2xl border border-[#66c0b6]/30 bg-white/5 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/20 flex items-center justify-center flex-shrink-0">
                    <Upload size={18} className="text-[#66c0b6]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">Lebenslauf hochladen</p>
                    <p className="text-xs text-white/40">PDF, max. 10 MB</p>
                  </div>
                  <button
                    onClick={reset}
                    className="text-white/30 hover:text-white/60 transition-colors"
                    title="Abbrechen"
                  >
                    <X size={16} />
                  </button>
                </div>

                {uploadState === 'done' ? (
                  <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                    <CheckCircle size={18} className="text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-emerald-300 font-medium">Lebenslauf erfolgreich importiert!</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`
                        flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
                        ${isDragging
                          ? 'border-[#66c0b6]/70 bg-[#66c0b6]/10'
                          : 'border-white/15 hover:border-[#66c0b6]/50 hover:bg-white/5'
                        }
                      `}
                    >
                      <FileText size={28} className="text-white/30" />
                      <p className="text-sm text-white/60 font-medium">PDF hierher ziehen oder klicken</p>
                      <p className="text-xs text-white/30">Nur PDF-Dateien, max. 10 MB</p>
                    </div>

                    <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-[#0a3040]/60 border border-[#66c0b6]/20">
                      <Linkedin size={15} className="text-[#0A66C2] flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-white/70 leading-relaxed">
                          <span className="font-semibold text-white/90">LinkedIn-Profil?</span>{' '}
                          Lade dein Profil direkt als PDF herunter: LinkedIn &rarr; Profil &rarr; &ldquo;Profil als PDF speichern&rdquo;
                        </p>
                      </div>
                      <a
                        href="https://www.linkedin.com/in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[#66c0b6]/60 hover:text-[#66c0b6] transition-colors flex-shrink-0 mt-0.5"
                      >
                        <ExternalLink size={13} />
                      </a>
                    </div>
                  </div>
                )}

                {errorMsg && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-300 flex-1">{errorMsg}</p>
                    <button onClick={reset} className="text-red-400/50 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                )}

                <input
                  ref={(el) => { fileInputRef.current = el; }}
                  type="file"
                  accept=".pdf"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </div>
            )}

            <button
              onClick={onCreateNew}
              disabled={isActive}
              className="group w-full relative rounded-2xl border border-white/10 bg-white/5 p-5 hover:bg-white/10 hover:border-white/25 transition-all duration-300 shadow-lg cursor-pointer text-left hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/8 flex items-center justify-center border border-white/15 group-hover:scale-110 transition-transform flex-shrink-0">
                  <PlusCircle size={22} className="text-white/70 group-hover:text-white transition-colors" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-bold text-white mb-0.5">
                    Lebenslauf neu erstellen
                  </h3>
                  <p className="text-xs sm:text-sm text-white/50">
                    Schritt für Schritt — alle Felder manuell ausfüllen
                  </p>
                </div>
                <ArrowRight size={20} className="text-white/40 group-hover:text-white/80 group-hover:translate-x-1 transition-all flex-shrink-0" />
              </div>
            </button>
          </div>

          <div className="text-center px-4">
            <p className="text-xs text-white/30">
              Deine Daten bleiben bei dir und werden nicht an Dritte weitergegeben
            </p>
          </div>
        </div>

        <div className="lg:block hidden">
          <AvatarSidebar
            message="Lade deinen bestehenden Lebenslauf hoch und spare bis zu 15 Minuten – oder starte direkt mit einem leeren Formular."
            stepInfo="Deine Daten werden sicher verarbeitet."
            currentStepId="entry"
          />
        </div>
      </div>
    </>
  );
}
