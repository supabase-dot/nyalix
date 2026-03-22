import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Menu, X, Globe, ChevronDown, LogIn, LogOut, Shield, UserCircle, Search } from 'lucide-react';
import LiveSearch from './LiveSearch';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import nyalixLogo from '@/assets/nyalix-logo.png';
import ProductsDropdown from './ProductsDropdown';
import { useCategories } from '@/hooks/useCategories';
import TopBar from './TopBar';

const Navbar = () => {
  const { t } = useTranslation();
  const { totalItems } = useCart();
  const { language, setLanguage, isRTL } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const location = useLocation();
  const { data: categories = [] } = useCategories();

  const navLinks = [
    { path: '/', label: t('nav.home') },
    { path: '/about', label: t('nav.about') },
    { path: '/exhibitions', label: t('nav.exhibitions') },
    { path: '/certifications', label: t('nav.certifications') },
    { path: '/warranty', label: t('footer.warranty') },
    { path: '/quality', label: t('footer.quality') },
    { path: '/contact', label: t('nav.contact') },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith('/products/category/');

  return (
    <>
      <TopBar />
      <nav className="fixed top-8 left-0 right-0 z-50 bg-white shadow-sm border-b border-border">
      {/* Top bar */}
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={nyalixLogo} alt="NyaliX Medical" className="w-10 h-10 rounded-full object-cover" />
            <div className="hidden sm:block">
              <span className="font-display font-bold text-foreground text-lg leading-none">NyaliX</span>
              <span className="text-[10px] text-muted-foreground block mt-0.5">Medical PVT LTD</span>
            </div>
          </Link>

          {/* Search bar — centered, IndoSurgicals style */}
          <div className="flex-1 max-w-xl hidden md:flex items-center">
            <LiveSearch />
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Language */}
            <div className="relative">
              <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1 px-2 py-2 rounded text-sm text-foreground/70 hover:bg-muted transition-colors">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">{language === 'en' ? 'EN' : 'AR'}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                    className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-1 bg-card rounded shadow-luxury border border-border overflow-hidden min-w-[110px] z-50`}>
                    <button onClick={() => { setLanguage('en'); setLangOpen(false); }} className="w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors">🇬🇧 English</button>
                    <button onClick={() => { setLanguage('ar'); setLangOpen(false); }} className="w-full px-4 py-2 text-sm text-left hover:bg-muted transition-colors">🇸🇦 العربية</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Link to="/cart" className="relative p-2 rounded text-foreground/70 hover:bg-muted transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold">{totalItems}</span>
              )}
            </Link>

            {isAdmin && (
              <Link to="/admin/dashboard" className="p-2 rounded text-foreground/70 hover:bg-muted transition-colors" title="Admin">
                <Shield className="w-5 h-5" />
              </Link>
            )}

            {user ? (
              <>
                {!isAdmin && (
                  <Link to="/profile" className="p-2 rounded text-foreground/70 hover:bg-muted transition-colors" title="My Account">
                    <UserCircle className="w-5 h-5" />
                  </Link>
                )}
                <button onClick={() => signOut()} className="hidden sm:flex items-center gap-1 px-3 py-2 rounded text-sm text-foreground/70 hover:bg-muted transition-colors">
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link to="/auth" className="flex items-center gap-1 px-3 py-2 rounded text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/85 transition-colors">
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline">{t('nav.login')}</span>
              </Link>
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 rounded text-foreground/70 hover:bg-muted">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Navigation bar — dark teal like IndoSurgicals */}
      <div className="hidden lg:block bg-[hsl(200,25%,28%)]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center">
            {navLinks.slice(0, 2).map(link => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-5 py-3 text-sm font-semibold transition-colors border-r border-white/10 ${
                  isActive(link.path)
                    ? 'bg-primary text-white'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {/* Products Dropdown */}
            <ProductsDropdown isActive={isActive('/products')} />
            
            {navLinks.slice(2).map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-5 py-3 text-sm font-semibold transition-colors border-r border-white/10 last:border-r-0 ${
                  isActive(link.path)
                    ? 'bg-primary text-white'
                    : 'text-white/85 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            className="lg:hidden border-t border-border overflow-hidden bg-card">
            <div className="container mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.slice(0, 2).map(link => (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 rounded text-sm font-medium transition-all ${
                    isActive(link.path) ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted'
                  }`}>{link.label}</Link>
              ))}
              
              {/* Mobile Products with Categories */}
              <div>
                <button
                  onClick={() => setMobileProductsOpen(!mobileProductsOpen)}
                  className={`w-full px-4 py-2.5 rounded text-sm font-medium transition-all flex items-center justify-between ${
                    isActive('/products') ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted'
                  }`}
                >
                  <span>{t('nav.products')}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-300 ${
                      mobileProductsOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {mobileProductsOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      {categories.map((category) => {
                        const displayName = language === 'ar' ? category.ar : category.en;
                        return (
                          <button
                            key={category.en}
                            onClick={() => {
                              window.location.href = `/products/category/${encodeURIComponent(category.en)}`;
                              setMobileOpen(false);
                              setMobileProductsOpen(false);
                            }}
                            className="w-full px-6 py-2 text-sm text-foreground/70 hover:bg-muted hover:text-foreground transition-colors text-left"
                          >
                            {displayName}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {navLinks.slice(2).map(link => (
                <Link key={link.path} to={link.path} onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 rounded text-sm font-medium transition-all ${
                    isActive(link.path) ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted'
                  }`}>{link.label}</Link>
              ))}
              {user && !isAdmin && (
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 rounded text-sm font-medium text-foreground/70 hover:bg-muted">My Account</Link>
              )}
              {isAdmin && (
                <Link to="/admin/dashboard" onClick={() => setMobileOpen(false)} className="px-4 py-2.5 rounded text-sm font-medium text-foreground/70 hover:bg-muted">Admin Dashboard</Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
    </>
  );
};

export default Navbar;
