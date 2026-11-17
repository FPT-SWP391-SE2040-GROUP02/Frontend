import type { z } from "zod";
import type {
  WillExecutorView,
  WillPackageView,
  WillRecipientView,
} from "@/entities/will/model/willDocument.types";
import type { planSetupSchema } from "../model/planSetup.schema";

type PlanSetup = z.infer<typeof planSetupSchema>;

/**
 * Người thực thi in trong di chúc: ưu tiên người đã ký nhận vai (ACCEPTED), nếu chưa có thì người đang được mời
 * hoặc đang tạm ngưng (di chúc hiện chỗ trống "chờ ký"). Người đã từ chối, hết hạn hoặc bị thu hồi không in.
 */
export function pickWillExecutor(executors: PlanSetup["executors"]): WillExecutorView | null {
  let pending: WillExecutorView | null = null;
  for (const executor of executors) {
    if (executor.status === "ACCEPTED") {
      return {
        email: executor.inviteeEmail,
        fullName: executor.fullName,
        signedAt: executor.acceptedAt,
      };
    }
    if (pending === null && (executor.status === "INVITED" || executor.status === "SUSPENDED")) {
      pending = { email: executor.inviteeEmail, fullName: executor.fullName, signedAt: null };
    }
  }
  return pending;
}

/** Người nhận theo từng người; undefined khi Backend cũ chưa trả `recipients`. */
export function pickWillRecipients(setup: PlanSetup): WillRecipientView[] | undefined {
  if (setup.recipients === undefined) {
    return undefined;
  }
  const result: WillRecipientView[] = [];
  for (const recipient of setup.recipients) {
    const packages: WillPackageView[] = [];
    for (const container of recipient.containers) {
      packages.push({ id: container.id, name: container.name, assetCount: container.assetCount });
    }
    result.push({
      id: recipient.beneficiaryId,
      fullName: recipient.fullName,
      packages,
    });
  }
  return result;
}

/** Gói chưa có người nhận (designationCount = 0): chỗ trống của Điều 2. */
export function pickUnassignedPackages(containers: PlanSetup["containers"]): WillPackageView[] {
  const result: WillPackageView[] = [];
  for (const container of containers) {
    if (container.designationCount === 0) {
      result.push({ id: container.id, name: container.name, assetCount: container.assetCount });
    }
  }
  return result;
}

/**
 * Lúc Chủ kho ký. Chỉ tính là đã ký khi kế hoạch không còn DRAFT và có activatedAt (kế hoạch bị đưa về nháp thì
 * chữ ký cũ không còn hiệu lực, phải ký lại).
 */
export function pickOwnerSignedAt(setup: PlanSetup): string | null {
  if (setup.planStatus === "DRAFT") {
    return null;
  }
  if (setup.activatedAt === undefined || setup.activatedAt === null) {
    return null;
  }
  return setup.activatedAt;
}
