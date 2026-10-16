import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";
/** Màn hình chính thức, chỉ đọc dữ liệu Backend đã xác nhận. */
export function DmsStatusPage() {
  return (
    <OwnerWorkspace
      title="Điểm danh định kỳ"
      description="Theo dõi trạng thái hoạt động, chu kỳ và hạn điểm danh của kho."
    >
      <OwnerSection section="check-in" />
    </OwnerWorkspace>
  );
}
