import { VerifierRecord } from "@/features/verifier-review";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Biên bản thẩm định của một hồ sơ đã duyệt (?caseId=). */
export function VerifierRecordPage() {
  return (
    <VerifierShell
      title="Biên bản thẩm định"
      description="Văn bản hệ thống tự lập khi bạn duyệt hồ sơ. Xem lại hoặc in."
    >
      <VerifierRecord />
    </VerifierShell>
  );
}
