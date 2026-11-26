import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Users } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { MemberPicker, type MemberPickerItem } from "@/shared/ui/MemberPicker";
import { assignmentService } from "../api/assignmentService";
import { invalidateAssignmentQueries } from "../model/useAssignments";
import type { AssignableAsset, AssignableRecipient } from "../model/assignmentView";

export interface AssignAssetDialogProps {
  vaultId: string;
  asset: AssignableAsset;
  /** Mọi hồ sơ người nhận của kho. */
  recipients: AssignableRecipient[];
  /** Những người đang được gán tài sản này. */
  currentIds: string[];
  onClose: () => void;
}

/** Backend báo thao tác làm kho không còn tài sản nào được gán khi kế hoạch đang chạy; chưa ghi gì. */
function needsPlanConfirmation(error: unknown): boolean {
  if (!isAxiosError<{ code?: unknown }>(error) || !error.response) {
    return false;
  }
  return error.response.data?.code === "PLAN_DEACTIVATION_CONFIRMATION_REQUIRED";
}

function sameSet(first: string[], second: string[]): boolean {
  if (first.length !== second.length) {
    return false;
  }
  for (const id of first) {
    if (!second.includes(id)) {
      return false;
    }
  }
  return true;
}

/**
 * Chọn những ai nhận một tài sản. Danh sách chọn là danh sách sau cùng: bỏ tick là gỡ, tick thêm là gán.
 * Chọn từ hai người trở lên nghĩa là nhận chung. Mã PIN do lớp truyền tải tự hỏi khi Backend đòi.
 */
export function AssignAssetDialog({
  vaultId,
  asset,
  recipients,
  currentIds,
  onClose,
}: AssignAssetDialogProps) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [selectedIds, setSelectedIds] = useState<string[]>(currentIds);
  const [confirming, setConfirming] = useState(false);

  const items: MemberPickerItem[] = recipients.map((person) => ({
    id: person.id,
    label: person.fullName,
    detail: `CCCD ${person.citizenId}`,
  }));
  const unchanged = sameSet(selectedIds, currentIds);

  async function submit(confirmPlanDeactivation: boolean): Promise<void> {
    const saved = await action.execute(
      () =>
        assignmentService.setRecipients(vaultId, asset.id, selectedIds, confirmPlanDeactivation),
      () => invalidateAssignmentQueries(client, vaultId),
      (failure) => setConfirming(needsPlanConfirmation(failure)),
    );
    if (saved) {
      onClose();
    }
  }

  function changeSelection(ids: string[]): void {
    setSelectedIds(ids);
    setConfirming(false);
    action.reset();
  }

  let sharedNames = "";
  if (selectedIds.length >= 2) {
    const names: string[] = [];
    for (const person of recipients) {
      if (selectedIds.includes(person.id)) {
        names.push(person.fullName);
      }
    }
    sharedNames = names.join(", ");
  }

  let submitLabel = "Lưu";
  if (action.pending) {
    submitLabel = "Đang lưu…";
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="bg-heritage-surface p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-heritage-primary">
            Chọn người nhận
          </DialogTitle>
          <DialogDescription className="break-words">Tài sản “{asset.name}”.</DialogDescription>
        </DialogHeader>
        <MemberPicker
          title="Người nhận"
          items={items}
          selectedIds={selectedIds}
          onChange={changeSelection}
          searchPlaceholder="Tìm người nhận…"
          emptyText="Chưa có hồ sơ người nhận nào để gán."
          withInitial
          hint="Chọn từ hai người trở lên nếu tài sản này nhận chung."
          footer={
            <Link
              to={ROUTES.DASHBOARD.BENEFICIARIES}
              className="text-heritage-primary hover:underline"
            >
              + Thêm người nhận mới
            </Link>
          }
          disabled={action.pending}
        />
        {sharedNames !== "" && (
          <p
            role="status"
            className="flex items-start gap-2 rounded-xl bg-heritage-sunken px-4 py-3 text-sm text-heritage-muted"
          >
            <Users className="mt-0.5 size-4 shrink-0 text-heritage-primary" aria-hidden="true" />
            <span>
              <strong className="font-semibold text-heritage-primary">Nhận chung:</strong>{" "}
              {sharedNames} cùng nhận tài sản này và cùng ký biên bản.
            </span>
          </p>
        )}
        {confirming && (
          <div
            role="alert"
            className="space-y-3 rounded-xl border border-heritage-warning/30 bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning"
          >
            <p>
              Sau thay đổi này không còn tài sản nào được gán cho người nhận, nên kế hoạch sẽ trở về{" "}
              <strong>bản nháp</strong>. Bạn cần kích hoạt lại sau.
            </p>
            <button
              type="button"
              className={buttonStyles.danger}
              disabled={action.pending}
              onClick={() => void submit(true)}
            >
              Đồng ý, đưa kế hoạch về bản nháp
            </button>
          </div>
        )}
        {action.error && !confirming && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
          </p>
        )}
        <DialogFooter className="gap-2">
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={action.pending}
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="button"
            className={buttonStyles.dark}
            disabled={action.pending || unchanged}
            onClick={() => void submit(false)}
          >
            {submitLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
