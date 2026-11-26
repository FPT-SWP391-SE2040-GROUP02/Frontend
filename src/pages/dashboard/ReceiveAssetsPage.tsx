import { AvailableHandoverList, ReceiveGuidePanel, ReportPanel } from "@/features/handover-request";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";

/**
 * Trang "Nhận tài sản" của Chủ tài sản: các kho người khác để lại cho tài khoản này, kèm bước tiếp theo.
 * Màn rộng chia hai cột: trái là việc chính (danh sách kho và hồ sơ báo tin đang theo dõi), phải là lối báo tin và
 * hướng dẫn. Màn hẹp xếp một cột, danh sách kho đứng trước.
 */
export function ReceiveAssetsPage() {
  return (
    <OwnerWorkspace
      title="Nhận tài sản"
      description="Các tài sản được để lại cho bạn và việc bạn cần làm tiếp theo."
    >
      <ReportPanel
        layout={({ entry, activity }) => (
          <div className="grid max-w-[1180px] items-start gap-7 xl:grid-cols-[minmax(0,1fr)_20rem]">
            <div className="min-w-0 space-y-6">
              <AvailableHandoverList />
              {activity}
            </div>
            <aside className="min-w-0 space-y-5">
              {entry}
              <ReceiveGuidePanel />
            </aside>
          </div>
        )}
      />
    </OwnerWorkspace>
  );
}
