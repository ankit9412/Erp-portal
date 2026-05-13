import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, Cell, PieChart, Pie
} from 'recharts';
import { DollarSign, FileText, TrendingUp, CreditCard, Activity } from 'lucide-react';
import { useGetOverviewQuery, useGetRevenueAnalyticsQuery } from '../../features/analytics/analyticsApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

const FinanceDashboardPage = () => {
  const dispatch = useDispatch();
  const { data: overview, isLoading: overviewLoading } = useGetOverviewQuery();
  const { data: revenueData, isLoading: revenueLoading } = useGetRevenueAnalyticsQuery({ period: '12months' });

  const stats = overview?.data || {};
  const revenueChart = (revenueData?.data || []).map(d => ({
    name: `${d._id?.month}/${d._id?.year}`,
    Revenue: d.revenue || 0,
    Expenses: d.expenses || 0,
    Net: (d.revenue || 0) - (d.expenses || 0)
  }));

  useEffect(() => {
    dispatch(setPageTitle('Finance Overview'));
    dispatch(setBreadcrumbs([{ label: 'Finance' }, { label: 'Overview' }]));
  }, [dispatch]);

  return (
    <div className="page-container">
      <h1 className="section-title">Finance Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: stats.yearlyRevenue, icon: DollarSign, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'Pending Invoices', value: stats.pendingInvoicesAmount, icon: FileText, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Monthly Expenses', value: stats.monthlyExpenses, icon: TrendingUp, color: 'text-red-500', bg: 'bg-red-500/10' },
          { label: 'Available Cash', value: stats.cashInHand, icon: CreditCard, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ].map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} className="card-base p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold text-foreground mt-1">
                  {overviewLoading ? '...' : formatCurrency(kpi.value)}
                </p>
              </div>
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', kpi.bg)}>
                <kpi.icon className={cn('h-4.5 w-4.5', kpi.color)} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <div className="lg:col-span-2 card-base p-5">
          <h3 className="font-semibold text-foreground mb-4">Financial Performance</h3>
          <div className="h-72">
            {revenueLoading ? (
              <div className="shimmer h-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueChart}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip />
                  <Area type="monotone" dataKey="Net" stroke="#3B82F6" strokeWidth={2} fill="url(#colorNet)" />
                  <Bar dataKey="Revenue" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Expense Category */}
        <div className="card-base p-5">
          <h3 className="font-semibold text-foreground mb-4">Expense Breakdown</h3>
          <div className="space-y-4">
            {[
              { label: 'Inventory', value: 0.45, color: 'bg-green-500' },
              { label: 'Payroll', value: 0.35, color: 'bg-blue-500' },
              { label: 'Marketing', value: 0.12, color: 'bg-orange-500' },
              { label: 'Others', value: 0.08, color: 'bg-slate-400' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium">{(item.value * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div className={cn('h-1.5 rounded-full', item.color)} style={{ width: `${item.value * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border">
            <p className="text-xs text-muted-foreground">Monthly Burn Rate</p>
            <p className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(stats.monthlyExpenses)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboardPage;
