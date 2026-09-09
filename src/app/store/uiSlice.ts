import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/**
 * @description Các tùy chọn chủ đề giao diện được hỗ trợ.
 */
export type AppTheme = "light" | "dark" | "system";

/**
 * @description Trạng thái UI toàn cục của ứng dụng.
 */
export interface UiState {
  /** Trạng thái mở/đóng thanh Sidebar trên Dashboard */
  sidebarOpen: boolean;
  /** Chế độ giao diện sáng / tối */
  theme: AppTheme;
}

const initialState: UiState = {
  sidebarOpen: true,
  theme: "light",
};

/**
 * @description Redux Slice quản lý trạng thái giao diện (Theme, Sidebar).
 * Tuân thủ Quy tắc 7: Chỉ dựng khung sườn skeleton, developer tự hoàn thiện code logic trong reducers.
 */
export const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    /**
     * @description Đảo ngược trạng thái đóng/mở của thanh Sidebar.
     */
    toggleSidebar: (_state) => {
      // TODO: 1. Đảo ngược giá trị boolean của _state.sidebarOpen (true -> false, false -> true)
    },

    /**
     * @description Thiết lập trạng thái đóng/mở cụ thể cho Sidebar.
     * @param _state Trạng thái hiện tại
     * @param _action Payload chứa giá trị boolean (true: mở, false: đóng)
     */
    setSidebarOpen: (_state, _action: PayloadAction<boolean>) => {
      // TODO: 1. Gán giá trị _action.payload vào _state.sidebarOpen
    },

    /**
     * @description Thiết lập Theme giao diện (light / dark / system) và lưu vào localStorage.
     * @param _state Trạng thái hiện tại
     * @param _action Payload chứa kiểu theme ("light" | "dark" | "system")
     */
    setTheme: (_state, _action: PayloadAction<AppTheme>) => {
      // TODO: 1. Cập nhật _state.theme bằng _action.payload
      // TODO: 2. Lưu theme mới vào localStorage (sử dụng storage.set) để ghi nhớ phiên làm việc
      // TODO: 3. Thêm hoặc xóa class 'dark' trên thẻ document.documentElement (thẻ <html>) để kích hoạt Tailwind dark mode
    },
  },
});

export const { toggleSidebar, setSidebarOpen, setTheme } = uiSlice.actions;
export default uiSlice.reducer;
