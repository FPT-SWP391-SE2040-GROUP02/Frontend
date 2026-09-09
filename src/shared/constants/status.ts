/**
 * @description Trạng thái nghiệp vụ chung cho các Entity (Users, Orders, Products, Requests).
 * Tuân thủ quy tắc Zero Hardcoding - Không gõ chuỗi thô trong code.
 */
export const STATUS = {
  ACTIVE: "ACTIVE",
  INACTIVE: "INACTIVE",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
  COMPLETED: "COMPLETED",
  DRAFT: "DRAFT",
} as const;

/** Kiểu dữ liệu của trạng thái nghiệp vụ */
export type Status = (typeof STATUS)[keyof typeof STATUS];
