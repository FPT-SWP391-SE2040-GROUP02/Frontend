import type { z } from "zod";
import { apiClient } from "@/shared/api";
import {
  ekycBackSchema,
  ekycConsentRequestSchema,
  ekycConsentResponseSchema,
  ekycDocumentSchema,
  ekycDocumentConfirmationSchema,
  ekycLivenessCompleteSchema,
  ekycLivenessResponseSchema,
  ekycPurposeSchema,
  ekycStatusSchema,
} from "../model/ekyc.schema";
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
/** Khớp thời gian BE chờ dịch vụ OCR (120 giây); mặc định 30 giây của axios quá ngắn cho lần đọc đầu. */
const OCR_TIMEOUT_MS = 120_000;
/** Nén và giảm kích thước ảnh chụp điện thoại quá lớn (>1.5MB) trước khi tải lên mạng để tăng tốc độ và tránh timeout. */
async function optimizeImageForUpload(file: File): Promise<File> {
  if (
    file.size <= 1.5 * 1024 * 1024 ||
    typeof window === "undefined" ||
    typeof document === "undefined"
  ) {
    return file;
  }
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const maxSide = 1200;
      let width = img.width;
      let height = img.height;
      if (width > maxSide || height > maxSide) {
        if (width > height) {
          height = Math.round((height * maxSide) / width);
          width = maxSide;
        } else {
          width = Math.round((width * maxSide) / height);
          height = maxSide;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(file);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
          } else {
            resolve(
              new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" }),
            );
          }
        },
        "image/jpeg",
        0.88,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

function imageForm(file: File, handoverTurnId?: string) {
  if (
    !["image/jpeg", "image/png"].includes(file.type) ||
    file.size === 0 ||
    file.size > MAX_IMAGE_BYTES
  )
    throw new Error("Chọn ảnh JPEG hoặc PNG có dung lượng tối đa 8 MiB.");
  const form = new FormData();
  form.append("file", file);
  if (handoverTurnId) form.append("handoverTurnId", handoverTurnId);
  return form;
}
/** Tùy chọn cho document/back: chỉ BENEFICIARY_CLAIM mới gửi kèm handoverTurnId. */
function turnIdFor(purpose: string, handoverTurnId?: string | null): string | undefined {
  if (purpose !== "BENEFICIARY_CLAIM") return undefined;
  if (!handoverTurnId) throw new Error("Thiếu mã lượt bàn giao cho BENEFICIARY_CLAIM.");
  return handoverTurnId;
}
/** Đổi sự kiện byte của axios thành phần trăm tròn; bỏ sự kiện thiếu tổng (multipart thường có). */
function progressHandler(
  onUploadProgress?: (percent: number) => void,
): (event: { loaded: number; total?: number }) => void {
  return (event) => {
    if (onUploadProgress && event.total) {
      onUploadProgress(Math.round((event.loaded / event.total) * 100));
    }
  };
}
/** Transport eKYC; không retry gửi ảnh, không tự quyết PASSED/MATCHED. */
export const ekycService = {
  /** Xác nhận bản tự khai sau khi người dùng sửa; không nâng kết quả đối chiếu ảnh. */
  async confirmDocument(request: z.input<typeof ekycDocumentConfirmationSchema>) {
    return ekycStatusSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/ekyc/document/confirm",
        ekycDocumentConfirmationSchema.parse(request),
      ),
    );
  },
  /** GET trạng thái của principal hiện tại. */
  async getStatus(signal?: AbortSignal) {
    return ekycStatusSchema.parse(await apiClient.get<unknown, unknown>("/ekyc/me", { signal }));
  },
  /** POST đồng ý thu thập; chỉ gọi sau khi user chủ động bấm đồng ý, không tự chạy khi mount. */
  async submitConsent(purpose: string) {
    const parsed = ekycPurposeSchema.parse(purpose);
    return ekycConsentResponseSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/ekyc/consent",
        ekycConsentRequestSchema.parse({ purpose: parsed, noticeVersion: "2026-10-v1" }),
      ),
    );
  },
  /** POST ảnh mặt trước; OCR chỉ giữ RAM; progress theo byte đã gửi. */
  async submitDocument(
    file: File,
    purpose: string,
    handoverTurnId?: string | null,
    onUploadProgress?: (percent: number) => void,
  ) {
    const parsed = ekycPurposeSchema.parse(purpose);
    const optimizedFile = await optimizeImageForUpload(file);
    return ekycDocumentSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/ekyc/document",
        imageForm(optimizedFile, turnIdFor(parsed, handoverTurnId)),
        // Đọc OCR có thể lâu (lần đầu nạp mô hình); BE chờ dịch vụ eKYC tối đa 120 giây (Ekyc:TimeoutSeconds).
        {
          headers: { "Content-Type": undefined },
          timeout: OCR_TIMEOUT_MS,
          onUploadProgress: progressHandler(onUploadProgress),
        },
      ),
    );
  },
  /**
   * POST ảnh mặt sau; response là EkycBackResponse (trạng thái lượt + nơi cư trú đọc từ mặt sau), không cần gửi
   * lại turnId. Có thể gửi trước bước xác nhận bản khai: BE chỉ cần đã đọc mặt trước.
   */
  async submitDocumentBack(
    file: File,
    purpose: string,
    handoverTurnId?: string | null,
    onUploadProgress?: (percent: number) => void,
  ) {
    const parsed = ekycPurposeSchema.parse(purpose);
    const optimizedFile = await optimizeImageForUpload(file);
    return ekycBackSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/ekyc/document-back",
        imageForm(optimizedFile, turnIdFor(parsed, handoverTurnId)),
        {
          headers: { "Content-Type": undefined },
          timeout: OCR_TIMEOUT_MS,
          onUploadProgress: progressHandler(onUploadProgress),
        },
      ),
    );
  },
  /**
   * Bắt đầu phiên liveness: BE cấp prompt, actions và expiresInSeconds.
   * Không tự phát hiện blink/turn; chỉ hiển thị hành động và gửi frame.
   */
  async startLiveness(signal?: AbortSignal) {
    return ekycLivenessResponseSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/ekyc/liveness/start",
        {},
        { signal, timeout: 15000 },
      ),
    );
  },
  /** Gửi một frame; chỉ chấp nhận JPEG/PNG, tối đa 8 MiB. */
  async sendLivenessFrame(file: File, signal?: AbortSignal) {
    return ekycLivenessResponseSchema.parse(
      await apiClient.post<unknown, unknown>("/ekyc/liveness/frame", imageForm(file), {
        headers: { "Content-Type": undefined },
        signal,
        timeout: 5000,
      }),
    );
  },
  /**
   * Kết thúc phiên liveness; FE ưu tiên dùng selfie đã ghi trong phiên này.
   * Trả EkycStatusResponse với `passed` phản ánh trạng thái cuối cùng.
   */
  async completeLiveness(signal?: AbortSignal) {
    return ekycLivenessCompleteSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/ekyc/liveness/complete",
        {},
        { signal, timeout: 120000 },
      ),
    );
  },
};
