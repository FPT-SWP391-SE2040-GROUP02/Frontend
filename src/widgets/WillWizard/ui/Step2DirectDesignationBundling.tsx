import React, { useMemo } from "react";
import { Button, Input, Card } from "@/shared/ui";
import { Users, Plus, Trash2, Package, UserCheck, Sparkles, Info } from "lucide-react";
import type { AssetItemDto, AssetViewModel } from "@/features/assets";

/**
 * @file Step2DirectDesignationBundling.tsx
 * @description Bước 2 của Thiết Lập Kế Hoạch Di Sản (SRS 3.11.0 - Luồng 1B):
 * 1. Chủ sở hữu gán người nhận cho TỪNG TÀI SẢN (Direct Designation - Tuyệt đối không phần trăm).
 * 2. Hệ thống TỰ GOM toàn bộ tài sản có cùng tập person_id thành đúng một Kho bàn giao (Handover Vault).
 */

import type {
  BeneficiaryItem,
  AssetDesignationMap,
} from "@/features/wills/model/willWizard.schema";
export type {
  BeneficiaryItem,
  AssetDesignationMap,
} from "@/features/wills/model/willWizard.schema";

interface Step2DirectDesignationBundlingProps {
  selectedAssets: Array<AssetItemDto | AssetViewModel>;
  beneficiaries: BeneficiaryItem[];
  designations: AssetDesignationMap;
  onAddBeneficiary: () => void;
  onRemoveBeneficiary: (id: string) => void;
  onUpdateBeneficiary: (id: string, field: keyof BeneficiaryItem, value: string) => void;
  onToggleRecipient: (assetId: string, beneficiaryId: string) => void;
  errorMessage?: string | null;
}

