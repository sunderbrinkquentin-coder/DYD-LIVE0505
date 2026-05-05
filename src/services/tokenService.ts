import { supabase } from '../lib/supabase';

export interface UserTokens {
  id: string;
  user_id: string;
  credits: number;
  created_at: string;
  updated_at: string;
}

export const tokenService = {
  /**
   * Get user's current token balance
   */
  async getUserTokens(userId: string): Promise<UserTokens | null> {
    const { data, error } = await supabase
      .from('user_tokens')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user tokens:', error);
      throw error;
    }

    // If no tokens record exists, create one
    if (!data) {
      const { data: newTokens, error: createError } = await supabase
        .from('user_tokens')
        .insert({ user_id: userId, credits: 0 })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user tokens:', createError);
        throw createError;
      }

      return newTokens;
    }

    return data;
  },

  /**
   * Consume one token (deduct 1 credit)
   * Atomic operation: only updates if credits > 0
   */
  async consumeToken(userId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('consume_token', { p_user_id: userId, p_amount: 1 });

    if (error) {
      console.error('Error consuming token:', error);
      throw error;
    }

    if (data === false) {
      console.warn('[TokenService] No tokens available for user:', userId);
    }

    return data === true;
  },

  /**
   * Add tokens to user's balance (after purchase)
   */
  async addTokens(userId: string, amount: number): Promise<UserTokens> {
    const tokens = await this.getUserTokens(userId);
    if (!tokens) {
      throw new Error('User tokens not found');
    }

    const newBalance = tokens.credits + amount;

    const { data, error } = await supabase
      .from('user_tokens')
      .update({ credits: newBalance })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error adding tokens:', error);
      throw error;
    }

    return data;
  },

  /**
   * Check if user has sufficient tokens
   */
  async hasTokens(userId: string): Promise<boolean> {
    const tokens = await this.getUserTokens(userId);
    return tokens !== null && tokens.credits > 0;
  },
};
