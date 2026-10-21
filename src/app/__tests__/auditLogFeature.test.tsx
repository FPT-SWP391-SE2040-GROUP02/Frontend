import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosHeaders } from "axios";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import uiReducer from "@/shared/model/uiSlice";
import { authSlice } from "@/entities/user/model/authSlice";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { VAULT_ID, pageFixture, vaultFixture } from "@/shared/api/__tests__/backend.fixtures";
import { OwnerAuditLog } from "@/widgets/OwnerWorkspace/OwnerAuditLog";

const authReducer = authSlice.reducer;

const originalAdapter = apiClient.defaults.adapter;
let client: QueryClient;
let store: ReturnType<typeof configureStore>;
const locationRef: { current: string } = { current: "" };

function LocationSpy() {
  const location = useLocation();
  useEffect(() => {
    locationRef.current = location.search;
  }, [location.search]);
  return null;
}

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  store = configureStore({ reducer: { ui: uiReducer, auth: authReducer } });
  // Mặc định đăng nhập: widget chỉ cần authenticated = true để gọi useOwnerVault.
  const user = {
    id: "user-1",
    email: "owner@example.com",
    fullName: "Owner",
    role: "USER" as const,
    status: "ACTIVE" as const,
    createdAt: "2026-10-15T00:00:00Z",
  };
  store.dispatch(authSlice.actions.setUser(user));
  accessTokenMemory.set("audit-test-token");
  locationRef.current = "";
});

afterEach(() => {
  cleanup();
  client.clear();
  accessTokenMemory.clear();
  apiClient.defaults.adapter = originalAdapter;
  vi.restoreAllMocks();
});

function setup(initialPath: string) {
  return render(
    <ReduxProvider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={[initialPath]}>
          <LocationSpy />
          <OwnerAuditLog />
        </MemoryRouter>
      </QueryClientProvider>
    </ReduxProvider>,
  );
}

const entry = {
  id: "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a10",
  at: "2026-10-15T08:30:00+00:00",
  actorRole: "OWNER" as const,
  actorUserId: "0199e7a4-0000-7c3e-9a51-3f0f5d2b8a10",
  action: "CONTAINER_CREATED" as const,
  targetType: "CONTAINER" as const,
  targetId: "0199e7a4-1111-7c3e-9a51-3f0f5d2b8a10",
  targetVersion: 1,
  outcome: "SUCCEEDED" as const,
  reason: null,
};

function installAdapter({
  vault = vaultFixture,
  page = pageFixture([entry]),
}: {
  vault?: typeof vaultFixture;
  page?: ReturnType<typeof pageFixture>;
} = {}) {
  const calls: { url?: string; params?: Record<string, unknown> }[] = [];
  apiClient.defaults.adapter = async (config) => {
    calls.push({ url: config.url, params: config.params });
    let data: unknown = page;
    if (config.url === "/vaults/me") data = vault;
    return { data, config, status: 200, statusText: "OK", headers: new AxiosHeaders() };
  };
  return calls;
}

