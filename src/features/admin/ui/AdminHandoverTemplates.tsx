import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  HandoverDocumentText,
  sampleHandoverDocument,
  type TemplateParagraph,
} from "@/entities/handoverDocument";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { adminService } from "../api/adminService";
import type { HandoverTemplate } from "../model/admin.schema";
import { useAdminAction } from "../model/useAdminAction";
import { adminKeys, useAdminHandoverTemplate } from "../model/useAdmin";
import { AdminErrorMessage } from "./AdminStateMessage";

const PARAGRAPH_MAX = 2000;
const NOTICE_MAX = 500;
const NOTICE_TOKEN = "{CAU_BAO_TU_CHOI}";
/** Mục "Tôi đã được thông báo: …" của biên bản; phần chữ sau dấu hai chấm cũng là câu hiện cho người nhận trước khi chọn. */
const NOTICE_LINE = /^\s*\d+\.\s*Tôi đã được thông báo:\s*/;

/**
 * Tách danh sách đoạn của biên bản đồng ý thành phần mở đầu cố định (tiêu đề, ngày, họ tên) và phần thân Admin sửa
 * (các mục đánh số từ "1." đến hết). Không thấy mục "1." thì coi 7 đoạn đầu là phần mở đầu.
 */
function splitAccept(accept: TemplateParagraph[]): {
  prefix: TemplateParagraph[];
  body: TemplateParagraph[];
} {
  let start = accept.findIndex((paragraph) => /^\s*1\./.test(paragraph.text));
  if (start < 0) start = Math.min(7, accept.length);
  return { prefix: accept.slice(0, start), body: accept.slice(start) };
}

/** Phần thân thành chữ liền để sửa: mỗi dòng một đoạn; trường câu báo được viết ra thành câu thật cho dễ sửa. */
function bodyToText(body: TemplateParagraph[], notice: string): string {
  return body.map((paragraph) => paragraph.text.split(NOTICE_TOKEN).join(notice)).join("\n");
}

/** Chữ đang sửa thành các đoạn: mỗi dòng không trống là một đoạn. */
function textToLines(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0);
}

/** Câu báo lấy từ mục "Tôi đã được thông báo: …"; không có mục đó thì giữ câu báo cũ. */
function noticeFrom(lines: string[], fallback: string): string {
  for (const line of lines) {
    const match = NOTICE_LINE.exec(line);
    if (match) {
      const sentence = line.slice(match[0].length).trim();
      if (sentence.length > 0) return sentence;
    }
  }
  return fallback;
}

/** Lỗi phải sửa trước khi lưu; cùng luật với Backend (trường lạ, đoạn quá dài, câu báo quá dài, không có đoạn nào). */
function findProblems(lines: string[], knownTokens: Set<string>, notice: string): string[] {
  const problems: string[] = [];
  if (lines.length === 0) problems.push("Cần có ít nhất một đoạn.");
  lines.forEach((line, index) => {
    if (line.length > PARAGRAPH_MAX)
      problems.push(`Đoạn ${index + 1}: tối đa ${PARAGRAPH_MAX} ký tự.`);
    for (const match of line.matchAll(/\{([A-Za-z_]+)\}/g)) {
      if (!knownTokens.has(match[1]))
        problems.push(`Đoạn ${index + 1}: trường {${match[1]}} không có trong danh sách trường.`);
    }
  });
  if (notice.length > NOTICE_MAX)
    problems.push(`Câu báo ở mục "Tôi đã được thông báo" tối đa ${NOTICE_MAX} ký tự.`);
  return problems;
}

/**
 * Trang Admin sửa phần thân biên bản đồng ý nhận (các mục 1 đến 8) theo kiểu gõ liền như Word: một khung chữ, Enter là đoạn mới.
 * Phần mở đầu (tiêu đề, ngày, họ tên), khối chữ ký và văn bản từ chối giữ nguyên. Lưu thành phiên bản mới: biên bản đã tạo giữ chữ cũ.
 */
export function AdminHandoverTemplates() {
  const query = useAdminHandoverTemplate();
  const [saved, setSaved] = useState("");

  if (query.isPending)
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Đang tải mẫu biên bản"
        className="mt-6 space-y-3"
      >
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  if (query.isError)
    return (
      <div className="mt-6">
        <AdminErrorMessage
          error={query.error}
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      </div>
    );
  return (
    <div className="mt-6 space-y-4">
      {saved && (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {saved}
        </p>
      )}
      <TemplateEditor
        key={query.data.version ?? "default"}
        template={query.data}
        onSaved={(version) =>
          setSaved(
            `Đã lưu phiên bản ${version}. Biên bản tạo từ giờ dùng chữ này; biên bản đã tạo giữ nguyên chữ cũ.`,
          )
        }
      />
    </div>
  );
}

