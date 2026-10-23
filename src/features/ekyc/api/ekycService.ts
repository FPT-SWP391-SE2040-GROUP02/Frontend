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
  /** POST ảnh mặt trước; OCR chỉ giữ RAM. */
  async submitDocument(file: File, purpose: string, handoverTurnId?: string | null) {
    const parsed = ekycPurposeSchema.parse(purpose);
    return ekycDocumentSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/ekyc/document",
        imageForm(file, turnIdFor(parsed, handoverTurnId)),
        // Đọc OCR có thể lâu (lần đầu nạp mô hình); BE chờ dịch vụ eKYC tối đa 120 giây (Ekyc:TimeoutSeconds).
        { headers: { "Content-Type": undefined }, timeout: OCR_TIMEOUT_MS },
      ),
    );
  },
  /**
   * POST ảnh mặt sau; response là EkycBackResponse (trạng thái lượt + nơi cư trú đọc từ mặt sau), không cần gửi
   * lại turnId. Có thể gửi trước bước xác nhận bản khai: BE chỉ cần đã đọc mặt trước.
   */
  async submitDocumentBack(file: File, purpose: string, handoverTurnId?: string | null) {
    const parsed = ekycPurposeSchema.parse(purpose);
    return ekycBackSchema.parse(
      await apiClient.post<unknown, unknown>(
        "/ekyc/document-back",
        imageForm(file, turnIdFor(parsed, handoverTurnId)),
        { headers: { "Content-Type": undefined }, timeout: OCR_TIMEOUT_MS },
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
