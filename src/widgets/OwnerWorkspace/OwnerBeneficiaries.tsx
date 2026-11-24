import { useState, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { VaultEmailRequiredNotice } from "@/features/vault-management/ui/VaultEmailRequiredNotice";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { BeneficiaryForm } from "@/features/beneficiaries/ui/BeneficiaryForm";
import { BeneficiaryRow, EditBeneficiaryDialog } from "@/features/beneficiaries/ui/BeneficiaryRow";
import { beneficiaryResponseSchema } from "@/features/beneficiaries/model/beneficiary.schema";
import { getVaultLockReason } from "@/entities/vault/model/vaultLock";
import { ROUTES } from "@/shared/config/routes.config";
import { buttonStyles } from "@/shared/ui/heritageKit";
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
        <p className="rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning">
          Kho và nội dung hiện có vẫn giữ nguyên.
        </p>
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

/** Trang quản lý hồ sơ người nhận của Chủ kho; số CCCD hiện đầy đủ. */
export function OwnerBeneficiaries() {
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const [reopened, setReopened] = useState<Beneficiary | null>(null);
  const requested = Number(params.get("page") ?? 1);
  const page =
    Number.isSafeInteger(requested) && requested > 0 && requested <= 1_000_000 ? requested : 1;
  const vault = useOwnerVault(true);
  const list = useBeneficiaries(vault.data?.id ?? "", { pageIndex: page, pageSize: 10 });
  // Tên tài sản để báo rõ người nhận đang được gán tài sản nào khi chặn xóa hồ sơ.
  const assets = useVaultAssets(vault.data?.id ?? "", { pageIndex: 1, pageSize: 100 });
  const assetNames: Record<string, string> = {};
  if (assets.data) {
    for (const asset of assets.data.items) {
      assetNames[asset.id] = asset.name;
    }
  }
  if (vault.isError && isOwnerVaultMissing(vault.error)) return <VaultEmailRequiredNotice />;
  if (vault.isError || list.isError)
    return (
      <div role="alert" className="space-y-4">
        <p>Không tải được hồ sơ người nhận.</p>
        <Button
          onClick={() => {
            void vault.refetch();
            if (vault.data) void list.refetch();
          }}
        >
          Thử lại
        </Button>
      </div>
    );
  if (vault.isPending || list.isPending) return <p role="status">Đang tải hồ sơ người nhận…</p>;
  // Gia hạn (GRACE_READ_ONLY): không thêm/sửa được, vẫn xóa được (thiết kế 173). Gói Free cần nâng cấp để thêm.
  const readOnly = vault.data.serviceStatus === "GRACE_READ_ONLY";
  // Kho bị khóa vì hồ sơ chứng tử, bàn giao...: không thêm, sửa, xóa được (khác gia hạn là vẫn cho xóa).
  const lockReason = getVaultLockReason(vault.data);
  const locked = lockReason !== null;
  const freeTier = vault.data.serviceTier === "FREE";
  // Số hồ sơ (tính cả hồ sơ chưa được gán tài sản) không vượt tổng suất; BE vẫn chặn lại bằng 409 BENEFICIARY_SLOTS_EXCEEDED.
  // Danh sách không lọc nên totalCount là tổng số hồ sơ của kho.
  const profileLimitReached = !freeTier && list.data.totalCount >= vault.data.beneficiarySlots;
  const rows: ReactNode[] = [];
  for (const record of list.data.items) {
    rows.push(
      <BeneficiaryRow
        key={record.id}
        vaultId={vault.data.id}
        record={record}
        assetNames={assetNames}
        readOnly={readOnly}
        locked={locked}
      />,
    );
  }
  return (
    <div className="space-y-6">
      {readOnly && (
        <p
          role="status"
          className="rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning"
        >
          Gói dịch vụ đang trong thời gian gia hạn. Bạn chưa thêm hoặc sửa được người nhận, nhưng
          vẫn xóa được.
        </p>
      )}
      {profileLimitReached && !readOnly && (
        <p
          role="status"
          className="rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning"
        >
          Kho đã đủ {vault.data.beneficiarySlots} người nhận theo suất của gói. Nâng lên gói nhiều
          suất hơn hoặc xóa hồ sơ chưa dùng để thêm người mới.{" "}
          <Link className="font-semibold underline" to={ROUTES.BILLING.PLANS}>
            Xem gói dịch vụ
          </Link>
        </p>
      )}
      <section
        aria-label="Danh sách người nhận"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      >
        {/* Tiêu đề bên trái, số lượng và nút hành động chính bên phải cùng một hàng (mắt đọc từ trái sang phải rồi gặp nút). */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-medium text-heritage-primary">Danh sách người nhận</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-heritage-warning">
              {list.data.totalCount} người
            </span>
            <button
              type="button"
              className={`${buttonStyles.dark} disabled:bg-heritage-sunken disabled:text-heritage-subtle disabled:opacity-100`}
              disabled={readOnly || locked || profileLimitReached}
              title={lockReason ?? undefined}
              onClick={() => setAdding(true)}
            >
              Thêm người nhận
            </button>
          </div>
        </div>
        <p className="mt-1 text-sm text-heritage-muted">
          Đã thêm {list.data.totalCount}/{vault.data.beneficiarySlots} người nhận,{" "}
          {vault.data.usedBeneficiarySlots} người đã được gán tài sản. Tạo hồ sơ không tự gán tài
          sản cho người nhận.
        </p>
        {rows.length === 0 && (
          <p role="status" className="mt-4 text-sm text-heritage-muted">
            Chưa có hồ sơ trên trang này.
          </p>
        )}
        {rows.length > 0 && (
          <div className="relative mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <caption className="sr-only">Danh sách người nhận</caption>
              <thead>
                <tr className="border-b border-heritage-border text-sm text-heritage-muted">
                  <th scope="col" className="min-w-[180px] py-3 pr-4 font-semibold">
                    Họ tên
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    CCCD
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Liên hệ
                  </th>
                  <th scope="col" className="px-4 py-3 font-semibold">
                    Tài sản được gán
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
        <nav
          aria-label="Phân trang người nhận"
          className="mt-4 flex items-center justify-between gap-3"
        >
          <Button
            variant="outline"
            disabled={page === 1 || list.isFetching}
            onClick={() => setParams({ page: String(page - 1) })}
          >
            Trang trước
          </Button>
          <span className="text-sm">Trang {page}</span>
          <Button
            variant="outline"
            disabled={!list.data.hasNextPage || list.isFetching}
            onClick={() => setParams({ page: String(page + 1) })}
          >
            Trang sau
          </Button>
        </nav>
      </section>
      {adding && freeTier && <PaidTierDialog onClose={() => setAdding(false)} />}
      {adding && !freeTier && (
        <Dialog open onOpenChange={(open) => !open && setAdding(false)}>
          <DialogContent
            className="max-h-[90dvh] max-w-lg overflow-y-auto bg-heritage-surface p-7"
            showCloseButton={false}
          >
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-heritage-primary">
                Thêm người nhận
              </DialogTitle>
              <DialogDescription className="text-heritage-muted">
                Nhập thông tin để đối chiếu khi bàn giao. Tạo hồ sơ không tự gán tài sản cho người
                nhận.
              </DialogDescription>
            </DialogHeader>
            <BeneficiaryForm
              vaultId={vault.data.id}
              onCancel={() => setAdding(false)}
              onOpenExisting={(existing) => {
                setAdding(false);
                setReopened(existing);
              }}
            />
          </DialogContent>
        </Dialog>
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
