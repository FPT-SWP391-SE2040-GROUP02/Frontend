import { z } from "zod";
import { apiClient } from "@/shared/api";
import {
  adminDashboardSchema,
  adminUserSchema,
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
  placeHoldRequestSchema,
  reassignVerifierRequestSchema,
  releaseHoldRequestSchema,
  resolveIncidentRequestSchema,
  reviewHoldRequestSchema,
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
  type PlaceHoldRequest,
  type ReassignVerifierRequest,
  type ReleaseHoldRequest,
  type ResolveIncidentRequest,
  type ReviewHoldRequest,
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

  async listIncidents(query: IncidentsQuery, signal?: AbortSignal) {
    const parsed = incidentsQuerySchema.parse(query);
    const params: Record<string, string | number | boolean> = {
      pageIndex: parsed.pageIndex,
      pageSize: parsed.pageSize,
    };
    if (parsed.status) params.status = parsed.status;
    if (parsed.type) params.type = parsed.type;
    if (parsed.overdueOnly) params.overdueOnly = true;
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

  async listHolds(query: HoldsQuery, signal?: AbortSignal) {
    const parsed = holdsQuerySchema.parse(query);
    const params: Record<string, string | number> = {
      pageIndex: parsed.pageIndex,
      pageSize: parsed.pageSize,
    };
    if (parsed.status) params.status = parsed.status;
    return holdsPageSchema.parse(
      await apiClient.get<unknown, unknown>("/admin/holds", { params, signal }),
    );
  },
  async getHold(holdId: string, signal?: AbortSignal) {
    return holdSchema.parse(await apiClient.get<unknown, unknown>(hold(holdId), { signal }));
  },
  /** Đặt hold lên kho hoặc gói; BE trả 201. */
  async placeHold(request: PlaceHoldRequest) {
    return holdSchema.parse(
      await apiClient.post<unknown, unknown>("/admin/holds", placeHoldRequestSchema.parse(request)),
    );
  },
  /** Hẹn lần rà soát hold tiếp theo (tối đa 7 ngày, BR-70). */
  async reviewHold(holdId: string, request: ReviewHoldRequest) {
    return holdSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${hold(holdId)}/review`,
        reviewHoldRequestSchema.parse(request),
      ),
    );
  },
  /** Gỡ hold; hold OWNER_ALIVE chỉ Verifier gỡ được nên BE trả 409 HOLD_OWNER_ALIVE (BR-71). */
  async releaseHold(holdId: string, request: ReleaseHoldRequest) {
    return holdSchema.parse(
      await apiClient.post<unknown, unknown>(
        `${hold(holdId)}/release`,
        releaseHoldRequestSchema.parse(request),
      ),
    );
  },
};
