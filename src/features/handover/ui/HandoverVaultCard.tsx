import React from "react";
import { Button, Card } from "@/shared/ui";
import { Package, ArrowRightLeft, Check, X, Download, FileText, Clock, AlertTriangle, RotateCcw, Sparkles, Info } from "lucide-react";
import type { HandoverVaultDto } from "../model/handover.types";

/**
 * @file HandoverVaultCard.tsx
 * @description Thẻ hiển thị một Kho Bàn Giao Tự Gom theo chuẩn SRS 3.11.0 (Luồng 4A - 4H).
 * Xử lý:
 * - Chuyển 1:1 trước khi bắt đầu (Luồng 4B)
 * - Quyết định Nhận / Từ chối (Luồng 4D)
 * - Đổi từ Từ chối sang Nhận trong thời hạn 2 năm suy nghĩ lại (Luồng 4E)
 * - Tải file / Xuất file JSON tài khoản ví (Luồng 4F)
 */

interface HandoverVaultCardProps {
  vault: HandoverVaultDto;
  isExecutor?: boolean;
  onOpenTransferModal?: (vaultId: string) => void;
  onCancelTransfer?: (vaultId: string) => void;
  onDecision?: (vaultId: string, decision: "ACCEPTED" | "REJECTED") => void;
  onReconsiderAccept?: (vaultId: string) => void;
}

