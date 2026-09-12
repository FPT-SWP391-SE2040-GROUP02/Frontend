/**
 * @description Danh sách các vai trò (Roles) trong hệ thống LegacyVault SWP391.
 * Tương thích với chuẩn phân quyền ASP.NET Core Identity RBAC.
 */
export const ROLES = {
  /** Quản trị viên tối cao: Toàn quyền hệ thống & Giám sát Audit Log */
  ADMIN: "ADMIN",
  /** Chủ sở hữu két di sản số (Vault Owner): Toàn quyền cấu hình tài sản & điểm danh DMS */
  OWNER: "OWNER",
  /** Người giám hộ di sản (Digital Executor): Quản lý hồ sơ mở kho & nộp giấy chứng tử */
  EXECUTOR: "EXECUTOR",
  /** Người thụ hưởng (Beneficiary): eKYC & nhận tài sản thừa kế */
  BENEFICIARY: "BENEFICIARY",
  /** Công chứng viên / Cơ quan pháp lý (Legal Verifier / Notary): Thẩm định & ký số niêm phong di sản */
  NOTARY: "NOTARY",
  /** Nhân viên / Quản lý nghiệp vụ (Kế thừa) */
  STAFF: "STAFF",
  /** Khách hàng / Người dùng thông thường (Kế thừa) */
  CUSTOMER: "CUSTOMER",
  /** Khách vãng lai chưa đăng nhập */
  GUEST: "GUEST",
} as const;

/** Kiểu dữ liệu tương ứng của danh sách vai trò người dùng */
export type Role = (typeof ROLES)[keyof typeof ROLES];
