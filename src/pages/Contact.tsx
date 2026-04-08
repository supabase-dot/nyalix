import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Send, MapPin, MessageCircle, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const Contact = () => {
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    const { error } = await supabase.from('contact_messages').insert({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      message: formData.get('message') as string
    });

    setSending(false);
    if (error) { toast.error('Failed to send message'); return; }
    toast.success('Message sent successfully!');
    form.reset();
  };

  return (
    <div className="pt-20 min-h-screen bg-background">
      <div className="bg-gradient-navy py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-2">{t('contact.title')}</h1>
          <p className="text-primary-foreground/70">{t('contact.subtitle')}</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}>
            <form onSubmit={handleSubmit} className="bg-card rounded-xl border border-border p-8 shadow-luxury space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('contact.name')}</label>
                <input name="name" required type="text" maxLength={100} className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('contact.email')}</label>
                <input name="email" required type="email" maxLength={255} className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">{t('contact.message')}</label>
                <textarea name="message" required rows={5} maxLength={1000} className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-gold/50 resize-none" />
              </div>
              <button type="submit" disabled={sending} className="w-full inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-gold rounded-lg font-semibold transition-all shadow-gold text-gray-50 opacity-100">
                <Send className="w-4 h-4" />{t('contact.send')}
              </button>
            </form>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} className="space-y-6">
            {/* Address */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-luxury">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">{t('contact.address')}</h3>
                  <p className="text-sm text-muted-foreground">{t('contact.addressText')}</p>
                </div>
              </div>
            </div>

            {/* India Phone */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-luxury">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">India Phone</h3>
                  <p className="text-sm text-muted-foreground">+917339700569</p>
                </div>
              </div>
            </div>

            {/* Sudan Phone */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-luxury">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">Sudan Phone</h3>
                  <p className="text-sm text-muted-foreground">+249116648870</p>
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="bg-card rounded-xl border border-border p-6 shadow-luxury">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-foreground mb-1">Email</h3>
                  <p className="text-sm text-muted-foreground">info@nyalix.com</p>
                </div>
              </div>
            </div>

            <a
              href="https://wa.me/+917339700569"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-8 py-3.5 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />{t('contact.whatsapp')}
            </a>

            <div className="rounded-xl overflow-hidden border border-border shadow-luxury">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3499.3!2d77.2367!3d28.5672!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390ce1a3c0e4f745%3A0x2f5c1437e4e1c8b2!2sLajpat+Nagar%2C+New+Delhi%2C+Delhi!5e0!3m2!1sen!2sin!4v1700000000000"
                width="100%" height="250" style={{ border: 0 }} allowFullScreen loading="lazy"
                referrerPolicy="no-referrer-when-downgrade" title="NyaliX Medical Location"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
