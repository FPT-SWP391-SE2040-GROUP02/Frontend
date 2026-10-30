import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { LoginMethodsPanel } from "@/features/auth";
import { AvatarEditor } from "@/features/profile-avatar";
import { VaultPinPanel } from "@/features/vault-pin";
import { useOwnerVault } from "@/features/vault-management/model/useOwnerVault";
import { OwnerWorkspace } from "@/widgets/OwnerWorkspace/OwnerWorkspace";
import { Link } from "react-router-dom";
import { ROUTES } from "@/shared/config/routes.config";

/** Mã PIN của kho: chỉ hiện cho Chủ kho đã có kho (chưa có kho hoặc lỗi tải thì ẩn, không có gì để bảo vệ). */
function VaultPinSection() {
  const vault = useOwnerVault(true);
  if (!vault.data) return null;
  return <VaultPinPanel vaultId={vault.data.id} />;
}

/** Nội dung cài đặt dùng chung cho mọi không gian (Chủ kho, Người thực hiện). */
export function AccountSettingsContent() {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  return (
    <>
      <section className="rounded-xl border border-heritage-border bg-heritage-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-heritage-border pb-6">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold">Hồ sơ cá nhân</h2>
            <p className="mt-1 break-words text-sm text-heritage-muted">{user?.email}</p>
          </div>
          <AvatarEditor />
        </div>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          {[
            ["Họ và tên", user?.fullName],
            ["Email", user?.email],
            ["Số điện thoại", user?.phone],
            [
              "Xác minh email",
              user ? (user.emailVerified ? "Đã xác minh" : "Chưa xác minh") : undefined,
            ],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-heritage-muted">{label}</dt>
              <dd className="mt-2 break-words text-sm font-medium">
                {value || "Chưa có thông tin"}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-6 border-t border-heritage-border pt-4 text-xs text-heritage-muted">
          Chỉnh sửa hồ sơ đang được hoàn thiện.
        </p>
      </section>
      <LoginMethodsPanel />
      {user?.role === "USER" && <VaultPinSection />}
      {(!user || user.role === "USER") && (
        <Link
          className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
          to={ROUTES.DASHBOARD.IDENTITY}
        >
          Xác minh danh tính của tôi
        </Link>
      )}
    </>
  );
}

/** Hồ sơ từ phiên Backend và quản lý phương thức đăng nhập đã có API. */
export function AccountSettingsPage() {
  return (
    <OwnerWorkspace
      title="Cài đặt tài khoản"
      description="Thông tin hồ sơ và phương thức bảo vệ tài khoản của bạn."
    >
      <AccountSettingsContent />
    </OwnerWorkspace>
  );
}
