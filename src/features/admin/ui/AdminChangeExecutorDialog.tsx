import { useId, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { adminService } from "../api/adminService";
import {
  EXECUTOR_HANDOVER_WARNING,
  EXECUTOR_INVITE_NOTE,
  executorAssignedMessage,
} from "../model/admin.content";
import type { AdminHeldVault } from "../model/admin.schema";
import { adminKeys, useAdminExecutorSearch } from "../model/useAdmin";
import { useAdminAction } from "../model/useAdminAction";

const REASON_MAX_LENGTH = 500;

interface AdminChangeExecutorDialogProps {
  vault: AdminHeldVault;
  /** Người thực thi hiện tại đang xem chi tiết; không hiện trong danh sách chọn. */
  currentUserId: string;
  onClose: () => void;
  /** Gọi sau khi Backend xác nhận, kèm câu thông báo thành công. */
  onDone: (message: string) => void;
}

/**
 * Đổi Người thực thi của một kho. Chọn người mới (Người thực thi đang hoạt động) và nhập lý do bắt buộc.
 * Kho đang bàn giao thì người mới nhận việc ngay; ngoài ra người mới phải chấp nhận lời mời.
 * Backend quyết định cuối cùng; không optimistic.
 */
export function AdminChangeExecutorDialog({
  vault,
  currentUserId,
  onClose,
  onDone,
}: AdminChangeExecutorDialogProps) {
  const idBase = useId();
  const client = useQueryClient();
  const action = useAdminAction();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const candidates = useAdminExecutorSearch(search.trim());

  const trimmedReason = reason.trim();
  const reasonMissing = trimmedReason.length === 0;
  const showReasonError = touched && reasonMissing;
  const people = (candidates.data?.items ?? []).filter((person) => person.id !== currentUserId);
  let warning = EXECUTOR_INVITE_NOTE;
  if (vault.handoverUnderway) {
    warning = EXECUTOR_HANDOVER_WARNING;
  }

  function submit() {
    setTouched(true);
    if (reasonMissing || selectedId === "") return;
    void action.execute(
      () =>
        adminService.assignExecutor(vault.vaultId, { userId: selectedId, reason: trimmedReason }),
      (result) => {
        void client.invalidateQueries({ queryKey: adminKeys.all });
        onDone(executorAssignedMessage(result.status));
        onClose();
      },
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Đổi Người thực thi</DialogTitle>
          <DialogDescription>Kho của {vault.ownerNameMasked}</DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
          className="space-y-3"
          noValidate
        >
          <p
            role="note"
            className="rounded-lg border border-heritage-border bg-heritage-surface px-3 py-2 text-sm"
          >
            {warning}
          </p>
          <div className="text-sm">
            <label htmlFor={`${idBase}-search`} className="block font-medium">
              Tìm Người thực thi mới
            </label>
            <Input
              id={`${idBase}-search`}
              autoComplete="off"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tên hoặc email"
              className="mt-1"
            />
            {candidates.isPending && (
              <p role="status" className="mt-2 text-heritage-muted">
                Đang tải danh sách người…
              </p>
            )}
            {candidates.isError && (
              <div role="alert" className="mt-2 space-y-2 text-destructive">
                <p>Không tải được danh sách người. Thử lại trước khi tiếp tục.</p>
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11"
                  onClick={() => void candidates.refetch()}
                >
                  Tải lại danh sách
                </Button>
              </div>
            )}
            {candidates.isSuccess && people.length === 0 && (
              <p className="mt-2 text-heritage-muted">Không có Người thực thi phù hợp.</p>
            )}
            {candidates.isSuccess && people.length > 0 && (
              <ul
                role="radiogroup"
                aria-label="Người thực thi mới"
                className="mt-2 max-h-48 divide-y divide-heritage-border overflow-y-auto rounded-lg border border-heritage-border"
              >
                {people.map((person) => (
                  <li key={person.id}>
                    <label className="flex min-h-11 cursor-pointer items-center gap-3 px-3 py-2">
                      <input
                        type="radio"
                        name={`${idBase}-executor`}
                        value={person.id}
                        checked={selectedId === person.id}
                        onChange={() => setSelectedId(person.id)}
                      />
                      <span className="min-w-0 break-words">
                        {person.fullName || person.email} · {person.email}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
            {touched && selectedId === "" && (
              <p role="alert" className="mt-1 text-destructive">
                Chọn một Người thực thi.
              </p>
            )}
          </div>
          <div className="text-sm">
            <label htmlFor={`${idBase}-reason`} className="block font-medium">
              Lý do
            </label>
            <Textarea
              id={`${idBase}-reason`}
              value={reason}
              maxLength={REASON_MAX_LENGTH}
              aria-invalid={showReasonError}
              onChange={(event) => setReason(event.target.value)}
              onBlur={() => setTouched(true)}
              className="mt-1 min-h-24"
            />
            {showReasonError && (
              <p role="alert" className="mt-1 text-destructive">
                Trường này là bắt buộc.
              </p>
            )}
          </div>
          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={action.pending}>
              Hủy
            </Button>
            <Button type="submit" disabled={action.pending || reasonMissing}>
              {action.pending ? "Đang ghi…" : "Đổi Người thực thi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
