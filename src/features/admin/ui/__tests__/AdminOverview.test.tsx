import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/shared/api/axiosClient";
import { accessTokenMemory } from "@/shared/api/accessToken";
import { AdminOverview } from "../AdminOverview";

const dashboard = {
  openIncidents: 0,
  overdueIncidents: 0,
  unassignedIncidents: 0,
  activeHolds: 2,
  holdsPastReview: 1,
  activeVerifiers: 3,
  activeAdmins: 1,
  casesWithoutVerifier: 0,
  serverTime: "2026-11-11T14:23:00+00:00",
  planStages: [],
  closedPlans: 0,
  verifierLoad: [],
  recentActivity: [],
};

const revenue = {
  groupBy: "month",
  environment: "Live",
  totalAmount: 1590000,
  transactionCount: 4,
  currency: "VND",
  buckets: [],
};

const usersPage = {
  items: [],
  totalCount: 27,
  pageIndex: 1,
  pageSize: 1,
  totalPages: 27,
  hasPreviousPage: false,
  hasNextPage: true,
};

function Where() {
  const location = useLocation();
  return <p data-testid="where">{location.pathname + location.search}</p>;
}

function renderOverview() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="*" element={<AdminOverview />} />
        </Routes>
        <Where />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  accessTokenMemory.set("admin-overview-fixture");
});

afterEach(() => {
  cleanup();
  accessTokenMemory.clear();
  vi.restoreAllMocks();
});

function tile(label: string): HTMLElement {
  return screen.getByText(label).closest("button") as HTMLElement;
}

describe("AdminOverview: ô số", () => {
  beforeEach(() => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/admin/dashboard") return dashboard;
      if (url === "/admin/payment-transactions/revenue") return revenue;
      if (url === "/admin/users") return usersPage;
      return { services: [] };
    });
  });

  it("không còn ô Kho đang tạm giữ và không nhắc tới tạm giữ", async () => {
    renderOverview();
    await screen.findByText("Chờ người xét duyệt");
    expect(screen.queryByText("Kho đang tạm giữ")).not.toBeInTheDocument();
    expect(screen.queryByText(/tạm giữ|rà soát/i)).not.toBeInTheDocument();
  });

  it("hiện doanh thu tiền thật tháng này, tổng tài khoản và người xét duyệt đang hoạt động", async () => {
    renderOverview();
    await screen.findByText("Chờ người xét duyệt");
    expect(
      await within(tile("Doanh thu tháng này")).findByText("1.590.000 VND"),
    ).toBeInTheDocument();
    expect(tile("Doanh thu tháng này")).toHaveTextContent("4 giao dịch tiền thật");
    expect(await within(tile("Tổng tài khoản")).findByText("27")).toBeInTheDocument();
    expect(tile("Người xét duyệt đang hoạt động")).toHaveTextContent("3");
    expect(tile("Chờ người xét duyệt")).toHaveTextContent("0");
  });

  it("gọi doanh thu đúng tiền thật, chia theo tháng và đúng khoảng tháng này", async () => {
    const get = vi.mocked(apiClient.get);
    renderOverview();
    await screen.findByText("1.590.000 VND");
    const call = get.mock.calls.find(([url]) => url === "/admin/payment-transactions/revenue");
    const params = (call?.[1] as { params: Record<string, string> }).params;
    expect(params.environment).toBe("Live");
    expect(params.groupBy).toBe("month");
    expect(params.from).toMatch(/^\d{4}-\d{2}-01$/);
    expect(params.to).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(params.from.slice(0, 7)).toBe(params.to.slice(0, 7));
  });

  it("bấm ô doanh thu sang Giao dịch, ô tài khoản sang Người dùng", async () => {
    renderOverview();
    await screen.findByText("1.590.000 VND");
    fireEvent.click(tile("Doanh thu tháng này"));
    expect(screen.getByTestId("where")).toHaveTextContent("/admin?view=payments");
    fireEvent.click(tile("Tổng tài khoản"));
    expect(screen.getByTestId("where").textContent).toMatch(/users/);
  });
});

describe("AdminOverview: một ô lỗi không làm hỏng cả trang", () => {
  it("doanh thu và danh sách tài khoản lỗi thì hiện gạch ngang, các ô còn lại vẫn đúng", async () => {
    vi.spyOn(apiClient, "get").mockImplementation(async (url: string) => {
      if (url === "/admin/dashboard") return dashboard;
      if (url === "/admin/payment-transactions/revenue") throw new Error("down");
      if (url === "/admin/users") throw new Error("down");
      return { services: [] };
    });
    renderOverview();
    await screen.findByText("Chờ người xét duyệt");
    expect(await within(tile("Doanh thu tháng này")).findByText("—")).toBeInTheDocument();
    expect(await within(tile("Tổng tài khoản")).findByText("—")).toBeInTheDocument();
    expect(tile("Người xét duyệt đang hoạt động")).toHaveTextContent("3");
  });
});
