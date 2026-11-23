import { useId, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, CircleCheck, FileText, Lock, StickyNote, Users } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { SlidingTabs } from "@/shared/ui/SlidingTabs";
import { Chip, Initial, Panel } from "@/shared/ui/heritageKit";
import { RollingNumber, VaultDial } from "@/shared/ui/VaultFx";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { useAssignments } from "@/features/assignments/model/useAssignments";
import {
  assetKindLabel,
  buildAssetRows,
  buildRecipientCards,
  currentRecipientIds,
  summarizeAssignments,
  type AssetAssignmentRow,
  type AssignableAsset,
  type AssignableRecipient,
  type RecipientAssignmentCard,
} from "@/features/assignments/model/assignmentView";
import { AssignAssetDialog } from "@/features/assignments/ui/AssignAssetDialog";

/** Một kho cho phép hàng trăm tài sản; một trang 100 dòng đủ cho màn phân chia hiện tại. */
const LOOKUP_PAGE = { pageIndex: 1, pageSize: 100 };
const SMALL_OUTLINE =
  "inline-flex min-h-11 items-center justify-center rounded-xl border border-heritage-border-strong bg-white px-4 text-sm font-semibold text-heritage-primary transition-colors hover:bg-heritage-sunken focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:pointer-events-none disabled:opacity-50";
const SMALL_DARK =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-heritage-primary px-4 text-sm font-semibold text-white transition-colors hover:bg-heritage-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold disabled:pointer-events-none disabled:opacity-50";

type ViewKey = "assets" | "recipients";
const VIEWS = [
  { key: "assets" as const, label: "Theo tài sản" },
  { key: "recipients" as const, label: "Theo người nhận" },
];

