import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { sendEmail } from '@/lib/notifications';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  MessageSquare,
  Clock,
  CheckCircle,
  Trash2,
  Eye,
  EyeOff,
  Send,
  Mail,
  Phone,
  Globe,
  X,
  ChevronDown,
  ChevronUp,
  Edit2,
} from 'lucide-react';

interface ContactMessage {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  message: string;
  shipping_phone?: string;
  shipping_country?: string;
  status: 'new' | 'replied' | 'resolved';
  is_edited: boolean;
  edited_at?: string;
  edit_count: number;
  read: boolean;
  created_at: string;
}

interface ContactMessageReply {
  id: string;
  message_id: string;
  admin_user_id: string | null;
  reply_text: string;
  read_by_user: boolean;
  created_at: string;
}

const statusConfig: Record<string, { icon: React.ComponentType<any>; color: string; bg: string; label: string }> = {
  new: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100', label: 'New' },
  replied: { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-100', label: 'Replied' },
  resolved: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100', label: 'Resolved' }
};

const AdminMessagesTab = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [replies, setReplies] = useState<Record<string, ContactMessageReply[]>>({});
  const [loading, setLoading] = useState(true);
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null);
  const [editingReply, setEditingReply] = useState<{
    messageId: string;
    replyText: string;
  } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'All' | 'new' | 'replied' | 'resolved'>('All');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);

      // Fetch replies for all messages
      const { data: repliesData } = await supabase
        .from('contact_message_replies')
        .select('*')
        .order('created_at', { ascending: true });

      if (repliesData) {
        const repliesByMessageId: Record<string, ContactMessageReply[]> = {};
        repliesData.forEach((reply) => {
          if (!repliesByMessageId[reply.message_id]) {
            repliesByMessageId[reply.message_id] = [];
          }
          repliesByMessageId[reply.message_id].push(reply);
        });
        setReplies(repliesByMessageId);
      }
    } catch (err) {
      toast.error('Failed to load messages');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ read: true })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update message');
      return;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, read: true } : m))
    );
  };

  const updateStatus = async (id: string, status: 'new' | 'replied' | 'resolved') => {
    const { error } = await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id);

    if (error) {
      toast.error(t('admin.messages.failedToUpdate'));
      return;
    }

    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
    toast.success(t('admin.messages.statusUpdated'));

    // Send email notification
    try {
      const message = messages.find((m) => m.id === id);
      if (message) {
        const emailType = status === 'replied' ? 'contact_replied' : 'contact_resolved';
        await sendEmail(emailType, message.email, { messageId: id, status });
        toast.success(t('admin.messages.notificationSent'));
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
    }
  };

  const saveReply = async (messageId: string, replyText: string) => {
    if (!replyText.trim()) {
      toast.error(t('admin.messages.replyEmpty'));
      return;
    }

    const { error: replyError } = await supabase
      .from('contact_message_replies')
      .insert({
        message_id: messageId,
        reply_text: replyText,
        read_by_user: false,
      });

    if (replyError) {
      toast.error(t('admin.messages.failedToSave'));
      return;
    }

    // Update message status to replied
    await updateStatus(messageId, 'replied');

    // Send notification email to user
    try {
      const message = messages.find((m) => m.id === messageId);
      if (message) {
        await sendEmail('contact_replied', message.email, { 
          messageId: messageId,
          reply: replyText.substring(0, 200),
        });
      }
    } catch (emailError) {
      console.error('Failed to send reply notification:', emailError);
    }

    // Refetch to get the new reply
    await fetchMessages();
    setEditingReply(null);
    toast.success(t('admin.messages.replySent'));
  };

  const deleteMessage = async (id: string) => {
    if (!confirm(t('admin.messages.deleteConfirm'))) {
      return;
    }

    const { error } = await supabase
      .from('contact_messages')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error(t('admin.messages.failedToDelete'));
      return;
    }

    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast.success(t('admin.toast.messageDeleted'));
  };

  const deleteReply = async (replyId: string) => {
    if (!confirm(t('admin.messages.replyDeleteConfirm'))) {
      return;
    }

    const { error } = await supabase
      .from('contact_message_replies')
      .delete()
      .eq('id', replyId);

    if (error) {
      toast.error(t('admin.messages.failedToDeleteReply'));
      return;
    }

    toast.success(t('admin.messages.replyDeleted'));
    await fetchMessages();
  };

  // Filter and search messages
  const filteredMessages = messages.filter((m) => {
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.message.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const stats = {
    total: messages.length,
    new: messages.filter((m) => m.status === 'new').length,
    replied: messages.filter((m) => m.status === 'replied').length,
    resolved: messages.filter((m) => m.status === 'resolved').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-display font-semibold text-foreground">
            {t('admin.messages.title')} ({stats.total})
          </h2>
          <div className="flex flex-wrap gap-2">
            {(['All', 'new', 'replied', 'resolved'] as const).map((status) => {
              const statusLabel = status === 'All' ? t('admin.messages.stats.all') :
                                  status === 'new' ? t('admin.messages.status.new') :
                                  status === 'replied' ? t('admin.messages.status.replied') :
                                  t('admin.messages.status.resolved');
              return (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-gradient-gold text-white'
                      : 'bg-muted text-muted-foreground hover:bg-border'
                  }`}
                >
                  {statusLabel}
                  {status !== 'All' && (
                    <span className="ml-2 text-xs">({stats[status as keyof typeof stats]})</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder={t('admin.messages.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t('admin.messages.loading')}</p>
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-xl border border-border">
          <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto opacity-50 mb-3" />
          <p className="text-muted-foreground">{t('admin.messages.noMessages')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredMessages.map((message) => {
            const messageReplies = replies[message.id] || [];
            const isExpanded = expandedMessage === message.id;
            const StatusIcon = statusConfig[message.status]?.icon || Clock;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-xl overflow-hidden shadow-luxury transition-all ${
                  message.read ? 'border-border' : 'border-l-4 border-l-accent bg-accent/5 border-border'
                }`}
              >
                {/* Message Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    setExpandedMessage(isExpanded ? null : message.id);
                    if (!message.read) markAsRead(message.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedMessage(isExpanded ? null : message.id);
                      if (!message.read) markAsRead(message.id);
                    }
                  }}
                  className="w-full bg-card p-4 hover:bg-muted/50 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{message.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{message.email}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!message.read && (
                            <div className="w-2.5 h-2.5 rounded-full bg-accent" title="Unread" />
                          )}
                          {message.is_edited && (
                            <Edit2 className="w-4 h-4 text-orange-500" title={`Edited ${message.edit_count}x`} />
                          )}
                          <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${statusConfig[message.status]?.bg} ${statusConfig[message.status]?.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {message.status === 'new' && t('admin.messages.status.new')}
                            {message.status === 'replied' && t('admin.messages.status.replied')}
                            {message.status === 'resolved' && t('admin.messages.status.resolved')}
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(message.created_at).toLocaleDateString()} at{' '}
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMessage(message.id);
                      }}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message Details (Expanded) */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-border bg-muted/30 p-4 space-y-4"
                    >
                      {/* Message Content */}
                      <div>
                        <h4 className="text-sm font-semibold text-foreground mb-2">{t('admin.messages.messageLabel')}</h4>
                        <p className="text-sm text-foreground whitespace-pre-wrap">{message.message}</p>
                        {message.is_edited && (
                          <p className="text-xs text-muted-foreground mt-2">
                            ✏️ {t('admin.messages.edited')} {message.edit_count}x, {t('admin.messages.lastEdit')}: {message.edited_at ? new Date(message.edited_at).toLocaleDateString() : 'N/A'}
                          </p>
                        )}
                      </div>

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
                      {messageReplies.length > 0 && (
                        <div className="pt-2 border-t border-border">
                          <h4 className="text-sm font-semibold text-foreground mb-3">{t('admin.messages.conversationHistory')}</h4>
                          <div className="space-y-3 bg-card rounded-lg p-3 border border-border">
                            {messageReplies.map((reply) => (
                              <div key={reply.id} className="border-l-2 border-accent pl-3">
                                <div className="flex justify-between items-start gap-2 mb-1">
                                  <p className="text-xs font-medium text-muted-foreground">{t('admin.messages.adminReply')}</p>
                                  <button
                                    onClick={() => deleteReply(reply.id)}
                                    className="p-0.5 text-destructive hover:bg-destructive/10 rounded transition-colors"
                                    title="Delete reply"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-sm text-foreground whitespace-pre-wrap mb-1">{reply.reply_text}</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(reply.created_at).toLocaleDateString()} at{' '}
                                  {new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Reply Form */}
                      {editingReply?.messageId === message.id ? (
                        <div className="space-y-3 p-3 bg-card rounded-lg border border-border">
                          <textarea
                            value={editingReply.replyText}
                            onChange={(e) =>
                              setEditingReply({ messageId: message.id, replyText: e.target.value })
                            }
                            placeholder={t('admin.messages.replyPlaceholder')}
                            rows={4}
                            maxLength={1000}
                            className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveReply(message.id, editingReply.replyText)}
                              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gradient-gold text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                            >
                              <Send className="w-4 h-4" /> {t('admin.messages.sendReply')}
                            </button>
                            <button
                              onClick={() => setEditingReply(null)}
                              className="px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors"
                            >
                              {t('admin.messages.cancel')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2 pt-2 border-t border-border">
                          <button
                            onClick={() =>
                              setEditingReply({ messageId: message.id, replyText: '' })
                            }
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" /> {t('admin.messages.reply')}
                          </button>
                          <select
                            value={message.status}
                            onChange={(e) =>
                              updateStatus(message.id, e.target.value as 'new' | 'replied' | 'resolved')
                            }
                            className="px-3 py-2 bg-muted text-foreground rounded-lg text-sm font-medium hover:bg-border transition-colors"
                          >
                            {Object.entries(statusConfig).map(([key, val]) => {
                              const statusLabel = key === 'new' ? t('admin.messages.status.new') : 
                                                  key === 'replied' ? t('admin.messages.status.replied') : 
                                                  t('admin.messages.status.resolved');
                              return (
                                <option key={key} value={key}>
                                  {t('admin.messages.markAs')} {statusLabel}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminMessagesTab;
