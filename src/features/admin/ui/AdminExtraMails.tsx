import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/shared/ui/skeleton";
import { buttonStyles, Chip, Panel } from "@/shared/ui/heritageKit";
import { adminService } from "../api/adminService";
import type { ExtraMail, ExtraMailList } from "../model/admin.schema";
import { useAdminAction } from "../model/useAdminAction";
import { adminKeys, useAdminExtraMails } from "../model/useAdmin";
import { AdminErrorMessage } from "./AdminStateMessage";

type Direction = "before" | "after";

interface Draft {
  name: string;
  enabled: boolean;
  direction: Direction;
  days: string;
  subject: string;
  title: string;
  body: string;
  buttonText: string;
  note: string;
}

const EMPTY: Draft = {
  name: "",
  enabled: true,
  direction: "after",
  days: "1",
  subject: "",
  title: "",
  body: "",
  buttonText: "Điểm danh ngay",
  note: "Email này không chứa nội dung tài sản của bạn.",
};

const LIMITS = { name: 100, subject: 200, title: 200, body: 4000, buttonText: 80, note: 1000 };

function draftOf(mail: ExtraMail): Draft {
  return {
    name: mail.name,
    enabled: mail.enabled,
    direction: mail.daysFromDue < 0 ? "before" : "after",
    days: String(Math.abs(mail.daysFromDue)),
    subject: mail.subject,
    title: mail.title,
    body: mail.body,
    buttonText: mail.buttonText,
    note: mail.note,
  };
}

/** Câu mô tả ngày gửi, ví dụ "3 ngày trước hạn điểm danh". */
function timingText(daysFromDue: number): string {
  if (daysFromDue === 0) return "Đúng lúc đến hạn điểm danh";
  if (daysFromDue < 0) return `${-daysFromDue} ngày trước hạn điểm danh`;
  return `${daysFromDue} ngày sau hạn điểm danh (quá hạn)`;
}

function unknownTokens(text: string, known: string[]): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/\{([^{}]*)\}/g)) {
    if (!known.includes(match[1])) found.add(match[1]);
  }
  return [...found];
}

