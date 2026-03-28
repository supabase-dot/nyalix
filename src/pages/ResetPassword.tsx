import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Lock } from 'lucide-react';
import { toast } from 'sonner';
import { validatePassword } from '@/lib/validation';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const result = validatePassword(value);
    setError(result.isValid ? '' : result.message || '');
  };

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setReady(true);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message || '');
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    toast.success('Password updated successfully!');
    navigate('/');
  };

  if (!ready) {
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Invalid or expired reset link.</p>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md mx-4 bg-card rounded-xl border border-border p-8 shadow-luxury">
        <h1 className="text-2xl font-display font-bold text-foreground mb-6 text-center">Set New Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="password"
              required
              placeholder="New Password"
              value={password}
              onChange={e => handlePasswordChange(e.target.value)}
              className={`w-full pl-10 pr-4 py-3 rounded-lg border ${error ? 'border-red-500' : 'border-border'} bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring`}
            />
            {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
          </div>
          <button type="submit" disabled={loading} className="w-full px-6 py-3.5 bg-gradient-gold rounded-lg font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-gold disabled:opacity-50">
            {loading ? '...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
