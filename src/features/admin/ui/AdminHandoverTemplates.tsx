import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  HandoverDocumentText,
  sampleHandoverDocument,
  type DocumentKind,
  type TemplateAlign,
  type TemplateParagraph,
} from "@/entities/handoverDocument";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { ListPill } from "@/shared/ui/listKit";
import { adminService } from "../api/adminService";
import type { HandoverTemplate, HandoverTemplateVersion } from "../model/admin.schema";
import { useAdminAction } from "../model/useAdminAction";
import {
  adminKeys,
  useAdminHandoverTemplate,
  useAdminHandoverTemplateVersions,
} from "../model/useAdmin";
import { formatDateTime } from "../model/admin.content";
import { AdminErrorMessage } from "./AdminStateMessage";

const NOTICE_MAX = 500;
const NOTE_MAX = 300;
const PARAGRAPH_MAX = 2000;

const ALIGN_LABELS: Record<TemplateAlign, string> = {
  left: "Trái",
  center: "Giữa",
  justify: "Đều hai bên",
};

interface DraftParagraph {
  id: number;
  text: string;
  align: TemplateAlign;
  bold: boolean;
}

interface Draft {
  accept: DraftParagraph[];
  decline: DraftParagraph[];
  declineNotice: string;
}

type TabKey = "accept" | "decline";

const TABS: ReadonlyArray<{ key: TabKey; label: string; kind: DocumentKind }> = [
  { key: "accept", label: "Biên bản đồng ý nhận", kind: "ACCEPT" },
  { key: "decline", label: "Văn bản từ chối nhận", kind: "DECLINE" },
];

let nextId = 1;

function withIds(paragraphs: TemplateParagraph[]): DraftParagraph[] {
  return paragraphs.map((paragraph) => ({ ...paragraph, id: nextId++ }));
}

function withoutIds(paragraphs: DraftParagraph[]): TemplateParagraph[] {
  return paragraphs.map(({ text, align, bold }) => ({ text, align, bold }));
}

function toDraft(content: {
  accept: TemplateParagraph[];
  decline: TemplateParagraph[];
  declineNotice: string;
}): Draft {
  return {
    accept: withIds(content.accept),
    decline: withIds(content.decline),
    declineNotice: content.declineNotice,
  };
}

function snapshot(draft: Draft): string {
  return JSON.stringify({
    accept: withoutIds(draft.accept),
    decline: withoutIds(draft.decline),
    declineNotice: draft.declineNotice,
  });
}

/** Các lỗi người dùng phải sửa trước khi lưu; cùng luật với Backend (đoạn trống, trường lạ, quá dài). */
function findProblems(draft: Draft, knownTokens: Set<string>): string[] {
  const problems: string[] = [];
  const lists: Array<{ label: string; items: DraftParagraph[] }> = [
    { label: "Biên bản đồng ý", items: draft.accept },
    { label: "Văn bản từ chối", items: draft.decline },
  ];
  for (const list of lists) {
    if (list.items.length === 0) problems.push(`${list.label} phải có ít nhất một đoạn.`);
    list.items.forEach((item, index) => {
      const where = `${list.label}, đoạn ${index + 1}`;
      if (item.text.trim().length === 0)
        problems.push(`${where}: đang trống (xóa đoạn nếu không cần).`);
      if (item.text.length > PARAGRAPH_MAX)
        problems.push(`${where}: tối đa ${PARAGRAPH_MAX} ký tự.`);
      for (const match of item.text.matchAll(/\{([A-Za-z_]+)\}/g)) {
        if (!knownTokens.has(match[1]))
          problems.push(`${where}: trường {${match[1]}} không có trong danh sách trường.`);
      }
    });
  }
  if (draft.declineNotice.trim().length === 0)
    problems.push("Câu báo khi người nhận từ chối đang trống.");
  return problems;
}

const FIELD =
  "w-full rounded-lg border border-heritage-border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none";
const SMALL_BUTTON =
  "inline-flex min-h-9 items-center gap-1 rounded-lg border border-heritage-border bg-white px-2.5 text-xs font-semibold text-heritage-primary hover:bg-heritage-primary/5 disabled:opacity-40";

