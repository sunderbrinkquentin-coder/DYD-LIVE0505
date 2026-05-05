import { supabase } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

export interface AuthError {
  message: string;
  code?: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

class AuthService {
  async signUp({ email, password, fullName }: SignUpData): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || null,
          },
        },
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.code } };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return {
        user: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error occurred' }
      };
    }
  }

  async signIn({ email, password }: SignInData): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: { message: error.message, code: error.code } };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return {
        user: null,
        error: { message: error instanceof Error ? error.message : 'Unknown error occurred' }
      };
    }
  }

  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      return { error: null };
    } catch (error) {
      return {
        error: { message: error instanceof Error ? error.message : 'Unknown error occurred' }
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });

    return subscription;
  }

  async deleteAccount(): Promise<{ error: AuthError | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { error: { message: 'Not authenticated' } };
      }

      const { error } = await supabase.auth.admin.deleteUser(user.id);

      if (error) {
        return { error: { message: error.message, code: error.code } };
      }

      return { error: null };
    } catch (error) {
      return {
        error: { message: error instanceof Error ? error.message : 'Unknown error occurred' }
      };
    }
  }
}

export const authService = new AuthService();
