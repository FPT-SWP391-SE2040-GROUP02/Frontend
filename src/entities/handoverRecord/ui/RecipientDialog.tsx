import { useId, useState, type FormEvent } from "react";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { useSuccessHold } from "@/shared/lib/useSuccessHold";
import { ActionButton } from "@/shared/ui/ActionButton";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/shared/ui/dialog";
import { compactButton } from "@/shared/ui/SectionCard";
import type { HandoverRecord } from "../model/handoverRecord.schema";
import {
  addRecordRecipient,
  removeRecordRecipient,
  updateRecordRecipient,
  type RecipientChange,
} from "../model/recipientChanges";
import {
  draftWarning,
  RECIPIENT_FIELDS,
  recipientDraftError,
  type RecipientDraft,
  type RecipientDraftErrors,
  type RecipientField,
} from "../model/recipientDraft";

/** Đang thêm người mới, sửa hoặc xác nhận xóa một người do luật sư thêm. */
export type RecipientDialogState =
  | { mode: "add"; initial: RecipientDraft }
  | { mode: "edit" | "remove"; beneficiaryId: string; initial: RecipientDraft };

const INPUT_TYPES: Record<RecipientField, string> = {
  fullName: "text",
  citizenId: "text",
  dateOfBirth: "date",
  email: "email",
  phone: "tel",
};

const LABELS: Record<RecipientField, string> = {
  fullName: "Họ tên",
  citizenId: "Số căn cước (12 số)",
  dateOfBirth: "Ngày sinh",
  email: "Email (nhận thư mời)",
  phone: "Số điện thoại (không bắt buộc)",
};

/**
 * Cửa sổ nhập người nhận theo di chúc. Bấm Thêm hoặc Lưu là máy chủ kiểm và lưu ngay vào biên bản đang lập; lỗi nào
 * hiện đúng ô đó. Đang gửi thì không đóng được để không mất kết quả.
 */
