import { AlertTriangle } from "lucide-react";
import { formatTimeLeft } from "../model/checkInGrace";
import { useCheckIn } from "../model/useCheckIn";
import { CheckInNowButton } from "./CheckInNowButton";

function formatDeadline(iso: string): string {
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(iso));
}

/**
 * Dải cảnh báo đầu mọi trang Chủ kho khi quá hạn điểm danh (DMS-04, DMS-05).
 * Đang nhận thư nhắc trễ: đếm ngược tới lúc Người thực thi được báo để kiểm tra (sau thư nhắc trễ cuối).
 * Đã gửi đủ thư nhắc trễ: báo Người thực thi đang được yêu cầu kiểm tra. Cả hai có nút điểm danh ngay.
 */
export function CheckInGraceBanner({ vaultId }: { vaultId: string }) {
  const query = useCheckIn(vaultId);
  const status = query.data;
  if (!status) return null;
  if (status.status !== "CHECKIN_OVERDUE" && status.status !== "AWAITING_CHECK") return null;

  let title = "Bạn đã quá hạn điểm danh";
  let message =
    "Hãy điểm danh để cho biết bạn vẫn ổn. Nếu bạn vẫn chưa điểm danh sau các thư nhắc trễ, Người thực thi sẽ được báo để liên hệ kiểm tra.";
  if (status.status === "CHECKIN_OVERDUE" && status.graceEndsAt) {
    const left = formatTimeLeft(status.serverTime, status.graceEndsAt);
    message = `Còn ${left} (đến ${formatDeadline(status.graceEndsAt)}) trước khi Người thực thi được báo để liên hệ kiểm tra. Điểm danh ngay để mọi thứ trở lại bình thường.`;
  }
  if (status.status === "AWAITING_CHECK") {
    title = "Đã gửi đủ thư nhắc trễ điểm danh";
    message =
      "Người thực thi đang được báo để liên hệ kiểm tra tình trạng của bạn. Điểm danh ngay để báo bạn vẫn ổn.";
  }

  return (
    <section
      role="alert"
      aria-labelledby="checkin-grace-title"
      className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#E8B4AE] bg-[#FBEDEB] px-5 py-4"
    >
      <div className="flex min-w-0 items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-[#A33A2E]" aria-hidden="true" />
        <div className="min-w-0 space-y-1">
          <h2 id="checkin-grace-title" className="text-sm font-semibold text-[#7A2318]">
            {title}
          </h2>
          <p className="max-w-2xl text-sm leading-6 text-[#7A2318]">{message}</p>
        </div>
      </div>
      <CheckInNowButton vaultId={vaultId} status={status} label="Điểm danh ngay" />
    </section>
  );
}
