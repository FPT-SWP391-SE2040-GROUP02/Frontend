import { z } from "zod";
import { apiClient } from "@/shared/api";
import { paginatedListSchema, paginationRequestSchema } from "@/shared/api/pagination.schema";
import type { PaginationParams } from "@/shared/types";
import {
  approveCaseRequestSchema,
  rejectCaseRequestSchema,
  requestSupplementRequestSchema,
  reviewFlagRequestSchema,
  verifierCaseDetailSchema,
  verifierCaseSummarySchema,
} from "../model/verifierReview.schema";
const id = z.string().uuid();
const listSchema = paginatedListSchema(verifierCaseSummarySchema);
/** Transport Verifier theo controller thật; không dùng legacy notary/claim fixture. */
export const verifierReviewService = {
  /** Hồ sơ đang giao cho tôi; sortBy: dueAt (mặc định) | assignedAt. */
  async list(params?: PaginationParams, signal?: AbortSignal) {
    return listSchema.parse(
      await apiClient.get<unknown, unknown>("/verifier/death-cases", {
        params: paginationRequestSchema.parse(params ?? {}),
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
};
