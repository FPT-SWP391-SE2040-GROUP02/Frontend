import { Link } from "react-router-dom";
import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { vaultStage } from "@/features/death-case/model/executorTodo";
import { ROUTES } from "@/shared/config/routes.config";
import type { Tone } from "@/shared/ui/heritageKit";

/** Màu chữ trạng thái trên nền menu tối. */
const STAGE_COLOR: Record<Tone, string> = {
  success: "text-[#8FD1B0]",
  warning: "text-[#E6C98B]",
  danger: "text-[#F0A39B]",
  neutral: "text-white/60",
};

/**
 * Thẻ "Đang làm việc với kho" ở đầu menu trái: chỉ hiển thị kho đang chọn (chữ cái đầu tên Chủ kho, tên Chủ kho,
 * trạng thái gọn), không bấm được. Đổi kho chỉ làm ở trang "Lời mời và các kho bạn đang làm việc" qua liên kết
 * "Đổi kho →". Chưa giữ kho nào thì thẻ ghi "Chưa giữ kho nào" và liên kết thành "Xem lời mời →".
 * Quyền trên từng kho vẫn do Backend kiểm tra.
 */
export function ExecutorVaultCard() {
  const { query, selected } = useSelectedExecutorVault();
  let card;
  let linkText = "Xem lời mời →";
  if (query.isPending) {
    card = (
      <div
        role="status"
        className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/70"
      >
        Đang tải kho…
      </div>
    );
  } else if (selected) {
    const stage = vaultStage(selected);
    linkText = "Đổi kho →";
    card = (
      <div
        aria-label={`Kho đang làm việc: ${selected.ownerFullName}`}
        role="group"
        className="flex items-center gap-3 rounded-xl border border-[#C9A45C] bg-white/10 p-2.5"
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#E0C486] text-sm font-bold text-[#0A281E]"
        >
          {selected.ownerFullName.trim().charAt(0).toLocaleUpperCase("vi-VN")}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-white">
            {selected.ownerFullName}
          </span>
          <span className={`block truncate text-xs ${STAGE_COLOR[stage.tone]}`}>{stage.label}</span>
        </span>
      </div>
    );
  } else {
    card = (
      <div
        role="group"
        aria-label="Chưa giữ kho nào"
        className="rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/70"
      >
        Chưa giữ kho nào
      </div>
    );
  }
  return (
    <section aria-labelledby="executor-current-vault-heading" className="px-2 pt-2">
      <h2
        id="executor-current-vault-heading"
        className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-white/60"
      >
        Đang làm việc với kho
      </h2>
      {card}
      <Link
        to={ROUTES.EXECUTOR.INVITATIONS}
        className="mt-2 inline-block px-1 text-xs font-semibold text-[#E6C98B] hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
      >
        {linkText}
      </Link>
    </section>
  );
}
