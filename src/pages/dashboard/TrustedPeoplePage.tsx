import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

/** Trang Người thực thi của Chủ kho (đường dẫn vẫn là trusted-people); chỉ đọc dữ liệu Backend đã xác nhận. */
export function TrustedPeoplePage() {
  return (
    <OwnerWorkspace
      title="Người thực thi"
      description="Người bạn tin để báo tin khi có biến cố và trao mã mở gói cho người nhận. Họ không đọc được nội dung kho."
    >
      <OwnerSection section="trusted" />
    </OwnerWorkspace>
  );
}
