import { useMyClaims } from "./useHandoverRequest";

/**
 * Số yêu cầu đang cần bạn nộp bổ sung giấy tờ, cho huy hiệu ở thanh bên. Đang tải hoặc lỗi thì tính là 0.
 */
export function useSupplementCount(): number {
  const query = useMyClaims();
  if (!query.isSuccess) return 0;
  return query.data.filter(
    (claim) => claim.status === "SUPPLEMENT_REQUESTED" && claim.recordStatus !== "CANCELLED",
  ).length;
}
