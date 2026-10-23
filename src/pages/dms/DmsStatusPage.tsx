import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";
/** Màn hình chính thức, chỉ đọc dữ liệu Backend đã xác nhận. */
export function DmsStatusPage() {
  return (
    <OwnerWorkspace
      title="Điểm danh định kỳ"
      description="Mỗi lần điểm danh gia hạn thêm một chu kỳ. Kho vẫn an toàn khi bạn còn điểm danh."
    >
      <OwnerSection section="check-in" />
    </OwnerWorkspace>
  );
}
