import type { Assignment } from "@/entities/assignment/model/assignment.schema";

/** Tài sản trong kho, đủ để dựng màn phân chia. */
export interface AssignableAsset {
  id: string;
  name: string;
  kind: string;
}

/** Hồ sơ người nhận trong kho, đủ để dựng màn phân chia. */
export interface AssignableRecipient {
  id: string;
  fullName: string;
  citizenId: string;
}

/** Một dòng trên màn "Theo tài sản": tài sản và những người đang được gán. */
export interface AssetAssignmentRow {
  asset: AssignableAsset;
  recipients: AssignableRecipient[];
}

/** Một thẻ trên màn "Theo người nhận": người nhận và các tài sản của họ. */
export interface RecipientAssignmentCard {
  recipient: AssignableRecipient;
  assets: AssetWithSharing[];
}

/** Tài sản của một người nhận, kèm số người cùng nhận (tính cả người đó). */
export interface AssetWithSharing {
  asset: AssignableAsset;
  sharedWithCount: number;
}

export interface AssignmentSummary {
  totalAssets: number;
  assignedAssets: number;
  unassignedAssets: number;
  recipientCount: number;
}

/** Nhãn loại tài sản hiển thị cho người dùng. */
export function assetKindLabel(kind: string): string {
  if (kind === "FILE") {
    return "Tệp tải lên";
  }
  return "Ghi chú bí mật";
}

function recipientsOfAsset(
  assetId: string,
  assignments: Assignment[],
  recipientsById: Map<string, AssignableRecipient>,
): AssignableRecipient[] {
  const found: AssignableRecipient[] = [];
  for (const assignment of assignments) {
    if (assignment.assetId !== assetId) {
      continue;
    }
    const recipient = recipientsById.get(assignment.beneficiaryId);
    if (recipient) {
      found.push(recipient);
    }
  }
  return found;
}

/**
 * Các dòng "Theo tài sản": tài sản chưa gán cho ai xếp lên đầu để Chủ tài sản thấy việc còn thiếu;
 * trong mỗi nhóm giữ nguyên thứ tự của danh sách tài sản.
 */
export function buildAssetRows(
  assets: AssignableAsset[],
  recipients: AssignableRecipient[],
  assignments: Assignment[],
): AssetAssignmentRow[] {
  const recipientsById = new Map<string, AssignableRecipient>();
  for (const recipient of recipients) {
    recipientsById.set(recipient.id, recipient);
  }
  const unassigned: AssetAssignmentRow[] = [];
  const assigned: AssetAssignmentRow[] = [];
  for (const asset of assets) {
    const row = { asset, recipients: recipientsOfAsset(asset.id, assignments, recipientsById) };
    if (row.recipients.length === 0) {
      unassigned.push(row);
    } else {
      assigned.push(row);
    }
  }
  return [...unassigned, ...assigned];
}

/** Các thẻ "Theo người nhận": mọi người nhận trong kho, người chưa được gán tài sản nào xếp cuối. */
export function buildRecipientCards(
  assets: AssignableAsset[],
  recipients: AssignableRecipient[],
  assignments: Assignment[],
): RecipientAssignmentCard[] {
  const assetsById = new Map<string, AssignableAsset>();
  for (const asset of assets) {
    assetsById.set(asset.id, asset);
  }
  const countByAsset = new Map<string, number>();
  for (const assignment of assignments) {
    countByAsset.set(assignment.assetId, (countByAsset.get(assignment.assetId) ?? 0) + 1);
  }
  const withAssets: RecipientAssignmentCard[] = [];
  const withoutAssets: RecipientAssignmentCard[] = [];
  for (const recipient of recipients) {
    const items: AssetWithSharing[] = [];
    for (const assignment of assignments) {
      const asset = assetsById.get(assignment.assetId);
      if (assignment.beneficiaryId === recipient.id && asset) {
        items.push({ asset, sharedWithCount: countByAsset.get(asset.id) ?? 1 });
      }
    }
    if (items.length === 0) {
      withoutAssets.push({ recipient, assets: items });
    } else {
      withAssets.push({ recipient, assets: items });
    }
  }
  return [...withAssets, ...withoutAssets];
}

/** Số liệu đầu màn: bao nhiêu tài sản đã gán, còn bao nhiêu chưa, có bao nhiêu người nhận. */
export function summarizeAssignments(
  assets: AssignableAsset[],
  assignments: Assignment[],
): AssignmentSummary {
  const assignedAssetIds = new Set<string>();
  const recipientIds = new Set<string>();
  for (const assignment of assignments) {
    assignedAssetIds.add(assignment.assetId);
    recipientIds.add(assignment.beneficiaryId);
  }
  let assignedAssets = 0;
  for (const asset of assets) {
    if (assignedAssetIds.has(asset.id)) {
      assignedAssets = assignedAssets + 1;
    }
  }
  return {
    totalAssets: assets.length,
    assignedAssets,
    unassignedAssets: assets.length - assignedAssets,
    recipientCount: recipientIds.size,
  };
}

/** Id người nhận hiện tại của một tài sản, theo thứ tự gán. */
export function currentRecipientIds(assetId: string, assignments: Assignment[]): string[] {
  const ids: string[] = [];
  for (const assignment of assignments) {
    if (assignment.assetId === assetId) {
      ids.push(assignment.beneficiaryId);
    }
  }
  return ids;
}
