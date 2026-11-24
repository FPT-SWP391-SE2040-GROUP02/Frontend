import { z } from "zod";
import { claimStatusSchema, recordFileSchema, recordStatusSchema } from "@/entities/handoverRecord";

const timestamp = z.string().datetime({ offset: true });

/** GET /handover/requests/preview: thông tin link riêng, không cần đăng nhập. */
export const requestPreviewSchema = z.object({
  ownerName: z.string(),
  recipientName: z.string(),
  invitedEmailMasked: z.string(),
  canRequest: z.boolean(),
});
export type RequestPreview = z.infer<typeof requestPreviewSchema>;

/** Một yêu cầu nhận tài sản của người đang đăng nhập. */
export const myClaimSchema = z.object({
  id: z.string().uuid(),
  recordId: z.string().uuid(),
  ownerName: z.string(),
  status: claimStatusSchema,
  recordStatus: recordStatusSchema,
  /** Lý do luật sư hủy; null khi chưa hủy. */
  cancelReason: z.string().nullable().default(null),
  note: z.string(),
  reviewReason: z.string().nullable(),
  createdAt: timestamp,
  reviewedAt: timestamp.nullable(),
  files: z.array(recordFileSchema),
});
export type MyClaim = z.infer<typeof myClaimSchema>;

/** Trạng thái của một kho được để lại cho người đang đăng nhập (GET /handover/requests/available). */
export const availableStatusSchema = z.enum([
  "NOT_REQUESTED",
  "REQUEST_PENDING",
  "SUPPLEMENT_REQUESTED",
  "REJECTED",
  "IN_REVIEW",
  "NEED_MY_SIGNATURE",
  "WAITING_OTHERS",
  "CODE_READY",
  "RECEIVED",
  "NEED_IDENTITY",
]);
export type AvailableStatus = z.infer<typeof availableStatusSchema>;

/** Một kho mà Chủ kho đã khai tài khoản này là người nhận. Các trường null có thể vắng mặt. */
export const availableHandoverSchema = z.object({
  vaultId: z.string().uuid(),
  beneficiaryId: z.string().uuid(),
  ownerName: z.string(),
  status: availableStatusSchema,
  needsAction: z.boolean(),
  canRequest: z.boolean(),
  reviewReason: z.string().nullish(),
  claimId: z.string().uuid().nullish(),
  turnId: z.string().uuid().nullish(),
});
export type AvailableHandover = z.infer<typeof availableHandoverSchema>;

/** GET /vaults/{id}/handover-request: yêu cầu đang mở của kho, cho Chủ kho xem. */
export const ownerRequestSchema = z.object({
  recordId: z.string().uuid(),
  status: recordStatusSchema,
  requestedAt: timestamp,
  requesterNames: z.array(z.string()),
});
export type OwnerRequest = z.infer<typeof ownerRequestSchema>;

/** Giới hạn tệp giống Backend: tối đa 10 tệp, mỗi tệp 10 MB, chỉ PDF hoặc ảnh. */
export const MAX_FILES = 10;
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
export const ACCEPT_ATTRIBUTE = ACCEPTED.join(",");

/** Lỗi của bộ tệp đã chọn, hoặc chuỗi rỗng khi hợp lệ. */
export function filesError(files: File[]): string {
  if (files.length === 0) return "Vui lòng đính kèm ít nhất một tệp giấy tờ.";
  if (files.length > MAX_FILES) return "Mỗi lần nộp tối đa 10 tệp.";
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) return `Tệp ${file.name} lớn hơn 10 MB.`;
    if (file.type && !ACCEPTED.includes(file.type))
      return `Tệp ${file.name} không phải PDF hoặc ảnh.`;
  }
  return "";
}
