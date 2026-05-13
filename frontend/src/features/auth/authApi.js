import { apiSlice } from '../../app/api/apiSlice';

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({ url: '/auth/login', method: 'POST', body: credentials }),
    }),
    register: builder.mutation({
      query: (data) => ({ url: '/auth/register', method: 'POST', body: data }),
    }),
    logout: builder.mutation({
      query: () => ({ url: '/auth/logout', method: 'POST' }),
    }),
    refreshToken: builder.mutation({
      query: () => ({ url: '/auth/refresh', method: 'POST' }),
    }),
    getMe: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    forgotPassword: builder.mutation({
      query: (data) => ({ url: '/auth/forgot-password', method: 'POST', body: data }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({ url: '/auth/reset-password', method: 'POST', body: data }),
    }),
    verifyMFA: builder.mutation({
      query: (data) => ({ url: '/auth/verify-mfa', method: 'POST', body: data }),
    }),
    setupMFA: builder.mutation({
      query: () => ({ url: '/auth/mfa/setup', method: 'POST' }),
    }),
    confirmMFA: builder.mutation({
      query: (data) => ({ url: '/auth/mfa/confirm', method: 'POST', body: data }),
    }),
    updateProfile: builder.mutation({
      query: (data) => ({ url: '/auth/profile', method: 'PUT', body: data }),
      invalidatesTags: ['User'],
    }),
    changePassword: builder.mutation({
      query: (data) => ({ url: '/auth/change-password', method: 'POST', body: data }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  useVerifyMFAMutation,
  useSetupMFAMutation,
  useConfirmMFAMutation,
  useUpdateProfileMutation,
  useChangePasswordMutation,
} = authApi;
