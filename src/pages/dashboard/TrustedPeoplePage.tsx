import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

/** Người tin cậy của Chủ kho: Người thực hiện (Executor) và Người xét duyệt; chỉ đọc dữ liệu Backend đã xác nhận. */
export function TrustedPeoplePage() {
  return (
    <OwnerWorkspace
      title="Người tin cậy"
      description="Bạn chỉ mời người thực hiện. Người xét duyệt do hệ thống phân công, bạn không chọn."
    >
      <OwnerSection section="trusted" />
    </OwnerWorkspace>
  );
}
