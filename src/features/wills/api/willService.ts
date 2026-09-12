import type {
  WillItemDto,
  CreateWillRequest,
} from "../model/will.types";
import type { PaginatedList, PaginationParams, ApiResponse } from "@/shared/types";

/**
 * @file willService.ts
 * @description Tầng dịch vụ gọi API cho Module Lập & Quản Lý Di Chúc Số (Digital Will & Testament Protocol).
 * Tuân thủ Rule 7 (Scaffold with TODO) và Rule 8 (JSDoc chuẩn chỉ).
 */

const WILLS_ENDPOINT = "/wills";

// Mock store tạm thời trong phiên làm việc của Client
let mockWillsStore: WillItemDto[] = [
  {
    id: "wil_sample_01",
    title: "Bản Di Chúc Phân Bổ Di Sản Số Toàn Diện 2026",
    declarationNotes:
      "Tuyên bố ý chí phân chia ví lạnh Crypto, tài khoản quản trị hạ tầng đám mây và bất động sản cho các con theo tỷ lệ đã định.",
    status: "SEALED",
    selectedAssetIds: ["ast_01", "ast_02", "ast_03"],
    allocations: [
      {
        beneficiaryId: "ben_01",
        beneficiaryName: "Nguyễn Minh Khang",
        relationship: "Con trai trưởng",
        citizenId: "079095001234",
        percentage: 60,
        specialConditions: "Ủy quyền quản lý ví Bitcoin và tài khoản AWS",
      },
      {
        beneficiaryId: "ben_02",
        beneficiaryName: "Nguyễn Thảo My",
        relationship: "Con gái út",
        citizenId: "079198005678",
        percentage: 40,
        specialConditions: "Thừa kế giá trị quyền sử dụng đất Thảo Điền",
      },
    ],
    affidavitProof: {
      videoDurationSeconds: 16,
      sha256Hash:
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      recordedAt: "2026-09-05T10:15:00Z",
      isConfirmed: true,
    },
    seal: {
      algorithm: "ECDSA_P256_SHA256",
      publicKeyPem: "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...\n-----END PUBLIC KEY-----",
      signatureBase64: "MEQCID...signature_sample...=",
      willDigestSha256: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
      sealedAt: "2026-09-05T10:18:00Z",
    },
    createdAt: "2026-09-05T10:00:00Z",
    updatedAt: "2026-09-05T10:18:00Z",
  },
];

/**
 * Lấy danh sách các bản di chúc số
 * @param params Tham số phân trang
 * @returns Promise PaginatedList<WillItemDto>
 */
export async function getWills(
  params?: PaginationParams
): Promise<PaginatedList<WillItemDto>> {
  // TODO: [Developer Step]
  // 1. Gọi GET /wills qua axiosClient
  // 2. Map dữ liệu PaginatedList trả về từ backend C# ASP.NET Core
  return {
    items: [...mockWillsStore],
    totalCount: mockWillsStore.length,
    pageIndex: params?.pageIndex || 1,
    pageSize: params?.pageSize || 10,
    totalPages: 1,
    hasPreviousPage: false,
    hasNextPage: false,
  };
}

/**
 * Lấy chi tiết bản di chúc theo ID
 * @param id Mã định danh di chúc
 * @returns Promise WillItemDto
 */
export async function getWillDetail(id: string): Promise<WillItemDto> {
  // TODO: [Developer Step] Gọi GET /wills/{id}
  const will = mockWillsStore.find((x) => x.id === id);
  if (!will) {
    throw new Error(`Không tìm thấy bản di chúc có mã: ${id}`);
  }
  return will;
}

/**
 * Tạo mới bản di chúc số qua quy trình 4 bước
 * @param payload Dữ liệu di chúc gồm tài sản, tỷ lệ thừa kế và video tuyên thệ
 * @returns Promise ApiResponse<WillItemDto>
 */
export async function createWill(
  payload: CreateWillRequest
): Promise<ApiResponse<WillItemDto>> {
  // TODO: [Developer Step]
  // 1. Gửi POST /wills kèm CreateWillRequest payload
  // 2. Ký số ECDSA phía client hoặc backend HSM
  const newWill: WillItemDto = {
    id: `wil_${Date.now()}`,
    title: payload.title,
    declarationNotes: payload.declarationNotes,
    status: "SEALED",
    selectedAssetIds: payload.selectedAssetIds,
    allocations: payload.allocations,
    affidavitProof: payload.affidavitProof,
    seal: {
      algorithm: "ECDSA_P256_SHA256",
      publicKeyPem: "-----BEGIN PUBLIC KEY-----\nMFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAE...\n-----END PUBLIC KEY-----",
      signatureBase64: `SIG_${Date.now()}_ECDSA_P256`,
      willDigestSha256: payload.affidavitProof.sha256Hash || `DIGEST_${Date.now()}`,
      sealedAt: new Date().toISOString(),
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockWillsStore = [newWill, ...mockWillsStore];

  return {
    success: true,
    message: "Đã tạo lập, ký số và niêm phong di chúc số thành công!",
    data: newWill,
  };
}

/**
 * Thu hồi / Hủy bỏ bản di chúc
 * @param id Mã định danh di chúc cần thu hồi
 * @returns Promise ApiResponse<null>
 */
export async function revokeWill(id: string): Promise<ApiResponse<null>> {
  // TODO: [Developer Step] Gọi POST /wills/{id}/revoke
  mockWillsStore = mockWillsStore.map((w) =>
    w.id === id ? { ...w, status: "REVOKED" as const } : w
  );

  return {
    success: true,
    message: `Đã thu hồi bản di chúc ${id} thành công`,
    data: null,
  };
}

export const willService = {
  getWills,
  getWillDetail,
  createWill,
  revokeWill,
};
