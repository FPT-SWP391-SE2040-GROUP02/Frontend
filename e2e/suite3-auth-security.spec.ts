import { test, expect } from "./fixtures/auth.fixture";

test.describe("Test Suite 3: Auth & Security (Admin & Login)", () => {
  test("3.1. Login Page: Đảm bảo không còn button Passkey", async ({ cleanSession: page }) => {
    await page.goto("/login");

    // Bước 1: Kiểm tra các thành phần form đăng nhập cơ bản có mặt
    await expect(page.getByLabel("Email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Đăng nhập" })).toBeVisible();

    // Bước 2: Kiểm tra nút Passkey đã bị gỡ bỏ hoàn toàn (commit fbb2429)
    const passkeyButton = page.locator('button:has-text("Passkey")');
    await expect(passkeyButton).not.toBeVisible();

    // Kiểm tra thêm theo aria/text tiếng Việt liên quan
    await expect(page.getByText(/Passkey \/ FaceID/i)).not.toBeVisible();
  });

  test("3.2. Brute-force Login: Gửi 5 lần sai pass -> Kiểm tra UI hiển thị thông báo khóa tài khoản", async ({
    cleanSession: page,
  }) => {
    let attemptCount = 0;

    // Mock CSRF token trước
    await page.route("**/api/v1/auth/csrf", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ requestToken: "test-csrf" }),
      });
    });

    // Mock endpoint đăng nhập: 4 lần đầu trả 401 INVALID_CREDENTIALS, lần thứ 5 trả 423 SIGNING_LOCKED / 429
    await page.route("**/api/v1/auth/login", async (route) => {
      attemptCount++;
      if (attemptCount < 5) {
        await route.fulfill({
          status: 401,
          contentType: "application/json",
          body: JSON.stringify({
            code: "INVALID_CREDENTIALS",
            message: "Email hoặc mật khẩu chưa đúng.",
          }),
        });
      } else {
        await route.fulfill({
          status: 423,
          contentType: "application/json",
          body: JSON.stringify({
            code: "ACCOUNT_LOCKED",
            message: "Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.",
          }),
        });
      }
    });

    await page.goto("/login");

    const emailInput = page.getByLabel("Email");
    const passwordInput = page.locator("#login-password");
    const submitBtn = page.getByRole("button", { name: "Đăng nhập" });

    await emailInput.fill("target_user@legacyvault.vn");

    // Thực hiện 5 lần gửi mật khẩu sai liên tiếp
    for (let i = 1; i <= 5; i++) {
      await passwordInput.fill(`WrongPassword_${i}`);
      await submitBtn.click();

      if (i < 5) {
        // 4 lần đầu kiểm tra thông báo sai mật khẩu
        const errorAlert = page.getByRole("alert");
        await expect(errorAlert).toBeVisible();
        await expect(errorAlert).toContainText("Email hoặc mật khẩu chưa đúng.");
      }
    }

    // Bước khẳng định lần thứ 5: Khóa tài khoản
    const lockAlert = page.getByRole("alert");
    await expect(lockAlert).toBeVisible();
    await expect(lockAlert).toContainText("Bạn đã thử quá nhiều lần. Vui lòng chờ rồi thử lại.");
  });
});
