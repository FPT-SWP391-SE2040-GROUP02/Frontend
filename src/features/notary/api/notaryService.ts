import { axiosClient } from "@/shared/api";
import type { ApiResponse, PaginatedList, PaginationParams } from "@/shared/types";
import type {
  NotaryClaimItemDto,
  ApproveClaimRequest,
  RejectClaimRequest,
} from "../model/notary.types";

/**
 * @file notaryService.ts
 * @description Tầng dịch vụ API cho phân hệ Công Chứng Viên Thẩm Định Pháp Lý.
 * Tuân thủ Rule 7 (Scaffold with TODO) và Rule 8 (JSDoc chuẩn chỉnh).
 */

const NOTARY_ENDPOINT = "/notary";

/**
 * Lấy danh sách hồ sơ tử tuất/mất tích đang chờ thẩm định (CLAIM_PENDING)
 * @param params Tham số phân trang
 * @returns Promise chứa danh sách hồ sơ phân trang
 */
export async function getPendingClaims(
  params?: PaginationParams
): Promise<PaginatedList<NotaryClaimItemDto>> {
  // TODO: [Developer Step]
  // 1. Gọi GET /notary/claims/pending qua axiosClient kèm Authorization token của LegalVerifier
  // 2. Map dữ liệu trả về PaginatedList<NotaryClaimItemDto>
  const mockItems: NotaryClaimItemDto[] = [
    {
      id: "clm_01",
      vaultId: "vlt_01",
      vaultTitle: "Két Di Sản Gia Tộc Hayes",
      ownerId: "usr_owner_01",
      ownerFullName: "Alexander Hayes",
      ownerNationalId: "001090012345",
      ownerDateOfBirth: "1968-05-14",
      ownerAddress: "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
      manifestHash: "a6c8e3d2f1b0a9c8e7d6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4",
      ownerSignature: "MEYCIQC8v9G7p4zL2yK1m0N3b5V8c9X2a4Z7q0W1e3R5t7Y9uAIhAP1o3I5u7Y9t1R3e5W7q9Z0a2X4c6V8b0N1m2K4y6L8z",
      lucidityVideoUrl: "https://storage.legacyvault.vn/mock/oath_15s.mp4",
      lucidityVideoHash: "b5c4d3e2f1a0987654321fedcba0987654321fedcba0987654321fedcba09876",
      executorId: "usr_exec_01",
      executorFullName: "Trần Minh Thi Hành",
      executorNationalId: "079085006789",
      executorEmail: "executor.tran@legacyvault.vn",
      executorPhone: "0908123456",
      documentType: "DEATH_CERTIFICATE",
      deathCertificateNumber: "TLKT-2026/089/UBND-PBN",
      deathCertificateIssueDate: "2026-09-02",
      deathCertificateIssuer: "UBND Phường Bến Nghé, Quận 1, TP.HCM",
      deathCertScanUrl: "https://storage.legacyvault.vn/mock/sample_death_cert.pdf",
      deathCertScanHash: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      claimStatus: "CLAIM_PENDING",
      submittedAt: "2026-09-10T08:30:00Z",
      executorNotes: "Hồ sơ trích lục khai tử gốc đã đối soát với dữ liệu gia đình hạt nhân.",
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

/**
 * Phê duyệt hồ sơ thừa kế và giải phóng Mảnh khóa Verifier (Shamir Share 2)
 * @param payload Dữ liệu phê duyệt kèm 4 tiêu chí kiểm toán và mã PIN ký số
 * @returns Promise xác nhận phê duyệt thành công
 */
export async function approveClaim(
  payload: ApproveClaimRequest
): Promise<ApiResponse<{ releasedShareIndex: number; vaultStatus: string }>> {
  // TODO: [Developer Step]
  // 1. Kiểm tra đủ 4 tiêu chí kiểm toán trong payload.checkCriteria
  // 2. Gọi POST /notary/claims/{claimId}/approve kèm notaryPinCode
  // 3. Backend giải phóng Mảnh khóa 2 trong bảng KeyShares và chuyển Vault sang APPROVED
  return {
    success: true,
    message: "Phê duyệt hồ sơ thành công! Mảnh khóa công chứng (Share 2) đã được giải phóng.",
    data: {
      releasedShareIndex: 2,
      vaultStatus: "APPROVED",
    },
  };
}

/**
 * Từ chối hồ sơ thừa kế và gửi thông báo yêu cầu bổ sung cho Executor
 * @param payload Dữ liệu từ chối gồm mã lý do và văn bản giải trình >= 20 ký tự
 * @returns Promise xác nhận từ chối hồ sơ
 */
export async function rejectClaim(
  payload: RejectClaimRequest
): Promise<ApiResponse<{ claimStatus: string }>> {
  // TODO: [Developer Step]
  // 1. Validate payload.notaryNotes.length >= 20
  // 2. Gọi POST /notary/claims/{claimId}/reject kèm rejectionReasonCode
  // 3. Backend chuyển trạng thái hồ sơ sang REJECTED và phát email thông báo cho Executor
  return {
    success: true,
    message: "Đã từ chối hồ sơ và gửi thông báo yêu cầu sửa đổi bổ sung cho Người thi hành.",
    data: {
      claimStatus: "REJECTED",
    },
  };
}
