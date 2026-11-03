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
  /** Việc Người thực hiện cần làm; null khi kho an toàn, chưa có việc gì. */
  task: string | null;
}

const URGENCY_ORDER: Record<VaultUrgency, number> = { overdue: 0, "death-case": 1, safe: 2 };

/**
 * Việc cần làm của Người thực hiện với một kho, chỉ suy từ dữ liệu `/executor/vaults` có sẵn.
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
  if (vault.checkInOverdue) {
    return {
      urgency: "overdue",
      label: "Quá hạn điểm danh",
      tone: "danger",
      detail: "Chủ kho đã quá hạn điểm danh",
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

/** Kho cần xử lý lên trên: quá hạn điểm danh → hồ sơ đang xử lý → an toàn; cùng mức thì giữ thứ tự gốc. */
export function sortVaultsByUrgency(vaults: ExecutorVault[]): ExecutorVault[] {
  const sorted = [...vaults];
  sorted.sort((left, right) => {
    return URGENCY_ORDER[vaultTask(left).urgency] - URGENCY_ORDER[vaultTask(right).urgency];
  });
  return sorted;
}

/** Số kho đang cần Người thực hiện (quá hạn điểm danh hoặc có hồ sơ đang mở). */
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
