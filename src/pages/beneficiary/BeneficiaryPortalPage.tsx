import { useSelector } from "react-redux";
import { BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ClaimSupplementNotice } from "@/features/handover-request";
import { useTurnOverview } from "@/features/handover/model/useTurnOverview";
import { TurnHub } from "@/features/handover/ui/TurnHub";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { RecipientLayout } from "@/widgets/RecipientLayout/RecipientLayout";

/** Trang "Việc cần làm" của người nhận: gom mọi việc xác nhận giấy tờ và nhận tài sản theo thứ tự ưu tiên. */
export function BeneficiaryPortalPage() {
  const accountName = useSelector((state: { auth: AuthState }) => state.auth.user?.fullName);
  /** Cùng khóa với danh sách lượt trong thanh bên nên chỉ gọi API một lần. */
  const overview = useTurnOverview();
  /** Ưu tiên tên Chủ tài sản đã chỉ định cho người nhận, không có thì dùng tên tài khoản. */
  const designatedName = overview.entries.find((entry) => entry.turn.recipientFullName)?.turn
    .recipientFullName;
  const fullName = designatedName ?? accountName;
  return (
    <RecipientLayout active="overview">
      <header className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3.5">
        <div>
          <h1 className="text-3xl font-semibold text-heritage-primary">
            {fullName ? `Xin chào, ${fullName}` : "Nội dung được bàn giao"}
          </h1>
          <p className="mt-1 max-w-[64ch] text-sm text-heritage-muted">
            Mọi việc xác nhận giấy tờ và nhận tài sản của bạn được gom tại đây theo thứ tự ưu tiên.
          </p>
        </div>
        <Link to={ROUTES.BENEFICIARY.GUIDE} className={buttonStyles.outline}>
          <BookOpen className="size-4" aria-hidden="true" />
          Xem quy trình 6 bước
        </Link>
      </header>
      <TurnHub notice={<ClaimSupplementNotice />} />
    </RecipientLayout>
  );
}
