import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/shared/ui/skeleton";
import { buttonStyles, Chip, Notice, Panel } from "@/shared/ui/heritageKit";
import { adminService } from "../api/adminService";
import type { EmailTemplate } from "../model/admin.schema";
import { useAdminAction } from "../model/useAdminAction";
import { adminKeys, useAdminEmailTemplates } from "../model/useAdmin";
import { AdminErrorMessage } from "./AdminStateMessage";
import { AdminExtraMails } from "./AdminExtraMails";

type FieldName = "subject" | "title" | "body" | "buttonText" | "note";

interface FieldSpec {
  name: FieldName;
  label: string;
  max: number;
  rows: number;
}

const FIELDS: FieldSpec[] = [
  { name: "subject", label: "Tiêu đề thư (dòng chủ đề trong hộp thư)", max: 200, rows: 1 },
  { name: "title", label: "Tiêu đề lớn trong thân thư", max: 200, rows: 1 },
  { name: "body", label: "Nội dung (mỗi dòng là một đoạn)", max: 4000, rows: 8 },
  { name: "buttonText", label: "Chữ trên nút", max: 80, rows: 1 },
  { name: "note", label: "Ghi chú cuối thư", max: 1000, rows: 3 },
];

type Draft = Record<FieldName, string>;

function draftOf(template: EmailTemplate): Draft {
  return {
    subject: template.custom.subject ?? "",
    title: template.custom.title ?? "",
    body: template.custom.body ?? "",
    buttonText: template.custom.buttonText ?? "",
    note: template.custom.note ?? "",
  };
}

/** Biến đang dùng trong chữ mà loại thư này không có; Backend cũng chặn nhưng báo sớm cho Admin. */
function unknownTokens(text: string, known: string[]): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/\{([^{}]*)\}/g)) {
    if (!known.includes(match[1])) found.add(match[1]);
  }
  return [...found];
}

function hasCustomText(template: EmailTemplate): boolean {
  return Object.values(template.custom).some((value) => value !== null);
}

