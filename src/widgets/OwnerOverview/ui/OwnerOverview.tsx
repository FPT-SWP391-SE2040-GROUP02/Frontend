import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowUpRight, Vault, Layers3, Activity } from "lucide-react";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { ROUTES } from "@/shared/config/routes.config";
import { EkycStatusPanel } from "@/features/ekyc/ui/EkycStatusPanel";
import { OwnerDeathCasePanel } from "@/features/owner-objection";
import { useOwnerVault } from "@/features/vault-management/model/useOwnerVault";
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
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useSelector((state: { auth: AuthState }) => state.auth);
  const sessionReady = isAuthenticated && Boolean(accessTokenMemory.get());
  const vault = useOwnerVault(sessionReady);
  return (
    <OwnerWorkspace
      title={user?.fullName ? `Chào ${user.fullName}` : "Kho của bạn"}
      description="Sắp xếp nội dung quan trọng và theo dõi kho di sản của bạn."
    >
      <nav aria-label="Truy cập nhanh" className="owner-shortcuts grid gap-3 xl:grid-cols-3">
        {shortcuts.map(({ title, description, to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="group flex items-center gap-4 rounded-2xl border border-heritage-border bg-heritage-surface p-5 shadow-sm transition-colors hover:border-heritage-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-heritage-gold xl:block"
          >
            <div className="flex shrink-0 items-center justify-between xl:mb-5">
              <span className="rounded-xl bg-heritage-primary/5 p-3 text-heritage-primary">
                <Icon className="size-5" aria-hidden="true" />
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="mt-1 text-xs leading-5 text-heritage-muted xl:mt-2">{description}</p>
            </div>
            <ArrowUpRight
              className="size-5 shrink-0 text-heritage-muted group-hover:text-heritage-primary xl:mt-4"
              aria-hidden="true"
            />
          </Link>
        ))}
      </nav>
      <OwnerDeathCasePanel
        vaultId={vault.data?.id ?? ""}
        enabled={sessionReady && vault.isSuccess}
      />
      {/* Chỉ Owner (đã có kho) cần xác minh danh tính; Executor/người nhận dùng chung màn này nhưng không có kho. */}
      {vault.isSuccess && (
        <EkycStatusPanel
          purpose="OWNER_ENROLLMENT"
          turnId={null}
          onVerified={() => void queryClient.invalidateQueries({ queryKey: ["plan-setup"] })}
        />
      )}
      <OwnerVaultPanel enabled={sessionReady} />
    </OwnerWorkspace>
  );
}
