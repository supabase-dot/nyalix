import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  ThumbsUp,
  Trash2,
  Eye,
  EyeOff,
  Send,
  MapPin,
  Phone,
  Mail,
  Building2,
  Package,
  Calendar,
} from 'lucide-react';

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
  read: boolean;
  created_at: string;
}

const AdminQuotesTab = () => {
  const { t } = useTranslation();
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [editingResponse, setEditingResponse] = useState<{
    quoteId: string;
    response: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Responded' | 'Approved'>('All');
  const [showArchived, setShowArchived] = useState(false);

  const fetchQuotes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('quote_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (err) {
      toast.error(t('quote.admin.failedToLoad'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchQuotes();
    // Refresh every 10 seconds
    const interval = setInterval(fetchQuotes, 10000);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('quote_requests')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      toast.error(t('quote.admin.failedToUpdate'));
      return;
    }

    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, read: true } : q))
    );
  };

  const updateStatus = async (id: string, status: 'Pending' | 'Responded' | 'Approved') => {
    const { error } = await supabase
      .from('quote_requests')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error(t('quote.admin.failedToUpdate'));
      return;
    }

    setQuotes((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status } : q))
    );
    toast.success(t('quote.admin.statusUpdated'));
  };

  const saveResponse = async (id: string, response: string) => {
    if (!response.trim()) {
      toast.error(t('quote.admin.emptyResponse'));
      return;
    }

    const { error } = await supabase
      .from('quote_requests')
      .update({
        admin_response: response,
        admin_responded_at: new Date().toISOString(),
        status: 'Responded',
      })
      .eq('id', id);

    if (error) {
      toast.error(t('quote.admin.failedToSave'));
      return;
    }

    setQuotes((prev) =>
      prev.map((q) =>
        q.id === id
          ? {
              ...q,
              admin_response: response,
              admin_responded_at: new Date().toISOString(),
              status: 'Responded',
            }
          : q
      )
    );
    setEditingResponse(null);
    toast.success(t('quote.admin.responseSaved'));
  };

  const deleteQuote = async (id: string) => {
    if (!confirm(t('quote.admin.deleteConfirm'))) return;

    const { error } = await supabase
      .from('quote_requests')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(t('quote.admin.failedToDelete'));
      return;
    }

    setQuotes((prev) => prev.filter((q) => q.id !== id));
    toast.success(t('quote.admin.quoteDeleted'));
  };

  const filteredQuotes = quotes.filter((q) => {
    if (statusFilter === 'All') return true;
    return q.status === statusFilter;
  });

  const stats = {
    total: quotes.length,
    pending: quotes.filter((q) => q.status === 'Pending').length,
    responded: quotes.filter((q) => q.status === 'Responded').length,
    approved: quotes.filter((q) => q.status === 'Approved').length,
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'Responded':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return null;
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-amber-500/10 text-amber-700 border-amber-200';
      case 'Responded':
        return 'bg-blue-500/10 text-blue-700 border-blue-200';
      case 'Approved':
        return 'bg-green-500/10 text-green-700 border-green-200';
      default:
        return 'bg-gray-500/10 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            {t('quote.admin.title')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t('quote.admin.subtitle')}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t('quote.admin.stats.total'), value: stats.total, icon: MessageSquare, color: 'primary' },
          { label: t('quote.admin.stats.pending'), value: stats.pending, icon: Clock, color: 'amber' },
          { label: t('quote.admin.stats.responded'), value: stats.responded, icon: MessageSquare, color: 'blue' },
          { label: t('quote.admin.stats.approved'), value: stats.approved, icon: CheckCircle, color: 'green' },
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

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['All', 'Pending', 'Responded', 'Approved'] as const).map((filter) => (
          <button
            key={filter}
            onClick={() => setStatusFilter(filter)}
            className={`px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap transition-all ${
              statusFilter === filter
                ? 'bg-gradient-gold text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {filter === 'All' ? 'All' : t(`quote.admin.stats.${filter.toLowerCase()}`)}
          </button>
        ))}
      </div>

      {/* Quotes List */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{t('quote.admin.loadingMessage')}</p>
        </div>
      )}

      {!loading && filteredQuotes.length === 0 && (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto opacity-50 mb-3" />
          <p className="text-muted-foreground">{t('quote.admin.noRequests')}</p>
        </div>
      )}

      <div className="space-y-4">
        <AnimatePresence>
          {filteredQuotes.map((quote) => (
            <motion.div
              key={quote.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`bg-card rounded-xl border ${
                !quote.read
                  ? 'border-primary/50 bg-primary/5'
                  : 'border-border'
              } p-4 shadow-luxury transition-all`}
            >
              {/* Quote Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-start gap-3 mb-2">
                    <button
                      onClick={() => markAsRead(quote.id)}
                      className="p-1.5 hover:bg-muted rounded-lg transition-colors flex-shrink-0 mt-1"
                      title={t('quote.admin.markAsRead')}
                    >
                      {quote.read ? (
                        <Eye className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-primary" />
                      )}
                    </button>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground text-lg">{quote.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {quote.company}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${getStatusBg(quote.status)}`}>
                      {getStatusIcon(quote.status)}
                      {quote.status === 'Pending' ? t('quote.admin.stats.pending') : 
                       quote.status === 'Responded' ? t('quote.admin.stats.responded') :
                       quote.status === 'Approved' ? t('quote.admin.stats.approved') : quote.status}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                      <Package className="w-3 h-3" />
                      {t('quote.admin.quantity')}: {quote.quantity}
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border">
                      <Calendar className="w-3 h-3" />
                      {new Date(quote.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() =>
                    setExpandedQuote(
                      expandedQuote === quote.id ? null : quote.id
                    )
                  }
                  className="p-2 hover:bg-muted rounded-lg transition-colors flex-shrink-0"
                >
                  <MessageSquare className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              {/* Quick Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 pb-4 border-b border-border">
                <a
                  href={`mailto:${quote.email}`}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{quote.email}</span>
                </a>
                <a
                  href={`tel:${quote.phone}`}
                  className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors"
                >
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{quote.phone}</span>
                </a>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>{quote.country}</span>
                </div>
              </div>

              {/* Product Info */}
              <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="w-4 h-4 text-primary" />
                  <span className="font-medium text-foreground">{quote.product_name}</span>
                </div>
                {quote.message && (
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {quote.message}
                  </p>
                )}
              </div>

              {/* Expanded Details */}
              <AnimatePresence>
                {expandedQuote === quote.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 pt-4 border-t border-border"
                  >
                    {/* Status Update Buttons */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">{t('quote.admin.updateStatus')}</p>
                      <div className="flex gap-2 flex-wrap">
                        {(['Pending', 'Responded', 'Approved'] as const).map((status) => (
                          <button
                            key={status}
                            onClick={() => updateStatus(quote.id, status)}
                            disabled={quote.status === status}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                              quote.status === status
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {status === 'Pending' ? t('quote.admin.stats.pending') : 
                             status === 'Responded' ? t('quote.admin.stats.responded') :
                             status === 'Approved' ? t('quote.admin.stats.approved') : status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Admin Response */}
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">{t('quote.admin.adminResponse')}</p>
                      {editingResponse?.quoteId === quote.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingResponse.response}
                            onChange={(e) =>
                              setEditingResponse({
                                ...editingResponse,
                                response: e.target.value,
                              })
                            }
                            placeholder={t('quote.admin.enterResponse')}
                            rows={4}
                            className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() =>
                                saveResponse(quote.id, editingResponse.response)
                              }
                              className="flex-1 px-4 py-2 bg-gradient-gold text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-all flex items-center justify-center gap-2"
                            >
                              <Send className="w-4 h-4" />
                              {t('quote.admin.saveResponse')}
                            </button>
                            <button
                              onClick={() => setEditingResponse(null)}
                              className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg font-medium hover:bg-muted/80 transition-all"
                            >
                              {t('quote.admin.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : quote.admin_response ? (
                        <div className="bg-muted/50 rounded-lg border border-border p-4">
                          <p className="text-sm text-foreground leading-relaxed">
                            {quote.admin_response}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(
                              quote.admin_responded_at || ''
                            ).toLocaleString()}
                          </p>
                          <button
                            onClick={() =>
                              setEditingResponse({
                                quoteId: quote.id,
                                response: quote.admin_response || '',
                              })
                            }
                            className="mt-2 text-sm text-primary hover:text-primary/80 transition-colors"
                          >
                            {t('quote.admin.editResponse')}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            setEditingResponse({
                              quoteId: quote.id,
                              response: '',
                            })
                          }
                          className="w-full px-4 py-2 bg-primary/10 text-primary rounded-lg font-medium hover:bg-primary/20 transition-all flex items-center justify-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          {t('quote.admin.addResponse')}
                        </button>
                      )}
                    </div>

                    {/* Delete Button */}
                    <button
                      onClick={() => deleteQuote(quote.id)}
                      className="w-full px-4 py-2 bg-destructive/10 text-destructive rounded-lg font-medium hover:bg-destructive/20 transition-all flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      {t('quote.admin.deleteRequest')}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdminQuotesTab;
