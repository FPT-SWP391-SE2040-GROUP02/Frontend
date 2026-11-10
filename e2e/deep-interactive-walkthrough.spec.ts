import { test, expect, type Page } from "@playwright/test";
import * as path from "node:path";

const SCREENSHOT_DIR =
  "C:/Users/ThanhDuy/.gemini/antigravity/brain/668d52f5-4c90-46e3-96e3-1ffe5920a899/screenshots/live";

async function safeScreenshot(page: Page, name: string) {
  try {
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, name), fullPage: true });
  } catch (e) {
    console.warn("Screenshot warning:", e);
  }
}

// Bật slowMo 1.2s để Duy có thể nhìn rõ từng thao tác click chuột và gõ phím trên màn hình thật
test.use({
  launchOptions: {
    slowMo: 1200,
  },
});

test.describe.serial("Deep Interactive Walkthrough - Full End-to-End Across 5 Actors", () => {
  // =========================================================================
  // GIAI ĐOẠN 1: CHỦ KHO THIẾT LẬP KHO, TÀI SẢN, NGƯỜI THỪA KẾ & DMS
  // =========================================================================
  test("Giai đoạn 1: Chủ kho thiết lập kho, quản lý tài sản, người nhận và điểm danh DMS", async ({
    page,
  }) => {
    // 1.1 Đăng nhập Chủ kho
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#login-email").fill("owner1@legacyvault.vn");
    await page.locator("#login-password").fill("LegacyVault@2026");
    await page.getByRole("button", { name: /đăng nhập/i }).click();

    await page.waitForURL("**/dashboard**", { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Dừng lại 2s cho Duy xem Dashboard
    await safeScreenshot(page, "step1-owner-dashboard.png");

    // 1.2 Xem trang Người nhận
    await page.goto("/dashboard/beneficiaries");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem danh sách Người nhận
    await safeScreenshot(page, "step1-owner-beneficiaries-page.png");

    // 1.3 Xem trang Tài sản
    await page.goto("/dashboard/assets");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem danh sách Tài sản
    await safeScreenshot(page, "step1-owner-assets-page.png");

    // 1.4 Kiểm tra DMS & Cooldown
    await page.goto("/dms");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(1500);

    const checkInBtn = page.getByRole("button", { name: /điểm danh ngay/i });
    if ((await checkInBtn.isVisible()) && (await checkInBtn.isEnabled())) {
      await checkInBtn.click();
      await page.waitForTimeout(2000); // Xem trạng thái Cooldown 60s
    }
    await safeScreenshot(page, "step1-owner-dms-cooldown.png");
  });

  // =========================================================================
  // GIAI ĐOẠN 2: NGƯỜI THỰC THI (EXECUTOR) KIỂM TRA QUẢN LÝ VÀ BÁO TIN TỬ TUẤT
  // =========================================================================
  test("Giai đoạn 2: Người thực thi xem kho ủy quyền và biểu mẫu báo tin tử tuất", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#login-email").fill("executor1@legacyvault.vn");
    await page.locator("#login-password").fill("LegacyVault@2026");
    await page.getByRole("button", { name: /đăng nhập/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 15000 });

    // 2.1 Vào không gian Executor
    await page.goto("/executor");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem giao diện Executor
    await safeScreenshot(page, "step2-executor-home.png");

    // 2.2 Vào màn hình Báo tin tử tuất (/executor/report)
    await page.goto("/executor/report");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem form Báo tử
    await safeScreenshot(page, "step2-executor-report-form.png");

    // 2.3 Vào màn hình Tiến trình bàn giao (/executor/progress)
    await page.goto("/executor/progress");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem bảng Tiến trình
    await safeScreenshot(page, "step2-executor-progress-overview.png");

    // 2.4 Vào màn hình Biên bản bàn giao (/executor/documents)
    await page.goto("/executor/documents");
    await page.waitForLoadState("networkidle");
    const execDocRow = page
      .getByRole("button", { name: /Biên bản đồng ý nhận|Văn bản từ chối/i })
      .first();
    if (await execDocRow.isVisible()) {
      await execDocRow.click();
      const fullTextBtn = page.getByRole("button", { name: /Xem toàn văn biên bản/i }).first();
      if (await fullTextBtn.isVisible()) {
        await fullTextBtn.click();
      }
    }
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem tab Biên bản mới
    await safeScreenshot(page, "step2-executor-documents-page.png");
    await expect(page.locator("body")).toBeVisible();
  });

  // =========================================================================
  // GIAI ĐOẠN 3: NGƯỜI XÉT DUYỆT (VERIFIER) THẨM ĐỊNH VÀ KIỂM TRA THỦ CÔNG
  // =========================================================================
  test("Giai đoạn 3: Người xét duyệt kiểm tra hàng đợi thẩm định và tiêu chí thủ công", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#login-email").fill("verifier1@legacyvault.vn");
    await page.locator("#login-password").fill("LegacyVault@2026");
    await page.getByRole("button", { name: /đăng nhập/i }).click();

    await page.waitForURL("**/notary/**", { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem Không gian Verifier
    await safeScreenshot(page, "step3-verifier-workspace.png");

    // Xem trang Biên bản thẩm định thủ công
    await page.goto("/notary/documents");
    await page.waitForLoadState("networkidle");
    const verDocRow = page
      .getByRole("button", { name: /Biên bản đồng ý nhận|Văn bản từ chối/i })
      .first();
    if (await verDocRow.isVisible()) {
      await verDocRow.click();
    }
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem khung 4 tiêu chí
    await safeScreenshot(page, "step3-verifier-documents-checklist.png");
    await expect(page.locator("body")).toBeVisible();
  });

  // =========================================================================
  // GIAI ĐOẠN 4: NGƯỜI THỪA KẾ (BENEFICIARY) XÁC MINH VÀ TIẾP NHẬN DI SẢN
  // =========================================================================
  test("Giai đoạn 4: Người thừa kế xác minh thư chống lừa đảo và kiểm tra biên bản số", async ({
    page,
  }) => {
    // 4.1 Kiểm tra trang công khai /receive
    await page.goto("/receive");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem trang /receive
    await safeScreenshot(page, "step4-beneficiary-receive-public.png");

    // 4.2 Đăng nhập Người thừa kế
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#login-email").fill("beneficiary1@legacyvault.vn");
    await page.locator("#login-password").fill("LegacyVault@2026");
    await page.getByRole("button", { name: /đăng nhập/i }).click();
    await page.waitForURL("**/dashboard**", { timeout: 15000 });

    // 4.3 Xem Cổng nhận di sản
    await page.goto("/claim/beneficiary");
    await page.waitForLoadState("networkidle");
    const fullTextToggle = page
      .getByRole("button", { name: /Đọc toàn văn biên bản trước khi ký/i })
      .first();
    if (await fullTextToggle.isVisible()) {
      await fullTextToggle.click();
    }
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem Cổng nhận
    await safeScreenshot(page, "step4-beneficiary-handover-portal.png");

    // 4.4 Xem Biên bản di sản của Người nhận
    await page.goto("/beneficiary/documents");
    await page.waitForLoadState("networkidle");
    const benDocRow = page
      .getByRole("button", { name: /Biên bản đồng ý nhận|Văn bản từ chối/i })
      .first();
    if (await benDocRow.isVisible()) {
      await benDocRow.click();
      const fullTextBtn = page.getByRole("button", { name: /Xem toàn văn biên bản/i }).first();
      if (await fullTextBtn.isVisible()) {
        await fullTextBtn.click();
      }
    }
    await page.waitForTimeout(2500); // Dừng lại cho Duy xem văn bản Times New Roman
    await safeScreenshot(page, "step4-beneficiary-documents-view.png");
    await expect(page.locator("body")).toBeVisible();
  });

  // =========================================================================
  // GIAI ĐOẠN 5: QUẢN TRỊ VIÊN (ADMIN) KIỂM SOÁT HỆ THỐNG VÀ AUDIT LOGS
  // =========================================================================
  test("Giai đoạn 5: Quản trị viên giám sát người dùng, chính sách và nhật ký kiểm toán", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.locator("#login-email").fill("admin1@legacyvault.vn");
    await page.locator("#login-password").fill("LegacyVault@2026");
    await page.getByRole("button", { name: /đăng nhập/i }).click();

    await page.waitForURL("**/admin**", { timeout: 15000 });
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem Admin Dashboard
    await safeScreenshot(page, "step5-admin-dashboard.png");

    // 5.2 Quản lý tài khoản
    await page.goto("/dashboard/users");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem 10 tài khoản
    await safeScreenshot(page, "step5-admin-users.png");

    // 5.3 Cấu hình chính sách
    await page.goto("/admin");
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000); // Dừng lại cho Duy xem Policy Windows
    await safeScreenshot(page, "step5-admin-policy-settings.png");
  });
});
