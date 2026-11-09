import { Lock } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import type { ExecutorVault } from "../model/deathCase.schema";
import { ownerInitials, sortVaultsByUrgency, vaultTask } from "../model/executorVaultTask";

/**
 * Danh sách kho của Người thực thi kèm việc cần làm, thay cho trang "Chọn kho" cũ. Kho cần xử lý lên trên;
 * có việc thì nút đậm là việc đó, không có việc thì chỉ còn nút "Mở kho" viền mảnh.
 */
export function ExecutorVaultList({
  vaults,
  onSelect,
  onOpen,
}: {
  vaults: ExecutorVault[];
  /** Mở Tổng quan của kho. */
  onSelect: (vaultId: string) => void;
  /** Mở một trang khác của không gian Người thực thi cho kho. */
  onOpen: (vaultId: string, path: string) => void;
}) {
  const sorted = sortVaultsByUrgency(vaults);
  return (
    <div className="space-y-4">
      <ul className="space-y-4">
        {sorted.map((vault) => {
          const task = vaultTask(vault);
          const urgent = task.urgency !== "safe";
          return (
            <li
              key={vault.vaultId}
              className="rounded-2xl border border-heritage-border bg-heritage-surface p-5"
            >
              <div className="flex flex-wrap items-center gap-4">
                <span
                  aria-hidden="true"
                  className={`flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${urgent ? "bg-[#0A281E] text-white" : "bg-[#E3ECE6] text-[#0A281E]"}`}
                >
                  {ownerInitials(vault.ownerFullName)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-heritage-primary">
                      {vault.ownerFullName}
                    </h2>
                    <Chip tone={task.tone}>{task.label}</Chip>
                  </div>
                  <p className="mt-1 text-sm text-heritage-muted">{task.detail}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {task.urgency === "overdue" && (
                    <button
                      type="button"
                      className={buttonStyles.dark}
                      onClick={() => onOpen(vault.vaultId, ROUTES.EXECUTOR.REPORT)}
                    >
                      Liên hệ kiểm tra
                    </button>
                  )}
                  {task.urgency === "death-case" && (
                    <button
                      type="button"
                      className={buttonStyles.dark}
                      onClick={() => onOpen(vault.vaultId, ROUTES.EXECUTOR.PROGRESS)}
                    >
                      Xem tiến trình
                    </button>
                  )}
                  {!urgent && <span className="text-sm text-heritage-muted">Chưa có việc gì</span>}
                  <button
                    type="button"
                    aria-label={`Mở kho của ${vault.ownerFullName}`}
                    className={buttonStyles.outline}
                    onClick={() => onSelect(vault.vaultId)}
                  >
                    Mở kho
                  </button>
                </div>
              </div>
              {task.task && (
                <p className="mt-4 border-t border-heritage-border pt-3 text-sm">
                  <strong>Việc của bạn:</strong> {task.task}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="flex items-center gap-2 text-sm text-heritage-muted">
        <Lock className="size-4 shrink-0" aria-hidden="true" />
        <span>
          Mỗi kho có hồ sơ và tiến trình riêng. Quyền của bạn chỉ gồm báo tin và theo dõi tiến trình
          — <strong className="text-heritage-primary">không đọc được nội dung kho nào</strong>.
        </span>
      </p>
    </div>
  );
}
