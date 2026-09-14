import { axiosClient } from "@/shared/api";
import type { ApiResponse, PaginatedList, PaginationParams } from "@/shared/types";
import type { SubmitClaimRequest, ClaimItemViewModel } from "../model/claim.types";

/**
 * @file claimService.ts
 * @description Tầng dịch vụ API cho phân hệ Người Thi Hành Di Chúc (Executor Claims).
 * Tuân thủ Rule 7 (Scaffold with TODO) và Rule 8 (JSDoc chuẩn chỉnh).
 */

const CLAIMS_ENDPOINT = "/claims";
const STORAGE_ENDPOINT = "/storage";

export interface PresignedUploadResponse {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}

/**
 * Xin URL ký sẵn (Presigned URL) của Cloudflare R2 để tải trực tiếp file scan từ trình duyệt
 * @param fileName Tên tệp tin gốc
 * @param contentType Định dạng tệp tin (ví dụ: application/pdf)
 * @returns Promise chứa thông tin uploadUrl và objectKey
 */
export async function getPresignedUploadUrl(
  fileName: string,
  contentType: string
): Promise<PresignedUploadResponse> {
  // TODO: [Developer Step]
  // 1. Gọi POST /storage/presigned-upload qua axiosClient kèm { fileName, contentType }
  // 2. Trả về { uploadUrl, objectKey, expiresInSeconds } từ máy chủ
  return {
    uploadUrl: `https://storage.legacyvault.vn/upload-mock/${encodeURIComponent(fileName)}`,
    objectKey: `claims/${Date.now()}_${fileName}`,
    expiresInSeconds: 600,
  };
}

/**
 * Nộp hồ sơ yêu cầu mở thừa kế kèm chứng từ tử tuất hoặc quyết định tòa án
 * @param payload Dữ liệu hồ sơ gồm thông tin hộ tịch và mã băm SHA-256
 * @returns Promise chứa ApiResponse xác nhận đã nộp thành công
 */
export async function submitClaim(
  payload: SubmitClaimRequest
): Promise<ApiResponse<{ claimId: string; status: string }>> {
  // TODO: [Developer Step]
  // 1. Validate payload bằng submitClaimSchema
  // 2. Gọi POST /claims/submit qua axiosClient kèm Authorization token
  // 3. Trả về kết quả xác nhận thụ lý hồ sơ
  return {
    success: true,
    message: "Nộp hồ sơ mở thừa kế thành công! Hồ sơ đã được chuyển đến Công chứng viên thẩm định.",
    data: {
      claimId: `clm_${Date.now()}`,
      status: "CLAIM_PENDING",
    },
  };
}

/**
 * Lấy danh sách hồ sơ do Người thi hành hiện tại quản lý
 * @param params Tham số phân trang và lọc
 * @returns Promise chứa danh sách hồ sơ phân trang
 */
export async function getExecutorClaims(
  params?: PaginationParams
): Promise<PaginatedList<ClaimItemViewModel>> {
  // TODO: [Developer Step]
  // 1. Gọi GET /claims/my-claims qua axiosClient
  // 2. Trả về PaginatedList<ClaimItemViewModel>
  const mockItems: ClaimItemViewModel[] = [
    {
      id: "clm_01",
      vaultId: "vlt_01",
      vaultTitle: "Két Di Sản Gia Tộc Hayes",
      ownerFullName: "Alexander Hayes",
      ownerNationalId: "001090012345",
      documentType: "DEATH_CERTIFICATE",
      deathCertificateNumber: "TLKT-2026/089/UBND-PBN",
      deathCertificateIssueDate: "2026-09-02",
      deathCertificateIssuer: "UBND Phường Bến Nghé, Quận 1, TP.HCM",
      deathCertScanUrl: "https://storage.legacyvault.vn/mock/sample_death_cert.pdf",
      deathCertScanHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      claimStatus: "CLAIM_PENDING",
      submittedAt: "2026-09-10T08:30:00Z",
    },
  ];

  return {
    items: mockItems,
    totalCount: mockItems.length,
    pageIndex: params?.pageIndex || 1,
    pageSize: params?.pageSize || 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}