/**
 * Trang Admin sửa cả biên bản đồng ý nhận và văn bản từ chối: sửa từng đoạn, chèn trường lấy từ dữ liệu biên bản, xem trước ngay,
 * lưu thành phiên bản mới và xem lại các phiên bản cũ. Biên bản đã tạo giữ nguyên chữ của phiên bản lúc tạo.
 */
export function AdminHandoverTemplates() {
  const query = useAdminHandoverTemplate();
  const versions = useAdminHandoverTemplateVersions();
  const [notice, setNotice] = useState("");

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
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
        >
          {notice}
        </p>
      )}
      <TemplateEditor
        key={query.data.version ?? "default"}
        template={query.data}
        versions={versions.data ?? []}
        onSaved={(version) =>
          setNotice(
            `Đã lưu phiên bản ${version}. Biên bản tạo từ giờ dùng mẫu này; biên bản đã tạo giữ nguyên chữ cũ.`,
          )
        }
      />
    </div>
  );
}

function TemplateEditor({
  template,
  versions,
  onSaved,
}: {
  template: HandoverTemplate;
  versions: HandoverTemplateVersion[];
  onSaved: (version: number) => void;
}) {
  const client = useQueryClient();
  const action = useAdminAction();
  const [draft, setDraft] = useState<Draft>(() => toDraft(template));
  const [baseline] = useState(() => snapshot(toDraft(template)));
  const [tab, setTab] = useState<TabKey>("accept");
  const [note, setNote] = useState("");
  const [loadMessage, setLoadMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const focus = useRef<{ id: number; start: number; end: number } | null>(null);

  const knownTokens = new Set(template.tokens.map((token) => token.token));
  const problems = findProblems(draft, knownTokens);
  const dirty = snapshot(draft) !== baseline;
  const list = draft[tab];
  const kind = TABS.find((item) => item.key === tab)?.kind ?? "ACCEPT";

  function setList(items: DraftParagraph[]) {
    setDraft({ ...draft, [tab]: items });
  }
  function update(id: number, patch: Partial<DraftParagraph>) {
    setList(list.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }
  function move(index: number, step: number) {
    const target = index + step;
    if (target < 0 || target >= list.length) return;
    const copy = [...list];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    setList(copy);
  }
  function remove(id: number) {
    setList(list.filter((item) => item.id !== id));
  }
  function addAfter(index: number) {
    const copy = [...list];
    copy.splice(index + 1, 0, { id: nextId++, text: "", align: "justify", bold: false });
    setList(copy);
  }
  function insertToken(token: string) {
    const place = focus.current;
    const target = list.find((item) => item.id === place?.id);
    if (!place || !target) {
      setLoadError("Bấm vào đoạn cần chèn trường trước, rồi bấm trường.");
      return;
    }
    setLoadError("");
    const text = `${target.text.slice(0, place.start)}{${token}}${target.text.slice(place.end)}`;
    update(target.id, { text });
    focus.current = {
      id: place.id,
      start: place.start + token.length + 2,
      end: place.start + token.length + 2,
    };
  }
  function restoreDefault() {
    setDraft(toDraft(template.default));
    setLoadError("");
    setLoadMessage("Đã nạp mẫu gốc vào trang sửa. Bấm Lưu để dùng.");
  }
  async function loadVersion(version: number) {
    setLoadError("");
    try {
      const old = await adminService.getHandoverTemplateVersion(version);
      setDraft(toDraft(old));
      setLoadMessage(`Đã nạp phiên bản ${version} vào trang sửa. Bấm Lưu để dùng lại bản này.`);
    } catch {
      setLoadMessage("");
      setLoadError("Không nạp được phiên bản này. Tải lại trang rồi thử lại.");
    }
  }
  function save() {
    setLoadMessage("");
    void action.execute(
      () =>
        adminService.saveHandoverTemplate({
          accept: withoutIds(draft.accept),
          decline: withoutIds(draft.decline),
          declineNotice: draft.declineNotice.trim(),
          note: note.trim() || undefined,
        }),
      (saved) => {
        setNote("");
        void client.invalidateQueries({ queryKey: adminKeys.handoverTemplate() });
        void client.invalidateQueries({ queryKey: adminKeys.handoverTemplateVersions() });
        onSaved(saved.version ?? 0);
      },
    );
  }

  const previewDocument = sampleHandoverDocument(kind, withoutIds(list), draft.declineNotice);
  let versionText = "Mẫu gốc trong hệ thống (chưa có bản nào được lưu)";
  if (template.version !== null) versionText = `Phiên bản ${template.version} đang dùng`;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <section aria-label="Sửa mẫu biên bản" className="space-y-4">
        <div className="rounded-2xl border border-heritage-border bg-[#faf9f5] p-5 space-y-2">
          <p className="text-sm font-semibold text-heritage-primary">{versionText}</p>
          <p className="text-sm leading-6 text-heritage-muted">
            Sửa chữ khi luật thay đổi. Chỗ có dạng {"{HO_TEN_NGUOI_NHAN}"} là trường tự điền từ dữ
            liệu biên bản, đừng xóa dấu ngoặc. Lưu xong, biên bản tạo mới dùng mẫu này; biên bản đã
            tạo giữ nguyên chữ của phiên bản lúc tạo.
          </p>
        </div>

        <div className="rounded-2xl border border-heritage-border bg-[#faf9f5] p-5 space-y-2">
          <label htmlFor="decline-notice" className="text-sm font-bold text-heritage-primary">
            Câu báo khi người nhận từ chối
          </label>
          <p className="text-xs text-heritage-muted">
            Hiện cho người nhận trước khi chọn, và in vào chỗ có trường {"{CAU_BAO_TU_CHOI}"} (mặc
            định là mục 8 của biên bản đồng ý).
          </p>
          <textarea
            id="decline-notice"
            rows={3}
            maxLength={NOTICE_MAX}
            value={draft.declineNotice}
            onChange={(event) => setDraft({ ...draft, declineNotice: event.target.value })}
            className={FIELD}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {TABS.map((item) => (
            <ListPill key={item.key} pressed={tab === item.key} onClick={() => setTab(item.key)}>
              {item.label}
            </ListPill>
          ))}
        </div>

        <div className="rounded-2xl border border-heritage-border bg-[#faf9f5] p-4 space-y-2">
          <p className="text-sm font-semibold text-heritage-primary">
            Chèn trường vào đoạn đang chọn
          </p>
          <div className="flex flex-wrap gap-2">
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
          {loadError && (
            <p role="alert" className="text-sm text-red-700">
              {loadError}
            </p>
          )}
        </div>

        <ol className="space-y-3">
          {list.map((item, index) => (
            <li
              key={item.id}
              className="space-y-2 rounded-xl border border-heritage-border bg-white p-3"
            >
              <label
                className="text-xs font-semibold text-heritage-muted"
                htmlFor={`para-${item.id}`}
              >
                Đoạn {index + 1}
              </label>
              <textarea
                id={`para-${item.id}`}
                rows={3}
                maxLength={PARAGRAPH_MAX}
                value={item.text}
                onChange={(event) => update(item.id, { text: event.target.value })}
                onFocus={(event) => {
                  focus.current = {
                    id: item.id,
                    start: event.target.selectionStart,
                    end: event.target.selectionEnd,
                  };
                }}
                onSelect={(event) => {
                  const area = event.currentTarget;
                  focus.current = {
                    id: item.id,
                    start: area.selectionStart,
                    end: area.selectionEnd,
                  };
                }}
                className={FIELD}
              />
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <label className="flex items-center gap-1.5">
                  Căn lề
                  <select
                    value={item.align}
                    onChange={(event) =>
                      update(item.id, { align: event.target.value as TemplateAlign })
                    }
                    className="rounded-lg border border-heritage-border bg-white px-2 py-1 text-sm"
                  >
                    {(Object.keys(ALIGN_LABELS) as TemplateAlign[]).map((align) => (
                      <option key={align} value={align}>
                        {ALIGN_LABELS[align]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={item.bold}
                    onChange={(event) => update(item.id, { bold: event.target.checked })}
                  />
                  Đậm
                </label>
                <span className="mx-1 h-5 w-px bg-heritage-border" aria-hidden="true" />
                <button
                  type="button"
                  className={SMALL_BUTTON}
                  disabled={index === 0}
                  aria-label={`Đưa đoạn ${index + 1} lên`}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp className="size-3.5" aria-hidden="true" /> Lên
                </button>
                <button
                  type="button"
                  className={SMALL_BUTTON}
                  disabled={index === list.length - 1}
                  aria-label={`Đưa đoạn ${index + 1} xuống`}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown className="size-3.5" aria-hidden="true" /> Xuống
                </button>
                <button
                  type="button"
                  className={SMALL_BUTTON}
                  aria-label={`Thêm đoạn dưới đoạn ${index + 1}`}
                  onClick={() => addAfter(index)}
                >
                  <Plus className="size-3.5" aria-hidden="true" /> Thêm đoạn
                </button>
                <button
                  type="button"
                  className={`${SMALL_BUTTON} text-red-700`}
                  aria-label={`Xóa đoạn ${index + 1}`}
                  onClick={() => remove(item.id)}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" /> Xóa
                </button>
              </div>
            </li>
          ))}
        </ol>
        {list.length === 0 && (
          <Button type="button" variant="outline" onClick={() => addAfter(-1)}>
            Thêm đoạn đầu tiên
          </Button>
        )}

        <div className="space-y-3 rounded-2xl border border-heritage-border bg-[#faf9f5] p-5">
          <label htmlFor="template-note" className="text-sm font-bold text-heritage-primary">
            Ghi chú về lần sửa (không bắt buộc)
          </label>
          <input
            id="template-note"
            type="text"
            maxLength={NOTE_MAX}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Ví dụ: Cập nhật theo luật mới có hiệu lực từ 01/01/2027"
            className={FIELD}
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
          {loadMessage && (
            <p role="status" className="text-sm text-heritage-muted">
              {loadMessage}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={action.pending || problems.length > 0 || !dirty}
              onClick={save}
              className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
            >
              {action.pending ? "Đang lưu…" : "Lưu thành phiên bản mới"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={restoreDefault}
              disabled={action.pending}
            >
              Khôi phục mẫu gốc
            </Button>
            {!dirty && (
              <span className="text-sm text-heritage-muted">Chưa có thay đổi để lưu.</span>
            )}
          </div>
        </div>
      </section>

      <aside aria-label="Xem trước và lịch sử" className="space-y-4 xl:sticky xl:top-4">
        <div className="space-y-2">
          <h2 className="text-base font-bold text-heritage-primary">Xem trước</h2>
          <p className="text-xs text-heritage-muted">
            Dữ liệu mẫu (tên, ngày, số căn cước giả). Biên bản thật điền từ dữ liệu của lượt bàn
            giao.
          </p>
          <HandoverDocumentText document={previewDocument} />
        </div>
        <div className="space-y-2 rounded-2xl border border-heritage-border bg-[#faf9f5] p-5">
          <h2 className="text-base font-bold text-heritage-primary">Lịch sử các lần lưu</h2>
          {versions.length === 0 && (
            <p className="text-sm text-heritage-muted">Chưa có lần lưu nào, đang dùng mẫu gốc.</p>
          )}
          <ul className="divide-y divide-heritage-border">
            {versions.map((item) => (
              <li
                key={item.version}
                className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm"
              >
                <span className="min-w-0">
                  <b>Phiên bản {item.version}</b>
                  <span className="ml-2 text-heritage-muted">
                    {formatDateTime(item.createdAt)}
                    {item.createdByName && ` · ${item.createdByName}`}
                  </span>
                  {item.note && <span className="block text-heritage-muted">{item.note}</span>}
                </span>
                <button
                  type="button"
                  className={SMALL_BUTTON}
                  aria-label={`Nạp phiên bản ${item.version} vào trang sửa`}
                  onClick={() => void loadVersion(item.version)}
                >
                  Nạp vào trang sửa
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
