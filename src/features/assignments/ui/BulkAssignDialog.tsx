import { useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ROUTES } from "@/shared/config/routes.config";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import type { VaultPinConfirmation } from "@/shared/api/vaultPin";
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
import { planBulkChanges, type BulkMode } from "../model/bulkAssign";
import type { AssignableAsset, AssignableRecipient } from "../model/assignmentView";

export interface BulkAssignDialogProps {
  vaultId: string;
  /** Các tài sản Chủ tài sản đã tick. */
  assets: AssignableAsset[];
  /** Mọi hồ sơ người nhận của kho. */
  recipients: AssignableRecipient[];
  /** Những người đang được gán một tài sản. */
  currentIdsFor: (assetId: string) => string[];
  /** Hỏi mã PIN của kho một lần trước khi lưu; hủy thì không lưu gì. */
  confirmPin: () => Promise<VaultPinConfirmation>;
  onClose: () => void;
  /** Đã lưu xong mọi tài sản. */
  onSaved: () => void;
}

const MODES: { value: BulkMode; label: string; hint: string }[] = [
  {
    value: "add",
    label: "Thêm vào người nhận hiện có",
    hint: "Giữ nguyên người đã được gán, chỉ thêm những người bạn chọn.",
  },
  {
    value: "replace",
    label: "Thay bằng danh sách này",
    hint: "Mỗi tài sản chỉ còn đúng những người bạn chọn ở đây.",
  },
];

/**
 * Gán một nhóm người nhận cho nhiều tài sản trong một lần: hỏi PIN đúng một lần rồi lưu lần lượt từng tài sản.
 * Gặp lỗi thì dừng, những tài sản đã lưu giữ nguyên; bấm Lưu lại sẽ chỉ làm tiếp phần còn lại.
 */
export function BulkAssignDialog({
  vaultId,
  assets,
  recipients,
  currentIdsFor,
  confirmPin,
  onClose,
  onSaved,
}: BulkAssignDialogProps) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [mode, setMode] = useState<BulkMode>("add");
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);

  const items: MemberPickerItem[] = recipients.map((person) => ({
    id: person.id,
    label: person.fullName,
    detail: `CCCD ${person.citizenId}`,
  }));
  const current: Record<string, string[]> = {};
  for (const asset of assets) {
    current[asset.id] = currentIdsFor(asset.id);
  }
  const changes = planBulkChanges(
    assets.map((asset) => asset.id),
    current,
    selectedIds,
    mode,
  );

  async function save(): Promise<void> {
    setProgress(null);
    const total = changes.length;
    const saved = await action.execute(
      async () => {
        const confirmation = await confirmPin();
        if (!confirmation.confirmed) {
          return false;
        }
        let done = 0;
        try {
          for (const change of changes) {
            await assignmentService.setRecipients(
              vaultId,
              change.assetId,
              change.beneficiaryIds,
              false,
              confirmation.pin,
            );
            done += 1;
            setProgress({ done, total });
          }
        } finally {
          if (done > 0) {
            invalidateAssignmentQueries(client, vaultId);
          }
        }
        return true;
      },
      () => undefined,
    );
    if (saved) {
      onSaved();
    }
  }

  let submitLabel = "Lưu";
  if (action.pending) {
    submitLabel = "Đang lưu…";
  }
  const nothingToSave = selectedIds.length === 0 || changes.length === 0;

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="bg-heritage-surface p-6 sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-heritage-primary">
            Chọn người nhận cho {assets.length} tài sản
          </DialogTitle>
          <DialogDescription>
            Chỉ hỏi mã PIN một lần, rồi lưu lần lượt từng tài sản.
          </DialogDescription>
        </DialogHeader>
        <MemberPicker
          title="Người nhận"
          items={items}
          selectedIds={selectedIds}
          onChange={(ids) => {
            setSelectedIds(ids);
            setProgress(null);
            action.reset();
          }}
          searchPlaceholder="Tìm người nhận…"
          emptyText="Chưa có hồ sơ người nhận nào để gán."
          allowSelectAll
          withInitial
          hint="Chọn từ hai người trở lên nếu các tài sản này nhận chung."
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
        <fieldset className="space-y-2" disabled={action.pending}>
          <legend className="text-sm font-semibold text-heritage-primary">Cách áp dụng</legend>
          {MODES.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer items-start gap-3 rounded-xl border border-heritage-border bg-white px-4 py-3 text-sm has-[:checked]:border-heritage-primary"
            >
              <input
                type="radio"
                name="bulk-assign-mode"
                className="mt-1 size-4 accent-heritage-primary"
                checked={mode === option.value}
                onChange={() => setMode(option.value)}
              />
              <span>
                <span className="block font-semibold text-heritage-primary">{option.label}</span>
                <span className="block text-heritage-muted">{option.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
        {selectedIds.length > 0 && (
          <p role="status" className="text-sm text-heritage-muted">
            {changes.length === 0
              ? "Các tài sản đã chọn đã có đúng những người này, không cần lưu."
              : `Sẽ cập nhật ${changes.length}/${assets.length} tài sản.`}
          </p>
        )}
        {action.error && (
          <p role="alert" className="text-sm text-destructive">
            {action.error}
            {progress !== null && progress.done > 0
              ? ` Đã lưu ${progress.done}/${progress.total} tài sản trước đó; bấm Lưu để làm tiếp phần còn lại.`
              : ""}
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
            disabled={action.pending || nothingToSave}
            onClick={() => void save()}
          >
            {submitLabel}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
