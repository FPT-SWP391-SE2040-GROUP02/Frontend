import { useState, type ReactNode } from "react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import {
  declarationText,
  TERMS_DISCLAIMER,
  termsBullets,
  type SignerRole,
} from "../model/documentTerms";
import type { DocumentKind } from "../model/handoverDocument.schema";
import { SlidePanel, SlideToggle } from "./SlidePanel";

/**
 * Khung ký: điều khoản người ký cần biết (thu gọn mặc định, trượt ra khi cần đọc), ô tick xác nhận đã biết luật
 * (thao tác ký chỉ là ô tick này) và nút gọi tên hành động.
 * Lỗi hiện ngay trên nút; nút chỉ khóa khi đang gửi để người dùng thấy lý do còn thiếu thay vì nút mờ không giải thích.
 */
export function DocumentSignatureBox({
  role,
  kind,
  idPrefix,
  checked,
  onCheckedChange,
  error,
  pending,
  buttonLabel,
  onSubmit,
  extra,
}: {
  role: SignerRole;
  kind: DocumentKind;
  idPrefix: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  error: string | null;
  pending: boolean;
  buttonLabel: string;
  onSubmit: () => void;
  /** Phần thêm của riêng vai (vd bốn mục kiểm tra của Người xét duyệt), đặt trước ô tick. */
  extra?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const bullets = termsBullets(role, kind);
  const bodyId = `${idPrefix}-terms-body`;
  return (
    <div className="space-y-4 rounded-xl border-2 border-heritage-primary bg-white p-4">
      <section
        aria-label="Điều khoản cần biết trước khi ký"
        className="space-y-2 border-l-4 border-heritage-gold bg-heritage-gold-light px-4 py-3 text-sm"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-semibold text-heritage-primary">
            Điều khoản cần biết trước khi ký · {bullets.length} điều
          </h3>
          <SlideToggle controls={bodyId} open={open} onToggle={() => setOpen((value) => !value)}>
            {open ? "Thu gọn" : "Xem điều khoản"}
          </SlideToggle>
        </div>
        <SlidePanel id={bodyId} open={open}>
          <ul className="list-disc space-y-1 pb-1 pl-5">
            {bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
          <p className="pt-2 text-heritage-muted">{TERMS_DISCLAIMER}</p>
        </SlidePanel>
      </section>
      {extra}
      <label className="flex items-start gap-3 text-sm" htmlFor={`${idPrefix}-ack`}>
        <input
          id={`${idPrefix}-ack`}
          type="checkbox"
          className="mt-0.5 size-5 shrink-0"
          checked={checked}
          disabled={pending}
          onChange={(event) => onCheckedChange(event.target.checked)}
        />
        <span>{declarationText(role, kind)}</span>
      </label>
      {error && (
        <p role="alert" className="text-sm font-semibold text-[#A32119]">
          {error}
        </p>
      )}
      <div>
        <button type="button" className={buttonStyles.gold} disabled={pending} onClick={onSubmit}>
          {pending ? "Đang gửi…" : buttonLabel}
        </button>
      </div>
    </div>
  );
}
