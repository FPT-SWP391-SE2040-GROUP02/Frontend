import { useVaultPageTitle } from "@/features/vault-management/model/useVaultPageTitle";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerContainer } from "@/widgets/OwnerWorkspace/OwnerContainer";
/** Chỉnh sửa container Backend, không dựng bản di chúc hoặc tự kích hoạt kho. */
export function ContainerDetailPage() {
  const pageTitle = useVaultPageTitle();
  return (
    <OwnerWorkspace
      title={pageTitle.title}
      eyebrow={pageTitle.eyebrow}
      description="Mọi thứ bạn muốn để lại, được giữ kín. Người nhận được gắn theo gói bàn giao, không gắn từng mục."
    >
      <OwnerContainer />
    </OwnerWorkspace>
  );
}
