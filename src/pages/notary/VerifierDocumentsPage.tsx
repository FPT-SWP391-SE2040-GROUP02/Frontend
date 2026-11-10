import { VerifierDocuments } from "@/features/recipient-review/ui/VerifierDocuments";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Mục Biên Bản của Người xét duyệt: biên bản chờ kiểm tra và lịch sử mọi biên bản của các kho mình đã duyệt. */
export function VerifierDocumentsPage() {
  return (
    <VerifierShell
      title="Biên Bản"
      description="Biên bản đồng ý nhận và văn bản từ chối của các kho bạn đã duyệt hồ sơ chứng tử."
    >
      <VerifierDocuments />
    </VerifierShell>
  );
}
