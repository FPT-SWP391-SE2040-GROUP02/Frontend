import { useSearchParams, Link } from "react-router-dom";
import { useState, type ReactNode } from "react";
import { Check, Pencil } from "lucide-react";
import type { PackageResponse } from "@/entities/package/model/package.types";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { buttonStyles } from "@/shared/ui/heritageKit";
import { useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";
import { PackageDialog } from "./PackageDialog";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";

const PAGE_SIZE = 10;
/** Lý do gói chưa sẵn sàng (mã Backend `missingRequirements` của gói); mã lạ vẫn báo còn thiếu để không giấu điều kiện. */
const MISSING_LABELS: Record<string, string> = {
  NO_ASSET: "chưa có mục nào",
  NO_DESIGNATION: "chưa có người nhận",
};
const GOLD_BUTTON =
  "bg-heritage-gold-soft font-semibold text-heritage-on-gold shadow-none hover:bg-heritage-gold-soft-hover";

/**
 * Tab "Gói bàn giao" của Kho của tôi: danh sách gói bàn giao, tạo gói và chỉnh sửa gói ngay trong hộp thoại.
 * Người nhận được gắn theo gói bàn giao. Nút "Tạo gói bàn giao" ở đầu trang do trang cha điều khiển qua `createOpen`;
 * không truyền thì không tạo được. Nút "Chỉnh sửa bàn giao" của từng gói luôn có.
 */
export function OwnerGroups({
  vaultId,
  createOpen = false,
  onCreateOpenChange,
}: {
  vaultId: string;
  createOpen?: boolean;
  /** Bỏ trống khi trang không cho tạo gói bàn giao (chỉ xem/cập nhật): ẩn nút và hộp thoại tạo. */
  onCreateOpenChange?: (open: boolean) => void;
}) {
  const [params, setParams] = useSearchParams();
  /** Gói đang được chỉnh sửa trong hộp thoại; null khi không mở. */
  const [editing, setEditing] = useState<PackageResponse | null>(null);
  const requested = Number(params.get("page") ?? 1);
  let page = 1;
  if (Number.isSafeInteger(requested) && requested >= 1 && requested <= 1_000_000) {
    page = requested;
  }
  const query = useOwnerPackages(vaultId, true, { pageIndex: page, pageSize: PAGE_SIZE });
  // Mục chưa thuộc gói bàn giao nào sẽ không nằm trong phạm vi bàn giao; chỉ nhắc khi đã biết chắc.
  const planSetup = usePlanSetup(vaultId);

  function goTo(value: number): void {
    const next = new URLSearchParams(params);
    next.set("page", String(value));
    setParams(next);
  }

  let body: ReactNode;
  if (query.isPending) {
    body = (
      <p role="status" className="mt-4 text-sm text-heritage-muted">
        Đang tải danh sách gói bàn giao…
      </p>
    );
  } else if (query.isError) {
    body = (
      <div role="alert" className="mt-4 space-y-3">
        <p className="text-sm">Không tải được danh sách gói bàn giao.</p>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  } else if (query.data.items.length === 0) {
    let emptyTitle = "Bạn chưa có gói bàn giao nào.";
    if (page > 1) {
      emptyTitle = "Trang này không có gói bàn giao.";
    }
    body = (
      <div className="mt-6 space-y-3">
        <Check className="size-5 text-green-700" aria-hidden="true" />
        <p className="font-semibold">{emptyTitle}</p>
        <p className="text-sm text-heritage-muted">
          Gói bàn giao gom các tài sản và người nhận có chung mục đích chuyển giao di sản.
        </p>
        {page === 1 && onCreateOpenChange && (
          <Button size="lg" className={GOLD_BUTTON} onClick={() => onCreateOpenChange(true)}>
            Tạo gói bàn giao đầu tiên
          </Button>
        )}
      </div>
    );
  } else {
    const rows: ReactNode[] = [];
    for (const group of query.data.items) {
      let statusLabel = "Chưa sẵn sàng";
      let statusStyle = "bg-amber-100 text-amber-800";
      if (group.status === "READY") {
        statusLabel = "Sẵn sàng";
        statusStyle = "bg-green-100 text-green-800";
      }
      // Lý do còn thiếu lấy từ kế hoạch (cùng cache với menu); chưa tải được thì chỉ hiện chip trạng thái.
      const reasons: string[] = [];
      if (planSetup.data && group.status !== "READY") {
        for (const container of planSetup.data.containers) {
          if (container.id !== group.id) {
            continue;
          }
          for (const code of container.missingRequirements) {
            let reason = "còn thiếu điều kiện";
            if (Object.hasOwn(MISSING_LABELS, code)) {
              reason = MISSING_LABELS[code];
            }
            reasons.push(reason);
          }
        }
      }
      rows.push(
        <li
          key={group.id}
          className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-heritage-border py-4 last:border-b-0"
        >
          <div className="min-w-0 flex-1">
            <p className="break-words font-semibold">{group.name}</p>
            <p className="text-xs text-heritage-muted">
              {group.assetIds.length} mục · {group.beneficiaryIds.length} người nhận
            </p>
            {reasons.length > 0 && (
              <p className="mt-1 text-xs text-amber-800">Chưa sẵn sàng: {reasons.join(", ")}.</p>
            )}
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>
            {statusLabel}
          </span>
          <button
            type="button"
            aria-label={`Chỉnh sửa bàn giao ${group.name}`}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[20px] border border-heritage-gold bg-heritage-gold-soft px-5 text-sm font-semibold text-heritage-on-gold transition-colors hover:bg-heritage-gold-soft-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
            onClick={() => setEditing(group)}
          >
            Chỉnh sửa bàn giao
            <Pencil className="size-4" aria-hidden="true" />
          </button>
        </li>,
      );
    }
    body = (
      <>
        <ul className="mt-2">{rows}</ul>
        {(page > 1 || query.data.hasNextPage) && (
          <nav
            aria-label="Phân trang gói bàn giao"
            className="mt-4 flex items-center justify-between gap-3"
          >
            <Button
              variant="outline"
              disabled={page === 1 || query.isFetching}
              onClick={() => goTo(page - 1)}
            >
              Trang trước
            </Button>
            <span className="text-sm">Trang {page}</span>
            <Button
              variant="outline"
              disabled={!query.data.hasNextPage || query.isFetching}
              onClick={() => goTo(page + 1)}
            >
              Trang sau
            </Button>
          </nav>
        )}
      </>
    );
  }

  let outsideCount = 0;
  let planIsDraft = false;
  if (planSetup.data) {
    outsideCount = planSetup.data.assetsOutsideContainer.length;
    // Kế hoạch là của cả kho, không của riêng gói nào: chỉ một lối vào bước kích hoạt, và chỉ khi còn nháp.
    planIsDraft = planSetup.data.planStatus === "DRAFT";
  }

  return (
    <div className="space-y-6">
      {outsideCount > 0 && (
        <p
          role="status"
          className="rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning"
        >
          Có {outsideCount} mục chưa thuộc gói bàn giao nào. Những mục này chưa được giao cho ai và
          sẽ không nằm trong phạm vi bàn giao.
        </p>
      )}
      <section
        aria-label="Danh sách gói bàn giao"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-medium text-heritage-primary">Danh sách gói bàn giao</h2>
          <div className="flex flex-wrap items-center gap-3">
            {planIsDraft && (
              <Link to={`${ROUTES.SETUP}?step=activate`} className={buttonStyles.dark}>
                Kích hoạt kế hoạch
              </Link>
            )}
          </div>
        </div>
        {body}
      </section>
      {createOpen && onCreateOpenChange && (
        <PackageDialog vaultId={vaultId} onClose={() => onCreateOpenChange(false)} />
      )}
      {editing !== null && (
        <PackageDialog
          key={editing.id}
          vaultId={vaultId}
          existing={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
