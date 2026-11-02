import { Link } from "react-router-dom";
import { useCheckIn } from "@/features/dms/model/useCheckIn";
import { CheckInNowButton } from "@/features/dms/ui/CheckInNowButton";
import { ROUTES } from "@/shared/config/routes.config";
import { formatDate } from "@/shared/lib/dateFormat";
import { Button } from "@/shared/ui/button";
import { buttonStyles, Notice, Panel } from "@/shared/ui/heritageKit";
import type { OwnerStepProps } from "./stepTypes";

/** Màn hoàn tất: điểm danh lần đầu. Không dùng đồng hồ thông minh; chỉ ghi nhận sau phản hồi máy chủ. */
export function DoneStep({ vault, setup }: OwnerStepProps) {
  const query = useCheckIn(vault.id);
  if (setup !== null && setup.planStatus === "DRAFT") {
    return (
      <Notice tone="warning" title="Kế hoạch chưa được kích hoạt">
        Hoàn tất bước &quot;Kích hoạt kế hoạch&quot; trước, rồi quay lại đây để điểm danh.
      </Notice>
    );
  }
  if (query.isPending) {
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải kỳ điểm danh…
      </p>
    );
  }
  if (query.isError) {
    return (
      <Notice
        tone="danger"
        role="alert"
        title="Chưa tải được kỳ điểm danh"
        action={
          <Button
            variant="outline"
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
          >
            Thử lại
          </Button>
        }
      >
        Kiểm tra mạng rồi bấm Thử lại.
      </Notice>
    );
  }
  const status = query.data;
  let nextDue = "Kỳ đầu tiên bắt đầu khi bạn kích hoạt kế hoạch.";
  if (status.nextCheckInDueAt !== null) {
    nextDue = `Kỳ điểm danh tiếp theo: ${formatDate(status.nextCheckInDueAt)}.`;
  }
  return (
    <div className="space-y-6">
      <Panel title="Điểm danh lần đầu">
        <p className="mb-4 text-sm leading-6 text-heritage-muted">
          Bấm xác nhận bạn vẫn ổn. Mặc định hệ thống nhắc bạn {status.settings.cycleDays} ngày một
          lần. {nextDue}
        </p>
        <CheckInNowButton
          vaultId={vault.id}
          status={status}
          label="Tôi vẫn ổn — điểm danh"
          className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
        />
      </Panel>
      <Link to={ROUTES.DASHBOARD.ROOT} className={buttonStyles.dark}>
        Về Tổng quan
      </Link>
    </div>
  );
}
