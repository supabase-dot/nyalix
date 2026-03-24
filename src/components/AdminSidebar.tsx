import React from 'react';
import { type LucideIcon, BarChart3, Package, ShoppingBag, Award, ImageIcon, MessageSquare, Mail, Users, Settings, X, Tags, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export type AdminTab = 'dashboard' | 'products' | 'categories' | 'orders' | 'certificates' | 'exhibitions' | 'messages' | 'quotes' | 'users' | 'newsletter' | 'settings';

interface SidebarItem {
  key: AdminTab;
  icon: LucideIcon;
  label: string;
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
  { key: 'dashboard', icon: BarChart3, label: 'Dashboard' },
  { key: 'products', icon: Package, label: 'Products' },
  { key: 'categories', icon: Tags, label: 'Categories' },
  { key: 'orders', icon: ShoppingBag, label: 'Orders' },
  { key: 'certificates', icon: Award, label: 'Certificates' },
  { key: 'exhibitions', icon: ImageIcon, label: 'Exhibitions' },
  { key: 'messages', icon: MessageSquare, label: 'Messages' },
  { key: 'quotes', icon: FileText, label: 'Quotes' },
  { key: 'newsletter', icon: Mail, label: 'Newsletter' },
  { key: 'users', icon: Users, label: 'Users' },
  { key: 'settings', icon: Settings, label: 'Settings' },
];

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
        className="absolute top-6 right-4 p-2 hover:bg-muted rounded-lg transition-colors"
      >
        <X className="w-5 h-5 text-muted-foreground" />
      </button>
    )}

    {/* Navigation Items */}
    <nav className="flex-1 px-4 py-6 space-y-2">
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
              'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative',
              isActive
                ? 'bg-gradient-gold text-primary-foreground shadow-md'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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

    {/* Footer info */}
    <div className="px-4 py-4 border-t border-border">
      <p className="text-xs text-muted-foreground text-center">
        Admin Dashboard v1.0
      </p>
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
  const sidebarItems = items.map((item) => ({
    ...item,
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
            className="fixed inset-0 z-30 bg-black/50 lg:hidden\"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Desktop (Always Visible) */}
      <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:z-30 lg:h-screen lg:w-64 lg:bg-gradient-to-b lg:from-card lg:to-card/95 lg:border-r lg:border-border lg:shadow-luxury lg:pt-16 lg:overflow-y-auto lg:flex lg:flex-col">
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
          x: isOpen ? 0 : -280,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed left-0 top-0 z-40 h-screen w-64 bg-gradient-to-b from-card to-card/95 border-r border-border shadow-luxury pt-16 overflow-y-auto flex flex-col lg:hidden"
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
