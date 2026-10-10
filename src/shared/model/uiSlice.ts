import { storage } from "@/shared/utils";
import { type Role, ROLES } from "@/shared/constants/roles";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AppTheme = "light" | "dark" | "system";
export type ViewMode = "senior" | "drive";

export interface UiState {
  sidebarOpen: boolean;
  theme: AppTheme;
  currentRole: Role;
  viewMode: ViewMode;
  demoMode: boolean;
}

const savedTheme = (storage.get(storage.KEYS.THEME) as AppTheme) || "light";
const savedRole = storage.getActiveRole() || ROLES.OWNER;

if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: savedTheme,
  currentRole: savedRole,
  viewMode: "senior",
  demoMode: false,
};

export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    setTheme: (state, action: PayloadAction<AppTheme>) => {
      state.theme = action.payload;
      storage.set(storage.KEYS.THEME, action.payload);

      if (action.payload === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },
    setRole: (state, action: PayloadAction<Role>) => {
      state.currentRole = action.payload;
      storage.setActiveRole(action.payload);
    },
    setViewMode: (state, action: PayloadAction<ViewMode>) => {
      state.viewMode = action.payload;
    },
    setDemoMode: (state, action: PayloadAction<boolean>) => {
      state.demoMode = action.payload;
    },
    toggleDemoMode: (state) => {
      state.demoMode = !state.demoMode;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  setRole,
  setViewMode,
  setDemoMode,
  toggleDemoMode,
} = uiSlice.actions;
export default uiSlice.reducer;
