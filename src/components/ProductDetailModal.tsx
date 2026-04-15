import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingCart, Star, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useProduct } from '@/hooks/useProducts';
import { toast } from 'sonner';
import StarRating from './StarRating';
import QuoteRequestModal from './QuoteRequestModal';

interface ProductDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  isOpen,
  onClose,
  productId,
}) => {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { addToCart, items } = useCart();
  const { data: product, isLoading } = useProduct(productId);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showQuoteModal, setShowQuoteModal] = useState(false);

  const handleAddToCart = () => {
    if (!product) return;

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

  const goToPrevious = useCallback(() => {
    if (!product?.images) return;
    setSelectedImage(prev => prev > 0 ? prev - 1 : product.images!.length - 1);
  }, [product?.images]);

  const goToNext = useCallback(() => {
    if (!product?.images) return;
    setSelectedImage(prev => prev < product.images!.length - 1 ? prev + 1 : 0);
  }, [product?.images]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, goToPrevious, goToNext]);

  if (!product && !isLoading) return null;

  const name = language === 'ar' ? product?.name_ar : product?.name;
  const desc = language === 'ar' ? product?.description_ar : product?.description;
  const cat = language === 'ar' ? product?.category_ar : product?.category;

  const specs = product ? (Array.isArray(product.specifications)
    ? product.specifications
    : Object.entries((product.specifications || {}) as Record<string, string>).map(([key, value]) => ({
        name_en: key,
        name_ar: key,
        value_en: value,
        value_ar: value,
      }))) : [];

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-card rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <span className="text-sm font-medium text-gold uppercase tracking-wider">{cat}</span>
                  <h2 className="text-2xl font-display font-bold text-foreground mt-1">{name}</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex flex-col lg:flex-row max-h-[calc(90vh-80px)] overflow-y-auto">
                {/* Image Section */}
                <div className="lg:w-1/2 p-6">
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted mb-4">
                    {product?.images && product.images.length > 0 ? (
                      <>
                        <img
                          src={product.images[selectedImage]}
                          alt={name}
                          className="w-full h-full object-contain"
                        />
                        {product.images.length > 1 && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                              onClick={goToPrevious}
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
                              onClick={goToNext}
                            >
                              <ChevronRight className="w-5 h-5" />
                            </Button>
                          </>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        No image available
                      </div>
                    )}
                  </div>

                  {/* Thumbnail images */}
                  {product?.images && product.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {product.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedImage(i)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                            selectedImage === i ? 'border-primary' : 'border-border'
                          }`}
                        >
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Details Section */}
                <div className="lg:w-1/2 p-6 space-y-6">
                  {/* Price */}
                  <div className="text-3xl font-bold text-foreground">
                    ${product?.price.toLocaleString()}
                  </div>

                  {/* Stock status */}
                  {product && (
                    <div className={`text-sm ${product.in_stock ? 'text-green-600' : 'text-red-600'}`}>
                      {product.in_stock ? '✓ In Stock' : '✗ Out of Stock'}
                    </div>
                  )}

                  {/* Description */}
                  {desc && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">{t('products.description')}</h3>
                      <p className="text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  )}

                  {/* Specifications */}
                  {specs.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {t('products.specifications')}
                      </h3>
                      <div className="space-y-2">
                        {specs.map((spec, i) => (
                          <div key={i} className="flex justify-between py-2 border-b border-border/50 last:border-b-0">
                            <span className="font-medium text-foreground">
                              {language === 'ar' ? spec.name_ar : spec.name_en}
                            </span>
                            <span className="text-muted-foreground">
                              {language === 'ar' ? spec.value_ar : spec.value_en}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      onClick={handleAddToCart}
                      disabled={!product?.in_stock}
                      className="flex-1"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {t('products.addToCart')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowQuoteModal(true)}
                      className="flex-1"
                    >
                      {t('products.requestQuote')}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote Request Modal */}
      {product && (
        <QuoteRequestModal
          isOpen={showQuoteModal}
          onClose={() => setShowQuoteModal(false)}
          product={product}
        />
      )}
    </>
  );
};

export default ProductDetailModal;