import { AccountSettingsContent } from "@/pages/dashboard/AccountSettingsPage";
import { ExecutorWorkspace } from "@/widgets/ExecutorWorkspace/ExecutorWorkspace";

/** Cài đặt tài khoản trong không gian Người thực hiện (cùng nội dung với Chủ kho). */
export function ExecutorSettingsPage() {
  return (
    <ExecutorWorkspace
      title="Cài đặt"
      description="Thông tin cá nhân và bảo mật tài khoản. Vai trò do hệ thống cấp, bạn không đọc được nội dung kho."
    >
      <AccountSettingsContent />
    </ExecutorWorkspace>
  );
}
