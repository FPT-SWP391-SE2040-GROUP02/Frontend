import type { z } from "zod";
import type { verifierCaseDetailSchema } from "./verifierReview.schema";

/** Các thao tác ghi Verifier được mở trên một hồ sơ, suy từ response BE (mục 6.12). */
export interface VerifierActions {
  canReviewFlag: boolean;
  canRequestSupplement: boolean;
  canOpenApprove: boolean;
}

/**
 * VERIFIER_CONFLICT (ROLE-03) chặn mọi thao tác ghi, không chỉ duyệt: chỉ còn quyền xem.
 * Xem xét cờ, yêu cầu bổ sung và duyệt đều cần UNDER_REVIEW. Người xét duyệt không có thao tác từ chối.
 * Nút duyệt vẫn theo canApprove của BE; đây chỉ quyết định có hiện thao tác hay không.
 */
export function getVerifierActions(
  detail: z.infer<typeof verifierCaseDetailSchema>,
): VerifierActions {
  const conflict = detail.approveBlockers.includes("VERIFIER_CONFLICT");
  const underReview = detail.status === "UNDER_REVIEW";
  return {
    canReviewFlag: !conflict && underReview,
    canRequestSupplement: !conflict && underReview,
    canOpenApprove: !conflict && underReview,
  };
}