export const HandoverVaultCard: React.FC<HandoverVaultCardProps> = ({
  vault,
  isExecutor = false,
  onOpenTransferModal,
  onCancelTransfer,
  onDecision,
  onReconsiderAccept,
}) => {

  const isStarted = !!vault.handoverStartedAt;
  const isCommitted = vault.status === "HANDOVER_COMMITTED";
  const isFrozen = vault.status === "FROZEN_RECONSIDERATION";
  const hasTransferChoice = !!vault.transferChoice && vault.transferChoice.status === "ACTIVE";

  const handleExportJson = (asset: HandoverVaultDto["assets"][0]) => {
    if (!asset.accountPayload) return;
    const jsonString = JSON.stringify(asset.accountPayload, null, 2);
    const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${asset.title.replace(/\s+/g, "_")}_credentials.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="p-6 bg-[#FAF9F5] border-[#DCD9D0] rounded-[22px] space-y-5 shadow-sm">
      {/* Header Thẻ Kho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8E5DD]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-[14px] bg-[#0B291E] flex items-center justify-center text-[#B88E4C] shadow-sm">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#14241C]">{vault.planTitle}</h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                vault.recipientMode === "SINGLE_RECIPIENT"
                  ? "bg-[#E5EDE8] text-[#059669]"
                  : "bg-[#FFFBEB] text-[#B45309]"
              }`}>
                {vault.recipientMode === "SINGLE_RECIPIENT" ? "Kho 1 Người" : "Kho Đồng Sở Hữu"}
              </span>
            </div>
            <p className="text-xs text-[#66786E]">
              Chủ di sản: <span className="font-semibold text-[#14241C]">{vault.ownerFullName}</span>
            </p>
          </div>
        </div>

        {/* Trạng thái kho */}
        <div className="flex items-center gap-2">
          {isCommitted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E5EDE8] text-[#059669] text-xs font-bold">
              <Check className="w-3.5 h-3.5" /> Đã Cam Kết Bàn Giao
            </span>
          ) : isFrozen ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FEF2F2] text-[#DC2626] text-xs font-bold">
              <Clock className="w-3.5 h-3.5" /> Đóng Băng Suy Nghĩ Lại (2 Năm)
            </span>
          ) : isStarted ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFFBEB] text-[#B45309] text-xs font-bold">
              <Clock className="w-3.5 h-3.5" /> Đang Mở Phản Hồi (7 Ngày)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFECE6] text-[#66786E] text-xs font-bold">
              {vault.scheduledHandoverDate ? `Hẹn bàn giao: ${vault.scheduledHandoverDate}` : "Chờ thống nhất ngày"}
            </span>
          )}
        </div>
      </div>

      {/* Thông tin người nhận & Thông báo chuyển dự kiến (Luồng 4B) */}
      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-[#66786E]">Người nhận trong hồ sơ:</span>
          <span className="font-bold text-[#14241C]">{vault.recipientNames.join(", ")}</span>
        </div>

        {hasTransferChoice && (
          <div className="p-3 rounded-[14px] bg-[#FBF7EE] border border-[#E8DCC6] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-[#B88E4C]" />
              <div>
                <span className="font-bold text-[#0B291E]">Dự kiến chuyển nguyên kho: </span>
                <span className="text-[#059669] font-semibold">{vault.transferChoice?.targetRecipientName}</span>
                <span className="text-[10px] text-[#A07839] block">
                  (Có thể đổi đích hoặc hủy trước khi Executor bấm Bắt đầu)
                </span>
              </div>
            </div>

            {!isStarted && !isExecutor && onCancelTransfer && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancelTransfer(vault.handoverVaultId)}
                className="h-8 text-xs font-bold text-red-600 border-red-200 hover:bg-red-50"
              >
                Hủy chuyển
              </Button>
            )}
          </div>
        )}

        {/* Thông báo tiến độ đồng thuận kho đồng sở hữu */}
        {vault.recipientMode === "CO_OWNED" && (
          <div className="p-2.5 rounded-[12px] bg-[#FAF9F5] border border-[#E8E5DD] flex items-center gap-2 text-[11px] text-[#66786E]">
            <Info className="w-4 h-4 text-[#B88E4C] shrink-0" />
            <span>
              {vault.coOwnedConsensusText || "Kho đồng sở hữu: Bắt buộc 100% người thụ hưởng cùng bấm Nhận mới mở quyền tải."}
            </span>
          </div>
        )}
      </div>

      {/* Danh sách tài sản trong kho bàn giao */}
      <div className="space-y-2.5 pt-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#66786E] block">
          Danh mục tài sản ({vault.assets.length})
        </span>

        <div className="divide-y divide-[#E8E5DD] border border-[#E8E5DD] rounded-[16px] bg-white overflow-hidden">
          {vault.assets.map((asset) => (
            <div key={asset.assetId} className="p-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-[#0B291E]" />
                <div>
                  <span className="font-bold text-[#14241C] block">{asset.title}</span>
                  <span className="text-[10px] text-[#66786E]">
                    Loại: {asset.assetType === "FILE" ? "Tệp tin số" : asset.assetType === "ACCOUNT" ? "Tài khoản" : "Ví Crypto"}
                  </span>
                </div>
              </div>

              {/* Thao tác xem/tải sau khi đã Cam Kết Bàn Giao (Luồng 4F) */}
              {isCommitted && (
                <div>
                  {asset.assetType === "FILE" && asset.downloadUrl ? (
                    <a
                      href={asset.downloadUrl}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[#0B291E] text-white font-bold text-xs hover:bg-[#133E2F] transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-[#B88E4C]" />
                      <span>Tải file</span>
                    </a>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleExportJson(asset)}
                      className="rounded-[12px] bg-[#0B291E] text-white text-xs font-bold gap-1.5 h-8"
                    >
                      <Download className="w-3.5 h-3.5 text-[#B88E4C]" />
                      <span>Xuất JSON</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER THAO TÁC CỦA NGƯỜI DÙNG */}
      <div className="pt-3 border-t border-[#E8E5DD] flex flex-wrap items-center justify-between gap-3">
        {/* Trường hợp 1: Chưa bắt đầu -> Cho phép Chuyển 1:1 nếu là SINGLE_RECIPIENT */}
        {!isStarted && !isExecutor && vault.recipientMode === "SINGLE_RECIPIENT" && onOpenTransferModal && (
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenTransferModal(vault.handoverVaultId)}
            className="rounded-[14px] text-xs font-bold gap-1.5 border-[#B88E4C] text-[#0B291E] hover:bg-[#FBF7EE] min-h-[40px]"
          >
            <ArrowRightLeft className="w-4 h-4 text-[#B88E4C]" />
            <span>{hasTransferChoice ? "Đổi Đích Chuyển 1:1" : "Chuyển Nguyên Kho 1:1"}</span>
          </Button>
        )}

        {/* Trường hợp 2: Đã bắt đầu và đang chờ phản hồi -> Nút Nhận hoặc Từ Chối */}
        {isStarted && !isCommitted && !isFrozen && onDecision && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              onClick={() => onDecision(vault.handoverVaultId, "ACCEPTED")}
              className="flex-1 sm:flex-none min-h-[42px] rounded-[16px] bg-[#0B291E] hover:bg-[#133E2F] text-white text-xs font-bold px-5 gap-1.5"
            >
              <Check className="w-4 h-4 text-[#B88E4C]" />
              <span>Đồng Ý Nhận Tài Sản</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onDecision(vault.handoverVaultId, "REJECTED")}
              className="flex-1 sm:flex-none min-h-[42px] rounded-[16px] border-red-200 text-red-600 hover:bg-red-50 text-xs font-bold px-4 gap-1.5"
            >
              <X className="w-4 h-4" />
              <span>Từ Chối</span>
            </Button>
          </div>
        )}

        {/* Trường hợp 3: Đang đóng băng 2 năm suy nghĩ lại -> Cho phép Đổi sang Nhận */}
        {isFrozen && onReconsiderAccept && (
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-[#DC2626] font-medium flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Hạn suy nghĩ lại: Đến {vault.freezeExpiresAt || "2 năm sau mốc từ chối"}
            </span>
            <Button
              type="button"
              onClick={() => onReconsiderAccept(vault.handoverVaultId)}
              className="min-h-[42px] rounded-[16px] bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold px-5 gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Đổi Ý & Đồng Ý Nhận</span>
            </Button>
          </div>
        )}

        {/* Trường hợp 4: Đã Cam Kết Bàn Giao -> Hiển thị hạn tải 168 giờ */}
        {isCommitted && (
          <div className="text-xs text-[#059669] font-medium flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-[#B88E4C]" />
            <span>Tải miễn phí trong hạn 168 giờ (còn {vault.freeDownloadHoursRemaining || 168} giờ)</span>
          </div>
        )}
      </div>
    </Card>
  );
};
