import type { z } from "zod";
import type { verifierCaseDetailSchema } from "./verifierReview.schema";

/** Các thao tác ghi Verifier được mở trên một hồ sơ, suy từ response BE (mục 6.12). */
export interface VerifierActions {
  canReviewFlag: boolean;
  canRequestSupplement: boolean;
  canOpenApprove: boolean;
  canReject: boolean;
}

/**
 * VERIFIER_CONFLICT (ROLE-03) chặn mọi thao tác ghi, không chỉ duyệt: chỉ còn quyền xem.
 * Xem xét cờ, yêu cầu bổ sung, duyệt cần UNDER_REVIEW; từ chối được cả khi SUPPLEMENT_REQUIRED.
 * Nút duyệt vẫn theo canApprove của BE; đây chỉ quyết định có hiện thao tác hay không.
 */
export function getVerifierActions(
  detail: z.infer<typeof verifierCaseDetailSchema>,
): VerifierActions {
  const conflict = detail.approveBlockers.includes("VERIFIER_CONFLICT");
  const underReview = detail.status === "UNDER_REVIEW";
  const waitingSupplement = detail.status === "SUPPLEMENT_REQUIRED";
  return {
    canReviewFlag: !conflict && underReview,
    canRequestSupplement: !conflict && underReview,
    canOpenApprove: !conflict && underReview,
    canReject: !conflict && (underReview || waitingSupplement),
  };
}
