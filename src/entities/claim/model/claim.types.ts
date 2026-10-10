/**
 * @file claim.types.ts
 * @description Định nghĩa kiểu dữ liệu và DTO cho phân hệ Người Thi Hành Di Chúc (Executor Claims).
 * Tương thích chuẩn C# ASP.NET Core EF Core (Bảng LegalClaims).
 */

export type ClaimDocumentType = 
  | "DEATH_CERTIFICATE"      // Trích lục khai tử do UBND cấp
  | "COURT_MISSING_DECREE"   // Quyết định Tòa án tuyên bố mất tích (Điều 68 BLDS)
  | "COURT_DEATH_DECREE";    // Quyết định Tòa án tuyên bố đã chết (Điều 71 BLDS)

export type ClaimStatus = 
  | "DRAFT"            // Bản nháp chưa gửi
  | "CLAIM_PENDING"    // Đã nộp, đang chờ công chứng viên thụ lý
  | "APPROVED"         // Đã thẩm định & phê duyệt thành công
  | "REJECTED"         // Bị từ chối, yêu cầu bổ sung
  | "FROZEN";          // Đóng băng khẩn cấp do tranh chấp/chủ kho hồi sinh

/**
 * @description DTO thông tin hồ sơ tử tuất gửi lên từ Executor
 */
export interface SubmitClaimRequest {
  vaultId: string;
  documentType: ClaimDocumentType;
  deathCertificateNumber: string;
  deathCertificateIssueDate: string;
  deathCertificateIssuer: string;
  deathCertScanUrl: string;
  deathCertScanHash: string; // Mã băm SHA-256 tính từ client
  executorNotes?: string;
}

/**
 * @description ViewModel hiển thị trạng thái hồ sơ yêu cầu mở thừa kế
 */
export interface ClaimItemViewModel {
  id: string;
  vaultId: string;
  vaultTitle: string;
  ownerFullName: string;
  ownerNationalId: string;
  documentType: ClaimDocumentType;
  deathCertificateNumber: string;
  deathCertificateIssueDate: string;
  deathCertificateIssuer: string;
  deathCertScanUrl: string;
  deathCertScanHash: string;
  claimStatus: ClaimStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedByNotaryName?: string;
  notaryNotes?: string;
  rejectionReasonCode?: string;
}
