import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Mail, Phone, Globe, Lock, Eye, EyeOff, Home, ArrowLeft } from 'lucide-react';
import { validatePhone, validatePassword } from '@/lib/validation';

const UserSettings = () => {
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [emailChanged, setEmailChanged] = useState(false);
  const [errors, setErrors] = useState({ phone: '', newPassword: '' });

  const validateFormField = (field: string, value: string) => {
    if (field === 'phone') {
      const result = validatePhone(value);
      setErrors(prev => ({ ...prev, phone: result.isValid ? '' : result.message || '' }));
    } else if (field === 'newPassword') {
      const result = validatePassword(value);
      setErrors(prev => ({ ...prev, newPassword: result.isValid ? '' : result.message || '' }));
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field === 'phone') setPhone(value);
    else if (field === 'newPassword') setNewPassword(value);
    else if (field === 'confirmPassword') setConfirmPassword(value);
    else if (field === 'currentPassword') setCurrentPassword(value);

    if (field === 'phone' || field === 'newPassword') {
      validateFormField(field, value);
    }
  };

  // Initialize form fields from profile data
  useEffect(() => {
    if (profile && user) {
      setFullName(profile.full_name || '');
      setEmail(profile.email || user.email || '');
      setPhone(profile.phone || '');
      setCountry(profile.country || '');
    }
  }, [profile, user]);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validation
      if (!fullName.trim()) {
        toast.error('Full name is required');
        setSaving(false);
        return;
      }

      // Validate phone
      const phoneValidation = validatePhone(phone);
      if (!phoneValidation.isValid) {
        setErrors(prev => ({ ...prev, phone: phoneValidation.message || '' }));
        setSaving(false);
        return;
      }

      // Update profile data
      const { error: profileError } = await updateProfile({
        full_name: fullName,
        phone,
        country,
        email,
      });

      if (profileError) {
        toast.error('Failed to update profile: ' + profileError.message);
        setSaving(false);
        return;
      }

      // Update email in auth if changed
      if (emailChanged && email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) {
          toast.error('Failed to update email: ' + emailError.message);
          setSaving(false);
          return;
        }
        setEmailChanged(false);
        toast.info('A confirmation email has been sent to verify your new email address.');
      }

      // Update password if provided
      if (newPassword.trim()) {
        // Validate password
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.isValid) {
          setErrors(prev => ({ ...prev, newPassword: passwordValidation.message || '' }));
          setSaving(false);
          return;
        }

        if (newPassword !== confirmPassword) {
          toast.error('Passwords do not match');
          setSaving(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) {
          toast.error('Failed to update password: ' + passwordError.message);
          setSaving(false);
          return;
        }

        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
        toast.success('Password updated successfully!');
      }

      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Settings save error:', error);
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="pt-20 min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-navy py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-2">
            <Link to="/" className="flex items-center gap-2 text-primary-foreground hover:text-primary-foreground/80 transition-colors">
              <Home className="w-4 h-4" />
              Home
            </Link>
          </div>
          <h1 className="text-3xl font-display font-bold text-primary-foreground">Settings</h1>
          <p className="text-primary-foreground/80 mt-1">Manage your account and preferences</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          {user && (
            <form onSubmit={handleSaveChanges} className="space-y-8">
              {/* Profile Information Section */}
              <div className="bg-card rounded-xl border border-border p-8 shadow-luxury">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-foreground">Profile Information</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">Full Name *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Your full name"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Email Address *</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailChanged(true);
                        }}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="your@email.com"
                      />
                    </div>
                    {emailChanged && <p className="text-xs text-amber-600 mt-1">A verification email will be sent to confirm this change</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Phone Number</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-border'} bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring`}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Country</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Country"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-card rounded-xl border border-border p-8 shadow-luxury">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-foreground">Security</h2>
                </div>

                <div className="space-y-4 bg-muted/30 rounded-lg p-4 mb-6 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-4">
                    <strong>Last login:</strong> {user.user_metadata?.last_sign_in_at ? new Date(user.user_metadata.last_sign_in_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Optional: Only required if changing password</p>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      New Password <span className="text-muted-foreground font-normal">(leave blank to keep current)</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 rounded-lg border ${errors.newPassword ? 'border-red-500' : 'border-border'} bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring`}
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword}</p>}
                  </div>

                  {/* Confirm Password */}
                  {newPassword && (
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Confirm New Password *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {confirmPassword && (
                        <p className={`text-xs mt-1 ${newPassword === confirmPassword ? 'text-green-600' : 'text-red-600'}`}>
                          {newPassword === confirmPassword ? '✓ Passwords match' : '❌ Passwords do not match'}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <Link
                  to="/"
                  className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-gold rounded-lg font-semibold text-white hover:opacity-90 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default UserSettings;
