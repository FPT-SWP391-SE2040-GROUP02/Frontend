import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";
import { HandoverPortal } from "@/features/handover/ui/HandoverPortal";
/** Không giả lập grant, nội dung bàn giao hoặc phiên người nhận. */
export function BeneficiaryPortalPage() {
  return (
    <RecipientLayout active="overview">
      <header>
        <h1 className="text-2xl font-semibold">Nội dung được bàn giao</h1>
        <p className="mt-2 text-sm text-heritage-muted">
          Theo dõi các nội dung bạn được phép tiếp nhận.
        </p>
      </header>
      <HandoverPortal />
    </RecipientLayout>
  );
}
