import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { LoginMethodsPanel } from "@/features/auth";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/**
 * Hồ sơ của Người xét duyệt: chỉ hiện thông tin hành nghề (chứng chỉ hành nghề, thẻ luật sư) do Admin nhập khi tạo tài khoản,
 * người dùng chỉ xem, không tự sửa. Phương thức đăng nhập (mật khẩu) nằm ở khối bảo mật bên dưới.
 */
export function VerifierSettingsPage() {
  const user = useSelector((state: { auth: AuthState }) => state.auth.user);
  const fields: Array<[string, string | undefined]> = [
    ["Chứng chỉ hành nghề", user?.practiceCertificateNumber],
    ["Thẻ luật sư", user?.lawyerCardNumber],
  ];
  return (
    <VerifierShell
      title="Tài khoản"
      description="Thông tin hành nghề do quản trị viên nhập khi tạo tài khoản. Bạn chỉ xem, không tự sửa được."
    >
      <section
        aria-label="Hồ sơ hành nghề"
        className="rounded-xl border border-heritage-border bg-heritage-surface p-6"
      >
        <h2 className="text-lg font-semibold">{user?.fullName ?? "Người xét duyệt"}</h2>
        <p className="mt-1 text-sm text-heritage-muted">Người xét duyệt</p>
        <dl className="mt-6 grid gap-6 sm:grid-cols-2">
          {fields.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-heritage-muted">{label}</dt>
              <dd className="mt-2 break-words text-sm font-medium">
                {value || "Quản trị viên chưa nhập"}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <LoginMethodsPanel />
    </VerifierShell>
  );
}
