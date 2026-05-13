import { apiSlice } from '../../app/api/apiSlice';

export const hrApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getHRDashboard: builder.query({
      query: () => '/hr/dashboard',
      providesTags: ['Employee'],
    }),
    getEmployees: builder.query({
      query: (params) => ({ url: '/hr/employees', params }),
      providesTags: ['Employee'],
    }),
    getEmployee: builder.query({
      query: (id) => `/hr/employees/${id}`,
      providesTags: (result, error, id) => [{ type: 'Employee', id }],
    }),
    createEmployee: builder.mutation({
      query: (data) => ({ url: '/hr/employees', method: 'POST', body: data }),
      invalidatesTags: ['Employee'],
    }),
    updateEmployee: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/hr/employees/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Employee'],
    }),
    deleteEmployee: builder.mutation({
      query: (id) => ({ url: `/hr/employees/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Employee'],
    }),
    getAttendance: builder.query({
      query: (params) => ({ url: '/hr/attendance', params }),
      providesTags: ['Attendance'],
    }),
    checkIn: builder.mutation({
      query: (data) => ({ url: '/hr/attendance/checkin', method: 'POST', body: data }),
      invalidatesTags: ['Attendance'],
    }),
    checkOut: builder.mutation({
      query: (data) => ({ url: '/hr/attendance/checkout', method: 'POST', body: data }),
      invalidatesTags: ['Attendance'],
    }),
    bulkMarkAttendance: builder.mutation({
      query: (data) => ({ url: '/hr/attendance/bulk', method: 'POST', body: data }),
      invalidatesTags: ['Attendance'],
    }),
    getAttendanceReport: builder.query({
      query: (params) => ({ url: '/hr/attendance/report', params }),
    }),
    getLeaves: builder.query({
      query: (params) => ({ url: '/hr/leaves', params }),
    }),
    applyLeave: builder.mutation({
      query: (data) => ({ url: '/hr/leaves', method: 'POST', body: data }),
    }),
    approveLeave: builder.mutation({
      query: (id) => ({ url: `/hr/leaves/${id}/approve`, method: 'PUT' }),
    }),
    rejectLeave: builder.mutation({
      query: (id) => ({ url: `/hr/leaves/${id}/reject`, method: 'PUT' }),
    }),
    getPayroll: builder.query({
      query: (params) => ({ url: '/hr/payroll', params }),
    }),
    generatePayroll: builder.mutation({
      query: (data) => ({ url: '/hr/payroll/generate', method: 'POST', body: data }),
    }),
    getDepartments: builder.query({
      query: () => '/hr/departments',
    }),
    createDepartment: builder.mutation({
      query: (data) => ({ url: '/hr/departments', method: 'POST', body: data }),
    }),
  }),
});

export const {
  useGetHRDashboardQuery,
  useGetEmployeesQuery,
  useGetEmployeeQuery,
  useCreateEmployeeMutation,
  useUpdateEmployeeMutation,
  useDeleteEmployeeMutation,
  useGetAttendanceQuery,
  useCheckInMutation,
  useCheckOutMutation,
  useBulkMarkAttendanceMutation,
  useGetAttendanceReportQuery,
  useGetLeavesQuery,
  useApplyLeaveMutation,
  useApproveLeaveMutation,
  useRejectLeaveMutation,
  useGetPayrollQuery,
  useGeneratePayrollMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
} = hrApi;
