import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

/** Màn hình chính thức, chỉ đọc dữ liệu Backend đã xác nhận. */
export function AssetsManagementPage() {
  return (
    <OwnerWorkspace
      title="Kho của tôi"
      description="Mọi thứ bạn muốn để lại đều được mã hóa và giữ kín."
    >
      <OwnerSection section="assets" />
    </OwnerWorkspace>
  );
}
