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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          await loadProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
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
        console.error('Error loading profile:', error);
        return;
      }

      setProfile(data);
    } catch (error: any) {
      // Silently ignore AbortErrors (component unmounting during profile load)
      if (error?.name !== 'AbortError') {
        console.error('Error loading profile:', error);
      }
    }
  };

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadProfile(session.user.id);
      }
    } catch (error: any) {
      // Silently ignore AbortErrors (component unmounting during auth check)
      if (error?.name !== 'AbortError') {
        console.error('Error checking user:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data.user);
      if (data.user) {
        await loadProfile(data.user.id);
        const tempId = getTempId();
        await dataMigrationService.migrateToUser(data.user.id, tempId);
        if (tempId) clearTempId();
      }
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      setUser(data.user);
      if (data.user) {
        await loadProfile(data.user.id);
        const tempId = getTempId();
        await dataMigrationService.migrateToUser(data.user.id, tempId);
        if (tempId) clearTempId();
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
      // Silently ignore AbortErrors (component unmounting during logout)
      if (error?.name !== 'AbortError') {
        console.error('Error logging out:', error);
      }
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
        message: 'Wir haben dir eine E-Mail mit einem Link zum Zurücksetzen deines Passworts gesendet.'
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
    <AuthContext.Provider value={{ user, profile, loading, login, signup, logout, resetPassword, changePassword, deleteAccount }}>
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
