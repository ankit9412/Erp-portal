import { apiSlice } from '../../app/api/apiSlice';

export const financeApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getFinanceDashboard: builder.query({
      query: (params) => ({ url: '/finance/dashboard', params }),
      providesTags: ['Invoice', 'Transaction'],
    }),
    getInvoices: builder.query({
      query: (params) => ({ url: '/finance/invoices', params }),
      providesTags: ['Invoice'],
    }),
    getInvoice: builder.query({
      query: (id) => `/finance/invoices/${id}`,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),
    createInvoice: builder.mutation({
      query: (data) => ({ url: '/finance/invoices', method: 'POST', body: data }),
      invalidatesTags: ['Invoice', 'Transaction'],
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/finance/invoices/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Invoice'],
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({ url: `/finance/invoices/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Invoice'],
    }),
    sendInvoice: builder.mutation({
      query: (id) => ({ url: `/finance/invoices/${id}/send`, method: 'POST' }),
      invalidatesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),
    recordPayment: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/finance/invoices/${id}/payment`, method: 'POST', body: data }),
      invalidatesTags: ['Invoice', 'Transaction'],
    }),
    getTransactions: builder.query({
      query: (params) => ({ url: '/finance/transactions', params }),
      providesTags: ['Transaction'],
    }),
    createTransaction: builder.mutation({
      query: (data) => ({ url: '/finance/transactions', method: 'POST', body: data }),
      invalidatesTags: ['Transaction'],
    }),
    getExpenses: builder.query({
      query: (params) => ({ url: '/finance/expenses', params }),
      providesTags: ['Transaction'],
    }),
    createExpense: builder.mutation({
      query: (data) => ({ url: '/finance/expenses', method: 'POST', body: data }),
      invalidatesTags: ['Transaction'],
    }),
    getProfitLossReport: builder.query({
      query: (params) => ({ url: '/finance/reports/profit-loss', params }),
    }),
    getTaxReport: builder.query({
      query: (params) => ({ url: '/finance/reports/tax', params }),
    }),
    exportReport: builder.query({
      query: (params) => ({ url: '/finance/reports/export', params }),
    }),
  }),
});

export const {
  useGetFinanceDashboardQuery,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useSendInvoiceMutation,
  useRecordPaymentMutation,
  useGetTransactionsQuery,
  useCreateTransactionMutation,
  useGetExpensesQuery,
  useCreateExpenseMutation,
  useGetProfitLossReportQuery,
  useGetTaxReportQuery,
} = financeApi;
