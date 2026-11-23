import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CircleCheck, FileText, Lock, StickyNote, Users } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { SlidingTabs } from "@/shared/ui/SlidingTabs";
import { Chip, Initial, Panel } from "@/shared/ui/heritageKit";
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
}: {
  label: string;
  value: ReactNode;
  tone?: "neutral" | "warning" | "success";
}) {
  let valueClass = "text-heritage-primary";
  if (tone === "warning") {
    valueClass = "text-heritage-warning";
  }
  if (tone === "success") {
    valueClass = "text-heritage-success";
  }
  return (
    <div className="rounded-xl border border-heritage-border bg-white px-4 py-3">
      <dt className="text-sm text-heritage-muted">{label}</dt>
      <dd className={`mt-1 text-2xl font-semibold ${valueClass}`}>{value}</dd>
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

function RecipientCard({ card }: { card: RecipientAssignmentCard }) {
  const lines: ReactNode[] = [];
  for (const item of card.assets) {
    lines.push(
      <li key={item.asset.id} className="flex items-center justify-between gap-3 py-2">
        <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-heritage-primary">
          <KindIcon kind={item.asset.kind} />
          <span className="break-words">{item.asset.name}</span>
        </span>
        {item.sharedWithCount > 1 && (
          <Chip tone="neutral" className="text-xs">
            Chung với {item.sharedWithCount - 1} người
          </Chip>
        )}
      </li>,
    );
  }
  return (
    <li className="rounded-2xl border border-heritage-border bg-white p-5">
      <div className="flex items-center gap-3">
        <Initial name={card.recipient.fullName} />
        <div className="min-w-0">
          <p className="break-words text-base font-semibold text-heritage-primary">
            {card.recipient.fullName}
          </p>
          <p className="text-sm text-heritage-muted">CCCD {card.recipient.citizenId}</p>
        </div>
      </div>
      {card.assets.length === 0 && (
        <p className="mt-4 rounded-xl bg-heritage-sunken px-4 py-3 text-sm text-heritage-muted">
          Chưa được gán tài sản nào. Người này sẽ không nhận gì khi bàn giao.
        </p>
      )}
      {card.assets.length > 0 && <ul className="mt-3 divide-y divide-heritage-border">{lines}</ul>}
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
        <ul className="grid gap-4 md:grid-cols-2">
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
          <Stat label="Đã gán" value={`${summary.assignedAssets}/${summary.totalAssets}`} />
          <Stat label="Người nhận" value={summary.recipientCount} />
          <Stat
            label="Chưa gán cho ai"
            value={
              <span className="inline-flex items-center gap-2">
                {summary.unassignedAssets}
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
