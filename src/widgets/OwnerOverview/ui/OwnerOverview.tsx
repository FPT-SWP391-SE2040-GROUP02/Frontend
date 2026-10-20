import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import type { AuthState } from "@/entities/user/model/authSlice";
import { ROUTES } from "@/shared/config/routes.config";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { AddIcon } from "@/shared/ui/LegacyVaultArtwork";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerDashboard } from "./OwnerDashboard";

/** Tổng quan theo handoff, dữ liệu từ Backend chính thức; không có bộ chuyển không gian. */
export function OwnerOverview() {
  const { user, isAuthenticated } = useSelector((state: { auth: AuthState }) => state.auth);
  const sessionReady = isAuthenticated && Boolean(accessTokenMemory.get());
  return (
    <OwnerWorkspace
      title={user?.fullName ? `Chào ${user.fullName}` : "Kho của bạn"}
      description={
        user?.fullName
          ? "Đây là tổng quan kho của bạn."
          : "Sắp xếp nội dung quan trọng và theo dõi kho di sản của bạn."
      }
      headerAction={
        <Link className="overview-primary-action" to={ROUTES.DASHBOARD.ASSETS}>
          <AddIcon className="size-4 shrink-0" aria-hidden="true" /> Thêm mục
        </Link>
      }
    >
      <OwnerDashboard enabled={sessionReady} />
    </OwnerWorkspace>
  );
}
