import { VerifierQueue } from "@/widgets/VerifierWorkspace/VerifierQueue";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Lịch sử: các biên bản đã đủ chữ ký ba bên. */
export function VerifierHistoryPage() {
  return (
    <VerifierShell title="Biên bản đã hoàn tất" description="Các biên bản đã đủ chữ ký ba bên.">
      <VerifierQueue scope="closed" />
    </VerifierShell>
  );
}
