import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Copy, Printer } from "lucide-react";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { printHandoverSlip } from "../lib/printHandoverSlip";
import { HandoverSlip, type HandoverSlipProps } from "./HandoverSlip";

/**
 * Phần "hiện mã một lần": hướng dẫn, nút tải phiếu (in ra PDF) và chép mã, tờ phiếu, ô tick và nút Hoàn tất.
 * Dùng chung cho màn nhận mã sau khi kích hoạt, đổi mã mới và thẻ ở trang Người thực thi.
 *
 * Mã gốc chỉ nằm trong props và DOM khi component này còn mount; không ghi vào cache, storage hay URL.
 * Bản in được render thêm qua portal vào body (class `print-slip`, chỉ hiện khi in) để PDF chỉ có tờ phiếu.
 */
export function ExecutorKeyReveal({
  slip,
  onDone,
}: {
  slip: HandoverSlipProps;
  /** Gọi khi người dùng bấm Hoàn tất; nơi gọi phải bỏ mã khỏi state của mình. */
  onDone: () => void;
}) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  // Chưa tick mà rời trang là mất mã vĩnh viễn nên nhờ trình duyệt hỏi lại.
  useEffect(() => {
    if (saved) {
      return;
    }
    function warnBeforeLeave(event: BeforeUnloadEvent): void {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warnBeforeLeave);
    return () => {
      window.removeEventListener("beforeunload", warnBeforeLeave);
    };
  }, [saved]);

  function copyShard(): void {
    setCopyFailed(false);
    navigator.clipboard.writeText(slip.shard).then(
      () => setCopied(true),
      () => setCopyFailed(true),
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm leading-6">
        Phiếu chỉ hiện lần này. Bấm Tải phiếu, ở hộp thoại in chọn &quot;Lưu thành PDF&quot;, rồi
        gửi riêng cho Người thực thi.
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          className={buttonStyles.dark}
          onClick={() => printHandoverSlip(slip.version)}
        >
          <Printer className="size-4" aria-hidden="true" />
          Tải phiếu (PDF)
        </button>
        <button type="button" className={buttonStyles.outline} onClick={copyShard}>
          <Copy className="size-4" aria-hidden="true" />
          {copied ? "Đã chép" : "Chép mã"}
        </button>
      </div>
      {copyFailed && (
        <p role="alert" className="text-sm text-destructive">
          Không chép được mã. Hãy tải phiếu hoặc chép tay.
        </p>
      )}
      <Notice tone="warning" title="Không gửi qua email hay tin nhắn công khai">
        Chỉ cần mã này là người nhận mở được gói tài sản, nên chỉ gửi riêng cho đúng Người thực thi.
      </Notice>

      <div className="overflow-hidden rounded-xl border border-heritage-border bg-white">
        <HandoverSlip {...slip} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-heritage-canvas p-4">
        <label className="flex min-h-11 items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            className="mt-1 size-5"
            checked={saved}
            onChange={(event) => setSaved(event.target.checked)}
          />
          Tôi đã tải phiếu hoặc chép mã ra nơi an toàn
        </label>
        <button type="button" className={buttonStyles.gold} disabled={!saved} onClick={onDone}>
          Hoàn tất
        </button>
      </div>

      {createPortal(
        <div className="print-slip" aria-hidden="true">
          <HandoverSlip {...slip} />
        </div>,
        document.body,
      )}
    </div>
  );
}
