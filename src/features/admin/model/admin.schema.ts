import { z } from "zod";
import { paginatedListSchema } from "@/shared/api/pagination.schema";
import { isVietnamesePhone, VIETNAM_PHONE_MESSAGE } from "@/shared/lib/vietnamPhone";

/** Vai trò tài khoản theo `UserRole` của Backend (wire viết hoa). */
export const ADMIN_USER_ROLES = ["USER", "VERIFIER", "ADMIN", "EXECUTOR"] as const;
/**
 * Vai trò Admin được cấp khi đổi vai trò. Không có EXECUTOR: người thực thi là người ngoài do Owner mời theo
 * từng kho (ROLE-02), BE trả 400 nếu gửi EXECUTOR. ADMIN_USER_ROLES vẫn giữ để đọc và lọc tài khoản cũ.
 */
export const ASSIGNABLE_USER_ROLES = ["USER", "VERIFIER", "EXECUTOR", "ADMIN"] as const;
export const assignableUserRoleSchema = z.enum(ASSIGNABLE_USER_ROLES);
/** Trạng thái tài khoản theo `UserStatus` của Backend (wire viết hoa). */
export const ADMIN_USER_STATUSES = ["ACTIVE", "LOCKED", "DISABLED"] as const;

export const adminUserRoleSchema = z.enum(ADMIN_USER_ROLES);
export const adminUserStatusSchema = z.enum(ADMIN_USER_STATUSES);
export type AdminUserRole = z.infer<typeof adminUserRoleSchema>;
export type AdminUserStatus = z.infer<typeof adminUserStatusSchema>;

const counter = z.number().int().nonnegative();
const dateTime = z.string().datetime({ offset: true });

/** GET /admin/dashboard → AdminDashboardResponse (raw, không envelope). */
export const adminDashboardSchema = z.object({
  activeVerifiers: counter,
  activeAdmins: counter,
  casesWithoutVerifier: counter,
  serverTime: dateTime,
  /** Ba khối mới có thể vắng khi Backend cũ chưa trả; màn vẫn hiện được phần còn lại. */
  planStages: z.array(z.object({ stage: z.string(), count: counter })).default([]),
  closedPlans: counter.default(0),
  verifierLoad: z
    .array(
      z.object({
        userId: z.string().uuid(),
        fullName: z.string(),
        openCases: counter,
        overdueCases: counter,
      }),
    )
    .default([]),
  recentActivity: z
    .array(z.object({ at: dateTime, actorFullName: z.string().nullable(), action: z.string() }))
    .default([]),
});
export type AdminDashboard = z.infer<typeof adminDashboardSchema>;

/** AdminUserResponse: không có mật khẩu, kho hay tài sản. */
export const adminUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  fullName: z.string(),
  role: adminUserRoleSchema,
  status: adminUserStatusSchema,
  emailVerified: z.boolean(),
  emailUndeliverable: z.boolean().optional(),
  createdAt: dateTime,
  lastLoginAt: dateTime.nullable(),
  etag: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

/** Loại việc của luật sư: biên bản bàn giao hoặc hồ sơ báo tin. */
export const adminCaseKindSchema = z.enum(["HANDOVER_RECORD", "HANDOVER_REPORT"]);
export type AdminCaseKind = z.infer<typeof adminCaseKindSchema>;

/** Kho Người thực thi đang giữ (chỉ tài khoản EXECUTOR): chủ tài sản đã che tên, không có tài sản. */
export const adminHeldVaultSchema = z.object({
  vaultId: z.string().uuid(),
  ownerNameMasked: z.string(),
  planStatus: z.string(),
  handoverRecordStatus: z.string().nullable(),
  handoverUnderway: z.boolean(),
  canChangeExecutor: z.boolean(),
});
export type AdminHeldVault = z.infer<typeof adminHeldVaultSchema>;

/**
 * GET /admin/users/{id}: thông tin tài khoản cộng việc luật sư đang giữ, quyết định gần đây,
 * kho Người thực thi đang giữ và hoạt động gần đây (không lý do, không nội dung hồ sơ).
 */
export const adminUserDetailSchema = adminUserSchema.extend({
  assignedCases: z
    .array(
      z.object({
        kind: adminCaseKindSchema,
        caseId: z.string().uuid(),
        caseCode: z.string(),
        status: z.string(),
        receivedAt: dateTime,
      }),
    )
    .default([]),
  recentDecisions: z
    .array(
      z.object({
        kind: adminCaseKindSchema,
        caseId: z.string().uuid(),
        caseCode: z.string(),
        decision: z.string(),
        decidedAt: dateTime,
      }),
    )
    .default([]),
  heldVaults: z.array(adminHeldVaultSchema).default([]),
  recentActivity: z.array(z.object({ at: dateTime, action: z.string(), outcome: z.string() })),
});
export type AdminUserDetail = z.infer<typeof adminUserDetailSchema>;

