import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Clock, RefreshCw, CheckSquare, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useGetAttendanceQuery, useBulkMarkAttendanceMutation, useGetEmployeesQuery } from '../../features/hr/hrApi';
import { setPageTitle, setBreadcrumbs } from '../../features/ui/uiSlice';
import { formatDate } from '../../utils/formatters';
import { cn } from '../../utils/cn';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  present: 'bg-green-500/20 text-green-600 dark:text-green-400 border-green-500/30',
  absent: 'bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30',
  half_day: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 border-yellow-500/30',
  on_leave: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  holiday: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
};

const AttendancePage = () => {
  const dispatch = useDispatch();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState(today.toISOString().split('T')[0]);
  const [selectedEmployees, setSelectedEmployees] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('present');
  const [bulkMarking, setBulkMarking] = useState(false);

  const monthStart = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
  const monthEnd = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];

  const { data, isLoading, isFetching, refetch } = useGetAttendanceQuery({
    dateFrom: monthStart, dateTo: monthEnd,
  });
  const { data: empData } = useGetEmployeesQuery({ limit: 100, status: 'active' });
  const [bulkMarkAttendance] = useBulkMarkAttendanceMutation();

  const attendance = data?.data || [];
  const employees = empData?.employees || empData?.data || [];

  useEffect(() => {
    dispatch(setPageTitle('Attendance'));
    dispatch(setBreadcrumbs([{ label: 'HR' }, { label: 'Attendance' }]));
  }, [dispatch]);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const getAttendanceForDate = (day) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance.filter((a) => a.date?.startsWith(dateStr));
  };

  const getDateSummary = (day) => {
    const records = getAttendanceForDate(day);
    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    return { present, absent, total: records.length };
  };

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear((y) => y - 1); }
    else setCurrentMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear((y) => y + 1); }
    else setCurrentMonth((m) => m + 1);
  };

  const toggleEmployee = (id) => {
    setSelectedEmployees((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedEmployees(employees.map((e) => e._id));
  };

  const handleBulkMark = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Select at least one employee.');
      return;
    }
    setBulkMarking(true);
    try {
      await bulkMarkAttendance({
        date: selectedDate,
        employees: selectedEmployees,
        status: bulkStatus,
      }).unwrap();
      toast.success(`Marked ${selectedEmployees.length} employees as ${bulkStatus}.`);
      setSelectedEmployees([]);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || 'Bulk mark failed.');
    } finally {
      setBulkMarking(false);
    }
  };

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Selected date attendance
  const selectedDateAttendance = attendance.filter((a) => a.date?.startsWith(selectedDate));

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="section-title">Attendance</h1>
          <p className="text-muted-foreground text-sm mt-1">Track and manage employee attendance</p>
        </div>
        <button onClick={refetch} className="btn-ghost p-2 self-start" title="Refresh">
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card-base p-5">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="btn-ghost p-2">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <h3 className="font-semibold text-foreground">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h3>
            <button onClick={nextMonth} className="btn-ghost p-2">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Day Headers */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_NAMES.map((day) => (
              <div key={day} className="text-center text-xs font-semibold text-muted-foreground py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {isLoading ? (
            <div className="h-64 shimmer rounded-lg" />
          ) : (
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const summary = getDateSummary(day);
                const isToday = dateStr === today.toISOString().split('T')[0];
                const isSelected = dateStr === selectedDate;
                const isWeekend = new Date(currentYear, currentMonth, day).getDay() % 6 === 0;

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDate(dateStr)}
                    className={cn(
                      'aspect-square rounded-lg p-1 text-xs transition-colors flex flex-col items-center justify-center gap-0.5',
                      isSelected ? 'bg-primary text-primary-foreground' :
                      isToday ? 'bg-primary/10 text-primary font-semibold' :
                      isWeekend ? 'text-muted-foreground/50' :
                      'hover:bg-accent text-foreground'
                    )}
                  >
                    <span className="font-medium">{day}</span>
                    {summary.total > 0 && !isSelected && (
                      <div className="flex gap-0.5">
                        {summary.present > 0 && <span className="w-1 h-1 rounded-full bg-green-500" />}
                        {summary.absent > 0 && <span className="w-1 h-1 rounded-full bg-red-500" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500" />Present</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" />Absent</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-500" />Half Day</span>
            <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" />On Leave</span>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Bulk Mark */}
          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Bulk Mark Attendance
            </h3>
            <div className="space-y-3">
              <div>
                <label className="label-base mb-1.5 block text-xs">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="input-base h-9 text-sm"
                />
              </div>
              <div>
                <label className="label-base mb-1.5 block text-xs">Status</label>
                <select
                  value={bulkStatus}
                  onChange={(e) => setBulkStatus(e.target.value)}
                  className="input-base h-9 text-sm"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="half_day">Half Day</option>
                  <option value="on_leave">On Leave</option>
                  <option value="holiday">Holiday</option>
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label-base text-xs">Employees ({selectedEmployees.length} selected)</label>
                  <button onClick={selectAll} className="text-xs text-primary hover:underline">Select All</button>
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 border border-border rounded-lg p-2">
                  {employees.slice(0, 20).map((emp) => (
                    <label key={emp._id} className="flex items-center gap-2 cursor-pointer hover:bg-accent rounded px-1 py-0.5">
                      <input
                        type="checkbox"
                        checked={selectedEmployees.includes(emp._id)}
                        onChange={() => toggleEmployee(emp._id)}
                        className="rounded"
                      />
                      <span className="text-xs text-foreground">{emp.firstName} {emp.lastName}</span>
                    </label>
                  ))}
                </div>
              </div>
              <button
                onClick={handleBulkMark}
                disabled={bulkMarking || selectedEmployees.length === 0}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                {bulkMarking && <Loader2 className="h-4 w-4 animate-spin" />}
                Mark Attendance
              </button>
            </div>
          </div>

          {/* Selected Date Summary */}
          <div className="card-base p-5">
            <h3 className="font-semibold text-foreground mb-3">
              {formatDate(selectedDate)}
            </h3>
            {selectedDateAttendance.length === 0 ? (
              <p className="text-sm text-muted-foreground">No records for this date.</p>
            ) : (
              <div className="space-y-2">
                {selectedDateAttendance.slice(0, 8).map((record) => (
                  <div key={record._id} className="flex items-center justify-between">
                    <span className="text-sm text-foreground">
                      {record.employee?.firstName} {record.employee?.lastName}
                    </span>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full border capitalize',
                      STATUS_COLORS[record.status] || 'bg-muted text-muted-foreground border-border'
                    )}>
                      {record.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                ))}
                {selectedDateAttendance.length > 8 && (
                  <p className="text-xs text-muted-foreground">+{selectedDateAttendance.length - 8} more</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Individual Attendance Marking Table */}
      <div className="mt-6 card-base overflow-hidden">
        <div className="p-4 border-b border-border bg-accent/5 flex items-center justify-between">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Mark Individual Attendance - {formatDate(selectedDate)}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Quick Status:</span>
            <div className="flex gap-1">
              {['present', 'absent', 'late', 'half_day'].map(status => (
                <span key={status} className={cn("px-2 py-0.5 rounded-full text-[10px] border capitalize", STATUS_COLORS[status])}>
                  {status.replace('_', ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-accent/5 border-b border-border">
                <th className="px-4 py-3 font-medium text-muted-foreground">Employee</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Role/Designation</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {employees.map((emp) => {
                const record = selectedDateAttendance.find(a => a.employee?._id === emp._id || a.employee === emp._id);
                return (
                  <tr key={emp._id} className="hover:bg-accent/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{emp.firstName} {emp.lastName}</span>
                        <span className="text-[10px] text-muted-foreground">{emp.employeeId}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">{emp.designation || 'Staff'}</span>
                    </td>
                    <td className="px-4 py-3">
                      {record ? (
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full border capitalize',
                          STATUS_COLORS[record.status]
                        )}>
                          {record.status?.replace(/_/g, ' ')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">Not Marked</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {['present', 'absent', 'late'].map((status) => (
                          <button
                            key={status}
                            onClick={() => {
                              bulkMarkAttendance({
                                date: selectedDate,
                                employees: [emp._id],
                                status: status
                              }).unwrap()
                                .then(() => {
                                  toast.success(`${emp.firstName} marked as ${status}`);
                                  refetch();
                                })
                                .catch(() => toast.error('Failed to mark attendance'));
                            }}
                            className={cn(
                              "p-1.5 rounded-md border transition-all",
                              record?.status === status 
                                ? "bg-primary border-primary text-white" 
                                : "hover:bg-accent border-border text-muted-foreground"
                            )}
                            title={`Mark as ${status}`}
                          >
                            <CheckSquare className="h-3.5 w-3.5" />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;
