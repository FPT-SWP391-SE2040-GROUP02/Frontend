/**
 * @description Đối tượng quản lý cấu hình biến môi trường của ứng dụng client.
 * Giúp tránh hardcode các URL/Endpoints trực tiếp trong mã nguồn.
 */
export const ENV = {
  /** Public Web OAuth client ID; phải trùng GoogleAuth:ClientId ở Backend. */
  GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "",
  /** Địa chỉ Base URL của Backend ASP.NET Core API (v1) */
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api/v1",
  /** Bật "Công cụ thử nghiệm" (tua thời gian, reset eKYC) ở bản build/preview: VITE_ENABLE_DEVTOOLS=true. */
  ENABLE_DEVTOOLS: import.meta.env.VITE_ENABLE_DEVTOOLS === "true",
} as const;
