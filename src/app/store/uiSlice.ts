import { storage } from "@/shared/utils";
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * @description Các tùy chọn chủ đề giao diện được hỗ trợ trong hệ thống.
 */
export type AppTheme = "light" | "dark" | "system";

/**
 * @description Trạng thái giao diện người dùng (UI State) toàn cục.
 */
export interface UiState {
  /** Trạng thái mở/đóng thanh Sidebar trên trang Dashboard */
  sidebarOpen: boolean;
  /** Chế độ giao diện (Sáng / Tối) */
  theme: AppTheme;
}

// Khôi phục theme đã lưu từ localStorage (mặc định: "light")
const savedTheme = (storage.get(storage.KEYS.THEME) as AppTheme) || "light";

// Kích hoạt class 'dark' ngay khi vừa load ứng dụng nếu trước đó đã chọn dark
if (savedTheme === "dark") {
  document.documentElement.classList.add("dark");
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: savedTheme,
};

/**
 * @description Redux Slice quản lý trạng thái giao diện (Theme, Sidebar) toàn cục.
 */
export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    /**
     * @description Đảo ngược trạng thái đóng/mở của thanh Sidebar trên Dashboard.
     * @param state Trạng thái hiện tại
     */
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    /**
     * @description Thiết lập trạng thái đóng/mở cụ thể cho Sidebar.
     * @param state Trạng thái hiện tại
     * @param action Payload chứa giá trị boolean (true: mở, false: đóng)
     */
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },

    /**
     * @description Thiết lập Theme giao diện (light / dark) và tự động đồng bộ vào localStorage.
     * @param state Trạng thái hiện tại
     * @param action Payload chứa kiểu theme ("light" | "dark" | "system")
     */
    setTheme: (state, action: PayloadAction<AppTheme>) => {
      state.theme = action.payload;
      storage.set(storage.KEYS.THEME, action.payload);

      // Đồng bộ class 'dark' trên thẻ <html> để kích hoạt Tailwind Dark Mode
      if (action.payload === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
