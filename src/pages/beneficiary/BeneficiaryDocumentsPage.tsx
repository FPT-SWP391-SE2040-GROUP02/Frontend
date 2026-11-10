import { RecipientDocuments } from "@/features/handover/ui/RecipientDocuments";
import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";

/** Mục Biên Bản của người nhận: lịch sử biên bản đồng ý nhận và văn bản từ chối. */
export function BeneficiaryDocumentsPage() {
  return (
    <RecipientLayout active="documents">
      <header>
        <h1 className="text-3xl font-semibold text-heritage-primary">Biên Bản</h1>
        <p className="mt-2 text-sm text-heritage-muted">
          Mọi biên bản của bạn được lưu không giới hạn thời gian để xem lại bất cứ lúc nào.
        </p>
      </header>
      <RecipientDocuments />
    </RecipientLayout>
  );
}
