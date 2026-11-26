import type {
  WillAssetView,
  WillOwnerIdentityView,
  WillRecipientView,
} from "../model/willDocument.types";
import type { WillIdentity } from "../model/willIdentity.schema";
import type { PlanRecipient } from "../model/willRecipient.schema";

/**
 * Người nhận theo từng người; undefined khi Backend cũ chưa trả `recipients`. Có `identity` thì ghép ngày sinh và CCCD
 * theo `beneficiaryId` (không phân biệt hoa thường); người không có trong danh tính để trống hai trường đó.
 */
export function pickWillRecipients(
  setup: { recipients?: PlanRecipient[] },
  identity?: WillIdentity,
): WillRecipientView[] | undefined {
  if (setup.recipients === undefined) {
    return undefined;
  }
  const result: WillRecipientView[] = [];
  for (const recipient of setup.recipients) {
    const assets: WillAssetView[] = [];
    for (const asset of recipient.assets) {
      assets.push({ id: asset.id, name: asset.name, sharedWithCount: asset.sharedWithCount });
    }
    const view: WillRecipientView = {
      id: recipient.beneficiaryId,
      fullName: recipient.fullName,
      assets,
    };
    if (identity !== undefined) {
      for (const person of identity.recipients) {
        if (person.beneficiaryId.toLowerCase() === recipient.beneficiaryId.toLowerCase()) {
          view.dateOfBirth = person.dateOfBirth;
          view.citizenId = person.citizenId;
        }
      }
    }
    result.push(view);
  }
  return result;
}

/** Danh tính Chủ tài sản để in ở mục I; null khi chưa có danh tính eKYC gắn với kho. */
export function pickOwnerIdentity(identity: WillIdentity): WillOwnerIdentityView | null {
  if (identity.owner === null) {
    return null;
  }
  return {
    dateOfBirth: identity.owner.dateOfBirth,
    citizenId: identity.owner.citizenId,
    residenceAddress: identity.owner.residenceAddress,
  };
}
