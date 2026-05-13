import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { TrendingUp, DollarSign, Users, Package, Activity, Target } from 'lucide-react';
import {
  useGetOverviewQuery,
  useGetRevenueAnalyticsQuery,
  useGetInventoryAnalyticsQuery,
  useGetHRAnalyticsQuery,
  useGetKPIsQuery,
  useGetForecastQuery,
} from '../../features/analytics/analyticsApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency, formatPercent } from '../../utils/formatters';
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

const KPICard = ({ kpi, loading }) => {
  if (loading) {
    return (
      <div className="card-base p-5 space-y-3">
        <div className="shimmer h-4 w-24 rounded" />
        <div className="shimmer h-8 w-32 rounded" />
        <div className="shimmer h-3 w-20 rounded" />
      </div>
    );
  }

  const isPositive = (kpi.change || 0) >= 0;

  return (
    <motion.div whileHover={{ y: -2 }} className="card-base p-5 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{kpi.label || kpi.key}</p>
          <p className="text-2xl font-bold text-foreground mt-1">
            {kpi.format === 'currency' ? formatCurrency(kpi.value) :
             kpi.format === 'percent' ? formatPercent(kpi.value) :
             (kpi.value || 0).toLocaleString()}
          </p>
        </div>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          isPositive ? 'bg-green-500/10' : 'bg-red-500/10'
        )}>
          <TrendingUp className={cn('h-5 w-5', isPositive ? 'text-green-500' : 'text-red-500 rotate-180')} />
        </div>
      </div>
      {kpi.change !== undefined && (
        <p className={cn('text-xs mt-2', isPositive ? 'text-green-500' : 'text-red-500')}>
          {isPositive ? '+' : ''}{kpi.change}% vs last period
        </p>
      )}
    </motion.div>
  );
};

const AnalyticsPage = () => {
  const dispatch = useDispatch();

  const { data: overviewData, isLoading: overviewLoading } = useGetOverviewQuery();
  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueAnalyticsQuery({ period: '12months' });
  const { data: inventoryData, isLoading: inventoryLoading } = useGetInventoryAnalyticsQuery();
  const { data: hrData, isLoading: hrLoading } = useGetHRAnalyticsQuery();
  const { data: kpisData, isLoading: kpisLoading } = useGetKPIsQuery();
  const { data: forecastData } = useGetForecastQuery();

  useEffect(() => {
    dispatch(setPageTitle('Analytics'));
    dispatch(setBreadcrumbs([{ label: 'Analytics' }]));
  }, [dispatch]);

  const overview = overviewData?.data || {};
  const kpis = kpisData?.data || [];
  const revenueChart = (revenueData?.data || []).map((d) => ({
    name: `${d._id?.month}/${d._id?.year}`,
    Revenue: d.revenue || 0,
    Collected: d.collected || 0,
  }));
  const inventoryAnalytics = inventoryData?.data || {};
  const hrAnalytics = hrData?.data || {};
  const forecast = forecastData?.data || [];

  // Category distribution for pie chart
  const categoryData = inventoryAnalytics.categoryDistribution || [];
  const deptData = hrAnalytics.departmentDistribution || [];

  return (
    <div className="page-container">
      <div>
        <h1 className="section-title">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1">Business intelligence and performance metrics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpisLoading ? (
          Array.from({ length: 4 }).map((_, i) => <KPICard key={i} loading />)
        ) : kpis.length > 0 ? (
          kpis.slice(0, 4).map((kpi) => <KPICard key={kpi.key} kpi={kpi} />)
        ) : (
          [
            { key: 'revenue', label: 'Monthly Revenue', value: overview.monthlyRevenue, format: 'currency', change: 12 },
            { key: 'orders', label: 'Total Orders', value: overview.totalOrders, change: 8 },
            { key: 'employees', label: 'Active Employees', value: overview.totalEmployees, change: 3 },
            { key: 'products', label: 'Total Products', value: overview.totalProducts, change: -2 },
          ].map((kpi) => <KPICard key={kpi.key} kpi={kpi} loading={overviewLoading} />)
        )}
      </div>

      {/* Revenue Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card-base p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Revenue Trend</h3>
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
              <AreaChart data={revenueChart}>
                <defs>
                  <linearGradient id="aRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="aCollected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Revenue" stroke="#3B82F6" strokeWidth={2} fill="url(#aRevenue)" />
                <Area type="monotone" dataKey="Collected" stroke="#10B981" strokeWidth={2} fill="url(#aCollected)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Inventory Category Pie */}
        <div className="card-base p-5">
          <h3 className="font-semibold text-foreground mb-4">Inventory by Category</h3>
          {inventoryLoading ? (
            <div className="h-48 shimmer rounded-lg" />
          ) : categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryData.slice(0, 4).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </span>
                    <span className="font-medium text-foreground">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* HR & Expense Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* HR Metrics */}
        <div className="card-base p-5">
          <h3 className="font-semibold text-foreground mb-4">HR Metrics</h3>
          {hrLoading ? (
            <div className="h-48 shimmer rounded-lg" />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { label: 'Total', value: hrAnalytics.totalEmployees || 0, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
                  { label: 'Present Today', value: hrAnalytics.presentToday || 0, icon: Activity, color: 'text-green-500', bg: 'bg-green-500/10' },
                  { label: 'On Leave', value: hrAnalytics.onLeave || 0, icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10' },
                ].map((item) => (
                  <div key={item.label} className="text-center p-3 rounded-xl bg-muted/50">
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-1', item.bg)}>
                      <item.icon className={cn('h-4 w-4', item.color)} />
                    </div>
                    <p className="text-lg font-bold text-foreground">{item.value}</p>
                    <p className="text-xs text-muted-foreground">{item.label}</p>
                  </div>
                ))}
              </div>
              {deptData.length > 0 && (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={deptData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={80} />
                    <Tooltip />
                    <Bar dataKey="count" name="Employees" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </div>

        {/* Revenue Forecast */}
        <div className="card-base p-5">
          <h3 className="font-semibold text-foreground mb-4">Revenue Forecast</h3>
          {forecast.length === 0 ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Forecast data not available</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={forecast}>
                <defs>
                  <linearGradient id="aForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="forecast" name="Forecast" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" fill="url(#aForecast)" />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#3B82F6" strokeWidth={2} fill="url(#aRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="card-base p-5">
        <h3 className="font-semibold text-foreground mb-4">Inventory Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Products', value: inventoryAnalytics.totalProducts || overview.totalProducts || 0, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { label: 'Low Stock', value: inventoryAnalytics.lowStockCount || overview.lowStockCount || 0, icon: Package, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Out of Stock', value: inventoryAnalytics.outOfStockCount || overview.outOfStockCount || 0, icon: Package, color: 'text-red-500', bg: 'bg-red-500/10' },
            { label: 'Total Value', value: formatCurrency(inventoryAnalytics.totalValue || 0), icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', item.bg)}>
                <item.icon className={cn('h-4 w-4', item.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-bold text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
