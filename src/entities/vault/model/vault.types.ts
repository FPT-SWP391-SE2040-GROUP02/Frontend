import type { z } from "zod";
import type { vaultResponseSchema } from "./vault.schema";

/** PlanStatus wire từ Backend; khác trạng thái đóng/mở kho. */
export const VAULT_PLAN_STATUS = {
  DRAFT: "DRAFT",
  ACTIVE: "ACTIVE",
  HANDOVER_REQUESTED: "HANDOVER_REQUESTED",
  HANDOVER_IN_PROGRESS: "HANDOVER_IN_PROGRESS",
  CLOSED: "CLOSED",
} as const;
/** DTO raw của Backend; giữ etag khi sửa. */
export type VaultResponse = z.infer<typeof vaultResponseSchema>;
/** Trạng thái kế hoạch do server quản lý. */
export type VaultPlanStatus = (typeof VAULT_PLAN_STATUS)[keyof typeof VAULT_PLAN_STATUS];
