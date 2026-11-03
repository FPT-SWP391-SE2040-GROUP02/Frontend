import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ExecutorOwnerSwitcher } from "../ExecutorOwnerSwitcher";
import * as useExecutorVaultsModule from "@/features/death-case/model/useExecutorVaults";
import type { ExecutorVault } from "@/features/death-case/model/deathCase.schema";

vi.mock("@/features/death-case/model/useExecutorVaults");

const safeVault: ExecutorVault = {
  vaultId: "550e8400-e29b-41d4-a716-446655440001",
  ownerFullName: "Trần Văn A",
  planStatus: "ACTIVE",
  checkInOverdue: false,
  openDeathCaseId: null,
};

const overdueVault: ExecutorVault = {
  vaultId: "550e8400-e29b-41d4-a716-446655440002",
  ownerFullName: "Nguyễn Thị Mai",
  planStatus: "ACTIVE",
  checkInOverdue: true,
  openDeathCaseId: null,
};

function mockState(vaults: ExecutorVault[], selected: ExecutorVault | null) {
  const select = vi.fn();
  const clear = vi.fn();
  vi.spyOn(useExecutorVaultsModule, "useSelectedExecutorVault").mockReturnValue({
    query: {} as never,
    vaults,
    selected,
    select,
    clear,
    open: vi.fn(),
  });
  return { select, clear };
}

function renderSwitcher() {
  return render(
    <MemoryRouter initialEntries={["/executor/report"]}>
      <Routes>
        <Route path="/executor/report" element={<ExecutorOwnerSwitcher />} />
        <Route path="/executor" element={<p>Danh sách kho</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ExecutorOwnerSwitcher", () => {
  it("không hiển thị gì khi chưa có kho nào", () => {
    mockState([], null);
    const { container } = renderSwitcher();
    expect(container.firstChild).toBeNull();
  });

  it("một kho thì là nhãn tĩnh, không có nút đổi kho", () => {
    mockState([safeVault], safeVault);
    renderSwitcher();
    expect(screen.getByText("Đang làm việc với kho của")).toBeInTheDocument();
    expect(screen.getByText("Trần Văn A")).toBeInTheDocument();
    expect(screen.getByText("Kho an toàn")).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("nhiều kho: đưa kho quá hạn lên trước và gọi select khi chọn", () => {
    const { select } = mockState([safeVault, overdueVault], safeVault);
    renderSwitcher();
    fireEvent.click(screen.getByRole("button", { name: "Đổi kho đang làm việc" }));
    const menu = screen.getByRole("menu");
    expect(within(menu).getByText("2 kho bạn phụ trách")).toBeInTheDocument();
    const items = within(menu).getAllByRole("menuitem");
    expect(items[0]).toHaveTextContent("Nguyễn Thị Mai");
    expect(items[0]).toHaveTextContent("Quá hạn điểm danh");
    expect(items[1]).toHaveAttribute("aria-current", "true");

    fireEvent.click(items[0]);
    expect(select).toHaveBeenCalledWith(overdueVault.vaultId);
  });

  it("Xem tất cả kho bỏ lựa chọn và về danh sách kho", async () => {
    const { clear } = mockState([safeVault, overdueVault], safeVault);
    renderSwitcher();
    fireEvent.click(screen.getByRole("button", { name: "Đổi kho đang làm việc" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Xem tất cả kho" }));
    expect(clear).toHaveBeenCalled();
    expect(await screen.findByText("Danh sách kho")).toBeInTheDocument();
  });
});
