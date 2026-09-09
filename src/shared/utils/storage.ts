/**
 * @description Tiện ích truy xuất an toàn Web Storage (localStorage / sessionStorage).
 * Ngăn ngừa lỗi runtime trên các môi trường SSR hoặc khi người dùng vô hiệu hóa cookie/storage.
 * Tuân thủ Quy tắc 7: Chỉ dựng khung chữ ký hàm và JSDoc, developer tự hoàn thiện code logic.
 */

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  REFRESH_TOKEN: "refresh_token",
  USER_PROFILE: "user_profile",
  THEME: "app_theme",
} as const;

export const storage = {
  /**
   * @description Lấy giá trị chuỗi từ localStorage một cách an toàn.
   * @param {key} key Khóa lưu trữ
   * @returns {string | null} Giá trị chuỗi hoặc null nếu không tồn tại hoặc có lỗi
   */
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  /**
   * @description Lưu giá trị chuỗi vào localStorage an toàn.
   * @param {key} key Khóa lưu trữ
   * @param {value} value Giá trị chuỗi cần lưu
   */
  set: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      console.warn(`[Storage] Không thể lưu khóa: ${key}`, error);
    }
  },

  /**
   * @description Xóa một khóa khỏi localStorage an toàn.
   * @param {key} key Khóa cần xóa
   */
  remove: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[Storage] Không thể xóa khóa: ${key}`, error);
    }
  },

  /**
   * @description Lấy và parse đối tượng JSON từ localStorage.
   * @template T Kiểu đối tượng mong đợi
   * @param {key} key Khóa lưu trữ
   * @returns {T | null} Đối tượng đã parse hoặc null nếu không tồn tại / JSON lỗi
   */
  getJSON: <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch {
      return null;
    }
  },

  /**
   * @description Serialize và lưu đối tượng JSON vào localStorage.
   * @template T Kiểu đối tượng
   * @param {key} key Khóa lưu trữ
   * @param {value} value Đối tượng cần lưu
   */
  setJSON: <T>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`[Storage] Không thể lưu JSON cho khóa: ${key}`, error);
    }
  },

  /** Helper lấy JWT Access Token */
  getToken: (): string | null => {
    return storage.get(STORAGE_KEYS.ACCESS_TOKEN);
  },

  /** Helper lưu JWT Access Token */
  setToken: (token: string): void => {
    storage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
  },

  /** Helper xóa JWT Access Token */
  clearToken: (): void => {
    storage.remove(STORAGE_KEYS.ACCESS_TOKEN);
  },

  KEYS: STORAGE_KEYS,
};
