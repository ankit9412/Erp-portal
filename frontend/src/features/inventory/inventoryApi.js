import { apiSlice } from '../../app/api/apiSlice';

export const inventoryApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getInventoryDashboard: builder.query({
      query: () => '/inventory/dashboard',
      providesTags: ['Product', 'Stock'],
    }),
    getProducts: builder.query({
      query: (params) => ({ url: '/inventory/products', params }),
      providesTags: ['Product'],
    }),
    getProduct: builder.query({
      query: (id) => `/inventory/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    createProduct: builder.mutation({
      query: (data) => ({ url: '/inventory/products', method: 'POST', body: data }),
      invalidatesTags: ['Product', 'Stock'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/inventory/products/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }, 'Product'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({ url: `/inventory/products/${id}`, method: 'DELETE' }),
      invalidatesTags: ['Product'],
    }),
    getStock: builder.query({
      query: (params) => ({ url: '/inventory/stock', params }),
      providesTags: ['Stock'],
    }),
    adjustStock: builder.mutation({
      query: (data) => ({ url: '/inventory/stock/adjust', method: 'POST', body: data }),
      invalidatesTags: ['Stock', 'Product'],
    }),
    transferStock: builder.mutation({
      query: (data) => ({ url: '/inventory/stock/transfer', method: 'POST', body: data }),
      invalidatesTags: ['Stock'],
    }),
    getStockMovements: builder.query({
      query: (params) => ({ url: '/inventory/stock/movements', params }),
    }),
    getLowStockProducts: builder.query({
      query: () => '/inventory/stock/low-stock',
      providesTags: ['Product'],
    }),
    getWarehouses: builder.query({
      query: () => '/inventory/warehouses',
      providesTags: ['Warehouse'],
    }),
    createWarehouse: builder.mutation({
      query: (data) => ({ url: '/inventory/warehouses', method: 'POST', body: data }),
      invalidatesTags: ['Warehouse'],
    }),
    updateWarehouse: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/inventory/warehouses/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Warehouse'],
    }),
    getSuppliers: builder.query({
      query: (params) => ({ url: '/inventory/suppliers', params }),
      providesTags: ['Supplier'],
    }),
    createSupplier: builder.mutation({
      query: (data) => ({ url: '/inventory/suppliers', method: 'POST', body: data }),
      invalidatesTags: ['Supplier'],
    }),
    updateSupplier: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/inventory/suppliers/${id}`, method: 'PUT', body: data }),
      invalidatesTags: ['Supplier'],
    }),
    getPurchaseOrders: builder.query({
      query: (params) => ({ url: '/inventory/purchase-orders', params }),
      providesTags: ['PurchaseOrder'],
    }),
    createPurchaseOrder: builder.mutation({
      query: (data) => ({ url: '/inventory/purchase-orders', method: 'POST', body: data }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    approvePurchaseOrder: builder.mutation({
      query: (id) => ({ url: `/inventory/purchase-orders/${id}/approve`, method: 'POST' }),
      invalidatesTags: ['PurchaseOrder'],
    }),
    receiveGoods: builder.mutation({
      query: ({ id, ...data }) => ({ url: `/inventory/purchase-orders/${id}/receive`, method: 'POST', body: data }),
      invalidatesTags: ['PurchaseOrder', 'Stock', 'Product'],
    }),
  }),
});

export const {
  useGetInventoryDashboardQuery,
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useGetStockQuery,
  useAdjustStockMutation,
  useTransferStockMutation,
  useGetStockMovementsQuery,
  useGetLowStockProductsQuery,
  useGetWarehousesQuery,
  useCreateWarehouseMutation,
  useUpdateWarehouseMutation,
  useGetSuppliersQuery,
  useCreateSupplierMutation,
  useUpdateSupplierMutation,
  useGetPurchaseOrdersQuery,
  useCreatePurchaseOrderMutation,
  useApprovePurchaseOrderMutation,
  useReceiveGoodsMutation,
} = inventoryApi;
