import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";
/** Màn hình chính thức, chỉ đọc dữ liệu Backend đã xác nhận. */
export function AssetsManagementPage() {
  return (
    <OwnerWorkspace
      title="Kho của tôi"
      description="Tài liệu và nội dung số được lưu trữ trong kho cá nhân của bạn."
    >
      <OwnerSection section="assets" />
    </OwnerWorkspace>
  );
}
