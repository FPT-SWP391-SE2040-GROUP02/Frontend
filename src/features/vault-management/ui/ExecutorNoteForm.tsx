import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, TriangleAlert } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { Textarea } from "@/shared/ui/textarea";
import { ownerVaultService } from "../api/ownerVaultService";
import { ownerVaultKeys, useOwnerVault } from "../model/useOwnerVault";

const NOTE_MAX = 2000;

/** Ô "Hướng dẫn cho Executor": Executor đã chấp nhận đọc được ngay, trước khi hồ sơ chứng tử được duyệt. */
export function ExecutorNoteSection() {
  const query = useOwnerVault(true);
  if (!query.data) {
    return null;
  }
  return <ExecutorNoteForm key={query.data.id} vault={query.data} />;
}

/** Etag và nội dung đã lưu thuộc snapshot form (như EditVaultForm), không lấy etag mới để ghi đè bản của tab khác. */
function ExecutorNoteForm({ vault }: { vault: VaultResponse }) {
  const [etag, setEtag] = useState(vault.etag);
  const [saved, setSaved] = useState(vault.executorNote ?? "");
  const [savedAt, setSavedAt] = useState(vault.executorNoteUpdatedAt ?? null);
  const [note, setNote] = useState(saved);
  const client = useQueryClient();
  const action = usePrivateAction();
  const closed = vault.status === "CLOSED";
  const dirty = note !== saved;

  function save(): void {
    void action.execute(
      () => ownerVaultService.updateMine(vault.id, { etag, executorNote: note }),
      (result) => {
        client.setQueryData(ownerVaultKeys.mine, result);
        setEtag(result.etag);
        setSaved(result.executorNote ?? "");
        setSavedAt(result.executorNoteUpdatedAt ?? null);
        setNote(result.executorNote ?? "");
      },
    );
  }

  return (
    <section
      aria-labelledby="executor-note-title"
      className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="executor-note-title" className="text-lg font-semibold text-heritage-primary">
            Hướng dẫn cho Executor
          </h2>
          <p className="mt-1 text-sm text-heritage-muted">
            Ví dụ: liên hệ ai, giấy tờ để ở đâu, cần báo cho ai trước.
          </p>
        </div>
        <span className="shrink-0 text-xs tabular-nums text-heritage-muted" aria-hidden="true">
          {note.length}/{NOTE_MAX}
        </span>
      </div>
      <p className="mt-3 flex items-start gap-2 rounded-xl bg-[#FBF1DC] p-3 text-sm text-[#7A4B00]">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
        Executor đọc được hướng dẫn này ngay khi đã chấp nhận lời mời. Không ghi mật khẩu, số tài
        khoản hay nội dung tài sản.
      </p>
      <label htmlFor="executor-note" className="sr-only">
        Hướng dẫn cho Executor
      </label>
      <Textarea
        id="executor-note"
        rows={5}
        maxLength={NOTE_MAX}
        value={note}
        disabled={action.pending || closed}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Ví dụ: Gọi cho anh Minh (luật sư gia đình) trước. Giấy tờ để trong tủ sắt ở phòng làm việc."
        className="mt-4 rounded-xl border-[#BDB8A6] bg-white"
      />
      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        {action.succeeded && !dirty && (
          <p
            role="status"
            className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-[#1F7A55]"
          >
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Đã lưu hướng dẫn.
          </p>
        )}
        {!action.succeeded && savedAt && (
          <p className="mr-auto text-xs text-heritage-muted">
            Sửa lần cuối {formatDateTime(savedAt)}
          </p>
        )}
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={!dirty || action.pending}
          onClick={() => {
            action.reset();
            setNote(saved);
          }}
        >
          Hoàn tác
        </button>
        <button
          type="button"
          className={buttonStyles.dark}
          disabled={!dirty || action.pending || closed}
          onClick={save}
        >
          {action.pending ? "Đang lưu…" : "Lưu hướng dẫn"}
        </button>
      </div>
      {action.error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {action.error}
        </p>
      )}
    </section>
  );
}
