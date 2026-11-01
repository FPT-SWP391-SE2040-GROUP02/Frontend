import { useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { HTTP_STATUS } from "@/shared/constants";
import { accessTokenMemory } from "@/shared/api/accessToken";
import type { PaginationParams } from "@/shared/types";
import { verifierReviewService } from "../api/verifierReviewService";
import type {
  approveCaseRequestSchema,
  concludeObjectionRequestSchema,
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
  // Ngoài nhóm "verifier-cases": invalidate cả nhóm (tải lại sau 409) không kéo theo một lần dò thừa.
  freshness: (caseId: string) => ["verifier-case-freshness", caseId] as const,
  objection: (caseId: string) => [...verifierKeys.all, "objection", caseId] as const,
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
    // Không tự thay nội dung Verifier đang đọc; thay đổi ở nơi khác do useVerifierCaseFreshness báo.
    refetchOnWindowFocus: false,
  });
}
/** Chu kỳ dò hồ sơ có đổi ở nơi khác (Executor tạo hoặc nộp bản bổ sung, Owner phản đối, job giao lại). */
export const FRESHNESS_INTERVAL_MS = 30_000;

/**
 * Dò ngầm etag mới nhất của hồ sơ đang xét, cache riêng nên KHÔNG thay dữ liệu Verifier đang đọc:
 * thấy khác thì trang báo và để Verifier tự tải lại, tránh quyết định trên nội dung chưa kịp xem.
 * Chỉ dò khi hồ sơ còn chờ quyết định; tab ẩn thì ngừng, quay lại tab thì dò ngay.
 * Bắt đầu từ etag vừa tải (không GET lại lúc mở trang), lần dò đầu sau một chu kỳ hoặc khi quay lại tab.
 */
export function useVerifierCaseFreshness(
  caseId: string,
  enabled: boolean,
  loadedEtag: string | undefined,
  loadedAt: number,
) {
  return useQuery({
    queryKey: verifierKeys.freshness(caseId),
    queryFn: async ({ signal }) => (await verifierReviewService.get(caseId, signal)).etag,
    initialData: loadedEtag,
    initialDataUpdatedAt: loadedAt,
    enabled: enabled && loadedEtag !== undefined,
    staleTime: FRESHNESS_INTERVAL_MS,
    gcTime: 0,
    retry: false,
    refetchOnMount: false,
    refetchInterval: FRESHNESS_INTERVAL_MS,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
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
/** Lời báo còn sống của hồ sơ; `null` khi BE trả 404 (chưa có lời báo hoặc không còn được giao). */
export function useVerifierObjection(caseId: string, enabled: boolean) {
  return useQuery({
    queryKey: verifierKeys.objection(caseId),
    queryFn: async ({ signal }) => {
      try {
        return await verifierReviewService.getObjection(caseId, signal);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === HTTP_STATUS.NOT_FOUND) return null;
        throw error;
      }
    },
    enabled,
    gcTime: 0,
    retry: false,
  });
}
/**
 * Kết luận lời báo. Response chỉ có ObjectionResponse nên đọc lại detail và objection
 * sau khi BE xác nhận; không optimistic (quyết định Verifier).
 */
export function useConcludeObjection() {
  const client = useQueryClient();
  return async (caseId: string, request: z.infer<typeof concludeObjectionRequestSchema>) => {
    const credential = accessTokenMemory.get();
    const result = await verifierReviewService.concludeObjection(caseId, request);
    if (credential && accessTokenMemory.get() === credential) {
      client.setQueryData(verifierKeys.objection(caseId), result);
      void client.invalidateQueries({ queryKey: verifierKeys.detail(caseId) });
      void client.invalidateQueries({ queryKey: verifierKeys.lists() });
    }
    return result;
  };
}
