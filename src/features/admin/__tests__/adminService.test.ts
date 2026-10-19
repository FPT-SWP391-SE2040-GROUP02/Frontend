import { afterEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import { AxiosError, AxiosHeaders } from "axios";
import { apiClient } from "@/shared/api/axiosClient";
import { adminService } from "../api/adminService";
import { adminUserSchema } from "../model/admin.schema";
import { classifyAdminError } from "../model/adminError";

const USER_ID = "66666666-6666-4666-8666-666666666666";
export const dashboardFixture = {
  openIncidents: 4,
  overdueIncidents: 1,
  unassignedIncidents: 0,
  activeHolds: 2,
  holdsPastReview: 0,
  activeVerifiers: 3,
  activeAdmins: 1,
  casesWithoutVerifier: 2,
  serverTime: "2026-10-18T02:42:00+00:00",
};
const userFixture = {
  id: USER_ID,
  email: "lan@example.test",
  fullName: "Cô Lan",
  role: "VERIFIER",
  status: "ACTIVE",
  emailVerified: true,
  createdAt: "2026-09-13T01:00:00Z",
  lastLoginAt: null,
  etag: "u-1",
};
const pageFixture = {
  items: [userFixture],
  totalCount: 1,
  pageIndex: 1,
  pageSize: 20,
  totalPages: 1,
  hasPreviousPage: false,
  hasNextPage: false,
};

function httpError(status: number) {
  const headers = new AxiosHeaders();
  return new AxiosError("fail", "ERR", { headers }, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers },
    data: {},
  });
}

afterEach(() => vi.restoreAllMocks());

describe("adminService", () => {
  it("đọc dashboard đúng DTO và từ chối response thiếu field", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(dashboardFixture);
    await expect(adminService.getDashboard()).resolves.toEqual(dashboardFixture);
    expect(get).toHaveBeenCalledWith("/admin/dashboard", { signal: undefined });
    const missing: Partial<typeof dashboardFixture> = { ...dashboardFixture };
    delete missing.serverTime;
    get.mockResolvedValue(missing);
    await expect(adminService.getDashboard()).rejects.toBeInstanceOf(ZodError);
  });

  it("gửi `search` (không phải searchTerm), bỏ giá trị rỗng và truyền signal", async () => {
    const get = vi.spyOn(apiClient, "get").mockResolvedValue(pageFixture);
    const controller = new AbortController();
    await adminService.listUsers(
      { search: "  lan ", role: "VERIFIER", pageIndex: 2, pageSize: 20 },
      controller.signal,
    );
    expect(get).toHaveBeenCalledWith("/admin/users", {
      params: { pageIndex: 2, pageSize: 20, search: "lan", role: "VERIFIER" },
      signal: controller.signal,
    });
    await adminService.listUsers({ search: "   ", pageIndex: 1, pageSize: 20 });
    expect(get).toHaveBeenLastCalledWith("/admin/users", {
      params: { pageIndex: 1, pageSize: 20 },
      signal: undefined,
    });
  });

  it("enum vai trò/trạng thái đóng; lastLoginAt null hợp lệ", () => {
    expect(adminUserSchema.parse(userFixture).lastLoginAt).toBeNull();
    expect(adminUserSchema.safeParse({ ...userFixture, role: "OWNER" }).success).toBe(false);
    expect(adminUserSchema.safeParse({ ...userFixture, status: "PENDING" }).success).toBe(false);
  });
});

describe("classifyAdminError", () => {
  it("404/403 là không có quyền, 400 là bộ lọc sai, Zod là dữ liệu sai", () => {
    expect(classifyAdminError(httpError(404))).toBe("forbidden");
    expect(classifyAdminError(httpError(403))).toBe("forbidden");
    expect(classifyAdminError(httpError(400))).toBe("badRequest");
    expect(classifyAdminError(httpError(401))).toBe("unauthorized");
    expect(classifyAdminError(httpError(503))).toBe("other");
    expect(classifyAdminError(adminUserSchema.safeParse({}).error)).toBe("invalidData");
    expect(classifyAdminError(new Error("network"))).toBe("other");
  });
});
