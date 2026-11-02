import { useVaultPageTitle } from "@/features/vault-management/model/useVaultPageTitle";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

/** Kho của tôi: mục trong kho và gói bàn giao trên cùng một trang; tạo gói bàn giao mở ngay trên trang để tick gắn mục. */
export function AssetsManagementPage() {
  const pageTitle = useVaultPageTitle();
  return (
    <OwnerWorkspace
      title={pageTitle.title}
      eyebrow={pageTitle.eyebrow}
      description="Mọi thứ bạn muốn để lại, được giữ kín. Người nhận được gắn theo gói bàn giao, không gắn từng mục."
    >
      <OwnerSection section="assets" />
    </OwnerWorkspace>
  );
}
