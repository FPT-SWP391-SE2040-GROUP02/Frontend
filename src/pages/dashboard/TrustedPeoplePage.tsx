import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

/** Trang Người thực thi của Chủ kho (đường dẫn vẫn là trusted-people); chỉ đọc dữ liệu Backend đã xác nhận. */
export function TrustedPeoplePage() {
  return (
    <OwnerWorkspace
      title="Người thực thi"
      description="Người bạn tin để giữ mã mở gói và gửi mã nhận cho người nhận theo biên bản. Họ không đọc được nội dung kho."
    >
      <OwnerSection section="trusted" />
    </OwnerWorkspace>
  );
}
