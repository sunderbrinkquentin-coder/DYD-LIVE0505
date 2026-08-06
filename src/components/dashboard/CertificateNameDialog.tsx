import { useState, useEffect, useRef } from 'react';
import { X, Award, FileStack, Loader2 } from 'lucide-react';

interface CertificateNameDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (name: string) => void;
  initialName?: string;
  variant?: 'certificate' | 'profile';
  busy?: boolean;
}

export function CertificateNameDialog({
  open,
  onClose,
  onConfirm,
  initialName = '',
  variant = 'certificate',
  busy = false,
}: CertificateNameDialogProps) {
  const [name, setName] = useState(initialName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setName(initialName);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [open, initialName]);

  if (!open) return null;

  const isProfile = variant === 'profile';
  const accent = isProfile ? '#66c0b6' : '#fbbf24';
  const Icon = isProfile ? FileStack : Award;
  const title = isProfile ? 'Kompetenzprofil erstellen' : 'Zertifikat erstellen';
  const subtitle = isProfile
    ? 'Dein Name erscheint auf dem Kompetenzprofil — dem dokumentierten Nachweis aller abgeschlossenen Lernpfade.'
    : 'Dein Name erscheint auf dem Zertifikat. Du kannst ihn vor der Erstellung anpassen.';

  const handleConfirm = () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    onConfirm(trimmed);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={busy ? undefined : onClose}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg,rgba(15,20,30,0.98),rgba(5,9,18,0.98))',
          border: `1px solid ${accent}33`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.6), 0 0 0 1px ${accent}11`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-px w-full" style={{ background: `linear-gradient(90deg,transparent,${accent}55,transparent)` }} />

        <div className="px-6 pt-6 pb-2 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${accent}15`, border: `1px solid ${accent}30` }}
            >
              <Icon size={18} style={{ color: accent }} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: `${accent}99` }}>
                {isProfile ? 'Kompetenzprofil' : 'Zertifikat'}
              </p>
              <h2 className="text-lg font-black text-white leading-tight">{title}</h2>
            </div>
          </div>
          {!busy && (
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/5 transition-all"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="px-6 pb-6 pt-3 space-y-4">
          <p className="text-sm text-white/55 leading-relaxed">{subtitle}</p>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-white/30">
              Dein Name
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              placeholder="Vor- und Nachname"
              disabled={busy}
              className="w-full px-4 py-3 rounded-xl text-sm font-semibold text-white placeholder-white/25 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${name.trim() ? `${accent}40` : 'rgba(255,255,255,0.1)'}`,
              }}
            />
          </div>

          <button
            onClick={handleConfirm}
            disabled={!name.trim() || busy}
            className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            style={{
              background: `linear-gradient(135deg,${accent},${accent}cc)`,
              color: isProfile ? '#020617' : '#020617',
            }}
          >
            {busy ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Wird erstellt…
              </>
            ) : (
              <>
                <Icon size={15} />
                {isProfile ? 'Kompetenzprofil erstellen' : 'Zertifikat erstellen'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
