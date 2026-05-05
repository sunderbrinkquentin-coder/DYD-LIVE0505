import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export type OptimizationStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'failed'
  | string;

export interface StoredCvRecord {
  id: string;
  status: OptimizationStatus | null;
  cv_data: any | null;
  created_at: string;
  updated_at: string | null;
}

export interface UseCvOptimizationStatusResult {
  cvData: StoredCvRecord | null;
  isLoading: boolean;
  isPolling: boolean;
  isCompleted: boolean;
  isReady: boolean;
  isFailed: boolean;
  isTimeout: boolean;
  error: string | null;
  elapsedSeconds: number;
  refetch: () => Promise<void>;
}

export interface UseCvOptimizationStatusOptions {
  pollingInterval?: number;
  timeoutSeconds?: number;
  enabled?: boolean;
}

function hasCvData(record: any): boolean {
  const cvData = record?.cv_data;
  if (!cvData || typeof cvData !== 'object' || Array.isArray(cvData)) return false;
  return Object.keys(cvData).length > 0;
}

export function useCvOptimizationStatus(
  cvId: string | undefined,
  options: UseCvOptimizationStatusOptions = {}
): UseCvOptimizationStatusResult {
  const {
    pollingInterval = 3000,
    timeoutSeconds = 120,
    enabled = true,
  } = options;

  const [cvData, setCvData] = useState<StoredCvRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const confirmTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notFoundCountRef = useRef<number>(0);

  const isCompleted =
    cvData?.status === 'completed' ||
    cvData?.status === 'optimized';

  const isReady =
    (cvData?.status === 'ready' || cvData?.status === 'draft') && hasCvData(cvData);

  const isFailed = cvData?.status === 'failed';
  const isTimeout = elapsedSeconds >= timeoutSeconds;

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const fetchCvData = useCallback(async (): Promise<StoredCvRecord | null> => {
    if (!cvId) {
      setError('Keine CV-ID vorhanden');
      setIsLoading(false);
      return null;
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('stored_cvs')
        .select('*')
        .eq('id', cvId)
        .maybeSingle();

      if (fetchError) {
        throw new Error(`Datenbankfehler: ${fetchError.message}`);
      }

      if (!data) {
        console.warn('[stored_cvs polling] No record yet for', cvId, '– will retry');
        return null;
      }

      console.log('[stored_cvs polling]', cvId, data.status, 'has_cv_data:', hasCvData(data));
      return data as StoredCvRecord;
    } catch (err: any) {
      setError(err.message || 'Fehler beim Laden der Daten');
      setIsLoading(false);
      stopPolling();
      return null;
    }
  }, [cvId, stopPolling]);

  const handleFetchedData = useCallback(async (data: StoredCvRecord) => {
    const finished =
      data.status === 'completed' ||
      data.status === 'optimized' ||
      data.status === 'failed';

    // If status is 'ready' or 'draft' and cv_data is present, show editor immediately
    // but keep polling so the editor can update with Make.com optimized data once status=completed
    if ((data.status === 'ready' || data.status === 'draft') && hasCvData(data)) {
      console.log('[stored_cvs] ✅ status=' + data.status + ' with cv_data - showing editor, continuing to poll for Make.com');
      setCvData(data);
      setError(null);
      setIsLoading(false);
      return;
    }

    if (!finished) {
      setCvData(data);
      setError(null);
      setIsLoading(false);
      return;
    }

    console.log('[stored_cvs FINISHED]', cvId, data.status);

    if (data.status === 'failed') {
      setCvData(data);
      setError(
        (data as any).error_message ||
          'Die Optimierung ist fehlgeschlagen. Bitte versuche es erneut.'
      );
      setIsLoading(false);
      stopPolling();
      return;
    }

    // Status is completed/optimized - verify cv_data is actually present
    if (hasCvData(data)) {
      console.log('[stored_cvs] ✅ cv_data confirmed present, setting completed');
      setCvData(data);
      setError(null);
      setIsLoading(false);
      stopPolling();
      return;
    }

    // cv_data is missing despite completed status - race condition with Make.com write
    // Stop polling but wait 2s and re-fetch once to allow DB write to propagate
    console.warn('[stored_cvs] ⚠️ status=completed but cv_data is empty - waiting for DB write...');
    stopPolling();
    setIsLoading(true);

    if (confirmTimeoutRef.current) {
      clearTimeout(confirmTimeoutRef.current);
    }

    confirmTimeoutRef.current = setTimeout(async () => {
      const confirmedData = await fetchCvData();
      if (!confirmedData) return;

      if (hasCvData(confirmedData)) {
        setCvData(confirmedData);
        setError(null);
        setIsLoading(false);
        return;
      }

      confirmTimeoutRef.current = setTimeout(async () => {
        const finalData = await fetchCvData();
        if (!finalData) return;
        setCvData(finalData);
        setError(null);
        setIsLoading(false);
      }, 1000);
    }, 500);
  }, [cvId, stopPolling, fetchCvData]);

  const pollOnce = useCallback(async () => {
    const data = await fetchCvData();
    if (data) {
      notFoundCountRef.current = 0;
      await handleFetchedData(data);
    } else {
      notFoundCountRef.current += 1;
      if (notFoundCountRef.current >= 10) {
        setError('Kein Eintrag in stored_cvs für diese ID gefunden');
        setIsLoading(false);
        stopPolling();
      }
    }
  }, [fetchCvData, handleFetchedData, stopPolling]);

  const startPolling = useCallback(() => {
    if (!cvId) return;

    stopPolling();
    setIsPolling(true);
    startTimeRef.current = Date.now();
    setElapsedSeconds(0);
    notFoundCountRef.current = 0;

    pollOnce();

    intervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsedSeconds(elapsed);

      if (elapsed >= timeoutSeconds) {
        setError(
          'Die Optimierung dauert länger als erwartet. Bitte lade die Seite neu oder versuche es später erneut.'
        );
        stopPolling();
        return;
      }

      pollOnce();
    }, pollingInterval);
  }, [cvId, pollingInterval, timeoutSeconds, stopPolling, pollOnce]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const data = await fetchCvData();
    if (data) {
      await handleFetchedData(data);
    }
  }, [fetchCvData, handleFetchedData]);

  useEffect(() => {
    if (!enabled || !cvId) return;
    startPolling();

    const channel = supabase
      .channel(`cv-opt-status-${cvId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'stored_cvs', filter: `id=eq.${cvId}` },
        async () => {
          const data = await fetchCvData();
          if (data) await handleFetchedData(data);
        }
      )
      .subscribe();

    return () => {
      stopPolling();
      supabase.removeChannel(channel);
      if (confirmTimeoutRef.current) {
        clearTimeout(confirmTimeoutRef.current);
      }
    };
  }, [cvId, enabled]);

  useEffect(() => {
    if (isTimeout && !isCompleted && !isFailed) {
      stopPolling();
    }
  }, [isTimeout, isCompleted, isFailed, stopPolling]);

  return {
    cvData,
    isLoading,
    isPolling,
    isCompleted,
    isReady,
    isFailed,
    isTimeout,
    error,
    elapsedSeconds,
    refetch,
  };
}
