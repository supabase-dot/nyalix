import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronRight, Home } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import CategorySidebar from '@/components/CategorySidebar';

const Products = () => {
  const { language } = useLanguage();
  const { t } = useTranslation();
  const { data: products = [], isLoading } = useProducts();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Build ordered unique categories
  const categoryMap = new Map<string, { en: string; ar: string; image: string }>();
  products.forEach(p => {
    if (p.category && !categoryMap.has(p.category)) {
      categoryMap.set(p.category, {
        en: p.category,
        ar: p.category_ar || p.category,
        image: p.images?.[0] || '/placeholder.svg',
      });
    }
  });
  const categories = Array.from(categoryMap.values());

  // Filter products by search
  const filteredProducts = products.filter(p => {
    if (!search) return true;
    const name = (language === 'ar' ? p.name_ar : p.name) || '';
    const cat = (language === 'ar' ? p.category_ar : p.category) || '';
    return (
      name.toLowerCase().includes(search.toLowerCase()) ||
      cat.toLowerCase().includes(search.toLowerCase())
    );
  });

  // Group filtered products by category
  const grouped = filteredProducts.reduce<Record<string, typeof products>>((acc, p) => {
    const key = p.category || 'Other';
    if (!acc[key]) acc[key] = [];
    acc[key].push(p);
    return acc;
  }, {});

  const scrollToCategory = (catEn: string) => {
    setActiveCategory(catEn);
    const el = categoryRefs.current[catEn];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="pt-28 min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-gradient-navy py-10">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-primary-foreground/60 text-sm mb-3">
            <Link to="/" className="flex items-center gap-1 hover:text-primary-foreground transition-colors">
              <Home className="w-3.5 h-3.5" />
              {t('products.home')}
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-primary-foreground font-medium">{t('nav.products')}</span>
          </nav>
          <h1 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground uppercase tracking-wide">
            {t('nav.products')}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar */}
          <CategorySidebar
            categories={categories}
            activeCategory={activeCategory}
            search={search}
            isLoading={isLoading}
            onCategoryClick={scrollToCategory}
            onSearchChange={setSearch}
          />

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {isLoading ? (
              <div className="space-y-6">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="border border-border rounded-sm overflow-hidden animate-pulse">
                    <div className="h-10 bg-muted" />
                    <div className="p-6 grid grid-cols-2 gap-3">
                      {Array.from({ length: 6 }).map((_, j) => (
                        <div key={j} className="h-4 bg-muted rounded w-3/4" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : Object.keys(grouped).length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">{t('products.noProductsFound')}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {categories
                  .filter(cat => grouped[cat.en]?.length > 0)
                  .map((cat, idx) => {
                    const catProducts = grouped[cat.en] || [];
                    const catLabel = language === 'ar' ? cat.ar : cat.en;
                    const catImage = catProducts[0]?.images?.[0] || '/placeholder.svg';

                    return (
                      <div
                        key={cat.en}
                        ref={el => { categoryRefs.current[cat.en] = el; }}
                      >
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: idx * 0.04 }}
                        className="border border-border rounded-sm overflow-hidden shadow-luxury"
                      >
                        {/* Category Header — steel-blue */}
                        <div className="bg-[hsl(210_30%_40%)] px-5 py-2.5 flex items-center justify-between">
                          <h2 className="font-display font-bold text-white text-sm tracking-wide">
                            {catLabel}
                          </h2>
                          <span className="text-white/60 text-xs">
                            {catProducts.length} {catProducts.length === 1 ? t('products.product') : t('products.products')}
                          </span>
                        </div>

                        {/* Body: 2-col text links + one image */}
                        <div className="bg-card p-5 flex gap-5">
                          {/* 2-column product name links */}
                          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 content-start">
                            {catProducts.map(product => {
                              const name = language === 'ar' ? product.name_ar : product.name;
                              return (
                                <Link
                                  key={product.id}
                                  to={`/products/${product.id}`}
                                  className="flex items-start gap-1.5 text-sm text-[hsl(210_60%_40%)] hover:text-accent transition-colors group"
                                >
                                  <ChevronRight className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground group-hover:text-accent" />
                                  <span className="leading-snug">{name}</span>
                                </Link>
                              );
                            })}
                          </div>

                          {/* Single representative category image */}
                          <div className="hidden md:block w-40 shrink-0">
                            <div className="w-full aspect-square rounded border border-border overflow-hidden bg-muted">
                              <img
                                src={catImage}
                                alt={catLabel}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      </div>
                    );
                  })}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Products;
