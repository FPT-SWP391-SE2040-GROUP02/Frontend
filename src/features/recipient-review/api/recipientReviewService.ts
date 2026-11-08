import { z } from "zod";
import { apiClient } from "@/shared/api";
import {
  recipientSubmissionDetailSchema,
  recipientSubmissionSummarySchema,
  supplementRequestSchema,
} from "../model/recipientReview.schema";

const id = z.string().uuid();
const base = (value: string) => `/verifier/handover-submissions/${id.parse(value)}`;

/** Transport duyệt hồ sơ người nhận theo controller thật; không tự quyết duyệt hay từ chối ở máy. */
export const recipientReviewService = {
  /** Hồ sơ đang chờ tôi duyệt (chỉ kho mà tôi đã duyệt hồ sơ chứng tử), cũ nhất trước. */
  async list(signal?: AbortSignal) {
    return z
      .array(recipientSubmissionSummarySchema)
      .parse(await apiClient.get<unknown, unknown>("/verifier/handover-submissions", { signal }));
  },
  async get(value: string, signal?: AbortSignal) {
    return recipientSubmissionDetailSchema.parse(
      await apiClient.get<unknown, unknown>(base(value), { signal }),
    );
  },
  /** Ảnh căn cước một mặt; Backend kiểm toàn vẹn trước byte đầu tiên, blob không vào cache. */
  async image(value: string, side: "front" | "back", signal?: AbortSignal): Promise<Blob> {
    return apiClient.get<Blob, Blob>(`${base(value)}/images/${side}`, {
      responseType: "blob",
      signal,
    });
  },
  /** Duyệt: chỉ khi cả ba trường khớp; lượt sang bước quyết định. */
  async approve(value: string) {
    return recipientSubmissionDetailSchema.parse(
      await apiClient.post<unknown, unknown>(`${base(value)}/approve`),
    );
  },
  async requestSupplement(value: string, reason: string) {
    return recipientSubmissionDetailSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${base(value)}/request-supplement`,
        supplementRequestSchema.parse({ reason }),
      ),
    );
  },
};
