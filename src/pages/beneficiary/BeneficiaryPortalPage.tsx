import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { handoverService } from "@/features/handover/api/handoverService";
import type { AuthState } from "@/entities/user/model/authSlice";
import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";
import { HandoverPortal } from "@/features/handover/ui/HandoverPortal";
/** Không giả lập grant, nội dung bàn giao hoặc phiên người nhận. */
export function BeneficiaryPortalPage() {
  const accountName = useSelector((state: { auth: AuthState }) => state.auth.user?.fullName);
  /** Cùng khóa với danh sách lượt trong HandoverPortal nên chỉ gọi API một lần. */
  const turns = useQuery({
    queryKey: ["handover", "turns"],
    queryFn: ({ signal }) => handoverService.list(signal),
  });
  /** Ưu tiên tên Chủ kho đã chỉ định cho người nhận, không có thì dùng tên tài khoản. */
  const designatedName = turns.data?.find((turn) => turn.recipientFullName)?.recipientFullName;
  const fullName = designatedName ?? accountName;
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
