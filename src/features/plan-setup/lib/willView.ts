import type { z } from "zod";
import type { WillExecutorView } from "@/entities/will/model/willDocument.types";
import type { planSetupSchema } from "../model/planSetup.schema";

type PlanSetup = z.infer<typeof planSetupSchema>;

export { pickOwnerIdentity, pickWillRecipients } from "@/entities/will/lib/willPeople";

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
