import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { motion } from 'framer-motion';
import { ShoppingCart, AlertCircle } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { toast } from 'sonner';
import ProductDetailModal from './ProductDetailModal';
import QuoteRequestModal from './QuoteRequestModal';

const FeaturedProducts = () => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { addToCart, items } = useCart();
  const { data: products = [], isLoading } = useProducts();
  const featured = products.filter(p => p.featured).slice(0, 4);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [quoteProductId, setQuoteProductId] = useState<string | null>(null);

  const handleAddToCart = (product: typeof featured[0]) => {
    const cartItem = items.find(i => i.product.id === product.id);
    const currentQty = cartItem ? cartItem.quantity : 0;
    const stockQty = product.stock_quantity ?? 0;

    if (stockQty > 0 && currentQty >= stockQty) {
      toast.warning(`⚠️ Only ${stockQty} units available in stock for this product.`);
      return;
    }

    if (!product.in_stock || stockQty === 0) {
      toast.error('This product is currently out of stock.');
      return;
    }

    addToCart(product);
    toast.success('Added to cart');
  };

  if (isLoading) return <section className="py-20"><div className="container mx-auto px-4 text-center text-muted-foreground">Loading...</div></section>;

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">{t('featured.title')}</h2>
          <p className="text-muted-foreground max-w-lg mx-auto">{t('featured.subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((product, i) => {
            const stockQty = product.stock_quantity ?? 0;
            const isLowStock = stockQty > 0 && stockQty <= 5;
            const isOutOfStock = !product.in_stock || stockQty === 0;

            return (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className="group bg-card rounded-xl border border-border overflow-hidden shadow-luxury hover:shadow-gold transition-all duration-300">
                <div className="cursor-pointer" onClick={() => setSelectedProductId(product.id)}>
                  <div className="aspect-[4/3] overflow-hidden relative">
                    <img src={product.images?.[0] || '/placeholder.svg'} alt={language === 'ar' ? product.name_ar : product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-semibold">Out of Stock</span>
                      </div>
                    )}
                    {isLowStock && !isOutOfStock && (
                      <div className="absolute top-2 right-2 bg-orange-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" /> Only {stockQty} left
                      </div>
                    )}
                  </div>
                </div>
                <div className="p-5">
                  <span className="text-xs font-medium text-gold uppercase tracking-wider">
                    {language === 'ar' ? product.category_ar : product.category}
                  </span>
                  <h3 className="font-display font-semibold text-foreground mt-1 mb-2 group-hover:text-gold transition-colors cursor-pointer" onClick={() => setSelectedProductId(product.id)}>
                    {language === 'ar' ? product.name_ar : product.name}
                  </h3>
                  {stockQty > 0 && !isOutOfStock && (
                    <p className={`text-xs mb-2 ${isLowStock ? 'text-orange-500 font-medium' : 'text-muted-foreground'}`}>
                      {isLowStock ? `⚠️ Only ${stockQty} units left` : `✓ ${stockQty} units available`}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    {product.price !== undefined && product.price !== null ? (
                      <span className="text-lg font-bold text-foreground">${product.price.toLocaleString()}</span>
                    ) : (
                      <button onClick={() => setQuoteProductId(product.id)} className="text-lg font-bold text-gold hover:text-gold/80 transition-colors cursor-pointer underline underline-offset-2">
                        Contact for Price
                      </button>
                    )}
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutOfStock}
                      className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-navy-light transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                      <ShoppingCart className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Link to="/products" className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-navy-light transition-colors">
            {t('featured.viewAll')}
          </Link>
        </div>

        {/* Product Detail Modal */}
        <ProductDetailModal
          isOpen={!!selectedProductId}
          onClose={() => setSelectedProductId(null)}
          productId={selectedProductId || ''}
        />

        {/* Quote Request Modal */}
        <QuoteRequestModal
          isOpen={!!quoteProductId}
          onClose={() => setQuoteProductId(null)}
          productId={quoteProductId || ''}
        />
      </div>
    </section>
  );
};

export default FeaturedProducts;
