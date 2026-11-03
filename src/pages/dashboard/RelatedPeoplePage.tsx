import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

/**
 * Người liên quan của Chủ kho: hồ sơ người nhận cấp kho (không phải role hay tài khoản được cấp quyền tự động)
 * và người tin cậy; chỉ đọc dữ liệu Backend đã xác nhận.
 */
export function RelatedPeoplePage() {
  return (
    <OwnerWorkspace
      title="Người liên quan"
      description="Người nhận gắn theo gói bàn giao, số CCCD chỉ hiện 4 số cuối. Bạn chỉ mời người thực hiện; người xét duyệt do hệ thống phân công."
    >
      <OwnerSection section="people" />
    </OwnerWorkspace>
  );
}
