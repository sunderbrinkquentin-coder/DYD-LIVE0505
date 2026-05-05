// src/pages/CVCheckPage.tsx

import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Loader,
  XCircle,
  Sparkles,
  ArrowLeft,
  BarChart3,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { uploadCvAndCreateRecord } from '../services/cvUploadService';
import { supabase } from '../lib/supabase';

type UploadState = 'idle' | 'uploading' | 'success' | 'error';

export default function CVCheckPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const abortRef = useRef<AbortController | null>(null);

  const [tempId] = useState(() => {
    const newId = `temp_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    sessionStorage.setItem('cv_check_temp_id', newId);
    localStorage.setItem('cv_temp_id', newId);
    return newId;
  });

  const [file, setFile] = useState<File | null>(null);
  const [uploadState, setUploadState] = useState<UploadState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [existingCheck, setExistingCheck] = useState<any>(null);
  const [userDismissedExisting, setUserDismissedExisting] = useState(false);
  const [showUploadHint, setShowUploadHint] = useState(false);

  useEffect(() => {
    if (uploadState === 'uploading') {
      setShowUploadHint(false);
      const t = setTimeout(() => setShowUploadHint(true), 5000);
      return () => clearTimeout(t);
    } else {
      setShowUploadHint(false);
    }
  }, [uploadState]);

  useEffect(() => {
    setUploadState('idle');
    setProgress(0);
    setError(null);
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (authLoading || !user || userDismissedExisting) return;

    let isMounted = true;

    const checkExistingAnalysis = async () => {
      try {
        const { data, error: dbError } = await supabase
          .from('stored_cvs')
          .select('id, created_at')
          .eq('user_id', user.id)
          .eq('source', 'check')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (dbError) throw dbError;
        if (data && isMounted) setExistingCheck(data);
      } catch (err) {
        console.error('[CVCheckPage] Error checking existing analysis:', err);
      }
    };

    checkExistingAnalysis();

    return () => { isMounted = false; };
  }, [user, authLoading, userDismissedExisting]);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0];
      const isWrongType = rejection.errors?.some((e: any) => e.code === 'file-invalid-type');
      if (isWrongType) {
        setError('Bitte lade dein CV als PDF-Datei hoch. Word-Dateien (.doc, .docx) werden derzeit nicht unterstuetzt.');
        return;
      }
    }
    if (!acceptedFiles || acceptedFiles.length === 0) return;
    const selected = acceptedFiles[0];

    const MAX_FILE_SIZE_MB = 5;
    if (selected.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setError(`Die Datei ist zu gross. Bitte lade eine PDF-Datei bis ${MAX_FILE_SIZE_MB} MB hoch.`);
      return;
    }

    setFile(selected);
    setError(null);
    setUploadState('idle');
    setProgress(0);
  }, []);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    acceptedFiles,
  } = useDropzone({
    onDrop,
    multiple: false,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: 5 * 1024 * 1024,
  });

  const handleUpload = async () => {
    if (!file) {
      setError('Bitte wähle zuerst eine PDF-Datei aus.');
      return;
    }

    if (uploadState === 'uploading') {
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    abortRef.current = new AbortController();

    let progressTimer: ReturnType<typeof setInterval> | null = null;

    try {
      setError(null);
      setUploadState('uploading');
      setProgress(5);

      let currentProgress = 5;
      progressTimer = setInterval(() => {
        currentProgress = currentProgress < 70 ? currentProgress + 3 : currentProgress < 85 ? currentProgress + 1 : currentProgress;
        setProgress(currentProgress);
      }, 400);

      const result = await uploadCvAndCreateRecord(file, {
        source: 'check',
        userId: user?.id || null,
        tempId: tempId,
      });

      if (progressTimer) clearInterval(progressTimer);

      if (!result.uploadId) {
        throw new Error(result.error || 'Upload fehlgeschlagen');
      }

      setProgress(100);
      setUploadState('success');

      navigate(`/cv-result/${result.uploadId}${result.triggerFailed ? '?retry=1' : ''}`);

    } catch (err: any) {
      if (progressTimer) clearInterval(progressTimer);
      console.error('[CVCheckPage] Upload error:', err?.message);

      setUploadState('error');
      setProgress(0);

      let userFriendlyError = 'Ein Fehler ist aufgetreten. Bitte versuche es erneut.';
      if (err?.message) {
        if (err.message.includes('signal is aborted') || err.message.includes('aborted without reason')) {
          userFriendlyError = 'Die Verbindung wurde unterbrochen. Bitte versuche es erneut.';
        } else if (err.message.includes('Datenbank')) {
          userFriendlyError = 'Es gab ein Problem beim Speichern deiner Daten. Bitte versuche es in ein paar Minuten erneut.';
        } else if (err.message.includes('Failed to fetch') || err.message.includes('Verbindung')) {
          userFriendlyError = 'Verbindung fehlgeschlagen. Bitte überprüfe deine Internetverbindung.';
        } else {
          userFriendlyError = err.message;
        }
      }

      setError(userFriendlyError);
    }
  };

  const resetState = () => {
    setFile(null);
    setUploadState('idle');
    setError(null);
    setProgress(0);
    setExistingCheck(null);
    setUserDismissedExisting(true);
  };

  const currentFile = file ?? acceptedFiles[0] ?? null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-8">
      <motion.div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-teal-400" />
            <h1 className="text-xl font-semibold text-slate-50">DYD – CV-Check</h1>
          </div>
          <button onClick={() => navigate('/')} className="text-sm text-slate-300 hover:text-teal-400 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Zurück
          </button>
        </div>

        {existingCheck && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-teal-500/10 border border-teal-500/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-teal-300">
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Du hast bereits einen CV-Check. <button onClick={() => navigate(`/cv-result/${existingCheck.id}`)} className="underline hover:text-teal-200">Ergebnis ansehen</button></span>
            </div>
            <button onClick={resetState} className="text-xs text-slate-400 hover:text-slate-200 shrink-0">Neuer Check</button>
          </div>
        )}

        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-6 cursor-pointer transition ${
            isDragActive ? 'border-teal-400 bg-slate-800/60' : 'border-slate-700 bg-slate-900/60'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2 text-center">
            <Upload className="w-8 h-8 text-slate-300 mb-1" />
            <p className="text-sm text-slate-100 font-medium">PDF hierher ziehen oder klicken</p>
            <p className="text-xs text-slate-400">Nur PDF-Dateien · max. 5 MB</p>
            {currentFile && (
              <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-slate-800/80 px-3 py-1">
                <FileText className="w-4 h-4 text-teal-300" />
                <span className="text-xs text-slate-100 truncate max-w-[200px]">{currentFile.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {uploadState === 'uploading' && (
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <Loader className="w-4 h-4 animate-spin" /> <span>Analysiere deinen CV…</span>
              </div>
              {showUploadHint && (
                <p className="text-xs text-slate-400 leading-relaxed">
                  Das dauert ungewohnlich lang. Bitte drucke <strong className="text-slate-200">STRG + F5</strong> um die Seite neu zu laden und starte den Prozess nochmal.
                </p>
              )}
            </div>
          )}
          {uploadState === 'error' && error && (
            <div className="flex items-start gap-2 text-xs text-red-400">
              <XCircle className="w-4 h-4 mt-[1px]" /> <span>{error}</span>
            </div>
          )}
          {progress > 0 && (
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div className="h-1.5 bg-teal-400 transition-[width]" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            onClick={handleUpload}
            disabled={!currentFile || uploadState === 'uploading'}
            className="flex-1 bg-teal-500 hover:bg-teal-400 disabled:bg-slate-700 disabled:text-slate-400 text-slate-950 font-bold py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            {uploadState === 'uploading' ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            CV-Check starten
          </button>
          <button onClick={resetState} className="text-xs text-slate-400 hover:text-slate-200">Zurücksetzen</button>
        </div>
      </motion.div>
    </div>
  );
}
