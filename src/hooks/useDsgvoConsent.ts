import { useState, useCallback } from 'react';
import type { ConsentType } from '../components/DsgvoConsentDialog';

const STORAGE_KEY = 'dyd-dsgvo-consent';
const VALIDITY_HOURS = 24;

interface StoredConsent {
  [key: string]: string;
}

function getStoredConsents(): StoredConsent {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function isConsentValid(type: ConsentType): boolean {
  const consents = getStoredConsents();
  const timestamp = consents[type];
  if (!timestamp) return false;
  const age = Date.now() - new Date(timestamp).getTime();
  return age < VALIDITY_HOURS * 60 * 60 * 1000;
}

function saveConsent(type: ConsentType) {
  const consents = getStoredConsents();
  consents[type] = new Date().toISOString();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(consents));
  } catch {
    // localStorage might be unavailable (private mode) — consent is session-only
  }
}

export function useDsgvoConsent() {
  const [pendingType, setPendingType] = useState<ConsentType | null>(null);

  const requestConsent = useCallback((type: ConsentType): Promise<boolean> => {
    if (isConsentValid(type)) {
      return Promise.resolve(true);
    }
    return new Promise<boolean>((resolve) => {
      setPendingType(type);
      (window as any).__dsgvoConsentResolver = (accepted: boolean) => {
        setPendingType(null);
        if (accepted) saveConsent(type);
        resolve(accepted);
      };
    });
  }, []);

  const handleAccept = useCallback(() => {
    const resolver = (window as any).__dsgvoConsentResolver;
    if (resolver) {
      (window as any).__dsgvoConsentResolver = undefined;
      resolver(true);
    }
  }, []);

  const handleDecline = useCallback(() => {
    const resolver = (window as any).__dsgvoConsentResolver;
    if (resolver) {
      (window as any).__dsgvoConsentResolver = undefined;
      resolver(false);
    }
  }, []);

  return {
    pendingType,
    requestConsent,
    handleAccept,
    handleDecline,
  };
}
