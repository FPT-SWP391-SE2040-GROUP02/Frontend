import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { type User } from "@/entities/user";
import { storage } from "@/shared/utils";

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
}

const token = storage.getToken();

const initialState: AuthState = {
  user: null,
  isAuthenticated: Boolean(token),
  token: token || null,
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>,
    ) => {
      state.user = action.payload.user;
      state.token = action.payload.accessToken;
      state.isAuthenticated = true;
      storage.setToken(action.payload.accessToken);
    },
    clearCredentials: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      storage.clearToken();
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
});

export const { setCredentials, clearCredentials, setUser } = authSlice.actions;
export default authSlice.reducer;
