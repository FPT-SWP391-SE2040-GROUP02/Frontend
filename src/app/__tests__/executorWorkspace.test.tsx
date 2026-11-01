import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AxiosError, AxiosHeaders } from "axios";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import authReducer, { setCredentials } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, CREATED_AT } from "@/shared/api/__tests__/backend.fixtures";
import { deriveLog, deriveSteps } from "@/features/death-case/model/progressSteps";
import type { DeathCase } from "@/features/death-case/model/deathCase.schema";
import { ExecutorOverviewPage } from "@/pages/executor/ExecutorOverviewPage";
import { ExecutorPermissionsPage } from "@/pages/executor/ExecutorPermissionsPage";
import { ExecutorReportPage } from "@/pages/executor/ExecutorReportPage";
import { ExecutorProgressPage } from "@/pages/executor/ExecutorProgressPage";

const CASE_ID = "33333333-3333-4333-8333-333333333333";
const OTHER_VAULT_ID = "44444444-4444-4444-8444-444444444444";

const vault = (overrides: Record<string, unknown> = {}) => ({
  vaultId: VAULT_ID,
  ownerFullName: "Anh Nam",
  planStatus: "ACTIVE",
  checkInOverdue: false,
  openDeathCaseId: null,
  lastRejectedDeathCaseId: null,
  ...overrides,
});

function deathCase(status: string, extra: Record<string, unknown> = {}) {
  return {
    id: CASE_ID,
    vaultId: VAULT_ID,
    status,
    currentVersion: {
      versionNo: 1,
      isDraft: status === "DRAFT",
      ownerFullName: "Anh Nam",
      ownerCitizenIdLast4: "0001",
      dateOfDeath: null,
      certificateNumber: null,
      issuedOn: null,
      issuedBy: null,
      files: [],
      submittedAt: status === "DRAFT" ? null : CREATED_AT,
    },
    reviewVersionNo: null,
    missingRequirements: ["DATE_OF_DEATH", "FILES"],
    ownerNotice: null,
    objectionEndsAt: null,
    createdAt: CREATED_AT,
    updatedAt: null,
    etag: "case-v1",
    ...extra,
  };
}

let client: QueryClient;

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  accessTokenMemory.set("executor-workspace-fixture");
  window.sessionStorage.clear();
});

afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function setup(path: string) {
  const store = configureStore({ reducer: { auth: authReducer } });
  store.dispatch(
    setCredentials({
      user: {
        id: "11111111-1111-4111-8111-111111111111",
        fullName: "Chú Hải",
        email: "hai@example.test",
        role: "USER",
        status: "ACTIVE",
        createdAt: "2026-10-15T00:00:00Z",
        emailVerified: true,
        hasPassword: true,
      },
    }),
  );
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/executor" element={<ExecutorOverviewPage />} />
            <Route path="/executor/report" element={<ExecutorReportPage />} />
            <Route path="/executor/progress" element={<ExecutorProgressPage />} />
            <Route path="/executor/permissions" element={<ExecutorPermissionsPage />} />
            <Route path="/dashboard" element={<p>Không gian Chủ kho (fixture)</p>} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
}

