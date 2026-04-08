import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { type LucideIcon, User, Package, Clock, CheckCircle, Truck, XCircle, ChevronDown, ChevronUp, X, Star, MessageSquare, FileText, Settings, Edit2, Phone, Globe, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import StarRating from '@/components/StarRating';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';

interface OrderItem {
  product_name: string;
  quantity: number;
  price: number;
  product_id: string | null;
  product_image_url?: string;
}

interface Order {
  id: string;
  status: string;
  total: number;
  created_at: string;
  shipping_name: string;
  shipping_email?: string;
  shipping_phone?: string;
  shipping_city: string;
  shipping_country: string;
  shipping_address?: string;
  order_items?: OrderItem[];
}

interface Review {
  id: string;
  product_id: string;
  order_id: string;
  rating: number;
  review_text: string;
}

interface QuoteRequest {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  country: string;
  product_name: string;
  quantity: number;
  message: string;
  status: 'Pending' | 'Responded' | 'Approved';
  admin_response: string | null;
  admin_responded_at: string | null;
  created_at: string;
  unit_price?: number;
  tax_rate?: number;
  tax_amount?: number;
  total_amount?: number;
}

const statusConfig: Record<string, { icon: LucideIcon; color: string; bg: string }> = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  processing: { icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
  shipped: { icon: Truck, color: 'text-purple-600', bg: 'bg-purple-100' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' }
};

const quoteStatusConfig: Record<string, { icon: LucideIcon; color: string; bg: string; label: string }> = {
  Pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Pending Review' },
  Responded: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Response Received' },
  Approved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Approved' }
};

/* ── Review Modal ── */
const ReviewModal = ({
  open,
  orderId,
  productId,
  productName,
  userId,
  existingReview,
  onClose,
  onSaved









}: {open: boolean;orderId: string;productId: string;productName: string;userId: string;existingReview?: Review;onClose: () => void;onSaved: () => void;}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [text, setText] = useState(existingReview?.review_text || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setRating(existingReview?.rating || 0);
      setText(existingReview?.review_text || '');
    }
  }, [open, existingReview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {toast.error('Please select a rating');return;}
    setSaving(true);

    if (existingReview) {
      const { error } = await supabase.from('product_reviews').update({ rating, review_text: text }).eq('id', existingReview.id);
      if (error) {toast.error(error.message);setSaving(false);return;}
    } else {
      const { error } = await supabase.from('product_reviews').insert({
        product_id: productId,
        user_id: userId,
        order_id: orderId,
        rating,
        review_text: text
      });
      if (error) {toast.error(error.message);setSaving(false);return;}
    }

    toast.success('Review submitted! Thank you.');
    setSaving(false);
    onSaved();
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl border border-border p-6 shadow-luxury w-full max-w-md">
        
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display font-bold text-foreground text-lg">
            {existingReview ? t('user.profile.editYourReview') : t('user.profile.writeAReview')}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-muted-foreground mb-4 truncate">{productName}</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">{t('user.profile.yourRating')}</label>
            <StarRating value={rating} onChange={setRating} size="lg" />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">{t('user.profile.yourReviewLabel')} <span className="text-muted-foreground font-normal">({t('user.profile.optional')})</span></label>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('user.profile.reviewPlaceholder')}
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            
          </div>
          <button
            type="submit"
            disabled={saving || rating === 0}
            className="w-full px-6 py-3 bg-gradient-gold rounded-lg font-semibold text-primary-foreground hover:opacity-90 transition-all shadow-gold disabled:opacity-50">
            
            {saving ? t('user.profile.submitting') : existingReview ? t('user.profile.updateReview') : t('user.profile.submitReview')}
          </button>
        </form>
      </motion.div>
    </div>);

};

/* ── Main Profile Component ── */
const Profile = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [messageReplies, setMessageReplies] = useState<Record<string, any[]>>({});
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [editingMessage, setEditingMessage] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [reviewModal, setReviewModal] = useState<{
    open: boolean;orderId: string;productId: string;productName: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.
    from('orders').
    select('*, order_items(product_name, quantity, price, product_id, product_image_url)').
    order('created_at', { ascending: false });
    setOrders(data as unknown as Order[] ?? []);
  }, []);

  const fetchReviews = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('product_reviews').select('*').eq('user_id', user.id);
    setReviews(data as unknown as Review[] ?? []);
  }, [user]);
  const fetchQuotes = useCallback(async () => {
    if (!user || !user.id) return;
    
    try {
      // Direct query with user_id filter (now that API schema is refreshed)
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching quotes:', error);
        toast.error('Unable to load quotes');
        return;
      }

      setQuotes(data as QuoteRequest[] ?? []);
    } catch (err) {
      console.error('Exception fetching quotes:', err);
      toast.error('Unable to load quotes');
    }
  }, [user]);

  const fetchMessages = useCallback(async () => {
    if (!user || !user.id) return;

    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching messages:', error);
        return;
      }

      setMessages(data ?? []);

      // Fetch replies for all messages
      const { data: repliesData } = await supabase
        .from('contact_message_replies')
        .select('*')
        .order('created_at', { ascending: true });

      if (repliesData) {
        const repliesByMessageId: Record<string, any[]> = {};
        repliesData.forEach((reply: any) => {
          if (!repliesByMessageId[reply.message_id]) {
            repliesByMessageId[reply.message_id] = [];
          }
          repliesByMessageId[reply.message_id].push(reply);
        });
        setMessageReplies(repliesByMessageId);
      }
    } catch (err) {
      console.error('Exception fetching messages:', err);
    }
  }, [user]);
  useEffect(() => {
    if (user) {fetchOrders();fetchReviews();fetchQuotes();fetchMessages();}
  }, [user, fetchOrders, fetchReviews, fetchQuotes, fetchMessages]);

  const getExistingReview = (orderId: string, productId: string) =>
  reviews.find((r) => r.order_id === orderId && r.product_id === productId);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    const { error } = await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId);
    if (error) {toast.error(error.message);return;}
    toast.success('Order cancelled successfully');
    fetchOrders();
  };

  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!newText.trim()) {
      toast.error('Message cannot be empty');
      return;
    }

    const { error } = await supabase
      .from('contact_messages')
      .update({
        message: newText,
        is_edited: true,
        edited_at: new Date().toISOString(),
        edit_count: (messages.find((m) => m.id === messageId)?.edit_count || 0) + 1,
      })
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to update message');
      return;
    }

    toast.success('Message updated successfully');
    setEditingMessage(null);
    setEditingText('');
    fetchMessages();
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', messageId);

    if (error) {
      toast.error('Failed to delete message');
      return;
    }

    toast.success('Message deleted');
    fetchMessages();
  };

  if (loading || !user) return null;

  return (
    <div className="pt-20 min-h-screen bg-background">
      {/* Review Modal */}
      <AnimatePresence>
        {reviewModal?.open &&
        <ReviewModal
          open={reviewModal.open}
          orderId={reviewModal.orderId}
          productId={reviewModal.productId}
          productName={reviewModal.productName}
          userId={user.id}
          existingReview={getExistingReview(reviewModal.orderId, reviewModal.productId)}
          onClose={() => setReviewModal(null)}
          onSaved={fetchReviews} />

        }
      </AnimatePresence>

      <div className="bg-gradient-navy py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground">{t('user.profile.title')}</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl border border-border p-6 shadow-luxury">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-gold flex items-center justify-center">
                <User className="w-8 h-8 text-gray-50" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold text-foreground">{profile?.full_name || t('user.profile.user')}</h2>
                <p className="text-sm text-muted-foreground">{profile?.email || user?.email || 'No email'}</p>
                {profile?.phone && <p className="text-sm text-muted-foreground">📞 {profile.phone}</p>}
                {profile?.country && <p className="text-sm text-muted-foreground">🌍 {profile.country}</p>}
              </div>
            </div>
            <Link to="/settings" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                <Settings className="w-4 h-4" /> {t('user.profile.settings')}
              </Link>
          </div>

          {/* Profile Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
            {[
              { label: t('user.profile.email'), value: profile?.email || user?.email || '—' },
              { label: t('user.profile.phone'), value: profile?.phone || '—' },
              { label: t('user.profile.totalOrders'), value: orders.length }
            ].map((item, i) =>
              <div key={i} className="bg-muted rounded-lg p-3">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="font-semibold text-foreground truncate">{item.value}</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Orders */}
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">{t('user.profile.myOrders')}</h2>
          {orders.length === 0 ?
          <div className="bg-card rounded-xl border border-border p-8 text-center shadow-luxury">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('user.profile.noOrders')}</p>
            </div> :

          <div className="space-y-4">
              {orders.map((order, i) => {
              const config = statusConfig[order.status] || statusConfig.pending;
              const StatusIcon = config.icon;
              const isExpanded = expandedOrder === order.id;
              const canCancel = order.status === 'pending' || order.status === 'processing';
              const isDelivered = order.status === 'delivered';

              return (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border shadow-luxury overflow-hidden">
                    <button onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4 flex-wrap">
                        {/* Product image thumbnail */}
                        {order.order_items?.[0]?.product_image_url ?
                      <img
                        src={order.order_items[0].product_image_url}
                        alt={order.order_items[0].product_name}
                        className="w-12 h-12 rounded-lg object-cover border border-border shrink-0" /> :


                      <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                            <StatusIcon className={`w-5 h-5 ${config.color}`} />
                          </div>
                      }
                        <div>
                          <p className="font-mono text-sm text-foreground">#{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${config.bg} ${config.color}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-foreground">${Number(order.total).toLocaleString()}</p>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </button>

                    {isExpanded &&
                  <div className="border-t border-border p-5 bg-muted/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">{t('user.profile.shippingTo')}</p>
                            <p className="text-sm text-foreground">{order.shipping_name}</p>
                            {order.shipping_email && <p className="text-sm text-muted-foreground">{order.shipping_email}</p>}
                            <p className="text-sm text-muted-foreground">{order.shipping_city}, {order.shipping_country}</p>
                            {order.shipping_phone && <p className="text-sm text-muted-foreground">Phone: {order.shipping_phone}</p>}
                            {order.shipping_address && <p className="text-sm text-muted-foreground">{order.shipping_address}</p>}
                          </div>
                          {/* Status Timeline */}
                          <div>
                            <p className="text-xs text-muted-foreground mb-2">{t('user.profile.orderProgress')}</p>
                            <div className="flex items-center gap-1">
                              {['pending', 'processing', 'shipped', 'delivered'].map((step, si) => {
                            const steps = ['pending', 'processing', 'shipped', 'delivered'];
                            const currentIdx = steps.indexOf(order.status);
                            const isActive = si <= currentIdx && order.status !== 'cancelled';
                            return (
                              <div key={step} className="flex items-center gap-1 flex-1">
                                    <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-primary' : 'bg-border'}`} />
                                    {si < 3 && <div className={`h-0.5 flex-1 ${isActive && si < currentIdx ? 'bg-primary' : 'bg-border'}`} />}
                                  </div>);

                          })}
                            </div>
                            <div className="flex justify-between mt-1">
                              {[t('user.profile.statusPending'), t('user.profile.statusProcessing'), t('user.profile.statusShipped'), t('user.profile.statusDelivered')].map((s) =>
                          <span key={s} className="text-[10px] text-muted-foreground">{s}</span>
                          )}
                            </div>
                          </div>
                        </div>

                        {/* Order items with images */}
                        {order.order_items && order.order_items.length > 0 &&
                    <div className="mb-4">
                            <p className="text-xs text-muted-foreground mb-3">{t('user.profile.items')}</p>
                            <div className="space-y-3">
                              {order.order_items.map((item, idx) => {
                          const existing = item.product_id ? getExistingReview(order.id, item.product_id) : undefined;
                          return (
                            <div key={idx} className="flex items-center gap-3">
                                    {item.product_image_url ?
                              <img
                                src={item.product_image_url}
                                alt={item.product_name}
                                className="w-14 h-14 rounded-lg object-cover border border-border shrink-0" /> :


                              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center shrink-0">
                                        <Package className="w-6 h-6 text-muted-foreground" />
                                      </div>
                              }
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} · ${Number(item.price).toLocaleString()}</p>
                                      {existing &&
                                <div className="flex items-center gap-1 mt-0.5">
                                          <StarRating value={existing.rating} readonly size="sm" />
                                          <span className="text-xs text-muted-foreground">{t('user.profile.yourReview')}</span>
                                        </div>
                                }
                                    </div>
                                    {isDelivered && item.product_id &&
                              <button
                                onClick={() => setReviewModal({ open: true, orderId: order.id, productId: item.product_id!, productName: item.product_name })}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                                existing ?
                                'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100' :
                                'bg-primary text-primary-foreground hover:bg-primary/90'}`
                                }>
                                
                                        <Star className="w-3.5 h-3.5" />
                                        {existing ? t('user.profile.editReview') : t('user.profile.writeReview')}
                                      </button>
                              }
                                  </div>);

                        })}
                            </div>
                          </div>
                    }

                        {/* Cancel Order Button */}
                        {canCancel &&
                    <button onClick={() => handleCancelOrder(order.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors">
                            <XCircle className="w-4 h-4" /> {t('user.profile.cancelOrder')}
                          </button>
                    }
                        {order.status === 'cancelled' &&
                    <p className="text-sm text-red-500 font-medium">{t('user.profile.orderCancelled')}</p>
                    }
                      </div>
                  }
                  </motion.div>);

            })}
            </div>
          }
        </div>

        {/* Quote Requests */}
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">{t('user.profile.myQuoteRequests')}</h2>
          {quotes.length === 0 ?
          <div className="bg-card rounded-xl border border-border p-8 text-center shadow-luxury">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('user.profile.noQuoteRequests')}</p>
            </div> :

          <div className="space-y-4">
              {quotes.map((quote, i) => {
              const config = quoteStatusConfig[quote.status] || quoteStatusConfig.Pending;
              const StatusIcon = config.icon;

              return (
                <motion.div key={quote.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card rounded-xl border border-border shadow-luxury overflow-hidden">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                            <StatusIcon className={`w-5 h-5 ${config.color}`} />
                          </div>
                          <div>
                            <h3 className="font-semibold text-foreground text-lg">{quote.product_name}</h3>
                            <p className="text-sm text-muted-foreground">{config.label}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Qty: {quote.quantity}</p>
                          <p className="text-xs text-muted-foreground">{new Date(quote.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Admin Response */}
                      {quote.admin_response && (
                        <div className="bg-muted/50 rounded-lg border border-border p-4 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageSquare className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium text-foreground">{t('user.profile.adminResponse')}</span>
                            {quote.admin_responded_at && (
                              <span className="text-xs text-muted-foreground">
                                {new Date(quote.admin_responded_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-foreground leading-relaxed">{quote.admin_response}</p>
                        </div>
                      )}

                      {/* Pricing Information for Approved Quotes */}
                      {quote.status === 'Approved' && quote.total_amount && (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800 p-4 mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-green-800 dark:text-green-200">{t('user.profile.quoteApproved')}</h4>
                            <button
                              onClick={() => window.open(`/invoice/${quote.id}`, '_blank')}
                              className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 transition-colors"
                            >
                              {t('user.profile.downloadInvoice')}
                            </button>
                          </div>
                          {quote.unit_price ? (
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p className="text-green-700 dark:text-green-300">{t('user.profile.unitPrice')}</p>
                                <p className="font-semibold text-green-800 dark:text-green-200">${quote.unit_price.toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-green-700 dark:text-green-300">{t('user.profile.quantity')}</p>
                                <p className="font-semibold text-green-800 dark:text-green-200">{quote.quantity}</p>
                              </div>
                              <div>
                                <p className="text-green-700 dark:text-green-300">{t('user.profile.tax')} ({((quote.tax_rate || 0) * 100).toFixed(1)}%)</p>
                                <p className="font-semibold text-green-800 dark:text-green-200">${(quote.tax_amount || 0).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-green-700 dark:text-green-300">{t('user.profile.total')}</p>
                                <p className="font-semibold text-green-800 dark:text-green-200">${quote.total_amount.toFixed(2)}</p>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-green-700 dark:text-green-300">
                              {t('user.profile.quoteApprovedMessage')}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Quote Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">{t('user.profile.company')}</p>
                          <p className="font-medium text-foreground">{quote.company}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('user.profile.contact')}</p>
                          <p className="font-medium text-foreground">{quote.phone}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('user.profile.country')}</p>
                          <p className="font-medium text-foreground">{quote.country}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">{t('user.profile.status')}</p>
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color} border`}>
                            <StatusIcon className="w-3 h-3" />
                            {quote.status}
                          </span>
                        </div>
                      </div>

                      {quote.message && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-2">{t('user.profile.yourMessage')}</p>
                          <p className="text-sm text-foreground leading-relaxed">{quote.message}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>);

            })}
            </div>
          }
        </div>

        {/* Messages */}
        <div>
          <h2 className="text-lg font-display font-semibold text-foreground mb-4">{t('user.profile.myMessages') || 'My Messages'}</h2>
          {messages.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center shadow-luxury">
              <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">{t('user.profile.noMessages') || 'No messages sent yet.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, i) => {
                const isExpanded = expandedMessage === message.id;
                const replies = messageReplies[message.id] || [];
                const statusColors: Record<string, { bg: string; color: string; icon: React.ComponentType<any> }> = {
                  new: { bg: 'bg-yellow-100', color: 'text-yellow-700', icon: Clock },
                  replied: { bg: 'bg-blue-100', color: 'text-blue-700', icon: MessageSquare },
                  resolved: { bg: 'bg-green-100', color: 'text-green-700', icon: CheckCircle },
                };
                const statusConfig = statusColors[message.status] || statusColors.new;
                const StatusIcon = statusConfig.icon;

                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="bg-card rounded-xl border border-border shadow-luxury overflow-hidden"
                  >
                    {/* Message Header */}
                    <button
                      onClick={() => setExpandedMessage(isExpanded ? null : message.id)}
                      className="w-full flex items-center justify-between p-5 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {message.status.charAt(0).toUpperCase() + message.status.slice(1)}
                          </span>
                          {message.is_edited && (
                            <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded flex items-center gap-1">
                              <Edit2 className="w-3 h-3" />
                              Edited
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground font-medium mb-1">
                          {message.message.substring(0, 100)}
                          {message.message.length > 100 ? '...' : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(message.created_at).toLocaleDateString()} at{' '}
                          {new Date(message.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {replies.length > 0 && (
                          <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                            {replies.length} {replies.length === 1 ? 'reply' : 'replies'}
                          </span>
                        )}
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Message Details (Expanded) */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="border-t border-border bg-muted/30 p-5 space-y-4"
                        >
                          {/* Message Content */}
                          {editingMessage === message.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={editingText}
                                onChange={(e) => setEditingText(e.target.value)}
                                rows={4}
                                maxLength={1000}
                                className="w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditMessage(message.id, editingText)}
                                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                  Save Changes
                                </button>
                                <button
                                  onClick={() => setEditingMessage(null)}
                                  className="px-4 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-2">Message</h4>
                              <p className="text-sm text-foreground whitespace-pre-wrap">{message.message}</p>
                              {message.is_edited && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  ✏️ Last edited: {message.edited_at ? new Date(message.edited_at).toLocaleDateString() : 'N/A'}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Contact Details */}
                          {(message.shipping_phone || message.shipping_country) && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-card rounded-lg border border-border">
                              {message.shipping_phone && (
                                <div className="flex items-center gap-2">
                                  <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <span className="text-sm text-foreground">{message.shipping_phone}</span>
                                </div>
                              )}
                              {message.shipping_country && (
                                <div className="flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                                  <span className="text-sm text-foreground">{message.shipping_country}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Replies Section */}
                          {replies.length > 0 && (
                            <div className="pt-2 border-t border-border">
                              <h4 className="text-sm font-semibold text-foreground mb-3">Admin Responses</h4>
                              <div className="space-y-3 bg-card rounded-lg p-3 border border-border">
                                {replies.map((reply) => (
                                  <div key={reply.id} className="border-l-2 border-accent pl-3">
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Admin Reply</p>
                                    <p className="text-sm text-foreground whitespace-pre-wrap mb-1">
                                      {reply.reply_text}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {new Date(reply.created_at).toLocaleDateString()} at{' '}
                                      {new Date(reply.created_at).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                      })}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {!editingMessage || editingMessage !== message.id ? (
                            <div className="flex gap-2 pt-2 border-t border-border">
                              {message.status === 'new' && (
                                <button
                                  onClick={() => {
                                    setEditingMessage(message.id);
                                    setEditingText(message.message);
                                  }}
                                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" /> Edit Message
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteMessage(message.id)}
                                className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : null}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;