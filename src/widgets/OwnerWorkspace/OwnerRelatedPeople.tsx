import { ExecutorsSection } from "@/features/plan-setup/ui/ExecutorsSection";
import { OwnerBeneficiaries } from "./OwnerBeneficiaries";

/**
 * Màn Người liên quan: Người nhận và Người thực hiện chung một tab, chia cột 2:1 (Người nhận 2, Người thực hiện 1).
 * Người xét duyệt do hệ thống phân công; ô "Hướng dẫn cho Executor" hiện khi tạo gói và thêm tài sản, không nằm ở đây.
 * Màn hẹp thì xếp dọc, Người nhận ở trên.
 */
export function OwnerRelatedPeople({ vaultId }: { vaultId: string }) {
  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <OwnerBeneficiaries />
      <ExecutorsSection vaultId={vaultId} />
    </div>
  );
}