function TemplateEditor({
  template,
  onSaved,
}: {
  template: HandoverTemplate;
  onSaved: (version: number) => void;
}) {
  const client = useQueryClient();
  const action = useAdminAction();
  const { prefix, body } = splitAccept(template.accept);
  const [text, setText] = useState(() => bodyToText(body, template.declineNotice));
  const [baseline] = useState(text);
  const [message, setMessage] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);

  const knownTokens = new Set(template.tokens.map((token) => token.token));
  const lines = textToLines(text);
  const notice = noticeFrom(lines, template.declineNotice);
  const problems = findProblems(lines, knownTokens, notice);
  const dirty = text !== baseline;

  function insertToken(token: string) {
    const element = area.current;
    const start = element?.selectionStart ?? text.length;
    const end = element?.selectionEnd ?? text.length;
    setText(`${text.slice(0, start)}{${token}}${text.slice(end)}`);
    setMessage("");
    const caret = start + token.length + 2;
    requestAnimationFrame(() => {
      element?.focus();
      element?.setSelectionRange(caret, caret);
    });
  }
  function restoreDefault() {
    const original = splitAccept(template.default.accept).body;
    setText(bodyToText(original, template.default.declineNotice));
    setMessage("Đã nạp chữ của mẫu gốc. Bấm Lưu để dùng.");
  }
  function save() {
    setMessage("");
    const newBody: TemplateParagraph[] = lines.map((line) => ({
      text: line,
      align: "justify",
      bold: false,
    }));
    void action.execute(
      () =>
        adminService.saveHandoverTemplate({
          accept: [...prefix, ...newBody],
          decline: template.decline,
          declineNotice: notice,
        }),
      (result) => {
        void client.invalidateQueries({ queryKey: adminKeys.handoverTemplate() });
        onSaved(result.version ?? 0);
      },
    );
  }

  const previewDocument = sampleHandoverDocument(
    "ACCEPT",
    [...prefix, ...lines.map((line) => ({ text: line, align: "justify" as const, bold: false }))],
    notice,
  );
  let versionText = "Đang dùng chữ gốc của hệ thống (chưa có bản nào được lưu)";
  if (template.version !== null) versionText = `Đang dùng phiên bản ${template.version}`;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <section aria-label="Sửa các mục của biên bản" className="space-y-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-heritage-primary">{versionText}</p>
          <p className="text-sm leading-6 text-heritage-muted">
            Gõ trực tiếp vào trang bên dưới như trong Word: Enter để xuống đoạn mới, tự gõ số thứ tự
            1., 2., … Chỗ có dạng {"{HO_TEN_CHU_KHO}"} là trường tự điền từ dữ liệu biên bản. Mục
            &quot;Tôi đã được thông báo&quot; cũng là câu hiện cho người nhận trước khi họ chọn.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Chèn trường">
          {template.tokens.map((token) => (
            <button
              key={token.token}
              type="button"
              title={`${token.label}. Ví dụ: ${token.example}`}
              onClick={() => insertToken(token.token)}
              className="rounded-full border border-heritage-border bg-white px-3 py-1 font-mono text-xs text-heritage-primary hover:bg-heritage-primary/5"
            >
              {`{${token.token}}`}
            </button>
          ))}
        </div>
        <textarea
          ref={area}
          aria-label="Nội dung các mục của biên bản"
          value={text}
          onChange={(event) => {
            setText(event.target.value);
            setMessage("");
          }}
          spellCheck
          rows={22}
          className="min-h-[32rem] w-full resize-y rounded-xl border border-heritage-border bg-white px-8 py-7 text-[14px] leading-7 text-black shadow-sm focus:outline-none"
          style={{ fontFamily: '"Times New Roman", Times, serif', textAlign: "justify" }}
        />
        {problems.length > 0 && (
          <ul role="alert" className="list-disc space-y-1 pl-5 text-sm text-red-700">
            {problems.slice(0, 6).map((problem) => (
              <li key={problem}>{problem}</li>
            ))}
          </ul>
        )}
        {action.error && (
          <p role="alert" className="text-sm text-red-700">
            {action.error}
          </p>
        )}
        {message && (
          <p role="status" className="text-sm text-heritage-muted">
            {message}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            type="button"
            disabled={action.pending || problems.length > 0 || !dirty}
            onClick={save}
            className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
          >
            {action.pending ? "Đang lưu…" : "Lưu"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={restoreDefault}
            disabled={action.pending}
          >
            Khôi phục chữ gốc
          </Button>
          {!dirty && <span className="text-sm text-heritage-muted">Chưa có thay đổi để lưu.</span>}
        </div>
      </section>

      <aside aria-label="Xem trước" className="space-y-2 xl:sticky xl:top-4">
        <h2 className="text-base font-bold text-heritage-primary">Xem trước</h2>
        <p className="text-xs text-heritage-muted">
          Dữ liệu mẫu (tên, ngày, số căn cước giả). Biên bản thật điền từ dữ liệu của lượt bàn giao.
        </p>
        <HandoverDocumentText document={previewDocument} />
      </aside>
    </div>
  );
}
