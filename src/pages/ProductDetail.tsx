import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useProduct, useProducts } from '@/hooks/useProducts';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { ShoppingCart, Check, X, Home, ChevronRight, FileText } from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import CategorySidebar from '@/components/CategorySidebar';
import StarRating from '@/components/StarRating';
import QuoteRequestModal from '@/components/QuoteRequestModal';

interface Review {
  id: string;
  user_id: string;
  rating: number;
  review_text: string;
  created_at: string;
  user_name?: string;
}

const ProductDetail = () => {
  const { id } = useParams();
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { addToCart } = useCart();
  const { data: product, isLoading } = useProduct(id || '');
  const { data: allProducts = [] } = useProducts();
  const [selectedImage, setSelectedImage] = useState(0);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const navigate = useNavigate();

  const categoryMap = new Map<string, {en: string;ar: string;}>();
  allProducts.forEach((p) => {
    if (p.category && !categoryMap.has(p.category)) {
      categoryMap.set(p.category, { en: p.category, ar: p.category_ar || p.category });
    }
  });
  const categories = Array.from(categoryMap.values());

  const handleCategoryClick = (catEn: string) => {
    navigate(`/products?category=${encodeURIComponent(catEn)}`);
  };

  const fetchReviews = useCallback(async () => {
    setReviewsLoading(true);
    try {
      const { data: reviewsData, error: reviewsError } = await supabase.
      from('product_reviews').
      select('*').
      eq('product_id', id).
      order('created_at', { ascending: false });

      if (reviewsError) {
        console.error('Error fetching reviews:', reviewsError);
        setReviews([]);
        setReviewsLoading(false);
        return;
      }

      if (!reviewsData || reviewsData.length === 0) {
        setReviews([]);
        setReviewsLoading(false);
        return;
      }

      // Fetch user names
      const userIds = reviewsData.map(review => review.user_id);
      const { data: profilesData, error: profilesError } = await supabase.
      from('profiles').
      select('user_id, full_name').
      in('user_id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Combine reviews with user names
      const reviewsWithNames = reviewsData.map(review => ({
        ...review,
        user_name: profilesData?.find(profile => profile.user_id === review.user_id)?.full_name || 'Verified Buyer'
      }));

      console.log('Fetched reviews with names:', reviewsWithNames);
      setReviews(reviewsWithNames as Review[]);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setReviews([]);
    }
    setReviewsLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) fetchReviews();
  }, [id, fetchReviews]);

  // track product views for analytics
  useEffect(() => {
    if (product?.id) {
      // best effort, no need to await
      supabase.from('product_views').insert({ product_id: product.id });
    }
  }, [product]);

  const avgRating = reviews.length ?
  reviews.reduce((s, r) => s + r.rating, 0) / reviews.length :
  0;

  if (isLoading) return <div className="pt-20 min-h-screen flex items-center justify-center bg-background text-muted-foreground">Loading...</div>;

  if (!product) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-2xl font-display font-bold text-foreground mb-4">Product Not Found</h1>
          <Link to="/products" className="text-gold hover:underline">Back to Products</Link>
        </div>
      </div>);

  }

  const name = language === 'ar' ? product.name_ar : product.name;
  const desc = language === 'ar' ? product.description_ar : product.description;
  const cat = language === 'ar' ? product.category_ar : product.category;
  const specs = (product.specifications || {}) as Record<string, string>;

  return (
    <div className="pt-20 min-h-screen bg-background">
      {/* Breadcrumb header */}
      <div className="bg-gradient-navy py-8">
        <div className="container mx-auto px-4">
          <nav className="flex items-center gap-2 text-primary-foreground/60 text-sm mb-2">
            <Link to="/" className="flex items-center gap-1 hover:text-primary-foreground transition-colors">
              <Home className="w-3.5 h-3.5" />Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link to="/products" className="hover:text-primary-foreground transition-colors">Products</Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-primary-foreground font-medium">{name}</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <CategorySidebar
            categories={categories}
            activeCategory={activeCategory}
            search={search}
            isLoading={false}
            onCategoryClick={handleCategoryClick}
            onSearchChange={setSearch} />
          

          {/* Main product content */}
          <main className="flex-1 min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="rounded-xl overflow-hidden border border-border shadow-luxury mb-3">
              <img src={product.images?.[selectedImage] || '/placeholder.svg'} alt={name} className="w-full aspect-square object-cover" />
            </div>
            {product.images && product.images.length > 1 &&
                <div className="flex gap-2">
                {product.images.map((img, i) =>
                  <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-accent' : 'border-border'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                  )}
              </div>
                }
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <span className="text-sm font-medium text-gold uppercase tracking-wider">{cat}</span>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-2 mb-4">{name}</h1>

            {/* Rating summary */}
            {reviews.length > 0 &&
                <div className="flex items-center gap-3 mb-3">
                <StarRating value={Math.round(avgRating)} readonly size="md" />
                <span className="text-sm text-muted-foreground">{avgRating.toFixed(1)} ({reviews.length} review{reviews.length !== 1 ? 's' : ''})</span>
              </div>
                }

            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-bold text-foreground">${product.price.toLocaleString()}</span>
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${product.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {product.in_stock ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                {product.in_stock ? t('products.inStock') : t('products.outOfStock')}
              </span>
              {product.stock_quantity > 0 &&
                  <span className="text-xs text-muted-foreground">{product.stock_quantity} units available</span>
                  }
            </div>
            <p className="text-muted-foreground leading-relaxed mb-8">{desc}</p>
            <button onClick={() => product.in_stock && addToCart(product)} disabled={!product.in_stock}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-gold rounded-lg font-semibold transition-all shadow-gold disabled:cursor-not-allowed text-gray-50 bg-primary shadow-none opacity-100">
              <ShoppingCart className="w-5 h-5" />{t('products.addToCart')}
            </button>
            
            <button 
              onClick={() => setShowQuoteModal(true)}
              className="w-full sm:w-auto ml-2 inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-semibold transition-all"
            >
              <FileText className="w-5 h-5" />
              {t('quote.openButton')}
            </button>
            
            <QuoteRequestModal 
              isOpen={showQuoteModal}
              onClose={() => setShowQuoteModal(false)}
              productId={product.id}
              productName={name}
            />
            <div className="mt-10">
              <h3 className="font-display font-semibold text-foreground text-lg mb-4">{t('products.specifications')}</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(specs).map(([key, value]) =>
                    <div key={key} className="bg-muted rounded-lg p-4">
                    <span className="text-xs text-muted-foreground uppercase tracking-wider">{key}</span>
                    <p className="font-semibold text-foreground mt-1">{value}</p>
                  </div>
                    )}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Reviews Section */}
        <div className="mt-16">
          <div className="flex items-center gap-4 mb-6">
            <h2 className="text-2xl font-display font-bold text-foreground">Customer Reviews</h2>
            {reviews.length > 0 &&
                <div className="flex items-center gap-2 bg-muted rounded-lg px-4 py-2">
                <StarRating value={Math.round(avgRating)} readonly size="sm" />
                <span className="font-bold text-foreground">{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">/ 5 ({reviews.length})</span>
              </div>
                }
          </div>

          {reviewsLoading ?
              <p className="text-muted-foreground">Loading reviews...</p> :
              reviews.length === 0 ?
              <div className="bg-card rounded-xl border border-border p-8 text-center shadow-luxury">
              <p className="text-muted-foreground">No reviews yet. Be the first to review this product after your delivery!</p>
            </div> :

              <div className="grid gap-4">
              {reviews.map((review, i) =>
                <motion.div key={review.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border p-5 shadow-luxury">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center text-primary font-bold shrink-0">
                        {(review.profiles?.full_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{review.user_name || 'Verified Buyer'}</p>
                        <StarRating value={review.rating} readonly size="sm" />
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0">{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                  {review.review_text &&
                  <p className="text-sm text-foreground leading-relaxed">{review.review_text}</p>
                  }
                </motion.div>
                )}
            </div>
              }
        </div>
          </main>
        </div>
      </div>
    </div>);

};

export default ProductDetail;