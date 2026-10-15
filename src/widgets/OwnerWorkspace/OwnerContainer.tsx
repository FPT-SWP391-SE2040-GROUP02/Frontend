import { useParams, useSearchParams } from "react-router-dom";
import { useOwnerVault, useOwnerPackage } from "@/features/vault-management/model/useOwnerVault";
import { ContainerEditor } from "@/features/vault-management/ui/ContainerEditor";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { Button } from "@/shared/ui/button";
/** Lắp ghép các feature, không import chéo giữa services của feature. */
export function OwnerContainer() {
  const { id = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const page = (key: string) => {
    const value = Number(params.get(key) ?? 1);
    return Number.isSafeInteger(value) && value > 0 && value <= 1_000_000 ? value : 1;
  };
  const assetPage = page("assetPage");
  const beneficiaryPage = page("beneficiaryPage");
  const setPage = (key: string, value: number) =>
    setParams((previous) => {
      const next = new URLSearchParams(previous);
      next.set(key, String(value));
      return next;
    });
  const vault = useOwnerVault(true);
  const container = useOwnerPackage(vault.data?.id ?? "", id, Boolean(vault.data));
  const assets = useVaultAssets(vault.data?.id ?? "", { pageIndex: assetPage, pageSize: 100 });
  const beneficiaries = useBeneficiaries(vault.data?.id ?? "", {
    pageIndex: beneficiaryPage,
    pageSize: 100,
  });
  if (vault.isError || container.isError)
    return (
      <div role="alert" className="space-y-4">
        <p>Không đọc được gói trong kho của bạn. Kiểm tra đường dẫn hoặc tải lại.</p>
        <Button
          onClick={() => {
            void vault.refetch();
            void container.refetch();
          }}
        >
          Tải lại
        </Button>
      </div>
    );
  if (vault.isPending || container.isPending) return <p role="status">Đang tải gói bàn giao…</p>;
  return (
    <div className="space-y-4">
      {(assets.isError || beneficiaries.isError) && (
        <div role="alert" className="space-y-3">
          <p>Chưa tải được một số lựa chọn tài sản/người nhận.</p>
          <Button
            variant="outline"
            onClick={() => {
              void assets.refetch();
              void beneficiaries.refetch();
            }}
          >
            Thử lại danh sách lựa chọn
          </Button>
        </div>
      )}
      <p className="text-xs leading-5 text-heritage-muted">
        Mỗi trang lựa chọn hiển thị tối đa 100 mục; các mục đã gắn luôn có thể gỡ. Khi dữ liệu đã
        đổi ở nơi khác, tải lại trước khi sửa tiếp.
      </p>
      {(assets.isPending || beneficiaries.isPending) && (
        <p role="status" className="text-sm">
          Đang tải danh sách lựa chọn…
        </p>
      )}
      <nav aria-label="Phân trang lựa chọn cho gói" className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Button
            variant="outline"
            disabled={assetPage === 1 || assets.isFetching}
            onClick={() => setPage("assetPage", assetPage - 1)}
          >
            Trang tài sản trước
          </Button>
          <span>Trang {assetPage}</span>
          <Button
            variant="outline"
            disabled={!assets.data?.hasNextPage || assets.isFetching}
            onClick={() => setPage("assetPage", assetPage + 1)}
          >
            Trang tài sản sau
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <Button
            variant="outline"
            disabled={beneficiaryPage === 1 || beneficiaries.isFetching}
            onClick={() => setPage("beneficiaryPage", beneficiaryPage - 1)}
          >
            Trang người nhận trước
          </Button>
          <span>Trang {beneficiaryPage}</span>
          <Button
            variant="outline"
            disabled={!beneficiaries.data?.hasNextPage || beneficiaries.isFetching}
            onClick={() => setPage("beneficiaryPage", beneficiaryPage + 1)}
          >
            Trang người nhận sau
          </Button>
        </div>
      </nav>
      <ContainerEditor
        container={container.data}
        assets={assets.data?.items.map((item) => ({ id: item.id, label: item.name })) ?? []}
        beneficiaries={
          beneficiaries.data?.items.map((item) => ({
            id: item.id,
            label: `${item.fullName} · ****${item.citizenIdLast4}`,
          })) ?? []
        }
      />
      <Button variant="outline" onClick={() => window.location.reload()}>
        Tải lại gói và bỏ thay đổi chưa lưu
      </Button>
    </div>
  );
}
