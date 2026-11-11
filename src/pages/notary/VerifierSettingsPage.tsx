import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { LoginMethodsPanel } from "@/features/auth";
import { NotaryCardPanel } from "@/features/notary-card";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/**
 * Tài khoản của Người xét duyệt: tên và vai trò, ảnh thẻ công chứng viên (Admin nộp, Người xét duyệt chỉ xem;
 * muốn đổi thì liên hệ Admin) và phương thức đăng nhập (mật khẩu) ở khối bảo mật bên dưới.
 */
export function VerifierSettingsPage() {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  return (
    <VerifierShell
      title="Tài khoản"
      description="Ảnh thẻ công chứng viên do quản trị viên nộp, bạn chỉ xem. Muốn đổi thì liên hệ quản trị viên."
    >
      <section
        aria-label="Hồ sơ Người xét duyệt"
        className="rounded-xl border border-heritage-border bg-heritage-surface p-6"
      >
        <h2 className="text-lg font-semibold">{user?.fullName ?? "Người xét duyệt"}</h2>
        <p className="mt-1 text-sm text-heritage-muted">Người xét duyệt</p>
      </section>
      <NotaryCardPanel />
      <LoginMethodsPanel />
    </VerifierShell>
  );
}
