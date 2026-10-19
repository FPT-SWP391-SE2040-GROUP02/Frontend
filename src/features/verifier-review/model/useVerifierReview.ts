import { useQuery, useQueryClient } from "@tanstack/react-query";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { PaginationParams } from "@/shared/types";
import { verifierReviewService } from "../api/verifierReviewService";
import type {
  approveCaseRequestSchema,
  rejectCaseRequestSchema,
  requestSupplementRequestSchema,
  reviewFlagRequestSchema,
} from "./verifierReview.schema";
import type { z } from "zod";

export const verifierKeys = {
  all: ["verifier-cases"] as const,
  lists: () => [...verifierKeys.all, "list"] as const,
  list: (params?: PaginationParams) => [...verifierKeys.lists(), params ?? {}] as const,
  detail: (caseId: string) => [...verifierKeys.all, "detail", caseId] as const,
};
/** Hồ sơ Verifier đang được giao. */
export function useVerifierCases(params?: PaginationParams) {
  return useQuery({
    queryKey: verifierKeys.list(params),
    queryFn: ({ signal }) => verifierReviewService.list(params, signal),
    retry: false,
  });
}
/** Chi tiết hồ sơ; cache riêng để invalidation chính xác. */
export function useVerifierCase(caseId: string | null) {
  return useQuery({
    queryKey: caseId ? verifierKeys.detail(caseId) : ["verifier-cases", "detail", "none"],
    queryFn: ({ signal }) => verifierReviewService.get(caseId as string, signal),
    enabled: Boolean(caseId),
    gcTime: 0,
    retry: false,
  });
}
/**
 * Cập nhật cache detail từ response schema thật; chỉ invalidate list.
 * Không GET lại detail: response duyệt lần đầu có `handover`, GET sau đó luôn trả `handover = null`
 * nên GET lại sẽ xóa mất kết quả mở bàn giao Verifier vừa thấy.
 */
function publish(client: ReturnType<typeof useQueryClient>, caseId: string, detail: unknown) {
  client.setQueryData(verifierKeys.detail(caseId), detail);
  void client.invalidateQueries({ queryKey: verifierKeys.lists() });
}

async function perform<T>(
  client: ReturnType<typeof useQueryClient>,
  caseId: string,
  operation: () => Promise<T>,
) {
  const credential = accessTokenMemory.get();
  const detail = await operation();
  const observed = client
    .getQueryCache()
    .find({ queryKey: verifierKeys.detail(caseId), exact: true })
    ?.getObserversCount();
  if (credential && accessTokenMemory.get() === credential && observed)
    publish(client, caseId, detail);
  return detail;
}
/** Tạo mutation handler: caller truyền caseId, flagId và payload; double-submit chặn ở usePrivateAction. */
export function useReviewFlag() {
  const client = useQueryClient();
  return (caseId: string, flagId: string, request: z.infer<typeof reviewFlagRequestSchema>) =>
    perform(client, caseId, () => verifierReviewService.reviewFlag(caseId, flagId, request));
}
export function useRequestSupplement() {
  const client = useQueryClient();
  return (caseId: string, request: z.infer<typeof requestSupplementRequestSchema>) =>
    perform(client, caseId, () => verifierReviewService.requestSupplement(caseId, request));
}
export function useApproveCase() {
  const client = useQueryClient();
  return (caseId: string, request: z.infer<typeof approveCaseRequestSchema>) =>
    perform(client, caseId, () => verifierReviewService.approve(caseId, request));
}
export function useRejectCase() {
  const client = useQueryClient();
  return (caseId: string, request: z.infer<typeof rejectCaseRequestSchema>) =>
    perform(client, caseId, () => verifierReviewService.reject(caseId, request));
}