describe("OwnerAuditLog transport", () => {
  it("renders and filters the new death-case audit events without rejecting the page", async () => {
    const calls = installAdapter({
      page: pageFixture([
        {
          ...entry,
          actorRole: "VERIFIER",
          action: "DEATH_CASE_APPROVED",
          targetType: "DEATH_CASE",
        },
      ]),
    });
    setup("/dashboard/audit-log?action=DEATH_CASE_APPROVED");
    expect(await screen.findByRole("cell", { name: "Duyệt hồ sơ chứng tử" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Loại thao tác" })).toHaveValue(
      "DEATH_CASE_APPROVED",
    );
    expect(calls.find((call) => call.url?.endsWith("/audit-logs"))?.params?.action).toBe(
      "DEATH_CASE_APPROVED",
    );
  });
  it("hiện nhãn tiếng Việt và mã rút gọn, không phô bày mã kỹ thuật hay UUID đầy đủ", async () => {
    installAdapter({
      page: pageFixture([
        {
          ...entry,
          action: "CONTAINER_BENEFICIARY_ADDED",
          reason: "Người nhận 01a15ccf-7c06-797e-b417-086d7d963788",
        },
      ]),
    });
    setup("/dashboard/audit-log");
    const row = (await screen.findByRole("cell", { name: "Gán người nhận cho nhóm" })).closest(
      "tr",
    ) as HTMLElement;
    expect(row).toHaveTextContent("Chủ kho");
    expect(row).toHaveTextContent("Nhóm");
    expect(row).toHaveTextContent("Thành công");
    expect(row).toHaveTextContent("Người nhận #963788");
    expect(row).not.toHaveTextContent("CONTAINER_BENEFICIARY_ADDED");
    expect(row).not.toHaveTextContent("SUCCEEDED");
    expect(row).not.toHaveTextContent("086d7d963788");
  });

  it("tra tên thật của người nhận từ danh sách hồ sơ, không có thì giữ mã rút gọn", async () => {
    const personId = "01a15ccf-7c06-797e-b417-086d7d963788";
    const person = {
      id: personId,
      citizenIdLast4: "0696",
      fullName: "Trịnh Lê Thiên Quan",
      dateOfBirth: "1990-05-20",
      email: "quan@example.test",
      phone: null,
      isMinor: false,
      minorAcknowledgedAt: null,
      containerIds: [],
      createdAt: "2026-10-14T00:00:00Z",
      updatedAt: null,
      etag: '"0"',
    };
    const auditPage = pageFixture([
      {
        ...entry,
        action: "CONTAINER_BENEFICIARY_ADDED" as const,
        reason: `Người nhận ${personId}`,
      },
      {
        ...entry,
        id: "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a11",
        action: "CONTAINER_BENEFICIARY_REMOVED" as const,
        reason: "Người nhận 01a15ccf-aaaa-797e-b417-000000abcdef",
      },
      {
        ...entry,
        id: "0199e7a4-5c1b-7c3e-9a51-3f0f5d2b8a12",
        action: "VAULT_UPDATED" as const,
        targetType: "VAULT" as const,
        targetId: VAULT_ID,
      },
    ]);
    apiClient.defaults.adapter = async (config) => {
      let data: unknown = pageFixture([]);
      if (config.url === "/vaults/me") data = vaultFixture;
      else if (config.url?.endsWith("/audit-logs")) data = auditPage;
      else if (config.url?.endsWith("/beneficiaries")) data = pageFixture([person]);
      return { data, config, status: 200, statusText: "OK", headers: new AxiosHeaders() };
    };
    setup("/dashboard/audit-log");
    const added = (await screen.findByRole("cell", { name: "Gán người nhận cho nhóm" })).closest(
      "tr",
    ) as HTMLElement;
    await waitFor(() => expect(added).toHaveTextContent("Người nhận Trịnh Lê Thiên Quan"));
    const removed = screen
      .getByRole("cell", { name: "Gỡ người nhận khỏi nhóm" })
      .closest("tr") as HTMLElement;
    expect(removed).toHaveTextContent("Người nhận #abcdef");
    const vaultRow = screen
      .getByRole("cell", { name: "Sửa thông tin kho" })
      .closest("tr") as HTMLElement;
    await waitFor(() => expect(vaultRow).toHaveTextContent("Kho thử nghiệm"));
  });

  it("calls GET /vaults/{vaultId}/audit-logs with sortBy=at and isAscending=false", async () => {
    const calls = installAdapter();
    setup("/dashboard/audit-log");
    await waitFor(() =>
      expect(calls.some((c) => c.url === `/vaults/${VAULT_ID}/audit-logs`)).toBe(true),
    );
    const auditCall = calls.find((c) => c.url === `/vaults/${VAULT_ID}/audit-logs`);
    expect(auditCall?.params?.sortBy).toBe("at");
    expect(auditCall?.params?.isAscending).toBe(false);
    expect(auditCall?.params?.pageSize).toBe(20);
    expect(auditCall?.params?.pageIndex).toBe(1);
    expect(auditCall?.params).not.toHaveProperty("searchTerm");
  });

  it("converts local YYYY-MM-DD to ISO with offset and to = next day (inclusive UX, exclusive API)", async () => {
    const calls = installAdapter();
    setup("/dashboard/audit-log?from=2026-10-15&to=2026-10-20");
    await waitFor(() =>
      expect(calls.some((c) => c.url === `/vaults/${VAULT_ID}/audit-logs`)).toBe(true),
    );
    const auditCall = calls.find((c) => c.url === `/vaults/${VAULT_ID}/audit-logs`);
    expect(typeof auditCall?.params?.from).toBe("string");
    expect(typeof auditCall?.params?.to).toBe("string");
    const fromMs = new Date(auditCall!.params!.from as string).getTime();
    const toMs = new Date(auditCall!.params!.to as string).getTime();
    // Chọn 15 → 20: khoảng hợp lệ inclusive UX, exclusive API là 6 ngày.
    expect(toMs - fromMs).toBe(6 * 24 * 60 * 60 * 1000);
    // to theo giờ địa phương phải là 21/10 00:00, không phải 20/10 00:00. Đây là mốc
    // calendar (year, month-1, day+1), không phải cộng 24h để tránh DST.
    const toDate = new Date(auditCall!.params!.to as string);
    expect(toDate.getFullYear()).toBe(2026);
    expect(toDate.getMonth()).toBe(9);
    expect(toDate.getDate()).toBe(21);
    expect(toDate.getHours()).toBe(0);
  });

  it("labels the end-date picker as inclusive 'đến hết ngày'", async () => {
    installAdapter();
    setup("/dashboard/audit-log");
    // Nhãn phải phản ánh hành vi inclusive; helper thực sự gửi [from, to+1 ngày) cho Backend.
    expect(await screen.findByLabelText("Đến hết ngày")).toBeInTheDocument();
  });
});

describe("OwnerAuditLog URL state", () => {
  it("resets page to 1 when changing action filter", async () => {
    installAdapter();
    setup("/dashboard/audit-log?page=3");
    const actionSelect = await screen.findByLabelText("Loại thao tác");
    fireEvent.change(actionSelect, { target: { value: "CONTAINER_CREATED" } });
    await waitFor(() => expect(locationRef.current).toContain("action=CONTAINER_CREATED"));
    expect(locationRef.current).toMatch(/[?&]page=1(?:&|$)/);
  });

  it("preserves the page when only navigating between pages", async () => {
    const multiPage = {
      ...pageFixture([entry]),
      totalCount: 60,
      totalPages: 3,
      pageIndex: 2,
      hasPreviousPage: true,
      hasNextPage: true,
    };
    installAdapter({ page: multiPage });
    setup("/dashboard/audit-log?page=2");
    const nextButton = await screen.findByRole("button", { name: "Trang sau" });
    fireEvent.click(nextButton);
    await waitFor(() => expect(locationRef.current).toContain("page=3"));
  });

  it("ignores invalid URL filter values and falls back to defaults", async () => {
    const calls = installAdapter();
    setup("/dashboard/audit-log?page=abc&size=999&action=BOGUS");
    await waitFor(() =>
      expect(calls.some((c) => c.url === `/vaults/${VAULT_ID}/audit-logs`)).toBe(true),
    );
    const auditCall = calls.find((c) => c.url === `/vaults/${VAULT_ID}/audit-logs`);
    expect(auditCall?.params?.pageIndex).toBe(1);
    expect(auditCall?.params?.pageSize).toBe(20);
    expect(auditCall?.params?.action).toBeUndefined();
    expect(auditCall?.params?.from).toBeUndefined();
    expect(auditCall?.params?.to).toBeUndefined();
  });

  it.each(["from=2026-02-31&to=2026-13-01", "from=not-a-date"])(
    "blocks invalid URL dates until corrected: %s",
    async (query) => {
      const calls = installAdapter();
      setup(`/dashboard/audit-log?${query}`);
      expect(await screen.findByRole("alert")).toHaveTextContent("Ngày lọc không hợp lệ");
      expect(calls.filter((c) => c.url?.endsWith("/audit-logs"))).toHaveLength(0);
      fireEvent.click(screen.getByRole("button", { name: "Đặt lại" }));
      await screen.findByRole("cell", { name: "Tạo nhóm" });
      expect(locationRef.current).not.toContain("from=");
      expect(locationRef.current).not.toContain("to=");
    },
  );

  it("preserves a reversed URL range and lets the user correct it before requesting", async () => {
    const calls = installAdapter();
    setup("/dashboard/audit-log?from=2026-10-20&to=2026-10-10");
    expect(await screen.findByRole("alert")).toHaveTextContent("Ngày bắt đầu phải trước");
    expect(screen.getByLabelText("Đến hết ngày")).toHaveValue("2026-10-10");
    expect(screen.getByLabelText("Đến hết ngày")).toHaveAttribute("aria-invalid", "true");
    expect(calls.filter((c) => c.url?.endsWith("/audit-logs"))).toHaveLength(0);
    fireEvent.change(screen.getByLabelText("Đến hết ngày"), { target: { value: "2026-10-21" } });
    await waitFor(() =>
      expect(calls.some((c) => c.url === `/vaults/${VAULT_ID}/audit-logs`)).toBe(true),
    );
    const auditCall = calls.find((c) => c.url === `/vaults/${VAULT_ID}/audit-logs`);
    expect(auditCall?.params?.from).toBe(new Date("2026-10-20T00:00:00").toISOString());
    expect(auditCall?.params?.to).toBe(new Date("2026-10-22T00:00:00").toISOString());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});

describe("OwnerAuditLog UI states", () => {
  it("shows the empty state when the server returns no entries", async () => {
    installAdapter({ page: pageFixture([]) });
    setup("/dashboard/audit-log");
    expect(await screen.findByText("Chưa có dòng nhật ký nào khớp bộ lọc.")).toBeInTheDocument();
  });

  it("shows an error alert when the request fails", async () => {
    apiClient.defaults.adapter = async (config) => {
      if (config.url === "/vaults/me") {
        return {
          data: vaultFixture,
          config,
          status: 200,
          statusText: "OK",
          headers: new AxiosHeaders(),
        };
      }
      throw Object.assign(new Error("boom"), {
        isAxiosError: true,
        response: { status: 500, data: { code: "INTERNAL_ERROR" } },
        config,
      });
    };
    setup("/dashboard/audit-log");
    expect(await screen.findByRole("alert")).toHaveTextContent("Không tải được nhật ký");
  });

  it("shows the recovery banner when the URL page exceeds totalPages (real empty response)", async () => {
    // Backend trả items=[] khi page vượt; pageIndex vẫn giữ giá trị URL.
    const oversized = {
      items: [],
      totalCount: 1,
      pageSize: 20,
      totalPages: 1,
      pageIndex: 5,
      hasPreviousPage: true,
      hasNextPage: false,
    };
    installAdapter({ page: oversized });
    setup("/dashboard/audit-log?page=5");
    expect(await screen.findByText(/Trang hiện vượt quá phạm vi/)).toBeInTheDocument();
  });

  it("shows the recovery banner when totalPages=0 and URL page > 1", async () => {
    const empty = {
      items: [],
      totalCount: 0,
      pageSize: 20,
      totalPages: 0,
      pageIndex: 3,
      hasPreviousPage: false,
      hasNextPage: false,
    };
    installAdapter({ page: empty });
    setup("/dashboard/audit-log?page=3");
    expect(await screen.findByText(/Trang hiện vượt quá phạm vi/)).toBeInTheDocument();
  });

  it("clicking the recovery button updates the URL to page=1 and triggers a fresh page-1 request", async () => {
    const oversized = {
      items: [],
      totalCount: 1,
      pageSize: 20,
      totalPages: 1,
      pageIndex: 5,
      hasPreviousPage: true,
      hasNextPage: false,
    };
    const calls: { url?: string; params?: Record<string, unknown> }[] = [];
    apiClient.defaults.adapter = async (config) => {
      calls.push({ url: config.url, params: config.params });
      return {
        data:
          config.url === "/vaults/me"
            ? vaultFixture
            : config.params?.pageIndex === 1
              ? pageFixture([entry])
              : oversized,
        config,
        status: 200,
        statusText: "OK",
        headers: new AxiosHeaders(),
      };
    };
    setup("/dashboard/audit-log?page=5&action=CONTAINER_CREATED&from=2026-10-01");
    const recoveryButton = await screen.findByRole("button", { name: "Về trang 1" });
    fireEvent.click(recoveryButton);
    await waitFor(() => expect(locationRef.current).toMatch(/[?&]page=1(?:&|$)/));
    await waitFor(() => {
      const pageOneCalls = calls.filter(
        (c) => c.url === `/vaults/${VAULT_ID}/audit-logs` && c.params?.pageIndex === 1,
      );
      expect(pageOneCalls.length).toBeGreaterThanOrEqual(1);
    });
    expect(locationRef.current).toContain("action=CONTAINER_CREATED");
    expect(locationRef.current).toContain("from=2026-10-01");
    expect(await screen.findByRole("cell", { name: "Tạo nhóm" })).toBeInTheDocument();
    expect(screen.queryByText(/Trang hiện vượt quá phạm vi/)).not.toBeInTheDocument();
  });
});

describe("OwnerAuditLog cache", () => {
  it("refetches on remount with production-like staleTime so new audit rows appear after mutation", async () => {
    // Cấu hình giống production: staleTime 5 phút, refetchOnWindowFocus=false.
    // Bug gốc: hook thừa hưởng hai cờ này nên remount không refetch, dòng nhật ký mới (do
    // mutation Owner) bị ẩn. Hook hiện đặt staleTime: 0 để remount luôn lấy data mới.
    client = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 1000 * 60 * 5,
          gcTime: 1000 * 60 * 30,
          retry: 3,
          refetchOnWindowFocus: false,
        },
        mutations: { retry: 0 },
      },
    });
    let hasNewEntry = false;
    apiClient.defaults.adapter = async (config) => ({
      data: config.url === "/vaults/me" ? vaultFixture : pageFixture(hasNewEntry ? [entry] : []),
      config,
      status: 200,
      statusText: "OK",
      headers: new AxiosHeaders(),
    });
    const initial = setup("/dashboard/audit-log");
    await screen.findByText("Chưa có dòng nhật ký nào khớp bộ lọc.");
    initial.unmount();
    // Simulate the backend gaining a committed row while existing Owner success handlers
    // invalidate only their own data. The audit remount must render the new server result.
    hasNewEntry = true;
    await client.invalidateQueries({ queryKey: ["owner-vault"] });
    setup("/dashboard/audit-log");
    expect(await screen.findByRole("cell", { name: "Tạo nhóm" })).toBeInTheDocument();
    expect(screen.queryByText("Chưa có dòng nhật ký nào khớp bộ lọc.")).not.toBeInTheDocument();
  });
});
