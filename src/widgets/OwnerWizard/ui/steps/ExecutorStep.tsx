import { ExecutorsSection } from "@/features/plan-setup/ui/ExecutorsSection";
import { Notice } from "@/shared/ui/heritageKit";
import type { OwnerStepProps } from "./stepTypes";

/** Bước 6: mời Người thực hiện. Thiếu người dự phòng chỉ là cảnh báo, không chặn kích hoạt. */
export function ExecutorStep({ vault }: OwnerStepProps) {
  return (
    <div className="space-y-6">
      <Notice tone="neutral" title="Người thực hiện không xem được tài sản của bạn.">
        Họ chỉ báo tin khi bạn không còn. Thiếu người thực hiện dự phòng chỉ là một cảnh báo, không
        chặn việc kích hoạt kế hoạch.
      </Notice>
      <ExecutorsSection vaultId={vault.id} />
    </div>
  );
}
