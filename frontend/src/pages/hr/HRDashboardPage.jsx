import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, UserCheck, Calendar, Clock, Award } from 'lucide-react';
import { useGetHRAnalyticsQuery } from '../../features/analytics/analyticsApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { cn } from '../../utils/cn';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const HRDashboardPage = () => {
  const dispatch = useDispatch();
  const { data, isLoading } = useGetHRAnalyticsQuery();
  const stats = data?.data || {};

  useEffect(() => {
    dispatch(setPageTitle('HR Overview'));
    dispatch(setBreadcrumbs([{ label: 'HR' }, { label: 'Overview' }]));
  }, [dispatch]);

  const deptData = stats.departmentDistribution || [];
  const attendanceData = stats.monthlyAttendance || [];

  return (
    <div className="page-container">
      <h1 className="section-title">HR Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Employees', value: stats.totalEmployees, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Present Today', value: stats.presentToday, icon: UserCheck, color: 'text-green-500', bg: 'bg-green-500/10' },
          { label: 'On Leave', value: stats.onLeave, icon: Calendar, color: 'text-orange-500', bg: 'bg-orange-500/10' },
          { label: 'Avg Attendance', value: `${stats.avgAttendance || 0}%`, icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
        ].map((kpi) => (
          <motion.div key={kpi.label} whileHover={{ y: -2 }} className="card-base p-5">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', kpi.bg)}>
                <kpi.icon className={cn('h-5 w-5', kpi.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-lg font-bold text-foreground">
                  {isLoading ? '...' : kpi.value}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Distribution */}
        <div className="card-base p-5">
          <h3 className="font-semibold text-foreground mb-4">Employees by Department</h3>
          <div className="h-64">
            {isLoading ? (
              <div className="shimmer h-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={deptData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance Trend */}
        <div className="card-base p-5">
          <h3 className="font-semibold text-foreground mb-4">Monthly Attendance Trend</h3>
          <div className="h-64">
            {isLoading ? (
              <div className="shimmer h-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attendanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="rate" name="Attendance %" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDashboardPage;
