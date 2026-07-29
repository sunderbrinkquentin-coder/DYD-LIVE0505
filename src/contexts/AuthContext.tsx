import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { dataMigrationService } from '../services/dataMigrationService';
import { getTempId, clearTempId } from '../utils/tempIdManager';

interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Nach dieser Zeit wird der Loader in jedem Fall beendet — eine hängende
 *  Auth-Anfrage darf die gesamte App nicht blockieren. */
const AUTH_FAILSAFE_MS = 8_000;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Notbremse gegen den Endlos-Loader.
    const failsafe = setTimeout(() => {
      if (!cancelled) {
        console.warn('[Auth] Failsafe: kein Auth-Event innerhalb von 8s — Loader wird beendet.');
        setLoading(false);
      }
    }, AUTH_FAILSAFE_MS);

    // onAuthStateChange feuert beim Abonnieren sofort INITIAL_SESSION mit der
    // gespeicherten Session. Ein separater getSession()-Aufruf ist deshalb
    // überflüssig und würde nur ein zweites, paralleles loadProfile auslösen.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // Bewusst NICHT async und ohne await auf Supabase-Aufrufe:
        // der Callback läuft in einem internen Lock (navigator.locks).
        // Eine Query darin kann den Auth-Client blockieren — die App hängt
        // dann im Loader, bis der Tab hart neu geladen wird.
        if (cancelled) return;

        clearTimeout(failsafe);

        const nextUser = session?.user ?? null;
        setUser(nextUser);
        setLoading(false);

        if (!nextUser) {
          setProfile(null);
          return;
        }

        // Profil außerhalb des Locks nachladen.
        setTimeout(() => {
          if (!cancelled) loadProfile(nextUser.id);
        }, 0);
      }
    );

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      authListener?.subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, user_id, full_name, email')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('[Auth] Profil konnte nicht geladen werden:', error.message);
        return;
      }

      setProfile(data);
    } catch (error: any) {
      // AbortError entsteht beim Unmount während des Ladens — kein echter Fehler.
      if (error?.name !== 'AbortError') {
        console.error('[Auth] Profil konnte nicht geladen werden:', error);
      }
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data.user);

      if (data.user) {
        await loadProfile(data.user.id);

        // Migration darf den Login nicht scheitern lassen.
        try {
          const tempId = getTempId();
          await dataMigrationService.migrateToUser(data.user.id, tempId);
          if (tempId) clearTempId();
        } catch (migErr: any) {
          console.error('[Auth] Datenmigration fehlgeschlagen:', migErr?.message ?? migErr);
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data.user);

      if (data.user) {
        await loadProfile(data.user.id);

        try {
          const tempId = getTempId();
          await dataMigrationService.migrateToUser(data.user.id, tempId);
          if (tempId) clearTempId();
        } catch (migErr: any) {
          console.error('[Auth] Datenmigration fehlgeschlagen:', migErr?.message ?? migErr);
        }
      }

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        console.error('[Auth] Logout fehlgeschlagen:', error);
      }
      // Lokalen Zustand trotzdem leeren — sonst wirkt der Nutzer weiter eingeloggt.
      setUser(null);
      setProfile(null);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message:
          'Wir haben dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts gesendet.',
      };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const changePassword = async (newPassword: string) => {
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteAccount = async () => {
    try {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) return { success: false, error: 'Nicht eingeloggt' };

      const { error: fnError } = await supabase.functions.invoke('delete-account', {
        body: { user_id: currentUser.id },
      });
      if (fnError) return { success: false, error: fnError.message };

      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        signup,
        logout,
        resetPassword,
        changePassword,
        deleteAccount,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}