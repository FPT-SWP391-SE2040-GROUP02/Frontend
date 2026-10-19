import { APP_MESSAGES } from "@/shared/constants";

/** Legacy contracts retained for callers; no fixture or simulated successful operation. */

// TODO: Integrate only after matching the official Backend DTOs and permission rules.

// Input/output: typed signatures below; no fixture fallback.

// Steps: confirm contract, validate schema, call service, publish confirmed result through hooks.

// API/library: existing official services, Zod and TanStack Query; do not invent endpoints.

// Edges: auth failures, missing resources, version conflicts and duplicate writes must remain errors.

import type { CreateWillRequest, WillItemDto } from "../model/will.types";

import type { ApiResponse, PaginatedList, PaginationParams } from "@/shared/types";

/**
 * Lấy danh sách các bản di chúc số
 * @param params Tham số phân trang
 * @returns Promise PaginatedList<WillItemDto>
 */
export async function getWills(_params?: PaginationParams): Promise<PaginatedList<WillItemDto>> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Lấy chi tiết bản di chúc theo ID
 * @param id Mã định danh di chúc
 * @returns Promise WillItemDto
 */
export async function getWillDetail(_id: string): Promise<WillItemDto> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Tạo mới bản di chúc số qua quy trình 4 bước
 * @param payload Dữ liệu di chúc gồm tài sản, tỷ lệ thừa kế và video tuyên thệ
 * @returns Promise ApiResponse<WillItemDto>
 */
export async function createWill(_payload: CreateWillRequest): Promise<ApiResponse<WillItemDto>> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

/**
 * Thu hồi / Hủy bỏ bản di chúc
 * @param id Mã định danh di chúc cần thu hồi
 * @returns Promise ApiResponse<null>
 */
export async function revokeWill(_id: string): Promise<ApiResponse<null>> {
  throw new Error(APP_MESSAGES.ERROR.FEATURE_UNAVAILABLE);
}

export const willService = {
  getWills,
  getWillDetail,
  createWill,
  revokeWill,
};
