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
   * @param {_key} _key Khóa lưu trữ
   * @returns {string | null} Giá trị chuỗi hoặc null nếu không tồn tại hoặc có lỗi
   */
  get: (_key: string): string | null => {
    // TODO: 1. Sử dụng khối try...catch để gọi localStorage.getItem(_key)
    // TODO: 2. Trả về kết quả chuỗi nếu tìm thấy, ngược lại trả về null
    throw new Error("Chưa cài đặt storage.get - Vui lòng tự hoàn thiện code logic tại đây.");
  },

  /**
   * @description Lưu giá trị chuỗi vào localStorage an toàn.
   * @param {_key} _key Khóa lưu trữ
   * @param {_value} _value Giá trị chuỗi cần lưu
   */
  set: (_key: string, _value: string): void => {
    // TODO: 1. Sử dụng khối try...catch để gọi localStorage.setItem(_key, _value)
    // TODO: 2. Bắt lỗi (nếu dung lượng storage đầy QuotaExceededError) và log cảnh báo ra console.warn
    throw new Error("Chưa cài đặt storage.set - Vui lòng tự hoàn thiện code logic tại đây.");
  },

  /**
   * @description Xóa một khóa khỏi localStorage an toàn.
   * @param {_key} _key Khóa cần xóa
   */
  remove: (_key: string): void => {
    // TODO: 1. Sử dụng khối try...catch để gọi localStorage.removeItem(_key)
    throw new Error("Chưa cài đặt storage.remove - Vui lòng tự hoàn thiện code logic tại đây.");
  },

  /**
   * @description Lấy và parse đối tượng JSON từ localStorage.
   * @template T Kiểu đối tượng mong đợi
   * @param {_key} _key Khóa lưu trữ
   * @returns {T | null} Đối tượng đã parse hoặc null nếu không tồn tại / JSON lỗi
   */
  getJSON: <T>(_key: string): T | null => {
    // TODO: 1. Gọi storage.get(_key) để lấy chuỗi JSON thô
    // TODO: 2. Nếu có chuỗi, dùng JSON.parse(item) as T để parse dữ liệu
    // TODO: 3. Đặt trong try...catch, nếu parse lỗi thì trả về null
    throw new Error("Chưa cài đặt storage.getJSON - Vui lòng tự hoàn thiện code logic tại đây.");
  },

  /**
   * @description Serialize và lưu đối tượng JSON vào localStorage.
   * @template T Kiểu đối tượng
   * @param {_key} _key Khóa lưu trữ
   * @param {_value} _value Đối tượng cần lưu
   */
  setJSON: <T>(_key: string, _value: T): void => {
    // TODO: 1. Sử dụng JSON.stringify(_value) để chuyển đổi đối tượng thành chuỗi
    // TODO: 2. Gọi storage.set(_key, stringValue) để lưu vào localStorage
    throw new Error("Chưa cài đặt storage.setJSON - Vui lòng tự hoàn thiện code logic tại đây.");
  },

  /** Helper lấy JWT Access Token */
  getToken: (): string | null => {
    // TODO: Gọi storage.get(STORAGE_KEYS.ACCESS_TOKEN)
    return null;
  },

  /** Helper lưu JWT Access Token */
  setToken: (_token: string): void => {
    // TODO: Gọi storage.set(STORAGE_KEYS.ACCESS_TOKEN, _token)
  },

  /** Helper xóa JWT Access Token */
  clearToken: (): void => {
    // TODO: Gọi storage.remove(STORAGE_KEYS.ACCESS_TOKEN)
  },

  KEYS: STORAGE_KEYS,
};
