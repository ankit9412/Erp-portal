import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  DollarSign, Package, Users, TrendingUp, AlertTriangle,
  FileText, ShoppingCart, Activity,
} from 'lucide-react';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { useGetOverviewQuery, useGetKPIsQuery, useGetRevenueAnalyticsQuery } from '../../features/analytics/analyticsApi';
import { useGetLowStockProductsQuery } from '../../features/inventory/inventoryApi';
import StatCard from '../../components/ui/StatCard';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: {typeof p.value === 'number' && p.value > 1000 ? formatCurrency(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const DashboardPage = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);

  const { data: overview, isLoading: overviewLoading } = useGetOverviewQuery();
  const { data: kpis, isLoading: kpisLoading } = useGetKPIsQuery();
  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueAnalyticsQuery({ period: '12months' });
  const { data: lowStockData } = useGetLowStockProductsQuery();

  useEffect(() => {
    dispatch(setPageTitle('Dashboard'));
    dispatch(setBreadcrumbs([{ label: 'Dashboard' }]));
  }, [dispatch]);

  const stats = overview?.data || {};
  const kpiList = kpis?.data || [];
  const revenueChart = revenueData?.data || [];
  const lowStockProducts = lowStockData?.data || [];

  const chartData = revenueChart.map((d) => ({
    name: `${d._id?.month}/${d._id?.year}`,
    Revenue: d.revenue || 0,
    Collected: d.collected || 0,
  }));

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="page-container">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {user?.firstName} 👋
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Here's what's happening with your business today.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Revenue"
          value={formatCurrency(stats.monthlyRevenue)}
          icon={DollarSign}
          color="blue"
          loading={overviewLoading}
          change={kpiList.find((k) => k.key === 'monthly_revenue')?.change}
          changeLabel="vs last month"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts?.toLocaleString() || '0'}
          icon={Package}
          color="green"
          loading={overviewLoading}
        />
        <StatCard
          title="Active Employees"
          value={stats.totalEmployees?.toLocaleString() || '0'}
          icon={Users}
          color="purple"
          loading={overviewLoading}
        />
        <StatCard
          title="Pending Invoices"
          value={stats.pendingInvoices?.toLocaleString() || '0'}
          icon={FileText}
          color="orange"
          loading={overviewLoading}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Revenue Overview</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Last 12 months</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />Revenue</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Collected</span>
            </div>
          </div>
          {revenueLoading ? (
            <div className="h-56 shimmer rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#colorRevenue)" />
                <Area type="monotone" dataKey="Collected" stroke="#10B981" strokeWidth={2} fill="url(#colorCollected)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick Stats */}
        <div className="card-base p-5 space-y-4">
          <h3 className="font-semibold text-foreground">Quick Stats</h3>
          {[
            { label: 'Low Stock Items', value: stats.lowStockCount || 0, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Out of Stock', value: stats.outOfStockCount || 0, icon: Package, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'Yearly Revenue', value: formatCurrency(stats.yearlyRevenue), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Collected This Month', value: formatCurrency(stats.monthlyCollected), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', item.bg)}>
                <item.icon className={cn('h-4 w-4', item.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <div className="card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              Low Stock Alerts
            </h3>
            <span className="text-xs text-muted-foreground">{lowStockProducts.length} items</span>
          </div>
          {lowStockProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p className="text-sm">All stock levels are healthy</p>
            </div>
          ) : (
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div key={product._id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <p className="text-sm font-medium text-foreground">{product.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-sm font-semibold', product.stock === 0 ? 'text-red-500' : 'text-orange-500')}>
                      {product.stock} {product.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">Min: {product.minStockLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="card-base p-5">
          <h3 className="font-semibold text-foreground flex items-center gap-2 mb-4">
            <Activity className="h-4 w-4 text-blue-500" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {[
              { action: 'Invoice #INV-00123 sent', time: '2 min ago', type: 'invoice' },
              { action: 'Stock adjusted for Product A', time: '15 min ago', type: 'stock' },
              { action: 'New employee John Doe added', time: '1 hour ago', type: 'hr' },
              { action: 'Purchase Order PO-0045 approved', time: '2 hours ago', type: 'purchase' },
              { action: 'Payment received ₹25,000', time: '3 hours ago', type: 'payment' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
