import { test, expect } from "./fixtures/auth.fixture";

const CASE_ID = "e0000000-0000-0000-0000-000000000001";
const VAULT_ID = "c0000000-0000-0000-0000-000000000001";

function mockVerifierCaseDetail(overrides = {}) {
  return {
    id: CASE_ID,
    vaultId: VAULT_ID,
    status: "UNDER_REVIEW",
    etag: "verifier-etag-123",
    createdAt: "2026-11-01T07:00:00Z",
    firstSubmittedAt: "2026-11-01T07:30:00Z",
    closedAt: null,
    reviewVersion: {
      versionNo: 1,
      ownerFullName: "Nguyễn Văn Nam",
      ownerCitizenId: "001099000001",
      ownerCitizenIdLast4: "0001",
      dateOfDeath: "2026-10-20",
      certificateNumber: "123/2026/TL",
      issuedOn: "2026-10-21",
      issuedBy: "UBND Phường Điện Biên",
      submittedAt: "2026-11-01T07:30:00Z",
      files: [],
    },
    versions: [],
    flags: [],
    decisions: [],
    ownerNotice: null,
    objectionEndsAt: null,
    assignment: {
      assignedAt: "2026-11-01T08:00:00Z",
      dueAt: "2026-11-04T08:00:00Z",
    },
    canApprove: true,
    approveBlockers: [],
    previousCase: null,
    handover: null,
    ownerIdentity: {
      verified: true,
      citizenId: "001099000001",
      fullName: "NGUYỄN VĂN NAM",
      dateOfBirth: "1985-05-20",
      verifiedAt: "2026-05-10T10:00:00Z",
      citizenIdMatches: true,
      fullNameMatches: true,
      hasDocumentImage: false,
      documentImageCapturedAt: null,
    },
    executor: {
      id: "a0000000-0000-0000-0000-000000000002",
      fullName: "Trần Thị Lan",
      email: "executor@legacyvault.vn",
      phone: "0901234568",
    },
    ...overrides,
  };
}

test.describe("Test Suite 4: Verifier & Loading State", () => {
  test("4.1. Loading State: Kiểm tra Spinner/Skeleton xuất hiện khi fetch data, không bị màn hình trắng", async ({
    verifierPage: page,
  }) => {
    let unblockRoute!: () => void;
    const blockPromise = new Promise<void>((resolve) => {
      unblockRoute = resolve;
    });

    // Giữ kết nối API pending để kiểm tra chắc chắn giao diện chờ (spinner/skeleton)
    await page.route("**/api/v1/verifier/death-cases*", async (route) => {
      await blockPromise;
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

    // Mở trang với waitUntil: "domcontentloaded" để không bị block bởi pending request
    await page.goto("/notary/workspace", { waitUntil: "domcontentloaded" });

    // Bước 1: Kiểm tra phần tử loading có spinner (.animate-spin) hoặc role="status"
    const spinner = page.locator(".animate-spin, [role='status']").first();
    await expect(spinner).toBeVisible();

    // Bước 2: Khẳng định không bị màn hình trắng tinh (#root không được rỗng)
    const rootHtml = await page.locator("#root").innerHTML();
    expect(rootHtml.trim().length).toBeGreaterThan(50);

    // Bước 3: Cho phép request hoàn tất sạch sẽ
    unblockRoute();
  });

  test("4.2. Trang so khớp danh tính: Kiểm tra không còn element hiển thị ngày sinh", async ({
    verifierPage: page,
  }) => {
    // Mock dữ liệu hồ sơ thẩm định danh tính Chủ kho
    await page.route(`**/api/v1/verifier/death-cases/${CASE_ID}*`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(mockVerifierCaseDetail()),
      });
    });

    await page.goto(`/notary/queue?caseId=${CASE_ID}`);

    // Bước 1: Định vị bảng đối chiếu danh tính Chủ kho
    const identityPanel = page.locator("section, region, article, div").filter({
      hasText: /Đối chiếu danh tính chủ kho/i,
    });
    await expect(identityPanel.first()).toBeVisible();

    const comparisonTable = identityPanel.getByRole("table");
    await expect(comparisonTable).toBeVisible();

    // Bước 2: Xác nhận các dòng đối chiếu bắt buộc vẫn còn (Họ tên, Số CCCD)
    await expect(comparisonTable.getByText("Họ tên")).toBeVisible();
    await expect(comparisonTable.getByText("Số CCCD")).toBeVisible();

    // Bước 3: KHẲNG ĐỊNH QUAN TRỌNG - Hoàn toàn không còn dòng hay th/td "Ngày sinh"
    await expect(comparisonTable).not.toContainText("Ngày sinh");
    await expect(comparisonTable.locator('th:has-text("Ngày sinh")')).toHaveCount(0);
    await expect(comparisonTable.locator('td:has-text("Ngày sinh")')).toHaveCount(0);
  });
});
