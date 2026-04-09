/**
 * Password Reset Helper Utilities
 * Provides utility functions for the password reset flow
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Log password reset events for audit trail
 */
export const logPasswordResetEvent = async (
  eventType: 'reset_requested' | 'token_verified' | 'reset_succeeded' | 'reset_failed',
  userId?: string,
  details?: Record<string, unknown>
) => {
  try {
    if (!userId) {
      const { data: session } = await supabase.auth.getSession();
      userId = session?.session?.user?.id;
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.log('[PasswordReset]', eventType, {
        userId,
        timestamp: new Date().toISOString(),
        ...details
      });
    }

    // Store in database if table exists
    if (userId) {
      await supabase.from('audit_logs').insert({
        event_type: eventType,
        user_id: userId,
        event_details: details || {},
        created_at: new Date().toISOString()
      }).eq('created_at', new Date().toISOString()).single();
    }
  } catch (error) {
    console.warn('Failed to log password reset event:', error);
  }
};

/**
 * Extract reset token from URL (supports both hash and query parameters)
 */
export const extractResetToken = () => {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const queryParams = new URLSearchParams(window.location.search);

  return {
    tokenHash: queryParams.get('token_hash') || hashParams.get('access_token'),
    type: queryParams.get('type') || hashParams.get('type'),
  };
};

/**
 * Verify reset token with Supabase
 */
export const verifyResetToken = async (
  tokenHash: string,
  type: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // First check if we have an active session
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      return { success: true };
    }

    // Verify the OTP token
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'phone_change'
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

/**
 * Update user password
 */
export const updateUserPassword = async (
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

/**
 * Send password reset email
 */
export const sendPasswordResetEmail = async (
  email: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
};

/**
 * Get session user (if authenticated)
 */
export const getSessionUser = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session?.user || null;
  } catch {
    return null;
  }
};

/**
 * Logout user (for security after reset in admin scenarios)
 */
export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Logout failed';
    return { success: false, error: errorMessage };
  }
};

/**
 * Auto-login after password reset (optional enhancement)
 * WARNING: Only use in specific trusted scenarios
 */
export const autoLoginAfterReset = async (
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Auto-login failed';
    return { success: false, error: errorMessage };
  }
};

/**
 * Check if reset token is likely expired
 * Tokens are typically valid for 1 hour
 */
export const isTokenLikelyExpired = (tokenAge: number): boolean => {
  // 55 minutes in milliseconds
  const TYPICAL_TOKEN_EXPIRY = 55 * 60 * 1000;
  return tokenAge > TYPICAL_TOKEN_EXPIRY;
};

/**
 * Generate password strength indicator
 */
export const getPasswordStrength = (password: string): {
  score: number;
  level: 'weak' | 'fair' | 'good' | 'strong';
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 15) score += 10;

  // Character variety
  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add lowercase letters');
  }

  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add uppercase letters');
  }

  if (/\d/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add numbers');
  }

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?/]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Add special characters');
  }

  // Determine level
  let level: 'weak' | 'fair' | 'good' | 'strong';
  if (score < 40) level = 'weak';
  else if (score < 60) level = 'fair';
  else if (score < 85) level = 'good';
  else level = 'strong';

  return { score: Math.min(score, 100), level, feedback };
};

/**
 * Session timeout warning (for long reset processes)
 */
export const startSessionTimeoutWarning = (
  warningTimeMs: number = 5 * 60 * 1000, // 5 minutes
  onWarning?: () => void
): (() => void) => {
  const timeout = setTimeout(() => {
    onWarning?.();
  }, warningTimeMs);

  // Return cleanup function
  return () => clearTimeout(timeout);
};

/**
 * Handle browser back button during reset
 */
export const handleBackButtonDuringReset = (
  onBack?: () => void
): (() => void) => {
  const handlePopState = () => {
    onBack?.();
  };

  window.addEventListener('popstate', handlePopState);

  // Return cleanup function
  return () => window.removeEventListener('popstate', handlePopState);
};

/**
 * Validate reset token parameters
 */
export const validateTokenParams = (
  tokenHash?: string | null,
  type?: string | null
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!tokenHash) {
    errors.push('Token is missing from URL');
  } else if (tokenHash.length < 10) {
    errors.push('Token appears to be malformed');
  }

  if (!type) {
    errors.push('Type parameter is missing from URL');
  } else if (type !== 'recovery') {
    errors.push(`Unexpected token type: ${type}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Get token age from localStorage marker
 * (must be set when token is acquired)
 */
export const getTokenAge = (): number => {
  const tokenTime = localStorage.getItem('reset_token_time');
  if (!tokenTime) return 0;

  try {
    const startTime = parseInt(tokenTime, 10);
    return Date.now() - startTime;
  } catch {
    return 0;
  }
};

/**
 * Mark token time (call when extracting token)
 */
export const markTokenTime = () => {
  localStorage.setItem('reset_token_time', Date.now().toString());
};

/**
 * Clear token time (call when done with reset)
 */
export const clearTokenTime = () => {
  localStorage.removeItem('reset_token_time');
};

/**
 * Analytics tracking for reset flow
 */
interface ResetAnalytics {
  event: string;
  category: string;
  label?: string;
  value?: number;
  properties?: Record<string, unknown>;
}

export const trackResetEvent = async (data: ResetAnalytics) => {
  try {
    // If using analytics service (e.g., Mixpanel, Segment)
    if (import.meta.env.DEV) {
      console.log('[Analytics]', data);
    }

    // Store in Supabase if analytics table exists
    if (import.meta.env.VITE_ENABLE_ANALYTICS === 'true') {
      await supabase.from('analytics_events').insert({
        event_type: data.event,
        event_category: data.category,
        event_label: data.label,
        event_value: data.value,
        event_properties: data.properties,
        created_at: new Date().toISOString()
      }).single();
    }
  } catch (error) {
    console.warn('Failed to track analytics event:', error);
  }
};

export default {
  logPasswordResetEvent,
  extractResetToken,
  verifyResetToken,
  updateUserPassword,
  sendPasswordResetEmail,
  getSessionUser,
  logoutUser,
  autoLoginAfterReset,
  isTokenLikelyExpired,
  getPasswordStrength,
  startSessionTimeoutWarning,
  handleBackButtonDuringReset,
  validateTokenParams,
  getTokenAge,
  markTokenTime,
  clearTokenTime,
  trackResetEvent
};
