/**
 * @file handover.types.ts
 * @description Định nghĩa các kiểu dữ liệu, DTOs và ViewModels cho Phân hệ Bàn giao Di sản Số (SRS 3.11.0 - Luồng 4A đến 4H).
 * Bàn giao theo Kho bàn giao tự gom (Handover Vault), Chuyển 1:1 có thể đổi/hủy trước khi Executor bấm bắt đầu,
 * và Thời hạn 2 năm suy nghĩ lại (Reconsideration).
 */

import type { HandoverStatus, RecipientMode, TransferStatus } from "@/shared/constants";

/**
 * Chi tiết Kho bàn giao tự gom dành cho Người thụ hưởng (Beneficiary)
 */
export interface HandoverVaultDto {
  /** Mã định danh Kho bàn giao */
  handoverVaultId: string;
  /** Tên định danh kế hoạch / di sản */
  planTitle: string;
  /** Họ tên chủ sở hữu (Người đã khuất) */
  ownerFullName: string;
  /** Chế độ người nhận (Kho 1 người hoặc Đồng sở hữu) */
  recipientMode: RecipientMode;
  /** Trạng thái hiện tại của kho bàn giao */
  status: HandoverStatus;
  /** Danh sách ID người nhận gốc */
  originalRecipientIds: string[];
  /** Danh sách tên người nhận */
  recipientNames: string[];
  /** Số lượng tài sản trong kho bàn giao */
  assetCount: number;
  /** Dung lượng ước tính (Bytes) */
  totalSizeBytes: number;
  /** Ngày bàn giao chung đã thống nhất (YYYY-MM-DD) */
  scheduledHandoverDate?: string;
  /** Thời điểm Executor bấm bắt đầu bàn giao (ISO string) */
  handoverStartedAt?: string;
  /** Hạn chót phản hồi ban đầu (7 ngày = handoverStartedAt + 168h) */
  initialResponseDueAt?: string;
  /** Thời điểm bắt đầu đóng băng suy nghĩ lại 2 năm */
  freezeStartedAt?: string;
  /** Thời điểm hết hạn 2 năm suy nghĩ lại */
  freezeExpiresAt?: string;
  /** Lựa chọn chuyển 1:1 đang hiệu lực (nếu có, chỉ dành cho SINGLE_RECIPIENT) */
  transferChoice?: TransferChoiceDto;
  /** Danh sách tài sản trong kho bàn giao */
  assets: HandoverAssetItem[];
  /** Quyết định của người nhận hiện tại */
  currentRecipientDecision?: "PENDING" | "ACCEPTED" | "REJECTED";
  /** Tiến độ đồng thuận kho đồng sở hữu (VD: "1/2 người đã đồng ý") */
  coOwnedConsensusText?: string;
  /** Số giờ tải miễn phí còn lại (trong hạn 168 giờ) */
  freeDownloadHoursRemaining?: number;
}

/**
 * Thông tin tài sản nằm trong Kho bàn giao
 */
export interface HandoverAssetItem {
  assetId: string;
  title: string;
  assetType: "FILE" | "ACCOUNT" | "CRYPTO_WALLET";
  fileSizeBytes?: number;
  downloadUrl?: string;
  accountPayload?: {
    platformName?: string;
    loginUrl?: string;
    username?: string;
    password?: string;
    walletAddress?: string;
    blockchainNetwork?: string;
    securityNotes?: string;
  };
}

/**
 * DTO lựa chọn chuyển quyền 1:1 nguyên kho (SRS 3.11.0 - REDIST-01 đến 06)
 */
export interface TransferChoiceDto {
  choiceId: string;
  handoverVaultId: string;
  originalRecipientId: string;
  originalRecipientName: string;
  targetRecipientId: string;
  targetRecipientName: string;
  status: TransferStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Request Executor ghi ngày bàn giao chung đã thống nhất (Luồng 4A)
 */
export interface SetHandoverScheduleRequest {
  claimId: string;
  scheduledDate: string; // YYYY-MM-DD Asia/Ho_Chi_Minh
  notes?: string;
}

/**
 * Request Người nhận gốc chọn hoặc đổi đích chuyển 1:1 (Luồng 4B)
 */
export interface SetTransferChoiceRequest {
  handoverVaultId: string;
  targetRecipientId: string;
}

/**
 * Request Beneficiary quyết định Nhận hoặc Từ chối (Luồng 4D & 4E)
 */
export interface HandoverDecisionRequest {
  handoverVaultId: string;
  decision: "ACCEPTED" | "REJECTED";
}

/**
 * Request nhập tài sản vào Kho cá nhân (PersonalVault - Luồng 4G)
 */
export interface ImportPersonalVaultRequest {
  handoverVaultId: string;
  selectedAssetIds: string[];
}
