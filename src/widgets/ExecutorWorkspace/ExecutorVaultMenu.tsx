import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { vaultStage } from "@/features/death-case/model/executorTodo";
import type { Tone } from "@/shared/ui/heritageKit";

/** Màu chữ trạng thái trên nền menu tối. */
const STAGE_COLOR: Record<Tone, string> = {
  success: "text-[#8FD1B0]",
  warning: "text-[#E6C98B]",
  danger: "text-[#F0A39B]",
  neutral: "text-white/60",
};

/**
 * Nhóm "Kho bạn đang giữ" ở đầu menu trái: mọi kho tài khoản đang giữ vai Người thực thi, mỗi kho một nút
 * (vòng chữ cái đầu tên Chủ kho, tên Chủ kho, trạng thái gọn). Kho đang chọn có viền vàng; bấm để chuyển kho
 * bằng cơ chế chọn kho sẵn có (?vault= và nhớ trong phiên). Quyền trên từng kho vẫn do Backend kiểm tra.
 */
export function ExecutorVaultMenu() {
  const { vaults, selected, select } = useSelectedExecutorVault();
  if (vaults.length === 0) return null;
  return (
    <section aria-labelledby="executor-vaults-heading" className="px-2 pt-2">
      <h2
        id="executor-vaults-heading"
        className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-white/60"
      >
        Kho bạn đang giữ
      </h2>
      <ul className="space-y-2">
        {vaults.map((vault) => {
          const isSelected = selected?.vaultId === vault.vaultId;
          const stage = vaultStage(vault);
          let borderClass = "border-white/15 hover:bg-white/10";
          if (isSelected) borderClass = "border-[#C9A45C] bg-white/10";
          return (
            <li key={vault.vaultId}>
              <button
                type="button"
                aria-pressed={isSelected}
                aria-label={`Kho của ${vault.ownerFullName}`}
                onClick={() => select(vault.vaultId)}
                className={`flex w-full items-center gap-3 rounded-xl border bg-white/5 p-2.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold ${borderClass}`}
              >
                <span
                  aria-hidden="true"
                  className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-sm font-bold text-[#0A281E]"
                >
                  {vault.ownerFullName.trim().charAt(0).toLocaleUpperCase("vi-VN")}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-white">
                    {vault.ownerFullName}
                  </span>
                  <span className={`block truncate text-xs ${STAGE_COLOR[stage.tone]}`}>
                    {stage.label}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
