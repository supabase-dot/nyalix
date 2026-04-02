import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { type LucideIcon, BarChart3, Package, ShoppingBag, Award, ImageIcon, MessageSquare, Mail, Users, Settings, X, Tags, FileText, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'certificates' | 'exhibitions' | 'messages' | 'quotes' | 'users' | 'newsletter' | 'settings';

interface SidebarItem {
  key: AdminTab;
  icon: LucideIcon;
  label?: string;
  badge?: number;
}

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  notifications: {
    orders: number;
    messages: number;
    users: number;
    newsletter: number;
    quotes: number;
  };
  isOpen?: boolean;
  onClose?: () => void;
}

const items: SidebarItem[] = [
  { key: 'dashboard', icon: BarChart3 },
  { key: 'products', icon: Package },
  { key: 'categories', icon: Tags },
  { key: 'orders', icon: ShoppingBag },
  { key: 'certificates', icon: Award },
  { key: 'exhibitions', icon: ImageIcon },
  { key: 'messages', icon: MessageSquare },
  { key: 'quotes', icon: FileText },
  { key: 'newsletter', icon: Mail },
  { key: 'users', icon: Users },
  { key: 'settings', icon: Settings },
];

// Logout button component
const LogoutButton: React.FC<{
  isMobile?: boolean;
  onClose?: () => void;
}> = ({ isMobile = false, onClose }) => {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!confirm(t('admin.settings.logoutConfirm'))) return;
    try {
      await signOut();
      toast.success('Logged out successfully');
      navigate('/');
      if (isMobile) onClose?.();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  return (
    <motion.button
      onClick={handleLogout}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className="w-full px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-red-600/10 hover:bg-red-600/20 text-red-600 hover:text-red-700 transition-all duration-200 flex items-center justify-center gap-2 font-medium text-sm"
    >
      <LogOut className="w-4 h-4" />
      {t('admin.settings.logout')}
    </motion.button>
  );
};

// Sidebar content component
const SidebarContent: React.FC<{
  sidebarItems: (SidebarItem & { badge?: number })[];
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  onClose?: () => void;
  isMobile?: boolean;
}> = ({ sidebarItems, activeTab, onTabChange, onClose, isMobile = false }) => (
  <>
    {/* Close button for mobile */}
    {isMobile && (
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 hover:bg-muted rounded-lg transition-colors z-10"
        aria-label="Close sidebar"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>
    )}

    {/* Navigation Items */}
    <nav className="flex-1 px-3 md:px-4 py-4 md:py-6 space-y-1 md:space-y-2 overflow-y-auto flex flex-col">
      {sidebarItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.key;

        return (
          <motion.button
            key={item.key}
            onClick={() => {
              onTabChange(item.key);
              if (isMobile) onClose?.();
            }}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              'w-full flex items-center gap-3 px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl transition-all duration-200 group relative',
              isActive
                ? 'bg-gradient-gold text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground active:bg-muted'
            )}
          >
            {/* Background glow for active item */}
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className="absolute inset-0 rounded-xl bg-gradient-gold opacity-10 -z-10"
              />
            )}

            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Icon className={cn('w-5 h-5 shrink-0 transition-all', isActive ? 'text-current' : 'group-hover:scale-110')} />
              <span className="font-medium truncate text-sm">{item.label}</span>
            </div>

            {/* Badge for notifications */}
            {item.badge && item.badge > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                className="ml-auto flex items-center justify-center"
              >
                <div className={cn(
                  'relative inline-flex items-center justify-center',
                  isActive ? 'text-primary-foreground' : 'text-white'
                )}>
                  {/* Red circular badge with white text */}
                  <div className={cn(
                    'flex items-center justify-center rounded-full text-xs font-bold',
                    'w-6 h-6 min-w-max',
                    'bg-red-500 text-white',
                    'shadow-md border border-red-600/50'
                  )}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </div>
                  {/* Animated pulse effect for new notifications */}
                  {item.badge > 0 && (
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute inset-0 rounded-full bg-red-500/30"
                    />
                  )}
                </div>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </nav>

    {/* Footer info and logout */}
    <div className="px-4 py-4 border-t border-border space-y-3">
      <p className="text-xs text-muted-foreground text-center">
        Admin Dashboard v1.0
      </p>
      <LogoutButton isMobile={isMobile} onClose={onClose} />
    </div>
  </>
);

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  activeTab,
  onTabChange,
  notifications,
  isOpen = true,
  onClose,
}) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();

  const sidebarItems = items.map((item) => ({
    ...item,
    label: t(`admin.sidebar.${item.key}`),
    badge:
      item.key === 'orders'
        ? notifications.orders
        : item.key === 'messages'
          ? notifications.messages
          : item.key === 'users'
            ? notifications.users
            : item.key === 'newsletter'
              ? notifications.newsletter
              : item.key === 'quotes'
                ? notifications.quotes
                : undefined,
  }));

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Desktop (Always Visible) */}
      <aside
        className={cn(
          'hidden lg:fixed lg:top-16 lg:z-30 lg:h-[calc(100vh-64px)] lg:w-64 lg:bg-gradient-to-b lg:from-card lg:to-card/95 lg:border-border lg:shadow-luxury lg:pt-16 lg:overflow-y-auto lg:flex lg:flex-col',
          isRTL ? 'lg:right-0 lg:left-auto lg:border-l lg:border-r-0' : 'lg:left-0 lg:right-auto lg:border-r lg:border-l-0'
        )}
      >
        <SidebarContent 
          sidebarItems={sidebarItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          isMobile={false}
        />
      </aside>

      {/* Sidebar Mobile (Toggleable) */}
      <motion.aside
        initial={false}
        animate={{
          x: isOpen ? 0 : isRTL ? 280 : -280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(
          'fixed top-14 md:top-16 z-40 h-[calc(100vh-56px)] md:h-[calc(100vh-64px)] w-64 bg-gradient-to-b from-card to-card/95 border-border shadow-luxury pt-14 md:pt-16 overflow-y-auto flex flex-col lg:hidden',
          isRTL ? 'right-0 border-l' : 'left-0 border-r'
        )}
      >
        <SidebarContent 
          sidebarItems={sidebarItems}
          activeTab={activeTab}
          onTabChange={onTabChange}
          onClose={onClose}
          isMobile={true}
        />
      </motion.aside>
    </>
  );
};
