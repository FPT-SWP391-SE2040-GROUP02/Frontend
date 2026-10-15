import { useSearchParams } from "react-router-dom";
import {
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { CreateVaultForm } from "@/features/vault-management/ui/CreateVaultForm";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { BeneficiaryForm } from "@/features/beneficiaries/ui/BeneficiaryForm";
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
  return (
    <div className="space-y-4">
      <BeneficiaryForm vaultId={vault.data.id} />
      <p className="text-sm text-heritage-muted">
        {list.data.totalCount} hồ sơ · {vault.data.usedBeneficiarySlots}/
        {vault.data.beneficiarySlots} suất đang dùng. Tạo hồ sơ không tự gắn người nhận vào gói.
      </p>
      {list.data.items.length === 0 && <p role="status">Chưa có hồ sơ trên trang này.</p>}
      {list.data.items.map((record) => (
        <BeneficiaryForm key={record.id} vaultId={vault.data.id} record={record} />
      ))}
      <nav aria-label="Phân trang người nhận" className="flex items-center justify-between gap-3">
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
    </div>
  );
}
