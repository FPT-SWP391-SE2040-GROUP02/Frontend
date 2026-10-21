import { useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import {
  useOwnerPackages,
  useOwnerVault,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { CreateVaultForm } from "@/features/vault-management/ui/CreateVaultForm";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { BeneficiaryForm } from "@/features/beneficiaries/ui/BeneficiaryForm";
import { BeneficiaryRow } from "@/features/beneficiaries/ui/BeneficiaryRow";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
/** Trang quản lý hồ sơ chỉ cache DTO đã che CCCD. */
export function OwnerBeneficiaries() {
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
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
    rows.push(
      <BeneficiaryRow
        key={record.id}
        vaultId={vault.data.id}
        record={record}
        groupNames={groupNames}
      />,
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          size="lg"
          className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
          onClick={() => setAdding(true)}
        >
          Thêm người nhận
        </Button>
      </div>
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
          không tự gắn người nhận vào gói bàn giao.
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
      {adding && (
        <Dialog open onOpenChange={(open) => !open && setAdding(false)}>
          <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Thêm người nhận</DialogTitle>
              <DialogDescription>
                Tạo hồ sơ không tự gắn người nhận vào gói bàn giao. Số CCCD chỉ hiện 4 số cuối sau
                khi lưu.
              </DialogDescription>
            </DialogHeader>
            <BeneficiaryForm vaultId={vault.data.id} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
