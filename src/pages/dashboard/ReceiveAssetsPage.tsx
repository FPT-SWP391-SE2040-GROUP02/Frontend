import { AvailableHandoverList, ReceiveGuidePanel, ReportPanel } from "@/features/handover-request";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";

/** Trang "Nhận tài sản" của Chủ kho: các kho người khác để lại cho tài khoản này, kèm bước tiếp theo. */
export function ReceiveAssetsPage() {
  return (
    <OwnerWorkspace
      title="Nhận tài sản"
      description="Các kho được để lại cho bạn. Khi Chủ kho đã qua đời, bạn chủ động gửi yêu cầu; mỗi kho ghi bước bạn đang ở và việc cần làm."
    >
      <div className="space-y-6">
        <ReceiveGuidePanel />
        <AvailableHandoverList />
        <ReportPanel />
      </div>
    </OwnerWorkspace>
  );
}
