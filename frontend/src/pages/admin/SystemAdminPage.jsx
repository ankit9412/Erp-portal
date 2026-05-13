import React, { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  Building2, Users, Activity, Shield, 
  Globe, Database, HardDrive, AlertCircle 
} from 'lucide-react';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { cn } from '../../utils/cn';

const SystemAdminPage = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setPageTitle('System Administration'));
    dispatch(setBreadcrumbs([{ label: 'System Admin' }]));
  }, [dispatch]);

  const stats = [
    { label: 'Total Tenants', value: '12', icon: Building2, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Total Users', value: '154', icon: Users, color: 'text-green-500', bg: 'bg-green-500/10' },
    { label: 'Active Sessions', value: '42', icon: Activity, color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { label: 'System Health', value: '99.9%', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="section-title">System Administration</h1>
          <p className="text-muted-foreground text-sm">Global management and monitoring for MSME ERP</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-500 rounded-full text-xs font-medium border border-green-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          All systems operational
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {stats.map((stat) => (
          <motion.div key={stat.label} whileHover={{ y: -2 }} className="card-base p-5">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.bg)}>
                <stat.icon className={cn('h-5 w-5', stat.color)} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Recent Tenants */}
        <div className="lg:col-span-2 card-base overflow-hidden">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <h3 className="font-semibold text-foreground">Recent Tenants</h3>
            <button className="text-xs text-primary hover:underline">View All Tenants</button>
          </div>
          <div className="table-container">
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Company</th>
                  <th className="table-th">Plan</th>
                  <th className="table-th">Users</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Acme Corp', domain: 'acme.erp.com', plan: 'Enterprise', users: 24, status: 'Active' },
                  { name: 'Global Tech', domain: 'global.erp.com', plan: 'Professional', users: 12, status: 'Active' },
                  { name: 'Nexa Solutions', domain: 'nexa.erp.com', plan: 'Starter', users: 5, status: 'Pending' },
                ].map((tenant) => (
                  <tr key={tenant.name} className="table-row">
                    <td className="table-td">
                      <div>
                        <p className="text-sm font-medium text-foreground">{tenant.name}</p>
                        <p className="text-xs text-muted-foreground">{tenant.domain}</p>
                      </div>
                    </td>
                    <td className="table-td text-sm text-foreground">{tenant.plan}</td>
                    <td className="table-td text-sm text-foreground">{tenant.users}</td>
                    <td className="table-td">
                      <span className={cn(
                        'badge-base',
                        tenant.status === 'Active' ? 'badge-success' : 'badge-warning'
                      )}>
                        {tenant.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Infrastructure Status */}
        <div className="card-base p-5">
          <h3 className="font-semibold text-foreground mb-4">Infrastructure</h3>
          <div className="space-y-6">
            {[
              { label: 'Database (MongoDB)', value: 'Healthy', icon: Database, color: 'text-green-500' },
              { label: 'Cache (Redis)', value: 'Disconnected', icon: HardDrive, color: 'text-red-500' },
              { label: 'API Gateway', value: 'Online', icon: Globe, color: 'text-blue-500' },
              { label: 'File Storage', value: '94% Free', icon: HardDrive, color: 'text-orange-500' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-foreground">{item.label}</p>
                    <p className={cn('text-[10px]', item.color)}>{item.value}</p>
                  </div>
                </div>
                <div className={cn('w-2 h-2 rounded-full', item.color.replace('text', 'bg'))} />
              </div>
            ))}
          </div>

          <div className="mt-8 p-4 bg-muted/50 rounded-xl border border-border">
            <h4 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-2">
              <AlertCircle className="h-3 w-3 text-orange-500" />
              System Alerts
            </h4>
            <div className="space-y-2">
              <p className="text-[10px] text-muted-foreground">• Redis connection lost in development environment.</p>
              <p className="text-[10px] text-muted-foreground">• New tenant "Nexa Solutions" awaiting approval.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemAdminPage;
