import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from './features/auth/authSlice';
import { setTheme } from './features/ui/uiSlice';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import MFAPage from './pages/auth/MFAPage';

// Dashboard
import DashboardPage from './pages/dashboard/DashboardPage';

// Inventory
import ProductsPage from './pages/inventory/ProductsPage';
import ProductDetailPage from './pages/inventory/ProductDetailPage';
import StockPage from './pages/inventory/StockPage';
import WarehousesPage from './pages/inventory/WarehousesPage';
import SuppliersPage from './pages/inventory/SuppliersPage';
import PurchaseOrdersPage from './pages/inventory/PurchaseOrdersPage';
import PurchaseOrderDetailPage from './pages/inventory/PurchaseOrderDetailPage';
import CreatePurchaseOrderPage from './pages/inventory/CreatePurchaseOrderPage';

// Finance
import InvoicesPage from './pages/finance/InvoicesPage';
import InvoiceDetailPage from './pages/finance/InvoiceDetailPage';
import CreateInvoicePage from './pages/finance/CreateInvoicePage';
import TransactionsPage from './pages/finance/TransactionsPage';
import ExpensesPage from './pages/finance/ExpensesPage';
import FinanceReportsPage from './pages/finance/FinanceReportsPage';

// HR
import EmployeesPage from './pages/hr/EmployeesPage';
import EmployeeDetailPage from './pages/hr/EmployeeDetailPage';
import AttendancePage from './pages/hr/AttendancePage';
import LeavePage from './pages/hr/LeavePage';
import PayrollPage from './pages/hr/PayrollPage';

// Analytics
import AnalyticsPage from './pages/analytics/AnalyticsPage';

// Settings
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';

// Module Dashboards
import InventoryDashboardPage from './pages/inventory/InventoryDashboardPage';
import FinanceDashboardPage from './pages/finance/FinanceDashboardPage';
import HRDashboardPage from './pages/hr/HRDashboardPage';
import SystemAdminPage from './pages/admin/SystemAdminPage';

// Notifications & Audit
import NotificationsPage from './pages/notifications/NotificationsPage';
import AuditPage from './pages/audit/AuditPage';

// Guards
import ProtectedRoute from './components/guards/ProtectedRoute';

const App = () => {
  const dispatch = useDispatch();
  const theme = useSelector((state) => state.ui.theme);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      // System
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [theme]);

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/mfa" element={<MFAPage />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />

          {/* Inventory */}
          <Route path="/inventory/overview" element={<InventoryDashboardPage />} />
          <Route path="/inventory/products" element={<ProductsPage />} />
          <Route path="/inventory/products/:id" element={<ProductDetailPage />} />
          <Route path="/inventory/stock" element={<StockPage />} />
          <Route path="/inventory/warehouses" element={<WarehousesPage />} />
          <Route path="/inventory/suppliers" element={<SuppliersPage />} />
          <Route path="/inventory/purchase-orders" element={<PurchaseOrdersPage />} />
          <Route path="/inventory/purchase-orders/create" element={<CreatePurchaseOrderPage />} />
          <Route path="/inventory/purchase-orders/:id" element={<PurchaseOrderDetailPage />} />

          {/* Finance */}
          <Route path="/finance/overview" element={<FinanceDashboardPage />} />
          <Route path="/finance/invoices" element={<InvoicesPage />} />
          <Route path="/finance/invoices/new" element={<CreateInvoicePage />} />
          <Route path="/finance/invoices/:id" element={<InvoiceDetailPage />} />
          <Route path="/finance/transactions" element={<TransactionsPage />} />
          <Route path="/finance/expenses" element={<ExpensesPage />} />
          <Route path="/finance/reports" element={<FinanceReportsPage />} />

          {/* HR */}
          <Route path="/hr/overview" element={<HRDashboardPage />} />
          <Route path="/hr/employees" element={<EmployeesPage />} />
          <Route path="/hr/employees/:id" element={<EmployeeDetailPage />} />
          <Route path="/hr/attendance" element={<AttendancePage />} />
          <Route path="/hr/leaves" element={<LeavePage />} />
          <Route path="/hr/payroll" element={<PayrollPage />} />

          {/* Analytics */}
          <Route path="/analytics" element={<AnalyticsPage />} />

          {/* Other */}
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin/system" element={<SystemAdminPage />} />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
