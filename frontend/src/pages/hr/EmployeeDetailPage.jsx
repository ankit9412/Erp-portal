import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Calendar, Clock, DollarSign, Mail, Phone, MapPin } from 'lucide-react';
import { useGetEmployeeQuery, useGetAttendanceQuery, useGetLeavesQuery, useGetPayrollQuery } from '../../features/hr/hrApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatCurrency, formatDate, getInitials } from '../../utils/formatters';
import { cn } from '../../utils/cn';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Users },
  { id: 'attendance', label: 'Attendance', icon: Clock },
  { id: 'leave', label: 'Leave', icon: Calendar },
  { id: 'payroll', label: 'Payroll', icon: DollarSign },
];

const EmployeeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: empData, isLoading } = useGetEmployeeQuery(id);
  const { data: attendanceData } = useGetAttendanceQuery({ employeeId: id, limit: 10 }, { skip: activeTab !== 'attendance' });
  const { data: leavesData } = useGetLeavesQuery({ employeeId: id }, { skip: activeTab !== 'leave' });
  const { data: payrollData } = useGetPayrollQuery({ employeeId: id }, { skip: activeTab !== 'payroll' });

  const employee = empData?.data || empData;
  const attendance = attendanceData?.data || [];
  const leaves = leavesData?.data || [];
  const payroll = payrollData?.data || [];

  useEffect(() => {
    if (employee) {
      dispatch(setPageTitle(`${employee.firstName} ${employee.lastName}`));
      dispatch(setBreadcrumbs([
        { label: 'HR' },
        { label: 'Employees', href: '/hr/employees' },
        { label: `${employee.firstName} ${employee.lastName}` },
      ]));
    }
  }, [dispatch, employee]);

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="shimmer h-8 w-48 rounded mb-6" />
        <div className="card-base p-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="shimmer h-6 rounded" />)}
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="page-container">
        <div className="text-center py-20">
          <Users className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Employee not found.</p>
          <button onClick={() => navigate(-1)} className="btn-secondary mt-4">Go Back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="btn-ghost p-2">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            {employee.avatar ? (
              <img src={employee.avatar} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-primary">
                {getInitials(employee.firstName, employee.lastName)}
              </span>
            )}
          </div>
          <div>
            <h1 className="section-title">{employee.firstName} {employee.lastName}</h1>
            <p className="text-muted-foreground text-sm">
              {employee.designation || '—'} · {employee.department?.name || employee.department || '—'}
            </p>
          </div>
          <div className="ml-auto">
            {employee.status === 'active' ? (
              <span className="badge-success">Active</span>
            ) : employee.status === 'on_leave' ? (
              <span className="badge-warning">On Leave</span>
            ) : (
              <span className="badge-danger">Inactive</span>
            )}
          </div>
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

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="card-base p-6">
              <h3 className="font-semibold text-foreground mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Email', value: employee.email, icon: Mail },
                  { label: 'Phone', value: employee.phone || '—', icon: Phone },
                  { label: 'Address', value: employee.address || '—', icon: MapPin },
                  { label: 'Date of Birth', value: formatDate(employee.dateOfBirth), icon: Calendar },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">{label}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card-base p-6">
              <h3 className="font-semibold text-foreground mb-4">Employment Details</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Employee ID', value: employee.employeeId || '—' },
                  { label: 'Employment Type', value: employee.employmentType?.replace(/_/g, ' ') || '—' },
                  { label: 'Joining Date', value: formatDate(employee.joiningDate) },
                  { label: 'Reporting To', value: employee.reportingTo ? `${employee.reportingTo.firstName} ${employee.reportingTo.lastName}` : '—' },
                  { label: 'Work Location', value: employee.workLocation || '—' },
                  { label: 'Shift', value: employee.shift || '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground mt-0.5 capitalize">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="card-base p-5">
              <h3 className="font-semibold text-foreground mb-4">Compensation</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Monthly Salary</span>
                  <span className="font-semibold text-foreground">{formatCurrency(employee.salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Annual CTC</span>
                  <span className="font-semibold text-foreground">{formatCurrency((employee.salary || 0) * 12)}</span>
                </div>
              </div>
            </div>

            <div className="card-base p-5">
              <h3 className="font-semibold text-foreground mb-4">Leave Balance</h3>
              <div className="space-y-3">
                {[
                  { label: 'Annual Leave', used: employee.leaveBalance?.annual?.used || 0, total: employee.leaveBalance?.annual?.total || 21 },
                  { label: 'Sick Leave', used: employee.leaveBalance?.sick?.used || 0, total: employee.leaveBalance?.sick?.total || 10 },
                  { label: 'Casual Leave', used: employee.leaveBalance?.casual?.used || 0, total: employee.leaveBalance?.casual?.total || 7 },
                ].map((leave) => (
                  <div key={leave.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">{leave.label}</span>
                      <span className="text-foreground">{leave.used}/{leave.total} days</span>
                    </div>
                    <div className="bg-muted rounded-full h-1.5">
                      <div
                        className="bg-primary h-1.5 rounded-full"
                        style={{ width: `${Math.min(100, (leave.used / leave.total) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="table-container">
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Date</th>
                  <th className="table-th">Check In</th>
                  <th className="table-th">Check Out</th>
                  <th className="table-th">Hours</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="table-td text-center py-12">
                      <Clock className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-muted-foreground text-sm">No attendance records</p>
                    </td>
                  </tr>
                ) : (
                  attendance.map((record) => (
                    <tr key={record._id} className="table-row">
                      <td className="table-td text-sm">{formatDate(record.date)}</td>
                      <td className="table-td text-sm text-muted-foreground">{record.checkIn || '—'}</td>
                      <td className="table-td text-sm text-muted-foreground">{record.checkOut || '—'}</td>
                      <td className="table-td text-sm">{record.hoursWorked ? `${record.hoursWorked}h` : '—'}</td>
                      <td className="table-td">
                        {record.status === 'present' ? <span className="badge-success">Present</span> :
                         record.status === 'absent' ? <span className="badge-danger">Absent</span> :
                         record.status === 'half_day' ? <span className="badge-warning">Half Day</span> :
                         <span className="badge-info">On Leave</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Leave Tab */}
      {activeTab === 'leave' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="table-container">
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Type</th>
                  <th className="table-th">From</th>
                  <th className="table-th">To</th>
                  <th className="table-th">Days</th>
                  <th className="table-th">Reason</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-td text-center py-12">
                      <Calendar className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-muted-foreground text-sm">No leave records</p>
                    </td>
                  </tr>
                ) : (
                  leaves.map((leave) => (
                    <tr key={leave._id} className="table-row">
                      <td className="table-td text-sm capitalize">{leave.type?.replace(/_/g, ' ')}</td>
                      <td className="table-td text-sm text-muted-foreground">{formatDate(leave.startDate)}</td>
                      <td className="table-td text-sm text-muted-foreground">{formatDate(leave.endDate)}</td>
                      <td className="table-td text-sm">{leave.days || '—'}</td>
                      <td className="table-td text-sm text-muted-foreground">{leave.reason || '—'}</td>
                      <td className="table-td">
                        {leave.status === 'approved' ? <span className="badge-success">Approved</span> :
                         leave.status === 'rejected' ? <span className="badge-danger">Rejected</span> :
                         <span className="badge-warning">Pending</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Payroll Tab */}
      {activeTab === 'payroll' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="table-container">
            <table className="table-base">
              <thead className="table-header">
                <tr>
                  <th className="table-th">Month</th>
                  <th className="table-th">Basic</th>
                  <th className="table-th">Allowances</th>
                  <th className="table-th">Deductions</th>
                  <th className="table-th">Net Pay</th>
                  <th className="table-th">Status</th>
                </tr>
              </thead>
              <tbody>
                {payroll.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="table-td text-center py-12">
                      <DollarSign className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                      <p className="text-muted-foreground text-sm">No payroll records</p>
                    </td>
                  </tr>
                ) : (
                  payroll.map((record) => (
                    <tr key={record._id} className="table-row">
                      <td className="table-td text-sm font-medium">{record.month}/{record.year}</td>
                      <td className="table-td text-sm">{formatCurrency(record.basicSalary)}</td>
                      <td className="table-td text-sm text-green-500">{formatCurrency(record.totalAllowances)}</td>
                      <td className="table-td text-sm text-red-500">{formatCurrency(record.totalDeductions)}</td>
                      <td className="table-td font-semibold text-sm">{formatCurrency(record.netPay)}</td>
                      <td className="table-td">
                        {record.status === 'paid' ? <span className="badge-success">Paid</span> :
                         <span className="badge-warning">Pending</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EmployeeDetailPage;
