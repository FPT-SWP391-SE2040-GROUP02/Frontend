import { z } from "zod";
import { templateParagraphSchema } from "@/entities/handoverDocument";
import { paginatedListSchema } from "@/shared/api/pagination.schema";

/** Vai trò tài khoản theo `UserRole` của Backend (wire viết hoa). */
export const ADMIN_USER_ROLES = ["USER", "VERIFIER", "ADMIN", "EXECUTOR"] as const;
/**
 * Vai trò Admin được cấp khi đổi vai trò. Không có EXECUTOR: người thực hiện là người ngoài do Owner mời theo
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
  activeHolds: counter,
  holdsPastReview: counter,
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
  createdAt: dateTime,
  lastLoginAt: dateTime.nullable(),
  etag: z.string(),
});
export type AdminUser = z.infer<typeof adminUserSchema>;

/** GET /admin/users/{id}: thông tin tài khoản cộng hồ sơ đang giữ, quyết định và hoạt động gần đây (không lý do, không nội dung hồ sơ). */
export const adminUserDetailSchema = adminUserSchema.extend({
  assignedCases: z.array(
    z.object({
      caseId: z.string().uuid(),
      status: z.string(),
      dueAt: dateTime,
      overdue: z.boolean(),
    }),
  ),
  recentDecisions: z.array(
    z.object({ caseId: z.string().uuid(), kind: z.string(), decidedAt: dateTime }),
  ),
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
 * Vận hành: tạm giữ (hold), đổi vai trò/trạng thái, giao lại Verifier.
 * Theo AdminController và OperationsResponses/OperationsRequests của Backend.
 * ------------------------------------------------------------------------- */

/** `HoldType` của Backend. OWNER_ALIVE chỉ gỡ được khi Verifier kết luận (BR-71). */
export const HOLD_TYPES = ["OWNER_ALIVE", "DISPUTE", "ADMIN"] as const;
/** `HoldStatus` của Backend. */
export const HOLD_STATUSES = ["ACTIVE", "RELEASED"] as const;
/** Phạm vi Admin được đặt hold (HoldService chỉ nhận VAULT hoặc CONTAINER). */
export const holdTypeSchema = z.enum(HOLD_TYPES);
export const holdStatusSchema = z.enum(HOLD_STATUSES);
export type HoldType = z.infer<typeof holdTypeSchema>;
export type HoldStatus = z.infer<typeof holdStatusSchema>;

const uuid = z.string().uuid();

/** HoldResponse. `scope` giữ chuỗi vì BE còn có phạm vi chưa mở cho Admin (DESIGNATION, CLAIM, GRANT). */
export const holdSchema = z.object({
  id: uuid,
  vaultId: uuid,
  scope: z.string(),
  targetId: uuid.nullable(),
  type: holdTypeSchema,
  status: holdStatusSchema,
  reason: z.string(),
  responsibleUserId: uuid.nullable(),
  reviewAt: dateTime,
  reviewOverdue: z.boolean(),
  createdAt: dateTime,
  releasedAt: dateTime.nullable(),
  releaseReason: z.string().nullable(),
  etag: z.string().min(1),
});
export type Hold = z.infer<typeof holdSchema>;

export const holdsPageSchema = paginatedListSchema(holdSchema);
export type HoldsPage = z.infer<typeof holdsPageSchema>;

/** Kích thước trang cố định của danh sách hold. */
export const ADMIN_LIST_PAGE_SIZE = 20;

/** GET /admin/{users|holds}/counts: số lượng theo nhóm cho các thẻ lọc; nhóm không có dòng nào vẫn là 0. */
export const countsSchema = z.object({
  counts: z.record(z.string(), counter),
  total: counter,
});
export type Counts = z.infer<typeof countsSchema>;

/** Query GET /admin/holds. */
export const holdsQuerySchema = z.object({
  status: holdStatusSchema.optional(),
  /** Chỉ hold của một kho. */
  vaultId: z.string().uuid().optional(),
  pageIndex: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
});
export type HoldsQuery = z.infer<typeof holdsQuerySchema>;

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
/** Admin giao hoặc đổi Người thực thi của một kho; người được giao phải chấp nhận lời mời. */
export const assignExecutorRequestSchema = z.object({ userId: uuid, reason: reason500 });

export type ChangeUserRoleRequest = z.infer<typeof changeUserRoleRequestSchema>;
export type ChangeUserStatusRequest = z.infer<typeof changeUserStatusRequestSchema>;
export type ReassignVerifierRequest = z.infer<typeof reassignVerifierRequestSchema>;
export type AssignExecutorRequest = z.infer<typeof assignExecutorRequestSchema>;

export const createAdminUserRequestSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên.").max(200),
  email: z.string().trim().email("Địa chỉ email không hợp lệ.").max(256),
  /** Bắt buộc với ADMIN; bỏ trống với VERIFIER/EXECUTOR thì Backend gửi thư mời đặt mật khẩu. */
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự.").max(128).optional(),
  role: z.enum(["VERIFIER", "EXECUTOR", "ADMIN"]),
  phone: z.string().trim().max(32).optional(),
  practiceCertificateNumber: z.string().trim().max(64).optional(),
  lawyerCardNumber: z.string().trim().max(64).optional(),
  /** Chỉ dùng cho EXECUTOR: vai trò chuyên môn và tổ chức hành nghề hiện trong danh bạ của Chủ kho. */
  executorRoleTitle: z.string().trim().max(200).optional(),
  legalOrganization: z.string().trim().max(200).optional(),
});
export type CreateAdminUserRequest = z.infer<typeof createAdminUserRequestSchema>;

