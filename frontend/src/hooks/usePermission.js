import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../features/auth/authSlice';

const rolePermissions = {
  super_admin: { '*': ['*'] },
  business_owner: { '*': ['create', 'read', 'update', 'delete', 'export', 'import', 'approve', 'reject'] },
  manager: {
    dashboard: ['read'],
    inventory: ['create', 'read', 'update', 'export', 'import', 'approve'],
    finance: ['create', 'read', 'update', 'export', 'approve'],
    hr: ['create', 'read', 'update', 'export', 'approve'],
    reports: ['read', 'export'],
    analytics: ['read'],
    settings: ['read'],
    users: ['read'],
  },
  hr: {
    dashboard: ['read'],
    hr: ['create', 'read', 'update', 'export', 'import', 'approve', 'reject'],
    payroll: ['create', 'read', 'update', 'export'],
    reports: ['read', 'export'],
    analytics: ['read'],
  },
  accountant: {
    dashboard: ['read'],
    finance: ['create', 'read', 'update', 'export', 'import', 'approve', 'reject'],
    payroll: ['create', 'read', 'update', 'export'],
    reports: ['create', 'read', 'export'],
    analytics: ['read'],
  },
  inventory_staff: {
    dashboard: ['read'],
    inventory: ['create', 'read', 'update', 'export', 'import'],
    purchase: ['create', 'read', 'update', 'export'],
  },
  sales_executive: {
    dashboard: ['read'],
    sales: ['create', 'read', 'update', 'export'],
    inventory: ['read'],
    finance: ['read'],
  },
  support_staff: {
    dashboard: ['read'],
    inventory: ['read'],
    finance: ['read'],
    hr: ['read'],
  },
};

export const usePermission = () => {
  const user = useSelector(selectCurrentUser);

  const can = (module, action) => {
    if (!user) return false;
    if (user.isSuperAdmin) return true;

    const roleType = user.roleType;
    const permissions = rolePermissions[roleType];
    if (!permissions) return false;

    if (permissions['*']?.includes('*') || permissions['*']?.includes(action)) return true;

    const modulePerms = permissions[module];
    if (!modulePerms) return false;

    return modulePerms.includes(action) || modulePerms.includes('*');
  };

  const canAny = (module, actions) => actions.some((action) => can(module, action));
  const canAll = (module, actions) => actions.every((action) => can(module, action));

  return { can, canAny, canAll };
};