export function RecipientDialog({
  record,
  state,
  onAskRemove,
  onDone,
  onClose,
}: {
  record: HandoverRecord;
  state: RecipientDialogState;
  /** Chuyển từ cửa sổ sửa sang bước xác nhận xóa. */
  onAskRemove: () => void;
  onDone: (change: RecipientChange) => void;
  onClose: () => void;
}) {
  const id = useId();
  const action = usePrivateAction();
  const saved = useSuccessHold();
  const [draft, setDraft] = useState(state.initial);
  const [localErrors, setLocalErrors] = useState<RecipientDraftErrors>({});
  // Ô đã gõ lại thì ẩn lỗi máy chủ trả ở lần gửi trước.
  const [retyped, setRetyped] = useState<string[]>([]);
  const busy = action.pending || saved.done;
  let editingId = "";
  if (state.mode !== "add") editingId = state.beneficiaryId;

  function change(next: RecipientDraft, field: string): void {
    setDraft(next);
    setLocalErrors((current) => ({ ...current, [field]: undefined }));
    setRetyped((current) => [...current, field]);
  }

  function toggleAsset(assetId: string): void {
    let assetIds = [...draft.assetIds, assetId];
    if (draft.assetIds.includes(assetId)) {
      assetIds = draft.assetIds.filter((item) => item !== assetId);
    }
    change({ ...draft, assetIds }, "assetIds");
  }

  function errorOf(field: RecipientField): string {
    const local = localErrors[field];
    if (local) return local;
    const server = action.fieldErrors[field];
    if (server && !retyped.includes(field)) return server[0];
    return "";
  }

  function submit(event: FormEvent): void {
    event.preventDefault();
    if (busy) return;
    const errors = recipientDraftError(draft, state.mode === "add");
    setLocalErrors(errors);
    if (Object.keys(errors).length > 0) return;
    setRetyped([]);
    void action.execute(
      () =>
        saved.hold(() => {
          if (state.mode === "add") return addRecordRecipient(record.id, draft);
          return updateRecordRecipient(record.id, editingId, draft);
        }),
      onDone,
    );
  }

  function remove(): void {
    void action.execute(
      () => saved.hold(() => removeRecordRecipient(record.id, editingId)),
      onDone,
    );
  }

  let title = "Thêm người nhận";
  let description = "Nhập theo di chúc. Bấm Thêm là kiểm tra và lưu ngay vào biên bản đang lập.";
  let submitLabel = "Thêm";
  if (state.mode === "edit") {
    title = "Sửa người nhận";
    description = "Chỉ sửa được người do bạn thêm, trước khi phát hành biên bản.";
    submitLabel = "Lưu";
  }
  if (state.mode === "remove") {
    title = "Xóa người nhận";
    description = `Xóa ${state.initial.fullName} khỏi danh sách? Tài sản đã chia cho người này trong biên bản cũng bị gỡ.`;
  }
  const warning = draftWarning(record, draft, editingId);
  const hasFieldError = RECIPIENT_FIELDS.some((field) => action.fieldErrors[field]);

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="gap-4 sm:max-w-xl" showCloseButton={false}>
        <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
        <DialogDescription className="text-sm text-heritage-muted">{description}</DialogDescription>
        {state.mode === "remove" ? (
          <>
            {action.error && (
              <p role="alert" className="text-sm text-destructive">
                {action.error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className={compactButton.outline}
                disabled={busy}
                onClick={onClose}
              >
                Giữ lại
              </button>
              <ActionButton
                className={compactButton.danger}
                pending={action.pending}
                done={saved.done}
                pendingLabel="Đang xóa…"
                doneLabel="Đã xóa"
                onClick={remove}
              >
                Xóa người nhận
              </ActionButton>
            </div>
          </>
        ) : (
          <form noValidate className="space-y-4 text-sm" onSubmit={submit}>
            {warning !== "" && (
              <p className="rounded-xl bg-heritage-warning-bg px-3 py-2 text-heritage-warning">
                {warning}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              {RECIPIENT_FIELDS.map((field) => {
                const error = errorOf(field);
                const locked = field === "citizenId" && state.mode === "edit";
                return (
                  <div key={field} className="space-y-1">
                    <label htmlFor={`${id}-${field}`} className="block font-semibold">
                      {LABELS[field]}
                    </label>
                    <input
                      id={`${id}-${field}`}
                      type={INPUT_TYPES[field]}
                      inputMode={field === "citizenId" ? "numeric" : undefined}
                      className="h-11 w-full rounded-xl border border-heritage-border bg-white px-3 read-only:bg-heritage-sunken read-only:text-heritage-muted"
                      value={draft[field]}
                      readOnly={locked}
                      disabled={busy}
                      aria-invalid={error !== ""}
                      aria-describedby={error ? `${id}-${field}-error` : undefined}
                      onChange={(event) => change({ ...draft, [field]: event.target.value }, field)}
                    />
                    {locked && (
                      <p className="text-heritage-muted">
                        Muốn đổi số căn cước thì xóa người này rồi thêm lại.
                      </p>
                    )}
                    {error && (
                      <p id={`${id}-${field}-error`} className="text-destructive">
                        {error}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            {state.mode === "add" && (
              <fieldset className="space-y-2">
                <legend className="font-semibold">Tài sản được nhận</legend>
                <div className="flex max-h-40 flex-wrap gap-x-6 gap-y-2 overflow-y-auto">
                  {record.availableAssets.map((asset) => (
                    <label
                      key={asset.assetId}
                      className="flex min-h-11 cursor-pointer items-center gap-2"
                    >
                      <input
                        type="checkbox"
                        className="size-5 cursor-pointer accent-heritage-primary"
                        checked={draft.assetIds.includes(asset.assetId)}
                        disabled={busy}
                        onChange={() => toggleAsset(asset.assetId)}
                      />
                      <span>{asset.name}</span>
                    </label>
                  ))}
                </div>
                {localErrors.assetIds && <p className="text-destructive">{localErrors.assetIds}</p>}
              </fieldset>
            )}
            {action.error && !hasFieldError && (
              <p role="alert" className="text-destructive">
                {action.error}
              </p>
            )}
            <div className="flex flex-wrap items-center justify-end gap-2">
              {state.mode === "edit" && (
                <button
                  type="button"
                  className={`${compactButton.danger} mr-auto`}
                  disabled={busy}
                  onClick={onAskRemove}
                >
                  Xóa người này
                </button>
              )}
              <button
                type="button"
                className={compactButton.outline}
                disabled={busy}
                onClick={onClose}
              >
                Hủy
              </button>
              <ActionButton
                type="submit"
                className={compactButton.dark}
                pending={action.pending}
                done={saved.done}
                pendingLabel="Đang lưu…"
                doneLabel="Đã lưu"
              >
                {submitLabel}
              </ActionButton>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
