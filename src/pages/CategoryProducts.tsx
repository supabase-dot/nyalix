import { Link, useParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ChevronRight, Home, ShoppingCart } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import CategorySidebar from '@/components/CategorySidebar';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import QuoteRequestModal from '@/components/QuoteRequestModal';

const CategoryProducts = () => {
  const { t } = useTranslation();
  const { categoryName } = useParams<{ categoryName: string }>();
  const { language } = useLanguage();
  const { data: products = [], isLoading } = useProducts();
  const { addToCart } = useCart();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(
    categoryName ? decodeURIComponent(categoryName) : null
  );
  const [quoteProductId, setQuoteProductId] = useState<string | null>(null);

  const decodedCategory = categoryName ? decodeURIComponent(categoryName) : '';

  // Build categories for sidebar
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

  // Products for this category, filtered by search
  const catProducts = products.filter(p => {
    if (p.category !== decodedCategory) return false;
    if (!search) return true;
    const name = (language === 'ar' ? p.name_ar : p.name) || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const catObj = categoryMap.get(decodedCategory);
  const catLabel = catObj ? (language === 'ar' ? catObj.ar : catObj.en) : decodedCategory;
  const catImage = catProducts[0]?.images?.[0] || '/placeholder.svg';

  const handleAddToCart = (product: (typeof products)[0]) => {
    if (!product.in_stock || (product.stock_quantity ?? 0) === 0) {
      toast.error('This product is out of stock.');
      return;
    }
    addToCart(product);
    toast.success('Added to cart');
  };

  return (
    <div className="pt-20 min-h-screen bg-background">
      {/* Page Header */}
      <div className="bg-gradient-navy py-8">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-1.5 text-primary-foreground/60 text-xs mb-2">
            <Link to="/" className="flex items-center gap-1 hover:text-primary-foreground transition-colors">
              <Home className="w-3 h-3" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <Link to="/products" className="hover:text-primary-foreground transition-colors">Products</Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-primary-foreground font-medium">{catLabel}</span>
          </nav>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground uppercase tracking-wide">
            {catLabel}
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar — category links navigate to their own page */}
          <aside className="lg:w-60 shrink-0">
            <div className="sticky top-24 bg-card border border-border rounded-sm overflow-hidden shadow-luxury">
              <div className="bg-primary px-4 py-3">
                <h2 className="font-display font-bold text-primary-foreground uppercase tracking-widest text-sm">
                  Categories
                </h2>
              </div>
              <div className="p-2 border-b border-border">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-3 pr-2 py-1.5 text-xs rounded border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                </div>
              </div>
              <ul className="py-1 max-h-[70vh] overflow-y-auto divide-y divide-border">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <li key={i} className="px-4 py-3">
                        <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
                      </li>
                    ))
                  : categories.map(cat => {
                      const label = language === 'ar' ? cat.ar : cat.en;
                      const isActive = cat.en === decodedCategory;
                      return (
                        <li key={cat.en}>
                          <Link
                            to={`/products/category/${encodeURIComponent(cat.en)}`}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-1.5 transition-colors ${
                              isActive
                                ? 'bg-primary/10 text-primary font-semibold border-r-2 border-primary'
                                : 'text-foreground hover:text-primary hover:bg-muted'
                            }`}
                          >
                            <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />
                            {label}
                          </Link>
                        </li>
                      );
                    })}
              </ul>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Category Hero Image */}
            {!isLoading && catProducts.length > 0 && (
              <div className="mb-6 rounded border border-border overflow-hidden">
                <img
                  src={catImage}
                  alt={catLabel}
                  className="w-full h-56 md:h-72 object-cover"
                />
              </div>
            )}

            {/* Category title */}
            <h2 className="text-xl font-display font-bold text-foreground uppercase mb-4 tracking-wide">
              {catLabel}
            </h2>

            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-muted rounded border border-border overflow-hidden">
                    <div className="aspect-square bg-muted-foreground/10" />
                    <div className="p-3 space-y-2">
                      <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
                      <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : catProducts.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg">No products found in this category.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-5">
                  Showing {catProducts.length} product{catProducts.length !== 1 ? 's' : ''} in <strong className="text-foreground">{catLabel}</strong>
                </p>
                {/* Sub-product grid — IndoSurgicals style */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {catProducts.map((product, i) => {
                    const name = language === 'ar' ? product.name_ar : product.name;
                    const isOutOfStock = !product.in_stock || (product.stock_quantity ?? 0) === 0;
                    return (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="group bg-card rounded border border-border overflow-hidden hover:shadow-gold hover:border-primary/30 transition-all duration-300"
                      >
                        <Link to={`/products/${product.id}`} className="block">
                          <div className="aspect-square overflow-hidden bg-muted relative">
                            <img
                              src={product.images?.[0] || '/placeholder.svg'}
                              alt={name}
                              loading="lazy"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                <span className="bg-destructive text-destructive-foreground px-2 py-0.5 rounded text-xs font-semibold">Out of Stock</span>
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="p-3 text-center border-t border-border">
                          <Link to={`/products/${product.id}`}>
                            <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-2 mb-2">
                              {name}
                            </p>
                          </Link>
                          <div className="flex items-center justify-between gap-1">
                            {product.price !== undefined && product.price !== null ? (
                              <span className="text-sm font-bold text-foreground">${product.price.toLocaleString()}</span>
                            ) : (
                              <button onClick={() => setQuoteProductId(product.id)} className="text-sm font-bold text-gold hover:text-gold/80 transition-colors cursor-pointer underline underline-offset-1">
                                Contact Price
                              </button>
                            )}
                            <button
                              onClick={() => handleAddToCart(product)}
                              disabled={isOutOfStock}
                              className="p-1.5 rounded bg-primary text-primary-foreground hover:bg-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <ShoppingCart className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
      {/* Quote Request Modal */}
      <QuoteRequestModal
        isOpen={!!quoteProductId}
        onClose={() => setQuoteProductId(null)}
        productId={quoteProductId || ''}
      />    </div>
  );
};

export default CategoryProducts;
