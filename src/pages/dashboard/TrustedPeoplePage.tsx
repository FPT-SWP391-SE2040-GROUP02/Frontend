import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

/** Trang Người thực thi của Chủ tài sản (đường dẫn vẫn là trusted-people); chỉ đọc dữ liệu Backend đã xác nhận. */
export function TrustedPeoplePage() {
  return (
    <OwnerWorkspace
      title="Người thực thi"
      description="Người bạn tin để giữ mã nhận và gửi mã nhận cho người nhận theo biên bản. Họ không đọc được nội dung tài sản."
    >
      <OwnerSection section="trusted" />
    </OwnerWorkspace>
  );
}
