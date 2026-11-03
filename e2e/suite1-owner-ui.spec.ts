import { test, expect } from "./fixtures/auth.fixture";

function mockVault(overrides = {}) {
  return {
    id: "b0000000-0000-0000-0000-000000000001",
    name: "Kho của tôi",
    description: null,
    executorNote: null,
    executorNoteUpdatedAt: null,
    status: "OPEN",
    closedAt: null,
    planStatus: "ACTIVE",
    planConfigVersion: 1,
    planActivatedAt: "2026-01-01T00:00:00Z",
    serviceTier: "XS",
    serviceStatus: "ACTIVE",
    serviceExpiresAt: null,
    storageQuotaBytes: 1073741824,
    storageUsedBytes: 0,
    storageRemainingBytes: 1073741824,
    beneficiarySlots: 5,
    includedBeneficiarySlots: 5,
    extraBeneficiarySlots: 0,
    usedBeneficiarySlots: 0,
    activeContainerCount: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    etag: "etag-123456",
    ...overrides,
  };
}

function mockCheckInStatus(overrides = {}) {
  return {
    status: "ACTIVE",
    planStatus: "ACTIVE",
    serverTime: "2026-11-01T12:00:00Z",
    lastCheckInAt: "2026-10-31T12:00:00Z",
    checkedInByExecutorToday: false,
    nextCheckInDueAt: "2026-11-30T12:00:00Z",
    graceEndsAt: "2026-12-07T12:00:00Z",
    settings: {
      cycleDays: 30,
      graceDays: 7,
      pendingCycleDays: null,
      pendingGraceDays: null,
      etag: "checkin-etag-123",
    },
    history: {
      items: [],
      total: 0,
      totalCount: 0,
      pageIndex: 1,
      pageSize: 10,
      totalPages: 0,
      hasPreviousPage: false,
      hasNextPage: false,
    },
    ...overrides,
  };
}

