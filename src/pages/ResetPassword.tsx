import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { validatePassword } from '@/lib/validation';

type VerificationState = 'loading' | 'verified' | 'invalid' | 'expired' | 'error';

const ResetPassword = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [verificationState, setVerificationState] = useState<VerificationState>('loading');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [resetType, setResetType] = useState<string | null>(null);

  // Extract and verify reset token on mount
  useEffect(() => {
    const verifyResetToken = async () => {
      try {
        // Extract from hash fragment (#access_token=...&type=recovery)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hash = hashParams.get('access_token');
        const type = hashParams.get('type');

        // Fallback to query parameters (?token_hash=...&type=...)
        const queryParams = new URLSearchParams(location.search);
        const tokenHashParam = queryParams.get('token_hash') || hash;
        const typeParam = queryParams.get('type') || type;

        // Validate parameters exist
        if (!tokenHashParam || !typeParam) {
          setVerificationState('invalid');
          return;
        }

        // Store for later use
        setTokenHash(tokenHashParam);
        setResetType(typeParam);

        // Verify the token by attempting to get the current session
        // Supabase automatically handles OTP verification through the URL
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          // Try to exchange the token for a session
          const { error: exchangeError } = await supabase.auth.verifyOtp({
            token_hash: tokenHashParam,
            type: typeParam as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change' | 'phone_change'
          });

          if (exchangeError) {
            console.error('Token verification error:', exchangeError);
            setVerificationState('invalid');
            return;
          }
        }

        // Token verified successfully
        setVerificationState('verified');
      } catch (error) {
        console.error('Error during token verification:', error);
        setVerificationState('error');
      }
    };

    verifyResetToken();
  }, [location.search]);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value) {
      const result = validatePassword(value);
      setPasswordError(result.isValid ? '' : result.message || '');
    } else {
      setPasswordError('');
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    if (value && password && value !== password) {
      setConfirmError('Passwords do not match');
    } else if (value && password && value === password) {
      setConfirmError('');
    }
  };

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.message || '');
      isValid = false;
    } else {
      setPasswordError('');
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmError('Please confirm your password');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmError('');
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Update password using the authenticated session
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        console.error('Password update error:', error);
        toast.error(error.message || 'Failed to update password');
        setIsSubmitting(false);
        return;
      }

      // Show success state
      setShowSuccess(true);
      toast.success('Password updated successfully!');

      // Redirect to login after showing success for a moment
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  // Success state
  if (showSuccess) {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-16 h-16 text-green-500 animate-pulse" />
          </div>
          <h1 className="text-3xl font-display font-bold text-foreground mb-3">Success!</h1>
          <p className="text-muted-foreground mb-8">
            Your password has been updated successfully. You'll be redirected to the login page shortly.
          </p>
          <button
            onClick={() => navigate('/auth', { replace: true })}
            className="px-6 py-3 bg-gradient-gold rounded-lg font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-gold"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (verificationState === 'loading') {
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block">
            <div className="w-12 h-12 border-4 border-border border-t-gold rounded-full animate-spin" />
          </div>
          <p className="mt-4 text-muted-foreground">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  // Invalid/Expired state
  if (verificationState === 'invalid' || verificationState === 'expired' || verificationState === 'error') {
    const isExpired = verificationState === 'expired';
    return (
      <div className="pt-20 min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl border border-border p-8 shadow-luxury text-center">
            <div className="flex justify-center mb-6">
              <AlertCircle className="w-16 h-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground mb-4">
              {isExpired ? 'Link Expired' : 'Invalid Reset Link'}
            </h1>
            <p className="text-muted-foreground mb-8">
              {isExpired
                ? 'Your password reset link has expired. Please request a new one.'
                : 'The password reset link is invalid or has expired. Please request a new reset link to proceed.'}
            </p>
            <button
              onClick={() => navigate('/auth', { replace: true })}
              className="w-full px-6 py-3 bg-gradient-gold rounded-lg font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-gold"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Verified state - Show reset form
  return (
    <div className="pt-20 min-h-screen bg-gradient-to-b from-background to-background/80 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8 shadow-luxury">
          <h1 className="text-2xl font-display font-bold text-foreground mb-2 text-center">Set New Password</h1>
          <p className="text-center text-muted-foreground text-sm mb-8">
            Enter a new password for your account. Make sure it meets the security requirements.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Input */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your new password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-10 py-3 rounded-lg border transition-all duration-200 ${
                    passwordError ? 'border-red-500 focus:border-red-500' : 'border-border hover:border-ring focus:border-ring'
                  } bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {passwordError && <p className="text-red-500 text-xs mt-2">{passwordError}</p>}
            </div>

            {/* Confirm Password Input */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  disabled={isSubmitting}
                  className={`w-full pl-10 pr-10 py-3 rounded-lg border transition-all duration-200 ${
                    confirmError ? 'border-red-500 focus:border-red-500' : 'border-border hover:border-ring focus:border-ring'
                  } bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-muted-foreground`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  aria-label="Toggle password visibility"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmError && <p className="text-red-500 text-xs mt-2">{confirmError}</p>}
            </div>

            {/* Password Requirements Info */}
            <div className="bg-muted/50 rounded-lg p-4 border border-border">
              <p className="text-xs font-medium text-foreground mb-2">Password Requirements:</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>✓ Between 8-15 characters</li>
                <li>✓ At least one uppercase letter (A-Z)</li>
                <li>✓ At least one lowercase letter (a-z)</li>
                <li>✓ At least one number (0-9)</li>
                <li>✓ At least one special character (!@#$%^&*)</li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword || !!passwordError || !!confirmError}
              className="w-full px-6 py-3.5 bg-gradient-gold rounded-lg font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Updating Password...
                </span>
              ) : (
                'Update Password'
              )}
            </button>

            {/* Back to Login Link */}
            <button
              type="button"
              onClick={() => navigate('/auth', { replace: true })}
              disabled={isSubmitting}
              className="w-full px-6 py-2.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium disabled:opacity-50"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
