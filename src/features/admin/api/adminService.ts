import { z } from "zod";
import { apiClient } from "@/shared/api";
import {
  adminDashboardSchema,
  adminUserSchema,
  adminUserDetailSchema,
  countsSchema,
  adminUsersPageSchema,
  adminUsersQuerySchema,
  changeUserRoleRequestSchema,
  changeUserStatusRequestSchema,
  paymentTransactionsPageSchema,
  paymentTransactionsQuerySchema,
  adminRevenueSchema,
  adminRevenueQuerySchema,
  assignExecutorRequestSchema,
  assignExecutorResultSchema,
  reassignVerifierRequestSchema,
  type AdminUsersQuery,
  type CreateAdminUserRequest,
  createAdminUserRequestSchema,
  type ChangeUserRoleRequest,
  type ChangeUserStatusRequest,
  type AdminRevenueQuery,
  type PaymentTransactionsQuery,
  type AssignExecutorRequest,
  type ReassignVerifierRequest,
} from "../model/admin.schema";

const id = z.string().uuid();

/** Transport Admin theo AdminController; không Admin → BE trả 404 (SEC-04). */
export const adminService = {
  /** Bộ đếm vận hành và giờ máy chủ. */
  async getDashboard(signal?: AbortSignal) {
    return adminDashboardSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/dashboard", { signal }),
    );
  },
  /** Tạo tài khoản hệ thống mới (Verifier, Executor, Admin). */
  async createUser(body: CreateAdminUserRequest, signal?: AbortSignal) {
    const payload = createAdminUserRequestSchema.parse(body);
    return adminUserSchema.parse(
      await apiClient.post<unknown, unknown>("/admin/users", payload, { signal }),
    );
  },
  /** Tải ảnh thẻ luật sư của một Người xét duyệt (multipart: file); BE trả 204. */
  async uploadNotaryCard(userId: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    await apiClient.put<unknown, unknown>(`/admin/users/${id.parse(userId)}/notary-card`, form, {
      headers: { "Content-Type": undefined },
    });
  },
  /** Danh sách tài khoản; bỏ `search` rỗng thay vì gửi `search=`. */
  async listUsers(query: AdminUsersQuery, signal?: AbortSignal) {
    const parsed = adminUsersQuerySchema.parse(query);
    const params: Record<string, string | number> = {
      pageIndex: parsed.pageIndex,
      pageSize: parsed.pageSize,
    };
    if (parsed.search) params.search = parsed.search;
    if (parsed.role) params.role = parsed.role;
    if (parsed.status) params.status = parsed.status;
    return adminUsersPageSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/users", { params, signal }),
    );
  },
  /** Chi tiết một tài khoản cho Admin (hồ sơ đang giữ, quyết định và hoạt động gần đây). */
  async getUser(userId: string, signal?: AbortSignal) {
    return adminUserDetailSchema.parse(
      await apiClient.get<unknown, unknown>(`/admin/users/${id.parse(userId)}`, { signal }),
    );
  },
  /** Đổi vai trò; lý do bắt buộc, không đổi được chính mình hay Admin cuối cùng (BR-74). */
  async changeUserRole(userId: string, request: ChangeUserRoleRequest) {
    return adminUserSchema.parse(
      await apiClient.put<unknown, unknown>(
        `/admin/users/${id.parse(userId)}/role`,
        changeUserRoleRequestSchema.parse(request),
      ),
    );
  },
  /** Khóa/vô hiệu hóa/mở lại tài khoản; BE thu hồi mọi refresh token khi khóa (BR-74). */
  async changeUserStatus(userId: string, request: ChangeUserStatusRequest) {
    return adminUserSchema.parse(
      await apiClient.put<unknown, unknown>(
        `/admin/users/${id.parse(userId)}/status`,
        changeUserStatusRequestSchema.parse(request),
      ),
    );
  },
  /** Giao lại Người xét duyệt (luật sư) cho biên bản bàn giao; BE trả 204 (BR-73). */
  async reassignVerifier(caseId: string, request: ReassignVerifierRequest) {
    await apiClient.post<unknown, unknown>(
      `/admin/handover-records/${id.parse(caseId)}/reassign-verifier`,
      reassignVerifierRequestSchema.parse(request),
    );
  },
  /**
   * Giao hoặc đổi Người thực thi của kho. Trạng thái trả về INVITED (đã gửi lời mời) hoặc ACCEPTED
   * (kho đang bàn giao nên người mới nhận việc ngay).
   */
  async assignExecutor(vaultId: string, request: AssignExecutorRequest) {
    return assignExecutorResultSchema.parse(
      await apiClient.post<unknown, unknown>(
        `/admin/vaults/${id.parse(vaultId)}/executor`,
        assignExecutorRequestSchema.parse(request),
      ),
    );
  },

  /** Số tài khoản theo vai trò, cùng tìm kiếm và trạng thái với danh sách nhưng bỏ qua vai trò. */
  async countUsers(query: { search?: string; status?: string }, signal?: AbortSignal) {
    const params: Record<string, string> = {};
    if (query.search) params.search = query.search;
    if (query.status) params.status = query.status;
    return countsSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/users/counts", { params, signal }),
    );
  },
  /** Giao dịch tiền vào, mới nhất trước; chỉ đọc (AdminPaymentsController). */
  async listPaymentTransactions(query: PaymentTransactionsQuery, signal?: AbortSignal) {
    const parsed = paymentTransactionsQuerySchema.parse(query);
    const params: Record<string, string | number> = {
      pageIndex: parsed.pageIndex,
      pageSize: parsed.pageSize,
    };
    if (parsed.status) params.status = parsed.status;
    if (parsed.search) params.search = parsed.search;
    if (parsed.environment) params.environment = parsed.environment;
    if (parsed.from) params.from = parsed.from;
    if (parsed.to) params.to = parsed.to;
    return paymentTransactionsPageSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/payment-transactions", { params, signal }),
    );
  },

  /** Doanh thu theo ngày, tháng hoặc quý (tiền thật đã khớp đơn); chỉ đọc. */
  async getRevenue(query: AdminRevenueQuery, signal?: AbortSignal) {
    const parsed = adminRevenueQuerySchema.parse(query);
    const params: Record<string, string> = {
      groupBy: parsed.groupBy,
      environment: parsed.environment,
    };
    if (parsed.from) params.from = parsed.from;
    if (parsed.to) params.to = parsed.to;
    return adminRevenueSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/payment-transactions/revenue", {
        params,
        signal,
      }),
    );
  },
};
