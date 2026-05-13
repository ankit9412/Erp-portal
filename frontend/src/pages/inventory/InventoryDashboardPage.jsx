import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import { Package, Warehouse, Truck, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import { useGetInventoryAnalyticsQuery } from '../../features/analytics/analyticsApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const InventoryDashboardPage = () => {
  const dispatch = useDispatch();
  const { data, isLoading } = useGetInventoryAnalyticsQuery();
  const stats = data?.data || {};

  useEffect(() => {
    dispatch(setPageTitle('Inventory Overview'));
    dispatch(setBreadcrumbs([{ label: 'Inventory' }, { label: 'Overview' }]));
  }, [dispatch]);

  const categoryData = stats.categoryDistribution || [];
  const warehouseData = stats.warehouseStock || [];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between">
        <h1 className="section-title">Inventory Overview</h1>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 px-3 py-1.5 rounded-full">
          <Activity className="h-3 w-3" />
          Real-time updates enabled
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Products', value: stats.totalProducts, icon: Package, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Low Stock Items', value: stats.lowStockCount, icon: AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Warehouses', value: stats.totalWarehouses, icon: Warehouse, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Total Stock Value', value: formatCurrency(stats.totalValue), icon: TrendingUp, color: 'text-green-500', bg: 'bg-green-500/10' },
        ].map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} className="card-base p-5">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', kpi.bg)}>
                <kpi.icon className={cn('h-5 w-5', kpi.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold text-foreground">
                  {isLoading ? '...' : kpi.value?.toLocaleString() || 0}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <div className="card-base p-5">
          <h3 className="font-semibold text-foreground mb-4">Stock by Category</h3>
          <div className="h-64">
            {isLoading ? (
              <div className="shimmer h-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Warehouse Occupancy */}
        <div className="card-base p-5">
          <h3 className="font-semibold text-foreground mb-4">Stock by Warehouse</h3>
          <div className="h-64">
            {isLoading ? (
              <div className="shimmer h-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warehouseData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="stock" name="Current Stock" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryDashboardPage;
