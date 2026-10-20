import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { HeritageAuthLayout } from "@/features/auth/ui/HeritageAuthLayout";
import { ExecutorInvitationPanel } from "@/features/plan-setup/ui/ExecutorInvitationPanel";

/** Public invitation landing; login is requested before responding. Fragment avoids HTTP/referrer token exposure. */
export function ExecutorInvitationPage() {
  const { hash } = useLocation();
  const token = new URLSearchParams(hash.slice(1)).get("token") ?? "";
  const userId = useSelector((state: { auth: AuthState }) => state.auth.user?.id);
  return (
    <HeritageAuthLayout
      sideTitle="Một việc nhỏ, một trách nhiệm lớn."
      sideSubtitle="Người thực hiện báo tin khi Chủ kho qua đời và theo dõi tiến trình bàn giao."
      sideBadge="LỜI MỜI NGƯỜI THỰC HIỆN"
    >
      <ExecutorInvitationPanel key={`${token}:${userId ?? "guest"}`} token={token} />
    </HeritageAuthLayout>
  );
}
