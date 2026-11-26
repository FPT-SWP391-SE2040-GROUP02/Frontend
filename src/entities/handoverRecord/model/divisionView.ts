import type { HandoverRecord } from "./handoverRecord.schema";
import type { RecipientDraft } from "./recipientDraft";

/** Khóa của một cặp người nhận - tài sản trong biên bản đang lập. */
export const pairKey = (beneficiaryId: string, assetId: string) => `${beneficiaryId}:${assetId}`;

/** Một người có thể nhận tài sản: đã có trong kho hoặc đang được luật sư nhập. */
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
export function divisionAssets(
  record: HandoverRecord,
  selected: Set<string>,
  drafts: RecipientDraft[] = [],
): DivisionAsset[] {
  return record.availableAssets.map((asset) => {
    const people: DivisionPerson[] = record.availableRecipients
      .filter((person) => selected.has(pairKey(person.beneficiaryId, asset.assetId)))
      .map((person) => ({
        id: person.beneficiaryId,
        fullName: person.fullName,
        citizenId: person.citizenId,
      }));
    for (const draft of drafts) {
      if (!draft.assetIds.includes(asset.assetId)) continue;
      people.push({
        id: draft.key,
        fullName: draft.fullName.trim() || "Người nhận mới",
        citizenId: draft.citizenId.trim(),
      });
    }
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
