import { useVaultPageTitle } from "@/features/vault-management/model/useVaultPageTitle";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

/** Tài sản: tìm, lọc, đổi gói bàn giao trên từng dòng và thêm tài sản; gói bàn giao nằm ở màn riêng. */
export function AssetsManagementPage() {
  const pageTitle = useVaultPageTitle();
  return (
    <OwnerWorkspace
      title="Tài sản"
      eyebrow={pageTitle.title}
      description="Mọi thứ bạn muốn để lại, được giữ kín. Gán mỗi tài sản vào một gói bàn giao để có người nhận."
    >
      <OwnerSection section="assets" />
    </OwnerWorkspace>
  );
}
