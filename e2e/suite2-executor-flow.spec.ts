import { test, expect } from "./fixtures/auth.fixture";

const VAULT_ID = "c0000000-0000-0000-0000-000000000001";
const CASE_ID = "d0000000-0000-0000-0000-000000000001";

function mockDeathCase(overrides = {}) {
  return {
    id: CASE_ID,
    vaultId: VAULT_ID,
    status: "DRAFT",
    currentVersion: {
      versionNo: 1,
      isDraft: true,
      ownerFullName: "Nguyễn Văn Nam",
      ownerCitizenIdLast4: "0001",
      dateOfDeath: null,
      certificateNumber: null,
      issuedOn: null,
      issuedBy: null,
      files: [],
      submittedAt: null,
    },
    reviewVersionNo: null,
    missingRequirements: [],
    supplementRequest: null,
    ownerNotice: null,
    objectionEndsAt: null,
    createdAt: "2026-11-01T00:00:00Z",
    updatedAt: null,
    etag: "case-etag-123",
    ...overrides,
  };
}

test.describe("Test Suite 2: Executor Flow", () => {
  test("2.1. Kiểm tra hiển thị khung 'Hướng dẫn từ...' tại URL /executor", async ({
    executorPage: page,
  }) => {
    // Mock danh sách kho được giao cho Executor, có lời nhắn hướng dẫn của Chủ kho
    await page.route("**/api/v1/executor/vaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            vaultId: VAULT_ID,
            ownerFullName: "Nguyễn Văn Nam",
            planStatus: "ACTIVE",
            checkInOverdue: false,
            openDeathCaseId: null,
            executorNote:
              "Giấy tờ nhà đất và chìa khóa két sắt gửi tại ngân hàng Vietcombank chi nhánh Ba Đình.",
            executorNoteUpdatedAt: "2026-11-01T08:30:00Z",
          },
        ]),
      });
    });

    await page.goto("/executor");

    // Bước 1: Kiểm tra tiêu đề khung hiển thị đúng cú pháp "Hướng dẫn từ {Chủ kho}"
    const notePanelTitle = page.getByText("Hướng dẫn từ Nguyễn Văn Nam");
    await expect(notePanelTitle).toBeVisible();

    // Bước 2: Kiểm tra nội dung hướng dẫn hiển thị chính xác
    const noteContent = page.getByText(
      "Giấy tờ nhà đất và chìa khóa két sắt gửi tại ngân hàng Vietcombank chi nhánh Ba Đình.",
    );
    await expect(noteContent).toBeVisible();

    // Bước 3: Kiểm tra dòng thời gian cập nhật hiển thị theo chuẩn ngày giờ Việt Nam
    await expect(page.getByText(/Cập nhật.*01\/11\/2026/)).toBeVisible();
  });

  test("2.2. Kiểm tra nút 'Hủy hồ sơ nháp': Click mở Dialog xác nhận, confirm -> phục hồi trạng thái", async ({
    executorPage: page,
  }) => {
    let draftCancelled = false;

    // Mock kho có một hồ sơ nháp đang mở
    await page.route("**/api/v1/executor/vaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            vaultId: VAULT_ID,
            ownerFullName: "Nguyễn Văn Nam",
            planStatus: draftCancelled ? "ACTIVE" : "DEATH_CASE_OPEN",
            checkInOverdue: false,
            openDeathCaseId: draftCancelled ? null : CASE_ID,
          },
        ]),
      });
    });

    // Mock chi tiết hồ sơ ở trạng thái DRAFT
    await page.route(`**/api/v1/executor/death-cases/${CASE_ID}*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockDeathCase()),
      });
    });

    await page.goto(`/executor/report?vault=${VAULT_ID}`);

    // Bước 1: Kiểm tra khối Panel "Hủy hồ sơ nháp" xuất hiện
    const cancelPanel = page.getByRole("heading", { name: "Hủy hồ sơ nháp" });
    await expect(cancelPanel).toBeVisible();

    // Bước 2: Bấm nút "Hủy hồ sơ nháp" ngoài panel
    const openCancelDialogBtn = page
      .locator("section")
      .filter({ hasText: "Hủy hồ sơ nháp" })
      .getByRole("button", { name: "Hủy hồ sơ nháp" });
    await openCancelDialogBtn.click();

    // Bước 3: Kiểm tra Dialog xác nhận bật lên với nội dung cảnh báo
    const confirmDialog = page.getByRole("dialog");
    await expect(confirmDialog).toBeVisible();
    await expect(confirmDialog.getByText("Hủy hồ sơ nháp?")).toBeVisible();
    await expect(
      confirmDialog.getByText(
        "Thông tin đã khai và các trang giấy chứng tử đã tải sẽ bị xóa, không khôi phục được.",
      ),
    ).toBeVisible();

    // Bước 4: Mock API DELETE hủy hồ sơ trả về 204
    await page.route(`**/api/v1/executor/death-cases/${CASE_ID}/draft`, async (route) => {
      if (route.request().method() === "DELETE") {
        draftCancelled = true;
        await route.fulfill({ status: 204 });
      }
    });

    // Bước 5: Bấm nút xác nhận "Hủy hồ sơ nháp" bên trong Dialog
    const dialogConfirmBtn = confirmDialog.getByRole("button", { name: "Hủy hồ sơ nháp" });
    await dialogConfirmBtn.click();

    // Bước 6: Kiểm tra quay về tổng quan
    await expect(page).toHaveURL(new RegExp(`/executor\\?vault=${VAULT_ID}`));
  });

  test("2.3. Logic Banner: Đảm bảo không render text 'Kho đang an toàn' khi đang có hồ sơ mở", async ({
    executorPage: page,
  }) => {
    // Trạng thái 1: Có hồ sơ báo tin đang mở
    await page.route("**/api/v1/executor/vaults", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify([
          {
            vaultId: VAULT_ID,
            ownerFullName: "Nguyễn Văn Nam",
            planStatus: "DEATH_CASE_OPEN",
            checkInOverdue: false,
            openDeathCaseId: CASE_ID,
          },
        ]),
      });
    });

    await page.goto("/executor");

    // Khẳng định Banner trạng thái đang xử lý hiển thị
    await expect(
      page.getByText("Hồ sơ báo tin về Nguyễn Văn Nam đang được xử lý"),
    ).toBeVisible();

    // KHẲNG ĐỊNH QUAN TRỌNG: Text "Kho của Nguyễn Văn Nam đang an toàn" TUYỆT ĐỐI KHÔNG xuất hiện
    await expect(
      page.getByText("Kho của Nguyễn Văn Nam đang an toàn"),
    ).not.toBeVisible();
    await expect(page.getByRole("link", { name: "Xem hồ sơ báo tin" })).toBeVisible();
  });
});
