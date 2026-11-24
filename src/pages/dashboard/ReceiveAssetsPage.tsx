import { AvailableHandoverList, ReportPanel } from "@/features/handover-request";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";

/** Trang "Nhận tài sản" của Chủ kho: các kho người khác để lại cho tài khoản này, kèm bước tiếp theo. */
export function ReceiveAssetsPage() {
  return (
    <OwnerWorkspace
      title="Nhận tài sản"
      description="Các kho được để lại cho bạn. Mỗi kho có một bước tiếp theo: gửi yêu cầu, bổ sung giấy tờ, ký biên bản hoặc nhập mã để tải."
    >
      <div className="space-y-6">
        <AvailableHandoverList />
        <ReportPanel />
      </div>
    </OwnerWorkspace>
  );
}
