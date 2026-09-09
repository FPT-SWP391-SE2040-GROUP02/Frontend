import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "./uiSlice";

/**
 * @description Redux Store trung tâm của toàn bộ ứng dụng.
 */
export const store = configureStore({
  reducer: {
    ui: uiReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