function TemplateEditor({ template, onDone }: { template: EmailTemplate; onDone: () => void }) {
  const client = useQueryClient();
  const action = useAdminAction();
  const [draft, setDraft] = useState<Draft>(() => draftOf(template));
  const [enabled, setEnabled] = useState(template.enabled);
  const fields = FIELDS.filter((field) => field.name !== "body" || template.editableBody);
  const known = template.tokens.map((token) => token.name);
  const problems = fields.flatMap((field) => {
    const text = draft[field.name];
    const list: string[] = [];
    if (text.length > field.max) list.push(`${field.label}: tối đa ${field.max} ký tự.`);
    const unknown = unknownTokens(text, known);
    if (unknown.length > 0) {
      list.push(`${field.label}: biến lạ ${unknown.map((name) => `{${name}}`).join(", ")}.`);
    }
    return list;
  });
  const original = draftOf(template);
  const dirty =
    enabled !== template.enabled ||
    fields.some((field) => draft[field.name] !== original[field.name]);

  const refresh = () => void client.invalidateQueries({ queryKey: adminKeys.emailTemplates() });
  const save = () => {
    const value = (name: FieldName) => (draft[name].trim().length > 0 ? draft[name] : null);
    void action.execute(
      () =>
        adminService.saveEmailTemplate(template.key, {
          enabled,
          subject: value("subject"),
          title: value("title"),
          body: template.editableBody ? value("body") : null,
          buttonText: value("buttonText"),
          note: value("note"),
        }),
      () => {
        refresh();
        onDone();
      },
    );
  };
  const reset = () =>
    void action.execute(
      () => adminService.resetEmailTemplate(template.key),
      () => {
        refresh();
        onDone();
      },
    );

  return (
    <div className="space-y-4 border-t border-heritage-border pt-4">
      <p className="text-sm text-heritage-muted">{template.description}</p>
      {template.canDisable && (
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => setEnabled(event.target.checked)}
          />
          Gửi loại thư này
        </label>
      )}
      {!template.canDisable && (
        <p className="text-xs text-heritage-muted">Loại thư này luôn được gửi, không tắt được.</p>
      )}
      <div>
        <p className="text-sm font-medium">Biến có thể chèn</p>
        <ul className="mt-2 flex flex-wrap gap-2">
          {template.tokens.map((token) => (
            <li key={token.name} title={token.description}>
              <code className="rounded-md bg-[#ECE8DB] px-2 py-1 text-xs">{`{${token.name}}`}</code>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-heritage-muted">
          Biến được thay bằng thông tin thật khi gửi. Để trống một ô là dùng chữ gốc của ô đó.
        </p>
      </div>
      {fields.map((field) => {
        const id = `${template.key}-${field.name}`;
        const fallback = template.default[field.name];
        const common = {
          id,
          value: draft[field.name],
          placeholder: fallback,
          onChange: (value: string) => setDraft({ ...draft, [field.name]: value }),
          className:
            "mt-1 w-full rounded-xl border border-heritage-border bg-white px-3 py-2 text-sm outline-none focus-visible:border-heritage-gold focus-visible:ring-2 focus-visible:ring-heritage-gold/30",
        };
        return (
          <div key={field.name}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label htmlFor={id} className="text-sm font-medium">
                {field.label}
              </label>
              <button
                type="button"
                className="text-xs font-medium text-[#7A5B25] underline"
                onClick={() => common.onChange(fallback)}
              >
                Lấy chữ gốc để sửa
              </button>
            </div>
            {field.rows === 1 ? (
              <input
                id={common.id}
                value={common.value}
                placeholder={common.placeholder}
                className={`${common.className} h-11`}
                onChange={(event) => common.onChange(event.target.value)}
              />
            ) : (
              <textarea
                id={common.id}
                rows={field.rows}
                value={common.value}
                placeholder={common.placeholder}
                className={`${common.className} leading-6`}
                onChange={(event) => common.onChange(event.target.value)}
              />
            )}
          </div>
        );
      })}
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
          disabled={action.pending || problems.length > 0 || !dirty}
          onClick={save}
        >
          {action.pending ? "Đang lưu…" : "Lưu"}
        </button>
        <button
          type="button"
          className={buttonStyles.outline}
          disabled={action.pending || (!hasCustomText(template) && template.enabled)}
          onClick={reset}
        >
          Về chữ gốc
        </button>
      </div>
    </div>
  );
}

function TemplateRow({ template }: { template: EmailTemplate }) {
  const [open, setOpen] = useState(false);
  const panelId = `email-template-${template.key}`;
  return (
    <li className="rounded-2xl border border-heritage-border bg-white p-4">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen(!open)}
      >
        <span className="min-w-0">
          <span className="block font-semibold text-heritage-primary">{template.label}</span>
          <span className="mt-1 flex flex-wrap gap-2">
            {hasCustomText(template) ? (
              <Chip tone="warning">Đã sửa</Chip>
            ) : (
              <Chip tone="neutral">Chữ gốc</Chip>
            )}
            {!template.enabled && <Chip tone="danger">Đang tắt</Chip>}
          </span>
        </span>
        {open ? (
          <ChevronUp className="size-5 shrink-0" aria-hidden="true" />
        ) : (
          <ChevronDown className="size-5 shrink-0" aria-hidden="true" />
        )}
      </button>
      {open && (
        <div id={panelId} className="mt-4">
          <TemplateEditor
            key={`${template.key}-${template.updatedAt}`}
            template={template}
            onDone={() => undefined}
          />
          {template.updatedAt && (
            <p className="mt-3 text-xs text-heritage-muted">
              Sửa lần cuối {new Date(template.updatedAt).toLocaleString("vi-VN")}
              {template.updatedByName ? ` bởi ${template.updatedByName}` : ""}.
            </p>
          )}
        </div>
      )}
    </li>
  );
}

/** Trang Mẫu thư của Admin: sửa chữ từng loại thư thông báo và bật hoặc tắt loại thư cho phép tắt. */
export function AdminEmailTemplates() {
  const query = useAdminEmailTemplates();
  if (query.isPending) return <Skeleton className="h-64 w-full" />;
  if (query.isError)
    return (
      <AdminErrorMessage
        error={query.error}
        onRetry={() => void query.refetch()}
        retrying={query.isFetching}
      />
    );
  return (
    <div className="space-y-6">
      <Notice tone="warning" title="Sửa chữ thư không đổi thông tin thật trong thư">
        Liên kết, mã hồ sơ và các thông tin riêng của từng người vẫn do hệ thống điền. Thư không
        chứa nội dung tài sản; đừng viết thêm thông tin nhạy cảm vào mẫu.
      </Notice>
      <Panel title="Các loại thư thông báo">
        <ul className="space-y-3">
          {query.data.map((template) => (
            <TemplateRow key={template.key} template={template} />
          ))}
        </ul>
      </Panel>
      <AdminExtraMails />
    </div>
  );
}
