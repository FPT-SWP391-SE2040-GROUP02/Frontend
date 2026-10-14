import { requirePreviewWorkspace } from "@/shared/config/preview";

import type { ApiResponse, PaginatedList, PaginationParams } from "@/shared/types";
import type { SubmitClaimRequest, ClaimItemViewModel } from "@/entities/claim/model/claim.types";

/**
 * @file claimService.ts
 * @description Tầng dịch vụ API cho phân hệ Người Thi Hành Di Chúc (Executor Claims).
 * Tuân thủ Rule 7 (Scaffold with TODO) và Rule 8 (JSDoc chuẩn chỉnh).
 */

export interface PresignedUploadResponse {
  uploadUrl: string;
  objectKey: string;
  expiresInSeconds: number;
}

/**
 * Xin URL ký sẵn (Presigned URL) của Cloudflare R2 để tải trực tiếp file scan từ trình duyệt
 * @param fileName Tên tệp tin gốc
 * @param _contentType Định dạng tệp tin (ví dụ: application/pdf)
 * @returns Promise chứa thông tin uploadUrl và objectKey
 */
export async function getPresignedUploadUrl(
  fileName: string,
  _contentType: string,
): Promise<PresignedUploadResponse> {
  requirePreviewWorkspace();
  // TODO: [P2][DEATH-01] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Chốt transport chứng cứ private thay presigned mock.
  // 2. [INPUT & OUTPUT]: deathCaseId + file metadata -> documentId và trạng thái upload BE.
  // 3. [CÁC BƯỚC]: Sau AUTH-02 chốt POST /death-cases/{id}/documents; ưu tiên upload BE theo hợp đồng; presigned chỉ khi có staging/finalize; migrate DTO URL cũ.
  // 4. [HÀM / THƯ VIỆN]: Shared transport, FormData, Zod, TanStack Query; SHA-256 native nếu contract cần.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không tự dựng URL public từ objectKey; MIME/size/quota theo BE; quyền Executor và case/version; không coi presigned là đã tải xong.
  return {
    uploadUrl: `https://storage.legacyvault.vn/upload-mock/${encodeURIComponent(fileName)}`,
    objectKey: `claims/${Date.now()}_${fileName}`,
    expiresInSeconds: 600,
  };
}

/**
 * Nộp hồ sơ yêu cầu mở thừa kế kèm chứng từ tử tuất hoặc quyết định tòa án
 * @param _payload Dữ liệu hồ sơ gồm thông tin hộ tịch và mã băm SHA-256
 * @returns Promise chứa ApiResponse xác nhận đã nộp thành công
 */
export async function submitClaim(
  _payload: SubmitClaimRequest,
): Promise<ApiResponse<{ claimId: string; status: string }>> {
  requirePreviewWorkspace();
  // TODO: [P2][DEATH-02] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Tách tạo/nộp death-case khỏi beneficiary claim.
  // 2. [INPUT & OUTPUT]: Assignment + case/version/documentIds -> caseId/status từ BE.
  // 3. [CÁC BƯỚC]: Sau DEATH-01 chốt POST /death-cases rồi /death-cases/{id}/submit; migrate types/schema/hooks; chờ server xác nhận, invalidate.
  // 4. [HÀM / THƯ VIỆN]: createBaseService, Zod, TanStack Query, death-case entity adapter.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không POST /claims/submit legacy; ghim snapshot/deadlines/hold ở BE; idempotency và bổ sung evidence; không optimistic/legal mock success.
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
  params?: PaginationParams,
): Promise<PaginatedList<ClaimItemViewModel>> {
  requirePreviewWorkspace();
  // TODO: [P2][DEATH-03] DEVELOPER BLUEPRINT - thứ tự trong module theo mã số.
  // 1. [MỤC TIÊU]: Nối hồ sơ chứng tử Executor theo assignment.
  // 2. [INPUT & OUTPUT]: Scope + page/pageSize/q -> DTO death-case data/meta.
  // 3. [CÁC BƯỚC]: Sau DEATH-02 chốt route list với BE3; /executor/death-cases là đề nghị; migrate /claims/my-claims; adapters và queryKeys theo account/case.
  // 4. [HÀM / THƯ VIỆN]: createBaseService, BackendPageResponse, Zod, TanStack Query.
  // 5. [ĐIỀU KIỆN BIÊN & NGOẠI LỆ]: Không lẫn /claims/me của người nhận; 403/404/empty/error; không lộ chứng cứ ngoài scope; không fallback mock khi BE lỗi.
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
