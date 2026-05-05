import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'dyd-session-id';

export class SessionManager {
  private static instance: SessionManager;
  private sessionId: string;

  private constructor() {
    this.sessionId = this.initializeSession();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private initializeSession(): string {
    try {
      const existing = localStorage.getItem(SESSION_KEY);
      if (existing) {
        return existing;
      }

      const newSession = uuidv4();
      localStorage.setItem(SESSION_KEY, newSession);
      return newSession;
    } catch (error) {
      console.warn('localStorage not available, using in-memory session');
      return uuidv4();
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }

  clearSession(): void {
    try {
      localStorage.removeItem(SESSION_KEY);
      this.sessionId = uuidv4();
      localStorage.setItem(SESSION_KEY, this.sessionId);
    } catch (error) {
      console.warn('Could not clear session from localStorage');
      this.sessionId = uuidv4();
    }
  }

  regenerateSession(): string {
    this.clearSession();
    return this.sessionId;
  }
}

export const sessionManager = SessionManager.getInstance();
