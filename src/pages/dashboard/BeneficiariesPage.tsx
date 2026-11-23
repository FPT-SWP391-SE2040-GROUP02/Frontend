import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerBeneficiaries } from "@/widgets/OwnerWorkspace/OwnerBeneficiaries";
/** Hồ sơ người nhận cấp kho, không phải role hoặc tài khoản được cấp quyền tự động. */
export function BeneficiariesPage() {
  return (
    <OwnerWorkspace
      title="Người nhận"
      description="Hồ sơ người nhận của kho. Gán tài sản cho từng người ở phần Phân chia trong Kho của tôi."
    >
      <OwnerBeneficiaries />
    </OwnerWorkspace>
  );
}
