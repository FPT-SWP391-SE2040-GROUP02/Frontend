/**
 * @file will.types.ts
 * @description Định nghĩa các kiểu dữ liệu, DTO và ViewModel cho Hệ thống Quản Lý Di Chúc Số (Digital Will & Testament Protocol).
 * Tuân thủ quy chuẩn C# ASP.NET Core Backend DTO và FSD Architecture.
 */

/**
 * Các trạng thái vòng đời của một bản Di chúc số
 */
export type WillStatus = 
  | "DRAFT"              // Đang soạn thảo
  | "SEALED"             // Đã niêm phong mật mã học & ký số ECDSA
  | "PROBATE_AWAITING"   // Đang chờ công chứng viên thẩm định pháp lý
  | "EXECUTED"           // Đã thi hành bàn giao di sản
  | "REVOKED";           // Đã bị người lập di chúc thu hồi / hủy bỏ

/**
 * Thông tin phân bổ tài sản cho người thừa kế / thụ hưởng
 */
export interface BeneficiaryAllocation {
  /** Mã định danh người thụ hưởng */
  beneficiaryId: string;
  /** Họ và tên người thụ hưởng */
  beneficiaryName: string;
  /** Mối quan hệ với người lập di chúc (Con ruột, Vợ/Chồng, Cha/Mẹ,...) */
  relationship: string;
  /** Số CCCD / Định danh định danh cá nhân */
  citizenId: string;
  /** Tỷ lệ phần trăm thừa kế (0 - 100) */
  percentage: number;
  /** Ghi chú nguyện vọng riêng */
  specialConditions?: string;
}

/**
 * Bằng chứng video tuyên thệ minh mẫn hợp pháp (Điều 630 BLDS 2015)
 */
export interface AffidavitProof {
  /** Thời lượng ghi hình video (giây, tối thiểu 15 giây) */
  videoDurationSeconds: number;
  /** Mã băm toàn vẹn SHA-256 của file video */
  sha256Hash: string;
  /** Thời điểm ghi hình */
  recordedAt: string;
  /** Đường dẫn URL tạm thời hoặc Blob URL xem lại */
  videoUrl?: string;
  /** Người dùng đã bấm xác nhận cam đoan minh mẫn */
  isConfirmed: boolean;
}

/**
 * Chữ ký số mật mã học niêm phong di chúc (ECDSA P-256)
 */
export interface CryptographicSeal {
  /** Thuật toán ký số */
  algorithm: "ECDSA_P256_SHA256";
  /** Khóa công khai của người lập di chúc */
  publicKeyPem: string;
  /** Chữ ký số điện tử của bản di chúc */
  signatureBase64: string;
  /** Mã băm toàn vẹn bản di chúc (Will Digest) */
  willDigestSha256: string;
  /** Thời điểm niêm phong chính xác */
  sealedAt: string;
}

/**
 * DTO dữ liệu thô nhận từ C# Backend API
 */
export interface WillItemDto {
  id: string;
  title: string;
  declarationNotes?: string;
  status: WillStatus;
  selectedAssetIds: string[];
  allocations: BeneficiaryAllocation[];
  affidavitProof: AffidavitProof;
  seal?: CryptographicSeal;
  createdAt: string;
  updatedAt: string;
}

/**
 * ViewModel chuẩn hóa phục vụ tầng giao diện UI
 */
export interface WillViewModel {
  id: string;
  title: string;
  declarationNotes: string;
  status: WillStatus;
  statusLabel: string;
  assetCount: number;
  selectedAssetIds: string[];
  allocations: BeneficiaryAllocation[];
  beneficiaryCount: number;
  hasAffidavit: boolean;
  affidavitHashShort: string;
  isSealed: boolean;
  sealedAtFormatted?: string;
  createdAtFormatted: string;
}

/**
 * Dữ liệu Form thu thập qua 4 bước của Stepper Wizard
 */
export interface CreateWillFormValues {
  /** Bước 1: Khai báo ý chí & chọn tài sản */
  title: string;
  declarationNotes: string;
  selectedAssetIds: string[];

  /** Bước 2: Phân bổ tỷ lệ cho người thừa kế (Tổng = 100%) */
  allocations: BeneficiaryAllocation[];
  legalComplianceConfirmed: boolean; // Cam đoan Điều 644 BLDS 2015

  /** Bước 3: Video tuyên thệ minh mẫn 15s (Điều 630 BLDS 2015) */
  affidavitProof: AffidavitProof;

  /** Bước 4: Ký số xác nhận */
  confirmDigitalSignature: boolean;
}

/**
 * Payload gửi lên Backend API để tạo hoặc cập nhật di chúc
 */
export interface CreateWillRequest {
  title: string;
  declarationNotes?: string;
  selectedAssetIds: string[];
  allocations: BeneficiaryAllocation[];
  affidavitProof: AffidavitProof;
}
