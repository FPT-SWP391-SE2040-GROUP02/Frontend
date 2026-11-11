import type { HandoverDocument } from "@/entities/handoverDocument";
import type { RecipientSubmissionSummary } from "./recipientReview.schema";

/** Một dòng việc của Người xét duyệt trong mục Hồ sơ người nhận. */
export interface RecipientWorkItem {
  /** Id hồ sơ người nhận (submissionId), dùng để mở màn duyệt. */
  submissionId: string;
  /** Tên người nhận; rỗng với hồ sơ luồng cũ chưa có biên bản. */
  recipientName: string;
  containerName: string;
  ownerName: string;
  kind: "ACCEPT" | "DECLINE";
  /** Thời điểm nộp hoặc nộp lại (ISO). */
  submittedAt: string;
  resubmitted: boolean;
  /** Lý do đã yêu cầu bổ sung (chỉ có ở tab chờ người nhận bổ sung). */
  supplementReason: string;
}

function byOldestFirst(a: RecipientWorkItem, b: RecipientWorkItem): number {
  const left = new Date(a.submittedAt).getTime();
  const right = new Date(b.submittedAt).getTime();
  if (left !== right) return left - right;
  return a.submissionId.localeCompare(b.submissionId);
}

/**
 * Tab "Chờ bạn duyệt": hồ sơ đang chờ, nộp trước xếp trên. Thông tin người nhận, Chủ kho và việc nộp lại lấy từ biên bản
 * tương ứng (theo submissionId); hồ sơ luồng cũ không có biên bản thì chỉ có tên gói.
 */
export function buildWaitingItems(
  submissions: RecipientSubmissionSummary[],
  documents: HandoverDocument[],
): RecipientWorkItem[] {
  const items: RecipientWorkItem[] = [];
  for (const submission of submissions) {
    let document: HandoverDocument | null = null;
    for (const candidate of documents) {
      if (candidate.submissionId === submission.id) document = candidate;
    }
    let recipientName = "";
    let ownerName = "";
    let resubmitted = false;
    if (document) {
      recipientName = document.recipient.fullName;
      ownerName = document.owner.fullName;
      resubmitted = document.resubmitted;
    }
    items.push({
      submissionId: submission.id,
      recipientName,
      containerName: submission.containerName,
      ownerName,
      kind: submission.kind,
      submittedAt: submission.submittedAt,
      resubmitted,
      supplementReason: "",
    });
  }
  return items.sort(byOldestFirst);
}

/** Tab "Chờ người nhận bổ sung": biên bản đã trả về người nhận kèm lý do, chưa nộp lại. */
export function buildSupplementItems(documents: HandoverDocument[]): RecipientWorkItem[] {
  const items: RecipientWorkItem[] = [];
  for (const document of documents) {
    if (document.status !== "WAIT_RECIPIENT") continue;
    if (!document.supplementReason || !document.submissionId) continue;
    items.push({
      submissionId: document.submissionId,
      recipientName: document.recipient.fullName,
      containerName: document.containerName,
      ownerName: document.owner.fullName,
      kind: document.kind,
      submittedAt: document.submittedAt ?? document.createdAt,
      resubmitted: document.resubmitted,
      supplementReason: document.supplementReason,
    });
  }
  return items.sort(byOldestFirst);
}

/** Một biên bản đã xong của một kho trong mục Biên bản đã ký. */
export interface VaultGroup {
  vaultId: string;
  ownerName: string;
  /** Lúc mất (yyyy-MM-dd) của Chủ kho, có thể trống. */
  dateOfDeath: string | null;
  caseApprovedAt: string | null;
  /** Số người nhận đã xong (biên bản hoàn tất). */
  doneCount: number;
  /** Tổng số người nhận của kho; 0 khi Backend không trả (khi đó chỉ hiện số đã xong). */
  totalCount: number;
  /** Mốc mới nhất của kho, để xếp kho mới nhất lên trên. */
  latestAt: string;
  /** Chỉ các biên bản đã hoàn tất. */
  documents: HandoverDocument[];
}

/** Gom các biên bản đã hoàn tất theo kho; kho có biên bản hoàn tất mới nhất xếp trên. */
export function groupSignedByVault(documents: HandoverDocument[]): VaultGroup[] {
  const groups: VaultGroup[] = [];
  for (const document of documents) {
    if (document.status !== "COMPLETED") continue;
    const moment = document.completedAt ?? document.createdAt;
    let group: VaultGroup | null = null;
    for (const candidate of groups) {
      if (candidate.vaultId === document.vaultId) group = candidate;
    }
    if (!group) {
      group = {
        vaultId: document.vaultId,
        ownerName: document.owner.fullName,
        dateOfDeath: document.owner.dateOfDeath,
        caseApprovedAt: document.caseApprovedAt ?? null,
        doneCount: 0,
        totalCount: document.vaultRecipientTotal,
        latestAt: moment,
        documents: [],
      };
      groups.push(group);
    }
    group.documents.push(document);
    group.doneCount += 1;
    if (new Date(moment).getTime() > new Date(group.latestAt).getTime()) group.latestAt = moment;
  }
  for (const group of groups) {
    group.documents.sort(
      (a, b) =>
        new Date(b.completedAt ?? b.createdAt).getTime() -
        new Date(a.completedAt ?? a.createdAt).getTime(),
    );
  }
  return groups.sort((a, b) => new Date(b.latestAt).getTime() - new Date(a.latestAt).getTime());
}