export const Step2DirectDesignationBundling: React.FC<Step2DirectDesignationBundlingProps> = ({
  selectedAssets,
  beneficiaries,
  designations,
  onAddBeneficiary,
  onRemoveBeneficiary,
  onUpdateBeneficiary,
  onToggleRecipient,
  errorMessage,
}) => {
  // Tính toán tự gom kho bàn giao theo tập person_id (ASSET-04, ASSET-08)
  const bundledVaults = useMemo(() => {
    const bundleMap = new Map<string, { recipientIds: string[]; assetIds: string[] }>();

    selectedAssets.forEach((asset) => {
      const recIds = designations[asset.id] || [];
      if (recIds.length === 0) return;

      // Chuẩn hóa tập person_id không xét thứ tự
      const sortedKey = [...recIds].sort().join(",");
      if (!bundleMap.has(sortedKey)) {
        bundleMap.set(sortedKey, {
          recipientIds: recIds,
          assetIds: [],
        });
      }
      bundleMap.get(sortedKey)!.assetIds.push(asset.id);
    });

    return Array.from(bundleMap.values()).map((bundle, index) => {
      const isSingle = bundle.recipientIds.length === 1;
      const recipientNames = bundle.recipientIds
        .map((id) => beneficiaries.find((b) => b.id === id)?.name || "Chưa đặt tên")
        .join(", ");

      return {
        bundleId: `bundle_${index + 1}`,
        recipientMode: isSingle ? ("SINGLE_RECIPIENT" as const) : ("CO_OWNED" as const),
        recipientNames,
        recipientIds: bundle.recipientIds,
        assetIds: bundle.assetIds,
      };
    });
  }, [selectedAssets, designations, beneficiaries]);

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Giải thích chuẩn SRS 3.11.0 */}
      <div>
        <h2 className="text-xl font-bold text-heritage-text">
          Bước 2: Chỉ Định Người Nhận & Tự Gom Kho Bàn Giao
        </h2>
        <p className="text-xs text-heritage-muted mt-1 leading-relaxed">
          Gán người nhận cho từng tài sản số. Hệ thống sẽ tự động chuẩn hóa và gom các tài sản có
          cùng tập người nhận thành đúng một Kho bàn giao độc lập (SRS 3.11.0). Tuyệt đối không phân
          chia tỷ lệ phần trăm (%).
        </p>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="p-3.5 rounded-[14px] bg-heritage-danger-bg border border-heritage-danger/30 flex items-center gap-2 text-xs text-heritage-danger font-medium"
        >
          {errorMessage}
        </div>
      )}

      {/* PHẦN 1: DANH SÁCH NGƯỜI THỤ HƯỞNG TRONG KẾ HOẠCH */}
      <Card className="p-5 bg-heritage-surface border-heritage-border rounded-[20px] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-heritage-gold" />
            <h3 className="text-sm font-bold text-heritage-text">
              1. Danh Sách Người Thụ Hưởng ({beneficiaries.length})
            </h3>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={onAddBeneficiary}
            className="rounded-[14px] border-heritage-border hover:bg-heritage-canvas text-xs font-bold gap-1.5 min-h-[38px]"
          >
            <Plus className="w-4 h-4 text-heritage-gold" />
            <span>Thêm Người Thụ Hưởng</span>
          </Button>
        </div>

        <div className="space-y-3">
          {beneficiaries.map((b, idx) => (
            <div
              key={b.id}
              className="p-3.5 bg-white border border-heritage-neutral-bg rounded-[16px] grid grid-cols-1 sm:grid-cols-3 gap-3 items-center"
            >
              <div>
                <label className="text-[10px] font-bold text-heritage-muted uppercase block mb-1">
                  Họ và tên #{idx + 1}
                </label>
                <Input
                  value={b.name}
                  onChange={(e) => onUpdateBeneficiary(b.id, "name", e.target.value)}
                  placeholder="VD: Nguyễn Văn A"
                  className="h-9 text-xs bg-heritage-surface"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-heritage-muted uppercase block mb-1">
                  Email / Số Điện Thoại
                </label>
                <Input
                  value={b.contact}
                  onChange={(e) => onUpdateBeneficiary(b.id, "contact", e.target.value)}
                  placeholder="VD: a.nguyen@example.com"
                  className="h-9 text-xs bg-heritage-surface"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <label className="text-[10px] font-bold text-heritage-muted uppercase block mb-1">
                    Mối Quan Hệ
                  </label>
                  <Input
                    value={b.relationship}
                    onChange={(e) => onUpdateBeneficiary(b.id, "relationship", e.target.value)}
                    placeholder="VD: Con ruột / Vợ chồng"
                    className="h-9 text-xs bg-heritage-surface"
                  />
                </div>
                {beneficiaries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onRemoveBeneficiary(b.id)}
                    className="mt-4 p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                    title="Xóa người thụ hưởng"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* PHẦN 2: CHỈ ĐỊNH NGƯỜI NHẬN CHO TỪNG TÀI SẢN */}
      <Card className="p-5 bg-heritage-surface border-heritage-border rounded-[20px] space-y-4">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-heritage-success" />
          <h3 className="text-sm font-bold text-heritage-text">
            2. Gán Người Nhận Cho Từng Tài Sản ({selectedAssets.length} tài sản)
          </h3>
        </div>

        <div className="space-y-3">
          {selectedAssets.map((asset) => {
            const assignedIds = designations[asset.id] || [];

            return (
              <div
                key={asset.id}
                className="p-4 bg-white border border-heritage-neutral-bg rounded-[16px] space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-heritage-text">{asset.title}</span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-heritage-primary-light text-heritage-success font-bold">
                    {asset.assetType}
                  </span>
                </div>

                <div>
                  <p className="text-[11px] text-heritage-muted mb-2 font-medium">
                    Chọn người nhận bản sao toàn vẹn của tài sản này:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {beneficiaries.map((b) => {
                      const isSelected = assignedIds.includes(b.id);
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => onToggleRecipient(asset.id, b.id)}
                          className={`px-3 py-1.5 rounded-[12px] text-xs font-semibold border transition-all ${
                            isSelected
                              ? "bg-heritage-sidebar text-white border-heritage-sidebar shadow-sm"
                              : "bg-heritage-surface text-heritage-text border-heritage-border hover:bg-heritage-canvas"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "}
                          {b.name || "Người nhận"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* PHẦN 3: KHO BÀN GIAO TỰ GOM THỜI GIAN THỰC (AUTO-BUNDLED VAULTS) */}
      <Card className="p-5 bg-heritage-gold-light border border-heritage-gold-border rounded-[20px] space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-heritage-gold" />
          <div>
            <h3 className="text-sm font-bold text-heritage-text">
              3. Kho Bàn Giao Tự Gom Theo Tập Người Nhận ({bundledVaults.length} kho hiệu lực)
            </h3>
            <p className="text-[11px] text-heritage-gold-hover">
              Hệ thống tự động gom tài sản có cùng người nhận thành một gói bàn giao (manifest).
            </p>
          </div>
        </div>

        {bundledVaults.length === 0 ? (
          <div className="p-4 bg-white/70 rounded-[14px] text-center text-xs text-heritage-muted">
            Chưa có tài sản nào được gán người nhận. Vui lòng chọn người nhận ở mục trên.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {bundledVaults.map((vault) => (
              <div
                key={vault.bundleId}
                className="p-4 bg-white border border-heritage-gold-border rounded-[16px] space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-heritage-gold" />
                    <span className="text-xs font-bold text-heritage-primary">
                      {vault.bundleId.toUpperCase()}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      vault.recipientMode === "SINGLE_RECIPIENT"
                        ? "bg-heritage-primary-light text-heritage-success"
                        : "bg-heritage-warning-bg text-heritage-warning"
                    }`}
                  >
                    {vault.recipientMode === "SINGLE_RECIPIENT" ? "Kho 1 Người" : "Kho Đồng Sở Hữu"}
                  </span>
                </div>

                <div className="text-xs text-heritage-text">
                  <span className="font-bold">Người nhận: </span>
                  <span className="text-heritage-success font-medium">{vault.recipientNames}</span>
                </div>

                <div className="text-[11px] text-heritage-muted">
                  <span>Số tài sản trong kho: </span>
                  <span className="font-bold text-heritage-text">
                    {vault.assetIds.length} tài sản
                  </span>
                </div>

                <div className="p-2 rounded-[10px] bg-heritage-surface border border-heritage-neutral-bg text-[10px] text-heritage-muted flex items-start gap-1.5">
                  <Info className="w-3.5 h-3.5 text-heritage-gold shrink-0 mt-0.5" />
                  <span>
                    {vault.recipientMode === "SINGLE_RECIPIENT"
                      ? "Được phép chọn chuyển 1:1 nguyên kho cho 1 người khác trước khi bắt đầu bàn giao."
                      : "Bắt buộc 100% người đồng sở hữu cùng đồng ý nhận mới bàn giao; cấm chuyển/chia lẻ."}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
