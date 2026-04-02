import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Navigate } from 'react-router-dom';
import i18n from '@/lib/i18n';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { type LucideIcon, Plus, Pencil, Trash2, Package, ShoppingBag, Users, MessageSquare, Award, BarChart3, X, Upload, Bell, Settings, Eye, EyeOff, AlertTriangle, ImageIcon, Mail, Download, Menu } from 'lucide-react';
import AdminExhibitions from '@/components/AdminExhibitions';
import AdminAnalytics from '@/components/AdminAnalytics';
import AdminQuotesTab from '@/components/AdminQuotesTab';
import { AdminSidebar, type AdminTab } from '@/components/AdminSidebar';
import { useCategoriesRealtime, type Category } from '@/hooks/useCategories';
import { generateAndSendNotifications } from '@/lib/notifications';
import { useAdminNotifications } from '@/hooks/useAdminNotifications';

// Simple error boundary to surface runtime errors on admin page
class AdminErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('AdminErrorBoundary caught error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="pt-28 lg:pt-24 min-h-screen bg-background flex items-center justify-center">
          <div className="bg-card rounded-xl border border-border p-8 shadow-luxury max-w-lg">
            <h1 className="text-xl font-bold text-foreground mb-4">{i18n.t('admin.errorBoundary.title')}</h1>
            <p className="text-sm text-muted-foreground mb-4">{i18n.t('admin.errorBoundary.message')}</p>
            <pre className="text-xs text-red-500 bg-muted p-3 rounded-lg overflow-x-auto">{this.state.error.message}</pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface ProductSpecification {
  name_en: string;
  name_ar: string;
  value_en: string;
  value_ar: string;
}

interface Product {
  id: string;
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  category: string;
  category_ar: string;
  price: number;
  images: string[];
  in_stock: boolean;
  stock_quantity: number;
  specifications: ProductSpecification[];
  featured: boolean;
}

interface Order {
  id: string;
  status: string;
  total: number;
  shipping_name: string;
  shipping_email?: string;
  shipping_phone?: string;
  shipping_country: string;
  shipping_city?: string;
  shipping_address?: string;
  created_at: string;
  user_id: string;
  read: boolean;
  order_items?: {product_name: string;quantity: number;price: number;product_image_url?: string;}[];
}

interface ContactMsg {id: string;name: string;email: string;message: string;read: boolean;created_at: string;}

interface Certificate { id: string; title: string; title_ar: string; type: string; file_url: string; created_at?: string; }

/* ── Confirm Modal ── */
const ConfirmModal = ({ open, title, message, onConfirm, onCancel

}: {open: boolean;title: string;message: string;onConfirm: () => void;onCancel: () => void;}) => {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onCancel}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card rounded-2xl border border-border p-6 shadow-luxury w-full max-w-sm">
        
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <h3 className="font-display font-bold text-foreground">{title}</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors">{t('admin.productForm.cancel')}</button>
          <button onClick={onConfirm} className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">{t('admin.deleteProduct')}</button>
        </div>
      </motion.div>
    </div>);

};

interface UserProfile {id: string;user_id: string;full_name: string;email: string;phone: string | null;country: string | null;created_at: string;admin_notified?: boolean;}

