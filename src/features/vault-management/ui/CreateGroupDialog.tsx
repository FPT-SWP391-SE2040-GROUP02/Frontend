import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Users, FileText } from "lucide-react";
import {
  createPackageSchema,
  type CreatePackageFormInput,
} from "@/entities/package/model/package.schema";
import { apiClient } from "@/shared/api";
import { usePrivateAction } from "@/shared/api/usePrivateAction";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";
import { ownerVaultService } from "../api/ownerVaultService";
import { ownerVaultKeys } from "../model/useOwnerVault";

export interface AvailableAsset {
  id: string;
  name: string;
  kind?: string;
  detail?: string;
}

export interface AvailableBeneficiary {
  id: string;
  fullName: string;
  citizenIdLast4?: string;
  email?: string;
  relationship?: string;
}

export interface CreateGroupDialogProps {
  vaultId: string;
  onClose: () => void;
  availableAssets?: AvailableAsset[];
  availableBeneficiaries?: AvailableBeneficiary[];
}

/** Tạo Gói bàn giao (container) kèm người nhận và tài sản trong kho của Chủ kho. */
export function CreateGroupDialog({
  vaultId,
  onClose,
  availableAssets = [],
  availableBeneficiaries = [],
}: CreateGroupDialogProps) {
  const client = useQueryClient();
  const action = usePrivateAction();
  const [fetchedAssets, setFetchedAssets] = useState<AvailableAsset[]>([]);
  const [fetchedBeneficiaries, setFetchedBeneficiaries] = useState<AvailableBeneficiary[]>([]);
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  const [selectedBeneficiaryIds, setSelectedBeneficiaryIds] = useState<string[]>([]);

  useEffect(() => {
    if (availableAssets.length > 0 || !vaultId) return;
    let active = true;
    apiClient
      .get<{ items: Array<{ id: string; name: string; kind?: string }> }>(
        `/vaults/${vaultId}/assets`,
        { params: { pageIndex: 1, pageSize: 100 } },
      )
      .then((res) => {
        if (active && res.data?.items) {
          setFetchedAssets(res.data.items);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [vaultId, availableAssets.length]);

  useEffect(() => {
    if (availableBeneficiaries.length > 0 || !vaultId) return;
    let active = true;
    apiClient
      .get<{
        items: Array<{ id: string; fullName: string; citizenIdLast4?: string; email?: string | null }>;
      }>(`/vaults/${vaultId}/beneficiaries`, { params: { pageIndex: 1, pageSize: 100 } })
      .then((res) => {
        if (active && res.data?.items) {
          setFetchedBeneficiaries(
            res.data.items.map((b) => ({
              id: b.id,
              fullName: b.fullName,
              citizenIdLast4: b.citizenIdLast4,
              email: b.email ?? undefined,
            })),
          );
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [vaultId, availableBeneficiaries.length]);

  const assetList = availableAssets.length > 0 ? availableAssets : fetchedAssets;
  const beneficiaryList =
    availableBeneficiaries.length > 0 ? availableBeneficiaries : fetchedBeneficiaries;

  const toggleAsset = (id: string) => {
    setSelectedAssetIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const toggleBeneficiary = (id: string) => {
    setSelectedBeneficiaryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePackageFormInput>({
    resolver: zodResolver(createPackageSchema),
    mode: "onBlur",
    reValidateMode: "onBlur",
    defaultValues: { name: "", description: "" },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && !action.pending && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Tạo gói bàn giao</DialogTitle>
          <DialogDescription>
            Gói bàn giao gom các tài sản và người nhận có chung mục đích chuyển giao. Bạn có thể chọn người nhận và tài sản ngay tại đây.
          </DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="space-y-5"
          onSubmit={handleSubmit(async (request) => {
            const saved = await action.execute(
              async () => {
                const pkg = await ownerVaultService.createPackage(vaultId, request);
                for (const assetId of selectedAssetIds) {
                  await ownerVaultService.changeMember(vaultId, pkg.id, "assets", assetId, true);
                }
                for (const beneficiaryId of selectedBeneficiaryIds) {
                  await ownerVaultService.changeMember(
                    vaultId,
                    pkg.id,
                    "beneficiaries",
                    beneficiaryId,
                    true,
                  );
                }
                return pkg;
              },
              () => {
                void client.invalidateQueries({ queryKey: ownerVaultKeys.all });
                void client.invalidateQueries({ queryKey: ["vault-assets", vaultId] });
                void client.invalidateQueries({ queryKey: ["vault-beneficiaries", vaultId] });
                void client.invalidateQueries({ queryKey: ["plan-setup", vaultId] });
              },
            );
            if (saved) {
              onClose();
            }
          })}
        >
          <fieldset disabled={action.pending} className="space-y-4">
            <label className="block space-y-2 text-sm font-medium text-heritage-primary">
              Tên gói bàn giao
              <Input
                placeholder="Ví dụ: Giấy tờ gia đình"
                {...register("name")}
                aria-invalid={Boolean(errors.name)}
                className="mt-1"
              />
            </label>
            {errors.name && (
              <p role="alert" className="text-sm text-destructive">
                {errors.name.message}
              </p>
            )}
            <label className="block space-y-2 text-sm font-medium text-heritage-primary">
              Mô tả (không bắt buộc)
              <Textarea
                placeholder="Mô tả ý định hoặc hướng dẫn sơ lược về gói này..."
                {...register("description")}
                aria-invalid={Boolean(errors.description)}
                className="mt-1 min-h-20"
              />
            </label>
            {errors.description && (
              <p role="alert" className="text-sm text-destructive">
                {errors.description.message}
              </p>
            )}

            {/* Chọn người nhận */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-heritage-primary">
                  <Users className="size-4 text-heritage-gold" aria-hidden="true" />
                  Người nhận bàn giao ({selectedBeneficiaryIds.length})
                </span>
                {beneficiaryList.length > 0 && (
                  <span className="text-xs text-heritage-muted">
                    Đã chọn {selectedBeneficiaryIds.length} / {beneficiaryList.length} người
                  </span>
                )}
              </div>
              {beneficiaryList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-heritage-border bg-heritage-surface/70 p-3 text-xs text-heritage-muted">
                  Kho chưa có người nhận nào. Bạn có thể thêm người nhận tại mục Người nhận sau.
                </div>
              ) : (
                <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-xl border border-heritage-border bg-white p-2">
                  {beneficiaryList.map((b) => {
                    const isSelected = selectedBeneficiaryIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg p-2.5 transition-colors ${
                          isSelected ? "bg-heritage-gold/15" : "hover:bg-zinc-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleBeneficiary(b.id)}
                            className="size-4 rounded border-heritage-border text-heritage-primary focus:ring-heritage-gold"
                          />
                          <div className="min-w-0 truncate">
                            <span className="block truncate text-sm font-medium text-heritage-primary">
                              {b.fullName}
                            </span>
                            {b.citizenIdLast4 && (
                              <span className="block text-xs text-heritage-muted">
                                CCCD: ****{b.citizenIdLast4}
                              </span>
                            )}
                          </div>
                        </div>
                        {(b.relationship || b.email) && (
                          <span className="shrink-0 max-w-[150px] truncate rounded-full bg-heritage-primary/10 px-2 py-0.5 text-[11px] font-medium text-heritage-muted">
                            {b.relationship ?? b.email}
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Chọn tài sản */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold text-heritage-primary">
                  <FileText className="size-4 text-heritage-gold" aria-hidden="true" />
                  Tài sản đưa vào gói ({selectedAssetIds.length})
                </span>
                {assetList.length > 0 && (
                  <span className="text-xs text-heritage-muted">
                    Đã chọn {selectedAssetIds.length} / {assetList.length} mục
                  </span>
                )}
              </div>
              {assetList.length === 0 ? (
                <div className="rounded-xl border border-dashed border-heritage-border bg-heritage-surface/70 p-3 text-xs text-heritage-muted">
                  Kho chưa có tài sản nào. Bạn có thể thêm tài sản tại mục Mục trong kho sau.
                </div>
              ) : (
                <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-xl border border-heritage-border bg-white p-2">
                  {assetList.map((a) => {
                    const isSelected = selectedAssetIds.includes(a.id);
                    return (
                      <label
                        key={a.id}
                        className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg p-2.5 transition-colors ${
                          isSelected ? "bg-heritage-gold/15" : "hover:bg-zinc-50"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAsset(a.id)}
                            className="size-4 rounded border-heritage-border text-heritage-primary focus:ring-heritage-gold"
                          />
                          <span className="truncate text-sm font-medium text-heritage-primary">
                            {a.name}
                          </span>
                        </div>
                        <span className="shrink-0 rounded-full bg-heritage-primary/10 px-2 py-0.5 text-[11px] font-medium text-heritage-muted">
                          {a.kind === "FILE" ? "Tệp tải lên" : "Ghi chú bí mật"}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </fieldset>

          {action.error && (
            <p role="alert" className="text-sm text-destructive">
              {action.error}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="lg"
              disabled={action.pending}
              onClick={onClose}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              size="lg"
              className="bg-[#E0C486] font-semibold text-[#0A281E] shadow-none hover:bg-[#E6C98B]"
              disabled={action.pending}
            >
              {action.pending ? "Đang xử lý..." : "Tạo gói bàn giao"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
