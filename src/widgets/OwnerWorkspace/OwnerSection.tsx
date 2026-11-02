import { useSelector } from "react-redux";
import { Vault } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthState } from "@/entities/user/model/authSlice";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { confirmVaultPin } from "@/shared/api/vaultPin";
import { vaultPinService } from "@/features/vault-pin/api/vaultPinService";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { Button } from "@/shared/ui/button";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import {
  useOwnerVault,
  useOwnerPackages,
  ownerVaultKeys,
  isOwnerVaultMissing,
} from "@/features/vault-management/model/useOwnerVault";
import { AutoCreateVault } from "@/features/vault-management/ui/AutoCreateVault";
import { CreateAssetForm } from "@/features/assets/ui/CreateAssetForm";
import { useBeneficiaries } from "@/features/beneficiaries/model/useBeneficiaries";
import { useVaultAssets } from "@/features/assets/model/useVaultAssets";
import { AssetList } from "@/features/assets/ui/AssetList";
import { PlanSetupPanel } from "@/features/plan-setup/ui/PlanSetupPanel";
import { OwnerTrustedPeople } from "./OwnerTrustedPeople";
import { OwnerHandoverOverview } from "./OwnerHandoverOverview";
import { OwnerGroups } from "./OwnerGroups";
import { CreatePackageWithAssetsDialog } from "./CreatePackageWithAssetsDialog";
import { OwnerCheckIn } from "./OwnerCheckIn";

/** Số gói tối đa đưa vào ô chọn gói của form thêm mục. */
const FORM_PACKAGE_LIMIT = 100;

/** Hiển thị lỗi có đường phục hồi; không chuyển lỗi API thành empty/zero. */
function QueryError({ retry, pending }: { retry: () => void; pending: boolean }) {
  return (
    <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6">
      <p className="text-sm text-red-800">Không tải được dữ liệu. Vui lòng thử lại.</p>
      <Button variant="outline" disabled={pending} onClick={retry} className="mt-4 min-h-11">
        Thử lại
      </Button>
    </div>
  );
}

/** Chỉ đọc DTO đã được tích hợp; chờ kho thật trước khi mount các truy vấn phụ thuộc. */
export function OwnerSection({
  section,
  groupCreate,
}: {
  section: "assets" | "groups" | "plans" | "check-in" | "trusted";
  /** Chỉ dùng cho section "groups": trạng thái hộp thoại "Tạo gói bàn giao" do trang cha điều khiển. */
  groupCreate?: { open: boolean; onOpenChange: (open: boolean) => void };
}) {
  const authenticated = useSelector((state: { auth: AuthState }) => state.auth.isAuthenticated);
  const vault = useOwnerVault(authenticated && Boolean(accessTokenMemory.get()));
  if (vault.isError && isOwnerVaultMissing(vault.error)) return <AutoCreateVault />;
  if (vault.isError)
    return <QueryError retry={() => void vault.refetch()} pending={vault.isFetching} />;
  if (!authenticated) return <p role="status">Vui lòng đăng nhập để xem kho.</p>;
  if (vault.isPending)
    return (
      <div
        role="status"
        className="flex items-center gap-3 rounded-xl border border-heritage-border p-6 text-sm text-heritage-muted"
      >
        <Vault className="size-5" aria-hidden="true" />
        Đang tải kho của bạn…
      </div>
    );
  if (section === "check-in") return <OwnerCheckIn vaultId={vault.data.id} />;
  if (section === "trusted") return <OwnerTrustedPeople vaultId={vault.data.id} />;
  if (section === "groups") {
    let open = false;
    let onOpenChange = (value: boolean): void => {
      void value;
    };
    if (groupCreate) {
      open = groupCreate.open;
      onOpenChange = groupCreate.onOpenChange;
    }
    return (
      <OwnerGroups vaultId={vault.data.id} createOpen={open} onCreateOpenChange={onOpenChange} />
    );
  }
  if (section === "assets") {
    return <AssetsAndGroups vault={vault.data} />;
  }
  return (
    <div className="space-y-6">
      <OwnerHandoverOverview vaultId={vault.data.id} />
      <PlanSetupPanel vaultId={vault.data.id} />
    </div>
  );
}

/**
 * Kho của tôi: mục trong kho và gói bàn giao trong cùng một trang. Form thêm mục chọn gói đã có
 * (cập nhật gói), danh sách gói bàn giao nằm bên dưới.
 */
function AssetsAndGroups({ vault }: { vault: VaultResponse }) {
  const client = useQueryClient();
  const [creating, setCreating] = useState(false);
  const vaultAssets = useVaultAssets(vault.id, { pageIndex: 1, pageSize: FORM_PACKAGE_LIMIT });
  const assetOptions: Array<{ id: string; name: string }> = [];
  if (vaultAssets.data) {
    for (const item of vaultAssets.data.items) {
      assetOptions.push({ id: item.id, name: item.name });
    }
  }
  const vaultPeople = useBeneficiaries(vault.id, { pageIndex: 1, pageSize: FORM_PACKAGE_LIMIT });
  const peopleOptions: Array<{ id: string; name: string }> = [];
  if (vaultPeople.data) {
    for (const item of vaultPeople.data.items) {
      peopleOptions.push({ id: item.id, name: item.fullName });
    }
  }
  const packages = useOwnerPackages(vault.id, true, { pageIndex: 1, pageSize: FORM_PACKAGE_LIMIT });
  const packageOptions: Array<{ id: string; name: string }> = [];
  if (packages.data) {
    for (const item of packages.data.items) {
      if (item.status !== "REMOVED") {
        packageOptions.push({ id: item.id, name: item.name });
      }
    }
  }
  async function addToPackage(assetId: string, packageId: string): Promise<void> {
    await ownerVaultService.changeMember(vault.id, packageId, "assets", assetId, true);
    void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
  }
  const usedBytes = Math.max(0, vault.storageUsedBytes);
  const quotaBytes = Math.max(1, vault.storageQuotaBytes);
  const usedPercent = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
  return (
    <div className="space-y-6">
      <section
        aria-label="Dung lượng kho"
        className="rounded-2xl border border-heritage-border bg-heritage-surface p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="font-semibold text-heritage-text">Dung lượng sử dụng</span>
          <span className="text-heritage-muted">
            Đã dùng{" "}
            <strong className="font-semibold text-heritage-text">
              {formatStorageSize(usedBytes)}
            </strong>{" "}
            / {formatStorageSize(vault.storageQuotaBytes)} (còn{" "}
            {formatStorageSize(vault.storageRemainingBytes)})
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Dung lượng đã dùng"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={usedPercent}
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[#ECE8DB]"
        >
          <div
            className="h-full rounded-full bg-[#0A281E] transition-all"
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <AssetList
          vaultId={vault.id}
          confirmPin={() =>
            confirmVaultPin(vault.id, (pin) => vaultPinService.verify(vault.id, pin))
          }
        />
        <CreateAssetForm
          vaultId={vault.id}
          remainingBytes={vault.storageRemainingBytes}
          packages={packageOptions}
          addToPackage={addToPackage}
        />
      </div>
      <div className="flex justify-end">
        <Button
          size="lg"
          className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
          onClick={() => setCreating(true)}
        >
          Tạo gói bàn giao
        </Button>
      </div>
      <OwnerGroups vaultId={vault.id} />
      {creating && (
        <CreatePackageWithAssetsDialog
          vaultId={vault.id}
          remainingBytes={vault.storageRemainingBytes}
          existingAssets={assetOptions}
          existingPeople={peopleOptions}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}
