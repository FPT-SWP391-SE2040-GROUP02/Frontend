import { useParams, useSearchParams } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { InvitationPanel } from "@/features/handover/ui/InvitationPanel";

/** Landing công khai của đường dẫn email Handover, dùng khung thương hiệu hai cột như các trang Auth. */
export function InvitationPage() {
  const { token } = useParams();
  const [params] = useSearchParams();
  const userId = useSelector((state: { auth: AuthState }) => state.auth.user?.id);
  return (
    <HeritageAuthLayout
      sideTitle="Có người muốn để lại điều gì đó cho bạn."
      sideSubtitle="Chủ kho đã chọn bạn làm người nhận. Bạn chỉ xem được khi đủ điều kiện bàn giao."
    >
      <h1 className="sr-only">Lời mời tiếp nhận</h1>
      <InvitationPanel key={`${token ?? params.get("token") ?? ""}:${userId ?? "guest"}`} />
    </HeritageAuthLayout>
  );
}
