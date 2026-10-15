import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerBeneficiaries } from "@/widgets/OwnerWorkspace/OwnerBeneficiaries";
/** Hồ sơ người nhận cấp kho, không phải role hoặc tài khoản được cấp quyền tự động. */
export function BeneficiariesPage() {
  return (
    <OwnerWorkspace
      title="Người nhận"
      description="Quản lý hồ sơ và thông tin liên hệ trước khi chỉ định vào các gói bàn giao."
    >
      <OwnerBeneficiaries />
    </OwnerWorkspace>
  );
}
