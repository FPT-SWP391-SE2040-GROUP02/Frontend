import { APP_MESSAGES } from "@/shared/constants";

/** Legacy contracts retained for callers; no fixture or simulated successful operation. */

// TODO: Integrate only after matching the official Backend DTOs and permission rules.

// Input/output: typed signatures below; no fixture fallback.

// Steps: confirm contract, validate schema, call service, publish confirmed result through hooks.

// API/library: existing official services, Zod and TanStack Query; do not invent endpoints.

// Edges: auth failures, missing resources, version conflicts and duplicate writes must remain errors.

import type { ApiResponse, PaginatedList, PaginationParams } from "@/shared/types";

import type {
  ApproveClaimRequest,
  NotaryClaimItemDto,
  RejectClaimRequest,
} from "../model/notary.types";

/**
 * @file notaryService.ts
 * @description Tầng dịch vụ API cho phân hệ Công Chứng Viên Thẩm Định Pháp Lý.
 * Tuân thủ Rule 7 (Scaffold with TODO) và Rule 8 (JSDoc chuẩn chỉnh).
 */
/**
 * Lấy danh sách hồ sơ tử tuất/mất tích đang chờ thẩm định (CLAIM_PENDING)
 * @param params Tham số phân trang
 * @returns Promise chứa danh sách hồ sơ phân trang
 */
export async function getPendingClaims(
  _params?: PaginationParams,
): Promise<PaginatedList<NotaryClaimItemDto>> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Phê duyệt hồ sơ thừa kế và giải phóng Mảnh khóa Verifier (Shamir Share 2)
 * @param _payload Dữ liệu phê duyệt kèm 4 tiêu chí kiểm toán và mã PIN ký số
 * @returns Promise xác nhận phê duyệt thành công
 */
export async function approveClaim(__payload: ApproveClaimRequest): Promise<
  ApiResponse<{
    releasedShareIndex: number;
    vaultStatus: string;
  }>
> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Từ chối hồ sơ thừa kế và gửi thông báo yêu cầu bổ sung cho Executor
 * @param _payload Dữ liệu từ chối gồm mã lý do và văn bản giải trình >= 20 ký tự
 * @returns Promise xác nhận từ chối hồ sơ
 */
export async function rejectClaim(__payload: RejectClaimRequest): Promise<
  ApiResponse<{
    claimStatus: string;
  }>
> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}
