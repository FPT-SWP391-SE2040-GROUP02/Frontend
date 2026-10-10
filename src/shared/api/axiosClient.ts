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
    const correlationId = globalThis.crypto?.randomUUID ? globalThis.crypto.randomUUID() : undefined;
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
        // TODO: [BẢN THIẾT KẾ THỰC THI - DEVELOPER BLUEPRINT]
        // 1. [MỤC TIÊU]: Khôi phục phiên Bearer qua refresh rotation theo ADR-0003.
        // 2. [INPUT & OUTPUT]: AxiosError 401 -> retry một lần hoặc kết thúc phiên.
        // 3. [CÁC BƯỚC]: Chờ BE chốt contract; dùng chung một promise refresh;
        //    validate response, cập nhật token RAM rồi retry request phù hợp.
        // 4. [HÀM / THƯ VIỆN]: Axios, accessTokenMemory; schema Auth ở tầng feature.
        //    Điều phối Auth ở tầng trên, không import feature vào shared.
        // 5. [ĐIỀU KIỆN BIÊN]: Không refresh login/refresh; không vòng lặp 401;
        //    không retry mutation nhạy cảm khi chưa chốt idempotency; xóa RAM
        //    khi refresh thất bại/logout, không khôi phục phiên sau logout race.
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
