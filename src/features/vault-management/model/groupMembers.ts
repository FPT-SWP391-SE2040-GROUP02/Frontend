/** Tài sản trong kho, kèm gói đang chứa nó (một tài sản thuộc tối đa một gói, SETUP-03). */
export interface GroupAssetOption {
  id: string;
  name: string;
  kind: string;
  /** null khi tài sản chưa thuộc gói nào. */
  containerId: string | null;
  containerName: string | null;
}

/** Hồ sơ người nhận trong kho; chỉ giữ 4 số cuối CCCD. */
export interface GroupBeneficiaryOption {
  id: string;
  fullName: string;
  citizenIdLast4: string;
}

/** Nhãn loại tài sản hiển thị cho người dùng. */
export function assetKindLabel(kind: string): string {
  if (kind === "FILE") {
    return "Tệp tải lên";
  }
  return "Ghi chú bí mật";
}

/** CCCD che, chỉ lộ 4 số cuối. */
export function maskedCitizenId(last4: string): string {
  return `CCCD ****${last4}`;
}

/** Một dòng trong cột chọn của dialog gói bàn giao. */
export interface MemberPickerItem {
  id: string;
  label: string;
  detail?: string;
  /** Không chọn được (ví dụ tài sản đang ở gói khác). */
  disabled?: boolean;
}

/**
 * Dòng chọn tài sản: tài sản chưa thuộc gói nào xếp lên đầu, mỗi dòng ghi đang ở gói nào.
 * Tài sản đang ở gói khác bị khóa vì server chỉ cho một tài sản thuộc một gói (409 ASSET_ALREADY_IN_CONTAINER).
 * Tài sản đã ở chính gói `currentGroupId` thì bỏ khỏi danh sách.
 */
export function buildAssetPickerItems(
  assets: GroupAssetOption[],
  currentGroupId: string | null,
): { items: MemberPickerItem[]; freeCount: number } {
  const free: MemberPickerItem[] = [];
  const taken: MemberPickerItem[] = [];
  for (const asset of assets) {
    if (asset.containerId === null) {
      free.push({ id: asset.id, label: asset.name, detail: assetKindLabel(asset.kind) });
    } else if (asset.containerId !== currentGroupId) {
      let groupName = "gói khác";
      if (asset.containerName !== null) {
        groupName = asset.containerName;
      }
      taken.push({
        id: asset.id,
        label: asset.name,
        detail: `Đang ở ${groupName}`,
        disabled: true,
      });
    }
  }
  return { items: [...free, ...taken], freeCount: free.length };
}

/** Dòng chọn người nhận, kèm CCCD che; bỏ những người có id trong `excludedIds` (đã ở gói). */
export function buildBeneficiaryPickerItems(
  beneficiaries: GroupBeneficiaryOption[],
  excludedIds: string[],
): MemberPickerItem[] {
  const items: MemberPickerItem[] = [];
  for (const person of beneficiaries) {
    if (!excludedIds.includes(person.id)) {
      items.push({
        id: person.id,
        label: person.fullName,
        detail: maskedCitizenId(person.citizenIdLast4),
      });
    }
  }
  return items;
}