describe("Executor workspace shell", () => {
  it("shows the five menu items, the role switch to the Owner space and the account", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor");
    const nav = screen.getByRole("navigation", { name: "Điều hướng Người thực hiện" });
    expect(Array.from(nav.querySelectorAll("a")).map((a) => a.textContent)).toEqual([
      "Tổng quan",
      "Báo tin",
      "Tiến trình",
      "Quyền hạn",
      "Cài đặt",
    ]);
    expect(screen.getByRole("link", { name: "Tổng quan" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Sang vai Chủ kho" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
    expect(screen.getByText("Người thực hiện")).toBeInTheDocument();
    expect(
      await screen.findByRole("heading", { level: 1, name: "Chào Chú Hải" }),
    ).toBeInTheDocument();
  });
});

describe("Executor overview", () => {
  it("explains the vault is safe and links to Báo tin when the Owner is not overdue", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor");
    expect(await screen.findByText("Kho của Anh Nam đang an toàn")).toBeInTheDocument();
    const reportLinks = screen.getAllByRole("link", { name: "Báo tin" });
    expect(reportLinks).toHaveLength(2); // mục menu và nút trong banner
    reportLinks.forEach((link) => expect(link).toHaveAttribute("href", "/executor/report"));
    expect(screen.getByText("Bạn không đọc được")).toBeInTheDocument();
    expect(screen.getByText("Đọc nội dung kho")).toBeInTheDocument();
    expect(screen.getAllByText("Executor").length).toBeGreaterThan(0);
  });

  it("warns when the Owner is overdue and points to the open case", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({ checkInOverdue: true, openDeathCaseId: CASE_ID }),
    ]);
    setup("/executor");
    expect(await screen.findByText("Anh Nam đã quá hạn điểm danh")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem hồ sơ báo tin" })).toBeInTheDocument();
    // Đã có hồ sơ chứng tử thì không điểm danh thay nữa.
    expect(
      screen.queryByRole("button", { name: "Điểm danh thay chủ kho" }),
    ).not.toBeInTheDocument();
  });

  it("does not call the vault safe once a death case is open", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({ planStatus: "DEATH_CASE_OPEN", openDeathCaseId: CASE_ID }),
    ]);
    setup("/executor");
    expect(await screen.findByText("Hồ sơ báo tin về Anh Nam đang được xử lý")).toBeInTheDocument();
    expect(screen.queryByText("Kho của Anh Nam đang an toàn")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Xem hồ sơ báo tin" })).toBeInTheDocument();
  });

  it("hides the proxy check-in while the Owner is not overdue", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor");
    expect(await screen.findByText("Kho của Anh Nam đang an toàn")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Điểm danh thay chủ kho" }),
    ).not.toBeInTheDocument();
  });

  it("checks in for the overdue Owner and hides the button once the vault is safe again", async () => {
    const get = vi
      .spyOn(apiClient, "get")
      .mockResolvedValueOnce([vault({ planStatus: "AWAITING_CHECK", checkInOverdue: true })])
      .mockResolvedValue([vault()]);
    const post = vi.spyOn(apiClient, "post").mockResolvedValue({
      vaultId: VAULT_ID,
      planStatus: "ACTIVE",
      checkedInAt: "2026-10-31T01:00:00Z",
      nextCheckInDueAt: "2026-11-30T01:00:00Z",
      graceEndsAt: "2026-12-07T01:00:00Z",
    });
    setup("/executor");
    const button = await screen.findByRole("button", { name: "Điểm danh thay chủ kho" });
    expect(
      screen.getByText("Điểm danh hộ owner cho đến khi có giấy chứng tử."),
    ).toBeInTheDocument();

    await userEvent.click(button);

    expect(post).toHaveBeenCalledWith(`/executor/vaults/${VAULT_ID}/check-in`);
    expect(await screen.findByText("Kho của Anh Nam đang an toàn")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Điểm danh thay chủ kho" }),
    ).not.toBeInTheDocument();
    expect(get).toHaveBeenCalledTimes(2);
  });

  it("explains why the proxy check-in was refused", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault({ planStatus: "AWAITING_CHECK", checkInOverdue: true }),
    ]);
    const headers = new AxiosHeaders();
    vi.spyOn(apiClient, "post").mockRejectedValue(
      new AxiosError("fail", "ERR", { headers }, undefined, {
        status: 409,
        statusText: "",
        headers: {},
        config: { headers },
        data: { code: "CHECKIN_NOT_ALLOWED", reason: "DEATH_CASE_OPEN" },
      }),
    );
    setup("/executor");

    await userEvent.click(await screen.findByRole("button", { name: "Điểm danh thay chủ kho" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Kho đã có hồ sơ chứng tử đang mở nên không điểm danh thay được nữa.",
    );
  });

  it("says there is no duty when the account is not an Executor of any vault", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([]);
    setup("/executor");
    expect(
      await screen.findByText("Tài khoản chưa có nhiệm vụ Executor đang hiệu lực."),
    ).toBeInTheDocument();
  });

  it("lets an Executor of several vaults choose one and remembers the choice", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([
      vault(),
      vault({ vaultId: OTHER_VAULT_ID, ownerFullName: "Bà Hạnh" }),
    ]);
    setup("/executor");
    expect(await screen.findByRole("heading", { level: 1, name: "Chọn kho" })).toBeInTheDocument();
    expect(screen.getByText("Kho của Anh Nam")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Vào kho của Bà Hạnh" }));
    expect(await screen.findByText("Kho của Bà Hạnh đang an toàn")).toBeInTheDocument();
    expect(window.sessionStorage.getItem("lv-executor-vault")).toBe(OTHER_VAULT_ID);
    // Đổi kho quay lại bước chọn.
    fireEvent.click(screen.getByRole("button", { name: "Đổi kho" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Chọn kho" })).toBeInTheDocument();
  });

  it("reports a failed vault list with a retry instead of an empty page", async () => {
    vi.spyOn(apiClient, "get").mockRejectedValue(new Error("down"));
    setup("/executor");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được các kho");
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeInTheDocument();
  });
});

describe("Executor permissions", () => {
  it("lists what the Executor can and cannot do and the accepted invitations", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor/permissions");
    expect(await screen.findByText("Anh Nam mời bạn làm Executor")).toBeInTheDocument();
    expect(screen.getByText("Báo tin khi Chủ kho qua đời")).toBeInTheDocument();
    expect(screen.getByText("Đọc nội dung kho")).toBeInTheDocument();
    expect(screen.getByText("Đã chấp nhận")).toBeInTheDocument();
    expect(screen.getByText(/hãy báo cho Anh Nam/)).toBeInTheDocument();
  });
});

