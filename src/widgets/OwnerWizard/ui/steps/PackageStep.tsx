import { useState } from "react";
import { OwnerGroups } from "@/widgets/OwnerWorkspace/OwnerGroups";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import type { OwnerStepProps } from "./stepTypes";

/** Bước 5: gói bàn giao. Gói sẵn sàng khi có cả tài sản và người nhận. */
export function PackageStep({ vault, setup }: OwnerStepProps) {
  const [createOpen, setCreateOpen] = useState(false);
  let notReadyCount = 0;
  if (setup !== null) {
    notReadyCount = setup.containers.filter((container) => container.status !== "READY").length;
  }
  return (
    <div className="space-y-6">
      <Notice tone="neutral" title="Gói bàn giao sẵn sàng khi có cả tài sản và người nhận.">
        Mở gói, thêm tài sản và chọn người nhận cho gói đó. Gói chưa sẵn sàng sẽ nói rõ còn thiếu
        gì.
        {notReadyCount > 0 && ` Hiện có ${notReadyCount} gói chưa sẵn sàng.`}
      </Notice>
      <div>
        <button type="button" className={buttonStyles.gold} onClick={() => setCreateOpen(true)}>
          Tạo gói bàn giao
        </button>
      </div>
      <OwnerGroups vaultId={vault.id} createOpen={createOpen} onCreateOpenChange={setCreateOpen} />
    </div>
  );
}
