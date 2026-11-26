import { Link } from "react-router-dom";
import { useSelectedExecutorVault } from "@/features/death-case/model/useExecutorVaults";
import { vaultStage } from "@/features/death-case/model/executorTodo";
import { ROUTES } from "@/shared/config/routes.config";
import type { Tone } from "@/shared/ui/heritageKit";
import { RailLabel } from "@/shared/ui/sideRail/RailLabel";

/** Màu chữ trạng thái trên nền menu tối. */
const STAGE_COLOR: Record<Tone, string> = {
  success: "text-heritage-success-border",
  warning: "text-heritage-gold-soft",
  danger: "text-heritage-danger-border",
  neutral: "text-white/60",
};

/**
 * Thẻ "Đang làm việc với kho" ở đầu menu trái: chỉ hiển thị kho đang chọn (chữ cái đầu tên Chủ tài sản, tên Chủ tài sản,
 * trạng thái gọn), không bấm được. Đổi kho chỉ làm ở trang "Lời mời và các kho bạn đang làm việc" qua liên kết
 * "Đổi kho →". Chưa giữ kho nào thì không hiện khối này; lời mời đã có lối vào riêng ở menu.
 * Quyền trên từng kho vẫn do Backend kiểm tra.
 */
export function ExecutorVaultCard() {
  const { query, selected } = useSelectedExecutorVault();
  if (!query.isPending && !selected) return null;
  let card;
  let switchLink = null;
  if (!selected) {
    card = (
      <div
        role="status"
        className="u040-card rounded-xl border border-white/15 bg-white/5 p-3 text-sm text-white/70"
      >
        <RailLabel>Đang tải kho…</RailLabel>
      </div>
    );
  } else {
    const stage = vaultStage(selected);
    switchLink = (
      <Link
        to={ROUTES.EXECUTOR.INVITATIONS}
        className="u040-card-switch mt-2 inline-block px-1 text-sm font-semibold text-heritage-gold-soft hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
      >
        Đổi kho →
      </Link>
    );
    card = (
      <div
        aria-label={`Kho đang làm việc: ${selected.ownerFullName}`}
        role="group"
        title={selected.ownerFullName}
        className="u040-card flex items-center gap-3 rounded-xl border border-heritage-gold bg-white/10 p-2.5"
      >
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-heritage-gold-soft text-sm font-bold text-heritage-primary"
        >
          {selected.ownerFullName.trim().charAt(0).toLocaleUpperCase("vi-VN")}
        </span>
        <span className="u040-label executor-wrap min-w-0 flex-1">
          <span className="block break-words text-sm font-semibold leading-snug text-white">
            {selected.ownerFullName}
          </span>
          <span className={`block break-words text-sm leading-snug ${STAGE_COLOR[stage.tone]}`}>
            {stage.label}
          </span>
        </span>
      </div>
    );
  }
  return (
    <section
      aria-labelledby="executor-current-vault-heading"
      className="u040-card-section px-2 pt-2"
    >
      <h2
        id="executor-current-vault-heading"
        className="u040-group executor-wrap mb-2 px-1 text-[0.875rem] font-semibold uppercase tracking-widest text-white/60"
      >
        Đang làm việc với kho
      </h2>
      {card}
      {switchLink}
    </section>
  );
}
