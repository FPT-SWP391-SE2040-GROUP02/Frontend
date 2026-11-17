import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { describeUnsignedChanges } from "../lib/unsignedChanges";
import type { UnsignedChanges } from "../model/planSetup.schema";

function LineList({ title, lines }: { title: string; lines: string[] }) {
  const items: ReactNode[] = [];
  for (const line of lines) {
    items.push(<li key={line}>{line}</li>);
  }
  return (
    <div>
      <h3 className="text-[13px] font-semibold uppercase tracking-wide">{title}</h3>
      <ul className="mt-1 list-disc space-y-0.5 pl-5">{items}</ul>
    </div>
  );
}

/**
 * Thanh nhắc ở đầu màn Bàn giao khi kế hoạch đang chạy mà cấu hình khác bản di chúc ký gần nhất. Bàn giao chỉ theo
 * bản ký gần nhất: xóa có hiệu lực ngay; thêm gói, thêm tài sản, thêm hoặc đổi người nhận bị bỏ qua cho tới khi ký lại.
 * Người thực thi không phải ký lại. Chỉ hiện số đếm (Backend không trả tên).
 */
export function UnsignedChangesBanner({
  changes,
  onOpenPreview,
}: {
  changes: UnsignedChanges | null | undefined;
  onOpenPreview: () => void;
}) {
  const lines = describeUnsignedChanges(changes);
  const hasPending = lines.pending.length > 0;
  let consequence =
    "Bàn giao chỉ theo bản di chúc ký gần nhất. Ký lại để bản ký khớp với cấu hình hiện tại.";
  if (hasPending) {
    consequence =
      "Bàn giao chỉ theo bản di chúc ký gần nhất. Phần đã xóa có hiệu lực ngay, phần còn lại vẫn được bàn giao. Phần thêm hoặc đổi người nhận sẽ KHÔNG được bàn giao cho tới khi bạn ký lại.";
  }
  const groups: ReactNode[] = [];
  if (lines.pending.length > 0) {
    groups.push(
      <LineList key="pending" title="Chưa có hiệu lực (chờ bạn ký lại)" lines={lines.pending} />,
    );
  }
  if (lines.effective.length > 0) {
    groups.push(<LineList key="effective" title="Đã có hiệu lực ngay" lines={lines.effective} />);
  }
  return (
    <section
      aria-label="Có thay đổi chưa ký lại"
      className="mb-6 flex max-w-[1180px] items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 sm:p-5"
    >
      <TriangleAlert className="mt-0.5 size-6 shrink-0 text-amber-700" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-3">
        <h2 className="text-[17px] font-semibold leading-[1.3]">Có thay đổi chưa ký lại</h2>
        <p className="text-sm leading-6">{consequence}</p>
        {groups.length > 0 && <div className="space-y-3 text-sm leading-6">{groups}</div>}
        <p className="text-sm leading-6">Người thực thi không phải ký lại.</p>
        <button
          type="button"
          className={`${buttonStyles.gold} w-full sm:w-auto`}
          onClick={onOpenPreview}
        >
          Xem trước và ký phiên bản mới
        </button>
      </div>
    </section>
  );
}
