import type { DeathCase, ExecutorVault } from "./deathCase.schema";

/**
 * Bước hiện tại (1–8) của quy trình, suy từ trạng thái kế hoạch Backend trả về.
 * Trả null khi kho bị đóng băng hoặc trạng thái lạ, để giao diện không tô nhầm bước nào.
 * Khi kế hoạch có hồ sơ chứng tử: còn nháp là bước 5, đã gửi là bước 6. Chưa tải được hồ sơ thì coi như đã gửi.
 */
export function deriveProcessStep(
  vault: ExecutorVault,
  record: DeathCase | null | undefined,
): number | null {
  switch (vault.planStatus) {
    case "DRAFT":
      return 1;
    case "ACTIVE":
      return 2;
    case "CHECKIN_OVERDUE":
      return 3;
    case "AWAITING_CHECK":
      return 4;
    case "DEATH_CASE_OPEN":
      if (record?.status === "DRAFT") return 5;
      return 6;
    case "HANDOVER_IN_PROGRESS":
      return 7;
    case "CLOSED":
      return 8;
    default:
      return null;
  }
}
