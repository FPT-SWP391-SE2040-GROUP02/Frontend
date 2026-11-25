import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { describeUnsignedChanges } from "../lib/unsignedChanges";
import type { UnsignedChanges } from "../model/planSetup.schema";

/**
 * Thanh nhắc ở đầu màn Bàn giao khi kế hoạch đang chạy mà cấu hình khác bản biên bản phân chia ký gần nhất. Mọi thay đổi (xóa
 * lẫn thêm) đều cần Chủ kho ký lại để bản ký khớp tờ hiện tại. Trong lúc chờ: phần đã xóa không còn được bàn giao;
 * phần thêm hoặc đổi người nhận chưa được bàn giao cho tới khi ký lại. Ký xong, Người thực thi xem và đồng ý bản mới.
 * Chỉ hiện số đếm (Backend không trả tên).
 */
export function UnsignedChangesBanner({
  changes,
  onOpenPreview,
}: {
  changes: UnsignedChanges | null | undefined;
  onOpenPreview: () => void;
}) {
  const summary = describeUnsignedChanges(changes);
  const items: ReactNode[] = [];
  for (const line of summary.lines) {
    items.push(<li key={line}>{line}</li>);
  }
  // Không có số đếm thì chưa biết loại thay đổi: vẫn nói phần đã xóa không còn được bàn giao.
  let showRemovedNote = summary.hasRemoved;
  if (summary.lines.length === 0) {
    showRemovedNote = true;
  }
  return (
    <section
      aria-label="Có thay đổi chưa ký lại"
      className="mb-6 flex max-w-[1180px] items-start gap-3 rounded-2xl border border-heritage-warning-border bg-heritage-warning-bg p-4 text-heritage-warning sm:p-5"
    >
      <TriangleAlert className="mt-0.5 size-6 shrink-0 text-heritage-warning" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-3">
        <h2 className="text-[17px] font-semibold leading-[1.3]">Có thay đổi chưa ký lại</h2>
        <p className="text-sm leading-6">
          Hãy ký phiên bản mới để bản biên bản phân chia khớp với cấu hình hiện tại.
        </p>
        {items.length > 0 && (
          <ul className="list-disc space-y-0.5 pl-5 text-sm leading-6">{items}</ul>
        )}
        <div className="text-sm leading-6">
          <h3 className="text-[13px] font-semibold uppercase tracking-wide">
            Trong lúc chờ ký lại
          </h3>
          <ul className="mt-1 list-disc space-y-0.5 pl-5">
            {showRemovedNote && <li>Phần đã gỡ gán không còn được bàn giao.</li>}
            {summary.hasAddedOrChanged && <li>Phần gán thêm chưa được bàn giao.</li>}
          </ul>
        </div>
        <p className="text-sm leading-6">
          Ký lại xong, Người thực thi được xem bản mới để đồng ý hoặc không.
        </p>
        <button
          type="button"
          className={`${buttonStyles.dark} w-full sm:w-auto`}
          onClick={onOpenPreview}
        >
          Xem trước và ký phiên bản mới
        </button>
      </div>
    </section>
  );
}
