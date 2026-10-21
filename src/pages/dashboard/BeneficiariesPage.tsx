import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerBeneficiaries } from "@/widgets/OwnerWorkspace/OwnerBeneficiaries";
/** Hồ sơ người nhận cấp kho, không phải role hoặc tài khoản được cấp quyền tự động. */
export function BeneficiariesPage() {
  return (
    <OwnerWorkspace
      title="Người nhận"
      description="Người nhận được gắn theo gói bàn giao, không gắn từng mục. Số CCCD chỉ hiện 4 số cuối."
    >
      <OwnerBeneficiaries />
    </OwnerWorkspace>
  );
}
