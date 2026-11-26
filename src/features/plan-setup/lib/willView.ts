import type { z } from "zod";
import type {
  WillExecutorView,
  WillOwnerIdentityView,
  WillAssetView,
  WillRecipientView,
  WillVersionView,
} from "@/entities/will/model/willDocument.types";
import type { planSetupSchema } from "../model/planSetup.schema";
import type { WillIdentity } from "../model/willIdentity.schema";

type PlanSetup = z.infer<typeof planSetupSchema>;

/** Chữ ký Người thực thi trên bản đang xem: chưa đồng ý phiên bản ký lại thì coi là chưa ký bản đó. */
function executorSignedAt(
  setup: PlanSetup,
  executor: PlanSetup["executors"][number],
): string | null {
  if (isExecutorBehind(setup, executor)) {
    return null;
  }
  return executor.acceptedAt;
}

/** Người thực thi đã nhận vai nhưng chưa đồng ý phiên bản Chủ tài sản ký gần nhất. Backend cũ không có dữ liệu thì không tính. */
export function isExecutorBehind(
  setup: PlanSetup,
  executor: PlanSetup["executors"][number],
): boolean {
  if (executor.status !== "ACCEPTED" || setup.planStatus !== "ACTIVE") {
    return false;
  }
  if (!setup.willVersion || executor.confirmedWillVersionNo === undefined) {
    return false;
  }
  return executor.confirmedWillVersionNo !== setup.willVersion;
}

/**
 * Người thực thi in trong biên bản phân chia: ưu tiên người đã ký nhận vai (ACCEPTED), nếu chưa có thì người đang được mời
 * hoặc đang tạm ngưng (biên bản phân chia hiện chỗ trống "chờ ký"). Người đã từ chối, hết hạn hoặc bị thu hồi không in.
 */
export function pickWillExecutor(setup: PlanSetup): WillExecutorView | null {
  const executors = setup.executors;
  let pending: WillExecutorView | null = null;
  for (const executor of executors) {
    if (executor.status === "ACCEPTED") {
      return {
        email: executor.inviteeEmail,
        fullName: executor.fullName,
        signedAt: executorSignedAt(setup, executor),
      };
    }
    if (pending === null && (executor.status === "INVITED" || executor.status === "SUSPENDED")) {
      pending = { email: executor.inviteeEmail, fullName: executor.fullName, signedAt: null };
    }
  }
  return pending;
}

/**
 * Người nhận theo từng người; undefined khi Backend cũ chưa trả `recipients`. Có `identity` thì ghép ngày sinh và CCCD
 * theo `beneficiaryId` (không phân biệt hoa thường); người không có trong danh tính để trống hai trường đó.
 */
export function pickWillRecipients(
  setup: PlanSetup,
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

/**
 * Phiên bản đã ký gần nhất để in ở đầu tờ. Kế hoạch còn nháp thì chưa có bản ký hiệu lực nên không in; Backend cũ
 * hoặc kế hoạch chạy từ trước khi có phiên bản (`willVersion` null) cũng không in.
 */
export function pickWillVersion(setup: PlanSetup): WillVersionView | null {
  if (setup.planStatus === "DRAFT" && !setup.willAwaitingExecutor) {
    return null;
  }
  if (setup.willVersion === undefined || setup.willVersion === null) {
    return null;
  }
  let signedAt: string | null = null;
  if (setup.willSignedAt !== undefined) {
    signedAt = setup.willSignedAt;
  }
  return { number: setup.willVersion, signedAt };
}

/** Kế hoạch đang chạy (không phải nháp) mà cấu hình khác bản ký gần nhất, cần Chủ tài sản ký lại. */
export function needsResign(setup: PlanSetup): boolean {
  if (setup.planStatus === "DRAFT") {
    return false;
  }
  return setup.hasUnsignedChanges === true;
}

/**
 * Lúc Chủ tài sản ký (bản ký gần nhất: ký lại thì lấy `willSignedAt`, chưa có thì lúc kích hoạt). Chỉ tính là đã ký khi kế hoạch không còn DRAFT và có activatedAt (kế hoạch bị đưa về nháp thì
 * chữ ký cũ không còn hiệu lực, phải ký lại).
 */
export function pickOwnerSignedAt(setup: PlanSetup): string | null {
  if (setup.planStatus === "DRAFT") {
    // Đã ký và đang chờ Người thực thi: chữ ký của bản này còn hiệu lực.
    if (setup.willAwaitingExecutor) {
      return setup.willSignedAt ?? null;
    }
    return null;
  }
  if (setup.activatedAt === undefined || setup.activatedAt === null) {
    return null;
  }
  if (setup.willSignedAt !== undefined && setup.willSignedAt !== null) {
    return setup.willSignedAt;
  }
  return setup.activatedAt;
}
