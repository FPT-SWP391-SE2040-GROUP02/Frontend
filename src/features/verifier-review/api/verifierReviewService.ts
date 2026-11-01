import { z } from "zod";
import { apiClient } from "@/shared/api";
import { paginatedListSchema, paginationRequestSchema } from "@/shared/api/pagination.schema";
import type { PaginationParams } from "@/shared/types";
import {
  approveCaseRequestSchema,
  concludeObjectionRequestSchema,
  rejectCaseRequestSchema,
  requestSupplementRequestSchema,
  reviewFlagRequestSchema,
  verifierCaseDetailSchema,
  verifierCaseSummarySchema,
  verifierObjectionSchema,
} from "../model/verifierReview.schema";

const id = z.string().uuid();
const listSchema = paginatedListSchema(verifierCaseSummarySchema);
const verifierListQuerySchema = paginationRequestSchema.omit({ searchTerm: true });

/** Transport Verifier theo controller thật; không dùng legacy notary/claim fixture. */
export const verifierReviewService = {
  /** Hồ sơ đang giao cho tôi; sortBy: dueAt (mặc định) | assignedAt; không gửi searchTerm thừa. */
  async list(params?: PaginationParams, signal?: AbortSignal) {
    return listSchema.parse(
      await apiClient.get<unknown, unknown>("/verifier/death-cases", {
        params: verifierListQuerySchema.parse(params ?? {}),
        signal,
      }),
    );
  },
  /** Chi tiết hồ sơ (kèm CCCD đầy đủ Owner); Cache-Control: no-store ở BE. */
  async get(caseId: string, signal?: AbortSignal) {
    return verifierCaseDetailSchema.parse(
      await apiClient.get<unknown, unknown>(`/verifier/death-cases/${id.parse(caseId)}`, {
        signal,
      }),
    );
  },
  /** Tải nội dung một trang giấy theo grant; integrity check phía server trước khi stream byte. */
  async downloadFile(caseId: string, fileId: string): Promise<Blob> {
    return apiClient.get<Blob, Blob>(
      `/verifier/death-cases/${id.parse(caseId)}/files/${id.parse(fileId)}/content`,
      { responseType: "blob" },
    );
  },
  /**
   * Ảnh mặt trước CCCD Owner chụp lúc eKYC (BR-48 sửa); 404 IDENTITY_IMAGE_NOT_FOUND khi Owner xác minh trước khi có
   * chức năng lưu ảnh. Blob chỉ giữ trong RAM.
   */
  async downloadOwnerDocumentImage(caseId: string, signal?: AbortSignal): Promise<Blob> {
    return apiClient.get<Blob, Blob>(
      `/verifier/death-cases/${id.parse(caseId)}/owner-identity/document-image`,
      { responseType: "blob", signal },
    );
  },
  /** Ảnh selfie của lần thử gần nhất trong lời báo còn sống (BR-50 sửa); 404 khi chưa có ảnh. */
  async downloadObjectionSelfieImage(caseId: string, signal?: AbortSignal): Promise<Blob> {
    return apiClient.get<Blob, Blob>(
      `/verifier/death-cases/${id.parse(caseId)}/objection/selfie-image`,
      { responseType: "blob", signal },
    );
  },
  /** Xem xét một cờ; etag mới trong response dùng cho thao tác kế tiếp. */
  async reviewFlag(
    caseId: string,
    flagId: string,
    request: z.infer<typeof reviewFlagRequestSchema>,
  ) {
    return verifierCaseDetailSchema.parse(
      await apiClient.post<unknown, unknown>(
        `/verifier/death-cases/${id.parse(caseId)}/flags/${id.parse(flagId)}/review`,
        reviewFlagRequestSchema.parse(request),
      ),
    );
  },
  /** Yêu cầu Executor bổ sung hồ sơ. */
  async requestSupplement(caseId: string, request: z.infer<typeof requestSupplementRequestSchema>) {
    return verifierCaseDetailSchema.parse(
      await apiClient.post<unknown, unknown>(
        `/verifier/death-cases/${id.parse(caseId)}/request-supplement`,
        requestSupplementRequestSchema.parse(request),
      ),
    );
  },
  /** Duyệt hồ sơ và mở bàn giao F3. */
  async approve(caseId: string, request: z.infer<typeof approveCaseRequestSchema>) {
    return verifierCaseDetailSchema.parse(
      await apiClient.post<unknown, unknown>(
        `/verifier/death-cases/${id.parse(caseId)}/approve`,
        approveCaseRequestSchema.parse(request),
      ),
    );
  },
  /** Từ chối hồ sơ. */
  async reject(caseId: string, request: z.infer<typeof rejectCaseRequestSchema>) {
    return verifierCaseDetailSchema.parse(
      await apiClient.post<unknown, unknown>(
        `/verifier/death-cases/${id.parse(caseId)}/reject`,
        rejectCaseRequestSchema.parse(request),
      ),
    );
  },
  /** Lời báo còn sống của hồ sơ; 404 khi chưa có hoặc hồ sơ không còn giao cho bạn. */
  async getObjection(caseId: string, signal?: AbortSignal) {
    return verifierObjectionSchema.parse(
      await apiClient.get<unknown, unknown>(`/verifier/death-cases/${id.parse(caseId)}/objection`, {
        signal,
      }),
    );
  },
  /** Kết luận lời báo còn sống; cần selfie đạt hoặc hết 7 ngày cho ALIVE_CONFIRMED. */
  async concludeObjection(caseId: string, request: z.infer<typeof concludeObjectionRequestSchema>) {
    return verifierObjectionSchema.parse(
      await apiClient.post<unknown, unknown>(
        `/verifier/death-cases/${id.parse(caseId)}/objection/conclude`,
        concludeObjectionRequestSchema.parse(request),
      ),
    );
  },
};
