import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, subMonths, startOfDay } from 'date-fns';
import * as Recharts from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegendContent,
} from '@/components/ui/chart';
import { Users, ShoppingBag, DollarSign, Clock, Package } from 'lucide-react';

// types (minimal) copied from Admin page
interface Order {
  id: string;
  status: string;
  total: number;
  shipping_name: string;
  shipping_country: string;
  created_at: string;
  user_id: string;
  order_items?: { product_name: string; quantity: number; price: number; product_image_url?: string }[];
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  country: string | null;
  created_at: string;
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
  specifications: Record<string, string>;
  featured: boolean;
  created_at: string;
  updated_at: string;
}

type Range = 'today' | '7d' | '30d' | '12m' | 'custom';

const RANGE_OPTIONS: { labelKey: string; value: Range }[] = [
  { labelKey: 'admin.analytics.range.today', value: 'today' },
  { labelKey: 'admin.analytics.range.7d', value: '7d' },
  { labelKey: 'admin.analytics.range.30d', value: '30d' },
  { labelKey: 'admin.analytics.range.12m', value: '12m' },
  { labelKey: 'admin.analytics.range.custom', value: 'custom' },
];

interface Props {
  orders: Order[];
  users: UserProfile[];
  products: Product[];
}

const AdminAnalytics: React.FC<Props> = ({ orders, users, products }) => {
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [range, setRange] = useState<Range>('30d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');

  const [views, setViews] = useState<{ product_id: string; created_at: string }[]>([]);

  // fetch all view records once; filtering occurs in memory
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('product_views').select('product_id,created_at');
      setViews(data ?? []);
    };
    load();
  }, []);

  // subscribe to new product views so dashboard stays up-to-date
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    
    const setupSubscription = () => {
      try {
        channel = supabase
          .channel('admin-product-views')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'product_views' }, (payload) => {
            try {
              setViews((prev) => [...prev, payload.new as { product_id: string; created_at: string }]);
            } catch (error) {
              console.warn('AdminAnalytics: Error updating views state:', error);
            }
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('AdminAnalytics: Successfully subscribed to product_views');
            } else if (status === 'CHANNEL_ERROR') {
              console.warn('AdminAnalytics: Failed to subscribe to product_views realtime, falling back to polling');
              // Could implement polling fallback here if needed
            } else if (status === 'TIMED_OUT') {
              console.warn('AdminAnalytics: Realtime subscription timed out, attempting reconnect');
              // Attempt to reconnect
              if (channel) {
                supabase.removeChannel(channel);
              }
              setTimeout(setupSubscription, 5000);
            } else if (status === 'CLOSED') {
              console.log('AdminAnalytics: Realtime subscription closed');
            }
          });
      } catch (error) {
        console.warn('AdminAnalytics: Error setting up realtime subscription:', error);
      }
    };

    setupSubscription();

    return () => {
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch (error) {
          console.warn('AdminAnalytics: Error removing channel:', error);
        }
      }
    };
  }, []);

  const [startDate, endDate] = useMemo(() => {
    const now = new Date();
    let start = new Date();
    let end = new Date();
    switch (range) {
      case 'today':
        start = startOfDay(now);
        break;
      case '7d':
        start = startOfDay(subDays(now, 6));
        break;
      case '30d':
        start = startOfDay(subDays(now, 29));
        break;
      case '12m':
        start = startOfDay(subMonths(now, 12));
        break;
      case 'custom':
        if (customStart) start = new Date(customStart);
        if (customEnd) end = new Date(customEnd);
        break;
    }
    return [start, end];
  }, [range, customStart, customEnd]);

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const d = new Date(o.created_at);
        return d >= startDate && d <= endDate;
      }),
    [orders, startDate, endDate],
  );

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        const d = new Date(u.created_at);
        return d >= startDate && d <= endDate;
      }),
    [users, startDate, endDate],
  );

  const filteredViews = useMemo(
    () =>
      views.filter((v) => {
        const d = new Date(v.created_at);
        return d >= startDate && d <= endDate;
      }),
    [views, startDate, endDate],
  );

  // utility to group by day
  type DayGroup = { date: string; count: number; revenue: number };
  const groupByDay = <T extends { created_at: string; total?: number }>(items: T[]) => {
    const map: Record<string, DayGroup> = {};
    items.forEach((it) => {
      const key = format(new Date(it.created_at), 'yyyy-MM-dd');
      if (!map[key]) map[key] = { date: key, count: 0, revenue: 0 };
      map[key].count += 1;
      if (typeof it.total === 'number') map[key].revenue += it.total;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  };

  const salesByDate = useMemo(() => {
    const map: Record<string, { date: string; revenue: number; orders: number }> = {};
    filteredOrders.forEach((o) => {
      const key = format(new Date(o.created_at), 'yyyy-MM-dd');
      if (!map[key]) map[key] = { date: key, revenue: 0, orders: 0 };
      map[key].revenue += Number(o.total || 0);
      map[key].orders += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  const ordersByDate = useMemo(() => {
    const map: Record<string, { date: string; orders: number }> = {};
    filteredOrders.forEach((o) => {
      const key = format(new Date(o.created_at), 'yyyy-MM-dd');
      if (!map[key]) map[key] = { date: key, orders: 0 };
      map[key].orders += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredOrders]);

  const statusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredOrders.forEach((o) => {
      counts[o.status] = (counts[o.status] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filteredOrders]);

  const registrationsByDate = useMemo(() => {
    const map: Record<string, { date: string; registrations: number }> = {};
    filteredUsers.forEach((u) => {
      const key = format(new Date(u.created_at), 'yyyy-MM-dd');
      if (!map[key]) map[key] = { date: key, registrations: 0 };
      map[key].registrations += 1;
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredUsers]);

  const activeUsersCount = useMemo(() => {
    const set = new Set(filteredOrders.map((o) => o.user_id));
    return set.size;
  }, [filteredOrders]);

  const newUsersCount = filteredUsers.length;

  const countryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredUsers.forEach((u) => {
      if (u.country) map[u.country] = (map[u.country] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({ country, count }));
  }, [filteredUsers]);

  const productSales = useMemo(() => {
    const map: Record<string, { quantity: number; revenue: number }> = {};
    filteredOrders.forEach((o) => {
      o.order_items?.forEach((item) => {
        if (!map[item.product_name]) map[item.product_name] = { quantity: 0, revenue: 0 };
        map[item.product_name].quantity += item.quantity;
        map[item.product_name].revenue += Number(item.price) * item.quantity;
      });
    });
    return Object.entries(map)
      .map(([name, { quantity, revenue }]) => ({ name, quantity, revenue }))
      .sort((a, b) => b.quantity - a.quantity);
  }, [filteredOrders]);

  const topProducts = useMemo(() => productSales.slice(0, 5), [productSales]);

  const revenueByProduct = useMemo(() => {
    return topProducts.map((p) => ({ name: p.name, revenue: p.revenue }));
  }, [topProducts]);

  const lowStock = useMemo(() => products.filter((p) => p.stock_quantity <= 5), [products]);

  const viewCounts = useMemo(() => {
    const map: Record<string, number> = {};
    filteredViews.forEach((v) => {
      map[v.product_id] = (map[v.product_id] || 0) + 1;
    });
    return Object.entries(map)
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);
  }, [filteredViews]);

  const mostViewedProducts = useMemo(() => {
    // map product id to name
    const idToName: Record<string, string> = {};
    products.forEach((p) => (idToName[p.id] = p.name));
    return viewCounts
      .map((v) => ({ name: idToName[v.id] || 'Unknown', count: v.count }))
      .slice(0, 5);
  }, [viewCounts, products]);

  // overview metrics for cards based on current range
  const overviewMetrics = useMemo(() => {
    const totalUsers = users.length;
    const newUsers = newUsersCount;
    const totalOrders = filteredOrders.length;
    const revenue = filteredOrders.reduce((s, o) => s + Number(o.total || 0), 0);
    const pending = filteredOrders.filter((o) => o.status === 'pending').length;
    const completed = filteredOrders.filter((o) => o.status === 'delivered').length;

    return { totalUsers, newUsers, totalOrders, revenue, pending, completed };
  }, [users.length, newUsersCount, filteredOrders]);

  // newly added products within the selected range
  const newlyAddedProducts = useMemo(() => {
    return products
      .filter((p) => {
        const d = new Date(p.created_at);
        return d >= startDate && d <= endDate;
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [products, startDate, endDate]);

  // product performance: combine sales data, views, and stock info
  const productPerformance = useMemo(() => {
    const idToProduct: Record<string, Product> = {};
    products.forEach((p) => (idToProduct[p.id] = p));

    const salesMap: Record<string, { quantity: number; revenue: number }> = {};
    filteredOrders.forEach((o) => {
      o.order_items?.forEach((item) => {
        if (!salesMap[item.product_name]) salesMap[item.product_name] = { quantity: 0, revenue: 0 };
        salesMap[item.product_name].quantity += item.quantity;
        salesMap[item.product_name].revenue += Number(item.price) * item.quantity;
      });
    });

    const viewsMap: Record<string, number> = {};
    filteredViews.forEach((v) => {
      viewsMap[v.product_id] = (viewsMap[v.product_id] || 0) + 1;
    });

    // combine all metrics per product
    const performance = products.map((p) => {
      const sales = salesMap[p.name] || { quantity: 0, revenue: 0 };
      const views = viewsMap[p.id] || 0;
      return {
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        stock: p.stock_quantity,
        views,
        orders: sales.quantity,
        revenue: sales.revenue,
        createdAt: p.created_at,
      };
    });

    return performance.sort((a, b) => (b.revenue + b.views) - (a.revenue + a.views));
  }, [products, filteredOrders, filteredViews]);

  const bestPerformingProducts = useMemo(() => productPerformance.slice(0, 5), [productPerformance]);


  return (
    <div className="space-y-8" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* filter controls */}
      <div className="flex flex-wrap gap-2 items-center">
        {RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setRange(opt.value)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              range === opt.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-foreground hover:bg-muted'
            }`}
          >
            {t(opt.labelKey)}
          </button>
        ))}
        {range === 'custom' && (
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 rounded-lg border border-border"
            />
            <span className="text-sm">{t('admin.analytics.to')}</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 rounded-lg border border-border"
            />
          </div>
        )}
      </div>

      {/* overview cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: t('admin.analytics.totalUsers'),
            value: overviewMetrics.totalUsers,
            icon: Users,
          },
          {
            label: t('admin.analytics.newUsers'),
            value: overviewMetrics.newUsers,
            icon: Users,
          },
          {
            label: t('admin.analytics.totalOrders'),
            value: overviewMetrics.totalOrders,
            icon: ShoppingBag,
          },
          {
            label: t('admin.analytics.revenue'),
            value: `$${overviewMetrics.revenue.toLocaleString()}`,
            icon: DollarSign,
          },
          {
            label: t('admin.analytics.pendingOrders'),
            value: overviewMetrics.pending,
            icon: Clock,
          },
          {
            label: t('admin.analytics.completedOrders'),
            value: overviewMetrics.completed,
            icon: Package,
          },
        ].map((s, i) => (
          <div
            key={i}
            className="relative bg-card rounded-xl border border-border p-6 shadow-luxury"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center">
                <s.icon className="w-6 h-6 text-gray-50" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* sales charts */}
      <div className="space-y-6">
        <h3 className="font-display font-semibold text-foreground">{t('admin.analytics.salesAnalytics')}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-4 shadow-luxury">
            <ChartContainer
              config={{ revenue: { label: t('admin.analytics.revenue'), color: '#10b981' } }}
            >
              <Recharts.LineChart data={salesByDate}>
                <Recharts.XAxis dataKey="date" />
                <Recharts.YAxis />
                <Recharts.Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-revenue)"
                />
                <ChartTooltipContent labelKey="date" />
              </Recharts.LineChart>
            </ChartContainer>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-luxury">
            <ChartContainer
              config={{ orders: { label: t('admin.analytics.totalOrders'), color: '#3b82f6' } }}
            >
              <Recharts.BarChart data={ordersByDate}>
                <Recharts.XAxis dataKey="date" />
                <Recharts.YAxis />
                <Recharts.Bar
                  dataKey="orders"
                  fill="var(--color-orders)"
                />
                <ChartTooltipContent labelKey="date" />
              </Recharts.BarChart>
            </ChartContainer>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-luxury lg:col-span-2">
            <ChartContainer config={{}}>
              <Recharts.PieChart>
                <Recharts.Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={80}
                  fill="#8884d8"
                  label
                />
                <ChartTooltipContent />
                <ChartLegendContent />
              </Recharts.PieChart>
            </ChartContainer>
          </div>
        </div>
      </div>

      {/* user charts */}
      <div className="space-y-6">
        <h3 className="font-display font-semibold text-foreground">{t('admin.analytics.userAnalytics')}</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-4 shadow-luxury">
            <ChartContainer
              config={{ registrations: { label: t('admin.analytics.newUsers'), color: '#6366f1' } }}
            >
              <Recharts.LineChart data={registrationsByDate}>
                <Recharts.XAxis dataKey="date" />
                <Recharts.YAxis />
                <Recharts.Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="var(--color-registrations)"
                />
                <ChartTooltipContent labelKey="date" />
              </Recharts.LineChart>
            </ChartContainer>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-luxury">
            <div className="text-sm text-muted-foreground mb-2">Active vs New</div>
            <div className="flex gap-4">
              <div className="flex-1 bg-card p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">{t('admin.analytics.activeUsers')}</p>
                <p className="text-xl font-bold">{activeUsersCount}</p>
              </div>
              <div className="flex-1 bg-card p-4 rounded-lg">
                <p className="text-xs text-muted-foreground">{t('admin.analytics.newUsersLabel')}</p>
                <p className="text-xl font-bold">{newUsersCount}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-luxury lg:col-span-2">
            <h4 className="text-sm font-medium text-foreground mb-2">{t('admin.analytics.topCountries')}</h4>
            <ul className="space-y-1">
              {countryCounts.map((c) => (
                <li key={c.country} className="flex justify-between">
                  <span>{c.country}</span>
                  <span className="font-medium">{c.count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* product charts */}
      <div className="space-y-6">
        <h3 className="font-display font-semibold text-foreground">{t('admin.analytics.productAnalytics')}</h3>
        
        {/* product performance overview */}
        <div className="bg-card rounded-xl border border-border p-4 shadow-luxury">
          <h4 className="text-sm font-medium text-foreground mb-4">{t('admin.analytics.productPerformanceOverview')}</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-2 px-2 text-muted-foreground">{t('admin.analytics.product')}</th>
                  <th className="text-right py-2 px-2 text-muted-foreground">{t('admin.analytics.views')}</th>
                  <th className="text-right py-2 px-2 text-muted-foreground">{t('admin.analytics.orders')}</th>
                  <th className="text-right py-2 px-2 text-muted-foreground">{t('admin.analytics.revenue')}</th>
                  <th className="text-right py-2 px-2 text-muted-foreground">{t('admin.analytics.stock')}</th>
                </tr>
              </thead>
              <tbody>
                {bestPerformingProducts.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-2 px-2 font-medium">{p.name}</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">{p.views}</td>
                    <td className="text-right py-2 px-2 text-muted-foreground">{p.orders}</td>
                    <td className="text-right py-2 px-2 font-medium">${p.revenue.toLocaleString()}</td>
                    <td className={`text-right py-2 px-2 ${p.stock <= 5 ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                      {p.stock}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* newly added products */}
        {newlyAddedProducts.length > 0 && (
          <div className="bg-card rounded-xl border border-border p-4 shadow-luxury">
            <h4 className="text-sm font-medium text-foreground mb-4">{t('admin.analytics.recentlyAddedProducts')}</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {newlyAddedProducts.map((p) => (
                <div key={p.id} className="px-3 py-2 bg-muted rounded-lg">
                  <p className="font-medium text-sm text-foreground truncate">{p.name}</p>
                  <div className="flex gap-2 text-xs text-muted-foreground mt-1">
                    <span>
                      {p.price !== undefined && p.price !== null
                        ? `$${p.price.toLocaleString()}`
                        : t('products.contactForPrice')}
                    </span>
                    <span>•</span>
                    <span>{p.stock_quantity ?? 0} stock</span>
                    <span>•</span>
                    <span>{p.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-4 shadow-luxury">
            <h4 className="text-sm font-medium text-foreground mb-2">{t('admin.analytics.topSellingProducts')}</h4>
            <ul className="space-y-1 text-sm">
              {topProducts.map((p) => (
                <li key={p.name} className="flex justify-between">
                  <span>{p.name}</span>
                  <span>{p.quantity}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-luxury">
            <h4 className="text-sm font-medium text-foreground mb-2">{t('admin.analytics.mostViewedProducts')}</h4>
            <ul className="space-y-1 text-sm">
              {mostViewedProducts.map((p) => (
                <li key={p.name} className="flex justify-between">
                  <span>{p.name}</span>
                  <span>{p.count}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-luxury lg:col-span-2">
            <h4 className="text-sm font-medium text-foreground mb-2">{t('admin.analytics.lowStockProducts')}</h4>
            <ul className="space-y-1 text-sm">
              {lowStock.map((p) => (
                <li key={p.id} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className={p.stock_quantity <= 5 ? 'text-red-500' : ''}>{p.stock_quantity}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-card rounded-xl border border-border p-4 shadow-luxury lg:col-span-2">
            <ChartContainer
              config={{ revenue: { label: t('admin.analytics.revenue'), color: '#f59e0b' } }}
            >
              <Recharts.BarChart data={revenueByProduct}>
                <Recharts.XAxis dataKey="name" />
                <Recharts.YAxis />
                <Recharts.Bar
                  dataKey="revenue"
                  fill="var(--color-revenue)"
                />
                <ChartTooltipContent />
              </Recharts.BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
