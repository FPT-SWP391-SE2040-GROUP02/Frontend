import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useOwnerPackages,
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { AutoCreateVault } from "@/features/vault-management/ui/AutoCreateVault";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { BeneficiaryForm } from "@/features/beneficiaries/ui/BeneficiaryForm";
import { BeneficiaryRow, EditBeneficiaryDialog } from "@/features/beneficiaries/ui/BeneficiaryRow";
import { beneficiaryResponseSchema } from "@/features/beneficiaries/model/beneficiary.schema";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles, Notice } from "@/shared/ui/heritageKit";
import { SideDrawer } from "@/shared/ui/SideDrawer";
import type { z } from "zod";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
type Beneficiary = z.infer<typeof beneficiaryResponseSchema>;

/** Gói Free chưa tạo được hồ sơ người nhận (BE trả 403 PAID_TIER_REQUIRED); hiện hộp thoại này thay cho form (thiết kế 169). */
function PaidTierDialog({ onClose }: { onClose: () => void }) {
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg bg-heritage-surface p-7" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-heritage-primary">
            Cần gói trả phí
          </DialogTitle>
          <DialogDescription className="text-heritage-muted">
            Gói Miễn phí chưa thêm được người nhận. Bạn cần nâng lên gói trả phí để tạo hồ sơ người
            nhận.
          </DialogDescription>
        </DialogHeader>
        <Notice tone="warning">Kho và nội dung hiện có vẫn giữ nguyên.</Notice>
        <DialogFooter>
          <button type="button" className={buttonStyles.outline} onClick={onClose}>
            Để sau
          </button>
          <Link to={ROUTES.BILLING.PLANS} className={buttonStyles.dark}>
            Xem gói dịch vụ
          </Link>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Trang quản lý hồ sơ chỉ cache DTO đã che CCCD. */
export function OwnerBeneficiaries() {
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const [reopened, setReopened] = useState<Beneficiary | null>(null);
  const requested = Number(params.get("page") ?? 1);
  const page =
    Number.isSafeInteger(requested) && requested > 0 && requested <= 1_000_000 ? requested : 1;
  const vault = useOwnerVault(true);
  const list = useBeneficiaries(vault.data?.id ?? "", { pageIndex: page, pageSize: 10 });
  // Tên gói bàn giao để báo rõ người nhận đang nằm trong gói bàn giao nào khi chặn xóa hồ sơ.
  const groups = useOwnerPackages(vault.data?.id ?? "", Boolean(vault.data), {
    pageIndex: 1,
    pageSize: 100,
  });
  const groupNames: Record<string, string> = {};
  if (groups.data) {
    for (const group of groups.data.items) {
      groupNames[group.id] = group.name;
    }
  }
  if (vault.isError && isOwnerVaultMissing(vault.error)) return <AutoCreateVault />;
  if (vault.isError || list.isError)
    return (
      <Notice
        tone="danger"
        role="alert"
        title="Không tải được hồ sơ người nhận."
        action={
          <Button
            onClick={() => {
              void vault.refetch();
              if (vault.data) void list.refetch();
            }}
          >
            Thử lại
          </Button>
        }
      />
    );
  if (vault.isPending || list.isPending) return <p role="status">Đang tải hồ sơ người nhận…</p>;
  // Gia hạn (GRACE_READ_ONLY): không thêm/sửa được, vẫn xóa được (thiết kế 173). Gói Free cần nâng cấp để thêm.
  const readOnly = vault.data.serviceStatus === "GRACE_READ_ONLY";
  const freeTier = vault.data.serviceTier === "FREE";
  // Số hồ sơ (tính cả hồ sơ chưa ở gói nào) không vượt tổng suất; BE vẫn chặn lại bằng 409 BENEFICIARY_SLOTS_EXCEEDED.
  // Danh sách không lọc nên totalCount là tổng số hồ sơ của kho.
  const profileLimitReached = !freeTier && list.data.totalCount >= vault.data.beneficiarySlots;
  const rows: ReactNode[] = [];
  for (const record of list.data.items) {
    rows.push(
      <BeneficiaryRow
        key={record.id}
        vaultId={vault.data.id}
        record={record}
        groupNames={groupNames}
        readOnly={readOnly}
      />,
    );
  }
  return (
    <div className="space-y-6">
      {readOnly && (
        <Notice tone="warning" role="status">
          Gói dịch vụ đang trong thời gian gia hạn. Bạn chưa thêm hoặc sửa được người nhận, nhưng
          vẫn xóa được.
        </Notice>
      )}
      {profileLimitReached && !readOnly && (
        <Notice tone="warning" role="status">
          Kho đã đủ {vault.data.beneficiarySlots} người nhận theo suất hiện có. Mua thêm suất hoặc
          xóa hồ sơ chưa dùng để thêm người mới.{" "}
          <Link className="font-semibold underline" to={ROUTES.BILLING.PLANS}>
            Xem gói dịch vụ
          </Link>
        </Notice>
      )}
      <section
        aria-label="Danh sách người nhận"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-medium text-heritage-primary">Danh sách người nhận</h2>
          <span className="text-xs font-semibold text-heritage-warning">
            {list.data.totalCount} người
          </span>
        </div>
        <p className="mt-1 text-xs text-heritage-muted">
          Đã thêm {list.data.totalCount}/{vault.data.beneficiarySlots} người nhận,{" "}
          {vault.data.usedBeneficiarySlots} người đang ở gói bàn giao. Tạo hồ sơ không tự gắn người
          nhận vào gói bàn giao.
        </p>
        {rows.length === 0 && (
          <p role="status" className="mt-4 text-sm text-heritage-muted">
            Chưa có hồ sơ trên trang này.
          </p>
        )}
        {rows.length > 0 && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Danh sách người nhận</caption>
              <thead>
                <tr className="border-b border-heritage-border text-xs text-heritage-muted">
                  <th scope="col" className="py-3 pr-4 font-semibold">
                    Họ tên
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    CCCD
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Liên hệ
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Gói bàn giao
                  </th>
                  <th scope="col" className="py-3 pl-4 text-right font-semibold">
                    <span className="sr-only">Thao tác</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-heritage-border">{rows}</tbody>
            </table>
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <nav aria-label="Phân trang người nhận" className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Trang trước"
              disabled={page === 1 || list.isFetching}
              onClick={() => setParams({ page: String(page - 1) })}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </Button>
            <span className="min-w-14 text-center text-sm">Trang {page}</span>
            <Button
              variant="outline"
              size="icon"
              aria-label="Trang sau"
              disabled={!list.data.hasNextPage || list.isFetching}
              onClick={() => setParams({ page: String(page + 1) })}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          </nav>
          <button
            type="button"
            className={`${buttonStyles.dark} disabled:bg-heritage-neutral-bg disabled:text-heritage-muted disabled:opacity-100`}
            disabled={readOnly || profileLimitReached}
            onClick={() => setAdding(true)}
          >
            Thêm người nhận
          </button>
        </div>
      </section>
      {adding && freeTier && <PaidTierDialog onClose={() => setAdding(false)} />}
      {adding && !freeTier && (
        <SideDrawer
          open
          onOpenChange={(open) => !open && setAdding(false)}
          title="Thêm người nhận"
          description="Nhập thông tin để đối chiếu khi bàn giao. Tạo hồ sơ không tự gắn người nhận vào gói bàn giao."
        >
          <BeneficiaryForm
            vaultId={vault.data.id}
            onCancel={() => setAdding(false)}
            onOpenExisting={(existing) => {
              setAdding(false);
              setReopened(existing);
            }}
          />
        </SideDrawer>
      )}
      {reopened && (
        <EditBeneficiaryDialog
          vaultId={vault.data.id}
          record={reopened}
          onClose={() => setReopened(null)}
        />
      )}
    </div>
  );
}
