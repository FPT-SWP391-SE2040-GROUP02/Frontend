import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { ENV } from "@/shared/config/env";
import { APP_MESSAGES, HTTP_STATUS } from "@/shared/constants";
import { storage } from "@/shared/utils";

/**
 * @description Instance Axios trung tâm được cấu hình sẵn baseURL, headers mặc định và timeout.
 * Sử dụng cho toàn bộ các cuộc gọi API trong ứng dụng.
 */
export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * Alias tương thích cho apiClient
 */
export const axiosClient = apiClient;

/**
 * @description Request Interceptor: Tự động đính kèm JWT Bearer Token, X-Active-Role và X-Demo-Mode từ storage trước khi gửi request.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = storage.getToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Tự động đính kèm ngữ cảnh vai trò đang làm việc (Hybrid Identity context)
    const activeRole = storage.getActiveRole();
    if (activeRole && config.headers) {
      config.headers["X-Active-Role"] = activeRole;
    }

    // Tự động đính kèm cờ Demo Mode nếu đang bật chu kỳ trình diễn 120s
    if (storage.isDemoMode() && config.headers) {
      config.headers["X-Demo-Mode"] = "true";
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * @description Response Interceptor: Xử lý bóc tách payload dữ liệu `response.data` và bắt các mã lỗi HTTP phổ biến toàn cục.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data !== undefined ? response.data : response;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        console.warn(`[API ${HTTP_STATUS.UNAUTHORIZED}]`, APP_MESSAGES.ERROR.UNAUTHORIZED);
      } else if (status === HTTP_STATUS.FORBIDDEN) {
        console.warn(`[API ${HTTP_STATUS.FORBIDDEN}]`, APP_MESSAGES.ERROR.FORBIDDEN);
      } else if (status === HTTP_STATUS.NOT_FOUND) {
        console.warn(`[API ${HTTP_STATUS.NOT_FOUND}]`, APP_MESSAGES.ERROR.NOT_FOUND);
      } else if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
        console.error(`[API ${status}]`, APP_MESSAGES.ERROR.SERVER, error.response.data);
      }
    } else {
      console.error("[API Network Error]", APP_MESSAGES.ERROR.NETWORK, error.message);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
