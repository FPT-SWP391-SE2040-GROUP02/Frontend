import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerBeneficiaries } from "@/widgets/OwnerWorkspace/OwnerBeneficiaries";
/** Hồ sơ người nhận cấp kho, không phải role hoặc tài khoản được cấp quyền tự động. */
export function BeneficiariesPage() {
  return (
    <OwnerWorkspace
      title="Người nhận"
      description="Hồ sơ người nhận của tài sản. Gán tài sản cho từng người ở tab Phân chia."
    >
      <OwnerBeneficiaries />
    </OwnerWorkspace>
  );
}
