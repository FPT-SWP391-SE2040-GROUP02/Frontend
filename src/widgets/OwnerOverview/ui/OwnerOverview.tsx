import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ArrowUpRight, Vault, Layers3, Activity } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ROUTES } from "@/shared/config/routes.config";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { OwnerVaultPanel } from "./OwnerVaultPanel";

const shortcuts = [
  {
    title: "Kho của tôi",
    description: "Xem tài sản và nội dung đang lưu trong kho.",
    to: ROUTES.DASHBOARD.ASSETS,
    icon: Vault,
  },
  {
    title: "Kế hoạch bàn giao",
    description: "Theo dõi các gói nội dung dành cho người nhận.",
    to: ROUTES.WILLS.ROOT,
    icon: Layers3,
  },
  {
    title: "Điểm danh",
    description: "Kiểm tra chu kỳ, hạn tiếp theo và trạng thái hiện tại.",
    to: ROUTES.DMS.ROOT,
    icon: Activity,
  },
];
/** Tổng quan chính thức, không có counters hoặc trạng thái minh họa. */
export function OwnerOverview() {
  const { user, isAuthenticated } = useSelector((state: { auth: AuthState }) => state.auth);
  return (
    <OwnerWorkspace
      title={user?.fullName ? `Chào ${user.fullName},` : "Kho của bạn"}
      description="Sắp xếp nội dung quan trọng và theo dõi kho di sản của bạn."
    >
      <nav aria-label="Truy cập nhanh" className="grid gap-4 md:grid-cols-3">
        {shortcuts.map(({ title, description, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group rounded-xl border border-heritage-border bg-heritage-surface p-5 transition-colors hover:border-heritage-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-heritage-gold"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="rounded-lg bg-heritage-primary/5 p-3 text-heritage-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <ArrowUpRight
                className="size-4 text-heritage-muted group-hover:text-heritage-primary"
                aria-hidden="true"
              />
            </div>
            <h2 className="text-sm font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-heritage-muted">{description}</p>
          </Link>
        ))}
      </nav>
      <OwnerVaultPanel enabled={isAuthenticated && Boolean(accessTokenMemory.get())} />
    </OwnerWorkspace>
  );
}
