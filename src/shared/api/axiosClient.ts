import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { ENV } from "@/shared/config/env";
import { APP_MESSAGES, HTTP_STATUS } from "@/shared/constants";
import { storage } from "@/shared/utils";
import { reportSessionFailure } from "./sessionFailure";
import { accessTokenMemory } from "./accessToken";
import { notifyAssetCreated, resolveVaultPinFailure } from "./vaultPin";

/**
 * @description Instance Axios trung tâm được cấu hình sẵn baseURL, headers mặc định và timeout.
 * Sử dụng cho toàn bộ các cuộc gọi API trong ứng dụng.
 */
export const apiClient = axios.create({
  baseURL: ENV.API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 90000,
  withCredentials: true,
});

/**
 * Alias tương thích cho apiClient
 */
export const axiosClient = apiClient;

/** Cùng boundary cho Bearer credential và thông báo hết phiên. */
function isApiRequest(config: AxiosRequestConfig): boolean {
  const apiUrl = new URL(ENV.API_BASE_URL, window.location.origin);
  const requestUrl = new URL(apiClient.getUri(config), window.location.origin);
  const apiPath = apiUrl.pathname.replace(/\/$/, "");
  return (
    requestUrl.origin === apiUrl.origin &&
    (requestUrl.pathname === apiPath || requestUrl.pathname.startsWith(`${apiPath}/`))
  );
}

/**
 * @description Request Interceptor: Tự động đính kèm X-Correlation-ID và ngữ cảnh X-Active-Role.
 * Gắn Bearer từ RAM chỉ tới base API đã cấu hình; cookie refresh do BE quản lý.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const accessToken = accessTokenMemory.get();
    if (accessToken && isApiRequest(config))
      config.headers.set("Authorization", `Bearer ${accessToken}`);

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
 * Request tải tệp dùng responseType "blob", nên khi Backend trả lỗi thì ProblemDetails (JSON) cũng bị gói thành Blob.
 * Đọc lại thành object để xử lý PIN (VAULT_PIN_REQUIRED...) và thông báo lỗi theo mã giống các request JSON.
 * Blob không phải JSON thì giữ nguyên.
 */
async function readJsonErrorFromBlob(error: AxiosError): Promise<void> {
  const response = error.response;
  if (!response || !(response.data instanceof Blob)) return;
  const blob = response.data;
  if (!blob.type.includes("json")) return;
  try {
    response.data = JSON.parse(await blob.text()) as unknown;
  } catch {
    // Nội dung hỏng: để nguyên Blob, phía gọi rơi về thông báo theo mã trạng thái.
  }
}

/**
 * @description Trả HTTP body nguyên vẹn và bắt lỗi HTTP toàn cục.
 * Không bóc trường data của envelope BE; caller khai báo generic R là kiểu body.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    notifyAssetCreated(response.config, response.status);
    return response.data;
  },
  async (error: AxiosError) => {
    await readJsonErrorFromBlob(error);
    // Thao tác kho cần mã PIN: hỏi người dùng rồi gửi lại request kèm header PIN (xem vaultPin.ts).
    if (error.config && isApiRequest(error.config)) {
      const pinRetry = await resolveVaultPinFailure(error, (config) => apiClient.request(config));
      if (pinRetry.handled) return pinRetry.value;
    }
    if (error.config && isApiRequest(error.config)) reportSessionFailure(error);
    if (error.response) {
      const status = error.response.status;
      if (status === HTTP_STATUS.UNAUTHORIZED) {
        // AuthBootstrap sở hữu restore và coordinator; SESSION_EXPIRED được báo qua
        // reportSessionFailure. Transport giữ lỗi 401, không tự refresh hoặc retry request.
        console.warn(`[API ${HTTP_STATUS.UNAUTHORIZED}]`, APP_MESSAGES.ERROR.UNAUTHORIZED);
      } else if (status === HTTP_STATUS.FORBIDDEN) {
        console.warn(`[API ${HTTP_STATUS.FORBIDDEN}]`, APP_MESSAGES.ERROR.FORBIDDEN);
      } else if (status === HTTP_STATUS.NOT_FOUND) {
        console.warn(`[API ${HTTP_STATUS.NOT_FOUND}]`, APP_MESSAGES.ERROR.NOT_FOUND);
      } else if (status >= HTTP_STATUS.INTERNAL_SERVER_ERROR) {
        console.error(`[API ${status}]`, APP_MESSAGES.ERROR.SERVER);
      }
    } else if (!axios.isCancel(error)) {
      // Request bị hủy chủ động (AbortSignal của TanStack Query, đổi trang) không phải lỗi mạng.
      console.error("[API Network Error]", APP_MESSAGES.ERROR.NETWORK);
    }

    return Promise.reject(error);
  },
);

export default apiClient;
