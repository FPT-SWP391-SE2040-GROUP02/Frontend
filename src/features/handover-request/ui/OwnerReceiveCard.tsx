import { Link } from "react-router-dom";
import { Gift } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";
import type { AvailableHandover } from "../model/handoverRequest.schema";
import { countNeedsAction, useAvailableHandovers } from "../model/useHandoverRequest";

/** Dòng cần làm đầu tiên (danh sách đã xếp dòng cần làm lên trước); null khi không có. */
function firstNeedingAction(rows: AvailableHandover[]): AvailableHandover | null {
  for (const row of rows) {
    if (row.needsAction) {
      return row;
    }
  }
  return null;
}

/**
 * Thẻ trên Tổng quan Chủ tài sản khi có kho được để lại cho tài khoản này và đang chờ người nhận làm bước tiếp theo.
 * Chỉ dẫn tới trang Nhận tài sản, không làm thay gì. Không có việc cần làm (hoặc đang tải, lỗi) thì không hiện.
 */
export function OwnerReceiveCard() {
  const query = useAvailableHandovers();
  if (!query.isSuccess) {
    return null;
  }
  const first = firstNeedingAction(query.data);
  if (first === null) {
    return null;
  }
  const others = countNeedsAction(query.data) - 1;
  let moreText = "";
  if (others > 0) {
    moreText = ` Còn ${others} kho nữa.`;
  }
  return (
    <section
      aria-label="Tài sản được để lại cho bạn"
      className="flex flex-wrap items-center gap-4 rounded-2xl border border-heritage-gold-soft bg-heritage-warning-bg px-5 py-4"
    >
      <Gift className="size-5 shrink-0 text-heritage-warning" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-heritage-primary">
          {first.ownerName} để lại tài sản cho bạn — cần bạn làm tiếp
        </p>
        <p className="text-sm text-heritage-muted">
          Mở trang Nhận tài sản để xem bước tiếp theo.{moreText}
        </p>
      </div>
      <Link to={ROUTES.DASHBOARD.RECEIVE_ASSETS} className={buttonStyles.dark}>
        Mở trang Nhận tài sản
      </Link>
    </section>
  );
}
