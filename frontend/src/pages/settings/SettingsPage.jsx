import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, Users, Shield, Bell, Lock, CreditCard,
  X, Loader2, Plus, Edit, Check, Mail,
} from 'lucide-react';
import {
  useGetMyTenantQuery, useUpdateTenantMutation,
  useGetTenantUsersQuery, useInviteUserMutation,
  useGetRolesQuery, useUpdateRoleMutation,
} from '../../features/tenant/tenantApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatDate, getInitials } from '../../utils/formatters';
import { useChangePasswordMutation } from '../../features/auth/authApi';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'roles', label: 'Roles', icon: Shield },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'api', label: 'API Keys', icon: CreditCard },
  { id: 'billing', label: 'Billing', icon: CreditCard },
];

const InviteUserModal = ({ onClose }) => {
  const [inviteUser, { isLoading }] = useInviteUserMutation();
  const [form, setForm] = useState({ email: '', role: 'member', firstName: '', lastName: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email) { toast.error('Email is required.'); return; }
    try {
      await inviteUser(form).unwrap();
      toast.success(`Invitation sent to ${form.email}.`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Invite failed.');
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Invite User</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label-base mb-1.5 block">First Name</label>
                <input value={form.firstName} onChange={set('firstName')} placeholder="John" className="input-base" />
              </div>
              <div>
                <label className="label-base mb-1.5 block">Last Name</label>
                <input value={form.lastName} onChange={set('lastName')} placeholder="Doe" className="input-base" />
              </div>
            </div>
            <div>
              <label className="label-base mb-1.5 block">Email <span className="text-destructive">*</span></label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="john@company.com" className="input-base" />
            </div>
            <div>
              <label className="label-base mb-1.5 block">Role</label>
              <select value={form.role} onChange={set('role')} className="input-base">
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send Invite
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

const ChangePasswordForm = () => {
  const [changePassword, { isLoading }] = useChangePasswordMutation();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match.'); return; }
    try {
      await changePassword(form).unwrap();
      toast.success('Password updated successfully.');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err?.data?.message || 'Update failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <div>
        <label className="label-base mb-1.5 block">Current Password</label>
        <input 
          type="password" 
          value={form.currentPassword} 
          onChange={(e) => setForm(f => ({ ...f, currentPassword: e.target.value }))} 
          className="input-base" 
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label-base mb-1.5 block">New Password</label>
          <input 
            type="password" 
            value={form.newPassword} 
            onChange={(e) => setForm(f => ({ ...f, newPassword: e.target.value }))} 
            className="input-base" 
          />
        </div>
        <div>
          <label className="label-base mb-1.5 block">Confirm Password</label>
          <input 
            type="password" 
            value={form.confirmPassword} 
            onChange={(e) => setForm(f => ({ ...f, confirmPassword: e.target.value }))} 
            className="input-base" 
          />
        </div>
      </div>
      <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
        Update Password
      </button>
    </form>
  );
};

const SettingsPage = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('company');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);

  const { data: tenantData, isLoading: tenantLoading } = useGetMyTenantQuery();
  const { data: usersData, isLoading: usersLoading } = useGetTenantUsersQuery({}, { skip: activeTab !== 'users' });
  const { data: rolesData, isLoading: rolesLoading } = useGetRolesQuery(undefined, { skip: activeTab !== 'roles' });
  const [updateTenant] = useUpdateTenantMutation();
  const [updateRole] = useUpdateRoleMutation();

  const tenant = tenantData?.data || tenantData || {};
  const users = usersData?.data || usersData?.users || [];
  const roles = rolesData?.data || rolesData?.roles || [];

  const [companyForm, setCompanyForm] = useState({
    name: '', email: '', phone: '', website: '', address: '', currency: 'INR', timezone: 'Asia/Kolkata',
  });

  useEffect(() => {
    if (tenant.name) {
      setCompanyForm({
        name: tenant.name || '',
        email: tenant.email || '',
        phone: tenant.phone || '',
        website: tenant.website || '',
        address: tenant.address || '',
        currency: tenant.currency || 'INR',
        timezone: tenant.timezone || 'Asia/Kolkata',
      });
    }
  }, [tenant]);

  useEffect(() => {
    dispatch(setPageTitle('Settings'));
    dispatch(setBreadcrumbs([{ label: 'Settings' }]));
  }, [dispatch]);

  const handleSaveCompany = async (e) => {
    e.preventDefault();
    setSavingCompany(true);
    try {
      await updateTenant(companyForm).unwrap();
      toast.success('Company settings saved.');
    } catch (err) {
      toast.error(err?.data?.message || 'Save failed.');
    } finally {
      setSavingCompany(false);
    }
  };

  const setCompanyField = (key) => (e) => setCompanyForm((f) => ({ ...f, [key]: e.target.value }));

  const ALL_PERMISSIONS = ['read', 'create', 'update', 'delete', 'approve', 'export'];
  const MODULES = ['inventory', 'finance', 'hr', 'analytics', 'settings'];

  return (
    <div className="page-container">
      <div>
        <h1 className="section-title">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your organization settings</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex-shrink-0">
          <div className="card-base p-2 space-y-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <tab.icon className="h-4 w-4 flex-shrink-0" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              {/* Company Tab */}
              {activeTab === 'company' && (
                <div className="card-base p-6">
                  <h2 className="font-semibold text-foreground text-lg mb-6">Company Settings</h2>
                  {tenantLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-10 rounded-lg" />)}
                    </div>
                  ) : (
                    <form onSubmit={handleSaveCompany} className="space-y-5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="label-base mb-1.5 block">Company Name</label>
                          <input value={companyForm.name} onChange={setCompanyField('name')} className="input-base" />
                        </div>
                        <div>
                          <label className="label-base mb-1.5 block">Business Email</label>
                          <input type="email" value={companyForm.email} onChange={setCompanyField('email')} className="input-base" />
                        </div>
                        <div>
                          <label className="label-base mb-1.5 block">Phone</label>
                          <input value={companyForm.phone} onChange={setCompanyField('phone')} className="input-base" />
                        </div>
                        <div>
                          <label className="label-base mb-1.5 block">Website</label>
                          <input value={companyForm.website} onChange={setCompanyField('website')} placeholder="https://example.com" className="input-base" />
                        </div>
                        <div>
                          <label className="label-base mb-1.5 block">Currency</label>
                          <select value={companyForm.currency} onChange={setCompanyField('currency')} className="input-base">
                            <option value="INR">INR (₹)</option>
                            <option value="USD">USD ($)</option>
                            <option value="EUR">EUR (€)</option>
                            <option value="GBP">GBP (£)</option>
                          </select>
                        </div>
                        <div>
                          <label className="label-base mb-1.5 block">Timezone</label>
                          <select value={companyForm.timezone} onChange={setCompanyField('timezone')} className="input-base">
                            <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                            <option value="America/New_York">America/New_York (EST)</option>
                            <option value="Europe/London">Europe/London (GMT)</option>
                            <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="label-base mb-1.5 block">Address</label>
                        <textarea value={companyForm.address} onChange={setCompanyField('address')} rows={3} className="input-base resize-none" />
                      </div>
                      <div className="flex justify-end pt-2">
                        <button type="submit" disabled={savingCompany} className="btn-primary flex items-center gap-2">
                          {savingCompany ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          Save Changes
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* Users Tab */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-foreground text-lg">Team Members</h2>
                    <button onClick={() => setShowInviteModal(true)} className="btn-primary flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Invite User
                    </button>
                  </div>
                  <div className="table-container">
                    <table className="table-base">
                      <thead className="table-header">
                        <tr>
                          <th className="table-th">User</th>
                          <th className="table-th">Role</th>
                          <th className="table-th">Joined</th>
                          <th className="table-th">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersLoading ? (
                          Array.from({ length: 5 }).map((_, i) => (
                            <tr key={i} className="table-row">
                              {Array.from({ length: 4 }).map((_, j) => (
                                <td key={j} className="table-td"><div className="shimmer h-4 rounded w-full max-w-[120px]" /></td>
                              ))}
                            </tr>
                          ))
                        ) : users.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="table-td text-center py-12">
                              <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                              <p className="text-muted-foreground text-sm">No users found</p>
                            </td>
                          </tr>
                        ) : (
                          users.map((user) => (
                            <tr key={user._id} className="table-row">
                              <td className="table-td">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                    <span className="text-xs font-semibold text-primary">
                                      {getInitials(user.firstName, user.lastName)}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{user.firstName} {user.lastName}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="table-td">
                                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize">
                                  {user.role}
                                </span>
                              </td>
                              <td className="table-td text-sm text-muted-foreground">{formatDate(user.createdAt)}</td>
                              <td className="table-td">
                                {user.status === 'active' ? <span className="badge-success">Active</span> :
                                 user.status === 'invited' ? <span className="badge-warning">Invited</span> :
                                 <span className="badge-danger">Inactive</span>}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Roles Tab */}
              {activeTab === 'roles' && (
                <div className="space-y-4">
                  <h2 className="font-semibold text-foreground text-lg">Role Permissions</h2>
                  {rolesLoading ? (
                    <div className="card-base p-6 space-y-4">
                      {Array.from({ length: 4 }).map((_, i) => <div key={i} className="shimmer h-10 rounded" />)}
                    </div>
                  ) : (
                    <div className="card-base overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="table-base">
                          <thead className="table-header">
                            <tr>
                              <th className="table-th">Module</th>
                              {roles.map((role) => (
                                <th key={role._id} className="table-th text-center capitalize">{role.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {MODULES.map((module) => (
                              <tr key={module} className="table-row">
                                <td className="table-td font-medium capitalize">{module}</td>
                                {roles.map((role) => {
                                  const perms = role.permissions?.[module] || [];
                                  return (
                                    <td key={role._id} className="table-td text-center">
                                      <div className="flex flex-wrap gap-1 justify-center">
                                        {ALL_PERMISSIONS.map((perm) => (
                                          <span
                                            key={perm}
                                            className={cn(
                                              'text-xs px-1.5 py-0.5 rounded',
                                              perms.includes(perm)
                                                ? 'bg-green-500/10 text-green-600 dark:text-green-400'
                                                : 'bg-muted text-muted-foreground/40'
                                            )}
                                          >
                                            {perm}
                                          </span>
                                        ))}
                                      </div>
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="card-base p-6">
                  <h2 className="font-semibold text-foreground text-lg mb-6">Notification Preferences</h2>
                  <div className="space-y-4">
                    {[
                      { label: 'Low Stock Alerts', desc: 'Get notified when products fall below minimum stock level', key: 'lowStock' },
                      { label: 'Invoice Due Reminders', desc: 'Reminders for upcoming and overdue invoices', key: 'invoiceDue' },
                      { label: 'Leave Requests', desc: 'Notifications for new leave requests', key: 'leaveRequests' },
                      { label: 'Purchase Order Updates', desc: 'Updates on PO status changes', key: 'poUpdates' },
                      { label: 'Payroll Processing', desc: 'Notifications when payroll is generated', key: 'payroll' },
                      { label: 'System Alerts', desc: 'Critical system notifications', key: 'system' },
                    ].map((item) => (
                      <div key={item.key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="sr-only peer" />
                          <div className="w-10 h-5 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Change Password */}
                  <div className="card-base p-6">
                    <h2 className="font-semibold text-foreground text-lg mb-6 flex items-center gap-2">
                      <Lock className="h-5 w-5 text-blue-500" />
                      Account Password
                    </h2>
                    <ChangePasswordForm />
                  </div>

                  {/* Security Policy */}
                  <div className="card-base p-6">
                    <h2 className="font-semibold text-foreground text-lg mb-4">Organization Security Policy</h2>
                    <div className="space-y-4">
                      {[
                        { label: 'Two-Factor Authentication', desc: 'Require 2FA for all users in the organization', enabled: false },
                        { label: 'Session Timeout', desc: 'Auto-logout after 30 minutes of inactivity', enabled: true },
                        { label: 'IP Whitelist', desc: 'Restrict access to specific IP addresses', enabled: false },
                        { label: 'Audit Logging', desc: 'Log all user actions for compliance', enabled: true },
                        { label: 'Password Rotation', desc: 'Force password change every 90 days', enabled: false },
                      ].map((item) => (
                        <div key={item.label} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                          <div>
                            <p className="text-sm font-medium text-foreground">{item.label}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked={item.enabled} className="sr-only peer" />
                            <div className="w-10 h-5 bg-muted peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-5 peer-checked:bg-primary after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* API Keys Tab */}
              {activeTab === 'api' && (
                <div className="card-base p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="font-semibold text-foreground text-lg">API Keys</h2>
                      <p className="text-xs text-muted-foreground mt-1">Manage API keys for external integrations</p>
                    </div>
                    <button className="btn-primary flex items-center gap-2">
                      <Plus className="h-4 w-4" /> Create Key
                    </button>
                  </div>
                  
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      Never share your API keys. They provide full access to your organization's data.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {[
                      { name: 'Default Production Key', key: 'erp_live_********************', created: '2024-03-10', lastUsed: '2 hours ago' },
                      { name: 'Testing Key', key: 'erp_test_********************', created: '2024-05-01', lastUsed: 'Never' },
                    ].map((key) => (
                      <div key={key.name} className="flex items-center justify-between p-4 border border-border rounded-xl">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{key.name}</p>
                          <code className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded mt-1 block w-fit">
                            {key.key}
                          </code>
                          <p className="text-[10px] text-muted-foreground mt-2">
                            Created: {key.created} • Last Used: {key.lastUsed}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="p-2 hover:bg-accent rounded-lg text-muted-foreground"><Edit className="h-4 w-4" /></button>
                          <button className="p-2 hover:bg-destructive/10 rounded-lg text-destructive"><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Billing Tab */}
              {activeTab === 'billing' && (
                <div className="space-y-4">
                  <div className="card-base p-6">
                    <h2 className="font-semibold text-foreground text-lg mb-4">Billing & Subscription</h2>
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{tenant.plan || 'Professional'} Plan</p>
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Renews on {formatDate(tenant.planExpiresAt) || 'N/A'}
                          </p>
                        </div>
                        <span className="badge-success">Active</span>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      {[
                        { label: 'Users', value: `${users.length} / ${tenant.maxUsers || 'Unlimited'}` },
                        { label: 'Storage', value: `${tenant.storageUsed || 0} GB / ${tenant.maxStorage || 10} GB` },
                        { label: 'API Calls', value: `${tenant.apiCallsThisMonth || 0} / month` },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between py-2 border-b border-border last:border-0">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-medium text-foreground">{value}</span>
                        </div>
                      ))}
                    </div>
                    <button className="btn-primary mt-4">Upgrade Plan</button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showInviteModal && <InviteUserModal onClose={() => setShowInviteModal(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default SettingsPage;
