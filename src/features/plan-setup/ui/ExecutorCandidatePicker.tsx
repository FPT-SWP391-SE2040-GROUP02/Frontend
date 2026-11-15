import { useState, type ReactNode } from "react";
import type { z } from "zod";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import type { executorCandidateSchema } from "../model/planSetup.schema";
import { CANDIDATE_MIN_CHARS, useExecutorCandidates } from "../model/useExecutorCandidates";

export type ExecutorCandidate = z.infer<typeof executorCandidateSchema>;

interface ExecutorCandidatePickerProps {
  vaultId: string;
  selected: ExecutorCandidate | null;
  disabled: boolean;
  onSelect: (candidate: ExecutorCandidate | null) => void;
}

/** Chọn một người đã có tài khoản LegacyVault: gõ tên hoặc email, bấm vào kết quả. Không mời email ngoài hệ thống. */
export function ExecutorCandidatePicker({
  vaultId,
  selected,
  disabled,
  onSelect,
}: ExecutorCandidatePickerProps) {
  const [text, setText] = useState("");
  const { query, enabled } = useExecutorCandidates(vaultId, text);

  if (selected !== null) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-heritage-border bg-white p-3">
        <div className="min-w-0">
          <p className="break-words font-semibold">{selected.fullName}</p>
          <p className="break-all text-sm text-heritage-muted">{selected.email}</p>
        </div>
        <Button type="button" variant="outline" disabled={disabled} onClick={() => onSelect(null)}>
          Chọn người khác
        </Button>
      </div>
    );
  }

  let results: ReactNode = null;
  if (text.trim().length < CANDIDATE_MIN_CHARS) {
    results = (
      <p className="text-sm text-heritage-muted">
        Nhập ít nhất {CANDIDATE_MIN_CHARS} ký tự của tên hoặc email.
      </p>
    );
  } else if (enabled && query.isPending) {
    results = (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tìm…
      </p>
    );
  } else if (query.isError) {
    results = (
      <p role="alert" className="text-sm text-destructive">
        Không tìm được lúc này. Thử gõ lại.
      </p>
    );
  } else if (query.data !== undefined && query.data.length === 0) {
    results = (
      <p role="status" className="text-sm text-heritage-muted">
        Không có tài khoản phù hợp. Người này cần đăng ký và xác minh email trên LegacyVault trước.
      </p>
    );
  } else if (query.data !== undefined) {
    const rows: ReactNode[] = [];
    for (const candidate of query.data) {
      rows.push(
        <li key={candidate.userId}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => onSelect(candidate)}
            className="flex min-h-11 w-full flex-col items-start rounded-lg px-3 py-2 text-left hover:bg-[#F1E7D0]"
          >
            <span className="font-semibold">{candidate.fullName}</span>
            <span className="break-all text-sm text-heritage-muted">{candidate.email}</span>
          </button>
        </li>,
      );
    }
    results = (
      <ul
        aria-label="Kết quả tìm Người thực thi"
        className="rounded-xl border border-heritage-border"
      >
        {rows}
      </ul>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block space-y-2 text-sm">
        Tìm người trong hệ thống
        <Input
          type="search"
          autoComplete="off"
          placeholder="Tên hoặc email"
          value={text}
          disabled={disabled}
          onChange={(event) => setText(event.target.value)}
        />
      </label>
      {results}
    </div>
  );
}