test.describe("Test Suite 1: Owner UI Changes", () => {
  test("1.1. Verify UI Đặt tên kho: Nút 'Xác nhận', không có textarea mô tả, cập nhật tiêu đề trang", async ({
    ownerPage: page,
  }) => {
    let vaultCreated = false;
    const newVaultName = "Két Di Sản Gia Đình 2026";

    // Bước 1: Mock trạng thái chưa có kho (404) để UI hiển thị form CreateVaultForm
    await page.route("**/api/v1/vaults/me", async (route) => {
      if (vaultCreated) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(mockVault({ name: newVaultName })),
        });
      } else {
        await route.fulfill({
          status: 404,
          contentType: "application/json",
          body: JSON.stringify({ code: "VAULT_NOT_FOUND", message: "Chưa có kho" }),
        });
      }
    });

    await page.goto("/dashboard");

    // Bước 2: Kiểm tra tiêu đề màn hình đổi thành "Đặt tên kho"
    const heading = page.getByRole("heading", { name: "Đặt tên kho", exact: true });
    await expect(heading).toBeVisible();

    // Bước 3: Kiểm tra KHÔNG tồn tại ô textarea mô tả (đã được ẩn theo commit 7721ff7)
    const textarea = page.locator("textarea");
    await expect(textarea).toHaveCount(0);

    // Bước 4: Kiểm tra nút bấm đổi thành "Xác nhận" (thay cho "Tạo kho của tôi")
    const confirmButton = page.getByRole("button", { name: "Xác nhận" });
    await expect(confirmButton).toBeVisible();
    await expect(confirmButton).toBeEnabled();

    // Bước 5: Nhập tên kho mới và mock API tạo kho thành công
    const vaultInput = page.getByPlaceholder("Để trống sẽ dùng tên mặc định là Kho của tôi");
    await vaultInput.fill(newVaultName);

    await page.route("**/api/v1/vaults", async (route) => {
      if (route.request().method() === "POST") {
        vaultCreated = true;
        await route.fulfill({
          status: 201,
          contentType: "application/json",
          body: JSON.stringify(mockVault({ name: newVaultName })),
        });
      }
    });

    // Bước 6: Bấm nút "Xác nhận"
    await confirmButton.click();

    // Chuyển sang trang "Kho của tôi" (/dashboard/assets) để kiểm tra tiêu đề kho
    await page.goto("/dashboard/assets");

    // Bước 7: Kiểm tra tiêu đề lớn trang Kho của tôi đổi thành tên kho vừa đặt
    const pageTitle = page.getByRole("heading", { level: 1, name: newVaultName });
    await expect(pageTitle).toBeVisible();

    // Kiểm tra nhãn nhỏ (eyebrow) hiển thị "Kho của tôi"
    await expect(page.locator("text=Kho của tôi").first()).toBeVisible();
  });

  test("1.2. Validation Form Người nhận: Input CCCD/SĐT sai format -> Báo lỗi & Chặn nút Save", async ({
    ownerPage: page,
  }) => {
    // Mock kho hiện tại với gói XS (để được phép tạo người nhận)
    await page.route("**/api/v1/vaults/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockVault({ serviceTier: "XS" })),
      });
    });

    // Mock danh sách gói bàn giao (containers)
    await page.route("**/api/v1/vaults/*/containers*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ items: [], total: 0 }),
      });
    });

    // Mock danh sách người nhận trống
    await page.route("**/api/v1/vaults/*/beneficiaries*", async (route) => {
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

    await page.goto("/dashboard/beneficiaries");

    // Mở form thêm người nhận
    const addBtn = page.getByRole("button", { name: /Thêm người nhận/i });
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // Nhập Họ tên và Email hợp lệ
    const fullNameInput = page.getByLabel(/Họ và tên/i);
    await expect(fullNameInput).toBeVisible();
    await fullNameInput.fill("Nguyễn Văn Thụ Hưởng");
    await page.getByLabel(/Email/i).fill("beneficiary@example.com");

    // Bước 1: Nhập CCCD sai quy tắc (999 không phải mã tỉnh hợp lệ)
    const citizenIdInput = page.getByLabel(/Số CCCD/i);
    await citizenIdInput.fill("999123456789");
    await citizenIdInput.blur();

    // Bước 2: Nhập SĐT sai đầu số Việt Nam (0123456789 không phải mạng di động hiện hành)
    const phoneInput = page.getByLabel(/Số điện thoại/i);
    await phoneInput.fill("0123456789");
    await phoneInput.blur();

    // Bước 3: Kiểm tra thông báo lỗi hiển thị rõ ràng
    const cccdError = page.getByText(
      "Số CCCD không đúng định dạng: 3 số đầu phải là mã tỉnh, thành phố và số thứ 4 từ 0 đến 3.",
    );
    await expect(cccdError).toBeVisible();

    const phoneError = page.getByText(
      "Số điện thoại không đúng định dạng Việt Nam (ví dụ 0912345678 hoặc +84912345678).",
    );
    await expect(phoneError).toBeVisible();

    // Bước 4: Kiểm tra việc bấm Lưu bị chặn, không có network request gửi đi
    let createRequestSent = false;
    await page.route("**/api/v1/vaults/*/beneficiaries", async (route) => {
      if (route.request().method() === "POST") {
        createRequestSent = true;
      }
      await route.continue();
    });

    const saveBtn = page.getByRole("button", { name: /Lưu người nhận|Thêm người nhận/i });
    await saveBtn.click();

    expect(createRequestSent).toBe(false);
  });

  test("1.3. Trạng thái Điểm danh: Nút kết nối Smartwatch có attribute disabled và text 'Coming soon'", async ({
    ownerPage: page,
  }) => {
    // Mock kho đang hoạt động
    await page.route("**/api/v1/vaults/me", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockVault()),
      });
    });

    // Mock check-ins/me
    await page.route("**/api/v1/check-ins/me*", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockCheckInStatus()),
      });
    });

    // Truy cập trực tiếp trang Điểm danh /dms
    await page.goto("/dms");

    // Bước 1: Tìm nút kết nối đồng hồ thông minh
    const smartwatchButton = page.getByRole("button", { name: "Coming soon" });

    // Bước 2: Khẳng định nút hiển thị trên màn hình
    await expect(smartwatchButton).toBeVisible();

    // Bước 3: Khẳng định nút bị disable và có thuộc tính HTML disabled
    await expect(smartwatchButton).toBeDisabled();
    await expect(smartwatchButton).toHaveAttribute("disabled", "");
  });
});
