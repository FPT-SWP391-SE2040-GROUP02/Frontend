import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";
/** Màn hình chính thức, chỉ đọc dữ liệu Backend đã xác nhận. */
export function WillManagementPage() {
  return (
    <OwnerWorkspace
      title="Kế hoạch bàn giao"
      description="Theo dõi các gói nội dung và kế hoạch bàn giao trong kho của bạn."
    >
      <OwnerSection section="plans" />
    </OwnerWorkspace>
  );
}
