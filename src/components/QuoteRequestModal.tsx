import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { X, Send, Building2, Mail, Phone, Globe, Package, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId?: string;
  productName?: string;
}

export const QuoteRequestModal: React.FC<QuoteRequestModalProps> = ({
  isOpen,
  onClose,
  productId = '',
  productName = '',
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    country: '',
    product: productName,
    quantity: 1,
    message: '',
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'quantity' ? Math.max(1, parseInt(value) || 1) : value,
    }));
  };

  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !formData.name ||
      !formData.company ||
      !formData.email ||
      !formData.phone ||
      !formData.country ||
      !formData.product ||
      formData.quantity < 1
    ) {
      toast.error(t('quote.validationError'));
      return;
    }

    // Email validation
    if (!isValidEmail(formData.email)) {
      toast.error(t('quote.emailValidationError'));
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from('quote_requests').insert({
        name: formData.name,
        company: formData.company,
        email: formData.email,
        phone: formData.phone,
        country: formData.country,
        product_id: productId || null,
        product_name: formData.product,
        quantity: formData.quantity,
        message: formData.message,
        status: 'Pending',
      });

      if (error) {
        toast.error(error.message || t('quote.submissionError'));
        return;
      }

      toast.success(t('quote.successMessage'));
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        country: '',
        product: productName,
        quantity: 1,
        message: '',
      });
      onClose();
    } catch (err) {
      toast.error(t('quote.generalError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-card rounded-2xl border border-border shadow-luxury w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary/10 to-primary/5 border-b border-border px-6 py-4 flex items-center justify-between">
              <div className={isRTL ? 'text-right' : ''}>
                <h2 className="text-xl font-display font-bold text-foreground">
                  {t('quote.title')}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('quote.subtitle')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                aria-label={t('quote.close')}
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className={`block text-sm font-medium text-foreground mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('quote.fullName')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder={t('quote.fullNamePlaceholder')}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className={`w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${isRTL ? 'text-right' : ''}`}
                    disabled={loading}
                  />
                </div>

                {/* Company */}
                <div>
                  <label className={`block text-sm font-medium text-foreground mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <Building2 className="w-4 h-4 flex-shrink-0" />
                    {t('quote.company')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder={t('quote.companyPlaceholder')}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className={`w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${isRTL ? 'text-right' : ''}`}
                    disabled={loading}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className={`block text-sm font-medium text-foreground mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    {t('quote.email')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={t('quote.emailPlaceholder')}
                    dir="ltr"
                    className={`w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors`}
                    disabled={loading}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className={`block text-sm font-medium text-foreground mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    {t('quote.phone')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder={t('quote.phonePlaceholder')}
                    dir="ltr"
                    className={`w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors`}
                    disabled={loading}
                  />
                </div>

                {/* Country */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className={`block text-sm font-medium text-foreground mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <Globe className="w-4 h-4 flex-shrink-0" />
                    {t('quote.country')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder={t('quote.countryPlaceholder')}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className={`w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${isRTL ? 'text-right' : ''}`}
                    disabled={loading}
                  />
                </div>

                {/* Product */}
                <div className="md:col-span-2 lg:col-span-1">
                  <label className={`block text-sm font-medium text-foreground mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                    <Package className="w-4 h-4 flex-shrink-0" />
                    {t('quote.product')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="product"
                    value={formData.product}
                    onChange={handleChange}
                    placeholder={t('quote.productPlaceholder')}
                    dir={isRTL ? 'rtl' : 'ltr'}
                    className={`w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors ${isRTL ? 'text-right' : ''}`}
                    disabled={loading}
                  />
                </div>

                {/* Quantity */}
                <div>
                  <label className={`block text-sm font-medium text-foreground mb-2 ${isRTL ? 'text-right' : ''}`}>
                    {t('quote.quantity')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={formData.quantity}
                    onChange={handleChange}
                    min="1"
                    dir="ltr"
                    className={`w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors`}
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label className={`block text-sm font-medium text-foreground mb-2 flex items-center gap-2 ${isRTL ? 'flex-row-reverse justify-end' : ''}`}>
                  <MessageSquare className="w-4 h-4 flex-shrink-0" />
                  {t('quote.message')}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder={t('quote.messagePlaceholder')}
                  rows={4}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className={`w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors resize-none ${isRTL ? 'text-right' : ''}`}
                  disabled={loading}
                />
              </div>

              {/* Buttons */}
              <div className={`flex gap-3 pt-4 border-t border-border ${isRTL ? 'flex-row-reverse' : ''}`}>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
                  disabled={loading}
                >
                  {t('quote.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-6 py-3 bg-gradient-gold text-white rounded-lg font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  <Send className="w-4 h-4 flex-shrink-0" />
                  {loading ? t('quote.sending') : t('quote.submit')}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default QuoteRequestModal;
