import { useSearchParams, Link } from "react-router-dom";
import type { ReactNode } from "react";
import { ArrowRight, Check } from "lucide-react";
import { ROUTES } from "@/shared/config/routes.config";
import { Button } from "@/shared/ui/button";
import { useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";
import { CreateGroupDialog } from "@/features/vault-management/ui/CreateGroupDialog";
import { usePlanSetup } from "@/features/plan-setup/model/usePlanSetup";

const PAGE_SIZE = 10;
const GOLD_BUTTON = "bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]";

/**
 * Tab "Nhóm" của Kho của tôi: danh sách nhóm và tạo nhóm. Người nhận được gắn theo nhóm.
 * Nút "Tạo nhóm" ở đầu trang do trang cha điều khiển qua `createOpen`.
 */
export function OwnerGroups({
  vaultId,
  createOpen,
  onCreateOpenChange,
}: {
  vaultId: string;
  createOpen: boolean;
  onCreateOpenChange: (open: boolean) => void;
}) {
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get("page") ?? 1);
  let page = 1;
  if (Number.isSafeInteger(requested) && requested >= 1 && requested <= 1_000_000) {
    page = requested;
  }
  const query = useOwnerPackages(vaultId, true, { pageIndex: page, pageSize: PAGE_SIZE });
  // Mục chưa thuộc nhóm nào sẽ không nằm trong phạm vi bàn giao; chỉ nhắc khi đã biết chắc.
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
        Đang tải danh sách nhóm…
      </p>
    );
  } else if (query.isError) {
    body = (
      <div role="alert" className="mt-4 space-y-3">
        <p className="text-sm">Không tải được danh sách nhóm.</p>
        <Button variant="outline" disabled={query.isFetching} onClick={() => void query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  } else if (query.data.items.length === 0) {
    let emptyTitle = "Bạn chưa có nhóm nào.";
    if (page > 1) {
      emptyTitle = "Trang này không có nhóm.";
    }
    body = (
      <div className="mt-6 space-y-3">
        <Check className="size-5 text-green-700" aria-hidden="true" />
        <p className="font-semibold">{emptyTitle}</p>
        <p className="text-sm text-heritage-muted">
          Nhóm gom các mục có cùng người nhận. Tạo nhóm trước, rồi thêm mục và gán người nhận.
        </p>
        {page === 1 && (
          <Button size="lg" className={GOLD_BUTTON} onClick={() => onCreateOpenChange(true)}>
            Tạo nhóm đầu tiên
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
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${statusStyle}`}>
            {statusLabel}
          </span>
          <Link
            to={ROUTES.DASHBOARD.GROUP_DETAIL(group.id)}
            aria-label={`Mở nhóm ${group.name}`}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[20px] border border-[#B68F4C] bg-[#E0C486] px-5 text-sm font-semibold text-[#0A281E] transition-colors hover:bg-[#E6C98B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heritage-gold"
          >
            Mở nhóm
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </li>,
      );
    }
    body = (
      <>
        <ul className="mt-2">{rows}</ul>
        {(page > 1 || query.data.hasNextPage) && (
          <nav
            aria-label="Phân trang nhóm"
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
  if (planSetup.data) {
    outsideCount = planSetup.data.assetsOutsideContainer.length;
  }

  return (
    <div className="space-y-6">
      {outsideCount > 0 && (
        <p role="status" className="rounded-xl bg-[#F1E7D0] px-4 py-3 text-sm text-[#7A5B24]">
          Có {outsideCount} mục chưa thuộc nhóm nào. Những mục này chưa được giao cho ai và sẽ không
          nằm trong phạm vi bàn giao.
        </p>
      )}
      <section
        aria-label="Danh sách nhóm"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      >
        <h2 className="text-xl font-medium text-heritage-primary">Danh sách nhóm</h2>
        {body}
      </section>
      {createOpen && (
        <CreateGroupDialog vaultId={vaultId} onClose={() => onCreateOpenChange(false)} />
      )}
    </div>
  );
}
