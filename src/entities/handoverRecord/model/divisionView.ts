import type { HandoverRecord, RecordLine } from "./handoverRecord.schema";

/** Khóa của một cặp người nhận - tài sản trong biên bản đang lập. */
export const pairKey = (beneficiaryId: string, assetId: string) => `${beneficiaryId}:${assetId}`;

/** Các cặp người nhận - tài sản Backend đã lưu trong biên bản. */
export function savedPairs(record: HandoverRecord): Set<string> {
  const result = new Set<string>();
  for (const recipient of record.recipients) {
    for (const asset of recipient.assets) {
      result.add(pairKey(recipient.beneficiaryId, asset.assetId));
    }
  }
  return result;
}

/** Đổi các cặp đang chọn thành dòng biên bản để gửi lên máy chủ. */
export function pairsToLines(pairs: Set<string>): RecordLine[] {
  const lines: RecordLine[] = [];
  for (const key of pairs) {
    const [beneficiaryId, assetId] = key.split(":");
    lines.push({ beneficiaryId, assetId });
  }
  return lines;
}

/** Một người có thể nhận tài sản. */
export interface DivisionPerson {
  id: string;
  fullName: string;
  citizenId: string;
}

export interface DivisionAsset {
  assetId: string;
  name: string;
  ownerPeople: DivisionPerson[];
  people: DivisionPerson[];
  /** Khác cách chia ban đầu của Chủ tài sản; luôn false khi Chủ tài sản chưa chia gì. */
  differsFromOwner: boolean;
}

/**
 * Cách chia đang hiện trên màn hình (kể cả phần chưa lưu), nhìn theo từng tài sản. Dùng cho danh sách chia tài sản
 * và bản nháp để in; Backend vẫn là nơi quyết định khác biệt khi chốt (splitDifferences).
 */
export function divisionAssets(record: HandoverRecord, selected: Set<string>): DivisionAsset[] {
  return record.availableAssets.map((asset) => {
    const people: DivisionPerson[] = record.availableRecipients
      .filter((person) => selected.has(pairKey(person.beneficiaryId, asset.assetId)))
      .map((person) => ({
        id: person.beneficiaryId,
        fullName: person.fullName,
        citizenId: person.citizenId,
      }));
    const ownerIds = record.ownerSplit
      .filter((entry) => entry.assetIds.includes(asset.assetId))
      .map((entry) => entry.beneficiaryId);
    const ownerPeople = record.availableRecipients
      .filter((person) => ownerIds.includes(person.beneficiaryId))
      .map((person) => ({
        id: person.beneficiaryId,
        fullName: person.fullName,
        citizenId: person.citizenId,
      }));
    const differsFromOwner =
      record.ownerSplit.length > 0 &&
      (people.length !== ownerIds.length || people.some((person) => !ownerIds.includes(person.id)));
    return { assetId: asset.assetId, name: asset.name, ownerPeople, people, differsFromOwner };
  });
}

/** Những người được chia ít nhất một tài sản, kèm tên các tài sản. */
export function divisionPeople(
  assets: DivisionAsset[],
): (DivisionPerson & { assetNames: string[] })[] {
  const result = new Map<string, DivisionPerson & { assetNames: string[] }>();
  for (const asset of assets) {
    for (const person of asset.people) {
      const entry = result.get(person.id) ?? { ...person, assetNames: [] };
      entry.assetNames.push(asset.name);
      result.set(person.id, entry);
    }
  }
  return [...result.values()];
}
