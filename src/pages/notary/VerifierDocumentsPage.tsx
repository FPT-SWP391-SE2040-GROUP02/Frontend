import { VerifierDocuments } from "@/features/recipient-review/ui/VerifierDocuments";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Mục Biên bản đã ký của Người xét duyệt: các biên bản đã hoàn tất, gom theo kho mình đã duyệt hồ sơ báo tin. */
export function VerifierDocumentsPage() {
  return (
    <VerifierShell
      title="Biên bản đã ký"
      description="Biên bản đồng ý nhận và văn bản từ chối đã hoàn tất, gom theo kho bạn đã duyệt hồ sơ báo tin."
    >
      <VerifierDocuments />
    </VerifierShell>
  );
}
