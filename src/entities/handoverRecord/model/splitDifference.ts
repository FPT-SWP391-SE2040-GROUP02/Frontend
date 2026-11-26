import { pairsToLines } from "./divisionView";
import type { HandoverRecord, RecordLine, SplitDifference } from "./handoverRecord.schema";

/** Câu xác nhận luật sư phải tick khi biên bản khác cách chia ban đầu của Chủ tài sản. */
export const SPLIT_DEVIATION_LABEL =
  "Biên bản này khác cách chia ban đầu của Chủ tài sản (danh sách trên). Tôi xác nhận việc thay đổi là theo di chúc hoặc quy định pháp luật và chịu trách nhiệm về căn cứ này. LegacyVault chỉ giao tài sản theo biên bản luật sư đã lập.";

function distinct(values: string[]): string[] {
  return [...new Set(values)];
}

function recipientsOfAsset(lines: RecordLine[], assetId: string): string[] {
  return distinct(
    lines.filter((line) => line.assetId === assetId).map((line) => line.beneficiaryId),
  );
}

/**
 * Chỗ khác cách chia của Chủ tài sản tính theo đúng nội dung đang hiện trên màn hình (chưa lưu), cùng cách so của
 * Backend (HandoverRecordRules.FindSplitDifferences): người nhận được thêm, người nhận bị bỏ, rồi tài sản đổi người
 * nhận. Chỉ để hiển thị; khi lưu và phát hành Backend vẫn tự so lại.
 */
export function screenDifferences(
  record: HandoverRecord,
  selected: Set<string>,
): SplitDifference[] {
  const recordLines = pairsToLines(selected);
  const ownerLines: RecordLine[] = [];
  for (const entry of record.ownerSplit) {
    for (const assetId of entry.assetIds) {
      ownerLines.push({ beneficiaryId: entry.beneficiaryId, assetId });
    }
  }
  const personName = (beneficiaryId: string) =>
    record.availableRecipients.find((person) => person.beneficiaryId === beneficiaryId)?.fullName ??
    "";
  const recordPeople = distinct(recordLines.map((line) => line.beneficiaryId));
  const ownerPeople = distinct(ownerLines.map((line) => line.beneficiaryId));
  const empty = {
    beneficiaryId: null,
    recipientName: "",
    assetId: null,
    assetName: "",
    ownerRecipientNames: [],
    recordRecipientNames: [],
  };
  const result: SplitDifference[] = [];
  for (const beneficiaryId of recordPeople) {
    if (!ownerPeople.includes(beneficiaryId)) {
      const recipientName = personName(beneficiaryId);
      result.push({ ...empty, kind: "RECIPIENT_ADDED", beneficiaryId, recipientName });
    }
  }
  for (const beneficiaryId of ownerPeople) {
    if (!recordPeople.includes(beneficiaryId)) {
      const recipientName = personName(beneficiaryId);
      result.push({ ...empty, kind: "RECIPIENT_REMOVED", beneficiaryId, recipientName });
    }
  }
  const assetIds = distinct([...ownerLines, ...recordLines].map((line) => line.assetId));
  for (const assetId of assetIds) {
    const ownerSet = recipientsOfAsset(ownerLines, assetId);
    const recordSet = recipientsOfAsset(recordLines, assetId);
    const same =
      ownerSet.length === recordSet.length && ownerSet.every((item) => recordSet.includes(item));
    if (same) continue;
    result.push({
      ...empty,
      kind: "ASSET_RECIPIENTS_CHANGED",
      assetId,
      assetName: record.availableAssets.find((asset) => asset.assetId === assetId)?.name ?? "",
      ownerRecipientNames: ownerSet.map(personName),
      recordRecipientNames: recordSet.map(personName),
    });
  }
  return result;
}

function namesText(names: string[]): string {
  if (names.length === 0) {
    return "không ai";
  }
  return names.join(", ");
}

/** Một chỗ khác biệt bằng tiếng Việt thường, dùng cho cả màn luật sư và bản in. */
export function splitDifferenceText(difference: SplitDifference): string {
  if (difference.kind === "RECIPIENT_ADDED") {
    return `Thêm người nhận: ${difference.recipientName}`;
  }
  if (difference.kind === "RECIPIENT_REMOVED") {
    return `Bỏ người nhận: ${difference.recipientName}`;
  }
  return `${difference.assetName}: Chủ tài sản chia cho ${namesText(difference.ownerRecipientNames)} → biên bản ghi ${namesText(difference.recordRecipientNames)}`;
}
