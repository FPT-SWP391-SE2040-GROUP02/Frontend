/**
 * @file notary.types.ts
 * @description Định nghĩa kiểu dữ liệu và DTO cho phân hệ Công Chứng Viên Thẩm Định Pháp Lý (Legal Verifier / Notary).
 * Tương thích chuẩn C# ASP.NET Core EF Core (Bảng LegalClaims và KeyShares).
 */

import type { ClaimDocumentType, ClaimStatus } from "@/features/claims";

/**
 * @description 4 tiêu chí kiểm toán bắt buộc của Công chứng viên trước khi phê duyệt mở thừa kế
 */
export interface AuditCriteriaChecklist {
  /** 1. Chứng từ hợp pháp (Trích lục khai tử UBND cấp hoặc Bản án có hiệu lực) */
  isDocumentValid: boolean;
  /** 2. Số CCCD và thông tin nhân thân hoàn toàn trùng khớp */
  isIdentityMatched: boolean;
  /** 3. Manifest_hash nguyên vẹn, không có dấu hiệu can thiệp trái phép */
  isManifestIntegrityVerified: boolean;
  /** 4. Tư cách Người thi hành (Executor) đúng thẩm quyền chỉ định */
  isExecutorAuthorized: boolean;
}

/**
 * @description DTO chi tiết hồ sơ yêu cầu mở thừa kế cần công chứng viên thụ lý
 */
export interface NotaryClaimItemDto {
  id: string;
  vaultId: string;
  vaultTitle: string;
  ownerId: string;
  ownerFullName: string;
  ownerNationalId: string;
  ownerDateOfBirth: string;
  ownerAddress: string;
  manifestHash: string;
  ownerSignature: string;
  lucidityVideoUrl?: string;
  lucidityVideoHash?: string;
  executorId: string;
  executorFullName: string;
  executorNationalId: string;
  executorEmail: string;
  executorPhone: string;
  documentType: ClaimDocumentType;
  deathCertificateNumber: string;
  deathCertificateIssueDate: string;
  deathCertificateIssuer: string;
  deathCertScanUrl: string;
  deathCertScanHash: string;
  claimStatus: ClaimStatus;
  submittedAt: string;
  executorNotes?: string;
}

export type NotaryClaimDetailViewModel = NotaryClaimItemDto;

/**
 * @description DTO phê duyệt hồ sơ và giải phóng Mảnh khóa Verifier (Shamir Share 2)
 */
export interface ApproveClaimRequest {
  claimId: string;
  notaryPinCode: string;
  notaryDigitalSignature?: string;
  checkCriteria: AuditCriteriaChecklist;
  notaryNotes?: string;
}

/**
 * @description DTO từ chối hồ sơ và yêu cầu bổ sung
 */
export interface RejectClaimRequest {
  claimId: string;
  rejectionReasonCode: string;
  notaryNotes: string; // Tối thiểu 20 ký tự giải trình
}
