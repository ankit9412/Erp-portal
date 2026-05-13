import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sidebarOpen: true,
  sidebarCollapsed: false,
  theme: localStorage.getItem('theme') || 'system',
  commandPaletteOpen: false,
  activeModal: null,
  breadcrumbs: [],
  pageTitle: 'Dashboard',
  isLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => { state.sidebarOpen = !state.sidebarOpen; },
    setSidebarOpen: (state, action) => { state.sidebarOpen = action.payload; },
    toggleSidebarCollapsed: (state) => { state.sidebarCollapsed = !state.sidebarCollapsed; },
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    toggleCommandPalette: (state) => { state.commandPaletteOpen = !state.commandPaletteOpen; },
    setCommandPaletteOpen: (state, action) => { state.commandPaletteOpen = action.payload; },
    openModal: (state, action) => { state.activeModal = action.payload; },
    closeModal: (state) => { state.activeModal = null; },
    setBreadcrumbs: (state, action) => { state.breadcrumbs = action.payload; },
    setPageTitle: (state, action) => { state.pageTitle = action.payload; },
    setLoading: (state, action) => { state.isLoading = action.payload; },
  },
});

export const {
  toggleSidebar, setSidebarOpen, toggleSidebarCollapsed,
  setTheme, toggleCommandPalette, setCommandPaletteOpen,
  openModal, closeModal, setBreadcrumbs, setPageTitle, setLoading,
} = uiSlice.actions;

export default uiSlice.reducer;
