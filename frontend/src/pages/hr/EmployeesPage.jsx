import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, RefreshCw, Eye, X, Loader2, Users } from 'lucide-react';
import { useGetEmployeesQuery, useCreateEmployeeMutation, useGetDepartmentsQuery } from '../../features/hr/hrApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { getInitials } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const AddEmployeeModal = ({ onClose }) => {
  const [createEmployee, { isLoading }] = useCreateEmployeeMutation();
  const { data: deptData } = useGetDepartmentsQuery();
  const departments = deptData?.data || [];

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    department: '', designation: '', employeeId: '',
    joiningDate: new Date().toISOString().split('T')[0],
    salary: '', employmentType: 'full_time',
    createUser: false, roleType: 'support_staff', password: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      toast.error('First name, last name, and email are required.');
      return;
    }
    try {
      await createEmployee(form).unwrap();
      toast.success('Employee added.');
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to add employee.');
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
        <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Add Employee</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base mb-1.5 block">First Name <span className="text-destructive">*</span></label>
                  <input value={form.firstName} onChange={set('firstName')} placeholder="John" className="input-base" />
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Last Name <span className="text-destructive">*</span></label>
                  <input value={form.lastName} onChange={set('lastName')} placeholder="Doe" className="input-base" />
                </div>
              </div>
              <div>
                <label className="label-base mb-1.5 block">Email <span className="text-destructive">*</span></label>
                <input type="email" value={form.email} onChange={set('email')} placeholder="john.doe@company.com" className="input-base" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base mb-1.5 block">Phone</label>
                  <input value={form.phone} onChange={set('phone')} placeholder="+91 98765 43210" className="input-base" />
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Employee ID</label>
                  <input value={form.employeeId} onChange={set('employeeId')} placeholder="EMP-001" className="input-base" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base mb-1.5 block">Department</label>
                  <select value={form.department} onChange={set('department')} className="input-base">
                    <option value="">Select department</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d._id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Designation</label>
                  <input value={form.designation} onChange={set('designation')} placeholder="Software Engineer" className="input-base" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-base mb-1.5 block">Joining Date</label>
                  <input type="date" value={form.joiningDate} onChange={set('joiningDate')} className="input-base" />
                </div>
                <div>
                  <label className="label-base mb-1.5 block">Employment Type</label>
                  <select value={form.employmentType} onChange={set('employmentType')} className="input-base">
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="contract">Contract</option>
                    <option value="intern">Intern</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="createUser"
                  checked={form.createUser}
                  onChange={(e) => setForm((f) => ({ ...f, createUser: e.target.checked }))}
                  className="rounded border-border text-primary focus:ring-primary h-4 w-4"
                />
                <label htmlFor="createUser" className="text-sm font-medium text-foreground cursor-pointer">
                  Create system user account for this employee
                </label>
              </div>

              {form.createUser && (
                <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="label-base mb-1.5 block text-xs">Portal Role</label>
                    <select value={form.roleType} onChange={set('roleType')} className="input-base text-sm">
                      <option value="manager">Manager</option>
                      <option value="hr">HR Staff</option>
                      <option value="accountant">Accountant</option>
                      <option value="inventory_staff">Inventory Staff</option>
                      <option value="sales_executive">Sales Executive</option>
                      <option value="support_staff">Support Staff</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-base mb-1.5 block text-xs">Password <span className="text-destructive">*</span></label>
                    <input
                      type="password"
                      value={form.password}
                      onChange={set('password')}
                      placeholder="••••••••"
                      className="input-base text-sm"
                      required={form.createUser}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="label-base mb-1.5 block">Monthly Salary (₹)</label>
                <input type="number" value={form.salary} onChange={set('salary')} placeholder="50000" className="input-base" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border bg-muted/30">
              <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Add Employee
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </>
  );
};

const EmployeesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading, isFetching, refetch } = useGetEmployeesQuery({
    page, limit: 20, search, department: deptFilter, status: statusFilter,
  });
  const { data: deptData } = useGetDepartmentsQuery();

  const employees = data?.employees || data?.data || [];
  const pagination = data?.pagination || {};
  const departments = deptData?.data || [];

  useEffect(() => {
    dispatch(setPageTitle('Employees'));
    dispatch(setBreadcrumbs([{ label: 'HR' }, { label: 'Employees' }]));
  }, [dispatch]);

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Employees</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {pagination.total || employees.length} employees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refetch} className="btn-ghost p-2" title="Refresh">
            <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
          </button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Employee
          </button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search employees..."
            className="input-base pl-9"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
          className="input-base w-auto"
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="input-base w-auto"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="on_leave">On Leave</option>
        </select>
      </div>

      <div className="table-container">
        <table className="table-base">
          <thead className="table-header">
            <tr>
              <th className="table-th">Employee</th>
              <th className="table-th">Employee ID</th>
              <th className="table-th">Department</th>
              <th className="table-th">Designation</th>
              <th className="table-th">Type</th>
              <th className="table-th">Status</th>
              <th className="table-th text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i} className="table-row">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j} className="table-td">
                      <div className="shimmer h-4 rounded w-full max-w-[120px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-td text-center py-16">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                  <p className="text-muted-foreground">No employees found</p>
                  <button onClick={() => setShowModal(true)} className="btn-primary mt-3 text-sm">
                    Add your first employee
                  </button>
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <motion.tr
                  key={emp._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="table-row"
                >
                  <td className="table-td">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {emp.avatar ? (
                          <img src={emp.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <span className="text-xs font-semibold text-primary">
                            {getInitials(emp.firstName, emp.lastName)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-muted-foreground">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="table-td">
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono">{emp.employeeId || '—'}</code>
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {emp.department?.name || emp.department || '—'}
                  </td>
                  <td className="table-td text-sm text-muted-foreground">
                    {emp.designation || '—'}
                  </td>
                  <td className="table-td">
                    <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground capitalize">
                      {emp.employmentType?.replace(/_/g, ' ') || 'Full Time'}
                    </span>
                  </td>
                  <td className="table-td">
                    {emp.status === 'active' ? (
                      <span className="badge-success">Active</span>
                    ) : emp.status === 'on_leave' ? (
                      <span className="badge-warning">On Leave</span>
                    ) : (
                      <span className="badge-danger">Inactive</span>
                    )}
                  </td>
                  <td className="table-td">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => navigate(`/hr/employees/${emp._id}`)}
                        className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {pagination.pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Showing {((page - 1) * 20) + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && <AddEmployeeModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
};

export default EmployeesPage;
