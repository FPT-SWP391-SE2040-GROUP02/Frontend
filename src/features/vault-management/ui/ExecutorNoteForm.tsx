import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { formatDateTime } from "@/shared/lib/dateFormat";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { Textarea } from "@/shared/ui/textarea";
import { ownerVaultService } from "../api/ownerVaultService";
import { ownerVaultKeys, useOwnerVault } from "../model/useOwnerVault";

const NOTE_MAX = 2000;

/** Ô "Lời dặn cho Người thực thi": đọc được ngay sau khi họ đồng ý, trước khi hồ sơ chứng tử được duyệt. */
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
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 id="executor-note-title" className="text-lg font-semibold text-heritage-primary">
          Lời dặn cho Người thực thi
        </h2>
        <span className="shrink-0 text-xs tabular-nums text-heritage-muted" aria-hidden="true">
          {note.length}/{NOTE_MAX}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6">
        Người thực thi đọc được ngay sau khi đồng ý. Ghi việc cần làm và người cần báo,{" "}
        <strong>không ghi mật khẩu, số tài khoản hay nội dung tài sản</strong>.
      </p>
      <label htmlFor="executor-note" className="sr-only">
        Lời dặn cho Người thực thi
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
            Đã lưu lời dặn.
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
          {action.pending ? "Đang lưu…" : "Lưu lời dặn"}
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
