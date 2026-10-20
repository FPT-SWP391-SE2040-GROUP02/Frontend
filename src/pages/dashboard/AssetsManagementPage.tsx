import { Plus } from "lucide-react";
import { ADD_ASSET_NAME_ID } from "@/features/assets/model/addAssetForm";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerSection } from "@/widgets/OwnerWorkspace/OwnerSection";

/** Màn hình chính thức, chỉ đọc dữ liệu Backend đã xác nhận. */
export function AssetsManagementPage() {
  return (
    <OwnerWorkspace
      title="Kho của tôi"
      description="Mọi thứ bạn muốn để lại đều được mã hóa và giữ kín."
      headerAction={
        <button
          type="button"
          className={buttonStyles.gold}
          onClick={() => document.getElementById(ADD_ASSET_NAME_ID)?.focus()}
        >
          <Plus className="size-4" aria-hidden="true" />
          Thêm mục
        </button>
      }
    >
      <OwnerSection section="assets" />
    </OwnerWorkspace>
  );
}