function ExtraMailEditor({
  list,
  mail,
  onClose,
}: {
  list: ExtraMailList;
  mail: ExtraMail | null;
  onClose: () => void;
}) {
  const client = useQueryClient();
  const action = useAdminAction();
  const [draft, setDraft] = useState<Draft>(() => (mail ? draftOf(mail) : EMPTY));
  const known = list.tokens.map((token) => token.name);
  const set = <K extends keyof Draft>(name: K, value: Draft[K]) =>
    setDraft({ ...draft, [name]: value });

  const daysNumber = Number(draft.days);
  const daysValue = draft.direction === "before" ? -daysNumber : daysNumber;
  const problems: string[] = [];
  if (draft.name.trim().length === 0) problems.push("Cần đặt tên để nhận ra thư.");
  if (!Number.isInteger(daysNumber) || draft.days.trim() === "" || daysNumber < 0) {
    problems.push("Số ngày phải là số nguyên không âm.");
  } else if (daysValue < list.minDaysFromDue || daysValue > list.maxDaysFromDue) {
    problems.push(
      `Gửi từ ${-list.minDaysFromDue} ngày trước hạn đến ${list.maxDaysFromDue} ngày sau hạn.`,
    );
  }
  const required: Array<[keyof typeof LIMITS, string]> = [
    ["subject", "Tiêu đề thư"],
    ["title", "Tiêu đề lớn"],
    ["body", "Nội dung"],
    ["buttonText", "Chữ trên nút"],
    ["note", "Ghi chú cuối thư"],
  ];
  for (const [field, label] of required) {
    if (draft[field].trim().length === 0) problems.push(`${label} không được để trống.`);
  }
  for (const field of ["name", "subject", "title", "body", "buttonText", "note"] as const) {
    if (draft[field].length > LIMITS[field]) {
      problems.push(`Tối đa ${LIMITS[field]} ký tự cho ô ${field}.`);
    }
    const unknown = unknownTokens(draft[field], known);
    if (unknown.length > 0) {
      problems.push(`Biến lạ ${unknown.map((name) => `{${name}}`).join(", ")}.`);
    }
  }

  const save = () => {
    const request = {
      name: draft.name,
      enabled: draft.enabled,
      daysFromDue: daysValue,
      subject: draft.subject,
      title: draft.title,
      body: draft.body,
      buttonText: draft.buttonText,
      note: draft.note,
    };
    void action.execute(
      () =>
        mail
          ? adminService.updateExtraMail(mail.id, request)
          : adminService.createExtraMail(request),
      () => {
        void client.invalidateQueries({ queryKey: adminKeys.extraMails() });
        onClose();
      },
    );
  };

  const field = "mt-1 w-full rounded-xl border border-heritage-border bg-white px-3 py-2 text-sm";
  return (
    <div className="space-y-4 rounded-2xl border border-heritage-gold/60 bg-[#FBF8EE] p-4">
      <h3 className="font-semibold text-heritage-primary">
        {mail ? "Sửa thư bổ sung" : "Thêm thư bổ sung"}
      </h3>
      <label className="block text-sm font-medium" htmlFor="extra-name">
        Tên (chỉ để bạn nhận ra, không gửi đi)
        <input
          id="extra-name"
          className={`${field} h-11`}
          value={draft.name}
          onChange={(event) => set("name", event.target.value)}
        />
      </label>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Gửi vào lúc</legend>
        <div className="flex flex-wrap items-center gap-2">
          <input
            aria-label="Số ngày"
            className="h-11 w-24 rounded-xl border border-heritage-border bg-white px-3 text-sm"
            inputMode="numeric"
            value={draft.days}
            onChange={(event) => set("days", event.target.value.replace(/\D/g, ""))}
          />
          <span className="text-sm">ngày</span>
          <select
            aria-label="Trước hay sau hạn"
            className="h-11 rounded-xl border border-heritage-border bg-white px-3 text-sm"
            value={draft.direction}
            onChange={(event) => set("direction", event.target.value as Direction)}
          >
            <option value="before">trước hạn điểm danh</option>
            <option value="after">sau hạn điểm danh (quá hạn)</option>
          </select>
        </div>
        <p className="text-xs text-heritage-muted">
          Nhập 0 ngày để gửi đúng lúc đến hạn. Thư gửi một lần cho mỗi kỳ điểm danh và chỉ gửi khi
          Chủ kho chưa điểm danh. Sau khi hết thời gian chờ, hệ thống chuyển sang nhờ Người thực thi
          nên thư bổ sung dừng.
        </p>
      </fieldset>
      <div>
        <p className="text-sm font-medium">Biến có thể chèn</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {list.tokens.map((token) => (
            <li key={token.name} title={token.description}>
              <code className="rounded-md bg-[#ECE8DB] px-2 py-1 text-xs">{`{${token.name}}`}</code>
            </li>
          ))}
        </ul>
      </div>
      <label className="block text-sm font-medium" htmlFor="extra-subject">
        Tiêu đề thư (dòng chủ đề trong hộp thư)
        <input
          id="extra-subject"
          className={`${field} h-11`}
          value={draft.subject}
          onChange={(event) => set("subject", event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium" htmlFor="extra-title">
        Tiêu đề lớn trong thân thư
        <input
          id="extra-title"
          className={`${field} h-11`}
          value={draft.title}
          onChange={(event) => set("title", event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium" htmlFor="extra-body">
        Nội dung (mỗi dòng là một đoạn)
        <textarea
          id="extra-body"
          rows={6}
          className={`${field} leading-6`}
          value={draft.body}
          onChange={(event) => set("body", event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium" htmlFor="extra-button">
        Chữ trên nút (nút dẫn tới trang điểm danh)
        <input
          id="extra-button"
          className={`${field} h-11`}
          value={draft.buttonText}
          onChange={(event) => set("buttonText", event.target.value)}
        />
      </label>
      <label className="block text-sm font-medium" htmlFor="extra-note">
        Ghi chú cuối thư
        <textarea
          id="extra-note"
          rows={2}
          className={`${field} leading-6`}
          value={draft.note}
          onChange={(event) => set("note", event.target.value)}
        />
      </label>
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(event) => set("enabled", event.target.checked)}
        />
        Đang bật
      </label>
      {problems.length > 0 && (
        <ul role="alert" className="list-disc space-y-1 pl-5 text-sm text-[#A32119]">
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
      {action.error && (
        <p role="alert" className="text-sm text-[#A32119]">
          {action.error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={buttonStyles.dark}
          disabled={action.pending || problems.length > 0}
          onClick={save}
        >
          {action.pending ? "Đang lưu…" : "Lưu"}
        </button>
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={action.pending}
          onClick={onClose}
        >
          Hủy
        </button>
      </div>
    </div>
  );
}

function ExtraMailRow({ mail, onEdit }: { mail: ExtraMail; onEdit: () => void }) {
  const client = useQueryClient();
  const action = useAdminAction();
  const [confirming, setConfirming] = useState(false);
  const refresh = () => void client.invalidateQueries({ queryKey: adminKeys.extraMails() });
  const toggle = () =>
    void action.execute(
      () =>
        adminService.updateExtraMail(mail.id, {
          name: mail.name,
          enabled: !mail.enabled,
          daysFromDue: mail.daysFromDue,
          subject: mail.subject,
          title: mail.title,
          body: mail.body,
          buttonText: mail.buttonText,
          note: mail.note,
        }),
      refresh,
    );
  const remove = () =>
    void action.execute(
      () => adminService.deleteExtraMail(mail.id),
      () => {
        setConfirming(false);
        refresh();
      },
    );
  return (
    <li className="rounded-2xl border border-heritage-border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-heritage-primary">{mail.name}</p>
          <p className="mt-1 text-sm text-heritage-muted">{timingText(mail.daysFromDue)}</p>
          <p className="mt-1 truncate text-sm">{mail.subject}</p>
        </div>
        <Chip tone={mail.enabled ? "success" : "neutral"}>
          {mail.enabled ? "Đang bật" : "Đang tắt"}
        </Chip>
      </div>
      {action.error && (
        <p role="alert" className="mt-2 text-sm text-[#A32119]">
          {action.error}
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={action.pending}
          onClick={onEdit}
        >
          Sửa
        </button>
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={action.pending}
          onClick={toggle}
        >
          {mail.enabled ? "Tắt" : "Bật"}
        </button>
        {!confirming && (
          <button
            type="button"
            className={buttonStyles.danger}
            disabled={action.pending}
            onClick={() => setConfirming(true)}
          >
            Xóa
          </button>
        )}
        {confirming && (
          <>
            <button
              type="button"
              className={buttonStyles.danger}
              disabled={action.pending}
              onClick={remove}
            >
              Xác nhận xóa
            </button>
            <button
              type="button"
              className={buttonStyles.outline}
              onClick={() => setConfirming(false)}
            >
              Giữ lại
            </button>
          </>
        )}
      </div>
    </li>
  );
}

/** Thư bổ sung do Admin thêm: gửi cho Chủ kho vào một ngày tính từ hạn điểm danh, ngoài các thư nhắc có sẵn. */
export function AdminExtraMails() {
  const query = useAdminExtraMails();
  const [editing, setEditing] = useState<ExtraMail | "new" | null>(null);
  if (query.isPending) return <Skeleton className="h-40 w-full" />;
  if (query.isError) {
    return (
      <AdminErrorMessage
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  }
  const list = query.data;
  const full = list.items.length >= list.maxItems;
  return (
    <Panel
      title="Thư bổ sung cho Chủ kho"
      action={
        editing === null && (
          <button
            type="button"
            className={buttonStyles.gold}
            disabled={full}
            title={full ? `Tối đa ${list.maxItems} thư` : undefined}
            onClick={() => setEditing("new")}
          >
            Thêm thư bổ sung
          </button>
        )
      }
    >
      <p className="mb-4 text-sm text-heritage-muted">
        Thêm thư gửi cho Chủ kho vào ngày bạn chọn, tính từ hạn điểm danh: trước hạn để nhắc sớm hơn
        hoặc sau hạn để nhắc thêm khi trễ. Các thư nhắc có sẵn phía trên vẫn gửi như cũ.
      </p>
      {editing !== null && (
        <div className="mb-4">
          <ExtraMailEditor
            key={editing === "new" ? "new" : editing.id}
            list={list}
            mail={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
          />
        </div>
      )}
      {list.items.length === 0 && editing === null && (
        <p className="text-sm text-heritage-muted">Chưa có thư bổ sung nào.</p>
      )}
      <ul className="space-y-3">
        {list.items.map((mail) => (
          <ExtraMailRow key={mail.id} mail={mail} onEdit={() => setEditing(mail)} />
        ))}
      </ul>
    </Panel>
  );
}
