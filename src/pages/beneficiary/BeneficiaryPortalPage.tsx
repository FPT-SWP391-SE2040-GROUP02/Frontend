import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";
import { HandoverPortal } from "@/features/handover/ui/HandoverPortal";
/** Không giả lập grant, nội dung bàn giao hoặc phiên người nhận. */
export function BeneficiaryPortalPage() {
  const fullName = useSelector((state: { auth: AuthState }) => state.auth.user?.fullName);
  return (
    <RecipientLayout active="overview">
      <header>
        <h1 className="text-3xl font-semibold text-heritage-primary">
          {fullName ? `Xin chào, ${fullName}` : "Nội dung được bàn giao"}
        </h1>
        <p className="mt-2 text-sm text-heritage-muted">
          Theo dõi các bước và nội dung bạn được phép tiếp nhận.
        </p>
      </header>
      <HandoverPortal />
    </RecipientLayout>
  );
}
