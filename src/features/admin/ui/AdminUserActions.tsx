import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import type { AuthState } from "@/entities/user/model/authSlice";
import { Button } from "@/shared/ui/button";
import { adminService } from "../api/adminService";
import { ROLE_LABELS, STATUS_LABELS } from "../model/admin.content";
import {
  ASSIGNABLE_USER_ROLES,
  ADMIN_USER_STATUSES,
  assignableUserRoleSchema,
  adminUserStatusSchema,
  type AdminUser,
} from "../model/admin.schema";
import { adminKeys } from "../model/useAdmin";
import { AdminActionDialog } from "./AdminActionDialog";

type UserDialog = "role" | "status";

/**
 * Đổi vai trò và khóa/mở tài khoản. Ẩn với chính tài khoản đang đăng nhập (BR-74); Backend vẫn
 * chặn bằng CANNOT_CHANGE_SELF và LAST_ADMIN. Mỗi thay đổi bắt buộc có lý do và xác nhận.
 */
export function AdminUserActions({ user }: { user: AdminUser }) {
  const currentUserId = useSelector((state: { auth: AuthState }) => state.auth.user?.id);
  const client = useQueryClient();
  const [dialog, setDialog] = useState<UserDialog | null>(null);
  if (user.id === currentUserId)
    return <span className="text-xs text-heritage-muted">Tài khoản của bạn</span>;
  const close = () => setDialog(null);
  const done = () => void client.invalidateQueries({ queryKey: adminKeys.all });
  const label = user.fullName || user.email;
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          className="min-h-11"
          aria-label={`Đổi vai trò của ${label}`}
          onClick={() => setDialog("role")}
        >
          Đổi vai trò
        </Button>
        <Button
          variant="outline"
          className="min-h-11"
          aria-label={`Đổi trạng thái của ${label}`}
          onClick={() => setDialog("status")}
        >
          Đổi trạng thái
        </Button>
      </div>
      {dialog === "role" && (
        <AdminActionDialog
          key={`${user.id}:${user.etag}:role`}
          title="Đổi vai trò"
          description={`${label} · hiện là ${ROLE_LABELS[user.role]}. Thay đổi có hiệu lực ngay ở lần gọi API kế tiếp.`}
          submitLabel="Đổi vai trò"
          fields={[
            {
              name: "role",
              label: "Vai trò mới",
              kind: "select",
              options: ASSIGNABLE_USER_ROLES.map((role) => ({
                value: role,
                label: ROLE_LABELS[role],
              })),
            },
            { name: "reason", label: "Lý do", kind: "textarea", maxLength: 500 },
          ]}
          // Tài khoản cũ mang vai trò EXECUTOR không còn được cấp lại, mặc định chọn USER.
          defaultValues={{ role: user.role === "EXECUTOR" ? "USER" : user.role, reason: "" }}
          confirmLabel="Tôi xác nhận đổi vai trò của tài khoản này."
          submit={(values) =>
            adminService.changeUserRole(user.id, {
              role: assignableUserRoleSchema.parse(values.role),
              reason: values.reason,
            })
          }
          onClose={close}
          onDone={done}
        />
      )}
      {dialog === "status" && (
        <AdminActionDialog
          key={`${user.id}:${user.etag}:status`}
          title="Đổi trạng thái tài khoản"
          description={`${label} · hiện ${STATUS_LABELS[user.status].toLowerCase()}. Khóa hoặc vô hiệu hóa sẽ thu hồi mọi phiên đăng nhập của tài khoản.`}
          submitLabel="Đổi trạng thái"
          fields={[
            {
              name: "status",
              label: "Trạng thái mới",
              kind: "select",
              options: ADMIN_USER_STATUSES.map((status) => ({
                value: status,
                label: STATUS_LABELS[status],
              })),
            },
            { name: "reason", label: "Lý do", kind: "textarea", maxLength: 500 },
          ]}
          defaultValues={{ status: user.status, reason: "" }}
          confirmLabel="Tôi xác nhận đổi trạng thái của tài khoản này."
          submit={(values) =>
            adminService.changeUserStatus(user.id, {
              status: adminUserStatusSchema.parse(values.status),
              reason: values.reason,
            })
          }
          onClose={close}
          onDone={done}
        />
      )}
    </>
  );
}
