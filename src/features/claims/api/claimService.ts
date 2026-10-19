import { APP_MESSAGES } from "@/shared/constants";

/** Legacy contracts retained for callers; no fixture or simulated successful operation. */

// TODO: Integrate only after matching the official Backend DTOs and permission rules.

// Input/output: typed signatures below; no fixture fallback.

// Steps: confirm contract, validate schema, call service, publish confirmed result through hooks.

// API/library: existing official services, Zod and TanStack Query; do not invent endpoints.

// Edges: auth failures, missing resources, version conflicts and duplicate writes must remain errors.

import type { ApiResponse, PaginatedList, PaginationParams } from "@/shared/types";

import type { ClaimItemViewModel, SubmitClaimRequest } from "@/entities/claim/model/claim.types";

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
  _fileName: string,
  __contentType: string,
): Promise<PresignedUploadResponse> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Nộp hồ sơ yêu cầu mở thừa kế kèm chứng từ tử tuất hoặc quyết định tòa án
 * @param _payload Dữ liệu hồ sơ gồm thông tin hộ tịch và mã băm SHA-256
 * @returns Promise chứa ApiResponse xác nhận đã nộp thành công
 */
export async function submitClaim(__payload: SubmitClaimRequest): Promise<
  ApiResponse<{
    claimId: string;
    status: string;
  }>
> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Lấy danh sách hồ sơ do Người thi hành hiện tại quản lý
 * @param params Tham số phân trang và lọc
 * @returns Promise chứa danh sách hồ sơ phân trang
 */
export async function getExecutorClaims(
  _params?: PaginationParams,
): Promise<PaginatedList<ClaimItemViewModel>> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}
