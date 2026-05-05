import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Loader2 } from 'lucide-react';
import { uploadCvAndCreateRecord } from '../../services/cvUploadService';
import { CVBuilderData } from '../../utils/cvDataMapper';
import { getOrCreateTempId } from '../../utils/tempIdManager';
import { startCvPolling } from '../../utils/cvPolling';

interface WizardCVUploadProps {
  userId: string | null;
  onDataImported: (data: CVBuilderData) => void;
}

type UploadState = 'idle' | 'uploading' | 'processing' | 'done' | 'error';

export function WizardCVUpload({ userId, onDataImported }: WizardCVUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const stopPollingRef = useRef<(() => void) | null>(null);

  const stopPolling = () => {
    if (stopPollingRef.current) {
      stopPollingRef.current();
      stopPollingRef.current = null;
    }
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.name.match(/\.pdf$/i)) {
      setErrorMsg('Bitte lade nur PDF-Dateien hoch.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Die Datei ist zu groß. Maximal 10 MB.');
      return;
    }

    setErrorMsg(null);
    setUploadState('uploading');

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
      maxAttempts: 40,
      intervalMs: 3000,
      onSuccess: (mapped) => {
        setUploadState('done');
        setTimeout(() => onDataImported(mapped), 600);
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
  };

  if (uploadState === 'done') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10">
        <CheckCircle size={20} className="text-emerald-400 flex-shrink-0" />
        <span className="text-sm text-emerald-300 font-medium">Lebenslauf erfolgreich importiert!</span>
      </div>
    );
  }

  if (uploadState === 'processing' || uploadState === 'uploading') {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10 bg-white/5">
        <Loader2 size={20} className="text-[#66c0b6] animate-spin flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-white/80 font-medium">
            {uploadState === 'uploading' ? 'Datei wird hochgeladen...' : 'Daten werden ausgelesen...'}
          </p>
          <p className="text-xs text-white/40 mt-0.5">Das dauert etwa 30–60 Sekunden</p>
        </div>
        <button onClick={reset} className="text-white/30 hover:text-white/60 transition-colors">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`
          relative flex items-center gap-3 px-4 py-3 rounded-2xl border cursor-pointer transition-all duration-200
          ${isDragging
            ? 'border-[#66c0b6]/60 bg-[#66c0b6]/10'
            : 'border-white/10 bg-white/5 hover:border-[#66c0b6]/40 hover:bg-white/8'
          }
        `}
      >
        <div className="w-9 h-9 rounded-xl bg-[#66c0b6]/10 border border-[#66c0b6]/20 flex items-center justify-center flex-shrink-0">
          {uploadState === 'error' ? (
            <AlertCircle size={18} className="text-red-400" />
          ) : (
            <Upload size={18} className="text-[#66c0b6]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">
            Lebenslauf hochladen &amp; Daten importieren
          </p>
          <p className="text-xs text-white/40 mt-0.5">PDF — Felder werden automatisch ausgefüllt</p>
        </div>
        <FileText size={16} className="text-white/20 flex-shrink-0" />
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-300">{errorMsg}</p>
          <button onClick={reset} className="ml-auto text-red-400/50 hover:text-red-400 transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="hidden"
      />
    </div>
  );
}
