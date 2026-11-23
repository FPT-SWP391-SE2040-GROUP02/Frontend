import { VerifierQueue } from "@/widgets/VerifierWorkspace/VerifierQueue";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Lịch sử: các biên bản bạn đã ký. */
export function VerifierHistoryPage() {
  return (
    <VerifierShell title="Biên bản đã hoàn tất" description="Các biên bản bạn đã ký.">
      <VerifierQueue scope="closed" />
    </VerifierShell>
  );
}
