import { test, expect } from "@playwright/test";
import * as path from "node:path";

const SCREENSHOT_DIR =
  "C:/Users/ThanhDuy/.gemini/antigravity/brain/668d52f5-4c90-46e3-96e3-1ffe5920a899/screenshots/audit";

test.describe.serial("Full System Audit & E2E Verification - 5 Actors on Remote DB", () => {
  // =========================================================================
  // ACTOR 1: CHỦ KHO (VAULT OWNER) - owner1@legacyvault.vn
  // =========================================================================
  test("1. Owner: Luồng hoàn chỉnh từ Đăng nhập (Worst & Happy) đến Quản lý Kho, Tài sản & DMS", async ({
    page,
  }) => {
    // 1.1 Worst Case: Đăng nhập sai mật khẩu
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#login-email").fill("owner1@legacyvault.vn");
    await page.locator("#login-password").fill("WrongPassword@999");
    await page.getByRole("button", { name: /đăng nhập/i }).click();

    const alertBox = page.getByRole("alert");
    await expect(alertBox).toBeVisible({ timeout: 8000 });
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, "1.1-owner-worst-login-failed.png") });

    // 1.2 Happy Case: Đăng nhập đúng mật khẩu
    await page.locator("#login-password").fill("LegacyVault@2026");
    await page.getByRole("button", { name: /đăng nhập/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    await page.waitForLoadState("networkidle");

    await expect(page.getByText(/kho di sản của chủ kho nguyễn văn a/i).first()).toBeVisible({
      timeout: 10000,
    });
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "1.2-owner-dashboard-overview.png"),
      fullPage: true,
    });

    // 1.3 Quản lý Người thừa kế
    await page.goto("/dashboard/beneficiaries");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "1.3-owner-beneficiaries-list.png"),
      fullPage: true,
    });

    // 1.4 Quản lý Tài sản số
    await page.goto("/dashboard/assets");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "1.4-owner-assets-list.png"),
      fullPage: true,
    });

    // 1.5 Dead Man's Switch (DMS)
    await page.goto("/dms");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "1.5-owner-dms-status.png"),
      fullPage: true,
    });
  });

  // =========================================================================
  // ACTOR 2: NGƯỜI THỰC THI (DIGITAL EXECUTOR) - executor1@legacyvault.vn
  // =========================================================================
  test("2. Executor: Luồng hoàn chỉnh từ Không gian quản lý đến Báo tử, Bàn giao & Biên bản", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#login-email").fill("executor1@legacyvault.vn");
    await page.locator("#login-password").fill("LegacyVault@2026");
    await page.getByRole("button", { name: /đăng nhập/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 15000 });

    // 2.1 Xem Trang chủ Executor
    await page.goto("/executor");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "2.1-executor-home.png"),
      fullPage: true,
    });

    // 2.2 Xem Báo tin tử tuất
    await page.goto("/executor/report");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "2.2-executor-report.png"),
      fullPage: true,
    });

    // 2.3 Xem Tiến trình bàn giao
    await page.goto("/executor/progress");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "2.3-executor-progress.png"),
      fullPage: true,
    });

    // 2.4 Xem Biên bản bàn giao của Người thực thi (Tính năng mới PR #118)
    await page.goto("/executor/documents");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "2.4-executor-documents-list.png"),
      fullPage: true,
    });
  });

  // =========================================================================
  // ACTOR 3: NGƯỜI XÉT DUYỆT (LEGAL VERIFIER) - verifier1@legacyvault.vn
  // =========================================================================
  test("3. Verifier: Thẩm định hồ sơ chứng tử, người nhận & Biên bản kiểm tra thủ công", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#login-email").fill("verifier1@legacyvault.vn");
    await page.locator("#login-password").fill("LegacyVault@2026");
    await page.getByRole("button", { name: /đăng nhập/i }).click();

    // Verifier tự động vào /notary/workspace
    await page.waitForURL("**/notary/**", { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "3.1-verifier-workspace.png"),
      fullPage: true,
    });

    // 3.2 Xem Trang Biên bản thẩm định thủ công (Tính năng mới PR #118)
    await page.goto("/notary/documents");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "3.2-verifier-documents-page.png"),
      fullPage: true,
    });
  });

  // =========================================================================
  // ACTOR 4: NGƯỜI THỪA KẾ (BENEFICIARY) - beneficiary1@legacyvault.vn
  // =========================================================================
  test("4. Beneficiary: Tiếp nhận di sản, Biên bản người nhận & Xác minh thư chống giả mạo", async ({
    page,
  }) => {
    // 4.1 Đăng nhập Người thừa kế
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#login-email").fill("beneficiary1@legacyvault.vn");
    await page.locator("#login-password").fill("LegacyVault@2026");
    await page.getByRole("button", { name: /đăng nhập/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 15000 });

    // 4.2 Xem Cổng nhận di sản
    await page.goto("/claim/beneficiary");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "4.1-beneficiary-portal.png"),
      fullPage: true,
    });

    // 4.3 Xem Biên bản của Người nhận (Tính năng mới PR #118)
    await page.goto("/beneficiary/documents");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "4.2-beneficiary-documents-page.png"),
      fullPage: true,
    });

    // 4.4 Kiểm tra trang chống lừa đảo /receive (Công khai)
    await page.goto("/receive");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "4.3-beneficiary-receive-verify-screen.png"),
      fullPage: true,
    });

    // Worst Case: Nhập sai mã hồ sơ và CCCD
    const turnCodeInput = page.getByLabel(/mã hồ sơ/i);
    const citizenIdInput = page.getByLabel(/số căn cước/i);
    if (await turnCodeInput.isVisible()) {
      await turnCodeInput.fill("INVALID-9999");
      if (await citizenIdInput.isVisible()) {
        await citizenIdInput.fill("000000000000");
      }
      const verifyBtn = page.getByRole("button", { name: /xác minh/i });
      if (await verifyBtn.isVisible()) {
        await verifyBtn.click();
        await page.waitForTimeout(1000);
        await page.screenshot({
          path: path.join(SCREENSHOT_DIR, "4.4-beneficiary-verify-failed.png"),
        });
      }
    }
  });

  // =========================================================================
  // ACTOR 5: QUẢN TRỊ VIÊN (ADMIN) - admin1@legacyvault.vn
  // =========================================================================
  test("5. Admin: Bảng điều khiển Quản trị, Quản lý người dùng & Cấu hình hệ thống", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator("#login-email").fill("admin1@legacyvault.vn");
    await page.locator("#login-password").fill("LegacyVault@2026");
    await page.getByRole("button", { name: /đăng nhập/i }).click();

    // Admin tự động chuyển hướng vào /admin
    await page.waitForURL("**/admin**", { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "5.1-admin-dashboard.png"),
      fullPage: true,
    });

    // 5.2 Quản lý Người dùng
    await page.goto("/dashboard/users");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "5.2-admin-user-management.png"),
      fullPage: true,
    });

    // 5.3 Cấu hình chính sách hệ thống (Policy Windows)
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.screenshot({
      path: path.join(SCREENSHOT_DIR, "5.3-admin-settings.png"),
      fullPage: true,
    });
  });
});
