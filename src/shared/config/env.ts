/**
 * @description Đối tượng quản lý cấu hình biến môi trường của ứng dụng client.
 * Giúp tránh hardcode các URL/Endpoints trực tiếp trong mã nguồn.
 */
export const ENV = {
  /** Địa chỉ Base URL của Backend ASP.NET Core API (v1) */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
} as const;
