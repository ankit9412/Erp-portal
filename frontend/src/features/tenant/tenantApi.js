import { apiSlice } from '../../app/api/apiSlice';

export const tenantApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    getMyTenant: builder.query({
      query: () => '/tenants/me',
      providesTags: ['Tenant'],
    }),
    updateTenant: builder.mutation({
      query: (data) => ({ url: '/tenants/me', method: 'PUT', body: data }),
      invalidatesTags: ['Tenant'],
    }),
    getTenantUsers: builder.query({
      query: (params) => ({ url: '/tenants/me/users', params }),
      providesTags: ['User'],
    }),
    inviteUser: builder.mutation({
      query: (data) => ({ url: '/tenants/me/users/invite', method: 'POST', body: data }),
      invalidatesTags: ['User'],
    }),
    getRoles: builder.query({
      query: () => '/tenants/me/roles',
      providesTags: ['Role'],
    }),
    updateRole: builder.mutation({
      query: ({ roleId, ...data }) => ({ url: `/tenants/me/roles/${roleId}`, method: 'PUT', body: data }),
      invalidatesTags: ['Role'],
    }),
    // Super admin
    getAllTenants: builder.query({
      query: (params) => ({ url: '/tenants', params }),
      providesTags: ['Tenant'],
    }),
    updateTenantStatus: builder.mutation({
      query: ({ id, status }) => ({ url: `/tenants/${id}/status`, method: 'PUT', body: { status } }),
      invalidatesTags: ['Tenant'],
    }),
  }),
});

export const {
  useGetMyTenantQuery,
  useUpdateTenantMutation,
  useGetTenantUsersQuery,
  useInviteUserMutation,
  useGetRolesQuery,
  useUpdateRoleMutation,
  useGetAllTenantsQuery,
  useUpdateTenantStatusMutation,
} = tenantApi;