/** Một trường {TÊN} Admin được chèn vào mẫu biên bản, kèm nhãn và ví dụ. */
export const templateTokenSchema = z.object({
  token: z.string().min(1),
  label: z.string(),
  example: z.string(),
});
export type TemplateToken = z.infer<typeof templateTokenSchema>;

const templateContentShape = {
  accept: z.array(templateParagraphSchema),
  decline: z.array(templateParagraphSchema),
  declineNotice: z.string(),
};

/** AdminHandoverTemplateResponse: bộ mẫu đang dùng (hoặc một phiên bản cũ), danh sách trường và mẫu gốc. */
export const handoverTemplateSchema = z.object({
  /** null khi đang dùng mẫu gốc trong mã (chưa có bản nào được lưu). */
  version: z.number().int().nullable(),
  isDefault: z.boolean(),
  ...templateContentShape,
  note: z.string().nullish(),
  createdAt: z.string().datetime({ offset: true }).nullish(),
  createdByName: z.string().nullish(),
  tokens: z.array(templateTokenSchema),
  default: z.object(templateContentShape),
});
export type HandoverTemplate = z.infer<typeof handoverTemplateSchema>;

/** HandoverTemplateVersionResponse: một dòng lịch sử các lần lưu. */
export const handoverTemplateVersionSchema = z.object({
  version: z.number().int(),
  createdAt: z.string().datetime({ offset: true }),
  createdByName: z.string().nullish(),
  note: z.string().nullish(),
});
export const handoverTemplateVersionsSchema = z.array(handoverTemplateVersionSchema);
export type HandoverTemplateVersion = z.infer<typeof handoverTemplateVersionSchema>;

/** Body POST /admin/handover-templates. */
export const saveHandoverTemplateRequestSchema = z.object({
  ...templateContentShape,
  note: z.string().max(300, "Ghi chú tối đa 300 ký tự.").optional(),
});
export type SaveHandoverTemplateRequest = z.infer<typeof saveHandoverTemplateRequestSchema>;

/** Một biến chèn vào chữ thư, viết {TEN_BIEN}. */
const emailTemplateTokenSchema = z.object({ name: z.string(), description: z.string() });

const emailTemplateFieldsSchema = z.object({
  subject: z.string(),
  title: z.string(),
  body: z.string(),
  buttonText: z.string(),
  note: z.string(),
});

const emailTemplateCustomSchema = z.object({
  subject: z.string().nullable(),
  title: z.string().nullable(),
  body: z.string().nullable(),
  buttonText: z.string().nullable(),
  note: z.string().nullable(),
});

/** Một loại thư thông báo: chữ gốc trong mã và chữ Admin đã đặt (null: giữ chữ gốc). */
export const emailTemplateSchema = z.object({
  key: z.string(),
  label: z.string(),
  description: z.string(),
  canDisable: z.boolean(),
  editableBody: z.boolean(),
  enabled: z.boolean(),
  tokens: z.array(emailTemplateTokenSchema),
  default: emailTemplateFieldsSchema,
  custom: emailTemplateCustomSchema,
  updatedAt: z.string().nullable().default(null),
  updatedByName: z.string().nullable().default(null),
});
export const emailTemplatesSchema = z.array(emailTemplateSchema);
export type EmailTemplate = z.infer<typeof emailTemplateSchema>;

export const saveEmailTemplateRequestSchema = z.object({
  enabled: z.boolean(),
  subject: z.string().nullable(),
  title: z.string().nullable(),
  body: z.string().nullable(),
  buttonText: z.string().nullable(),
  note: z.string().nullable(),
});
export type SaveEmailTemplateRequest = z.infer<typeof saveEmailTemplateRequestSchema>;

/** Một thư bổ sung gửi cho Chủ kho theo ngày tính từ hạn điểm danh (âm: trước hạn, dương: sau hạn). */
export const extraMailSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  daysFromDue: z.number().int(),
  subject: z.string(),
  title: z.string(),
  body: z.string(),
  buttonText: z.string(),
  note: z.string(),
  updatedAt: z.string(),
  updatedByName: z.string().nullable().default(null),
});
export type ExtraMail = z.infer<typeof extraMailSchema>;

export const extraMailListSchema = z.object({
  items: z.array(extraMailSchema),
  maxItems: z.number().int(),
  minDaysFromDue: z.number().int(),
  maxDaysFromDue: z.number().int(),
  tokens: z.array(emailTemplateTokenSchema),
});
export type ExtraMailList = z.infer<typeof extraMailListSchema>;

export const saveExtraMailRequestSchema = z.object({
  name: z.string(),
  enabled: z.boolean(),
  daysFromDue: z.number().int(),
  subject: z.string(),
  title: z.string(),
  body: z.string(),
  buttonText: z.string(),
  note: z.string(),
});
export type SaveExtraMailRequest = z.infer<typeof saveExtraMailRequestSchema>;
