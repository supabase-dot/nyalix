import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Phone, Globe, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validatePhone, validatePassword } from '@/lib/validation';

const Auth = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { signIn, signUp, user, userRole, loading: authLoading } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', fullName: '', phone: '', country: '' });
  const [errors, setErrors] = useState({ phone: '', password: '' });

  // Clear errors when mode changes
  useEffect(() => {
    setErrors({ phone: '', password: '' });
  }, [mode]);

  const validateFormField = (field: string, value: string) => {
    if (field === 'phone') {
      const result = validatePhone(value);
      setErrors(prev => ({ ...prev, phone: result.isValid ? '' : result.message || '' }));
    } else if (field === 'password' && mode === 'signup') {
      const result = validatePassword(value);
      setErrors(prev => ({ ...prev, password: result.isValid ? '' : result.message || '' }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (field === 'phone' || (field === 'password' && mode === 'signup')) {
      validateFormField(field, value);
    }
  };

  // Redirect based on role after authentication
  useEffect(() => {
    if (!authLoading && user) {
      if (userRole === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, userRole, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(form.email, {
        redirectTo: `${window.location.origin}/reset-password`
      });
      setLoading(false);
      if (error) {toast.error(error.message);return;}
      toast.success('Password reset link sent to your email');
      setMode('login');
      return;
    }

    if (mode === 'signup') {
      // Validate before submitting
      const phoneValidation = validatePhone(form.phone);
      const passwordValidation = validatePassword(form.password);

      if (!phoneValidation.isValid || !passwordValidation.isValid) {
        setErrors({
          phone: phoneValidation.isValid ? '' : phoneValidation.message || '',
          password: passwordValidation.isValid ? '' : passwordValidation.message || ''
        });
        setLoading(false);
        return;
      }

      const { error } = await signUp(form.email, form.password, form.fullName, form.phone, form.country);
      setLoading(false);
      if (error) {toast.error(error.message);return;}
      toast.success('Account created! Please check your email to verify your account.');
      setMode('login');
      return;
    }

    const { error } = await signIn(form.email, form.password);
    setLoading(false);
    if (error) {toast.error(error.message);return;}
    toast.success('Welcome back!');
    // Redirect will be handled by the useEffect above
  };

  const inputClass = (field?: string) => `w-full pl-10 pr-4 py-3 rounded-lg border transition-all duration-200 ${field && errors[field as keyof typeof errors] ? 'border-red-500 focus:border-red-500' : 'border-border hover:border-ring focus:border-ring'} bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring/20 placeholder:text-muted-foreground`;

  return (
    <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-4">
        
        <div className="bg-card rounded-xl border border-border p-8 shadow-luxury backdrop-blur-sm">
          <div className="text-center mb-8">
            <motion.div
              className="w-14 h-14 rounded-lg bg-gradient-gold flex items-center justify-center mx-auto mb-4 shadow-gold"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <span className="font-display font-bold text-primary-foreground text-xl">N</span>
            </motion.div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {mode === 'login' ? t('nav.login') : mode === 'signup' ? t('nav.signup') : 'Reset Password'}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === 'signup' &&
            <>
                <div className="space-y-1">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" required placeholder="Full Name" value={form.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} className={inputClass()} />
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="tel" required placeholder="Phone Number" value={form.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className={inputClass('phone')} />
                  </div>
                  {errors.phone && <p className="text-red-500 text-sm mt-1 ml-1">{errors.phone}</p>}
                </div>
                <div className="space-y-1">
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input type="text" required placeholder="Country" value={form.country} onChange={(e) => handleInputChange('country', e.target.value)} className={inputClass()} />
                  </div>
                </div>
              </>
            }

            <div className="space-y-1">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input type="email" required placeholder="Email" value={form.email} onChange={(e) => handleInputChange('email', e.target.value)} className={inputClass()} />
              </div>
            </div>

            {mode !== 'forgot' &&
            <div className="space-y-1">
              <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Password"
                  value={form.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={`${inputClass('password')} pr-10`} />
                
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {mode === 'signup' && errors.password && <p className="text-red-500 text-sm mt-1 ml-1">{errors.password}</p>}
              </div>
            }

            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3.5 bg-gradient-gold rounded-lg font-semibold text-primary-foreground hover:opacity-90 focus:opacity-90 transition-all duration-200 shadow-gold disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]">
              
              {loading ? '...' : mode === 'login' ? t('nav.login') : mode === 'signup' ? t('nav.signup') : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm space-y-2">
            {mode === 'login' &&
            <>
                <button onClick={() => setMode('forgot')} className="text-muted-foreground hover:text-foreground transition-colors">
                  Forgot password?
                </button>
                <p className="text-muted-foreground">
                  Don't have an account?{' '}
                  <button onClick={() => setMode('signup')} className="text-accent font-medium hover:underline">{t('nav.signup')}</button>
                </p>
              </>
            }
            {mode === 'signup' &&
            <p className="text-muted-foreground">
                Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-accent font-medium hover:underline">{t('nav.login')}</button>
              </p>
            }
            {mode === 'forgot' &&
            <button onClick={() => setMode('login')} className="text-accent font-medium hover:underline">Back to login</button>
            }
          </div>
        </div>
      </motion.div>
    </div>);

};

export default Auth;