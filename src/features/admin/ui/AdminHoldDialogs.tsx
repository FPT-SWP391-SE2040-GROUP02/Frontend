import { useQueryClient } from "@tanstack/react-query";
import { adminService } from "../api/adminService";
import { HOLD_SCOPE_LABELS, defaultReviewLocal, localDateTimeToIso } from "../model/admin.content";
import { adminKeys } from "../model/useAdmin";
import { holdSchema, type Hold } from "../model/admin.schema";
import { AdminActionDialog } from "./AdminActionDialog";

interface DialogBase {
  onClose: () => void;
  /** Gọi sau khi Backend xác nhận để caller cập nhật điều hướng (ví dụ mở hold vừa tạo). */
  onDone?: (hold: Hold) => void;
}

/** Đặt tạm giữ lên kho hoặc một gói. `vaultId` có thể điền sẵn từ sự cố. */
export function PlaceHoldDialog({ vaultId, onClose, onDone }: DialogBase & { vaultId?: string }) {
  const client = useQueryClient();
  return (
    <AdminActionDialog
      title="Đặt tạm giữ"
      description="Tạm giữ chặn kích hoạt, nhận lượt, xác minh danh tính, tải nội dung và xóa; các hạn bàn giao dừng đếm trong lúc giữ."
      submitLabel="Đặt tạm giữ"
      fields={[
        {
          name: "vaultId",
          label: "Mã kho",
          kind: "text",
          maxLength: 36,
          hint: "Dán mã kho (UUID) từ sự cố hoặc hồ sơ liên quan.",
        },
        {
          name: "scope",
          label: "Phạm vi",
          kind: "select",
          options: [
            { value: "VAULT", label: HOLD_SCOPE_LABELS.VAULT },
            { value: "CONTAINER", label: HOLD_SCOPE_LABELS.CONTAINER },
          ],
        },
        {
          name: "targetId",
          label: "Mã gói",
          kind: "text",
          maxLength: 36,
          optional: true,
          hint: "Chỉ cần khi phạm vi là một gói.",
        },
        { name: "reason", label: "Lý do", kind: "textarea", maxLength: 500 },
        {
          name: "reviewAt",
          label: "Hạn rà soát đầu tiên",
          kind: "datetime",
          optional: true,
          hint: "Tối đa 7 ngày. Để trống thì hệ thống tự đặt hạn.",
        },
      ]}
      defaultValues={{
        vaultId: vaultId ?? "",
        scope: "VAULT",
        targetId: "",
        reason: "",
        reviewAt: "",
      }}
      submit={(values) =>
        adminService.placeHold({
          vaultId: values.vaultId,
          scope: values.scope === "CONTAINER" ? "CONTAINER" : "VAULT",
          targetId: values.scope === "CONTAINER" && values.targetId ? values.targetId : undefined,
          reason: values.reason,
          reviewAt: values.reviewAt ? localDateTimeToIso(values.reviewAt) : undefined,
        })
      }
      onClose={onClose}
      onDone={(result) => {
        void client.invalidateQueries({ queryKey: adminKeys.all });
        const created = holdSchema.safeParse(result);
        if (created.success) onDone?.(created.data);
      }}
    />
  );
}

/** Hẹn lần rà soát hold tiếp theo. */
export function ReviewHoldDialog({ hold, onClose }: DialogBase & { hold: Hold }) {
  const client = useQueryClient();
  return (
    <AdminActionDialog
      title="Hẹn rà soát tạm giữ"
      description="Ghi nhận đã rà soát và đặt hạn rà soát tiếp theo, tối đa 7 ngày."
      submitLabel="Ghi nhận"
      fields={[{ name: "nextReviewAt", label: "Hạn rà soát tiếp theo", kind: "datetime" }]}
      defaultValues={{ nextReviewAt: defaultReviewLocal() }}
      submit={(values) =>
        adminService.reviewHold(hold.id, {
          nextReviewAt: localDateTimeToIso(values.nextReviewAt),
          etag: hold.etag,
        })
      }
      onClose={onClose}
      onDone={() => void client.invalidateQueries({ queryKey: adminKeys.all })}
    />
  );
}

/** Gỡ hold. Hold do chủ kho báo còn sống không có nút này vì chỉ Verifier gỡ được (BR-71). */
export function ReleaseHoldDialog({ hold, onClose }: DialogBase & { hold: Hold }) {
  const client = useQueryClient();
  return (
    <AdminActionDialog
      title="Gỡ tạm giữ"
      description="Gỡ xong, kho và các lượt bàn giao hoạt động lại; hạn đang chạy được dời bằng thời gian đã dừng."
      submitLabel="Gỡ tạm giữ"
      fields={[{ name: "reason", label: "Lý do gỡ", kind: "textarea", maxLength: 500 }]}
      defaultValues={{ reason: "" }}
      confirmLabel="Tôi xác nhận gỡ tạm giữ này."
      submit={(values) =>
        adminService.releaseHold(hold.id, { reason: values.reason, etag: hold.etag })
      }
      onClose={onClose}
      onDone={() => void client.invalidateQueries({ queryKey: adminKeys.all })}
    />
  );
}
