import { AccountSettingsContent } from "@/pages/dashboard/AccountSettingsPage";
import { VerifierShell } from "@/widgets/VerifierWorkspace/VerifierShell";

/** Cài đặt tài khoản trong không gian Người xét duyệt (cùng nội dung với Chủ kho). */
export function VerifierSettingsPage() {
  return (
    <VerifierShell
      title="Cài đặt"
      description="Thông tin cá nhân và bảo mật tài khoản. Vai trò do quản trị viên cấp, bạn không đọc được nội dung kho."
    >
      <AccountSettingsContent />
    </VerifierShell>
  );
}
