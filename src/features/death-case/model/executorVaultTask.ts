import type { Tone } from "@/shared/ui/heritageKit";
import type { ExecutorVault } from "./deathCase.schema";

/** Mức cần làm của một kho, nhỏ hơn là cần xử lý trước. */
export type VaultUrgency = "sign" | "handover" | "safe";

export interface VaultTask {
  urgency: VaultUrgency;
  /** Nhãn trạng thái ngắn trên chip. */
  label: string;
  tone: Tone;
  /** Dòng phụ mô tả tình trạng bàn giao. */
  detail: string;
  /** Việc Người thực thi cần làm; null khi chưa có việc gì. */
  task: string | null;
}

const URGENCY_ORDER: Record<VaultUrgency, number> = { sign: 0, handover: 1, safe: 2 };

/** Việc cần làm của Người thực thi với một kho, chỉ suy từ dữ liệu `/executor/vaults` có sẵn. */
export function vaultTask(vault: ExecutorVault): VaultTask {
  const status = vault.handoverRecordStatus;
  if (status === "SIGNING" || status === "IDENTITY_CHECK") {
    return {
      urgency: "sign",
      label: "Đang ký biên bản",
      tone: "warning",
      detail: "Biên bản đã chốt, đang ký và giao từng người",
      task: "đọc lại biên bản và ký nếu bạn chưa ký, rồi gửi mã nhận cho người đã được mở ở mục Bàn giao.",
    };
  }
  if (status === "COMPLETED" && vault.planStatus !== "CLOSED") {
    return {
      urgency: "sign",
      label: "Đang giao tài sản",
      tone: "warning",
      detail: "Mọi người nhận đã ký",
      task: "gửi mã nhận và ký phiếu giao nhận ở mục Bàn giao.",
    };
  }
  if (status === "DRAFTING") {
    return {
      urgency: "handover",
      label: "Đang lập biên bản",
      tone: "warning",
      detail: "Luật sư đang lập biên bản",
      task: null,
    };
  }
  return {
    urgency: "safe",
    label: vault.planStatus === "CLOSED" ? "Đã hoàn tất" : "Chưa có yêu cầu nhận",
    tone: "success",
    detail: vault.planStatus === "CLOSED" ? "Bàn giao đã xong" : "Chưa cần làm gì",
    task: null,
  };
}

/** Kho cần xử lý lên trên: cần ký hoặc gửi mã → đang lập biên bản → còn lại; cùng mức thì giữ thứ tự gốc. */
export function sortVaultsByUrgency(vaults: ExecutorVault[]): ExecutorVault[] {
  const sorted = [...vaults];
  sorted.sort(
    (left, right) =>
      URGENCY_ORDER[vaultTask(left).urgency] - URGENCY_ORDER[vaultTask(right).urgency],
  );
  return sorted;
}

/** Số kho đang cần Người thực thi để ý (đang bàn giao). */
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