const Admin = () => {
  const { user, isAdmin, loading } = useAuth();
  const { t } = useTranslation();
  const { language, setLanguage, isRTL } = useLanguage();
  const navigate = useNavigate();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const { categories, isLoading: categoriesLoading, error: categoriesError } = useCategoriesRealtime();
  const { counts: notificationCounts, markOrdersAsRead, markMessagesAsRead, markNewsletterAsRead, markQuotesAsRead, markUsersAsNotified } = useAdminNotifications();

  useEffect(() => {
    if (categoriesError) {
      // Error handling - silent fail with fallback
    }
  }, [categoriesError]);

  // Sync local categories list with hook data
  useEffect(() => {
    if (categories.length > 0) {
      setCategoriesList(categories);
    }
  }, [categories]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());
  const [messages, setMessages] = useState<ContactMsg[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [editProduct, setEditProduct] = useState<Partial<Product> | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editCategory, setEditCategory] = useState<Partial<Category> | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [confirmModal, setConfirmModal] = useState<{open: boolean;title: string;message: string;onConfirm: () => void;} | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');
  const [orderSearch, setOrderSearch] = useState('');

  const normalizeSpecs = (specs: unknown): ProductSpecification[] => {
    if (!specs) return [];
    if (Array.isArray(specs)) {
      const arr = specs as Array<Record<string, unknown>>;
      return arr.map((s) => ({
        name_en: String(s?.name_en ?? s?.name ?? ''),
        name_ar: String(s?.name_ar ?? s?.name ?? ''),
        value_en: String(s?.value_en ?? s?.value ?? ''),
        value_ar: String(s?.value_ar ?? s?.value ?? ''),
      }));
    }

    // Legacy object format: { key: value }
    return Object.entries(specs).map(([key, val]) => ({
      name_en: key,
      name_ar: key,
      value_en: String(val ?? ''),
      value_ar: String(val ?? ''),
    }));
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
    if (!loading && user && !isAdmin) {
      // Allow access for 10 seconds to let user make themselves admin
      const timer = setTimeout(() => {
        if (!isAdmin) {
          navigate('/');
        }
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [user, isAdmin, loading, navigate]);

  const fetchProducts = useCallback(async () => {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    const normalized = (data as unknown[] | null) ?? [];
    setProducts(
      normalized.map((p) => ({
        ...p,
        specifications: normalizeSpecs(p.specifications),
      })) as Product[]
    );
  }, []);

  const fetchOrders = useCallback(async () => {
    const { data } = await supabase.from('orders').select('*, order_items(product_name, quantity, price, product_image_url)').order('created_at', { ascending: false });
    setOrders(data as unknown as Order[] ?? []);
  }, []);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase.from('contact_messages').select('*').order('created_at', { ascending: false });
    setMessages(data as unknown as ContactMsg[] ?? []);
  }, []);

  const fetchUsers = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setUsers(data as unknown as UserProfile[] ?? []);
  }, []);

  useEffect(() => {
    if (user) { // Fetch data for any logged-in user
      fetchProducts();
      fetchOrders();
      fetchMessages();
      fetchUsers();
    }
  }, [user, fetchProducts, fetchOrders, fetchMessages, fetchUsers]);

  // Real-time subscriptions for toast notifications only
  useEffect(() => {
    if (!user) return;
    
    const ordersChannel = supabase.channel('admin-orders-toast').
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
      setOrders((prev) => [payload.new as Order, ...prev]);
      toast.info(t('admin.toast.newOrder'));
    }).subscribe();

    const messagesChannel = supabase.channel('admin-messages-toast').
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_messages' }, (payload) => {
      setMessages((prev) => [payload.new as ContactMsg, ...prev]);
      toast.info(t('admin.toast.newMessage'));
    }).subscribe();

    const usersChannel = supabase.channel('admin-users-toast').
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
      setUsers((prev) => [payload.new as UserProfile, ...prev]);
      toast.info(t('admin.toast.newUser'));
    }).subscribe();

    const newsletterChannel = supabase.channel('admin-newsletter-toast').
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'newsletter_subscribers' }, () => {
      toast.info(t('admin.toast.newSubscriber'));
    }).subscribe();

    const productsChannel = supabase.channel('admin-products').
    on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, (payload) => {
      setProducts((prev) => [payload.new as Product, ...prev]);
      toast.info(t('admin.toast.newProduct'));
    }).
    on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, (payload) => {
      setProducts((prev) =>
        prev.map((p) => p.id === payload.new.id ? (payload.new as Product) : p)
      );
    }).subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(usersChannel);
      supabase.removeChannel(newsletterChannel);
      supabase.removeChannel(productsChannel);
    };
  }, [user, isAdmin]);

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    const payload = {
      name: editProduct.name || '',
      name_ar: editProduct.name_ar || '',
      description: editProduct.description || '',
      description_ar: editProduct.description_ar || '',
      category: editProduct.category || '',
      category_ar: editProduct.category_ar || '',
      price: editProduct.price || 0,
      images: editProduct.images || [],
      in_stock: editProduct.in_stock ?? true,
      stock_quantity: editProduct.stock_quantity ?? 0,
      specifications: normalizeSpecs(editProduct.specifications),
      featured: editProduct.featured ?? false
    };

    if (editProduct.id) {
      const { error } = await supabase.from('products').update(payload).eq('id', editProduct.id);
      if (error) {toast.error(error.message);return;}
      toast.success(t('admin.toast.productUpdated'));
    } else {
      const { error } = await supabase.from('products').insert(payload);
      if (error) {toast.error(error.message);return;}
      toast.success(t('admin.toast.productAdded'));
    }
    setShowForm(false);
    setEditProduct(null);
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm(t('admin.toast.deleteProductConfirm') || '')) return;
    await supabase.from('products').delete().eq('id', id);
    toast.success(t('admin.toast.productDeleted'));
    fetchProducts();
  };

  // Category Management Functions
  const saveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCategory?.name || !editCategory?.name_ar) {
      toast.error(t('admin.toast.fillBothLanguageFields'));
      return;
    }

    const payload = {
      name: editCategory.name,
      name_ar: editCategory.name_ar,
      description: editCategory.description || '',
      description_ar: editCategory.description_ar || '',
      icon: editCategory.icon || '',
      order_index: editCategory.order_index ?? categoriesList.length + 1,
    };

    if (editCategory.id) {
      // Edit existing category
      const { error } = await supabase
        .from('categories')
        .update(payload)
        .eq('id', editCategory.id);
      if (error) {
        toast.error(error.message);
        return;
      }
      
      // Immediately update local state for instant UI feedback
      setCategoriesList((prev) =>
        prev
          .map((cat) =>
            cat.id === editCategory.id
              ? { ...cat, ...payload }
              : cat
          )
          .sort((a, b) => a.order_index - b.order_index)
      );
      
      toast.success(t('admin.toast.categoryUpdated'));
    } else {
      // Add new category
      const { data, error } = await supabase
        .from('categories')
        .insert(payload)
        .select('*')
        .single();
      
      if (error) {
        toast.error(error.message);
        return;
      }

      // Immediately update local state for instant UI feedback
      if (data) {
        setCategoriesList((prev) =>
          [...prev, data as Category].sort((a, b) => a.order_index - b.order_index)
        );
      }
      
      toast.success(t('admin.toast.categoryAdded'));
    }

    setShowCategoryForm(false);
    setEditCategory(null);
    // The hook will automatically update via real-time subscription for other components
  };

  const deleteCategory = async (id: string) => {
    if (!confirm(t('admin.toast.deleteCategoryConfirm'))) return;
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error(error.message);
      return;
    }
    
    // Immediately update local state for instant UI feedback
    setCategoriesList((prev) => prev.filter((cat) => cat.id !== id));
    
    toast.success(t('admin.toast.categoryDeleted'));
    // The hook will automatically update via real-time subscription for other components
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    await supabase.from('orders').update({ status }).eq('id', id);
    toast.success(t('admin.toast.statusUpdated'));
    fetchOrders();

    // Send status update notifications
    await generateAndSendNotifications('order_status_update', order.user_id, id);
    
    // Show additional notification about email being sent
    toast.success(t('admin.toast.statusEmail'))
  };

  const deleteOrder = async (id: string) => {
    if (!confirm(t('admin.toast.deleteOrderConfirm') || '')) return;
    await supabase.from('orders').delete().eq('id', id);
    toast.success(t('admin.toast.orderDeleted'));
    fetchOrders();
  };

  const makeCurrentUserAdmin = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.functions.invoke('make-admin', {
        body: { userId: user.id }
      });

      if (error || !data?.success) {
        toast.error(t('admin.toast.adminAccessError'));
        return;
      }

      toast.success(t('admin.toast.adminAccessSuccess'));
      // Refresh the page to update the admin status
      window.location.reload();
    } catch (error) {
      toast.error(t('admin.toast.adminAccessFailed'));
    }
  };

  const deleteMessage = (msgId: string) => {
    setConfirmModal({
      open: true,
      title: t('admin.toast.deleteMessageTitle'),
      message: t('admin.toast.deleteMessageConfirm'),
      onConfirm: async () => {
        await supabase.from('contact_messages').delete().eq('id', msgId);
        setMessages((prev) => prev.filter((m) => m.id !== msgId));
        toast.success(t('admin.toast.messageDeleted'));
        setConfirmModal(null);
      }
    });
  };

  const deleteUser = async (userId: string) => {
    if (!confirm(t('admin.toast.deleteUserProfileConfirm') || '')) return;
    await supabase.from('profiles').delete().eq('user_id', userId);
    toast.success(t('admin.toast.userDeleted'));
    fetchUsers();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls: string[] = [...(editProduct?.images || [])];
    for (const file of Array.from(files)) {
      const path = `${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) {toast.error(error.message);continue;}
      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      urls.push(urlData.publicUrl);
    }
    setEditProduct((prev) => prev ? { ...prev, images: urls } : prev);
  };

  if (loading) return (
    <div className="pt-28 lg:pt-24 min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold mx-auto mb-4"></div>
        <p className="text-muted-foreground">{t('admin.loading')}</p>
      </div>
    </div>
  );

  if (!user) {
    // If not logged in, redirect to the auth page (prevents showing a blank page while the redirect occurs)
    return <Navigate to="/auth" replace />;
  }

  // Filter out admin user from users list
  const regularUsers = users.filter((u) => u.user_id !== user?.id);

  const handleTabChange = (t: AdminTab) => {
    setTab(t);
    
    // Mark as read when admin opens each section
    if (t === 'orders') {
      markOrdersAsRead();
    } else if (t === 'messages') {
      markMessagesAsRead();
    } else if (t === 'users') {
      markUsersAsNotified();
    } else if (t === 'newsletter') {
      markNewsletterAsRead();
    } else if (t === 'quotes') {
      markQuotesAsRead();
    }
    
    setSidebarOpen(false); // Close sidebar on mobile after navigation
  };

  return (
    <AdminErrorBoundary>
      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal?.open &&
        <ConfirmModal
          open={confirmModal.open}
          title={confirmModal.title}
          message={confirmModal.message}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal(null)} />

        }
      </AnimatePresence>

      {/* Sidebar */}
      <AdminSidebar
        activeTab={tab}
        onTabChange={handleTabChange}
        notifications={{
          orders: notificationCounts.orders,
          messages: notificationCounts.messages,
          users: notificationCounts.users,
          newsletter: notificationCounts.newsletter,
          quotes: notificationCounts.quotes,
        }}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="min-h-screen bg-background">
        {/* Top navbar — Admin Dashboard Header */}
        <div className="bg-gradient-navy fixed top-0 left-0 right-0 z-50 py-3 md:py-4 border-b border-border/50">
          <div className="flex items-center justify-between px-4 lg:px-8 h-14 md:h-16">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 hover:bg-white/10 rounded-lg transition-colors shrink-0"
                aria-label="Toggle sidebar"
              >
                <Menu className="w-5 h-5 md:w-6 md:h-6 text-primary-foreground" />
              </button>
              <h1 className="text-xl md:text-2xl font-display font-bold text-primary-foreground truncate">{t('admin.title')}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
                className="px-3 py-1 rounded-lg border border-white/30 text-white text-xs font-semibold hover:bg-white/10 transition-colors"
              >
                {language === 'en' ? 'العربية' : 'English'}
              </button>
            </div>
            {/* Include newsletter in the global notification summary as well */}
            {notificationCounts.orders + notificationCounts.messages + notificationCounts.users + notificationCounts.newsletter + notificationCounts.quotes > 0 &&
            <div className="flex items-center gap-2 bg-gradient-to-r from-gold to-yellow-400 border-2 border-gold/50 rounded-full px-4 md:px-5 py-2 ml-2 shrink-0 shadow-lg animate-pulse">
                <Bell className="w-5 h-5 md:w-6 md:h-6 text-white shrink-0 drop-shadow-sm" />
                <span className="text-white text-sm md:text-base font-bold bg-black/20 px-2 py-0.5 rounded-full">{notificationCounts.orders + notificationCounts.messages + notificationCounts.users + notificationCounts.newsletter + notificationCounts.quotes}</span>
              </div>
            }
          </div>
        </div>

        {/* Main content area — Properly spaced below fixed navbar */}
        <main className={`pt-14 md:pt-16 transition-all duration-300 ${isRTL ? 'lg:mr-64' : 'lg:ml-64'}`}>
          <div className="container mx-auto px-4 py-6 max-w-7xl">

        {/* Dashboard */}
        {tab === 'dashboard' &&
        <div className="space-y-8">
            {/* Product Analytics Summary */}
            <div className="space-y-4">
              <h3 className="font-display font-semibold text-foreground">{t('admin.analytics.title')}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[{
                  label: t('admin.analytics.totalProducts'),
                  value: products.length,
                  icon: Package,
                }, {
                  label: t('admin.analytics.newThisMonth'),
                  value: products.filter(p => {
                    const created = new Date(p.created_at);
                    const now = new Date();
                    return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
                  }).length,
                  icon: Package,
                }, {
                  label: t('admin.analytics.lowStock'),
                  value: products.filter(p => p.stock_quantity <= 5).length,
                  icon: AlertTriangle,
                }, {
                  label: t('admin.analytics.featured'),
                  value: products.filter(p => p.featured).length,
                  icon: Award,
                }].map((s, i) =>
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card rounded-xl border border-border p-5 shadow-luxury">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <s.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-xl font-bold text-foreground">{s.value}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>

            {/* analytics section replaced by dedicated component */}
        <AdminAnalytics orders={orders} users={users} products={products} />

            {/* Admin Setup */}
            {!isAdmin && (
              <div className="bg-card rounded-xl border border-border p-6 shadow-luxury">
                <h3 className="font-display font-semibold text-foreground mb-4">{t('admin.setup.title')}</h3>
                <p className="text-muted-foreground mb-4">{t('admin.setup.description')}</p>
                <button
                  onClick={makeCurrentUserAdmin}
                  className="px-4 py-2 bg-gradient-gold text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
                >
                  {t('admin.setup.action')}
                </button>
              </div>
            )}

            {/* Recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl border border-border p-5 shadow-luxury">
                <h3 className="font-display font-semibold text-foreground mb-4">{t('admin.recentOrders')}</h3>
                <div className="space-y-3">
                  {orders.slice(0, 5).map((o) =>
                <div key={o.id} className="flex items-center gap-3 text-sm">
                      {o.order_items?.[0]?.product_image_url ?
                  <img src={o.order_items[0].product_image_url} alt="" className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" /> :

                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                          <Package className="w-5 h-5 text-muted-foreground" />
                        </div>
                  }
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{o.shipping_name || t('admin.unknown')}</p>
                        <p className="text-xs text-muted-foreground">${Number(o.total).toLocaleString()}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${
                  o.status === 'delivered' ? 'bg-green-100 text-green-700' :
                  o.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                  o.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                  o.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                  'bg-muted text-muted-foreground'}`
                  }>{t(`order.status.${o.status.toLowerCase()}`) || o.status}</span>
                      <button onClick={() => deleteOrder(o.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                )}
                  {orders.length === 0 && <p className="text-muted-foreground text-sm">{t('order.noOrders')}</p>}
                </div>
              </div>
              <div className="bg-card rounded-xl border border-border p-5 shadow-luxury">
                <h3 className="font-display font-semibold text-foreground mb-4">{t('admin.recentMessages')}</h3>
                <div className="space-y-3">
                  {messages.slice(0, 5).map((m) =>
                <div key={m.id} className="flex items-start gap-3 text-sm">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{m.name}</p>
                        <p className="text-muted-foreground truncate">{m.message}</p>
                      </div>
                      {!m.read && <span className="w-2 h-2 rounded-full bg-red-500 mt-1 shrink-0" />}
                      <button onClick={() => deleteMessage(m.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                )}
                  {messages.length === 0 && <p className="text-muted-foreground text-sm">{t('admin.noMessages')}</p>}
                </div>
              </div>
            </div>
          </div>
        }

        {/* Products */}
        {tab === 'products' &&
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-display font-semibold text-foreground">{t('admin.manageProducts')}</h2>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <div className="relative">
                  <input
                    type="text"
                    placeholder={t('products.search')}
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full sm:w-64 px-4 py-2 pl-10 pr-10 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  {productSearch && (
                    <button
                      onClick={() => setProductSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
                <button onClick={() => {setEditProduct({ stock_quantity: 0 });setShowForm(true);}}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 whitespace-nowrap">
                  <Plus className="w-4 h-4" /> {t('admin.addProduct')}
                </button>
              </div>
            </div>

            {showForm &&
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                <div className="bg-card rounded-xl border border-border p-6 shadow-luxury max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-display font-semibold text-foreground">{editProduct?.id ? t('admin.editProduct') : t('admin.addProduct')}</h3>
                    <button onClick={() => {setShowForm(false);setEditProduct(null);}}><X className="w-5 h-5 text-muted-foreground" /></button>
                  </div>
                  <form onSubmit={saveProduct} className="space-y-4">
                    {[
                { key: 'name', label: t('admin.productForm.nameEn'), type: 'text' },
                { key: 'name_ar', label: t('admin.productForm.nameAr'), type: 'text' },
                { key: 'price', label: t('admin.productForm.price'), type: 'number' },
                { key: 'stock_quantity', label: t('admin.productForm.stock'), type: 'number' }].
                map((f) =>
                <div key={f.key}>
                        <label className="block text-sm font-medium text-foreground mb-1">{f.label}</label>
                        <input type={f.type} required min={f.type === 'number' ? 0 : undefined}
                  value={editProduct?.[f.key as keyof Product] ?? ''}
                  onChange={(e) => setEditProduct((prev) => ({ ...prev, [f.key as keyof Product]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                      </div>
                )}

                    {/* Dynamic Category Selection */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">{t('admin.productForm.categoryEn')}</label>
                      <select
                        required
                        value={editProduct?.category ?? ''}
                        onChange={(e) => {
                          const selectedCategory = categories.find(c => c.name === e.target.value);
                          setEditProduct((prev) => ({
                            ...prev,
                            category: e.target.value,
                            category_ar: selectedCategory?.name_ar || ''
                          }));
                        }}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      >
                        <option value="">Select a category</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Arabic Category - Auto-populated from database */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">{t('admin.productForm.categoryAr')}</label>
                      <input
                        type="text"
                        disabled
                        value={editProduct?.category_ar ?? ''}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-muted text-muted-foreground text-sm opacity-75"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Automatically populated from database</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">{t('admin.productForm.descriptionEn')}</label>
                      <textarea rows={3} value={editProduct?.description ?? ''} onChange={(e) => setEditProduct((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">{t('admin.productForm.descriptionAr')}</label>
                      <textarea rows={3} value={editProduct?.description_ar ?? ''} onChange={(e) => setEditProduct((prev) => ({ ...prev, description_ar: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
                    </div>

                    {/* Images */}
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">{t('admin.productForm.images')}</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {(editProduct?.images || []).map((url, i) =>
                    <div key={i} className="relative w-20 h-20">
                            <img src={url} alt="" className="w-full h-full object-cover rounded-lg" />
                            <button type="button" onClick={() => setEditProduct((prev) => prev ? { ...prev, images: prev.images?.filter((_, idx) => idx !== i) } : prev)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-xs">×</button>
                          </div>
                    )}
                      </div>
                      <label className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg text-sm cursor-pointer hover:bg-border transition-colors">
                        <Upload className="w-4 h-4" /> {t('admin.productForm.uploadImages')}
                        <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>

                    {/* Specifications */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-foreground">{t('admin.productForm.specifications')}</label>
                        <button
                          type="button"
                          onClick={() => {
                            const specs = [...(editProduct?.specifications || [])];
                            specs.push({ name_en: '', name_ar: '', value_en: '', value_ar: '' });
                            setEditProduct((prev) => ({ ...prev, specifications: specs }));
                          }}
                          className="text-xs text-accent hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />{t('admin.productForm.addRow')}
                        </button>
                      </div>
                      <div className="space-y-2">
                        {(editProduct?.specifications || []).map((spec, idx) => (
                          <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">{t('admin.productForm.specNameEn')}</label>
                              <input
                                value={spec.name_en}
                                onChange={(e) => {
                                  const specs = [...(editProduct?.specifications || [])];
                                  specs[idx] = { ...specs[idx], name_en: e.target.value };
                                  setEditProduct((prev) => ({ ...prev, specifications: specs }));
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">{t('admin.productForm.specNameAr')}</label>
                              <input
                                value={spec.name_ar}
                                onChange={(e) => {
                                  const specs = [...(editProduct?.specifications || [])];
                                  specs[idx] = { ...specs[idx], name_ar: e.target.value };
                                  setEditProduct((prev) => ({ ...prev, specifications: specs }));
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-foreground mb-1">{t('admin.productForm.specValueEn')}</label>
                              <input
                                value={spec.value_en}
                                onChange={(e) => {
                                  const specs = [...(editProduct?.specifications || [])];
                                  specs[idx] = { ...specs[idx], value_en: e.target.value };
                                  setEditProduct((prev) => ({ ...prev, specifications: specs }));
                                }}
                                className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm"
                              />
                            </div>
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <label className="block text-xs font-medium text-foreground mb-1">{t('admin.productForm.specValueAr')}</label>
                                <input
                                  value={spec.value_ar}
                                  onChange={(e) => {
                                    const specs = [...(editProduct?.specifications || [])];
                                    specs[idx] = { ...specs[idx], value_ar: e.target.value };
                                    setEditProduct((prev) => ({ ...prev, specifications: specs }));
                                  }}
                                  className="w-full px-3 py-1.5 rounded-lg border border-border bg-background text-foreground text-sm"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  const specs = [...(editProduct?.specifications || [])];
                                  specs.splice(idx, 1);
                                  setEditProduct((prev) => ({ ...prev, specifications: specs }));
                                }}
                                className="text-destructive hover:text-destructive/80"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editProduct?.in_stock ?? true} onChange={(e) => setEditProduct((prev) => ({ ...prev, in_stock: e.target.checked }))} />
                        {t('admin.stockStatus.inStock')}
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={editProduct?.featured ?? false} onChange={(e) => setEditProduct((prev) => ({ ...prev, featured: e.target.checked }))} />
                        Featured
                      </label>
                    </div>

                    <button type="submit" className="w-full px-6 py-3 bg-gradient-gold rounded-lg font-semibold text-white hover:opacity-90 transition-all shadow-gold">
                      {editProduct?.id ? t('admin.update') : t('admin.create')} {t('admin.addProduct')}
                    </button>
                  </form>
                </div>
              </motion.div>
          }

            {/* Filter products based on search */}
            {(() => {
              const filteredProducts = products.filter((p) => {
                if (!productSearch.trim()) return true;
                const searchTerm = productSearch.toLowerCase();
                return (
                  (p.name?.toLowerCase() || '').includes(searchTerm) ||
                  (p.name_ar?.toLowerCase() || '').includes(searchTerm) ||
                  (p.description?.toLowerCase() || '').includes(searchTerm) ||
                  (p.description_ar?.toLowerCase() || '').includes(searchTerm) ||
                  (p.category?.toLowerCase() || '').includes(searchTerm) ||
                  (p.category_ar?.toLowerCase() || '').includes(searchTerm)
                );
              });

              return (
                <div className="grid gap-4">
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                      <Package className="w-12 h-12 text-muted-foreground mx-auto opacity-50 mb-3" />
                      <p className="text-muted-foreground">
                        {productSearch.trim() ? t('admin.noProductsMatch') : t('admin.noProductsYet')}
                      </p>
                    </div>
                  ) : (
                    filteredProducts.map((p) =>
            <div key={p.id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-4 shadow-luxury">
                  <img src={p.images?.[0] || '/placeholder.svg'} alt={p.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{p.name}</h3>
                    <p className="text-sm text-muted-foreground">{p.category} · ${p.price.toLocaleString()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Stock</p>
                    <p className={`text-sm font-bold ${p.stock_quantity <= 5 ? 'text-red-500' : 'text-green-600'}`}>{p.stock_quantity ?? 0}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.in_stock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.in_stock ? t('admin.stockStatus.inStock') : t('admin.stockStatus.outOfStock')}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={() => {setEditProduct({ ...p, specifications: normalizeSpecs(p.specifications) });setShowForm(true);}} className="p-2 text-muted-foreground hover:text-foreground"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => deleteProduct(p.id)} className="p-2 text-destructive hover:text-destructive/80"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
            )
                  )}
                </div>
              );
            })()}
          </div>
        }

        {/* Categories Management */}
        {tab === 'categories' &&
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-display font-semibold text-foreground">{t('admin.manageCategories')}</h2>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('admin.searchCategoriesPlaceholder')}
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value)}
                  className="w-full sm:w-64 px-4 py-2 pl-10 pr-10 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {categorySearch && (
                  <button
                    onClick={() => setCategorySearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={() => {
                  setEditCategory({});
                  setShowCategoryForm(true);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> {t('admin.addCategory')}
              </button>
            </div>
          </div>

          {/* Category Form Modal */}
          {showCategoryForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            >
              <div className="bg-card rounded-xl border border-border p-6 shadow-luxury max-w-lg w-full">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-display font-semibold text-foreground">
                    {editCategory?.id ? t('admin.editCategory') : t('admin.addCategory')}
                  </h3>
                  <button
                    onClick={() => {
                      setShowCategoryForm(false);
                      setEditCategory(null);
                    }}
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
                <form onSubmit={saveCategory} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('admin.categoryNameEn')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editCategory?.name ?? ''}
                      onChange={(e) =>
                        setEditCategory((prev) => ({ ...prev, name: e.target.value }))
                      }
                      placeholder={t('admin.categoryNameEn')}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('admin.categoryNameAr')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={editCategory?.name_ar ?? ''}
                      onChange={(e) =>
                        setEditCategory((prev) => ({ ...prev, name_ar: e.target.value }))
                      }
                      placeholder="e.g., تشخيصي"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('admin.categoryDescriptionOptional')}
                    </label>
                    <textarea
                      rows={2}
                      value={editCategory?.description ?? ''}
                      onChange={(e) =>
                        setEditCategory((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder={t('admin.categoryDescriptionOptional')}
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('admin.categoryDescriptionOptional')}
                    </label>
                    <textarea
                      rows={2}
                      value={editCategory?.description_ar ?? ''}
                      onChange={(e) =>
                        setEditCategory((prev) => ({
                          ...prev,
                          description_ar: e.target.value,
                        }))
                      }
                      placeholder="وصف اختياري"
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                      dir="rtl"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                      {t('admin.displayOrder')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={editCategory?.order_index ?? 1}
                      onChange={(e) =>
                        setEditCategory((prev) => ({
                          ...prev,
                          order_index: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-gradient-gold rounded-lg font-semibold text-white hover:opacity-90 transition-all shadow-gold"
                  >
                    {editCategory?.id ? t('admin.update') : t('admin.create')} {t('admin.addCategory')}
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* Categories Table */}
          <div className="bg-card rounded-xl border border-border overflow-hidden shadow-luxury">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      {t('admin.categoryNameEn')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      {t('admin.categoryNameAr')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      {t('admin.categoryDescriptionOptional')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      {t('admin.displayOrder')}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">
                      {t('admin.actions') || 'Actions'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(() => {
                    const filteredCategories = categoriesList.filter((cat) => {
                      if (!categorySearch.trim()) return true;
                      const searchTerm = categorySearch.toLowerCase();
                      return (
                        (cat.name?.toLowerCase() || '').includes(searchTerm) ||
                        (cat.name_ar?.toLowerCase() || '').includes(searchTerm) ||
                        (cat.description?.toLowerCase() || '').includes(searchTerm) ||
                        (cat.description_ar?.toLowerCase() || '').includes(searchTerm)
                      );
                    });

                    return filteredCategories.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-muted-foreground text-sm"
                        >
                          {categorySearch.trim() ? t('admin.noCategoriesMatch') : t('admin.noCategoriesYet')}
                        </td>
                      </tr>
                    ) : (
                      filteredCategories.map((cat) => (
                        <tr
                          key={cat.id}
                          className="hover:bg-muted/50 transition-colors"
                        >
                          <td className="px-6 py-3 text-sm text-foreground font-medium">
                            {cat.name}
                          </td>
                          <td className="px-6 py-3 text-sm text-foreground">
                            {cat.name_ar}
                          </td>
                          <td className="px-6 py-3 text-sm text-muted-foreground truncate max-w-xs">
                            {cat.description || '-'}
                          </td>
                          <td className="px-6 py-3 text-sm text-foreground">
                            {cat.order_index}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditCategory(cat);
                                  setShowCategoryForm(true);
                                }}
                                className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 rounded-lg transition-colors text-xs font-medium"
                              >
                                <Pencil className="w-3.5 h-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => deleteCategory(cat.id)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-destructive/10 text-destructive hover:bg-destructive/20 rounded-lg transition-colors text-xs font-medium"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    );
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        }

        {/* Orders */}
        {tab === 'orders' &&
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-lg font-display font-semibold text-foreground">{t('admin.ordersTitle')}</h2>
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder={t('order.searchPlaceholder')}
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  className="w-full sm:w-80 px-4 py-2 pl-10 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                {orderSearch && (
                  <button
                    onClick={() => setOrderSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
            {/* Filter orders based on search */}
            {(() => {
              const filteredOrders = orders.filter((o) => {
                if (!orderSearch.trim()) return true;
                const searchTerm = orderSearch.toLowerCase();
                const statusLabels = [
                  o.status,
                  t(`order.status.${o.status}`, { lng: 'en' }),
                  t(`order.status.${o.status}`, { lng: 'ar' }),
                ].filter(Boolean) as string[];

                const statusMatch = statusLabels.some((label) => label.toLowerCase().includes(searchTerm));

                return (
                  statusMatch ||
                  (o.shipping_name?.toLowerCase() || '').includes(searchTerm) ||
                  (o.shipping_email?.toLowerCase() || '').includes(searchTerm) ||
                  (o.id?.toLowerCase() || '').includes(searchTerm) ||
                  (o.shipping_country?.toLowerCase() || '').includes(searchTerm) ||
                  (o.shipping_city?.toLowerCase() || '').includes(searchTerm)
                );
              });

              return (
                <>
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 bg-card rounded-xl border border-border">
                      <Package className="w-12 h-12 text-muted-foreground mx-auto opacity-50 mb-3" />
                      <p className="text-muted-foreground">
                        {orderSearch.trim() ? t('order.noMatch') : t('order.noOrders')}
                      </p>
                    </div>
                  ) : (
                    filteredOrders.map((o) =>
          <div key={o.id} className="bg-card rounded-xl border border-border p-5 shadow-luxury">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{t('admin.orderId')}</p>
                    <p className="font-mono text-sm text-foreground">{o.id.slice(0, 8)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('admin.customer')}</p>
                    <p className="text-sm text-foreground">{o.shipping_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('admin.total')}</p>
                    <p className="font-bold text-foreground">${Number(o.total).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('admin.date')}</p>
                    <p className="text-sm text-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                  </div>
                  <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground">
                    <option value="pending">{t('order.status.pending')}</option>
                    <option value="processing">{t('order.status.processing')}</option>
                    <option value="shipped">{t('order.status.shipped')}</option>
                    <option value="delivered">{t('order.status.delivered')}</option>
                    <option value="cancelled">{t('order.status.cancelled')}</option>
                  </select>
                  <button onClick={() => deleteOrder(o.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title={t('admin.deleteOrderTitle')}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setExpandedOrders((prev) => {
                        const next = new Set(prev);
                        if (next.has(o.id)) next.delete(o.id);
                        else next.add(o.id);
                        return next;
                      });
                    }}
                    className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title={t('admin.toggleCustomerDetails')}
                  >
                    {expandedOrders.has(o.id) ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {expandedOrders.has(o.id) && (
                  <div className="border-t border-border pt-3 text-sm space-y-1">
                    <p><strong>Email:</strong> {o.shipping_email || '—'}</p>
                    <p><strong>Phone:</strong> {o.shipping_phone || '—'}</p>
                    <p><strong>Country:</strong> {o.shipping_country || '—'}</p>
                    <p><strong>City:</strong> {o.shipping_city || '—'}</p>
                    <p><strong>Address:</strong> {o.shipping_address || '—'}</p>
                  </div>
                )}
                {o.order_items && o.order_items.length > 0 &&
            <div className="border-t border-border pt-3 space-y-2">
                    {o.order_items.map((item, i) =>
              <div key={i} className="flex items-center gap-3">
                        {item.product_image_url ?
                <img src={item.product_image_url} alt={item.product_name} className="w-10 h-10 rounded-lg object-cover border border-border shrink-0" /> :

                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5 text-muted-foreground" />
                          </div>
                }
                        <p className="text-sm text-muted-foreground">{item.quantity}x {item.product_name} — ${Number(item.price).toLocaleString()}</p>
                      </div>
              )}
                  </div>
            }
              </div>
          )
                  )}
                </>
              );
            })()}
          </div>
        }

        {/* Certificates */}
        {tab === 'certificates' && <CertificatesTab />}

        {/* Exhibitions */}
        {tab === 'exhibitions' && <AdminExhibitions />}

        {/* Messages */}
        {tab === 'messages' && (
          <div className="space-y-4">
            <h2 className="text-lg font-display font-semibold text-foreground mb-4">{t('admin.messagesTitle')}</h2>
            {messages.length === 0 && <p className="text-muted-foreground">No messages yet.</p>}
            {messages.map((m) => (
              <div key={m.id} className={`bg-card rounded-xl border border-border p-5 shadow-luxury ${!m.read ? 'border-l-4 border-l-accent' : ''}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-foreground">{m.name}</p>
                    <p className="text-sm text-muted-foreground">{m.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!m.read && <span className="w-2 h-2 rounded-full bg-red-500" />}
                    <span className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</span>
                    <button onClick={() => deleteMessage(m.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Delete message">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-foreground">{m.message}</p>
                {!m.read && (
                  <button
                    onClick={async () => {
                      await supabase.from('contact_messages').update({ read: true }).eq('id', m.id);
                      setMessages((prev) => prev.map((msg) => (msg.id === m.id ? { ...msg, read: true } : msg)));
                    }}
                    className="mt-2 text-xs text-accent hover:underline"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Quotes */}
        {tab === 'quotes' && <AdminQuotesTab />}

        {/* Users */}
        {tab === 'users' &&
        <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-display font-semibold text-foreground">{t('admin.usersTitle')} ({regularUsers.length})</h2>
            </div>
            {regularUsers.length === 0 && <p className="text-muted-foreground">{t('admin.noUsersYet')}</p>}
            <div className="grid gap-4">
              {regularUsers.map((u) =>
            <div key={u.id} className="flex flex-wrap items-center gap-4 bg-card rounded-xl border border-border p-5 shadow-luxury">
                  <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center font-bold text-lg shrink-0 text-gray-50">
                    {(u.full_name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{u.full_name || t('admin.noName')}</p>
                    <p className="text-sm text-muted-foreground">{u.email}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      {u.phone && <span>📞 {u.phone}</span>}
                      {u.country && <span>🌍 {u.country}</span>}
                      <span>{t('admin.joined')}: {new Date(u.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button onClick={() => deleteUser(u.user_id)} className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
            )}
            </div>
          </div>
        }

        {/* Newsletter */}
        {tab === 'newsletter' && <NewsletterTab />}

        {/* Settings */}
        {tab === 'settings' && <AdminSettingsTab />}
          </div>
        </main>
      </div>
    </AdminErrorBoundary>
  );

};

/* ─── Enhanced Newsletter Tab ─── */
const NewsletterTab = () => {
  const { t } = useTranslation();
  const { markNewsletterAsRead } = useAdminNotifications();
  const [subscribers, setSubscribers] = useState<{id: string;email: string;created_at: string;read: boolean;}[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [readFilter, setReadFilter] = useState<'All' | 'Read' | 'Unread'>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'email'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [confirmModal, setConfirmModal] = useState<{open: boolean;id: string;email: string;} | null>(null);
  const itemsPerPage = 10;

  // mark anything unread as read whenever the newsletter tab mounts
  useEffect(() => {
    markNewsletterAsRead();
    fetchSubscribers();
  }, [markNewsletterAsRead]);

  const fetchSubscribers = async () => {
    setLoading(true);
    const { data } = await supabase.from('newsletter_subscribers').select('*').order('created_at', { ascending: false });
    setSubscribers(data ?? []);
    setLoading(false);
  };

  const deleteSubscriber = async (id: string) => {
    await supabase.from('newsletter_subscribers').delete().eq('id', id);
    setSubscribers((prev) => prev.filter((s) => s.id !== id));
    toast.success('Subscriber removed');
    setConfirmModal(null);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      console.error('Error marking subscriber as read:', error);
      return;
    }

    setSubscribers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, read: true } : s))
    );
  };

  // Filter and sort subscribers
  const filteredSubscribers = subscribers
    .filter((s) => {
      const matchesSearch = (s.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      const matchesReadFilter = readFilter === 'All' || 
        (readFilter === 'Read' && s.read) || 
        (readFilter === 'Unread' && !s.read);
      return matchesSearch && matchesReadFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'email':
          return a.email.localeCompare(b.email);
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  // Pagination
  const totalPages = Math.ceil(filteredSubscribers.length / itemsPerPage);
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const stats = {
    total: subscribers.length,
    read: subscribers.filter(s => s.read).length,
    unread: subscribers.filter(s => !s.read).length,
  };

  const exportCSV = () => {
    const csv = ['Email,Subscribed At,Status', ...filteredSubscribers.map((s) => `${s.email},${new Date(s.created_at).toLocaleDateString()},${s.read ? t('admin.newsletter.stats.read') : t('admin.newsletter.stats.unread')}`)].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscribers-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <Mail className="w-6 h-6 text-primary" />
            {t('admin.newsletter.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('admin.newsletter.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { label: t('admin.newsletter.stats.total'), value: stats.total, icon: Mail, color: 'primary' },
          { label: t('admin.newsletter.stats.read'), value: stats.read, icon: Eye, color: 'green' },
          { label: t('admin.newsletter.stats.unread'), value: stats.unread, icon: EyeOff, color: 'amber' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl border border-border p-4 shadow-luxury"
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg bg-${stat.color}/10 flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Read Filter */}
          <div className="flex gap-2">
            {(['All', 'Read', 'Unread'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setReadFilter(filter);
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                  readFilter === filter
                    ? 'bg-gradient-gold text-white'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {filter === 'All' ? t('admin.newsletter.filter.all') : filter === 'Read' ? t('admin.newsletter.filter.read') : t('admin.newsletter.filter.unread')}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="newest">{t('admin.newsletter.sort.newest')}</option>
            <option value="oldest">{t('admin.newsletter.sort.oldest')}</option>
            <option value="email">{t('admin.newsletter.sort.email')}</option>
          </select>
        </div>

        <div className="flex gap-3">
          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder={t('admin.newsletter.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring w-64"
            />
            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Export */}
          <button onClick={exportCSV} disabled={filteredSubscribers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
            <Download className="w-4 h-4" /> {t('admin.newsletter.exportButton')}
          </button>
        </div>
      </div>

      {/* Subscribers List */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('admin.newsletter.loading')}</p>
        </div>
      )}

      {!loading && paginatedSubscribers.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto opacity-50 mb-3" />
          <p className="text-muted-foreground">{t('admin.newsletter.noSubscribers')}</p>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {paginatedSubscribers.map((subscriber) => (
            <motion.div
              key={subscriber.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`bg-card rounded-xl border ${
                !subscriber.read
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border'
              } p-4 shadow-luxury transition-all`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {!subscriber.read && (
                    <button
                      onClick={() => markAsRead(subscriber.id)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                      title="Mark as read"
                    >
                      <EyeOff className="w-4 h-4 text-primary" />
                    </button>
                  )}
                  {subscriber.read && (
                    <div className="p-1.5 flex-shrink-0">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}

                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{subscriber.email}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {t('admin.newsletter.subscribed')}: {new Date(subscriber.created_at).toLocaleDateString()}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                        subscriber.read
                          ? 'bg-green-500/10 text-green-700 border border-green-200'
                          : 'bg-amber-500/10 text-amber-700 border border-amber-200'
                      }`}>
                        {subscriber.read ? t('admin.newsletter.stats.read') : t('admin.newsletter.stats.unread')}
                      </span>
                    </div>
                  </div>
                </div>

                <button onClick={() => setConfirmModal({ open: true, id: subscriber.id, email: subscriber.email })}
                  className="p-2 text-destructive hover:text-destructive/80 hover:bg-destructive/10 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>

          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages} ({filteredSubscribers.length} subscribers)
          </span>

          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Confirm Modal */}
      <AnimatePresence>
        {confirmModal?.open &&
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setConfirmModal(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card rounded-2xl border border-border p-6 shadow-luxury w-full max-w-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <h3 className="font-display font-bold text-foreground">Remove Subscriber</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">Remove <strong>{confirmModal.email}</strong> from the newsletter list?</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmModal(null)} className="flex-1 px-4 py-2.5 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors">Cancel</button>
                <button onClick={() => deleteSubscriber(confirmModal.id)} className="flex-1 px-4 py-2.5 bg-destructive text-destructive-foreground rounded-lg text-sm font-medium hover:bg-destructive/90 transition-colors">Remove</button>
              </div>
            </motion.div>
          </div>
        }
      </AnimatePresence>
    </div>);

};

/* ─── Admin Settings Tab ─── */
const AdminSettingsTab = () => {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [email, setEmail] = useState(profile?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [country, setCountry] = useState(profile?.country || '');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    // Update profile table
    const { error: profileError } = await supabase.from('profiles').update({
      full_name: fullName,
      email,
      phone,
      country
    }).eq('user_id', user.id);

    if (profileError) {
      toast.error(profileError.message);
      setSaving(false);
      return;
    }

    // Update auth email if changed
    if (email !== user.email) {
      const { error: emailError } = await supabase.auth.updateUser({ email });
      if (emailError) {
        toast.error('Email update: ' + emailError.message);
        setSaving(false);
        return;
      }
      toast.info('A confirmation email has been sent to verify your new email address.');
    }

    // Update password if provided
    if (newPassword.trim()) {
      if (newPassword.length < 6) {
        toast.error('Password must be at least 6 characters');
        setSaving(false);
        return;
      }
      const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
      if (pwError) {
        toast.error('Password update: ' + pwError.message);
        setSaving(false);
        return;
      }
      setNewPassword('');
      toast.success('Password updated successfully');
    }

    toast.success('Profile updated successfully');
    setSaving(false);
  };

  return (
    <div className="max-w-2xl">
      <h2 className="text-lg font-display font-semibold text-foreground mb-6">{t('admin.settings.title')}</h2>
      <form onSubmit={handleSaveProfile} className="bg-card rounded-xl border border-border p-6 shadow-luxury space-y-5">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">{t('admin.settings.fullName')}</label>
          <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">{t('admin.settings.email')}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">{t('admin.settings.phone')}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">{t('admin.settings.country')}</label>
          <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
          className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">{t('admin.settings.newPassword')} <span className="text-muted-foreground font-normal">{t('admin.settings.leaveBlank')}</span></label>
          <div className="relative">
            <input type={showPassword ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder={t('admin.settings.passwordPlaceholder')}
            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-10" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button type="submit" disabled={saving}
        className="w-full px-6 py-3 bg-gradient-gold rounded-lg font-semibold text-white hover:opacity-90 transition-all shadow-gold disabled:opacity-50">
          {saving ? t('admin.settings.saving') : t('admin.settings.saveChanges')}
        </button>
      </form>
    </div>);

};

/* ─── Certificates Tab ─── */
const CertificatesTab = () => {
  const { t } = useTranslation();
  const [certs, setCerts] = useState<{id: string;title: string;title_ar: string;type: string;file_url: string;}[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {fetchCerts();}, []);

  const fetchCerts = async () => {
    const { data } = await supabase.from<Certificate>('certificates').select('*').order('created_at', { ascending: false });
    setCerts(data ?? []);
  };

  const uploadCert = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const titleAr = formData.get('title_ar') as string;
    const type = formData.get('type') as string;

    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!title?.trim()) {
      toast.error('Please enter a title for the certificate');
      return;
    }

    setUploading(true);
    try {
      const path = `${Date.now()}-${file.name}`;
      const { error: uploadErr } = await supabase.storage.from('certificates').upload(path, file);
      if (uploadErr) {
        throw new Error(uploadErr.message);
      }

      const { data: urlData } = supabase.storage.from('certificates').getPublicUrl(path);
      const { error } = await supabase.from('certificates').insert({
        title: title.trim(),
        title_ar: titleAr?.trim() || '',
        type: type || 'ISO',
        file_url: urlData.publicUrl
      });

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Certificate uploaded successfully');
      // Safely reset the form
      if (form && typeof form.reset === 'function') {
        form.reset();
      }
      fetchCerts();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload certificate');
    } finally {
      setUploading(false);
    }
  };

  const deleteCert = async (id: string) => {
    await supabase.from('certificates').delete().eq('id', id);
    toast.success('Certificate deleted');
    fetchCerts();
  };

  return (
    <div>
      <h2 className="text-lg font-display font-semibold text-foreground mb-4">{t('admin.certificates.title')}</h2>
      <form onSubmit={uploadCert} className="bg-card rounded-xl border border-border p-6 shadow-luxury mb-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <input name="title" required placeholder={t('admin.certificates.titleEn')} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
          <input name="title_ar" placeholder={t('admin.certificates.titleAr')} className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm" />
          <select name="type" className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm">
            <option value="ISO">ISO</option><option value="CE">CE</option><option value="FDA">FDA</option>
          </select>
        </div>
        <div className="flex gap-4 items-center">
          <input name="file" type="file" required accept="image/*,.pdf" className="text-sm text-foreground" />
          <button type="submit" disabled={uploading} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium disabled:opacity-50">
            {uploading ? t('admin.certificates.uploading') : t('admin.certificates.upload')}
          </button>
        </div>
      </form>
      <div className="grid gap-3">
        {certs.map((c) =>
        <div key={c.id} className="flex items-center gap-4 bg-card rounded-xl border border-border p-4 shadow-luxury">
            <div className="flex items-center gap-3 flex-1">
              <Award className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <h4 className="font-semibold text-foreground">{c.title}</h4>
                {c.title_ar && <p className="text-sm text-muted-foreground">{c.title_ar}</p>}
              </div>
            </div>
            <span className="px-2 py-1 rounded bg-accent/20 text-accent text-xs font-bold">{c.type}</span>
            <a
              href={c.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
              title="View Certificate"
            >
              <Eye className="w-4 h-4" />
            </a>
            <button onClick={() => deleteCert(c.id)} className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>);

};

export default Admin;