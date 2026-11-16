import { BadgeCheck, Check } from "lucide-react";
import { buttonStyles, Chip, Initial } from "@/shared/ui/heritageKit";
import { cn } from "cn";
import type { SystemExecutor } from "../model/systemExecutor.schema";

export interface SystemExecutorCardProps {
  executor: SystemExecutor;
  selected?: boolean;
  /** Có lý do thì không chọn được người này (ví dụ đang là Người thực thi của kho); câu lý do hiện cạnh nút. */
  disabledReason?: string | null;
  onSelect?: (executor: SystemExecutor) => void;
}

function LegalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-heritage-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}

/** Thẻ một Người thực thi hệ thống: họ tên, liên hệ, vai trò chuyên môn và hồ sơ pháp lý do Backend trả. */
export function SystemExecutorCard({
  executor,
  selected = false,
  disabledReason = null,
  onSelect,
}: SystemExecutorCardProps) {
  const legal = executor.legalVerification;
  const verified = legal.status === "VERIFIED";
  const blocked = disabledReason !== null || !verified || !executor.isAvailable;

  let buttonText = "Chọn người này";
  let buttonStyle = buttonStyles.outline;
  if (selected) {
    buttonText = "Đã chọn";
    buttonStyle = buttonStyles.dark;
  }

  let reason = disabledReason;
  if (reason === null && !verified) {
    reason = "Chưa có hồ sơ pháp lý nên chưa thể chọn.";
  } else if (reason === null && !executor.isAvailable) {
    reason = "Người này hiện chưa nhận thêm kho.";
  }

  let contact = executor.email;
  if (executor.phoneMasked) {
    contact = `${executor.email} · ${executor.phoneMasked}`;
  }

  const hasLegalDetails = Boolean(
    legal.lawyerCardNumber || legal.practiceCertificateNumber || legal.organization,
  );

  return (
    <li
      className={cn(
        "rounded-2xl border bg-white p-5",
        selected ? "border-[#C9A55C] bg-[#FDF9EE]" : "border-heritage-border",
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
        {verified && (
          <Chip tone="success" className="gap-1">
            <BadgeCheck className="size-3.5" aria-hidden="true" />
            Đã xác minh pháp lý
          </Chip>
        )}
        {!verified && <Chip tone="neutral">Chưa có hồ sơ pháp lý</Chip>}
      </div>

      {executor.executorRoleTitle !== "" && (
        <p className="mt-3 text-sm font-medium">{executor.executorRoleTitle}</p>
      )}

      {hasLegalDetails && (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl bg-[#FBF7EE] p-3">
          {legal.lawyerCardNumber && (
            <LegalRow label="Số thẻ luật sư" value={legal.lawyerCardNumber} />
          )}
          {legal.practiceCertificateNumber && (
            <LegalRow label="Chứng chỉ hành nghề" value={legal.practiceCertificateNumber} />
          )}
          {legal.organization && <LegalRow label="Tổ chức hành nghề" value={legal.organization} />}
        </dl>
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
