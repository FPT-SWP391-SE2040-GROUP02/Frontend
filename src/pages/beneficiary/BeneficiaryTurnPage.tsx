import { useParams } from "react-router-dom";
import { TurnDetail } from "@/features/handover/ui/TurnDetail";
import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";

/** Chi tiết một lượt bàn giao của người nhận: các bước nộp căn cước, ký biên bản, nhập mã, tải tài sản. */
export function BeneficiaryTurnPage() {
  const { turnId } = useParams();
  return (
    <RecipientLayout active="turn" activeTurnId={turnId}>
      {turnId ? <TurnDetail key={turnId} turnId={turnId} /> : null}
    </RecipientLayout>
  );
}
