import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { VerifierOverview } from "@/widgets/VerifierWorkspace/VerifierOverview";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Route /notary/workspace: Tổng quan Người xét duyệt, theo /api/v1/verifier/death-cases. */
export function NotaryWorkspacePage() {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  return (
    <VerifierShell
      title={user?.fullName ? `Chào ${user.fullName}` : "Tổng quan"}
      description="Bạn giúp xác nhận đây có phải là yêu cầu thật."
    >
      <VerifierOverview />
    </VerifierShell>
  );
}