export const adminUsersPageSchema = paginatedListSchema(adminUserSchema);
export type AdminUsersPage = z.infer<typeof adminUsersPageSchema>;

/** Kích thước trang cố định của màn hình Người dùng. */
export const ADMIN_USERS_PAGE_SIZE = 20;

/**
 * Query của GET /admin/users. Tên `search` theo AdminController,
 * khác `searchTerm` của PaginationRequest dùng chung.
 */
export const adminUsersQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  role: adminUserRoleSchema.optional(),
  status: adminUserStatusSchema.optional(),
  pageIndex: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
});
export type AdminUsersQuery = z.infer<typeof adminUsersQuerySchema>;

/* ---------------------------------------------------------------------------
 * Vận hành: đổi vai trò/trạng thái, giao lại Verifier.
 * Theo AdminController và OperationsResponses/OperationsRequests của Backend.
 * ------------------------------------------------------------------------- */

const uuid = z.string().uuid();

/** Kích thước trang cố định của danh sách Admin. */
export const ADMIN_LIST_PAGE_SIZE = 20;

/** GET /admin/users/counts: số lượng theo nhóm cho các thẻ lọc; nhóm không có dòng nào vẫn là 0. */
export const countsSchema = z.object({
  counts: z.record(z.string(), counter),
  total: counter,
});
export type Counts = z.infer<typeof countsSchema>;

/** Trạng thái giao dịch tiền vào theo AdminPaymentsController (api-contract 6.18). */
export const PAYMENT_TRANSACTION_STATUSES = [
  "RECEIVED",
  "MATCHED",
  "RECONCILIATION_REQUIRED",
  "RESOLVED",
] as const;
export const paymentTransactionStatusSchema = z.enum(PAYMENT_TRANSACTION_STATUSES);
export type PaymentTransactionStatus = z.infer<typeof paymentTransactionStatusSchema>;

/** Giá trị lọc: "SUCCESS" gộp Đã khớp đơn và Đã xử lý thành một nhóm "Thành công". */
export const PAYMENT_FILTER_STATUSES = ["SUCCESS", "RECEIVED", "RECONCILIATION_REQUIRED"] as const;
export const paymentFilterStatusSchema = z.enum(PAYMENT_FILTER_STATUSES);
export type PaymentFilterStatus = z.infer<typeof paymentFilterStatusSchema>;

/**
 * AdminPaymentTransactionResponse, chỉ đọc (ADMIN-09). BE không trả nội dung chuyển khoản hay số tài khoản (SEC-07).
 * `reconciliationReason` giữ chuỗi để BE thêm lý do mới không làm hỏng màn.
 */
export const paymentTransactionSchema = z.object({
  id: uuid,
  provider: z.string(),
  environment: z.string(),
  providerTransactionId: z.number().int(),
  status: paymentTransactionStatusSchema,
  reconciliationReason: z.string().nullable(),
  transferType: z.string(),
  transferAmount: z.number().int(),
  currency: z.string(),
  paymentOrderId: uuid.nullable(),
  paymentCode: z.string().nullable(),
  gateway: z.string().nullable(),
  referenceCode: z.string().nullable(),
  transactionAt: dateTime.nullable(),
  receivedAt: dateTime,
  processedAt: dateTime.nullable(),
});
export type PaymentTransaction = z.infer<typeof paymentTransactionSchema>;

export const paymentTransactionsPageSchema = paginatedListSchema(paymentTransactionSchema);
export type PaymentTransactionsPage = z.infer<typeof paymentTransactionsPageSchema>;

/** Query GET /admin/payment-transactions. */
export const paymentTransactionsQuerySchema = z.object({
  status: paymentFilterStatusSchema.optional(),
  /** Tìm theo mã thanh toán hoặc mã tham chiếu ngân hàng. */
  search: z.string().trim().max(60).optional(),
  /** "Live" hoặc "Test". */
  environment: z.enum(["Live", "Test"]).optional(),
  /** Ngày yyyy-MM-dd theo giờ Việt Nam, tính cả ngày đầu và ngày cuối. */
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  pageIndex: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
});
export type PaymentTransactionsQuery = z.infer<typeof paymentTransactionsQuerySchema>;

