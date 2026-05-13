import { apiSlice } from '../../app/api/apiSlice';

export const analyticsApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getOverview: builder.query({
      query: () => '/analytics/overview',
      providesTags: ['Analytics'],
    }),
    getRevenueAnalytics: builder.query({
      query: (params) => ({ url: '/analytics/revenue', params }),
    }),
    getInventoryAnalytics: builder.query({
      query: () => '/analytics/inventory',
    }),
    getHRAnalytics: builder.query({
      query: () => '/analytics/hr',
    }),
    getSalesAnalytics: builder.query({
      query: (params) => ({ url: '/analytics/sales', params }),
    }),
    getKPIs: builder.query({
      query: () => '/analytics/kpi',
      providesTags: ['Analytics'],
    }),
    getForecast: builder.query({
      query: () => '/analytics/forecast',
    }),
  }),
});

export const {
  useGetOverviewQuery,
  useGetRevenueAnalyticsQuery,
  useGetInventoryAnalyticsQuery,
  useGetHRAnalyticsQuery,
  useGetSalesAnalyticsQuery,
  useGetKPIsQuery,
  useGetForecastQuery,
} = analyticsApi;
