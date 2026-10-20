import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";
/** Màn hình chính thức, chỉ đọc dữ liệu Backend đã xác nhận. */
export function WillManagementPage() {
  return (
    <OwnerWorkspace title="Bàn giao" description="Ai làm gì, và bạn luôn có quyền dừng lại.">
      <OwnerSection section="plans" />
    </OwnerWorkspace>
  );
}
