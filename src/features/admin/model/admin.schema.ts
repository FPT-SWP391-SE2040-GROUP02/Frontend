import { z } from "zod";
import { paginatedListSchema } from "@/shared/api/pagination.schema";

/** Vai trò tài khoản theo `UserRole` của Backend (wire viết hoa). */
export const ADMIN_USER_ROLES = ["USER", "VERIFIER", "ADMIN", "EXECUTOR"] as const;
/**
 * Vai trò Admin được cấp khi đổi vai trò. Không có EXECUTOR: người thực hiện là người ngoài do Owner mời theo
 * từng kho (ROLE-02), BE trả 400 nếu gửi EXECUTOR. ADMIN_USER_ROLES vẫn giữ để đọc và lọc tài khoản cũ.
 */
export const ASSIGNABLE_USER_ROLES = ["USER", "VERIFIER", "ADMIN"] as const;
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
  openIncidents: counter,
  overdueIncidents: counter,
  unassignedIncidents: counter,
  activeHolds: counter,
  holdsPastReview: counter,
  activeVerifiers: counter,
  activeAdmins: counter,
  casesWithoutVerifier: counter,
  serverTime: dateTime,
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
 * Vận hành: sự cố, tạm giữ (hold), đổi vai trò/trạng thái, giao lại Verifier.
 * Theo AdminController và OperationsResponses/OperationsRequests của Backend.
 * ------------------------------------------------------------------------- */

/** `IncidentType` của Backend (wire UPPER_SNAKE). */
export const INCIDENT_TYPES = [
  "NO_VERIFIER",
  "NO_EXECUTOR",
  "CHECK_IN_OVERDUE",
  "NOTIFICATION_FAILED",
  "OWNER_ALIVE",
  "INTEGRATION",
  "MANUAL",
  "PAYMENT",
] as const;
/** `IncidentStatus` của Backend. */
export const INCIDENT_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;
/** `IncidentEventKind` của Backend. */
export const INCIDENT_EVENT_KINDS = [
  "RAISED",
  "ASSIGNED",
  "NOTE",
  "REVIEWED",
  "REMINDED",
  "ESCALATED",
  "RESOLVED",
] as const;
/** `HoldType` của Backend. OWNER_ALIVE chỉ gỡ được khi Verifier kết luận (BR-71). */
export const HOLD_TYPES = ["OWNER_ALIVE", "DISPUTE", "ADMIN"] as const;
/** `HoldStatus` của Backend. */
export const HOLD_STATUSES = ["ACTIVE", "RELEASED"] as const;
/** Phạm vi Admin được đặt hold (HoldService chỉ nhận VAULT hoặc CONTAINER). */
/** Loại đối tượng của sự cố giao được Verifier (IncidentService.TargetDeathCase). */
export const INCIDENT_TARGET_DEATH_CASE = "DEATH_CASE";

export const incidentTypeSchema = z.enum(INCIDENT_TYPES);
export const incidentStatusSchema = z.enum(INCIDENT_STATUSES);
export const holdTypeSchema = z.enum(HOLD_TYPES);
export const holdStatusSchema = z.enum(HOLD_STATUSES);
export type IncidentType = z.infer<typeof incidentTypeSchema>;
export type IncidentStatus = z.infer<typeof incidentStatusSchema>;
export type HoldType = z.infer<typeof holdTypeSchema>;
export type HoldStatus = z.infer<typeof holdStatusSchema>;

const uuid = z.string().uuid();

/** IncidentSummaryResponse. */
export const incidentSummarySchema = z.object({
  id: uuid,
  type: incidentTypeSchema,
  status: incidentStatusSchema,
  vaultId: uuid.nullable(),
  targetType: z.string(),
  targetId: uuid.nullable(),
  summary: z.string(),
  assigneeUserId: uuid.nullable(),
  dueAt: dateTime,
  overdue: z.boolean(),
  nextReviewAt: dateTime,
  createdAt: dateTime,
  etag: z.string().min(1),
});
export type IncidentSummary = z.infer<typeof incidentSummarySchema>;

