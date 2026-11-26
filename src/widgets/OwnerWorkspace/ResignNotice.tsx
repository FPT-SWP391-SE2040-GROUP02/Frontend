import { Link } from "react-router-dom";
import { TriangleAlert } from "lucide-react";
import { describeUnsignedChanges } from "@/features/plan-setup/lib/unsignedChanges";
import { needsResign } from "@/features/plan-setup/lib/willView";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";
import { ROUTES } from "@/shared/config/routes.config";

/**
 * Nhắc ký lại ở tab Phân chia: kế hoạch đã ký mà cấu hình hiện tại khác bản ký gần nhất (cờ do Backend tính,
 * dùng chung cache `plan-setup` với màn Bàn giao). Chỉ nhắc và dẫn sang màn Bàn giao, nơi Chủ tài sản xem trước và ký.
 * Chưa có dữ liệu, lỗi tải hoặc kế hoạch chưa ký thì không hiện gì, để không chặn trang chính.
 */
export function ResignNotice({ vaultId }: { vaultId: string }) {
  const planSetup = usePlanSetup(vaultId);
  if (!planSetup.data || !needsResign(planSetup.data)) {
    return null;
  }

  const summary = describeUnsignedChanges(planSetup.data.unsignedChanges);
  const consequences: string[] = [];
  // Không có số đếm thì chưa biết loại thay đổi: vẫn nói phần đã gỡ gán không còn được bàn giao.
  if (summary.hasRemoved || summary.lines.length === 0) {
    consequences.push("Phần đã gỡ gán không còn được bàn giao.");
  }
  if (summary.hasAddedOrChanged) {
    consequences.push("Phần gán thêm chưa được bàn giao cho tới khi bạn ký lại.");
  }

  return (
    <section
      role="status"
      aria-label="Có thay đổi chưa ký lại"
      className="flex max-w-[1180px] items-start gap-3 rounded-xl border border-heritage-warning-border bg-heritage-warning-bg px-4 py-3 text-sm leading-6 text-heritage-warning"
    >
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-heritage-warning" aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="font-semibold">Có thay đổi chưa ký lại</p>
        {summary.lines.length > 0 && <p>{summary.lines.join(" · ")}</p>}
        {consequences.length > 0 && <p>{consequences.join(" ")}</p>}
        <Link
          to={ROUTES.WILLS.ROOT}
          className="inline-block font-semibold underline underline-offset-4"
        >
          Đi tới Bàn giao để ký lại
        </Link>
      </div>
    </section>
  );
}
