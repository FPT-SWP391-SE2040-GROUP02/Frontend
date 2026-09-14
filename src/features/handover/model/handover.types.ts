/**
 * @file handover.types.ts
 * @description Định nghĩa các kiểu dữ liệu, DTOs và ViewModels cho Phân hệ Bàn giao Di sản Số & Xác thực eKYC Người thụ hưởng.
 * Tuân thủ Rule 3 (Ánh xạ chuẩn DTO C# ASP.NET Core) và Rule 8 (JSDoc 100%).
 */

/**
 * Các trạng thái vòng đời bàn giao di sản của Người thụ hưởng
 */
export type HandoverClaimStatus =
  | "PENDING_NOTARY"                // Chờ Công chứng viên phê duyệt hồ sơ
  | "APPROVED_READY_FOR_HANDOVER"   // Đã duyệt, sẵn sàng xác thực eKYC và ghép khóa
  | "DECRYPTED_HANDED_OVER"         // Đã ghép khóa thành công, đã bàn giao di sản
  | "INHERITANCE_REFUSED";          // Người thụ hưởng từ chối nhận thừa kế theo Điều 620 BLDS

/**
 * Chi tiết hồ sơ thừa kế dành cho Người thụ hưởng (Ánh xạ từ DTO Backend C#)
 */
export interface BeneficiaryClaimDetailDto {
  /** Mã định danh hồ sơ yêu cầu bàn giao */
  id: string;
  /** Mã định danh Két di sản gốc */
  vaultId: string;
  /** Tên tiêu đề của Két di sản */
  vaultTitle: string;
  /** Họ và tên chủ di sản (Người đã khuất) */
  deceasedFullName: string;
  /** Ngày qua đời theo trích lục tử tuất */
  deceasedDateOfDeath: string;
  /** Họ và tên Người thụ hưởng */
  beneficiaryFullName: string;
  /** Số Căn cước công dân (CCCD) Người thụ hưởng */
  beneficiaryNationalId: string;
  /** Tỷ lệ phần trăm tài sản được hưởng (0.01 - 100.00%) */
  allocatedPercentage: number;
  /** Ngày công chứng viên phê duyệt hồ sơ */
  notaryApprovalDate: string;
  /** Tên văn phòng công chứng thẩm định */
  notaryOfficeName: string;
  /** Tên công chứng viên thụ lý và ký số */
  notaryOfficerName: string;
  /** Mảnh khóa Shamir 2 do Công chứng viên giải phóng sau khi thẩm định */
  notaryShare2: string;
  /** Mảnh khóa Shamir 1 được trích xuất từ Két di sản */
  vaultShare1: string;
  /** Bản mã di sản số đã mã hóa bằng AES-256-GCM (Base64) */
  encryptedAssetPayload: string;
  /** Vector khởi tạo (Initialization Vector 12 bytes - Base64) */
  assetPayloadIv: string;
  /** Tổng số lượng tài sản trong gói di sản */
  assetCount: number;
  /** Trạng thái hiện tại của hồ sơ */
  status: HandoverClaimStatus;
  /** Đường dẫn tải Biên bản bàn giao di sản số định dạng PDF/A do Backend C# ký số */
  pdfHandoverProtocolUrl?: string;
}

/**
 * Kết quả xác thực khuôn mặt sinh trắc học và kiểm tra người thật 3D (eKYC Liveness)
 */
export interface EkycSessionResult {
  /** Mã phiên kiểm tra sinh trắc học */
  sessionId: string;
  /** Điểm số trùng khớp khuôn mặt đối chiếu với CCCD gắn chip (0.0 - 100.0) */
  faceMatchScore: number;
  /** Độ tin cậy phát hiện người thật 3D (Anti-spoofing Liveness) (0.0 - 100.0) */
  livenessConfidence: number;
  /** Kết luận xác thực đạt tiêu chuẩn an ninh */
  isPassed: boolean;
  /** Thời gian xác thực hoàn tất */
  verifiedAt: string;
}

/**
 * Dữ liệu yêu cầu từ chối nhận di sản thừa kế theo Điều 620 Bộ luật Dân sự 2015
 */
export interface RefuseInheritanceRequest {
  /** Mã hồ sơ bàn giao */
  claimId: string;
  /** Lý do từ chối nhận di sản (tối thiểu 30 ký tự) */
  reason: string;
  /** Xác nhận pháp lý từ bỏ quyền thừa kế tự nguyện */
  confirmLegalWaiver: boolean;
  /** Đường dẫn file scan văn bản công chứng từ chối nhận di sản (nếu có) */
  notarizedDocScanUrl?: string;
}