function KindIcon({ kind }: { kind: string }) {
  let icon = <StickyNote className="size-5" aria-hidden="true" />;
  if (kind === "FILE") {
    icon = <FileText className="size-5" aria-hidden="true" />;
  }
  return (
    <span
      aria-hidden="true"
      className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-heritage-sunken text-heritage-primary"
    >
      {icon}
    </span>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
  gauge,
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "warning" | "success";
  /** Đồng hồ quay số đặt bên phải ô; chỉ trang trí. */
  gauge?: ReactNode;
}) {
  let valueClass = "text-heritage-primary";
  if (tone === "warning") {
    valueClass = "text-heritage-warning";
  }
  if (tone === "success") {
    valueClass = "text-heritage-success";
  }
  return (
    <div className="relative rounded-xl border border-heritage-border bg-white px-4 py-3">
      <dt className="text-sm text-heritage-muted">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold ${valueClass}`}>
        {value}
        {gauge && <span className="absolute right-3.5 top-1/2 -translate-y-1/2">{gauge}</span>}
      </dd>
    </div>
  );
}

function AssetRow({
  row,
  locked,
  lockReason,
  onEdit,
}: {
  row: AssetAssignmentRow;
  locked: boolean;
  lockReason: string | null;
  onEdit: (asset: AssignableAsset) => void;
}) {
  const unassigned = row.recipients.length === 0;
  const people: ReactNode[] = [];
  for (const person of row.recipients) {
    people.push(
      <li
        key={person.id}
        className="flex items-center gap-2 rounded-full bg-heritage-sunken py-1 pl-1 pr-3 text-sm font-medium text-heritage-primary"
      >
        <Initial name={person.fullName} className="size-6 text-xs" />
        <span className="max-w-40 truncate">{person.fullName}</span>
      </li>,
    );
  }
  let borderClass = "border-l-transparent";
  if (unassigned) {
    borderClass = "border-l-heritage-gold";
  }
  return (
    <li
      className={`grid gap-3 border-l-4 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-center sm:gap-5 ${borderClass}`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <KindIcon kind={row.asset.kind} />
        <div className="min-w-0">
          <p className="break-words text-base font-semibold text-heritage-primary">
            {row.asset.name}
          </p>
          <p className="text-sm text-heritage-muted">{assetKindLabel(row.asset.kind)}</p>
        </div>
      </div>
      <div className="min-w-0">
        {unassigned && <Chip tone="warning">Chưa gán cho ai</Chip>}
        {!unassigned && (
          <div className="space-y-2">
            <ul className="flex flex-wrap gap-2" aria-label={`Người nhận ${row.asset.name}`}>
              {people}
            </ul>
            {row.recipients.length > 1 && (
              <p className="flex items-center gap-1.5 text-sm text-heritage-muted">
                <Users className="size-4" aria-hidden="true" />
                Nhận chung, {row.recipients.length} người cùng ký
              </p>
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        className={unassigned ? SMALL_DARK : SMALL_OUTLINE}
        disabled={locked}
        title={lockReason ?? undefined}
        aria-label={`${unassigned ? "Chọn" : "Sửa"} người nhận cho ${row.asset.name}`}
        onClick={() => onEdit(row.asset)}
      >
        {unassigned ? "Chọn người nhận" : "Sửa người nhận"}
      </button>
    </li>
  );
}

/** Biểu tượng loại tài sản không nền, dùng trong danh sách gọn của từng người nhận. */
function KindGlyph({ kind }: { kind: string }) {
  if (kind === "FILE") {
    return <FileText className="size-5 text-heritage-muted" aria-hidden="true" />;
  }
  return <StickyNote className="size-5 text-heritage-muted" aria-hidden="true" />;
}

/**
 * Một người nhận trên danh sách "Theo người nhận": hàng gọn, đường kẻ mảnh, tài sản của người đó thu lại sau nút
 * "N tài sản" và trượt ra khi mở. Người chưa được gán gì có nền ấm nhạt để dễ thấy. Phần thu lại dùng `inert` nên
 * không nhận tiêu điểm bàn phím và trình đọc màn hình bỏ qua cho tới khi mở.
 */
function RecipientCard({ card }: { card: RecipientAssignmentCard }) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  const count = card.assets.length;
  const none = count === 0;
  const lines: ReactNode[] = [];
  for (const item of card.assets) {
    lines.push(
      <li
        key={item.asset.id}
        className="grid grid-cols-[1.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-0.5 py-2 sm:grid-cols-[1.5rem_minmax(0,1fr)_7rem_9.5rem]"
      >
        <span className="row-span-2 sm:row-span-1">
          <KindGlyph kind={item.asset.kind} />
        </span>
        <span className="break-words text-sm font-medium text-heritage-primary">
          {item.asset.name}
        </span>
        <span className="col-start-2 text-sm text-heritage-muted sm:col-start-auto">
          {assetKindLabel(item.asset.kind)}
        </span>
        <span className="col-start-2 sm:col-start-auto sm:justify-self-end">
          {item.sharedWithCount > 1 && (
            <span className="inline-flex items-center gap-1.5 text-xs text-heritage-muted">
              <Users className="size-3.5" aria-hidden="true" />
              Chung với {item.sharedWithCount - 1} người
            </span>
          )}
        </span>
      </li>,
    );
  }
  let itemClass = "border-t border-heritage-border first:border-t-0";
  let rowClass = "rounded-xl px-3 py-3 transition-colors hover:bg-heritage-sunken/60";
  if (none) {
    itemClass = "pt-2";
    rowClass = "rounded-xl bg-heritage-gold/10 px-3 py-3 ring-1 ring-inset ring-heritage-gold/25";
  }
  let chevronClass = "size-4 transition-transform duration-200 motion-reduce:transition-none";
  let bodyClass =
    "grid grid-rows-[0fr] transition-[grid-template-rows] duration-200 motion-reduce:transition-none";
  if (open) {
    chevronClass += " rotate-180";
    bodyClass =
      "grid grid-rows-[1fr] transition-[grid-template-rows] duration-200 motion-reduce:transition-none";
  }
  return (
    <li className={itemClass}>
      <div className={rowClass}>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-56 flex-1 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-heritage-gold text-base font-medium text-heritage-gold-hover"
            >
              {card.recipient.fullName.trim().charAt(0).toLocaleUpperCase("vi-VN") || "?"}
            </span>
            <div className="min-w-0">
              <p className="break-words text-base font-medium text-heritage-primary">
                {card.recipient.fullName}
              </p>
              <p className="text-sm text-heritage-muted">CCCD {card.recipient.citizenId}</p>
            </div>
          </div>
          {none && (
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-2 font-medium text-heritage-warning">
                <span className="size-1.5 rounded-full bg-heritage-gold" aria-hidden="true" />
                Chưa được gán tài sản nào
              </span>
              <span className="text-heritage-muted">Sẽ không nhận gì khi bàn giao.</span>
            </p>
          )}
          {!none && (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={bodyId}
              aria-label={`${count} tài sản của ${card.recipient.fullName}`}
              onClick={() => setOpen(!open)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-heritage-muted transition-colors hover:bg-heritage-sunken hover:text-heritage-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
            >
              <b className="font-medium text-heritage-primary">{count}</b> tài sản
              <ChevronDown className={chevronClass} aria-hidden="true" />
            </button>
          )}
        </div>
        {!none && (
          <div id={bodyId} className={bodyClass} inert={!open}>
            <div className="min-h-0 overflow-hidden">
              <ul className="mt-2 ml-5 border-l border-heritage-border pl-4">{lines}</ul>
            </div>
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * Tab "Phân chia" của Kho của tôi: Chủ kho gán từng tài sản cho từng người nhận. Tài sản gán cho nhiều người
 * thì những người đó nhận chung. Hai cách nhìn trên cùng dữ liệu: theo tài sản (để gán) và theo người nhận (để kiểm lại).
 */
export function OwnerAssignments({
  vaultId,
  lockReason = null,
}: {
  vaultId: string;
  /** Lý do kho đang bị khóa; khác null thì không gán hay sửa được. */
  lockReason?: string | null;
}) {
  const [view, setView] = useState<ViewKey>("assets");
  const [editing, setEditing] = useState<AssignableAsset | null>(null);
  const assignments = useAssignments(vaultId);
  const assetQuery = useVaultAssets(vaultId, LOOKUP_PAGE);
  const beneficiaryQuery = useBeneficiaries(vaultId, LOOKUP_PAGE);
  const locked = lockReason !== null;

  if (assignments.isPending || assetQuery.isPending || beneficiaryQuery.isPending) {
    return (
      <p role="status" className="text-sm text-heritage-muted">
        Đang tải phần phân chia tài sản…
      </p>
    );
  }
  if (assignments.isError || assetQuery.isError || beneficiaryQuery.isError) {
    return (
      <div
        role="alert"
        className="space-y-3 rounded-xl border border-heritage-danger-border bg-heritage-danger-bg p-6"
      >
        <p className="text-sm text-heritage-danger">Không tải được phần phân chia tài sản.</p>
        <Button
          variant="outline"
          onClick={() => {
            void assignments.refetch();
            void assetQuery.refetch();
            void beneficiaryQuery.refetch();
          }}
        >
          Thử lại
        </Button>
      </div>
    );
  }

  const assets: AssignableAsset[] = assetQuery.data.items.map((item) => ({
    id: item.id,
    name: item.name,
    kind: item.kind,
  }));
  const recipients: AssignableRecipient[] = beneficiaryQuery.data.items.map((item) => ({
    id: item.id,
    fullName: item.fullName,
    citizenId: item.citizenId,
  }));
  const summary = summarizeAssignments(assets, assignments.data);

  let body: ReactNode;
  if (assets.length === 0) {
    body = (
      <div className="rounded-xl border border-dashed border-heritage-border px-6 py-10 text-center">
        <p className="font-semibold text-heritage-primary">Kho chưa có tài sản nào.</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-heritage-muted">
          Thêm tài sản ở tab “Mục trong kho”, rồi quay lại đây để chọn ai sẽ nhận.
        </p>
        <Link
          to={ROUTES.DASHBOARD.ASSETS}
          className="mt-4 inline-flex min-h-11 items-center text-sm font-semibold text-heritage-primary underline decoration-heritage-gold underline-offset-4"
        >
          Về mục trong kho
        </Link>
      </div>
    );
  } else if (view === "assets") {
    const rows = buildAssetRows(assets, recipients, assignments.data);
    body = (
      <ul className="divide-y divide-heritage-border overflow-hidden rounded-xl border border-heritage-border bg-white">
        {rows.map((row) => (
          <AssetRow
            key={row.asset.id}
            row={row}
            locked={locked}
            lockReason={lockReason}
            onEdit={setEditing}
          />
        ))}
      </ul>
    );
  } else {
    const cards = buildRecipientCards(assets, recipients, assignments.data);
    if (cards.length === 0) {
      body = (
        <div className="rounded-xl border border-dashed border-heritage-border px-6 py-10 text-center">
          <p className="font-semibold text-heritage-primary">Kho chưa có người nhận nào.</p>
          <Link
            to={ROUTES.DASHBOARD.BENEFICIARIES}
            className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-heritage-primary underline decoration-heritage-gold underline-offset-4"
          >
            Thêm người nhận
          </Link>
        </div>
      );
    } else {
      body = (
        <ul aria-label="Người nhận và tài sản được gán">
          {cards.map((card) => (
            <RecipientCard key={card.recipient.id} card={card} />
          ))}
        </ul>
      );
    }
  }

  let unassignedTone: "warning" | "success" | "neutral" = "neutral";
  if (summary.totalAssets > 0) {
    unassignedTone = "success";
    if (summary.unassignedAssets > 0) {
      unassignedTone = "warning";
    }
  }

  return (
    <Panel title="Phân chia tài sản" labelledBy="assignment-board-title">
      <div className="space-y-5">
        <p className="max-w-2xl text-sm text-heritage-muted">
          Chọn từng tài sản sẽ về tay ai. Tài sản gán cho nhiều người thì những người đó{" "}
          <strong className="font-semibold text-heritage-primary">nhận chung</strong> và cùng ký
          biên bản. Tài sản chưa gán cho ai sẽ không nằm trong phạm vi bàn giao.
        </p>
        {locked && (
          <p
            role="status"
            className="flex items-center gap-2 rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning"
          >
            <Lock className="size-4 shrink-0" aria-hidden="true" />
            {lockReason}
          </p>
        )}
        <dl className="grid gap-3 sm:grid-cols-3">
          <Stat
            label="Đã gán"
            value={<RollingNumber value={`${summary.assignedAssets}/${summary.totalAssets}`} />}
            gauge={
              <VaultDial
                fraction={
                  summary.totalAssets > 0 ? summary.assignedAssets / summary.totalAssets : 0
                }
                complete={unassignedTone === "success"}
              />
            }
          />
          <Stat
            label="Người nhận"
            value={<RollingNumber value={String(summary.recipientCount)} />}
          />
          <Stat
            label="Chưa gán cho ai"
            value={
              <span className="inline-flex items-center gap-2">
                <RollingNumber value={String(summary.unassignedAssets)} />
                {unassignedTone === "success" && (
                  <CircleCheck className="size-5" aria-label="Đã gán hết" />
                )}
              </span>
            }
            tone={unassignedTone}
          />
        </dl>
        {assets.length > 0 && (
          <SlidingTabs label="Cách xem" tabs={VIEWS} value={view} onChange={setView} />
        )}
        {body}
      </div>
      {editing && (
        <AssignAssetDialog
          vaultId={vaultId}
          asset={editing}
          recipients={recipients}
          currentIds={currentRecipientIds(editing.id, assignments.data)}
          onClose={() => setEditing(null)}
        />
      )}
    </Panel>
  );
}
