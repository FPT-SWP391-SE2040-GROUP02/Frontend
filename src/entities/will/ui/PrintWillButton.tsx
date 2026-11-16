import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Printer } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { printWill } from "../lib/printWill";

/**
 * Nút "In di chúc". Bản in được render thêm qua portal vào body (class `print-slip`, chỉ hiện khi in) để PDF chỉ có
 * tờ di chúc, nền trắng chữ gần đen. Di chúc không có mã mở gói: hệ thống giữ mã, Chủ kho không cần in.
 */
export function PrintWillButton({ content }: { content: ReactNode }) {
  return (
    <>
      <button type="button" className={buttonStyles.outline} onClick={printWill}>
        <Printer className="size-4" aria-hidden="true" />
        In di chúc
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
