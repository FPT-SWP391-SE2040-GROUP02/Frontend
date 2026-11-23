import type { Tone } from "@/shared/ui/heritageKit";
import type { ClaimStatus, RecordRecipient, RecordStatus } from "./handoverRecord.schema";

/** Nhãn và màu của từng bước biên bản. */
export const recordStatusLabel: Record<RecordStatus, { label: string; tone: Tone }> = {
  DRAFTING: { label: "Đang lập biên bản", tone: "warning" },
  IDENTITY_CHECK: { label: "Đang kiểm danh tính", tone: "warning" },
  SIGNING: { label: "Chờ luật sư ký", tone: "warning" },
  COMPLETED: { label: "Luật sư đã ký", tone: "success" },
  CANCELLED: { label: "Chủ kho đã hủy", tone: "neutral" },
};

/** Nhãn và màu của kết quả xét giấy tờ. */
export const claimStatusLabel: Record<ClaimStatus, { label: string; tone: Tone }> = {
  SUBMITTED: { label: "Chờ luật sư xét", tone: "warning" },
  SUPPLEMENT_REQUESTED: { label: "Cần bổ sung giấy tờ", tone: "warning" },
  ACCEPTED: { label: "Đã chấp nhận", tone: "success" },
  REJECTED: { label: "Bị từ chối", tone: "danger" },
};

/** Dung lượng tệp dạng dễ đọc: 12 KB, 3,4 MB. */
export function fileSizeText(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} MB`;
}

/** Ba bước luật sư đi đúng thứ tự: bước trước chưa xong thì chưa mở bước sau. */
export const recordSteps = [
  { key: "DRAFTING", title: "Biên bản", hint: "Ai nhận tài sản nào" },
  { key: "IDENTITY_CHECK", title: "Danh tính người nhận", hint: "Đối chiếu căn cước" },
  { key: "SIGNING", title: "Luật sư ký", hint: "Gửi yêu cầu chuyển giao cho Người thực thi" },
] as const;

/** Thứ tự bước hiện tại (0, 1, 2); luật sư đã ký thì cả ba bước đều xong (3). */
export function currentStepIndex(status: RecordStatus): number {
  switch (status) {
    case "DRAFTING":
      return 0;
    case "IDENTITY_CHECK":
      return 1;
    case "SIGNING":
      return 2;
    case "COMPLETED":
      return 3;
    case "CANCELLED":
      return 0;
  }
}

/** Danh tính của một người nhận đang ở đâu, nói bằng chữ dễ hiểu. */
export function identityText(recipient: RecordRecipient): { label: string; tone: Tone } {
  if (recipient.identityConfirmedAt) return { label: "Đã xác nhận", tone: "success" };
  if (!recipient.turnId) return { label: "Chưa chốt biên bản", tone: "neutral" };
  if (recipient.submissionStatus === "SUBMITTED")
    return { label: "Chờ luật sư kiểm", tone: "warning" };
  if (recipient.submissionStatus === "SUPPLEMENT_REQUESTED")
    return { label: "Đang làm lại xác minh", tone: "warning" };
  if (recipient.claimed) return { label: "Chưa nộp căn cước", tone: "neutral" };
  return { label: "Chưa mở thư mời", tone: "neutral" };
}

/** Phiếu giao nhận của một người nhận đang ở đâu. */
export function receiptText(recipient: RecordRecipient): { label: string; tone: Tone } {
  if (recipient.receivedAllAt && recipient.receiptExecutorSignedAt)
    return { label: "Đủ hai bên ký", tone: "success" };
  if (recipient.receivedAllAt) return { label: "Chờ Người thực thi ký", tone: "warning" };
  if (recipient.receiptIssueNote) return { label: "Người nhận báo thiếu hoặc sai", tone: "danger" };
  if (recipient.turnStatus === "HANDOVER_COMMITTED")
    return { label: "Chờ người nhận ký", tone: "warning" };
  return { label: "Chưa giao", tone: "neutral" };
}
