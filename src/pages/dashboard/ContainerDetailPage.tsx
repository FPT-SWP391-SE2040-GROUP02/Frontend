import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerContainer } from "@/widgets/OwnerWorkspace/OwnerContainer";
/** Chỉnh sửa container Backend, không dựng bản di chúc hoặc tự kích hoạt kho. */
export function ContainerDetailPage() {
  return (
    <OwnerWorkspace
      title="Kho của tôi"
      description="Mọi thứ bạn muốn để lại, được giữ kín. Người nhận được gắn theo nhóm, không gắn từng mục."
    >
      <OwnerContainer />
    </OwnerWorkspace>
  );
}
