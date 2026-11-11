import { z } from "zod";
import { apiClient } from "@/shared/api";
import {
  adminDashboardSchema,
  adminUserSchema,
  adminUserDetailSchema,
  countsSchema,
  adminUsersPageSchema,
  adminUsersQuerySchema,
  assignIncidentRequestSchema,
  changeUserRoleRequestSchema,
  changeUserStatusRequestSchema,
  holdSchema,
  holdsPageSchema,
  holdsQuerySchema,
  incidentDetailSchema,
  incidentNoteRequestSchema,
  incidentsPageSchema,
  incidentsQuerySchema,
  paymentTransactionsPageSchema,
  paymentTransactionsQuerySchema,
  adminRevenueSchema,
  handoverTemplateSchema,
  handoverTemplateVersionsSchema,
  saveHandoverTemplateRequestSchema,
  adminRevenueQuerySchema,
  assignExecutorRequestSchema,
  reassignVerifierRequestSchema,
  resolveIncidentRequestSchema,
  reviewIncidentRequestSchema,
  type AdminUsersQuery,
  type CreateAdminUserRequest,
  createAdminUserRequestSchema,
  type AssignIncidentRequest,
  type ChangeUserRoleRequest,
  type ChangeUserStatusRequest,
  type HoldsQuery,
  type IncidentNoteRequest,
  type IncidentsQuery,
  type AdminRevenueQuery,
  type SaveHandoverTemplateRequest,
  type PaymentTransactionsQuery,
  type AssignExecutorRequest,
  type ReassignVerifierRequest,
  type ResolveIncidentRequest,
  type ReviewIncidentRequest,
} from "../model/admin.schema";

const id = z.string().uuid();
const incident = (incidentId: string) => `/admin/incidents/${id.parse(incidentId)}`;
const hold = (holdId: string) => `/admin/holds/${id.parse(holdId)}`;

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
  /** Tải ảnh thẻ công chứng viên của một Người xét duyệt (multipart: file); BE trả 204. */
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
  /** Giao lại Verifier cho hồ sơ chứng tử chưa được xét; BE trả 204 (BR-73). */
  async reassignVerifier(caseId: string, request: ReassignVerifierRequest) {
    await apiClient.post<unknown, unknown>(
      `/admin/death-cases/${id.parse(caseId)}/reassign-verifier`,
      reassignVerifierRequestSchema.parse(request),
    );
  },
  /** Giao hoặc đổi Người thực thi của kho; trả lời mời đã gửi (người được giao phải chấp nhận). */
  async assignExecutor(vaultId: string, request: AssignExecutorRequest) {
    await apiClient.post<unknown, unknown>(
      `/admin/vaults/${id.parse(vaultId)}/executor`,
      assignExecutorRequestSchema.parse(request),
    );
  },

  async listIncidents(query: IncidentsQuery, signal?: AbortSignal) {
    const parsed = incidentsQuerySchema.parse(query);
    const params: Record<string, string | number | boolean> = {
      pageIndex: parsed.pageIndex,
      pageSize: parsed.pageSize,
    };
    if (parsed.status) params.status = parsed.status;
    if (parsed.type) params.type = parsed.type;
    if (parsed.overdueOnly) params.overdueOnly = true;
    if (parsed.mine) params.mine = true;
    if (parsed.search) params.search = parsed.search;
    return incidentsPageSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/incidents", { params, signal }),
    );
  },
  async getIncident(incidentId: string, signal?: AbortSignal) {
    return incidentDetailSchema.parse(
      await apiClient.get<unknown, unknown>(incident(incidentId), { signal }),
    );
  },
  async assignIncident(incidentId: string, request: AssignIncidentRequest) {
    return incidentDetailSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${incident(incidentId)}/assign`,
        assignIncidentRequestSchema.parse(request),
      ),
    );
  },
  async addIncidentNote(incidentId: string, request: IncidentNoteRequest) {
    return incidentDetailSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${incident(incidentId)}/notes`,
        incidentNoteRequestSchema.parse(request),
      ),
    );
  },
  /** Ghi kết quả xem lại và hẹn lần xem lại tiếp theo (tối đa 7 ngày, BR-72). */
  async reviewIncident(incidentId: string, request: ReviewIncidentRequest) {
    return incidentDetailSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${incident(incidentId)}/review`,
        reviewIncidentRequestSchema.parse(request),
      ),
    );
  },
  async resolveIncident(incidentId: string, request: ResolveIncidentRequest) {
    return incidentDetailSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${incident(incidentId)}/resolve`,
        resolveIncidentRequestSchema.parse(request),
      ),
    );
  },

  /** Số sự cố theo trạng thái, cùng bộ lọc với danh sách nhưng bỏ qua trạng thái. */
  async countIncidents(
    query: Omit<IncidentsQuery, "status" | "pageIndex" | "pageSize">,
    signal?: AbortSignal,
  ) {
    const params: Record<string, string | boolean> = {};
    if (query.type) params.type = query.type;
    if (query.overdueOnly) params.overdueOnly = true;
    if (query.mine) params.mine = true;
    if (query.search) params.search = query.search;
    return countsSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/incidents/counts", { params, signal }),
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
  async countHolds(signal?: AbortSignal) {
    return countsSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/holds/counts", { signal }),
    );
  },
  async listHolds(query: HoldsQuery, signal?: AbortSignal) {
    const parsed = holdsQuerySchema.parse(query);
    const params: Record<string, string | number> = {
      pageIndex: parsed.pageIndex,
      pageSize: parsed.pageSize,
    };
    if (parsed.status) params.status = parsed.status;
    if (parsed.vaultId) params.vaultId = parsed.vaultId;
    return holdsPageSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/holds", { params, signal }),
    );
  },
  async getHold(holdId: string, signal?: AbortSignal) {
    return holdSchema.parse(await apiClient.get<unknown, unknown>(hold(holdId), { signal }));
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

  /** Mẫu biên bản đang dùng cho biên bản mới (mẫu gốc khi chưa lưu bản nào). */
  async getHandoverTemplate(signal?: AbortSignal) {
    return handoverTemplateSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/handover-templates/current", { signal }),
    );
  },

  /** Một phiên bản cũ của mẫu theo số. */
  async getHandoverTemplateVersion(version: number, signal?: AbortSignal) {
    return handoverTemplateSchema.parse(
      await apiClient.get<unknown, unknown>(`/admin/handover-templates/${version}`, { signal }),
    );
  },

  /** Lịch sử các lần lưu mẫu, mới nhất trước. */
  async listHandoverTemplateVersions(signal?: AbortSignal) {
    return handoverTemplateVersionsSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/handover-templates", { signal }),
    );
  },

  /** Lưu thành phiên bản mới; biên bản đã tạo giữ nguyên chữ của phiên bản lúc tạo. */
  async saveHandoverTemplate(request: SaveHandoverTemplateRequest) {
    const body = saveHandoverTemplateRequestSchema.parse(request);
    return handoverTemplateSchema.parse(
      await apiClient.post<unknown, unknown>("/admin/handover-templates", body),
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
