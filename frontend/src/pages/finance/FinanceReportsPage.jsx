import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Download, TrendingUp, BarChart2, FileText } from 'lucide-react';
import { useGetProfitLossReportQuery, useGetTaxReportQuery } from '../../features/finance/financeApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const TABS = [
  { id: 'pl', label: 'P&L Report', icon: TrendingUp },
  { id: 'tax', label: 'Tax Report', icon: FileText },
  { id: 'cashflow', label: 'Cash Flow', icon: BarChart2 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-xl p-3 shadow-lg text-sm">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="text-xs">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  );
};

const FinanceReportsPage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('pl');
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 11);
    return d.toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: plData, isLoading: plLoading } = useGetProfitLossReportQuery(
    { dateFrom, dateTo },
    { skip: activeTab !== 'pl' }
  );
  const { data: taxData, isLoading: taxLoading } = useGetTaxReportQuery(
    { dateFrom, dateTo },
    { skip: activeTab !== 'tax' }
  );

  useEffect(() => {
    dispatch(setPageTitle('Finance Reports'));
    dispatch(setBreadcrumbs([{ label: 'Finance' }, { label: 'Reports' }]));
  }, [dispatch]);

  const plReport = plData?.data || {};
  const plChartData = plReport.monthly || [];
  const taxReport = taxData?.data || {};
  const taxChartData = taxReport.monthly || [];

  // Mock cash flow data if not available
  const cashFlowData = plChartData.map((d) => ({
    ...d,
    Opening: d.opening || 0,
    Closing: d.closing || 0,
    Inflow: d.revenue || d.income || 0,
    Outflow: d.expenses || 0,
  }));

  const handleExport = () => {
    // Trigger export — in a real app this would call the export endpoint
    const link = document.createElement('a');
    link.href = `/api/finance/reports/export?type=${activeTab}&dateFrom=${dateFrom}&dateTo=${dateTo}`;
    link.download = `${activeTab}-report.xlsx`;
    link.click();
  };

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Finance Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">Detailed financial analysis and reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="input-base w-auto"
          />
          <span className="text-muted-foreground text-sm">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="input-base w-auto"
          />
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" /> Export Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* P&L Tab */}
      {activeTab === 'pl' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Total Revenue', value: plReport.totalRevenue, color: 'text-green-500', bg: 'bg-green-500/10' },
              { label: 'Total Expenses', value: plReport.totalExpenses, color: 'text-red-500', bg: 'bg-red-500/10' },
              { label: 'Gross Profit', value: plReport.grossProfit, color: 'text-blue-500', bg: 'bg-blue-500/10' },
              { label: 'Net Profit', value: plReport.netProfit, color: plReport.netProfit >= 0 ? 'text-green-500' : 'text-red-500', bg: 'bg-purple-500/10' },
            ].map((item) => (
              <div key={item.label} className="card-base p-5">
                {plLoading ? (
                  <div className="space-y-2">
                    <div className="shimmer h-4 w-24 rounded" />
                    <div className="shimmer h-8 w-32 rounded" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className={cn('text-2xl font-bold mt-1', item.color)}>
                      {formatCurrency(item.value || 0)}
                    </p>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Revenue vs Expenses Chart */}
          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-4">Revenue vs Expenses</h3>
            {plLoading ? (
              <div className="h-64 shimmer rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={plChartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10B981" strokeWidth={2} fill="url(#colorRevenue)" />
                  <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#EF4444" strokeWidth={2} fill="url(#colorExpenses)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Expense Breakdown */}
          {plReport.expenseBreakdown && (
            <div className="card-base p-5">
              <h3 className="font-semibold text-foreground mb-4">Expense Breakdown</h3>
              <div className="space-y-3">
                {plReport.expenseBreakdown.map((item) => (
                  <div key={item.category} className="flex items-center gap-3">
                    <span className="text-sm text-muted-foreground w-32 capitalize">{item.category?.replace(/_/g, ' ')}</span>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full"
                        style={{ width: `${Math.min(100, (item.amount / plReport.totalExpenses) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium text-foreground w-28 text-right">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Tax Tab */}
      {activeTab === 'tax' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Total Tax Collected', value: taxReport.totalTaxCollected },
              { label: 'Total Tax Paid', value: taxReport.totalTaxPaid },
              { label: 'Net Tax Liability', value: taxReport.netTaxLiability },
            ].map((item) => (
              <div key={item.label} className="card-base p-5">
                {taxLoading ? (
                  <div className="space-y-2">
                    <div className="shimmer h-4 w-24 rounded" />
                    <div className="shimmer h-8 w-32 rounded" />
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-muted-foreground">{item.label}</p>
                    <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(item.value || 0)}</p>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-4">Monthly Tax Summary</h3>
            {taxLoading ? (
              <div className="h-64 shimmer rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={taxChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="taxCollected" name="Tax Collected" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="taxPaid" name="Tax Paid" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      )}

      {/* Cash Flow Tab */}
      {activeTab === 'cashflow' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-4">Cash Flow Overview</h3>
            {plLoading ? (
              <div className="h-64 shimmer rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="Inflow" name="Cash Inflow" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Outflow" name="Cash Outflow" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-4">Net Cash Position</h3>
            {plLoading ? (
              <div className="h-48 shimmer rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={cashFlowData}>
                  <defs>
                    <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Closing" name="Net Position" stroke="#3B82F6" strokeWidth={2} fill="url(#colorNet)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FinanceReportsPage;
