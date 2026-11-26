import { Check } from "lucide-react";
import { buttonStyles, Initial } from "@/shared/ui/heritageKit";
import { cn } from "cn";
import type { SystemExecutor } from "../model/systemExecutor.schema";

export interface SystemExecutorCardProps {
  executor: SystemExecutor;
  selected?: boolean;
  /** Có lý do thì không chọn được người này (ví dụ đang là Người thực thi của kho); câu lý do hiện cạnh nút. */
  disabledReason?: string | null;
  onSelect?: (executor: SystemExecutor) => void;
}

/** Thẻ một Người thực thi hệ thống: họ tên, liên hệ, vai trò chuyên môn. */
export function SystemExecutorCard({
  executor,
  selected = false,
  disabledReason = null,
  onSelect,
}: SystemExecutorCardProps) {
  const blocked = disabledReason !== null || !executor.isAvailable;

  let buttonText = "Chọn người này";
  let buttonStyle = buttonStyles.outline;
  if (selected) {
    buttonText = "Đã chọn";
    buttonStyle = buttonStyles.dark;
  }

  let reason = disabledReason;
  if (reason === null && !executor.isAvailable) {
    reason = "Người này hiện chưa nhận thêm tài sản.";
  }

  let contact = executor.email;
  if (executor.phoneMasked) {
    contact = `${executor.email} · ${executor.phoneMasked}`;
  }

  return (
    <li
      className={cn(
        "rounded-2xl border bg-white p-5",
        selected ? "border-heritage-gold bg-heritage-gold-light" : "border-heritage-border",
        blocked && "opacity-70",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Initial name={executor.fullName} />
          <div className="min-w-0">
            <p className="break-words font-semibold text-heritage-primary">{executor.fullName}</p>
            <p className="break-all text-xs text-heritage-muted">{contact}</p>
          </div>
        </div>
      </div>

      {executor.executorRoleTitle !== "" && (
        <p className="mt-3 text-sm font-medium">{executor.executorRoleTitle}</p>
      )}

      {onSelect && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className={buttonStyle}
            disabled={blocked}
            aria-pressed={selected}
            aria-label={`${buttonText}: ${executor.fullName}`}
            onClick={() => onSelect(executor)}
          >
            {selected && <Check className="size-4" aria-hidden="true" />}
            {buttonText}
          </button>
          {reason !== null && <p className="text-xs text-heritage-muted">{reason}</p>}
        </div>
      )}
    </li>
  );
}
