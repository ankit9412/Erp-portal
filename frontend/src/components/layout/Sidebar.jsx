import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';
import { usePermission } from '../../hooks/usePermission';
import { selectCurrentUser } from '../../features/auth/authSlice';
import { toggleSidebarCollapsed } from '../../features/ui/uiSlice';
import { cn } from '../../utils/cn';
import { getInitials } from '../../utils/formatters';
import {
  LayoutDashboard, Package, DollarSign, Users, BarChart3,
  Settings, Bell, Shield, ChevronDown, Warehouse,
  ShoppingCart, FileText, TrendingUp, Building2,
  UserCheck, Calendar, CreditCard, Boxes, Truck,
  ChevronLeft, ChevronRight, LayoutPanelTop,
} from 'lucide-react';

const navItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    module: 'dashboard',
    action: 'read',
  },
  {
    label: 'Inventory',
    icon: Package,
    module: 'inventory',
    action: 'read',
    children: [
      { label: 'Overview', href: '/inventory/overview', icon: LayoutDashboard },
      { label: 'Products', href: '/inventory/products', icon: Boxes },
      { label: 'Stock', href: '/inventory/stock', icon: Package },
      { label: 'Warehouses', href: '/inventory/warehouses', icon: Warehouse },
      { label: 'Suppliers', href: '/inventory/suppliers', icon: Truck },
      { label: 'Purchase Orders', href: '/inventory/purchase-orders', icon: ShoppingCart },
    ],
  },
  {
    label: 'Finance',
    icon: DollarSign,
    module: 'finance',
    action: 'read',
    children: [
      { label: 'Overview', href: '/finance/overview', icon: LayoutDashboard },
      { label: 'Invoices', href: '/finance/invoices', icon: FileText },
      { label: 'Transactions', href: '/finance/transactions', icon: CreditCard },
      { label: 'Expenses', href: '/finance/expenses', icon: TrendingUp },
      { label: 'Reports', href: '/finance/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'HR & Payroll',
    icon: Users,
    module: 'hr',
    action: 'read',
    children: [
      { label: 'Overview', href: '/hr/overview', icon: LayoutDashboard },
      { label: 'Employees', href: '/hr/employees', icon: UserCheck },
      { label: 'Attendance', href: '/hr/attendance', icon: Calendar },
      { label: 'Leave', href: '/hr/leaves', icon: Calendar },
      { label: 'Payroll', href: '/hr/payroll', icon: CreditCard },
    ],
  },
  {
    label: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
    module: 'analytics',
    action: 'read',
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
  {
    label: 'Audit Logs',
    href: '/audit',
    icon: Shield,
    module: 'audit',
    action: 'read',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    module: 'settings',
    action: 'read',
  },
];

const SidebarItem = ({ item, collapsed, depth = 0 }) => {
  const location = useLocation();
  const { can } = usePermission();
  const [isOpen, setIsOpen] = useState(() =>
    item.children?.some((c) => c.href && location.pathname.startsWith(c.href)) || false
  );

  if (item.module && item.action && !can(item.module, item.action)) return null;

  const hasChildren = item.children?.length > 0;
  const Icon = item.icon;

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
            'hover:bg-sidebar-accent',
            isOpen ? 'text-blue-400' : 'text-slate-400 hover:text-slate-200',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? item.label : undefined}
        >
          <Icon className="h-4 w-4 flex-shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="h-3.5 w-3.5" />
              </motion.div>
            </>
          )}
        </button>

        <AnimatePresence>
          {isOpen && !collapsed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="ml-4 mt-1 space-y-0.5 border-l border-slate-700 pl-3">
                {item.children.map((child) => (
                  <SidebarItem key={child.href} item={child} collapsed={false} depth={depth + 1} />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <NavLink
      to={item.href || '#'}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
          isActive
            ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
            : 'text-slate-400 hover:bg-sidebar-accent hover:text-slate-200',
          collapsed && 'justify-center px-2'
        )
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      {!collapsed && <span className="flex-1">{item.label}</span>}
    </NavLink>
  );
};

const Sidebar = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const collapsed = useSelector((state) => state.ui.sidebarCollapsed);

  const isSuperAdmin = user?.roleType === 'super_admin';

  return (
    <aside className={cn(
      'h-full bg-sidebar border-r border-sidebar-border flex flex-col relative',
      'transition-all duration-300',
      collapsed ? 'w-16' : 'w-64'
    )}>
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-3 px-4 py-5 border-b border-sidebar-border',
        collapsed && 'justify-center px-2'
      )}>
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="font-bold text-sm text-white truncate">MSME ERP</p>
            <p className="text-xs text-slate-400 truncate">Enterprise Platform</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {isSuperAdmin && (
          <div className="mb-4">
            <p className={cn("px-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2", collapsed && "text-center px-0")}>
              {!collapsed ? 'System Management' : 'Admin'}
            </p>
            <SidebarItem 
              item={{ label: 'System Admin', href: '/admin/system', icon: LayoutPanelTop }} 
              collapsed={collapsed} 
            />
          </div>
        )}
        
        {navItems.map((item) => (
          <SidebarItem key={item.label} item={item} collapsed={collapsed} />
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => dispatch(toggleSidebarCollapsed())}
        className="absolute -right-3 top-20 w-6 h-6 bg-sidebar border border-sidebar-border rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-colors z-10"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* User profile */}
      <div className={cn('border-t border-sidebar-border p-3', collapsed && 'flex justify-center')}>
        <NavLink
          to="/profile"
          className={({ isActive }) => cn(
            'flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors',
            isActive ? 'bg-sidebar-accent text-white' : 'text-slate-400',
            collapsed && 'justify-center'
          )}
        >
          <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-blue-400">
              {getInitials(user?.firstName, user?.lastName)}
            </span>
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-slate-400 truncate capitalize">
                {user?.roleType?.replace(/_/g, ' ')}
              </p>
            </div>
          )}
        </NavLink>
      </div>
    </aside>
  );
};

export default Sidebar;
