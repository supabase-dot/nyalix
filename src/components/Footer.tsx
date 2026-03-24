import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import nyalixLogo from '@/assets/nyalix-logo.png';

/* ── Inline SVG social icons ─────────────────────────────────────── */
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047v-2.66c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.932-1.956 1.887v2.264h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/>
  </svg>
);

const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TiktokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.32 6.32 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.74a4.84 4.84 0 0 1-1.01-.05z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const Footer = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error('Please enter a valid email address');
      return;
    }
    setSubscribing(true);
    const { error } = await supabase.from('newsletter_subscribers').insert({ email: trimmed });
    setSubscribing(false);
    if (error) {
      if (error.code === '23505') {
        toast.info('You are already subscribed!');
      } else {
        toast.error(error.message);
      }
      return;
    }
    toast.success('Subscribed successfully! 🎉');
    setEmail('');
  };

  return (
    <footer className="bg-gradient-navy text-primary-foreground">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <img src={nyalixLogo} alt="NyaliX Medical" className="w-10 h-10 rounded-full object-cover" />
              <span className="font-display font-bold text-xl">NyaliX Medical</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed mb-5">{t('footer.description')}</p>

            {/* Social Media */}
            <div>
              <p className="text-sm font-semibold text-primary-foreground/80 mb-3">{t('contact.followUs')}</p>
              <div className="flex items-center gap-3">
                <a
                  href="https://www.facebook.com/share/1AX9YpPXPe/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 hover:scale-110 transition-all duration-200"
                >
                  <FacebookIcon />
                </a>
                <a
                  href="https://www.youtube.com/@nyalixmedical"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 hover:scale-110 transition-all duration-200"
                >
                  <YoutubeIcon />
                </a>
                <a
                  href="https://www.tiktok.com/@nyalixmed?_r=1&_t=ZG-94xg86PEtWb"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="TikTok"
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 hover:scale-110 transition-all duration-200"
                >
                  <TiktokIcon />
                </a>
                <a
                  href="https://www.instagram.com/nyalixmedical"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/25 hover:scale-110 transition-all duration-200"
                >
                  <InstagramIcon />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4 text-primary-foreground">{t('footer.quickLinks')}</h4>
            <div className="flex flex-col gap-2">
              {[
                { to: '/', label: t('nav.home') },
                { to: '/about', label: t('nav.about') },
                { to: '/products', label: t('nav.products') },
                { to: '/certifications', label: t('nav.certifications') },
                { to: '/contact', label: t('nav.contact') },
                { to: '/warranty', label: t('footer.warranty') },
                { to: '/quality', label: t('footer.quality') },
                { to: '/privacy-policy', label: t('footer.privacy') },
                { to: '/terms-of-use', label: t('footer.terms') },
              ].map((link) => (
                <Link key={link.to} to={link.to} className="text-sm transition-colors text-neutral-300 hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4 text-primary-foreground">{t('footer.contactInfo')}</h4>
            <div className="flex flex-col gap-3 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2">
                <Phone className="text-gold w-4 h-4 shrink-0" />
                <span>{t('footer.phone')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="text-gold w-4 h-4 shrink-0" />
                <span>{t('footer.emailAddr')}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="text-gold mt-0.5 w-4 h-4 shrink-0" />
                <span>{t('contact.addressText')}</span>
              </div>
            </div>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-4 text-primary-foreground">{t('footer.newsletter')}</h4>
            <p className="text-sm text-primary-foreground/70 mb-3">{t('footer.newsletterText')}</p>
            <form onSubmit={handleSubscribe} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('footer.emailPlaceholder')}
                className="flex-1 px-3 py-2 rounded-lg bg-primary-foreground/10 border border-primary-foreground/20 text-sm text-primary-foreground placeholder:text-primary-foreground/40 focus:outline-none focus:border-gold"
              />
              <button
                type="submit"
                disabled={subscribing}
                className="px-4 py-2 bg-gradient-gold rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 text-white"
              >
                {subscribing ? '...' : t('footer.subscribe')}
              </button>
            </form>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-6 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} NyaliX Medical PVT LTD. {t('footer.rights')}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
