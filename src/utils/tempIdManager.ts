/**
 * Temporary ID Manager for Anonymous Users
 * Manages temp_id for users who haven't logged in yet
 */

const TEMP_ID_KEY = 'dyd_temp_id';

/**
 * Gets existing temp_id or creates a new one
 * @returns temp_id string
 */
export function getOrCreateTempId(): string {
  if (typeof window === 'undefined') return '';

  const existing = window.localStorage.getItem(TEMP_ID_KEY);
  if (existing) {
    console.log('[tempIdManager] Using existing temp_id:', existing);
    return existing;
  }

  const newId = crypto.randomUUID();
  window.localStorage.setItem(TEMP_ID_KEY, newId);
  console.log('[tempIdManager] Created new temp_id:', newId);
  return newId;
}

/**
 * Gets existing temp_id without creating a new one
 * @returns temp_id string or null
 */
export function getTempId(): string | null {
  if (typeof window === 'undefined') return null;
  const tempId = window.localStorage.getItem(TEMP_ID_KEY);
  console.log('[tempIdManager] Get temp_id:', tempId || 'null');
  return tempId;
}

/**
 * Clears the temp_id (e.g., after user logs in)
 */
export function clearTempId(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(TEMP_ID_KEY);
  console.log('[tempIdManager] Cleared temp_id');
}

/**
 * Sets a specific temp_id (e.g., from URL parameter or server)
 * @param tempId - The temp_id to set
 */
export function setTempId(tempId: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(TEMP_ID_KEY, tempId);
  console.log('[tempIdManager] Set temp_id:', tempId);
}
