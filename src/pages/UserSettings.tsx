import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { User, Mail, Phone, Globe, Lock, Eye, EyeOff, Home, ArrowLeft, Languages } from 'lucide-react';
import { validatePhone, validatePassword } from '@/lib/validation';
import { useTranslation } from 'react-i18next';

const UserSettings = () => {
  const { user, profile, loading: authLoading, updateProfile } = useAuth();
  const { language, setLanguage, isRTL } = useLanguage();
  const { t } = useTranslation();
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
        toast.error(t('user.settings.fullNameRequired'));
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
        toast.error(t('user.settings.failedToUpdateProfile') + ': ' + profileError.message);
        setSaving(false);
        return;
      }

      // Update email in auth if changed
      if (emailChanged && email !== user?.email) {
        const { error: emailError } = await supabase.auth.updateUser({ email });
        if (emailError) {
          toast.error(t('user.settings.failedToUpdateEmail') + ': ' + emailError.message);
          setSaving(false);
          return;
        }
        setEmailChanged(false);
        toast.info(t('user.settings.emailConfirmationSent'));
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
          toast.error(t('user.settings.passwordsDoNotMatchError'));
          setSaving(false);
          return;
        }

        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
        if (passwordError) {
          toast.error(t('user.settings.failedToUpdatePassword') + ': ' + passwordError.message);
          setSaving(false);
          return;
        }

        setNewPassword('');
        setConfirmPassword('');
        setCurrentPassword('');
        toast.success(t('user.settings.passwordUpdated'));
      }

      toast.success(t('user.settings.settingsSaved'));
    } catch (error) {
      toast.error(t('user.settings.unexpectedError'));
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
          <p className="text-muted-foreground">{t('user.settings.loadingSettings')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen bg-background" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-gradient-navy py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4 mb-2">
            <Link to="/" className="flex items-center gap-2 text-primary-foreground hover:text-primary-foreground/80 transition-colors">
              <Home className="w-4 h-4" />
              {t('user.settings.home')}
            </Link>
          </div>
          <h1 className="text-3xl font-display font-bold text-primary-foreground">{t('user.settings.title')}</h1>
          <p className="text-primary-foreground/80 mt-1">{t('user.settings.subtitle')}</p>
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
                  <h2 className="text-xl font-display font-bold text-foreground">{t('user.settings.profileInformation')}</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-foreground mb-2">{t('user.settings.fullName')} *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={t('user.settings.fullNamePlaceholder')}
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('user.settings.emailAddress')} *</label>
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
                        placeholder={t('user.settings.emailPlaceholder')}
                      />
                    </div>
                    {emailChanged && <p className="text-xs text-amber-600 mt-1">{t('user.settings.emailVerificationNote')}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('user.settings.phoneNumber')}</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 rounded-lg border ${errors.phone ? 'border-red-500' : 'border-border'} bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring`}
                        placeholder={t('user.settings.phonePlaceholder')}
                      />
                    </div>
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('user.settings.country')}</label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={t('user.settings.countryPlaceholder')}
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
                  <h2 className="text-xl font-display font-bold text-foreground">{t('user.settings.security')}</h2>
                </div>

                <div className="space-y-4 bg-muted/30 rounded-lg p-4 mb-6 border border-border/50">
                  <p className="text-sm text-muted-foreground mb-4">
                    <strong>{t('user.settings.lastLogin')}:</strong> {user.user_metadata?.last_sign_in_at ? new Date(user.user_metadata.last_sign_in_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {/* Current Password */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">{t('user.settings.currentPassword')}</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder={t('user.settings.currentPasswordPlaceholder')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{t('user.settings.currentPasswordHint')}</p>
                  </div>

                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {t('user.settings.newPassword')} <span className="text-muted-foreground font-normal">{t('user.settings.newPasswordHint')}</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => handleInputChange('newPassword', e.target.value)}
                        className={`w-full pl-10 pr-10 py-3 rounded-lg border ${errors.newPassword ? 'border-red-500' : 'border-border'} bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring`}
                        placeholder={t('user.settings.newPasswordPlaceholder')}
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
                      <label className="block text-sm font-medium text-foreground mb-2">{t('user.settings.confirmPassword')} *</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder={t('user.settings.confirmPasswordPlaceholder')}
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
                          {newPassword === confirmPassword ? t('user.settings.passwordsMatch') : t('user.settings.passwordsDoNotMatch')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Language Preference Section */}
              <div className="bg-card rounded-xl border border-border p-8 shadow-luxury">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Languages className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-display font-bold text-foreground">{t('user.settings.languagePreference')}</h2>
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{t('user.settings.selectLanguage')}</p>
                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        setLanguage('en');
                        if (user) {
                          try {
                            await updateProfile({ language: 'en' });
                            toast.success(t('user.settings.languageUpdated'));
                          } catch (error) {
                            console.warn('Failed to save language to profile:', error);
                            toast.success(t('user.settings.languageUpdated'));
                          }
                        } else {
                          toast.success(t('user.settings.languageUpdated'));
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        language === 'en'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {t('user.settings.english')}
                    </button>
                    <button
                      onClick={async () => {
                        setLanguage('ar');
                        if (user) {
                          try {
                            await updateProfile({ language: 'ar' });
                            toast.success(t('user.settings.languageUpdated'));
                          } catch (error) {
                            console.warn('Failed to save language to profile:', error);
                            toast.success(t('user.settings.languageUpdated'));
                          }
                        } else {
                          toast.success(t('user.settings.languageUpdated'));
                        }
                      }}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                        language === 'ar'
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-foreground border-border hover:bg-muted'
                      }`}
                    >
                      {t('user.settings.arabic')}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 justify-end">
                <Link
                  to="/"
                  className="px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors"
                >
                  {t('user.settings.cancel')}
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-gradient-gold rounded-lg font-semibold text-white hover:opacity-90 transition-all shadow-gold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? t('user.settings.saving') : t('user.settings.saveChanges')}
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
