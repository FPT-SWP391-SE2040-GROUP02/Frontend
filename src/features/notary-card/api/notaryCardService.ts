import { z } from "zod";
import { apiClient } from "@/shared/api";

const NOTARY_CARD_PATH = "/verifier/notary-card";

/** Raw NotaryCardStatusResponse của Backend (VerifierNotaryCardController). */
export const notaryCardStatusSchema = z.object({
  hasCard: z.boolean(),
  uploadedAt: z.string().nullable().optional(),
});

export type NotaryCardStatus = z.infer<typeof notaryCardStatusSchema>;

/**
 * Ảnh thẻ công chứng viên của Người xét duyệt đang đăng nhập, chỉ xem (Admin là người nộp). Ảnh lưu mã hóa ở Backend, không có link công khai:
 * mọi lần đọc đều đi kèm Bearer và trả blob tạm, caller tự thu hồi object URL.
 */
export const notaryCardService = {
  /** Đã có ảnh thẻ chưa và nộp lúc nào. */
  async getStatus(signal?: AbortSignal): Promise<NotaryCardStatus> {
    const body = await apiClient.get<unknown, unknown>(NOTARY_CARD_PATH, { signal });
    return notaryCardStatusSchema.parse(body);
  },

  /** Tải ảnh thẻ của chính mình. 404 khi chưa có ảnh. */
  async download(signal?: AbortSignal): Promise<Blob> {
    return apiClient.get<Blob, Blob>(`${NOTARY_CARD_PATH}/content`, {
      responseType: "blob",
      signal,
    });
  },
};
