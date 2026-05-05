import { X, Edit3, Zap } from 'lucide-react';

interface CVAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRepeatWizard: () => void;
  onGoToEditor: () => void;
}

export function CVAdjustmentModal({
  isOpen,
  onClose,
  onRepeatWizard,
  onGoToEditor,
}: CVAdjustmentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-lg w-full">
        <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">CV anpassen?</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-all"
          >
            <X size={24} className="text-white/60" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <p className="text-white/70">
            Möchtest du deinen CV für diese Stelle nochmal anpassen oder direkt in den Editor gehen?
          </p>

          <div className="space-y-3">
            <button
              onClick={onRepeatWizard}
              className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-[#66c0b6] to-[#30E3CA] text-black font-bold hover:opacity-90 transition-all flex items-center justify-center gap-3 group"
            >
              <Edit3 size={20} className="group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-bold">CV-Erstellungsprozess wiederholen</div>
                <div className="text-xs opacity-80">Alle Schritte nochmal durchgehen</div>
              </div>
            </button>

            <button
              onClick={onGoToEditor}
              className="w-full px-6 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-3 group"
            >
              <Zap size={20} className="text-[#66c0b6] group-hover:scale-110 transition-transform" />
              <div className="text-left">
                <div className="font-bold">Direkt in den Editor</div>
                <div className="text-xs opacity-60">Schnell bearbeiten und exportieren</div>
              </div>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 text-sm text-white/50 hover:text-white/70 transition-all"
          >
            Abbrechen
          </button>
        </div>
      </div>
    </div>
  );
}
