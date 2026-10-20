import { useParams, useSearchParams } from "react-router-dom";
import { useOwnerVault, useOwnerPackage } from "@/features/vault-management/model/useOwnerVault";
import { GroupDetail } from "@/features/vault-management/ui/GroupDetail";
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
        <p>Không đọc được nhóm trong kho của bạn. Kiểm tra đường dẫn hoặc tải lại.</p>
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
  if (vault.isPending || container.isPending) return <p role="status">Đang tải nhóm…</p>;
  // Mỗi trang lựa chọn tối đa 100 mục; chỉ hiện nút chuyển trang khi kho thật sự có hơn một trang.
  const showAssetNav = assetPage > 1 || Boolean(assets.data?.hasNextPage);
  const showBeneficiaryNav = beneficiaryPage > 1 || Boolean(beneficiaries.data?.hasNextPage);
  return (
    <div className="space-y-4">
      {(assets.isError || beneficiaries.isError) && (
        <div role="alert" className="space-y-3">
          <p>Chưa tải được một số lựa chọn mục/người nhận.</p>
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
      {(assets.isPending || beneficiaries.isPending) && (
        <p role="status" className="text-sm">
          Đang tải danh sách lựa chọn…
        </p>
      )}
      {(showAssetNav || showBeneficiaryNav) && (
        <nav aria-label="Phân trang lựa chọn cho nhóm" className="grid gap-3 sm:grid-cols-2">
          {showAssetNav && (
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
          )}
          {showBeneficiaryNav && (
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
          )}
        </nav>
      )}
      <GroupDetail
        container={container.data}
        assets={
          assets.data?.items.map((item) => {
            let detail = "Văn bản";
            if (item.kind === "FILE") {
              detail = "Tệp";
            }
            return { id: item.id, label: item.name, detail };
          }) ?? []
        }
        beneficiaries={
          beneficiaries.data?.items.map((item) => ({
            id: item.id,
            label: `${item.fullName} · ****${item.citizenIdLast4}`,
          })) ?? []
        }
      />
    </div>
  );
}
