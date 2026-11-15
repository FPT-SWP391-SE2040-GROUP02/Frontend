import { useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Plus, Trash2 } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { getVaultLockReason } from "@/entities/vault/model/vaultLock";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { Textarea } from "@/shared/ui/textarea";
import { ownerVaultService } from "../api/ownerVaultService";
import { ownerVaultKeys, useOwnerVault } from "../model/useOwnerVault";

/** Khớp giới hạn của Backend (WillClauseRules): tối đa 10 điều, mỗi điều 500 ký tự. */
export const WILL_CLAUSE_MAX_COUNT = 10;
export const WILL_CLAUSE_MAX_LENGTH = 500;

interface ClauseRow {
  key: number;
  text: string;
}

/** Bỏ điều trống và khoảng trắng thừa ở hai đầu; đây là danh sách thật sự gửi lên Backend. */
function cleanedTexts(rows: ClauseRow[]): string[] {
  const result: string[] = [];
  for (const row of rows) {
    const text = row.text.trim();
    if (text.length > 0) {
      result.push(text);
    }
  }
  return result;
}

function sameList(left: string[], right: string[]): boolean {
  if (left.length !== right.length) {
    return false;
  }
  for (let index = 0; index < left.length; index = index + 1) {
    if (left[index] !== right[index]) {
      return false;
    }
  }
  return true;
}

function toRows(texts: string[]): ClauseRow[] {
  const rows: ClauseRow[] = [];
  for (let index = 0; index < texts.length; index = index + 1) {
    rows.push({ key: index, text: texts[index] });
  }
  return rows;
}

/**
 * Thẻ "Điều khoản của bạn": Chủ kho thêm, sửa, xóa điều khoản riêng in trong Di chúc (mục Điều khoản bổ sung).
 * Chỉ hiện khi kế hoạch còn nháp; kích hoạt kế hoạch là ký di chúc nên sau đó không sửa nữa.
 */
export function WillClausesSection() {
  const query = useOwnerVault(true);
  if (!query.data || query.data.planStatus !== "DRAFT") {
    return null;
  }
  return <WillClausesForm key={query.data.id} vault={query.data} />;
}

/** Etag và danh sách đã lưu thuộc snapshot form (như ExecutorNoteForm), không lấy etag mới để ghi đè bản của tab khác. */
function WillClausesForm({ vault }: { vault: VaultResponse }) {
  const [etag, setEtag] = useState(vault.etag);
  const [saved, setSaved] = useState<string[]>(vault.willClauses);
  const [rows, setRows] = useState<ClauseRow[]>(toRows(vault.willClauses));
  const [nextKey, setNextKey] = useState(vault.willClauses.length);
  const client = useQueryClient();
  const action = usePrivateAction();
  const locked = getVaultLockReason(vault) !== null;
  const current = cleanedTexts(rows);
  const dirty = !sameList(current, saved);

  function updateRow(key: number, text: string): void {
    action.reset();
    setRows(rows.map((row) => (row.key === key ? { key, text } : row)));
  }

  function removeRow(key: number): void {
    action.reset();
    setRows(rows.filter((row) => row.key !== key));
  }

  function addRow(): void {
    action.reset();
    setRows([...rows, { key: nextKey, text: "" }]);
    setNextKey(nextKey + 1);
  }

  function save(): void {
    void action.execute(
      () => ownerVaultService.updateMine(vault.id, { etag, willClauses: current }),
      (result) => {
        client.setQueryData(ownerVaultKeys.mine, result);
        // Di chúc xem trước ở bước kích hoạt đọc điều khoản từ kế hoạch bàn giao.
        void client.invalidateQueries({ queryKey: ["plan-setup", vault.id] });
        setEtag(result.etag);
        setSaved(result.willClauses);
        setRows(toRows(result.willClauses));
        setNextKey(result.willClauses.length);
      },
    );
  }

  const fields: ReactNode[] = [];
  for (let index = 0; index < rows.length; index = index + 1) {
    const row = rows[index];
    const inputId = `will-clause-${row.key}`;
    fields.push(
      <li key={row.key} className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <label htmlFor={inputId} className="text-sm font-semibold">
            Điều khoản {index + 1}
          </label>
          <span className="text-sm tabular-nums text-heritage-muted" aria-hidden="true">
            {row.text.length}/{WILL_CLAUSE_MAX_LENGTH}
          </span>
        </div>
        <div className="flex items-start gap-2">
          <Textarea
            id={inputId}
            rows={2}
            maxLength={WILL_CLAUSE_MAX_LENGTH}
            value={row.text}
            disabled={action.pending || locked}
            onChange={(event) => updateRow(row.key, event.target.value)}
            placeholder="Ví dụ: Không bán căn nhà ở Đà Lạt trong 5 năm."
            className="rounded-xl border-[#BDB8A6] bg-white"
          />
          <button
            type="button"
            className={buttonStyles.outline}
            aria-label={`Xóa điều khoản ${index + 1}`}
            disabled={action.pending || locked}
            onClick={() => removeRow(row.key)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        </div>
      </li>,
    );
  }

  return (
    <section
      aria-labelledby="will-clauses-title"
      className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
    >
      <h2 id="will-clauses-title" className="text-lg font-semibold text-heritage-primary">
        Điều khoản của bạn
      </h2>
      <p className="mt-2 text-sm leading-6">
        Thêm điều khoản riêng vào di chúc; chúng được in ở mục "Điều khoản bổ sung". Sửa được đến
        khi bạn kích hoạt kế hoạch (kích hoạt là ký di chúc).{" "}
        <strong>Không ghi mật khẩu, số tài khoản hay nội dung tài sản</strong>.
      </p>
      {rows.length === 0 && (
        <p className="mt-4 text-sm text-heritage-muted">Chưa có điều khoản nào.</p>
      )}
      {rows.length > 0 && <ul className="mt-4 space-y-4">{fields}</ul>}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={action.pending || locked || rows.length >= WILL_CLAUSE_MAX_COUNT}
          onClick={addRow}
        >
          <Plus className="mr-1.5 inline size-4" aria-hidden="true" />
          Thêm điều khoản
        </button>
        <div className="flex flex-wrap items-center justify-end gap-3">
          {action.succeeded && !dirty && (
            <p
              role="status"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#1F7A55]"
            >
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Đã lưu điều khoản.
            </p>
          )}
          <button
            type="button"
            className={buttonStyles.outline}
            disabled={!dirty || action.pending}
            onClick={() => {
              action.reset();
              setRows(toRows(saved));
              setNextKey(saved.length);
            }}
          >
            Hoàn tác
          </button>
          <button
            type="button"
            className={buttonStyles.dark}
            disabled={!dirty || action.pending || locked}
            onClick={save}
          >
            {action.pending ? "Đang lưu…" : "Lưu điều khoản"}
          </button>
        </div>
      </div>
      {action.error && (
        <p role="alert" className="mt-3 text-sm text-destructive">
          {action.error}
        </p>
      )}
    </section>
  );
}
