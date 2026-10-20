import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerDashboard } from "./OwnerDashboard";

/** Tổng quan theo handoff, dữ liệu từ Backend chính thức; không có bộ chuyển không gian. */
export function OwnerOverview() {
  const { user, isAuthenticated } = useSelector((state: { auth: AuthState }) => state.auth);
  const sessionReady = isAuthenticated && Boolean(accessTokenMemory.get());
  return (
    <OwnerWorkspace
      title={user?.fullName ? `Chào ${user.fullName}` : "Kho của bạn"}
      description="Sắp xếp nội dung quan trọng và theo dõi kho di sản của bạn."
    >
      <OwnerDashboard enabled={sessionReady} />
    </OwnerWorkspace>
  );
}
