import type { Tone } from "@/shared/ui/heritageKit";
import type {
  ClaimStatus,
  HandoverRecord,
  RecordRecipient,
  RecordStatus,
} from "./handoverRecord.schema";

/** Nhãn và màu của từng bước biên bản. */
export const recordStatusLabel: Record<RecordStatus, { label: string; tone: Tone }> = {
  DRAFTING: { label: "Đang lập phương án chia", tone: "warning" },
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
  { key: "DRAFTING", title: "Lập phương án chia", hint: "Ai nhận tài sản nào" },
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
  if (!recipient.turnId) return { label: "Chưa chốt phương án chia", tone: "neutral" };
  // Chữ ký riêng cho người này; dữ liệu cũ chỉ có chữ ký chung của biên bản.
  const verifierAt = recipient.verifierSignedAt ?? record.verifierSignedAt;
  const executorAt = recipient.executorSignedAt ?? record.executorSignedAt;
  if (!recipient.identityConfirmedAt && !recipient.signedAt) {
    return { label: "Chờ xác nhận danh tính", tone: "neutral" };
  }
  // Thứ tự ký phần của mỗi người nhận: luật sư → Người thực thi → người nhận.
  if (!verifierAt) return { label: "Chờ luật sư ký", tone: "warning" };
  if (!executorAt) return { label: "Chờ Người thực thi ký", tone: "warning" };
  if (!recipient.signedAt) return { label: "Chờ người này ký", tone: "warning" };
  return { label: "Chờ mở quyền tải", tone: "warning" };
}

/** Một bên ký phần của người nhận, theo thứ tự ký: luật sư, Người thực thi, người nhận. */
export type SignatureParty = { role: string; signedAt: string | null };

/** Ba chữ ký của phần một người nhận theo đúng thứ tự ký; dữ liệu cũ dùng chữ ký chung của biên bản. */
export function signatureParties(
  record: HandoverRecord,
  recipient: RecordRecipient,
): SignatureParty[] {
  return [
    { role: "Luật sư", signedAt: recipient.verifierSignedAt ?? record.verifierSignedAt },
    { role: "Người thực thi", signedAt: recipient.executorSignedAt ?? record.executorSignedAt },
    { role: "Người nhận", signedAt: recipient.signedAt },
  ];
}

/** Phần của người nhận này đã đủ ba chữ ký chưa (Backend trả fullySigned; dữ liệu cũ thiếu trường thì tự đếm). */
export function isFullySigned(record: HandoverRecord, recipient: RecordRecipient): boolean {
  if (recipient.fullySigned) return true;
  return signatureParties(record, recipient).every((party) => party.signedAt !== null);
}

/** "Đủ chữ ký: x/y người nhận": số người nhận có phần đã đủ ba chữ ký trên tổng số người nhận. */
export function fullySignedCount(record: HandoverRecord): { signed: number; total: number } {
  const signed = record.recipients.filter((recipient) => isFullySigned(record, recipient)).length;
  return { signed, total: record.recipients.length };
}

/** Số phần luật sư và Người thực thi đã ký trên tổng số người nhận. */
export function partySignedCount(record: HandoverRecord): {
  verifier: number;
  executor: number;
  total: number;
} {
  let verifier = 0;
  let executor = 0;
  for (const recipient of record.recipients) {
    if (recipient.verifierSignedAt ?? record.verifierSignedAt) verifier += 1;
    if (recipient.executorSignedAt ?? record.executorSignedAt) executor += 1;
  }
  return { verifier, executor, total: record.recipients.length };
}

/** Câu "Luật sư đã ký a/y phần · Người thực thi đã ký b/y phần". */
export function partySignedText(record: HandoverRecord): string {
  const count = partySignedCount(record);
  return `Luật sư đã ký ${count.verifier}/${count.total} phần · Người thực thi đã ký ${count.executor}/${count.total} phần`;
}

/**
 * Câu giải thích vì sao người đang xem chưa ký được phần này, theo lý do Backend trả (signBlockedReason).
 * Rỗng khi ký được hoặc không có lý do.
 */
export function signBlockedText(reason: string): string {
  switch (reason) {
    case "VERIFIER_NOT_SIGNED":
      return "Chờ luật sư ký phần này";
    case "EXECUTOR_NOT_SIGNED":
      return "Chờ Người thực thi ký phần của bạn";
    case "RECIPIENT_NOT_CONFIRMED":
    case "IDENTITY_NOT_CONFIRMED":
      return "Chờ luật sư xác nhận danh tính";
    case "ALREADY_SIGNED":
      return "Đã ký phần này";
    case "NOT_SIGNING_STEP":
      return "Phương án chia chưa chốt";
    case "RECORD_COMPLETED":
      return "Biên bản đã đủ chữ ký";
    default:
      return "";
  }
}

/** Danh tính của một người nhận đang ở đâu, nói bằng chữ dễ hiểu. */
export function identityText(recipient: RecordRecipient): { label: string; tone: Tone } {
  if (recipient.identityConfirmedAt) return { label: "Đã xác nhận", tone: "success" };
  if (!recipient.turnId) return { label: "Chưa chốt phương án chia", tone: "neutral" };
  if (recipient.submissionStatus === "SUBMITTED")
    return { label: "Chờ luật sư kiểm", tone: "warning" };
  if (recipient.submissionStatus === "SUPPLEMENT_REQUESTED")
    return { label: "Đang làm lại xác minh", tone: "warning" };
  if (recipient.claimed) return { label: "Chưa nộp căn cước", tone: "neutral" };
  return { label: "Chưa mở thư mời", tone: "neutral" };
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
