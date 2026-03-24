import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCategoriesRealtime } from '@/hooks/useCategories';

interface ProductsDropdownProps {
  isActive?: boolean;
}

const ProductsDropdown = ({ isActive }: ProductsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const containerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { t } = useTranslation();
  const { language, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { categories = [], isLoading } = useCategoriesRealtime();

  // Handle responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle mouse enter for desktop
  const handleMouseEnter = () => {
    if (isMobile) return;
    clearTimeout(timeoutRef.current);
    setIsOpen(true);
  };

  // Handle mouse leave for desktop
  const handleMouseLeave = () => {
    if (isMobile) return;
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // Small delay to allow moving to dropdown
  };

  // Handle click for both desktop and mobile
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  // Handle category click
  const handleCategoryClick = (categoryEn: string) => {
    navigate(`/products/category/${encodeURIComponent(categoryEn)}`);
    setIsOpen(false);
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`px-5 py-3 text-sm font-semibold transition-colors border-r border-white/10 flex items-center gap-1.5 ${
        isActive
          ? 'bg-primary text-white'
          : 'text-white/85 hover:bg-white/10 hover:text-white active:bg-white/20'
      } ${isMobile ? 'min-h-12' : ''}`}>
        <Link to="/products" className="flex items-center flex-1">
          {t('nav.products')}
        </Link>
        <button
          onClick={handleClick}
          className={`flex items-center p-1 rounded transition-colors ${isMobile ? 'touch-manipulation active:bg-white/10' : 'hover:bg-white/10'}`}
          aria-label="Toggle products dropdown"
          aria-expanded={isOpen}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-300 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scaleY: 0.95 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -8, scaleY: 0.95 }}
            transition={{ duration: 0.2 }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={`absolute ${
              isRTL ? 'right-0' : 'left-0'
            } top-full mt-1 ${isMobile ? 'w-full sm:w-56' : 'w-48'} bg-card rounded-md shadow-lg border border-border z-50 overflow-y-auto max-h-96`}
            style={{ originY: 0 }}
          >
            {isLoading ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                {t('common.loading') || 'Loading categories...'}
              </div>
            ) : categories.length === 0 ? (
              <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                No categories available
              </div>
            ) : (
              <div className="py-2">
                {categories.map((category, index) => {
                  const displayName = language === 'ar' ? category.name_ar : category.name;
                  const isLast = index === categories.length - 1;

                  return (
                    <motion.button
                      key={category.id}
                      initial={{ opacity: 0, x: isRTL ? 10 : -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.15 }}
                      onClick={() => handleCategoryClick(category.name)}
                      className={`w-full px-4 py-3 text-sm text-left text-foreground hover:bg-primary hover:text-white active:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                        !isLast ? 'border-b border-border/20' : ''
                      } ${isMobile ? 'touch-manipulation' : ''}`}
                    >
                      <span className="block truncate">{displayName}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductsDropdown;
