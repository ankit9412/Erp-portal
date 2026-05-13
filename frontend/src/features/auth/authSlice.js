import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  user: null,
  accessToken: localStorage.getItem('accessToken') || null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  isLoading: false,
  requiresMFA: false,
  mfaToken: null,
  mfaMethod: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action) => {
      if (action.payload.user) {
        state.user = action.payload.user;
      }
      state.accessToken = action.payload.accessToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      state.requiresMFA = false;
      localStorage.setItem('accessToken', action.payload.accessToken);
    },
    setMFARequired: (state, action) => {
      state.requiresMFA = true;
      state.mfaToken = action.payload.mfaToken;
      state.mfaMethod = action.payload.mfaMethod;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      state.requiresMFA = false;
      state.mfaToken = null;
      localStorage.removeItem('accessToken');
    },
    updatePreferences: (state, action) => {
      if (state.user) {
        state.user.preferences = { ...state.user.preferences, ...action.payload };
      }
    },
  },
});

export const {
  setCredentials,
  setMFARequired,
  setUser,
  setLoading,
  logout,
  updatePreferences,
} = authSlice.actions;

export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAccessToken = (state) => state.auth.accessToken;
export const selectRequiresMFA = (state) => state.auth.requiresMFA;

export default authSlice.reducer;
