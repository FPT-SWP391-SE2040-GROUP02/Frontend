import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

/** Gói bàn giao: mỗi gói gom các tài sản có cùng người nhận; tạo, đổi tên, tick tài sản và người nhận ngay tại đây. */
export function PackagesPage() {
  return (
    <OwnerWorkspace
      title="Gói bàn giao"
      description="Chọn tài sản nào trao cho ai. Mỗi gói cần ít nhất một tài sản và một người nhận."
    >
      <OwnerSection section="packages" />
    </OwnerWorkspace>
  );
}
