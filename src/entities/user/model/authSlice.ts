import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type User } from "@/entities/user";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isHydrating: boolean;
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isHydrating: true,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User }>,
    ) => {
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.isHydrating = false;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isHydrating = false;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = Boolean(action.payload);
      state.isHydrating = false;
    },
    setHydrating: (state, action: PayloadAction<boolean>) => {
      state.isHydrating = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setUser, setHydrating } = authSlice.actions;
export default authSlice.reducer;
