import { X, Zap, RefreshCw, ArrowRight, Coins } from 'lucide-react';

interface CreateCVChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOneClick: () => void;
  onWizard: () => void;
  userTokens: number;
  hasExistingCvData: boolean;
}

export function CreateCVChoiceModal({
  isOpen,
  onClose,
  onOneClick,
  onWizard,
  userTokens,
  hasExistingCvData,
}: CreateCVChoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl max-w-lg w-full overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Neuen CV erstellen</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={20} className="text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-sm text-white/60">
            Wie möchtest du deinen neuen CV erstellen?
          </p>

          {hasExistingCvData && (
            <button
              onClick={onOneClick}
              className="w-full group flex items-start gap-4 px-5 py-4 rounded-2xl bg-gradient-to-r from-[#0d2a28] to-[#0a1f1d] border border-[#66c0b6]/40 hover:border-[#66c0b6]/80 transition-all text-left hover:shadow-lg hover:shadow-[#66c0b6]/10"
            >
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-[#66c0b6] to-[#30E3CA] flex items-center justify-center shadow-md">
                <Zap size={20} className="text-black" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-white">One-Click Optimierung</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#66c0b6]/20 text-[#66c0b6] border border-[#66c0b6]/30">
                    Empfohlen
                  </span>
                </div>
                <p className="text-sm text-white/55">
                  Deine CV-Daten werden automatisch übernommen. Trage nur noch die Wunschstelle ein.
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-white/40">
                  <Coins size={12} className="text-[#66c0b6]" />
                  <span>1 Credit · Schnellster Weg zu deinem optimierten CV</span>
                </div>
              </div>
              <ArrowRight size={18} className="flex-shrink-0 text-white/30 group-hover:text-[#66c0b6] transition-colors mt-1" />
            </button>
          )}

          <button
            onClick={onWizard}
            className="w-full group flex items-start gap-4 px-5 py-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/25 transition-all text-left"
          >
            <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center">
              <RefreshCw size={20} className="text-white/60" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-bold text-white">Wizard neu durchlaufen</span>
              </div>
              <p className="text-sm text-white/55">
                Starte von vorne und aktualisiere alle deine CV-Daten Schritt für Schritt.
              </p>
              <div className="flex items-center gap-1.5 mt-2 text-xs text-white/40">
                <Coins size={12} />
                <span>1 Credit · Vollständige Dateneingabe</span>
              </div>
            </div>
            <ArrowRight size={18} className="flex-shrink-0 text-white/30 group-hover:text-white/60 transition-colors mt-1" />
          </button>

          {userTokens <= 0 && (
            <div className="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-sm text-yellow-400 text-center">
                Du hast keine Credits mehr. Du wirst zur Bezahlung weitergeleitet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
