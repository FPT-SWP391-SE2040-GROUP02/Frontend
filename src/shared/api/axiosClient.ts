import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import { ENV } from "@/shared/config/env";
import { APP_MESSAGES, HTTP_STATUS } from "@/shared/constants";
import { storage } from "@/shared/utils";
import { accessTokenMemory } from "./accessToken";

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
  withCredentials: true,
});

/**
 * Alias tương thích cho apiClient
 */
export const axiosClient = apiClient;

/**
 * @description Request Interceptor: Tự động đính kèm X-Correlation-ID và ngữ cảnh X-Active-Role.
 * Gắn Bearer từ RAM chỉ tới base API đã cấu hình; cookie refresh do BE quản lý.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = accessTokenMemory.get();
    if (accessToken) {
      const apiUrl = new URL(ENV.API_BASE_URL, window.location.origin);
      const requestUrl = new URL(apiClient.getUri(config), window.location.origin);
      const apiPath = apiUrl.pathname.replace(/\/$/, "");
      if (
        requestUrl.origin === apiUrl.origin &&
        (requestUrl.pathname === apiPath || requestUrl.pathname.startsWith(`${apiPath}/`))
      ) {
        config.headers.set("Authorization", `Bearer ${accessToken}`);
      }
    }

    // 1. Gắn X-Correlation-ID truy vết phân tán cho mỗi request
    const correlationId = globalThis.crypto?.randomUUID
      ? globalThis.crypto.randomUUID()
      : undefined;
    if (correlationId && config.headers) {
      config.headers["X-Correlation-ID"] = correlationId;
    }

    // 2. Tự động đính kèm ngữ cảnh vai trò UI nếu có (không dùng làm căn cứ ủy quyền phía server)
    const activeRole = storage.getActiveRole();
    if (activeRole && config.headers) {
      config.headers["X-Active-Role"] = activeRole;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * @description Trả HTTP body nguyên vẹn và bắt lỗi HTTP toàn cục.
 * Không bóc trường data của envelope BE; caller khai báo generic R là kiểu body.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        // TODO: [P0][AUTH-01] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
        // 1. [MỤC TIÊU]: Khôi phục phiên Bearer theo ADR-0003 sau khi BE chốt contract.
        // 2. [INPUT & OUTPUT]: 401 của request hợp lệ -> retry an toàn một lần hoặc kết thúc phiên.
        // 3. [CÁC BƯỚC]: Chốt DTO refresh; điều phối một promise ở tầng app/auth; validate credential; cập nhật RAM; retry theo policy.
        // 4. [HÀM / THƯ VIỆN]: Axios, accessTokenMemory, Zod; shared không import features.
        // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không refresh login/refresh; không retry mutation nhạy cảm thiếu idempotency; logout/đổi account phải vô hiệu response cũ; không lưu token vào storage.
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
