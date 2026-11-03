/* eslint-disable react-hooks/rules-of-hooks */
import { test as base, type Page } from "@playwright/test";

export type UserRole = "OWNER" | "EXECUTOR" | "VERIFIER" | "ADMIN";

export interface MockUser {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "USER" | "EXECUTOR" | "VERIFIER" | "ADMIN";
  emailVerified: boolean;
  hasPassword: boolean;
  status: "ACTIVE" | "LOCKED" | "DISABLED";
  createdAt: string;
}

export const MOCK_USERS: Record<UserRole, MockUser> = {
  OWNER: {
    id: "a0000000-0000-0000-0000-000000000001",
    email: "owner@legacyvault.vn",
    fullName: "Nguyễn Văn Nam",
    phone: "0901234567",
    role: "USER",
    emailVerified: true,
    hasPassword: true,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
  },
  EXECUTOR: {
    id: "a0000000-0000-0000-0000-000000000002",
    email: "executor@legacyvault.vn",
    fullName: "Trần Thị Lan",
    phone: "0901234568",
    role: "EXECUTOR",
    emailVerified: true,
    hasPassword: true,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
  },
  VERIFIER: {
    id: "a0000000-0000-0000-0000-000000000003",
    email: "verifier@legacyvault.vn",
    fullName: "Lê Công Chứng",
    phone: "0901234569",
    role: "VERIFIER",
    emailVerified: true,
    hasPassword: true,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
  },
  ADMIN: {
    id: "a0000000-0000-0000-0000-000000000004",
    email: "admin@legacyvault.vn",
    fullName: "Quản Trị Viên",
    phone: "0901234570",
    role: "ADMIN",
    emailVerified: true,
    hasPassword: true,
    status: "ACTIVE",
    createdAt: "2026-01-01T00:00:00Z",
  },
};

/**
 * Thiết lập mock session và CSRF token cho một vai trò nhất định
 */
export async function mockAuthenticatedRole(page: Page, role: UserRole) {
  const user = MOCK_USERS[role];

  // 0. Catch-all fallback cho toàn bộ các endpoint /api/v1/** chưa mock riêng,
  // tránh request lọt ra Render.com và nhận 401 làm reset session.
  await page.route("**/api/v1/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        total: 0,
        totalCount: 0,
        pageIndex: 1,
        pageSize: 10,
        totalPages: 0,
        hasPreviousPage: false,
        hasNextPage: false,
      }),
    });
  });

  // 1. Mock CSRF token endpoint
  await page.route("**/api/v1/auth/csrf", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ requestToken: "mocked-csrf-token-12345" }),
    });
  });

  // 2. Mock current session endpoint trả về DTO đúng hợp đồng backendUserResponseSchema
  await page.route("**/api/v1/auth/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(user),
    });
  });

  // 3. Mock refresh endpoint để AuthBootstrap khôi phục phiên và cấp access token
  await page.route("**/api/v1/auth/refresh", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        accessToken: "mocked-access-token-jwt",
        expiresIn: 3600,
        user,
      }),
    });
  });

  // 4. Mock executor vaults mặc định để OwnerWorkspace (useCanSwitchToExecutor) không bị lỗi mạng
  await page.route("**/api/v1/executor/vaults", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });
}

/**
 * Fixture mở rộng hỗ trợ khởi tạo session sạch và đăng nhập nhanh theo vai trò
 */
export const test = base.extend<{
  cleanSession: Page;
  ownerPage: Page;
  executorPage: Page;
  verifierPage: Page;
  adminPage: Page;
}>({
  cleanSession: async ({ page, context }, use) => {
    // 1. Mock refresh và session trả 401 ngay lập tức để AuthBootstrap không bị treo chờ Backend
    await page.route("**/api/v1/auth/refresh", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ code: "UNAUTHORIZED", message: "Chưa đăng nhập" }),
      });
    });

    await page.route("**/api/v1/auth/session", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ code: "UNAUTHORIZED", message: "Chưa đăng nhập" }),
      });
    });

    // 2. Xóa sạch cookies, storageState để tạo phiên hoàn toàn mới
    await context.clearCookies();
    await page.goto("/login");
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await use(page);
  },

  ownerPage: async ({ page }, use) => {
    await mockAuthenticatedRole(page, "OWNER");
    await use(page);
  },

  executorPage: async ({ page }, use) => {
    await mockAuthenticatedRole(page, "EXECUTOR");
    await use(page);
  },

  verifierPage: async ({ page }, use) => {
    await mockAuthenticatedRole(page, "VERIFIER");
    await use(page);
  },

  adminPage: async ({ page }, use) => {
    await mockAuthenticatedRole(page, "ADMIN");
    await use(page);
  },
});

export { expect } from "@playwright/test";
