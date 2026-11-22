import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";
/** Trạng thái chức năng chưa tích hợp; không hiển thị dữ liệu hay thành công giả. */
export function WillWizardPage() {
  return (
    <OwnerWorkspace
      title="Tạo kế hoạch bàn giao"
      description="Thông tin trong không gian cá nhân của bạn."
    >
      <OwnerSection section="plans" />
    </OwnerWorkspace>
  );
}
