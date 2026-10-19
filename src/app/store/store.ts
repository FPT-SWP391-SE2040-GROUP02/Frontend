import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "@/shared/model/uiSlice";
import authReducer from "@/entities/user/model/authSlice";

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    auth: authReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
