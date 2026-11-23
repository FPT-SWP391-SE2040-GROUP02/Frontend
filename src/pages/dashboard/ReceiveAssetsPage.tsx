import { AvailableHandoverList } from "@/features/handover-request";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";

/** Trang "Nhận tài sản" của Chủ kho: các kho người khác để lại cho tài khoản này, kèm bước tiếp theo. */
export function ReceiveAssetsPage() {
  return (
    <OwnerWorkspace
      title="Nhận tài sản"
      description="Các kho mà Chủ kho khác đã khai bạn là người nhận. Mỗi kho có một bước tiếp theo: gửi yêu cầu, bổ sung giấy tờ, ký biên bản hoặc nhập mã để tải."
    >
      <AvailableHandoverList />
    </OwnerWorkspace>
  );
}
