import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { CreateVaultForm } from "@/features/vault-management/ui/CreateVaultForm";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { BeneficiaryForm } from "@/features/beneficiaries/ui/BeneficiaryForm";
import { BeneficiaryRow } from "@/features/beneficiaries/ui/BeneficiaryRow";
import { Button } from "@/shared/ui/button";
/** Trang quản lý hồ sơ chỉ cache DTO đã che CCCD. */
export function OwnerBeneficiaries() {
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get("page") ?? 1);
  const page =
    Number.isSafeInteger(requested) && requested > 0 && requested <= 1_000_000 ? requested : 1;
  const vault = useOwnerVault(true);
  const list = useBeneficiaries(vault.data?.id ?? "", { pageIndex: page, pageSize: 10 });
  if (vault.isError && isOwnerVaultMissing(vault.error)) return <CreateVaultForm />;
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
  const rows: ReactNode[] = [];
  for (const record of list.data.items) {
    rows.push(<BeneficiaryRow key={record.id} vaultId={vault.data.id} record={record} />);
  }
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section
        aria-label="Danh sách người nhận"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      >
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-xl font-medium text-heritage-primary">Danh sách người nhận</h2>
          <span className="text-xs font-semibold text-[#7A5B24]">{list.data.totalCount} người</span>
        </div>
        <p className="mt-1 text-xs text-heritage-muted">
          {vault.data.usedBeneficiarySlots}/{vault.data.beneficiarySlots} suất đang dùng. Tạo hồ sơ
          không tự gắn người nhận vào nhóm.
        </p>
        {rows.length === 0 && (
          <p role="status" className="mt-4 text-sm text-heritage-muted">
            Chưa có hồ sơ trên trang này.
          </p>
        )}
        <ul className="mt-2">{rows}</ul>
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
      <section
        aria-label="Thêm người nhận"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-6"
      >
        <h2 className="mb-4 text-xl font-medium text-heritage-primary">Thêm người nhận</h2>
        <BeneficiaryForm vaultId={vault.data.id} />
      </section>
    </div>
  );
}