/** Cách gom doanh thu theo giờ Việt Nam. */
export const revenueGroupBySchema = z.enum(["day", "month", "quarter"]);
export type RevenueGroupBy = z.infer<typeof revenueGroupBySchema>;

/** "Live" là tiền thật (mặc định), "Test" là thử nghiệm, "ALL" là gộp cả hai. */
export const revenueEnvironmentSchema = z.enum(["Live", "Test", "ALL"]);
export type RevenueEnvironment = z.infer<typeof revenueEnvironmentSchema>;

/** AdminRevenueResponse: tổng tiền giao dịch đã khớp đơn hoặc đã xử lý, chia theo kỳ. */
export const adminRevenueSchema = z.object({
  groupBy: revenueGroupBySchema,
  environment: revenueEnvironmentSchema,
  totalAmount: z.number().int(),
  transactionCount: z.number().int().nonnegative(),
  currency: z.string().min(1),
  buckets: z.array(
    z.object({
      /** "2026-11-05", "2026-11" hoặc "2026-Q4". */
      key: z.string().min(1),
      /** "05/11/2026", "11/2026" hoặc "Quý 4/2026". */
      label: z.string().min(1),
      amount: z.number().int(),
      count: z.number().int().nonnegative(),
    }),
  ),
});
export type AdminRevenue = z.infer<typeof adminRevenueSchema>;

/** Query GET /admin/payment-transactions/revenue. */
export const adminRevenueQuerySchema = z.object({
  groupBy: revenueGroupBySchema,
  environment: revenueEnvironmentSchema,
  /** Ngày yyyy-MM-dd theo giờ Việt Nam, tính cả ngày đầu và ngày cuối. */
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});
export type AdminRevenueQuery = z.infer<typeof adminRevenueQuerySchema>;

/* Request body: độ dài theo DataAnnotations của Backend. */
const reason500 = z.string().trim().min(1, "Vui lòng ghi lý do.").max(500, "Tối đa 500 ký tự.");

export const changeUserRoleRequestSchema = z.object({
  role: assignableUserRoleSchema,
  reason: reason500,
});
export const changeUserStatusRequestSchema = z.object({
  status: adminUserStatusSchema,
  reason: reason500,
});
export const reassignVerifierRequestSchema = z.object({ verifierUserId: uuid, reason: reason500 });
/**
 * Admin giao hoặc đổi Người thực thi của một kho. Ngoài bàn giao: người được giao phải chấp nhận lời mời
 * (INVITED). Khi kho đang bàn giao: người mới nhận việc ngay (ACCEPTED), người cũ bị thu hồi ngay.
 */
export const assignExecutorRequestSchema = z.object({ userId: uuid, reason: reason500 });
/** Kết quả giao Người thực thi; ACCEPTED nghĩa là người mới đã nhận việc ngay, không gửi thư mời. */
export const assignExecutorResultSchema = z.object({
  status: z.enum(["INVITED", "ACCEPTED"]),
});
export type AssignExecutorResult = z.infer<typeof assignExecutorResultSchema>;

export type ChangeUserRoleRequest = z.infer<typeof changeUserRoleRequestSchema>;
export type ChangeUserStatusRequest = z.infer<typeof changeUserStatusRequestSchema>;
export type ReassignVerifierRequest = z.infer<typeof reassignVerifierRequestSchema>;
export type AssignExecutorRequest = z.infer<typeof assignExecutorRequestSchema>;

export const createAdminUserRequestSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên.").max(200),
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email.")
    .email("Địa chỉ email không hợp lệ.")
    .max(256),
  /** Bắt buộc với ADMIN; bỏ trống với VERIFIER/EXECUTOR thì Backend gửi thư mời đặt mật khẩu. */
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự.").max(128).optional(),
  role: z.enum(["VERIFIER", "EXECUTOR", "ADMIN"]),
  phone: z
    .string()
    .trim()
    .max(32)
    .optional()
    .refine(
      (text) => text === undefined || text === "" || isVietnamesePhone(text),
      VIETNAM_PHONE_MESSAGE,
    ),
  practiceCertificateNumber: z.string().trim().max(64).optional(),
  lawyerCardNumber: z.string().trim().max(64).optional(),
  /** Chỉ dùng cho EXECUTOR: vai trò chuyên môn và tổ chức hành nghề hiện trong danh bạ của Chủ tài sản. */
  executorRoleTitle: z.string().trim().max(200).optional(),
  legalOrganization: z.string().trim().max(200).optional(),
});
export type CreateAdminUserRequest = z.infer<typeof createAdminUserRequestSchema>;
