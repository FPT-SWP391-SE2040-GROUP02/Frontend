import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, TriangleAlert } from "lucide-react";
import type { VaultResponse } from "@/entities/vault/model/vault.types";
import { privateActionError } from "@/shared/api/usePrivateAction";
import { confirmVaultPin } from "@/shared/api/vaultPin";
import { ROUTES } from "@/shared/config/routes.config";
import { formatStorageSize } from "@/shared/lib/formatStorageSize";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { AssetList, type AssetPackageOption } from "@/features/assets/ui/AssetList";
import { ownerVaultService } from "@/features/vault-management/api/ownerVaultService";
import { needsPlanConfirmation } from "@/features/vault-management/model/planConfirmation";
import { ownerVaultKeys, useOwnerPackages } from "@/features/vault-management/model/useOwnerVault";
import { vaultPinService } from "@/features/vault-pin/api/vaultPinService";
import { AddAssetDialog } from "./AddAssetDialog";

/** Số gói tối đa nạp để đổi gói trên từng dòng và đưa vào ô chọn gói của form thêm mục. */
const PACKAGE_LIMIT = 100;

/**
 * Màn Tài sản: danh sách tài sản (tìm, lọc, đổi gói trên từng dòng hoặc nhiều dòng cùng lúc) và nút "Thêm tài sản".
 * Đổi gói = gỡ khỏi gói cũ rồi gắn vào gói mới (Backend chỉ cho một tài sản nằm trong một gói). Gỡ mà làm gói Sẵn sàng
 * cuối cùng của kế hoạch đang chạy mất điều kiện thì hỏi Chủ kho trước, đồng ý mới gửi lại kèm xác nhận.
 */
export function OwnerAssets({ vault }: { vault: VaultResponse }) {
  const client = useQueryClient();
  const [adding, setAdding] = useState(false);
  /** Câu hỏi "đưa kế hoạch về Nháp?" đang chờ trả lời; resolve báo đồng ý hay không. */
  const [planAsk, setPlanAsk] = useState<{ resolve: (agreed: boolean) => void } | null>(null);
  const packages = useOwnerPackages(vault.id, true, { pageIndex: 1, pageSize: PACKAGE_LIMIT });

  const options: AssetPackageOption[] = [];
  const addOptions: Array<{ id: string; name: string }> = [];
  const packageOfAsset: Record<string, string> = {};
  if (packages.data) {
    for (const item of packages.data.items) {
      if (item.status === "REMOVED") {
        continue;
      }
      options.push({ id: item.id, name: item.name, assetIds: item.assetIds });
      addOptions.push({ id: item.id, name: item.name });
      for (const assetId of item.assetIds) {
        packageOfAsset[assetId] = item.id;
      }
    }
  }

  function askPlanConfirmation(): Promise<boolean> {
    return new Promise((resolve) => setPlanAsk({ resolve }));
  }

  function answerPlanAsk(agreed: boolean): void {
    if (planAsk) {
      planAsk.resolve(agreed);
    }
    setPlanAsk(null);
  }

  /** Đổi gói cho các tài sản; trả câu lỗi để hiện hoặc null khi xong. */
  async function moveAssets(assetIds: string[], packageId: string | null): Promise<string | null> {
    let confirmed = false;
    try {
      for (const assetId of assetIds) {
        const current = packageOfAsset[assetId] ?? null;
        if (current === packageId) {
          continue;
        }
        if (current !== null) {
          try {
            await ownerVaultService.changeMember(
              vault.id,
              current,
              "assets",
              assetId,
              false,
              confirmed,
            );
          } catch (error) {
            if (!needsPlanConfirmation(error)) {
              throw error;
            }
            if (!(await askPlanConfirmation())) {
              return "Chưa đổi gói vì bạn không đồng ý đưa kế hoạch về Nháp.";
            }
            confirmed = true;
            await ownerVaultService.changeMember(vault.id, current, "assets", assetId, false, true);
          }
        }
        if (packageId !== null) {
          await ownerVaultService.changeMember(vault.id, packageId, "assets", assetId, true);
        }
      }
      return null;
    } catch (error) {
      return privateActionError(error);
    } finally {
      // Gói có thể đã đổi dù một bước lỗi giữa chừng: luôn đọc lại để bảng và kế hoạch khớp máy chủ.
      void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
      void client.invalidateQueries({ queryKey: ["plan-setup", vault.id] });
    }
  }

  const usedBytes = Math.max(0, vault.storageUsedBytes);
  const quotaBytes = Math.max(1, vault.storageQuotaBytes);
  const usedPercent = Math.min(100, Math.round((usedBytes / quotaBytes) * 100));
  return (
    <div className="space-y-6">
      <AssetList
        vaultId={vault.id}
        confirmPin={() =>
          confirmVaultPin(vault.id, (pin) => vaultPinService.verify(vault.id, pin), {
            purpose: "reveal",
          })
        }
        packages={options}
        onMove={moveAssets}
        packagesHref={ROUTES.DASHBOARD.PACKAGES}
        toolbarAction={
          <Button size="lg" variant="dark" onClick={() => setAdding(true)}>
            <Plus className="size-4" aria-hidden="true" />
            Thêm tài sản
          </Button>
        }
      />
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
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-heritage-neutral-bg"
        >
          <div
            className="h-full rounded-full bg-heritage-sidebar transition-all"
            style={{ width: `${usedPercent}%` }}
          />
        </div>
      </section>
      {adding && (
        <AddAssetDialog
          vaultId={vault.id}
          remainingBytes={vault.storageRemainingBytes}
          packages={addOptions}
          onClose={() => setAdding(false)}
        />
      )}
      {planAsk && (
        <Dialog open onOpenChange={(open) => !open && answerPlanAsk(false)}>
          <DialogContent className="sm:max-w-lg" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle>Đưa kế hoạch về Nháp?</DialogTitle>
              <DialogDescription>
                Gỡ tài sản này làm gói Sẵn sàng cuối cùng của kế hoạch đang chạy không còn đủ điều
                kiện. Kế hoạch sẽ quay về Nháp và lịch điểm danh dừng lại.
              </DialogDescription>
            </DialogHeader>
            <p className="flex items-start gap-3 rounded-xl bg-heritage-warning-bg px-4 py-3 text-sm text-heritage-warning">
              <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              Bạn có thể kích hoạt lại sau khi gói đủ tài sản và người nhận.
            </p>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => answerPlanAsk(false)}
              >
                Giữ nguyên
              </Button>
              <Button type="button" variant="dark" size="lg" onClick={() => answerPlanAsk(true)}>
                Đồng ý, tiếp tục
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
