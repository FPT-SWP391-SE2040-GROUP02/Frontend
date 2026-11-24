import type { Tone } from "@/shared/ui/heritageKit";
import type {
  ClaimStatus,
  HandoverRecord,
  RecordRecipient,
  RecordStatus,
} from "./handoverRecord.schema";

/** Nhãn và màu của từng bước biên bản. */
export const recordStatusLabel: Record<RecordStatus, { label: string; tone: Tone }> = {
  DRAFTING: { label: "Đang lập biên bản", tone: "warning" },
  // IDENTITY_CHECK chỉ còn ở biên bản cũ; luồng mới chốt xong là SIGNING nên xử lý như SIGNING.
  IDENTITY_CHECK: { label: "Đang ký và giao từng người", tone: "warning" },
  SIGNING: { label: "Đang ký và giao từng người", tone: "warning" },
  COMPLETED: { label: "Đã đủ chữ ký", tone: "success" },
  CANCELLED: { label: "Đã hủy", tone: "neutral" },
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

/**
 * Hai bước của biên bản. Sau khi luật sư chốt, luật sư và Người thực thi ký được ngay; từng người nhận
 * tự đi riêng (danh tính, ký, tải) nên không còn bước "chờ tất cả người nhận".
 */
export const recordSteps = [
  { key: "DRAFTING", title: "Lập biên bản", hint: "Ai nhận tài sản nào" },
  {
    key: "SIGNING",
    title: "Ký và giao từng người",
    hint: "Mỗi người nhận danh tính, ký và được mở phần của mình",
  },
] as const;

/** Thứ tự bước hiện tại (0, 1); mọi người nhận đã ký thì cả hai bước đều xong (2). */
export function currentStepIndex(status: RecordStatus): number {
  switch (status) {
    case "DRAFTING":
      return 0;
    case "IDENTITY_CHECK":
    case "SIGNING":
      return 1;
    case "COMPLETED":
      return 2;
    case "CANCELLED":
      return 0;
  }
}

/** Biên bản đã chốt và đang ký (kể cả biên bản cũ còn ở IDENTITY_CHECK). */
export function isSigningStage(status: string): boolean {
  return status === "SIGNING" || status === "IDENTITY_CHECK";
}

/**
 * Phần của một người nhận đã tới đâu: chưa danh tính, chờ người này ký, chờ luật sư hoặc Người thực thi ký,
 * hay đã được mở quyền tải. Quyền tải do Backend quyết định (turnStatus HANDOVER_COMMITTED), FE chỉ đọc.
 */
export function deliveryText(
  record: HandoverRecord,
  recipient: RecordRecipient,
): { label: string; tone: Tone } {
  if (recipient.turnStatus === "HANDOVER_COMMITTED") {
    return { label: "Đã mở quyền tải", tone: "success" };
  }
  if (!recipient.turnId) return { label: "Chưa chốt biên bản", tone: "neutral" };
  if (recipient.signedAt) {
    if (!record.verifierSignedAt && !record.executorSignedAt) {
      return { label: "Chờ luật sư và Người thực thi ký", tone: "warning" };
    }
    if (!record.verifierSignedAt) return { label: "Chờ luật sư ký", tone: "warning" };
    if (!record.executorSignedAt) return { label: "Chờ Người thực thi ký", tone: "warning" };
    return { label: "Chờ mở quyền tải", tone: "warning" };
  }
  if (recipient.identityConfirmedAt) return { label: "Chờ người này ký", tone: "warning" };
  return { label: "Chờ xác nhận danh tính", tone: "neutral" };
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

/** Số chữ ký đã có trên tổng số chữ ký cần (luật sư + Người thực thi + từng người nhận). */
export function signatureCount(record: HandoverRecord): { signed: number; total: number } {
  let signed = 0;
  if (record.verifierSignedAt) signed += 1;
  if (record.executorSignedAt) signed += 1;
  for (const recipient of record.recipients) {
    if (recipient.signedAt) signed += 1;
  }
  return { signed, total: 2 + record.recipients.length };
}

/** Phiếu giao nhận của một người nhận đang ở đâu; chỉ dùng khi phần của người đó đã mở quyền tải. */
export function receiptText(recipient: RecordRecipient): { label: string; tone: Tone } {
  if (recipient.receivedAllAt && recipient.receiptExecutorSignedAt)
    return { label: "Đủ hai bên ký", tone: "success" };
  if (recipient.receivedAllAt) return { label: "Chờ Người thực thi ký", tone: "warning" };
  if (recipient.receiptIssueNote) return { label: "Người nhận báo thiếu hoặc sai", tone: "danger" };
  if (recipient.turnStatus === "HANDOVER_COMMITTED")
    return { label: "Chờ người nhận ký", tone: "warning" };
  return { label: "Chưa giao", tone: "neutral" };
}
