import { useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import {
  DOCUMENT_KIND_LABELS,
  HandoverDocumentText,
  formatDocumentDate,
  useVerifierDocuments,
  vietnamDayOf,
  type HandoverDocument,
} from "@/entities/handoverDocument";
import { formatTimeThenDate } from "@/shared/lib/dateFormat";
import { buttonStyles, Chip } from "@/shared/ui/heritageKit";
import { groupSignedByVault, type VaultGroup } from "../model/recipientWork";

type KindFilter = "ALL" | "ACCEPT" | "DECLINE";

const KIND_FILTERS: ReadonlyArray<{ value: KindFilter; label: string }> = [
  { value: "ALL", label: "Tất cả" },
  { value: "ACCEPT", label: "Đồng ý nhận" },
  { value: "DECLINE", label: "Từ chối nhận" },
];

function normalize(text: string): string {
  return text.trim().toLocaleLowerCase("vi-VN");
}

function initialOf(name: string): string {
  const first = name.trim().charAt(0);
  if (!first) return "?";
  return first.toLocaleUpperCase("vi-VN");
}

function vaultSubtitle(group: VaultGroup): string {
  const parts: string[] = [];
  if (group.dateOfDeath) parts.push(`Mất ngày ${formatDocumentDate(group.dateOfDeath)}`);
  if (group.caseApprovedAt) {
    const day = vietnamDayOf(group.caseApprovedAt);
    parts.push(`Hồ sơ báo tin duyệt ngày ${day.day}/${day.month}/${day.year}`);
  }
  return parts.join(" · ");
}

/** Dòng một người nhận trong khung kho: tên, gói, loại văn bản, giờ hoàn tất và nút Xem. */
function DocumentRow({ document }: { document: HandoverDocument }) {
  const [open, setOpen] = useState(false);
  const name = document.recipient.fullName || "Người nhận";
  return (
    <li className="space-y-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-heritage-primary">{`${name} · ${document.containerName}`}</p>
          <p className="text-sm text-heritage-muted">
            {`${DOCUMENT_KIND_LABELS[document.kind]} · hoàn tất ${formatTimeThenDate(document.completedAt ?? document.createdAt)}`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {document.kind === "ACCEPT" ? (
            <Chip tone="success">Đồng ý nhận</Chip>
          ) : (
            <Chip tone="neutral">Từ chối nhận</Chip>
          )}
          <button
            type="button"
            className={buttonStyles.outline}
            aria-expanded={open}
            aria-label={`Xem biên bản của ${name}`}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Ẩn" : "Xem"}
          </button>
        </div>
      </div>
      {open && <HandoverDocumentText document={document} wide />}
    </li>
  );
}

/** Khung một kho: tiêu đề bấm để thu gọn hoặc mở, chip "Đã xong x/y người nhận" và các dòng người nhận. */
function VaultSection({
  group,
  rows,
  forceOpen,
}: {
  group: VaultGroup;
  rows: HandoverDocument[];
  forceOpen: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const expanded = forceOpen || !collapsed;
  const total = Math.max(group.totalCount, group.doneCount);
  const complete = group.doneCount >= total;
  const ownerName = group.ownerName || "Chủ kho";
  const contentId = `vault-${group.vaultId}`;
  return (
    <section
      aria-label={`Kho của ${ownerName}`}
      className="rounded-2xl border border-heritage-border bg-white shadow-sm"
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        className="flex w-full items-center justify-between gap-3 p-4 text-left focus-visible:outline-2 focus-visible:outline-heritage-gold"
        onClick={() => setCollapsed((value) => !value)}
      >
        <span className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#E0C486] font-semibold text-[#0A281E]"
          >
            {initialOf(ownerName)}
          </span>
          <span className="min-w-0">
            <span className="block font-semibold text-heritage-primary">{`Kho của ${ownerName}`}</span>
            <span className="block text-sm text-heritage-muted">{vaultSubtitle(group)}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3">
          <Chip tone={complete ? "success" : "warning"}>
            {`Đã xong ${group.doneCount}/${total} người nhận`}
          </Chip>
          {expanded ? (
            <ChevronDown className="size-5 text-heritage-muted" aria-hidden="true" />
          ) : (
            <ChevronRight className="size-5 text-heritage-muted" aria-hidden="true" />
          )}
        </span>
      </button>
      {expanded && (
        <ul
          id={contentId}
          className="divide-y divide-heritage-border border-t border-heritage-border px-4"
        >
          {rows.map((document) => (
            <DocumentRow key={document.id} document={document} />
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Mục Biên bản đã ký của Người xét duyệt: các biên bản đã hoàn tất, gom theo kho (kho mới nhất ở trên).
 * Ô tìm lọc ở máy: gõ tên Chủ kho thì hiện cả kho, gõ tên người nhận hoặc tên gói thì chỉ hiện dòng khớp.
 */
export function VerifierDocuments() {
  const query = useVerifierDocuments();
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<KindFilter>("ALL");
  if (query.isPending) return <p role="status">Đang tải các biên bản…</p>;
  if (query.isError) {
    return (
      <div role="alert" className="space-y-3">
        <p className="text-sm text-[#A32119]">
          Không tải được các biên bản. Bạn cần là Người xét duyệt đang hoạt động.
        </p>
        <button type="button" className={buttonStyles.outline} onClick={() => void query.refetch()}>
          Thử lại
        </button>
      </div>
    );
  }

  const groups = groupSignedByVault(query.data);
  const keyword = normalize(search);
  const visible: Array<{ group: VaultGroup; rows: HandoverDocument[]; wholeVault: boolean }> = [];
  for (const group of groups) {
    const ownerMatches = keyword.length > 0 && normalize(group.ownerName).includes(keyword);
    const rows: HandoverDocument[] = [];
    for (const document of group.documents) {
      if (kind !== "ALL" && document.kind !== kind) continue;
      let matches = true;
      if (keyword.length > 0 && !ownerMatches) {
        const text = normalize(`${document.recipient.fullName} ${document.containerName}`);
        matches = text.includes(keyword);
      }
      if (matches) rows.push(document);
    }
    if (rows.length > 0) visible.push({ group, rows, wholeVault: ownerMatches });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {KIND_FILTERS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={kind === option.value}
            className={
              kind === option.value
                ? "inline-flex min-h-11 items-center rounded-full bg-heritage-primary px-4 text-sm font-semibold text-white shadow-sm"
                : "inline-flex min-h-11 items-center rounded-full border border-heritage-border bg-white/60 px-4 text-sm hover:bg-[#F4F1E6]"
            }
            onClick={() => setKind(option.value)}
          >
            {option.label}
          </button>
        ))}
        <label className="relative ml-auto block min-w-56 flex-1 sm:max-w-sm">
          <span className="sr-only">Tìm Chủ kho, người nhận hoặc tên gói</span>
          <Search
            className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-heritage-muted"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            maxLength={64}
            placeholder="Tìm Chủ kho, người nhận hoặc tên gói"
            className="min-h-11 w-full rounded-xl border border-heritage-border bg-white pl-9 pr-3 text-sm"
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      {groups.length === 0 ? (
        <div
          role="status"
          className="space-y-1 rounded-2xl border border-heritage-border bg-white p-6"
        >
          <p className="font-semibold text-heritage-primary">Chưa có biên bản nào đã ký</p>
          <p className="text-sm text-heritage-muted">
            Chưa có biên bản nào trong các kho bạn đã duyệt hồ sơ báo tin. Biên bản xong sẽ hiện ở
            đây.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <p
          role="status"
          className="rounded-2xl border border-heritage-border bg-white p-6 text-sm text-heritage-muted"
        >
          Không có biên bản nào khớp. Thử gõ tên Chủ kho, tên người nhận hoặc tên gói khác, hoặc
          chọn Tất cả.
        </p>
      ) : (
        <div className="space-y-4">
          {visible.map(({ group, rows, wholeVault }) => (
            <VaultSection
              key={group.vaultId}
              group={group}
              rows={rows}
              forceOpen={keyword.length > 0 && !wholeVault}
            />
          ))}
        </div>
      )}
    </div>
  );
}
