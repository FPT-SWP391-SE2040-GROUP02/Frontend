import type { Tone } from "@/shared/ui/heritageKit";
import type { ExecutorVault } from "./deathCase.schema";

/** Mức cần làm của một kho, nhỏ hơn là cần xử lý trước. */
export type VaultUrgency = "overdue" | "death-case" | "safe";

export interface VaultTask {
  urgency: VaultUrgency;
  /** Nhãn trạng thái ngắn trên chip. */
  label: string;
  tone: Tone;
  /** Dòng phụ mô tả trạng thái điểm danh/hồ sơ. */
  detail: string;
  /** Việc Người thực thi cần làm; null khi kho an toàn, chưa có việc gì. */
  task: string | null;
}

const URGENCY_ORDER: Record<VaultUrgency, number> = { overdue: 0, "death-case": 1, safe: 2 };

/**
 * Việc cần làm của Người thực thi với một kho, chỉ suy từ dữ liệu `/executor/vaults` có sẵn.
 * Có hồ sơ chứng tử đang mở thì hồ sơ là việc chính, kể cả khi kho từng quá hạn điểm danh.
 */
export function vaultTask(vault: ExecutorVault): VaultTask {
  if (vault.openDeathCaseId) {
    return {
      urgency: "death-case",
      label: "Hồ sơ đang xử lý",
      tone: "warning",
      detail: "Đang có hồ sơ chứng tử chờ xét duyệt",
      task: "theo dõi hồ sơ chứng tử và bổ sung khi Người xét duyệt yêu cầu.",
    };
  }
  // Đang trong thời gian chờ: Chủ kho còn tự điểm danh được, Người thực thi chỉ cần để ý.
  if (vault.planStatus === "CHECKIN_OVERDUE") {
    return {
      urgency: "overdue",
      label: "Trễ điểm danh · đang chờ",
      tone: "warning",
      detail: "Chủ kho trễ hạn điểm danh, còn trong thời gian chờ",
      task: "để ý thêm. Chủ kho còn thời gian tự điểm danh; nếu đã liên lạc được và Chủ kho vẫn ổn, bạn có thể điểm danh hộ.",
    };
  }
  // Hết thời gian chờ (AWAITING_CHECK): hệ thống đã giao việc kiểm tra cho Người thực thi.
  if (vault.checkInOverdue) {
    return {
      urgency: "overdue",
      label: "Cần bạn kiểm tra",
      tone: "danger",
      detail: "Chủ kho đã hết thời gian chờ điểm danh",
      task: "liên hệ xem Chủ kho còn ổn không. Nếu không liên lạc được thì mở hồ sơ báo tin. Bạn vẫn không đọc được nội dung kho.",
    };
  }
  return {
    urgency: "safe",
    label: "Kho an toàn",
    tone: "success",
    detail: "Chủ kho điểm danh đúng hạn",
    task: null,
  };
}

/** Trong nhóm quá hạn: "Cần bạn kiểm tra" đứng trước "Trễ điểm danh · đang chờ". */
function overdueRank(vault: ExecutorVault): number {
  if (vault.planStatus === "CHECKIN_OVERDUE") return 1;
  return 0;
}

/** Kho cần xử lý lên trên: quá hạn điểm danh → hồ sơ đang xử lý → an toàn; cùng mức thì giữ thứ tự gốc. */
export function sortVaultsByUrgency(vaults: ExecutorVault[]): ExecutorVault[] {
  const sorted = [...vaults];
  sorted.sort((left, right) => {
    const byUrgency =
      URGENCY_ORDER[vaultTask(left).urgency] - URGENCY_ORDER[vaultTask(right).urgency];
    if (byUrgency !== 0) return byUrgency;
    if (vaultTask(left).urgency === "overdue") return overdueRank(left) - overdueRank(right);
    return 0;
  });
  return sorted;
}

/** Số kho đang cần Người thực thi (quá hạn điểm danh hoặc có hồ sơ đang mở). */
export function countVaultsNeedingAttention(vaults: ExecutorVault[]): number {
  let count = 0;
  for (const vault of vaults) {
    if (vaultTask(vault).urgency !== "safe") count += 1;
  }
  return count;
}

/** Hai chữ cái đầu cho ô tròn đại diện Chủ kho (chữ đầu của họ và tên). */
export function ownerInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "CK";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}
