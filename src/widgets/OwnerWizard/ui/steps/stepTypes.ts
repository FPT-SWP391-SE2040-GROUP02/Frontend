import type { z } from "zod";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import type { planSetupSchema } from "@/features/plan-setup/model/planSetup.schema";

export type PlanSetup = z.infer<typeof planSetupSchema>;

/** Dữ liệu chung cho mọi bước; `setup` là null khi chưa tải được, để bước hiện "Chưa kiểm tra được". */
export interface OwnerStepProps {
  vault: VaultResponse;
  setup: PlanSetup | null;
  /** Mở một bước khác, dùng cho nút "Quay lại bước …". */
  onSelectStep: (id: string) => void;
}
