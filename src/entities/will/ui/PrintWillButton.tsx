import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { printWill } from "../lib/printWill";

/**
 * Nút in biên bản phân chia (mặc định chữ "In biên bản phân chia"). Bản in được render thêm qua portal vào body (class `print-slip`, chỉ hiện
 * khi in) để PDF chỉ có tờ biên bản phân chia, nền trắng chữ gần đen. Biên bản phân chia không có mã nhận: hệ thống giữ mã, Chủ tài sản không
 * cần in. `disabled` khóa nút (ví dụ chưa đủ hai chữ ký); nơi gọi tự giải thích lý do khóa.
 */
export function PrintWillButton({
  content,
  label = "In biên bản phân chia",
  disabled = false,
  describedBy,
}: {
  content: ReactNode;
  label?: string;
  disabled?: boolean;
  /** id của dòng giải thích lý do khóa, nếu có. */
  describedBy?: string;
}) {
  return (
    <>
      <button
        type="button"
        className={buttonStyles.outline}
        disabled={disabled}
        aria-describedby={describedBy}
        onClick={printWill}
      >
        <Printer className="size-4" aria-hidden="true" />
        {label}
      </button>
      {createPortal(
        <div className="print-slip" aria-hidden="true">
          <section className="w-full max-w-full bg-white p-6 text-[#111] sm:p-8">{content}</section>
        </div>,
        document.body,
      )}
    </>
  );
}