describe("Executor report", () => {
  it("opens a case only after the Executor presses the button", async () => {
    const post = vi.spyOn(apiClient, "post").mockResolvedValue(deathCase("DRAFT"));
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault()]);
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    expect(await screen.findByText("Hãy chắc chắn trước khi báo tin")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Mở hồ sơ chứng tử" }));
    expect(post).toHaveBeenCalledWith(`/executor/vaults/${VAULT_ID}/death-case`);
  });

  it("shows the draft editor with missing items and keeps submit disabled until confirmed", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`) return Promise.resolve(deathCase("DRAFT"));
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Soạn hồ sơ báo tin" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Bản nháp")).toBeInTheDocument();
    expect(screen.getByText("Còn thiếu: Ngày mất")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Lưu nháp" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Gửi hồ sơ" })).toBeDisabled();
  });

  it("rejects a file of an unsupported type before sending anything", async () => {
    const post = vi.spyOn(apiClient, "post");
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`) return Promise.resolve(deathCase("DRAFT"));
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    const input = await screen.findByLabelText("Chọn trang giấy");
    fireEvent.change(input, {
      target: { files: [new File(["x"], "notes.txt", { type: "text/plain" })] },
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("Chọn tệp đúng định dạng");
    expect(post).not.toHaveBeenCalled();
  });

  it("uploads a valid file and shows it in the document list", async () => {
    const withFile = deathCase("DRAFT", {
      missingRequirements: ["DATE_OF_DEATH"],
      currentVersion: {
        ...deathCase("DRAFT").currentVersion,
        files: [
          {
            id: "55555555-5555-4555-8555-555555555555",
            position: 1,
            fileName: "giay-bao-tu.pdf",
            contentType: "application/pdf",
            sizeBytes: 1200000,
            uploadedAt: CREATED_AT,
          },
        ],
      },
    });
    // Sau khi tải lên, lần đọc lại hồ sơ của Backend đã có tệp.
    let uploaded = false;
    const post = vi.spyOn(apiClient, "post").mockImplementation(() => {
      uploaded = true;
      return Promise.resolve(withFile);
    });
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`)
        return Promise.resolve(uploaded ? withFile : deathCase("DRAFT"));
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    const input = await screen.findByLabelText("Chọn trang giấy");
    fireEvent.change(input, {
      target: { files: [new File(["%PDF"], "giay-bao-tu.pdf", { type: "application/pdf" })] },
    });
    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(post.mock.calls[0][0]).toBe(`/executor/death-cases/${CASE_ID}/files`);
    expect(await screen.findByText(/1\. giay-bao-tu\.pdf/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Xóa tệp giay-bao-tu.pdf" })).toBeInTheDocument();
  });

  it("titles a supplement request and lists the versions already submitted", async () => {
    vi.spyOn(apiClient, "get").mockImplementation((url) => {
      if (url === "/executor/vaults") return Promise.resolve([vault({ openDeathCaseId: CASE_ID })]);
      if (url === `/executor/death-cases/${CASE_ID}`)
        return Promise.resolve(
          deathCase("SUPPLEMENT_REQUIRED", {
            currentVersion: {
              ...deathCase("UNDER_REVIEW").currentVersion,
              versionNo: 2,
              isDraft: true,
            },
            missingRequirements: ["FILES"],
            supplementRequest: {
              versionNo: 1,
              reason: "Ảnh bị mờ",
              requestedParts: ["FILES"],
              requestedAt: CREATED_AT,
              dueAt: null,
            },
          }),
        );
      return Promise.reject(new Error(`unexpected ${String(url)}`));
    });
    setup("/executor/report");
    expect(
      await screen.findByRole("heading", { level: 1, name: "Nộp bản bổ sung" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Cần bổ sung")).toBeInTheDocument();
    expect(screen.getByText("Bản 1 · gửi lần đầu")).toBeInTheDocument();
    expect(screen.getByText("Bản 2 · bổ sung")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Nộp bản bổ sung" })).toBeInTheDocument();
  });
});

describe("Executor progress", () => {
  it("guides the Executor to Báo tin when no case exists yet", async () => {
    vi.spyOn(apiClient, "get").mockResolvedValue([vault()]);
    setup("/executor/progress");
    expect(await screen.findByText("Bước hiện tại")).toBeInTheDocument();
    expect(
      screen.getByText("Chưa có hồ sơ báo tin. Tiến trình bắt đầu sau khi bạn gửi hồ sơ."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Đi tới Báo tin" })).toHaveAttribute(
      "href",
      "/executor/report",
    );
  });
});

describe("progress steps", () => {
  const record = (status: string, extra: Record<string, unknown> = {}) =>
    deathCase(status, extra) as unknown as DeathCase;
  const now = new Date("2026-10-20T08:00:00Z");
  const states = (steps: ReturnType<typeof deriveSteps>) => steps.map((step) => step.state);

  it("starts at the first step while the case is a draft", () => {
    expect(states(deriveSteps(record("DRAFT"), null, now))).toEqual([
      "current",
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("sits on the 72-hour objection step until the window closes, then on review", () => {
    const open = record("UNDER_REVIEW", { objectionEndsAt: "2026-10-22T08:00:00Z" });
    expect(states(deriveSteps(open, null, now))[1]).toBe("current");
    const closed = record("UNDER_REVIEW", { objectionEndsAt: "2026-10-19T08:00:00Z" });
    expect(states(deriveSteps(closed, null, now))).toEqual([
      "done",
      "done",
      "current",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("marks the review step as an error when the case is rejected", () => {
    expect(states(deriveSteps(record("REJECTED"), null, now))).toEqual([
      "done",
      "done",
      "error",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("derives the log newest first from the timestamps Backend returns", () => {
    const log = deriveLog(
      record("UNDER_REVIEW", {
        createdAt: "2026-10-18T08:00:00Z",
        ownerNotice: { status: "DELIVERED", deliveredAt: "2026-10-20T07:00:00Z" },
        currentVersion: {
          ...deathCase("UNDER_REVIEW").currentVersion,
          submittedAt: "2026-10-19T08:00:00Z",
        },
      }),
    );
    expect(log.map((entry) => entry.text)).toEqual([
      "Hệ thống đã nhắn cho Chủ kho",
      "Bạn gửi hồ sơ (bản 1)",
      "Bạn mở hồ sơ báo tin",
    ]);
  });
});
