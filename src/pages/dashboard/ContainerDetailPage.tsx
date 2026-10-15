import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerContainer } from "@/widgets/OwnerWorkspace/OwnerContainer";
/** Chỉnh sửa container Backend, không dựng bản di chúc hoặc tự kích hoạt kho. */
export function ContainerDetailPage() {
  return (
    <OwnerWorkspace
      title="Chi tiết gói bàn giao"
      description="Sắp xếp nội dung và người nhận của gói; trạng thái sẵn sàng do máy chủ xác nhận."
    >
      <OwnerContainer />
    </OwnerWorkspace>
  );
}