/** IncidentEventResponse. */
export const incidentEventSchema = z.object({
  kind: z.enum(INCIDENT_EVENT_KINDS),
  actorUserId: uuid.nullable(),
  note: z.string().nullable(),
  at: dateTime,
});

/** IncidentDetailResponse (kế thừa Summary, thêm lịch sử). */
export const incidentDetailSchema = incidentSummarySchema.extend({
  remindedCount: counter,
  escalatedAt: dateTime.nullable(),
  resolvedAt: dateTime.nullable(),
  resolutionNote: z.string().nullable(),
  events: z.array(incidentEventSchema),
});
export type IncidentDetail = z.infer<typeof incidentDetailSchema>;

export const incidentsPageSchema = paginatedListSchema(incidentSummarySchema);
export type IncidentsPage = z.infer<typeof incidentsPageSchema>;

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

/** Kích thước trang cố định của danh sách sự cố và hold. */
export const ADMIN_LIST_PAGE_SIZE = 20;

/** Query GET /admin/incidents (tên tham số theo AdminController). */
export const incidentsQuerySchema = z.object({
  status: incidentStatusSchema.optional(),
  type: incidentTypeSchema.optional(),
  overdueOnly: z.boolean().optional(),
  pageIndex: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
});
export type IncidentsQuery = z.infer<typeof incidentsQuerySchema>;

/** Query GET /admin/holds. */
export const holdsQuerySchema = z.object({
  status: holdStatusSchema.optional(),
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
  status: paymentTransactionStatusSchema.optional(),
  pageIndex: z.number().int().positive(),
  pageSize: z.number().int().min(1).max(100),
});
export type PaymentTransactionsQuery = z.infer<typeof paymentTransactionsQuerySchema>;

/* Request body: độ dài theo DataAnnotations của Backend. */
const reason500 = z.string().trim().min(1, "Vui lòng ghi lý do.").max(500, "Tối đa 500 ký tự.");
const text1000 = (message: string) =>
  z.string().trim().min(1, message).max(1000, "Tối đa 1000 ký tự.");
const etag = z.string().min(1);

export const assignIncidentRequestSchema = z.object({
  assigneeUserId: uuid,
  reason: text1000("Vui lòng ghi lý do."),
  etag,
});
export const incidentNoteRequestSchema = z.object({ note: text1000("Vui lòng ghi ghi chú.") });
export const reviewIncidentRequestSchema = z.object({
  nextReviewAt: dateTime,
  note: text1000("Vui lòng ghi kết quả xem lại."),
  etag,
});
export const resolveIncidentRequestSchema = z.object({
  note: text1000("Vui lòng ghi kết quả xử lý."),
  etag,
});
export const changeUserRoleRequestSchema = z.object({
  role: assignableUserRoleSchema,
  reason: reason500,
});
export const changeUserStatusRequestSchema = z.object({
  status: adminUserStatusSchema,
  reason: reason500,
});
export const reassignVerifierRequestSchema = z.object({ verifierUserId: uuid, reason: reason500 });

export type AssignIncidentRequest = z.infer<typeof assignIncidentRequestSchema>;
export type IncidentNoteRequest = z.infer<typeof incidentNoteRequestSchema>;
export type ReviewIncidentRequest = z.infer<typeof reviewIncidentRequestSchema>;
export type ResolveIncidentRequest = z.infer<typeof resolveIncidentRequestSchema>;
export type ChangeUserRoleRequest = z.infer<typeof changeUserRoleRequestSchema>;
export type ChangeUserStatusRequest = z.infer<typeof changeUserStatusRequestSchema>;
export type ReassignVerifierRequest = z.infer<typeof reassignVerifierRequestSchema>;

export const createAdminUserRequestSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên.").max(200),
  email: z.string().trim().email("Địa chỉ email không hợp lệ.").max(256),
  password: z.string().min(8, "Mật khẩu tối thiểu 8 ký tự.").max(128),
  role: z.enum(["VERIFIER", "ADMIN"]),
  phone: z.string().trim().max(32).optional(),
});
export type CreateAdminUserRequest = z.infer<typeof createAdminUserRequestSchema>;
