import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useProducts } from '@/hooks/useProducts';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTranslation } from 'react-i18next';

const ProductCategoriesSection = () => {
  const { data: products = [], isLoading } = useProducts();
  const { language } = useLanguage();
  const { t } = useTranslation();

  // Build unique categories with one representative image each
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

  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground text-center uppercase tracking-wide mb-10">
            {t('home.productCategories')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-muted rounded border border-border overflow-hidden">
                <div className="aspect-[4/3] bg-muted-foreground/10" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted-foreground/10 rounded w-3/4 mx-auto" />
                  <div className="h-3 bg-muted-foreground/10 rounded w-1/2 mx-auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Section heading matching IndoSurgicals style */}
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground uppercase tracking-widest">
            {t('home.productCategories')}
          </h2>
          <div className="mt-3 mx-auto w-16 h-0.5 bg-primary" />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((cat, i) => {
            const label = language === 'ar' ? cat.ar : cat.en;
            const slug = encodeURIComponent(cat.en);
            return (
              <motion.div
                key={cat.en}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to={`/products/category/${slug}`}
                  className="group block bg-card rounded border border-border overflow-hidden hover:shadow-gold hover:border-primary/40 transition-all duration-300"
                >
                  {/* Category image */}
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img
                      src={cat.image}
                      alt={label}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  {/* Label + link */}
                  <div className="p-3 text-center border-t border-border">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                      {label}
                    </p>
                    <span className="text-xs text-primary mt-1 inline-block font-medium group-hover:underline">
                      {t('home.viewAll')}
                    </span>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View All Products Button */}
        <div className="text-center mt-12">
          <Link to="/products" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-navy-light transition-colors">
            {t('home.viewAll')}
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductCategoriesSection;
