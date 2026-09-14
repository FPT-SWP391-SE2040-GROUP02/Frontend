/**
 * @file storage.ts
 * @description Tiện ích quản lý LocalStorage an toàn với tiền tố hệ thống và xử lý lỗi JSON tự động.
 */

/**
 * Các khóa LocalStorage tiêu chuẩn của hệ thống LegacyVault
 */
export const STORAGE_KEYS = {
  TOKEN: "lv_access_token",
  REFRESH_TOKEN: "lv_refresh_token",
  THEME: "lv_app_theme",
  ROLE: "lv_current_role",
  VIEW_MODE: "lv_view_mode",
  USER: "lv_user_info",
  DEMO_MODE: "lv_demo_mode",
} as const;

import { type Role, ROLES } from "@/shared/constants/roles";

/**
 * @description Quản lý thao tác đọc/ghi LocalStorage an toàn (chống throw exception khi SSR hoặc quota vượt ngưỡng).
 */
export const storage = {
  KEYS: STORAGE_KEYS,

  /**
   * Lấy vai trò đang hoạt động (Active Role context)
   * @returns {Role} Role hiện tại (mặc định là OWNER)
   */
  getActiveRole(): Role {
    try {
      if (typeof window === "undefined") return ROLES.OWNER;
      const role = localStorage.getItem(STORAGE_KEYS.ROLE);
      return (role as Role) || ROLES.OWNER;
    } catch {
      return ROLES.OWNER;
    }
  },

  /**
   * Lưu vai trò đang hoạt động (Active Role context)
   * @param {Role} role Vai trò cần chuyển đổi
   */
  setActiveRole(role: Role): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.ROLE, role);
      }
    } catch {
      // Ignored
    }
  },

  /**
   * Kiểm tra trạng thái Demo Mode (chu kỳ DMS 120s)
   * @returns {boolean} true nếu đang bật chế độ Demo
   */
  isDemoMode(): boolean {
    try {
      if (typeof window === "undefined") return false;
      return localStorage.getItem(STORAGE_KEYS.DEMO_MODE) === "true";
    } catch {
      return false;
    }
  },

  /**
   * Bật hoặc tắt trạng thái Demo Mode
   * @param {boolean} enabled Trạng thái kích hoạt
   */
  setDemoMode(enabled: boolean): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.DEMO_MODE, enabled ? "true" : "false");
      }
    } catch {
      // Ignored
    }
  },

  /**
   * Lấy JWT token từ storage
   * @returns {string | null} Chuỗi accessToken hoặc null nếu không tồn tại
   */
  getToken(): string | null {
    try {
      if (typeof window === "undefined") return null;
      return localStorage.getItem(STORAGE_KEYS.TOKEN);
    } catch {
      return null;
    }
  },

  /**
   * Lưu JWT token vào storage
   * @param {string} token Chuỗi token nhận được từ Backend
   */
  setToken(token: string): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEYS.TOKEN, token);
      }
    } catch {
      // Ignored
    }
  },

  /**
   * Xóa JWT token và các thông tin liên quan khỏi storage
   */
  clearToken(): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEYS.TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      }
    } catch {
      // Ignored
    }
  },

  /**
   * Đọc dữ liệu dạng đối tượng hoặc chuỗi từ localStorage
   * @param {string} key Khóa lưu trữ
   * @param {T} [defaultValue] Giá trị mặc định trả về nếu không tìm thấy khóa
   * @returns {T | null} Dữ liệu đã parse hoặc null/defaultValue
   */
  get<T = unknown>(key: string, defaultValue?: T): T | null {
    try {
      if (typeof window === "undefined") return defaultValue ?? null;
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue ?? null;
      try {
        return JSON.parse(item) as T;
      } catch {
        return item as unknown as T;
      }
    } catch {
      return defaultValue ?? null;
    }
  },

  /**
   * Ghi dữ liệu vào localStorage với serialization tự động
   * @param {string} key Khóa lưu trữ
   * @param {T} value Dữ liệu cần lưu
   */
  set<T = unknown>(key: string, value: T): void {
    try {
      if (typeof window === "undefined") return;
      if (typeof value === "string") {
        localStorage.setItem(key, value);
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch {
      // Ignored
    }
  },

  /**
   * Xóa một mục khỏi localStorage
   * @param {string} key Khóa cần xóa
   */
  remove(key: string): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(key);
      }
    } catch {
      // Ignored
    }
  },

  /**
   * Xóa toàn bộ localStorage
   */
  clear(): void {
    try {
      if (typeof window !== "undefined") {
        localStorage.clear();
      }
    } catch {
      // Ignored
    }
  },
};
